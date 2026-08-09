// Everything that belongs to a road but is not the tarmac: kerbs, lights,
// signs, ramps, bridges and fences.
//
// Up to now a freeway crossed another freeway by passing through it, a road
// crossed the bay by lying on the seabed, and every street ended at a hard edge
// with no kerb and nothing standing beside it. From twelve kilometres up none of
// that shows. From the pavement it is the whole difference between a road and a
// grey stripe.
//
// The interchanges are the interesting part, because they are not authored.
// Where two routes cross is a fact about the geometry, so it is computed: find
// the crossing, decide which route goes over, raise its deck, drop piers under
// it, and sweep four ramps round the quadrants. That way re-tracing a freeway
// moves its interchanges with it instead of leaving them behind.

import { FRAME, FREEWAYS, landField } from './SanDiegoGeo.js';
import { ARTERIALS } from './SanDiegoDistricts.js';
import { rng, hashStr, elevAt, landAt } from './CityFabric.js';

const DEG = Math.PI / 180;
const toM = ([u, v]) => [u * FRAME.widthM, v * FRAME.heightM];
const toUv = (x, y) => [x / FRAME.widthM, y / FRAME.heightM];

// ── Dimensions ──────────────────────────────────────────────────────────────

export const FURNITURE = {
  /** Kerb: 150 mm upstand, 400 mm wide, on the arterials and collectors only.
   *  Every residential street too would be another 200,000 instances for
   *  something you cannot see from a moving car. */
  kerb: { h: 0.15, w: 0.45, stepM: 30 },

  /** Street lighting. Arterials get both sides, collectors one. */
  light: { spacingArterialM: 34, spacingCollectorM: 52, poleH: 9.5, poleR: 0.16, armL: 1.9 },

  /** Signs at junctions, and the gantries over the freeways. */
  sign: { postH: 2.6, panelW: 0.95, panelH: 0.75, gantryEveryM: 1400 },

  /** Interchanges. */
  ramp: {
    widthM: 11,
    /** How far back along each route a ramp leaves the carriageway. */
    tangentM: 240,
    /** Vertical separation between the two decks. */
    clearanceM: 8.2,
    segmentM: 26,
  },

  /** Bridges: a deck over water, on piers. */
  bridge: { pierEveryM: 46, pierW: 3.2, deckThickM: 1.6, minSpanM: 60 },

  /** Chain link, 2.4 m, in 8 m bays. */
  fence: { h: 2.4, bayM: 8, thickM: 0.08 },
};

// ── Geometry helpers ────────────────────────────────────────────────────────

/** Walk a polyline in metres at a fixed spacing, carrying the heading. */
function walk(ptsUv, stepM) {
  const pts = ptsUv.map(toM);
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const n = Math.max(1, Math.round(len / stepM));
    const head = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    for (let s = 0; s < n; s++) {
      const t0 = s / n;
      const t1 = (s + 1) / n;
      out.push({
        x: ax + (bx - ax) * (t0 + t1) / 2,
        y: ay + (by - ay) * (t0 + t1) / 2,
        len: len / n,
        head,
        /** Unit vector along the run, and its left normal. */
        dir: [(bx - ax) / len, (by - ay) / len],
        nrm: [-(by - ay) / len, (bx - ax) / len],
      });
    }
  }
  return out;
}

/** Where two segments cross, or null. Both in metres. */
function segmentCross(a0, a1, b0, b1) {
  const r = [a1[0] - a0[0], a1[1] - a0[1]];
  const s = [b1[0] - b0[0], b1[1] - b0[1]];
  const denom = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(denom) < 1e-9) return null;          // parallel
  const qp = [b0[0] - a0[0], b0[1] - a0[1]];
  const t = (qp[0] * s[1] - qp[1] * s[0]) / denom;
  const u = (qp[0] * r[1] - qp[1] * r[0]) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return {
    x: a0[0] + r[0] * t,
    y: a0[1] + r[1] * t,
    headA: (Math.atan2(r[1], r[0]) * 180) / Math.PI,
    headB: (Math.atan2(s[1], s[0]) * 180) / Math.PI,
  };
}

/** Every crossing between two named routes. */
function crossings(routeA, routeB) {
  const A = routeA.pts.map(toM);
  const B = routeB.pts.map(toM);
  const out = [];
  for (let i = 1; i < A.length; i++) {
    for (let j = 1; j < B.length; j++) {
      const hit = segmentCross(A[i - 1], A[i], B[j - 1], B[j]);
      if (hit) out.push(hit);
    }
  }
  return out;
}

/** Quadratic Bezier through three points in metres. */
function bezier(p0, c, p1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    out.push([
      m * m * p0[0] + 2 * m * t * c[0] + t * t * p1[0],
      m * m * p0[1] + 2 * m * t * c[1] + t * t * p1[1],
    ]);
  }
  return out;
}

// ── Interchanges ────────────────────────────────────────────────────────────

/**
 * Ramps, decks and piers wherever two routes cross.
 *
 * Which route goes over is decided by rank rather than at random: a freeway
 * beats an arterial, and between two freeways the one whose number is lower
 * goes under, which is arbitrary but stable — the alternative is that the
 * answer changes every time the file is re-read and half the city's overpasses
 * silently swap ends.
 */
function interchanges(field, r) {
  const out = [];
  const routes = [
    ...FREEWAYS.filter((f) => !f.surface).map((f, i) => ({ ...f, rank: 100 - i, freeway: true })),
    ...ARTERIALS.map((a, i) => ({ ...a, width: a.w, rank: 50 - i * 0.01, freeway: false })),
  ];

  const cfg = FURNITURE.ramp;
  const seen = [];

  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const A = routes[i];
      const B = routes[j];
      // Arterial-on-arterial is a traffic light, not an interchange.
      if (!A.freeway && !B.freeway) continue;

      for (const hit of crossings(A, B)) {
        // Two traced polylines can cross twice within a few metres where they
        // run close and nearly parallel. One interchange per place.
        if (seen.some((s) => Math.hypot(s.x - hit.x, s.y - hit.y) < 260)) continue;
        seen.push(hit);

        const [u, v] = toUv(hit.x, hit.y);
        if (landAt(field, u, v) <= 0) continue;      // crossing over water: a bridge job
        const ground = elevAt(field, u, v);

        const over = A.rank >= B.rank ? A : B;
        const under = over === A ? B : A;
        const overHead = over === A ? hit.headA : hit.headB;
        const underHead = over === A ? hit.headB : hit.headA;
        const deck = ground + cfg.clearanceM;

        // The deck: a raised carriageway carried across the junction, long
        // enough to clear the road beneath plus its shoulders.
        const deckLen = Math.max(90, under.width * 3.5 + 70);
        out.push({
          kind: 'bridge_deck',
          x: hit.x, y: hit.y, rot: overHead,
          w: deckLen, d: over.width + 3, h: FURNITURE.bridge.deckThickM,
          base: cfg.clearanceM - FURNITURE.bridge.deckThickM,
        });

        // Piers, clear of the road underneath.
        const oc = Math.cos(overHead * DEG);
        const os = Math.sin(overHead * DEG);
        for (const side of [-1, 1]) {
          const d = side * (under.width / 2 + 14);
          out.push({
            kind: 'pier',
            x: hit.x + oc * d, y: hit.y + os * d, rot: overHead,
            w: 3.4, d: over.width + 1, h: cfg.clearanceM - FURNITURE.bridge.deckThickM,
            base: 0,
          });
        }

        // Four quadrant ramps. Each leaves one route, curves through the
        // junction and joins the other; the control point is the crossing
        // itself, which is what makes the curve read as a proper sweep rather
        // than as a chamfered corner.
        const tan = cfg.tangentM;
        const ac = [Math.cos(hit.headA * DEG), Math.sin(hit.headA * DEG)];
        const bc = [Math.cos(hit.headB * DEG), Math.sin(hit.headB * DEG)];
        for (const sa of [-1, 1]) {
          for (const sb of [-1, 1]) {
            const p0 = [hit.x + ac[0] * tan * sa, hit.y + ac[1] * tan * sa];
            const p1 = [hit.x + bc[0] * tan * sb, hit.y + bc[1] * tan * sb];
            const ctrl = [hit.x, hit.y];
            const n = Math.max(6, Math.round(tan * 2 / cfg.segmentM));
            const curve = bezier(p0, ctrl, p1, n);
            for (let k = 1; k < curve.length; k++) {
              const [x0, y0] = curve[k - 1];
              const [x1, y1] = curve[k];
              const len = Math.hypot(x1 - x0, y1 - y0);
              if (len < 1) continue;
              // Ramps climb from the low route to the high one across the
              // sweep, so neither end is a step.
              const t = (k - 0.5) / (curve.length - 1);
              const lift = Math.sin(t * Math.PI) * cfg.clearanceM * 0.5;
              out.push({
                kind: 'ramp',
                x: (x0 + x1) / 2, y: (y0 + y1) / 2,
                rot: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI,
                w: len + 3, d: cfg.widthM, h: 0.45,
                base: lift,
              });
            }
          }
        }
      }
    }
  }
  return { pieces: out, count: seen.length };
}

// ── Bridges over water ──────────────────────────────────────────────────────

/**
 * Any stretch of road whose ground is sea gets a deck and piers.
 *
 * The freeway builder already holds SR-75 at a fixed 62 m because it was told
 * to. This finds the rest of them — the arterials that cross the river mouth,
 * the causeways over Mission Bay — without anybody having to notice first.
 */
function waterCrossings(field) {
  const out = [];
  const cfg = FURNITURE.bridge;
  const routes = [
    ...FREEWAYS.filter((f) => !f.bridge).map((f) => ({ pts: f.pts, w: f.width })),
    ...ARTERIALS.map((a) => ({ pts: a.pts, w: a.w })),
  ];

  for (const route of routes) {
    const steps = walk(route.pts, 24);
    let run = null;
    const flush = () => {
      if (!run) return;
      const span = run.len;
      if (span >= cfg.minSpanM) {
        for (const s of run.steps) {
          const [u, v] = toUv(s.x, s.y);
          out.push({
            kind: 'bridge_deck',
            x: s.x, y: s.y, rot: s.head,
            w: s.len + 2, d: route.w + 2.4, h: cfg.deckThickM,
            base: run.deckM,
            water: true,
          });
        }
        // Piers down the span.
        let acc = 0;
        for (const s of run.steps) {
          acc += s.len;
          if (acc < cfg.pierEveryM) continue;
          acc = 0;
          out.push({
            kind: 'pier',
            x: s.x, y: s.y, rot: s.head,
            w: cfg.pierW, d: cfg.pierW, h: run.deckM,
            base: 0,
            water: true,
          });
        }
      }
      run = null;
    };

    for (const s of steps) {
      const [u, v] = toUv(s.x, s.y);
      const wet = landField(u, v) <= 0;
      if (wet) {
        if (!run) run = { steps: [], len: 0, deckM: 7.5 };
        run.steps.push(s);
        run.len += s.len;
      } else {
        flush();
      }
    }
    flush();
  }
  return out;
}

// ── Kerbs, lights and signs ─────────────────────────────────────────────────

function furnishRoad(route, widthM, tier, field, r, out, counters) {
  const kerb = FURNITURE.kerb;
  const light = FURNITURE.light;

  // Kerbs, both sides, on a coarse step. They are 150 mm tall: from anywhere
  // above head height they are invisible, and from the pavement they are the
  // line that tells you where the road stops.
  for (const s of walk(route, kerb.stepM)) {
    for (const side of [-1, 1]) {
      const off = side * (widthM / 2 + kerb.w / 2);
      out.push({
        kind: 'kerb',
        x: s.x + s.nrm[0] * off, y: s.y + s.nrm[1] * off,
        rot: s.head, w: s.len + 0.6, d: kerb.w, h: kerb.h, base: 0,
      });
      counters.kerbs++;
    }
  }

  const spacing = tier === 'arterial'
    ? light.spacingArterialM : light.spacingCollectorM;
  let side = 1;
  for (const s of walk(route, spacing)) {
    // Arterials are lit from both sides, collectors from alternating sides —
    // which is both cheaper and what a residential collector actually has.
    const sides = tier === 'arterial' ? [-1, 1] : [side];
    side = -side;
    for (const sd of sides) {
      const off = sd * (widthM / 2 + 1.4);
      const px = s.x + s.nrm[0] * off;
      const py = s.y + s.nrm[1] * off;
      out.push({
        kind: 'lamp_post',
        x: px, y: py, rot: s.head,
        w: light.poleR * 2, d: light.poleR * 2, h: light.poleH, base: 0,
      });
      out.push({
        kind: 'lamp_head',
        x: px - s.nrm[0] * sd * light.armL, y: py - s.nrm[1] * sd * light.armL,
        rot: s.head,
        w: 1.5, d: 0.42, h: 0.34, base: light.poleH - 0.5,
      });
      counters.lights++;
    }
  }
}

/** Junction signs, plus the freeway gantries. */
function signs(field, r, out, counters, collectors) {
  const cfg = FURNITURE.sign;

  // Every junction worth signing: arterial on arterial, and the collectors —
  // the streets with the bus route — where they meet an arterial or each
  // other. Not the residential streets: signing all of those is another
  // hundred thousand instances for a sign nobody reads twice.
  const junctionSets = [];
  for (let i = 0; i < ARTERIALS.length; i++) {
    for (let j = i + 1; j < ARTERIALS.length; j++) {
      junctionSets.push([ARTERIALS[i], ARTERIALS[j]]);
    }
  }
  for (const c of collectors) {
    for (const a of ARTERIALS) junctionSets.push([c, a]);
  }
  for (let i = 0; i < collectors.length; i++) {
    for (let j = i + 1; j < collectors.length; j++) {
      // Only within the same neighbourhood: two collectors in districts a
      // kilometre apart cannot meet, and testing them is most of the work.
      if (collectors[i].district !== collectors[j].district) continue;
      junctionSets.push([collectors[i], collectors[j]]);
    }
  }

  const placed = [];
  for (const [A, B] of junctionSets) {
      for (const hit of crossings(A, B)) {
        if (placed.some((q) => Math.hypot(q.x - hit.x, q.y - hit.y) < 24)) continue;
        placed.push(hit);
        const [u, v] = toUv(hit.x, hit.y);
        if (landAt(field, u, v) <= 0) continue;
        // One street-name assembly on the far right corner of each approach.
        for (const q of [[1, 1], [-1, -1]]) {
          const off = 14;
          const px = hit.x + Math.cos(hit.headA * DEG) * off * q[0]
            - Math.sin(hit.headA * DEG) * off * q[1];
          const py = hit.y + Math.sin(hit.headA * DEG) * off * q[0]
            + Math.cos(hit.headA * DEG) * off * q[1];
          out.push({
            kind: 'sign_post', x: px, y: py, rot: hit.headA,
            w: 0.12, d: 0.12, h: cfg.postH, base: 0,
          });
          out.push({
            kind: 'sign', x: px, y: py, rot: hit.headB,
            w: cfg.panelW, d: 0.06, h: cfg.panelH, base: cfg.postH - cfg.panelH,
          });
          counters.signs++;
        }
      }
  }

  // Overhead guide signs on the freeways: a gantry every kilometre and a half.
  for (const f of FREEWAYS) {
    let acc = 0;
    for (const s of walk(f.pts, 40)) {
      acc += s.len;
      if (acc < cfg.gantryEveryM) continue;
      acc = 0;
      const [u, v] = toUv(s.x, s.y);
      if (landAt(field, u, v) <= 0) continue;
      const span = f.width + 6;
      out.push({
        kind: 'sign_post', x: s.x + s.nrm[0] * span / 2, y: s.y + s.nrm[1] * span / 2,
        rot: s.head, w: 0.5, d: 0.5, h: 7.4, base: 0,
      });
      out.push({
        kind: 'sign_post', x: s.x - s.nrm[0] * span / 2, y: s.y - s.nrm[1] * span / 2,
        rot: s.head, w: 0.5, d: 0.5, h: 7.4, base: 0,
      });
      out.push({
        kind: 'sign', x: s.x, y: s.y, rot: s.head,
        w: 1.0, d: span, h: 0.4, base: 7.0,
      });
      out.push({
        kind: 'sign', x: s.x, y: s.y, rot: s.head,
        w: 0.4, d: span * 0.55, h: 2.8, base: 4.0,
      });
      counters.gantries++;
    }
  }
}

// ── Fences ──────────────────────────────────────────────────────────────────

/**
 * Chain link round the things that are actually fenced: the airfields, the
 * naval bases and the depot. A fence is a boundary you can see from the
 * ground, and it is most of what tells you that you have walked from the city
 * onto a base.
 */
function fences(perimeters, field, out, counters) {
  const cfg = FURNITURE.fence;
  for (const poly of perimeters) {
    const closed = [...poly, poly[0]];
    for (const s of walk(closed, cfg.bayM)) {
      const [u, v] = toUv(s.x, s.y);
      if (landAt(field, u, v) <= 0) continue;
      out.push({
        kind: 'fence', x: s.x, y: s.y, rot: s.head,
        w: s.len + 0.2, d: cfg.thickM, h: cfg.h, base: 0,
      });
      counters.fence++;
    }
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * @param {object} city   result of generateCity, for its street list
 * @param {object} field  the buildability raster
 * @param {object} [opts]
 * @param {Array}  [opts.fencePolys] outlines to fence, in normalised (u,v)
 */
export function buildRoadFurniture(city, field, opts = {}) {
  const r = rng(hashStr('furniture') ^ 0x2b7c19);
  const pieces = [];
  const counters = { kerbs: 0, lights: 0, signs: 0, gantries: 0, fence: 0 };

  for (const a of ARTERIALS) {
    furnishRoad(a.pts, a.w, 'arterial', field, r, pieces, counters);
  }
  for (const s of city.streets) {
    if (s.kind !== 'collector') continue;
    furnishRoad(s.pts, s.w, 'collector', field, r, pieces, counters);
  }

  const collectors = city.streets.filter((s) => s.kind === 'collector');
  signs(field, r, pieces, counters, collectors);

  const inter = interchanges(field, r);
  pieces.push(...inter.pieces);

  const bridges = waterCrossings(field);
  pieces.push(...bridges);

  if (opts.fencePolys && opts.fencePolys.length) {
    fences(opts.fencePolys, field, pieces, counters);
  }

  // Into the same normalised box records as everything else.
  const boxes = pieces.map((p) => ({
    u: p.x / FRAME.widthM,
    v: p.y / FRAME.heightM,
    rot: p.rot,
    w: p.w,
    d: p.d,
    h: p.h,
    base: p.base ?? 0,
    water: !!p.water,
    kind: p.kind,
    district: 'roads',
  }));

  return {
    boxes,
    stats: {
      ...counters,
      interchanges: inter.count,
      interchangeParts: inter.pieces.length,
      waterCrossingParts: bridges.length,
      total: boxes.length,
    },
  };
}
