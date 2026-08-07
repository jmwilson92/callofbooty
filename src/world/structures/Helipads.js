import { worldBuildings } from '../BuildingRegistry.js';
import { worldLadders } from '../Ladders.js';
import { PLAYER, VEHICLES } from '../../config.js';
import { C } from './Catalog.js';

// Rooftop helipads.
//
// The helicopters used to be dropped on whichever building scored highest for
// height and floor area, which had two problems and both of them were fatal to
// actually using the thing:
//
//   1. Nothing cleared the roof first, so the bird landed in the middle of the
//      mechanical plant — stair huts, AC units, water tanks.
//   2. addBuildingAccess() returns early for `floors >= 6`, so the tall towers
//      it preferred have no ladder and no fire escape at all. Interior
//      circulation only, which does not reliably reach the roof deck.
//
// So a pad is now something the world *builds*, not somewhere a heli happens to
// be put: a cleared deck with markings, a stair penthouse, and an exterior caged
// ladder that is registered as a real climb volume from the street to the roof.
// Vehicles then spawns only on these, so a roof heli is always reachable.

const PAD = 0x3c3f43;
const PAD_EDGE = 0x2b2e31;
const MARK = 0xf0eee6;

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

/** The big white H, plus the circle it sits in. */
function padMarkings(sink, cx, cz, y, r) {
  // Touchdown circle, drawn as a ring of short chords
  const seg = 20;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * r;
    const z0 = cz + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const z1 = cz + Math.sin(a1) * r;
    sink.addSpan(
      Math.min(x0, x1) - 0.3, y, Math.min(z0, z1) - 0.3,
      Math.max(x0, x1) + 0.3, y + 0.06, Math.max(z0, z1) + 0.3,
      MARK, 'thin'
    );
  }
  // The H
  const hw = r * 0.42;
  const hh = r * 0.55;
  for (const ox of [-hw, hw - 0.9]) {
    sink.addSpan(cx + ox, y, cz - hh, cx + ox + 0.9, y + 0.07, cz + hh, MARK, 'thin');
  }
  sink.addSpan(cx - hw, y, cz - 0.45, cx + hw, y + 0.07, cz + 0.45, MARK, 'thin');
}

/**
 * Build one pad on a building's roof. Returns the pad centre, or null when the
 * roof is too small to hold one.
 */
function buildPad(sink, terrain, b, rng) {
  const roofY = b.roofY ?? (b.baseY + b.floors * 3.5);
  if (!Number.isFinite(roofY)) return null;
  const cx = b.x + b.w * 0.5;
  const cz = b.z + b.d * 0.5;
  const r = Math.min(b.w, b.d) * 0.5 - 2.2;
  if (r < 5) return null;

  const y = roofY + 0.3;
  // Deck: a raised platform, so it sits proud of whatever else is on the roof
  sink.addSpan(cx - r, roofY, cz - r, cx + r, y, cz + r, PAD);
  sink.addSpan(cx - r - 0.5, roofY, cz - r - 0.5, cx + r + 0.5, roofY + 0.16, cz + r + 0.5, PAD_EDGE);
  padMarkings(sink, cx, cz, y, r * 0.72);

  // Perimeter lights
  const lights = 12;
  for (let i = 0; i < lights; i++) {
    const a = (i / lights) * Math.PI * 2;
    const lx = cx + Math.cos(a) * (r - 0.5);
    const lz = cz + Math.sin(a) * (r - 0.5);
    sink.addSpan(lx - 0.16, y, lz - 0.16, lx + 0.16, y + 0.34, lz + 0.16, C.yellow, 'thin');
  }

  // Stair penthouse at a corner, off the pad, so the roof reads as served
  const px = b.x + 1.4;
  const pz = b.z + 1.4;
  const ph = 2.8;
  sink.addSpan(px, roofY, pz, px + 4.2, roofY + ph, pz + 3.6, C.concrete);
  sink.addSpan(px - 0.3, roofY + ph, pz - 0.3, px + 4.5, roofY + ph + 0.4, pz + 3.9, C.metal);
  sink.addSpan(px + 1.2, roofY, pz + 3.6 - 0.15, px + 3.0, roofY + 2.1, pz + 3.6 + 0.15, C.dark);

  return { x: cx, z: cz, y, r };
}

/**
 * Exterior caged ladder from the street to the roof, and the climb volume the
 * controller reads. This is the part that makes a pad reachable at all — the
 * towers these sit on get no exterior access from the normal building pass.
 */
function roofLadder(sink, terrain, b) {
  const roofY = b.roofY ?? (b.baseY + b.floors * 3.5);
  const g = terrain.heightAt(b.x + b.w * 0.5, b.z - 1);
  const y0 = Number.isFinite(g) ? Math.min(g, b.baseY) : b.baseY;
  if (roofY - y0 < 4) return false;

  // North face, offset from centre so it misses the main entrance
  const lx = b.x + b.w * 0.5 + 3.0;
  const lz = b.z - 0.55;
  const rungW = 0.7;
  for (const ox of [0, rungW]) post(sink, lx + ox, y0, lz, roofY - y0 + 1.4, 0.1, C.metal);
  for (let y = y0 + 0.3; y < roofY + 0.6; y += 0.32) {
    sink.addSpan(lx, y, lz - 0.02, lx + rungW, y + 0.07, lz + 0.12, C.metalLite, 'thin');
  }
  // Safety hoops every few metres
  for (let y = y0 + 3.5; y < roofY - 1; y += 3.5) {
    sink.addSpan(lx - 0.12, y, lz - 0.12, lx + rungW + 0.12, y + 0.08, lz + 0.28, C.metal, 'thin');
  }
  // Step-off landing onto the roof, through the parapet
  sink.addSpan(lx - 0.7, roofY, lz - 0.2, lx + rungW + 0.7, roofY + 0.14, b.z + 2.5, C.metal);
  worldLadders.add(lx - 0.3, y0, lz - 0.45, lx + rungW + 0.35, roofY + 1.8, lz + 0.5);
  return true;
}

/**
 * Choose roofs and build pads on them. Mid-rise is preferred over the tallest
 * tower on the map: a 40-storey roof needs a 140 m ladder to reach, and the
 * point of the exercise is a helicopter you can get to.
 */
export function placeHelipads(sink, terrain, rng, count = null) {
  const want = count ?? Math.max(2, (VEHICLES.HELICOPTER?.count ?? 2) + 2);
  const minF = 6;
  const maxF = 16;

  const cands = (worldBuildings || [])
    .filter((b) => (
      b.floors >= minF && b.floors <= maxF
      && b.w >= 16 && b.d >= 16
      && Number.isFinite(b.roofY ?? b.baseY)
    ))
    .map((b) => {
      const cx = b.x + b.w * 0.5;
      const cz = b.z + b.d * 0.5;
      const near = Math.hypot(cx - PLAYER.SPAWN.x, cz - PLAYER.SPAWN.z);
      return { b, cx, cz, score: Math.min(b.w, b.d) * 2 - near * 0.02 };
    })
    .sort((a, c) => c.score - a.score);

  const pads = [];
  for (const c of cands) {
    if (pads.length >= want) break;
    // Spread them out — four pads on one block is not a distribution
    if (pads.some((p) => Math.hypot(p.x - c.cx, p.z - c.cz) < 120)) continue;
    const pad = buildPad(sink, terrain, c.b, rng);
    if (!pad) continue;
    roofLadder(sink, terrain, c.b);
    // Publish it so Vehicles can spawn here and nowhere else
    c.b.helipad = pad;
    pads.push(pad);
  }
  return { helipads: pads.length };
}
