import { FREEWAYS } from '../config.js';

// Freeway grade separation.
//
// Every corridor was painted straight into the heightfield, so where two of them
// crossed they simply merged into one wide patch of asphalt — no overpass, no
// structure, nothing to tell you which road you were on. This works out where
// the corridors actually intersect, decides which one flies, and gives the
// structures pass the deck profile to build.
//
// Priority: the higher number flies. Interstates run at grade and the state
// routes go over them, which is what SR-163 does over I-8 in Mission Valley.
const PRIORITY = { i5: 1, i8: 2, i15: 3, i805: 4, sr52: 5, sr163: 6 };

// How far either side of a crossing the deck runs, and how high it flies.
export const DECK_HALF = 62;
export const DECK_RISE = 9;

function segments(fw) {
  const out = [];
  for (let i = 0; i < fw.pts.length - 1; i++) {
    out.push([fw.pts[i], fw.pts[i + 1]]);
  }
  return out;
}

function intersect(a, b) {
  const rx = a[1][0] - a[0][0];
  const rz = a[1][1] - a[0][1];
  const sx = b[1][0] - b[0][0];
  const sz = b[1][1] - b[0][1];
  const den = rx * sz - rz * sx;
  if (Math.abs(den) < 1e-9) return null;
  const qx = b[0][0] - a[0][0];
  const qz = b[0][1] - a[0][1];
  const t = (qx * sz - qz * sx) / den;
  const u = (qx * rz - qz * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  const len = Math.hypot(rx, rz) || 1;
  return {
    x: a[0][0] + rx * t,
    z: a[0][1] + rz * t,
    // Unit direction of the first road through the crossing
    ux: rx / len,
    uz: rz / len,
  };
}

let _cache = null;

/**
 * Deduped freeway crossings. Each entry names the road that flies (`over`), the
 * one that stays at grade (`under`), and the flying road's direction so the deck
 * can be laid along it.
 */
export function freewayCrossings() {
  if (_cache) return _cache;
  const raw = [];
  for (let i = 0; i < FREEWAYS.length; i++) {
    for (let j = i + 1; j < FREEWAYS.length; j++) {
      const A = FREEWAYS[i];
      const B = FREEWAYS[j];
      for (const sa of segments(A)) {
        for (const sb of segments(B)) {
          const hit = intersect(sa, sb);
          if (!hit) continue;
          const aOver = (PRIORITY[A.id] ?? 0) > (PRIORITY[B.id] ?? 0);
          const over = aOver ? A : B;
          const under = aOver ? B : A;
          // Direction of whichever road is flying
          let { ux, uz } = hit;
          if (!aOver) {
            const rx = sb[1][0] - sb[0][0];
            const rz = sb[1][1] - sb[0][1];
            const len = Math.hypot(rx, rz) || 1;
            ux = rx / len;
            uz = rz / len;
          }
          raw.push({
            x: hit.x, z: hit.z, ux, uz,
            over: over.id, under: under.id,
            overWidth: over.width ?? 14,
            underWidth: under.width ?? 14,
          });
        }
      }
    }
  }
  // Cluster near-coincident hits (shared vertices produce duplicates, and three
  // roads meeting at a point produce a knot of them).
  const out = [];
  for (const c of raw) {
    const near = out.find((o) => Math.hypot(o.x - c.x, o.z - c.z) < 34);
    if (near) {
      if ((PRIORITY[c.over] ?? 0) > (PRIORITY[near.over] ?? 0)) {
        Object.assign(near, c);
      }
      continue;
    }
    out.push({ ...c });
  }
  _cache = out;
  return out;
}

/**
 * True if this freeway is flying here, so the heightfield pass must leave the
 * ground alone and let the deck carry the road over.
 */
export function isFlying(id, x, z) {
  if (!id) return false;
  for (const c of freewayCrossings()) {
    if (c.over !== id) continue;
    // Distance measured along the deck axis, so the suppression is a corridor
    // rather than a circle
    const dx = x - c.x;
    const dz = z - c.z;
    const along = Math.abs(dx * c.ux + dz * c.uz);
    const across = Math.abs(-dx * c.uz + dz * c.ux);
    if (along < DECK_HALF - 4 && across < c.overWidth * 0.9 + 6) return true;
  }
  return false;
}

/** Deck height above ground at a point along the flying road. */
export function deckProfile(alongAbs) {
  const t = Math.max(0, Math.min(1, 1 - alongAbs / DECK_HALF));
  // Smooth ramp up to full height over the middle of the span
  return DECK_RISE * (t * t * (3 - 2 * t));
}
