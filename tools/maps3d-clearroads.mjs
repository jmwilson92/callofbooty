// Takes the buildings out of the roads.
//
//   node tools/maps3d-clearroads.mjs --out out [--min-run 8] [--dry]
//
// Nothing in this pipeline ever asked whether a building was standing in a
// road. The capture supplies footprints and centrelines separately, they are
// traced by different passes, and where they disagree the building simply gets
// extruded through the carriageway. Measured against the line the decks are
// actually laid on, that is 22,212 footprints over a road — 2.2% of every
// metre of the network — and on the ground it is a wall across the street.
//
// This flags them rather than deleting them, for the same reason
// maps3d-airfields.mjs does: city-structures.bin addresses parts BY INDEX, so
// removing one part silently reassigns every interior after it. Flag 8 is the
// existing "cleared" bit and Tools/build_sandiego.py already skips it.
//
// Runs last, after every pass that can add a drivable surface, so a building on
// a bridge deck or a runway is caught by the same sweep as one in a street.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const DIR = resolve(arg('out', 'out'));
const DRY = args.includes('--dry');
// How much centreline has to run through a footprint before the footprint is
// the one that is wrong. A garage that clips a driveway by a metre is a
// tolerance problem; eight metres of road inside a building is a building in
// the road.
const MIN_RUN_M = parseFloat(arg('min-run', '8'));

const side = JSON.parse(readFileSync(join(DIR, 'sandiego.json'), 'utf8'));
const city = JSON.parse(readFileSync(join(DIR, 'city.json'), 'utf8'));
const built = JSON.parse(readFileSync(join(DIR, 'roads-built.json'), 'utf8'));
const RES = side.resolution;
const FRAME = side.frameMetres.width;
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;
const STRIDE = city.buildingStride ?? 10;
const KINDS = city.kinds ?? ['building'];

const r16 = readFileSync(join(DIR, 'sandiego.r16'));
const height = new Float32Array(RES * RES);
for (let i = 0; i < height.length; i++) {
  height[i] = LO + (r16.readUInt16LE(i * 2) / 65535) * (HI - LO);
}
const groundAt = (x, y) => height[
  Math.min(RES - 1, Math.max(0, Math.round((y / FRAME) * (RES - 1)))) * RES
  + Math.min(RES - 1, Math.max(0, Math.round((x / FRAME) * (RES - 1))))];

const bin = readFileSync(join(DIR, 'city-buildings.bin'));
const PARTS = bin.length / (STRIDE * 4);
const FLAG_WATER = 2;
const FLAG_STRUCTURE = 4;
const FLAG_CLEARED = 8;
const BLOCKER = new Set(['building', 'pad']);

// Footprints, as oriented rectangles on a grid.
const blockers = [];
for (let i = 0; i < PARTS; i++) {
  const o = i * STRIDE * 4;
  if (!BLOCKER.has(KINDS[bin.readFloatLE(o + 24) | 0])) continue;
  const flags = bin.readFloatLE(o + 28) | 0;
  if (flags & FLAG_CLEARED) continue;
  const x = bin.readFloatLE(o) * FRAME;
  const y = bin.readFloatLE(o + 4) * FRAME;
  if (!(flags & (FLAG_WATER | FLAG_STRUCTURE)) && groundAt(x, y) < 0.6) continue;
  const rot = (bin.readFloatLE(o + 8) * Math.PI) / 180;
  blockers.push({
    i, x, y, hw: bin.readFloatLE(o + 12) / 2, hd: bin.readFloatLE(o + 16) / 2,
    c: Math.cos(rot), s: Math.sin(rot), run: 0,
    kind: KINDS[bin.readFloatLE(o + 24) | 0],
  });
}

const CELL = 40;
const GRIDW = Math.ceil(FRAME / CELL) + 1;
const grid = new Map();
blockers.forEach((b, idx) => {
  const reach = Math.max(b.hw, b.hd);
  for (let r = Math.floor((b.y - reach) / CELL); r <= Math.floor((b.y + reach) / CELL); r++) {
    for (let c = Math.floor((b.x - reach) / CELL); c <= Math.floor((b.x + reach) / CELL); c++) {
      const k = r * GRIDW + c;
      let a = grid.get(k);
      if (!a) { a = []; grid.set(k, a); }
      a.push(idx);
    }
  }
});
const inside = (b, x, y) => {
  const dx = x - b.x; const dy = y - b.y;
  return Math.abs(dx * b.c + dy * b.s) <= b.hw
    && Math.abs(-dx * b.s + dy * b.c) <= b.hd;
};

// Walk every built centreline and tally how much of each runs inside a
// footprint. Tallying rather than flagging on first touch is what keeps a
// clipped corner from costing a building.
const STEP = 2.0;
let touched = 0;
for (const road of built.roads) {
  for (let i = 1; i < road.pts.length; i++) {
    const ax = road.pts[i - 1][0] * FRAME; const ay = road.pts[i - 1][1] * FRAME;
    const bx = road.pts[i][0] * FRAME; const by = road.pts[i][1] * FRAME;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const n = Math.max(1, Math.round(len / STEP));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (groundAt(x, y) < 0.6) continue;
      for (const idx of grid.get(Math.floor(y / CELL) * GRIDW + Math.floor(x / CELL)) ?? []) {
        if (!inside(blockers[idx], x, y)) continue;
        if (blockers[idx].run === 0) touched++;
        blockers[idx].run += len / n;
        break;
      }
    }
  }
}

const doomed = blockers.filter((b) => b.run >= MIN_RUN_M);
doomed.sort((a, b) => b.hw * b.hd - a.hw * a.hd);
const area = doomed.reduce((s, b) => s + b.hw * b.hd * 4, 0);
console.log('%s footprints touch a centreline; %s carry %s m or more of road '
  + 'through them and are cleared (%s ha)',
  touched.toLocaleString('en-GB'), doomed.length.toLocaleString('en-GB'),
  MIN_RUN_M, (area / 10000).toFixed(1));
if (doomed.length) {
  console.log('  largest: %s', doomed.slice(0, 5).map((b) =>
    `${(b.hw * 2).toFixed(0)}x${(b.hd * 2).toFixed(0)} m ${b.kind} `
    + `(${b.run.toFixed(0)} m of road)`).join(', '));
  // A very large footprint with a road through it is more likely a tracer
  // artefact than a genuine building in the way, and deleting a landmark is
  // not something to do quietly.
  const huge = doomed.filter((b) => b.hw * b.hd * 4 > 20000);
  if (huge.length) {
    console.log('  %s of them are over 2 ha. A road through a footprint that '
      + 'big is worth reading as a tracing disagreement rather than as a '
      + 'building in the street.', huge.length);
  }
}

if (DRY) {
  console.log('dry run — nothing written');
  process.exit(0);
}

const out = Buffer.from(bin);
for (const b of doomed) {
  const o = b.i * STRIDE * 4;
  out.writeFloatLE((out.readFloatLE(o + 28) | 0) | FLAG_CLEARED, o + 28);
}
writeFileSync(join(DIR, 'city-buildings.bin'), out);
city.clearedForRoads = {
  producedBy: 'tools/maps3d-clearroads.mjs',
  footprints: doomed.length,
  hectares: +(area / 10000).toFixed(1),
  minRunMetres: MIN_RUN_M,
  note: 'Flagged with bit 8, not removed: city-structures.bin addresses parts '
    + 'by index and deleting one would reassign every interior after it.',
};
writeFileSync(join(DIR, 'city.json'), JSON.stringify(city));
console.log('flagged %s parts with bit 8; buffer unchanged in size (%s parts)',
  doomed.length.toLocaleString('en-GB'), PARTS.toLocaleString('en-GB'));
