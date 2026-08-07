import { makeShed } from '../BuildingKit.js';
import { C } from './Catalog.js';

// Shared marine kit: the parts of the world that meet the water.
//
// Both peninsulas are noise-shaped ellipses rather than surveyed coastlines, so
// nothing that touches the waterline can be placed on a hardcoded coordinate and
// trusted. Everything here either finds the real shore first or verifies open
// water and refuses to build. Coronado and Point Loma both draw on it.

export const SEA = 0;               // waterline
export const HULL = 0x3c4148;       // haze grey
export const HULL_DK = 0x2b2f34;
export const DECK = 0x53585e;
export const DECK_DK = 0x41464c;
export const BOOT = 0x1e1512;       // boot topping below the waterline
export const CONCRETE = 0xb2afa6;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

/** True when every sample under the rect is below the waterline. */
export function isWater(terrain, x0, z0, x1, z1, step = 3) {
  for (let x = x0; x <= x1; x += step) {
    for (let z = z0; z <= z1; z += step) {
      if (terrain.heightAt(x, z) > SEA - 1) return false;
    }
  }
  return true;
}

/**
 * Walk north (dz < 0) or south (dz > 0) from (x, z) until the ground drops below
 * the waterline. Returns the last dry step — where a pier should be rooted — or
 * null when the walk never reaches water, which means the caller picked a
 * direction with no coast in it and should not build a pier at all.
 *
 * `halfW` widens the test: a 14 m quay needs 14 m of coastline, not one sample,
 * or one corner ends up buried in the beach it was supposed to leave behind.
 */
export function findShore(terrain, x, z, dz, maxDist = 140, halfW = 0, step = 2) {
  const dir = Math.sign(dz) || -1;
  const wet = (pz) => {
    for (let ox = -halfW; ox <= halfW; ox += Math.max(2, halfW || 2)) {
      if (terrain.heightAt(x + ox, pz) > SEA - 0.2) return false;
    }
    return true;
  };
  let lastDry = null;
  for (let t = 0; t <= maxDist; t += step) {
    const pz = z + dir * t;
    const h = terrain.heightAt(x, pz);
    if (!wet(pz)) lastDry = { x, z: pz, y: Math.max(h, SEA) };
    else if (lastDry) return lastDry;
  }
  return null;
}

/**
 * Find a clear berth for a hull of the given beam and length on a mooring line.
 * Starts with the stern at `sternZ` and searches outward — first sliding the
 * ship away from shore, then shifting it a few metres athwartships. The bay
 * floor is noise, not a dredged channel: the two berths either side of one pier
 * can differ by 8 m of depth and there are shoals that run the full length of a
 * mooring line, so a berth that only slides fore-and-aft will never find them.
 * Returns {cx, z0, z1} with the bow at z0, or null if this line has no room.
 */
export function berth(terrain, cx, sternZ, length, halfBeam, opts = {}) {
  const slide = opts.slide ?? 40;
  const shift = opts.shift ?? 6;
  for (let dx = 0; dx <= shift; dx += 2) {
    for (const sx of dx === 0 ? [0] : [-dx, dx]) {
      for (let off = 0; off <= slide; off += 4) {
        const z1 = sternZ - off;
        const z0 = z1 - length;
        if (isWater(terrain, cx + sx - halfBeam, z0 - 2, cx + sx + halfBeam, z1 + 2)) {
          return { cx: cx + sx, z0, z1 };
        }
      }
    }
  }
  return null;
}

/**
 * A ship's hull as a stack of boxes: a boot-topping band at the waterline, the
 * grey freeboard above it, and a tapered bow made of stepped shoulders. Runs
 * along +Z with the bow at z0 so every hull type can share it.
 */
export function hullAlongZ(sink, cx, z0, z1, beam, freeboard, opts = {}) {
  const half = beam / 2;
  const draft = opts.draft ?? 3.2;
  const taper = opts.taper ?? beam * 1.6;
  const body0 = z0 + taper;

  sink.addSpan(cx - half, SEA - draft, body0, cx + half, SEA + 0.9, z1, BOOT);
  sink.addSpan(cx - half, SEA + 0.9, body0, cx + half, SEA + freeboard, z1, HULL);

  const steps = 3;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const hw = half * (0.28 + 0.72 * t0);
    sink.addSpan(cx - hw, SEA - draft, z0 + taper * t0, cx + hw, SEA + 0.9, z0 + taper * t1 + 0.2, BOOT);
    sink.addSpan(cx - hw, SEA + 0.9, z0 + taper * t0, cx + hw, SEA + freeboard, z0 + taper * t1 + 0.2, HULL);
  }
  sink.addSpan(cx - half, SEA - draft, z1 - 0.5, cx + half, SEA + freeboard, z1, HULL_DK);
  return { half, body0 };
}

/**
 * A quay: a concrete deck on piles running from the shoreline out over the
 * water, with a ramp back up to grade so it is walkable. Root it on a point from
 * findShore() and it can never start in mid-air or 20 m inland.
 */
export function quay(sink, terrain, cx, shoreZ, outZ, width, rng, opts = {}) {
  const deckY = opts.deckY ?? SEA + 3.0;
  const half = width / 2;
  const dir = Math.sign(outZ - shoreZ) || -1;
  const z0 = Math.min(shoreZ, outZ);
  const z1 = Math.max(shoreZ, outZ);
  if (z1 - z0 < 6) return false;

  sink.addSpan(cx - half, deckY - 0.6, z0, cx + half, deckY, z1, CONCRETE);
  for (let z = z0 + 3; z < z1; z += 8) {
    for (const ox of [-half + 1.2, half - 1.8]) {
      const g = terrain.heightAt(cx + ox, z);
      post(sink, cx + ox, g, z, Math.max(1, deckY - 0.6 - g), 0.9, C.concrete);
    }
  }

  // Ramp from the deck back up to grade
  const gy = terrain.heightAt(cx, shoreZ - dir * 3);
  if (Number.isFinite(gy) && gy > deckY) {
    const rl = Math.max(4, (gy - deckY) * 3);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      sink.addSpan(
        cx - half * 0.6, deckY - 0.6, shoreZ - dir * rl * t,
        cx + half * 0.6, deckY + (gy - deckY) * t, shoreZ - dir * rl * (t + 1 / steps) - dir * 0.2,
        CONCRETE
      );
    }
  }

  // Bollards
  for (let z = z0 + 6; z < z1 - 4; z += 11) {
    for (const ox of [-half + 0.8, half - 1.4]) {
      sink.addSpan(cx + ox, deckY, z, cx + ox + 0.6, deckY + 0.85, z + 0.6, C.dark);
    }
  }
  // Gantry cranes
  if (opts.crane !== false) {
    for (const cz of [z0 + (z1 - z0) * 0.35, z0 + (z1 - z0) * 0.7]) {
      for (const ox of [-half + 1.5, half - 2.3]) post(sink, cx + ox, deckY, cz, 13, 0.8, C.yellow);
      sink.addSpan(cx - half + 1.2, deckY + 13, cz - 0.4, cx + half - 1.2, deckY + 14.2, cz + 1.2, C.yellow);
      sink.addSpan(cx - 1.4, deckY + 10.5, cz - 0.2, cx + 1.4, deckY + 13, cz + 1.0, C.metalLite);
    }
  }
  // Shore-power shed and a few stores crates
  makeShed(sink, {
    x: cx - half + 1, z: z0 + 4, w: Math.min(6, width - 3), d: 5, h: 3.2,
    baseY: deckY, color: C.metalLite, doorW: 2,
  });
  for (let i = 0; i < 3; i++) {
    const bz = z0 + 14 + i * 17;
    if (bz > z1 - 6) break;
    sink.addSpan(cx - 2.2, deckY, bz, cx + 2.2, deckY + 2.4, bz + 5, pick(rng, [C.green, 0x4a5a44, C.metal]));
  }
  return true;
}
