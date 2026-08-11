// Cuts the water bodies into the heightmap, so the bays are actually wet.
//
//   node tools/maps3d-water.mjs <capture.glb> --out out
//
// The capture has no bathymetry. Its TIN stops at the waterline and every
// water surface — the Pacific, San Diego Bay, Mission Bay, the river channels —
// comes back as flat ground sitting about 3.5 m above datum. Rendered, that is
// a city with no water in it: the ocean actor sits at Z=0, the whole bay floor
// is above Z=0, and the plane is buried. Only nine samples in the entire 4033
// heightmap were below sea level, and every one of them was in the generated
// out-of-bounds ring.
//
// So the water gets dug. The Water group rasterises to a mask, a distance
// transform inside it gives a shelf that deepens away from the shore, and the
// heightmap is lowered to match. Two details matter:
//
//   - Depth is measured from each body's OWN surface, not from datum. The San
//     Diego River sits 30 m up Mission Valley; digging it to -9 m absolute
//     would put a canyon through Fashion Valley. Bodies are flood-filled into
//     components and each one takes its surface from the terrain it covers.
//   - This runs LAST, after maps3d-roadmesh.mjs. The road carve grades terrain
//     up to meet the deck, and it does that for bridges too — run in the other
//     order and the Coronado bridge leaves an embankment across the bay. Water
//     dug afterwards removes it, which is exactly right: a bridge deck is
//     geometry and does not need ground under it.
//
// Depths stay inside the declared -10 m floor, so the import recipe does not
// change.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';

const args = process.argv.slice(2);
const src = args[0];
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
if (!src) {
  console.error('usage: node tools/maps3d-water.mjs <capture.glb> --out out');
  process.exit(1);
}
const OUT = arg('out', 'out');

const SEA_DEPTH = 9.0;      // metres below the surface, offshore
const SEA_SHELF = 260;      // metres from the shore to reach full depth
const INLAND_DEPTH = 2.2;   // rivers and lagoons are not the Pacific
const INLAND_SHELF = 40;
const EDGE_DEPTH = 0.5;     // a one-pixel channel still has to be wet
const SEA_LEVEL_M = 6.0;    // a body whose floor is under this is tidal
const FEATHER_M = 26;       // land near the sea eased down to meet it
const FEATHER_H = 1.1;

const sidePath = join(OUT, 'sandiego.json');
const side = JSON.parse(readFileSync(sidePath, 'utf8'));
const RES = side.resolution;
const FRAME = side.frameMetres.width;
const K = side.mercatorToGround;
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;
const M_PER_PX = FRAME / (RES - 1);

const r16Path = join(OUT, 'sandiego.r16');
const raw = readFileSync(r16Path);
const enc = new Uint16Array(Uint8Array.from(raw.subarray(0, RES * RES * 2)).buffer);
const height = new Float32Array(RES * RES);
for (let i = 0; i < height.length; i++) {
  height[i] = LO + (enc[i] / 65535) * (HI - LO);
}

// ── The capture ─────────────────────────────────────────────────────────────
const buf = readFileSync(src);
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
const binOff = 20 + jsonLen;
const BIN = buf.subarray(binOff + 8, binOff + 8 + buf.readUInt32LE(binOff));

const COMPONENT = {
  5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2],
  5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4],
};
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function readAccessor(i) {
  const a = gltf.accessors[i];
  const [Type, bytes] = COMPONENT[a.componentType];
  const n = NUM[a.type];
  const bv = gltf.bufferViews[a.bufferView];
  const base = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const stride = bv.byteStride ?? 0;
  if (!stride || stride === bytes * n) {
    return new Type(Uint8Array.from(BIN.subarray(base, base + a.count * n * bytes)).buffer);
  }
  const out = new Type(a.count * n);
  for (let e = 0; e < a.count; e++) {
    const o = base + e * stride;
    for (let c = 0; c < n; c++) {
      out[e * n + c] = new Type(
        Uint8Array.from(BIN.subarray(o + c * bytes, o + (c + 1) * bytes)).buffer)[0];
    }
  }
  return out;
}

const roots = {};
for (const i of gltf.scenes[gltf.scene ?? 0].nodes) roots[gltf.nodes[i].name ?? String(i)] = i;
if (roots.Water === undefined) {
  console.error('this capture has no Water group — nothing to dig');
  process.exit(1);
}

const tinAcc = gltf.accessors[gltf.meshes[gltf.nodes[roots.tinMesh].mesh]
  .primitives[0].attributes.POSITION];
const cxU = (tinAcc.min[0] + tinAcc.max[0]) / 2;
const czU = (tinAcc.min[2] + tinAcc.max[2]) / 2;
const toCol = (x) => ((((x - cxU) * K) / FRAME) + 0.5) * (RES - 1);
const toRow = (z) => ((((z - czU) * K) / FRAME) + 0.5) * (RES - 1);

/** Minimal 8-bit RGB PNG reader, enough for our own surface map. */
function decodeRGB(buf) {
  let off = 8; let w = 0; let h = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 2) throw new Error('expected 8-bit RGB');
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const rawPx = inflateSync(Buffer.concat(idat));
  const stride = w * 3;
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    const f = rawPx[y * (stride + 1)];
    const line = rawPx.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    const up = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= 3 ? out[i - 3] : 0;
      const b = up ? up[i] : 0;
      const c = up && i >= 3 ? up[i - 3] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = v & 255;
    }
  }
  return { w, h, px };
}

const wet = new Uint8Array(RES * RES);
let tris = 0;
(function stamp(nodeIdx) {
  const node = gltf.nodes[nodeIdx];
  if (node.mesh !== undefined) {
    for (const p of gltf.meshes[node.mesh].primitives) {
      const pos = readAccessor(p.attributes.POSITION);
      const idx = p.indices !== undefined ? readAccessor(p.indices) : null;
      const n = idx ? idx.length : pos.length / 3;
      for (let t = 0; t + 2 < n; t += 3) {
        const a = (idx ? idx[t] : t) * 3;
        const b = (idx ? idx[t + 1] : t + 1) * 3;
        const c = (idx ? idx[t + 2] : t + 2) * 3;
        const ax = toCol(pos[a]); const ay = toRow(pos[a + 2]);
        const bx = toCol(pos[b]); const by = toRow(pos[b + 2]);
        const cx = toCol(pos[c]); const cy = toRow(pos[c + 2]);
        const r0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
        const r1 = Math.min(RES - 1, Math.ceil(Math.max(ay, by, cy)));
        const c0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
        const c1 = Math.min(RES - 1, Math.ceil(Math.max(ax, bx, cx)));
        const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
        if (Math.abs(den) < 1e-12) continue;
        for (let r = r0; r <= r1; r++) {
          for (let col = c0; col <= c1; col++) {
            const w0 = ((by - cy) * (col - cx) + (cx - bx) * (r - cy)) / den;
            const w1 = ((cy - ay) * (col - cx) + (ax - cx) * (r - cy)) / den;
            if (w0 < -0.004 || w1 < -0.004 || 1 - w0 - w1 < -0.004) continue;
            wet[r * RES + col] = 1;
          }
        }
        tris++;
      }
    }
  }
  for (const k of node.children ?? []) stamp(k);
})(roots.Water);

// A rasterised surface leaves pinholes where two triangles meet exactly on a
// pixel centre. One of those in the middle of the bay is a rock in open water.
let filled = 0;
for (let pass = 0; pass < 2; pass++) {
  for (let r = 1; r < RES - 1; r++) {
    for (let c = 1; c < RES - 1; c++) {
      const i = r * RES + c;
      if (wet[i]) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr || dc) n += wet[i + dr * RES + dc];
        }
      }
      if (n >= 7) { wet[i] = 1; filled++; }
    }
  }
}

let wetPx = 0;
for (let i = 0; i < wet.length; i++) wetPx += wet[i];
console.log('water surface: %d triangles, %d samples (%s km2), %d pinholes filled',
  tris, wetPx, ((wetPx * M_PER_PX * M_PER_PX) / 1e6).toFixed(2), filled);

// ── Bodies ──────────────────────────────────────────────────────────────────
// Each connected body takes its water level from the ground it covers. The
// median, not the minimum: one stray low sample would drag a whole lagoon down
// with it.
const label = new Int32Array(RES * RES).fill(-1);
const bodies = [];
const stack = new Int32Array(RES * RES);
for (let seed = 0; seed < wet.length; seed++) {
  if (!wet[seed] || label[seed] >= 0) continue;
  const id = bodies.length;
  let top = 0;
  stack[top++] = seed;
  label[seed] = id;
  const samples = [];
  let count = 0;
  while (top > 0) {
    const i = stack[--top];
    count++;
    if ((count & 7) === 0) samples.push(height[i]);
    const r = (i / RES) | 0; const c = i - r * RES;
    if (c > 0 && wet[i - 1] && label[i - 1] < 0) { label[i - 1] = id; stack[top++] = i - 1; }
    if (c < RES - 1 && wet[i + 1] && label[i + 1] < 0) { label[i + 1] = id; stack[top++] = i + 1; }
    if (r > 0 && wet[i - RES] && label[i - RES] < 0) { label[i - RES] = id; stack[top++] = i - RES; }
    if (r < RES - 1 && wet[i + RES] && label[i + RES] < 0) { label[i + RES] = id; stack[top++] = i + RES; }
  }
  if (!samples.length) samples.push(height[seed]);
  samples.sort((a, b) => a - b);
  const surface = samples[samples.length >> 1];
  bodies.push({ id, count, surface, tidal: surface < SEA_LEVEL_M });
}
bodies.sort((a, b) => b.count - a.count);
const tidalCount = bodies.filter((b) => b.tidal).length;
console.log('%d bodies, %d tidal. Largest:', bodies.length, tidalCount);
for (const b of bodies.slice(0, 6)) {
  console.log('  %s km2 at %s m  %s',
    ((b.count * M_PER_PX * M_PER_PX) / 1e6).toFixed(2).padStart(7),
    b.surface.toFixed(1).padStart(6), b.tidal ? 'tidal' : 'inland');
}
const byId = new Map(bodies.map((b) => [b.id, b]));

// ── Carry the sea into the out-of-bounds ring ───────────────────────────────
//
// The ring was generated from the border profile of the capture, and the
// capture's ocean reads as ground 3.5 m up — so the generator saw land at the
// coast and grew a hillside out of it. The Pacific currently stops dead at the
// frame's west edge and a 70 m plateau starts. Every ring sample whose nearest
// point on the playable rectangle is tidal water becomes sea as well, which is
// the same border-profile idea the ring already uses, applied to the one layer
// that had no way of knowing.
const P = side.playableMetres;
const cLo = Math.ceil(((-P.width / 2) / FRAME + 0.5) * (RES - 1));
const cHi = Math.floor(((P.width / 2) / FRAME + 0.5) * (RES - 1));
const rLo = Math.ceil(((-P.height / 2) / FRAME + 0.5) * (RES - 1));
const rHi = Math.floor(((P.height / 2) / FRAME + 0.5) * (RES - 1));

// Projecting straight out from the border is what the first attempt did, and
// it stripes: a two-pixel boat channel on the north edge gets extruded two
// kilometres into the ring, and so does every finger pier on the east. The
// border profile is blurred first, so what carries outward is "this stretch of
// coast is open water", not "this one sample happened to be wet".
const PROFILE_BLUR = 90;                       // samples, about 380 m
const isTidal = (i) => (wet[i] && byId.get(label[i]).tidal ? 1 : 0);
function blur(profile) {
  const out = new Float32Array(profile.length);
  for (let i = 0; i < profile.length; i++) {
    let sum = 0; let n = 0;
    for (let k = Math.max(0, i - PROFILE_BLUR);
      k <= Math.min(profile.length - 1, i + PROFILE_BLUR); k++) {
      sum += profile[k]; n++;
    }
    out[i] = sum / n;
  }
  return out;
}
const top = new Float32Array(RES); const bottom = new Float32Array(RES);
const left = new Float32Array(RES); const right = new Float32Array(RES);
for (let c = cLo; c <= cHi; c++) {
  top[c] = isTidal(rLo * RES + c);
  bottom[c] = isTidal(rHi * RES + c);
}
for (let r = rLo; r <= rHi; r++) {
  left[r] = isTidal(r * RES + cLo);
  right[r] = isTidal(r * RES + cHi);
}
const topB = blur(top); const bottomB = blur(bottom);
const leftB = blur(left); const rightB = blur(right);

let ringSea = 0;
for (let r = 0; r < RES; r++) {
  const inRow = r >= rLo && r <= rHi;
  const rr = r < rLo ? rLo : r > rHi ? rHi : r;
  for (let c = 0; c < RES; c++) {
    const inCol = c >= cLo && c <= cHi;
    if (inRow && inCol) continue;                     // inside the capture
    const cc = c < cLo ? cLo : c > cHi ? cHi : c;
    // Off an edge, one profile decides. Off a corner, the nearest point is the
    // corner itself and both profiles have a say.
    let open;
    if (inRow) open = c < cLo ? leftB[r] : rightB[r];
    else if (inCol) open = r < rLo ? topB[c] : bottomB[c];
    else {
      const a = r < rLo ? topB[cc] : bottomB[cc];
      const b = c < cLo ? leftB[rr] : rightB[rr];
      open = (a + b) / 2;
    }
    if (open <= 0.5) continue;
    const i = r * RES + c;
    if (wet[i]) continue;
    const body = byId.get(label[rr * RES + cc]);
    const sea = body && body.tidal ? body : bodies.find((b) => b.tidal);
    if (!sea) continue;
    wet[i] = 1;
    label[i] = sea.id;
    sea.count++;
    ringSea++;
  }
}
console.log('carried the sea %d samples (%s km2) into the out-of-bounds ring',
  ringSea, ((ringSea * M_PER_PX * M_PER_PX) / 1e6).toFixed(2));

// ── Distance to the shore, both ways ────────────────────────────────────────
// Chamfer, 3-4 weights, scaled to metres. Two passes over 16 M samples each.
function chamfer(inside) {
  const D = new Float32Array(RES * RES);
  const BIG = 1e9;
  for (let i = 0; i < D.length; i++) D[i] = inside[i] ? BIG : 0;
  const w1 = 1; const w2 = Math.SQRT2;
  for (let r = 0; r < RES; r++) {
    for (let c = 0; c < RES; c++) {
      const i = r * RES + c;
      if (D[i] === 0) continue;
      let d = D[i];
      if (r > 0) {
        if (D[i - RES] + w1 < d) d = D[i - RES] + w1;
        if (c > 0 && D[i - RES - 1] + w2 < d) d = D[i - RES - 1] + w2;
        if (c < RES - 1 && D[i - RES + 1] + w2 < d) d = D[i - RES + 1] + w2;
      }
      if (c > 0 && D[i - 1] + w1 < d) d = D[i - 1] + w1;
      D[i] = d;
    }
  }
  for (let r = RES - 1; r >= 0; r--) {
    for (let c = RES - 1; c >= 0; c--) {
      const i = r * RES + c;
      if (D[i] === 0) continue;
      let d = D[i];
      if (r < RES - 1) {
        if (D[i + RES] + w1 < d) d = D[i + RES] + w1;
        if (c > 0 && D[i + RES - 1] + w2 < d) d = D[i + RES - 1] + w2;
        if (c < RES - 1 && D[i + RES + 1] + w2 < d) d = D[i + RES + 1] + w2;
      }
      if (c < RES - 1 && D[i + 1] + w1 < d) d = D[i + 1] + w1;
      D[i] = d;
    }
  }
  for (let i = 0; i < D.length; i++) D[i] *= M_PER_PX;
  return D;
}
const dIn = chamfer(wet);

// The shoreline feather is measured against TIDAL water only. dOut over every
// body would measure distance to the San Diego River as well, and the river is
// 30 m up Mission Valley: easing the land beside it down to the waterline would
// cut a trench through Fashion Valley to reach a level the water there does not
// sit at. Inland bodies are small and shallow, and a step at their edge is
// what a creek bank looks like anyway.
const notTidal = new Uint8Array(RES * RES);
for (let i = 0; i < wet.length; i++) {
  notTidal[i] = wet[i] && byId.get(label[i]).tidal ? 0 : 1;
}
const dOut = chamfer(notTidal);

// Paving does not get feathered. The road carve already graded these corridors
// flat and the decks were built to sit on that grade; pulling the ground out
// from under the embarcadero would leave the carriageway hanging over a gap.
const paved = new Uint8Array(RES * RES);
try {
  const s = decodeRGB(readFileSync(join(OUT, 'sandiego-surfaces.png')));
  for (let r = 0; r < RES; r++) {
    const sr = Math.round((r / (RES - 1)) * (s.h - 1));
    for (let c = 0; c < RES; c++) {
      const sc = Math.round((c / (RES - 1)) * (s.w - 1));
      if (s.px[(sr * s.w + sc) * 3]) paved[r * RES + c] = 1;
    }
  }
  let n = 0;
  for (let i = 0; i < paved.length; i++) n += paved[i];
  console.log('%d paved samples held out of the shoreline feather', n);
} catch (err) {
  console.log('no surface map (%s) — feathering the shoreline without it',
    err.message);
}

// ── Dig ─────────────────────────────────────────────────────────────────────
const smooth = (t) => t * t * (3 - 2 * t);
let dug = 0; let feathered = 0; let deepest = 0;
for (let i = 0; i < wet.length; i++) {
  if (wet[i]) {
    const body = byId.get(label[i]);
    const full = body.tidal ? SEA_DEPTH : INLAND_DEPTH;
    const shelf = body.tidal ? SEA_SHELF : INLAND_SHELF;
    const t = Math.min(1, dIn[i] / shelf);
    const depth = EDGE_DEPTH + (full - EDGE_DEPTH) * smooth(t);
    // Tidal water is levelled on datum, so the ocean actor at Z=0 is the
    // waterline everywhere it reaches. Inland bodies keep their own level.
    const surface = body.tidal ? 0 : body.surface;
    const target = surface - depth;
    if (target < height[i]) {
      height[i] = target;
      dug++;
      if (-target > deepest) deepest = -target;
    }
  } else if (dOut[i] < FEATHER_M && !paved[i]) {
    // Ease the last few metres of land down to the waterline, so the coast is a
    // beach rather than a 3.5 m kerb around the whole bay.
    const t = smooth(1 - dOut[i] / FEATHER_M);
    const target = FEATHER_H;
    if (height[i] > target) {
      height[i] = height[i] * (1 - t) + target * t;
      feathered++;
    }
  }
}

let mn = Infinity; let mx = -Infinity;
for (let i = 0; i < height.length; i++) {
  if (height[i] < mn) mn = height[i];
  if (height[i] > mx) mx = height[i];
}
console.log('dug %d samples (%s km2), feathered %d of shoreline, deepest %s m',
  dug, ((dug * M_PER_PX * M_PER_PX) / 1e6).toFixed(2), feathered,
  deepest.toFixed(2));
console.log('elevation now %s .. %s m, declared %s .. %s',
  mn.toFixed(2), mx.toFixed(2), LO, HI);
if (mn < LO || mx > HI) {
  console.error('OUT OF THE DECLARED RANGE — the import recipe would change.');
  process.exit(1);
}

// ── Write it back ───────────────────────────────────────────────────────────
for (let i = 0; i < height.length; i++) {
  const t = (height[i] - LO) / (HI - LO);
  enc[i] = Math.max(0, Math.min(65535, Math.round(t * 65535)));
}
writeFileSync(r16Path, Buffer.from(enc.buffer, 0, enc.length * 2));

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (b) => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(RES, 0); ihdr.writeUInt32BE(RES, 4);
ihdr[8] = 16; ihdr[9] = 0;
const rows = Buffer.alloc(RES * (1 + RES * 2));
for (let r = 0; r < RES; r++) {
  const o = r * (1 + RES * 2);
  rows[o] = 0;
  for (let c = 0; c < RES; c++) {
    const v = enc[r * RES + c];
    rows[o + 1 + c * 2] = v >> 8;
    rows[o + 2 + c * 2] = v & 255;
  }
}
writeFileSync(join(OUT, 'sandiego.png'), Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(rows, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
]));

side.observedMetres = { min: +mn.toFixed(2), max: +mx.toFixed(2) };
side.water = {
  producedBy: 'tools/maps3d-water.mjs',
  bodies: bodies.length,
  tidalBodies: tidalCount,
  surfaceKm2: +((wetPx * M_PER_PX * M_PER_PX) / 1e6).toFixed(2),
  seaDepthMetres: SEA_DEPTH,
  inlandDepthMetres: INLAND_DEPTH,
  note: 'The capture has no bathymetry. Water bodies are dug from their own '
    + 'surface level; tidal ones are levelled on datum so the ocean actor at '
    + 'Z=0 is the waterline. Run this after maps3d-roadmesh.mjs.',
};
writeFileSync(sidePath, JSON.stringify(side, null, 2));
console.log('rewrote %s, %s and the sidecar', r16Path, join(OUT, 'sandiego.png'));
