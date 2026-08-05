import * as THREE from 'three';
import {
  WORLD, TERRAIN_COLORS, POIS, ROADS, ROAD_LINKS, FREEWAYS,
} from '../config.js';
import { Simplex, smoothstep, clamp, lerp } from '../core/Noise.js';

// San Diego heightfield shaped from satellite_view.png + terrain_map.png.
// Same array backs render mesh and collision.
// Layout: Pacific west, Point Loma + Coronado, Mission Bay, SD Bay,
// Mission Valley trench, mesa/canyon city, eastern hills.

export class Terrain {
  constructor(seed = WORLD.SEED) {
    this.size = WORLD.SIZE;
    this.half = WORLD.SIZE / 2;
    this.cell = WORLD.CELL;
    this.n = Math.round(WORLD.SIZE / WORLD.CELL) + 1;
    this.simplex = new Simplex(seed);
    this.detail = new Simplex(seed + 91);
    this.ridge = new Simplex(seed + 203);

    this.heights = new Float32Array(this.n * this.n);
    this.roadMask = new Float32Array(this.n * this.n);

    this._generateBase();
    this._applyPoiPads();
    this.roads = this._buildRoadNetwork();
    this._applyRoads();
    this._reapplyWaterCuts();
  }

  idx(ix, iz) {
    return iz * this.n + ix;
  }

  gx(ix) {
    return -this.half + ix * this.cell;
  }

  // 0–1 ellipse falloff (1 at center).
  _ellipse(x, z, cx, cz, rx, rz) {
    return ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2;
  }

  // Ridged multifractal — mesa tops + canyon cuts (San Diego signature).
  _ridged(x, z, octaves, freq, lac, gain) {
    let sum = 0;
    let amp = 0.5;
    let f = freq;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      const n = 1 - Math.abs(this.ridge.noise2D(x * f, z * f));
      const r = n * n;
      sum += r * amp;
      norm += amp;
      amp *= gain;
      f *= lac;
    }
    return sum / Math.max(1e-6, norm);
  }

  _generateBase() {
    const {
      NOISE_OCTAVES, NOISE_BASE_FREQ, NOISE_LACUNARITY, NOISE_PERSISTENCE,
    } = WORLD;
    const hills = WORLD.EAST_HILLS;
    const mesa = WORLD.NORTH_MESA;
    const valley = WORLD.MISSION_VALLEY;

    for (let iz = 0; iz < this.n; iz++) {
      const z = this.gx(iz);
      for (let ix = 0; ix < this.n; ix++) {
        const x = this.gx(ix);

        // Soft rolling base
        let n = this.simplex.fbm(
          x, z, NOISE_OCTAVES, NOISE_BASE_FREQ, NOISE_LACUNARITY, NOISE_PERSISTENCE
        );
        n = n * 0.5 + 0.5;
        n = Math.pow(n, 1.12);

        // Eastward rise into foothills (terrain map: mountains stack east)
        const east = smoothstep(-350, 600, x);
        // Slight north mesa lift (Clairemont / UC / Miramar shelf)
        const northShelf = smoothstep(160, -420, z);

        let base = WORLD.BASE_LIFT + n * 18 + east * 32 + northShelf * 14;

        // Mesa / canyon field — flattish tops, steep cuts (city plateaus)
        const ridged = this._ridged(x, z, 4, 0.0024, 2.15, 0.55);
        const canyon = (ridged - 0.45) * 28;
        // Stronger canyons on the coastal plain / mid-city, weaker on high peaks
        const canyonW = (1 - east * 0.55) * (1 - smoothstep(70, 100, base) * 0.3);
        base += canyon * canyonW;

        // North mesa mass (Clairemont / Linda Vista)
        const md = Math.hypot(x - mesa.x, z - mesa.z);
        const mw = 1 - smoothstep(mesa.radius * 0.4, mesa.radius, md);
        if (mw > 0) {
          const top = mesa.peak + this.detail.noise2D(x * 0.004, z * 0.004) * 6;
          base = lerp(base, top, mw * mw * 0.85);
        }

        // Mission Valley trench (I-8) — E–W low corridor through the middle
        const vDist = Math.abs(z - valley.z);
        const vMask = 1 - smoothstep(valley.halfWidth * 0.55, valley.halfWidth, vDist);
        // Stronger trench near center corridor, fades at map edges
        const vAlong = 1 - smoothstep(620, 820, Math.abs(x));
        if (vMask > 0) {
          base -= valley.depth * vMask * vAlong;
        }

        // Eastern mountain mass (Mission Trails → El Cajon foothills)
        const hd = Math.hypot(x - hills.x, z - hills.z);
        const hw = 1 - smoothstep(hills.radius * 0.3, hills.radius, hd);
        if (hw > 0) {
          const ridge = this._ridged(x + 40, z - 20, 5, 0.002, 2.2, 0.5);
          const peak = hills.peak * (0.4 + ridge * 0.6);
          base = lerp(base, peak, hw * hw);
        }

        // La Jolla / Torrey headland boost
        const lj = 1 - smoothstep(0, 200, Math.hypot(x - (-520), z - (-420)));
        base += lj * 18;

        // Point Loma ridge (before water cuts; reinforced after bay restore)
        const pl = WORLD.POINT_LOMA;
        const plE = this._ellipse(x, z, pl.x, pl.z, pl.rx, pl.rz);
        const plW = 1 - smoothstep(0.55, 1.15, plE);
        if (plW > 0) {
          base = Math.max(base, pl.ridge * (0.7 + plW * 0.4) + n * 8);
        }

        // --- Water bodies ---
        let h = base;

        // Pacific: coast line bows around Point Loma tip
        const shoreNoise = this.detail.noise2D(z * 0.0035, 3.1) * 48;
        // Coast pushes west near Mission Beach, jogs for Point Loma
        let coast = WORLD.COAST_X + shoreNoise;
        // Point Loma peninsula: land extends further west/south
        if (z > 200 && z < 620) {
          const plTip = 1 - smoothstep(0.4, 1.2, this._ellipse(x, z, pl.x, pl.z, pl.rx * 1.15, pl.rz * 1.05));
          coast = lerp(coast, pl.x - pl.rx * 0.9, plTip * 0.85);
        }
        const oceanW = smoothstep(coast, coast - WORLD.COAST_BLEND, x);

        // Open ocean south of Point Loma tip / Imperial Beach approach
        const southOcean = smoothstep(560, 820, z) * smoothstep(-100, -500, x);

        // Mission Bay multi-lobe lagoon
        let missionBay = 0;
        for (const lobe of WORLD.MISSION_BAY_LOBES) {
          const e = this._ellipse(x, z, lobe.x, lobe.z, lobe.rx, lobe.rz);
          missionBay = Math.max(missionBay, 1 - smoothstep(0.72, 1.18, e));
        }

        // San Diego Bay main basin
        const sb = this._ellipse(x, z, WORLD.SD_BAY.x, WORLD.SD_BAY.z, WORLD.SD_BAY.rx, WORLD.SD_BAY.rz);
        let sdBay = 1 - smoothstep(0.68, 1.22, sb);

        // Sink water first
        h = lerp(h, -WORLD.MISSION_BAY_LOBES[0].depth, missionBay * 0.97);
        h = lerp(h, -WORLD.SD_BAY.depth, sdBay * 0.95);
        h = lerp(h, -WORLD.EDGE_DEPTH, Math.max(oceanW, southOcean * 0.9));

        // Restore Point Loma land through the bay cut
        if (plW > 0.05) {
          const landH = pl.ridge * (0.55 + plW * 0.5)
            + this.detail.noise2D(x * 0.006, z * 0.006) * 5;
          h = lerp(h, Math.max(h, landH), Math.min(1, plW * 1.2));
        }

        // Restore Coronado island
        const cor = WORLD.CORONADO;
        const cE = this._ellipse(x, z, cor.x, cor.z, cor.rx, cor.rz);
        const cW = 1 - smoothstep(0.65, 1.15, cE);
        if (cW > 0.05) {
          const landH = cor.height + this.detail.noise2D(x * 0.01, z * 0.01) * 2;
          h = lerp(h, Math.max(landH, 4), Math.min(1, cW * 1.15));
        }

        // Soft square rim
        const r = Math.max(Math.abs(x), Math.abs(z)) / this.half;
        const f = 1 - smoothstep(WORLD.FALLOFF_START, WORLD.FALLOFF_END, r);
        h = h * f - (1 - f) * WORLD.EDGE_DEPTH;

        this.heights[this.idx(ix, iz)] = h;
      }
    }
  }

  _applyPoiPads() {
    for (const poi of POIS) {
      if (poi.flatten === null || poi.flatten === undefined) continue;
      const pad = poi.flatten;
      const inner = poi.radius;
      const outer = poi.radius + 55;

      const minX = Math.max(0, Math.floor((poi.x - outer + this.half) / this.cell));
      const maxX = Math.min(this.n - 1, Math.ceil((poi.x + outer + this.half) / this.cell));
      const minZ = Math.max(0, Math.floor((poi.z - outer + this.half) / this.cell));
      const maxZ = Math.min(this.n - 1, Math.ceil((poi.z + outer + this.half) / this.cell));

      for (let iz = minZ; iz <= maxZ; iz++) {
        const z = this.gx(iz);
        for (let ix = minX; ix <= maxX; ix++) {
          const x = this.gx(ix);
          const d = Math.hypot(x - poi.x, z - poi.z);
          if (d > outer) continue;
          const w = 1 - smoothstep(inner, outer, d);
          const i = this.idx(ix, iz);
          this.heights[i] = lerp(this.heights[i], pad, w);
        }
      }
    }
  }

  // Water wins over pads except protected dry POIs (and peninsula land).
  _reapplyWaterCuts() {
    const dryPads = POIS.filter((p) => p.flatten !== null && p.flatten !== undefined);
    const pl = WORLD.POINT_LOMA;
    const cor = WORLD.CORONADO;

    for (let iz = 0; iz < this.n; iz++) {
      const z = this.gx(iz);
      for (let ix = 0; ix < this.n; ix++) {
        const x = this.gx(ix);
        const i = this.idx(ix, iz);

        let padProtect = 0;
        for (const p of dryPads) {
          const d = Math.hypot(x - p.x, z - p.z);
          if (d < p.radius + 24) {
            padProtect = Math.max(padProtect, 1 - smoothstep(p.radius * 0.85, p.radius + 24, d));
          }
        }

        // Always protect peninsula / island cores from being re-sunk
        const plW = 1 - smoothstep(0.55, 1.1, this._ellipse(x, z, pl.x, pl.z, pl.rx, pl.rz));
        const cW = 1 - smoothstep(0.65, 1.1, this._ellipse(x, z, cor.x, cor.z, cor.rx, cor.rz));
        const landProtect = Math.max(plW, cW);
        if (padProtect > 0.85 || landProtect > 0.7) continue;

        let h = this.heights[i];
        const sinkW = (1 - Math.max(padProtect, landProtect * 0.9));

        const shoreNoise = this.detail.noise2D(z * 0.0035, 3.1) * 48;
        let coast = WORLD.COAST_X + shoreNoise;
        if (z > 200 && z < 620) {
          const plTip = 1 - smoothstep(0.4, 1.2, this._ellipse(x, z, pl.x, pl.z, pl.rx * 1.15, pl.rz * 1.05));
          coast = lerp(coast, pl.x - pl.rx * 0.9, plTip * 0.85);
        }
        const oceanW = smoothstep(coast, coast - WORLD.COAST_BLEND, x);
        const southOcean = smoothstep(560, 820, z) * smoothstep(-100, -500, x);

        let missionBay = 0;
        for (const lobe of WORLD.MISSION_BAY_LOBES) {
          const e = this._ellipse(x, z, lobe.x, lobe.z, lobe.rx, lobe.rz);
          missionBay = Math.max(missionBay, 1 - smoothstep(0.78, 1.2, e));
        }
        const sb = this._ellipse(x, z, WORLD.SD_BAY.x, WORLD.SD_BAY.z, WORLD.SD_BAY.rx, WORLD.SD_BAY.rz);
        const sdBay = 1 - smoothstep(0.78, 1.25, sb);

        if (missionBay > 0.05) {
          h = Math.min(h, lerp(h, -WORLD.MISSION_BAY_LOBES[0].depth, missionBay * 0.98 * sinkW));
        }
        if (sdBay > 0.05) {
          h = Math.min(h, lerp(h, -WORLD.SD_BAY.depth, sdBay * 0.95 * sinkW));
        }
        const waterMask = Math.max(oceanW, southOcean * 0.9);
        if (waterMask > 0.05) {
          h = Math.min(h, lerp(h, -WORLD.EDGE_DEPTH, waterMask * sinkW));
        }

        // Re-assert land masses after water
        if (plW > 0.08) {
          const landH = pl.ridge * (0.55 + plW * 0.5);
          h = Math.max(h, lerp(h, landH, plW));
        }
        if (cW > 0.08) {
          h = Math.max(h, lerp(h, cor.height, cW));
        }

        this.heights[i] = h;
      }
    }
  }

  _buildRoadNetwork() {
    const segs = [];
    const by = {};
    for (const p of POIS) by[p.id] = p;

    for (const [a, b] of ROAD_LINKS) {
      if (!by[a] || !by[b]) {
        console.warn(`[terrain] missing POI for road link ${a} → ${b}`);
        continue;
      }
      segs.push({
        a: new THREE.Vector2(by[a].x, by[a].z),
        b: new THREE.Vector2(by[b].x, by[b].z),
        width: ROADS.WIDTH,
        blend: ROADS.BLEND,
      });
    }

    // Freeway polylines (I-5, I-8, I-15, I-805, SR-52, SR-163)
    for (const fw of FREEWAYS) {
      const w = fw.width ?? ROADS.WIDTH;
      const blend = ROADS.FREEWAY_BLEND ?? ROADS.BLEND;
      for (let i = 0; i < fw.pts.length - 1; i++) {
        const [x0, z0] = fw.pts[i];
        const [x1, z1] = fw.pts[i + 1];
        segs.push({
          a: new THREE.Vector2(x0, z0),
          b: new THREE.Vector2(x1, z1),
          width: w,
          blend,
        });
      }
    }
    return segs;
  }

  _applyRoads() {
    for (const seg of this.roads) {
      const halfW = (seg.width ?? ROADS.WIDTH) / 2;
      const blend = seg.blend ?? ROADS.BLEND;
      const reach = halfW + blend;

      const dir = new THREE.Vector2().subVectors(seg.b, seg.a);
      const len = dir.length();
      if (len < 1e-3) continue;
      dir.divideScalar(len);

      const samples = Math.max(2, Math.ceil(len / this.cell));
      const raw = new Float32Array(samples + 1);
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        raw[s] = this.heightAt(lerp(seg.a.x, seg.b.x, t), lerp(seg.a.y, seg.b.y, t));
      }
      const prof = new Float32Array(samples + 1);
      const K = 6;
      for (let s = 0; s <= samples; s++) {
        let acc = 0; let cnt = 0;
        for (let k = -K; k <= K; k++) {
          const j = s + k;
          if (j < 0 || j > samples) continue;
          acc += raw[j];
          cnt++;
        }
        prof[s] = acc / cnt;
      }

      const minX = Math.max(0, Math.floor((Math.min(seg.a.x, seg.b.x) - reach + this.half) / this.cell));
      const maxX = Math.min(this.n - 1, Math.ceil((Math.max(seg.a.x, seg.b.x) + reach + this.half) / this.cell));
      const minZ = Math.max(0, Math.floor((Math.min(seg.a.y, seg.b.y) - reach + this.half) / this.cell));
      const maxZ = Math.min(this.n - 1, Math.ceil((Math.max(seg.a.y, seg.b.y) + reach + this.half) / this.cell));

      for (let iz = minZ; iz <= maxZ; iz++) {
        const z = this.gx(iz);
        for (let ix = minX; ix <= maxX; ix++) {
          const x = this.gx(ix);
          const px = x - seg.a.x; const pz = z - seg.a.y;
          let t = (px * dir.x + pz * dir.y) / len;
          t = clamp(t, 0, 1);
          const cx = lerp(seg.a.x, seg.b.x, t);
          const cz = lerp(seg.a.y, seg.b.y, t);
          const d = Math.hypot(x - cx, z - cz);
          if (d > reach) continue;

          const roadH = prof[Math.round(t * samples)];
          const w = 1 - smoothstep(halfW, reach, d);
          const i = this.idx(ix, iz);
          this.heights[i] = lerp(this.heights[i], roadH, w);
          if (d <= halfW) this.roadMask[i] = 1;
          else this.roadMask[i] = Math.max(this.roadMask[i], 1 - smoothstep(halfW, halfW + 2, d));
        }
      }
    }
  }

  heightAt(x, z) {
    const fx = (x + this.half) / this.cell;
    const fz = (z + this.half) / this.cell;
    let ix = Math.floor(fx);
    let iz = Math.floor(fz);
    if (ix < 0) ix = 0; else if (ix > this.n - 2) ix = this.n - 2;
    if (iz < 0) iz = 0; else if (iz > this.n - 2) iz = this.n - 2;
    const tx = clamp(fx - ix, 0, 1);
    const tz = clamp(fz - iz, 0, 1);

    const h00 = this.heights[this.idx(ix, iz)];
    const h10 = this.heights[this.idx(ix + 1, iz)];
    const h01 = this.heights[this.idx(ix, iz + 1)];
    const h11 = this.heights[this.idx(ix + 1, iz + 1)];

    if (tx + tz <= 1) return h00 + (h10 - h00) * tx + (h01 - h00) * tz;
    return h11 + (h01 - h11) * (1 - tx) + (h10 - h11) * (1 - tz);
  }

  normalAt(x, z, out = new THREE.Vector3()) {
    const e = this.cell * 0.5;
    const hL = this.heightAt(x - e, z);
    const hR = this.heightAt(x + e, z);
    const hD = this.heightAt(x, z - e);
    const hU = this.heightAt(x, z + e);
    return out.set(hL - hR, 2 * e, hD - hU).normalize();
  }

  slopeDegAt(x, z) {
    const n = this.normalAt(x, z, _tmpN);
    return Math.acos(clamp(n.y, -1, 1)) * 180 / Math.PI;
  }

  roadAt(x, z) {
    const fx = Math.round((x + this.half) / this.cell);
    const fz = Math.round((z + this.half) / this.cell);
    if (fx < 0 || fz < 0 || fx >= this.n || fz >= this.n) return 0;
    return this.roadMask[this.idx(fx, fz)];
  }

  _vertexColor(x, z, h, slopeDeg, out) {
    const C = TERRAIN_COLORS;

    out.setHex(C.SAND);
    out.lerp(_tmpC.setHex(C.GRASS), smoothstep(C.SAND_MAX - 1.5, C.SAND_MAX + 4, h));
    // Transition into dry grass / chaparral (brown inland hills on satellite)
    out.lerp(_tmpC.setHex(C.DRY_GRASS), smoothstep(C.GRASS_MAX - 10, C.GRASS_MAX + 6, h));
    out.lerp(_tmpC.setHex(C.CHAPARRAL), smoothstep(C.CHAPARRAL_MIN - 8, C.CHAPARRAL_MIN + 20, h));

    // Inland brown push (east + elevated)
    const inland = smoothstep(-50, 450, x) * smoothstep(8, 50, h);
    out.lerp(_tmpC.setHex(C.CHAPARRAL), inland * 0.35);

    out.lerp(_tmpC.setHex(C.ROCK),
      smoothstep(C.ROCK_MIN_SLOPE_DEG - 7, C.ROCK_MIN_SLOPE_DEG + 9, slopeDeg));
    out.lerp(_tmpC.setHex(C.ROCK_DARK),
      smoothstep(C.ROCK_DARK_SLOPE_DEG - 7, C.ROCK_DARK_SLOPE_DEG + 9, slopeDeg));

    // Dense urban plateau tint near downtown / mid-city flats
    const urban = (1 - smoothstep(12, 28, h))
      * smoothstep(-200, 80, x)
      * smoothstep(-50, 200, z)
      * (1 - smoothstep(380, 520, z));
    if (urban > 0.05 && slopeDeg < 18) {
      out.lerp(_tmpC.setHex(C.URBAN), urban * 0.4);
    }

    const road = this.roadAt(x, z);
    if (road > 0) out.lerp(_tmpC.setHex(C.ASPHALT), road);

    const m = 1 + this.detail.noise2D(x * 0.0045, z * 0.0045) * C.NOISE_VARIATION;
    out.setRGB(
      clamp(out.r * m, 0, 1),
      clamp(out.g * m, 0, 1),
      clamp(out.b * m, 0, 1)
    );
    return out;
  }

  buildMesh() {
    const n = this.n;
    const vCount = n * n;
    const positions = new Float32Array(vCount * 3);
    const colors = new Float32Array(vCount * 3);
    const normals = new Float32Array(vCount * 3);

    const c = new THREE.Color();
    const nrm = new THREE.Vector3();

    for (let iz = 0; iz < n; iz++) {
      const z = this.gx(iz);
      for (let ix = 0; ix < n; ix++) {
        const x = this.gx(ix);
        const i = this.idx(ix, iz);
        const h = this.heights[i];
        const o = i * 3;

        positions[o] = x;
        positions[o + 1] = h;
        positions[o + 2] = z;

        this.normalAt(x, z, nrm);
        normals[o] = nrm.x;
        normals[o + 1] = nrm.y;
        normals[o + 2] = nrm.z;

        const slope = Math.acos(clamp(nrm.y, -1, 1)) * 180 / Math.PI;
        this._vertexColor(x, z, h, slope, c);
        colors[o] = c.r;
        colors[o + 1] = c.g;
        colors[o + 2] = c.b;
      }
    }

    const quads = (n - 1) * (n - 1);
    const indices = vCount > 65535 ? new Uint32Array(quads * 6) : new Uint16Array(quads * 6);
    let p = 0;
    for (let iz = 0; iz < n - 1; iz++) {
      for (let ix = 0; ix < n - 1; ix++) {
        const a = this.idx(ix, iz);
        const b = this.idx(ix + 1, iz);
        const cc = this.idx(ix, iz + 1);
        const d = this.idx(ix + 1, iz + 1);
        indices[p++] = a; indices[p++] = cc; indices[p++] = b;
        indices[p++] = b; indices[p++] = cc; indices[p++] = d;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeBoundingSphere();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'terrain';
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    return mesh;
  }

  buildWater() {
    const geo = new THREE.PlaneGeometry(this.size * 1.9, this.size * 1.9);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x27687c,
      roughness: 0.2,
      metalness: 0.14,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = WORLD.WATER_LEVEL;
    mesh.name = 'water';
    return mesh;
  }
}

const _tmpN = new THREE.Vector3();
const _tmpC = new THREE.Color();
