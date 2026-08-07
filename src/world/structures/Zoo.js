import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed } from '../BuildingKit.js';
import { registerBuilding } from '../BuildingRegistry.js';
import { C, footprintHeights, addBuildingAccess, placeAnimal } from './Catalog.js';

// San Diego Zoo, Balboa Park.
//
// The zoo is built into canyons, which is the whole reason it looks the way it
// does: exhibits are terraced into the hillsides, paths switch back along the
// contours, and the Skyfari gondola crosses the canyon overhead because walking
// it end to end is a climb. So this POI is deliberately NOT levelled — it takes
// the natural relief (15 m at the west end up to 90 m on the east ridge) and
// terraces into it.
//
// It also pioneered cageless moated enclosures, so habitats here are a viewing
// wall, a moat gap and an inner retaining wall rather than a barred cage.

const STUCCO = 0xe4d9c4;
const ROCK = 0x8a8378;
const ROCK_DK = 0x6a655c;
const MOAT = 0x4a6b58;
const PATH = 0xc9c0ad;
const FOLIAGE = [0x3f7a34, 0x4f8a3a, 0x35682c, 0x5c9440];
const MESH = 0x6e6c68;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

function fh(terrain, x, z, w, d) {
  return footprintHeights(terrain, x, z, w, d);
}

/** A blocked-out tree. The zoo is a botanical garden as much as a zoo. */
function tree(sink, x, z, y, rng, scale = 1) {
  const h = (5 + rng() * 4) * scale;
  post(sink, x, y, z, h * 0.62, 0.45 * scale, 0x6a5238);
  const r = (2.0 + rng() * 1.2) * scale;
  const col = pick(rng, FOLIAGE);
  sink.addSpan(x - r, y + h * 0.55, z - r, x + r, y + h * 0.95, z + r, col);
  sink.addSpan(x - r * 0.6, y + h * 0.9, z - r * 0.6, x + r * 0.6, y + h * 1.15, z + r * 0.6, col);
}

/** Paved walkway segment, laid on whatever the ground is doing. */
function pathRun(sink, terrain, x0, z0, x1, z1, width = 3.4) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  if (len < 1) return;
  const steps = Math.max(2, Math.round(len / 5));
  const half = width / 2;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const ax = x0 + dx * t0;
    const az = z0 + dz * t0;
    const bx = x0 + dx * t1;
    const bz = z0 + dz * t1;
    const mx = (ax + bx) / 2;
    const mz = (az + bz) / 2;
    const y = terrain.heightAt(mx, mz);
    if (!Number.isFinite(y) || y < 2) continue;
    sink.addSpan(
      Math.min(ax, bx) - half, y, Math.min(az, bz) - half,
      Math.max(ax, bx) + half, y + 0.12, Math.max(az, bz) + half,
      PATH, 'thin'
    );
  }
}

/**
 * A moated habitat, terraced into the slope.
 *
 * Outward from the middle: the animals' floor, an inner retaining wall they
 * cannot climb, the moat, then a low viewing wall the public leans on. On a
 * slope the whole pad is cut to the high corner and the retaining wall grows
 * downhill to meet grade, which is exactly what the real terraces do.
 */
function moatedHabitat(sink, terrain, x, z, w, d, rng, opts = {}) {
  const s = fh(terrain, x, z, w, d);
  if (!Number.isFinite(s.max) || s.max < 3) return false;
  const padY = s.max;              // terrace level
  const drop = Math.min(9, Math.max(1.2, padY - s.min));
  const wall = 1.15;               // public-side viewing wall
  const moatW = opts.moatW ?? 3.0;
  const inner = opts.innerH ?? 2.6; // retaining wall the animals face

  // Terrace fill under the pad so it never floats on the downhill side
  sink.addSpan(x, padY - drop - 0.4, z, x + w, padY, z + d, ROCK_DK);

  // Habitat floor
  sink.addSpan(
    x + moatW + 0.9, padY, z + moatW + 0.9,
    x + w - moatW - 0.9, padY + 0.12, z + d - moatW - 0.9,
    opts.floor ?? 0x9a8b63
  );

  // Moat ring — a water gap between the walls
  sink.addSpan(x + 0.7, padY - 1.3, z + 0.7, x + w - 0.7, padY - 0.35, z + d - 0.7, MOAT);
  // Inner retaining wall (animal side)
  const ix0 = x + moatW + 0.5;
  const iz0 = z + moatW + 0.5;
  const ix1 = x + w - moatW - 0.5;
  const iz1 = z + d - moatW - 0.5;
  sink.addSpan(ix0, padY - 1.3, iz0, ix1, padY + inner, iz0 + 0.45, ROCK);
  sink.addSpan(ix0, padY - 1.3, iz1 - 0.45, ix1, padY + inner, iz1, ROCK);
  sink.addSpan(ix0, padY - 1.3, iz0, ix0 + 0.45, padY + inner, iz1, ROCK);
  sink.addSpan(ix1 - 0.45, padY - 1.3, iz0, ix1, padY + inner, iz1, ROCK);

  // Public viewing wall around the outside, with a gap on the path side
  const gap = opts.viewGap ?? 'n';
  const seg = (ax, az, bx, bz) => sink.addSpan(ax, padY, az, bx, padY + wall, bz, STUCCO, 'thin');
  if (gap !== 'n') seg(x, z, x + w, z + 0.4);
  else { seg(x, z, x + w * 0.36, z + 0.4); seg(x + w * 0.64, z, x + w, z + 0.4); }
  if (gap !== 's') seg(x, z + d - 0.4, x + w, z + d);
  else { seg(x, z + d - 0.4, x + w * 0.36, z + d); seg(x + w * 0.64, z + d - 0.4, x + w, z + d); }
  if (gap !== 'w') seg(x, z, x + 0.4, z + d);
  if (gap !== 'e') seg(x + w - 0.4, z, x + w, z + d);

  // Rock outcrops and shade inside the enclosure
  const cx = x + w / 2;
  const cz = z + d / 2;
  for (let i = 0; i < 3; i++) {
    const rx = cx + (rng() - 0.5) * (w - moatW * 4);
    const rz = cz + (rng() - 0.5) * (d - moatW * 4);
    const rw = 2 + rng() * 3.5;
    const rh = 1.5 + rng() * 3;
    sink.addSpan(rx, padY, rz, rx + rw, padY + rh, rz + rw * 0.8, i % 2 ? ROCK : ROCK_DK);
  }
  if (opts.shelter !== false) {
    const sw = Math.min(9, w * 0.28);
    makeShed(sink, {
      x: cx - sw / 2, z: z + d - moatW - sw - 2, w: sw, d: sw * 0.75, h: 3.6,
      baseY: padY, color: pick(rng, [0x8a6a44, 0x7a5a3a, STUCCO]), doorW: 2.4,
    });
  }
  // Residents
  const kinds = opts.animals ?? ['large'];
  for (let i = 0; i < (opts.count ?? 2); i++) {
    placeAnimal(
      sink,
      cx + (rng() - 0.5) * (w - moatW * 5),
      cz + (rng() - 0.5) * (d - moatW * 5),
      padY, rng, pick(rng, kinds)
    );
  }
  // Planting around the rim
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rng();
    const tx = cx + Math.cos(a) * (w / 2 + 3.5);
    const tz = cz + Math.sin(a) * (d / 2 + 3.5);
    const ty = terrain.heightAt(tx, tz);
    if (Number.isFinite(ty) && ty > 2) tree(sink, tx, tz, ty, rng);
  }
  return true;
}

/**
 * Walk-through aviary: a tall mesh volume you can actually fight inside.
 * The zoo's Scripps and Owens aviaries are the model — you walk in at the
 * bottom of a canyon and the mesh goes up over the trees.
 */
function aviary(sink, terrain, x, z, w, d, rng) {
  const s = fh(terrain, x, z, w, d);
  if (!Number.isFinite(s.max) || s.max < 3) return false;
  const y = s.max;
  const H = 14;
  sink.addSpan(x, y - Math.min(6, Math.max(1, y - s.min)) - 0.3, z, x + w, y, z + d, ROCK_DK);

  // Corner and mid columns
  const cols = [[0, 0], [w, 0], [0, d], [w, d], [w / 2, 0], [w / 2, d], [0, d / 2], [w, d / 2]];
  for (const [ox, oz] of cols) post(sink, x + ox - 0.3, y, z + oz - 0.3, H, 0.6, MESH);
  // Mesh bands — readable as a cage, cheap in boxes, and see-through
  for (let i = 1; i <= 5; i++) {
    const by = y + (H * i) / 5.5;
    sink.addSpan(x - 0.2, by, z - 0.2, x + w + 0.2, by + 0.16, z + 0.15, MESH, 'thin');
    sink.addSpan(x - 0.2, by, z + d - 0.15, x + w + 0.2, by + 0.16, z + d + 0.2, MESH, 'thin');
    sink.addSpan(x - 0.2, by, z - 0.2, x + 0.15, by + 0.16, z + d + 0.2, MESH, 'thin');
    sink.addSpan(x + w - 0.15, by, z - 0.2, x + w + 0.2, by + 0.16, z + d + 0.2, MESH, 'thin');
  }
  // Roof grid
  for (let i = 0; i <= 4; i++) {
    const gz = z + (d * i) / 4;
    sink.addSpan(x, y + H, gz - 0.12, x + w, y + H + 0.22, gz + 0.12, MESH, 'thin');
  }
  // Entry vestibule on the south face
  const dw = 3.2;
  sink.addSpan(x + w / 2 - dw / 2 - 0.5, y, z + d - 0.2, x + w / 2 + dw / 2 + 0.5, y + 3.4, z + d + 2.4, STUCCO);
  sink.addSpan(x + w / 2 - dw / 2, y, z + d + 0.1, x + w / 2 + dw / 2, y + 2.6, z + d + 2.2, C.dark);

  // Interior: trees, perches, a stream
  for (let i = 0; i < 6; i++) {
    tree(sink, x + 3 + rng() * (w - 6), z + 3 + rng() * (d - 6), y, rng, 1.1);
  }
  sink.addSpan(x + 2, y, z + d * 0.45, x + w - 2, y + 0.1, z + d * 0.55, MOAT, 'thin');
  for (let i = 0; i < 4; i++) {
    const px = x + 4 + rng() * (w - 8);
    const pz = z + 4 + rng() * (d - 8);
    sink.addSpan(px, y + 4 + rng() * 4, pz, px + 3.5, y + 4.3 + rng() * 4, pz + 0.3, 0x6a5238, 'thin');
    placeAnimal(sink, px, pz, y, rng, 'bird');
  }
  return true;
}

/**
 * Skyfari: the aerial gondola. Two terminals with a run of pylons between them,
 * a cable, and cabins hanging off it. It crosses the canyon, so it doubles as
 * the thing you navigate the zoo by from a distance.
 */
function skyfari(sink, terrain, ax, az, bx, bz, rng) {
  const ay = terrain.heightAt(ax, az);
  const by = terrain.heightAt(bx, bz);
  if (!Number.isFinite(ay) || !Number.isFinite(by)) return;
  const TOWER = 0xb04a3a;
  const aTop = ay + 15;
  const bTop = by + 15;

  // Terminals
  for (const [tx, tz, ty] of [[ax, az, ay], [bx, bz, by]]) {
    makeShed(sink, { x: tx - 7, z: tz - 5, w: 14, d: 10, h: 5.5, baseY: ty, color: STUCCO, doorW: 3.5 });
    for (const [ox, oz] of [[-6, -4], [5, -4], [-6, 3], [5, 3]]) {
      post(sink, tx + ox, ty + 5.5, tz + oz, 9.5, 0.5, TOWER);
    }
    sink.addSpan(tx - 6.4, ty + 15, tz - 4.4, tx + 5.9, ty + 15.8, tz + 3.9, TOWER);
  }

  // Pylons + cable, following the ground between the terminals
  const span = Math.hypot(bx - ax, bz - az);
  const n = Math.max(3, Math.round(span / 55));
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = ax + (bx - ax) * t;
    const pz = az + (bz - az) * t;
    const g = terrain.heightAt(px, pz);
    // Cable sags between the two terminal heights
    const cableY = aTop + (bTop - aTop) * t - Math.sin(t * Math.PI) * 3.5;
    if (i > 0 && i < n && Number.isFinite(g)) {
      const h = Math.max(6, cableY - g - 1.2);
      post(sink, px - 0.4, g, pz - 0.4, h, 0.8, TOWER);
      sink.addSpan(px - 2.2, g + h, pz - 0.35, px + 2.6, g + h + 0.7, pz + 0.35, TOWER);
    }
    if (prev) {
      const [qx, qz, qy] = prev;
      sink.addSpan(
        Math.min(qx, px) - 0.12, Math.min(qy, cableY), Math.min(qz, pz) - 0.12,
        Math.max(qx, px) + 0.12, Math.max(qy, cableY) + 0.16, Math.max(qz, pz) + 0.12,
        C.dark, 'thin'
      );
      // A cabin hanging on this stretch
      if (i % 2 === 0) {
        const mx = (qx + px) / 2;
        const mz = (qz + pz) / 2;
        const my = (qy + cableY) / 2;
        sink.addSpan(mx - 0.08, my - 1.6, mz - 0.08, mx + 0.08, my, mz + 0.08, C.dark);
        sink.addSpan(mx - 0.9, my - 3.3, mz - 0.9, mx + 0.9, my - 1.5, mz + 0.9,
          pick(rng, [0xf0b400, 0xd03028, 0x2a6a9a, 0x3a8a2e]));
      }
    }
    prev = [px, pz, cableY];
  }
}

/** Entry plaza: gates, ticket booths, flagpoles. */
function entryPlaza(sink, terrain, x, z, w, d, rng, stats) {
  const s = fh(terrain, x, z, w, d);
  if (!Number.isFinite(s.max) || s.max < 3) return;
  const y = s.max;
  sink.addSpan(x, y - Math.min(4, Math.max(0.6, y - s.min)) - 0.3, z, x + w, y + 0.1, z + d, PATH);

  // Gate arch across the south edge
  const gx = x + w / 2;
  const gz = z + d - 2;
  for (const ox of [-9, 7]) {
    sink.addSpan(gx + ox, y, gz - 1.2, gx + ox + 2, y + 6.5, gz + 1.2, STUCCO);
    sink.addSpan(gx + ox - 0.4, y + 6.5, gz - 1.6, gx + ox + 2.4, y + 7.2, gz + 1.6, 0xb5643c);
  }
  sink.addSpan(gx - 9, y + 6.5, gz - 0.8, gx + 9, y + 8.6, gz + 0.8, STUCCO);
  sink.addSpan(gx - 7.5, y + 7.1, gz - 1.0, gx + 7.5, y + 8.1, gz - 0.72, 0x2a6a9a, 'thin');
  // Ticket booths
  for (const ox of [-16, 12]) {
    makeShed(sink, { x: gx + ox, z: gz - 9, w: 4.6, d: 4, h: 3.2, baseY: y, color: STUCCO, doorW: 1.6 });
  }
  // Flagpoles
  for (const ox of [-20, 18]) {
    post(sink, gx + ox, y, gz - 16, 12, 0.28, C.metalLite);
  }
  // Planting through the plaza
  for (let i = 0; i < 7; i++) {
    const tx = x + 4 + rng() * (w - 8);
    const tz = z + 3 + rng() * (d - 10);
    tree(sink, tx, tz, y, rng);
  }
  stats.buildings++;
}

/** Reptile / primate house — a real interior to fight in. */
function zooHouse(sink, terrain, x, z, w, d, floors, rng, colour) {
  const s = fh(terrain, x, z, w, d);
  if (!Number.isFinite(s.max) || s.max < 3) return false;
  const baseY = s.max - 0.05;
  sink.addSpan(x - 0.3, s.min - 1.2, z - 0.3, x + w + 0.3, baseY + 0.1, z + d + 0.3, C.concrete);
  makeBuilding(sink, { x, z, w, d, floors, baseY, color: colour, rng });
  addBuildingAccess(sink, x, z, w, d, baseY, floors, BUILDINGS.FLOOR_HEIGHT, rng, 3, false, terrain, false);
  const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
  sink.addSpan(x - 0.8, roofY, z - 0.8, x + w + 0.8, roofY + 0.5, z + d + 0.8, 0xb5643c);
  return true;
}

/** Footbridge over a canyon — the zoo is full of them. */
function canyonBridge(sink, terrain, x0, z0, x1, z1) {
  const y = Math.max(terrain.heightAt(x0, z0), terrain.heightAt(x1, z1)) + 0.4;
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const wdt = 3.2;
  if (alongX) {
    sink.addSpan(x0, y, z0 - wdt / 2, x1, y + 0.3, z0 + wdt / 2, 0x8a6a44);
    sink.addSpan(x0, y + 0.3, z0 - wdt / 2, x1, y + 1.15, z0 - wdt / 2 + 0.2, MESH, 'thin');
    sink.addSpan(x0, y + 0.3, z0 + wdt / 2 - 0.2, x1, y + 1.15, z0 + wdt / 2, MESH, 'thin');
    const n = Math.max(2, Math.round((x1 - x0) / 14));
    for (let i = 1; i < n; i++) {
      const px = x0 + ((x1 - x0) * i) / n;
      const g = terrain.heightAt(px, z0);
      if (Number.isFinite(g)) post(sink, px, g, z0 - 0.3, Math.max(1, y - g), 0.6, C.concrete);
    }
  } else {
    sink.addSpan(x0 - wdt / 2, y, z0, x0 + wdt / 2, y + 0.3, z1, 0x8a6a44);
    sink.addSpan(x0 - wdt / 2, y + 0.3, z0, x0 - wdt / 2 + 0.2, y + 1.15, z1, MESH, 'thin');
    sink.addSpan(x0 + wdt / 2 - 0.2, y + 0.3, z0, x0 + wdt / 2, y + 1.15, z1, MESH, 'thin');
    const n = Math.max(2, Math.round((z1 - z0) / 14));
    for (let i = 1; i < n; i++) {
      const pz = z0 + ((z1 - z0) * i) / n;
      const g = terrain.heightAt(x0, pz);
      if (Number.isFinite(g)) post(sink, x0 - 0.3, g, pz, Math.max(1, y - g), 0.6, C.concrete);
    }
  }
}

/**
 * Build the zoo around its anchor. Terraces follow the canyon rather than
 * flattening it, so the layout is expressed in offsets from the anchor and each
 * piece seats itself.
 */
export function placeSanDiegoZoo(sink, terrain, p, rng) {
  const stats = { buildings: 0, habitats: 0 };
  const X = (o) => p.x + o;
  const Z = (o) => p.z + o;

  // Entry plaza on the flat southern bench
  entryPlaza(sink, terrain, X(-40), Z(95), 78, 44, rng, stats);

  // Houses flanking the entry
  if (zooHouse(sink, terrain, X(-46), Z(55), 30, 20, 1, rng, STUCCO)) stats.buildings++;
  if (zooHouse(sink, terrain, X(6), Z(52), 32, 22, 2, rng, 0xd8c9ac)) stats.buildings++;

  // Moated habitats terraced up the canyon, biggest nearest the entry
  const habitats = [
    { o: [-72, 6], w: 46, d: 34, animals: ['bulk', 'large'], count: 3, gap: 's' },
    { o: [22, 10], w: 40, d: 30, animals: ['large', 'tall'], count: 3, gap: 'w' },
    { o: [-30, -46], w: 36, d: 30, animals: ['large'], count: 2, gap: 's' },
    { o: [30, -52], w: 34, d: 28, animals: ['small', 'large'], count: 3, gap: 'w' },
    { o: [-92, -40], w: 32, d: 26, animals: ['long', 'small'], count: 2, gap: 'e' },
  ];
  for (const h of habitats) {
    if (moatedHabitat(sink, terrain, X(h.o[0]), Z(h.o[1]), h.w, h.d, rng, {
      animals: h.animals, count: h.count, viewGap: h.gap,
    })) stats.habitats++;
  }

  // Walk-through aviary down in the canyon west of the core
  if (aviary(sink, terrain, X(-118), Z(-6), 30, 26, rng)) stats.habitats++;

  // Skyfari across the canyon, low west terminal to the high east ridge
  skyfari(sink, terrain, X(-58), Z(84), X(96), Z(-30), rng);

  // Paths tying it together
  pathRun(sink, terrain, X(0), Z(95), X(0), Z(20), 4.2);
  pathRun(sink, terrain, X(0), Z(20), X(-70), Z(14), 3.6);
  pathRun(sink, terrain, X(0), Z(20), X(58), Z(16), 3.6);
  pathRun(sink, terrain, X(0), Z(20), X(-8), Z(-40), 3.6);
  pathRun(sink, terrain, X(-8), Z(-40), X(52), Z(-44), 3.2);

  // Canyon crossing on the west path
  canyonBridge(sink, terrain, X(-70), Z(14), X(-104), Z(10));

  // Botanical planting through the grounds
  for (let i = 0; i < 40; i++) {
    const tx = X(-130 + rng() * 240);
    const tz = Z(-80 + rng() * 190);
    const ty = terrain.heightAt(tx, tz);
    if (!Number.isFinite(ty) || ty < 3) continue;
    if (terrain.slopeDegAt(tx, tz) > 34) continue;
    if (terrain.roadAt(tx, tz) > 0.2) continue;
    tree(sink, tx, tz, ty, rng, 0.85 + rng() * 0.5);
  }

  return stats;
}
