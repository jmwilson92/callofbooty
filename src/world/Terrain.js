import * as THREE from 'three';
import { WORLD, TERRAIN_COLORS, POIS, ROADS } from '../config.js';
import { Simplex, smoothstep, clamp, lerp } from '../core/Noise.js';

// Seeded heightfield island. The same array backs both the render mesh and
// collision, so what you see is exactly what you stand on.
export class Terrain {
  constructor(seed = WORLD.SEED) {
    this.size = WORLD.SIZE;
    this.half = WORLD.SIZE / 2;
    this.cell = WORLD.CELL;
    this.n = Math.round(WORLD.SIZE / WORLD.CELL) + 1; // verts per side
    this.simplex = new Simplex(seed);
    this.detail = new Simplex(seed + 91);

    this.heights = new Float32Array(this.n * this.n);
    this.roadMask = new Float32Array(this.n * this.n);

    this._generateBase();
    this._applyPoiPads();
    this.roads = this._buildRoadNetwork();
    this._applyRoads();
  }

  idx(ix, iz) {
    return iz * this.n + ix;
  }

  // World coordinate of a grid index
  gx(ix) {
    return -this.half + ix * this.cell;
  }

  _generateBase() {
    const { NOISE_OCTAVES, NOISE_BASE_FREQ, NOISE_LACUNARITY, NOISE_PERSISTENCE } = WORLD;
    for (let iz = 0; iz < this.n; iz++) {
      const z = this.gx(iz);
      for (let ix = 0; ix < this.n; ix++) {
        const x = this.gx(ix);

        let n = this.simplex.fbm(
          x, z, NOISE_OCTAVES, NOISE_BASE_FREQ, NOISE_LACUNARITY, NOISE_PERSISTENCE
        );
        n = n * 0.5 + 0.5; // -> [0,1]
        n = Math.pow(n, 1.25); // bias toward lowland, keeps peaks rare

        const r = Math.sqrt(x * x + z * z) / this.half;
        const f = 1 - smoothstep(WORLD.FALLOFF_START, WORLD.FALLOFF_END, r);

        const h = (n * WORLD.MAX_ELEVATION + WORLD.BASE_LIFT) * f - (1 - f) * WORLD.EDGE_DEPTH;
        this.heights[this.idx(ix, iz)] = h;
      }
    }
  }

  // Carve a level pad under each POI that declares one, with a smooth ramp out.
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

  // Straight segments linking POIs into a connected network.
  _buildRoadNetwork() {
    const by = {};
    for (const p of POIS) by[p.id] = p;
    const links = [
      ['grid', 'harbor'], ['grid', 'radiohill'], ['grid', 'quarry'],
      ['grid', 'farm'], ['quarry', 'substation'], ['farm', 'trailers'],
      ['harbor', 'trailers'], ['radiohill', 'substation'],
    ];
    return links.map(([a, b]) => ({
      a: new THREE.Vector2(by[a].x, by[a].z),
      b: new THREE.Vector2(by[b].x, by[b].z),
    }));
  }

  // Flatten a corridor to a smoothed centreline profile, blending back to
  // natural terrain over ROADS.BLEND metres either side.
  _applyRoads() {
    const halfW = ROADS.WIDTH / 2;
    const reach = halfW + ROADS.BLEND;

    for (const seg of this.roads) {
      const dir = new THREE.Vector2().subVectors(seg.b, seg.a);
      const len = dir.length();
      if (len < 1e-3) continue;
      dir.divideScalar(len);

      // Sample the current surface along the centreline, then box-blur it so
      // the road grade is gentle instead of tracking every bump.
      const samples = Math.max(2, Math.ceil(len / this.cell));
      const raw = new Float32Array(samples + 1);
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        raw[s] = this.heightAt(lerp(seg.a.x, seg.b.x, t), lerp(seg.a.y, seg.b.y, t));
      }
      const prof = new Float32Array(samples + 1);
      const K = 6;
      for (let s = 0; s <= samples; s++) {
        let acc = 0, cnt = 0;
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
          // Closest point on the segment
          const px = x - seg.a.x, pz = z - seg.a.y;
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

  // Bilinear height sample in world space.
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
    return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), tz);
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
    let col;
    const road = this.roadAt(x, z);

    if (h < C.SAND_MAX) col = C.SAND;
    else if (slopeDeg > C.ROCK_DARK_SLOPE_DEG) col = C.ROCK_DARK;
    else if (slopeDeg > C.ROCK_MIN_SLOPE_DEG) col = C.ROCK;
    else if (h > C.SNOW_MIN) col = C.SNOW;
    else if (h > C.GRASS_MAX) col = C.DRY_GRASS;
    else col = C.GRASS;

    out.setHex(col);

    if (road > 0) out.lerp(_tmpC.setHex(C.ASPHALT), road);

    // Break up large flat fills so they do not read as a solid colour.
    const v = this.detail.noise2D(x * 0.05, z * 0.05) * C.NOISE_VARIATION;
    const macro = this.detail.noise2D(x * 0.004, z * 0.004) * C.NOISE_VARIATION * 1.6;
    const m = 1 + v + macro;
    out.setRGB(
      clamp(out.r * m, 0, 1),
      clamp(out.g * m, 0, 1),
      clamp(out.b * m, 0, 1)
    );
    return out;
  }

  // One merged BufferGeometry for the whole island.
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
    const geo = new THREE.PlaneGeometry(this.size * 1.6, this.size * 1.6);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2f5a6b,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = WORLD.WATER_LEVEL;
    mesh.name = 'water';
    return mesh;
  }
}

const _tmpN = new THREE.Vector3();
const _tmpC = new THREE.Color();
