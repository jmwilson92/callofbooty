// The runways, which the capture does not have and never did.
//
//   node tools/maps3d-airfields.mjs --out out
//
// Every other script in this pipeline recovers something the capture contains.
// This one does not, because there is nothing to recover: the capture has 147
// node families and not one of them is an aeroway. Roads_Rail, _Ferry, _Tunnel,
// _Sidewalk, _Crosswalk and _Parking exist as empty groups; runways, taxiways
// and aprons do not exist even as empty groups. San Diego International and
// North Island come through as ordinary paved service roads and anonymous
// boxes, and the flight lines are simply absent.
//
// So this is authored, and it is the only authored geometry in the pipeline.
// The alignments below are stated as data rather than buried in code precisely
// because they are the one thing here that cannot be checked against the
// capture — they come from published airfield geometry and should be corrected
// by anyone who has better numbers. Everything downstream of them is derived.
//
// It grades the terrain flat along each runway, lays the pavement, and marks it
// out. Grading matters more than the paint: a runway is the flattest 2.8 km on
// the map and the capture's TIN wanders six metres along KSAN's centreline,
// which would make an aircraft's take-off run a series of ramps.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const OUT = arg('out', arg('dir', 'out'));

// ── The alignments ──────────────────────────────────────────────────────────
//
// lat/lon of each threshold, the width, and the elevation the strip is graded
// to. AUTHORED, NOT MEASURED — see the note at the top of the file.
// A runway is a length and a heading, not two guessed corners.
//
// The first version of this table stated both thresholds by hand, and both were
// wrong in the same way: the headings came out too shallow, so every strip lay
// several degrees off its real alignment and looked it. A runway designator is
// its MAGNETIC heading rounded to ten degrees, and San Diego's magnetic
// declination is about 11 degrees east, so the true heading is the designator
// plus eleven. That is a published number and a derivation, rather than a guess
// at where a threshold sits, and it is why the strips are described this way.
//
//   09/27 magnetic 089.5  ->  true 100.5
//   18/36 magnetic 180    ->  true 191
//   11/29 magnetic 110    ->  true 121
//
// Lengths are the published figures. Midpoints are still the soft part and are
// what wants checking against a chart — but a midpoint that is fifty metres out
// shifts a runway fifty metres, where a heading that is eight degrees out
// swings its ends by two hundred.
const DECLINATION_E = 11;

const AIRFIELDS = [
  {
    name: 'San Diego International (KSAN)',
    runways: [
      {
        id: '09/27', w: 61, lengthM: 2865, magHeading: 89.5,
        mid: { lat: 32.7325, lon: -117.1897 },
      },
    ],
    // Two full-length parallel taxiways, one either side, as on the imagery —
    // the north one runs along the MCRD boundary and was missing entirely.
    // Offset is signed: positive is to the right of the take-off direction.
    taxiways: [
      { w: 23, parallelTo: '09/27', offsetM: 130, lengthM: 2700 },
      { w: 23, parallelTo: '09/27', offsetM: -150, lengthM: 2500 },
    ],
    // Both sides are flight lines: the terminals and their gates to the south,
    // the commuter and cargo ramps to the north-east. Neither is a guessed
    // rectangle — the search kept putting the terminal apron on the wrong side
    // of the runway, because the terminal area is the one place full of
    // buildings and 'clear of every building' scored it worst.
    flightLines: [
      // Corridors of 900 m put three of these on Marine Corps Recruit Depot
      // land — 32.738 N is MCRD, not the airport, and the depot's big buildings
      // are exactly the kind this looks for. The airport boundary is close to
      // the strip on both sides, so the corridors are too.
      // Measured off the strip rather than assumed. The terminals sit 139 m
      // south of the centreline, so a corridor starting at 190 found nothing at
      // all; the north-east commuter and cargo stands run 264 to 433 m out, and
      // Marine Corps Recruit Depot land begins around 580, which is where three
      // ramps wrongly went when the corridor reached 900.
      {
        ofRunway: '09/27', side: 1, fromM: 110, toM: 460,
        minAreaM2: 1800, clusterM: 260, apronDepthM: 170, minGroup: 2,
      },
      {
        ofRunway: '09/27', side: -1, fromM: 170, toM: 450,
        minAreaM2: 1500, clusterM: 260, apronDepthM: 150, minGroup: 2,
      },
    ],
  },
  {
    name: 'NAS North Island (KNZY)',
    runways: [
      {
        id: '18/36', w: 61, lengthM: 2439, magHeading: 180,
        mid: { lat: 32.6993, lon: -117.2153 },
      },
      {
        // Shifted 430 m east of the first estimate: at the original midpoint
        // the north-west end of this runway ran 400 m out into the bay, which
        // the terrain check caught before anything was built.
        id: '11/29', w: 61, lengthM: 2439, magHeading: 110,
        mid: { lat: 32.7005, lon: -117.2105 },
      },
    ],
    // The flight line is east of 18/36 on the imagery, so the taxiway is too.
    taxiways: [{ w: 23, parallelTo: '18/36', offsetM: -180, lengthM: 2200 }],
    // The squadron ramps north-east of 11/29 — HSM-35, HSM-41, HSM-73 and the
    // VRM-30 line. Rather than guess four more rectangles, these are derived
    // from the hangars the capture already contains: find the big buildings in
    // a corridor beside the runway, group them, and lay an apron in front of
    // each group with a taxiway link back to the movement area. That is what a
    // flight line is, and it cannot land on a hangar because the hangars are
    // what positioned it.
    flightLines: [{
      ofRunway: '11/29', side: -1, fromM: 85, toM: 700,
      minAreaM2: 2500, clusterM: 200, apronDepthM: 170, minGroup: 2,
    }],
  },
];

const GRADE_SHOULDER_M = 60;    // how far either side the strip is blended out
const CENTRELINE_EVERY_M = 30;  // dashes, per ICAO-ish spacing
const EDGE_LIGHT_EVERY_M = 60;
const THRESHOLD_BARS = 8;

// ── Load ────────────────────────────────────────────────────────────────────

const sidePath = join(OUT, 'sandiego.json');
const cityPath = join(OUT, 'city.json');
const binPath = join(OUT, 'city-buildings.bin');
const structPath = join(OUT, 'city-structures.bin');
const hmPath = join(OUT, 'sandiego.r16');

const side = JSON.parse(readFileSync(sidePath, 'utf8'));
const city = JSON.parse(readFileSync(cityPath, 'utf8'));
const r16 = readFileSync(hmPath);

const FRAME = side.frameMetres.width;
const RES = side.resolution;
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;
const MPS = FRAME / (RES - 1);
const M_LON = 111319.49 * side.mercatorToGround;
const M_LAT = 111319.49;
const toU = (lon) => 0.5 + ((lon - side.centre.lon) * M_LON) / FRAME;
const toV = (lat) => 0.5 - ((lat - side.centre.lat) * M_LAT) / FRAME;

const STRIDE = city.buildingStride;
const baseCount = city.airfields?.baseCount ?? city.buildingCount;
if (baseCount !== city.buildingCount) {
  console.log('truncating %d parts from an earlier pass', city.buildingCount - baseCount);
}
const bin = readFileSync(binPath).subarray(0, baseCount * STRIDE * 4);

const kinds = city.kinds.slice();
const kindOf = (name) => {
  let i = kinds.indexOf(name);
  if (i < 0) { kinds.push(name); i = kinds.length - 1; }
  return i;
};

// A runway is built over ground, not water, but it is a structure in the same
// sense a bridge deck is: the sea test must not cull it.
const FLAG_STRUCTURE = 4;
// A building standing on a runway is wrong however it got there, and something
// has to give. The pavement wins: it is the only geometry here placed on purpose
// and the only geometry an aircraft needs. Rather than delete the building —
// which would shift every index after it and break the structure record's
// partIndex — it is flagged, and the importer and both interior generators skip
// anything carrying the bit.
const FLAG_CLEARED = 8;
const parts = [];
const push = (u, v, rot, w, d, h, kind, base) =>
  parts.push([u, v, rot, w, d, h, kind, FLAG_STRUCTURE, base]);

const struct0 = readFileSync(structPath);
const SS0 = city.structures;
const SF0 = Object.fromEntries(SS0.fields.map((f, i) => [f, i]));
const SS_COUNT = SS0.count;
const sRd0 = (i, f) => struct0.readFloatLE(i * SS0.stride * 4 + SF0[f] * 4);

const heightAt = (x, y) => LO + (r16.readUInt16LE((y * RES + x) * 2) / 65535) * (HI - LO);
const setHeight = (x, y, m) => {
  const t = Math.max(0, Math.min(65535, Math.round(((m - LO) / (HI - LO)) * 65535)));
  r16.writeUInt16LE(t, (y * RES + x) * 2);
};

// ── Grade, then pave ────────────────────────────────────────────────────────

let carved = 0;
let maxCut = 0;
let maxFill = 0;

/** Flatten a strip to a straight line between two end elevations. */
function gradeStrip(a, b, halfW) {
  const au = toU(a.lon); const av = toV(a.lat);
  const bu = toU(b.lon); const bv = toV(b.lat);
  const ax = au * (RES - 1); const ay = av * (RES - 1);
  const bx = bu * (RES - 1); const by = bv * (RES - 1);
  const dx = bx - ax; const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const lenM = Math.hypot(dx, dy) * MPS;

  // The design profile is a straight line fitted to the ground along the whole
  // centreline, not a line between the two end samples. Using the ends put
  // KSAN's 2,859 m runway on a 5.7 m fall, because the eastern threshold
  // happened to land on terminal apron six metres above the strip — one bad
  // sample tilting the entire runway. A least-squares fit is not fooled by
  // either end, and the gradient is then clamped to the 1% a runway is allowed.
  const sample = (u, v) => heightAt(
    Math.min(RES - 1, Math.max(0, Math.round(u * (RES - 1)))),
    Math.min(RES - 1, Math.max(0, Math.round(v * (RES - 1)))),
  );
  const N = 200;
  let st = 0; let sh = 0; let stt = 0; let sth = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const h = sample(au + (bu - au) * t, av + (bv - av) * t);
    st += t; sh += h; stt += t * t; sth += t * h;
  }
  const n = N + 1;
  const denom = n * stt - st * st;
  let slope = denom ? (n * sth - st * sh) / denom : 0;
  const mean = sh / n;
  const maxRise = 0.01 * lenM;                 // 1%, which is the ICAO limit
  slope = Math.max(-maxRise, Math.min(maxRise, slope));
  const ea = mean - slope / 2;
  const eb = mean + slope / 2;

  const halfPx = (halfW + GRADE_SHOULDER_M) / MPS;
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - halfPx));
  const x1 = Math.min(RES - 1, Math.ceil(Math.max(ax, bx) + halfPx));
  const y0 = Math.max(0, Math.floor(Math.min(ay, by) - halfPx));
  const y1 = Math.min(RES - 1, Math.ceil(Math.max(ay, by) + halfPx));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
      const px = ax + dx * t; const py = ay + dy * t;
      const offM = Math.hypot(x - px, y - py) * MPS;
      if (offM > halfW + GRADE_SHOULDER_M) continue;
      const design = ea + (eb - ea) * t;
      // Full inside the strip, easing out across the shoulder so there is no
      // step at the edge of the airfield.
      const k = offM <= halfW ? 1
        : 1 - (offM - halfW) / GRADE_SHOULDER_M;
      const ease = k * k * (3 - 2 * k);
      const was = heightAt(x, y);
      const now = was + (design - was) * ease;
      if (now < was) maxCut = Math.max(maxCut, was - now);
      else maxFill = Math.max(maxFill, now - was);
      setHeight(x, y, now);
      carved++;
    }
  }
  return { lenM, ea, eb, au, av, bu, bv };
}

/** Lay a paved ribbon as deck parts, plus whatever markings it takes. */
function pave(g, halfW, kindName, opts = {}) {
  const K = kindOf(kindName);
  const rot = (Math.atan2((g.bv - g.av) * FRAME, (g.bu - g.au) * FRAME) * 180) / Math.PI;
  const segs = Math.max(1, Math.round(g.lenM / 40));
  for (let i = 0; i < segs; i++) {
    const t = (i + 0.5) / segs;
    push(g.au + (g.bu - g.au) * t, g.av + (g.bv - g.av) * t, rot,
      g.lenM / segs, halfW * 2, 0.12, K, 0);
  }
  if (!opts.markings) return;

  const KC = kindOf('runway_centreline');
  const dashes = Math.max(2, Math.round(g.lenM / CENTRELINE_EVERY_M));
  for (let i = 0; i < dashes; i++) {
    const t = (i + 0.5) / dashes;
    if (t < 0.03 || t > 0.97) continue;
    push(g.au + (g.bu - g.au) * t, g.av + (g.bv - g.av) * t, rot,
      CENTRELINE_EVERY_M * 0.6, 0.9, 0.14, KC, 0);
  }

  const KT = kindOf('runway_threshold');
  for (const end of [0.02, 0.98]) {
    for (let i = 0; i < THRESHOLD_BARS; i++) {
      const off = (i - (THRESHOLD_BARS - 1) / 2) * (halfW * 2 / THRESHOLD_BARS);
      const th = (rot * Math.PI) / 180;
      const nu = (-Math.sin(th) * off) / FRAME;
      const nv = (Math.cos(th) * off) / FRAME;
      push(g.au + (g.bu - g.au) * end + nu, g.av + (g.bv - g.av) * end + nv,
        rot, 30, 1.8, 0.14, KT, 0);
    }
  }

  const KL = kindOf('runway_light');
  const lights = Math.max(4, Math.round(g.lenM / EDGE_LIGHT_EVERY_M));
  for (let i = 0; i <= lights; i++) {
    const t = i / lights;
    const th = (rot * Math.PI) / 180;
    for (const s of [-1, 1]) {
      const off = s * (halfW + 2);
      push(g.au + (g.bu - g.au) * t + (-Math.sin(th) * off) / FRAME,
        g.av + (g.bv - g.av) * t + (Math.cos(th) * off) / FRAME,
        rot, 0.35, 0.35, 0.45, KL, 0);
    }
  }
}

// ── Build ───────────────────────────────────────────────────────────────────

/** Metres of clearance between two capsules; negative means they overlap. */
function segGap(a1, b1, w1, a2, b2, w2) {
  const P = (p) => [toU(p.lon) * FRAME, toV(p.lat) * FRAME];
  const [ax, ay] = P(a1); const [bx, by] = P(b1);
  const [cx, cy] = P(a2); const [dx2, dy2] = P(b2);
  let best = Infinity;
  const near = (px, py, qx, qy, rx, ry) => {
    const vx = rx - qx; const vy = ry - qy;
    const L = vx * vx + vy * vy;
    const t = L ? Math.max(0, Math.min(1, ((px - qx) * vx + (py - qy) * vy) / L)) : 0;
    return Math.hypot(px - (qx + vx * t), py - (qy + vy * t));
  };
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    best = Math.min(best, near(ax + (bx - ax) * t, ay + (by - ay) * t, cx, cy, dx2, dy2));
    best = Math.min(best, near(cx + (dx2 - cx) * t, cy + (dy2 - cy) * t, ax, ay, bx, by));
  }
  return best - w1 - w2;
}


const KA = kindOf('apron');
let runwayM = 0; let taxiM = 0; let apronM2 = 0;

/** A runway's two thresholds, from its midpoint, true heading and length. */
function toLength(r) {
  const trueHdg = (r.magHeading ?? 0) + DECLINATION_E;
  const t = (trueHdg * Math.PI) / 180;
  const half = r.lengthM / 2;
  const dn = Math.cos(t) * half;
  const de = Math.sin(t) * half;
  return [
    { lat: r.mid.lat - dn / M_LAT, lon: r.mid.lon - de / M_LON },
    { lat: r.mid.lat + dn / M_LAT, lon: r.mid.lon + de / M_LON },
  ];
}

/** A parallel taxiway, offset perpendicular from the runway it serves. */
function taxiEnds(t, field) {
  const r = field.runways.find((x) => x.id === t.parallelTo) ?? field.runways[0];
  const trueHdg = (r.magHeading ?? 0) + DECLINATION_E;
  const th = (trueHdg * Math.PI) / 180;
  const half = (t.lengthM ?? r.lengthM) / 2;
  // Perpendicular, to the right of the take-off direction.
  const pn = Math.cos(th + Math.PI / 2) * t.offsetM;
  const pe = Math.sin(th + Math.PI / 2) * t.offsetM;
  const cn = r.mid.lat + pn / M_LAT;
  const ce = r.mid.lon + pe / M_LON;
  const dn = Math.cos(th) * half;
  const de = Math.sin(th) * half;
  return [
    { lat: cn - dn / M_LAT, lon: ce - de / M_LON },
    { lat: cn + dn / M_LAT, lon: ce + de / M_LON },
  ];
}

// Where the aprons actually go.
//
// Placing an apron by hand was wrong three times running — across runway 18/36,
// then across the eastern threshold of 11/29, then on top of North Island's
// hangars. It is the one piece of geometry here with nothing to derive it from,
// so the table gives a hint and this searches outward from it for ground that
// clears every runway, sits on the fewest buildings, is on the taxiway's side
// of the runway, and is not in the bay.
const buildingXY = [];
{
  const bKinds = new Set(['building', 'pad']);
  for (let p = 0; p < baseCount; p++) {
    const o = p * STRIDE * 4;
    if (!bKinds.has(kinds[Math.round(bin.readFloatLE(o + 24))])) continue;
    buildingXY.push(bin.readFloatLE(o) * FRAME, bin.readFloatLE(o + 4) * FRAME,
      Math.max(bin.readFloatLE(o + 12), bin.readFloatLE(o + 16)) / 2);
  }
}

function apronSegment(ap) {
  const th = (ap.rotDeg * Math.PI) / 180;
  const hLon = ((ap.w / 2) * Math.cos(th)) / M_LON;
  const hLat = ((ap.w / 2) * Math.sin(th)) / M_LAT;
  return [
    { lat: ap.lat - hLat, lon: ap.lon - hLon },
    { lat: ap.lat + hLat, lon: ap.lon + hLon },
  ];
}

function placeApron(field, hint) {
  const runways = field.runways.map((r) => [...toLength(r), r.w / 2, r.id]);
  const taxi = field.taxiways.map((t) => [...taxiEnds(t, field), t.w / 2]);
  const STEP_M = 40;
  const REACH_M = 900;
  const TAXI_GAP_M = 25;
  let best = null;
  for (let dy = -REACH_M; dy <= REACH_M; dy += STEP_M) {
    for (let dx = -REACH_M; dx <= REACH_M; dx += STEP_M) {
      const cand = { ...hint, lat: hint.lat + dy / M_LAT, lon: hint.lon + dx / M_LON };
      const [a, b] = apronSegment(cand);
      let clash = false;
      for (const [ra, rb, halfW] of runways) {
        if (segGap(a, b, cand.d / 2, ra, rb, halfW) <= 0) { clash = true; break; }
      }
      if (clash) continue;

      const th = (cand.rotDeg * Math.PI) / 180;
      const ux = Math.cos(th); const uy = Math.sin(th);
      const acx = toU(cand.lon) * FRAME; const acy = toV(cand.lat) * FRAME;

      // An apron you can only reach by crossing a runway is not an apron.
      // An apron has to reach SOME taxiway without crossing a runway. Asking
      // that no taxiway be cut off was wrong the moment KSAN got one either
      // side of its runway: every position was then blocked by one of them, and
      // the search reported no clear position anywhere.
      let near = Infinity; let reachable = false;
      for (const [ta, tb, tw] of taxi) {
        const gap = segGap(a, b, cand.d / 2, ta, tb, tw);
        const tx = toU((ta.lon + tb.lon) / 2) * FRAME;
        const ty = toV((ta.lat + tb.lat) / 2) * FRAME;
        let cut = false;
        for (const [ra, rb] of runways) {
          const rx0 = toU(ra.lon) * FRAME; const ry0 = toV(ra.lat) * FRAME;
          const rx1 = toU(rb.lon) * FRAME; const ry1 = toV(rb.lat) * FRAME;
          const side2 = (px, py) => Math.sign((rx1 - rx0) * (py - ry0) - (ry1 - ry0) * (px - rx0));
          if (side2(acx, acy) && side2(tx, ty) && side2(acx, acy) !== side2(tx, ty)) cut = true;
        }
        if (cut) continue;
        reachable = true;
        near = Math.min(near, gap);
      }
      if (!reachable) continue;

      // And it has to be on land: "clear of every building" is trivially true
      // over the bay, and the search duly parked KSAN's apron in the water.
      let wet = false;
      for (let i = -3; i <= 3 && !wet; i++) {
        for (let j = -3; j <= 3; j++) {
          const su = toU(cand.lon) + ((i / 3) * (cand.w / 2) * ux - (j / 3) * (cand.d / 2) * uy) / FRAME;
          const sv = toV(cand.lat) + ((i / 3) * (cand.w / 2) * uy + (j / 3) * (cand.d / 2) * ux) / FRAME;
          const gx = Math.min(RES - 1, Math.max(0, Math.round(su * (RES - 1))));
          const gy = Math.min(RES - 1, Math.max(0, Math.round(sv * (RES - 1))));
          if (heightAt(gx, gy) < 1.0) { wet = true; break; }
        }
      }
      if (wet) continue;

      let on = 0;
      for (let i = 0; i < buildingXY.length; i += 3) {
        const px = buildingXY[i] - acx; const py = buildingXY[i + 1] - acy;
        const la = Math.abs(px * ux + py * uy); const lb = Math.abs(-px * uy + py * ux);
        const r = buildingXY[i + 2];
        if (la <= cand.w / 2 + r && lb <= cand.d / 2 + r) on++;
      }
      const score = on * 10000 + Math.abs(near - TAXI_GAP_M);
      if (!best || score < best.score) best = { cand, on, near, score, dx, dy };
    }
  }
  return best;
}

/**
 * Aprons and their taxiway links, derived from the hangars already in the
 * capture rather than placed by hand.
 *
 * Every apron before this one was a guess that had to be corrected against a
 * render — four times. The hangars are not a guess: they are surveyed buildings
 * sitting exactly where the real ramps serve them. So the ramp goes in front of
 * the hangars, which is where a ramp is, and by construction it cannot be on
 * top of one.
 */
function flightLineAprons(field) {
  const specs = field.flightLines ?? (field.flightLine ? [field.flightLine] : []);
  return specs.flatMap((spec) => oneFlightLine(field, spec));
}

function oneFlightLine(field, spec) {
  const r = field.runways.find((x) => x.id === spec.ofRunway) ?? field.runways[0];
  const [ra, rb] = toLength(r);
  const ax = toU(ra.lon) * FRAME; const ay = toV(ra.lat) * FRAME;
  const bx = toU(rb.lon) * FRAME; const by = toV(rb.lat) * FRAME;
  const L = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / L; const uy = (by - ay) / L;      // along the runway
  const nx = -uy; const ny = ux;                            // to its right

  // Hangars in the corridor, in runway coordinates.
  const hangars = [];
  for (let i = 0; i < SS_COUNT; i++) {
    const w = sRd0(i, 'widthM'); const d = sRd0(i, 'depthM');
    if (w * d < spec.minAreaM2) continue;
    if (sRd0(i, 'heightM') < 4) continue;                   // not a pad
    const px = sRd0(i, 'u') * FRAME - ax; const py = sRd0(i, 'v') * FRAME - ay;
    const t = (px * nx + py * ny) * spec.side;
    if (t < spec.fromM || t > spec.toM) continue;
    const sAlong = px * ux + py * uy;
    if (sAlong < -400 || sAlong > L + 400) continue;
    hangars.push({ s: sAlong, t, r: Math.max(w, d) / 2 });
  }
  if (!hangars.length) return [];

  // Group along the runway; a gap wider than clusterM starts a new ramp.
  hangars.sort((p, q) => p.s - q.s);
  const groups = [];
  let cur = [hangars[0]];
  for (let i = 1; i < hangars.length; i++) {
    if (hangars[i].s - cur[cur.length - 1].s > spec.clusterM) { groups.push(cur); cur = []; }
    cur.push(hangars[i]);
  }
  groups.push(cur);

  // A ramp serves a group of hangars, not a whole airfield. Left uncapped the
  // first run produced a single 1,437 m apron in front of eighteen of them,
  // which is a runway with aeroplanes parked on it, not a flight line.
  const MAX_RAMP_M = 420;
  const split = [];
  for (const g of groups) {
    const s0 = g[0].s; const s1 = g[g.length - 1].s;
    const n = Math.max(1, Math.ceil((s1 - s0) / MAX_RAMP_M));
    if (n === 1) { split.push(g); continue; }
    const cut = (s1 - s0) / n;
    for (let k = 0; k < n; k++) {
      const part = g.filter((h) => h.s >= s0 + cut * k - 1 && h.s <= s0 + cut * (k + 1) + 1);
      if (part.length) split.push(part);
    }
  }

  const out = [];
  for (const g of split) {
    if (g.length < spec.minGroup) continue;
    const s0 = Math.min(...g.map((h) => h.s - h.r));
    const s1 = Math.max(...g.map((h) => h.s + h.r));
    const tNear = Math.min(...g.map((h) => h.t - h.r));     // hangar face
    const apronOuter = tNear;                               // up against the hangars
    // Never nearer the runway than the corridor's own inner edge. Allowing
    // 0.6 of it let a ramp's capsule reach the strip, and the apron-versus-
    // runway assertion refused to build — correctly.
    const apronInner = Math.max(spec.fromM, tNear - spec.apronDepthM);
    // A narrow ramp is a real thing — some squadron lines are barely wider
    // than a rotor disc. Rejecting anything under 40 m deep threw away three of
    // North Island's four, leaving one ramp for the whole flight line.
    if (apronOuter - apronInner < 25 || s1 - s0 < 60) continue;
    out.push({ s0, s1, tIn: apronInner, tOut: apronOuter, n: g.length });
  }

  // Back to lat/lon: centre, size and bearing in the runway's own frame.
  // Negated on purpose. The frame's v axis increases southward, so a bearing
  // measured in frame coordinates has the opposite sign to one measured in
  // latitude — and apronSegment() works in lat/lon. Without the flip a ramp
  // beside a south-east runway pointed north-east instead, 62 degrees out, and
  // its capsule reached across the strip.
  const bearing = -(Math.atan2(uy, ux) * 180) / Math.PI;
  const toLL = (sM, tM) => {
    const X = ax + ux * sM + nx * tM * spec.side;
    const Y = ay + uy * sM + ny * tM * spec.side;
    return { lat: side.centre.lat - ((Y / FRAME) - 0.5) * FRAME / M_LAT,
      lon: side.centre.lon + ((X / FRAME) - 0.5) * FRAME / M_LON };
  };
  return out.map((a) => {
    const cs = (a.s0 + a.s1) / 2; const ct = (a.tIn + a.tOut) / 2;
    const c = toLL(cs, ct);
    return {
      apron: { lat: c.lat, lon: c.lon, w: a.s1 - a.s0, d: a.tOut - a.tIn, rotDeg: bearing },
      // A link from the ramp back to the movement area, square to the runway.
      // The link stops short of the runway strip rather than running onto it.
      link: [toLL(cs, a.tIn), toLL(cs, Math.max(r.w / 2 + 45, spec.fromM * 0.5))],
      hangars: a.n,
    };
  });
}

for (const field of AIRFIELDS) {
  console.log('\n%s', field.name);
  for (const r of field.runways) {
    const [ra, rb] = toLength(r);
    const g = gradeStrip(ra, rb, r.w / 2);
    pave(g, r.w / 2, 'runway', { markings: true });
    runwayM += g.lenM;
    console.log('  runway %s  %s m x %s m, true %s deg, graded %s to %s m (%s%% gradient)',
      r.id, g.lenM.toFixed(0), r.w, (r.magHeading + DECLINATION_E).toFixed(1),
      g.ea.toFixed(1), g.eb.toFixed(1),
      ((Math.abs(g.eb - g.ea) / g.lenM) * 100).toFixed(2));
  }
  for (const t of field.taxiways) {
    const [ta, tb] = taxiEnds(t, field);
    const g = gradeStrip(ta, tb, t.w / 2);
    pave(g, t.w / 2, 'taxiway');
    taxiM += g.lenM;
    console.log('  taxiway    %s m x %s m', g.lenM.toFixed(0), t.w);
  }
  field.placedAprons = [];
  field.links = [];
  for (const fl of flightLineAprons(field)) {
    const [la, lb] = fl.link;
    const [pa0, pb0] = apronSegment(fl.apron);
    const g = gradeStrip(pa0, pb0, fl.apron.d / 2);
    pave(g, fl.apron.d / 2, 'apron');
    apronM2 += fl.apron.w * fl.apron.d;
    field.placedAprons.push(fl.apron);
    const lg = gradeStrip(la, lb, 23 / 2);
    pave(lg, 23 / 2, 'taxiway');
    taxiM += lg.lenM;
    field.links.push([la, lb, 23 / 2]);
    console.log('  ramp       %s x %s m at %s, %s — %d hangars, %s m link',
      fl.apron.w.toFixed(0), fl.apron.d.toFixed(0),
      fl.apron.lat.toFixed(4), fl.apron.lon.toFixed(4), fl.hangars,
      lg.lenM.toFixed(0));
  }
  for (const hint of field.aprons ?? []) {
    const found = placeApron(field, hint);
    if (!found) {
      console.error('  no clear position for the apron within 900 m of the hint');
      process.exit(1);
    }
    const a = found.cand;
    field.placedAprons.push(a);
    // An apron is graded as a wide short strip along its own long axis.
    const [pa, pb] = apronSegment(a);
    const g = gradeStrip(pa, pb, a.d / 2);
    pave(g, a.d / 2, 'apron');
    apronM2 += a.w * a.d;
    console.log('  apron      %s x %s m, moved %s m east and %s m north of the hint',
      a.w, a.d, found.dx.toFixed(0), found.dy.toFixed(0));
    console.log('             %s, %s m clear of the nearest taxiway',
      found.on ? `${found.on} buildings still under it` : 'clear of every building',
      found.near.toFixed(0));
  }
}

// ── Anything standing on the pavement ───────────────────────────────────────

const struct = readFileSync(structPath);
const SS = city.structures;
const SF = Object.fromEntries(SS.fields.map((f, i) => [f, i]));
const sRd = (i, f) => struct.readFloatLE(i * SS.stride * 4 + SF[f] * 4);

// Every surface that was laid, as a segment and a half-width in metres — an
// apron included, since it is graded and paved exactly like a wide short strip.
// Leaving aprons out of this was the reason a taxiway kept its buildings.
const laid = [];                  // everything that gets graded and paved
const strips = [];                // runways only — see the assertion below
const movement = [];              // runways and taxiways: what must be kept clear
for (const field of AIRFIELDS) {
  for (const r of field.runways) {
    const [a, b] = toLength(r);
    laid.push([a, b, r.w / 2]); movement.push([a, b, r.w / 2]);
    strips.push([a, b, r.w / 2, `${field.name} ${r.id}`]);
  }
  for (const t of field.taxiways) {
    const [ta, tb] = taxiEnds(t, field);
    laid.push([ta, tb, t.w / 2]); movement.push([ta, tb, t.w / 2]);
  }
  for (const [la, lb, lw] of field.links ?? []) {
    laid.push([la, lb, lw]); movement.push([la, lb, lw]);
  }
  for (const ap of field.placedAprons) {
    const [a, b] = apronSegment(ap);
    laid.push([a, b, ap.d / 2]);
    // An apron across a runway is not a placement mistake to notice later, it
    // closes the airfield. Checked here rather than left to a screenshot.
    //
    // Runways only. An apron is supposed to meet its taxiway — that is how an
    // aircraft gets off it — and the first version of this check called that a
    // fault and refused to build KSAN at all.
    for (const [ma, mb, mw, mname] of strips) {
      if (segGap(a, b, ap.d / 2, ma, mb, mw) <= 0) {
        console.error('the %s apron overlaps %s — move it in the AIRFIELDS table',
          field.name, mname);
        process.exit(1);
      }
    }
  }
}

// Precompute the surfaces in frame metres once; this runs over 745,000 parts.
// Movement areas only. Clearing for aprons as well deleted the San Diego
// International terminals, which is exactly backwards: the apron is the lowest
// confidence geometry on this map and the terminals are real buildings out of
// the capture. An aircraft has to have the runway and the taxiway; it can park
// beside a building. So apron pavement is laid under whatever is already there
// and nothing is removed for it.
const surf = movement.map(([a, b, halfW]) => {
  const ax = toU(a.lon) * FRAME; const ay = toV(a.lat) * FRAME;
  const bx = toU(b.lon) * FRAME; const by = toV(b.lat) * FRAME;
  const dx = bx - ax; const dy = by - ay;
  return { ax, ay, dx, dy, len2: dx * dx + dy * dy, halfW };
});
const onPavement = (cx, cy, W, Dp, th) => {
  const ux = Math.cos(th); const uy = Math.sin(th);
  for (const s of surf) {
    for (const [ox, oy] of [[0, 0], [W / 2, Dp / 2], [-W / 2, Dp / 2],
      [-W / 2, -Dp / 2], [W / 2, -Dp / 2]]) {
      const px = cx + ox * ux - oy * uy;
      const py = cy + ox * uy + oy * ux;
      const t = Math.max(0, Math.min(1, ((px - s.ax) * s.dx + (py - s.ay) * s.dy) / s.len2));
      if (Math.hypot(px - (s.ax + s.dx * t), py - (s.ay + s.dy * t)) <= s.halfW) return true;
    }
  }
  return false;
};

// Every part, not only the buildings. Clearing buildings alone left the street
// network, its lamps and the street trees running straight across the runway —
// which looked far worse than the buildings had, and was the whole of the
// difference between "a runway" and "a dark strip with a road on it".
let clearedParts = 0;
const byKind = new Map();
for (let p = 0; p < baseCount; p++) {
  const o = p * STRIDE * 4;
  const f = bin.readFloatLE(o + 7 * 4);
  if (f & FLAG_CLEARED) bin.writeFloatLE(f - FLAG_CLEARED, o + 7 * 4);
  if (!onPavement(bin.readFloatLE(o) * FRAME, bin.readFloatLE(o + 4) * FRAME,
    bin.readFloatLE(o + 12), bin.readFloatLE(o + 16),
    (bin.readFloatLE(o + 8) * Math.PI) / 180)) continue;
  bin.writeFloatLE(bin.readFloatLE(o + 7 * 4) + FLAG_CLEARED, o + 7 * 4);
  clearedParts++;
  const k = kinds[Math.round(bin.readFloatLE(o + 24))] ?? '?';
  byKind.set(k, (byKind.get(k) ?? 0) + 1);
}

let cleared = 0; let clearedM2 = 0; let biggest = 0;
for (let i = 0; i < SS.count; i++) {
  const so = i * SS.stride * 4 + SF.flags * 4;
  // Cleared afresh each run, so moving an alignment un-clears what it no longer
  // covers instead of leaving buildings deleted by a previous guess.
  const was = struct.readFloatLE(so);
  struct.writeFloatLE(was - (was & FLAG_CLEARED ? FLAG_CLEARED : 0), so);

  const cx = sRd(i, 'u') * FRAME; const cy = sRd(i, 'v') * FRAME;
  const W = sRd(i, 'widthM'); const Dp = sRd(i, 'depthM');
  const th = (sRd(i, 'rotDeg') * Math.PI) / 180;
  const ux = Math.cos(th); const uy = Math.sin(th);
  if (!onPavement(cx, cy, W, Dp, th)) continue;

  struct.writeFloatLE(struct.readFloatLE(so) + FLAG_CLEARED, so);
  cleared++;
  clearedM2 += W * Dp;
  biggest = Math.max(biggest, W * Dp);
  // The record's rectangle is the one from before decompose() cut it up, so a
  // structure can be flagged whose individual parts were each missed above.
  const p0 = sRd(i, 'partIndex'); const pn = sRd(i, 'partCount');
  for (let p = p0; p < p0 + pn && p < baseCount; p++) {
    const fo = p * STRIDE * 4 + 7 * 4;
    const f = bin.readFloatLE(fo);
    if (!(f & FLAG_CLEARED)) { bin.writeFloatLE(f + FLAG_CLEARED, fo); clearedParts++; }
  }
}
if (clearedParts) {
  console.log('\n%d parts cleared off the pavement: %s', clearedParts,
    [...byKind].sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([k, n]) => `${k} ${n}`).join(', '));
  console.log('  of those, %d whole structures (%s ha, largest %s ha)',
    cleared, (clearedM2 / 1e4).toFixed(1), (biggest / 1e4).toFixed(2));
  if (biggest > 20000) {
    console.log('  one of them is over 2 ha — a clash that big is worth reading '
      + 'as a hint that an alignment is wrong, not just as a building in the way');
  }
} else {
  console.log('\nnothing stands on the pavement');
}

// ── Sanity, before anything is written ──────────────────────────────────────

if (LO > -10.0001 && HI < 250.0001) {
  let lo = Infinity; let hi = -Infinity;
  for (let i = 0; i < RES * RES; i++) {
    const m = LO + (r16.readUInt16LE(i * 2) / 65535) * (HI - LO);
    if (m < lo) lo = m;
    if (m > hi) hi = m;
  }
  console.log('\nheightmap now spans %s to %s m, declared range %s to %s',
    lo.toFixed(1), hi.toFixed(1), LO, HI);
  if (lo < LO - 0.01 || hi > HI + 0.01) {
    console.error('grading pushed the terrain outside the declared range — the '
      + 'import recipe would be wrong');
    process.exit(1);
  }
}

console.log('\n%s m of runway, %s m of taxiway, %s ha of apron',
  runwayM.toFixed(0), taxiM.toFixed(0), (apronM2 / 1e4).toFixed(1));
console.log('%s heightmap samples graded, cut up to %s m, filled up to %s m',
  carved.toLocaleString('en-GB'), maxCut.toFixed(1), maxFill.toFixed(1));

const add = Buffer.alloc(parts.length * STRIDE * 4);
parts.forEach((p, i) => {
  const o = i * STRIDE * 4;
  for (let f = 0; f < STRIDE; f++) add.writeFloatLE(p[f], o + f * 4);
});
writeFileSync(binPath, Buffer.concat([bin, add]));
writeFileSync(structPath, struct);
writeFileSync(hmPath, r16);

city.kinds = kinds;
city.buildingCount = baseCount + parts.length;
city.buildingFlags = {
  ...(city.buildingFlags ?? {}), structure: FLAG_STRUCTURE, cleared: FLAG_CLEARED,
};
city.structures.flags = { ...(city.structures.flags ?? {}), cleared: FLAG_CLEARED };
city.airfields = {
  producedBy: 'tools/maps3d-airfields.mjs',
  baseCount,
  parts: parts.length,
  runwayM: Math.round(runwayM),
  taxiwayM: Math.round(taxiM),
  apronHa: +(apronM2 / 1e4).toFixed(1),
  clearedStructures: cleared,
  clearedParts,
  authored: true,
  note: 'The capture contains no aeroway geometry of any kind — not even an '
    + 'empty group — so these alignments are authored from published airfield '
    + 'data rather than recovered. Correct them in the AIRFIELDS table.',
};
// Any pass that appends after this one must have its high-water mark cleared,
// or it truncates the buffer back and silently eats the runways.
delete city.vegetation;
writeFileSync(cityPath, JSON.stringify(city));

console.log('\nwrote %d parts across %d kinds; buffer now %d',
  parts.length, kinds.length, city.buildingCount);
console.log('NOTE: the alignments are authored, not measured from the capture.');
