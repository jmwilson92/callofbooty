import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed } from '../BuildingKit.js';
import { registerBuilding } from '../BuildingRegistry.js';
import { C, footprintHeights, addBuildingAccess, placeVehicle } from './Catalog.js';
import { SEA, HULL_DK, DECK, CONCRETE, post, findShore, berth, quay } from './Waterfront.js';

// Point Loma — the peninsula that closes the west side of the bay.
//
// Four things sit on it, north to south, and they are what the ridge is for:
//
//   - A residential grid on the flat plateau (Sunset Cliffs / La Playa).
//   - Fort Rosecrans National Cemetery on the east-facing slope above the bay.
//     Terraced benches of white markers stepping down the hill is the single
//     most recognisable thing on the peninsula, so it gets the most care here.
//   - The Old Point Loma Lighthouse on the southern crest, with the Cabrillo
//     overlook beyond it.
//   - The submarine base out on Ballast Point — the spit that runs east off the
//     ridge toward the channel at around z 420.
//
// The cliffs are the west edge; the bay is the east. Ships and quays use the
// shared marine kit in Waterfront.js, which finds the real waterline rather than
// trusting a coordinate.

const STONE = 0xe8e4d8;          // headstone marble
const GRASS = 0x4f7a3e;
const WALL = 0xbcb3a2;
const LIGHT_WHITE = 0xf4f2ec;
const LANTERN = 0x24262a;
const SUB_HULL = 0x22252a;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/** Terrace pad from the footprint's low corner to its high one. */
function terrace(sink, terrain, x, z, w, d, colour = CONCRETE, lip = 0.4) {
  const s = footprintHeights(terrain, x, z, w, d);
  if (!Number.isFinite(s.max)) return null;
  const y = s.max;
  const drop = Math.min(12, Math.max(0.5, y - s.min));
  sink.addSpan(x - lip, y - drop - 0.5, z - lip, x + w + lip, y, z + d + lip, colour);
  return y;
}

function tree(sink, x, z, y, rng, scale = 1) {
  const h = (5 + rng() * 3) * scale;
  post(sink, x, y, z, h * 0.6, 0.42 * scale, 0x6a5238);
  const r = (1.8 + rng()) * scale;
  const col = pick(rng, [0x3f7a34, 0x4f8a3a, 0x35682c]);
  sink.addSpan(x - r, y + h * 0.52, z - r, x + r, y + h * 0.95, z + r, col);
}

/**
 * Fort Rosecrans: benches of white markers stepping down the slope to the bay.
 *
 * The hill loses ~32 m over 100 m, so this cuts it into level benches with a low
 * retaining wall at each nose rather than laying headstones on the raw grade —
 * which is both what the real cemetery does and the only way rows of 0.9 m
 * markers stay legible instead of disappearing into the hillside.
 */
function cemetery(sink, terrain, x, z, w, d, rng, stats) {
  const benches = 8;
  const bd = d / benches;
  let placed = 0;

  for (let b = 0; b < benches; b++) {
    const bz = z + b * bd;
    const s = footprintHeights(terrain, x, bz, w, bd);
    if (!Number.isFinite(s.max) || s.max < 3) continue;
    const y = s.max;
    const drop = Math.min(9, Math.max(0.6, y - s.min));

    // The bench itself, cut level and faced with a retaining wall downhill
    sink.addSpan(x, y - drop - 0.6, bz, x + w, y, z + b * bd + bd, GRASS);
    sink.addSpan(x - 0.5, y - drop - 0.8, bz + bd - 0.9, x + w + 0.5, y + 0.35, bz + bd, WALL);

    // Two rows of markers per bench, aligned across the whole cemetery
    for (const rowT of [0.3, 0.68]) {
      const rz = bz + bd * rowT;
      for (let mx = x + 2.5; mx < x + w - 1.5; mx += 2.6) {
        sink.addSpan(mx, y, rz, mx + 0.75, y + 0.95, rz + 0.22, STONE, 'thin');
        placed++;
      }
    }
    // Path down the middle of each bench
    sink.addSpan(x + w * 0.5 - 1.4, y, bz, x + w * 0.5 + 1.4, y + 0.08, bz + bd, 0xc9c0ad, 'thin');
  }

  // Flagpole and rostrum at the top bench, looking down the rows
  const topY = terrain.heightAt(x + w * 0.5, z + 4);
  if (Number.isFinite(topY) && topY > 3) {
    post(sink, x + w * 0.5 - 0.3, topY, z + 3, 18, 0.6, C.metalLite);
    sink.addSpan(x + w * 0.5 - 0.2, topY + 15.5, z + 3, x + w * 0.5 + 4.2, topY + 17.6, z + 3.2, C.red, 'thin');
    // Rostrum
    sink.addSpan(x + w * 0.5 - 7, topY, z + 8, x + w * 0.5 + 7, topY + 0.5, z + 15, WALL);
    for (const ox of [-6, -2, 2, 5.2]) post(sink, x + w * 0.5 + ox, topY + 0.5, z + 9, 4.2, 0.6, LIGHT_WHITE);
    sink.addSpan(x + w * 0.5 - 7, topY + 4.7, z + 8.4, x + w * 0.5 + 7, topY + 5.5, z + 11.4, WALL);
  }

  // Boundary wall along the uphill edge, and cypresses down the flanks
  sink.addSpan(x - 1.2, terrain.heightAt(x, z) - 1, z - 1.2, x - 0.4, terrain.heightAt(x, z) + 1.3, z + d, WALL, 'thin');
  for (let i = 0; i < 8; i++) {
    const tz = z + 6 + i * (d / 8);
    for (const tx of [x - 5, x + w + 5]) {
      const g = terrain.heightAt(tx, tz);
      if (Number.isFinite(g) && g > 3) tree(sink, tx, tz, g, rng, 0.9);
    }
  }

  stats.markers = placed;
  return placed > 0;
}

/**
 * The Old Point Loma Lighthouse: a white two-storey keeper's dwelling with the
 * tower rising through its centre and a black lantern room on top. Small
 * building, big silhouette — it is the thing you navigate the south ridge by.
 */
function lighthouse(sink, terrain, x, z, rng, stats) {
  const w = 11;
  const d = 9;
  const baseY = terrace(sink, terrain, x, z, w, d, 0xa9a294);
  if (baseY == null || baseY < 3) return false;

  makeBuilding(sink, { x, z, w, d, floors: 2, baseY, color: LIGHT_WHITE, rng });
  const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + BUILDINGS.FLOOR_HEIGHT;
  // Gabled roof
  for (let i = 0; i < 3; i++) {
    const inset = (i / 3) * 3.2;
    sink.addSpan(x - 0.8 + inset, roofY + i * 1.1, z - 0.8, x + w + 0.8 - inset, roofY + (i + 1) * 1.1, z + d + 0.8, 0x8e2f22);
  }
  // Chimneys
  for (const ox of [2.2, w - 3.6]) {
    sink.addSpan(x + ox, roofY, z + d * 0.5 - 0.7, x + ox + 1.4, roofY + 4.6, z + d * 0.5 + 0.7, 0x9a4034);
  }

  // Tower through the ridge of the roof
  const tx = x + w / 2;
  const tz = z + d / 2;
  // Tall enough that the gallery clears the roof ridge by a clear margin —
  // at 13 m it sat 2 m proud of the peak and read as a chimney.
  const tH = 18;
  for (let i = 0; i < 4; i++) {
    const r = 2.3 - i * 0.12;
    sink.addSpan(tx - r, baseY + (tH * i) / 4, tz - r, tx + r, baseY + (tH * (i + 1)) / 4, tz + r, LIGHT_WHITE);
  }
  // Gallery, lantern room and cap
  const gy = baseY + tH;
  sink.addSpan(tx - 3.1, gy, tz - 3.1, tx + 3.1, gy + 0.4, tz + 3.1, LANTERN);
  for (const [ox, oz] of [[-3.0, -3.0], [2.7, -3.0], [-3.0, 2.7], [2.7, 2.7]]) {
    post(sink, tx + ox, gy + 0.4, tz + oz, 1.0, 0.3, LANTERN);
  }
  sink.addSpan(tx - 3.1, gy + 1.4, tz - 3.1, tx + 3.1, gy + 1.6, tz + 3.1, LANTERN);
  sink.addSpan(tx - 2.1, gy + 0.4, tz - 2.1, tx + 2.1, gy + 4.0, tz + 2.1, LANTERN);
  sink.addSpan(tx - 1.8, gy + 1.1, tz - 1.8, tx + 1.8, gy + 3.3, tz + 1.8, 0xffe9a8);   // the light
  for (let i = 0; i < 3; i++) {
    const r = 2.4 - i * 0.75;
    sink.addSpan(tx - r, gy + 4.0 + i * 0.8, tz - r, tx + r, gy + 4.8 + i * 0.8, tz + r, LANTERN);
  }
  post(sink, tx - 0.15, gy + 6.4, tz - 0.15, 2.4, 0.3, C.metal);

  // Whitewashed yard wall and the path up to the door
  sink.addSpan(x - 9, baseY - 0.6, z - 8, x - 8.4, baseY + 1.0, z + d + 8, WALL, 'thin');
  sink.addSpan(x + w + 8.4, baseY - 0.6, z - 8, x + w + 9, baseY + 1.0, z + d + 8, WALL, 'thin');
  sink.addSpan(x + w * 0.5 - 1.4, baseY - 0.05, z + d, x + w * 0.5 + 1.4, baseY + 0.08, z + d + 9, 0xc9c0ad, 'thin');
  stats.buildings++;      // makeBuilding registered the footprint
  return true;
}

/** Cabrillo overlook: a paved plaza, a statue on a plinth, and a low parapet. */
function overlook(sink, terrain, x, z, rng) {
  const w = 26;
  const d = 20;
  const y = terrace(sink, terrain, x, z, w, d, 0xc4bdae, 0.6);
  if (y == null || y < 3) return false;

  // Parapet on the seaward (south) side, with gaps you can shoot through
  for (let px = x; px < x + w; px += 6) {
    sink.addSpan(px, y, z + d - 0.7, px + 4.4, y + 1.15, z + d, WALL);
  }
  // Statue: plinth, figure, cloak
  const sx = x + w / 2;
  const sz = z + d * 0.42;
  sink.addSpan(sx - 2.6, y, sz - 2.6, sx + 2.6, y + 1.0, sz + 2.6, WALL);
  sink.addSpan(sx - 1.7, y + 1.0, sz - 1.7, sx + 1.7, y + 4.4, sz + 1.7, 0x9a9488);
  sink.addSpan(sx - 0.9, y + 4.4, sz - 0.7, sx + 0.9, y + 7.4, sz + 0.7, 0x6e6a60);
  sink.addSpan(sx - 1.5, y + 5.0, sz - 0.5, sx + 1.5, y + 6.9, sz + 1.2, 0x6e6a60);
  sink.addSpan(sx - 0.45, y + 7.4, sz - 0.45, sx + 0.45, y + 8.3, sz + 0.45, 0x6e6a60);

  // Benches and a couple of parked cars at the head of the plaza
  for (const ox of [4, w - 8]) {
    sink.addSpan(x + ox, y, z + 3, x + ox + 4, y + 0.45, z + 4.2, C.wood);
  }
  placeVehicle(sink, x + 4, z + d - 7, y, rng, null, false);
  placeVehicle(sink, x + w - 9, z + d - 7, y, rng, null, false);
  return true;
}

/** A moored fast-attack boat: black hull mostly awash, a sail, and dive planes. */
function submarine(sink, cx, z0, z1, rng) {
  const beam = 11;
  const half = beam / 2;
  const len = z1 - z0;

  // Rounded hull: a wide waist that tapers at both ends
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const t = (i + 0.5) / segs;
    const bulge = Math.sin(t * Math.PI) ** 0.45;
    const hw = half * (0.25 + 0.75 * bulge);
    sink.addSpan(
      cx - hw, SEA - 4.0, z0 + len * (i / segs),
      cx + hw, SEA + 1.4, z0 + len * ((i + 1) / segs) + 0.2, SUB_HULL
    );
  }
  // Deck casing
  sink.addSpan(cx - 2.0, SEA + 1.4, z0 + len * 0.1, cx + 2.0, SEA + 1.7, z1 - len * 0.08, SUB_HULL);
  // Sail, forward of midships, with the fairwater planes
  const sz = z0 + len * 0.62;
  sink.addSpan(cx - 1.7, SEA + 1.7, sz, cx + 1.7, SEA + 7.4, sz + 13, SUB_HULL);
  sink.addSpan(cx - 1.4, SEA + 7.4, sz + 1.5, cx + 1.4, SEA + 8.2, sz + 11, SUB_HULL);
  for (const side of [-1, 1]) {
    sink.addSpan(cx + side * 1.7, SEA + 4.6, sz + 4, cx + side * 5.2, SEA + 5.2, sz + 7.5, SUB_HULL);
  }
  // Masts up
  post(sink, cx - 0.2, SEA + 8.2, sz + 3.5, 4.5, 0.35, C.metal);
  post(sink, cx - 0.2, SEA + 8.2, sz + 6.5, 3.2, 0.3, C.metal);
  // Rudder aft
  sink.addSpan(cx - 0.5, SEA + 1.4, z0 + 1, cx + 0.5, SEA + 4.6, z0 + 7, SUB_HULL);
  // A brow across to the pier and a couple of hands on deck
  sink.addSpan(cx + half - 1, SEA + 1.7, sz - 6, cx + half + 7, SEA + 2.9, sz - 4, C.metalLite);
  for (let i = 0; i < 3; i++) {
    sink.addSpan(cx - 0.9, SEA + 1.7, z0 + len * (0.2 + i * 0.12), cx - 0.4, SEA + 2.5, z0 + len * (0.2 + i * 0.12) + 0.5,
      pick(rng, [C.dark, 0x2a3a2a]), 'thin');
  }
}

/**
 * Ballast Point: the submarine base out on the spit. The spit is only ~15 m of
 * usable width, so the shore side is a single row of support buildings and the
 * base is really the quay and what is tied up alongside it.
 */
function subBase(sink, terrain, x, z, w, d, rng, stats) {
  // The spit loses ~8 m of height along its length, so the apron is poured as a
  // run of level x-strips stepping down toward the water. One terrace across the
  // whole thing turns Ballast Point into a mesa with a sheer face on three
  // sides, which is what the first pass looked like from the air.
  const STRIPS = 5;
  const sw = w / STRIPS;
  const stripY = [];
  for (let i = 0; i < STRIPS; i++) {
    const sx = x + i * sw;
    const s = footprintHeights(terrain, sx, z, sw, d);
    if (!Number.isFinite(s.max) || s.max < 2) { stripY.push(null); continue; }
    const y = s.max;
    const drop = Math.min(9, Math.max(0.6, y - s.min));
    sink.addSpan(sx - 0.4, y - drop - 0.5, z - 0.4, sx + sw + 0.4, y, z + d + 0.4, CONCRETE);
    sink.addSpan(sx, y, z + 0.5, sx + sw, y + 0.1, z + d - 0.5, 0x4a4b4e);
    stripY.push(y);
  }
  const seat = (px) => stripY[Math.min(STRIPS - 1, Math.max(0, Math.floor((px - x) / sw)))];
  const y0 = seat(x + w * 0.2);
  if (y0 == null) return false;

  // Support buildings along the spit, each on the strip it stands on
  let bx = x + 3;
  for (const [bw, bd, bh] of [[15, 10, 6.5], [11, 9, 4.5], [13, 10, 5.5]]) {
    if (bx + bw > x + w - 3) break;
    const by = seat(bx + bw / 2);
    if (by != null) {
      makeShed(sink, { x: bx, z: z + 2.5, w: bw, d: bd, h: bh, baseY: by, color: pick(rng, [0x8e9aa2, 0xa8a49a, 0x7f8b93]), doorW: 3.4 });
      registerBuilding({ x: bx, z: z + 2.5, w: bw, d: bd, floors: 1, baseY: by, floorYs: [by] });
      stats.buildings++;
    }
    bx += bw + 4;
  }
  // Fuel tanks and a torpedo-crate yard at the seaward end
  for (let i = 0; i < 2; i++) {
    const fx = x + w - 22 + i * 10;
    const fy = seat(fx + 4);
    if (fy == null) continue;
    sink.addSpan(fx, fy, z + d - 11, fx + 7, fy + 6, z + d - 4, C.metalLite);
    sink.addSpan(fx - 0.5, fy + 6, z + d - 11.5, fx + 7.5, fy + 6.7, z + d - 3.5, C.gray);
  }
  for (let i = 0; i < 4; i++) {
    const cx = x + 7 + i * 6;
    const cy = seat(cx + 2);
    if (cy == null) continue;
    sink.addSpan(cx, cy + 0.1, z + d - 8, cx + 4.5, cy + 1.9, z + d - 4, pick(rng, [0x4a5a44, C.green]));
  }
  // Perimeter fence along the landward edge, with a gate
  const gate = x + w * 0.38;
  for (let fx = x; fx < x + w; fx += 6) {
    const fy = seat(fx + 3);
    if (fy == null || (fx > gate && fx < gate + 8)) continue;
    sink.addSpan(fx, fy, z - 0.3, fx + 5.2, fy + 2.6, z, C.metal, 'thin');
  }
  const gy = seat(gate + 4);
  if (gy != null) {
    for (const ox of [gate, gate + 7.4]) post(sink, ox, gy, z - 0.5, 3.4, 0.5, C.metal);
    sink.addSpan(gate, gy + 3.4, z - 0.6, gate + 8, gy + 4.0, z - 0.2, C.metalLite);
    makeShed(sink, { x: gate + 9, z: z + 1, w: 4.5, d: 4, h: 3.0, baseY: gy, color: LIGHT_WHITE, doorW: 1.6 });
    placeVehicle(sink, gate - 6, z + d - 6, gy, rng, null, true);
  }
  return true;
}

/** Ridge housing: a small grid of streets and lots on the flat plateau. */
function ridgeHousing(sink, terrain, x, z, w, d, rng, stats) {
  const rows = 4;
  const rowD = d / rows;
  for (let r = 0; r < rows; r++) {
    const rz = z + r * rowD + 3;
    // Street between rows
    const sy = terrain.heightAt(x + w / 2, rz - 2.5);
    if (Number.isFinite(sy) && sy > 3) {
      sink.addSpan(x, sy - 0.6, rz - 5.5, x + w, sy + 0.08, rz - 1.5, C.asphalt);
      sink.addSpan(x + 2, sy + 0.08, rz - 3.7, x + w - 2, sy + 0.14, rz - 3.3, C.yellow, 'thin');
    }
    for (let hx = x + 2; hx + 14 < x + w; hx += 18) {
      const hw = 13;
      const hd = Math.min(12, rowD - 8);
      const s = footprintHeights(terrain, hx, rz, hw, hd);
      if (!Number.isFinite(s.min) || s.min < 4 || s.delta > 6) continue;
      const baseY = s.max;
      sink.addSpan(hx - 0.6, s.min - 1.4, rz - 0.6, hx + hw + 0.6, baseY, rz + hd + 0.6, 0xa9a396);
      const floors = 1 + (rng() > 0.55 ? 1 : 0);
      makeBuilding(sink, {
        x: hx, z: rz, w: hw, d: hd, floors, baseY,
        color: pick(rng, [0xf0e4d0, 0xe2d6c0, 0xdde8e6, 0xf2e0cc, 0xd8ccb8]), rng,
      });
      const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
      sink.addSpan(hx - 1, roofY, rz - 1, hx + hw + 1, roofY + 1.1, rz + hd + 1, pick(rng, [0x9a5a44, 0x7a6a58, 0x8e6a4a]));
      sink.addSpan(hx + 2.5, roofY + 1.1, rz + 2.5, hx + hw - 2.5, roofY + 2.2, rz + hd - 2.5, pick(rng, [0x9a5a44, 0x7a6a58]));
      // Driveway back to the street and a car on it
      sink.addSpan(hx + 1.5, baseY - 0.1, rz - 5.5, hx + 5.5, baseY + 0.02, rz, 0x6a6862);
      if (rng() > 0.45) placeVehicle(sink, hx + 2, rz - 4.5, baseY, rng, null, true);
      if (rng() > 0.5) tree(sink, hx + hw + 2.5, rz + hd * 0.5, baseY, rng, 0.9);
      stats.buildings++;      // makeBuilding registered the footprint
    }
  }
}

/**
 * Sunset Cliffs: a railing and a footpath along the peninsula's west edge, with
 * a few overlook bays. Walks the coast to find it rather than assuming a line —
 * the west shore wanders by 30 m over the length of the ridge.
 */
function cliffWalk(sink, terrain, x, z0, z1, rng) {
  for (let z = z0; z < z1; z += 8) {
    // Walk west from the ridge until the ground falls to the sea
    let ex = x;
    for (let px = x; px > x - 120; px -= 3) {
      const h = terrain.heightAt(px, z);
      if (!Number.isFinite(h) || h < 6) break;
      ex = px;
    }
    const y = terrain.heightAt(ex + 3, z);
    if (!Number.isFinite(y) || y < 6) continue;
    // Path
    sink.addSpan(ex + 2, y, z, ex + 5.6, y + 0.12, z + 8.2, 0xbfb6a2, 'thin');
    // Railing on the seaward side
    post(sink, ex + 1.4, y, z + 1, 1.15, 0.22, C.woodDark);
    post(sink, ex + 1.4, y, z + 5, 1.15, 0.22, C.woodDark);
    sink.addSpan(ex + 1.2, y + 0.95, z, ex + 1.8, y + 1.15, z + 8.2, C.woodDark, 'thin');
    if (rng() > 0.82) {
      // Overlook bay pushed out over the drop
      sink.addSpan(ex - 3, y - 2.5, z + 1, ex + 2.4, y + 0.14, z + 7, 0xbfb6a2);
      sink.addSpan(ex - 3.2, y + 0.14, z + 0.8, ex - 2.6, y + 1.2, z + 7.2, C.woodDark, 'thin');
    }
  }
}

/**
 * Build Point Loma around its anchor. The ridge is the flat part; everything on
 * the flanks terraces, and everything at the water finds the waterline first.
 */
export function placePointLoma(sink, terrain, p, rng) {
  const stats = { buildings: 0, markers: 0, ships: 0, piers: 0 };
  const X = (o) => p.x + o;
  const Z = (o) => p.z + o;

  // Residential plateau, north of the anchor
  ridgeHousing(sink, terrain, X(-32), Z(-104), 56, 116, rng, stats);

  // Fort Rosecrans, on the east-facing slope down to the bay
  cemetery(sink, terrain, X(28), Z(30), 44, 100, rng, stats);

  // Lighthouse and the Cabrillo overlook on the southern crest
  lighthouse(sink, terrain, X(12), Z(158), rng, stats);
  overlook(sink, terrain, X(4), Z(176), rng);

  // Sunset Cliffs along the west edge
  cliffWalk(sink, terrain, X(-40), Z(-90), Z(150), rng);

  // Ballast Point: the spit running east off the ridge, and what is tied up on
  // it. Both the quay and the boat find their own water.
  subBase(sink, terrain, X(88), Z(12), 44, 16, rng, stats);
  // Root the quay at the *seaward* end of the spit. Rooted at the landward end
  // instead, the only water within reach of a berth is a 55 m pocket closed off
  // by a bar at z ≈ 340, and a 60 m boat has nowhere to lie.
  const root = findShore(terrain, X(126), Z(14), -1, 90, 6);
  if (root) {
    if (quay(sink, terrain, root.x, root.z, root.z - 62, 12, rng, { crane: false })) stats.piers++;
    // Moor east of the quay: west of it the ridge runs down into the water, and
    // a 60 m boat parked there is parked in the hillside.
    const b = berth(terrain, root.x + 14, root.z - 10, 60, 8, { shift: 12 });
    if (b) { submarine(sink, b.cx, b.z0, b.z1, rng); stats.ships++; }
  }

  return stats;
}
