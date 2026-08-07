import { BUILDINGS } from '../../config.js';
import { makeBuilding, makeShed } from '../BuildingKit.js';
import { registerBuilding } from '../BuildingRegistry.js';
import { C, footprintHeights, addBuildingAccess, placeVehicle } from './Catalog.js';
import {
  SEA, HULL_DK, DECK, DECK_DK, CONCRETE,
  post, isWater, findShore, berth, hullAlongZ, quay,
} from './Waterfront.js';

// Coronado — the island across the bay from downtown.
//
// Three things share it in real life and they share it here: Naval Air Station
// North Island on the west end, the Hotel del Coronado on the ocean beach at the
// south, and a low-rise village of cottages in between. The carrier and its
// escorts are moored off the north shore, on the bay side, bow out to the
// channel, which is where the real berths are.
//
// Nothing here is placed on faith. The island is a noise-shaped ellipse rather
// than a surveyed coastline, so every hull checks that it is floating over real
// water and every pier walks out from the real waterline before it commits. Move
// the island in config and this all re-seats itself instead of stranding a
// supercarrier in a car park.

const TARMAC = 0x3a3b3e;
const HOTEL_WOOD = 0xf2ece0;
const HOTEL_ROOF = 0x8e2f22;     // the Del's red shingle
const SAND = 0xdccfae;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/**
 * Terrace pad: fill from the footprint's low corner up to its high corner so a
 * building on a slope neither floats nor buries its ground floor. Returns the
 * pad top, which is the baseY the caller then builds from.
 */
function terrace(sink, terrain, x, z, w, d, colour = CONCRETE, lip = 0.4) {
  const s = footprintHeights(terrain, x, z, w, d);
  if (!Number.isFinite(s.max)) return null;
  const y = s.max;
  const drop = Math.min(10, Math.max(0.5, y - s.min));
  sink.addSpan(x - lip, y - drop - 0.5, z - lip, x + w + lip, y, z + d + lip, colour);
  return y;
}

// --- ships ---------------------------------------------------------------

/** A parked jet: fuselage, swept wings, twin tails. Cheap, reads from the air. */
function jet(sink, x, y, z, rng, headingZ = 1, scale = 1) {
  const col = pick(rng, [0x6b7078, 0x5a6068, 0x767c84]);
  const L = 12 * scale;
  const s = headingZ;
  // Fuselage
  sink.addSpan(x - 0.8 * scale, y, z - (L / 2) * s, x + 0.8 * scale, y + 1.5 * scale, z + (L / 2) * s, col);
  // Nose
  sink.addSpan(x - 0.45 * scale, y + 0.2, z + (L / 2) * s, x + 0.45 * scale, y + 1.0 * scale, z + (L / 2 + 2) * s, col);
  // Wings, swept back
  for (const side of [-1, 1]) {
    sink.addSpan(
      x + side * 0.7 * scale, y + 0.7 * scale, z - 1.5 * scale,
      x + side * 5.6 * scale, y + 1.0 * scale, z + 2.0 * scale, col
    );
    // Canted tail
    sink.addSpan(
      x + side * 0.6 * scale, y + 1.4 * scale, z - (L / 2) * s,
      x + side * 1.5 * scale, y + 3.4 * scale, z - (L / 2 - 2.4) * s, col
    );
    // Stabiliser
    sink.addSpan(
      x + side * 0.7 * scale, y + 0.6 * scale, z - (L / 2) * s,
      x + side * 3.2 * scale, y + 0.9 * scale, z - (L / 2 - 2.2) * s, col
    );
  }
  // Canopy
  sink.addSpan(x - 0.6 * scale, y + 1.5 * scale, z + 2.0 * scale, x + 0.6 * scale, y + 2.3 * scale, z + 4.4 * scale, C.glassDark);
}

/**
 * The carrier. Hull runs bow-north so it faces the channel, with the flight deck
 * overhanging both sides, the island to starboard, a landing area canted to
 * port, and an air wing parked along the deck edge.
 */
function carrier(sink, terrain, cx, z0, z1, rng, stats) {
  const beam = 32;
  const deckW = 54;              // flight deck is far wider than the hull
  if (!isWater(terrain, cx - deckW / 2 - 2, z0 - 2, cx + deckW / 2 + 2, z1 + 2)) return false;

  const free = 12;
  hullAlongZ(sink, cx, z0, z1, beam, free, { draft: 5.5, taper: 30 });

  // Flight deck: a slab out to the sponsons, sitting on the hull
  const dy = SEA + free;
  const dx0 = cx - deckW * 0.46;
  const dx1 = cx + deckW * 0.54;
  sink.addSpan(dx0, dy, z0 + 6, dx1, dy + 1.2, z1 - 1, DECK);
  // Sponson brackets so the overhang is not floating
  for (let z = z0 + 16; z < z1 - 8; z += 14) {
    sink.addSpan(dx0 + 1, SEA + 4, z, cx - beam / 2, dy, z + 2.4, HULL_DK);
    sink.addSpan(cx + beam / 2, SEA + 4, z, dx1 - 1, dy, z + 2.4, HULL_DK);
  }

  const top = dy + 1.2;
  // Angled landing area, canted to port — the marking that makes it read as a
  // carrier from 200 m up rather than a grey barge.
  const aLen = (z1 - z0) * 0.62;
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const az = z0 + 10 + aLen * t;
    const ax = cx - 4 - t * 15;
    sink.addSpan(ax - 7, top, az, ax + 7, top + 0.06, az + aLen / steps + 0.3, DECK_DK, 'thin');
    if (i % 2 === 0) sink.addSpan(ax - 0.4, top + 0.06, az, ax + 0.4, top + 0.1, az + 3.2, C.white, 'thin');
  }
  // Bow catapult tracks
  for (const ox of [-11, -3]) {
    sink.addSpan(cx + ox - 0.35, top, z0 + 8, cx + ox + 0.35, top + 0.09, z0 + 62, C.white, 'thin');
  }
  // Arresting wires across the landing area
  for (let i = 0; i < 4; i++) {
    const az = z1 - 34 - i * 8;
    sink.addSpan(cx - 22 - i, top, az, cx - 4 - i, top + 0.08, az + 0.5, C.dark, 'thin');
  }
  // Deck-edge safety netting
  for (const ex of [dx0, dx1 - 0.5]) {
    sink.addSpan(ex, top, z0 + 8, ex + 0.5, top + 0.7, z1 - 2, C.metal, 'thin');
  }

  // Island superstructure, starboard side aft of midships
  const ix = cx + 10;
  const iz = z0 + (z1 - z0) * 0.55;
  sink.addSpan(ix, top, iz, ix + 9, top + 7, iz + 26, DECK);
  sink.addSpan(ix + 0.6, top + 7, iz + 3, ix + 8.4, top + 12, iz + 20, DECK_DK);
  sink.addSpan(ix + 1.2, top + 3.2, iz + 4, ix + 7.8, top + 5.4, iz + 15, C.glassDark);  // bridge glass
  // Mast + radar
  post(sink, ix + 4, top + 12, iz + 9, 14, 0.8, C.metal);
  sink.addSpan(ix + 1.4, top + 18, iz + 7.4, ix + 7.2, top + 19, iz + 8.6, C.metalLite);
  sink.addSpan(ix + 2.4, top + 22, iz + 8, ix + 6.2, top + 25, iz + 8.9, C.metalLite);
  // Funnel exhausts
  for (const oz of [21, 24]) sink.addSpan(ix + 2, top + 7, iz + oz, ix + 6.5, top + 9.5, iz + oz + 2, HULL_DK);

  // Deck-edge elevators, one down (a hole you can fall into is a landmark)
  sink.addSpan(dx1 - 12, top - 0.1, iz - 22, dx1 - 0.5, top + 0.1, iz - 6, DECK_DK);
  sink.addSpan(dx0 + 0.5, SEA + 6, iz + 30, dx0 + 11, SEA + 6.9, iz + 44, DECK_DK);

  // Air wing parked along the starboard deck edge, clear of the landing area
  for (let i = 0; i < 6; i++) {
    jet(sink, cx + 16 + (i % 2) * 3, top + 1.2, z0 + 30 + i * 19, rng, 1, 1);
  }
  // Two spotted on the bow cats
  jet(sink, cx - 11, top + 1.2, z0 + 30, rng, 1, 1);
  jet(sink, cx - 3, top + 1.2, z0 + 46, rng, 1, 1);

  // The flight deck is a floor you can fight on, so register it as one.
  registerBuilding({ x: dx0, z: z0 + 6, w: dx1 - dx0, d: z1 - z0 - 7, floors: 1, baseY: top, floorYs: [top] });
  stats.ships++;
  return true;
}

/** A destroyer: gun forward, VLS fore and aft, a boxy deckhouse and a mast. */
function destroyer(sink, terrain, cx, z0, z1, rng, stats) {
  const beam = 13;
  if (!isWater(terrain, cx - beam / 2 - 2, z0 - 2, cx + beam / 2 + 2, z1 + 2)) return false;
  const free = 5.5;
  hullAlongZ(sink, cx, z0, z1, beam, free, { draft: 3.4, taper: 20 });

  const dy = SEA + free;
  const len = z1 - z0;
  sink.addSpan(cx - beam / 2 + 0.4, dy, z0 + 4, cx + beam / 2 - 0.4, dy + 0.3, z1 - 0.5, DECK);
  const top = dy + 0.3;

  // 5-inch gun on the forecastle
  sink.addSpan(cx - 2.2, top, z0 + len * 0.72, cx + 2.2, top + 2.4, z0 + len * 0.80, DECK);
  sink.addSpan(cx - 0.3, top + 1.6, z0 + len * 0.80, cx + 0.3, top + 2.0, z0 + len * 0.80 + 5, C.metal);
  // VLS cells fore and aft — the grids are what read as "warship" from above
  for (const za of [0.60, 0.20]) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        sink.addSpan(
          cx - 3.4 + j * 3.2, top, z0 + len * za + i * 2.0,
          cx - 1.6 + j * 3.2, top + 0.35, z0 + len * za + i * 2.0 + 1.4, HULL_DK
        );
      }
    }
  }
  // Deckhouse + bridge
  const hz0 = z0 + len * 0.36;
  const hz1 = z0 + len * 0.60;
  sink.addSpan(cx - 5, top, hz0, cx + 5, top + 4.2, hz1, DECK);
  sink.addSpan(cx - 4, top + 4.2, hz1 - 8, cx + 4, top + 7.0, hz1 - 1, DECK_DK);
  sink.addSpan(cx - 3.6, top + 5.2, hz1 - 1.4, cx + 3.6, top + 6.6, hz1 - 1.0, C.glassDark);
  // Mast and the big deckhouse-face radar panels
  post(sink, cx - 0.4, top + 7.0, hz1 - 5, 9, 0.8, C.metal);
  sink.addSpan(cx - 3, top + 12, hz1 - 6, cx + 2.6, top + 12.8, hz1 - 5.2, C.metalLite);
  for (const side of [-1, 1]) {
    sink.addSpan(cx + side * 4.0, top + 4.6, hz1 - 7, cx + side * 4.3, top + 7.2, hz1 - 3, C.concrete);
  }
  // Funnel
  sink.addSpan(cx - 2.4, top + 4.2, hz0 + 4, cx + 2.4, top + 7.4, hz0 + 7, HULL_DK);
  // Flight deck aft with a landing circle
  sink.addSpan(cx - 4.6, top + 0.05, z0 + 4, cx + 4.6, top + 0.12, z0 + len * 0.17, DECK_DK, 'thin');
  sink.addSpan(cx - 2.4, top + 0.12, z0 + len * 0.08, cx + 2.4, top + 0.18, z0 + len * 0.09, C.white, 'thin');
  // Hangar for the helo
  sink.addSpan(cx - 4.2, top, z0 + len * 0.17, cx + 4.2, top + 3.4, z0 + len * 0.25, DECK);

  // Hull number on the bow
  sink.addSpan(cx - beam / 2 - 0.1, SEA + 2.4, z0 + len * 0.88, cx - beam / 2 + 0.1, SEA + 4.4, z0 + len * 0.88 + 4, C.white, 'thin');
  stats.ships++;
  return true;
}

// --- shore establishments -------------------------------------------------

/**
 * Naval Air Station North Island: apron, runway, hangar line, tower.
 * The runway is graded flat because a runway is; everything else terraces.
 */
function airStation(sink, terrain, x, z, w, d, rng, stats) {
  const s = footprintHeights(terrain, x, z, w, d);
  if (!Number.isFinite(s.min) || s.min < 2) return false;
  const y = s.max;
  const drop = Math.min(11, Math.max(0.8, y - s.min));

  // Apron pad
  sink.addSpan(x, y - drop - 0.5, z, x + w, y, z + d, CONCRETE);
  sink.addSpan(x + 1, y, z + 1, x + w - 1, y + 0.12, z + d - 1, TARMAC);

  // Runway down the middle of the pad, with centreline dashes and threshold bars
  const rz = z + d * 0.5;
  const rHalf = 9;
  sink.addSpan(x + 2, y + 0.12, rz - rHalf, x + w - 2, y + 0.2, rz + rHalf, 0x2b2c2f);
  for (let cx0 = x + 8; cx0 < x + w - 10; cx0 += 14) {
    sink.addSpan(cx0, y + 0.2, rz - 0.45, cx0 + 7, y + 0.26, rz + 0.45, C.white, 'thin');
  }
  for (const edge of [rz - rHalf + 0.6, rz + rHalf - 1.2]) {
    sink.addSpan(x + 2, y + 0.2, edge, x + w - 2, y + 0.26, edge + 0.6, C.white, 'thin');
  }
  for (const tx of [x + 3, x + w - 11]) {
    for (let i = 0; i < 5; i++) {
      sink.addSpan(tx, y + 0.2, rz - 7 + i * 3, tx + 8, y + 0.26, rz - 6 + i * 3, C.white, 'thin');
    }
  }

  // Hangar line along the south edge, doors facing the apron
  let hangars = 0;
  for (let i = 0; i < 3; i++) {
    const hw = 22;
    const hx = x + 6 + i * (hw + 5);
    const hz = z + d - 22;
    if (hx + hw > x + w - 4) break;
    makeShed(sink, { x: hx, z: hz, w: hw, d: 18, h: 11, baseY: y, color: 0x8e9aa2, doorW: 12 });
    // Barrel-ish roof cap so they do not read as more warehouses
    sink.addSpan(hx + 1, y + 11.2, hz + 1, hx + hw - 1, y + 12.6, hz + 17, 0x77838b);
    registerBuilding({ x: hx, z: hz, w: hw, d: 18, floors: 1, baseY: y, floorYs: [y] });
    hangars++;
  }
  stats.buildings += hangars;

  // Control tower at the apron's north-east corner
  const tx = x + w - 16;
  const tz = z + 6;
  sink.addSpan(tx, y, tz, tx + 9, y + 16, tz + 9, C.concrete);
  sink.addSpan(tx - 1.4, y + 16, tz - 1.4, tx + 10.4, y + 21, tz + 10.4, DECK);
  sink.addSpan(tx - 1.0, y + 17.2, tz - 1.6, tx + 10.0, y + 20.2, tz - 1.2, C.glassDark);
  sink.addSpan(tx - 1.6, y + 17.2, tz - 1.0, tx - 1.2, y + 20.2, tz + 10.0, C.glassDark);
  post(sink, tx + 4, y + 21, tz + 4, 8, 0.6, C.metal);
  sink.addSpan(tx + 2.4, y + 27, tz + 2.6, tx + 6.0, y + 27.6, tz + 5.4, C.metalLite);
  registerBuilding({ x: tx, z: tz, w: 9, d: 9, floors: 4, baseY: y, floorYs: [y, y + 4, y + 8, y + 12] });
  stats.buildings++;

  // Fuel farm
  for (let i = 0; i < 3; i++) {
    const fx = x + w - 40 + i * 11;
    sink.addSpan(fx, y, z + d - 16, fx + 8, y + 7, z + d - 8, C.metalLite);
    sink.addSpan(fx - 0.6, y + 7, z + d - 16.6, fx + 8.6, y + 7.8, z + d - 7.4, C.gray);
  }

  // Aircraft parked on the apron, nose to the runway
  for (let i = 0; i < 5; i++) {
    jet(sink, x + 18 + i * 15, y + 0.2, z + 14, rng, -1, 1);
  }
  // Ground vehicles
  for (let i = 0; i < 4; i++) {
    placeVehicle(sink, x + 12 + i * 17, z + d - 30, y + 0.2, rng, null, true);
  }
  return true;
}

/**
 * The Hotel del Coronado. The whole point of the building is its silhouette —
 * a dark red shingle mass with a fat conical turret at the seaward corner and
 * dormers all the way along — so the turret and the roofline get the detail and
 * the walls stay simple white.
 */
function hotelDel(sink, terrain, x, z, w, d, rng, stats) {
  const baseY = terrace(sink, terrain, x, z, w, d, 0xb9b2a2);
  if (baseY == null) return false;

  const floors = 4;
  const fh = BUILDINGS.FLOOR_HEIGHT;
  const gh = BUILDINGS.GROUND_FLOOR_HEIGHT;
  makeBuilding(sink, { x, z, w, d, floors, baseY, color: HOTEL_WOOD, rng });
  addBuildingAccess(sink, x, z, w, d, baseY, floors, fh, rng, 3, false, terrain, false);
  const roofY = baseY + gh + (floors - 1) * fh;

  // Hipped shingle roof: three shrinking slabs
  for (let i = 0; i < 3; i++) {
    const t = i / 3;
    const inset = t * Math.min(w, d) * 0.16;
    sink.addSpan(
      x - 1.2 + inset, roofY + i * 1.5, z - 1.2 + inset,
      x + w + 1.2 - inset, roofY + (i + 1) * 1.5, z + d + 1.2 - inset,
      HOTEL_ROOF
    );
  }
  // Dormers along the long faces
  for (let dx0 = x + 4; dx0 < x + w - 6; dx0 += 8) {
    for (const dz of [z - 0.4, z + d - 2.2]) {
      sink.addSpan(dx0, roofY + 0.6, dz, dx0 + 3.2, roofY + 3.4, dz + 2.6, HOTEL_WOOD);
      sink.addSpan(dx0 - 0.4, roofY + 3.4, dz - 0.4, dx0 + 3.6, roofY + 4.2, dz + 3.0, HOTEL_ROOF);
      sink.addSpan(dx0 + 0.7, roofY + 1.4, dz - 0.1, dx0 + 2.5, roofY + 3.0, dz + 0.1, C.glassDark, 'thin');
    }
  }

  // The turret at the seaward (south-west) corner: a round-ish drum stepping to
  // a cone, then the flagpole.
  const tx = x + 5;
  const tz = z + d - 5;
  const tTop = roofY + 1.5;
  for (let i = 0; i < 4; i++) {
    const r = 7.2 - i * 0.35;
    const yy = baseY + (i / 4) * (tTop - baseY);
    const y2 = baseY + ((i + 1) / 4) * (tTop - baseY);
    sink.addSpan(tx - r, yy, tz - r, tx + r, y2, tz + r, HOTEL_WOOD);
  }
  for (let i = 0; i < 6; i++) {
    const r = 7.6 - i * 1.25;
    sink.addSpan(tx - r, tTop + i * 1.9, tz - r, tx + r, tTop + (i + 1) * 1.9, tz + r, HOTEL_ROOF);
  }
  post(sink, tx - 0.25, tTop + 11.4, tz - 0.25, 7, 0.5, C.metalLite);
  sink.addSpan(tx - 0.2, tTop + 16.4, tz, tx + 3.2, tTop + 18.2, tz + 0.15, C.red, 'thin');

  // Smaller matching turret at the other seaward corner
  const ux = x + w - 4.5;
  for (let i = 0; i < 5; i++) {
    const r = 4.6 - i * 0.9;
    sink.addSpan(ux - r, roofY + i * 1.5, tz - r, ux + r, roofY + (i + 1) * 1.5, tz + r, HOTEL_ROOF);
  }

  // Verandah wrapping the ocean side
  sink.addSpan(x - 3.5, baseY, z + d, x + w + 3.5, baseY + 0.25, z + d + 3.5, C.wood);
  for (let px = x - 3; px < x + w + 3; px += 4) post(sink, px, baseY + 0.25, z + d + 3.0, 3.4, 0.35, HOTEL_WOOD);
  sink.addSpan(x - 3.5, baseY + 3.65, z + d, x + w + 3.5, baseY + 4.1, z + d + 3.5, HOTEL_ROOF);
  sink.addSpan(x - 3.5, baseY + 0.25, z + d + 3.2, x + w + 3.5, baseY + 1.15, z + d + 3.5, HOTEL_WOOD, 'thin');

  // Palms along the drive
  for (let i = 0; i < 6; i++) {
    const px = x + 3 + i * ((w - 6) / 5);
    const pz = z - 6;
    const g = terrain.heightAt(px, pz);
    if (!Number.isFinite(g) || g < 2) continue;
    post(sink, px, g, pz, 8 + rng() * 3, 0.5, 0x8a7a56);
    const ty = g + 8 + rng() * 3;
    for (let f = 0; f < 5; f++) {
      const a = (f / 5) * Math.PI * 2;
      sink.addSpan(
        px + Math.cos(a) * 0.4, ty, pz + Math.sin(a) * 0.4,
        px + Math.cos(a) * 3.2, ty + 0.5, pz + Math.sin(a) * 3.2, 0x3f7a34, 'thin'
      );
    }
  }

  stats.buildings++;   // makeBuilding already registered the footprint
  return true;
}

/**
 * Beach: a sand shelf running from the boardwalk down to the surf, plus a
 * boardwalk and the occasional lifeguard stand.
 *
 * The sand is a *graded ramp*, not a set of tiles seated on the ground. Sampling
 * the heightfield per tile fails here twice over: the shore loses 6 m in 10 m of
 * z, so thin tiles hover over the slope between them, and neighbouring columns
 * land on different noise so the shelf reads as a checkerboard of paving stones.
 * Interpolating from the dry height down to the waterline and burying each slab
 * a few metres into the hill gives one continuous surface instead.
 */
function beach(sink, terrain, x0, x1, zLand, rng) {
  const COL = 6;
  const SEGS = 7;
  for (let x = x0; x < x1; x += COL) {
    const cx = x + COL / 2;
    const landY = terrain.heightAt(cx, zLand);
    if (!Number.isFinite(landY) || landY < 2) continue;
    const shore = findShore(terrain, cx, zLand, +1, 60);
    if (!shore) continue;

    const run = shore.z + 4 - zLand;
    if (run < 4) continue;
    for (let i = 0; i < SEGS; i++) {
      const t0 = i / SEGS;
      const t1 = (i + 1) / SEGS;
      const y = landY + (SEA - 0.3 - landY) * t0;
      sink.addSpan(x, y - 3.5, zLand + run * t0, x + COL, y + 0.1, zLand + run * t1 + 0.3, SAND);
    }
    // Boardwalk plank run at the top of the beach
    sink.addSpan(x, landY, zLand - 2.4, x + COL, landY + 0.22, zLand + 0.2, C.wood, 'thin');

    if (rng() > 0.85) {
      // Lifeguard stand, up on the dry third of the beach
      const lz = zLand + run * 0.3;
      const ly = landY + (SEA - 0.3 - landY) * 0.3;
      const lx = cx - 1.6;
      for (const [ox, oz] of [[0, 0], [3.2, 0], [0, 3.2], [3.2, 3.2]]) post(sink, lx + ox, ly, lz + oz, 3.2, 0.3, C.wood);
      sink.addSpan(lx - 0.5, ly + 3.2, lz - 0.5, lx + 4.0, ly + 3.6, lz + 4.0, C.wood);
      sink.addSpan(lx - 0.5, ly + 3.6, lz - 0.5, lx + 4.0, ly + 5.6, lz - 0.1, C.white);
      sink.addSpan(lx - 0.5, ly + 5.6, lz - 0.7, lx + 4.0, ly + 6.2, lz + 4.2, C.red);
    }
  }
}

/**
 * The village: two cottage rows facing a street, with a short commercial block
 * behind them. Bands are laid out north to south with the porch depth counted,
 * because a 10 m cottage with a 2.6 m porch needs 13 m of band, not 10.
 */
function village(sink, terrain, x, z, w, d, rng, stats) {
  const band = d / 3;
  const rowZ = [z + 1, z + band + 1];
  for (const rz of rowZ) {
    for (let cx = x + 3; cx + 14 < x + w; cx += 17) {
      const cw = 12;
      const cd = 10;
      const s = footprintHeights(terrain, cx, rz, cw, cd);
      if (!Number.isFinite(s.min) || s.min < 2.5) continue;
      const baseY = s.max;
      sink.addSpan(cx - 0.6, s.min - 1.4, rz - 0.6, cx + cw + 0.6, baseY, rz + cd + 0.6, 0xa9a396);
      const floors = 1 + (rng() > 0.65 ? 1 : 0);
      makeBuilding(sink, {
        x: cx, z: rz, w: cw, d: cd, floors, baseY,
        color: pick(rng, [0xf0e8d8, 0xe6d9c0, 0xdce6e4, 0xf2ddc8]), rng,
      });
      const roofY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + (floors - 1) * BUILDINGS.FLOOR_HEIGHT;
      // Low hip roof
      sink.addSpan(cx - 1, roofY, rz - 1, cx + cw + 1, roofY + 1.1, rz + cd + 1, pick(rng, [0x9a5a44, 0x7a6a58, 0x8e6a4a]));
      sink.addSpan(cx + 2, roofY + 1.1, rz + 2, cx + cw - 2, roofY + 2.1, rz + cd - 2, pick(rng, [0x9a5a44, 0x7a6a58]));
      // Porch and a car on the drive
      sink.addSpan(cx + 1, baseY, rz + cd, cx + cw - 1, baseY + 0.2, rz + cd + 2.6, C.wood);
      if (rng() > 0.5) placeVehicle(sink, cx + cw + 1.5, rz + cd + 1, baseY, rng, null, false);
      stats.buildings++;   // makeBuilding already registered the footprint
    }
  }

  // Commercial block behind the second row
  const bz = z + band * 2 + 1;
  for (let cx = x + 8; cx + 20 < x + w; cx += 24) {
    const s = footprintHeights(terrain, cx, bz, 20, 12);
    if (!Number.isFinite(s.min) || s.min < 2.5) continue;
    const baseY = s.max;
    sink.addSpan(cx - 0.5, s.min - 1.2, bz - 0.5, cx + 20.5, baseY, bz + 12.5, C.concrete);
    makeShed(sink, { x: cx, z: bz, w: 20, d: 12, h: 5.2, baseY, color: pick(rng, [0xe8d8be, 0xd8c8b0, 0xf0e0cc]), doorW: 3.4 });
    // Awning + shopfront glass
    sink.addSpan(cx, baseY + 3.0, bz - 2.2, cx + 20, baseY + 3.4, bz, pick(rng, [C.red, C.teal, C.blue]));
    sink.addSpan(cx + 1.5, baseY + 0.3, bz - 0.15, cx + 18.5, baseY + 2.7, bz + 0.1, C.glass, 'thin');
    registerBuilding({ x: cx, z: bz, w: 20, d: 12, floors: 1, baseY, floorYs: [baseY] });
    stats.buildings++;
  }
}

/**
 * Build Coronado. Land pieces seat themselves on the heightfield; ships and
 * piers verify open water and bail rather than beaching.
 */
export function placeCoronado(sink, terrain, p, rng) {
  const stats = { buildings: 0, ships: 0, piers: 0 };

  // --- NAS North Island, west end ---
  airStation(sink, terrain, p.x - 82, p.z - 28, 64, 58, rng, stats);

  // --- village and hotel, east end ---
  village(sink, terrain, p.x - 12, p.z - 34, 60, 39, rng, stats);
  hotelDel(sink, terrain, p.x, p.z + 12, 56, 32, rng, stats);
  // Ocean beach along the south shore, in front of the hotel and the cottages.
  beach(sink, terrain, p.x - 62, p.x + 58, p.z + 46, rng);

  // --- the bay side: piers and the fleet ---
  // Carrier pier walks out from the north shore; the carrier lies alongside to
  // port, bow to the channel. Both root themselves on the real waterline.
  const pierRoot = findShore(terrain, p.x + 1, p.z + 10, -1, 120, 8);
  if (pierRoot) {
    if (quay(sink, terrain, pierRoot.x, pierRoot.z, pierRoot.z - 120, 14, rng)) stats.piers++;
    const b = berth(terrain, pierRoot.x - 38, pierRoot.z - 8, 140, 30, { shift: 8 });
    if (b && carrier(sink, terrain, b.cx, b.z0, b.z1, rng, stats)) {
      // Brow from the quay across to the flight deck
      const brz = b.z0 + (b.z1 - b.z0) * 0.55;
      sink.addSpan(pierRoot.x - 13, SEA + 3, brz, pierRoot.x - 7, SEA + 12.4, brz + 4, CONCRETE);
    }
  }

  // Escort pier further west, a destroyer moored on each side.
  const eRoot = findShore(terrain, p.x - 62, p.z + 10, -1, 120, 6);
  if (eRoot) {
    if (quay(sink, terrain, eRoot.x, eRoot.z, eRoot.z - 78, 11, rng, { crane: false })) stats.piers++;
    for (const ox of [-14, 14]) {
      const b = berth(terrain, eRoot.x + ox, eRoot.z - 12, 72, 9);
      if (b) destroyer(sink, terrain, b.cx, b.z0, b.z1, rng, stats);
    }
  }

  return stats;
}
