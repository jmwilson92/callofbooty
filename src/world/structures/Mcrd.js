import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed } from '../BuildingKit.js';
import { registerBuilding } from '../BuildingRegistry.js';
import { mcrdPlan } from '../McrdPlan.js';
import { C, footprintHeights, addBuildingAccess } from './Catalog.js';

// Marine Corps Recruit Depot San Diego.
//
// Bertram Goodhue's 1921 plan is a Spanish Colonial Revival campus — cream
// stucco, red clay tile, continuous arcades — arranged around one enormous
// parade deck. The deck is the organising idea: barracks front it from the
// north, support buildings from the south, and the command building closes its
// west head. Everything here follows that, at roughly half real scale.
//
// The deck itself is paved by Terrain (see `paradeDeck`); this module only adds
// the paint on top of it.

const STUCCO = [0xe8dfd0, 0xdfd3bd, 0xd8c9ac];
const TILE = 0xb5643c;
const TILE_DARK = 0x9a5232;
const TRIM = 0xc8bda6;
const PAINT_WHITE = 0xf4f2ea;
const PAINT_YELLOW = 0xf0c020;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

/** Seat height for a footprint, or null if the pad is unusable there. */
function seat(terrain, x, z, w, d, minDry = 2.5) {
  const fh = footprintHeights(terrain, x, z, w, d);
  if (!Number.isFinite(fh.max) || fh.max < minDry) return null;
  return fh.max;
}

/** Overhanging clay-tile roof: two shallow steps read as a hipped roof. */
function tileRoof(sink, x, z, w, d, y, over = 0.9) {
  sink.addSpan(x - over, y, z - over, x + w + over, y + 0.45, z + d + over, TILE);
  sink.addSpan(
    x + w * 0.12, y + 0.45, z + d * 0.12,
    x + w * 0.88, y + 1.15, z + d * 0.88,
    TILE_DARK
  );
}

/**
 * The signature element: a covered arcade along one face. `facing` is the side
 * the colonnade stands on — 'n', 's', 'e' or 'w'.
 */
function arcade(sink, x, z, w, d, baseY, facing, depth = 3.0) {
  const H = 3.3;
  const pierS = 0.5;
  const alongX = facing === 'n' || facing === 's';
  const runLen = alongX ? w : d;
  const gaps = Math.max(2, Math.round(runLen / 4.2));
  const pitch = runLen / gaps;

  // Outer edge of the walkway
  let ox0; let oz0; let ox1; let oz1;
  if (facing === 'n') { ox0 = x; oz0 = z - depth; ox1 = x + w; oz1 = z; }
  else if (facing === 's') { ox0 = x; oz0 = z + d; ox1 = x + w; oz1 = z + d + depth; }
  else if (facing === 'w') { ox0 = x - depth; oz0 = z; ox1 = x; oz1 = z + d; }
  else { ox0 = x + w; oz0 = z; ox1 = x + w + depth; oz1 = z + d; }

  // Walkway slab
  sink.addSpan(ox0, baseY, oz0, ox1, baseY + 0.14, oz1, TRIM, 'thin');

  // Piers along the outer edge
  for (let i = 0; i <= gaps; i++) {
    const t = i * pitch;
    const px = alongX ? x + t - pierS / 2 : (facing === 'w' ? ox0 : ox1 - pierS);
    const pz = alongX ? (facing === 'n' ? oz0 : oz1 - pierS) : z + t - pierS / 2;
    post(sink, px, baseY + 0.14, pz, H, pierS, STUCCO[0]);
  }
  // Spandrel beam capping the piers — the arches, blocked out
  const bY = baseY + 0.14 + H;
  if (alongX) {
    const bz = facing === 'n' ? oz0 : oz1 - 0.55;
    sink.addSpan(ox0, bY - 0.55, bz, ox1, bY + 0.5, bz + 0.55, STUCCO[0]);
    sink.addSpan(ox0, bY + 0.5, oz0, ox1, bY + 0.85, oz1, TILE);
  } else {
    const bx = facing === 'w' ? ox0 : ox1 - 0.55;
    sink.addSpan(bx, bY - 0.55, oz0, bx + 0.55, bY + 0.5, oz1, STUCCO[0]);
    sink.addSpan(ox0, bY + 0.5, oz0, ox1, bY + 0.85, oz1, TILE);
  }
}

/** A palm, blocked out — they line the deck on the real depot. */
function palm(sink, x, z, y, rng) {
  const h = 6 + rng() * 3.5;
  post(sink, x, y, z, h, 0.42, 0x7a6a4a);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rng() * 0.4;
    const dx = Math.cos(a) * 2.2;
    const dz = Math.sin(a) * 2.2;
    sink.addSpan(
      Math.min(x, x + dx), y + h - 0.3, Math.min(z, z + dz),
      Math.max(x + 0.45, x + dx), y + h + 0.25, Math.max(z + 0.45, z + dz),
      0x4a7a38, 'thin'
    );
  }
}

/** Two-storey squad bay with an arcade onto the deck. */
function barracksBlock(sink, terrain, r, rng, stats) {
  const s = seat(terrain, r.x, r.z, r.w, r.d);
  if (s == null) return;
  const floors = 2;
  const baseY = s - 0.05;
  makeBuilding(sink, {
    x: r.x, z: r.z, w: r.w, d: r.d, floors,
    baseY, color: pick(rng, STUCCO), rng,
  });
  addBuildingAccess(
    sink, r.x, r.z, r.w, r.d, baseY, floors,
    BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false
  );
  arcade(sink, r.x, r.z, r.w, r.d, baseY, 's');
  const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  tileRoof(sink, r.x, r.z, r.w, r.d, roofY);
  stats.buildings++;
}

/** Command building closing the west head of the deck, with the landmark tower. */
function commandBuilding(sink, terrain, c, rng, stats) {
  const s = seat(terrain, c.x, c.z, c.w, c.d);
  if (s == null) return;
  const baseY = s - 0.05;
  makeBuilding(sink, {
    x: c.x, z: c.z, w: c.w, d: c.d, floors: c.floors,
    baseY, color: STUCCO[0], rng,
  });
  addBuildingAccess(
    sink, c.x, c.z, c.w, c.d, baseY, c.floors,
    BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false
  );
  arcade(sink, c.x, c.z, c.w, c.d, baseY, 'e', 3.4);
  const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (c.floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  tileRoof(sink, c.x, c.z, c.w, c.d, roofY);

  // Tower over the centre of the block
  const tw = 11;
  const tx = c.x + (c.w - tw) / 2;
  const tz = c.z + (c.d - tw) / 2;
  const tTop = roofY + c.towerH;
  sink.addSpan(tx, roofY, tz, tx + tw, tTop, tz + tw, STUCCO[0]);
  // Belfry openings on each face
  for (const [ax, az, bx, bz] of [
    [tx + 2.5, tz - 0.15, tx + tw - 2.5, tz + 0.4],
    [tx + 2.5, tz + tw - 0.4, tx + tw - 2.5, tz + 0.15 + tw],
    [tx - 0.15, tz + 2.5, tx + 0.4, tz + tw - 2.5],
    [tx + tw - 0.4, tz + 2.5, tx + 0.15 + tw, tz + tw - 2.5],
  ]) {
    sink.addSpan(ax, tTop - 5.2, az, bx, tTop - 1.6, bz, C.glassDark, 'glass');
  }
  tileRoof(sink, tx, tz, tw, tw, tTop, 1.1);
  post(sink, tx + tw / 2 - 0.2, tTop + 1.2, tz + tw / 2 - 0.2, 3.2, 0.4, C.metalLite);
  stats.buildings++;
}

/** Mess hall, chapel and museum along the south side of the deck. */
function southRow(sink, terrain, plan, rng, stats) {
  for (const b of plan.south) {
    const s = seat(terrain, b.x, b.z, b.w, b.d);
    if (s == null) continue;
    const baseY = s - 0.05;
    if (b.id === 'messhall') {
      // Big open hall — no floor plates to chop the interior up
      const shed = makeShed(sink, {
        x: b.x, z: b.z, w: b.w, d: b.d, h: 7.5,
        baseY: s, color: STUCCO[1], doorW: 5,
      });
      registerBuilding({
        x: b.x, z: b.z, w: b.w, d: b.d, floors: 1, baseY: s,
        floorYs: [s + 0.2], roofY: shed.roofY,
      });
      tileRoof(sink, b.x, b.z, b.w, b.d, s + 7.5);
      arcade(sink, b.x, b.z, b.w, b.d, baseY, 'n');
    } else {
      makeBuilding(sink, {
        x: b.x, z: b.z, w: b.w, d: b.d, floors: b.floors,
        baseY, color: pick(rng, STUCCO), rng,
      });
      addBuildingAccess(
        sink, b.x, b.z, b.w, b.d, baseY, b.floors,
        BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false
      );
      arcade(sink, b.x, b.z, b.w, b.d, baseY, 'n');
      const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (b.floors - 1) * BUILDINGS.FLOOR_HEIGHT;
      tileRoof(sink, b.x, b.z, b.w, b.d, roofY);
      if (b.id === 'chapel') {
        // Bell tower on the west end
        const tw = 6.5;
        const tx = b.x + 2;
        const tz = b.z + (b.d - tw) / 2;
        const tTop = roofY + 11;
        sink.addSpan(tx, roofY, tz, tx + tw, tTop, tz + tw, STUCCO[0]);
        sink.addSpan(tx + 1.4, tTop - 3.6, tz - 0.15, tx + tw - 1.4, tTop - 1.2, tz + 0.35, C.glassDark, 'glass');
        tileRoof(sink, tx, tz, tw, tw, tTop, 0.8);
        // Cross
        post(sink, tx + tw / 2 - 0.15, tTop + 1.3, tz + tw / 2 - 0.15, 2.2, 0.3, TRIM);
        sink.addSpan(tx + tw / 2 - 0.7, tTop + 2.6, tz + tw / 2 - 0.12, tx + tw / 2 + 0.85, tTop + 2.9, tz + tw / 2 + 0.18, TRIM);
      }
    }
    stats.buildings++;
  }
}

/** Formation paint on the grinder, plus the yellow footprints at receiving. */
function paradeMarkings(sink, terrain, p) {
  const y = (terrain.heightAt(p.x + p.w / 2, p.z + p.d / 2) ?? 0) + 0.03;
  const line = (x0, z0, x1, z1, col) => sink.addSpan(x0, y, z0, x1, y + 0.04, z1, col, 'thin');

  // Long centre line + edge lines
  line(p.x + 4, p.z + p.d / 2 - 0.12, p.x + p.w - 4, p.z + p.d / 2 + 0.12, PAINT_WHITE);
  line(p.x + 4, p.z + 1.6, p.x + p.w - 4, p.z + 1.9, PAINT_WHITE);
  line(p.x + 4, p.z + p.d - 1.9, p.x + p.w - 4, p.z + p.d - 1.6, PAINT_WHITE);
  // Formation guide ticks
  const ticks = Math.floor(p.w / 16);
  for (let i = 1; i < ticks; i++) {
    const lx = p.x + (p.w * i) / ticks;
    line(lx - 0.12, p.z + 3, lx + 0.12, p.z + p.d - 3, PAINT_WHITE);
  }

  // The yellow footprints — four ranks of pairs, where recruits first fall in
  const fx = p.x + 8;
  const fz = p.z + p.d * 0.5 - 5.5;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const bx = fx + col * 1.9;
      const bz = fz + row * 2.6;
      // A pair of boots, heels together, toes out at 45°
      sink.addSpan(bx, y, bz, bx + 0.28, y + 0.05, bz + 0.72, PAINT_YELLOW, 'thin');
      sink.addSpan(bx + 0.42, y, bz, bx + 0.7, y + 0.05, bz + 0.72, PAINT_YELLOW, 'thin');
    }
  }
}

/** Flagpole and reviewing stand at the head of the deck. */
function flagAndStand(sink, terrain, plan) {
  const p = plan.parade;
  const fx = p.x + 6;
  const fz = p.z + p.d + 4;
  const y = seat(terrain, fx - 1, fz - 1, 3, 3);
  if (y != null) {
    post(sink, fx, y, fz, 17, 0.34, TRIM);
    sink.addSpan(fx - 1.2, y, fz - 1.2, fx + 1.6, y + 0.4, fz + 1.6, C.concrete);
    sink.addSpan(fx + 0.34, y + 13.4, fz + 0.05, fx + 4.2, y + 16.4, fz + 0.25, 0xc0392b, 'thin');
  }
  // Reviewing stand facing the deck
  const sx = p.x + p.w * 0.5 - 7;
  const sz = p.z + p.d + 2.5;
  const sy = seat(terrain, sx, sz, 14, 5);
  if (sy == null) return;
  for (let i = 0; i < 3; i++) {
    sink.addSpan(sx, sy + i * 0.45, sz + i * 1.1, sx + 14, sy + (i + 1) * 0.45, sz + (i + 1) * 1.1, C.concrete);
  }
  sink.addSpan(sx - 0.4, sy, sz - 0.4, sx + 0.4, sy + 2.6, sz + 3.6, TRIM);
  sink.addSpan(sx + 13.6, sy, sz - 0.4, sx + 14.4, sy + 2.6, sz + 3.6, TRIM);
}

/** Water tower — the other silhouette you can see the depot by. */
function waterTower(sink, terrain, x, z) {
  const y = seat(terrain, x - 4, z - 4, 8, 8);
  if (y == null) return;
  const legH = 15;
  for (const [dx, dz] of [[-3.2, -3.2], [2.8, -3.2], [-3.2, 2.8], [2.8, 2.8]]) {
    post(sink, x + dx, y, z + dz, legH, 0.4, C.metal);
  }
  // Cross bracing
  sink.addSpan(x - 3.2, y + legH * 0.55, z - 3.2, x + 3.2, y + legH * 0.55 + 0.25, z + 3.2, C.metal, 'thin');
  sink.addSpan(x - 4.2, y + legH, z - 4.2, x + 4.6, y + legH + 5.5, z + 4.6, 0xc8ccd0);
  sink.addSpan(x - 3.2, y + legH + 5.5, z - 3.2, x + 3.6, y + legH + 6.8, z + 3.6, 0xc8ccd0);
  post(sink, x, y + legH + 6.8, z, 2.4, 0.3, C.metalLite);
}

/**
 * Confidence course: the obstacle run down the open east field. Laid out along
 * the field's long (north–south) axis, so it reads as a lane you run.
 */
function confidenceCourse(sink, terrain, f, stats) {
  const y0 = seat(terrain, f.x, f.z, f.w, f.d);
  if (y0 == null) return;
  const cx = f.x + 4;         // west edge of the lane
  const laneW = Math.min(20, f.w - 8);
  let v = f.z + 4;            // walk south down the field

  // Stepped wall climbs
  for (let i = 0; i < 3; i++) {
    const h = 1.8 + i * 0.7;
    sink.addSpan(cx, y0, v, cx + laneW, y0 + h, v + 0.5, C.wood);
    v += 6;
  }
  // Log balance beams
  for (let i = 0; i < 3; i++) {
    const bx = cx + i * 3.4;
    sink.addSpan(bx, y0 + 0.55, v, bx + 0.55, y0 + 1.0, v + 12, 0x8a6a44);
    post(sink, bx, y0, v, 0.6, 0.32, C.woodDark);
    post(sink, bx, y0, v + 11.6, 0.6, 0.32, C.woodDark);
  }
  v += 15;
  // Cargo-net / monkey-bar frame
  const frameH = 5.5;
  for (const dx of [0, laneW - 0.45]) {
    post(sink, cx + dx, y0, v, frameH, 0.45, C.woodDark);
    post(sink, cx + dx, y0, v + 10, frameH, 0.45, C.woodDark);
  }
  sink.addSpan(cx, y0 + frameH, v, cx + laneW, y0 + frameH + 0.45, v + 10.45, C.woodDark);
  for (let i = 1; i < 7; i++) {
    const rx = cx + (laneW * i) / 7;
    sink.addSpan(rx, y0 + frameH - 0.35, v + 0.45, rx + 0.18, y0 + frameH, v + 10, C.metal, 'thin');
  }
  v += 14;
  // Low crawl pipes
  for (let i = 0; i < 4; i++) {
    sink.addSpan(cx + 1, y0, v + i * 2.4, cx + laneW - 1, y0 + 0.9, v + i * 2.4 + 1.3, C.metal);
  }
  stats.obstacles++;
}

/** Rappel tower — high ground on the field, and a genuine drop route. */
function rappelTower(sink, terrain, x, z, stats) {
  const w = 9;
  const d = 7;
  const y = seat(terrain, x, z, w, d);
  if (y == null) return;
  const H = 17;
  // Three solid faces, open on the west so the deck side is the drop face
  sink.addSpan(x, y, z, x + w, y + H, z + 0.5, C.concrete);
  sink.addSpan(x, y, z + d - 0.5, x + w, y + H, z + d, C.concrete);
  sink.addSpan(x + w - 0.5, y, z, x + w, y + H, z + d, C.concrete);
  // Platforms
  for (let i = 1; i <= 3; i++) {
    const py = y + (H * i) / 3.4;
    sink.addSpan(x + 0.3, py, z + 0.4, x + w - 0.6, py + 0.28, z + d - 0.4, C.concrete);
  }
  // Top deck + parapet + rappel anchors
  sink.addSpan(x, y + H, z, x + w, y + H + 0.3, z + d, C.concrete);
  sink.addSpan(x, y + H + 0.3, z, x + 0.35, y + H + 1.2, z + d, C.concrete, 'thin');
  sink.addSpan(x + w - 0.35, y + H + 0.3, z, x + w, y + H + 1.2, z + d, C.concrete, 'thin');
  for (const dz of [1.6, d - 1.9]) {
    post(sink, x + 0.6, y + H + 0.3, z + dz, 1.5, 0.24, C.metalLite);
  }
  stats.obstacles++;
}

/** Perimeter fence with the main gate on the south side. */
function perimeter(sink, terrain, plan) {
  const { bounds, gate } = plan;
  const H = 2.3;
  const COL = 0x8d8b84;
  const run = (x0, z0, x1, z1, skip) => {
    const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    const len = alongX ? x1 - x0 : z1 - z0;
    const n = Math.max(2, Math.round(len / 6));
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const ax = alongX ? x0 + len * t0 : x0;
      const az = alongX ? z0 : z0 + len * t0;
      const bx = alongX ? x0 + len * t1 : x1;
      const bz = alongX ? z1 : z0 + len * t1;
      const mx = (ax + bx) / 2;
      const mz = (az + bz) / 2;
      if (skip && Math.hypot(mx - skip.x, mz - skip.z) < skip.r) continue;
      const y = terrain.heightAt(mx, mz);
      if (!Number.isFinite(y) || y < 2.5) continue;
      sink.addSpan(
        Math.min(ax, bx), y, Math.min(az, bz),
        Math.max(ax + 0.25, bx), y + H, Math.max(az + 0.25, bz),
        COL, 'thin'
      );
    }
  };
  run(bounds.x0, bounds.z0, bounds.x1, bounds.z0);
  run(bounds.x0, bounds.z1, bounds.x1, bounds.z1, { x: gate.x, z: gate.z, r: 9 });
  run(bounds.x0, bounds.z0, bounds.x0, bounds.z1);
  run(bounds.x1, bounds.z0, bounds.x1, bounds.z1);

  // Gate piers + sign board
  const gy = terrain.heightAt(gate.x, gate.z);
  if (!Number.isFinite(gy) || gy < 2.5) return;
  for (const dx of [-7, 5.2]) {
    sink.addSpan(gate.x + dx, gy, gate.z - 1, gate.x + dx + 1.8, gy + 4.6, gate.z + 0.8, STUCCO[0]);
    sink.addSpan(gate.x + dx - 0.3, gy + 4.6, gate.z - 1.3, gate.x + dx + 2.1, gy + 5.2, gate.z + 1.1, TILE);
  }
  sink.addSpan(gate.x - 6, gy + 5.2, gate.z - 0.5, gate.x + 6.2, gy + 6.6, gate.z + 0.3, STUCCO[1]);
  sink.addSpan(gate.x - 5.2, gy + 5.5, gate.z - 0.7, gate.x + 5.4, gy + 6.3, gate.z - 0.45, 0xc0392b, 'thin');
}

/**
 * Build the whole depot. Terrain has already levelled the pad and paved the
 * parade deck; this lays out the campus on top.
 */
export function placeMcrdDepot(sink, terrain, rng) {
  const plan = mcrdPlan();
  const stats = { buildings: 0, obstacles: 0 };

  commandBuilding(sink, terrain, plan.command, rng, stats);
  for (const r of plan.barracks) barracksBlock(sink, terrain, r, rng, stats);
  southRow(sink, terrain, plan, rng, stats);
  paradeMarkings(sink, terrain, plan.parade);
  flagAndStand(sink, terrain, plan);

  const f = plan.field;
  confidenceCourse(sink, terrain, f, stats);
  // Rappel tower at the south end of the field, water tower at the north end —
  // both clear of the course lane, both visible over the whole depot.
  rappelTower(sink, terrain, f.x + f.w - 11, f.z + f.d - 14, stats);
  waterTower(sink, terrain, f.x + f.w - 8, f.z + 6);

  // Palms down both long sides of the deck
  const p = plan.parade;
  for (let i = 0; i < 9; i++) {
    const px = p.x + 6 + (i * (p.w - 12)) / 8;
    for (const pz of [p.z - 3.5, p.z + p.d + 3.5]) {
      const y = terrain.heightAt(px, pz);
      if (Number.isFinite(y) && y >= 2.5) palm(sink, px, pz, y, rng);
    }
  }

  perimeter(sink, terrain, plan);
  return stats;
}
