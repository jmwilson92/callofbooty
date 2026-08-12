// Tier B interiors: 8,146 midrises and 804 warehouses.
//
// Tier B is not one thing. An apartment block and a distribution shed share a
// height band and nothing else, and the two generators here have almost no code
// in common — which is the point. Forcing one layout onto both is how you end up
// with a hangar partitioned into bedrooms.
//
//   midrise    a spine corridor down the long axis with units either side, and
//              the stair and lift at the ends. That is what a double-loaded
//              block is, and it is a much better answer than tier A's cross on a
//              plate this size, where a cross would be nearly all corridor.
//
//   warehouse  one tall volume, racking in aisles, a mezzanine office against
//              one wall, and roller doors on the elevation the road is on.
//              Never partitioned: the open span is the whole character of the
//              building and the only long indoor sightline on the map.
//
// The KSAN terminal and the North Island hangars are in here, so this is also
// where the design's aviation objectives get their insides.

const CORRIDOR_M = 1.6;
const UNIT_FRONT_M = 8.0;        // how much corridor an apartment takes up
const MIN_UNIT_M = 4.5;
const CORE_END_M = 5.0;          // stair and lift at each end of the spine
const MEZZ_FRACTION = 0.3;       // how much of a shed the mezzanine covers
const AISLE_M = 3.2;
const RACK_M = 2.4;
const DOCK_EVERY_M = 12;
const PROP_PER_M2 = 14;

export const ROOM_PROPS = {
  apartment: [['sofa', 'wall'], ['tv_unit', 'wall'], ['bed', 'wall'],
    ['wardrobe', 'wall'], ['counter', 'wall'], ['fridge', 'wall'],
    ['table_dining', 'free'], ['chair', 'free'], ['chair', 'free'],
    ['toilet', 'wall'], ['basin', 'wall'], ['plant', 'wall'], ['rug', 'free']],
  office_cell: [['desk', 'wall'], ['chair_office', 'free'], ['monitor', 'free'],
    ['cabinet', 'wall'], ['plant', 'wall']],
  corridor: [['lamp_ceiling', 'free'], ['sign_exit', 'wall']],
  lobby_small: [['desk_reception', 'wall'], ['sofa', 'free'], ['post_boxes', 'wall'],
    ['planter_large', 'wall']],
  shed_floor: [['rack_pallet', 'free'], ['crate', 'free'], ['pallet_stack', 'free'],
    ['forklift', 'free'], ['drum', 'free']],
  mezzanine: [['desk', 'wall'], ['chair_office', 'free'], ['monitor', 'free'],
    ['cabinet', 'wall'], ['table_meeting', 'free']],
  dock: [['pallet_stack', 'free'], ['crate', 'free'], ['table_work', 'wall']],
};

function rng(seed) {
  let s = (seed | 0) ^ 0x27d4eb2f;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    return ((s ^= s >>> 16) >>> 0) / 4294967296;
  };
}

function entryPoint(rec, hx, hy) {
  switch (Math.round(rec.doorSide ?? 0)) {
    case 0: return { x: hx, y: 0, rot: 90, axis: 'x', sign: 1 };
    case 1: return { x: 0, y: hy, rot: 180, axis: 'y', sign: 1 };
    case 2: return { x: -hx, y: 0, rot: 270, axis: 'x', sign: -1 };
    default: return { x: 0, y: -hy, rot: 0, axis: 'y', sign: -1 };
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

export function buildInterior(rec) {
  return rec.archetype === 'warehouse' ? shed(rec) : block(rec);
}

// ── The apartment block ─────────────────────────────────────────────────────

function block(rec) {
  const rand = rng(rec.seed);
  const W = rec.widthM; const D = rec.depthM;
  const storeys = Math.max(1, Math.round(rec.storeys));
  const fh = rec.floorHeightM || 3.2;
  const T = 0.12;
  const hx = W / 2 - T; const hy = D / 2 - T;
  const fall = Math.max(0, (rec.groundMaxM ?? 0) - (rec.groundMinM ?? 0));
  const floorZ = (rec.groundMaxM ?? 0) - 0.15;

  // The spine runs the long way. On a nearly square plate that choice is
  // arbitrary and it does not matter which way it falls, only that it is the
  // same on every floor.
  const alongX = W >= D;
  const spineHalf = CORRIDOR_M / 2;
  const spine = alongX
    ? { x0: -hx, x1: hx, y0: -spineHalf, y1: spineHalf }
    : { x0: -spineHalf, x1: spineHalf, y0: -hy, y1: hy };
  const depth = alongX ? hy - spineHalf : hx - spineHalf;
  const singleLoaded = depth < MIN_UNIT_M;      // too shallow for units both sides
  const spineLen = alongX ? 2 * hx : 2 * hy;
  const usable = spineLen - 2 * CORE_END_M;

  // A plate that cannot hold a stair at each end and one unit between them is
  // not an apartment block whatever its height says. Clamping the numbers
  // instead put the units outside the building — a 5.1 by 3.2 m "midrise" of ten
  // storeys had its flats laid from x 2.56 to 7.06 on a plate ending at 2.44.
  // These are shafts and stair towers, and they get what tier A's 47 slim
  // buildings get: one open volume a floor and a single flight.
  const slim = usable < MIN_UNIT_M || depth < 1.5;
  const perSide = Math.max(1, Math.round(Math.max(usable, MIN_UNIT_M) / UNIT_FRONT_M));

  const placements = [];
  const push = (kit, x, y, z, rot, room) => placements.push({ kit, x, y, z, rot, room });
  const entry = entryPoint(rec, hx, hy);
  const lift = storeys >= 4;
  const stairsN = storeys > 3 ? 2 : 1;
  const levels = [];

  for (let k = 0; k < storeys; k++) {
    const z = floorZ + k * fh;
    push('floor_slab', 0, 0, z, 0, null);
    push('ceiling', 0, 0, z + fh, 0, null);

    const rooms = slim
      ? [{ x0: -hx, y0: -hy, x1: hx, y1: hy, name: 'apartment', open: true }]
      : [{ ...spine, name: 'corridor', corridor: true }];
    const a0 = (alongX ? -hx : -hy) + CORE_END_M;

    for (const sideSign of slim ? [] : singleLoaded ? [1] : [1, -1]) {
      for (let i = 0; i < perSide; i++) {
        const a = a0 + (usable * i) / perSide;
        const b = a0 + (usable * (i + 1)) / perSide;
        const r = alongX
          ? {
            x0: a, x1: b,
            y0: sideSign > 0 ? spineHalf : -hy,
            y1: sideSign > 0 ? hy : -spineHalf,
            inner: sideSign > 0 ? 'y0' : 'y1', axis: 'x',
          }
          : {
            y0: a, y1: b,
            x0: sideSign > 0 ? spineHalf : -hx,
            x1: sideSign > 0 ? hx : -spineHalf,
            inner: sideSign > 0 ? 'x0' : 'x1', axis: 'y',
          };
        r.name = k === 0 && i === 0 && sideSign > 0 ? 'lobby_small'
          : rec.archetype === 'midrise' && rand() < 0.18 ? 'office_cell' : 'apartment';
        rooms.push(r);
      }
    }

    // Stair and lift take the ends of the spine, which is the one place they do
    // not eat into a unit. A slim building gets one flight against a wall.
    for (let s = 0; s < (slim ? 1 : stairsN); s++) {
      const at = slim ? 0
        : s === 0 ? (alongX ? -hx : -hy) + CORE_END_M / 2
          : (alongX ? hx : hy) - CORE_END_M / 2;
      push('stair_flight_dogleg', alongX ? at : 0, alongX ? 0 : at, z,
        alongX ? 0 : 90, 'core');
      if (lift && s === 0 && !slim) {
        push(k === 0 ? 'lift_door_lobby' : 'lift_door',
          alongX ? at : 1.2, alongX ? 1.2 : at, z, 0, 'core');
        push('lift_shaft', alongX ? at : 1.2, alongX ? 1.2 : at, z, 0, 'core');
      }
    }

    for (const r of rooms) {
      r.area = (r.x1 - r.x0) * (r.y1 - r.y0);
      if (r.corridor) continue;
      const cx = (r.x0 + r.x1) / 2; const cy = (r.y0 + r.y1) / 2;
      const dx = r.inner === 'x1' ? r.x1 : r.inner === 'x0' ? r.x0 : cx;
      const dy = r.inner === 'y1' ? r.y1 : r.inner === 'y0' ? r.y0 : cy;
      push('door_interior', dx, dy, z, r.axis === 'y' ? 90 : 0, r.name);
      push('wall_partition', cx, cy, z, r.axis === 'y' ? 0 : 90, r.name);
    }

    if (k === 0) push('door_front', entry.x, entry.y, z, entry.rot, 'lobby_small');

    const panels = Math.max(6, Math.round((2 * (W + D)) / 4.0));
    for (let p = 0; p < panels; p++) {
      const q = perimeterPoint(W, D, (p + 0.5) / panels);
      push('window_small', q.x, q.y, z, q.rot, null);
    }

    furnish(rooms, rand, push, z, ROOM_PROPS);
    levels.push({ z, use: 'resi', rooms, walls: rooms.length - 1 });
  }

  const counts = {};
  for (const p of placements) counts[p.kit] = (counts[p.kit] ?? 0) + 1;
  return {
    kind: 'midrise', floorZ, fall, singleLoaded, slim, lift,
    stairs: slim ? 1 : stairsN,
    levels, placements, counts,
  };
}

// ── The shed ────────────────────────────────────────────────────────────────

function shed(rec) {
  const rand = rng(rec.seed);
  const W = rec.widthM; const D = rec.depthM;
  const fh = rec.floorHeightM || 7;
  const T = 0.2;
  const hx = W / 2 - T; const hy = D / 2 - T;
  const fall = Math.max(0, (rec.groundMaxM ?? 0) - (rec.groundMinM ?? 0));
  const floorZ = (rec.groundMaxM ?? 0) - 0.15;

  // A shed's "storeys" are the height divided by a seven-metre clear span, which
  // is not a floor count — it is how tall the volume is. There is one floor and
  // sometimes a mezzanine, never five levels of shed.
  const tall = Math.max(1, Math.round(rec.storeys));
  const clearM = tall * fh;
  const mezz = tall > 1 && W * D > 900;

  const placements = [];
  const push = (kit, x, y, z, rot, room) => placements.push({ kit, x, y, z, rot, room });
  const entry = entryPoint(rec, hx, hy);
  const z = floorZ;

  push('floor_slab', 0, 0, z, 0, null);
  push('roof_deck', 0, 0, z + clearM, 0, null);

  // The mezzanine goes against the wall the road is on, over the doors, which is
  // where the office of a real shed is.
  const alongX = W >= D;
  const mezzRect = alongX
    ? {
      x0: -hx, x1: hx,
      y0: entry.sign > 0 ? hy - D * MEZZ_FRACTION : -hy,
      y1: entry.sign > 0 ? hy : -hy + D * MEZZ_FRACTION,
    }
    : {
      y0: -hy, y1: hy,
      x0: entry.sign > 0 ? hx - W * MEZZ_FRACTION : -hx,
      x1: entry.sign > 0 ? hx : -hx + W * MEZZ_FRACTION,
    };

  const rooms = [{ x0: -hx, y0: -hy, x1: hx, y1: hy, name: 'shed_floor', open: true }];
  if (mezz) {
    rooms.push({ ...mezzRect, name: 'mezzanine', level: 1 });
    push('mezzanine_deck', (mezzRect.x0 + mezzRect.x1) / 2,
      (mezzRect.y0 + mezzRect.y1) / 2, z + fh, 0, 'mezzanine');
    push('stair_industrial', (mezzRect.x0 + mezzRect.x1) / 2,
      alongX ? (entry.sign > 0 ? mezzRect.y0 - 1.5 : mezzRect.y1 + 1.5)
        : (mezzRect.y0 + mezzRect.y1) / 2, z, alongX ? 0 : 90, 'mezzanine');
  }

  // Racking in aisles, laid across the short axis so the aisles run the length
  // of the building — which is both how it is done and what makes a shed a
  // shooting gallery rather than a maze.
  const pitch = AISLE_M + RACK_M;
  const runs = Math.max(0, Math.floor(((alongX ? 2 * hy : 2 * hx) - AISLE_M) / pitch));
  for (let i = 0; i < runs; i++) {
    const at = (alongX ? -hy : -hx) + AISLE_M + pitch * i + RACK_M / 2;
    if (mezz && (alongX ? (at > mezzRect.y0 && at < mezzRect.y1)
      : (at > mezzRect.x0 && at < mezzRect.x1))) continue;
    const len = alongX ? 2 * hx : 2 * hy;
    const bays = Math.max(1, Math.round(len / 2.7));
    for (let b = 0; b < bays; b++) {
      const along = (alongX ? -hx : -hy) + (len * (b + 0.5)) / bays;
      push('rack_pallet', alongX ? along : at, alongX ? at : along, z,
        alongX ? 0 : 90, 'shed_floor');
    }
  }

  // Roller shutters along the elevation the road is on, plus a personnel door.
  const face = alongX ? 2 * hx : 2 * hy;
  const docks = Math.max(1, Math.floor(face / DOCK_EVERY_M));
  for (let i = 0; i < docks; i++) {
    const along = (alongX ? -hx : -hy) + (face * (i + 0.5)) / docks;
    push('door_roller', alongX ? along : entry.x, alongX ? entry.y : along, z,
      entry.rot, 'dock');
    push('dock_leveller', alongX ? along : entry.x, alongX ? entry.y : along, z,
      entry.rot, 'dock');
  }
  push('door_front', entry.x * 0.7, entry.y * 0.98, z, entry.rot, 'dock');

  // High-level strip glazing, which is all a shed has.
  const panels = Math.max(6, Math.round((2 * (W + D)) / 6.0));
  for (let p = 0; p < panels; p++) {
    const q = perimeterPoint(W, D, (p + 0.5) / panels);
    push('window_clerestory', q.x, q.y, z + clearM - 1.5, q.rot, null);
  }

  for (const r of rooms) r.area = (r.x1 - r.x0) * (r.y1 - r.y0);
  furnish(rooms, rand, push, z, ROOM_PROPS, 26);

  const counts = {};
  for (const p of placements) counts[p.kit] = (counts[p.kit] ?? 0) + 1;
  return {
    kind: 'warehouse', floorZ, fall, clearM, mezz, rackRuns: runs, docks,
    levels: [{ z, use: 'shed', rooms, walls: 0 }], placements, counts,
  };
}

function furnish(rooms, rand, push, z, props, perM2 = PROP_PER_M2) {
  for (const r of rooms) {
    if (r.area < 5) continue;
    const list = props[r.name] ?? props.shed_floor;
    const budget = Math.max(1, Math.round(r.area / perM2));
    for (let i = 0; i < Math.min(budget, list.length * (r.open ? 4 : 1)); i++) {
      const [kit, how] = list[i % list.length];
      let x; let y; let rot;
      if (how === 'wall') {
        const s = Math.floor(rand() * 4);
        const t = 0.15 + rand() * 0.7;
        if (s === 0) { x = r.x0 + (r.x1 - r.x0) * t; y = r.y0 + 0.5; rot = 0; }
        else if (s === 1) { x = r.x1 - 0.5; y = r.y0 + (r.y1 - r.y0) * t; rot = 90; }
        else if (s === 2) { x = r.x0 + (r.x1 - r.x0) * t; y = r.y1 - 0.5; rot = 180; }
        else { x = r.x0 + 0.5; y = r.y0 + (r.y1 - r.y0) * t; rot = 270; }
      } else {
        x = r.x0 + (r.x1 - r.x0) * (0.15 + rand() * 0.7);
        y = r.y0 + (r.y1 - r.y0) * (0.15 + rand() * 0.7);
        rot = Math.floor(rand() * 4) * 90;
      }
      push(kit, x, y, z, rot, r.name);
    }
  }
}

export { CORRIDOR_M, UNIT_FRONT_M, MEZZ_FRACTION, AISLE_M };
