import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed, slab } from '../BuildingKit.js';

// High-detail procedural kits (box primitives only). Original colors — no brands.

export const C = {
  white: 0xf2f0ea,
  cream: 0xe8dfd0,
  brick: 0x9a4034,
  brickDark: 0x6a2e26,
  red: 0xd03028,
  redHot: 0xff3a2a,
  yellow: 0xf0b400,
  yellowHot: 0xffd040,
  blue: 0x2a6a9a,
  blueLite: 0x4a9ad0,
  teal: 0x1a9a88,
  green: 0x3a8a2e,
  lime: 0x6aba3a,
  orange: 0xe07020,
  gray: 0x9a9890,
  dark: 0x3a3834,
  metal: 0x7a7874,
  metalLite: 0xa8a6a0,
  asphalt: 0x2e2f32,
  glass: 0x6ab0d0,
  glassDark: 0x3a5a70,
  wood: 0x9a7a50,
  woodDark: 0x6a5030,
  sand: 0xd4c4a0,
  concrete: 0xb8b6b0,
  neonPink: 0xff40a0,
  neonCyan: 0x20e8ff,
  neonLime: 0xb0ff20,
};

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function groundY(terrain, x, z, w = 0, d = 0) {
  let m = terrain.heightAt(x, z);
  if (w || d) {
    m = Math.max(
      m,
      terrain.heightAt(x + w, z),
      terrain.heightAt(x, z + d),
      terrain.heightAt(x + w, z + d),
      terrain.heightAt(x + w * 0.5, z + d * 0.5)
    );
  }
  return m;
}

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

function neonStrip(sink, x0, y, z0, x1, y2, z1, col) {
  sink.addSpan(x0, y, z0, x1, y2, z1, col);
}

// ===================== VEHICLES =====================
export function placeVehicle(sink, x, z, baseY, rng, color = null) {
  const col = color ?? pick(rng, [
    0x2a4a8a, 0x8a2020, 0x1a6a3a, 0xc4a020, 0x1a1a1a, 0xd0d0d0, 0x6a2a8a, 0xe07020,
  ]);
  const L = 4.5 + rng() * 1.2;
  const W = 1.9;
  const H = 1.35 + rng() * 0.4;
  // Body
  sink.addSpan(x, baseY + 0.28, z, x + L, baseY + H * 0.55, z + W, col);
  // Cabin
  sink.addSpan(x + L * 0.28, baseY + H * 0.48, z + 0.12, x + L * 0.72, baseY + H, z + W - 0.12, C.glassDark);
  // Hood / trunk accents
  sink.addSpan(x + 0.1, baseY + H * 0.5, z + 0.15, x + L * 0.28, baseY + H * 0.58, z + W - 0.15, col);
  // Wheels
  const wh = 0.42;
  for (const [lx, lz] of [[0.55, -0.05], [0.55, W - 0.15], [L - 0.9, -0.05], [L - 0.9, W - 0.15]]) {
    sink.addSpan(x + lx, baseY, z + lz, x + lx + 0.55, baseY + wh, z + lz + 0.35, C.dark);
  }
  // Lights
  sink.addSpan(x + L - 0.12, baseY + 0.45, z + 0.15, x + L, baseY + 0.7, z + 0.45, C.yellowHot);
  sink.addSpan(x + L - 0.12, baseY + 0.45, z + W - 0.45, x + L, baseY + 0.7, z + W - 0.15, C.yellowHot);
  sink.addSpan(x, baseY + 0.5, z + 0.2, x + 0.1, baseY + 0.72, z + 0.5, C.redHot);
  sink.addSpan(x, baseY + 0.5, z + W - 0.5, x + 0.1, baseY + 0.72, z + W - 0.2, C.redHot);
}

export function placeTruck(sink, x, z, baseY, rng) {
  const col = pick(rng, [C.red, C.white, C.blue, C.yellow]);
  sink.addSpan(x, baseY + 0.35, z, x + 3.2, baseY + 2.4, z + 2.3, col);
  sink.addSpan(x + 3.0, baseY + 0.5, z + 0.1, x + 8.5, baseY + 2.8, z + 2.2, C.metalLite);
  for (const lx of [0.6, 6.8]) {
    sink.addSpan(x + lx, baseY, z - 0.1, x + lx + 0.7, baseY + 0.55, z + 0.35, C.dark);
    sink.addSpan(x + lx, baseY, z + 1.95, x + lx + 0.7, baseY + 0.55, z + 2.4, C.dark);
  }
}

// ===================== SUBURBAN =====================
export function placeSuburbanHome(sink, terrain, x, z, rng) {
  const w = 11 + rng() * 5;
  const d = 9 + rng() * 4;
  const baseY = groundY(terrain, x, z, w, d);
  const floors = rng() > 0.5 ? 2 : 1;
  const color = pick(rng, [C.cream, C.white, C.brick, 0xc8b8a0, 0xa8c0d0, 0xd0c8b8]);
  makeBuilding(sink, { x, z, w, d, floors, baseY, color, rng });

  // Porch
  sink.addSpan(x + w * 0.2, baseY, z - 2.2, x + w * 0.55, baseY + 0.2, z, C.wood);
  post(sink, x + w * 0.22, baseY, z - 2.0, 2.4, 0.2, C.wood);
  post(sink, x + w * 0.5, baseY, z - 2.0, 2.4, 0.2, C.wood);
  sink.addSpan(x + w * 0.2, baseY + 2.3, z - 2.2, x + w * 0.55, baseY + 2.55, z, C.woodDark);

  // Chimney
  if (rng() > 0.4) {
    const roof = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
    sink.addSpan(x + w * 0.7, roof, z + d * 0.3, x + w * 0.7 + 1.1, roof + 2.4, z + d * 0.3 + 1.1, C.brickDark);
  }

  // Garage
  if (rng() > 0.3) {
    const gw = 6, gd = 7;
    const gx = x + w + 0.8;
    makeShed(sink, {
      x: gx, z, w: gw, d: gd, h: 3.4,
      baseY: groundY(terrain, gx, z, gw, gd),
      color: pick(rng, [C.gray, C.white, color]), doorW: 4.2,
    });
    // Driveway
    sink.addSpan(gx, baseY - 0.05, z - 6, gx + gw, baseY + 0.08, z, C.asphalt);
    if (rng() > 0.45) placeVehicle(sink, gx + 0.5, z - 5.2, baseY, rng);
  }

  // Yard fence + mailbox
  for (let i = 0; i < 5; i++) {
    const fx = x - 1.5 + i * 3.2;
    sink.addSpan(fx, baseY, z + d + 1.5, fx + 2.8, baseY + 1.15, z + d + 1.7, C.wood, 'thin');
  }
  post(sink, x - 1.2, baseY, z - 1.5, 1.2, 0.15, C.metal);
  sink.addSpan(x - 1.5, baseY + 1.0, z - 1.7, x - 0.7, baseY + 1.45, z - 1.2, C.dark);

  // Tree (blocky)
  if (rng() > 0.35) {
    const tx = x - 3, tz = z + d * 0.4;
    post(sink, tx, baseY, tz, 2.2, 0.35, C.woodDark);
    sink.addSpan(tx - 1.2, baseY + 1.8, tz - 1.2, tx + 1.6, baseY + 4.0, tz + 1.6, C.green);
    sink.addSpan(tx - 0.8, baseY + 3.6, tz - 0.8, tx + 1.2, baseY + 5.0, tz + 1.2, C.lime);
  }
}

// ===================== TRAILER =====================
export function placeTrailer(sink, terrain, x, z, rng) {
  const w = 11 + rng() * 5;
  const d = 3.5;
  const baseY = groundY(terrain, x, z, w, d) + 0.35; // on jacks
  const color = pick(rng, [C.cream, C.metalLite, 0xb0a090, C.blueLite, C.teal, C.white]);
  // Chassis / jacks
  sink.addSpan(x + 0.5, baseY - 0.35, z + 0.4, x + 1.0, baseY, z + 0.9, C.metal);
  sink.addSpan(x + w - 1.2, baseY - 0.35, z + 0.4, x + w - 0.7, baseY, z + 0.9, C.metal);
  sink.addSpan(x + 0.5, baseY - 0.35, z + d - 1, x + 1.0, baseY, z + d - 0.5, C.metal);
  sink.addSpan(x + w - 1.2, baseY - 0.35, z + d - 1, x + w - 0.7, baseY, z + d - 0.5, C.metal);
  // Body
  sink.addSpan(x, baseY, z, x + w, baseY + 2.6, z + d, color);
  // Stripe
  neonStrip(sink, x, baseY + 1.1, z - 0.02, x + w, baseY + 1.35, z + 0.05, pick(rng, [C.red, C.teal, C.yellow, C.blue]));
  // Roof AC
  sink.addSpan(x + w * 0.4, baseY + 2.6, z + 0.6, x + w * 0.4 + 1.8, baseY + 3.15, z + 2.2, C.metal);
  // Windows
  sink.addSpan(x + 2, baseY + 1.2, z - 0.05, x + 3.5, baseY + 2.1, z + 0.08, C.glass);
  sink.addSpan(x + w - 4, baseY + 1.2, z - 0.05, x + w - 2.2, baseY + 2.1, z + 0.08, C.glass);
  // Steps + awning
  sink.addSpan(x + w * 0.45, baseY - 0.35, z - 1.4, x + w * 0.45 + 1.4, baseY + 0.15, z, C.wood);
  sink.addSpan(x + w * 0.4, baseY + 2.2, z - 1.6, x + w * 0.4 + 2.2, baseY + 2.45, z + 0.2, pick(rng, [C.teal, C.orange, C.blue]));
  // Propane tanks
  sink.addSpan(x + w - 0.9, baseY, z + d + 0.3, x + w - 0.2, baseY + 1.1, z + d + 1.0, C.metalLite);
}

// ===================== GAS STATION =====================
export function placeGasStation(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 30, 24);
  // Lot
  sink.addSpan(x - 2, baseY - 0.06, z - 2, x + 26, baseY + 0.04, z + 22, C.asphalt);
  // Canopy with neon edge
  sink.addSpan(x, baseY + 4.4, z, x + 24, baseY + 4.9, z + 15, C.yellowHot);
  neonStrip(sink, x, baseY + 4.85, z - 0.1, x + 24, baseY + 5.15, z + 0.25, C.neonCyan);
  neonStrip(sink, x, baseY + 4.85, z + 14.75, x + 24, baseY + 5.15, z + 15.1, C.neonCyan);
  for (const [px, pz] of [[1.5, 1.5], [22, 1.5], [1.5, 13], [22, 13], [12, 1.5], [12, 13]]) {
    post(sink, x + px, baseY, z + pz, 4.4, 0.45, C.metalLite);
  }
  // Island + pumps
  for (let i = 0; i < 4; i++) {
    const px = x + 4 + i * 5;
    sink.addSpan(px - 0.3, baseY, z + 5.5, px + 2.0, baseY + 0.25, z + 9.5, C.concrete);
    sink.addSpan(px, baseY + 0.25, z + 6.2, px + 1.4, baseY + 1.7, z + 7.6, C.dark);
    sink.addSpan(px - 0.15, baseY + 1.7, z + 6.0, px + 1.55, baseY + 2.55, z + 7.8, C.redHot);
    neonStrip(sink, px + 0.2, baseY + 2.4, z + 6.3, px + 1.2, baseY + 2.65, z + 7.5, C.yellowHot);
  }
  // Store
  makeShed(sink, { x: x + 2, z: z + 16, w: 16, d: 9, h: 4.0, baseY, color: C.white, doorW: 2.6 });
  neonStrip(sink, x + 2, baseY + 3.5, z + 15.9, x + 18, baseY + 3.95, z + 16.15, C.neonPink);
  // Price totem
  post(sink, x - 3, baseY, z + 3, 10, 0.5, C.metal);
  sink.addSpan(x - 5.5, baseY + 7.5, z + 2, x - 0.5, baseY + 11.2, z + 4.2, C.yellowHot);
  neonStrip(sink, x - 5.3, baseY + 10.6, z + 2.1, x - 0.7, baseY + 11.0, z + 4.1, C.neonLime);
  // Trash + air pump
  sink.addSpan(x + 20, baseY, z + 17, x + 21.2, baseY + 1.1, z + 18.2, C.dark);
  post(sink, x + 22, baseY, z + 6, 1.4, 0.25, C.metal);
}

// ===================== RESTAURANT / FAST FOOD =====================
export function placeRestaurant(sink, terrain, x, z, rng, fast = true) {
  const baseY = groundY(terrain, x, z, 22, 16);
  const brand = fast
    ? pick(rng, [C.redHot, C.orange, C.yellowHot, C.teal, C.neonPink])
    : pick(rng, [C.brick, C.cream, C.dark, C.woodDark]);
  const w = 15 + rng() * 5;
  const d = 12 + rng() * 4;
  makeBuilding(sink, {
    x, z, w, d,
    floors: fast ? 1 : 1 + (rng() > 0.5 ? 1 : 0),
    baseY, color: fast ? C.white : brand, rng,
  });
  // Brand fascia
  neonStrip(sink, x - 0.1, baseY + 3.6, z - 0.15, x + w + 0.1, baseY + 4.4, z + 0.2, brand);
  // Giant roof icon blob
  sink.addSpan(x + w * 0.35, baseY + 4.4, z + d * 0.3, x + w * 0.65, baseY + 6.5, z + d * 0.65, brand);

  if (fast) {
    // Drive-thru lane canopy + menu board
    sink.addSpan(x + w + 1, baseY + 3.0, z + 1, x + w + 9, baseY + 3.45, z + d - 1, brand);
    post(sink, x + w + 1.5, baseY, z + 2, 3.0, 0.3);
    post(sink, x + w + 8, baseY, z + 2, 3.0, 0.3);
    post(sink, x + w + 1.5, baseY, z + d - 3, 3.0, 0.3);
    sink.addSpan(x + w + 3, baseY, z - 2, x + w + 5.5, baseY + 2.8, z - 0.5, C.dark);
    neonStrip(sink, x + w + 3.1, baseY + 2.4, z - 1.9, x + w + 5.4, baseY + 2.7, z - 0.6, C.neonCyan);
    // Parking lot
    sink.addSpan(x - 8, baseY - 0.05, z - 8, x + w + 10, baseY + 0.03, z - 0.5, C.asphalt);
    for (let i = 0; i < 3; i++) placeVehicle(sink, x - 6 + i * 5.5, z - 6.5, baseY, rng);
  } else {
    // Awning + outdoor dining
    sink.addSpan(x + 1, baseY + 2.6, z - 3, x + w - 1, baseY + 2.9, z, brand);
    for (let i = 0; i < 4; i++) {
      const tx = x + 2 + i * 3.2;
      sink.addSpan(tx, baseY, z - 2.5, tx + 1.3, baseY + 0.9, z - 1.2, C.wood);
      post(sink, tx + 0.2, baseY + 0.9, z - 2.3, 0.7, 0.12, C.metal);
    }
  }
}

// ===================== AUTO REPAIR =====================
export function placeAutoRepair(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 24, 18);
  sink.addSpan(x - 1, baseY - 0.05, z - 4, x + 22, baseY + 0.04, z + 16, C.asphalt);
  makeShed(sink, { x, z, w: 20, d: 15, h: 6.2, baseY, color: C.metal, doorW: 6.5 });
  neonStrip(sink, x, baseY + 5.5, z - 0.1, x + 20, baseY + 6.0, z + 0.15, C.orange);
  // Open bay interior blocks (lifts)
  for (let i = 0; i < 2; i++) {
    const bx = x + 3 + i * 8;
    sink.addSpan(bx, baseY, z + 3, bx + 5, baseY + 0.15, z + 11, C.asphalt);
    post(sink, bx + 0.3, baseY, z + 4, 2.2, 0.25, C.yellow);
    post(sink, bx + 4.2, baseY, z + 4, 2.2, 0.25, C.yellow);
    post(sink, bx + 0.3, baseY, z + 9.5, 2.2, 0.25, C.yellow);
    post(sink, bx + 4.2, baseY, z + 9.5, 2.2, 0.25, C.yellow);
    sink.addSpan(bx + 0.5, baseY + 1.8, z + 4.2, bx + 4.3, baseY + 2.1, z + 9.8, C.metalLite);
  }
  // Tire stacks + oil drums
  for (let i = 0; i < 5; i++) {
    sink.addSpan(x + 17, baseY + i * 0.4, z + 1, x + 18.5, baseY + (i + 1) * 0.4, z + 2.5, C.dark);
  }
  for (let i = 0; i < 3; i++) {
    sink.addSpan(x + 18.8, baseY, z + 4 + i * 1.4, x + 19.8, baseY + 1.0, z + 5 + i * 1.4, pick(rng, [C.blue, C.red, C.dark]));
  }
  placeVehicle(sink, x + 2, z - 3.5, baseY, rng, C.dark);
  placeTruck(sink, x + 10, z - 3.8, baseY, rng);
  // Sign
  post(sink, x - 2, baseY, z + 4, 7, 0.4);
  sink.addSpan(x - 4, baseY + 5.5, z + 3, x - 0.5, baseY + 7.8, z + 5.2, C.orange);
}

// ===================== FIRE STATION =====================
export function placeFireStation(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 36, 22);
  sink.addSpan(x - 2, baseY - 0.05, z - 8, x + 38, baseY + 0.04, z + 20, C.concrete);
  // Bays
  makeShed(sink, { x, z, w: 26, d: 18, h: 7.2, baseY, color: C.white, doorW: 7 });
  neonStrip(sink, x, baseY + 6.3, z - 0.12, x + 26, baseY + 7.0, z + 0.2, C.redHot);
  // Door frame stripes
  for (let i = 0; i < 3; i++) {
    const dx = x + 3 + i * 8;
    neonStrip(sink, dx, baseY, z - 0.08, dx + 0.35, baseY + 5.5, z + 0.12, C.red);
    neonStrip(sink, dx + 5.5, baseY, z - 0.08, dx + 5.85, baseY + 5.5, z + 0.12, C.red);
  }
  // HQ wing
  makeBuilding(sink, { x: x + 27, z, w: 14, d: 16, floors: 3, baseY, color: C.brick, rng });
  // Hose / training tower
  sink.addSpan(x + 20, baseY, z + 14, x + 24.5, baseY + 16, z + 18.5, C.red);
  sink.addSpan(x + 20.5, baseY + 16, z + 14.5, x + 24, baseY + 17.2, z + 18, C.white);
  neonStrip(sink, x + 21.5, baseY + 17, z + 15.5, x + 23, baseY + 18.5, z + 17, C.redHot);
  // Engines
  sink.addSpan(x + 2, baseY, z - 7, x + 10, baseY + 2.6, z - 3.5, C.redHot);
  sink.addSpan(x + 3, baseY + 2.4, z - 6.5, x + 8, baseY + 3.3, z - 4, C.dark);
  sink.addSpan(x + 12, baseY, z - 7, x + 20, baseY + 2.6, z - 3.5, C.red);
  // Flag pole
  post(sink, x + 28, baseY, z - 4, 9, 0.2, C.metalLite);
  sink.addSpan(x + 28.2, baseY + 7.5, z - 4, x + 31, baseY + 9, z - 3.5, C.redHot);
}

// ===================== BUSINESS =====================
export function placeBusinessCenter(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 32, 26);
  const floors = 4 + Math.floor(rng() * 4);
  const w = 20 + rng() * 10;
  const d = 16 + rng() * 8;
  makeBuilding(sink, {
    x, z, w, d, floors,
    baseY, color: pick(rng, [C.glass, C.glassDark, C.white, 0x8a98a8, 0x5a6870]),
    rng,
  });
  // Glass ribbon accents per floor
  for (let f = 1; f < floors; f++) {
    const y = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (f - 1) * BUILDINGS.FLOOR_HEIGHT + 1.2;
    neonStrip(sink, x - 0.08, y, z - 0.08, x + w + 0.08, y + 0.35, z + 0.08, C.glass);
  }
  // Plaza
  sink.addSpan(x - 4, baseY - 0.04, z - 8, x + w + 4, baseY + 0.05, z, C.concrete);
  for (let i = 0; i < 4; i++) {
    const px = x + 2 + i * (w / 4);
    sink.addSpan(px, baseY, z - 5.5, px + 2.2, baseY + 0.65, z - 3.2, C.sand);
    sink.addSpan(px + 0.4, baseY + 0.65, z - 5.1, px + 1.8, baseY + 2.4, z - 3.6, C.green);
    sink.addSpan(px + 0.7, baseY + 2.2, z - 4.7, px + 1.5, baseY + 3.3, z - 4.0, C.lime);
  }
  // Entry canopy
  sink.addSpan(x + w * 0.3, baseY + 3.2, z - 3.5, x + w * 0.7, baseY + 3.6, z + 0.2, C.metalLite);
  // Fountain
  sink.addSpan(x + w * 0.4, baseY, z - 7.5, x + w * 0.6, baseY + 0.4, z - 5.8, C.concrete);
  sink.addSpan(x + w * 0.45, baseY + 0.4, z - 7.1, x + w * 0.55, baseY + 1.3, z - 6.2, C.blueLite);
}

// ===================== SKYSCRAPER / SKYLINE =====================

/**
 * Lightweight exterior-only tower for dense skyline massing.
 * Floor bands + mullions + crown — no full interior (keeps draw cost sane).
 * floors: story count; taller = downtown financial core look.
 */
export function placeSkylineTower(sink, x, z, baseY, rng, floors = null) {
  const fCount = floors ?? (8 + Math.floor(rng() * 22)); // 8–29
  const floorH = 3.55;
  const h = fCount * floorH;
  const w = 11 + rng() * 16;
  const d = 11 + rng() * 14;
  const variant = Math.floor(rng() * 4);
  const col = pick(rng, [
    C.glass, C.glassDark, 0x4a5868, 0x2a3848, C.white, 0x6a8090, 0x3a4850, 0xc8d0d8,
  ]);
  const band = pick(rng, [C.glassDark, C.metal, 0x1a2830, C.white]);

  if (variant === 0) {
    // Glass slab
    sink.addSpan(x, baseY, z, x + w, baseY + h, z + d, col);
  } else if (variant === 1) {
    // Podium + shaft setback
    sink.addSpan(x - 2, baseY, z - 2, x + w + 2, baseY + floorH * 3, z + d + 2, C.concrete);
    sink.addSpan(x + 1, baseY + floorH * 3, z + 1, x + w - 1, baseY + h, z + d - 1, col);
  } else if (variant === 2) {
    // Twin towers sharing podium
    sink.addSpan(x - 1, baseY, z - 1, x + w + 1, baseY + floorH * 2.5, z + d + 1, C.concrete);
    const mid = w * 0.48;
    sink.addSpan(x, baseY + floorH * 2.5, z, x + mid - 0.6, baseY + h, z + d, col);
    sink.addSpan(x + mid + 0.6, baseY + floorH * 2.5, z, x + w, baseY + h * 0.88, z + d * 0.92, band);
  } else {
    // Stepped crown massing
    sink.addSpan(x, baseY, z, x + w, baseY + h * 0.7, z + d, col);
    sink.addSpan(x + w * 0.12, baseY + h * 0.7, z + d * 0.12, x + w * 0.88, baseY + h * 0.9, z + d * 0.88, band);
    sink.addSpan(x + w * 0.25, baseY + h * 0.9, z + d * 0.25, x + w * 0.75, baseY + h, z + d * 0.75, col);
  }

  // Horizontal floor lines (every other floor for clarity at distance)
  for (let f = 2; f < fCount; f += 2) {
    const y = baseY + f * floorH;
    sink.addSpan(x - 0.06, y, z - 0.06, x + w + 0.06, y + 0.12, z + d + 0.06, band);
  }
  // Vertical mullion accents
  const mullions = 2 + Math.floor(rng() * 3);
  for (let i = 1; i <= mullions; i++) {
    const mx = x + (w * i) / (mullions + 1);
    sink.addSpan(mx - 0.12, baseY + 2, z - 0.08, mx + 0.12, baseY + h - 1, z + 0.08, C.metalLite);
    sink.addSpan(mx - 0.12, baseY + 2, z + d - 0.08, mx + 0.12, baseY + h - 1, z + d + 0.08, C.metalLite);
  }

  // Ground lobby glass
  sink.addSpan(x + w * 0.15, baseY + 0.2, z - 0.12, x + w * 0.85, baseY + 3.2, z + 0.15, C.glass);
  // Roof plant + antenna
  const roof = baseY + h;
  sink.addSpan(x + w * 0.2, roof, z + d * 0.2, x + w * 0.8, roof + 2.2, z + d * 0.8, C.metal);
  if (fCount >= 16) {
    post(sink, x + w / 2 - 0.3, roof + 2, z + d / 2 - 0.3, 12 + rng() * 14, 0.55, C.metalLite);
    neonStrip(sink, x + w / 2 - 0.5, roof + 14, z + d / 2 - 0.5, x + w / 2 + 0.5, roof + 16, z + d / 2 + 0.5, C.redHot);
  }
  return { w, d, h, floors: fCount };
}

export function placeSkyscraper(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 28, 26);
  // Mix: some enterable mid/high towers, many silhouette skyline towers
  if (rng() > 0.55) {
    placeSkylineTower(sink, x, z, baseY, rng, 12 + Math.floor(rng() * 16));
    return;
  }
  const variant = Math.floor(rng() * 3);
  const floors = 10 + Math.floor(rng() * 10); // 10–19
  let w = 14 + rng() * 6;
  let d = 14 + rng() * 6;
  const col = pick(rng, [C.glass, C.glassDark, 0x4a5860, C.white, 0x2a3840, 0x6a8090]);

  if (variant === 0) {
    makeBuilding(sink, { x, z, w, d, floors, baseY, color: col, rng });
  } else if (variant === 1) {
    makeBuilding(sink, { x, z, w: w + 6, d: d + 6, floors: 3, baseY, color: C.concrete, rng });
    makeBuilding(sink, {
      x: x + 3, z: z + 3, w, d, floors: floors - 2,
      baseY: baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + 2 * BUILDINGS.FLOOR_HEIGHT,
      color: col, rng,
    });
  } else {
    makeBuilding(sink, { x, z, w: w * 0.55, d, floors, baseY, color: col, rng });
    makeBuilding(sink, {
      x: x + w * 0.6, z, w: w * 0.45, d: d * 0.85,
      floors: floors - 2, baseY, color: pick(rng, [C.glassDark, C.white, col]), rng,
    });
  }

  const roof = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  sink.addSpan(x + w * 0.2, roof, z + d * 0.2, x + w * 0.8, roof + 2.5, z + d * 0.8, col);
  post(sink, x + w / 2 - 0.25, roof + 2.5, z + d / 2 - 0.25, 14 + rng() * 10, 0.5, C.metalLite);
  neonStrip(sink, x + w / 2 - 0.4, roof + 14, z + d / 2 - 0.4, x + w / 2 + 0.4, roof + 16, z + d / 2 + 0.4, C.redHot);
}

/**
 * Full downtown district from satellite reference: street grid + packed towers.
 * Matches SD downtown density vibe — numerous high-rises, not sparse midblocks.
 */
export function placeDowntownDistrict(sink, terrain, cx, cz, baseY, rng) {
  // Street grid roughly like the satellite (N–S avenues × E–W streets).
  // +X east, +Z south. Origin at district center.
  const cols = 7; // N–S blocks
  const rows = 6; // E–W blocks
  const streetW = 10;
  const blockW = 28;
  const blockD = 26;
  const stepX = blockW + streetW;
  const stepZ = blockD + streetW;
  const originX = cx - (cols * stepX - streetW) / 2;
  const originZ = cz - (rows * stepZ - streetW) / 2;

  // Asphalt street grid
  const gridX0 = originX - streetW;
  const gridZ0 = originZ - streetW;
  const gridX1 = originX + cols * stepX;
  const gridZ1 = originZ + rows * stepZ;
  sink.addSpan(gridX0, baseY - 0.08, gridZ0, gridX1, baseY + 0.02, gridZ1, C.asphalt);

  // Sidewalk pads under each block (lighter concrete)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = originX + c * stepX;
      const bz = originZ + r * stepZ;
      sink.addSpan(bx - 1.5, baseY - 0.02, bz - 1.5, bx + blockW + 1.5, baseY + 0.06, bz + blockD + 1.5, C.concrete);
    }
  }

  // Yellow center lines on main streets
  for (let c = 0; c <= cols; c++) {
    const sx = originX + c * stepX - streetW / 2;
    neonStrip(sink, sx - 0.2, baseY + 0.03, gridZ0, sx + 0.2, baseY + 0.08, gridZ1, C.yellowHot);
  }
  for (let r = 0; r <= rows; r++) {
    const sz = originZ + r * stepZ - streetW / 2;
    neonStrip(sink, gridX0, baseY + 0.03, sz - 0.2, gridX1, baseY + 0.08, sz + 0.2, C.yellowHot);
  }

  let towers = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = originX + c * stepX;
      const bz = originZ + r * stepZ;

      // Waterfront south (high z) + core center = tallest
      const distCore = Math.hypot(c - cols * 0.45, r - rows * 0.4);
      const waterfront = r >= rows - 2;
      const financial = distCore < 2.2;

      // 1–3 towers per block (satellite is packed)
      const perBlock = financial ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2);

      for (let t = 0; t < perBlock; t++) {
        const ox = 1.5 + (t % 2) * (blockW * 0.42) + rng() * 2;
        const oz = 1.5 + Math.floor(t / 2) * (blockD * 0.4) + rng() * 2;
        const tw = Math.min(blockW * 0.42, 10 + rng() * 12);
        const td = Math.min(blockD * 0.42, 10 + rng() * 11);

        let floors;
        if (financial && rng() > 0.25) {
          floors = 18 + Math.floor(rng() * 14); // 18–31 super tall
        } else if (waterfront && rng() > 0.35) {
          floors = 14 + Math.floor(rng() * 10); // hotel towers
        } else if (rng() > 0.4) {
          floors = 10 + Math.floor(rng() * 10); // high-rise
        } else {
          floors = 5 + Math.floor(rng() * 6); // mid-rise fill
        }

        // A few enterable mid towers for gameplay; rest are silhouette skyline
        if (floors <= 8 && rng() > 0.5) {
          makeBuilding(sink, {
            x: bx + ox, z: bz + oz, w: tw, d: td, floors,
            baseY, color: pick(rng, [C.glass, C.white, C.cream, C.brick, C.gray]),
            rng,
          });
        } else {
          placeSkylineTower(sink, bx + ox, bz + oz, baseY, rng, floors);
        }
        towers++;
      }

      // Street furniture: lights on corners
      post(sink, bx - 2, baseY, bz - 2, 5.5, 0.2, C.metal);
      neonStrip(sink, bx - 2.4, baseY + 5.2, bz - 2.4, bx - 1.4, baseY + 5.5, bz - 1.4, C.yellowHot);
    }
  }

  // Harbor hotels strip on south edge (like marina / Hyatt row)
  for (let i = 0; i < 5; i++) {
    const hx = originX + 10 + i * 32;
    const hz = originZ + rows * stepZ + 8;
    placeSkylineTower(sink, hx, hz, baseY, rng, 12 + Math.floor(rng() * 8));
    towers++;
  }

  // Parking garage (flat multi-level) east of core — satellite has big plates
  {
    const gx = originX + cols * stepX + 5;
    const gz = originZ + stepZ;
    for (let lvl = 0; lvl < 5; lvl++) {
      const y = baseY + lvl * 3.2;
      sink.addSpan(gx, y, gz, gx + 36, y + 0.4, gz + 40, C.concrete);
      post(sink, gx + 2, baseY, gz + 2, 5 * 3.2, 0.8, C.concrete);
      post(sink, gx + 32, baseY, gz + 2, 5 * 3.2, 0.8, C.concrete);
      post(sink, gx + 2, baseY, gz + 36, 5 * 3.2, 0.8, C.concrete);
      post(sink, gx + 32, baseY, gz + 36, 5 * 3.2, 0.8, C.concrete);
    }
  }

  return { towers, cols, rows };
}

// ===================== BOAT / HARBOR =====================
export function placeBoatHouse(sink, terrain, x, z, rng) {
  const baseY = Math.max(0.5, groundY(terrain, x, z, 16, 12));
  makeShed(sink, { x, z, w: 14, d: 10, h: 4.5, baseY, color: C.wood, doorW: 5 });
  neonStrip(sink, x, baseY + 3.8, z - 0.1, x + 14, baseY + 4.3, z + 0.15, C.teal);
  const pierLen = 22 + rng() * 14;
  sink.addSpan(x - pierLen, Math.max(0.35, baseY - 0.15), z + 1.5, x, Math.max(0.65, baseY + 0.2), z + 8.5, C.wood);
  neonStrip(sink, x - pierLen, baseY + 0.15, z + 1.4, x, baseY + 0.35, z + 1.7, C.woodDark);
  for (let i = 0; i < 7; i++) {
    const px = x - 2 - i * 3.5;
    post(sink, px, -3, z + 1.8, baseY + 3.2, 0.45, C.dark);
    post(sink, px, -3, z + 7.2, baseY + 3.2, 0.45, C.dark);
  }
  // Tied boat
  sink.addSpan(x - pierLen + 4, 0.2, z + 9, x - pierLen + 11, 1.1, z + 12.5, pick(rng, [C.white, C.blueLite, C.red]));
  sink.addSpan(x - pierLen + 5, 1.0, z + 9.5, x - pierLen + 9, 1.8, z + 11.8, C.glassDark);
}

export function placeHarborPier(sink, terrain, x, z, rng) {
  const baseY = Math.max(0.55, groundY(terrain, x, z, 50, 16));
  const len = 55;
  const width = 14;
  sink.addSpan(x, baseY, z, x + len, baseY + 0.45, z + width, C.wood);
  // Edge curbs
  neonStrip(sink, x, baseY + 0.45, z, x + len, baseY + 0.7, z + 0.4, C.woodDark);
  neonStrip(sink, x, baseY + 0.45, z + width - 0.4, x + len, baseY + 0.7, z + width, C.woodDark);
  for (let i = 0; i < 12; i++) {
    const px = x + 2 + i * 4.5;
    post(sink, px, -4, z + 0.8, baseY + 4.5, 0.5, C.dark);
    post(sink, px, -4, z + width - 1.4, baseY + 4.5, 0.5, C.dark);
  }
  // Containers stacked
  for (let i = 0; i < 8; i++) {
    const cx = x + 3 + (i % 4) * 7;
    const cz = z + 2 + Math.floor(i / 4) * 5;
    const stacks = 1 + Math.floor(rng() * 3);
    const col = pick(rng, [C.blue, C.orange, C.teal, C.red, C.yellow, C.green]);
    for (let s = 0; s < stacks; s++) {
      sink.addSpan(cx, baseY + 0.45 + s * 2.6, cz, cx + 6.1, baseY + 0.45 + (s + 1) * 2.6, cz + 2.5, col);
    }
  }
  // Crane
  post(sink, x + 30, baseY, z + 5, 18, 0.8, C.yellowHot);
  sink.addSpan(x + 30, baseY + 17, z + 2, x + 48, baseY + 18, z + 10, C.yellow);
  post(sink, x + 46, baseY + 8, z + 5.5, 10, 0.3, C.metal);
  // Warehouse
  makeShed(sink, {
    x: x + len - 4, z: z - 4, w: 20, d: 18, h: 9,
    baseY: groundY(terrain, x + len, z, 20, 18),
    color: C.metal, doorW: 7,
  });
  placeTruck(sink, x + len - 10, z + width + 2, baseY, rng);
}

// ===================== BRIDGE =====================
export function placeBridge(sink, terrain, x0, z0, x1, z1, deckY, width = 14) {
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  const minZ = Math.min(z0, z1), maxZ = Math.max(z0, z1);
  const alongX = (maxX - minX) >= (maxZ - minZ);

  if (alongX) {
    const zc = (minZ + maxZ) / 2;
    // Deck + shoulders
    sink.addSpan(minX, deckY, zc - width / 2, maxX, deckY + 0.6, zc + width / 2, C.asphalt);
    neonStrip(sink, minX, deckY + 0.58, zc - 0.15, maxX, deckY + 0.72, zc + 0.15, C.yellowHot);
    // Rails + cables aesthetic
    sink.addSpan(minX, deckY + 0.6, zc - width / 2, maxX, deckY + 1.7, zc - width / 2 + 0.35, C.metalLite, 'thin');
    sink.addSpan(minX, deckY + 0.6, zc + width / 2 - 0.35, maxX, deckY + 1.7, zc + width / 2, C.metalLite, 'thin');
    const span = maxX - minX;
    const n = Math.max(3, Math.floor(span / 28));
    for (let i = 0; i <= n; i++) {
      const px = minX + (span * i) / n;
      // Pier
      sink.addSpan(px - 1.6, -5, zc - 2.5, px + 1.6, deckY, zc + 2.5, C.concrete);
      // Arch cable posts
      post(sink, px - 0.2, deckY, zc - width / 2 + 0.2, 8 + Math.sin(i) * 2, 0.4, C.metalLite);
      post(sink, px - 0.2, deckY, zc + width / 2 - 0.6, 8 + Math.sin(i) * 2, 0.4, C.metalLite);
    }
    // Light poles
    for (let i = 0; i < n; i += 2) {
      const px = minX + (span * i) / n;
      neonStrip(sink, px - 0.3, deckY + 7, zc - width / 2, px + 0.5, deckY + 7.5, zc - width / 2 + 0.8, C.yellowHot);
    }
  } else {
    const xc = (minX + maxX) / 2;
    sink.addSpan(xc - width / 2, deckY, minZ, xc + width / 2, deckY + 0.6, maxZ, C.asphalt);
    neonStrip(sink, xc - 0.15, deckY + 0.58, minZ, xc + 0.15, deckY + 0.72, maxZ, C.yellowHot);
    sink.addSpan(xc - width / 2, deckY + 0.6, minZ, xc - width / 2 + 0.35, deckY + 1.7, maxZ, C.metalLite, 'thin');
    sink.addSpan(xc + width / 2 - 0.35, deckY + 0.6, minZ, xc + width / 2, deckY + 1.7, maxZ, C.metalLite, 'thin');
    const span = maxZ - minZ;
    const n = Math.max(3, Math.floor(span / 28));
    for (let i = 0; i <= n; i++) {
      const pz = minZ + (span * i) / n;
      sink.addSpan(xc - 2.5, -5, pz - 1.6, xc + 2.5, deckY, pz + 1.6, C.concrete);
      post(sink, xc - width / 2 + 0.2, deckY, pz - 0.2, 8, 0.4, C.metalLite);
      post(sink, xc + width / 2 - 0.6, deckY, pz - 0.2, 8, 0.4, C.metalLite);
    }
  }
}

// ===================== ANIMALS =====================
export function placeAnimal(sink, x, z, baseY, rng, kind = null) {
  const types = {
    large: {
      body: [3.2, 1.8, 1.4], head: [1.0, 0.9, 0.9], leg: 0.9,
      color: [0x8a6040, 0xc4a060, 0x5a3a20, 0xd0b080],
      accent: 0x3a2810,
    },
    tall: {
      body: [1.5, 3.2, 1.1], head: [0.8, 0.7, 1.1], leg: 1.6,
      color: [0xe0c070, 0xc4a050],
      accent: 0x8a7030,
    },
    bulk: {
      body: [3.6, 2.1, 1.8], head: [1.2, 1.0, 1.0], leg: 0.7,
      color: [0x6a6a6a, 0x3a3a3a, 0x8a8a8a],
      accent: 0x1a1a1a,
    },
    small: {
      body: [1.4, 0.9, 0.8], head: [0.5, 0.45, 0.5], leg: 0.35,
      color: [0xc08040, 0xf0d0a0, 0x4a3020, 0xe8e0d0],
      accent: 0x2a1a10,
    },
    bird: {
      body: [0.9, 0.7, 0.55], head: [0.4, 0.4, 0.4], leg: 0.5,
      color: [0xf0f0f0, 0x2a6a9a, 0xe04020, 0x40c040],
      accent: 0xffd040,
    },
    long: {
      body: [4.0, 1.2, 1.0], head: [0.9, 0.7, 0.7], leg: 0.55,
      color: [0x3a8a4a, 0x2a5a30],
      accent: 0x1a3018,
    },
  };
  const keys = Object.keys(types);
  const t = types[kind] || types[pick(rng, keys)];
  const col = pick(rng, t.color);
  const [bw, bh, bd] = t.body;
  const [hw, hh, hd] = t.head;
  // Legs
  for (const [lx, lz] of [[0.2, 0.2], [bw - 0.45, 0.2], [0.2, bd - 0.45], [bw - 0.45, bd - 0.45]]) {
    sink.addSpan(x + lx, baseY, z + lz, x + lx + 0.28, baseY + t.leg, z + lz + 0.28, t.accent);
  }
  // Body
  sink.addSpan(x, baseY + t.leg * 0.7, z, x + bw, baseY + t.leg * 0.7 + bh, z + bd, col);
  // Head
  sink.addSpan(
    x + bw - hw * 0.15, baseY + t.leg * 0.7 + bh * 0.55, z + bd * 0.15,
    x + bw + hw * 0.75, baseY + t.leg * 0.7 + bh * 0.55 + hh, z + bd * 0.15 + hd,
    col
  );
  // Snout / beak
  sink.addSpan(
    x + bw + hw * 0.55, baseY + t.leg * 0.7 + bh * 0.6, z + bd * 0.25,
    x + bw + hw * 1.1, baseY + t.leg * 0.7 + bh * 0.6 + hh * 0.4, z + bd * 0.25 + hd * 0.5,
    t.accent
  );
  // Ears / horns for large
  if (kind === 'large' || kind === 'tall') {
    post(sink, x + bw + 0.1, baseY + t.leg * 0.7 + bh * 0.9, z + bd * 0.2, 0.6, 0.15, t.accent);
    post(sink, x + bw + 0.1, baseY + t.leg * 0.7 + bh * 0.9, z + bd * 0.55, 0.6, 0.15, t.accent);
  }
  // Wing stubs for birds
  if (kind === 'bird') {
    sink.addSpan(x - 0.5, baseY + t.leg * 0.7 + 0.2, z + 0.1, x + 0.2, baseY + t.leg * 0.7 + 0.5, z + bd - 0.1, col);
    sink.addSpan(x + bw - 0.2, baseY + t.leg * 0.7 + 0.2, z + 0.1, x + bw + 0.5, baseY + t.leg * 0.7 + 0.5, z + bd - 0.1, col);
  }
}

// ===================== BILLBOARD =====================
export function placeBillboard(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z);
  const h = 9 + rng() * 4;
  post(sink, x, baseY, z, h, 0.55, C.metal);
  post(sink, x + 0.1, baseY, z + 3.5, h, 0.55, C.metal);
  const col = pick(rng, [C.redHot, C.blue, C.yellowHot, C.teal, C.neonPink, C.orange, C.neonLime]);
  sink.addSpan(x - 3.5, baseY + h - 0.3, z - 0.3, x + 4.2, baseY + h + 3.2, z + 4.2, col);
  neonStrip(sink, x - 3.4, baseY + h + 2.8, z - 0.2, x + 4.1, baseY + h + 3.15, z + 4.1, C.neonCyan);
  // Catwalk
  sink.addSpan(x - 1, baseY + h - 0.5, z + 0.5, x + 2, baseY + h - 0.2, z + 3.2, C.metalLite);
}
