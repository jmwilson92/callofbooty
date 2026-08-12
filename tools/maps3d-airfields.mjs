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
const AIRFIELDS = [
  {
    name: 'San Diego International (KSAN)',
    runways: [
      {
        id: '09/27', w: 61,
        a: { lat: 32.7335, lon: -117.2050 },
        b: { lat: 32.7325, lon: -117.1745 },
      },
    ],
    // Taxiway parallel to the runway on the terminal side, and the apron.
    taxiways: [
      { w: 23, a: { lat: 32.7322, lon: -117.2040 }, b: { lat: 32.7312, lon: -117.1760 } },
    ],
    aprons: [
      { lat: 32.7305, lon: -117.1930, w: 620, d: 240, rotDeg: 2 },
    ],
  },
  {
    name: 'NAS North Island (KNZY)',
    runways: [
      // 8,002 ft = 2,439 m, which is the figure worth trusting here; the
      // thresholds are the part that wants checking against a real chart.
      {
        id: '18/36', w: 61, lengthM: 2439,
        a: { lat: 32.7078, lon: -117.2148 },
        b: { lat: 32.6908, lon: -117.2148 },
      },
      {
        id: '11/29', w: 61,
        a: { lat: 32.7042, lon: -117.2222 },
        b: { lat: 32.6968, lon: -117.2028 },
      },
    ],
    taxiways: [
      { w: 23, a: { lat: 32.7072, lon: -117.2108 }, b: { lat: 32.6914, lon: -117.2108 } },
    ],
    // North of runway 11/29 and east of the parallel taxiway. At -117.2105 it
    // straddled 18/36; at 32.6975 it swallowed the eastern threshold of 11/29.
    // Both were obvious in a render and invisible in every count, which is why
    // there is now an assertion below that an apron may not touch a runway.
    aprons: [
      { lat: 32.7035, lon: -117.2060, w: 500, d: 250, rotDeg: 0 },
    ],
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

/** Stretch a runway about its midpoint to a published length. */
function toLength(r) {
  if (!r.lengthM) return [r.a, r.b];
  const mid = { lat: (r.a.lat + r.b.lat) / 2, lon: (r.a.lon + r.b.lon) / 2 };
  const dLat = (r.b.lat - r.a.lat) * M_LAT;
  const dLon = (r.b.lon - r.a.lon) * M_LON;
  const have = Math.hypot(dLat, dLon);
  if (!have) return [r.a, r.b];
  const k = r.lengthM / have / 2;
  return [
    { lat: mid.lat - (r.b.lat - r.a.lat) * k, lon: mid.lon - (r.b.lon - r.a.lon) * k },
    { lat: mid.lat + (r.b.lat - r.a.lat) * k, lon: mid.lon + (r.b.lon - r.a.lon) * k },
  ];
}

// Where the aprons actually go.
//
// Placing an apron by hand has now been wrong three times: across runway 18/36,
// then across the threshold of 11/29, then on top of North Island's hangars. It
// is the one piece of geometry here with nothing to derive it from, and guessing
// it repeatedly is not a method. So the table gives a hint and this searches
// outward from it for a position that clears every runway and sits on the
// fewest buildings, preferring to stay near a taxiway — which is where an apron
// belongs, since that is how an aircraft gets on and off it.
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
  const taxi = field.taxiways.map((t) => [t.a, t.b, t.w / 2]);
  const STEP_M = 40;
  const REACH_M = 900;
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

      // Buildings whose footprint circle reaches inside the apron rectangle.
      const cx = toU(cand.lon) * FRAME; const cy = toV(cand.lat) * FRAME;
      const th = (cand.rotDeg * Math.PI) / 180;
      const ux = Math.cos(th); const uy = Math.sin(th);
      let on = 0;
      for (let i = 0; i < buildingXY.length; i += 3) {
        const px = buildingXY[i] - cx; const py = buildingXY[i + 1] - cy;
        const la = Math.abs(px * ux + py * uy); const lb = Math.abs(-px * uy + py * ux);
        const r = buildingXY[i + 2];
        if (la <= cand.w / 2 + r && lb <= cand.d / 2 + r) on++;
      }
      // An apron you can only reach by crossing a runway is not an apron. The
      // first search put KSAN's on the north side while its taxiway is south,
      // 174 m away as the crow flies and across the 09/27 strip in practice.
      let near = Infinity; let blocked = false;
      const acx = toU(cand.lon) * FRAME; const acy = toV(cand.lat) * FRAME;
      for (const [ta, tb, tw] of taxi) {
        near = Math.min(near, segGap(a, b, cand.d / 2, ta, tb, tw));
        const t0 = { lat: (ta.lat + tb.lat) / 2, lon: (ta.lon + tb.lon) / 2 };
        const tx = toU(t0.lon) * FRAME; const ty = toV(t0.lat) * FRAME;
        for (const [ra, rb] of runways) {
          const rx0 = toU(ra.lon) * FRAME; const ry0 = toV(ra.lat) * FRAME;
          const rx1 = toU(rb.lon) * FRAME; const ry1 = toV(rb.lat) * FRAME;
          const side = (px, py) => Math.sign((rx1 - rx0) * (py - ry0) - (ry1 - ry0) * (px - rx0));
          if (side(acx, acy) && side(tx, ty) && side(acx, acy) !== side(tx, ty)) blocked = true;
        }
      }
      if (blocked) continue;

      // And it has to be on land. "Clear of every building" is trivially true
      // over the bay, and the search duly parked San Diego International's
      // apron in the water — the one place with no buildings for 600 m.
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
      // Abut the taxiway, do not swallow it. Scoring the gap as max(0, near)
      // made overlap free, and the search happily buried 131 m of taxiway under
      // the apron. Aiming at a small positive gap puts the apron alongside.
      const TAXI_GAP_M = 25;
      const score = on * 10000 + Math.abs(near - TAXI_GAP_M);
      if (!best || score < best.score) best = { cand, on, near, score, dx, dy };
    }
  }
  return best;
}

for (const field of AIRFIELDS) {
  console.log('\n%s', field.name);
  for (const r of field.runways) {
    const [ra, rb] = toLength(r);
    const g = gradeStrip(ra, rb, r.w / 2);
    pave(g, r.w / 2, 'runway', { markings: true });
    runwayM += g.lenM;
    console.log('  runway %s  %s m x %s m, graded %s to %s m (%s%% gradient)',
      r.id, g.lenM.toFixed(0), r.w, g.ea.toFixed(1), g.eb.toFixed(1),
      ((Math.abs(g.eb - g.ea) / g.lenM) * 100).toFixed(2));
  }
  for (const t of field.taxiways) {
    const g = gradeStrip(t.a, t.b, t.w / 2);
    pave(g, t.w / 2, 'taxiway');
    taxiM += g.lenM;
    console.log('  taxiway    %s m x %s m', g.lenM.toFixed(0), t.w);
  }
  field.placedAprons = [];
  for (const hint of field.aprons) {
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
  for (const t of field.taxiways) { laid.push([t.a, t.b, t.w / 2]); movement.push([t.a, t.b, t.w / 2]); }
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
