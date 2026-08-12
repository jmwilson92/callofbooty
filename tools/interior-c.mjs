// Tier C interiors: the 53,595 houses and low-rise shops.
//
// The largest count and the simplest layout, which is why it is first — it has
// to prove determinism and the streaming budget before anyone builds art for a
// tower. A Tier C building is not detailed. It is a door you came in by, rooms
// with walls between them, windows you can see out of and be shot through, a
// staircase if there is an upstairs, and enough furniture that the room reads as
// a room. That is the whole brief.
//
// Like the structural graph this is a reference implementation and its output is
// never stored: every placement is derived from the record's seed, so the server
// and every client lay the same house out. Positions are in the building's own
// frame — x across the width, y across the depth, origin at the footprint
// centre, z up from the finished ground floor — because a building has to be
// generatable without knowing where in San Diego it is.

const MIN_ROOM_M = 2.4;        // below this it is a cupboard, not a room

// One room per this much floor. A dwelling and a shop are not the same problem:
// the first pass gave both 17 m2 a room, which put eleven rooms in a house and
// chopped a retail unit into cubicles. A shop is one volume with a back of
// house, and it wants to stay that way — it is also the only open interior
// space Tier C has, and open space is what a fight needs somewhere to happen in.
const ROOM_M2 = { house: 22, shop: 48 };
// One window per this much outside wall. The first pass used 3.2 m, which made
// windows 17% of every instance on the map and gave a semi-detached house
// sixteen of them per floor — that is a glazed band, not a house. At 5 m a
// twelve-by-fifteen gets ten a floor, two or three to an elevation.
const WINDOW_EVERY_M = 5.0;
const DOOR_W = 0.9;
const STAIR_W = 1.0;
const STAIR_RUN_M = 3.2;
const PROP_PER_M2 = 15;

// A house on a slope does not float and it does not follow the ground. It sits
// on one level slab with the high side cut into the hill and the low side up on
// a plinth. Past this much fall that stops being a plinth and starts being a
// storey, and the building gets a partly buried lower level instead.
const MAX_PLINTH_M = 1.2;

export const ROOMS = {
  // ground floor of a dwelling            upper floors
  house0: ['hall', 'living', 'kitchen', 'bath', 'utility'],
  house1: ['landing', 'bed', 'bed', 'bath', 'store'],
  // a shop is one volume with a back of house
  shop0: ['floor', 'floor', 'back', 'store', 'wc'],
  shop1: ['office', 'store', 'staff', 'wc', 'office'],
};

// What goes in each kind of room, and how it wants to sit. Anything wall is
// pushed against the nearest wall; anything free stands clear of it.
export const PROPS = {
  hall: [['shelf', 'wall'], ['coat_rack', 'wall'], ['rug', 'free']],
  living: [['sofa', 'wall'], ['tv_unit', 'wall'], ['table_low', 'free'],
    ['armchair', 'free'], ['lamp_floor', 'wall'], ['plant', 'wall'], ['rug', 'free']],
  kitchen: [['counter', 'wall'], ['counter', 'wall'], ['fridge', 'wall'],
    ['table_dining', 'free'], ['chair', 'free'], ['chair', 'free']],
  bath: [['toilet', 'wall'], ['basin', 'wall'], ['bath_tub', 'wall']],
  utility: [['washer', 'wall'], ['shelf', 'wall'], ['boiler', 'wall']],
  landing: [['shelf', 'wall'], ['plant', 'wall']],
  bed: [['bed', 'wall'], ['wardrobe', 'wall'], ['desk', 'wall'], ['chair', 'free'],
    ['lamp_floor', 'wall'], ['rug', 'free']],
  store: [['shelf', 'wall'], ['shelf', 'wall'], ['crate', 'free']],
  floor: [['shelf_tall', 'wall'], ['shelf_tall', 'wall'], ['rack', 'free'],
    ['rack', 'free'], ['counter_till', 'free'], ['crate', 'free']],
  back: [['crate', 'free'], ['shelf', 'wall'], ['table_work', 'wall']],
  office: [['desk', 'wall'], ['chair', 'free'], ['cabinet', 'wall'], ['monitor', 'wall']],
  staff: [['table_dining', 'free'], ['chair', 'free'], ['counter', 'wall'],
    ['locker', 'wall']],
  wc: [['toilet', 'wall'], ['basin', 'wall']],
};

function rng(seed) {
  let s = (seed | 0) ^ 0x6d2b79f5;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    return ((s ^= s >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Cut a floorplate into rooms, and remember where each cut was.
 *
 * The split tree is not a by-product, it is the plan: every internal node is a
 * wall and gets exactly one door in it, so the rooms form a tree and every room
 * is reachable from every other without any connectivity pass. Doing this any
 * other way ends with a bedroom nobody can get into, and at 53,595 buildings
 * nobody would ever find it.
 */
function partition(x0, y0, x1, y1, want, rand, out, walls, keep) {
  const w = x1 - x0; const h = y1 - y0;
  if (want <= 1 || w * h < MIN_ROOM_M * MIN_ROOM_M * 2) {
    out.push({ x0, y0, x1, y1 });
    return;
  }
  const along = w >= h;
  const span = along ? w : h;
  if (span < MIN_ROOM_M * 2) { out.push({ x0, y0, x1, y1 }); return; }

  const f = 0.36 + rand() * 0.28;
  const cut = (along ? x0 : y0) + span * f;
  const lo = (along ? x0 : y0) + MIN_ROOM_M;
  const hi = (along ? x1 : y1) - MIN_ROOM_M;
  let at = Math.max(lo, Math.min(hi, cut));

  // The stairwell is the one rectangle a wall may not cross. It is chosen once
  // for the whole building so that every floor's opening lines up with the
  // flight below, which means the upper floors are partitioned around something
  // that was not their idea. Without this a landing gets a wall straight across
  // it and the stairs arrive into brickwork — visible in a plan, invisible in
  // any count, and there are 53,595 of these.
  if (keep) {
    const a0 = along ? keep.x0 : keep.y0;
    const a1 = along ? keep.x1 : keep.y1;
    const c0 = along ? y0 : x0;
    const c1 = along ? y1 : x1;
    const crosses = at > a0 && at < a1
      && Math.max(c0, along ? keep.y0 : keep.x0) < Math.min(c1, along ? keep.y1 : keep.x1);
    if (crosses) {
      const left = a0; const right = a1;
      const okL = left >= lo && left <= hi;
      const okR = right >= lo && right <= hi;
      if (okL && okR) at = (at - left) < (right - at) ? left : right;
      else if (okL) at = left;
      else if (okR) at = right;
      else { out.push({ x0, y0, x1, y1 }); return; }
    }
  }

  // Split the room budget in proportion to the area each side gets, so a big
  // half is not given the same number of rooms as a thin one.
  const frac = ((along ? at - x0 : at - y0)) / span;
  const nA = Math.max(1, Math.round(want * frac));
  const nB = Math.max(1, want - nA);

  if (along) {
    walls.push({ vertical: true, at, from: y0, to: y1 });
    partition(x0, y0, at, y1, nA, rand, out, walls, keep);
    partition(at, y0, x1, y1, nB, rand, out, walls, keep);
  } else {
    walls.push({ vertical: false, at, from: x0, to: x1 });
    partition(x0, y0, x1, at, nA, rand, out, walls, keep);
    partition(x0, at, x1, y1, nB, rand, out, walls, keep);
  }
}

/**
 * Lay out one Tier C building.
 *
 * @param {{widthM,depthM,storeys,archetype,seed,doorSide,groundMinM,groundMaxM,
 *          floorHeightM}} rec
 * @returns {{floorZ:number, plinthM:number, buried:boolean, levels:Array,
 *            placements:Array, counts:Object}}
 */
export function buildInterior(rec) {
  const rand = rng(rec.seed);
  const W = rec.widthM; const D = rec.depthM;
  const storeys = Math.max(1, Math.round(rec.storeys));
  const fh = rec.floorHeightM || 3;
  const shop = rec.archetype === 'lowrise';

  // Where the ground floor sits. High side cut in, low side on a plinth; past
  // MAX_PLINTH_M the difference is a level, not a step.
  const fall = Math.max(0, (rec.groundMaxM ?? 0) - (rec.groundMinM ?? 0));
  const buried = fall > MAX_PLINTH_M;
  const floorZ = buried
    ? (rec.groundMaxM ?? 0) - 0.15
    : (rec.groundMaxM ?? 0) - 0.15;
  const plinthM = Math.min(fall, MAX_PLINTH_M);

  const placements = [];
  const push = (kit, x, y, z, rot, room) =>
    placements.push({ kit, x, y, z, rot, room });

  // Wall thickness eats into the usable plate; a 4 m room is 3.8 m of floor.
  const T = 0.1;
  const hx = W / 2 - T; const hy = D / 2 - T;

  const entry = entryPoint(rec, hx, hy);

  // The stairwell, decided once for the whole building. It sits just inside the
  // front door — which is where a staircase is — and every level is then laid
  // out around it, so the flight, the opening above it and the landing all
  // agree. A building with one storey has none, and a plate too small to hold a
  // straight run gets none either; those are single-level buildings by force.
  const stair = (() => {
    if (storeys < 2) return null;
    const along = W >= D;
    const need = along ? STAIR_RUN_M : STAIR_W;
    const need2 = along ? STAIR_W : STAIR_RUN_M;
    if (2 * hx < need + 1 || 2 * hy < need2 + 1) return null;
    // Pull back from the door by about the run length, and keep clear of walls.
    const cx = Math.max(-hx + need / 2 + 0.3, Math.min(hx - need / 2 - 0.3,
      entry.x * 0.55 + (rand() - 0.5) * 1.5));
    const cy = Math.max(-hy + need2 / 2 + 0.3, Math.min(hy - need2 / 2 - 0.3,
      entry.y * 0.55 + (rand() - 0.5) * 1.5));
    return {
      x0: cx - need / 2, x1: cx + need / 2,
      y0: cy - need2 / 2, y1: cy + need2 / 2,
      cx, cy, rot: along ? 0 : 90,
    };
  })();

  const levels = [];
  for (let k = 0; k < storeys; k++) {
    const z = floorZ + k * fh;
    const rooms = [];
    const walls = [];
    const want = Math.max(1, Math.round((W * D) / (shop ? ROOM_M2.shop : ROOM_M2.house)));
    partition(-hx, -hy, hx, hy, want, rand, rooms, walls, stair);

    // Name the rooms. The circulation space is whichever one holds the stairs,
    // or the one by the front door if there are none, so you walk into a hall
    // and not a bathroom, and the landing upstairs is where the stairs arrive.
    const menu = shop ? ROOMS[k ? 'shop1' : 'shop0'] : ROOMS[k ? 'house1' : 'house0'];
    const focus = stair ? { x: stair.cx, y: stair.cy } : entry;
    let firstIdx = 0; let bestD = Infinity;
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      const cx = (r.x0 + r.x1) / 2; const cy = (r.y0 + r.y1) / 2;
      const d2 = (cx - focus.x) ** 2 + (cy - focus.y) ** 2;
      if (d2 < bestD) { bestD = d2; firstIdx = i; }
    }
    rooms.forEach((r, i) => {
      r.name = i === firstIdx ? menu[0] : menu[1 + Math.floor(rand() * (menu.length - 1))];
      r.area = (r.x1 - r.x0) * (r.y1 - r.y0);
      r.stair = stair !== null && stair.cx >= r.x0 && stair.cx <= r.x1
        && stair.cy >= r.y0 && stair.cy <= r.y1;
    });

    // Partition walls, with one door per wall.
    for (const wl of walls) {
      const len = wl.to - wl.from;
      const at = wl.from + len * (0.3 + rand() * 0.4);
      const doorAt = Math.max(wl.from + DOOR_W, Math.min(wl.to - DOOR_W, at));
      push('wall_partition', wl.vertical ? wl.at : (wl.from + wl.to) / 2,
        wl.vertical ? (wl.from + wl.to) / 2 : wl.at, z,
        wl.vertical ? 90 : 0, null);
      push('door_interior', wl.vertical ? wl.at : doorAt,
        wl.vertical ? doorAt : wl.at, z, wl.vertical ? 90 : 0, null);
    }

    // Floor and ceiling for the level.
    push('floor_slab', 0, 0, z, 0, null);
    push('ceiling', 0, 0, z + fh, 0, null);

    // The way in, and the way up.
    if (k === 0) push(shop ? 'door_shop' : 'door_front', entry.x, entry.y, z, entry.rot, null);
    if (stair && k < storeys - 1) {
      push('stair_flight', stair.cx, stair.cy, z, stair.rot, 'stair');
      push('stair_opening', stair.cx, stair.cy, z + fh, stair.rot, 'stair');
    }

    // Windows on the outside walls, skipping the run the front door is in.
    const per = 2 * (W + D);
    const n = Math.max(2, Math.floor(per / WINDOW_EVERY_M));
    for (let i = 0; i < n; i++) {
      const p = perimeterPoint(W, D, (i + 0.5) / n);
      if (k === 0 && Math.hypot(p.x - entry.x, p.y - entry.y) < 1.4) continue;
      push(shop && k === 0 ? 'window_shopfront' : 'window_small', p.x, p.y, z, p.rot, null);
    }

    // Furniture. Wall props are pushed against the nearest wall of their room,
    // free props stand clear, and nothing is placed in a room too small to walk
    // round — an 0.8 m2 cupboard with a sofa in it reads as a bug.
    for (const r of rooms) {
      if (r.area < 3) continue;
      const list = PROPS[r.name] ?? PROPS.store;
      const budget = Math.max(1, Math.round(r.area / PROP_PER_M2 * list.length));
      for (let i = 0; i < Math.min(budget, list.length); i++) {
        const [kit, how] = list[i];
        const inset = 0.45;
        let x; let y; let rot;
        if (how === 'wall') {
          const s = Math.floor(rand() * 4);
          const t = 0.2 + rand() * 0.6;
          if (s === 0) { x = r.x0 + (r.x1 - r.x0) * t; y = r.y0 + inset; rot = 0; }
          else if (s === 1) { x = r.x1 - inset; y = r.y0 + (r.y1 - r.y0) * t; rot = 90; }
          else if (s === 2) { x = r.x0 + (r.x1 - r.x0) * t; y = r.y1 - inset; rot = 180; }
          else { x = r.x0 + inset; y = r.y0 + (r.y1 - r.y0) * t; rot = 270; }
        } else {
          x = r.x0 + (r.x1 - r.x0) * (0.3 + rand() * 0.4);
          y = r.y0 + (r.y1 - r.y0) * (0.3 + rand() * 0.4);
          rot = Math.floor(rand() * 4) * 90;
        }
        // Nothing stands in the stairwell.
        if (stair && x > stair.x0 - 0.3 && x < stair.x1 + 0.3
          && y > stair.y0 - 0.3 && y < stair.y1 + 0.3) continue;
        push(kit, x, y, z, rot, r.name);
      }
    }
    levels.push({ z, rooms, walls: walls.length });
  }

  const counts = {};
  for (const p of placements) counts[p.kit] = (counts[p.kit] ?? 0) + 1;
  // stairless is a defect, not a style: a building of two storeys whose plate is
  // too small for a straight run has an upper floor nobody can reach. Reported
  // rather than silently patched, because the fix is a spiral stair in the kit.
  return {
    floorZ, plinthM, buried, fall, levels, placements, counts,
    stair, stairless: storeys > 1 && !stair,
  };
}

/** Where the front door is, in the building's own frame. */
function entryPoint(rec, hx, hy) {
  switch (Math.round(rec.doorSide ?? 0)) {
    case 0: return { x: hx, y: 0, rot: 90 };
    case 1: return { x: 0, y: hy, rot: 180 };
    case 2: return { x: -hx, y: 0, rot: 270 };
    default: return { x: 0, y: -hy, rot: 0 };
  }
}

/** A point at fraction t round the outside wall, with its outward rotation. */
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

export { MIN_ROOM_M, ROOM_M2, MAX_PLINTH_M };
