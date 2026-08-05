import { POIS, FREEWAYS, ROAD_LINKS, ROADS } from '../config.js';

// Build a connected, terrain-aware road network as short segments.
// Heightfield flattening happens in Terrain; this also lays asphalt decks
// that follow the ground so nothing floats.

const MIN_DRY = 2.5;

/**
 * Produce road centreline polylines:
 * 1) Freeways (updated pts)
 * 2) Arterials POI → POI broken into waypoint chains that stick to dry land
 */
export function buildRoadPolylines() {
  const by = Object.fromEntries(POIS.map((p) => [p.id, p]));
  const lines = [];

  for (const fw of FREEWAYS) {
    lines.push({
      id: fw.id,
      width: fw.width ?? ROADS.WIDTH,
      blend: ROADS.FREEWAY_BLEND ?? ROADS.BLEND,
      pts: fw.pts.map(([x, z]) => ({ x, z })),
    });
  }

  // Arterials: direct links, but with a mid waypoint if the straight line is long
  for (const [a, b] of ROAD_LINKS) {
    const A = by[a];
    const B = by[b];
    if (!A || !B) continue;
    const dx = B.x - A.x;
    const dz = B.z - A.z;
    const len = Math.hypot(dx, dz);
    const pts = [{ x: A.x, z: A.z }];
    // Bend slightly so arterials don't all cross the same bay water at midpoints
    if (len > 180) {
      const mx = (A.x + B.x) / 2;
      const mz = (A.z + B.z) / 2;
      // Offset perpendicular to prefer land (push east for coastal links)
      const px = -dz / len;
      const pz = dx / len;
      const off = Math.min(80, len * 0.12);
      // Prefer offset toward map interior (east of coast)
      const sign = mx < 0 ? 1 : (Math.abs(mz) > 200 ? Math.sign(-mz) || 1 : 1);
      pts.push({ x: mx + px * off * sign, z: mz + pz * off * sign });
    }
    pts.push({ x: B.x, z: B.z });
    lines.push({
      id: `link-${a}-${b}`,
      width: ROADS.WIDTH,
      blend: ROADS.BLEND,
      pts,
    });
  }

  return lines;
}

/** Flatten polylines into straight segments for Terrain._applyRoads. */
export function polylinesToSegments(lines) {
  const segs = [];
  for (const line of lines) {
    for (let i = 0; i < line.pts.length - 1; i++) {
      const a = line.pts[i];
      const b = line.pts[i + 1];
      segs.push({
        a: { x: a.x, z: a.z },
        b: { x: b.x, z: b.z },
        width: line.width,
        blend: line.blend,
      });
    }
  }
  return segs;
}

/**
 * Lay asphalt decks as short terrain-following slabs (prevents floating roads).
 */
export function layRoadDecks(sink, terrain, lines) {
  let pieces = 0;
  for (const line of lines) {
    const halfW = (line.width ?? ROADS.WIDTH) * 0.5;
    for (let i = 0; i < line.pts.length - 1; i++) {
      const a = line.pts[i];
      const b = line.pts[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 1) continue;
      const ux = dx / len;
      const uz = dz / len;
      const px = -uz; // perpendicular
      const pz = ux;
      const step = 8; // metres per deck piece
      const n = Math.max(1, Math.ceil(len / step));
      for (let s = 0; s < n; s++) {
        const t0 = s / n;
        const t1 = (s + 1) / n;
        const x0 = a.x + dx * t0;
        const z0 = a.z + dz * t0;
        const x1 = a.x + dx * t1;
        const z1 = a.z + dz * t1;
        const mx = (x0 + x1) / 2;
        const mz = (z0 + z1) / 2;
        const h = terrain.heightAt(mx, mz);
        if (h < MIN_DRY) continue;
        // Slightly above terrain to avoid z-fight
        const y = h + (ROADS.RAISE ?? 0.12);
        // Oriented AABB covering the short segment (good enough at 8m)
        const minX = Math.min(x0, x1) - Math.abs(px) * halfW;
        const maxX = Math.max(x0, x1) + Math.abs(px) * halfW;
        const minZ = Math.min(z0, z1) - Math.abs(pz) * halfW;
        const maxZ = Math.max(z0, z1) + Math.abs(pz) * halfW;
        sink.addSpan(minX, y, minZ, maxX, y + 0.14, maxZ, 0x2e2f32);
        // Center dashed paint
        const cy = y + 0.15;
        sink.addSpan(
          mx - Math.abs(ux) * 1.2 - Math.abs(px) * 0.12,
          cy,
          mz - Math.abs(uz) * 1.2 - Math.abs(pz) * 0.12,
          mx + Math.abs(ux) * 1.2 + Math.abs(px) * 0.12,
          cy + 0.04,
          mz + Math.abs(uz) * 1.2 + Math.abs(pz) * 0.12,
          0xf0b400
        );
        pieces++;
      }
    }
  }
  return pieces;
}

/**
 * Downtown local street grid following terrain (short segments, dry only).
 */
export function layLocalGrid(sink, terrain, cx, cz, cols, rows, blockW, blockD, streetW) {
  const stepX = blockW + streetW;
  const stepZ = blockD + streetW;
  const originX = cx - (cols * stepX - streetW) / 2;
  const originZ = cz - (rows * stepZ - streetW) / 2;
  let n = 0;

  const strip = (x0, z0, x1, z1) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    if (len < 0.5) return;
    const steps = Math.max(1, Math.ceil(len / 6));
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps;
      const t1 = (s + 1) / steps;
      const ax = x0 + dx * t0;
      const az = z0 + dz * t0;
      const bx = x0 + dx * t1;
      const bz = z0 + dz * t1;
      const mx = (ax + bx) / 2;
      const mz = (az + bz) / 2;
      const h = terrain.heightAt(mx, mz);
      if (h < MIN_DRY) continue;
      const y = h + 0.1;
      const minX = Math.min(ax, bx) - 0.2;
      const maxX = Math.max(ax, bx) + 0.2;
      const minZ = Math.min(az, bz) - 0.2;
      const maxZ = Math.max(az, bz) + 0.2;
      // Expand perpendicular-ish via AABB of street width
      const alongX = Math.abs(dx) >= Math.abs(dz);
      if (alongX) {
        sink.addSpan(minX, y, mz - streetW / 2, maxX, y + 0.12, mz + streetW / 2, 0x2e2f32);
      } else {
        sink.addSpan(mx - streetW / 2, y, minZ, mx + streetW / 2, y + 0.12, maxZ, 0x2e2f32);
      }
      n++;
    }
  };

  // N–S streets
  for (let c = 0; c <= cols; c++) {
    const x = originX + c * stepX - streetW / 2;
    strip(x, originZ - streetW, x, originZ + rows * stepZ);
  }
  // E–W streets
  for (let r = 0; r <= rows; r++) {
    const z = originZ + r * stepZ - streetW / 2;
    strip(originX - streetW, z, originX + cols * stepX, z);
  }
  return { originX, originZ, stepX, stepZ, pieces: n };
}
