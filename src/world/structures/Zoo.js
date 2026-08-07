import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed } from '../BuildingKit.js';
import { C, footprintHeights, addBuildingAccess, placeAnimal } from './Catalog.js';

// San Diego Zoo, Balboa Park.
//
// The zoo is built into canyons, which is the whole reason it looks the way it
// does: exhibits terrace into the hillsides, paths switch back along the
// contours, and the Skyfari gondola crosses the canyon overhead because walking
// it end to end is a climb. So this POI is deliberately NOT levelled — it takes
// the natural relief (15 m at the west end up to 90 m on the east ridge) and
// terraces into it.
//
// It also pioneered cageless moated enclosures, so habitats here are a viewing
// wall, a moat gap and an inner retaining wall rather than a barred cage.
//
// ── Seating rule (the thing that used to be wrong) ───────────────────────────
// Every pad here goes through `bench()`. The first version put each pad at its
// footprint's HIGH corner and filled a capped 9 m downhill, which on canyon
// ground that drops 34 m across 40 m of footprint left three exhibits hanging
// 7–24 m in the air as big black slabs. A pad must do both of these or it is
// wrong: sit close enough to grade to be a believable cut, and fill all the way
// down to the low corner so nothing floats. Ground too steep for that gets a
// stepped run of benches (`benchRun`) or is refused outright.

const STUCCO = 0xe4d9c4;
const ROCK = 0x8a8378;
const ROCK_DK = 0x6a655c;
const MOAT = 0x4a6b58;
const WATER = 0x3f7d96;
const PATH = 0xc9c0ad;
const BUS_ROAD = 0x54504a;
const FOLIAGE = [0x3f7a34, 0x4f8a3a, 0x35682c, 0x5c9440, 0x2f6a2a];
const BAMBOO = 0x7fae3f;
const MESH = 0x6e6c68;
const FLAMINGO = 0xe8748c;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function post(sink, x, y0, z, h, s = 0.35, col = C.metal) {
  sink.addSpan(x, y0, z, x + s, y0 + h, z + s, col);
}

function fh(terrain, x, z, w, d) {
  return footprintHeights(terrain, x, z, w, d);
}

/**
 * Cut a level bench into the slope and fill it to the ground.
 *
 * The deck sits at the footprint's average height, clamped so it is never more
 * than `maxCut` above the low corner — a terrace is a cut into the hill, not a
 * plinth on top of it. The fill then runs from below the low corner up to the
 * deck, so it always reaches ground no matter how the slope runs.
 *
 * Returns `{ y, min, max, delta }`, or null when the ground is too broken to
 * bench at all (`maxDelta`), so the caller can step it or place elsewhere.
 */
function bench(sink, terrain, x, z, w, d, opts = {}) {
  const maxCut = opts.maxCut ?? 4.5;
  const maxDelta = opts.maxDelta ?? 14;
  const minY = opts.minY ?? 3;
  const colour = opts.colour ?? ROCK_DK;
  const lip = opts.lip ?? 0;

  const s = fh(terrain, x, z, w, d);
  if (!Number.isFinite(s.min) || s.min < minY) return null;
  if (s.delta > maxDelta) return null;

  const y = Math.min(s.avg, s.min + maxCut);
  if (opts.fill !== false) {
    sink.addSpan(x - lip, s.min - 1.6, z - lip, x + w + lip, y, z + d + lip, colour);
  }
  return { y, min: s.min, max: s.max, delta: s.delta };
}

/**
 * A run of stepped benches down a slope, each one level and each faced with a
 * retaining wall at its downhill nose. This is how the zoo's canyon exhibits
 * actually work, and it is the only way to hold ground that `bench()` refuses.
 * Returns the array of benches that took.
 */
function benchRun(sink, terrain, x, z, w, d, steps, opts = {}) {
  const out = [];
  const bd = d / steps;
  for (let i = 0; i < steps; i++) {
    const bz = z + i * bd;
    const b = bench(sink, terrain, x, bz, w, bd, { ...opts, maxDelta: opts.maxDelta ?? 22 });
    if (!b) continue;
    // Retaining wall on the downhill (south) nose
    sink.addSpan(x - 0.4, b.y - 2.6, bz + bd - 0.9, x + w + 0.4, b.y + 0.3, bz + bd, ROCK);
    out.push({ ...b, x, z: bz, w, d: bd });
  }
  return out;
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

/** A palm — the entry drive and the plaza are lined with them. */
function palm(sink, x, z, y, rng) {
  const h = 8 + rng() * 5;
  post(sink, x, y, z, h, 0.5, 0x8a7a56);
  for (let f = 0; f < 6; f++) {
    const a = (f / 6) * Math.PI * 2 + rng();
    sink.addSpan(
      x + Math.cos(a) * 0.4, y + h, z + Math.sin(a) * 0.4,
      x + Math.cos(a) * 3.4, y + h + 0.5, z + Math.sin(a) * 3.4, 0x3f7a34, 'thin'
    );
  }
}

/** A bamboo clump — Panda Canyon is nothing but these. */
function bambooClump(sink, x, z, y, rng) {
  for (let i = 0; i < 7; i++) {
    const bx = x + (rng() - 0.5) * 3.4;
    const bz = z + (rng() - 0.5) * 3.4;
    post(sink, bx, y, bz, 4.5 + rng() * 3.5, 0.22, BAMBOO);
  }
}

/** Paved walkway segment, laid on whatever the ground is doing. */
function pathRun(sink, terrain, x0, z0, x1, z1, width = 3.4, col = PATH) {
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
      Math.min(ax, bx) - half, y - 0.6, Math.min(az, bz) - half,
      Math.max(ax, bx) + half, y + 0.12, Math.max(az, bz) + half,
      col, 'thin'
    );
  }
}

/** The bus tour loop — the double-decker route is half of how you see the zoo. */
function busLoop(sink, terrain, cx, cz, rx, rz, rng) {
  const N = 26;
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const px = cx + Math.cos(a) * rx;
    const pz = cz + Math.sin(a) * rz * 0.78;
    if (prev) pathRun(sink, terrain, prev[0], prev[1], px, pz, 6.5, BUS_ROAD);
    prev = [px, pz];
  }
  // A bus parked at the loading stop
  const sy = terrain.heightAt(cx, cz + rz * 0.72);
  if (Number.isFinite(sy) && sy > 2) {
    const bx = cx - 5;
    const bz = cz + rz * 0.72;
    sink.addSpan(bx, sy + 0.3, bz, bx + 10, sy + 3.0, bz + 3.4, 0x2f6a2a);
    sink.addSpan(bx + 0.3, sy + 3.0, bz + 0.3, bx + 9.7, sy + 5.6, bz + 3.1, 0x2f6a2a);
    sink.addSpan(bx + 0.6, sy + 3.4, bz - 0.1, bx + 9.4, sy + 5.2, bz + 0.15, C.glassDark, 'thin');
    for (const ox of [1.2, 7.6]) {
      post(sink, bx + ox, sy, bz + 0.4, 0.9, 0.7, C.dark);
      post(sink, bx + ox, sy, bz + 2.4, 0.9, 0.7, C.dark);
    }
  }
}

/**
 * A moated habitat on a level bench. Outward from the middle: the animals'
 * floor, an inner retaining wall they cannot climb, the moat, then a low
 * viewing wall the public leans on.
 */
function moatedHabitat(sink, terrain, x, z, w, d, rng, opts = {}) {
  const b = bench(sink, terrain, x, z, w, d, { maxCut: opts.maxCut ?? 4.5, maxDelta: opts.maxDelta ?? 13 });
  if (!b) return false;
  const padY = b.y;
  const wall = 1.15;               // public-side viewing wall
  const moatW = opts.moatW ?? 3.0;
  const inner = opts.innerH ?? 2.6; // retaining wall the animals face

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

  // Public viewing wall around the outside, with a gap on the path side, and a
  // pane of glass in the gap — the modern exhibits are all glass-fronted.
  const gap = opts.viewGap ?? 'n';
  const seg = (ax, az, bx, bz) => sink.addSpan(ax, padY, az, bx, padY + wall, bz, STUCCO, 'thin');
  if (gap !== 'n') seg(x, z, x + w, z + 0.4);
  else {
    seg(x, z, x + w * 0.36, z + 0.4);
    seg(x + w * 0.64, z, x + w, z + 0.4);
    sink.addSpan(x + w * 0.36, padY, z + 0.05, x + w * 0.64, padY + 2.3, z + 0.35, C.glass, 'glass');
  }
  if (gap !== 's') seg(x, z + d - 0.4, x + w, z + d);
  else {
    seg(x, z + d - 0.4, x + w * 0.36, z + d);
    seg(x + w * 0.64, z + d - 0.4, x + w, z + d);
    sink.addSpan(x + w * 0.36, padY, z + d - 0.35, x + w * 0.64, padY + 2.3, z + d - 0.05, C.glass, 'glass');
  }
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
  // A pool — nearly every exhibit here has one
  if (opts.pool !== false) {
    sink.addSpan(cx - w * 0.16, padY - 0.5, cz + d * 0.14, cx + w * 0.16, padY + 0.06, cz + d * 0.32, WATER);
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
 * A canyon exhibit: stepped rock benches down a slope with the animals on them
 * and a viewing rail along the top. This is what goes where a flat pad cannot —
 * Africa Rocks and Tiger Trail are both built exactly this way.
 */
function canyonExhibit(sink, terrain, x, z, w, d, rng, opts = {}) {
  const steps = opts.steps ?? 4;
  const benches = benchRun(sink, terrain, x, z, w, d, steps, { maxCut: 3.5, colour: ROCK });
  if (!benches.length) return false;

  for (const b of benches) {
    // Rockwork on each terrace
    for (let i = 0; i < 2; i++) {
      const rx = b.x + 3 + rng() * (b.w - 8);
      const rz = b.z + 1 + rng() * Math.max(1, b.d - 4);
      const rw = 2.5 + rng() * 4;
      sink.addSpan(rx, b.y, rz, rx + rw, b.y + 1.5 + rng() * 3.5, rz + rw * 0.7, rng() > 0.5 ? ROCK : ROCK_DK);
    }
    placeAnimal(sink, b.x + b.w * 0.5, b.z + b.d * 0.5, b.y, rng, pick(rng, opts.animals ?? ['large']));
    if (opts.bamboo) bambooClump(sink, b.x + b.w * 0.22, b.z + b.d * 0.5, b.y, rng);
  }

  // Public rail and glass along the uphill edge, where the path runs
  const top = benches[0];
  sink.addSpan(top.x - 1.2, top.y, top.z - 1.6, top.x + top.w + 1.2, top.y + 1.1, top.z - 1.2, STUCCO, 'thin');
  sink.addSpan(top.x + top.w * 0.3, top.y + 1.1, top.z - 1.55, top.x + top.w * 0.7, top.y + 3.0, top.z - 1.25, C.glass, 'glass');
  // Interpretive shade structure over the viewpoint
  for (const ox of [top.w * 0.28, top.w * 0.66]) post(sink, top.x + ox, top.y, top.z - 4.4, 3.2, 0.35, C.woodDark);
  sink.addSpan(top.x + top.w * 0.22, top.y + 3.2, top.z - 5.2, top.x + top.w * 0.74, top.y + 3.6, top.z - 3.4, 0x8a6a44);
  return true;
}

/**
 * Flamingo lagoon — the first thing past the gate at the real zoo, and the
 * cheapest possible way to make an entry read as *this* zoo.
 */
function flamingoLagoon(sink, terrain, x, z, w, d, rng) {
  const b = bench(sink, terrain, x, z, w, d, { maxCut: 3.5, maxDelta: 10, colour: 0x9a8f74 });
  if (!b) return false;
  const y = b.y;
  // Water, set into the pad, with a planted island
  sink.addSpan(x + 1.6, y - 1.1, z + 1.6, x + w - 1.6, y - 0.15, z + d - 1.6, WATER);
  sink.addSpan(x + w * 0.42, y - 1.1, z + d * 0.4, x + w * 0.62, y + 0.25, z + d * 0.66, 0x7a6a4a);
  tree(sink, x + w * 0.52, z + d * 0.53, y + 0.25, rng, 0.8);
  // Low rail all the way round
  for (const [ax, az, bx, bz] of [
    [x, z, x + w, z + 0.35],
    [x, z + d - 0.35, x + w, z + d],
    [x, z, x + 0.35, z + d],
    [x + w - 0.35, z, x + w, z + d],
  ]) sink.addSpan(ax, y, az, bx, y + 0.95, bz, STUCCO, 'thin');
  // The birds: a pink standing crowd
  for (let i = 0; i < 22; i++) {
    const fx = x + 3 + rng() * (w - 6);
    const fz = z + 3 + rng() * (d - 6);
    const h = 1.0 + rng() * 0.5;
    post(sink, fx, y - 0.3, fz, h, 0.16, FLAMINGO);
    sink.addSpan(fx - 0.45, y - 0.3 + h, fz - 0.28, fx + 0.6, y + 0.25 + h, fz + 0.34, FLAMINGO);
  }
  return true;
}

/**
 * Walk-through aviary: a tall mesh volume you can actually fight inside.
 * The zoo's Scripps and Owens aviaries are the model — you walk in at the
 * bottom of a canyon and the mesh goes up over the trees.
 */
function aviary(sink, terrain, x, z, w, d, rng) {
  const b = bench(sink, terrain, x, z, w, d, { maxCut: 4, maxDelta: 12 });
  if (!b) return false;
  const y = b.y;
  const H = 16;

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

  // Interior: trees, perches, a stream and a waterfall down the back wall
  for (let i = 0; i < 7; i++) {
    tree(sink, x + 3 + rng() * (w - 6), z + 3 + rng() * (d - 6), y, rng, 1.1);
  }
  sink.addSpan(x + 2, y, z + d * 0.45, x + w - 2, y + 0.1, z + d * 0.55, WATER, 'thin');
  sink.addSpan(x + w * 0.16, y, z + 1.2, x + w * 0.3, y + H * 0.62, z + 3.2, ROCK);
  sink.addSpan(x + w * 0.2, y + 0.1, z + 1.6, x + w * 0.26, y + H * 0.6, z + 2.0, WATER, 'thin');
  for (let i = 0; i < 5; i++) {
    const px = x + 4 + rng() * (w - 8);
    const pz = z + 4 + rng() * (d - 8);
    sink.addSpan(px, y + 4 + rng() * 5, pz, px + 3.5, y + 4.3 + rng() * 5, pz + 0.3, 0x6a5238, 'thin');
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

  const span = Math.hypot(bx - ax, bz - az);
  // Cable elevation at t along the run, sagging between the terminal heights
  const cableAt = (t) => aTop + (bTop - aTop) * t - Math.sin(t * Math.PI) * 3.5;

  // Pylons, spaced along the run
  const n = Math.max(3, Math.round(span / 55));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const px = ax + (bx - ax) * t;
    const pz = az + (bz - az) * t;
    const g = terrain.heightAt(px, pz);
    if (!Number.isFinite(g)) continue;
    const h = Math.max(6, cableAt(t) - g - 1.2);
    post(sink, px - 0.4, g, pz - 0.4, h, 0.8, TOWER);
    sink.addSpan(px - 2.2, g + h, pz - 0.35, px + 2.6, g + h + 0.7, pz + 0.35, TOWER);
  }

  // The cable itself, subdivided far finer than the pylons. Every box in this
  // world is axis-aligned, so a "cable" drawn as one box between two diagonal
  // points is not a line — it is the bounding box of that line. On this run
  // that made three 52 x 38 m slabs hanging 20 m over the canyon, which is what
  // the zoo's mystery floating boxes were. Short steps keep each box small
  // enough to read as a cable.
  const segs = Math.max(24, Math.round(span / 2.5));
  let prev = null;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const px = ax + (bx - ax) * t;
    const pz = az + (bz - az) * t;
    const cy = cableAt(t);
    if (prev) {
      const [qx, qz, qy] = prev;
      sink.addSpan(
        Math.min(qx, px) - 0.12, Math.min(qy, cy), Math.min(qz, pz) - 0.12,
        Math.max(qx, px) + 0.12, Math.max(qy, cy) + 0.16, Math.max(qz, pz) + 0.12,
        C.dark, 'thin'
      );
    }
    prev = [px, pz, cy];
    // Cabins hanging along the line
    if (i > 0 && i % Math.max(4, Math.round(segs / 7)) === 0) {
      sink.addSpan(px - 0.08, cy - 1.6, pz - 0.08, px + 0.08, cy, pz + 0.08, C.dark);
      sink.addSpan(px - 0.9, cy - 3.3, pz - 0.9, px + 0.9, cy - 1.5, pz + 0.9,
        pick(rng, [0xf0b400, 0xd03028, 0x2a6a9a, 0x3a8a2e]));
    }
  }
}

/** Entry plaza: gates, ticket booths, flagpoles, palms. */
function entryPlaza(sink, terrain, x, z, w, d, rng, stats) {
  const b = bench(sink, terrain, x, z, w, d, { maxCut: 3, maxDelta: 10, colour: PATH });
  if (!b) return false;
  const y = b.y;
  sink.addSpan(x, y, z, x + w, y + 0.1, z + d, PATH);

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
  for (const ox of [-20, 18]) post(sink, gx + ox, y, gz - 16, 12, 0.28, C.metalLite);
  // Palms down the entry axis, the way the real drive is planted
  for (let i = 0; i < 5; i++) {
    palm(sink, gx - 14, z + 6 + i * ((d - 16) / 4), y, rng);
    palm(sink, gx + 14, z + 6 + i * ((d - 16) / 4), y, rng);
  }
  stats.buildings++;
  return true;
}

/** Reptile / primate house — a real interior to fight in. */
function zooHouse(sink, terrain, x, z, w, d, floors, rng, colour) {
  const b = bench(sink, terrain, x, z, w, d, { maxCut: 4, maxDelta: 12, colour: C.concrete, lip: 0.3 });
  if (!b) return false;
  const baseY = b.y;
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
 * piece seats itself — and refuses the site rather than floating over it.
 */
export function placeSanDiegoZoo(sink, terrain, p, rng) {
  const stats = { buildings: 0, habitats: 0, refused: 0 };
  const X = (o) => p.x + o;
  const Z = (o) => p.z + o;
  const took = (ok) => { if (ok) stats.habitats++; else stats.refused++; return ok; };

  // Entry plaza on the flat southern bench, flamingos immediately inside it
  entryPlaza(sink, terrain, X(-40), Z(95), 78, 44, rng, stats);
  flamingoLagoon(sink, terrain, X(-26), Z(62), 40, 24, rng);

  // Houses flanking the entry
  if (zooHouse(sink, terrain, X(-46), Z(55), 30, 20, 1, rng, STUCCO)) stats.buildings++;
  if (zooHouse(sink, terrain, X(6), Z(52), 32, 22, 2, rng, 0xd8c9ac)) stats.buildings++;

  // Moated habitats on the ground gentle enough to bench flat
  const habitats = [
    { o: [-72, 6], w: 46, d: 34, animals: ['bulk', 'large'], count: 3, gap: 's' },
    { o: [-30, -46], w: 36, d: 30, animals: ['large'], count: 2, gap: 's' },
    { o: [-92, -40], w: 32, d: 26, animals: ['long', 'small'], count: 2, gap: 'e' },
    { o: [-118, 40], w: 34, d: 26, animals: ['tall', 'large'], count: 3, gap: 'n' },
  ];
  for (const h of habitats) {
    took(moatedHabitat(sink, terrain, X(h.o[0]), Z(h.o[1]), h.w, h.d, rng, {
      animals: h.animals, count: h.count, viewGap: h.gap,
    }));
  }

  // Canyon exhibits where the ground is too steep for a flat pad. These are the
  // two sites that used to hang 24 m and 12 m in the air as flat slabs.
  took(canyonExhibit(sink, terrain, X(22), Z(10), 40, 34, rng, {
    steps: 5, animals: ['large', 'tall'],
  }));
  took(canyonExhibit(sink, terrain, X(30), Z(-52), 34, 30, rng, {
    steps: 4, animals: ['small', 'large'], bamboo: true,
  }));

  // Walk-through aviary down in the canyon west of the core
  took(aviary(sink, terrain, X(-118), Z(-6), 30, 26, rng));

  // Skyfari across the canyon, low west terminal to the high east ridge
  skyfari(sink, terrain, X(-58), Z(84), X(96), Z(-30), rng);

  // Bus tour loop, and the paths tying the grounds together
  busLoop(sink, terrain, X(-16), Z(20), 92, 84, rng);
  pathRun(sink, terrain, X(0), Z(95), X(0), Z(20), 4.2);
  pathRun(sink, terrain, X(0), Z(20), X(-70), Z(14), 3.6);
  pathRun(sink, terrain, X(0), Z(20), X(58), Z(16), 3.6);
  pathRun(sink, terrain, X(0), Z(20), X(-8), Z(-40), 3.6);
  pathRun(sink, terrain, X(-8), Z(-40), X(52), Z(-44), 3.2);
  pathRun(sink, terrain, X(-70), Z(14), X(-104), Z(38), 3.2);

  // Canyon crossing on the west path
  canyonBridge(sink, terrain, X(-70), Z(14), X(-104), Z(10));

  // Botanical planting through the grounds — it is an accredited botanical
  // garden, so this is dense on purpose.
  for (let i = 0; i < 80; i++) {
    const tx = X(-135 + rng() * 250);
    const tz = Z(-85 + rng() * 200);
    const ty = terrain.heightAt(tx, tz);
    if (!Number.isFinite(ty) || ty < 3) continue;
    if (terrain.slopeDegAt(tx, tz) > 34) continue;
    if (terrain.roadAt(tx, tz) > 0.2) continue;
    if (rng() > 0.82) palm(sink, tx, tz, ty, rng);
    else tree(sink, tx, tz, ty, rng, 0.85 + rng() * 0.5);
  }

  return stats;
}
