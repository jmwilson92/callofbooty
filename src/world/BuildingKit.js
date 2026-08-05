import { BUILDINGS } from '../config.js';

// Parametric building assembly from a primitive kit: slabs, walls with
// openings, stairs, parapets. Every building this produces satisfies the
// Phase 1 rules -- two ground entrances on different faces, and a continuous
// interior stair route all the way to the roof.

const T = BUILDINGS.WALL_THICKNESS;
const SLAB = BUILDINGS.SLAB_THICKNESS;

/**
 * Emit a wall running along one axis, with rectangular openings cut out.
 * `axis` is 'x' (wall runs along X at fixed Z) or 'z' (runs along Z at fixed X).
 * `openings` entries are { a0, a1, y0, y1 } in along-axis world coords.
 */
export function wall(sink, axis, fixed, a0, a1, yBottom, yTop, color, openings = [], tag = 'solid') {
  const emit = (s, e, y0, y1) => {
    if (e - s <= 1e-4 || y1 - y0 <= 1e-4) return;
    if (axis === 'x') sink.addSpan(s, y0, fixed - T / 2, e, y1, fixed + T / 2, color, tag);
    else sink.addSpan(fixed - T / 2, y0, s, fixed + T / 2, y1, e, color, tag);
  };

  // Clip to the wall span, discard anything empty.
  const ops = [];
  for (const op of openings) {
    const s = Math.max(a0, op.a0);
    const e = Math.min(a1, op.a1);
    if (e - s <= 1e-4) continue;
    ops.push({ a0: s, a1: e, y0: Math.max(yBottom, op.y0), y1: Math.min(yTop, op.y1) });
  }
  if (!ops.length) {
    emit(a0, a1, yBottom, yTop);
    return;
  }

  // Cut the wall at every opening edge so that within a slice an opening either
  // spans it completely or not at all. Openings must then be UNIONED per slice:
  // emitting each one independently lets a window's under-sill block get built
  // straight across an overlapping doorway, which walls the building shut.
  const cuts = new Set([a0, a1]);
  for (const op of ops) {
    cuts.add(op.a0);
    cuts.add(op.a1);
  }
  const edges = [...cuts].sort((p, q) => p - q);

  for (let i = 0; i < edges.length - 1; i++) {
    const s = edges[i];
    const e = edges[i + 1];
    if (e - s <= 1e-4) continue;
    const mid = (s + e) / 2;

    const bands = ops
      .filter((o) => o.a0 <= mid && o.a1 >= mid)
      .map((o) => [o.y0, o.y1])
      .sort((p, q) => p[0] - q[0]);

    let y = yBottom;
    for (const [b0, b1] of bands) {
      if (b0 > y) emit(s, e, y, b0);
      if (b1 > y) y = b1;
    }
    emit(s, e, y, yTop);
  }
}

/** Floor slab spanning a rect, optionally with a rectangular hole punched in it. */
export function slab(sink, x0, z0, x1, z1, top, color, hole = null) {
  const y0 = top - SLAB;
  if (!hole) {
    sink.addSpan(x0, y0, z0, x1, top, z1, color);
    return;
  }
  const hx0 = Math.max(x0, hole.x0), hx1 = Math.min(x1, hole.x1);
  const hz0 = Math.max(z0, hole.z0), hz1 = Math.min(z1, hole.z1);
  if (hx1 <= hx0 || hz1 <= hz0) {
    sink.addSpan(x0, y0, z0, x1, top, z1, color);
    return;
  }
  // Four bands around the hole.
  sink.addSpan(x0, y0, z0, x1, top, hz0, color);   // south of hole
  sink.addSpan(x0, y0, hz1, x1, top, z1, color);   // north of hole
  sink.addSpan(x0, y0, hz0, hx0, top, hz1, color); // west of hole
  sink.addSpan(hx1, y0, hz0, x1, top, hz1, color); // east of hole
}

/**
 * A straight stair run climbing along +Z, built as a thick stringer.
 *
 * Each tread is only STAIR_THICKNESS deep rather than a solid column down to
 * the floor. That matters: stacked flights sit directly above one another, and
 * a solid underside would leave barely 0.3 m of head clearance over the flight
 * below -- enough to walk under, but not enough room to step up.
 */
export function stairRun(sink, x0, x1, z0, z1, yBase, rise, color) {
  const steps = BUILDINGS.STAIR_STEPS_PER_FLOOR;
  const stepRise = rise / steps;
  const stepRun = (z1 - z0) / steps;
  for (let k = 0; k < steps; k++) {
    const sz0 = z0 + k * stepRun;
    const sz1 = sz0 + stepRun;
    const top = yBase + (k + 1) * stepRise;
    const bottom = Math.max(yBase, top - BUILDINGS.STAIR_THICKNESS);
    sink.addSpan(x0, bottom, sz0, x1, top, sz1, color);
  }
}

function levelHeights(floors) {
  const ys = [0];
  for (let i = 0; i < floors; i++) {
    ys.push(ys[i] + (i === 0 ? BUILDINGS.GROUND_FLOOR_HEIGHT : BUILDINGS.FLOOR_HEIGHT));
  }
  return ys; // length floors+1; last entry is the roof level
}

/**
 * Build one rectangular building.
 * opts: { x, z, w, d, floors, baseY, color, rng }
 * (x, z) is the building's min corner in world space.
 */
export function makeBuilding(sink, opts) {
  const { x, z, w, d, floors, baseY, color, rng } = opts;
  const roofColor = BUILDINGS.ROOF_COLOR;
  const floorColor = BUILDINGS.FLOOR_COLOR;
  const ys = levelHeights(floors);

  // Stair core in the +X/+Z corner, sized to fit small footprints too.
  const coreW = Math.min(3.8, w * 0.42);
  const coreD = Math.min(5.0, d * 0.45);
  const sx0 = x + w - coreW - 0.4;
  const sx1 = x + w - 0.4;
  const sz0 = z + d - coreD - 0.4;
  const sz1 = z + d - 0.4;
  const landing = 1.3;
  const runZ1 = sz1 - landing;
  const hole = { x0: sx0 - 0.1, z0: sz0 - 0.1, x1: sx1 + 0.1, z1: runZ1 + 0.1 };

  // Ground slab -- solid, no hole (nothing below it).
  slab(sink, x, z, x + w, z + d, baseY, floorColor);

  const doorH = BUILDINGS.DOOR_HEIGHT;
  const doorW = BUILDINGS.DOOR_WIDTH;
  const winB = BUILDINGS.WINDOW_SILL;
  const winT = BUILDINGS.WINDOW_SILL + BUILDINGS.WINDOW_HEIGHT;

  for (let f = 0; f < floors; f++) {
    const yBot = baseY + ys[f];
    const yTop = baseY + ys[f + 1] - SLAB;
    const isGround = f === 0;

    // Window openings spaced along each face.
    const winsAlong = (a0, a1) => {
      const out = [];
      const span = a1 - a0;
      const count = Math.max(1, Math.floor(span / 4.5));
      const pitch = span / count;
      for (let i = 0; i < count; i++) {
        const c = a0 + pitch * (i + 0.5);
        out.push({ a0: c - 0.85, a1: c + 0.85, y0: yBot + winB, y1: yBot + winT });
      }
      return out;
    };

    // Two entrances on different faces, per the spec rule. A window overlapping
    // a doorway is dropped so the door reads as a door rather than as one
    // merged hole in the facade.
    const addDoor = (list, centre) => {
      const d0 = centre - doorW / 2;
      const d1 = centre + doorW / 2;
      const kept = list.filter((op) => op.a1 <= d0 + 1e-4 || op.a0 >= d1 - 1e-4);
      kept.push({ a0: d0, a1: d1, y0: yBot, y1: yBot + doorH });
      return kept;
    };

    let southOpenings = winsAlong(x, x + w);
    let eastOpenings = winsAlong(z, z + d);
    if (isGround) {
      southOpenings = addDoor(southOpenings, x + w * 0.35);
      eastOpenings = addDoor(eastOpenings, z + d * 0.32);
    }

    wall(sink, 'x', z + T / 2, x, x + w, yBot, yTop, color, southOpenings);
    wall(sink, 'x', z + d - T / 2, x, x + w, yBot, yTop, color, winsAlong(x, x + w));
    wall(sink, 'z', x + T / 2, z, z + d, yBot, yTop, color, winsAlong(z, z + d));
    wall(sink, 'z', x + w - T / 2, z, z + d, yBot, yTop, color, eastOpenings);

    // Stairs up to the next level (or to the roof on the top floor).
    stairRun(sink, sx0, sx1, sz0, runZ1, yBot, ys[f + 1] - ys[f], floorColor);

    // Slab above this level, holed over the stair run.
    slab(sink, x, z, x + w, z + d, baseY + ys[f + 1], f === floors - 1 ? roofColor : floorColor, hole);

    // A light interior partition on upper floors so rooms are not open boxes.
    if (!isGround && w > 9 && rng() > 0.35) {
      const px = x + w * (0.4 + rng() * 0.2);
      const gap = z + d * 0.5;
      wall(sink, 'z', px, z + T, z + d - T, yBot, yTop, floorColor, [
        { a0: gap - 0.6, a1: gap + 0.6, y0: yBot, y1: yBot + doorH },
      ], 'thin');
    }
  }

  // Roof parapet so the roof reads as usable cover, plus a stair bulkhead.
  const roofY = baseY + ys[floors];
  const ph = BUILDINGS.PARAPET_HEIGHT;
  sink.addSpan(x, roofY, z, x + w, roofY + ph, z + T * 1.5, color);
  sink.addSpan(x, roofY, z + d - T * 1.5, x + w, roofY + ph, z + d, color);
  sink.addSpan(x, roofY, z, x + T * 1.5, roofY + ph, z + d, color);
  sink.addSpan(x + w - T * 1.5, roofY, z, x + w, roofY + ph, z + d, color);

  return { roofY, height: ys[floors] };
}

/** Simple single-volume shed/warehouse with two doorways and a flat roof. */
export function makeShed(sink, opts) {
  const { x, z, w, d, h, baseY, color, doorW = 3.2 } = opts;
  const floorColor = BUILDINGS.FLOOR_COLOR;
  slab(sink, x, z, x + w, z + d, baseY, floorColor);

  const yBot = baseY;
  const yTop = baseY + h;
  const cx = x + w / 2;
  const cz = z + d / 2;

  wall(sink, 'x', z + T / 2, x, x + w, yBot, yTop, color, [
    { a0: cx - doorW / 2, a1: cx + doorW / 2, y0: yBot, y1: yBot + Math.min(h - 0.4, 4.0) },
  ]);
  wall(sink, 'x', z + d - T / 2, x, x + w, yBot, yTop, color, []);
  wall(sink, 'z', x + T / 2, z, z + d, yBot, yTop, color, []);
  wall(sink, 'z', x + w - T / 2, z, z + d, yBot, yTop, color, [
    { a0: cz - doorW / 2, a1: cz + doorW / 2, y0: yBot, y1: yBot + Math.min(h - 0.4, 4.0) },
  ]);

  slab(sink, x, z, x + w, z + d, yTop + SLAB, BUILDINGS.ROOF_COLOR);
  return { roofY: yTop + SLAB };
}
