import { POIS, DOWNTOWN_GRID } from '../config.js';

// The downtown layout, computed once from DOWNTOWN_GRID and shared by everything
// that needs to know where a block or a street is:
//
//   Roads.js               paints the streets into the heightfield
//   structures/Catalog.js  fills the blocks with buildings
//
// Both used to re-derive the grid from their own copies of the constants, held
// together by a "keep in sync" comment. They read this instead.

/** District code → human name (for notes / debugging). */
export const DISTRICTS = {
  M: 'marina',
  L: 'littleitaly',
  F: 'financial',
  C: 'civic',
  G: 'gaslamp',
  E: 'eastvillage',
  P: 'parking',
};

function anchor() {
  const dt = POIS.find((p) => p.id === 'downtown');
  return { x: dt?.x ?? 140, z: dt?.z ?? 360 };
}

/**
 * Widths of the street lines on one axis. There are (n + 1) lines for n blocks:
 * line i runs along the leading (north / west) edge of block i, and line n closes
 * the far edge. One line per axis is widened into a spine.
 */
function lineWidths(n, spineIndex, spineW, streetW) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(i === spineIndex ? spineW : streetW);
  return out;
}

/**
 * Lay out one axis: returns the centre of every street line and the leading edge
 * of every block, centred on `centre`.
 */
function layoutAxis(n, blockSize, widths, centre) {
  const lineAt = [];
  const blockAt = [];
  let cursor = 0;
  for (let i = 0; i < n; i++) {
    lineAt.push(cursor + widths[i] / 2);
    blockAt.push(cursor + widths[i]);
    cursor += widths[i] + blockSize;
  }
  lineAt.push(cursor + widths[n] / 2);
  const total = cursor + widths[n];
  const shift = centre - total / 2;
  return {
    lineAt: lineAt.map((v) => v + shift),
    blockAt: blockAt.map((v) => v + shift),
    total,
    min: shift,
    max: shift + total,
  };
}

/** Inclusive block-rect landmarks, resolved to world AABBs. */
function resolveLandmarks(G, ax, az) {
  const out = [];
  for (const lm of G.landmarks ?? []) {
    const c0 = Math.min(lm.c0, lm.c1);
    const c1 = Math.max(lm.c0, lm.c1);
    const r0 = Math.min(lm.r0, lm.r1);
    const r1 = Math.max(lm.r0, lm.r1);
    if (c1 >= G.cols || r1 >= G.rows) continue;
    const x = ax.blockAt[c0];
    const z = az.blockAt[r0];
    // Span the blocks *and* the streets between them.
    const w = ax.blockAt[c1] + G.blockW - x;
    const d = az.blockAt[r1] + G.blockD - z;
    out.push({ id: lm.id, c0, r0, c1, r1, x, z, w, d });
  }
  return out;
}

/**
 * Full downtown plan. Pass an explicit centre to preview an alternate placement;
 * otherwise it follows the `downtown` POI anchor.
 */
export function downtownPlan(cx = null, cz = null) {
  const G = DOWNTOWN_GRID;
  const a = anchor();
  const centreX = cx ?? a.x;
  const centreZ = cz ?? a.z;

  const avW = lineWidths(G.cols, G.spineAvenue, G.spineAvenueW, G.streetW);
  const stW = lineWidths(G.rows, G.spineStreet, G.spineStreetW, G.streetW);
  const ax = layoutAxis(G.cols, G.blockW, avW, centreX);
  const az = layoutAxis(G.rows, G.blockD, stW, centreZ);

  const landmarks = resolveLandmarks(G, ax, az);
  const claimedBy = new Map(); // "c,r" → landmark id
  for (const lm of landmarks) {
    for (let r = lm.r0; r <= lm.r1; r++) {
      for (let c = lm.c0; c <= lm.c1; c++) claimedBy.set(`${c},${r}`, lm.id);
    }
  }

  const blocks = [];
  for (let r = 0; r < G.rows; r++) {
    const row = G.districts[r] ?? '';
    for (let c = 0; c < G.cols; c++) {
      const code = row[c] ?? 'C';
      blocks.push({
        c,
        r,
        x: ax.blockAt[c],
        z: az.blockAt[r],
        w: G.blockW,
        d: G.blockD,
        code,
        district: DISTRICTS[code] ?? 'civic',
        landmark: claimedBy.get(`${c},${r}`) ?? null,
        // The bay is west, so column 0 is the waterfront — not the south rows.
        waterfront: c === 0,
        edgeN: r === 0,
        edgeS: r === G.rows - 1,
        edgeE: c === G.cols - 1,
      });
    }
  }

  return {
    cx: centreX,
    cz: centreZ,
    cols: G.cols,
    rows: G.rows,
    blockW: G.blockW,
    blockD: G.blockD,
    setback: G.setback,
    alleyW: G.alleyW,
    avenueX: ax.lineAt,
    avenueW: avW,
    streetZ: az.lineAt,
    streetW: stW,
    blocks,
    landmarks,
    bounds: { x0: ax.min, x1: ax.max, z0: az.min, z1: az.max },
  };
}

/**
 * Subtract landmark footprints from an interval on one axis.
 * `spans` are [lo, hi] pairs; each landmark that straddles the line removes its
 * own extent so streets stop at the ballpark rather than running through it.
 */
function clipSpan(lo, hi, cuts) {
  let spans = [[lo, hi]];
  for (const [c0, c1] of cuts) {
    const next = [];
    for (const [s0, s1] of spans) {
      if (c1 <= s0 || c0 >= s1) {
        next.push([s0, s1]);
        continue;
      }
      if (c0 > s0) next.push([s0, c0]);
      if (c1 < s1) next.push([c1, s1]);
    }
    spans = next;
  }
  return spans.filter(([s0, s1]) => s1 - s0 > 6);
}

/**
 * Downtown streets as heightfield polylines: avenues, streets, and the mid-block
 * alleys behind the low-rise districts. Segments inside a landmark are clipped out.
 */
export function downtownStreetLines(cx = null, cz = null) {
  const plan = downtownPlan(cx, cz);
  const lines = [];
  const { bounds } = plan;
  const MARGIN = 1.5; // keep pavement off the landmark's own footprint
  // The heightfield is a 4 m grid, so a street's asphalt edge can land up to a
  // cell short of the kerb and leave a strip of bare dirt showing between the
  // road and the sidewalk. Paint one cell wider on each side: the overhang ends
  // up under the sidewalk slab and the building footprints, where it never shows.
  const PAINT_PAD = 8;

  // N–S avenues
  for (let c = 0; c < plan.avenueX.length; c++) {
    const x = plan.avenueX[c];
    const cuts = plan.landmarks
      .filter((lm) => x > lm.x - MARGIN && x < lm.x + lm.w + MARGIN)
      .map((lm) => [lm.z - MARGIN, lm.z + lm.d + MARGIN]);
    for (const [z0, z1] of clipSpan(bounds.z0, bounds.z1, cuts)) {
      lines.push({
        id: `dt-ns-${c}-${Math.round(z0)}`,
        width: plan.avenueW[c] + PAINT_PAD,
        blend: 5,
        kind: 'street',
        pts: [{ x, z: z0 }, { x, z: z1 }],
      });
    }
  }

  // E–W streets
  for (let r = 0; r < plan.streetZ.length; r++) {
    const z = plan.streetZ[r];
    const cuts = plan.landmarks
      .filter((lm) => z > lm.z - MARGIN && z < lm.z + lm.d + MARGIN)
      .map((lm) => [lm.x - MARGIN, lm.x + lm.w + MARGIN]);
    for (const [x0, x1] of clipSpan(bounds.x0, bounds.x1, cuts)) {
      lines.push({
        id: `dt-ew-${r}-${Math.round(x0)}`,
        width: plan.streetW[r] + PAINT_PAD,
        blend: 5,
        kind: 'street',
        pts: [{ x: x0, z }, { x: x1, z }],
      });
    }
  }

  // Mid-block alleys behind the low-rise street walls (Gaslamp / Little Italy),
  // running E–W between the two rows of storefronts. Prime flanking routes.
  for (const b of plan.blocks) {
    if (b.landmark) continue;
    if (b.code !== 'G' && b.code !== 'L') continue;
    lines.push({
      id: `dt-alley-${b.c}-${b.r}`,
      width: plan.alleyW + PAINT_PAD,
      blend: 3,
      kind: 'alley',
      pts: [
        { x: b.x + 1.5, z: b.z + b.d / 2 },
        { x: b.x + b.w - 1.5, z: b.z + b.d / 2 },
      ],
    });
  }

  return lines;
}
