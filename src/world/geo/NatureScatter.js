// Puts the plants, the rock and the water on the ground the city did not take.
//
// The hard part is not deciding what grows where — SanDiegoNature says that.
// It is knowing which ground is free, and free means: dry land, above the
// waterline, not graded airfield, not under a building, not on a car park, and
// not in a road. A tree in the middle of Broadway is worse than no trees at
// all, and there are of the order of 340,000 buildings and 120,000 street
// segments to miss.
//
// Testing each candidate against all of them is hopeless, so the city is
// rasterised once into an occupancy grid and every candidate is one lookup.
// The grid is coarse — about 7 m a cell — which is finer than the clearance
// being enforced, so nothing is lost by it.

import { FRAME, inPoly, distToLine } from './SanDiegoGeo.js';
import { RIVERS, PONDS, PARKS, SCATTER } from './SanDiegoNature.js';
import { rng, hashStr, landAt, elevAt, slopeAt, onAirfield } from './CityFabric.js';

const DEG = Math.PI / 180;

// ── Occupancy ───────────────────────────────────────────────────────────────

/**
 * Rasterise everything the city built into a bitmask.
 *
 * Footprints go in as their axis-aligned bounding box rather than the rotated
 * rectangle. That over-claims by up to 40% on a diagonal building, which is the
 * right way to be wrong here: the cost is a slightly emptier garden, and the
 * alternative — a tree growing through a wall — is the kind of thing that gets
 * noticed immediately.
 */
export function buildOccupancy(city, res = 2400) {
  const w = res;
  const h = Math.max(2, Math.round(res * (FRAME.heightM / FRAME.widthM)));
  const grid = new Uint8Array(w * h);
  const sx = (w - 1) / FRAME.widthM;
  const sy = (h - 1) / FRAME.heightM;

  const stamp = (cx, cy, halfW, halfD) => {
    const c0 = Math.max(0, Math.floor((cx - halfW) * sx));
    const c1 = Math.min(w - 1, Math.ceil((cx + halfW) * sx));
    const r0 = Math.max(0, Math.floor((cy - halfD) * sy));
    const r1 = Math.min(h - 1, Math.ceil((cy + halfD) * sy));
    for (let r = r0; r <= r1; r++) {
      const row = r * w;
      for (let c = c0; c <= c1; c++) grid[row + c] = 1;
    }
  };

  const pad = SCATTER.clearM;

  for (const b of city.buildings) {
    // Rotated half-extents, projected onto the axes.
    const t = (b.rot ?? 0) * DEG;
    const ac = Math.abs(Math.cos(t));
    const as = Math.abs(Math.sin(t));
    const halfW = (b.w * ac + b.d * as) / 2 + pad;
    const halfD = (b.w * as + b.d * ac) / 2 + pad;
    stamp(b.u * FRAME.widthM, b.v * FRAME.heightM, halfW, halfD);
  }

  const stampLine = (pts, widthM) => {
    const halfV = widthM / 2 + pad;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0] * FRAME.widthM;
      const ay = pts[i - 1][1] * FRAME.heightM;
      const bx = pts[i][0] * FRAME.widthM;
      const by = pts[i][1] * FRAME.heightM;
      const len = Math.hypot(bx - ax, by - ay);
      const steps = Math.max(1, Math.ceil(len / (FRAME.widthM / w)));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        stamp(ax + (bx - ax) * t, ay + (by - ay) * t, halfV, halfV);
      }
    }
  };

  for (const s of city.streets) stampLine(s.pts, s.w);
  for (const a of city.arterials) stampLine(a.pts, a.w);

  return { w, h, grid };
}

const occupied = (o, u, v) => {
  const c = Math.round(Math.min(1, Math.max(0, u)) * (o.w - 1));
  const r = Math.round(Math.min(1, Math.max(0, v)) * (o.h - 1));
  return o.grid[r * o.w + c] === 1;
};

// ── Which planting rule applies here ────────────────────────────────────────

let _parkBoxes = null;

function parkBoxes() {
  if (_parkBoxes) return _parkBoxes;
  _parkBoxes = PARKS.map((p) => {
    let u0 = Infinity; let v0 = Infinity; let u1 = -Infinity; let v1 = -Infinity;
    for (const [u, v] of p.poly) {
      if (u < u0) u0 = u;
      if (u > u1) u1 = u;
      if (v < v0) v0 = v;
      if (v > v1) v1 = v;
    }
    return { p, u0, v0, u1, v1 };
  });
  return _parkBoxes;
}

/** The park covering this point, or null for the default scrub rule. */
function parkAt(u, v) {
  for (const b of parkBoxes()) {
    if (u < b.u0 || u > b.u1 || v < b.v0 || v > b.v1) continue;
    if (inPoly(b.p.poly, u, v)) return b.p;
  }
  return null;
}

function pickSpecies(list, r) {
  let total = 0;
  for (const s of list) total += s.w;
  let n = r() * total;
  for (const s of list) {
    n -= s.w;
    if (n <= 0) return s;
  }
  return list[list.length - 1];
}

const between = (range, r) => range[0] + (range[1] - range[0]) * r();

// ── The scatter ─────────────────────────────────────────────────────────────

/**
 * @param {object} city   the result of generateCity
 * @param {object} field  the buildability raster it used
 * @param {object} [opts]
 * @returns {{ plants: object[], rocks: object[], water: object[], stats: object }}
 */
export function scatterNature(city, field, opts = {}) {
  const occ = opts.occupancy ?? buildOccupancy(city, opts.occupancyRes ?? 2400);
  const r = rng(hashStr('nature') ^ 0x1f2e3d);

  const plants = [];
  const rocks = [];

  const stepU = SCATTER.spacingM / FRAME.widthM;
  const stepV = SCATTER.spacingM / FRAME.heightM;
  const nu = Math.floor(1 / stepU);
  const nv = Math.floor(1 / stepV);

  let tried = 0;
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      tried++;
      // Jitter, or the whole county comes out planted on a lattice.
      const u = (i + (r() - 0.5) * 0.9) * stepU;
      const v = (j + (r() - 0.5) * 0.9) * stepV;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      if (landAt(field, u, v) <= 0.0006) continue;
      if (elevAt(field, u, v) < 1.8) continue;
      if (onAirfield(u, v)) continue;
      if (occupied(occ, u, v)) continue;

      const park = parkAt(u, v);
      const kind = park ? park.kind : 'scrub';
      const cover = park ? park.cover : SCATTER.cover;
      if (r() > cover) continue;

      const list = SCATTER.species[kind];
      if (!list || !list.length) continue;
      const sp = pickSpecies(list, r);
      const height = between(sp.h, r);
      const radius = between(sp.r, r);

      plants.push({
        u,
        v,
        species: sp.id,
        h: height,
        r: radius,
        rot: r() * 360,
      });
    }
  }

  // Rock, on the steep ground only. A boulder on a mesa top is a boulder
  // somebody put there.
  const rk = SCATTER.rock;
  const rStepU = rk.spacingM / FRAME.widthM;
  const rStepV = rk.spacingM / FRAME.heightM;
  const rnu = Math.floor(1 / rStepU);
  const rnv = Math.floor(1 / rStepV);
  for (let j = 0; j <= rnv; j++) {
    for (let i = 0; i <= rnu; i++) {
      const u = (i + (r() - 0.5) * 0.9) * rStepU;
      const v = (j + (r() - 0.5) * 0.9) * rStepV;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      if (landAt(field, u, v) <= 0.0006) continue;
      if (slopeAt(field, u, v) < rk.minSlope) continue;
      if (occupied(occ, u, v)) continue;
      if (r() > rk.cover) continue;
      const size = between(rk.size, r);
      rocks.push({ u, v, size, rot: r() * 360 });
    }
  }

  const water = buildWater(field);

  return {
    plants,
    rocks,
    water,
    occupancy: occ,
    stats: {
      candidates: tried,
      plants: plants.length,
      rocks: rocks.length,
      water: water.length,
      bySpecies: plants.reduce((acc, p) => {
        acc[p.species] = (acc[p.species] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };
}

// ── Water surfaces ──────────────────────────────────────────────────────────

/**
 * Rivers and ponds as flat slabs.
 *
 * A river follows the ground rather than holding a level, because the channels
 * here run the length of a valley that drops 50 m and a single surface would
 * be a dam at one end and a cliff at the other. Each segment takes the terrain
 * height at its own midpoint, which is what a shallow concrete channel on a
 * gradient actually looks like.
 */
function buildWater(field) {
  const out = [];
  const STEP_M = 70;

  for (const river of RIVERS) {
    for (let i = 1; i < river.pts.length; i++) {
      const [au, av] = river.pts[i - 1];
      const [bu, bv] = river.pts[i];
      const ax = au * FRAME.widthM;
      const ay = av * FRAME.heightM;
      const bx = bu * FRAME.widthM;
      const by = bv * FRAME.heightM;
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.round(len / STEP_M));
      for (let s = 0; s < n; s++) {
        const t0 = s / n;
        const t1 = (s + 1) / n;
        const mu = au + (bu - au) * (t0 + t1) / 2;
        const mv = av + (bv - av) * (t0 + t1) / 2;
        if (landAt(field, mu, mv) <= 0) continue;   // already sea
        const segLen = len / n;
        out.push({
          u: mu,
          v: mv,
          rot: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI,
          w: segLen + 6,          // overlap so the channel does not gap
          d: river.w,
          h: 0.6,
          feature: river.id,
        });
      }
    }
  }

  for (const pond of PONDS) {
    // Fill the outline with slabs on a grid. Ponds are small and few, so a
    // coarse fill is cheaper to write and read than a polygon triangulation.
    let u0 = Infinity; let v0 = Infinity; let u1 = -Infinity; let v1 = -Infinity;
    for (const [u, v] of pond.poly) {
      if (u < u0) u0 = u;
      if (u > u1) u1 = u;
      if (v < v0) v0 = v;
      if (v > v1) v1 = v;
    }
    const cell = 60;
    const cu = cell / FRAME.widthM;
    const cv = cell / FRAME.heightM;

    const cells = [];
    for (let v = v0; v < v1; v += cv) {
      for (let u = u0; u < u1; u += cu) {
        const mu = u + cu / 2;
        const mv = v + cv / 2;
        if (!inPoly(pond.poly, mu, mv)) continue;
        cells.push([mu, mv, elevAt(field, mu, mv)]);
      }
    }
    if (!cells.length) continue;

    // A pond holds one level, and that level comes from the terrain rather
    // than from the number written down beside it. The written figure is a
    // real-world elevation; this frame's relief is traced, not surveyed, and
    // Lake Murray's true 160 m sits 38 m above the mesa the trace gives it.
    // Taking the low quartile of the ground inside the outline puts the
    // surface just under the bank all the way round, whatever the mesa does.
    const sorted = cells.map((c) => c[2]).sort((a, b) => a - b);
    const level = sorted[Math.floor(sorted.length * 0.6)];

    const DEPTH = 1.0;
    for (const [mu, mv, ground] of cells) {
      // Ground above the surface is bank, not water. Dropping those cells is
      // what makes the outline follow a contour instead of a drawn shape —
      // Lake Murray's traced outline crosses the mesa rim, and without this
      // the lake climbed 13 m up the hillside at one end and buried itself
      // 34 m under it at the other.
      if (ground > level) continue;
      out.push({
        u: mu,
        v: mv,
        rot: 0,
        w: cell + 2,
        d: cell + 2,
        h: DEPTH,
        // Relative to this cell's own ground, so the surface comes out at
        // `level` everywhere whatever the terrain under it does.
        base: level - ground - DEPTH,
        feature: pond.id,
      });
    }
  }

  return out;
}

/** Metres from a point to the nearest river centreline, for callers that care. */
export function riverDistance(u, v) {
  let best = Infinity;
  for (const river of RIVERS) {
    const d = distToLine(river.pts, u, v) * FRAME.widthM - river.w / 2;
    if (d < best) best = d;
  }
  return best;
}

// ── Into the same shape as everything else ──────────────────────────────────

/**
 * Convert the scatter into the box records the exporter and both consumers
 * already understand, rather than inventing a second format for it.
 *
 * A tree is two boxes: a trunk and a crown sitting on top of it. One would be
 * cheaper and is what a distant impostor does, but a crown floating at 14 m
 * with nothing under it is exactly the artefact you notice from the ground,
 * and this map is walked as well as flown over.
 *
 * The kinds are chosen so a consumer can give each one an appropriate mesh —
 * a cylinder for trunks, a sphere for crowns and rock, a cube for water. Every
 * one of them starts life as the engine cube if nothing better is assigned,
 * which is ugly but never wrong.
 */
export function natureBoxes(nat) {
  const out = [];

  for (const p of nat.plants) {
    if (p.species === 'shrub') {
      out.push({
        u: p.u, v: p.v, rot: p.rot,
        w: p.r * 2, d: p.r * 2, h: p.h, base: 0,
        kind: 'shrub', district: 'nature',
      });
      continue;
    }

    // Palms are nearly all trunk; broadleaves are nearly all crown.
    const trunkFrac = p.species === 'palm' ? 0.82 : 0.42;
    const trunkH = p.h * trunkFrac;
    const trunkR = p.species === 'palm' ? 0.28 : Math.max(0.25, p.r * 0.13);

    out.push({
      u: p.u, v: p.v, rot: p.rot,
      w: trunkR * 2, d: trunkR * 2, h: trunkH, base: 0,
      kind: 'tree_trunk', district: 'nature',
    });
    out.push({
      u: p.u, v: p.v, rot: p.rot,
      w: p.r * 2, d: p.r * 2, h: p.h - trunkH, base: trunkH,
      kind: p.species === 'palm' ? 'palm' : 'tree', district: 'nature',
    });
  }

  for (const rk of nat.rocks) {
    out.push({
      u: rk.u, v: rk.v, rot: rk.rot,
      w: rk.size, d: rk.size * (0.7 + (rk.size % 1) * 0.5), h: rk.size * 0.62,
      base: -rk.size * 0.2,          // half buried, the way a boulder sits
      kind: 'rock', district: 'nature',
    });
  }

  for (const wf of nat.water) {
    out.push({
      u: wf.u, v: wf.v, rot: wf.rot,
      w: wf.w, d: wf.d, h: wf.h, base: wf.base ?? 0,
      kind: 'water', district: 'nature',
    });
  }

  return out;
}
