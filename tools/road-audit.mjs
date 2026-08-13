// Checks every road on the map, rather than the ones a camera happened to face.
//
//   node tools/road-audit.mjs --out out [--worst 12] [--json audit.json]
//
// flyover.mjs can photograph any corner of the map, but there are 10,822 road
// runs and 1,067 km of carriageway: looking at all of it one frame at a time is
// not a plan. Measuring all of it is cheap. So this walks every centreline and
// asks the three questions a road can fail, in the words they were asked in:
//
//   BREAKS      — is there carriageway under every metre of the road, or are
//                 there holes you would fall through?
//   BLOCKED     — is a building standing in the road?
//   BURIED      — is the terrain higher than the road surface?
//
// It reports where, how big, and how many, and prints ready-made flyover
// commands for the worst of each so the finding can be looked at rather than
// taken on trust. It changes nothing.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const DIR = resolve(arg('out', 'out'));
const WORST = parseInt(arg('worst', '10'), 10);
// How far off the raw centreline a deck may be and still count as covering it.
// maps3d-roadmesh.mjs smooths the line with 3 Chaikin passes before laying any
// deck and does not write the smoothed line back, so the two disagree by the
// sagitta of every corner — most on the windiest class, which is footpaths.
const TOL = parseFloat(arg('tol', '2.5'));

const side = JSON.parse(readFileSync(join(DIR, 'sandiego.json'), 'utf8'));
const city = JSON.parse(readFileSync(join(DIR, 'city.json'), 'utf8'));
// The line the decks were actually laid on, not the raw traced polyline.
// maps3d-roadmesh.mjs smooths with 3 Chaikin passes before building anything,
// and measuring coverage against the unsmoothed line reported 49.0 km of holes
// where four fifths of it was this audit walking somewhere the road had never
// been. If the file is missing the answer would be wrong rather than absent, so
// this stops instead of guessing.
let roadsDoc;
try {
  roadsDoc = JSON.parse(readFileSync(join(DIR, 'roads-built.json'), 'utf8'));
} catch {
  console.error('no roads-built.json in %s — re-run tools/maps3d-roadmesh.mjs. '
    + 'Auditing against the raw roads.json measures a line the decks were never '
    + 'laid on, and reports its own smoothing as holes in the map.', DIR);
  process.exit(1);
}
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
const groundAt = (x, y) => {
  const c = Math.min(RES - 1, Math.max(0, Math.round((x / FRAME) * (RES - 1))));
  const r = Math.min(RES - 1, Math.max(0, Math.round((y / FRAME) * (RES - 1))));
  return height[r * RES + c];
};

const bin = readFileSync(join(DIR, 'city-buildings.bin'));
const PARTS = bin.length / (STRIDE * 4);

// What counts as something you can stand on, and what counts as something in
// the way. Derived from the kinds the buffer actually has, so a new kind is a
// build failure rather than a silently ignored obstacle.
const DRIVABLE = new Set(['road_deck', 'path', 'runway', 'taxiway', 'pier']);
const BLOCKER = new Set(['building', 'pad']);
const IGNORE = new Set(['line_white', 'line_yellow', 'kerb', 'lamp_post', 'lamp',
  'sign_post', 'sign', 'water', 'tree', 'tree_trunk', 'shrub', 'rock',
  'runway_centreline', 'runway_threshold', 'runway_light']);
const unclassified = KINDS.filter((k) => !DRIVABLE.has(k) && !BLOCKER.has(k)
  && !IGNORE.has(k));
if (unclassified.length) {
  console.error('kind %s is neither drivable, a blocker, nor ignored — decide '
    + 'which before trusting this audit', unclassified.join(', '));
  process.exit(1);
}

const FLAG_WATER = 2;
const FLAG_STRUCTURE = 4;
const FLAG_CLEARED = 8;

// ── Load the parts we care about into oriented rectangles ───────────────────
function loadRects(want) {
  const out = [];
  for (let i = 0; i < PARTS; i++) {
    const o = i * STRIDE * 4;
    const kind = KINDS[bin.readFloatLE(o + 24) | 0];
    if (!want.has(kind)) continue;
    const flags = bin.readFloatLE(o + 28) | 0;
    if (flags & FLAG_CLEARED) continue;
    // Match what actually reaches the level. Tools/build_sandiego.py drops a
    // part whose ground reads as sea unless it is flagged as standing over
    // water on purpose, so counting one here as carriageway would let this
    // audit report coverage the player never walks on.
    const px = bin.readFloatLE(o) * FRAME;
    const py = bin.readFloatLE(o + 4) * FRAME;
    if (!(flags & (FLAG_WATER | FLAG_STRUCTURE)) && groundAt(px, py) < 0.6) continue;
    const rot = (bin.readFloatLE(o + 8) * Math.PI) / 180;
    out.push({
      x: bin.readFloatLE(o) * FRAME,
      y: bin.readFloatLE(o + 4) * FRAME,
      hw: bin.readFloatLE(o + 12) / 2,      // half length, along heading
      hd: bin.readFloatLE(o + 16) / 2,      // half width, across it
      h: bin.readFloatLE(o + 20),
      base: bin.readFloatLE(o + 32),
      c: Math.cos(rot),
      s: Math.sin(rot),
      kind,
    });
  }
  return out;
}

const CELL = 40;
const GRIDW = Math.ceil(FRAME / CELL) + 1;
function indexRects(rects) {
  const g = new Map();
  rects.forEach((r, i) => {
    const reach = Math.max(r.hw, r.hd);
    const c0 = Math.floor((r.x - reach) / CELL);
    const c1 = Math.floor((r.x + reach) / CELL);
    const r0 = Math.floor((r.y - reach) / CELL);
    const r1 = Math.floor((r.y + reach) / CELL);
    for (let rr = r0; rr <= r1; rr++) {
      for (let cc = c0; cc <= c1; cc++) {
        const k = rr * GRIDW + cc;
        let a = g.get(k);
        if (!a) { a = []; g.set(k, a); }
        a.push(i);
      }
    }
  });
  return g;
}
const inside = (r, x, y, pad = 0) => {
  const dx = x - r.x; const dy = y - r.y;
  return Math.abs(dx * r.c + dy * r.s) <= r.hw + pad
    && Math.abs(-dx * r.s + dy * r.c) <= r.hd + pad;
};

const decks = loadRects(DRIVABLE);
const blockers = loadRects(BLOCKER);
const deckGrid = indexRects(decks);
const blockGrid = indexRects(blockers);
console.log('%s drivable parts, %s blockers, over %s road runs',
  decks.length.toLocaleString('en-GB'), blockers.length.toLocaleString('en-GB'),
  roadsDoc.roads.length.toLocaleString('en-GB'));

const at = (grid, x, y) => grid.get(Math.floor(y / CELL) * GRIDW
  + Math.floor(x / CELL)) ?? [];

// The classes that carry a carriageway. A bridge deck is built by another pass
// and a road over water is deliberately absent, so neither is a hole.
const SPEC_SKIP = new Set(['bridge']);

// ── Walk every centreline ───────────────────────────────────────────────────
const STEP = 2.0;
let stations = 0; let uncovered = 0; let blocked = 0; let buried = 0; let wet = 0;
const gaps = []; const blocks = []; const buries = [];

for (let ri = 0; ri < roadsDoc.roads.length; ri++) {
  const road = roadsDoc.roads[ri];
  if (SPEC_SKIP.has(road.cls)) continue;
  const pts = road.pts;
  let run = null;                      // an open stretch of missing carriageway

  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0] * FRAME; const ay = pts[i - 1][1] * FRAME;
    const bx = pts[i][0] * FRAME; const by = pts[i][1] * FRAME;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const n = Math.max(1, Math.round(len / STEP));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      // A centreline over water is not a hole. maps3d-roadmesh.mjs deliberately
      // lays no deck there and maps3d-bridges.mjs builds one on piles after the
      // bay is dug, so counting these would bury the real breaks under 1,046
      // legitimate ones — and the first run of this audit did exactly that.
      if (groundAt(x, y) < 0.6) { wet++; continue; }
      stations++;

      // BREAKS. Chaikin moved the centreline this is walking by up to a few
      // metres on a tight corner, so a station is judged covered if any deck
      // reaches it within a small tolerance — otherwise every bend reads as a
      // hole and the real ones drown.
      // Two different questions, two different tolerances, and conflating them
      // is a bug this audit shipped once. For BREAKS the question is "is there
      // carriageway near here", and Chaikin moved the centreline by a couple of
      // metres, so a slack tolerance is right. For BURIED the question is "is
      // the ground above the deck I am standing on", and a slack tolerance
      // finds a neighbouring road's deck instead — which on a bluff can be 20 m
      // below, making terrain look 21 m too high when nothing is wrong.
      let cover = null;                 // near enough to count as covered
      let under = null;                 // strictly beneath this station
      for (const j of at(deckGrid, x, y)) {
        const d = decks[j];
        if (!cover && inside(d, x, y, TOL)) cover = d;
        if (!under && inside(d, x, y, 0)) under = d;
        if (cover && under) break;
      }
      if (!cover) {
        uncovered++;
        if (run) { run.len += STEP; run.x = x; run.y = y; }
        else run = { cls: road.cls, x0: x, y0: y, x, y, len: STEP };
      } else if (run) {
        if (run.len >= 6) gaps.push(run);
        run = null;
      }

      // BLOCKED. A building standing where the carriageway is. Judged at the
      // centreline rather than across the full width, because a footprint that
      // clips a verge is a garden wall and a footprint over the centreline is a
      // house in the road.
      if (cover) {
        for (const j of at(blockGrid, x, y)) {
          const b = blockers[j];
          if (!inside(b, x, y)) continue;
          blocked++;
          blocks.push({ cls: road.cls, x, y, kind: b.kind, w: b.hw * 2, d: b.hd * 2, h: b.h });
          break;
        }

        // BURIED. Terrain standing higher than the road surface, sampled INSIDE
        // the carriageway rather than at the kerb line. The first version of
        // this test sampled at the kerb and reported 4.9% of the network, but
        // most of that was roads in cuttings — ground rising at the kerb of a
        // road cut into a hillside is a retaining face, which is correct, not a
        // defect. What is never correct is ground standing above the surface
        // where the wheels go, so that is what is measured.
        const top = under ? groundAt(under.x, under.y) + under.base + under.h : null;
        const nx = under ? -under.s : 0; const ny = under ? under.c : 0;
        for (const f of top === null ? [] : [-0.6, -0.3, 0, 0.3, 0.6]) {
          const px = x + nx * f * under.hd;
          const py = y + ny * f * under.hd;
          const g = groundAt(px, py);
          if (g > top + 0.30) {
            buried++;
            buries.push({ cls: road.cls, x, y, over: g - top });
            break;
          }
        }
      }
    }
  }
  if (run && run.len >= 6) gaps.push(run);
}

// ── Report ──────────────────────────────────────────────────────────────────
const pct = (n) => ((n / Math.max(1, stations)) * 100).toFixed(2);
const km = (m) => (m / 1000).toFixed(1);
console.log('\nwalked %s stations at %s m over %s km of dry centreline (%s km '
  + 'more is over water, where a missing deck is the bridge pass\'s job)\n',
  stations.toLocaleString('en-GB'), STEP, km(stations * STEP), km(wet * STEP));

gaps.sort((a, b) => b.len - a.len);
const gapM = gaps.reduce((s, g) => s + g.len, 0);
console.log('BREAKS   %s stations with no carriageway (%s%%), in %s gaps of 6 m '
  + 'or more, %s km total', uncovered.toLocaleString('en-GB'), pct(uncovered),
  gaps.length.toLocaleString('en-GB'), km(gapM));
if (gaps.length) {
  const byCls = {};
  for (const g of gaps) byCls[g.cls] = (byCls[g.cls] ?? 0) + 1;
  console.log('         by class: %s', Object.entries(byCls)
    .sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
  console.log('         longest: %s', gaps.slice(0, 6)
    .map((g) => `${g.len.toFixed(0)} m (${g.cls})`).join(', '));
}

blocks.sort((a, b) => b.w * b.d - a.w * a.d);
console.log('\nBLOCKED  %s stations with a building over the carriageway (%s%%)',
  blocked.toLocaleString('en-GB'), pct(blocked));
if (blocks.length) {
  const seen = new Set();
  const uniq = blocks.filter((b) => {
    const k = `${Math.round(b.x)},${Math.round(b.y)}`;
    if (seen.has(k)) return false; seen.add(k); return true;
  });
  console.log('         %s distinct footprints, largest %s',
    uniq.length.toLocaleString('en-GB'), uniq.slice(0, 4)
      .map((b) => `${b.w.toFixed(0)}x${b.d.toFixed(0)} m ${b.kind}`).join(', '));
}

buries.sort((a, b) => b.over - a.over);
console.log('\nBURIED   %s stations with ground above the road surface (%s%%)',
  buried.toLocaleString('en-GB'), pct(buried));
if (buries.length) {
  console.log('         deepest: %s', buries.slice(0, 6)
    .map((b) => `${b.over.toFixed(1)} m (${b.cls})`).join(', '));
}

// Ready-made cameras for the worst of each, because a finding nobody looks at
// is a finding nobody fixes.
const shot = (name, o, eye, tilt) => ({
  name, u: o.x / FRAME, v: o.y / FRAME, eye, look: 0, tilt, fov: 70,
});
const worst = [];
gaps.slice(0, WORST).forEach((g, i) => worst.push(shot(`break-${i}-${g.cls}`, g, 45, -25)));
blocks.slice(0, Math.min(4, WORST)).forEach((b, i) => worst.push(shot(`blocked-${i}`, b, 60, -30)));
buries.slice(0, Math.min(4, WORST)).forEach((b, i) => worst.push(shot(`buried-${i}`, b, 35, -20)));
const outJson = arg('json', null);
if (outJson) {
  writeFileSync(resolve(outJson), JSON.stringify(worst, null, 1));
  console.log('\nwrote %s cameras to %s — render them with:\n  node '
    + 'tools/flyover.mjs --out %s --shots %s', worst.length, outJson, DIR, outJson);
}

// A road with holes in it is not finished, so this is a build failure rather
// than a note in a log. The threshold is deliberately not zero: a stretch over
// water waiting for maps3d-bridges.mjs is a legitimate absence.
const HOLE_BUDGET = 0.5;
if (parseFloat(pct(uncovered)) > HOLE_BUDGET) {
  console.error('\n%s%% of the network has no carriageway under it, over a '
    + 'budget of %s%%', pct(uncovered), HOLE_BUDGET);
  process.exit(1);
}
