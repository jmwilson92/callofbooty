import { MANTLE, COLLISION } from '../config.js';

// World queries the character controller needs. Kept separate from the
// controller so that file stays about movement state rather than geometry
// lookups. All of these read static geometry only -- none of them mutate.

/**
 * Topmost solid surface directly under the point (x, z), at or below `maxY`.
 * Point sample -- use this when you mean "what is at exactly this spot",
 * such as the ledge in front of the player during a mantle probe.
 */
export function columnTop(terrain, hash, candidates, x, z, maxY) {
  let top = terrain.heightAt(x, z);
  if (top > maxY) top = -Infinity;
  hash.query(x - 0.05, z - 0.05, x + 0.05, z + 0.05, candidates);
  for (const b of candidates) {
    if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z) continue;
    if (b.max.y <= maxY && b.max.y > top) top = b.max.y;
  }
  return top;
}

/**
 * Highest surface anywhere under the capsule's FOOTPRINT (a disc of `radius`),
 * at or below `maxY`.
 *
 * Stepping onto a stair tread has to work while the capsule centre is still a
 * radius short of the tread edge; a centre-only probe leaves the player wedged
 * against every single step.
 */
export function supportTop(terrain, hash, candidates, x, z, maxY, radius) {
  let top = terrain.heightAt(x, z);
  if (top > maxY) top = -Infinity;
  hash.query(x - radius, z - radius, x + radius, z + radius, candidates);
  for (const b of candidates) {
    const dx = Math.max(b.min.x - x, 0, x - b.max.x);
    const dz = Math.max(b.min.z - z, 0, z - b.max.z);
    if (dx * dx + dz * dz > radius * radius) continue;
    if (b.max.y <= maxY && b.max.y > top) top = b.max.y;
  }
  return top;
}

/** Is the vertical span (y0, y1) over the capsule footprint free of geometry? */
export function spanClear(hash, candidates, x, z, y0, y1, radius) {
  hash.query(x - radius, z - radius, x + radius, z + radius, candidates);
  for (const b of candidates) {
    const dx = Math.max(b.min.x - x, 0, x - b.max.x);
    const dz = Math.max(b.min.z - z, 0, z - b.max.z);
    if (dx * dx + dz * dz > radius * radius) continue;
    if (b.max.y > y0 && b.min.y < y1) return false;
  }
  return true;
}

/**
 * Which surface, if any, is the capsule standing on?
 *
 * A surface counts only if it sits within GROUND_PROBE *below* the feet. Both
 * bounds matter: without the upper one, any surface further down still reads
 * as ground, so gravity never re-engages after jumping off a crate or a roof.
 *
 * Returns { grounded, groundY, steep } -- `steep` is the terrain normal when
 * the face is too steep to stand on, otherwise null.
 */
export function groundProbe(terrain, hash, candidates, pos, radius, maxSlopeCos, out) {
  const probe = COLLISION.GROUND_PROBE;
  const terrainH = terrain.heightAt(pos.x, pos.z);
  let best = -Infinity;
  let onTerrain = false;

  if (terrainH <= pos.y + 0.02 && terrainH >= pos.y - probe) {
    best = terrainH;
    onTerrain = true;
  }

  hash.query(pos.x - radius, pos.z - radius, pos.x + radius, pos.z + radius, candidates);
  for (const b of candidates) {
    const dx = Math.max(b.min.x - pos.x, 0, pos.x - b.max.x);
    const dz = Math.max(b.min.z - pos.z, 0, pos.z - b.max.z);
    if (dx * dx + dz * dz > radius * radius) continue;
    if (b.max.y <= pos.y + 0.02 && b.max.y >= pos.y - probe && b.max.y > best) {
      best = b.max.y;
      onTerrain = false;
    }
  }

  out.grounded = false;
  out.groundY = best;
  out.steep = null;

  if (best === -Infinity) return out;

  // Terrain steeper than the walk limit is not ground -- the player slides off.
  if (onTerrain) {
    const n = terrain.normalAt(pos.x, pos.z, out.normal);
    if (n.y < maxSlopeCos) {
      out.steep = n;
      return out;
    }
  }

  out.grounded = true;
  return out;
}

/**
 * Look for a mantle-able ledge ahead. Returns the target feet position, or
 * null if there is no ledge in the 0.5-1.6 m window with room to stand.
 */
export function findMantleTarget(terrain, hash, candidates, pos, radius, yaw, out) {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const probeX = pos.x + fx * MANTLE.REACH;
  const probeZ = pos.z + fz * MANTLE.REACH;

  const ledgeY = columnTop(terrain, hash, candidates, probeX, probeZ, pos.y + MANTLE.MAX_HEIGHT);
  if (ledgeY === -Infinity) return null;

  const rise = ledgeY - pos.y;
  if (rise < MANTLE.MIN_HEIGHT || rise > MANTLE.MAX_HEIGHT) return null;
  if (!spanClear(hash, candidates, probeX, probeZ, ledgeY + 0.05, ledgeY + MANTLE.CLEARANCE, radius)) {
    return null;
  }

  // Land a little past the lip so the player is not balanced on the edge.
  return out.set(probeX + fx * 0.35, ledgeY + 0.02, probeZ + fz * 0.35);
}
