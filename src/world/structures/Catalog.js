import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed, slab } from '../BuildingKit.js';

// Procedural landmark buildings from box primitives. No external assets.
// Colors are original (no trademarked brand palettes).

const C = {
  white: 0xe8e6e0,
  cream: 0xd4cfc4,
  brick: 0x8a4a3c,
  red: 0xb03a2e,
  yellow: 0xd4a017,
  blue: 0x3a6b8a,
  teal: 0x2a7a6e,
  green: 0x4a7a3c,
  orange: 0xc46a2a,
  gray: 0x8a8880,
  dark: 0x4a4844,
  metal: 0x6e6c68,
  asphalt: 0x3a3b3e,
  glass: 0x8fa0a8,
  wood: 0x8e7a5a,
  sand: 0xc2b49a,
};

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function groundY(terrain, x, z, w = 0, d = 0) {
  let m = terrain.heightAt(x, z);
  if (w || d) {
    m = Math.max(
      m,
      terrain.heightAt(x + w, z),
      terrain.heightAt(x, z + d),
      terrain.heightAt(x + w, z + d),
      terrain.heightAt(x + w / 2, z + d / 2)
    );
  }
  return m;
}

// --- Vehicles (abstract) ---
export function placeVehicle(sink, x, z, baseY, rng, color = null) {
  const col = color ?? pick(rng, [0x5c6166, 0x3a4a6a, 0x6a3a3a, 0x3a5a3a, 0x8a7a3a]);
  const L = 4.6 + rng() * 0.8;
  const W = 1.85;
  const H = 1.45 + rng() * 0.35;
  sink.addSpan(x, baseY, z, x + L, baseY + H * 0.55, z + W, col);
  sink.addSpan(x + L * 0.25, baseY + H * 0.5, z + 0.1, x + L * 0.75, baseY + H, z + W - 0.1, 0x2a3040);
}

// --- Suburban home ---
export function placeSuburbanHome(sink, terrain, x, z, rng) {
  const w = 10 + rng() * 4;
  const d = 9 + rng() * 3;
  const baseY = groundY(terrain, x, z, w, d);
  const floors = rng() > 0.55 ? 2 : 1;
  const color = pick(rng, [C.cream, C.white, C.brick, 0xb8a898, 0x9a968c]);
  makeBuilding(sink, { x, z, w, d, floors, baseY, color, rng });
  // Garage wing
  if (rng() > 0.4) {
    const gw = 5.5, gd = 6;
    makeShed(sink, {
      x: x + w + 0.5, z, w: gw, d: gd, h: 3.2,
      baseY: groundY(terrain, x + w + 0.5, z, gw, gd),
      color: C.gray, doorW: 3.8,
    });
  }
  // Fence bits
  if (rng() > 0.5) {
    for (let i = 0; i < 4; i++) {
      const fx = x - 1 + i * 3.5;
      sink.addSpan(fx, baseY, z + d + 2, fx + 3, baseY + 1.1, z + d + 2.15, C.wood, 'thin');
    }
  }
}

// --- Trailer ---
export function placeTrailer(sink, terrain, x, z, rng) {
  const w = 10 + rng() * 4;
  const d = 3.4;
  const baseY = groundY(terrain, x, z, w, d);
  const color = pick(rng, [C.cream, C.metal, 0xa09080, C.blue]);
  makeShed(sink, { x, z, w, d, h: 3.0, baseY, color, doorW: 1.3 });
  // Steps
  sink.addSpan(x + w / 2 - 0.7, baseY, z - 1.1, x + w / 2 + 0.7, baseY + 0.55, z, C.wood);
  // Propane / AC box
  sink.addSpan(x + w - 1.5, baseY + 2.2, z + d + 0.2, x + w - 0.4, baseY + 3.0, z + d + 1.0, C.metal);
}

// --- Gas station ---
export function placeGasStation(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 28, 22);
  // Canopy
  sink.addSpan(x, baseY + 4.2, z, x + 22, baseY + 4.6, z + 14, C.yellow);
  // Support posts
  for (const [px, pz] of [[2, 2], [20, 2], [2, 12], [20, 12]]) {
    sink.addSpan(x + px, baseY, z + pz, x + px + 0.4, baseY + 4.2, z + pz + 0.4, C.metal);
  }
  // Pumps
  for (let i = 0; i < 3; i++) {
    const px = x + 5 + i * 5.5;
    sink.addSpan(px, baseY, z + 5, px + 1.2, baseY + 1.6, z + 6.4, C.dark);
    sink.addSpan(px - 0.1, baseY + 1.6, z + 5.2, px + 1.3, baseY + 2.4, z + 6.2, C.red);
  }
  // Convenience store
  makeShed(sink, {
    x: x + 1, z: z + 15, w: 14, d: 8, h: 3.8,
    baseY, color: C.white, doorW: 2.4,
  });
  // Sign pole
  sink.addSpan(x - 2, baseY, z + 4, x - 1.5, baseY + 8, z + 4.5, C.metal);
  sink.addSpan(x - 3.5, baseY + 7, z + 3.5, x - 0.2, baseY + 9.2, z + 5.2, C.yellow);
}

// --- Fast food / restaurant ---
export function placeRestaurant(sink, terrain, x, z, rng, fast = true) {
  const baseY = groundY(terrain, x, z, 18, 14);
  const color = fast
    ? pick(rng, [C.red, C.orange, C.yellow, C.teal])
    : pick(rng, [C.brick, C.cream, C.dark]);
  makeBuilding(sink, {
    x, z, w: 14 + rng() * 4, d: 11 + rng() * 3,
    floors: fast ? 1 : 1 + (rng() > 0.6 ? 1 : 0),
    baseY, color, rng,
  });
  // Drive-thru canopy for fast food
  if (fast) {
    sink.addSpan(x + 14, baseY + 2.8, z + 2, x + 22, baseY + 3.2, z + 10, color);
    sink.addSpan(x + 21.5, baseY, z + 3, x + 22, baseY + 2.8, z + 3.4, C.metal);
  }
  // Patio tables (abstract)
  for (let i = 0; i < 3; i++) {
    const tx = x + 2 + i * 3.5;
    sink.addSpan(tx, baseY, z - 3, tx + 1.2, baseY + 0.85, z - 1.8, C.wood);
  }
}

// --- Auto repair shop ---
export function placeAutoRepair(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 20, 16);
  makeShed(sink, {
    x, z, w: 18, d: 14, h: 5.5,
    baseY, color: C.metal, doorW: 5.5,
  });
  // Lift / bay blocks
  sink.addSpan(x + 3, baseY, z + 4, x + 7, baseY + 0.4, z + 10, C.asphalt);
  sink.addSpan(x + 10, baseY, z + 4, x + 14, baseY + 0.4, z + 10, C.asphalt);
  // Tire stacks
  for (let i = 0; i < 4; i++) {
    sink.addSpan(x + 16, baseY + i * 0.45, z + 2, x + 17.4, baseY + (i + 1) * 0.45, z + 3.4, C.dark);
  }
  placeVehicle(sink, x + 2, z - 5, baseY, rng, C.dark);
}

// --- Fire station ---
export function placeFireStation(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 28, 20);
  // Apparatus bay
  makeShed(sink, {
    x, z, w: 22, d: 16, h: 6.5,
    baseY, color: C.white, doorW: 6,
  });
  // Red bay stripe
  sink.addSpan(x, baseY + 5.2, z - 0.05, x + 22, baseY + 5.8, z + 0.2, C.red);
  // Living / office wing
  makeBuilding(sink, {
    x: x + 23, z, w: 12, d: 14, floors: 2,
    baseY, color: C.brick, rng,
  });
  // Hose tower
  sink.addSpan(x + 18, baseY, z + 12, x + 21, baseY + 14, z + 15, C.red);
  // Engine (abstract)
  sink.addSpan(x + 4, baseY, z - 6, x + 12, baseY + 2.4, z - 3.2, C.red);
  sink.addSpan(x + 5, baseY + 2.2, z - 5.5, x + 10, baseY + 3.2, z - 3.6, C.dark);
}

// --- Business / office center ---
export function placeBusinessCenter(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 30, 24);
  const floors = 3 + Math.floor(rng() * 4);
  makeBuilding(sink, {
    x, z, w: 18 + rng() * 8, d: 14 + rng() * 6, floors,
    baseY, color: pick(rng, [C.glass, C.gray, C.white, 0x7a8890]),
    rng,
  });
  // Plaza planters
  for (let i = 0; i < 3; i++) {
    const px = x + 2 + i * 6;
    sink.addSpan(px, baseY, z - 4, px + 2.5, baseY + 0.7, z - 1.5, C.sand);
    sink.addSpan(px + 0.6, baseY + 0.7, z - 3.4, px + 1.9, baseY + 2.2, z - 2.1, C.green);
  }
}

// --- Skyscraper ---
export function placeSkyscraper(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z, 22, 20);
  const floors = 8 + Math.floor(rng() * 8); // 8–15
  const w = 16 + rng() * 8;
  const d = 14 + rng() * 8;
  makeBuilding(sink, {
    x, z, w, d, floors,
    baseY, color: pick(rng, [C.glass, 0x6a7888, C.white, 0x4a545c]),
    rng,
  });
  // Antenna
  const roof = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  sink.addSpan(x + w / 2 - 0.3, roof, z + d / 2 - 0.3, x + w / 2 + 0.3, roof + 12, z + d / 2 + 0.3, C.metal);
}

// --- Boat house / pier ---
export function placeBoatHouse(sink, terrain, x, z, rng) {
  const baseY = Math.max(0.4, groundY(terrain, x, z, 14, 10));
  makeShed(sink, {
    x, z, w: 12, d: 8, h: 4,
    baseY, color: C.wood, doorW: 4,
  });
  // Pier deck over water direction (-X often ocean/bay)
  const pierLen = 18 + rng() * 10;
  sink.addSpan(x - pierLen, Math.max(0.3, baseY - 0.2), z + 1, x, Math.max(0.55, baseY + 0.15), z + 7, C.wood);
  // Pilings
  for (let i = 0; i < 5; i++) {
    const px = x - 3 - i * 4;
    sink.addSpan(px, -2, z + 1.5, px + 0.4, baseY + 0.2, z + 1.9, C.dark);
    sink.addSpan(px, -2, z + 5.5, px + 0.4, baseY + 0.2, z + 5.9, C.dark);
  }
}

// --- Harbor pier with crates ---
export function placeHarborPier(sink, terrain, x, z, rng) {
  const baseY = Math.max(0.5, groundY(terrain, x, z, 30, 12));
  const len = 40;
  const width = 10;
  sink.addSpan(x, baseY, z, x + len, baseY + 0.35, z + width, C.wood);
  for (let i = 0; i < 8; i++) {
    const px = x + 3 + i * 5;
    sink.addSpan(px, -3, z + 1, px + 0.5, baseY + 0.2, z + 1.5, C.dark);
    sink.addSpan(px, -3, z + width - 1.5, px + 0.5, baseY + 0.2, z + width - 1, C.dark);
  }
  // Crates / containers
  for (let i = 0; i < 6; i++) {
    const cx = x + 4 + i * 5.5;
    const ch = 1.2 + rng() * 1.4;
    sink.addSpan(cx, baseY + 0.35, z + 2, cx + 2.2, baseY + 0.35 + ch, z + 4.5, pick(rng, [C.blue, C.orange, C.teal, C.wood]));
  }
  // Warehouse at pier root
  makeShed(sink, {
    x: x + len - 2, z: z - 2, w: 16, d: 14, h: 7,
    baseY: groundY(terrain, x + len, z, 16, 14),
    color: C.metal, doorW: 5,
  });
}

// --- Bridge span (axis-aligned deck + piers) ---
export function placeBridge(sink, terrain, x0, z0, x1, z1, deckY, width = 12) {
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  const minZ = Math.min(z0, z1), maxZ = Math.max(z0, z1);
  const alongX = (maxX - minX) >= (maxZ - minZ);

  if (alongX) {
    const zc = (minZ + maxZ) / 2;
    sink.addSpan(minX, deckY, zc - width / 2, maxX, deckY + 0.55, zc + width / 2, C.asphalt);
    // Rails
    sink.addSpan(minX, deckY + 0.55, zc - width / 2, maxX, deckY + 1.5, zc - width / 2 + 0.3, C.metal, 'thin');
    sink.addSpan(minX, deckY + 0.55, zc + width / 2 - 0.3, maxX, deckY + 1.5, zc + width / 2, C.metal, 'thin');
    // Piers
    const span = maxX - minX;
    const n = Math.max(2, Math.floor(span / 35));
    for (let i = 0; i <= n; i++) {
      const px = minX + (span * i) / n;
      sink.addSpan(px - 1.2, -4, zc - 2, px + 1.2, deckY, zc + 2, C.gray);
    }
  } else {
    const xc = (minX + maxX) / 2;
    sink.addSpan(xc - width / 2, deckY, minZ, xc + width / 2, deckY + 0.55, maxZ, C.asphalt);
    sink.addSpan(xc - width / 2, deckY + 0.55, minZ, xc - width / 2 + 0.3, deckY + 1.5, maxZ, C.metal, 'thin');
    sink.addSpan(xc + width / 2 - 0.3, deckY + 0.55, minZ, xc + width / 2, deckY + 1.5, maxZ, C.metal, 'thin');
    const span = maxZ - minZ;
    const n = Math.max(2, Math.floor(span / 35));
    for (let i = 0; i <= n; i++) {
      const pz = minZ + (span * i) / n;
      sink.addSpan(xc - 2, -4, pz - 1.2, xc + 2, deckY, pz + 1.2, C.gray);
    }
  }
}

// --- Abstract animals (zoo placeholders — stylized blocks, not real fauna models) ---
export function placeAnimal(sink, x, z, baseY, rng, kind = null) {
  const types = {
    large: { body: [2.8, 1.6, 1.2], head: [0.9, 0.8, 0.8], color: [0x6b5344, 0x8a7050, 0x4a3a2a] },
    tall: { body: [1.4, 2.8, 1.0], head: [0.7, 0.6, 0.9], color: [0xc4a86a, 0xd4b87a] },
    bulk: { body: [3.2, 1.9, 1.6], head: [1.0, 0.9, 0.9], color: [0x5a5a5a, 0x3a3a3a] },
    small: { body: [1.2, 0.8, 0.7], head: [0.45, 0.4, 0.45], color: [0x8a6a4a, 0xc4a070, 0x3a3a3a] },
    bird: { body: [0.8, 0.6, 0.5], head: [0.35, 0.35, 0.35], color: [0xd4d0c8, 0x2a4a6a, 0xc44a2a] },
  };
  const keys = Object.keys(types);
  const t = types[kind] || types[pick(rng, keys)];
  const col = pick(rng, t.color);
  const [bw, bh, bd] = t.body;
  const [hw, hh, hd] = t.head;
  sink.addSpan(x, baseY, z, x + bw, baseY + bh, z + bd, col);
  sink.addSpan(x + bw - hw * 0.2, baseY + bh * 0.65, z + bd * 0.2, x + bw + hw * 0.6, baseY + bh * 0.65 + hh, z + bd * 0.2 + hd, col);
  // Legs
  const legH = bh * 0.45;
  for (const [lx, lz] of [[0.15, 0.15], [bw - 0.4, 0.15], [0.15, bd - 0.4], [bw - 0.4, bd - 0.4]]) {
    sink.addSpan(x + lx, baseY - legH * 0.1, z + lz, x + lx + 0.25, baseY + 0.05, z + lz + 0.25, col);
  }
}

// --- Suburban strip sign ---
export function placeBillboard(sink, terrain, x, z, rng) {
  const baseY = groundY(terrain, x, z);
  sink.addSpan(x, baseY, z, x + 0.4, baseY + 6, z + 0.4, C.metal);
  sink.addSpan(x - 2.5, baseY + 5, z - 0.2, x + 3, baseY + 7.5, z + 0.6, pick(rng, [C.red, C.blue, C.yellow, C.teal]));
}
