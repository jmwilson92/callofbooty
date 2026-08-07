import { freewayCrossings, deckProfile, DECK_HALF } from '../Interchanges.js';
import { C } from './Catalog.js';

// The physical overpasses. Interchanges.js decides where they are and which road
// flies; this builds the deck, the piers under it, the barriers along it and the
// connector ramps that make it read as an interchange rather than a lone bridge.
//
// The deck is built as a run of short spans following the flying road's
// direction, each one seated on the profile ramp, so an overpass on sloping
// ground still lands cleanly at both ends.

const DECK = 0x33363a;
const BARRIER = 0xb8b6b0;
const PIER = 0xa8a49c;
const STRIPE = 0xe0dccc;

function post(sink, x, y0, z, h, s, col) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

/** One overpass: ramped deck, piers, barriers, and a pair of connector ramps. */
function overpass(sink, terrain, c) {
  const halfW = c.overWidth * 0.5;
  const steps = 26;
  const px = -c.uz; // across-road unit
  const pz = c.ux;

  // The deck runs a *grade*, not the ground. Sampling terrain at every station
  // and adding the profile to it made the deck inherit every bump between the
  // abutments, so a 124 m span came out as a staircase of disconnected slabs.
  // Instead the abutments set a straight baseline and the profile humps over it;
  // the piers below then vary in length, which is what really happens.
  const abut = (sign) => terrain.heightAt(c.x + c.ux * DECK_HALF * sign, c.z + c.uz * DECK_HALF * sign);
  const gA = abut(-1);
  const gB = abut(1);
  if (!Number.isFinite(gA) || !Number.isFinite(gB)) return;
  const deckY = (t) => gA + (gB - gA) * ((t + 1) / 2) + deckProfile(Math.abs(t) * DECK_HALF);

  let prev = null;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 - 1;            // -1 .. 1 along the deck
    const along = t * DECK_HALF;
    const cx = c.x + c.ux * along;
    const cz = c.z + c.uz * along;
    const g = terrain.heightAt(cx, cz);
    if (!Number.isFinite(g)) continue;
    const y = deckY(t);

    if (prev) {
      const [qx, qz, qy] = prev;
      // Deck slab between the previous station and this one
      const x0 = Math.min(qx, cx) - Math.abs(px) * halfW;
      const x1 = Math.max(qx, cx) + Math.abs(px) * halfW;
      const z0 = Math.min(qz, cz) - Math.abs(pz) * halfW;
      const z1 = Math.max(qz, cz) + Math.abs(pz) * halfW;
      const yb = Math.min(qy, y);
      const yt = Math.max(qy, y);
      sink.addSpan(x0, yb - 1.0, z0, x1, yt + 0.25, z1, DECK);
      // Lane stripe down the middle
      sink.addSpan(
        Math.min(qx, cx) - Math.abs(px) * 0.3, yt + 0.25, Math.min(qz, cz) - Math.abs(pz) * 0.3,
        Math.max(qx, cx) + Math.abs(px) * 0.3, yt + 0.31, Math.max(qz, cz) + Math.abs(pz) * 0.3,
        STRIPE, 'thin'
      );
      // Jersey barriers along both edges
      for (const s of [-1, 1]) {
        const bx0 = Math.min(qx, cx) + px * s * (halfW - 0.5);
        const bz0 = Math.min(qz, cz) + pz * s * (halfW - 0.5);
        const bx1 = Math.max(qx, cx) + px * s * (halfW - 0.5);
        const bz1 = Math.max(qz, cz) + pz * s * (halfW - 0.5);
        sink.addSpan(
          Math.min(bx0, bx1) - 0.35, yt + 0.25, Math.min(bz0, bz1) - 0.35,
          Math.max(bx0, bx1) + 0.35, yt + 1.25, Math.max(bz0, bz1) + 0.35,
          BARRIER, 'thin'
        );
      }
    }
    prev = [cx, cz, y];

    // Piers, but only where the deck is meaningfully off the ground
    if (i % 4 === 0 && y - g > 2.2) {
      for (const s of [-1, 1]) {
        const bx = cx + px * s * (halfW - 1.6);
        const bz = cz + pz * s * (halfW - 1.6);
        post(sink, bx - 0.7, g - 0.5, bz - 0.7, y - g - 0.9, 1.4, PIER);
      }
      // Pier cap tying the pair together
      sink.addSpan(
        cx - Math.abs(px) * halfW, y - 1.6, cz - Math.abs(pz) * halfW,
        cx + Math.abs(px) * halfW, y - 1.0, cz + Math.abs(pz) * halfW,
        PIER
      );
    }
  }

  // Connector ramps: two quadrant loops peeling off the flying road down to the
  // road below, which is what turns a bridge into an interchange. The ramp runs
  // its own grade from the deck down to the ground at its far end, for the same
  // reason the deck does — sampling terrain per station gave a broken staircase.
  for (const s of [-1, 1]) {
    const n = 16;
    const startT = 0.42;
    const arc = (t) => {
      const a = (Math.PI * 0.55) * t;
      const r = 44;
      // Start alongside the deck, curve away and drop to grade
      const ax = c.x + c.ux * (DECK_HALF * startT) + px * s * (halfW + 2);
      const az = c.z + c.uz * (DECK_HALF * startT) + pz * s * (halfW + 2);
      return [
        ax + (c.ux * Math.cos(a) + px * s * Math.sin(a)) * r * t,
        az + (c.uz * Math.cos(a) + pz * s * Math.sin(a)) * r * t,
      ];
    };
    const [ex, ez] = arc(1);
    const gEnd = terrain.heightAt(ex, ez);
    const yStart = deckY(startT);
    if (!Number.isFinite(gEnd)) continue;
    const rampY = (t) => yStart + (gEnd - yStart) * (t * t * (3 - 2 * t));

    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const [ax, az] = arc(t0);
      const [bx, bz] = arc(t1);
      const ga = terrain.heightAt(ax, az);
      if (!Number.isFinite(ga)) continue;
      const ya = rampY(t0);
      const yb = rampY(t1);
      const w = 4.2;
      sink.addSpan(
        Math.min(ax, bx) - w, Math.min(ya, yb) - 1.0, Math.min(az, bz) - w,
        Math.max(ax, bx) + w, Math.max(ya, yb) + 0.2, Math.max(az, bz) + w,
        DECK
      );
      if (ya - ga > 2.5 && i % 3 === 0) {
        post(sink, ax - 0.6, ga - 0.5, az - 0.6, ya - ga - 0.8, 1.2, PIER);
      }
    }
  }

  // Overhead sign gantry on the approach
  const sx = c.x - c.ux * (DECK_HALF + 16);
  const sz = c.z - c.uz * (DECK_HALF + 16);
  const sg = terrain.heightAt(sx, sz);
  if (Number.isFinite(sg) && sg > 2) {
    for (const s of [-1, 1]) {
      post(sink, sx + px * s * halfW - 0.3, sg, sz + pz * s * halfW - 0.3, 8, 0.6, C.metal);
    }
    sink.addSpan(
      sx - Math.abs(px) * halfW - 0.6, sg + 8, sz - Math.abs(pz) * halfW - 0.6,
      sx + Math.abs(px) * halfW + 0.6, sg + 8.7, sz + Math.abs(pz) * halfW + 0.6,
      C.metalLite
    );
    sink.addSpan(
      sx - Math.abs(px) * halfW * 0.6, sg + 8.7, sz - Math.abs(pz) * halfW * 0.6,
      sx + Math.abs(px) * halfW * 0.6, sg + 11.2, sz + Math.abs(pz) * halfW * 0.6,
      0x2e6b3a
    );
  }
}

/** Build every grade separation on the freeway network. */
export function placeOverpasses(sink, terrain) {
  const list = freewayCrossings();
  for (const c of list) {
    const g = terrain.heightAt(c.x, c.z);
    if (!Number.isFinite(g) || g < 2.5) continue; // skip anything out over water
    overpass(sink, terrain, c);
  }
  return { overpasses: list.length };
}
