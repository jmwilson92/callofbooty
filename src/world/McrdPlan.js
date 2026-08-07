import { POIS, MCRD_DEPOT } from '../config.js';

// MCRD Depot layout, resolved from MCRD_DEPOT's (u, v) offsets into world space.
// Shared by Terrain (which keeps roads out of the depot and paves the parade
// deck), Roads (which lands the arterials on the gate) and the depot builder.

function anchor() {
  const p = POIS.find((q) => q.id === 'mcrd');
  return { x: p?.x ?? -110, z: p?.z ?? -80 };
}

export function mcrdPlan() {
  const D = MCRD_DEPOT;
  const a = anchor();
  const ox = a.x - D.w / 2;
  const oz = a.z - D.d / 2;
  const rect = (u0, v0, w, d) => ({ x: ox + u0, z: oz + v0, w, d });

  const barracks = [];
  const B = D.barracks;
  for (let i = 0; i < B.count; i++) {
    barracks.push(rect(B.u0 + i * (B.w + B.gap), B.v0, B.w, B.d));
  }

  return {
    cx: a.x,
    cz: a.z,
    ox,
    oz,
    w: D.w,
    d: D.d,
    parade: rect(D.parade.u0, D.parade.v0, D.parade.u1 - D.parade.u0, D.parade.v1 - D.parade.v0),
    barracks,
    south: D.south.map((s) => ({ id: s.id, floors: s.floors, ...rect(s.u0, s.v0, s.w, s.d) })),
    command: { floors: D.command.floors, towerH: D.command.towerH, ...rect(D.command.u0, D.command.v0, D.command.w, D.command.d) },
    field: rect(D.field.u0, D.field.v0, D.field.u1 - D.field.u0, D.field.v1 - D.field.v0),
    // Main gate, centred on the south fence — where the approach roads land.
    gate: { x: ox + D.fenceGateU, z: oz + D.d },
    bounds: { x0: ox, z0: oz, x1: ox + D.w, z1: oz + D.d },
  };
}

/** Depot footprint, for road keep-out and scatter exclusion. */
export function mcrdBounds() {
  return mcrdPlan().bounds;
}
