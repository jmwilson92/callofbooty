// Lifts the bridges off the ground and stands them on piers.
//
//   node tools/maps3d-bridges.mjs --out out
//
// The recovered centrelines carry no elevation of their own. Every road in
// roads.json takes its height from the heightmap under it, which is right for
// a street and wrong for a bridge: it laid every span flat on the water it was
// supposed to cross. Once maps3d-water.mjs dug the bays out to -9 m, those
// spans were left lying on the seabed.
//
// A NOTE ON WHAT IS NOT HERE. The capture's road layer has holes in it over
// water — the Coronado bridge comes through as a 442 m fragment in the middle
// of the bay, and the other 3 km of it is simply not in the file. An earlier
// version of this script extended dangling spans along their own heading until
// they made landfall and snapped them to the nearest road end. It reconnected
// 15 ends and reconstructed 9.2 km of bridge, and rendering it showed the
// extrapolation running off across open water nowhere near the real alignment.
// Fabricated road in the wrong place is worse than missing road, so that came
// back out. The fragment is built where the capture puts it, and the gap is
// reported rather than guessed at.
//
// So bridges are built here instead of in maps3d-roadmesh.mjs, and this runs
// AFTER the water. That ordering is the whole point. A part's elevation in the
// packed buffer is relative to the terrain under it, so anything built before
// the dig would sink by however much the dig removed — twelve metres, in the
// middle of the bay. Built afterwards, the ground under each pier is the
// ground the game will actually sample.
//
// The profile is a ramp, a level span and a ramp back down, clamped so it never
// cuts into a hillside and always comes back down to meet the roads at either
// end. Clearance is earned by how much water is being crossed and bounded by
// how much span there is to climb in: a creek gets 4.5 m, and a span long
// enough to hold 6% over half its length can reach 58.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const OUT = arg('out', 'out');

const DECK_M = 14;            // step along the centreline, as in the road mesh
const DECK_THICK = 0.30;
const MARK_W = 0.14;
const MARK_H = 0.02;
const PARAPET_H = 0.95;
const PARAPET_W = 0.40;
const PIER_SPACING_M = 45;
const PIER_W = 3.0;
const PIER_MIN_GAP = 2.5;     // deck-to-ground gap that earns a pier
const PIER_FOOT_M = 14;       // buried below the bed, so nothing floats
const CLEAR_MIN_M = 4.5;
const CLEAR_MAX_M = 58.0;
const CLEAR_PER_M = 0.028;    // clearance per metre of water spanned
const MAX_GRADE = 0.06;       // 6% on the approaches
const DECK_OVER_GROUND = 0.35;
const WET_M = 0.3;            // ground below this is water, post-dig
const JETTY_MIN_M = 40;       // a wet run this long on an ordinary road is a
                              // jetty, not a mistake worth ignoring
const JETTY_CLEAR_M = 1.5;    // a boat dock rides just above the water
const JETTY_PAD = 2;          // steps of dry road either side, to land on

const side = JSON.parse(readFileSync(join(OUT, 'sandiego.json'), 'utf8'));
const RES = side.resolution;
const FRAME = side.frameMetres.width;
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;

const r16 = readFileSync(join(OUT, 'sandiego.r16'));
const groundAt = (u, v) => {
  const c = Math.min(RES - 1, Math.max(0, Math.round(u * (RES - 1))));
  const r = Math.min(RES - 1, Math.max(0, Math.round(v * (RES - 1))));
  return LO + (r16.readUInt16LE((r * RES + c) * 2) / 65535) * (HI - LO);
};

const roadsDoc = JSON.parse(readFileSync(join(OUT, 'roads.json'), 'utf8'));
const cityPath = join(OUT, 'city.json');
const city = JSON.parse(readFileSync(cityPath, 'utf8'));
const STRIDE = city.buildingStride;
const binPath = join(OUT, city.buildingFile);

// Re-running replaces the last pass. Vegetation appends after this one, so its
// own baseCount moves too — which is why maps3d.md has them in this order.
const baseCount = city.bridges?.baseCount ?? city.buildingCount;
if (baseCount !== city.buildingCount) {
  console.log('truncating %d parts from an earlier pass', city.buildingCount - baseCount);
}
const bin = readFileSync(binPath).subarray(0, baseCount * STRIDE * 4);

const kinds = city.kinds.slice();
const kindIndex = (name) => {
  let i = kinds.indexOf(name);
  if (i < 0) { kinds.push(name); i = kinds.length - 1; }
  return i;
};
const K_DECK = kindIndex('road_deck');
const K_YELLOW = kindIndex('line_yellow');
const K_WHITE = kindIndex('line_white');
const K_PARAPET = kindIndex('kerb');
const K_PIER = kindIndex('pier');

function walk(pts, stepM) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0] * FRAME; const ay = pts[i - 1][1] * FRAME;
    const bx = pts[i][0] * FRAME; const by = pts[i][1] * FRAME;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const n = Math.max(1, Math.round(len / stepM));
    const dir = [(bx - ax) / len, (by - ay) / len];
    for (let s = 0; s < n; s++) {
      const t = (s + 0.5) / n;
      out.push({
        x: ax + (bx - ax) * t,
        y: ay + (by - ay) * t,
        len: len / n,
        nrm: [-dir[1], dir[0]],
        head: (Math.atan2(dir[1], dir[0]) * 180) / Math.PI,
      });
    }
  }
  return out;
}

const parts = [];
const push = (u, v, rot, w, d, h, base, kind) =>
  parts.push([u, v, rot, w, d, h, kind, 0, base]);

// What gets built here: every road classed as a bridge, plus any run of any
// other road that ends up over water once the bay is dug. The second case is
// the marinas — 1.5 km of service road and boardwalk on Shelter Island and the
// Embarcadero that the capture has running straight out over the water. Left
// alone they lie on the seabed, which is worse than a bridge lying on the bay.
// Chain the bridge runs before profiling them.
//
// The tracer splits a run wherever the skeleton branches, so the Coronado
// bridge arrives as a handful of pieces laid end to end. Each piece is a
// perfectly good centreline, but the deck profile is computed per run — ramp
// up, level, ramp down — so building them separately gives a roller-coaster
// with a dip at every seam. Joined first, the whole crossing gets one profile.
const CHAIN_GAP_M = 150;
// Over open water the rule can be much looser. Two bridge ends a few hundred
// metres apart, both over the bay, pointing at each other, are the same bridge
// — there is nothing else out there for them to be. On land the same gap would
// weld a slip road to whatever happened to end near it.
const CHAIN_GAP_WET_M = 420;
const CHAIN_COS = Math.cos((70 * Math.PI) / 180);
function chainBridges(roads) {
  const runs = roads.map((r) => ({ ...r, pts: r.pts.slice() }));
  const heading = (pts, end) => {
    const n = pts.length;
    const k = Math.min(4, n - 1);
    const a = end ? pts[n - 1 - k] : pts[k];
    const b = end ? pts[n - 1] : pts[0];
    const dx = (b[0] - a[0]) * FRAME; const dy = (b[1] - a[1]) * FRAME;
    const len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  };
  const alive = runs.map(() => true);
  let joins = 0;
  for (let pass = 0; pass < 8; pass++) {
    let made = false;
    for (let i = 0; i < runs.length; i++) {
      if (!alive[i]) continue;
      for (const endA of [0, 1]) {
        const A = runs[i];
        const tipA = endA ? A.pts[A.pts.length - 1] : A.pts[0];
        const tA = heading(A.pts, endA);
        let best = null; let bestScore = -1;
        for (let j = 0; j < runs.length; j++) {
          if (j === i || !alive[j]) continue;
          for (const endB of [0, 1]) {
            const B = runs[j];
            const tipB = endB ? B.pts[B.pts.length - 1] : B.pts[0];
            const gap = Math.hypot((tipB[0] - tipA[0]) * FRAME,
              (tipB[1] - tipA[1]) * FRAME);
            const overWater = groundAt(tipA[0], tipA[1]) < WET_M
              && groundAt(tipB[0], tipB[1]) < WET_M;
            const limit = overWater ? CHAIN_GAP_WET_M : CHAIN_GAP_M;
            if (gap > limit) continue;
            const tB = heading(B.pts, endB);
            const cc = -(tA[0] * tB[0] + tA[1] * tB[1]);
            if (cc < CHAIN_COS) continue;
            const score = cc - (gap / limit) * 0.2;
            if (score > bestScore) { bestScore = score; best = { j, endB }; }
          }
        }
        if (!best) continue;
        const B = runs[best.j];
        const pa = endA ? runs[i].pts : runs[i].pts.slice().reverse();
        const pb = best.endB ? B.pts.slice().reverse() : B.pts;
        runs[i].pts = pa.concat(pb);
        runs[i].w = Math.max(runs[i].w, B.w);
        alive[best.j] = false;
        joins++;
        made = true;
      }
    }
    if (!made) break;
  }
  const out = runs.filter((_, i) => alive[i]);
  console.log('chained %d bridge runs into %d by joining %d ends',
    roads.length, out.length, joins);
  return out;
}
const chained = chainBridges(roadsDoc.roads.filter((r) => r.cls === 'bridge'));
const allRoads = roadsDoc.roads.filter((r) => r.cls !== 'bridge').concat(chained);

const jobs = [];
for (const road of allRoads) {
  const steps = walk(road.pts, DECK_M);
  if (steps.length < 2) continue;
  const ground = steps.map((s) => groundAt(s.x / FRAME, s.y / FRAME));
  if (road.cls === 'bridge') {
    jobs.push({ road, steps, ground, from: 0, to: steps.length - 1, jetty: false });
    continue;
  }
  let i = 0;
  while (i < steps.length) {
    if (ground[i] >= WET_M) { i++; continue; }
    let j = i; let run = 0;
    while (j < steps.length && ground[j] < WET_M) { run += steps[j].len; j++; }
    if (run >= JETTY_MIN_M) {
      jobs.push({
        road,
        steps,
        ground,
        from: Math.max(0, i - JETTY_PAD),
        to: Math.min(steps.length - 1, j - 1 + JETTY_PAD),
        jetty: true,
      });
    }
    i = j;
  }
}
const bridges = chained;
let deckN = 0; let markN = 0; let parapetN = 0; let pierN = 0;
let overWater = 0; let dryOnly = 0;
let tallest = 0; let longest = null;
const spans = [];

let jettyN = 0;
for (const job of jobs) {
  const { road, jetty } = job;
  const steps = job.steps.slice(job.from, job.to + 1);
  const ground = job.ground.slice(job.from, job.to + 1);
  if (steps.length < 2) continue;

  let span = 0; let wetSpan = 0;
  for (let i = 0; i < steps.length; i++) {
    span += steps[i].len;
    if (ground[i] < WET_M) wetSpan += steps[i].len;
  }
  if (jetty) jettyN++;
  else if (wetSpan > 0) overWater++;
  else dryOnly++;

  // A deck cannot climb faster than MAX_GRADE, and both ends have to come back
  // down to meet the roads they join. So the clearance that can actually be
  // reached is bounded by half the span — and the climb does not need dry land
  // under it, which is the point: a long crossing earns its own height over the
  // water. Asking for more than the span can deliver puts a cliff at the
  // abutment instead of a bridge.
  let dryA = 0;
  for (let i = 0; i < steps.length && ground[i] >= WET_M; i++) dryA += steps[i].len;
  let dryB = 0;
  for (let i = steps.length - 1; i >= 0 && ground[i] >= WET_M; i--) dryB += steps[i].len;
  const approach = Math.min(dryA, dryB);
  const reachable = MAX_GRADE * (span / 2) * 0.9;
  let clearance = 0;
  if (jetty) {
    // A jetty does not ramp. It sits just above the water for its whole length
    // and stands on piles, which is what a jetty is.
    clearance = JETTY_CLEAR_M;
  } else if (wetSpan > 0) {
    clearance = Math.min(CLEAR_MAX_M, Math.max(CLEAR_MIN_M, wetSpan * CLEAR_PER_M));
    clearance = Math.min(clearance, Math.max(CLEAR_MIN_M, reachable));
  }

  // What the deck has to be, at minimum, at each step: clear of the water
  // where there is water, just off the ground where there is not.
  const n = steps.length;
  const profile = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    profile[i] = ground[i] < WET_M ? clearance : ground[i] + DECK_OVER_GROUND;
  }

  // Slope-limited dilation, forward then back. Whatever the span needs at its
  // highest point propagates outwards at no more than MAX_GRADE, which is what
  // turns a required clearance into a ramp without anyone having to pick where
  // the ramp starts.
  for (let i = 1; i < n; i++) {
    profile[i] = Math.max(profile[i], profile[i - 1] - MAX_GRADE * steps[i].len);
  }
  for (let i = n - 2; i >= 0; i--) {
    profile[i] = Math.max(profile[i], profile[i + 1] - MAX_GRADE * steps[i].len);
  }

  // A short average takes the corners off, and then the ground clearance is
  // reasserted so the smoothing cannot bury the deck in a hillside.
  const R = 3;
  const sm = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0; let k = 0;
    for (let j = Math.max(0, i - R); j <= Math.min(n - 1, i + R); j++) {
      sum += profile[j]; k++;
    }
    sm[i] = sum / k;
  }
  const target = new Float64Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    target[i] = Math.max(sm[i], ground[i] + DECK_OVER_GROUND);
    peak = Math.max(peak, target[i] - ground[i]);
  }
  spans.push({ span, wetSpan, clearance, peak, approach, jetty });
  if (peak > tallest) { tallest = peak; longest = { span, wetSpan, clearance }; }

  const halfW = road.w / 2;
  const pierEvery = jetty ? 22 : PIER_SPACING_M;
  const pierW = jetty ? 0.9 : PIER_W;
  let sincePier = pierEvery;   // one at the first step that needs it
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const u = s.x / FRAME; const v = s.y / FRAME;
    const lift = target[i] - ground[i];

    push(u, v, s.head, s.len + 0.6, road.w, DECK_THICK, lift, K_DECK);
    deckN++;

    const markBase = lift + DECK_THICK + MARK_H;
    const offsetPart = (offM, w, len, kind) => {
      push((s.x + s.nrm[0] * offM) / FRAME, (s.y + s.nrm[1] * offM) / FRAME,
        s.head, len, w, MARK_H, markBase, kind);
      markN++;
    };
    offsetPart(0, MARK_W, s.len + 0.4, K_YELLOW);
    offsetPart(-(halfW - 0.35), MARK_W, s.len + 0.4, K_WHITE);
    offsetPart(halfW - 0.35, MARK_W, s.len + 0.4, K_WHITE);

    // A bridge without a parapet is a diving board. These are what the road
    // mesh leaves off for this class, on the grounds that a bridge has no kerb.
    for (const sgn of [-1, 1]) {
      const off = sgn * (halfW + PARAPET_W / 2);
      push((s.x + s.nrm[0] * off) / FRAME, (s.y + s.nrm[1] * off) / FRAME,
        s.head, s.len + 0.4, PARAPET_W, PARAPET_H, lift + DECK_THICK, K_PARAPET);
      parapetN++;
    }

    sincePier += s.len;
    if (lift > (jetty ? 0.8 : PIER_MIN_GAP) && sincePier >= pierEvery) {
      sincePier = 0;
      // The pier reaches from well under the bed up to the deck's underside.
      // Its base is negative, so nothing sinks it and the top stays put.
      push(u, v, s.head, pierW, pierW, lift + PIER_FOOT_M, -PIER_FOOT_M,
        K_PIER);
      pierN++;
    }
  }
}

spans.sort((a, b) => b.peak - a.peak);
console.log('%d bridges: %d cross water, %d are dry overpasses. Plus %d jetty '
  + 'runs lifted off the seabed on other roads.',
  bridges.length, overWater, dryOnly, jettyN);
console.log('\n%s %s %s %s %s', 'span m'.padStart(9), 'over water'.padStart(11),
  'approach'.padStart(9), 'clearance'.padStart(10),
  'deck above ground'.padStart(18));
const wetOnes = spans.filter((b) => b.wetSpan > 0 && !b.jetty)
  .sort((a, b) => b.wetSpan - a.wetSpan);
for (const b of wetOnes.slice(0, 6)) {
  console.log('%s %s %s %s %s', b.span.toFixed(0).padStart(9),
    b.wetSpan.toFixed(0).padStart(11), b.approach.toFixed(0).padStart(9),
    b.clearance.toFixed(1).padStart(10), b.peak.toFixed(1).padStart(18));
}
console.log('  -- the rest, by how far the deck stands off the ground --');
for (const b of spans.slice(0, 6)) {
  console.log('%s %s %s %s %s', b.span.toFixed(0).padStart(9),
    b.wetSpan.toFixed(0).padStart(11), b.approach.toFixed(0).padStart(9),
    b.clearance.toFixed(1).padStart(10), b.peak.toFixed(1).padStart(18));
}
if (!bridges.length) {
  console.log('no roads classed as bridge — nothing built. Check roads.json.');
}
console.log('\n%d deck segments, %d markings, %d parapet pieces, %d piers',
  deckN, markN, parapetN, pierN);
if (deckN && !pierN) {
  console.log('  ^ every deck sits within %s m of the ground, so none needed a '
    + 'pier. That is suspicious on a coast.', PIER_MIN_GAP);
}

const add = Buffer.alloc(parts.length * STRIDE * 4);
for (let i = 0; i < parts.length; i++) {
  for (let k = 0; k < STRIDE; k++) {
    add.writeFloatLE(parts[i][k], (i * STRIDE + k) * 4);
  }
}
writeFileSync(binPath, Buffer.concat([bin, add]));

city.kinds = kinds;
city.buildingCount = baseCount + parts.length;
city.bridges = {
  producedBy: 'tools/maps3d-bridges.mjs',
  baseCount,
  parts: parts.length,
  count: bridges.length,
  overWater,
  dryOverpasses: dryOnly,
  jettyRuns: jettyN,
  deck: deckN,
  markings: markN,
  parapets: parapetN,
  piers: pierN,
  tallestDeckAboveGroundM: +tallest.toFixed(1),
  note: 'Runs after maps3d-water.mjs. Part elevations are relative to the '
    + 'terrain under them, so a bridge built before the dig would sink with '
    + 'the bed it spans. The capture\'s road layer is incomplete over water: '
    + 'the Coronado bridge is present only as a 442 m fragment mid-bay. Spans '
    + 'are built where the capture puts them and gaps are not extrapolated.',
};
if (longest) city.bridges.tallest = longest;

// Anything appended after this pass has just been truncated away with the old
// bridges, so its high-water mark is a lie now. Leaving it in place is what
// silently ate the bridge on the last run: vegetation read a baseCount from a
// previous cycle, truncated the buffer back to it, and took the new deck with
// it. The count was still right in the log, and the bridge was gone.
delete city.vegetation;
writeFileSync(cityPath, JSON.stringify(city));

console.log('%d parts appended, %d in the plan', parts.length, city.buildingCount);
