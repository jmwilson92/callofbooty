import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed } from '../BuildingKit.js';
import { registerBuilding } from '../BuildingRegistry.js';
import { C, footprintHeights, addBuildingAccess } from './Catalog.js';

// Point Loma: the peninsula ridge that closes San Diego Bay.
//
// Three things make it read as Point Loma and nowhere else — the Old Point Loma
// Lighthouse on the crest, the terraced white headstone rows of Fort Rosecrans
// spilling down the bay side, and the submarine base on the water below. The
// ridge top here runs 37–46 m with cliffs falling either side, so everything
// terraces along the spine rather than sitting on a pad.

const WHITE = 0xf4f2ea;
const STONE = 0xe8e6de;
const LIGHT_RED = 0x8a3428;
const HULL = 0x2a2f33;
const NAVY = 0x5c6a72;
const TURF = 0x5f8a4a;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

function seat(terrain, x, z, w, d, maxDelta = 7) {
  const f = footprintHeights(terrain, x, z, w, d);
  if (!Number.isFinite(f.max) || f.max < 2.5) return null;
  if (f.delta > maxDelta) return null;
  return f;
}

/**
 * Old Point Loma Lighthouse: a short white tower with a black lantern room and
 * a gallery, sitting on the keeper's cottage. It is short because the real one
 * is — it was built on the crest, which is the whole point.
 */
function lighthouse(sink, terrain, x, z, rng, stats) {
  const f = seat(terrain, x, z, 16, 12, 6);
  if (f == null) return false;
  const y = f.max - 0.05;
  sink.addSpan(x - 0.8, f.min - 1.4, z - 0.8, x + 16.8, y + 0.1, z + 12.8, C.concrete);

  // Keeper's cottage
  makeBuilding(sink, { x, z, w: 16, d: 12, floors: 1, baseY: y, color: WHITE, rng });
  addBuildingAccess(sink, x, z, 16, 12, y, 1, BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false);
  const roofY = y + BUILDINGS.GROUND_FLOOR_HEIGHT;
  sink.addSpan(x - 0.7, roofY, z - 0.7, x + 16.7, roofY + 0.5, z + 12.7, LIGHT_RED);
  sink.addSpan(x + 2, roofY + 0.5, z + 2, x + 14, roofY + 2.6, z + 10, LIGHT_RED);

  // Tower rising through the roof
  const tx = x + 6;
  const tz = z + 4;
  const tw = 4.4;
  const top = roofY + 9;
  sink.addSpan(tx, y, tz, tx + tw, top, tz + tw, WHITE);
  for (let i = 0; i < 2; i++) {
    sink.addSpan(tx + 1.4, roofY + 2.4 + i * 2.6, tz - 0.15, tx + 3.0, roofY + 4.0 + i * 2.6, tz + 0.3, C.glassDark, 'glass');
  }
  // Gallery + lantern room
  sink.addSpan(tx - 1.1, top, tz - 1.1, tx + tw + 1.1, top + 0.4, tz + tw + 1.1, 0x2a2e31);
  sink.addSpan(tx - 1.1, top + 0.4, tz - 1.1, tx + tw + 1.1, top + 1.3, tz - 0.8, 0x2a2e31, 'thin');
  sink.addSpan(tx - 1.1, top + 0.4, tz + tw + 0.8, tx + tw + 1.1, top + 1.3, tz + tw + 1.1, 0x2a2e31, 'thin');
  sink.addSpan(tx - 0.3, top + 0.4, tz - 0.3, tx + tw + 0.3, top + 3.4, tz + tw + 0.3, 0xf6e6a0, 'glass');
  sink.addSpan(tx - 0.6, top + 3.4, tz - 0.6, tx + tw + 0.6, top + 4.4, tz + tw + 0.6, 0x2a2e31);
  post(sink, tx + tw / 2 - 0.15, top + 4.4, tz + tw / 2 - 0.15, 1.6, 0.3, 0x2a2e31);
  stats.buildings++;
  return true;
}

/**
 * Fort Rosecrans: terraced rows of white headstones down the bay slope.
 * Cheap in geometry, unmistakable from anywhere, and the terraces give the
 * slope real cover instead of a bare hillside.
 */
function cemetery(sink, terrain, x, z, w, d, rng, stats) {
  const rows = 11;
  const rowD = d / rows;
  for (let r = 0; r < rows; r++) {
    const rz = z + r * rowD;
    const f = footprintHeights(terrain, x, rz, w, rowD * 0.9);
    if (!Number.isFinite(f.max) || f.max < 3) continue;
    const y = f.max;
    // Turf terrace, cut to the row's high side
    sink.addSpan(x, f.min - 0.8, rz, x + w, y + 0.08, rz + rowD * 0.92, TURF);
    // Retaining lip on the downhill edge
    sink.addSpan(x, y - 1.0, rz + rowD * 0.92 - 0.35, x + w, y + 0.12, rz + rowD * 0.92, STONE, 'thin');
    // Headstones
    const n = Math.floor(w / 2.6);
    for (let i = 0; i < n; i++) {
      const hx = x + 1.4 + i * 2.6;
      sink.addSpan(hx, y + 0.08, rz + rowD * 0.35, hx + 0.75, y + 1.05, rz + rowD * 0.35 + 0.26, STONE, 'thin');
    }
  }
  // Flagpole and a low wall at the head of the plot
  const fy = terrain.heightAt(x + w * 0.5, z - 4);
  if (Number.isFinite(fy) && fy > 3) {
    post(sink, x + w * 0.5, fy, z - 4, 14, 0.32, C.metalLite);
    sink.addSpan(x + w * 0.5 - 1.4, fy, z - 5.4, x + w * 0.5 + 1.7, fy + 0.4, z - 2.3, C.concrete);
    sink.addSpan(x + w * 0.5 + 0.32, fy + 11, z - 3.9, x + w * 0.5 + 3.8, fy + 13.4, z - 3.7, 0xc0392b, 'thin');
  }
  for (let i = 0; i < 14; i++) {
    const wx = x + i * (w / 14);
    const wy = terrain.heightAt(wx, z - 1.5);
    if (!Number.isFinite(wy) || wy < 3) continue;
    sink.addSpan(wx, wy, z - 1.8, wx + (w / 14) - 1.2, wy + 1.05, z - 1.45, STONE, 'thin');
  }
  stats.cemetery = rows;
}

/** Submarine: long low hull with a sail and dive planes. */
function submarine(sink, x, z, len, beam) {
  const waterline = 0;
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    // Taper both ends
    const taper = Math.sin(Math.PI * ((t0 + t1) / 2)) ** 0.55;
    const inset = (beam * (1 - taper)) / 2;
    sink.addSpan(
      x + inset, waterline - 3.2, z + len * t0,
      x + beam - inset, waterline + 1.5, z + len * t1,
      HULL
    );
  }
  // Casing walkway
  sink.addSpan(x + beam * 0.28, waterline + 1.5, z + len * 0.08, x + beam * 0.72, waterline + 1.75, z + len * 0.92, 0x363c40);
  // Sail
  const sz = z + len * 0.3;
  sink.addSpan(x + beam * 0.33, waterline + 1.75, sz, x + beam * 0.67, waterline + 7.5, sz + len * 0.12, HULL);
  sink.addSpan(x + beam * 0.36, waterline + 7.5, sz + 1, x + beam * 0.64, waterline + 8.4, sz + len * 0.1, 0x363c40);
  // Dive planes
  sink.addSpan(x - beam * 0.5, waterline + 5.2, sz + len * 0.04, x + beam * 1.5, waterline + 5.7, sz + len * 0.08, HULL);
  // Masts
  post(sink, x + beam * 0.47, waterline + 8.4, sz + 2.4, 4.5, 0.28, C.metalLite);
  post(sink, x + beam * 0.53, waterline + 8.4, sz + 4.0, 3.2, 0.22, C.metalLite);
}

/** Submarine base on the bay side: pier, boats, and the support sheds. */
function subBase(sink, terrain, x, z, rng, stats) {
  const deckY = 3.0;
  // Wharf running along the shore
  sink.addSpan(x, deckY - 0.6, z, x + 16, deckY, z + 90, C.concrete);
  for (let i = 0; i <= 9; i++) {
    const pz = z + i * 10;
    for (const ox of [1.5, 13]) sink.addSpan(x + ox, -9, pz, x + ox + 0.9, deckY - 0.55, pz + 0.9, C.dark);
    post(sink, x + 0.6, deckY, pz + 2, 0.9, 0.5, 0x2a2e31);
    post(sink, x + 14.6, deckY, pz + 2, 0.9, 0.5, 0x2a2e31);
  }
  // Two boats alongside, outboard of the wharf
  submarine(sink, x - 13, z + 8, 66, 9);
  submarine(sink, x - 26, z + 20, 62, 8.5);
  stats.ships = 2;

  // Support sheds on the bank behind the wharf
  for (let i = 0; i < 2; i++) {
    const bx = x + 20;
    const bz = z + 14 + i * 40;
    const f = seat(terrain, bx, bz, 26, 18, 9);
    if (f == null) continue;
    sink.addSpan(bx - 0.8, f.min - 1.4, bz - 0.8, bx + 26.8, f.max + 0.08, bz + 18.8, C.concrete);
    const shed = makeShed(sink, { x: bx, z: bz, w: 26, d: 18, h: 9, baseY: f.max, color: pick(rng, [0x8e948f, 0x7f857f]), doorW: 7 });
    registerBuilding({ x: bx, z: bz, w: 26, d: 18, floors: 1, baseY: f.max, floorYs: [f.max + 0.2], roofY: shed.roofY });
    stats.buildings++;
  }
  // Gantry crane over the wharf
  for (const ox of [1, 13]) post(sink, x + ox, deckY, z + 44, 14, 0.8, 0xd8a020);
  sink.addSpan(x - 6, deckY + 14, z + 43.4, x + 17, deckY + 15.2, z + 45.6, 0xd8a020);
}

/** Ridge houses along the spine, each cut into the slope. */
function ridgeHousing(sink, terrain, x, z, count, rng, stats) {
  for (let i = 0; i < count; i++) {
    const hx = x + (i % 2) * 26;
    const hz = z + i * 22;
    const w = 13 + rng() * 4;
    const d = 10 + rng() * 3;
    const f = seat(terrain, hx, hz, w, d, 7);
    if (f == null) continue;
    if (terrain.roadAt(hx + w / 2, hz + d / 2) > 0.3) continue;
    const y = f.max - 0.05;
    sink.addSpan(hx - 0.5, f.min - 1.2, hz - 0.5, hx + w + 0.5, y + 0.08, hz + d + 0.5, C.concrete);
    const floors = rng() > 0.6 ? 2 : 1;
    makeBuilding(sink, { x: hx, z: hz, w, d, floors, baseY: y, color: pick(rng, [WHITE, 0xe4d9c4, 0xd8cdb8, 0xc4b8a4]), rng });
    addBuildingAccess(sink, hx, hz, w, d, y, floors, BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false);
    const roofY = y + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
    sink.addSpan(hx - 0.6, roofY, hz - 0.6, hx + w + 0.6, roofY + 0.9, hz + d + 0.6, pick(rng, [LIGHT_RED, 0x6a5a4a, 0x8a5040]));
    stats.buildings++;
  }
}

/** Build the peninsula. */
export function placePointLoma(sink, terrain, p, rng) {
  const stats = { buildings: 0, ships: 0, cemetery: 0 };

  // Lighthouse on the crest at the north end of the ridge
  lighthouse(sink, terrain, p.x - 46, p.z - 96, rng, stats);

  // Fort Rosecrans stepping down the bay side of the ridge
  cemetery(sink, terrain, p.x - 34, p.z - 40, 62, 96, rng, stats);

  // Submarine base on the water below the cemetery
  subBase(sink, terrain, p.x + 52, p.z - 10, rng, stats);

  // Housing along the spine, south of the cemetery
  ridgeHousing(sink, terrain, p.x - 62, p.z + 74, 6, rng, stats);

  // Sunset Cliffs: a run of low wall along the ocean edge
  for (let i = 0; i < 20; i++) {
    const wx = p.x - 92;
    const wz = p.z - 110 + i * 13;
    const wy = terrain.heightAt(wx, wz);
    if (!Number.isFinite(wy) || wy < 4) continue;
    if (terrain.slopeDegAt(wx, wz) > 45) continue;
    sink.addSpan(wx, wy, wz, wx + 1.0, wy + 1.1, wz + 11, 0x9a968c, 'thin');
  }

  return stats;
}
