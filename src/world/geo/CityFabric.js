// Turns the district outlines into an actual city: streets, blocks, parcels and
// buildings.
//
// Everything here works in METRES, not in normalised (u, v). That matters more
// than it sounds: u and v span 17600 m and 14200 m respectively, so a grid laid
// out in normalised space would come out sheared — 100 "square" blocks would be
// 24% wider than they are deep, and a street rotated 45 degrees would not be at
// 45 degrees on the ground. Geometry goes into metres at the top and comes back
// to (u, v) only at the point of emission.
//
// The generator is deterministic. Same seed, same city, every time and in every
// consumer — the browser build and the Unreal build have to agree on where the
// buildings are, and they only do that if neither of them rolls its own dice.

import { FRAME, landField, reliefAt, inPoly, distToPoly, distToLine, FREEWAYS } from './SanDiegoGeo.js';
import { DISTRICTS, ARTERIALS } from './SanDiegoDistricts.js';
import { LANDMARKS, landmarkBoxes, landmarkClearance } from './SanDiegoLandmarks.js';

const DEG = Math.PI / 180;

// ── Determinism ─────────────────────────────────────────────────────────────

/** 32-bit string hash, so every district and block can seed itself by name. */
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, and good enough for placing houses. */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth value noise used to bend the suburban grids. Separate from the one in
// SanDiegoGeo so that changing the terrain's roughness does not silently move
// every street in Clairemont.
function hash2(i, j) {
  let n = Math.imul(i | 0, 2654435761) ^ Math.imul(j | 0, 40503);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function noise1(x, salt) {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = hash2(i, salt);
  const b = hash2(i + 1, salt);
  return a + (b - a) * s;
}

// ── The buildable field ─────────────────────────────────────────────────────
//
// Asking landField() and reliefAt() per candidate building would mean a
// point-in-polygon sweep against every landform for each of ~100k parcels, plus
// four more for the slope. Rasterising once and sampling the raster is the same
// answer two orders of magnitude faster, and it makes the slope test trivial:
// slope is a finite difference on the grid rather than four extra evaluations.

/**
 * @typedef {object} Field
 * @property {number} w raster width
 * @property {number} h raster height
 * @property {Float32Array} land signed landField, normalised units
 * @property {Float32Array} elev metres above sea level
 * @property {Float32Array} slope rise over run, dimensionless
 */

/** Build the raster. `res` is the width; height follows the frame aspect. */
export function buildField(res = 1100) {
  const w = res;
  const h = Math.max(2, Math.round(res * (FRAME.heightM / FRAME.widthM)));
  const land = new Float32Array(w * h);
  const elev = new Float32Array(w * h);
  const slope = new Float32Array(w * h);

  for (let r = 0; r < h; r++) {
    const v = r / (h - 1);
    for (let c = 0; c < w; c++) {
      const u = c / (w - 1);
      const l = landField(u, v);
      land[r * w + c] = l;
      elev[r * w + c] = l > 0 ? reliefAt(u, v, l) : 0;
    }
  }

  const dx = FRAME.widthM / (w - 1);
  const dy = FRAME.heightM / (h - 1);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const c0 = c > 0 ? c - 1 : c;
      const c1 = c < w - 1 ? c + 1 : c;
      const r0 = r > 0 ? r - 1 : r;
      const r1 = r < h - 1 ? r + 1 : r;
      const gx = (elev[r * w + c1] - elev[r * w + c0]) / ((c1 - c0) * dx);
      const gy = (elev[r1 * w + c] - elev[r0 * w + c]) / ((r1 - r0) * dy);
      slope[r * w + c] = Math.hypot(gx, gy);
    }
  }
  return { w, h, land, elev, slope };
}

function sampleGrid(field, arr, u, v) {
  const x = Math.min(field.w - 1, Math.max(0, u * (field.w - 1)));
  const y = Math.min(field.h - 1, Math.max(0, v * (field.h - 1)));
  const c = Math.floor(x);
  const r = Math.floor(y);
  const c1 = Math.min(field.w - 1, c + 1);
  const r1 = Math.min(field.h - 1, r + 1);
  const fx = x - c;
  const fy = y - r;
  const a = arr[r * field.w + c];
  const b = arr[r * field.w + c1];
  const d = arr[r1 * field.w + c];
  const e = arr[r1 * field.w + c1];
  return (a + (b - a) * fx) + ((d + (e - d) * fx) - (a + (b - a) * fx)) * fy;
}

export const landAt = (f, u, v) => sampleGrid(f, f.land, u, v);
export const elevAt = (f, u, v) => sampleGrid(f, f.elev, u, v);
export const slopeAt = (f, u, v) => sampleGrid(f, f.slope, u, v);

// ── Corridor exclusion ──────────────────────────────────────────────────────
//
// Nothing gets built on a freeway, and streets do not cross one except where a
// freeway is a bridge. The exclusion is generous — a 26 m carriageway sits in a
// right-of-way three or four times that once the shoulders, the embankment and
// the frontage are counted, and a row of houses jammed against the asphalt is
// one of the loudest tells that a city was generated rather than built.

const FREEWAY_PAD = 34;   // metres beyond the carriageway edge

function corridorDist(pts, u, v) {
  // distToLine works in normalised units; convert to metres along the axis the
  // distance is actually dominated by. Close to a corridor the error from using
  // a single scale is a couple of metres, which is inside the padding anyway.
  return distToLine(pts, u, v) * FRAME.widthM;
}

/**
 * Metres to the nearest freeway carriageway edge; negative means on it.
 *
 * Routes flagged `surface` are freeway numbers on ordinary streets — SR-75
 * through Coronado is Third and Fourth Street, a one-way couplet with houses
 * either side. They are reported as far away so the caller's freeway padding
 * does not apply; the arterial clearance still keeps buildings off the tarmac.
 */
export function freewayClearance(u, v) {
  let best = Infinity;
  for (const f of FREEWAYS) {
    if (f.bridge) continue;              // a bridge has city underneath it
    if (f.surface) continue;             // a street, whatever the shield says
    const d = corridorDist(f.pts, u, v) - f.width / 2;
    if (d < best) best = d;
  }
  return best;
}

/** Surface-running freeway routes, kept clear like a wide arterial. */
export function surfaceRouteClearance(u, v) {
  let best = Infinity;
  for (const f of FREEWAYS) {
    if (!f.surface) continue;
    const d = corridorDist(f.pts, u, v) - f.width / 2;
    if (d < best) best = d;
  }
  return best;
}

/** Metres to the nearest arterial carriageway edge. */
export function arterialClearance(u, v) {
  let best = Infinity;
  for (const a of ARTERIALS) {
    const d = corridorDist(a.pts, u, v) - a.w / 2;
    if (d < best) best = d;
  }
  return best;
}

// ── Ownership ───────────────────────────────────────────────────────────────
//
// The district outlines are where a neighbourhood definitely is, not where it
// stops. Generating strictly inside them leaves the city as three dozen islands
// with bare ground between, which is not what San Diego looks like from the air
// — the fabric is continuous from the beach to the mesas, and what interrupts it
// is canyons and parks, not neighbourhood boundaries.
//
// So each district also claims the buildable ground nearest to it, out to a
// limit, and runs its own street lattice into that ground. Because the lattice
// is anchored on the district's own origin, the streets that appear in the
// claimed ground are literally continuations of the district's streets: the
// seam between North Park and City Heights becomes a change of character part
// way along a block, which is exactly how it reads on the ground.
//
// Districts with no grid — the runway, Balboa Park, Fort Rosecrans — claim
// nothing. A park that spread would stop being a park.

/**
 * How far past its outline a district may claim, by what it builds.
 *
 * Not one number, because the districts are not one kind of thing. Housing
 * genuinely does run on past any boundary you care to draw — the line between
 * North Park and City Heights is a street sign, not a change in the fabric — so
 * it spreads a long way. Downtown does not: its towers stop where the plat
 * stops, and letting them creep outward would put a 40-storey block in the
 * middle of Golden Hill's bungalows. Industrial and military ground is fenced
 * in reality and behaves the same way here.
 */
const SPREAD_BY_KIND = {
  house: 1150,
  rowhouse: 800,
  midrise: 620,
  commercial: 520,
  industrial: 460,
  military: 380,
  tower: 300,
  campus: 500,
  park: 0,
};
const DEFAULT_SPREAD_M = 900;

const spreadOf = (d) =>
  d.spreadM ?? (d.grid.kind === 'none' ? 0 : SPREAD_BY_KIND[d.build.kind] ?? DEFAULT_SPREAD_M);

/**
 * Raster of which district owns each cell, or -1 for none.
 * Resolution is deliberately coarser than the buildability field: ownership
 * decides character, not geometry, and a 34 m cell is far finer than the
 * question needs.
 */
export function buildOwnership(districts, res = 520) {
  const w = res;
  const h = Math.max(2, Math.round(res * (FRAME.heightM / FRAME.widthM)));
  const own = new Int16Array(w * h).fill(-1);
  const spread = districts.map((d) => spreadOf(d) / FRAME.widthM);

  for (let r = 0; r < h; r++) {
    const v = r / (h - 1);
    for (let c = 0; c < w; c++) {
      const u = c / (w - 1);
      let best = Infinity;
      let bestI = -1;
      for (let i = 0; i < districts.length; i++) {
        const d = districts[i];
        const dist = distToPoly(d.poly, u, v);
        // Inside counts as negative depth, so where two outlines overlap the
        // one whose middle you are nearer to wins rather than whichever was
        // declared first.
        const score = inPoly(d.poly, u, v) ? -dist : dist;
        if (score > spread[i]) continue;
        if (score < best) {
          best = score;
          bestI = i;
        }
      }
      own[r * w + c] = bestI;
    }
  }
  return { w, h, own };
}

function ownerAt(o, u, v) {
  const c = Math.round(Math.min(1, Math.max(0, u)) * (o.w - 1));
  const r = Math.round(Math.min(1, Math.max(0, v)) * (o.h - 1));
  return o.own[r * o.w + c];
}

// ── Local frames ────────────────────────────────────────────────────────────

/**
 * A district's grid basis, in metres. `rotDeg` is measured from due east and
 * increases toward +v (south on the map), which is how the district file
 * documents it.
 */
function basis(rotDeg) {
  const t = rotDeg * DEG;
  return {
    e1: [Math.cos(t), Math.sin(t)],       // primary street direction
    e2: [-Math.sin(t), Math.cos(t)],      // cross-street direction
  };
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

/** Polygon in metres, plus its bounding box in the district's own frame. */
function prepare(district) {
  const { e1, e2 } = basis(district.grid.rotDeg);
  const polyM = district.poly.map(([u, v]) => [u * FRAME.widthM, v * FRAME.heightM]);
  let cx = 0;
  let cy = 0;
  for (const p of polyM) {
    cx += p[0];
    cy += p[1];
  }
  cx /= polyM.length;
  cy /= polyM.length;

  let a0 = Infinity;
  let a1 = -Infinity;
  let b0 = Infinity;
  let b1 = -Infinity;
  for (const p of polyM) {
    const d = [p[0] - cx, p[1] - cy];
    const a = dot(d, e1);
    const b = dot(d, e2);
    if (a < a0) a0 = a;
    if (a > a1) a1 = a;
    if (b < b0) b0 = b;
    if (b > b1) b1 = b;
  }
  return { e1, e2, polyM, cx, cy, a0, a1, b0, b1 };
}

/** Local (a, b) in the district frame back to normalised (u, v). */
function toUv(fr, a, b) {
  const x = fr.cx + fr.e1[0] * a + fr.e2[0] * b;
  const y = fr.cy + fr.e1[1] * a + fr.e2[1] * b;
  return [x / FRAME.widthM, y / FRAME.heightM];
}

// ── Buildability ────────────────────────────────────────────────────────────

/**
 * Can a street or a building sit here?
 *
 * Slope is the interesting one. San Diego builds on the mesa tops and leaves
 * the canyon walls alone, and that single rule is most of what gives the city
 * its shape from the air: fingers of houses reaching out along the flat with
 * green fingers of untouched canyon between them. Without it the grid runs
 * straight down a 35-degree escarpment and the whole thing looks painted on.
 */
function makeTest(field, opts) {
  const maxSlope = opts.maxSlope ?? 0.16;      // about 9 degrees
  const minElev = opts.minElev ?? 2.2;
  const freewayPad = opts.freewayPad ?? FREEWAY_PAD;
  return function ok(u, v, needArterial) {
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;
    if (landAt(field, u, v) <= 0.0006) return false;
    if (elevAt(field, u, v) < minElev) return false;
    if (slopeAt(field, u, v) > maxSlope) return false;
    if (freewayClearance(u, v) < freewayPad) return false;
    if (needArterial && arterialClearance(u, v) < needArterial) return false;
    if (needArterial && surfaceRouteClearance(u, v) < needArterial) return false;
    return true;
  };
}

// ── Streets ─────────────────────────────────────────────────────────────────

const SAMPLE_M = 18;     // how finely a candidate street line is walked

// One line in every this-many becomes a collector: the street with the bus, the
// shops on the corner and twice the width. Six is about right for a streetcar
// plat of 60-90 m blocks — roughly every half kilometre, which is what walking
// distance to a bus stop actually was when these were laid out.
const COLLECTOR_EVERY = 6;
const COLLECTOR_SCALE = 1.7;

/**
 * Walk one line of a district's grid and return the runs of it that are
 * actually buildable, as normalised polylines.
 *
 * A street is emitted in pieces rather than as one line because that is what
 * really happens: a street runs until it hits a canyon, stops, and picks up
 * again on the far side under the same name. Emitting the whole span and
 * letting it sail over the void is the single worst artefact a grid generator
 * produces.
 */
function traceLine(fr, ok, along, cross, offsetFn, from, to, minRunM) {
  const runs = [];
  let cur = null;
  const n = Math.max(2, Math.ceil((to - from) / SAMPLE_M));
  for (let i = 0; i <= n; i++) {
    const s = from + ((to - from) * i) / n;
    const off = offsetFn ? offsetFn(s) : 0;
    const a = along === 1 ? s : cross + off;
    const b = along === 1 ? cross + off : s;
    const [u, v] = toUv(fr, a, b);
    if (ok(u, v, 0)) {
      if (!cur) cur = [];
      cur.push([u, v]);
    } else if (cur) {
      if (cur.length >= 2) runs.push(cur);
      cur = null;
    }
  }
  if (cur && cur.length >= 2) runs.push(cur);

  // Drop stubs. A 30 m fragment of street sticking out of a canyon rim is
  // noise, not geography.
  return runs.filter((r) => {
    let len = 0;
    for (let i = 1; i < r.length; i++) {
      len += Math.hypot(
        (r[i][0] - r[i - 1][0]) * FRAME.widthM,
        (r[i][1] - r[i - 1][1]) * FRAME.heightM
      );
    }
    return len >= minRunM;
  });
}

/** Straighten a run that came out of a rectilinear grid: keep only the ends. */
function simplifyStraight(run) {
  return [run[0], run[run.length - 1]];
}

// ── Buildings ───────────────────────────────────────────────────────────────

/**
 * Height for one building. The exponent is what separates a skyline from a
 * plateau: with a flat distribution every downtown block gets a 90 m tower and
 * the result reads as a wall. Real skylines are mostly short with a handful of
 * tall ones, so the random is pushed toward the low end and only occasionally
 * allowed all the way up.
 */
function pickHeight(kind, minH, maxH, r) {
  const span = Math.max(0, maxH - minH);
  switch (kind) {
    case 'tower':
      // Heavily skewed, plus a rare spike for the genuine landmarks.
      return minH + span * (r() < 0.06 ? 0.72 + r() * 0.28 : Math.pow(r(), 2.6));
    case 'midrise':
      return minH + span * Math.pow(r(), 2.0);
    case 'house':
      // Two storeys or one, with the occasional three-storey apartment.
      return minH + span * (r() < 0.14 ? 0.55 + r() * 0.45 : Math.pow(r(), 2.2));
    case 'rowhouse':
      return minH + span * (0.25 + Math.pow(r(), 1.6) * 0.75);
    case 'commercial':
    case 'industrial':
    case 'military':
      return minH + span * Math.pow(r(), 1.5);
    default:
      return minH + span * r();
  }
}


// ── Massing ─────────────────────────────────────────────────────────────────
//
// A building is not a box. Everything here was a single flat-topped extrusion
// until now, and at any distance the result reads as hatching rather than as
// buildings — 113,000 identical rectangles with identical rooflines, which is
// the tell that gives away a generated city faster than any wrong street.
//
// Each kind now gets a small vocabulary of parts. The rules are cheap and
// specific rather than general, because what makes a bungalow read as a
// bungalow (a hipped roof and a garage set forward of it) has nothing in
// common with what makes a downtown block read as downtown (a podium filling
// the block with a slender shaft standing out of it).
//
// Parts are [dx, dy, w, d, h, base] in the parcel's own frame — the same shape
// the hand-authored landmarks use, so both go down the same path.

/** A house: main mass, a hipped roof cap, and often a garage wing. */
function massHouse(w, d, h, r) {
  const parts = [[0, 0, w, d, h]];
  // The roof. Two thirds of the footprint and a couple of metres tall reads as
  // a hip from the air and as a pitch from the street, without the cost of
  // actually modelling one.
  parts.push([0, 0, w * 0.78, d * 0.78, 1.6 + r() * 1.4, h]);
  if (r() < 0.55 && w > 9) {
    // Garage or a side wing, lower than the house and set toward the street.
    const gw = w * (0.30 + r() * 0.16);
    const gd = d * (0.34 + r() * 0.14);
    parts.push([(w - gw) / 2 * (r() < 0.5 ? -1 : 1), -(d - gd) / 2, gw, gd, 2.6 + r() * 0.8]);
  }
  return parts;
}

/** A rowhouse: one mass, sometimes with a taller rear wing off the alley. */
function massRow(w, d, h, r) {
  const parts = [[0, 0, w, d, h]];
  if (r() < 0.4) parts.push([0, d * 0.30, w * 0.7, d * 0.34, h * (0.5 + r() * 0.4), h]);
  else parts.push([0, 0, w * 0.86, d * 0.86, 0.8 + r() * 0.8, h]);
  return parts;
}

/**
 * A midrise block: a courtyard when the parcel can take one, an L otherwise.
 *
 * The courtyard is the signature of this density everywhere it occurs — a ring
 * of building round a hole, five or six storeys, with the hole full of parking
 * or a pool. A solid block of the same footprint reads as an office slab.
 */
function massMidrise(w, d, h, r) {
  if (w > 26 && d > 26 && r() < 0.62) {
    const t = Math.min(w, d) * (0.24 + r() * 0.08);   // wing thickness
    return [
      [0, -(d - t) / 2, w, t, h],
      [0, (d - t) / 2, w, t, h],
      [-(w - t) / 2, 0, t, d - t * 2, h],
      [(w - t) / 2, 0, t, d - t * 2, h],
    ];
  }
  const parts = [[0, 0, w, d, h]];
  if (r() < 0.45) {
    // A stair or lift core standing above the parapet.
    parts.push([w * 0.2 * (r() < 0.5 ? -1 : 1), 0, w * 0.26, d * 0.26, 2.4 + r() * 1.6, h]);
  }
  return parts;
}

/**
 * A tower: podium, shaft, and sometimes a setback crown.
 *
 * The podium is most of what makes a downtown street feel enclosed — the tower
 * itself is set back and you barely see it from the pavement. Building only the
 * shaft leaves streets that feel like a field with poles in it.
 */
function massTower(w, d, h, r) {
  const podium = Math.min(h * 0.35, 12 + r() * 14);
  const sw = w * (0.52 + r() * 0.22);
  const sd = d * (0.52 + r() * 0.22);
  const parts = [
    [0, 0, w, d, podium],
    [(w - sw) * (r() - 0.5) * 0.4, (d - sd) * (r() - 0.5) * 0.4, sw, sd, h - podium, podium],
  ];
  if (h > 60 && r() < 0.5) {
    parts.push([0, 0, sw * 0.66, sd * 0.66, 4 + r() * 10, h]);
  }
  return parts;
}

/** Commercial: a big shed, an entry canopy, and rooftop plant. */
function massCommercial(w, d, h, r) {
  const parts = [[0, 0, w, d, h]];
  if (r() < 0.5) parts.push([0, -(d / 2) - 3, w * 0.4, 6, Math.min(h, 4.5)]);
  if (r() < 0.6) {
    parts.push([w * (r() - 0.5) * 0.4, d * (r() - 0.5) * 0.4,
      w * 0.22, d * 0.22, 1.8 + r() * 2.2, h]);
  }
  return parts;
}

/** Industrial: a long shed with a smaller office block against one end. */
function massIndustrial(w, d, h, r) {
  const parts = [[0, 0, w, d, h]];
  const ow = w * (0.22 + r() * 0.12);
  const od = d * (0.3 + r() * 0.15);
  parts.push([(w - ow) / 2 * (r() < 0.5 ? -1 : 1), -(d - od) / 2 - od * 0.4,
    ow, od, Math.max(4, h * 0.55)]);
  return parts;
}

/**
 * Parking. Not a building — a flat pad a hand's width above the ground.
 *
 * It is worth its own kind because from the air it is the loudest single
 * signature this city has. Southern California built its commercial strip
 * around the car, and the aprons around a strip mall, the lots ringing the
 * stadium and the acres of asphalt at Kearny Mesa's tilt-ups are collectively a
 * bigger share of the ground than the buildings on it. Leave them out and every
 * commercial block reads as a shed sitting on a lawn.
 */
function massParking(w, d) {
  return [[0, 0, w, d, 0.12]];
}

/** Everything else keeps its single box. */
function massDefault(w, d, h) {
  return [[0, 0, w, d, h]];
}

function massing(kind, w, d, h, r) {
  switch (kind) {
    case 'house': return massHouse(w, d, h, r);
    case 'rowhouse': return massRow(w, d, h, r);
    case 'midrise': return massMidrise(w, d, h, r);
    case 'tower': return massTower(w, d, h, r);
    case 'commercial': return massCommercial(w, d, h, r);
    case 'industrial': return massIndustrial(w, d, h, r);
    case 'parking': return massParking(w, d);
    default: return massDefault(w, d, h);
  }
}

/**
 * Push one building's parts into the output, placed at a point in the
 * district's local frame. `simple` skips the vocabulary and emits one box,
 * which is what the park pavilions and the scattered military sheds want.
 */
function emit(fr, d, out, ca, cb, w, dpt, h, kind, r, simple = false) {
  const rot = d.grid.rotDeg;
  const t = rot * DEG;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const parts = simple ? massDefault(w, dpt, h) : massing(kind, w, dpt, h, r);
  for (const [dx, dy, pw, pd, ph, base] of parts) {
    // Drops degenerate parts. The height floor has to stay below a parking
    // pad's 12 cm — at 0.2 m it silently swallowed every acre of asphalt on
    // the map and the only surviving car parks were the twelve hand-placed
    // landmark aprons.
    if (pw <= 0.5 || pd <= 0.5 || ph <= 0.05) continue;
    const [u, v] = toUv(fr, ca + dx * cos - dy * sin, cb + dx * sin + dy * cos);
    out.push({ u, v, rot, w: pw, d: pd, h: ph, base: base ?? 0, kind, district: d.id });
  }
}

/**
 * The kinds whose blocks are surfaced. Housing is not one of them — a
 * residential block is gardens and driveways, and paving it turns North Park
 * into a retail park.
 */
const PAVED_KINDS = new Set(['commercial', 'industrial', 'military', 'campus']);

/** Fill one block with parcels and put a building on each. */
function fillBlock(fr, d, block, ok, r, out) {
  const b = d.build;
  const { a0, a1, b0, b1 } = block;
  const bw = a1 - a0;
  const bh = b1 - b0;
  if (bw < 6 || bh < 6) return;

  if (b.kind === 'park') {
    // A pavilion here and there, nothing more.
    if (r() > 0.16) return;
    const w = 14 + r() * 24;
    const dpt = 12 + r() * 20;
    const ca = a0 + bw * (0.25 + r() * 0.5);
    const cb = b0 + bh * (0.25 + r() * 0.5);
    const [u, v] = toUv(fr, ca, cb);
    if (!ok(u, v, 4)) return;
    emit(fr, d, out, ca, cb, w, dpt, pickHeight('midrise', b.minH, b.maxH, r), b.kind, r, true);
    return;
  }

  if (b.kind === 'tower') {
    // One building to a block, set back from the street on all sides. Downtown
    // blocks are 200 ft; they take exactly one tower and its podium.
    const w = bw * Math.sqrt(b.cover) * (0.86 + r() * 0.22);
    const dpt = bh * Math.sqrt(b.cover) * (0.86 + r() * 0.22);
    const ca = (a0 + a1) / 2 + (r() - 0.5) * (bw - w) * 0.4;
    const cb = (b0 + b1) / 2 + (r() - 0.5) * (bh - dpt) * 0.4;
    const [u, v] = toUv(fr, ca, cb);
    if (!ok(u, v, 3)) return;
    emit(fr, d, out, ca, cb, w, dpt, pickHeight('tower', b.minH, b.maxH, r), b.kind, r);
    return;
  }

  // Everything that is not housing gets its block surfaced before anything is
  // built on it. The pad goes down first so the buildings land on top of it.
  // Not every block: a base has grass, a runway and a golf course as well as
  // hardstanding, and paving all of it turns North Island into one black slab.
  if (PAVED_KINDS.has(b.kind) && r() < (b.kind === 'military' ? 0.55 : 0.9)) {
    const pa = (a0 + a1) / 2;
    const pb = (b0 + b1) / 2;
    const [pu, pv] = toUv(fr, pa, pb);
    if (ok(pu, pv, 2)) {
      emit(fr, d, out, pa, pb, bw * 0.94, bh * 0.94, 0.12, 'parking', r);
    }
  }

  const nx = Math.max(1, Math.round(bw / b.lotW));
  const ny = Math.max(1, Math.round(bh / b.lotD));
  const pw = bw / nx;
  const pd = bh / ny;

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      // Interior parcels of a deep block have no frontage; leave them as the
      // back gardens and yards they are in the real thing.
      const interior = ny > 2 && j > 0 && j < ny - 1;
      if (interior && r() > 0.18) continue;
      if (r() > 0.94) continue;                     // vacant lots, corner shops

      const cover = b.cover * (0.82 + r() * 0.36);
      const w = Math.min(pw - 2, pw * Math.sqrt(Math.min(1, cover)) * (0.9 + r() * 0.2));
      const dpt = Math.min(pd - 2, pd * Math.sqrt(Math.min(1, cover)) * (0.9 + r() * 0.2));
      if (w < 4 || dpt < 4) continue;

      // Buildings sit toward the street, not centred in the lot.
      const front = j < ny / 2 ? -1 : 1;
      const ca = a0 + pw * (i + 0.5) + (r() - 0.5) * (pw - w) * 0.5;
      const cb = b0 + pd * (j + 0.5) - front * (pd - dpt) * (0.16 + r() * 0.16);
      const [u, v] = toUv(fr, ca, cb);
      if (!ok(u, v, 3)) continue;

      emit(fr, d, out, ca, cb, w, dpt, pickHeight(b.kind, b.minH, b.maxH, r), b.kind, r);
    }
  }
}

// ── The generator ───────────────────────────────────────────────────────────

/**
 * Build the whole city.
 *
 * @param {object} [opts]
 * @param {Field} [opts.field] pre-built buildability raster
 * @param {number} [opts.fieldRes] raster width if one has to be built
 * @param {boolean} [opts.buildings] emit buildings (default true)
 * @param {number} [opts.maxSlope] steepest ground that gets built on
 * @param {string[]} [opts.only] district ids to restrict to, for iteration
 */
export function generateCity(opts = {}) {
  const field = opts.field ?? buildField(opts.fieldRes ?? 1100);
  const ok = makeTest(field, opts);
  const wantBuildings = opts.buildings !== false;
  const only = opts.only ? new Set(opts.only) : null;
  const spreading = opts.spread !== false;
  const owners = spreading
    ? (opts.ownership ?? buildOwnership(DISTRICTS, opts.ownershipRes ?? 520))
    : null;

  const streets = [];
  const buildings = [];
  const stats = [];

  for (let di = 0; di < DISTRICTS.length; di++) {
    const d = DISTRICTS[di];
    if (only && !only.has(d.id)) continue;
    const g = d.grid;
    const fr = prepare(d);
    const r = rng(hashStr(d.id) ^ 0x5f3a91);

    // Which ground is this district's? Inside its outline always; beyond it,
    // whatever ground is nearer to this district than to any other, out to the
    // spread limit. The buildability test still has the last word — water,
    // canyon walls and freeways are nobody's.
    const inDistrict = owners
      ? (u, v) => ownerAt(owners, u, v) === di || inPoly(d.poly, u, v)
      : (u, v) => inPoly(d.poly, u, v);
    const okHere = (u, v, pad) => inDistrict(u, v) && ok(u, v, pad);

    // The lattice has to be walked over the ground the district might claim,
    // not just its outline, or the spread has nothing to fill it with.
    if (spreading && g.kind !== 'none') {
      const pad = spreadOf(d);
      fr.a0 -= pad;
      fr.a1 += pad;
      fr.b0 -= pad;
      fr.b1 += pad;
    }

    let nStreet = 0;
    const before = buildings.length;

    if (g.kind !== 'none') {
      const stepA = g.blockW + g.streetW;
      const stepB = g.blockH + g.aveW;
      const amp = g.curveAmp || 0;

      // Street hierarchy. Every line was the same width, which is why a grid
      // reads as graph paper rather than as a neighbourhood: real plats put a
      // collector every four to eight blocks — the one with the bus route, the
      // shops on the corner and twice the tarmac — and the rest are residential
      // streets you could park across. One line in COLLECTOR_EVERY gets the
      // wider section, and the block spacing is untouched, so the fabric does
      // not move; only the road does.
      const collector = (n) => (((n % COLLECTOR_EVERY) + COLLECTOR_EVERY)
        % COLLECTOR_EVERY === 0);

      // Cross-street family: lines running along e1, stacked along e2.
      const jMin = Math.floor(fr.b0 / stepB) - 1;
      const jMax = Math.ceil(fr.b1 / stepB) + 1;
      for (let j = jMin; j <= jMax; j++) {
        const cross = j * stepB;
        const salt = (hashStr(d.id) + j * 7919) & 0xffff;
        const off = amp ? (s) => (noise1(s / 420, salt) - 0.5) * 2 * amp : null;
        const runs = traceLine(fr, okHere, 1, cross, off, fr.a0 - stepA, fr.a1 + stepA, 44);
        const wide = collector(j);
        for (const run of runs) {
          streets.push({
            district: d.id,
            w: wide ? g.streetW * COLLECTOR_SCALE : g.streetW,
            kind: wide ? 'collector' : 'street',
            pts: amp ? run : simplifyStraight(run),
          });
          nStreet++;
        }
      }

      // Avenue family: lines running along e2, stacked along e1.
      const iMin = Math.floor(fr.a0 / stepA) - 1;
      const iMax = Math.ceil(fr.a1 / stepA) + 1;
      for (let i = iMin; i <= iMax; i++) {
        const cross = i * stepA;
        const salt = (hashStr(d.id) + i * 104729) & 0xffff;
        const off = amp ? (s) => (noise1(s / 480, salt) - 0.5) * 2 * amp : null;
        const runs = traceLine(fr, okHere, 2, cross, off, fr.b0 - stepB, fr.b1 + stepB, 44);
        const wide = collector(i);
        for (const run of runs) {
          streets.push({
            district: d.id,
            w: wide ? g.aveW * COLLECTOR_SCALE : g.aveW,
            kind: wide ? 'collector' : 'avenue',
            pts: amp ? run : simplifyStraight(run),
          });
          nStreet++;
        }
      }

      // Blocks and what stands on them. A block is the rectangle between four
      // grid lines, inset by the half-widths of the streets that bound it. The
      // curve offsets are applied to the corners too, so a bent street keeps
      // its houses beside it rather than a block away.
      if (wantBuildings) {
        for (let i = iMin; i < iMax; i++) {
          for (let j = jMin; j < jMax; j++) {
            const saltI = (hashStr(d.id) + i * 104729) & 0xffff;
            const saltJ = (hashStr(d.id) + j * 7919) & 0xffff;
            const ca = i * stepA + stepA / 2;
            const cb = j * stepB + stepB / 2;
            const offI = amp ? (noise1(cb / 480, saltI) - 0.5) * 2 * amp : 0;
            const offJ = amp ? (noise1(ca / 420, saltJ) - 0.5) * 2 * amp : 0;

            const block = {
              a0: i * stepA + g.aveW / 2 + offI,
              a1: (i + 1) * stepA - g.aveW / 2 + offI,
              b0: j * stepB + g.streetW / 2 + offJ,
              b1: (j + 1) * stepB - g.streetW / 2 + offJ,
            };
            // Cheap rejection before the per-parcel work: if the block centre
            // is not in the district, nothing in it will be either.
            const [cu, cv] = toUv(fr, (block.a0 + block.a1) / 2, (block.b0 + block.b1) / 2);
            if (!inDistrict(cu, cv)) continue;
            fillBlock(fr, d, block, okHere, rng(hashStr(d.id + ':' + i + ':' + j)), buildings);
          }
        }
      }
    } else if (wantBuildings && d.build.cover > 0) {
      // No grid: scatter what little there is across the outline.
      const area = Math.abs(fr.a1 - fr.a0) * Math.abs(fr.b1 - fr.b0);
      const n = Math.round((area / 1e6) * 6 * d.build.cover * 20);
      for (let k = 0; k < n; k++) {
        const a = fr.a0 + r() * (fr.a1 - fr.a0);
        const b = fr.b0 + r() * (fr.b1 - fr.b0);
        const [u, v] = toUv(fr, a, b);
        if (!okHere(u, v, 6)) continue;
        buildings.push({
          u,
          v,
          rot: d.grid.rotDeg + (r() - 0.5) * 24,
          w: d.build.lotW * (0.6 + r() * 0.8),
          d: d.build.lotD * (0.6 + r() * 0.8),
          h: pickHeight(d.build.kind, d.build.minH, d.build.maxH, r),
          base: 0,
          kind: d.build.kind,
          district: d.id,
        });
      }
    }

    stats.push({
      id: d.id,
      name: d.name,
      streets: nStreet,
      buildings: buildings.length - before,
    });
  }

  // ── Landmarks ────────────────────────────────────────────────────────────
  //
  // Last, and destructively: a landmark clears the procedural fabric around it
  // before it lands. Without that the convention centre shares its footprint
  // with eleven warehouses and Petco Park has a bungalow at second base. The
  // clearance is per landmark because the right radius is not a property of the
  // building — the stadium needs its car park cleared, the museums on Balboa
  // Park's lawn need nothing cleared, and Fort Rosecrans is 400 m of cleared
  // ground with almost nothing on it, which is the point of it.
  if (opts.landmarks !== false && !only) {
    const marks = LANDMARKS.map((lm) => ({
      lm,
      x: lm.u * FRAME.widthM,
      y: lm.v * FRAME.heightM,
      r: landmarkClearance(lm),
    })).filter((m) => m.r > 0);

    let cleared = 0;
    const kept = [];
    for (const b of buildings) {
      const bx = b.u * FRAME.widthM;
      const by = b.v * FRAME.heightM;
      let hit = false;
      for (const m of marks) {
        const dx = bx - m.x;
        const dy = by - m.y;
        if (dx * dx + dy * dy < m.r * m.r) {
          hit = true;
          break;
        }
      }
      if (hit) cleared++;
      else kept.push(b);
    }
    // Rewritten in place rather than spread back in: `push(...kept)` passes a
    // hundred thousand arguments and overflows the stack.
    buildings.length = 0;
    for (const b of kept) buildings.push(b);

    let placed = 0;
    for (const lm of LANDMARKS) {
      for (const box of landmarkBoxes(lm, FRAME.widthM, FRAME.heightM)) {
        buildings.push(box);
        placed++;
      }
    }
    stats.push({
      id: '(landmarks)',
      name: 'named buildings',
      streets: 0,
      buildings: placed,
      clearedForThem: cleared,
    });
  }

  return { field, streets, buildings, arterials: ARTERIALS, landmarks: LANDMARKS, stats };
}
