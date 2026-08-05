// POIs are map anchors only (x, z) — no artificial footprints or flatten pads.
// Optional soft "near" radius for UI / scatter bias only (not terrain).

const NEAR_M = 90; // "inside" for HUD when within this of the anchor

/** True if close to the POI anchor (soft proximity, not a district pad). */
export function poiContains(p, x, z, scale = 1) {
  const r = (p.near ?? NEAR_M) * scale;
  return Math.hypot(x - p.x, z - p.z) <= r;
}

/** Nearest POI by distance to anchor. */
export function nearestPoi(pois, x, z) {
  let best = null;
  let bestD = Infinity;
  for (const p of pois) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return { poi: best, dist: bestD };
}
