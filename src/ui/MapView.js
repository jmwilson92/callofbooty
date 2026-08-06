import { WORLD, POIS, MAP, TERRAIN_COLORS } from '../config.js';
import { nearestPoi, poiContains } from '../world/Poi.js';
import { worldBuildings } from '../world/BuildingRegistry.js';

// Always-on square minimap + full-map overlay (M).
// Full map: wheel / +/- zoom, drag pan, building footprints over terrain raster.

function hexToRgb(hex) {
  const h = hex & 0xffffff;
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}

function lerpByte(a, b, t) {
  return (a + (b - a) * t) | 0;
}

export class MapView {
  /**
   * @param {import('../world/Terrain.js').Terrain} terrain
   */
  constructor(terrain) {
    this.terrain = terrain;
    this.half = WORLD.SIZE / 2;
    this.open = false;

    this._raster = this._bakeRaster(MAP.RASTER);
    this._poiById = Object.fromEntries(POIS.map((p) => [p.id, p]));

    // Full-map camera (world metres)
    this.zoom = MAP.ZOOM_DEFAULT ?? 1;
    this.panX = 0; // world center when zoomed
    this.panZ = 0;
    this._drag = null;

    // Gunner targeting: click map to assign missile target
    this.gunnerMode = false;
    this._mapTargets = [];
    this._selectedTarget = null;
    this.onTargetSelect = null; // (target) => void

    this._buildDom();
    this._layoutFullMap();
    this._bindMapInput();
    window.addEventListener('resize', () => this._layoutFullMap());
  }

  setGunnerMode(on, targets = []) {
    this.gunnerMode = !!on;
    this._mapTargets = targets || [];
    if (this.fullWrap) {
      this.fullWrap.classList.toggle('gunner-mode', this.gunnerMode);
      const hint = this.fullWrap.querySelector('.fullmap-hint');
      if (hint) {
        hint.textContent = this.gunnerMode
          ? 'GUNNER · Click bot/heli/ground to lock missile target · LMB fires'
          : 'Scroll / +− zoom · Drag pan · M / Esc close';
      }
    }
  }

  _buildDom() {
    this.miniWrap = document.createElement('div');
    this.miniWrap.id = 'minimap';
    this.miniWrap.innerHTML = `
      <canvas class="map-canvas"></canvas>
      <div class="map-label">SAN DIEGO</div>
    `;
    document.body.appendChild(this.miniWrap);
    this.miniCanvas = this.miniWrap.querySelector('canvas');
    this.miniCtx = this.miniCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = MAP.MINIMAP_SIZE;
    this.miniCanvas.width = Math.round(s * dpr);
    this.miniCanvas.height = Math.round(s * dpr);
    this.miniCanvas.style.width = `${s}px`;
    this.miniCanvas.style.height = `${s}px`;
    this.miniDpr = dpr;

    this.fullWrap = document.createElement('div');
    this.fullWrap.id = 'fullmap';
    this.fullWrap.style.display = 'none';
    this.fullWrap.innerHTML = `
      <div class="fullmap-panel">
        <div class="fullmap-header">
          <span class="fullmap-title">SAN DIEGO — TACTICAL MAP</span>
          <span class="fullmap-hint">Scroll / +− zoom · Drag pan · M / Esc close</span>
        </div>
        <div class="fullmap-stage">
          <canvas class="map-canvas"></canvas>
          <div class="fullmap-zoom">
            <button type="button" class="fullmap-zoom-btn" data-zoom-in title="Zoom in">+</button>
            <button type="button" class="fullmap-zoom-btn" data-zoom-out title="Zoom out">−</button>
          </div>
        </div>
        <div class="fullmap-footer">
          <span class="fullmap-coords"></span>
          <span class="fullmap-nearest"></span>
        </div>
      </div>
    `;
    document.body.appendChild(this.fullWrap);
    this.fullCanvas = this.fullWrap.querySelector('canvas');
    this.fullCtx = this.fullCanvas.getContext('2d');
    this.fullCoords = this.fullWrap.querySelector('.fullmap-coords');
    this.fullNearest = this.fullWrap.querySelector('.fullmap-nearest');
    this.fullDpr = dpr;
  }

  _bindMapInput() {
    const wrap = this.fullWrap;
    const canvas = this.fullCanvas;
    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';

    // Window-level wheel while map is open (pointer-lock / game canvas can eat events)
    const onWheel = (e) => {
      if (!this.open) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = canvas.getBoundingClientRect();
      let mx = e.clientX - rect.left;
      let my = e.clientY - rect.top;
      if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) {
        mx = rect.width * 0.5;
        my = rect.height * 0.5;
      }
      const before = this._canvasToWorld(mx, my);
      const factor = e.deltaY > 0
        ? (1 - (MAP.ZOOM_WHEEL || 0.15))
        : (1 + (MAP.ZOOM_WHEEL || 0.15));
      this.zoom = Math.min(MAP.ZOOM_MAX || 14, Math.max(MAP.ZOOM_MIN || 1, this.zoom * factor));
      const after = this._canvasToWorld(mx, my);
      this.panX += before.x - after.x;
      this.panZ += before.z - after.z;
      this._clampPan();
    };
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    wrap.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('wheel', onWheel, { passive: false });

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.open) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      this._drag = {
        x: e.clientX, y: e.clientY,
        panX: this.panX, panZ: this.panZ,
        moved: false,
      };
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this._drag || !this.open) return;
      const dist = Math.hypot(e.clientX - this._drag.x, e.clientY - this._drag.y);
      if (dist > 4) this._drag.moved = true;
      const rect = canvas.getBoundingClientRect();
      const scale = this._viewWorldSize() / Math.max(1, rect.width);
      const dx = (e.clientX - this._drag.x) * scale;
      const dy = (e.clientY - this._drag.y) * scale;
      this.panX = this._drag.panX - dx;
      this.panZ = this._drag.panZ - dy;
      this._clampPan();
    });
    const endDrag = (e) => {
      // Gunner click (not a drag) → pick missile target
      if (this.open && this.gunnerMode && this._drag && !this._drag.moved && e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const world = this._canvasToWorld(mx, my);
        this._pickGunnerTarget(world.x, world.z);
      }
      this._drag = null;
      canvas.style.cursor = this.gunnerMode ? 'crosshair' : 'grab';
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', () => { this._drag = null; canvas.style.cursor = 'grab'; });
    canvas.addEventListener('pointerleave', () => {
      if (this._drag?.moved) {
        this._drag = null;
        canvas.style.cursor = this.gunnerMode ? 'crosshair' : 'grab';
      }
    });

    // +/- buttons
    wrap.querySelector('[data-zoom-in]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._zoomBy(1 + (MAP.ZOOM_WHEEL || 0.15) * 2);
    });
    wrap.querySelector('[data-zoom-out]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._zoomBy(1 - (MAP.ZOOM_WHEEL || 0.15) * 2);
    });

    // Keyboard zoom while map open
    window.addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        this._zoomBy(1.2);
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        this._zoomBy(1 / 1.2);
      }
    });
  }

  _zoomBy(factor) {
    const rect = this.fullCanvas.getBoundingClientRect();
    const mx = rect.width * 0.5;
    const my = rect.height * 0.5;
    const before = this._canvasToWorld(mx, my);
    this.zoom = Math.min(MAP.ZOOM_MAX || 14, Math.max(MAP.ZOOM_MIN || 1, this.zoom * factor));
    const after = this._canvasToWorld(mx, my);
    this.panX += before.x - after.x;
    this.panZ += before.z - after.z;
    this._clampPan();
  }

  _viewWorldSize() {
    return WORLD.SIZE / Math.max(1, this.zoom);
  }

  _clampPan() {
    const halfView = this._viewWorldSize() / 2;
    const lim = this.half - halfView;
    if (lim <= 0) {
      this.panX = 0;
      this.panZ = 0;
      return;
    }
    this.panX = Math.max(-lim, Math.min(lim, this.panX));
    this.panZ = Math.max(-lim, Math.min(lim, this.panZ));
  }

  /** CSS-pixel coords on full canvas → world */
  _canvasToWorld(cssX, cssY) {
    const side = this.fullSide || 1;
    const view = this._viewWorldSize();
    const x0 = this.panX - view / 2;
    const z0 = this.panZ - view / 2;
    return {
      x: x0 + (cssX / side) * view,
      z: z0 + (cssY / side) * view,
    };
  }

  _layoutFullMap() {
    const dpr = this.fullDpr;
    const max = MAP.FULL_MAP_MAX;
    const side = Math.min(
      max,
      Math.floor(window.innerWidth * 0.72),
      Math.floor(window.innerHeight * 0.72)
    );
    this.fullSide = side;
    this.fullCanvas.width = Math.round(side * dpr);
    this.fullCanvas.height = Math.round(side * dpr);
    this.fullCanvas.style.width = `${side}px`;
    this.fullCanvas.style.height = `${side}px`;
  }

  _bakeRaster(res) {
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(res, res);
    const data = img.data;
    const half = this.half;
    const size = WORLD.SIZE;
    const waterY = WORLD.WATER_LEVEL;

    const sand = hexToRgb(TERRAIN_COLORS.SAND);
    const grass = hexToRgb(TERRAIN_COLORS.GRASS);
    const dry = hexToRgb(TERRAIN_COLORS.DRY_GRASS);
    const chap = hexToRgb(TERRAIN_COLORS.CHAPARRAL ?? 0x8a7348);
    const rock = hexToRgb(TERRAIN_COLORS.ROCK);
    const water = [26, 74, 92];
    const asphalt = [48, 49, 52];
    const asphaltEdge = [62, 63, 66];

    for (let py = 0; py < res; py++) {
      const z = -half + (py + 0.5) / res * size;
      for (let px = 0; px < res; px++) {
        const x = -half + (px + 0.5) / res * size;
        const h = this.terrain.heightAt(x, z);
        const o = (py * res + px) * 4;
        let r, g, b;

        if (h < waterY + 0.15) {
          const depth = Math.min(1, Math.max(0, (waterY - h) / 12));
          r = lerpByte(water[0], 10, depth);
          g = lerpByte(water[1], 40, depth);
          b = lerpByte(water[2], 55, depth);
        } else {
          const road = this.terrain.roadAt(x, z);
          if (road > 0.25) {
            // Soft edge on road mask for cleaner arterial read
            const t = Math.min(1, (road - 0.25) / 0.55);
            r = lerpByte(asphaltEdge[0], asphalt[0], t);
            g = lerpByte(asphaltEdge[1], asphalt[1], t);
            b = lerpByte(asphaltEdge[2], asphalt[2], t);
          } else {
            let band;
            if (h < 4) band = sand;
            else if (h < 28) band = grass;
            else if (h < 48) band = dry;
            else if (h < 95) band = chap;
            else band = rock;
            r = band[0]; g = band[1]; b = band[2];
            const slope = this.terrain.slopeDegAt(x, z);
            if (slope > 28) {
              const st = Math.min(1, (slope - 28) / 30);
              r = lerpByte(r, rock[0], st * 0.7);
              g = lerpByte(g, rock[1], st * 0.7);
              b = lerpByte(b, rock[2], st * 0.7);
            }
          }
        }
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  worldToViewPx(x, z, side) {
    const view = this._viewWorldSize();
    const x0 = this.panX - view / 2;
    const z0 = this.panZ - view / 2;
    return {
      px: ((x - x0) / view) * side,
      py: ((z - z0) / view) * side,
    };
  }

  toggle() {
    this.setOpen(!this.open);
    return this.open;
  }

  setOpen(open) {
    this.open = open;
    this.fullWrap.style.display = open ? 'flex' : 'none';
    this.fullWrap.style.pointerEvents = open ? 'auto' : 'none';
    this.fullWrap.classList.toggle('is-open', open);
    if (open) {
      // Pointer lock steals wheel/drag — release so the map can receive input.
      // Flag stops the lock-change handler from immediately closing the map.
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        this._suppressLockClose = true;
        document.exitPointerLock();
        // Clear on next tick after pointerlockchange fires
        setTimeout(() => { this._suppressLockClose = false; }, 0);
      }
      if (this._lastPos) {
        this.panX = this._lastPos.x;
        this.panZ = this._lastPos.z;
        this._clampPan();
      }
      // Start slightly zoomed so building footprints read immediately
      if (this.zoom < 1.5) this.zoom = 2.5;
      this._clampPan();
    } else {
      this._suppressLockClose = false;
    }
  }

  nearestPoi(x, z) {
    const { poi: best, dist } = nearestPoi(POIS, x, z);
    if (!best) return '';
    if (dist <= 0.5 || poiContains(best, x, z)) return `IN ${best.name.toUpperCase()}`;
    return `${best.name} · ${dist.toFixed(0)} m`;
  }

  /**
   * @param {{ x:number, y:number, z:number }} pos
   * @param {number} yaw
   * @param {Array<{type:string,x:number,z:number,yaw?:number}>|null} vehicles
   * @param {Array|null} gunnerTargets optional bots/helis for map lock icons
   */
  update(pos, yaw, vehicles = null, gunnerTargets = null) {
    this._lastPos = pos;
    this._vehicles = vehicles;
    if (gunnerTargets) this._mapTargets = gunnerTargets;
    this._drawMinimap(pos, yaw);
    if (this.open) this._drawFullMap(pos, yaw);
  }

  _pickGunnerTarget(wx, wz) {
    // Prefer nearest bot/heli within click radius (world metres)
    const pickR = 28 / Math.max(1, Math.sqrt(this.zoom));
    let best = null;
    let bestD = pickR;
    for (const t of this._mapTargets) {
      const d = Math.hypot(t.x - wx, t.z - wz);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    let target;
    if (best) {
      target = {
        kind: best.kind,
        id: best.id,
        x: best.x,
        y: best.y ?? 2,
        z: best.z,
        label: best.label,
        target: best.target,
      };
    } else {
      // Ground / rooftop aim — use building roof when click is on a footprint
      let y = this.terrain.heightAt(wx, wz) + 0.4;
      let kind = 'ground';
      let label = 'Ground';
      if (this._buildings?.length) {
        for (const b of this._buildings) {
          if (wx >= b.x && wx <= b.x + b.w && wz >= b.z && wz <= b.z + b.d) {
            y = (b.roofY ?? ((b.baseY ?? 0) + (b.floors || 1) * 3.5)) + 0.25;
            kind = 'roof';
            label = 'Rooftop';
            break;
          }
        }
      }
      target = { kind, x: wx, y, z: wz, label };
    }
    this._selectedTarget = target;
    if (typeof this.onTargetSelect === 'function') this.onTargetSelect(target);
  }

  /** Optional: pass world buildings so map clicks lock roofs. */
  setBuildings(list) {
    this._buildings = list || [];
  }

  _drawMinimap(pos, yaw) {
    const ctx = this.miniCtx;
    const dpr = this.miniDpr;
    const side = this.miniCanvas.width;
    const range = MAP.MINIMAP_RANGE;
    const halfR = range / 2;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, side, side);

    const srcX = ((pos.x - halfR) + this.half) / WORLD.SIZE * this._raster.width;
    const srcY = ((pos.z - halfR) + this.half) / WORLD.SIZE * this._raster.height;
    const srcW = (range / WORLD.SIZE) * this._raster.width;
    const srcH = (range / WORLD.SIZE) * this._raster.height;

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this._raster, srcX, srcY, srcW, srcH, 0, 0, side, side);

    const toPx = (x, z) => ({
      px: ((x - (pos.x - halfR)) / range) * side,
      py: ((z - (pos.z - halfR)) / range) * side,
    });

    this._drawBuildings(ctx, toPx, { minPx: 1.5, stroke: false, alpha: 0.55 });
    this._drawVehicles(ctx, toPx, 4.5 * dpr, false);
    this._drawPois(ctx, toPx, 3.2 * dpr, false);
    this._drawPlayer(ctx, side / 2, side / 2, yaw, 7 * dpr);
  }

  _drawFullMap(pos, yaw) {
    const ctx = this.fullCtx;
    const side = this.fullCanvas.width;
    const dpr = this.fullDpr;
    const view = this._viewWorldSize();
    const x0 = this.panX - view / 2;
    const z0 = this.panZ - view / 2;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, side, side);
    ctx.imageSmoothingEnabled = this.zoom < 4;

    const srcX = (x0 + this.half) / WORLD.SIZE * this._raster.width;
    const srcY = (z0 + this.half) / WORLD.SIZE * this._raster.height;
    const srcW = (view / WORLD.SIZE) * this._raster.width;
    const srcH = (view / WORLD.SIZE) * this._raster.height;
    ctx.drawImage(this._raster, srcX, srcY, srcW, srcH, 0, 0, side, side);

    const toPx = (x, z) => this.worldToViewPx(x, z, side);

    this._drawBuildings(ctx, toPx, {
      minPx: this.zoom < 2 ? 1.2 : 0.8,
      stroke: this.zoom >= 1.8,
      alpha: 0.82,
      detailed: true,
    });
    this._drawVehicles(ctx, toPx, Math.max(5, 6 * dpr * Math.min(1.8, Math.sqrt(this.zoom))), true);
    this._drawPois(ctx, toPx, Math.max(3, 4.5 * dpr * Math.min(2, Math.sqrt(this.zoom))), true);

    // Gunner target icons
    if (this.gunnerMode && this._mapTargets?.length) {
      for (const t of this._mapTargets) {
        const { px, py } = toPx(t.x, t.z);
        if (px < -10 || py < -10 || px > side + 10 || py > side + 10) continue;
        ctx.fillStyle = t.kind === 'heli' ? 'rgba(255,80,80,0.95)' : 'rgba(255,180,40,0.9)';
        ctx.beginPath();
        ctx.arc(px, py, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
      }
    }
    if (this._selectedTarget) {
      const { px, py } = toPx(this._selectedTarget.x, this._selectedTarget.z);
      ctx.strokeStyle = '#ff4040';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(px, py, 10 * dpr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 14 * dpr, py);
      ctx.lineTo(px + 14 * dpr, py);
      ctx.moveTo(px, py - 14 * dpr);
      ctx.lineTo(px, py + 14 * dpr);
      ctx.stroke();
    }

    // Rearm pads
    for (const pad of (this._rearmPads || [])) {
      const { px, py } = toPx(pad.x, pad.z);
      ctx.strokeStyle = 'rgba(200,180,40,0.85)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(6, (pad.r / this._viewWorldSize()) * side * 0.5), 0, Math.PI * 2);
      ctx.stroke();
      if (this.zoom >= 1.5) {
        ctx.fillStyle = 'rgba(230,200,80,0.9)';
        ctx.font = `${Math.round(10 * dpr)}px sans-serif`;
        ctx.fillText(pad.name || 'REARM', px + 6 * dpr, py - 4 * dpr);
      }
    }

    const p = toPx(pos.x, pos.z);
    this._drawPlayer(ctx, p.px, p.py, yaw, 8 * dpr * Math.min(1.6, Math.sqrt(this.zoom)));

    ctx.strokeStyle = MAP.BORDER;
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(1, 1, side - 2, side - 2);

    this.fullCoords.textContent =
      `${pos.x.toFixed(0)}, ${pos.z.toFixed(0)}  ·  ${this._headingLabel(yaw)}  ·  ×${this.zoom.toFixed(1)}`;
    let nearest = this.nearestPoi(pos.x, pos.z);
    if (this.gunnerMode && this._selectedTarget) {
      nearest = `LOCK: ${this._selectedTarget.kind} · ${this._selectedTarget.label || ''}`;
    }
    this.fullNearest.textContent = nearest;
  }

  setRearmPads(pads) {
    this._rearmPads = pads || [];
  }

  /**
   * Motorcycle = small diamond; helicopter = H pad mark.
   * @param {CanvasRenderingContext2D} ctx
   * @param {(x:number,z:number)=>{px:number,py:number}} toPx
   * @param {number} size
   * @param {boolean} withLabels
   */
  _drawVehicles(ctx, toPx, size, withLabels) {
    const list = this._vehicles;
    if (!list?.length) return;
    const dpr = this.fullDpr || this.miniDpr || 1;

    for (const v of list) {
      const { px, py } = toPx(v.x, v.z);
      // Cull far off-canvas
      if (px < -20 || py < -20 || px > 4000 || py > 4000) continue;

      if (v.type === 'helicopter') {
        // Helipad-style H
        ctx.fillStyle = 'rgba(40, 200, 120, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = Math.max(1, size * 0.12);
        ctx.beginPath();
        ctx.arc(px, py, size * 0.95, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0a120e';
        ctx.font = `700 ${Math.max(9, size * 1.05)}px ui-monospace, Menlo, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', px, py + 0.5);
        if (withLabels && this.zoom >= 2) {
          ctx.font = `600 ${Math.max(10, 10 * dpr)}px ui-monospace, Menlo, monospace`;
          ctx.fillStyle = '#7dffb0';
          ctx.strokeStyle = 'rgba(0,0,0,0.75)';
          ctx.lineWidth = 2.5 * dpr;
          ctx.textBaseline = 'bottom';
          ctx.strokeText('HELO', px, py - size * 1.3);
          ctx.fillText('HELO', px, py - size * 1.3);
        }
      } else {
        // Motorcycle diamond
        const s = size * 0.75;
        ctx.fillStyle = 'rgba(255, 170, 60, 0.92)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = Math.max(1, size * 0.1);
        ctx.beginPath();
        ctx.moveTo(px, py - s);
        ctx.lineTo(px + s * 0.75, py);
        ctx.lineTo(px, py + s);
        ctx.lineTo(px - s * 0.75, py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (withLabels && this.zoom >= 3.5) {
          ctx.font = `600 ${Math.max(9, 9 * dpr)}px ui-monospace, Menlo, monospace`;
          ctx.fillStyle = '#ffc070';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)';
          ctx.lineWidth = 2 * dpr;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.strokeText('MOTO', px, py - s * 1.4);
          ctx.fillText('MOTO', px, py - s * 1.4);
        }
      }
    }
  }

  /**
   * Draw all registered building footprints.
   * @param {{ minPx?:number, stroke?:boolean, alpha?:number, detailed?:boolean }} opts
   */
  _drawBuildings(ctx, toPx, opts = {}) {
    const list = worldBuildings;
    if (!list?.length) return;
    const minPx = opts.minPx ?? 1;
    const stroke = !!opts.stroke;
    const alpha = opts.alpha ?? 0.75;
    const detailed = !!opts.detailed;
    const dpr = this.fullDpr || this.miniDpr || 1;

    ctx.lineWidth = Math.max(0.6, 0.9 * dpr);
    ctx.strokeStyle = 'rgba(200, 220, 240, 0.45)';

    for (const b of list) {
      if (!(b.w > 0) || !(b.d > 0)) continue;
      const a = toPx(b.x, b.z);
      const c = toPx(b.x + b.w, b.z + b.d);
      const x = Math.min(a.px, c.px);
      const y = Math.min(a.py, c.py);
      let w = Math.abs(c.px - a.px);
      let h = Math.abs(c.py - a.py);
      // Tiny on-screen boxes still get a 1px tick so density reads at world zoom
      if (w < minPx && h < minPx) {
        w = Math.max(w, minPx);
        h = Math.max(h, minPx);
      }
      if (w < 0.4 || h < 0.4) continue;

      if (detailed && b.floors > 1) {
        const t = Math.min(1, (b.floors - 1) / 16);
        const r = (55 + t * 55) | 0;
        const g = (70 + t * 70) | 0;
        const bl = (95 + t * 80) | 0;
        ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(72, 82, 98, ${alpha})`;
      }
      ctx.fillRect(x, y, w, h);
      if (stroke && w > 2.5) ctx.strokeRect(x, y, w, h);
    }
  }

  _headingLabel(yaw) {
    let deg = ((-yaw) * 180 / Math.PI) % 360;
    if (deg < 0) deg += 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const i = Math.round(deg / 45) % 8;
    return `${dirs[i]} ${deg.toFixed(0)}°`;
  }

  _drawPois(ctx, toPx, markerR, withLabels) {
    for (const p of POIS) {
      const { px, py } = toPx(p.x, p.z);
      ctx.beginPath();
      ctx.arc(px, py, markerR * (withLabels ? 1.1 : 0.9), 0, Math.PI * 2);
      ctx.fillStyle = MAP.POI;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = Math.max(1, markerR * 0.22);
      ctx.stroke();

      if (withLabels) {
        ctx.font = `600 ${Math.max(11, 11 * (this.fullDpr || 1) * Math.min(1.4, Math.sqrt(this.zoom)))}px ui-monospace, Menlo, Consolas, monospace`;
        ctx.fillStyle = MAP.POI_TEXT;
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.lineWidth = 3 * (this.fullDpr || 1);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const label = p.name.toUpperCase();
        ctx.strokeText(label, px, py - markerR * 1.6 - 4 * (this.fullDpr || 1));
        ctx.fillText(label, px, py - markerR * 1.6 - 4 * (this.fullDpr || 1));
      }
    }
  }

  _drawPlayer(ctx, px, py, yaw, r) {
    ctx.save();
    ctx.translate(px, py);
    // Map is north-up (+Y down in canvas = +Z world). Player yaw 0 faces -Z (north = up).
    ctx.rotate(yaw);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.4);
    ctx.lineTo(r * 0.9, r * 1.1);
    ctx.lineTo(0, r * 0.45);
    ctx.lineTo(-r * 0.9, r * 1.1);
    ctx.closePath();
    ctx.fillStyle = MAP.PLAYER;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = Math.max(1, r * 0.18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.strokeStyle = MAP.PLAYER_RING;
    ctx.lineWidth = Math.max(1, r * 0.25);
    ctx.stroke();
    ctx.restore();
  }
}
