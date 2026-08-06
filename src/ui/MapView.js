import { WORLD, POIS, ROAD_LINKS, FREEWAYS, MAP, TERRAIN_COLORS } from '../config.js';
import { nearestPoi, poiContains } from '../world/Poi.js';
import { worldBuildings } from '../world/BuildingRegistry.js';

// Always-on square minimap + full-map overlay (M).
// Full map: scroll-wheel zoom, drag to pan, buildings + refined road strokes.

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

    this._buildDom();
    this._layoutFullMap();
    this._bindMapInput();
    window.addEventListener('resize', () => this._layoutFullMap());
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
          <span class="fullmap-hint">Scroll zoom · Drag pan · M / Esc close</span>
        </div>
        <canvas class="map-canvas"></canvas>
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
    const canvas = this.fullCanvas;
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = 'grab';

    canvas.addEventListener('wheel', (e) => {
      if (!this.open) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // World under cursor before zoom
      const before = this._canvasToWorld(mx, my);
      const factor = e.deltaY > 0 ? (1 - (MAP.ZOOM_WHEEL || 0.12)) : (1 + (MAP.ZOOM_WHEEL || 0.12));
      this.zoom = Math.min(MAP.ZOOM_MAX || 12, Math.max(MAP.ZOOM_MIN || 1, this.zoom * factor));
      // Keep cursor world point stable
      const after = this._canvasToWorld(mx, my);
      this.panX += before.x - after.x;
      this.panZ += before.z - after.z;
      this._clampPan();
    }, { passive: false });

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.open) return;
      canvas.setPointerCapture(e.pointerId);
      this._drag = { x: e.clientX, y: e.clientY, panX: this.panX, panZ: this.panZ };
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this._drag || !this.open) return;
      const rect = canvas.getBoundingClientRect();
      const scale = this._viewWorldSize() / rect.width;
      const dx = (e.clientX - this._drag.x) * scale;
      const dy = (e.clientY - this._drag.y) * scale;
      // Drag map content with cursor (grab the world)
      this.panX = this._drag.panX - dx;
      this.panZ = this._drag.panZ - dy;
      this._clampPan();
    });
    const endDrag = () => {
      this._drag = null;
      canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
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
    this.open = !this.open;
    this.fullWrap.style.display = this.open ? 'flex' : 'none';
    this.fullWrap.style.pointerEvents = this.open ? 'auto' : 'none';
    if (this.open) {
      // Center on player when opening
      // pan is set from last update via _playerPos
      if (this._lastPos) {
        this.panX = this._lastPos.x;
        this.panZ = this._lastPos.z;
        this._clampPan();
      }
    }
    return this.open;
  }

  setOpen(open) {
    this.open = open;
    this.fullWrap.style.display = open ? 'flex' : 'none';
    this.fullWrap.style.pointerEvents = open ? 'auto' : 'none';
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
   */
  update(pos, yaw) {
    this._lastPos = pos;
    this._drawMinimap(pos, yaw);
    if (this.open) this._drawFullMap(pos, yaw);
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

    this._strokeRoads(ctx, toPx, 2.0 * dpr, false);
    this._drawBuildings(ctx, toPx, false);
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

    // Crop raster to pan/zoom window
    const srcX = (x0 + this.half) / WORLD.SIZE * this._raster.width;
    const srcY = (z0 + this.half) / WORLD.SIZE * this._raster.height;
    const srcW = (view / WORLD.SIZE) * this._raster.width;
    const srcH = (view / WORLD.SIZE) * this._raster.height;
    ctx.drawImage(this._raster, srcX, srcY, srcW, srcH, 0, 0, side, side);

    const toPx = (x, z) => this.worldToViewPx(x, z, side);

    // Roads thicker when zoomed
    const roadW = Math.max(1.2, 2.2 * dpr * Math.sqrt(this.zoom));
    this._strokeRoads(ctx, toPx, roadW, true);
    this._drawBuildings(ctx, toPx, true);
    this._drawPois(ctx, toPx, Math.max(3, 4.5 * dpr * Math.min(2, Math.sqrt(this.zoom))), true);

    const p = toPx(pos.x, pos.z);
    this._drawPlayer(ctx, p.px, p.py, yaw, 8 * dpr * Math.min(1.6, Math.sqrt(this.zoom)));

    ctx.strokeStyle = MAP.BORDER;
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(1, 1, side - 2, side - 2);

    this.fullCoords.textContent =
      `${pos.x.toFixed(0)}, ${pos.z.toFixed(0)}  ·  ${this._headingLabel(yaw)}  ·  ×${this.zoom.toFixed(1)}`;
    this.fullNearest.textContent = this.nearestPoi(pos.x, pos.z);
  }

  _drawBuildings(ctx, toPx, detailed) {
    const list = worldBuildings;
    if (!list?.length) return;
    // At full world zoom, only show larger footprints
    const minFoot = this.zoom < 2 ? 400 : this.zoom < 4 ? 120 : 40;
    ctx.fillStyle = detailed
      ? 'rgba(90, 100, 115, 0.72)'
      : 'rgba(70, 78, 90, 0.55)';
    ctx.strokeStyle = detailed
      ? 'rgba(180, 200, 220, 0.35)'
      : 'rgba(140, 160, 180, 0.2)';
    ctx.lineWidth = Math.max(0.5, 0.8 * (this.fullDpr || 1));

    for (const b of list) {
      if (b.w * b.d < minFoot) continue;
      const a = toPx(b.x, b.z);
      const c = toPx(b.x + b.w, b.z + b.d);
      const x = Math.min(a.px, c.px);
      const y = Math.min(a.py, c.py);
      const w = Math.abs(c.px - a.px);
      const h = Math.abs(c.py - a.py);
      if (w < 0.5 || h < 0.5) continue;
      // Height tint — taller = lighter
      if (detailed && b.floors > 1) {
        const t = Math.min(1, (b.floors - 1) / 18);
        const g = (90 + t * 50) | 0;
        const bl = (115 + t * 40) | 0;
        ctx.fillStyle = `rgba(${70 + t * 40 | 0}, ${g}, ${bl}, 0.75)`;
      }
      ctx.fillRect(x, y, w, h);
      if (detailed && w > 3) ctx.strokeRect(x, y, w, h);
    }
  }

  _headingLabel(yaw) {
    let deg = ((-yaw) * 180 / Math.PI) % 360;
    if (deg < 0) deg += 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const i = Math.round(deg / 45) % 8;
    return `${dirs[i]} ${deg.toFixed(0)}°`;
  }

  _strokeRoads(ctx, toPx, width, detailed) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Prefer real heightfield polylines when present (continuous freeways + grid)
    const lines = this.terrain.roadLines;
    if (lines?.length) {
      for (const line of lines) {
        const pts = line.pts || line;
        if (!pts || pts.length < 2) continue;
        const w = line.width || ROADS_WIDTH_FALLBACK(line);
        const isFreeway = w >= 13;
        // Base asphalt
        ctx.strokeStyle = isFreeway
          ? 'rgba(55, 56, 60, 0.95)'
          : 'rgba(48, 49, 53, 0.88)';
        ctx.lineWidth = width * (isFreeway ? 1.55 : 0.85) * (w / 12);
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = Array.isArray(pts[i]) ? pts[i] : [pts[i].x, pts[i].z ?? pts[i].y];
          const pt = toPx(p[0], p[1]);
          if (i === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();

        // Freeway centerline dashes when zoomed in
        if (detailed && isFreeway && this.zoom >= 2.2) {
          ctx.strokeStyle = 'rgba(210, 190, 90, 0.55)';
          ctx.lineWidth = Math.max(0.8, width * 0.22);
          ctx.setLineDash([6 * (this.fullDpr || 1), 8 * (this.fullDpr || 1)]);
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const p = Array.isArray(pts[i]) ? pts[i] : [pts[i].x, pts[i].z ?? pts[i].y];
            const pt = toPx(p[0], p[1]);
            if (i === 0) ctx.moveTo(pt.px, pt.py);
            else ctx.lineTo(pt.px, pt.py);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      return;
    }

    // Fallback: config freeways + POI links
    ctx.strokeStyle = 'rgba(70, 72, 76, 0.95)';
    for (const fw of FREEWAYS) {
      ctx.lineWidth = width * (fw.width ? fw.width / 10 : 1.4);
      ctx.beginPath();
      for (let i = 0; i < fw.pts.length; i++) {
        const [x, z] = fw.pts[i];
        const p = toPx(x, z);
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(58, 59, 62, 0.9)';
    ctx.lineWidth = width;
    for (const [a, b] of ROAD_LINKS) {
      const pa = this._poiById[a];
      const pb = this._poiById[b];
      if (!pa || !pb) continue;
      const A = toPx(pa.x, pa.z);
      const B = toPx(pb.x, pb.z);
      ctx.beginPath();
      ctx.moveTo(A.px, A.py);
      ctx.lineTo(B.px, B.py);
      ctx.stroke();
    }
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

      if (withLabels && this.zoom >= 1.4) {
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

function ROADS_WIDTH_FALLBACK(line) {
  if (typeof line === 'object' && line.width) return line.width;
  return 12;
}
