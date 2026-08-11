// Pulls the real city out of the maps3d capture: 63,985 building footprints
// with surveyed heights, in the box format the Unreal spawner already reads.
//
//   node tools/maps3d-city.mjs <capture.glb> --sidecar <sandiego.json> [--out DIR]
//
// This replaces CityFabric's invented blocks outright. Everything that module
// generated — district grids, parcels, massing, landmark positions — existed
// because there was no surveyed source. There is one now, and mixing the two
// would put a made-up bungalow next to a real one and make both look wrong.
//
// The frame comes from the terrain sidecar rather than being recomputed, so the
// buildings land on the landscape that was built from the same capture. If the
// two ever disagree the city floats or sinks, and it disagrees silently.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const src = args[0];
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
if (!src) {
  console.error('usage: node tools/maps3d-city.mjs <capture.glb> --sidecar <sandiego.json> [--out DIR]');
  process.exit(1);
}
const OUT = arg('out', 'out');
const SIDECAR = arg('sidecar', join(OUT, 'sandiego.json'));
mkdirSync(OUT, { recursive: true });

const side = JSON.parse(readFileSync(SIDECAR, 'utf8'));
const FRAME = side.frameMetres.width;          // square, metres
const K = side.mercatorToGround;               // Mercator unit -> true metre
console.log('frame %.0f m square, playable %.0f x %.0f m, 1 unit = %.5f m',
  FRAME, side.playableMetres.width, side.playableMetres.height, K);

// ── glb ─────────────────────────────────────────────────────────────────────

const buf = readFileSync(src);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a glb');
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

// The capture's own extent, so buildings and terrain share one origin.
const tinPrim = gltf.meshes[gltf.nodes[roots.tinMesh].mesh].primitives[0];
const tinAcc = gltf.accessors[tinPrim.attributes.POSITION];
const cxU = (tinAcc.min[0] + tinAcc.max[0]) / 2;
const czU = (tinAcc.min[2] + tinAcc.max[2]) / 2;

/** Capture position (Mercator units) -> normalised (u, v) over the frame. */
const toU = (x) => ((x - cxU) * K) / FRAME + 0.5;
const toV = (z) => ((z - czU) * K) / FRAME + 0.5;

// ── Footprints ──────────────────────────────────────────────────────────────
//
// A building is a solid extruded down from its roof, so the node's translation
// carries the roof elevation and the mesh hangs below it. What matters for a
// box is the plan shape, and for that the axis-aligned bounds are a poor fit —
// most of this city is platted on a rotated grid, and an axis-aligned box round
// a diagonal building is up to 40% too big in both directions. So the footprint
// is fitted with a rotating-calipers minimum-area rectangle over the convex
// hull of the roof vertices, which gives back the real width, depth and bearing.

function convexHull(pts) {
  if (pts.length < 4) return pts;
  const p = pts.slice().sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}

/** Minimum-area enclosing rectangle: { cx, cy, w, d, rotDeg }. */
function minAreaRect(hull) {
  if (hull.length < 3) {
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    for (const [x, y] of hull) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, d: y1 - y0, rotDeg: 0 };
  }
  let best = null;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const len = Math.hypot(ex, ey);
    if (len < 1e-9) continue;
    const ux = ex / len; const uy = ey / len;
    let lo0 = Infinity; let hi0 = -Infinity; let lo1 = Infinity; let hi1 = -Infinity;
    for (const [px, py] of hull) {
      const p0 = px * ux + py * uy;
      const p1 = -px * uy + py * ux;
      if (p0 < lo0) lo0 = p0; if (p0 > hi0) hi0 = p0;
      if (p1 < lo1) lo1 = p1; if (p1 > hi1) hi1 = p1;
    }
    const w = hi0 - lo0; const d = hi1 - lo1;
    const area = w * d;
    if (!best || area < best.area) {
      const m0 = (lo0 + hi0) / 2; const m1 = (lo1 + hi1) / 2;
      best = {
        area,
        cx: m0 * ux - m1 * uy,
        cy: m0 * uy + m1 * ux,
        w, d,
        rotDeg: (Math.atan2(uy, ux) * 180) / Math.PI,
      };
    }
  }
  return best;
}

const buildingsNode = gltf.nodes[roots.Buildings];
const kids = buildingsNode.children ?? [];
console.log('extracting %d buildings...', kids.length);

const out = [];
let skipped = 0;
let hullPts = 0;
const t0 = Date.now();

for (let n = 0; n < kids.length; n++) {
  const node = gltf.nodes[kids[n]];
  if (node.mesh === undefined) { skipped++; continue; }
  const prim = gltf.meshes[node.mesh].primitives[0];
  const acc = gltf.accessors[prim.attributes.POSITION];
  const pos = readAccessor(prim.attributes.POSITION);

  const roofY = (node.translation ?? [0, 0, 0])[1];
  const heightM = -acc.min[1];                 // extruded down to the terrain
  if (!(heightM > 0.4)) { skipped++; continue; }

  // Roof vertices only: the walls duplicate the plan at every depth, and the
  // hull only needs the outline once.
  const pts = [];
  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i + 1] > -0.05) pts.push([pos[i], pos[i + 2]]);
  }
  if (pts.length < 3) { skipped++; continue; }
  hullPts += pts.length;

  const rect = minAreaRect(convexHull(pts));
  if (!rect || !(rect.w > 0.2) || !(rect.d > 0.2)) { skipped++; continue; }

  // Mercator -> ground. Widths scale by K like everything horizontal.
  out.push({
    u: toU(rect.cx),
    v: toV(rect.cy),
    // glTF +Z is the capture's south, matching this project's +v, so the
    // bearing carries across unchanged.
    rot: rect.rotDeg,
    w: rect.w * K,
    d: rect.d * K,
    h: heightM,
    base: 0,
    roofY,
    kind: 'building',
  });

  if ((n & 8191) === 0 && n) process.stdout.write(`  ${n}/${kids.length}\r`);
}

console.log('extracted %d buildings, skipped %d, in %ss',
  out.length, skipped, ((Date.now() - t0) / 1000).toFixed(1));
console.log('mean roof polygon: %.1f vertices', hullPts / Math.max(1, out.length));

// ── Sanity, before anything is written ──────────────────────────────────────

const hs = out.map((b) => b.h).sort((a, b) => a - b);
const areas = out.map((b) => b.w * b.d);
const pct = (arr, p) => arr[Math.floor(arr.length * p)];
let offFrame = 0;
let offPlay = 0;
const halfPU = side.playableMetres.width / FRAME / 2;
const halfPV = side.playableMetres.height / FRAME / 2;
for (const b of out) {
  if (b.u < 0 || b.u > 1 || b.v < 0 || b.v > 1) offFrame++;
  if (Math.abs(b.u - 0.5) > halfPU + 1e-6 || Math.abs(b.v - 0.5) > halfPV + 1e-6) offPlay++;
}
console.log('\nheight   p50 %.1f  p90 %.1f  p99 %.1f  max %.1f m',
  pct(hs, 0.5), pct(hs, 0.9), pct(hs, 0.99), hs[hs.length - 1]);
console.log('footprint total %.2f km2', areas.reduce((a, b) => a + b, 0) / 1e6);
console.log('outside the frame: %d      outside the playable rect: %d', offFrame, offPlay);

// ── Write ───────────────────────────────────────────────────────────────────

const kinds = ['building'];
const STRIDE = 9;
const bin = Buffer.alloc(out.length * STRIDE * 4);
out.forEach((b, i) => {
  const o = i * STRIDE * 4;
  bin.writeFloatLE(b.u, o);
  bin.writeFloatLE(b.v, o + 4);
  bin.writeFloatLE(b.rot, o + 8);
  bin.writeFloatLE(b.w, o + 12);
  bin.writeFloatLE(b.d, o + 16);
  bin.writeFloatLE(b.h, o + 20);
  bin.writeFloatLE(0, o + 24);            // kind index
  bin.writeFloatLE(0, o + 28);            // flags
  bin.writeFloatLE(b.base, o + 32);
});

const meta = {
  generatedFor: 'Call of Booty — San Diego (maps3d capture)',
  source: src,
  producedBy: 'tools/maps3d-city.mjs',
  frameMetres: { width: FRAME, height: FRAME },
  playableMetres: side.playableMetres,
  centre: side.centre,
  kinds,
  buildingCount: out.length,
  buildingStride: STRIDE,
  buildingFile: 'city-buildings.bin',
  buildingFields: ['u', 'v', 'rotDeg', 'widthM', 'depthM', 'heightM', 'kind', 'flags', 'baseM'],
  buildingFlags: { landmark: 1, water: 2 },
  arterials: [],
  streets: [],
  stats: [{
    id: 'maps3d', name: 'surveyed buildings',
    streets: 0, buildings: out.length,
  }],
};
writeFileSync(join(OUT, 'city.json'), JSON.stringify(meta));
writeFileSync(join(OUT, 'city-buildings.bin'), bin);
console.log('\nwrote %s  (%.2f MB, %d buildings)',
  join(OUT, 'city-buildings.bin'), bin.length / 1048576, out.length);
console.log('wrote %s', join(OUT, 'city.json'));
