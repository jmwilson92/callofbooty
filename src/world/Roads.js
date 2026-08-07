import { POIS, FREEWAYS, ROAD_LINKS, ROADS } from '../config.js';

// Road network = heightfield corridors only (smooth asphalt via vertex colors).
// No stacked box-decks. Ramps are short polylines off the main freeways.
// Downtown streets are also heightfield corridors so they look continuous.

const MIN_DRY = 2.5;

/** Sample a point along a polyline (t in [0,1] over total length). */
function pointAlong(pts, t) {
  let total = 0;
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push(len);
    total += len;
  }
  if (total < 1e-3) return { x: pts[0][0], z: pts[0][1], ux: 1, uz: 0, px: 0, pz: 1 };
  let dist = clamp01(t) * total;
  for (let i = 0; i < segs.length; i++) {
    if (dist <= segs[i] || i === segs.length - 1) {
      const a = pts[i];
      const b = pts[i + 1];
      const u = segs[i] > 1e-6 ? dist / segs[i] : 0;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = segs[i] || 1;
      const ux = dx / len;
      const uz = dz / len;
      return {
        x: a[0] + dx * u,
        z: a[1] + dz * u,
        ux,
        uz,
        px: -uz,
        pz: ux,
      };
    }
    dist -= segs[i];
  }
  const last = pts[pts.length - 1];
  return { x: last[0], z: last[1], ux: 1, uz: 0, px: 0, pz: 1 };
}

function clamp01(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Build a curved ramp polyline (quadratic-ish via mid control). */
function rampCurve(ax, az, bx, bz, cx, cz, steps = 5) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const omt = 1 - t;
    // Quadratic Bezier
    pts.push({
      x: omt * omt * ax + 2 * omt * t * bx + t * t * cx,
      z: omt * omt * az + 2 * omt * t * bz + t * t * cz,
    });
  }
  return pts;
}

/**
 * Downtown street grid as heightfield polylines (matches satellite block structure).
 * Must match placeDowntownDistrict layout constants.
 */
export function downtownGridParams(cx = null, cz = null) {
  const by = Object.fromEntries(POIS.map((p) => [p.id, p]));
  const dt = by.downtown;
  const ox = cx ?? dt?.x ?? 140;
  const oz = cz ?? dt?.z ?? 360;
  return {
    cx: ox,
    cz: oz,
    cols: 6,
    rows: 5,
    streetW: 12,
    blockW: 32,
    blockD: 30,
  };
}

export function buildDowntownGridLines(cx, cz) {
  const g = downtownGridParams(cx, cz);
  const stepX = g.blockW + g.streetW;
  const stepZ = g.blockD + g.streetW;
  const originX = g.cx - (g.cols * stepX - g.streetW) / 2;
  const originZ = g.cz - (g.rows * stepZ - g.streetW) / 2;
  const lines = [];

  // N–S avenues
  for (let c = 0; c <= g.cols; c++) {
    const x = originX + c * stepX - g.streetW / 2;
    const z0 = originZ - g.streetW / 2;
    const z1 = originZ + g.rows * stepZ - g.streetW / 2;
    lines.push({
      id: `dt-ns-${c}`,
      width: g.streetW,
      blend: 5,
      kind: 'street',
      pts: [
        { x, z: z0 },
        { x, z: z1 },
      ],
    });
  }
  // E–W streets
  for (let r = 0; r <= g.rows; r++) {
    const z = originZ + r * stepZ - g.streetW / 2;
    const x0 = originX - g.streetW / 2;
    const x1 = originX + g.cols * stepX - g.streetW / 2;
    lines.push({
      id: `dt-ew-${r}`,
      width: g.streetW,
      blend: 5,
      kind: 'street',
      pts: [
        { x: x0, z },
        { x: x1, z },
      ],
    });
  }

  // A few mid-block alleys only (not every third block — that painted lots as asphalt)
  const alleyCells = [[1, 1], [3, 2], [2, 3]];
  for (const [c, r] of alleyCells) {
    const bx = originX + c * stepX;
    const bz = originZ + r * stepZ;
    lines.push({
      id: `dt-alley-${r}-${c}`,
      width: 5,
      blend: 3,
      kind: 'alley',
      pts: [
        { x: bx + g.blockW / 2, z: bz + 2 },
        { x: bx + g.blockW / 2, z: bz + g.blockD - 2 },
      ],
    });
  }

  return lines;
}

/**
 * Freeways + arterials + on/off ramp stubs that look more like the satellite maps.
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
      kind: 'freeway',
    });

    // On/off ramp pairs along each freeway (map-style exit/entrance curves)
    if (fw.pts.length >= 3 && (fw.width ?? 14) >= 12) {
      const nRamps = Math.min(4, Math.floor((fw.pts.length - 1) / 2));
      for (let r = 0; r < nRamps; r++) {
        const t = (r + 1) / (nRamps + 1);
        const p = pointAlong(fw.pts, t);
        const side = r % 2 === 0 ? 1 : -1;
        const px = p.px * side;
        const pz = p.pz * side;
        // Exit ramp peels off right/left in a curve
        lines.push({
          id: `${fw.id}-exit-${r}`,
          width: 8,
          blend: 12,
          kind: 'ramp',
          pts: rampCurve(
            p.x - p.ux * 20,
            p.z - p.uz * 20,
            p.x + px * 18 + p.ux * 8,
            p.z + pz * 18 + p.uz * 8,
            p.x + px * 48 + p.ux * 55,
            p.z + pz * 48 + p.uz * 55,
            6
          ),
        });
        // Entrance ramp merges back
        lines.push({
          id: `${fw.id}-ent-${r}`,
          width: 8,
          blend: 12,
          kind: 'ramp',
          pts: rampCurve(
            p.x + px * 50 - p.ux * 40,
            p.z + pz * 50 - p.uz * 40,
            p.x + px * 28 + p.ux * 5,
            p.z + pz * 28 + p.uz * 5,
            p.x + p.ux * 25,
            p.z + p.uz * 25,
            6
          ),
        });
      }
    }
  }

  // Arterials between POIs — multi-bend toward dry land
  for (const [a, b] of ROAD_LINKS) {
    const A = by[a];
    const B = by[b];
    if (!A || !B) continue;
    const dx = B.x - A.x;
    const dz = B.z - A.z;
    const len = Math.hypot(dx, dz);
    const pts = [{ x: A.x, z: A.z }];
    if (len > 120) {
      const px = -dz / len;
      const pz = dx / len;
      // Prefer inland (east) offset when mid is near coast
      const mx = (A.x + B.x) / 2;
      const mz = (A.z + B.z) / 2;
      const sign = mx < 40 ? 1 : mx > 200 ? -0.4 : 0.2;
      const off = Math.min(70, len * 0.12);
      if (len > 280) {
        pts.push({
          x: A.x + dx * 0.33 + px * off * sign * 0.7,
          z: A.z + dz * 0.33 + pz * off * sign * 0.7,
        });
        pts.push({
          x: A.x + dx * 0.66 - px * off * sign * 0.5,
          z: A.z + dz * 0.66 - pz * off * sign * 0.5,
        });
      } else {
        pts.push({ x: mx + px * off * sign, z: mz + pz * off * sign });
      }
    }
    pts.push({ x: B.x, z: B.z });
    lines.push({
      id: `link-${a}-${b}`,
      width: ROADS.WIDTH,
      blend: ROADS.BLEND,
      kind: 'arterial',
      pts,
    });
  }

  // Downtown ring arterial — outer circulation only (grid fills the interior)
  const dt = by.downtown;
  if (dt) {
    const hw = 160;
    const hd = 140;
    lines.push({
      id: 'downtown-ring',
      width: 14,
      blend: 10,
      kind: 'arterial',
      pts: [
        { x: dt.x - hw, z: dt.z - hd },
        { x: dt.x + hw, z: dt.z - hd },
        { x: dt.x + hw, z: dt.z + hd },
        { x: dt.x - hw, z: dt.z + hd },
        { x: dt.x - hw, z: dt.z - hd },
      ],
    });
  }

  // Full downtown grid as smooth heightfield streets (avenues + streets)
  lines.push(...buildDowntownGridLines());

  return lines;
}

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
        kind: line.kind,
      });
    }
  }
  return segs;
}

/**
 * Reserve road corridors in occupancy so buildings never spawn on pavement.
 * Pad is tight on city streets so block interiors stay free for towers.
 */
export function claimRoadCorridors(occ, lines) {
  let n = 0;
  for (const line of lines) {
    // Street grid needs a narrow claim — wide pads blanketed all of downtown.
    const pad =
      line.kind === 'street' || line.kind === 'alley' ? 1.2
        : line.kind === 'ramp' ? 2.0
          : line.kind === 'arterial' ? 2.5
            : 3.5; // freeway
    const halfW = (line.width ?? ROADS.WIDTH) * 0.5 + pad;
    const step = line.kind === 'street' || line.kind === 'alley' ? 10 : 12;
    for (let i = 0; i < line.pts.length - 1; i++) {
      const a = line.pts[i];
      const b = line.pts[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 1) continue;
      const steps = Math.ceil(len / step);
      for (let s = 0; s < steps; s++) {
        const t = (s + 0.5) / steps;
        const cx = a.x + dx * t;
        const cz = a.z + dz * t;
        const w = halfW * 2;
        // Force-claim: push rect even if overlapping other roads
        occ.claim(cx - halfW, cz - halfW, w, w, 0, true);
        n++;
      }
    }
  }
  return n;
}

/**
 * Parking lot footprint (world AABB).
 */
export function parkingLotFootprint(cx, cz, w, d) {
  return { x: cx - w / 2, z: cz - d / 2, w, d };
}

/**
 * Stamp rectangular parking lots into terrain roadMask / heights.
 */
export function stampParkingLots(terrain, lots) {
  let n = 0;
  const minH = ROADS.MIN_HEIGHT ?? 2.5;
  for (const lot of lots) {
    const x0 = lot.x;
    const z0 = lot.z;
    const x1 = lot.x + lot.w;
    const z1 = lot.z + lot.d;
    let sum = 0;
    let cnt = 0;
    for (let z = z0; z <= z1; z += terrain.cell) {
      for (let x = x0; x <= x1; x += terrain.cell) {
        const h = terrain.heightAt(x, z);
        if (h >= minH) {
          sum += h;
          cnt++;
        }
      }
    }
    if (cnt < 4) continue;
    const target = Math.max(minH, sum / cnt);
    const minIX = Math.max(0, Math.floor((x0 + terrain.half) / terrain.cell));
    const maxIX = Math.min(terrain.n - 1, Math.ceil((x1 + terrain.half) / terrain.cell));
    const minIZ = Math.max(0, Math.floor((z0 + terrain.half) / terrain.cell));
    const maxIZ = Math.min(terrain.n - 1, Math.ceil((z1 + terrain.half) / terrain.cell));
    for (let iz = minIZ; iz <= maxIZ; iz++) {
      for (let ix = minIX; ix <= maxIX; ix++) {
        const i = terrain.idx(ix, iz);
        terrain.heights[i] = target;
        terrain.roadMask[i] = 1;
      }
    }
    n++;
  }
  return n;
}

/**
 * Default parking lots near major anchors + downtown fringe.
 */
export function defaultParkingLots() {
  const by = Object.fromEntries(POIS.map((p) => [p.id, p]));
  const lots = [];
  const add = (id, ox, oz, w, d) => {
    const p = by[id];
    if (!p) return;
    lots.push(parkingLotFootprint(p.x + ox, p.z + oz, w, d));
  };
  // Downtown fringe lots — well outside the skyline grid (no buildings on asphalt)
  // Grid spans roughly x 14–266, z 261–459. Keep lots outside that core.
  add('downtown', -160, -30, 40, 32);   // west of plate
  add('downtown', 130, -120, 44, 36);  // north-east of plate
  add('downtown', 120, 200, 40, 32);   // south-east (was under ~164,489)
  add('downtown', -40, -140, 42, 34);  // north of plate
  add('downtown', 160, 40, 40, 30);    // far east
  // Airport long term
  add('airport', 40, -40, 80, 45);
  add('airport', -30, 50, 60, 40);
  // Kearny mesa strip malls
  add('kearnymesa', 50, 30, 55, 45);
  add('kearnymesa', -60, -20, 50, 40);
  // Mission Valley mall
  add('missionvalley', 70, -30, 70, 50);
  add('missionvalley', -80, 20, 55, 40);
  // Balboa / Zoo
  add('balboa', 40, 50, 40, 35);
  add('zoo', -30, 40, 45, 40);
  // MCRD / Coronado
  add('mcrd', 50, 40, 40, 35);
  add('coronado', 40, -25, 50, 35);
  // La Jolla
  add('lajolla', 30, 25, 40, 32);

  // Surface lots only on the plate rim — NOT under tower blocks / waterfront hotels
  const g = downtownGridParams();
  // Far west rim (was under building ~30,405 — moved further west)
  lots.push(parkingLotFootprint(g.cx - 200, g.cz + 20, 40, 36));
  // Far east rim
  lots.push(parkingLotFootprint(g.cx + 200, g.cz - 10, 44, 40));
  // North rim
  lots.push(parkingLotFootprint(g.cx + 20, g.cz - 190, 50, 34));
  // South rim — was (cx+40, cz+165) under ~164,489 / floating pad ~186,548
  lots.push(parkingLotFootprint(g.cx + 100, g.cz + 210, 48, 34));
  // Interior lots matching placeDowntownDistrict parkingBlocks 0,0 and 5,4 only
  const stepX = g.blockW + g.streetW;
  const stepZ = g.blockD + g.streetW;
  const originX = g.cx - (g.cols * stepX - g.streetW) / 2;
  const originZ = g.cz - (g.rows * stepZ - g.streetW) / 2;
  for (const [c, r] of [[0, 0], [5, 4]]) {
    lots.push({
      x: originX + c * stepX + 3,
      z: originZ + r * stepZ + 3,
      w: g.blockW - 6,
      d: g.blockD - 6,
    });
  }
  return lots;
}

/**
 * Visual parking detail: white stall lines, low curbs, a few cars.
 * `occ` optional Occupancy — cars never spawn inside claimed building footprints.
 */
export function placeParkingLotDetails(sink, terrain, lots, rng, placeVehicleFn, occ = null) {
  let n = 0;
  for (const lot of lots) {
    const h = terrain.heightAt(lot.x + lot.w / 2, lot.z + lot.d / 2);
    if (h < MIN_DRY) continue;
    const y = h + 0.02;
    const curb = 0.35;
    const ch = 0.22;
    sink.addSpan(lot.x, y, lot.z, lot.x + lot.w, y + ch, lot.z + curb, 0xb0aea8, 'thin');
    sink.addSpan(lot.x, y, lot.z + lot.d - curb, lot.x + lot.w, y + ch, lot.z + lot.d, 0xb0aea8, 'thin');
    sink.addSpan(lot.x, y, lot.z, lot.x + curb, y + ch, lot.z + lot.d, 0xb0aea8, 'thin');
    sink.addSpan(lot.x + lot.w - curb, y, lot.z, lot.x + lot.w, y + ch, lot.z + lot.d, 0xb0aea8, 'thin');

    // Stalls: depth along Z (drive-in from aisle), width along X
    // Cars must face into the stall (length along Z) — not perpendicular
    const stallW = 2.8;
    const stallD = 5.5;
    const cols = Math.min(12, Math.floor((lot.w - 2) / stallW));
    const rows = Math.min(6, Math.floor((lot.d - 2) / (stallD + 1.5)));
    let cars = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sx = lot.x + 1.2 + c * stallW;
        const sz = lot.z + 1.2 + r * (stallD + 1.5);
        // Stall paint: long edge along Z (depth), thin marker on the left
        sink.addSpan(sx, y + 0.01, sz, sx + 0.08, y + 0.04, sz + stallD, 0xe8e6e0, 'thin');
        sink.addSpan(sx + stallW - 0.12, y + 0.01, sz, sx + stallW - 0.04, y + 0.04, sz + stallD, 0xe8e6e0, 'thin');
        if (!placeVehicleFn || cars >= 8 || rng() <= 0.55) continue;
        // Car footprint ~2.0 x 5.0 when oriented along Z
        const vw = 2.2;
        const vd = 5.0;
        if (occ && occ.blocked(sx + 0.2, sz + 0.2, sx + 0.2 + vw, sz + 0.2 + vd)) continue;
        // alongZ=true so nose points along the stall (matches paint)
        placeVehicleFn(sink, sx + 0.35, sz + 0.25, y, rng, null, true);
        if (occ) occ.claim(sx + 0.2, sz + 0.2, vw, vd, 0.4);
        cars++;
      }
    }
    n++;
  }
  return n;
}

/**
 * Downtown-only sidewalks + curbs. Axis-aligned continuous slabs along each
 * block face — never through intersections, no freeways, no scattered paint.
 */
export function placeRoadMarkings(sink, terrain, _lines) {
  if (!sink || !terrain) return 0;
  const g = downtownGridParams();
  const stepX = g.blockW + g.streetW;
  const stepZ = g.blockD + g.streetW;
  const originX = g.cx - (g.cols * stepX - g.streetW) / 2;
  const originZ = g.cz - (g.rows * stepZ - g.streetW) / 2;
  const halfW = g.streetW * 0.5;
  const sw = 1.65; // sidewalk width
  const curbT = 0.22;
  const curbH = 0.12;
  const CURB = 0xb0aea8;
  const SIDEWALK = 0xc4c2bc;
  let n = 0;

  const slabY = (x0, z0, x1, z1) => {
    const h = terrain.heightAt((x0 + x1) * 0.5, (z0 + z1) * 0.5);
    return Number.isFinite(h) && h >= MIN_DRY ? h + 0.02 : null;
  };

  // N–S avenues: sidewalks only along block faces (gap at E–W streets)
  for (let c = 0; c <= g.cols; c++) {
    const roadX = originX + c * stepX - halfW; // centerline of street strip
    for (let r = 0; r < g.rows; r++) {
      const z0 = originZ + r * stepZ + 0.4; // inset from south intersection
      const z1 = originZ + r * stepZ + g.blockD - 0.4; // inset from north intersection
      if (z1 <= z0 + 1) continue;

      // West sidewalk (skip exterior outer ring slightly optional — keep all)
      {
        const x1 = roadX - halfW;
        const x0 = x1 - sw;
        const y = slabY(x0, z0, x1, z1);
        if (y != null) {
          sink.addSpan(x0, y, z0, x1, y + 0.07, z1, SIDEWALK, 'thin');
          sink.addSpan(x1 - curbT, y, z0, x1 + 0.02, y + curbH, z1, CURB, 'thin');
          n += 2;
        }
      }
      // East sidewalk
      {
        const x0 = roadX + halfW;
        const x1 = x0 + sw;
        const y = slabY(x0, z0, x1, z1);
        if (y != null) {
          sink.addSpan(x0, y, z0, x1, y + 0.07, z1, SIDEWALK, 'thin');
          sink.addSpan(x0 - 0.02, y, z0, x0 + curbT, y + curbH, z1, CURB, 'thin');
          n += 2;
        }
      }
    }
  }

  // E–W streets: sidewalks only along block faces (gap at N–S avenues)
  for (let r = 0; r <= g.rows; r++) {
    const roadZ = originZ + r * stepZ - halfW;
    for (let c = 0; c < g.cols; c++) {
      const x0 = originX + c * stepX + 0.4;
      const x1 = originX + c * stepX + g.blockW - 0.4;
      if (x1 <= x0 + 1) continue;

      // South sidewalk
      {
        const z1 = roadZ - halfW;
        const z0 = z1 - sw;
        const y = slabY(x0, z0, x1, z1);
        if (y != null) {
          sink.addSpan(x0, y, z0, x1, y + 0.07, z1, SIDEWALK, 'thin');
          sink.addSpan(x0, y, z1 - curbT, x1, y + curbH, z1 + 0.02, CURB, 'thin');
          n += 2;
        }
      }
      // North sidewalk
      {
        const z0 = roadZ + halfW;
        const z1 = z0 + sw;
        const y = slabY(x0, z0, x1, z1);
        if (y != null) {
          sink.addSpan(x0, y, z0, x1, y + 0.07, z1, SIDEWALK, 'thin');
          sink.addSpan(x0, y, z0 - 0.02, x1, y + curbH, z0 + curbT, CURB, 'thin');
          n += 2;
        }
      }
    }
  }

  return n;
}

// Kept for API compat — no mesh decks (were the floating yellow squares).
export function layRoadDecks() {
  return 0;
}
