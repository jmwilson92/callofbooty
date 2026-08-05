// Rectangular POI footprints (axis-aligned) instead of circular blobs.
// Matches city blocks / airfields / valleys better than radial pads.

/**
 * Half-extents of a POI in world metres.
 * Prefers explicit `w`/`d`; falls back to legacy `radius`.
 */
export function poiHalfSize(p) {
  const w = p.w ?? (p.radius != null ? p.radius * 1.7 : 80);
  const d = p.d ?? (p.radius != null ? p.radius * 1.7 : 80);
  return { hw: w * 0.5, hd: d * 0.5 };
}

/** Axis-aligned bounds of the hard footprint (no blend). */
export function poiBounds(p, scale = 1) {
  const { hw, hd } = poiHalfSize(p);
  return {
    x0: p.x - hw * scale,
    x1: p.x + hw * scale,
    z0: p.z - hd * scale,
    z1: p.z + hd * scale,
  };
}

/** True if (x,z) is inside the scaled rectangle. */
export function poiContains(p, x, z, scale = 1) {
  const { hw, hd } = poiHalfSize(p);
  return Math.abs(x - p.x) <= hw * scale && Math.abs(z - p.z) <= hd * scale;
}

/**
 * Pad weight 1 inside the rectangle, 0 outside blend margin.
 * Outside distance uses axis-aligned "box SDF" (not circular).
 */
export function poiPadWeight(p, x, z, blend = null) {
  const { hw, hd } = poiHalfSize(p);
  const b = blend ?? p.padBlend ?? 36;
  const dx = Math.max(0, Math.abs(x - p.x) - hw);
  const dz = Math.max(0, Math.abs(z - p.z) - hd);
  // Distance outside the rect (0 = inside or on edge)
  const outside = Math.hypot(dx, dz);
  if (outside <= 1e-6) return 1;
  if (outside >= b) return 0;
  // Smooth falloff
  const t = outside / b;
  return 1 - t * t * (3 - 2 * t);
}

/** Approximate radius for distance-to-POI UI (half-diagonal). */
export function poiApproxRadius(p) {
  const { hw, hd } = poiHalfSize(p);
  return Math.hypot(hw, hd);
}

/** Nearest POI by rectangle edge distance (not center-only). */
export function nearestPoi(pois, x, z) {
  let best = null;
  let bestD = Infinity;
  for (const p of pois) {
    const { hw, hd } = poiHalfSize(p);
    const dx = Math.max(0, Math.abs(x - p.x) - hw);
    const dz = Math.max(0, Math.abs(z - p.z) - hd);
    const d = Math.hypot(dx, dz);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return { poi: best, dist: bestD };
}
