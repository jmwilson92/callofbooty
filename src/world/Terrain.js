import * as THREE from 'three';
import {
  WORLD, TERRAIN_COLORS, ROADS,
} from '../config.js';
import { Simplex, smoothstep, clamp, lerp } from '../core/Noise.js';
import { buildRoadPolylines, polylinesToSegments } from './Roads.js';

// San Diego heightfield shaped from satellite_view.png + terrain_map.png.
// Same array backs render mesh and collision.

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
    // Connected freeways + arterials; flatten into heightfield.
    this.roadLines = buildRoadPolylines();
    this.roads = polylinesToSegments(this.roadLines).map((s) => ({
      a: { x: s.a.x, y: s.a.z }, // Vector2-style (x,y)=(x,z)
      b: { x: s.b.x, y: s.b.z },
      width: s.width,
      blend: s.blend,
    }));
    this._applyRoads();
    this._reapplyWaterCuts();
    // Re-stamp roads after water so decks stay dry and continuous.
    this._applyRoads();
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

  /**
   * Far-east mountain wall: N–S spine, layered ridges, discrete summits.
   * Stylized for BR high ground — not GIS-accurate.
   */
  _applyEastMountains(x, z, base, n) {
    const M = WORLD.EAST_MOUNTAINS;
    if (!M) return base;

    // Broad foothill ramp from mid-map toward the east rim
    const foothill = smoothstep(M.foothillStart, M.spineX, x);
    if (foothill < 0.015) return base;

    // Spine envelope: strongest near spineX, falls off west into the city
    const distWest = M.spineX - x;
    const spineMask = 1 - smoothstep(0, M.spineHalfWidth, Math.max(0, distWest));
    // Soften past the spine toward the hard map rim
    const pastSpine = smoothstep(M.spineX, M.spineX + 140, x);
    let mass = foothill * Math.max(spineMask, foothill * 0.4) * (1 - pastSpine * 0.35);

    // Ridged mountain noise along the range
    const ridgeN = this._ridged(x * 0.85 + 120, z * 1.1, 5, 0.0018, 2.15, 0.52);
    const detailN = this._ridged(x + 200, z - 80, 3, 0.0045, 2.3, 0.5);

    // Base range height along the spine
    let rangeH = lerp(M.peakMin, M.peakMax * 0.78, ridgeN);
    rangeH += (detailN - 0.5) * 28;
    rangeH += (n - 0.5) * 12;

    // Discrete summits — pull hard toward authored peak heights
    for (const pk of M.peaks) {
      const d = Math.hypot(x - pk.x, z - pk.z);
      const w = 1 - smoothstep(pk.r * 0.2, pk.r, d);
      if (w > 0) {
        const tip = pk.peak * (0.72 + ridgeN * 0.18 + detailN * 0.1);
        rangeH = Math.max(rangeH, lerp(rangeH, tip, Math.pow(w, 1.35)));
        mass = Math.max(mass, w * Math.max(foothill, 0.75));
      }
    }

    // Secondary ridge ellipses (layered ranges west of the main spine)
    for (const rg of M.ridges) {
      const e = this._ellipse(x, z, rg.x, rg.z, rg.rx, rg.rz);
      const w = 1 - smoothstep(0.4, 1.12, e);
      if (w > 0) {
        const h = rg.peak * (0.55 + ridgeN * 0.45);
        rangeH = Math.max(rangeH, lerp(rangeH, h, w * w));
        mass = Math.max(mass, w * 0.9 * foothill);
      }
    }

    // Canyon cuts between ridges (readable valleys for rotation)
    const gully = Math.pow(1 - ridgeN, 2) * 32 * mass;
    rangeH -= gully * 0.55;

    // Blend mountain mass over city/foothill base — prefer mountain height
    const blend = Math.pow(clamp(mass, 0, 1), 0.95);
    return lerp(base, Math.max(base + 8 * blend, rangeH), blend);
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

        // Near-east foothills (Mission Trails–scale mass before the true wall)
        const hd = Math.hypot(x - hills.x, z - hills.z);
        const hw = 1 - smoothstep(hills.radius * 0.3, hills.radius, hd);
        if (hw > 0) {
          const ridge = this._ridged(x + 40, z - 20, 5, 0.002, 2.2, 0.5);
          const peak = hills.peak * (0.4 + ridge * 0.6);
          base = lerp(base, peak, hw * hw);
        }

        // Far-eastern mountain system — stylized BR wall (see EAST_MOUNTAINS).
        base = this._applyEastMountains(x, z, base, n);

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

  // Water cuts; protect only authored land masses (Point Loma / Coronado).
  _reapplyWaterCuts() {
    const pl = WORLD.POINT_LOMA;
    const cor = WORLD.CORONADO;

    for (let iz = 0; iz < this.n; iz++) {
      const z = this.gx(iz);
      for (let ix = 0; ix < this.n; ix++) {
        const x = this.gx(ix);
        const i = this.idx(ix, iz);

        // Always protect peninsula / island cores from being re-sunk
        const plW = 1 - smoothstep(0.55, 1.1, this._ellipse(x, z, pl.x, pl.z, pl.rx, pl.rz));
        const cW = 1 - smoothstep(0.65, 1.1, this._ellipse(x, z, cor.x, cor.z, cor.rx, cor.rz));
        const landProtect = Math.max(plW, cW);
        if (landProtect > 0.7) continue;

        let h = this.heights[i];
        const sinkW = (1 - landProtect * 0.9);

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

  _applyRoads() {
    const minH = ROADS.MIN_HEIGHT ?? 2.5;
    for (const seg of this.roads) {
      const halfW = (seg.width ?? ROADS.WIDTH) / 2;
      const blend = seg.blend ?? ROADS.BLEND;
      const reach = halfW + blend;

      const ax = seg.a.x; const az = seg.a.y;
      const bx = seg.b.x; const bz = seg.b.y;
      const dx = bx - ax;
      const dz = bz - az;
      const len = Math.hypot(dx, dz);
      if (len < 1e-3) continue;
      const ux = dx / len;
      const uz = dz / len;

      const samples = Math.max(2, Math.ceil(len / this.cell));
      const raw = new Float32Array(samples + 1);
      let dryCount = 0;
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        const h = this.heightAt(lerp(ax, bx, t), lerp(az, bz, t));
        raw[s] = Math.max(minH, h);
        if (h >= minH) dryCount++;
      }
      // Skip segments that are almost entirely water
      if (dryCount < samples * 0.25) continue;

      // Smooth grade along centreline
      const prof = new Float32Array(samples + 1);
      const K = 8;
      for (let s = 0; s <= samples; s++) {
        let acc = 0; let cnt = 0;
        for (let k = -K; k <= K; k++) {
          const j = s + k;
          if (j < 0 || j > samples) continue;
          acc += raw[j];
          cnt++;
        }
        prof[s] = Math.max(minH, acc / cnt);
      }

      const minX = Math.max(0, Math.floor((Math.min(ax, bx) - reach + this.half) / this.cell));
      const maxX = Math.min(this.n - 1, Math.ceil((Math.max(ax, bx) + reach + this.half) / this.cell));
      const minZ = Math.max(0, Math.floor((Math.min(az, bz) - reach + this.half) / this.cell));
      const maxZ = Math.min(this.n - 1, Math.ceil((Math.max(az, bz) + reach + this.half) / this.cell));

      for (let iz = minZ; iz <= maxZ; iz++) {
        const z = this.gx(iz);
        for (let ix = minX; ix <= maxX; ix++) {
          const x = this.gx(ix);
          const px = x - ax; const pz = z - az;
          let t = (px * ux + pz * uz) / len;
          t = clamp(t, 0, 1);
          const cx = lerp(ax, bx, t);
          const cz = lerp(az, bz, t);
          const d = Math.hypot(x - cx, z - cz);
          if (d > reach) continue;

          let roadH = prof[Math.round(t * samples)];
          roadH = Math.max(minH, roadH);
          const w = 1 - smoothstep(halfW, reach, d);
          const i = this.idx(ix, iz);
          // Never drag land under water with a road
          if (this.heights[i] < minH * 0.5 && w < 0.9) continue;
          this.heights[i] = lerp(this.heights[i], roadH, w);
          if (this.heights[i] < minH && d <= halfW) this.heights[i] = minH;
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

    // Sharper height bands (narrow smoothsteps) so biomes read cleanly.
    out.setHex(C.SAND);
    out.lerp(_tmpC.setHex(C.GRASS), smoothstep(C.SAND_MAX - 0.6, C.SAND_MAX + 2.2, h));
    out.lerp(_tmpC.setHex(C.DRY_GRASS), smoothstep(C.GRASS_MAX - 4, C.GRASS_MAX + 4, h));
    out.lerp(_tmpC.setHex(C.CHAPARRAL), smoothstep(C.CHAPARRAL_MIN - 4, C.CHAPARRAL_MIN + 12, h));

    // Inland brown only on true east high ground
    const inland = smoothstep(80, 420, x) * smoothstep(20, 55, h);
    out.lerp(_tmpC.setHex(C.CHAPARRAL), inland * 0.28);

    if (C.ALPINE_MIN != null) {
      out.lerp(_tmpC.setHex(C.ROCK),
        smoothstep(C.ALPINE_MIN + 5, C.ALPINE_MIN + 40, h) * 0.55);
    }

    out.lerp(_tmpC.setHex(C.ROCK),
      smoothstep(C.ROCK_MIN_SLOPE_DEG - 4, C.ROCK_MIN_SLOPE_DEG + 6, slopeDeg));
    out.lerp(_tmpC.setHex(C.ROCK_DARK),
      smoothstep(C.ROCK_DARK_SLOPE_DEG - 4, C.ROCK_DARK_SLOPE_DEG + 6, slopeDeg));

    out.lerp(_tmpC.setHex(C.ROCK_DARK), smoothstep(125, 150, h) * 0.5);
    out.lerp(_tmpC.setHex(C.SNOW),
      smoothstep(C.SNOW_MIN - 4, C.SNOW_MIN + 8, h)
      * (1 - smoothstep(C.ROCK_MIN_SLOPE_DEG + 2, C.ROCK_DARK_SLOPE_DEG + 6, slopeDeg)));

    // Light urban tint only on very flat mid-city pads
    const urban = (1 - smoothstep(8, 16, h))
      * smoothstep(-120, 100, x)
      * smoothstep(100, 280, z)
      * (1 - smoothstep(420, 520, z));
    if (urban > 0.08 && slopeDeg < 14) {
      out.lerp(_tmpC.setHex(C.URBAN), urban * 0.28);
    }

    const road = this.roadAt(x, z);
    if (road > 0) out.lerp(_tmpC.setHex(C.ASPHALT), road);

    // Tiny macro variation only — large smear was killing definition
    const m = 1 + this.detail.noise2D(x * 0.003, z * 0.003) * C.NOISE_VARIATION;
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
      color: 0x1f6a82,
      roughness: 0.18,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = WORLD.WATER_LEVEL;
    mesh.name = 'water';
    return mesh;
  }
}

const _tmpN = new THREE.Vector3();
const _tmpC = new THREE.Color();
