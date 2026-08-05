import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed, slab } from '../BuildingKit.js';
import { Occupancy } from '../Occupancy.js';

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
  // Dense sample under footprint so towers don't hover on sloped lots
  let m = terrain.heightAt(x, z);
  if (w || d) {
    const samples = [
      [0, 0], [1, 0], [0, 1], [1, 1],
      [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5], [0.5, 0.5],
      [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75],
    ];
    for (const [u, v] of samples) {
      m = Math.max(m, terrain.heightAt(x + w * u, z + d * v));
    }
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
  const baseY = groundY(terrain, x, z, 32, 26) - 0.06;
  const floors = 4 + Math.floor(rng() * 4);
  const w = 20 + rng() * 10;
  const d = 16 + rng() * 8;
  makeBuilding(sink, {
    x, z, w, d, floors,
    baseY, color: pick(rng, [C.glass, C.glassDark, C.white, 0x8a98a8, 0x5a6870]),
    rng,
  });
  addBuildingAccess(sink, x, z, w, d, baseY, floors, BUILDINGS.FLOOR_HEIGHT, rng);
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
  // Fountain
  sink.addSpan(x + w * 0.4, baseY, z - 7.5, x + w * 0.6, baseY + 0.4, z - 5.8, C.concrete);
  sink.addSpan(x + w * 0.45, baseY + 0.4, z - 7.1, x + w * 0.55, baseY + 1.3, z - 6.2, C.blueLite);
}

// ===================== SKYSCRAPER / SKYLINE =====================

/** Switchback fire-escape staircase on +X face. */
function addFireEscapeStairs(sink, x, z, w, d, baseY, floors, floorH) {
  const sx = x + w + 0.2;
  const landW = 2.5;
  const landD = 3.0;
  for (let f = 0; f < floors; f++) {
    const y = baseY + f * floorH;
    const zLand = f % 2 === 0 ? z + 0.5 : z + d - landD - 0.5;
    sink.addSpan(sx, y, zLand, sx + landW, y + 0.18, zLand + landD, C.metalLite);
    sink.addSpan(sx + landW - 0.1, y + 0.18, zLand, sx + landW, y + 1.05, zLand + landD, C.metal, 'thin');
    if (f < floors - 1) {
      const steps = 9;
      const rise = floorH / steps;
      const z0 = zLand + (f % 2 === 0 ? landD - 0.3 : 0.3);
      const dir = f % 2 === 0 ? -1 : 1;
      const run = (landD - 0.5) / steps;
      for (let k = 0; k < steps; k++) {
        const zy = z0 + dir * k * run - (dir < 0 ? run : 0);
        const top = y + (k + 1) * rise;
        sink.addSpan(sx + 0.2, top - 0.32, zy, sx + landW - 0.25, top, zy + Math.abs(run) * 0.9, C.metal);
      }
    }
  }
  sink.addSpan(sx - 0.4, baseY - 0.05, z + 0.3, sx + landW + 0.2, baseY + 0.1, z + 3.2, C.concrete);
}

/** Vertical ladder with cage rings — mid-rise buildings. */
function addLadder(sink, x, z, w, d, baseY, floors, floorH) {
  const lx = x + w + 0.35;
  const lz = z + d * 0.45;
  const h = floors * floorH;
  // Rails
  post(sink, lx, baseY, lz, h, 0.12, C.metal);
  post(sink, lx + 0.55, baseY, lz, h, 0.12, C.metal);
  // Rungs every 0.35m
  for (let y = baseY + 0.4; y < baseY + h; y += 0.35) {
    sink.addSpan(lx, y, lz, lx + 0.55, y + 0.08, lz + 0.12, C.metalLite);
  }
  // Cage hoops every floor
  for (let f = 1; f < floors; f++) {
    const y = baseY + f * floorH;
    sink.addSpan(lx - 0.15, y, lz - 0.15, lx + 0.7, y + 0.1, lz + 0.35, C.metal, 'thin');
  }
  // Roof hatch platform
  sink.addSpan(lx - 0.3, baseY + h - 0.1, lz - 0.4, lx + 0.9, baseY + h + 0.15, lz + 0.6, C.metalLite);
}

/** Wide open staircase (stadium/public style) on -Z face. */
function addOpenStaircase(sink, x, z, w, d, baseY, floors, floorH) {
  const maxF = Math.min(floors, 8); // open stairs only climb partway for massing variety
  const stairW = Math.min(w * 0.55, 8);
  const sx = x + (w - stairW) / 2;
  for (let f = 0; f < maxF; f++) {
    const y = baseY + f * floorH;
    const steps = 8;
    const rise = floorH / steps;
    const run = 0.38;
    for (let k = 0; k < steps; k++) {
      const top = y + (k + 1) * rise;
      const zz = z - 0.2 - (f * steps + k) * run;
      sink.addSpan(sx, top - rise * 0.85, zz, sx + stairW, top, zz + run, C.concrete);
    }
    // Landing every floor
    const landZ = z - 0.2 - (f + 1) * steps * run;
    sink.addSpan(sx - 0.3, y + floorH, landZ - 1.8, sx + stairW + 0.3, y + floorH + 0.18, landZ, C.concrete);
  }
}

/**
 * Visible elevator bank: glass shaft, doors each floor, car, call panel.
 * Cut into the south face so the lobby is obviously an entrance.
 */
function addElevatorBank(sink, x, z, w, d, baseY, floors, floorH) {
  const ew = 2.8;
  const ed = 2.6;
  const ex = x + w * 0.5 - ew / 2;
  const ez = z + 0.15; // south face
  const totalH = floors * floorH;

  // Glass shaft exterior
  sink.addSpan(ex, baseY, ez - 0.05, ex + 0.18, baseY + totalH, ez + ed, C.glass);
  sink.addSpan(ex + ew - 0.18, baseY, ez - 0.05, ex + ew, baseY + totalH, ez + ed, C.glass);
  sink.addSpan(ex, baseY, ez + ed - 0.18, ex + ew, baseY + totalH, ez + ed, C.metalLite);
  // Back of shaft into building
  sink.addSpan(ex + 0.15, baseY, ez + ed - 0.35, ex + ew - 0.15, baseY + totalH, ez + ed - 0.15, C.dark);

  for (let f = 0; f < floors; f++) {
    const y = baseY + f * floorH;
    // Landing plate
    sink.addSpan(ex + 0.2, y, ez + 0.2, ex + ew - 0.2, y + 0.16, ez + ed - 0.4, C.metalLite);
    // Door frame (open doorway)
    neonStrip(sink, ex + 0.25, y + 0.15, ez - 0.08, ex + ew - 0.25, y + 2.3, ez + 0.12, C.dark);
    // Indicator light (small, not a ground-level yellow smear)
    neonStrip(sink, ex + 0.3, y + 2.15, ez - 0.1, ex + ew - 0.3, y + 2.35, ez + 0.15, C.neonLime);
    // Call panel
    sink.addSpan(ex + ew + 0.05, y + 1.0, ez + 0.3, ex + ew + 0.2, y + 1.5, ez + 0.55, C.metal);
    neonStrip(sink, ex + ew + 0.08, y + 1.15, ez + 0.35, ex + ew + 0.18, y + 1.25, ez + 0.5, C.neonLime);
  }
  // Elevator car at mid height (visible)
  const carF = Math.min(2, floors - 1);
  const cy = baseY + carF * floorH + 0.2;
  sink.addSpan(ex + 0.35, cy, ez + 0.35, ex + ew - 0.35, cy + floorH - 0.5, ez + ed - 0.55, 0x3a6a9a);
  sink.addSpan(ex + 0.5, cy + 0.3, ez + 0.25, ex + ew - 0.5, cy + floorH - 0.8, ez + 0.4, C.glass);
  // Lobby canopy over entrance
  sink.addSpan(ex - 0.5, baseY + 2.9, ez - 1.8, ex + ew + 0.5, baseY + 3.25, ez + 0.3, C.metalLite);
  // Approach mat
  sink.addSpan(ex - 0.3, baseY - 0.02, ez - 2.2, ex + ew + 0.3, baseY + 0.1, ez + 0.1, C.dark);
}

/** South-face double door entrance portal (always). */
function addMainEntrance(sink, x, z, w, d, baseY) {
  const doorW = Math.min(3.2, w * 0.35);
  const dx = x + w * 0.5 - doorW / 2;
  // Recess
  sink.addSpan(dx - 0.15, baseY, z - 0.25, dx + doorW + 0.15, baseY + 3.0, z + 0.45, C.dark);
  // Door leaves
  sink.addSpan(dx, baseY + 0.1, z - 0.1, dx + doorW * 0.48, baseY + 2.7, z + 0.15, 0x2a3540);
  sink.addSpan(dx + doorW * 0.52, baseY + 0.1, z - 0.1, dx + doorW, baseY + 2.7, z + 0.15, 0x2a3540);
  // Glass panels on doors
  sink.addSpan(dx + 0.15, baseY + 0.9, z - 0.15, dx + doorW * 0.42, baseY + 2.4, z, C.glass);
  sink.addSpan(dx + doorW * 0.58, baseY + 0.9, z - 0.15, dx + doorW - 0.15, baseY + 2.4, z, C.glass);
  // Canopy
  sink.addSpan(dx - 0.8, baseY + 2.95, z - 2.0, dx + doorW + 0.8, baseY + 3.25, z + 0.4, C.metalLite);
  // Steps
  sink.addSpan(dx - 0.5, baseY - 0.05, z - 2.4, dx + doorW + 0.5, baseY + 0.12, z - 0.2, C.concrete);
  sink.addSpan(dx - 0.3, baseY + 0.12, z - 1.6, dx + doorW + 0.3, baseY + 0.28, z - 0.15, C.concrete);
}

/**
 * Attach entrances + varied exterior access to any multi-story massing.
 * accessMode: 0 fire escape, 1 ladder, 2 open stairs, -1 auto from rng.
 */
export function addBuildingAccess(sink, x, z, w, d, baseY, floors, floorH, rng, accessMode = -1) {
  addMainEntrance(sink, x, z, w, d, baseY);
  if (floors >= 3) {
    addElevatorBank(sink, x, z, w, d, baseY, floors, floorH);
  }
  const mode = accessMode >= 0 ? accessMode : Math.floor(rng() * 3);
  if (mode === 0) addFireEscapeStairs(sink, x, z, w, d, baseY, floors, floorH);
  else if (mode === 1) addLadder(sink, x, z, w, d, baseY, floors, floorH);
  else addOpenStaircase(sink, x, z, w, d, baseY, Math.min(floors, 10), floorH);
}

/**
 * Lightweight exterior tower + climbable access + elevator shaft.
 * floors: story count; taller = downtown financial core look.
 * Seated slightly into terrain so nothing floats.
 */
export function placeSkylineTower(sink, x, z, baseY, rng, floors = null) {
  const fCount = Math.min(24, floors ?? (8 + Math.floor(rng() * 16))); // 8–24
  const floorH = 3.5;
  const h = fCount * floorH;
  const w = 12 + rng() * 10;
  const d = 12 + rng() * 10;
  const variant = Math.floor(rng() * 4);
  const col = pick(rng, [
    C.glass, C.glassDark, 0x4a5868, 0x2a3848, C.white, 0x6a8090, 0x3a4850, 0xc8d0d8,
  ]);
  const band = pick(rng, [C.glassDark, C.metal, 0x1a2830, C.white]);

  // Sink into terrain so no hover gap
  const seat = baseY - 0.08;
  const bodyW = w;

  if (variant === 0) {
    sink.addSpan(x, seat, z, x + bodyW, seat + h, z + d, col);
  } else if (variant === 1) {
    sink.addSpan(x - 1.2, seat, z - 1.2, x + bodyW + 1.2, seat + floorH * 3, z + d + 1.2, C.concrete);
    sink.addSpan(x + 0.6, seat + floorH * 3, z + 0.6, x + bodyW - 0.6, seat + h, z + d - 0.6, col);
  } else if (variant === 2) {
    sink.addSpan(x - 0.8, seat, z - 0.8, x + bodyW + 0.8, seat + floorH * 2.5, z + d + 0.8, C.concrete);
    const mid = bodyW * 0.48;
    sink.addSpan(x, seat + floorH * 2.5, z, x + mid - 0.5, seat + h, z + d, col);
    sink.addSpan(x + mid + 0.5, seat + floorH * 2.5, z, x + bodyW, seat + h * 0.9, z + d * 0.92, band);
  } else {
    sink.addSpan(x, seat, z, x + bodyW, seat + h * 0.72, z + d, col);
    sink.addSpan(x + bodyW * 0.12, seat + h * 0.72, z + d * 0.12, x + bodyW * 0.88, seat + h * 0.92, z + d * 0.88, band);
    sink.addSpan(x + bodyW * 0.22, seat + h * 0.92, z + d * 0.22, x + bodyW * 0.78, seat + h, z + d * 0.78, col);
  }

  // Ground slab + interior floors (single pass)
  sink.addSpan(x + 0.15, seat + 0.02, z + 0.15, x + bodyW - 0.15, seat + 0.18, z + d - 0.15, C.concrete);
  for (let f = 1; f < fCount; f++) {
    const y = seat + f * floorH;
    sink.addSpan(x + 0.3, y, z + 0.3, x + bodyW - 0.3, y + 0.16, z + d - 0.3, C.concrete);
  }
  // Spandrel bands
  for (let f = 2; f < fCount; f += 2) {
    const y = seat + f * floorH;
    sink.addSpan(x - 0.04, y, z - 0.04, x + bodyW + 0.04, y + 0.1, z + d + 0.04, band);
  }

  addBuildingAccess(sink, x, z, bodyW, d, seat, fCount, floorH, rng);

  const roof = seat + h;
  sink.addSpan(x + bodyW * 0.15, roof, z + d * 0.15, x + bodyW * 0.85, roof + 0.25, z + d * 0.85, C.concrete);
  sink.addSpan(x + bodyW * 0.25, roof + 0.25, z + d * 0.25, x + bodyW * 0.75, roof + 2.0, z + d * 0.75, C.metal);
  if (fCount >= 14) {
    post(sink, x + bodyW / 2 - 0.25, roof + 2, z + d / 2 - 0.25, 10 + rng() * 12, 0.5, C.metalLite);
    neonStrip(sink, x + bodyW / 2 - 0.4, roof + 12, z + d / 2 - 0.4, x + bodyW / 2 + 0.4, roof + 14, z + d / 2 + 0.4, C.redHot);
  }
  return { w: bodyW + 2.8, d: d + 1, h, floors: fCount, x, z };
}

export function placeSkyscraper(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 28, 26);
  // Mix: some enterable mid/high towers, many silhouette skyline towers
  if (rng() > 0.45) {
    placeSkylineTower(sink, x, z, baseY, rng, 12 + Math.floor(rng() * 16));
    return;
  }
  const variant = Math.floor(rng() * 3);
  const floors = 10 + Math.floor(rng() * 10); // 10–19
  let w = 14 + rng() * 6;
  let d = 14 + rng() * 6;
  const col = pick(rng, [C.glass, C.glassDark, 0x4a5860, C.white, 0x2a3840, 0x6a8090]);
  const seat = baseY - 0.06;

  if (variant === 0) {
    makeBuilding(sink, { x, z, w, d, floors, baseY: seat, color: col, rng });
    addBuildingAccess(sink, x, z, w, d, seat, floors, BUILDINGS.FLOOR_HEIGHT, rng);
  } else if (variant === 1) {
    makeBuilding(sink, { x, z, w: w + 6, d: d + 6, floors: 3, baseY: seat, color: C.concrete, rng });
    makeBuilding(sink, {
      x: x + 3, z: z + 3, w, d, floors: floors - 2,
      baseY: seat + BUILDINGS.GROUND_FLOOR_HEIGHT + 2 * BUILDINGS.FLOOR_HEIGHT,
      color: col, rng,
    });
    addBuildingAccess(sink, x, z, w + 6, d + 6, seat, floors, BUILDINGS.FLOOR_HEIGHT, rng);
  } else {
    makeBuilding(sink, { x, z, w: w * 0.55, d, floors, baseY: seat, color: col, rng });
    makeBuilding(sink, {
      x: x + w * 0.6, z, w: w * 0.45, d: d * 0.85,
      floors: floors - 2, baseY: seat, color: pick(rng, [C.glassDark, C.white, col]), rng,
    });
    addBuildingAccess(sink, x, z, w, d, seat, floors, BUILDINGS.FLOOR_HEIGHT, rng);
  }

  const roof = seat + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  sink.addSpan(x + w * 0.2, roof, z + d * 0.2, x + w * 0.8, roof + 2.5, z + d * 0.8, col);
  post(sink, x + w / 2 - 0.25, roof + 2.5, z + d / 2 - 0.25, 14 + rng() * 10, 0.5, C.metalLite);
  neonStrip(sink, x + w / 2 - 0.4, roof + 14, z + d / 2 - 0.4, x + w / 2 + 0.4, roof + 16, z + d / 2 + 0.4, C.redHot);
}

/**
 * Full downtown district from satellite reference: packed towers on a heightfield street grid.
 * Streets are painted in Terrain via buildDowntownGridLines — no box asphalt or yellow paint.
 */
export function placeDowntownDistrict(sink, terrain, cx, cz, _unusedBaseY, rng, occ = null) {
  const grid = occ || new Occupancy(12);
  // Keep in sync with Roads.downtownGridParams
  const cols = 6;
  const rows = 5;
  const streetW = 12;
  const blockW = 32;
  const blockD = 30;
  const stepX = blockW + streetW;
  const stepZ = blockD + streetW;
  const originX = cx - (cols * stepX - streetW) / 2;
  const originZ = cz - (rows * stepZ - streetW) / 2;
  const gy = (x, z, w = 0, d = 0) => groundY(terrain, x, z, w, d);
  const MIN_DRY = 2.8;

  // A couple of mid-grid surface lots (open asphalt + cars from parking props)
  const parkingBlocks = new Set(['0,0', '5,4']);

  let towers = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = originX + c * stepX;
      const bz = originZ + r * stepZ;
      const blockBase = gy(bx + blockW / 2, bz + blockD / 2);
      if (blockBase < MIN_DRY) continue;

      // Streetlight at NE corner (cool white — not yellow ground paint)
      post(sink, bx - 1.2, blockBase, bz - 1.2, 5.4, 0.16, C.metal);
      sink.addSpan(bx - 1.45, blockBase + 5.15, bz - 1.45, bx - 0.85, blockBase + 5.4, bz - 0.85, 0xf0f4f8);

      if (parkingBlocks.has(`${c},${r}`)) {
        // Open surface lot inside the block
        const lotX = bx + 3;
        const lotZ = bz + 3;
        const lotW = blockW - 6;
        const lotD = blockD - 6;
        // Claim so nothing stacks; asphalt already from heightfield if stamped,
        // otherwise light curb outline only
        grid.tryClaim(lotX, lotZ, lotW, lotD, 1);
        for (let i = 0; i < 5; i++) {
          if (rng() > 0.4) {
            placeVehicle(sink, lotX + 2 + (i % 3) * 6, lotZ + 3 + Math.floor(i / 3) * 10, blockBase, rng);
          }
        }
        continue;
      }

      const distCore = Math.hypot(c - cols * 0.45, r - rows * 0.4);
      const waterfront = r >= rows - 2;
      const financial = distCore < 2.0;

      // One tower per block, inset from street corridor
      const margin = 5;
      const maxW = blockW - margin * 2;
      const maxD = blockD - margin * 2;
      const tw = Math.min(maxW, 12 + rng() * 10);
      const td = Math.min(maxD, 12 + rng() * 10);
      const ox = margin + rng() * Math.max(0.5, maxW - tw);
      const oz = margin + rng() * Math.max(0.5, maxD - td);
      const tx = bx + ox;
      const tz = bz + oz;
      // Claim full block footprint so nothing else stacks here
      if (!grid.tryClaim(tx - 1, tz - 1, tw + 4, td + 3, 1.5)) continue;
      const baseY = gy(tx, tz, tw, td);
      if (baseY < MIN_DRY) continue;

      let floors;
      if (financial && rng() > 0.2) floors = 16 + Math.floor(rng() * 10);
      else if (waterfront && rng() > 0.3) floors = 12 + Math.floor(rng() * 8);
      else if (rng() > 0.45) floors = 9 + Math.floor(rng() * 8);
      else floors = 5 + Math.floor(rng() * 5);

      if (floors <= 7) {
        const seat = baseY - 0.06;
        makeBuilding(sink, {
          x: tx, z: tz, w: tw, d: td, floors,
          baseY: seat,
          color: pick(rng, [C.glass, C.white, C.cream, C.brick, C.gray]),
          rng,
        });
        addBuildingAccess(sink, tx, tz, tw, td, seat, floors, BUILDINGS.FLOOR_HEIGHT, rng);
      } else {
        placeSkylineTower(sink, tx, tz, baseY, rng, floors);
      }
      towers++;
    }
  }

  // Waterfront hotels (south) — spaced, occupancy checked
  for (let i = 0; i < 4; i++) {
    const hx = originX + 18 + i * 42;
    const hz = originZ + rows * stepZ + 12;
    const tw = 16;
    const td = 14;
    if (!grid.tryClaim(hx, hz, tw + 3, td + 1, 3)) continue;
    const by = gy(hx, hz, tw, td);
    if (by < MIN_DRY) continue;
    placeSkylineTower(sink, hx, hz, by, rng, 12 + Math.floor(rng() * 6));
    towers++;
  }

  return { towers, cols, rows, occ: grid };
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
    // Deck + shoulders (elevated bridge only — not ground road squares)
    sink.addSpan(minX, deckY, zc - width / 2, maxX, deckY + 0.6, zc + width / 2, C.asphalt);
    // Rails
    sink.addSpan(minX, deckY + 0.6, zc - width / 2, maxX, deckY + 1.7, zc - width / 2 + 0.35, C.metalLite, 'thin');
    sink.addSpan(minX, deckY + 0.6, zc + width / 2 - 0.35, maxX, deckY + 1.7, zc + width / 2, C.metalLite, 'thin');
    const span = maxX - minX;
    const n = Math.max(3, Math.floor(span / 28));
    for (let i = 0; i <= n; i++) {
      const px = minX + (span * i) / n;
      sink.addSpan(px - 1.6, -5, zc - 2.5, px + 1.6, deckY, zc + 2.5, C.concrete);
      post(sink, px - 0.2, deckY, zc - width / 2 + 0.2, 8 + Math.sin(i) * 2, 0.4, C.metalLite);
      post(sink, px - 0.2, deckY, zc + width / 2 - 0.6, 8 + Math.sin(i) * 2, 0.4, C.metalLite);
    }
  } else {
    const xc = (minX + maxX) / 2;
    sink.addSpan(xc - width / 2, deckY, minZ, xc + width / 2, deckY + 0.6, maxZ, C.asphalt);
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
