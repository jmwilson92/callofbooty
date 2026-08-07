import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed } from '../BuildingKit.js';
import { registerBuilding } from '../BuildingRegistry.js';
import { C, footprintHeights, addBuildingAccess } from './Catalog.js';

// Coronado: Naval Air Station North Island on the bay side, the Hotel del and
// its cottages on the ocean side.
//
// The island here is a narrow strip — roughly 120 m of buildable land between
// two stretches of −8 m water — so the base works the way the real one does:
// hangars and ops on the land, and the fleet moored out on piers that run north
// into the bay. The carrier deck is the point. It is the biggest flat surface
// on the map, it reads from every approach, and it is a genuinely good fight.

const NAVY = 0x5c6a72;
const NAVY_DK = 0x3f4a52;
const DECK = 0x4a4f52;
const DECK_LINE = 0xe8e4d8;
const HULL = 0x33393d;
const HULL_RED = 0x6a2f26;
const RESORT = 0xf2ece0;
const RESORT_ROOF = 0x9a3a2c;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

function seat(terrain, x, z, w, d, maxDelta = 6) {
  const f = footprintHeights(terrain, x, z, w, d);
  if (!Number.isFinite(f.max) || f.max < 2.5) return null;
  if (f.delta > maxDelta) return null;
  return f;
}

/**
 * A pier running north from the shore out over the water, on piles.
 * Returns the deck height so ships can be moored flush against it.
 */
function pier(sink, terrain, x, z0, z1, w, deckY) {
  sink.addSpan(x, deckY - 0.55, z1, x + w, deckY, z0, C.concrete);
  const n = Math.max(3, Math.round((z0 - z1) / 12));
  for (let i = 0; i <= n; i++) {
    const pz = z1 + ((z0 - z1) * i) / n;
    for (const ox of [1.2, w - 2.0]) {
      sink.addSpan(x + ox, -9, pz, x + ox + 0.8, deckY - 0.5, pz + 0.8, C.dark);
    }
  }
  // Bollards and a service crane at the root
  for (let i = 0; i <= n; i++) {
    const pz = z1 + ((z0 - z1) * i) / n;
    post(sink, x + 0.4, deckY, pz, 0.9, 0.5, 0x2a2e31);
    post(sink, x + w - 0.9, deckY, pz, 0.9, 0.5, 0x2a2e31);
  }
  post(sink, x + w * 0.5, deckY, z0 - 8, 11, 0.8, 0xd8a020);
  sink.addSpan(x + w * 0.5 - 4, deckY + 11, z0 - 8.4, x + w * 0.5 + 5, deckY + 12, z0 - 7.2, 0xd8a020);
}

/**
 * Aircraft carrier. Flat flight deck, island superstructure to starboard,
 * angled deck markings, a couple of aircraft parked out of the landing lane.
 */
function carrier(sink, x, z, len, beam, rng) {
  const waterline = 0;
  const draft = 7.5;
  const freeboard = 9.5;
  const deckY = waterline + freeboard;

  // Hull — tapered by stepping the bow in
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    // Narrow toward the bow (low z)
    const inset = Math.pow(t0, 2.2) * beam * 0.34;
    sink.addSpan(
      x + inset, waterline - draft, z + len * t0,
      x + beam - inset, waterline + 1.2, z + len * t1,
      HULL_RED
    );
    sink.addSpan(
      x + inset, waterline + 1.2, z + len * t0,
      x + beam - inset, deckY, z + len * t1,
      HULL
    );
  }

  // Flight deck — overhangs the hull, which is what makes a carrier read
  const dOver = beam * 0.16;
  sink.addSpan(x - dOver, deckY, z, x + beam + dOver, deckY + 0.6, z + len, DECK);
  // Angled landing deck stripe
  for (let i = 0; i < 14; i++) {
    const t = i / 14;
    const cx = x - dOver * 0.6 + (beam * 0.5) * t;
    sink.addSpan(cx, deckY + 0.6, z + len * (0.18 + t * 0.6),
      cx + 1.0, deckY + 0.66, z + len * (0.2 + t * 0.6), DECK_LINE, 'thin');
  }
  // Centreline / catapult tracks
  for (const ox of [beam * 0.22, beam * 0.52]) {
    sink.addSpan(x + ox, deckY + 0.6, z + len * 0.04, x + ox + 0.7, deckY + 0.66, z + len * 0.46, DECK_LINE, 'thin');
  }
  // Deck edge safety netting
  sink.addSpan(x - dOver, deckY + 0.6, z, x - dOver + 0.3, deckY + 1.2, z + len, C.metal, 'thin');
  sink.addSpan(x + beam + dOver - 0.3, deckY + 0.6, z, x + beam + dOver, deckY + 1.2, z + len, C.metal, 'thin');

  // Island superstructure, starboard side aft of midships
  const ix = x + beam - 7.5;
  const iz = z + len * 0.55;
  sink.addSpan(ix, deckY + 0.6, iz, ix + 7, deckY + 9, iz + 20, NAVY);
  sink.addSpan(ix + 0.5, deckY + 9, iz + 2, ix + 6.5, deckY + 13, iz + 12, NAVY_DK);
  for (let i = 0; i < 3; i++) {
    sink.addSpan(ix + 0.2, deckY + 3.2 + i * 2.4, iz - 0.2, ix + 6.8, deckY + 4.4 + i * 2.4, iz + 0.25, C.glassDark, 'glass');
  }
  post(sink, ix + 3, deckY + 13, iz + 5, 12, 0.5, C.metalLite);
  sink.addSpan(ix + 1.4, deckY + 17, iz + 4, ix + 5.2, deckY + 18.2, iz + 8, C.metal);
  // Radar bar
  sink.addSpan(ix + 1.0, deckY + 22, iz + 4.6, ix + 5.6, deckY + 24.5, iz + 5.4, C.metalLite);

  // Parked aircraft along the starboard deck edge, clear of the landing lane
  for (let i = 0; i < 5; i++) {
    const ax = x + beam * 0.74;
    const az = z + len * (0.12 + i * 0.085);
    sink.addSpan(ax, deckY + 0.66, az, ax + 2.0, deckY + 1.9, az + 8.5, pick(rng, [0x6a7078, 0x565c64]));
    sink.addSpan(ax - 3.4, deckY + 1.1, az + 3.4, ax + 5.4, deckY + 1.5, az + 5.2, pick(rng, [0x6a7078, 0x4f555c]));
    sink.addSpan(ax + 0.2, deckY + 1.9, az + 5.6, ax + 1.8, deckY + 3.0, az + 7.4, 0x4f555c);
  }
  // Deck-edge lift
  sink.addSpan(x + beam + dOver, deckY, z + len * 0.42, x + beam + dOver + 7, deckY + 0.6, z + len * 0.56, DECK);
}

/** Destroyer: sharp hull, blocky superstructure, gun forward, mast and stacks. */
function destroyer(sink, x, z, len, beam, rng) {
  const waterline = 0;
  const draft = 4.5;
  const deckY = waterline + 5.0;
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const inset = Math.pow(t0, 2.4) * beam * 0.42;
    sink.addSpan(x + inset, waterline - draft, z + len * t0, x + beam - inset, waterline + 0.8, z + len * t1, HULL_RED);
    sink.addSpan(x + inset, waterline + 0.8, z + len * t0, x + beam - inset, deckY, z + len * t1, NAVY_DK);
  }
  // Main deck
  sink.addSpan(x, deckY, z + len * 0.05, x + beam, deckY + 0.4, z + len, DECK);
  // Forward gun turret
  sink.addSpan(x + beam * 0.28, deckY + 0.4, z + len * 0.14, x + beam * 0.72, deckY + 2.4, z + len * 0.22, NAVY);
  sink.addSpan(x + beam * 0.45, deckY + 1.5, z + len * 0.05, x + beam * 0.55, deckY + 2.0, z + len * 0.15, C.metal);
  // Bridge / superstructure
  const sz = z + len * 0.28;
  sink.addSpan(x + beam * 0.12, deckY + 0.4, sz, x + beam * 0.88, deckY + 5.5, sz + len * 0.2, NAVY);
  sink.addSpan(x + beam * 0.2, deckY + 5.5, sz + 2, x + beam * 0.8, deckY + 8.5, sz + len * 0.14, NAVY_DK);
  for (let i = 0; i < 2; i++) {
    sink.addSpan(x + beam * 0.22, deckY + 6.2 + i * 1.4, sz + 1.8, x + beam * 0.78, deckY + 7.2 + i * 1.4, sz + 2.15, C.glassDark, 'glass');
  }
  // Mast + radar
  post(sink, x + beam * 0.48, deckY + 8.5, sz + 6, 10, 0.4, C.metalLite);
  sink.addSpan(x + beam * 0.3, deckY + 15, sz + 5.6, x + beam * 0.7, deckY + 16.4, sz + 6.6, C.metal);
  // Stack
  sink.addSpan(x + beam * 0.32, deckY + 5.5, z + len * 0.55, x + beam * 0.68, deckY + 9.5, z + len * 0.63, NAVY_DK);
  // Helipad aft
  sink.addSpan(x + beam * 0.1, deckY + 0.42, z + len * 0.8, x + beam * 0.9, deckY + 0.5, z + len * 0.97, DECK);
  sink.addSpan(x + beam * 0.34, deckY + 0.5, z + len * 0.855, x + beam * 0.66, deckY + 0.56, z + len * 0.915, DECK_LINE, 'thin');
}

/** Naval Air Station: hangars, ops, tower, fuel farm. */
function airStation(sink, terrain, x, z, rng, stats) {
  // Hangar row
  for (let i = 0; i < 3; i++) {
    const hx = x + i * 40;
    const hz = z;
    const f = seat(terrain, hx, hz, 36, 26, 8);
    if (f == null) continue;
    const shed = makeShed(sink, { x: hx, z: hz, w: 36, d: 26, h: 13, baseY: f.max, color: pick(rng, [0x8e948f, 0x7f857f, 0x9aa09a]), doorW: 14 });
    registerBuilding({ x: hx, z: hz, w: 36, d: 26, floors: 1, baseY: f.max, floorYs: [f.max + 0.2], roofY: shed.roofY });
    // Arched roof ribs
    for (let r = 0; r <= 5; r++) {
      const rz = hz + (26 * r) / 5;
      sink.addSpan(hx - 0.4, f.max + 13, rz - 0.3, hx + 36.4, f.max + 14.1, rz + 0.3, 0x6e7470);
    }
    stats.buildings++;
  }
  // Ops building
  const ox = x + 6;
  const oz = z + 34;
  const of = seat(terrain, ox, oz, 30, 18, 8);
  if (of) {
    makeBuilding(sink, { x: ox, z: oz, w: 30, d: 18, floors: 2, baseY: of.max - 0.05, color: 0xa8aeb2, rng });
    addBuildingAccess(sink, ox, oz, 30, 18, of.max - 0.05, 2, BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false);
    stats.buildings++;
  }
  // Control tower
  const tx = x + 92;
  const tz = z + 36;
  const tf = seat(terrain, tx, tz, 10, 10, 8);
  if (tf) {
    sink.addSpan(tx, tf.max, tz, tx + 10, tf.max + 18, tz + 10, 0xb0b6b8);
    sink.addSpan(tx - 1.4, tf.max + 18, tz - 1.4, tx + 11.4, tf.max + 23, tz + 11.4, NAVY_DK);
    for (const [ax, az, bx, bz] of [
      [tx - 1.2, tz - 1.2, tx + 11.2, tz - 0.85],
      [tx - 1.2, tz + 10.85, tx + 11.2, tz + 11.2],
      [tx - 1.2, tz - 1.2, tx - 0.85, tz + 11.2],
      [tx + 10.85, tz - 1.2, tx + 11.2, tz + 11.2],
    ]) sink.addSpan(ax, tf.max + 19, az, bx, tf.max + 22.2, bz, C.glass, 'glass');
    post(sink, tx + 5, tf.max + 23, tz + 5, 6, 0.35, C.metalLite);
    stats.buildings++;
  }
  // Fuel farm
  for (let i = 0; i < 3; i++) {
    const fx = x + 128 + (i % 2) * 20;
    const fz = z + 6 + Math.floor(i / 2) * 22;
    const ff = seat(terrain, fx, fz, 14, 14, 8);
    if (!ff) continue;
    sink.addSpan(fx, ff.max, fz, fx + 14, ff.max + 9, fz + 14, 0xd0d4d2);
    sink.addSpan(fx - 0.6, ff.max + 9, fz - 0.6, fx + 14.6, ff.max + 10.2, fz + 14.6, 0xb8bcba);
  }
}

/** Hotel del Coronado: white Victorian mass under red conical turret roofs. */
function hotelDel(sink, terrain, x, z, rng, stats) {
  const w = 52;
  const d = 30;
  const f = seat(terrain, x, z, w, d, 7);
  if (f == null) return false;
  const baseY = f.max - 0.05;
  sink.addSpan(x - 1, f.min - 1.5, z - 1, x + w + 1, baseY + 0.1, z + d + 1, C.concrete);
  const floors = 4;
  makeBuilding(sink, { x, z, w, d, floors, baseY, color: RESORT, rng });
  addBuildingAccess(sink, x, z, w, d, baseY, floors, BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false);
  const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  // Steep red roof
  sink.addSpan(x - 1.2, roofY, z - 1.2, x + w + 1.2, roofY + 1.0, z + d + 1.2, RESORT_ROOF);
  sink.addSpan(x + 3, roofY + 1.0, z + 3, x + w - 3, roofY + 4.2, z + d - 3, RESORT_ROOF);
  // Corner turrets — the silhouette everyone knows
  for (const [ox, oz] of [[0, 0], [w - 12, 0], [0, d - 12], [w - 12, d - 12]]) {
    const cx = x + ox;
    const cz = z + oz;
    sink.addSpan(cx, baseY, cz, cx + 12, roofY + 2.5, cz + 12, RESORT);
    for (let s = 0; s < 4; s++) {
      const t = s / 4;
      const r = 6 * (1 - t);
      sink.addSpan(cx + 6 - r, roofY + 2.5 + s * 2.2, cz + 6 - r,
        cx + 6 + r, roofY + 2.5 + (s + 1) * 2.2, cz + 6 + r, RESORT_ROOF);
    }
    post(sink, cx + 5.8, roofY + 11.3, cz + 5.8, 2.4, 0.35, C.metalLite);
  }
  // Verandah along the seaward face
  sink.addSpan(x + 2, baseY, z + d, x + w - 2, baseY + 0.25, z + d + 4, 0xd8cdb8);
  for (let i = 0; i <= 8; i++) post(sink, x + 3 + i * ((w - 7) / 8), baseY + 0.25, z + d + 3.4, 3.6, 0.3, RESORT);
  sink.addSpan(x + 2, baseY + 3.85, z + d, x + w - 2, baseY + 4.4, z + d + 4.2, RESORT_ROOF);
  stats.buildings++;
  return true;
}

/**
 * Build Coronado: the air station and its piers on the bay side, the resort and
 * its cottages on the ocean side.
 */
export function placeCoronado(sink, terrain, p, rng) {
  const stats = { buildings: 0, ships: 0 };

  // Air station on the western half of the strip
  airStation(sink, terrain, p.x - 105, p.z - 18, rng, stats);

  // Piers running north into the bay, with the fleet alongside
  const pierDeck = 3.2;
  pier(sink, terrain, p.x - 96, p.z - 26, p.z - 116, 12, pierDeck);
  pier(sink, terrain, p.x - 20, p.z - 26, p.z - 150, 14, pierDeck);

  destroyer(sink, p.x - 82, p.z - 112, 86, 11, rng);
  stats.ships++;
  carrier(sink, p.x - 4, p.z - 146, 150, 26, rng);
  stats.ships++;

  // Hotel del on the eastern end, facing the open water
  hotelDel(sink, terrain, p.x + 34, p.z - 4, rng, stats);

  // Cottages along the strand south of the hotel
  for (let i = 0; i < 6; i++) {
    const cx = p.x - 24 + i * 17;
    const cz = p.z + 26;
    const f = seat(terrain, cx, cz, 12, 9, 6);
    if (f == null) continue;
    makeShed(sink, { x: cx, z: cz, w: 12, d: 9, h: 3.6, baseY: f.max, color: pick(rng, [RESORT, 0xe8dfd0, 0xd8cdb8]) });
    sink.addSpan(cx - 0.8, f.max + 3.6, cz - 0.8, cx + 12.8, f.max + 4.8, cz + 9.8, RESORT_ROOF);
    stats.buildings++;
  }

  // Seawall along the ocean edge
  for (let i = 0; i < 16; i++) {
    const wx = p.x - 70 + i * 10;
    const wy = terrain.heightAt(wx, p.z + 42);
    if (!Number.isFinite(wy) || wy < 2.5) continue;
    sink.addSpan(wx, wy, p.z + 42, wx + 8.5, wy + 1.2, p.z + 42.4, 0x9a968c, 'thin');
  }

  return stats;
}
