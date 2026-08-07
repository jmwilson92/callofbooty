import { makeShed } from '../BuildingKit.js';
import { registerBuilding } from '../BuildingRegistry.js';
import { C, placeVehicle } from './Catalog.js';
import { airportPlan } from '../AirportPlan.js';

// San Diego International — Lindbergh Field.
//
// Everything about SAN follows from having exactly one runway on a strip of
// land too narrow for a second: the terminal is all on the north side, its
// gates come straight off the airside face rather than off concourse piers, and
// the cargo and general-aviation ramp is squeezed onto the west end. The
// airfield sits on its own levelled plate (AIRPORT_PLATE) because a runway is
// flat by definition, and the runway, taxiway and apron are graded into the
// heightfield rather than laid as box decks so they are ground you can run and
// land on rather than a kerb you trip over.
//
// Layout lives in AIRPORT_FIELD in config.js and is resolved by AirportPlan.js,
// which the road pass reads too, so the arterials land on the terminal kerb
// instead of driving down the runway.

const TERMINAL = 0xdcd8ce;
const TERMINAL_DK = 0xb6b2a8;
const GLASS = 0x6ab0d0;
const ROOF = 0x8e8a80;
const MARK_W = 0xf0eee6;      // runway white
const MARK_Y = 0xe8b41c;      // taxiway yellow
const AIRFRAME = 0xf2f2ee;
const CONCRETE = 0xb8b6b0;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

/**
 * An airliner parked nose-in at a gate, tail south. Fuselage, swept wings with
 * underslung engines, a tall fin and a raked nose — the fin is what makes it
 * read as an airliner rather than a bus from 150 m up, so it gets the height.
 */
function airliner(sink, cx, y, zNose, rng, scale = 1) {
  const L = 34 * scale;
  const r = 1.9 * scale;
  const zTail = zNose + L;
  const livery = pick(rng, [0xc0392b, 0x2a6a9a, 0x2b8a5a, 0xe0a020, 0x6a4a9a]);

  // Fuselage, with the nose cone tapering forward
  sink.addSpan(cx - r, y + 1.6, zNose + 5, cx + r, y + 1.6 + r * 2, zTail - 5, AIRFRAME);
  for (let i = 0; i < 3; i++) {
    const t = i / 3;
    const rr = r * (1 - t * 0.62);
    sink.addSpan(cx - rr, y + 2.0, zNose + 5 - i * 1.8, cx + rr, y + 1.6 + r * 2 - t * 0.7, zNose + 6.8 - i * 1.8, AIRFRAME);
  }
  // Cheatline in the airline's colours
  sink.addSpan(cx - r - 0.05, y + 2.5, zNose + 6, cx + r + 0.05, y + 3.1, zTail - 5, livery, 'thin');
  // Cockpit glass
  sink.addSpan(cx - r * 0.7, y + 3.4, zNose + 1.2, cx + r * 0.7, y + 4.0, zNose + 4.2, C.glassDark, 'thin');

  // Wings, swept back, with an engine slung under each
  const span = 15 * scale;
  const zw = zNose + L * 0.42;
  for (const side of [-1, 1]) {
    sink.addSpan(
      cx + side * r * 0.8, y + 2.4, zw,
      cx + side * span, y + 2.9, zw + 6.5, AIRFRAME
    );
    // Winglet
    sink.addSpan(
      cx + side * (span - 0.6), y + 2.9, zw + 4.4,
      cx + side * span, y + 5.0, zw + 6.4, livery
    );
    // Engine nacelle, forward of the wing
    sink.addSpan(
      cx + side * (span * 0.42) - 1.0, y + 0.9, zw - 3.2,
      cx + side * (span * 0.42) + 1.0, y + 2.6, zw + 2.4, TERMINAL_DK
    );
    // Main gear
    post(sink, cx + side * 2.4, y, zw + 3.0, 1.7, 0.55, C.dark);
    // Tailplane
    sink.addSpan(
      cx + side * r * 0.6, y + 3.4, zTail - 7,
      cx + side * (span * 0.42), y + 3.8, zTail - 3.6, AIRFRAME
    );
  }
  // Nose gear
  post(sink, cx - 0.3, y, zNose + 6.5, 1.7, 0.5, C.dark);
  // Fin
  sink.addSpan(cx - 0.5, y + 3.6, zTail - 8, cx + 0.5, y + 11.5, zTail - 2.5, livery);
  sink.addSpan(cx - 0.5, y + 3.6, zTail - 4.5, cx + 0.5, y + 6.5, zTail - 0.5, livery);
}

/** Painted markings for the runway: centreline, edges, thresholds, TDZ bars. */
function runwayMarkings(sink, r, y) {
  const cz = r.z + r.d / 2;
  const y0 = y + 0.14;

  // Centreline dashes down the length
  for (let x = r.x + 8; x < r.x + r.w - 8; x += r.markEvery) {
    sink.addSpan(x, y0, cz - 0.45, x + r.markEvery * 0.55, y0 + 0.05, cz + 0.45, MARK_W, 'thin');
  }
  // Edge lines
  for (const oz of [1.2, r.d - 1.8]) {
    sink.addSpan(r.x + 2, y0, r.z + oz, r.x + r.w - 2, y0 + 0.05, r.z + oz + 0.6, MARK_W, 'thin');
  }
  // Threshold bars at each end — the piano keys
  for (const tx of [r.x + 3, r.x + r.w - 12]) {
    for (let i = 0; i < 6; i++) {
      const bz = r.z + 2.2 + i * ((r.d - 4.4) / 6);
      sink.addSpan(tx, y0, bz, tx + 9, y0 + 0.05, bz + 1.5, MARK_W, 'thin');
    }
  }
  // Touchdown-zone bars inboard of each threshold
  for (const dir of [1, -1]) {
    const base = dir > 0 ? r.x + 20 : r.x + r.w - 20;
    for (let i = 0; i < 3; i++) {
      const bx = base + dir * i * 9;
      for (const oz of [r.d * 0.32, r.d * 0.62]) {
        sink.addSpan(bx, y0, r.z + oz, bx + 5.5, y0 + 0.05, r.z + oz + 1.0, MARK_W, 'thin');
      }
    }
  }
  // Runway edge lights
  for (let x = r.x + 4; x < r.x + r.w; x += 12) {
    for (const oz of [-1.2, r.d + 0.6]) {
      sink.addSpan(x, y, r.z + oz, x + 0.5, y + 0.5, r.z + oz + 0.5, MARK_W, 'thin');
    }
  }
}

/** The terminal: a long landside block with glazed frontage and a wave roof. */
function terminal(sink, t, gates, y, rng, stats) {
  const h = 9.5;
  sink.addSpan(t.x, y, t.z, t.x + t.w, y + h, t.z + t.d, TERMINAL);
  // Glazed landside frontage (north face) and airside curtain wall (south)
  sink.addSpan(t.x + 2, y + 1.4, t.z - 0.15, t.x + t.w - 2, y + 6.4, t.z + 0.15, GLASS, 'glass');
  sink.addSpan(t.x + 2, y + 1.4, t.z + t.d - 0.15, t.x + t.w - 2, y + 6.4, t.z + t.d + 0.15, GLASS, 'glass');
  // Doors along the kerb
  for (let dx = t.x + 8; dx < t.x + t.w - 10; dx += 18) {
    sink.addSpan(dx, y, t.z - 0.2, dx + 4, y + 3.2, t.z + 0.2, C.dark);
  }
  // Roof: a run of shallow vaults, which is what an airside roof looks like
  const bays = Math.max(4, Math.round(t.w / 22));
  for (let i = 0; i < bays; i++) {
    const bx = t.x + (t.w * i) / bays;
    const bw = t.w / bays;
    sink.addSpan(bx, y + h, t.z - 0.9, bx + bw - 1.2, y + h + 1.1, t.z + t.d + 0.9, ROOF);
    sink.addSpan(bx + bw * 0.18, y + h + 1.1, t.z + 1.5, bx + bw * 0.82, y + h + 2.3, t.z + t.d - 1.5, ROOF);
  }
  // Kerbside canopy over the drop-off
  sink.addSpan(t.x + 4, y + 5.0, t.z - 8, t.x + t.w - 4, y + 5.5, t.z, TERMINAL_DK);
  for (let px = t.x + 8; px < t.x + t.w - 6; px += 14) post(sink, px, y, t.z - 7.4, 5.0, 0.55, C.metalLite);

  // Jetways off the airside face, one per gate
  for (const gx of gates) {
    sink.addSpan(gx - 1.6, y + 3.4, t.z + t.d, gx + 1.6, y + 6.2, t.z + t.d + 8, TERMINAL_DK);
    post(sink, gx - 0.35, y, t.z + t.d + 6.8, 3.4, 0.7, C.metal);
  }

  registerBuilding({ x: t.x, z: t.z, w: t.w, d: t.d, floors: 2, baseY: y, floorYs: [y, y + 5] });
  stats.buildings++;
}

/** Control tower: shaft, cab with canted glass, and the radar above it. */
function controlTower(sink, x, z, y, stats) {
  const H = 26;
  for (let i = 0; i < 5; i++) {
    const r = 3.4 - i * 0.22;
    sink.addSpan(x - r, y + (H * i) / 5, z - r, x + r, y + (H * (i + 1)) / 5, z + r, CONCRETE);
  }
  // Cab — wider than the shaft, glazed the whole way round
  sink.addSpan(x - 5.4, y + H, z - 5.4, x + 5.4, y + H + 0.6, z + 5.4, TERMINAL_DK);
  sink.addSpan(x - 5.0, y + H + 0.6, z - 5.0, x + 5.0, y + H + 4.4, z + 5.0, C.glassDark);
  sink.addSpan(x - 5.6, y + H + 4.4, z - 5.6, x + 5.6, y + H + 5.4, z + 5.6, TERMINAL_DK);
  // Radar and beacon
  post(sink, x - 0.3, y + H + 5.4, z - 0.3, 5, 0.6, C.metal);
  sink.addSpan(x - 3.0, y + H + 9.4, z - 0.5, x + 3.0, y + H + 10.4, z + 0.5, C.metalLite);
  sink.addSpan(x - 0.6, y + H + 10.6, z - 0.6, x + 0.6, y + H + 11.6, z + 0.6, C.red);
  registerBuilding({
    x: x - 3.4, z: z - 3.4, w: 6.8, d: 6.8, floors: 6, baseY: y,
    floorYs: Array.from({ length: 6 }, (_, i) => y + i * 4.4),
  });
  stats.buildings++;
}

/** Cargo and general aviation on the west end, where the field runs out. */
function cargoRamp(sink, c, y, rng, stats) {
  const hw = (c.w - 6) / c.hangars;
  for (let i = 0; i < c.hangars; i++) {
    const hx = c.x + 3 + i * hw;
    makeShed(sink, {
      x: hx, z: c.z + 2, w: hw - 4, d: c.d - 10, h: 12,
      baseY: y, color: pick(rng, [0x8e9aa2, 0xa8a49a]), doorW: Math.min(14, hw - 8),
    });
    // Barrel roof cap so they do not read as another warehouse row
    sink.addSpan(hx + 1, y + 12.2, c.z + 3, hx + hw - 5, y + 13.6, c.z + c.d - 9, 0x77838b);
    registerBuilding({ x: hx, z: c.z + 2, w: hw - 4, d: c.d - 10, floors: 1, baseY: y, floorYs: [y] });
    stats.buildings++;
  }
  // Freight containers and a couple of tugs on the ramp
  for (let i = 0; i < 5; i++) {
    const bx = c.x + 4 + i * 5;
    sink.addSpan(bx, y, c.z + c.d - 7, bx + 4, y + 2.6, c.z + c.d - 3, pick(rng, [0x4a6b7a, 0x7a4a3c, 0x6b7f43]));
  }
  placeVehicle(sink, c.x + 6, c.z + c.d - 12, y, rng, null, false);
}

/**
 * Build Lindbergh Field. The pavement is already graded by Terrain, so this
 * lays the markings, the buildings and the aircraft on top of it.
 */
export function placeAirport(sink, terrain, rng) {
  const stats = { buildings: 0, aircraft: 0 };
  const p = airportPlan();
  const y = terrain.airportPlateY ?? terrain.heightAt(p.cx, p.cz);
  if (!Number.isFinite(y)) return stats;

  // --- airside markings ---
  runwayMarkings(sink, p.runway, y);
  // Taxiway centreline, in yellow, with the turn-offs to the runway
  const tz = p.taxiway.z + p.taxiway.d / 2;
  sink.addSpan(p.taxiway.x + 2, y + 0.14, tz - 0.4, p.taxiway.x + p.taxiway.w - 2, y + 0.19, tz + 0.4, MARK_Y, 'thin');
  for (let i = 0; i < 4; i++) {
    const lx = p.taxiway.x + 20 + i * ((p.taxiway.w - 40) / 3);
    sink.addSpan(lx - 0.4, y + 0.14, p.taxiway.z + p.taxiway.d, lx + 0.4, y + 0.19, p.runway.z, MARK_Y, 'thin');
  }
  // Gate lead-in lines, running from the taxiway up to each stand
  for (const gx of p.gates) {
    sink.addSpan(gx - 0.4, y + 0.14, p.apron.z + 9, gx + 0.4, y + 0.19, p.apron.z + p.apron.d, MARK_Y, 'thin');
  }

  // --- buildings ---
  terminal(sink, p.terminal, p.gates, y, rng, stats);
  controlTower(sink, p.tower.x, p.tower.z, y, stats);
  cargoRamp(sink, p.cargo, y, rng, stats);

  // --- aircraft: nose-in at the gates, wings parallel to the terminal ---
  for (const gx of p.gates) {
    airliner(sink, gx, y, p.terminal.z + p.terminal.d + 7, rng, 0.8);
    stats.aircraft++;
  }
  // One on the cargo hardstand at the west end. It used to sit on the taxiway
  // "holding short", which put it through the east gate's wingtip and pointed
  // it across a taxiway that runs the other way.
  airliner(sink, p.cargo.x + 22, y, p.cargo.z + p.cargo.d + 6, rng, 0.7);
  stats.aircraft++;

  // --- landside ---
  // Kerb island between the access road and the terminal frontage
  sink.addSpan(p.access.x0, y, p.access.z + p.access.width, p.access.x1, y + 0.22, p.access.z + p.access.width + 2.5, CONCRETE, 'thin');
  // The car park's stalls and cars come from the standard parking-lot pass —
  // it is registered in defaultParkingLots() — so only the lighting is here.
  const cp = p.carPark;
  // Light masts over the car park and the apron
  for (let lx = cp.x + 12; lx < cp.x + cp.w; lx += 30) {
    post(sink, lx, y, cp.z + cp.d / 2, 12, 0.5, C.metalLite);
    sink.addSpan(lx - 1.6, y + 12, cp.z + cp.d / 2 - 0.6, lx + 2.0, y + 12.9, cp.z + cp.d / 2 + 0.9, C.metalLite);
  }

  // --- perimeter fence, with a break at the terminal kerb ---
  const b = p.bounds;
  for (let fx = b.x0; fx < b.x1; fx += 6) {
    if (fx > p.gate.x - 22 && fx < p.gate.x + 22) continue;
    for (const fz of [b.z0, b.z1 - 0.3]) {
      sink.addSpan(fx, y, fz, fx + 5.2, y + 2.4, fz + 0.3, C.metal, 'thin');
    }
  }
  for (let fz = b.z0; fz < b.z1; fz += 6) {
    for (const fx of [b.x0, b.x1 - 0.3]) {
      sink.addSpan(fx, y, fz, fx + 0.3, y + 2.4, fz + 5.2, C.metal, 'thin');
    }
  }

  return stats;
}
