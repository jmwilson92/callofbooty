import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed } from '../BuildingKit.js';
import { registerBuilding } from '../BuildingRegistry.js';
import { kearnyPlan } from '../KearnyPlan.js';
import {
  C, footprintHeights, addBuildingAccess, placeVehicle, placeGasStation, placeRestaurant,
} from './Catalog.js';

// Kearny Mesa: two residential tracts and two commercial quadrants.
//
// Real Kearny Mesa is where San Diego keeps its big-box retail, its business
// parks and — along Kearny Villa Road — its dealership row, all of it hanging
// off the freeway interchange. The neighbourhoods behind it are the flat mesa
// suburbs. This builds both: streets from KearnyPlan, lots filled here.

const HOUSE = [0xe4d9c4, 0xf0ece2, 0xd8c9ac, 0xc8b8a0, 0xa8c0d0, 0xd6b9a4, 0xb9c4b0];
const ROOF = [0x6a5a4a, 0x585048, 0x7a5040, 0x4a4a48];
const LAWN = 0x5c8a3e;
const DRIVE = 0xb4b0a8;
const FENCE = 0x9a7a50;
// Front setback from the kerb. Lot depth is half the gap between streets, so
// this plus the deepest house has to leave a back yard on both sides.
const SETBACK = 3.5;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

// Buildings here pour a terrace pad down to the low corner, so the tolerance is
// about "is this a buildable bench" rather than "is this already flat".
function seat(terrain, x, z, w, d, maxDelta = 7) {
  const f = footprintHeights(terrain, x, z, w, d);
  if (!Number.isFinite(f.max) || f.max < 3) return null;
  if (f.delta > maxDelta) return null;
  return f;
}

/** Skip anything that would land on pavement. */
function onRoad(terrain, x, z, w, d) {
  for (const [u, v] of [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]]) {
    if (terrain.roadAt(x + w * u, z + d * v) > 0.35) return true;
  }
  return false;
}

/**
 * One suburban lot: house, garage, driveway out to the street, lawn, and a
 * back fence. `facing` is the side the street is on.
 */
function suburbanLot(sink, terrain, lx, lz, lw, ld, rng, facing, stats) {
  const hw = 11 + rng() * 4;
  // Depth is bounded by the lot so back-to-back houses on adjacent streets
  // cannot meet in the middle of the block.
  const hd = Math.min(ld - SETBACK - 2.5, 9 + rng() * 2);
  const hx = lx + (lw - hw - 5) * 0.5 + 1;
  const hz = facing === 'n' ? lz + SETBACK : lz + ld - hd - SETBACK;
  const f = seat(terrain, hx, hz, hw + 5, hd);
  if (f == null) return false;
  // Only the built footprint has to be off the pavement — lots front the kerb
  if (onRoad(terrain, hx, hz, hw + 5, hd)) return false;
  const baseY = f.max - 0.05;

  // Lawn pad, so the lot reads as a parcel rather than raw hillside
  sink.addSpan(lx + 0.5, f.min - 0.6, lz + 0.5, lx + lw - 0.5, baseY + 0.06, lz + ld - 0.5, LAWN);

  const floors = rng() > 0.55 ? 2 : 1;
  makeBuilding(sink, { x: hx, z: hz, w: hw, d: hd, floors, baseY, color: pick(rng, HOUSE), rng });
  addBuildingAccess(sink, hx, hz, hw, hd, baseY, floors, BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false);
  const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  const roofCol = pick(rng, ROOF);
  sink.addSpan(hx - 0.6, roofY, hz - 0.6, hx + hw + 0.6, roofY + 0.4, hz + hd + 0.6, roofCol);
  sink.addSpan(hx + hw * 0.12, roofY + 0.4, hz + hd * 0.12, hx + hw * 0.88, roofY + 1.5, hz + hd * 0.88, roofCol);

  // Attached garage on the street side, with the driveway running out to the kerb
  const gw = 5.2;
  const gd = 5.6;
  const gx = hx + hw + 0.2;
  const gz = facing === 'n' ? hz : hz + hd - gd;
  sink.addSpan(gx, baseY, gz, gx + gw, baseY + 3.0, gz + gd, pick(rng, HOUSE));
  sink.addSpan(gx - 0.4, baseY + 3.0, gz - 0.4, gx + gw + 0.4, baseY + 3.5, gz + gd + 0.4, roofCol);
  sink.addSpan(gx + 0.4, baseY, facing === 'n' ? gz - 0.15 : gz + gd - 0.25,
    gx + gw - 0.4, baseY + 2.3, facing === 'n' ? gz + 0.25 : gz + gd + 0.15, 0x8d8b84);
  const dz0 = facing === 'n' ? lz : gz + gd;
  const dz1 = facing === 'n' ? gz : lz + ld;
  sink.addSpan(gx + 0.2, baseY - 0.02, dz0, gx + gw - 0.2, baseY + 0.05, dz1, DRIVE, 'thin');
  if (rng() > 0.45) placeVehicle(sink, gx + 0.4, (dz0 + dz1) / 2 - 2.4, baseY, rng, null, true);

  // Back fence and a tree or two
  const fz = facing === 'n' ? lz + ld - 0.6 : lz;
  sink.addSpan(lx + 1, baseY, fz, lx + lw - 1, baseY + 1.7, fz + 0.25, FENCE, 'thin');
  for (let i = 0; i < 2; i++) {
    const tx = lx + 1.5 + rng() * (lw - 3);
    const tz = facing === 'n' ? lz + ld - 4 - rng() * 4 : lz + 2 + rng() * 4;
    const th = 4 + rng() * 3;
    post(sink, tx, baseY, tz, th * 0.6, 0.4, 0x6a5238);
    const rr = 1.6 + rng();
    sink.addSpan(tx - rr, baseY + th * 0.5, tz - rr, tx + rr, baseY + th, tz + rr, pick(rng, [0x3f7a34, 0x4f8a3a, 0x5c9440]));
  }
  stats.homes++;
  return true;
}

/** Fill a residential tract with lots either side of each cross street. */
function residentialTract(sink, terrain, t, plan, rng, stats) {
  const lotsPerSide = 6;
  const usable = t.w - 20;
  const lotW = usable / lotsPerSide;
  const spacing = (t.d - 60) / (plan.rows - 1);
  const half = plan.streetW / 2 + 1.5;      // kerb to lot line
  const lotD = (spacing - half * 2) / 2;    // two lots back to back between streets
  for (let i = 0; i < plan.rows; i++) {
    const sz = t.z + 30 + i * spacing;
    for (const facing of ['n', 's']) {
      // 'n' means the street is on the lot's north edge, so the house fronts it
      const lz = facing === 'n' ? sz + half : sz - half - lotD;
      for (let k = 0; k < lotsPerSide; k++) {
        const lx = t.x + 10 + k * lotW;
        // Leave the collector crossing clear
        const cx = t.x + t.w * 0.5;
        if (lx + lotW > cx - 7 && lx < cx + 7) continue;
        suburbanLot(sink, terrain, lx, lz, lotW - 1.5, lotD, rng, facing, stats);
      }
    }
  }
}

/** A big-box store: deep shed, entry canopy, rooftop plant, pylon sign. */
function bigBox(sink, terrain, x, z, w, d, rng, stats, label = 0xd03028) {
  const f = seat(terrain, x, z, w, d, 10);
  if (f == null || onRoad(terrain, x, z, w, d)) return false;
  const y = f.max;
  sink.addSpan(x - 1, f.min - 1.6, z - 1, x + w + 1, y + 0.08, z + d + 1, C.concrete);
  const h = 10;
  const shed = makeShed(sink, { x, z, w, d, h, baseY: y, color: pick(rng, [0xbcb6a8, 0xa8a49a, 0xc4bcae]), doorW: 9 });
  registerBuilding({ x, z, w, d, floors: 1, baseY: y, floorYs: [y + 0.2], roofY: shed.roofY });
  // Entry canopy along the front
  sink.addSpan(x + w * 0.24, y + 4.4, z + d, x + w * 0.76, y + 5.0, z + d + 4.5, 0x6e6c68);
  for (let i = 0; i <= 4; i++) post(sink, x + w * (0.26 + i * 0.12), y, z + d + 3.9, 4.4, 0.35, C.metal);
  // Parapet band + rooftop units
  sink.addSpan(x - 0.4, y + h, z - 0.4, x + w + 0.4, y + h + 1.6, z + d + 0.4, pick(rng, [0x8a8578, 0x9a958a]));
  for (let i = 0; i < 5; i++) {
    const ux = x + 5 + rng() * (w - 12);
    const uz = z + 4 + rng() * (d - 10);
    sink.addSpan(ux, y + h + 1.6, uz, ux + 3.6, y + h + 3.4, uz + 3, C.metal);
  }
  // Storefront glazing + sign band
  sink.addSpan(x + 2, y + 1.0, z + d - 0.25, x + w - 2, y + 4.2, z + d + 0.1, C.glass, 'glass');
  sink.addSpan(x + w * 0.3, y + 6.2, z + d - 0.1, x + w * 0.7, y + 8.2, z + d + 0.3, label);
  // Pylon sign out at the kerb
  post(sink, x + w + 6, y, z + d - 8, 12, 0.7, C.metalLite);
  sink.addSpan(x + w + 3.5, y + 12, z + d - 9.5, x + w + 9.5, y + 16, z + d - 6.5, label);
  stats.bigbox++;
  return true;
}

/** Strip mall: a row of small units under one continuous canopy. */
function stripMall(sink, terrain, x, z, w, d, rng, stats) {
  const f = seat(terrain, x, z, w, d, 9);
  if (f == null || onRoad(terrain, x, z, w, d)) return false;
  const y = f.max;
  sink.addSpan(x - 0.8, f.min - 1, z - 0.8, x + w + 0.8, y + 0.08, z + d + 0.8, C.concrete);
  const units = Math.max(3, Math.floor(w / 13));
  const uw = w / units;
  const shed = makeShed(sink, { x, z, w, d, h: 6.2, baseY: y, color: 0xc4bcae, doorW: 4 });
  registerBuilding({ x, z, w, d, floors: 1, baseY: y, floorYs: [y + 0.2], roofY: shed.roofY });
  for (let i = 0; i < units; i++) {
    const ux = x + i * uw;
    sink.addSpan(ux + 1.2, y + 1.0, z + d - 0.25, ux + uw - 1.2, y + 3.6, z + d + 0.1, C.glass, 'glass');
    sink.addSpan(ux + 1.0, y + 4.0, z + d - 0.15, ux + uw - 1.0, y + 5.2, z + d + 0.25,
      pick(rng, [0xd03028, 0x2a6a9a, 0xf0b400, 0x3a8a2e, 0xe07020, 0x1a9a88]));
    if (i > 0) sink.addSpan(ux - 0.15, y, z, ux + 0.15, y + 6.2, z + d, 0xa8a49a);
  }
  sink.addSpan(x, y + 5.6, z + d, x + w, y + 6.2, z + d + 3.2, 0x6e6c68);
  for (let i = 0; i <= units; i++) post(sink, x + i * uw, y, z + d + 2.7, 5.6, 0.3, C.metal);
  sink.addSpan(x - 0.5, y + 6.2, z - 0.5, x + w + 0.5, y + 7.4, z + d + 0.5, 0x8a8578);
  stats.retail++;
  return true;
}

/** Dealership row — Kearny Villa Road's signature. */
function dealership(sink, terrain, x, z, w, d, rng, stats) {
  const f = seat(terrain, x, z, w, d, 9);
  if (f == null || onRoad(terrain, x, z, w, d)) return false;
  const y = f.max;
  sink.addSpan(x - 1, f.min - 1, z - 1, x + w + 1, y + 0.06, z + d + 1, 0x3a3b3e);
  // Glass showroom at one end
  const sw = Math.min(26, w * 0.34);
  const shed = makeShed(sink, { x, z, w: sw, d: d * 0.55, h: 7, baseY: y, color: 0xdfe4e8, doorW: 5 });
  registerBuilding({ x, z, w: sw, d: d * 0.55, floors: 1, baseY: y, floorYs: [y + 0.2], roofY: shed.roofY });
  for (const zz of [z, z + d * 0.55 - 0.3]) {
    sink.addSpan(x + 1, y + 0.8, zz, x + sw - 1, y + 6, zz + 0.3, C.glass, 'glass');
  }
  sink.addSpan(x, y + 7, z, x + sw, y + 8.4, z + d * 0.55, 0x2a6a9a);
  // Rows of stock under light poles
  const lotX = x + sw + 6;
  const cols = Math.floor((x + w - lotX) / 3.2);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() > 0.82) continue;
      placeVehicle(sink, lotX + c * 3.2, z + 4 + r * 6.5, y, rng, null, true);
    }
  }
  for (let i = 0; i < 3; i++) {
    const px = lotX + 6 + i * ((x + w - lotX) / 3);
    post(sink, px, y, z + d * 0.5, 9, 0.35, C.metal);
    sink.addSpan(px - 1.2, y + 9, z + d * 0.5 - 0.4, px + 1.6, y + 9.5, z + d * 0.5 + 0.8, 0xf0f4f8);
  }
  // Pennant line along the frontage
  for (let i = 0; i < 10; i++) {
    const px = lotX + i * ((x + w - lotX) / 10);
    sink.addSpan(px, y + 5.4, z + d - 1.2, px + 1.1, y + 6.1, z + d - 0.95,
      pick(rng, [0xd03028, 0xf0b400, 0x2a6a9a, 0xf2f0ea]), 'thin');
  }
  stats.retail++;
  return true;
}

/** Business park: office blocks around the frontage loop. */
function officeBlock(sink, terrain, x, z, w, d, floors, rng, stats) {
  const f = seat(terrain, x, z, w, d, 9);
  if (f == null || onRoad(terrain, x, z, w, d)) return false;
  const y = f.max - 0.05;
  sink.addSpan(x - 0.6, f.min - 1, z - 0.6, x + w + 0.6, y + 0.1, z + d + 0.6, C.concrete);
  makeBuilding(sink, { x, z, w, d, floors, baseY: y, color: pick(rng, [C.glass, 0xc8d0d8, 0xa8b0b8, C.white]), rng });
  addBuildingAccess(sink, x, z, w, d, y, floors, BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false);
  const roofY = y + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  sink.addSpan(x + w * 0.3, roofY, z + d * 0.3, x + w * 0.7, roofY + 1.8, z + d * 0.7, C.metal);
  // Planted island out front
  sink.addSpan(x + w * 0.2, y, z + d + 1.5, x + w * 0.8, y + 0.35, z + d + 5, LAWN);
  stats.office++;
  return true;
}

/** Build the whole district. */
export function placeKearnyMesa(sink, terrain, rng) {
  const plan = kearnyPlan();
  const stats = { homes: 0, bigbox: 0, retail: 0, office: 0, fuel: 0, food: 0 };

  for (const t of plan.tracts) residentialTract(sink, terrain, t, plan, rng, stats);

  // Commercial quadrants: big boxes turned long-side-to-the-spine so they fit
  // beside it, aprons in front of them, then the smaller frontage tenants.
  const r = plan.retail;
  bigBox(sink, terrain, r.x + 6, r.z + 18, 46, 60, rng, stats, 0xd03028);
  bigBox(sink, terrain, r.x + 84, r.z + 20, 48, 48, rng, stats, 0x2a6a9a);
  stripMall(sink, terrain, r.x + 84, r.z + 118, 48, 16, rng, stats);

  const b = plan.business;
  officeBlock(sink, terrain, b.x + 8, b.z + 20, 40, 26, 4, rng, stats);
  officeBlock(sink, terrain, b.x + 8, b.z + 54, 40, 24, 3, rng, stats);
  officeBlock(sink, terrain, b.x + 90, b.z + 20, 44, 26, 5, rng, stats);
  dealership(sink, terrain, b.x + 88, b.z + 120, 50, 24, rng, stats);

  // Fuel and food on the quadrant frontages
  for (const [gx, gz] of [[r.x + 6, r.z + 128], [b.x + 8, b.z + 118]]) {
    if (!onRoad(terrain, gx, gz, 30, 26) && seat(terrain, gx, gz, 30, 26, 9)) {
      placeGasStation(sink, terrain, gx, gz, rng);
      stats.fuel++;
    }
  }
  for (const [fx, fz] of [[r.x + 44, r.z + 128], [b.x + 46, b.z + 122], [r.x + 44, r.z + 88]]) {
    if (!onRoad(terrain, fx, fz, 22, 18) && seat(terrain, fx, fz, 22, 18, 9)) {
      placeRestaurant(sink, terrain, fx, fz, rng, rng() > 0.4);
      stats.food++;
    }
  }

  return stats;
}
