import { WORLD, POIS, ROAD_LINKS, FREEWAYS, MAP, TERRAIN_COLORS } from '../config.js';

// Always-on square minimap (top-left) + full-map overlay toggled with M.
// Both share a baked height-color raster so drawing stays cheap every frame.

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

    this._buildDom();
    this._layoutFullMap();
    window.addEventListener('resize', () => this._layoutFullMap());
  }

  _buildDom() {
    // --- Minimap ---
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

    // --- Full map overlay ---
    this.fullWrap = document.createElement('div');
    this.fullWrap.id = 'fullmap';
    this.fullWrap.style.display = 'none';
    this.fullWrap.innerHTML = `
      <div class="fullmap-panel">
        <div class="fullmap-header">
          <span class="fullmap-title">SAN DIEGO — TACTICAL MAP</span>
          <span class="fullmap-hint">M / Esc to close</span>
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

  // Sample terrain into a north-up square image. Top of image = -Z (north).
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

    for (let py = 0; py < res; py++) {
      const z = -half + (py + 0.5) / res * size;
      for (let px = 0; px < res; px++) {
        const x = -half + (px + 0.5) / res * size;
        const h = this.terrain.heightAt(x, z);
        const o = (py * res + px) * 4;
        let r, g, b;

        if (h < waterY + 0.15) {
          // Deeper = darker water
          const depth = Math.min(1, Math.max(0, (waterY - h) / 12));
          r = lerpByte(water[0], 10, depth);
          g = lerpByte(water[1], 40, depth);
          b = lerpByte(water[2], 55, depth);
        } else {
          const road = this.terrain.roadAt(x, z);
          if (road > 0.35) {
            r = 58; g = 59; b = 62;
          } else {
            const tSand = Math.min(1, Math.max(0, (h - waterY) / 4));
            const tGrass = Math.min(1, Math.max(0, (h - 4) / 28));
            const tDry = Math.min(1, Math.max(0, (h - 32) / 35));
            const tChap = Math.min(1, Math.max(0, (h - 42) / 40));
            const tRock = Math.min(1, Math.max(0, (h - 70) / 40));
            r = sand[0]; g = sand[1]; b = sand[2];
            r = lerpByte(r, grass[0], tSand * 0.9);
            g = lerpByte(g, grass[1], tSand * 0.9);
            b = lerpByte(b, grass[2], tSand * 0.9);
            r = lerpByte(r, dry[0], tGrass * 0.45 + tDry * 0.4);
            g = lerpByte(g, dry[1], tGrass * 0.45 + tDry * 0.4);
            b = lerpByte(b, dry[2], tGrass * 0.45 + tDry * 0.4);
            r = lerpByte(r, chap[0], tChap);
            g = lerpByte(g, chap[1], tChap);
            b = lerpByte(b, chap[2], tChap);
            r = lerpByte(r, rock[0], tRock);
            g = lerpByte(g, rock[1], tRock);
            b = lerpByte(b, rock[2], tRock);
            const n = this.terrain.detail.noise2D(x * 0.004, z * 0.004);
            const m = 1 + n * 0.08;
            r = Math.min(255, Math.max(0, (r * m) | 0));
            g = Math.min(255, Math.max(0, (g * m) | 0));
            b = Math.min(255, Math.max(0, (b * m) | 0));
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

  worldToFullPx(x, z, side) {
    const u = (x + this.half) / WORLD.SIZE;
    const v = (z + this.half) / WORLD.SIZE;
    return { px: u * side, py: v * side };
  }

  toggle() {
    this.open = !this.open;
    this.fullWrap.style.display = this.open ? 'flex' : 'none';
    // Minimap stays visible under the dim overlay; full map is the main view.
    return this.open;
  }

  setOpen(open) {
    this.open = open;
    this.fullWrap.style.display = open ? 'flex' : 'none';
  }

  nearestPoi(x, z) {
    let best = null;
    let bestD = Infinity;
    for (const p of POIS) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) return '';
    if (bestD < best.radius) return `IN ${best.name.toUpperCase()}`;
    return `${best.name} · ${bestD.toFixed(0)} m`;
  }

  /**
   * @param {{ x:number, y:number, z:number }} pos
   * @param {number} yaw  Three.js yaw (0 = -Z / north)
   */
  update(pos, yaw) {
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

    // Source rect in world metres → full raster UV
    const srcX = ((pos.x - halfR) + this.half) / WORLD.SIZE * this._raster.width;
    const srcY = ((pos.z - halfR) + this.half) / WORLD.SIZE * this._raster.height;
    const srcW = (range / WORLD.SIZE) * this._raster.width;
    const srcH = (range / WORLD.SIZE) * this._raster.height;

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this._raster, srcX, srcY, srcW, srcH, 0, 0, side, side);

    // Roads / POIs in local window
    ctx.save();
    // Work in CSS-ish logical pixels via dpr scale
    const S = side; // already device pixels
    const toPx = (x, z) => ({
      px: ((x - (pos.x - halfR)) / range) * S,
      py: ((z - (pos.z - halfR)) / range) * S,
    });

    this._strokeRoads(ctx, toPx, 2.2 * dpr);
    this._drawPois(ctx, toPx, 3.5 * dpr, false);
    this._drawPlayer(ctx, S / 2, S / 2, yaw, 7 * dpr);
    ctx.restore();
  }

  _drawFullMap(pos, yaw) {
    const ctx = this.fullCtx;
    const side = this.fullCanvas.width;
    const dpr = this.fullDpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, side, side);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this._raster, 0, 0, side, side);

    const toPx = (x, z) => this.worldToFullPx(x, z, side);

    this._strokeRoads(ctx, toPx, 2.5 * dpr);
    this._drawPois(ctx, toPx, 5 * dpr, true);
    const p = toPx(pos.x, pos.z);
    this._drawPlayer(ctx, p.px, p.py, yaw, 9 * dpr);

    // Edge frame
    ctx.strokeStyle = MAP.BORDER;
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(1, 1, side - 2, side - 2);

    this.fullCoords.textContent =
      `${pos.x.toFixed(0)}, ${pos.z.toFixed(0)}  ·  facing ${this._headingLabel(yaw)}`;
    this.fullNearest.textContent = this.nearestPoi(pos.x, pos.z);
  }

  _headingLabel(yaw) {
    // 0 = north (-Z). Convert to 0–360 compass degrees (0 = N, 90 = E).
    let deg = ((-yaw) * 180 / Math.PI) % 360;
    if (deg < 0) deg += 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const i = Math.round(deg / 45) % 8;
    return `${dirs[i]} ${deg.toFixed(0)}°`;
  }

  _strokeRoads(ctx, toPx, width) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Freeways first (wider, slightly brighter — matches satellite yellow arteries)
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

    // POI arterials
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

  _drawPois(ctx, toPx, radius, withLabels) {
    for (const p of POIS) {
      const { px, py } = toPx(p.x, p.z);
      // Soft radius ring for full map
      if (withLabels) {
        const r = (p.radius / WORLD.SIZE) * this.fullCanvas.width;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240, 193, 74, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(240, 193, 74, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = MAP.POI;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = Math.max(1, radius * 0.25);
      ctx.stroke();

      if (withLabels) {
        ctx.font = `600 ${Math.max(11, 12 * this.fullDpr)}px ui-monospace, Menlo, Consolas, monospace`;
        ctx.fillStyle = MAP.POI_TEXT;
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.lineWidth = 3 * this.fullDpr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const label = p.name.toUpperCase();
        ctx.strokeText(label, px, py - radius - 4 * this.fullDpr);
        ctx.fillText(label, px, py - radius - 4 * this.fullDpr);
      }
    }
  }

  _drawPlayer(ctx, px, py, yaw, size) {
    // Pulse ring
    ctx.beginPath();
    ctx.arc(px, py, size * 1.65, 0, Math.PI * 2);
    ctx.fillStyle = MAP.PLAYER_RING;
    ctx.fill();

    // Arrow points in look direction. Yaw 0 = north (-Z) = up on the map.
    // Viewed from above, Three +yaw is CCW; canvas +rotate is CW → use -yaw.
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-yaw);
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.35); // tip (forward)
    ctx.lineTo(size * 0.85, size * 0.95);
    ctx.lineTo(0, size * 0.35);
    ctx.lineTo(-size * 0.85, size * 0.95);
    ctx.closePath();
    ctx.fillStyle = MAP.PLAYER;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = Math.max(1, size * 0.15);
    ctx.stroke();
    ctx.restore();
  }
}
