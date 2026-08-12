// Gives every building a way in, and tells it what the ground under it does.
//
//   node tools/maps3d-doors.mjs --out out [--debug u,v --debugSpan 400]
//
// maps3d-city.mjs writes one record per building, but it runs before the road
// tracer and so knows nothing about streets. A generated building without a
// street-facing entrance is a sealed box with furniture in it, so this is the
// step between the record and any interior at all.
//
// For each structure it finds the nearest road centreline, works out which face
// of the footprint that road is on, puts a door on that face, and samples the
// graded terrain at the door and across the whole footprint. The last part
// matters more than it sounds: a house on Point Loma can have two metres of fall
// across its plan, and a generator that assumes a level slab puts the back door
// underground.
//
// It rewrites city-structures.bin with the fuller record rather than writing a
// second file alongside it. A parallel array that has to stay index-aligned with
// another one is precisely the shape of bug this pipeline keeps producing, and
// one record that carries every fact about a building cannot desynchronise from
// itself. Re-running is safe: every added field is recomputed from the base
// fields, which are never modified.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const OUT = arg('out', arg('dir', 'out'));

const side = JSON.parse(readFileSync(join(OUT, 'sandiego.json'), 'utf8'));
const city = JSON.parse(readFileSync(join(OUT, 'city.json'), 'utf8'));
const roadsDoc = JSON.parse(readFileSync(join(OUT, 'roads.json'), 'utf8'));
const r16 = readFileSync(join(OUT, 'sandiego.r16'));

const FRAME = side.frameMetres.width;
const RES = side.resolution;
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;

if (!city.structures) {
  console.error('city.json has no structures block — run maps3d-city.mjs first');
  process.exit(1);
}

// The base fields are the contract with maps3d-city.mjs. Checking them by name
// rather than trusting the stride means a change there fails here loudly
// instead of silently reading depth out of the rotation.
const BASE = ['partIndex', 'partCount', 'u', 'v', 'rotDeg', 'widthM', 'depthM',
  'heightM', 'storeys', 'floorHeightM', 'archetype', 'tier', 'seed', 'flags'];
const have = city.structures.fields;
for (let i = 0; i < BASE.length; i++) {
  if (have[i] !== BASE[i]) {
    console.error('field %d is %s, expected %s — maps3d-city.mjs has changed '
      + 'shape and this script has not', i, have[i], BASE[i]);
    process.exit(1);
  }
}

const ADDED = ['doorU', 'doorV', 'doorSide', 'frontageM', 'frontageClass',
  'groundM', 'groundMinM', 'groundMaxM'];
const IN_STRIDE = city.structures.stride;
const OUT_STRIDE = BASE.length + ADDED.length;
const N = city.structures.count;
const src = readFileSync(join(OUT, 'city-structures.bin'));
if (src.length !== N * IN_STRIDE * 4) {
  console.error('city-structures.bin is %d bytes, expected %d', src.length, N * IN_STRIDE * 4);
  process.exit(1);
}
console.log('%d structures, %d fields in, %d out', N, IN_STRIDE, OUT_STRIDE);

// ── Terrain ─────────────────────────────────────────────────────────────────
//
// The graded heightmap, after the road carve and the water dig. That is the
// surface a building actually sits on, not the raw capture.
const groundAt = (u, v) => {
  const x = Math.min(RES - 1, Math.max(0, Math.round(u * (RES - 1))));
  const y = Math.min(RES - 1, Math.max(0, Math.round(v * (RES - 1))));
  return LO + (r16.readUInt16LE((y * RES + x) * 2) / 65535) * (HI - LO);
};

// ── Where the streets are ───────────────────────────────────────────────────
//
// A bridge deck is not frontage — nobody's front door opens onto the Coronado
// Bridge — so it is left out. Footpaths are kept: a house on a lane still has a
// front door on the lane, and paths are 442 km of the network.
const FRONTAGE_CLASSES = ['arterial', 'collector', 'local', 'service', 'path'];
const CLASS_IDX = new Map(FRONTAGE_CLASSES.map((c, i) => [c, i]));

// Centrelines resampled to a fixed step, so a long straight run is as findable
// as a short kinked one. At 6 m the gap between samples is well under the
// smallest building this has to serve.
const STEP_M = 6;
const pts = [];        // u, v, class index, flat
let skippedClass = 0;
for (const r of roadsDoc.roads) {
  const ci = CLASS_IDX.get(r.cls);
  if (ci === undefined) { skippedClass++; continue; }
  for (let i = 1; i < r.pts.length; i++) {
    const [au, av] = r.pts[i - 1];
    const [bu, bv] = r.pts[i];
    const segM = Math.hypot((bu - au) * FRAME, (bv - av) * FRAME);
    const n = Math.max(1, Math.round(segM / STEP_M));
    for (let s = 0; s < n; s++) {
      const t = s / n;
      pts.push(au + (bu - au) * t, av + (bv - av) * t, ci);
    }
  }
  const last = r.pts[r.pts.length - 1];
  pts.push(last[0], last[1], ci);
}
const SAMPLES = pts.length / 3;
console.log('%d road samples every %d m from %d runs (%d bridge runs left out)',
  SAMPLES, STEP_M, roadsDoc.roads.length - skippedClass, skippedClass);

// A uniform grid, searched in rings outward. The city is not uniformly dense —
// downtown has a road every 60 m and Point Loma's ridge has none for 400 — so
// the search has to widen rather than assume a radius.
const CELL_M = 48;
const GRID = Math.ceil(FRAME / CELL_M);
const counts = new Int32Array(GRID * GRID);
const cellOf = (u, v) => {
  const x = Math.min(GRID - 1, Math.max(0, Math.floor(u * FRAME / CELL_M)));
  const y = Math.min(GRID - 1, Math.max(0, Math.floor(v * FRAME / CELL_M)));
  return y * GRID + x;
};
for (let i = 0; i < SAMPLES; i++) counts[cellOf(pts[i * 3], pts[i * 3 + 1])]++;
const start = new Int32Array(GRID * GRID + 1);
for (let i = 0; i < GRID * GRID; i++) start[i + 1] = start[i] + counts[i];
const order = new Int32Array(SAMPLES);
const fill = start.slice(0, GRID * GRID);
for (let i = 0; i < SAMPLES; i++) order[fill[cellOf(pts[i * 3], pts[i * 3 + 1])]++] = i;

const MAX_SEARCH_M = 400;
const MAX_RING = Math.ceil(MAX_SEARCH_M / CELL_M);

/** Nearest road sample to (u, v), or null past MAX_SEARCH_M. */
function nearestRoad(u, v) {
  const cx = Math.min(GRID - 1, Math.max(0, Math.floor(u * FRAME / CELL_M)));
  const cy = Math.min(GRID - 1, Math.max(0, Math.floor(v * FRAME / CELL_M)));
  let best = null; let bestD2 = Infinity;
  for (let ring = 0; ring <= MAX_RING; ring++) {
    // Once something is found, one more ring is still needed: a sample just
    // over the cell boundary can be closer than one in the far corner of this
    // cell. Stopping on first hit puts doors on the wrong street.
    if (best && ring > Math.ceil(Math.sqrt(bestD2) * FRAME / CELL_M) + 1) break;
    let any = false;
    for (let y = cy - ring; y <= cy + ring; y++) {
      if (y < 0 || y >= GRID) continue;
      for (let x = cx - ring; x <= cx + ring; x++) {
        if (x < 0 || x >= GRID) continue;
        if (ring && Math.abs(x - cx) !== ring && Math.abs(y - cy) !== ring) continue;
        any = true;
        const c = y * GRID + x;
        for (let k = start[c]; k < start[c + 1]; k++) {
          const i = order[k];
          const du = pts[i * 3] - u; const dv = pts[i * 3 + 1] - v;
          const d2 = du * du + dv * dv;
          if (d2 < bestD2) { bestD2 = d2; best = i; }
        }
      }
    }
    if (!any && ring > MAX_RING) break;
  }
  if (best === null) return null;
  return { u: pts[best * 3], v: pts[best * 3 + 1], cls: pts[best * 3 + 2], d: Math.sqrt(bestD2) * FRAME };
}

// ── Doors ───────────────────────────────────────────────────────────────────
//
// Sides are numbered in the rectangle's own frame: 0 is +width, 1 is +depth,
// 2 is -width, 3 is -depth. Which one the road is on is not simply the nearest
// edge in metres — for a long thin block the road can be 8 m off the end and
// 9 m off the side, and the door belongs on the long face. Comparing the
// offsets as fractions of each half-extent picks the face the road actually
// runs along.
const CORNER_INSET = 0.18;   // keep a door off the corner of its own wall

const flagsOf = { ORPHAN: 1 };
const OUT_BUF = Buffer.alloc(N * OUT_STRIDE * 4);

let orphans = 0;
const frontages = [];
const bySide = [0, 0, 0, 0];
const byClass = new Array(FRONTAGE_CLASSES.length).fill(0);
let steepest = 0; let steepestIdx = 0;
const falls = [];
const doors = [];

for (let i = 0; i < N; i++) {
  const o = i * IN_STRIDE * 4;
  const u = src.readFloatLE(o + 8);
  const v = src.readFloatLE(o + 12);
  const rot = src.readFloatLE(o + 16);
  const w = src.readFloatLE(o + 20);
  const d = src.readFloatLE(o + 24);
  const storeys = src.readFloatLE(o + 32);

  const th = (rot * Math.PI) / 180;
  const ux = Math.cos(th); const uy = Math.sin(th);

  const near = nearestRoad(u, v);
  let sideIdx = 0; let doorU = u; let doorV = v;
  let frontM = 0; let clsIdx = 0; let orphan = false;

  if (!near) {
    orphan = true; orphans++;
    frontM = MAX_SEARCH_M;
    clsIdx = 0;
  } else {
    frontM = near.d;
    clsIdx = near.cls;
    byClass[clsIdx]++;
  }

  // The direction to aim the door: the road if there is one, otherwise
  // downhill, which is where a driveway would have gone anyway.
  let tu; let tv;
  if (near) { tu = near.u - u; tv = near.v - v; } else {
    const e = 6 / FRAME;
    tu = groundAt(u - e, v) - groundAt(u + e, v);
    tv = groundAt(u, v - e) - groundAt(u, v + e);
    if (!tu && !tv) tu = 1;
  }
  // Into the rectangle's frame, in metres.
  const a = (tu * ux + tv * uy) * FRAME;
  const b = (-tu * uy + tv * ux) * FRAME;
  const ra = Math.abs(a) / Math.max(1e-6, w / 2);
  const rb = Math.abs(b) / Math.max(1e-6, d / 2);
  if (ra >= rb) sideIdx = a >= 0 ? 0 : 2; else sideIdx = b >= 0 ? 1 : 3;

  // Slide the door along that face towards the road, then hold it off the
  // corners so it never lands on the return wall.
  const halfW = w / 2; const halfD = d / 2;
  let la; let lb;
  if (sideIdx === 0 || sideIdx === 2) {
    la = sideIdx === 0 ? halfW : -halfW;
    lb = Math.max(-halfD * (1 - CORNER_INSET), Math.min(halfD * (1 - CORNER_INSET), b));
  } else {
    lb = sideIdx === 1 ? halfD : -halfD;
    la = Math.max(-halfW * (1 - CORNER_INSET), Math.min(halfW * (1 - CORNER_INSET), a));
  }
  doorU = u + (la * ux - lb * uy) / FRAME;
  doorV = v + (la * uy + lb * ux) / FRAME;
  bySide[sideIdx]++;
  if (!orphan) frontages.push(frontM);

  // What the ground does under the whole plan, sampled in the rect's own frame
  // so a diagonal building is measured along its own walls.
  let gLo = Infinity; let gHi = -Infinity;
  for (let p = 0; p <= 4; p++) {
    for (let q = 0; q <= 4; q++) {
      const ea = -halfW + (w * p) / 4;
      const eb = -halfD + (d * q) / 4;
      const g = groundAt(u + (ea * ux - eb * uy) / FRAME, v + (ea * uy + eb * ux) / FRAME);
      if (g < gLo) gLo = g;
      if (g > gHi) gHi = g;
    }
  }
  if (storeys > 0) {
    falls.push(gHi - gLo);
    if (gHi - gLo > steepest) { steepest = gHi - gLo; steepestIdx = i; }
  }

  // Copy the base record through untouched, then append.
  src.copy(OUT_BUF, i * OUT_STRIDE * 4, o, o + BASE.length * 4);
  const q = i * OUT_STRIDE * 4;
  if (orphan) OUT_BUF.writeFloatLE(src.readFloatLE(o + 52) + flagsOf.ORPHAN, q + 52);
  OUT_BUF.writeFloatLE(doorU, q + 56);
  OUT_BUF.writeFloatLE(doorV, q + 60);
  OUT_BUF.writeFloatLE(sideIdx, q + 64);
  OUT_BUF.writeFloatLE(frontM, q + 68);
  OUT_BUF.writeFloatLE(clsIdx, q + 72);
  OUT_BUF.writeFloatLE(groundAt(doorU, doorV), q + 76);
  OUT_BUF.writeFloatLE(gLo, q + 80);
  OUT_BUF.writeFloatLE(gHi, q + 84);

  doors.push({ u, v, rot, w, d, doorU, doorV, storeys });
  if ((i & 8191) === 0 && i) process.stdout.write(`  ${i}/${N}\r`);
}

// ── What came out ───────────────────────────────────────────────────────────

frontages.sort((a, b) => a - b);
falls.sort((a, b) => a - b);
const pct = (arr, p) => (arr.length ? arr[Math.floor(arr.length * p)] : 0);
console.log('\nfrontage   p50 %s m   p90 %s m   p99 %s m   max %s m',
  pct(frontages, 0.5).toFixed(1), pct(frontages, 0.9).toFixed(1),
  pct(frontages, 0.99).toFixed(1), (frontages[frontages.length - 1] ?? 0).toFixed(1));
console.log('by street  %s', FRONTAGE_CLASSES
  .map((c, i) => `${c} ${byClass[i]}`).join('   '));
console.log('door face  +w %d   +d %d   -w %d   -d %d', ...bySide);
// MAX_SEARCH_M bounds the ring search along each axis, so the diagonal reach is
// half as far again — which is why the furthest frontage found can exceed it.
// Saying "every structure has a street within 400 m" when one of them is at 430
// would be the sort of confident, wrong line this pipeline has been bitten by.
if (orphans) {
  console.log('%d structures found no road at all and are aimed downhill '
    + 'instead, flagged orphan', orphans);
} else {
  console.log('every structure found a street; the furthest is %s m out',
    (frontages[frontages.length - 1] ?? 0).toFixed(0));
}
console.log('ground fall across the footprint: p50 %s m   p90 %s m   p99 %s m   max %s m',
  pct(falls, 0.5).toFixed(2), pct(falls, 0.9).toFixed(2),
  pct(falls, 0.99).toFixed(2), steepest.toFixed(2));
{
  const o = steepestIdx * IN_STRIDE * 4;
  console.log('  steepest is a %s of %d x %d m at u %s v %s',
    city.structures.archetypes[src.readFloatLE(o + 40)],
    src.readFloatLE(o + 20).toFixed(0), src.readFloatLE(o + 24).toFixed(0),
    src.readFloatLE(o + 8).toFixed(4), src.readFloatLE(o + 12).toFixed(4));
}
const stepped = falls.filter((f) => f > 1.0).length;
console.log('%d of %d structures fall more than 1 m across their plan — those '
  + 'need a stepped or sunk slab, not a level one', stepped, falls.length);

// ── Write ───────────────────────────────────────────────────────────────────

city.structures.stride = OUT_STRIDE;
city.structures.fields = [...BASE, ...ADDED];
city.structures.sides = ['+width', '+depth', '-width', '-depth'];
city.structures.frontageClasses = FRONTAGE_CLASSES;
city.structures.flags = { orphan: 1 };
city.structures.doors = {
  producedBy: 'tools/maps3d-doors.mjs',
  roadSampleStepM: STEP_M,
  maxSearchM: MAX_SEARCH_M,
  orphans,
  note: 'Runs after maps3d-roads.mjs. Rewrites the record in place; the base '
    + 'fields are copied through untouched, so re-running is safe.',
};
writeFileSync(join(OUT, 'city.json'), JSON.stringify(city));
writeFileSync(join(OUT, 'city-structures.bin'), OUT_BUF);
console.log('\nwrote %s  (%s MB, %d records of %d fields)',
  join(OUT, 'city-structures.bin'), (OUT_BUF.length / 1048576).toFixed(2), N, OUT_STRIDE);
console.log('wrote %s', join(OUT, 'city.json'));

// ── Look at it ──────────────────────────────────────────────────────────────
//
// Numbers say the doors are on a face. Only a picture says they are on the
// right face, and the last time something in this pipeline was wrong for a week
// it was because nothing drew it.

const DEBUG = arg('debug', null);
if (DEBUG) {
  const [cu, cv] = DEBUG.split(',').map(Number);
  const SPAN = parseFloat(arg('debugSpan', '400')) / FRAME;
  const W = 1400;
  const img = Buffer.alloc(W * W * 3, 24);
  const px = (u, v) => [Math.round(((u - cu) / SPAN + 0.5) * W), Math.round(((v - cv) / SPAN + 0.5) * W)];
  const dot = (x, y, r, c) => {
    for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
      const X = x + k; const Y = y + j;
      if (X < 0 || Y < 0 || X >= W || Y >= W || j * j + k * k > r * r) continue;
      const o = (Y * W + X) * 3;
      img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2];
    }
  };
  const line = (x0, y0, x1, y1, c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const X = Math.round(x0 + ((x1 - x0) * s) / n);
      const Y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (X < 0 || Y < 0 || X >= W || Y >= W) continue;
      const o = (Y * W + X) * 3;
      img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2];
    }
  };
  // Roads first, then footprints, then the doors on top.
  for (let i = 0; i < SAMPLES; i++) {
    const u = pts[i * 3]; const v = pts[i * 3 + 1];
    if (Math.abs(u - cu) > SPAN || Math.abs(v - cv) > SPAN) continue;
    const [x, y] = px(u, v);
    dot(x, y, 1, [70, 70, 78]);
  }
  for (const b of doors) {
    if (Math.abs(b.u - cu) > SPAN || Math.abs(b.v - cv) > SPAN) continue;
    const th = (b.rot * Math.PI) / 180;
    const ux = Math.cos(th); const uy = Math.sin(th);
    const c = [[b.w / 2, b.d / 2], [-b.w / 2, b.d / 2], [-b.w / 2, -b.d / 2], [b.w / 2, -b.d / 2]]
      .map(([a, e]) => px(b.u + (a * ux - e * uy) / FRAME, b.v + (a * uy + e * ux) / FRAME));
    const col = b.storeys > 3 ? [120, 150, 190] : [110, 118, 112];
    for (let k = 0; k < 4; k++) line(...c[k], ...c[(k + 1) % 4], col);
    const [dx, dy] = px(b.doorU, b.doorV);
    const [bx, by] = px(b.u, b.v);
    line(bx, by, dx, dy, [90, 70, 50]);
    dot(dx, dy, 3, [235, 170, 60]);
  }
  const raw = Buffer.alloc(W * (W * 3 + 1));
  for (let y = 0; y < W; y++) {
    raw[y * (W * 3 + 1)] = 0;
    img.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const CRC = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let x = n;
      for (let k = 0; k < 8; k++) x = x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1;
      t[n] = x;
    }
    return t;
  })();
  const crc32 = (b) => {
    let x = 0xffffffff;
    for (let i = 0; i < b.length; i++) x = CRC[(x ^ b[i]) & 0xff] ^ (x >>> 8);
    return (x ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const dest = join(OUT, 'doors.png');
  writeFileSync(dest, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log('wrote %s  (%s m window on %s, %s)', dest, (SPAN * FRAME).toFixed(0), cu, cv);
}
