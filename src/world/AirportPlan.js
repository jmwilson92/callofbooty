import { POIS, AIRPORT_FIELD, AIRPORT_PLATE } from '../config.js';

// San Diego International layout, resolved from AIRPORT_FIELD's (u, v) offsets
// into world space. Shared by Terrain (which keeps freeways off the field and
// paves the runway, taxiway and apron through the parking-lot stamp), Roads
// (which lands the arterials on the terminal kerb rather than the runway) and
// the airfield builder.
//
// The field is centred on the plate rather than the POI anchor, because the
// plate is what is actually flat — a runway that runs off the levelled pad at
// one end is a runway with a hill in it.

export function airportPlan() {
  const F = AIRPORT_FIELD;
  const P = AIRPORT_PLATE;
  const ox = P.cx - F.w / 2;
  const oz = P.cz - F.d / 2;
  const rect = (u0, v0, u1, v1) => ({ x: ox + u0, z: oz + v0, w: u1 - u0, d: v1 - v0 });

  // Gate centrelines along the terminal's airside face
  const gates = [];
  for (let i = 0; i < F.gates.count; i++) gates.push(ox + F.gates.u0 + i * F.gates.pitch);

  return {
    ox,
    oz,
    w: F.w,
    d: F.d,
    cx: P.cx,
    cz: P.cz,
    access: { x0: ox + F.access.u0, x1: ox + F.access.u1, z: oz + F.access.v, width: F.access.width },
    carPark: rect(F.carPark.u0, F.carPark.v0, F.carPark.u1, F.carPark.v1),
    terminal: rect(F.terminal.u0, F.terminal.v0, F.terminal.u1, F.terminal.v1),
    gates,
    apron: rect(F.apron.u0, F.apron.v0, F.apron.u1, F.apron.v1),
    taxiway: rect(F.taxiway.u0, F.taxiway.v0, F.taxiway.u1, F.taxiway.v1),
    runway: { ...rect(F.runway.u0, F.runway.v0, F.runway.u1, F.runway.v1), markEvery: F.runway.markEvery },
    tower: { x: ox + F.tower.u, z: oz + F.tower.v },
    cargo: { ...rect(F.cargo.u0, F.cargo.v0, F.cargo.u1, F.cargo.v1), hangars: F.cargo.hangars },
    // Terminal kerb — where the approach roads land, the way you actually
    // arrive at an airport.
    gate: { x: ox + F.gateU, z: oz + F.access.v },
    bounds: { x0: ox, z0: oz, x1: ox + F.w, z1: oz + F.d },
  };
}

/** Field footprint, for road keep-out and scatter exclusion. */
export function airportBounds() {
  return airportPlan().bounds;
}

/**
 * The paved surfaces, for the terrain's parking-lot stamp. Grading these into
 * the heightfield rather than laying box decks is what makes them collidable
 * ground you can drive and land on instead of a kerb you trip over.
 */
export function airportPavement() {
  const p = airportPlan();
  // The car park is deliberately absent: it goes through defaultParkingLots()
  // so the normal stall-and-cars pass dresses it. The airside surfaces must not,
  // or that pass paints parking bays down the runway.
  return [p.runway, p.taxiway, p.apron];
}
