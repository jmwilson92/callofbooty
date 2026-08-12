// Tier A interiors: the 1,141 towers and highrises.
//
// Two per cent of the buildings and a third of the floor area, and the only ones
// anybody will remember a fight in. They get the full treatment — a lift core
// and fire stairs running the whole height, a lobby at grade, escalators where
// the plate is big enough to want one, and floors laid out the way an office or
// an apartment block actually is.
//
// The layout is not Tier C with more rooms in it. A house is a tree of rooms and
// you get everywhere by walking through other rooms; a tower is a core with a
// corridor round it and everything hanging off that corridor. That difference is
// the whole file: rooms are cut out of the four bands between the corridor and
// the facade, so every room touches the corridor by construction and there is no
// office you can only reach through somebody else's.
//
// The core is not chosen here. structgraph.mjs already places one — it is a
// structural element, a set of shear walls holding the building up — and the
// interior has to be built around that same bay or the lift shaft and the thing
// carrying the load are in different places. buildInterior() takes the graph and
// asserts they agree.

import { buildGraph } from './structgraph.mjs';

const CORRIDOR_M = 1.8;
const ROOM_FRONT_M = 6.0;      // how much facade a perimeter room wants
const ROOM_DEPTH_M = 6.5;      // and how far back from it a cellular room goes
const MIN_ROOM_FRONT_M = 3.5;
const LOBBY_STOREYS = 1;
const ESCALATOR_MIN_M2 = 800;  // below this a lobby has stairs, not escalators
const M2_PER_LIFT = 4200;      // rule of thumb, and never fewer than two
const MAX_LIFTS = 8;
const PROP_PER_M2 = 12;

// What a floor is for. A tower in this city is mostly commercial low down and
// residential high up, and the two want completely different plans, so the use
// is decided per floor and the layout follows from it.
export const USE = { LOBBY: 'lobby', OFFICE: 'office', RESI: 'resi', PLANT: 'plant' };

export const ROOM_PROPS = {
  reception: [['desk_reception', 'wall'], ['sofa', 'free'], ['sofa', 'free'],
    ['table_low', 'free'], ['planter_large', 'wall'], ['planter_large', 'wall'],
    ['sign_directory', 'wall'], ['barrier_rope', 'free']],
  office_open: [['desk', 'free'], ['desk', 'free'], ['desk', 'free'], ['desk', 'free'],
    ['chair_office', 'free'], ['chair_office', 'free'], ['chair_office', 'free'],
    ['chair_office', 'free'], ['monitor', 'free'], ['monitor', 'free'],
    ['monitor', 'free'], ['monitor', 'free'], ['cabinet', 'wall'],
    ['printer', 'wall'], ['plant', 'wall'], ['whiteboard', 'wall']],
  office_cell: [['desk', 'wall'], ['chair_office', 'free'], ['monitor', 'free'],
    ['cabinet', 'wall'], ['plant', 'wall']],
  meeting: [['table_meeting', 'free'], ['chair_office', 'free'], ['chair_office', 'free'],
    ['chair_office', 'free'], ['chair_office', 'free'], ['screen_wall', 'wall'],
    ['whiteboard', 'wall']],
  breakout: [['counter', 'wall'], ['fridge', 'wall'], ['table_dining', 'free'],
    ['chair', 'free'], ['chair', 'free'], ['coffee_machine', 'wall']],
  apartment: [['sofa', 'wall'], ['tv_unit', 'wall'], ['table_low', 'free'],
    ['bed', 'wall'], ['wardrobe', 'wall'], ['counter', 'wall'], ['fridge', 'wall'],
    ['table_dining', 'free'], ['chair', 'free'], ['plant', 'wall'], ['rug', 'free']],
  wc: [['toilet', 'wall'], ['toilet', 'wall'], ['basin', 'wall'], ['basin', 'wall']],
  plant_room: [['plant_unit', 'free'], ['plant_unit', 'free'], ['duct_run', 'wall'],
    ['tank', 'wall'], ['switchgear', 'wall']],
  corridor: [['lamp_ceiling', 'free'], ['sign_exit', 'wall']],
};

function rng(seed) {
  let s = (seed | 0) ^ 0x1b873593;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    return ((s ^= s >>> 16) >>> 0) / 4294967296;
  };
}

/** The core bay's rectangle in the building's own frame, from the graph. */
export function coreRect(g, W, D) {
  if (!g || g.coreBay < 0) return null;
  const ix = g.coreBay % g.nx;
  const iy = (g.coreBay / g.nx) | 0;
  const bw = W / g.nx; const bd = D / g.ny;
  return {
    x0: -W / 2 + ix * bw, x1: -W / 2 + (ix + 1) * bw,
    y0: -D / 2 + iy * bd, y1: -D / 2 + (iy + 1) * bd,
  };
}

/**
 * Fill one quadrant between the corridor arms.
 *
 * The corridor is a cross, not a ring, and this is why. A ring round the core
 * only touches the middle of each facade, so the four corner rooms hang off
 * nothing — 2,822 floors' worth, which the connectivity check caught and no
 * amount of looking at a count would have. Running the corridor out to all four
 * facades leaves four quadrants, and a quadrant always has an arm along two of
 * its sides.
 *
 * Within a quadrant the rooms are cut across its longer dimension so that every
 * one of them lands on an arm, and if there is depth to spare behind them it
 * becomes open plan: cellular offices at the glass where the daylight is, open
 * floor behind. That is how a real plate works, and it is also the difference
 * between a floor that is all corridor and one worth fighting across.
 */
function quadrantRooms(q, rand, open) {
  const W = q.x1 - q.x0; const H = q.y1 - q.y0;
  if (W < 1.5 || H < 1.5) return [];
  if (open) return [{ ...q, open: true }];

  // Cut across the longer side, so each room spans the shorter one and lands on
  // the arm at its end.
  const alongX = W >= H;
  const span = alongX ? W : H;
  const depth = alongX ? H : W;
  if (span < MIN_ROOM_FRONT_M) return [{ ...q, open: true }];

  // The facade edge is the one opposite the arm the rooms open onto.
  const armLo = alongX ? q.armY === 'y0' : q.armX === 'x0';
  let cut = Math.min(ROOM_DEPTH_M, depth);
  if (depth - cut <= 2) cut = depth;      // no room for open plan; take it all
  const leftover = depth - cut;

  let strip; let openZone = null;
  if (alongX) {
    strip = armLo ? { ...q, y0: q.y1 - cut, inner: 'y0' } : { ...q, y1: q.y0 + cut, inner: 'y1' };
    if (leftover > 2) {
      openZone = armLo ? { ...q, y1: q.y1 - cut } : { ...q, y0: q.y0 + cut };
    }
  } else {
    strip = armLo ? { ...q, x0: q.x1 - cut, inner: 'x0' } : { ...q, x1: q.x0 + cut, inner: 'x1' };
    if (leftover > 2) {
      openZone = armLo ? { ...q, x1: q.x1 - cut } : { ...q, x0: q.x0 + cut };
    }
  }

  const n = Math.max(1, Math.round(span / ROOM_FRONT_M));
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (alongX ? strip.x0 : strip.y0) + (span * i) / n;
    const b = (alongX ? strip.x0 : strip.y0) + (span * (i + 1)) / n;
    out.push(alongX
      ? { x0: a, x1: b, y0: strip.y0, y1: strip.y1, inner: strip.inner, axis: 'x' }
      : { x0: strip.x0, x1: strip.x1, y0: a, y1: b, inner: strip.inner, axis: 'y' });
  }
  if (openZone) out.push({ ...openZone, open: true });
  return out;
}

/**
 * Lay out one Tier A building.
 *
 * @param {object} rec  structure record, as read from city-structures.bin
 * @param {object} [graph]  from structgraph.buildGraph; built here if omitted
 */
export function buildInterior(rec, graph) {
  const g = graph ?? buildGraph(rec);
  const rand = rng(rec.seed);
  const W = rec.widthM; const D = rec.depthM;
  const storeys = Math.max(1, Math.round(rec.storeys));
  const fh = rec.floorHeightM || 3.8;
  const T = 0.15;
  const hx = W / 2 - T; const hy = D / 2 - T;

  // A tower is not sat on a slope, it is cut into one: the plate is levelled at
  // the high side and the downhill side comes out of the ground. Across Tier A
  // the median fall is 2.3 m and 746 of the 1,141 exceed a metre, so an exposed
  // lower ground is the common case rather than a special one — and each of
  // those levels is playable floor with daylight on one side and earth on the
  // other, which is a good thing to have and a bad thing to discover late.
  const fall = Math.max(0, (rec.groundMaxM ?? 0) - (rec.groundMinM ?? 0));
  const floorZ = (rec.groundMaxM ?? 0) - 0.15;
  const lowerLevels = Math.floor(fall / fh);

  // The core, taken from the structure rather than invented. Where the graph has
  // no core bay — a single-bay plate — one is cut in the middle, which is the
  // only place it can go.
  let core = coreRect(g, W, D);
  let coreFromGraph = true;
  if (!core) {
    coreFromGraph = false;
    const cw = Math.min(W * 0.4, 9); const cd = Math.min(D * 0.4, 9);
    core = { x0: -cw / 2, x1: cw / 2, y0: -cd / 2, y1: cd / 2 };
  }
  // Keep the core, and the corridor round it, inside the plate. A wide bay on a
  // narrow building can otherwise put the corridor through the facade.
  core.x0 = Math.max(-hx + CORRIDOR_M + 0.5, core.x0);
  core.x1 = Math.min(hx - CORRIDOR_M - 0.5, core.x1);
  core.y0 = Math.max(-hy + CORRIDOR_M + 0.5, core.y0);
  core.y1 = Math.min(hy - CORRIDOR_M - 0.5, core.y1);
  const coreOK = core.x1 - core.x0 > 2 && core.y1 - core.y0 > 2;

  const ring = {
    x0: core.x0 - CORRIDOR_M, x1: core.x1 + CORRIDOR_M,
    y0: core.y0 - CORRIDOR_M, y1: core.y1 + CORRIDOR_M,
  };

  // Lifts and stairs. Two stairs above three storeys because that is what two
  // means of escape costs, and it is also the difference between a tower with
  // one way up and a tower with a flank.
  const floorArea = W * D * storeys;
  const lifts = coreOK
    ? Math.max(2, Math.min(MAX_LIFTS, Math.round(floorArea / M2_PER_LIFT)))
    : 0;
  const stairs = storeys > 3 ? 2 : 1;
  const escalator = W * D >= ESCALATOR_MIN_M2 && storeys > LOBBY_STOREYS;

  // Use by floor: commercial at the bottom, residential above, and the top floor
  // is plant. Which mix a given building gets is decided once from its seed.
  const resiFrom = (() => {
    if (storeys < 6) return storeys;              // too short to be mixed
    const r = rand();
    if (r < 0.45) return storeys;                 // all commercial
    if (r < 0.75) return LOBBY_STOREYS;           // residential above the lobby
    return LOBBY_STOREYS + Math.floor((storeys - LOBBY_STOREYS) * (0.3 + rand() * 0.4));
  })();

  const placements = [];
  const push = (kit, x, y, z, rot, room) =>
    placements.push({ kit, x, y, z, rot, room });

  const entry = entryPoint(rec, hx, hy);
  const levels = [];

  for (let k = 0; k < storeys; k++) {
    const z = floorZ + k * fh;
    const top = k === storeys - 1 && storeys > 2;
    const use = top ? USE.PLANT
      : k < LOBBY_STOREYS ? USE.LOBBY
        : k >= resiFrom ? USE.RESI : USE.OFFICE;

    push('floor_slab', 0, 0, z, 0, null);
    push('ceiling', 0, 0, z + fh, 0, null);

    // The core: shafts and flights, on every level, in the same place.
    if (coreOK) {
      const cw = core.x1 - core.x0;
      for (let l = 0; l < lifts; l++) {
        const t = (l + 0.5) / lifts;
        push(k === 0 ? 'lift_door_lobby' : 'lift_door',
          core.x0 + cw * t, core.y0 + 0.4, z, 0, 'core');
        push('lift_shaft', core.x0 + cw * t, core.y0 + 0.4, z, 0, 'core');
      }
      for (let s = 0; s < stairs; s++) {
        const t = (s + 0.5) / stairs;
        push('stair_flight_dogleg', core.x0 + cw * t, core.y1 - 0.9, z,
          0, 'core');
        if (k) push('door_fire', core.x0 + cw * t, core.y1 - 1.8, z, 180, 'core');
      }
      push('wall_core', (core.x0 + core.x1) / 2, (core.y0 + core.y1) / 2, z, 0, 'core');
    }

    // The corridor ring, and the rooms hanging off it.
    const rooms = [];
    if (!coreOK) {
      // A plate too narrow for a core and a corridor round it. These are real —
      // 47 of them, between 3.3 and 6.8 m across and up to eleven storeys — and
      // they are stair towers, not offices. One flight against the long wall and
      // the rest of the floor open. Without this they had no way up at all,
      // which no count would ever have shown.
      rooms.push({ x0: -hx, y0: -hy, x1: hx, y1: hy, name: 'office_open', open: true });
      const along = W >= D;
      push('stair_flight_dogleg', along ? -hx + 1.8 : 0, along ? 0 : -hy + 1.8,
        z, along ? 0 : 90, 'stair');
    } else {
      // The corridor cross: one arm each way, through the core, out to the glass.
      rooms.push({
        x0: -hx, x1: hx, y0: ring.y0, y1: ring.y1, name: 'corridor', corridor: true,
      });
      rooms.push({
        x0: ring.x0, x1: ring.x1, y0: -hy, y1: hy, name: 'corridor', corridor: true,
      });
      const quads = [
        { x0: -hx, x1: ring.x0, y0: -hy, y1: ring.y0, armX: 'x1', armY: 'y1' },
        { x0: ring.x1, x1: hx, y0: -hy, y1: ring.y0, armX: 'x0', armY: 'y1' },
        { x0: -hx, x1: ring.x0, y0: ring.y1, y1: hy, armX: 'x1', armY: 'y0' },
        { x0: ring.x1, x1: hx, y0: ring.y1, y1: hy, armX: 'x0', armY: 'y0' },
      ];
      quads.forEach((q, bi) => {
        // A lobby is one volume. An office floor keeps two of its four quadrants
        // open plan so there is somewhere to fight that is not a corridor.
        const openQ = use === USE.LOBBY || (use === USE.OFFICE && ((bi + k) % 2 === 0));
        for (const r of quadrantRooms(q, rand, openQ)) {
          r.name = use === USE.LOBBY ? (bi === 0 ? 'reception' : 'lobby_floor')
            : use === USE.PLANT ? 'plant_room'
              : use === USE.RESI ? 'apartment'
                : r.open ? 'office_open'
                  : rand() < 0.22 ? 'meeting' : rand() < 0.12 ? 'breakout' : 'office_cell';
          rooms.push(r);
        }
      });
      // Lavatories take the corner of the core on every working floor.
      if (use === USE.OFFICE || use === USE.RESI) {
        push('wc_block', core.x1 - 0.8, core.y1 - 0.8, z, 0, 'wc');
      }
    }

    for (const r of rooms) {
      r.area = (r.x1 - r.x0) * (r.y1 - r.y0);
      if (r.corridor || r.open) continue;
      // One door from the corridor into each room, on its inner edge.
      const cx = (r.x0 + r.x1) / 2; const cy = (r.y0 + r.y1) / 2;
      const dx = r.inner === 'x1' ? r.x1 : r.inner === 'x0' ? r.x0 : cx;
      const dy = r.inner === 'y1' ? r.y1 : r.inner === 'y0' ? r.y0 : cy;
      push('door_interior', dx, dy, z, r.axis === 'y' ? 90 : 0, r.name);
      push('wall_partition', cx, cy, z, r.axis === 'y' ? 0 : 90, r.name);
    }

    // Way in, and the escalator up out of the lobby.
    if (k === 0) {
      push('door_revolving', entry.x, entry.y, z, entry.rot, 'reception');
      push('facade_glazed', entry.x, entry.y, z, entry.rot, null);
      if (escalator) {
        const ex = ring.x1 + 1.5 < hx ? ring.x1 + 1.5 : ring.x0 - 1.5;
        push('escalator', ex, 0, z, 90, 'lobby_floor');
        push('escalator', ex, 2.2, z, 90, 'lobby_floor');
      }
    }

    // Curtain walling, storey by storey. A tower is mostly glass and the panels
    // are what a round goes through, so they are placed rather than implied.
    const per = 2 * (W + D);
    const panels = Math.max(8, Math.round(per / 3.0));
    for (let p = 0; p < panels; p++) {
      const q = perimeterPoint(W, D, (p + 0.5) / panels);
      push(use === USE.RESI ? 'facade_window' : 'facade_curtain', q.x, q.y, z, q.rot, null);
    }

    // Furniture.
    for (const r of rooms) {
      const list = ROOM_PROPS[r.name] ?? ROOM_PROPS.office_open;
      if (r.area < 4) continue;
      const budget = Math.max(1, Math.round((r.area / PROP_PER_M2)));
      for (let i = 0; i < Math.min(budget, list.length * (r.open ? 3 : 1)); i++) {
        const [kit, how] = list[i % list.length];
        const inset = 0.6;
        let x; let y; let rot;
        if (how === 'wall') {
          const s = Math.floor(rand() * 4);
          const t = 0.15 + rand() * 0.7;
          if (s === 0) { x = r.x0 + (r.x1 - r.x0) * t; y = r.y0 + inset; rot = 0; }
          else if (s === 1) { x = r.x1 - inset; y = r.y0 + (r.y1 - r.y0) * t; rot = 90; }
          else if (s === 2) { x = r.x0 + (r.x1 - r.x0) * t; y = r.y1 - inset; rot = 180; }
          else { x = r.x0 + inset; y = r.y0 + (r.y1 - r.y0) * t; rot = 270; }
        } else {
          x = r.x0 + (r.x1 - r.x0) * (0.2 + rand() * 0.6);
          y = r.y0 + (r.y1 - r.y0) * (0.2 + rand() * 0.6);
          rot = Math.floor(rand() * 4) * 90;
        }
        // Nothing in the core, and nothing in the corridor but lighting.
        if (x > ring.x0 && x < ring.x1 && y > ring.y0 && y < ring.y1 && !r.corridor) continue;
        push(kit, x, y, z, rot, r.name);
      }
    }

    levels.push({ z, use, rooms, walls: rooms.filter((r) => !r.corridor && !r.open).length });
  }

  const counts = {};
  for (const p of placements) counts[p.kit] = (counts[p.kit] ?? 0) + 1;
  return {
    floorZ, fall, lowerLevels, core, coreFromGraph, coreOK, slim: !coreOK,
    ring, lifts, stairs, escalator, resiFrom, levels, placements, counts,
  };
}

function entryPoint(rec, hx, hy) {
  switch (Math.round(rec.doorSide ?? 0)) {
    case 0: return { x: hx, y: 0, rot: 90 };
    case 1: return { x: 0, y: hy, rot: 180 };
    case 2: return { x: -hx, y: 0, rot: 270 };
    default: return { x: 0, y: -hy, rot: 0 };
  }
}

function perimeterPoint(W, D, t) {
  const per = 2 * (W + D);
  let s = t * per;
  if (s < W) return { x: -W / 2 + s, y: -D / 2, rot: 0 };
  s -= W;
  if (s < D) return { x: W / 2, y: -D / 2 + s, rot: 90 };
  s -= D;
  if (s < W) return { x: W / 2 - s, y: D / 2, rot: 180 };
  s -= W;
  return { x: -W / 2, y: D / 2 - s, rot: 270 };
}

export { CORRIDOR_M, ROOM_FRONT_M, ROOM_DEPTH_M, M2_PER_LIFT, ESCALATOR_MIN_M2 };
