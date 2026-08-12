// The structural graph: what holds a building up, and what happens when it does
// not any more.
//
// This is the reference implementation. It is generated from a structure record
// and a seed and is never stored — 3.3 M elements across the map is a rounding
// error to compute and a serious file to keep, and the whole architecture rests
// on the server and every client deriving the identical graph from the same 88
// bytes. Whatever builds this in the engine has to agree with this file exactly,
// element for element and index for index, because element indices are what the
// damage state is addressed by.
//
// Destruction does not run on the mesh. It runs here. Every element carries a
// two-bit state, collapse is a reachability question rather than a simulation,
// and what goes over the wire is the state array.

// Bay spacing by archetype, in metres. A warehouse is long-span steel and a
// house is stud walls four metres apart; using one number gives the house
// cathedral bays and the warehouse a forest of columns.
const BAY_M = {
  house: 4.0,
  lowrise: 5.0,
  midrise: 6.0,
  warehouse: 12.0,
  highrise: 8.0,
  tower: 8.0,
  pad: 0,
};

// Perimeter wall panel width. Kept coarser than the bay grid on purpose: a wall
// panel is a thing that gets blown out, not a thing that holds the floor up.
const PANEL_M = 4.0;

export const KIND = { COLUMN: 0, SLAB: 1, WALL: 2, CORE: 3 };
export const KIND_NAME = ['column', 'slab', 'wall', 'core'];

// Intact, damaged, critical, destroyed. Two bits, and the reason the damage
// state for every building in San Diego fits in under a megabyte.
export const STATE = { INTACT: 0, DAMAGED: 1, CRITICAL: 2, DESTROYED: 3 };

/** Deterministic from the record's seed; the layout must never depend on
 *  iteration order, wall-clock time or floating-point luck. */
function rng(seed) {
  let s = (seed | 0) ^ 0x9e3779b9;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    return ((s ^= s >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Build the graph for one structure.
 *
 * Levels are numbered from grade. `columns[k]` spans level k to level k+1, so a
 * building of n storeys has n levels of column and n slabs above grade — the
 * topmost being the roof. There is no slab at level 0: the ground floor sits on
 * grade, which is also why it cannot fall.
 *
 * @param {{widthM:number, depthM:number, storeys:number, archetype:string,
 *          tier:number, seed:number}} rec
 */
export function buildGraph(rec) {
  const storeys = Math.max(0, Math.round(rec.storeys));
  const bay = BAY_M[rec.archetype] ?? 6;
  if (!storeys || !bay) {
    return { nx: 0, ny: 0, storeys: 0, panels: 0, count: 0, index: null, coreBay: -1 };
  }

  const nx = Math.max(1, Math.round(rec.widthM / bay));
  const ny = Math.max(1, Math.round(rec.depthM / bay));
  const gx = nx + 1;             // column grid points across
  const gy = ny + 1;
  const panels = Math.max(4, Math.ceil((2 * (rec.widthM + rec.depthM)) / PANEL_M));

  const perStoreyCols = gx * gy;
  const perStoreySlabs = nx * ny;
  const perStoreyWalls = panels;

  // The circulation core: one bay, chosen deterministically, running the full
  // height. Its columns are shear walls rather than posts, which is both true
  // of real buildings and the thing that stops a tower folding the instant
  // somebody takes out a corner. Only tiers A and B have one; a two-storey
  // house has a staircase, not a core.
  let coreBay = -1;
  if (rec.tier >= 2 && nx * ny > 1) {
    const r = rng(rec.seed);
    // Kept off the perimeter where the plan allows it, because a lift shaft on
    // the outside wall is the one place it never is.
    const ix = nx > 2 ? 1 + Math.floor(r() * (nx - 2)) : Math.floor(r() * nx);
    const iy = ny > 2 ? 1 + Math.floor(r() * (ny - 2)) : Math.floor(r() * ny);
    coreBay = iy * nx + ix;
  }

  // Element indices are laid out storey by storey, columns then slabs then
  // walls, so an element id is arithmetic rather than a lookup — and so the
  // engine implementation can be checked against this one by index.
  const perStorey = perStoreyCols + perStoreySlabs + perStoreyWalls;
  const count = perStorey * storeys;

  return {
    nx, ny, gx, gy, storeys, panels, bay, coreBay,
    perStoreyCols, perStoreySlabs, perStoreyWalls, perStorey, count,
    columnAt: (k, i, j) => k * perStorey + j * gx + i,
    slabAt: (k, a, b) => k * perStorey + perStoreyCols + b * nx + a,
    wallAt: (k, p) => k * perStorey + perStoreyCols + perStoreySlabs + p,
    kindOf(id) {
      const o = id % perStorey;
      if (o < perStoreyCols) {
        if (coreBay < 0) return KIND.COLUMN;
        // A column is core if it is a corner of the core bay.
        const i = o % gx; const j = (o / gx) | 0;
        const cx = coreBay % nx; const cy = (coreBay / nx) | 0;
        return (i === cx || i === cx + 1) && (j === cy || j === cy + 1)
          ? KIND.CORE : KIND.COLUMN;
      }
      return o < perStoreyCols + perStoreySlabs ? KIND.SLAB : KIND.WALL;
    },
  };
}

/**
 * Which elements are still carried to the ground.
 *
 * Collapse is not simulated. An element either has a load path to grade or it
 * does not, and that is a single sweep upward — every element's support lives on
 * the storey below it, so one pass in level order resolves the whole building.
 * A tower is a few thousand elements; this is microseconds, not a solver.
 *
 * @param {object} g      graph from buildGraph
 * @param {Uint8Array} state  two-bit state per element, length g.count
 * @returns {Uint8Array}  1 where the element is standing and supported
 */
export function solve(g, state) {
  const up = new Uint8Array(g.count);
  if (!g.count) return up;
  const alive = (id) => state[id] !== STATE.DESTROYED;

  for (let k = 0; k < g.storeys; k++) {
    // Columns: carried by the column directly below, or by grade at level 0.
    for (let j = 0; j < g.gy; j++) {
      for (let i = 0; i < g.gx; i++) {
        const id = g.columnAt(k, i, j);
        if (!alive(id)) continue;
        up[id] = k === 0 ? 1 : up[g.columnAt(k - 1, i, j)];
      }
    }
    // Slabs: the floor at the top of this storey, carried by this storey's four
    // corner columns. Three corners stand. Two stand only if they share an edge
    // — a slab pinned at opposite diagonals is a seesaw, not a floor.
    for (let b = 0; b < g.ny; b++) {
      for (let a = 0; a < g.nx; a++) {
        const id = g.slabAt(k, a, b);
        if (!alive(id)) continue;
        const c00 = up[g.columnAt(k, a, b)];
        const c10 = up[g.columnAt(k, a + 1, b)];
        const c01 = up[g.columnAt(k, a, b + 1)];
        const c11 = up[g.columnAt(k, a + 1, b + 1)];
        const n = c00 + c10 + c01 + c11;
        if (n >= 3) up[id] = 1;
        else if (n === 2) up[id] = (c00 && c10) || (c01 && c11)
          || (c00 && c01) || (c10 && c11) ? 1 : 0;
      }
    }
    // Walls sit on the floor of their own storey — grade at level 0, otherwise
    // the slab below. Panels are distributed round the perimeter, so the nearest
    // bay is found by walking the perimeter in the same order they were laid.
    for (let p = 0; p < g.panels; p++) {
      const id = g.wallAt(k, p);
      if (!alive(id)) continue;
      if (k === 0) { up[id] = 1; continue; }
      const [a, b] = perimeterBay(g, p);
      up[id] = up[g.slabAt(k - 1, a, b)];
    }
  }
  return up;
}

/** The bay a perimeter panel stands on, walking the four sides in order. */
export function perimeterBay(g, p) {
  const t = p / g.panels;
  const per = 2 * (g.nx + g.ny);
  let s = t * per;
  if (s < g.nx) return [Math.min(g.nx - 1, Math.floor(s)), 0];
  s -= g.nx;
  if (s < g.ny) return [g.nx - 1, Math.min(g.ny - 1, Math.floor(s))];
  s -= g.ny;
  if (s < g.nx) return [g.nx - 1 - Math.min(g.nx - 1, Math.floor(s)), g.ny - 1];
  s -= g.nx;
  return [0, g.ny - 1 - Math.min(g.ny - 1, Math.floor(s))];
}

/**
 * Apply a solve: everything unsupported becomes destroyed, and that can expose
 * more. Iterated to a fixed point, which it reaches quickly because each round
 * strictly removes elements and a building has finitely many.
 *
 * @returns {{collapsed:number, rounds:number}}
 */
export function collapse(g, state) {
  let collapsed = 0;
  let rounds = 0;
  for (;;) {
    rounds++;
    const up = solve(g, state);
    let fell = 0;
    for (let i = 0; i < g.count; i++) {
      if (state[i] !== STATE.DESTROYED && !up[i]) { state[i] = STATE.DESTROYED; fell++; }
    }
    collapsed += fell;
    if (!fell) return { collapsed, rounds };
  }
}

/** Bytes of damage state for a graph, at two bits an element. */
export const stateBytes = (g) => Math.ceil(g.count / 4);

export { BAY_M, PANEL_M };
