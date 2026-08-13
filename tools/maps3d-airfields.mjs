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
// It builds runways and their parallel taxiways only. Aprons and flight lines
// were generated here and were repeatedly wrong — on the depot rather than the
// airport, on the wrong side of a strip, on top of hangars — so they have been
// taken out and are to be placed by hand. The AIRFIELDS table is where they
// would go back: a field can carry an `aprons` list of { lat, lon, w, d, rotDeg }
// and the grade-and-pave path below will take them without further changes.
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
  parts.push([u, v, rot, w, d, h, kind, FLAG_STRUCTURE, base, 0]);

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


let runwayM = 0; let taxiM = 0;

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
}

// ── Anything standing on the pavement ───────────────────────────────────────

const struct = readFileSync(structPath);
const SS = city.structures;
const SF = Object.fromEntries(SS.fields.map((f, i) => [f, i]));
const sRd = (i, f) => struct.readFloatLE(i * SS.stride * 4 + SF[f] * 4);

// Every surface that was laid, as a segment and a half-width in metres.
const laid = [];
const movement = [];
for (const field of AIRFIELDS) {
  for (const r of field.runways) {
    const [a, b] = toLength(r);
    laid.push([a, b, r.w / 2]); movement.push([a, b, r.w / 2]);
  }
  for (const t of field.taxiways) {
    const [ta, tb] = taxiEnds(t, field);
    laid.push([ta, tb, t.w / 2]); movement.push([ta, tb, t.w / 2]);
  }
}

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

console.log('\n%s m of runway, %s m of taxiway. No aprons: they are left to be '
  + 'placed by hand.', runwayM.toFixed(0), taxiM.toFixed(0));
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
