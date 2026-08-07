import { WORLD, POIS, STRUCTURES } from '../../config.js';
import { poiContains } from '../Poi.js';
import { worldOcc } from '../Buildings.js';
import { downtownPlan } from '../DowntownPlan.js';
import {
  placeSuburbanHome,
  placeTrailer,
  placeGasStation,
  placeRestaurant,
  placeAutoRepair,
  placeFireStation,
  placeBusinessCenter,
  placeSkyscraper,
  placeSkylineTower,
  placeBoatHouse,
  placeHarborPier,
  placeBridge,
  placeAnimal,
  placeBillboard,
  placeVehicle,
} from './Catalog.js';

// Region-aware placement of landmark structures across San Diego.

function tooCloseToPoiCore(x, z, scale = 0.85) {
  for (const p of POIS) {
    if (poiContains(p, x, z, scale)) return true;
  }
  return false;
}

function claimFoot(x, z, w = 18, d = 16) {
  return worldOcc.tryClaim(x, z, w, d, 2.5);
}

/** Inside the downtown block grid (with optional padding), where nothing scatters. */
function insideCity(x, z, pad = 0) {
  const b = downtownPlan().bounds;
  return x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad;
}

function poi(id) {
  return POIS.find((p) => p.id === id);
}

function tryPlace(terrain, rng, attempts, pred, placeFn) {
  const half = WORLD.SIZE / 2 - 50;
  for (let i = 0; i < attempts; i++) {
    const x = (rng() * 2 - 1) * half;
    const z = (rng() * 2 - 1) * half;
    if (!pred(x, z, terrain)) continue;
    // A placeFn that returns false could not claim its footprint — keep looking
    // rather than burning the whole structure on one contested spot.
    if (placeFn(x, z) === false) continue;
    return true;
  }
  return false;
}

/** True if any road passes within `r` metres — used to grow fill along routes. */
function nearRoad(terrain, x, z, r = 50) {
  if (terrain.roadAt(x, z) > 0.05) return true;
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    if (terrain.roadAt(x + Math.cos(a) * r, z + Math.sin(a) * r) > 0.12) return true;
  }
  return false;
}

function dryLand(terrain, x, z, maxSlope = 22) {
  const h = terrain.heightAt(x, z);
  if (h < 3) return false;
  if (h > 90) return false; // leave high mountains mostly wild
  if (terrain.slopeDegAt(x, z) > maxSlope) return false;
  if (terrain.roadAt(x, z) > 0.2) return false;
  // Don't drop scatter props into residual dips on the downtown plate
  if (terrain.downtownPlateY != null && terrain.onDowntownPlate?.(x, z)) {
    if (h < terrain.downtownPlateY - 1.2) return false;
  }
  return true;
}

/** True if point sits on the leveled downtown city plate (skyline grid). */
function onDowntownPlate(terrain, x, z) {
  return !!(terrain.onDowntownPlate?.(x, z));
}

export function scatterStructures(sink, terrain, rng) {
  const S = STRUCTURES;
  const stats = {
    suburban: 0, trailer: 0, gas: 0, restaurant: 0, auto: 0,
    fire: 0, business: 0, sky: 0, boat: 0, billboard: 0, animal: 0, vehicle: 0,
  };

  // Large footprints go first. Business centers are 30x26 and the fringe
  // towers need a 24x22 pad; the small fill below claims 190 house lots and
  // saturates the same mid-city band, which left both of these placing zero.
  // --- Business centers (mid density) — not on downtown plate ---
  for (let n = 0; n < S.BUSINESS; n++) {
    tryPlace(terrain, rng, 70, (x, z, t) => {
      if (!dryLand(t, x, z, 14)) return false;
      if (tooCloseToPoiCore(x, z, 0.85)) return false;
      if (onDowntownPlate(t, x, z)) return false;
      // Ban orphan "city hall" pads that were stacking west of skyline
      if (x > 15 && x < 110 && z > 300 && z < 460) return false;
      return (Math.abs(x) < 280 && z > -200 && z < 400) || (x > 50 && x < 250 && z < -100);
    }, (x, z) => {
      if (!claimFoot(x, z, 30, 26)) return false;
      placeBusinessCenter(sink, terrain, x, z, rng);
      stats.business++;
    });
  }

  // Extra towers: east/north rim of downtown only — never west orphans (~35,433)
  const dt = poi('downtown');
  if (dt) {
    let attempts = 0;
    while (stats.sky < S.SKY && attempts < S.SKY * 60) {
      attempts++;
      // East or north only (angle ~ -0.4π .. 0.4π east, or north band)
      const east = rng() > 0.35;
      const a = east
        ? (rng() - 0.5) * 0.9 // mostly +X
        : -Math.PI * 0.5 + (rng() - 0.5) * 0.7; // mostly -Z (north in our map)
      // Outside the block grid and clear of the ring road, so these read as the
      // fringe towers beyond the district rather than strays inside it.
      const r = 195 + rng() * 45;
      const x = dt.x + Math.cos(a) * r;
      const z = dt.z + Math.sin(a) * r;
      // Kill west side completely (user: three towers around 35, 433)
      if (x < dt.x - 40) continue;
      if (insideCity(x, z, 12)) continue;
      if (x < 80) continue;
      if (terrain.heightAt(x, z) < 3 || terrain.slopeDegAt(x, z) > 12) continue;
      if (terrain.roadAt(x, z) > 0.2) continue;
      if (!claimFoot(x - 8, z - 8, 24, 22)) continue;
      const samples = [
        terrain.heightAt(x, z),
        terrain.heightAt(x + 14, z),
        terrain.heightAt(x, z + 14),
        terrain.heightAt(x + 14, z + 14),
        terrain.heightAt(x + 7, z + 7),
      ];
      const lo = Math.min(...samples);
      const hi = Math.max(...samples);
      if (hi - lo > 1.0) continue;
      const by = hi;
      const tw = 12 + rng() * 4;
      const td = 12 + rng() * 4;
      placeSkylineTower(sink, x - tw * 0.5, z - td * 0.5, by, rng, 12 + Math.floor(rng() * 10), terrain, {
        w: tw,
        d: td,
      });
      stats.sky++;
    }
  }

  // --- Suburban homes: mid-city rings (Clairemont / Kearny / Mission valleys) ---
  for (let n = 0; n < S.SUBURBAN; n++) {
    const ok = tryPlace(terrain, rng, 120, (x, z, t) => {
      if (!dryLand(t, x, z, 18)) return false;
      if (tooCloseToPoiCore(x, z, 0.9)) return false;
      // Prefer north/central mesas, avoid pure downtown bay core
      if (z > 380 && Math.abs(x) < 150) return false;
      if (x > 450) return false; // not deep mountains
      // Housing follows the road network — that is what makes the map read as
      // continuous rather than as a handful of islands. It is a preference, not
      // a rule: the western coastal shelf has few roads and still needs to fill.
      return nearRoad(t, x, z, 75) || rng() > 0.6;
    }, (x, z) => {
      if (!claimFoot(x, z, 16, 14)) return false;
      placeSuburbanHome(sink, terrain, x, z, rng);
      stats.suburban++;
    });
    // Don't abandon the whole quota because one draw came up empty; the
    // predicate is picky enough that a single miss is not a signal.
    if (!ok && stats.suburban > S.SUBURBAN * 0.8) break;
  }

  // --- Trailer parks: pockets near bay flats and valley edges ---
  for (let n = 0; n < S.TRAILER; n++) {
    tryPlace(terrain, rng, 60, (x, z, t) => {
      if (!dryLand(t, x, z, 16)) return false;
      if (tooCloseToPoiCore(x, z, 0.85)) return false;
      const h = t.heightAt(x, z);
      return h > 4 && h < 35;
    }, (x, z) => {
      const count = 3 + Math.floor(rng() * 3);
      for (let i = 0; i < count; i++) {
        const tx = x + (i % 3) * 16;
        const tz = z + Math.floor(i / 3) * 12;
        if (!claimFoot(tx, tz, 14, 6)) continue;
        placeTrailer(sink, terrain, tx, tz, rng);
        stats.trailer++;
      }
    });
  }

  // --- Gas stations along arterials (near roads) — not inside downtown blocks ---
  for (let n = 0; n < S.GAS; n++) {
    tryPlace(terrain, rng, 100, (x, z, t) => {
      if (!dryLand(t, x, z, 14)) return false;
      if (tooCloseToPoiCore(x, z, 1.0)) return false;
      if (onDowntownPlate(t, x, z)) return false;
      // Prefer near roads
      let nearRoad = t.roadAt(x, z) > 0.05;
      for (let k = 0; k < 8 && !nearRoad; k++) {
        const a = (k / 8) * Math.PI * 2;
        if (t.roadAt(x + Math.cos(a) * 18, z + Math.sin(a) * 18) > 0.15) nearRoad = true;
      }
      return nearRoad;
    }, (x, z) => {
      if (!claimFoot(x, z, 30, 26)) return false;
      placeGasStation(sink, terrain, x, z, rng);
      stats.gas++;
    });
  }

  // --- Restaurants / fast food ---
  for (let n = 0; n < S.RESTAURANT; n++) {
    tryPlace(terrain, rng, 70, (x, z, t) => {
      if (!dryLand(t, x, z, 16)) return false;
      if (tooCloseToPoiCore(x, z, 0.8)) return false;
      if (onDowntownPlate(t, x, z)) return false;
      return t.heightAt(x, z) < 50;
    }, (x, z) => {
      if (!claimFoot(x, z, 22, 18)) return false;
      placeRestaurant(sink, terrain, x, z, rng, rng() > 0.35);
      stats.restaurant++;
    });
  }

  // --- Auto repair ---
  for (let n = 0; n < S.AUTO; n++) {
    tryPlace(terrain, rng, 60, (x, z, t) => {
      if (!dryLand(t, x, z, 16)) return false;
      if (tooCloseToPoiCore(x, z, 0.85)) return false;
      if (onDowntownPlate(t, x, z)) return false;
      return t.heightAt(x, z) < 55;
    }, (x, z) => {
      if (!claimFoot(x, z, 24, 20)) return false;
      placeAutoRepair(sink, terrain, x, z, rng);
      stats.auto++;
    });
  }

  // --- Fire stations (never on downtown plate / into skyline blocks) ---
  for (let n = 0; n < S.FIRE; n++) {
    tryPlace(terrain, rng, 80, (x, z, t) => {
      if (!dryLand(t, x, z, 14)) return false;
      if (tooCloseToPoiCore(x, z, 1.05)) return false;
      if (onDowntownPlate(t, x, z)) return false;
      // Keep clear of west fringe that was clipping city hall / grid (~35–100, 310–430)
      if (x > 10 && x < 120 && z > 280 && z < 450) return false;
      return true;
    }, (x, z) => {
      if (!claimFoot(x, z, 40, 28)) return false;
      placeFireStation(sink, terrain, x, z, rng);
      stats.fire++;
    });
  }


  // --- Boat houses along coasts / bays ---
  for (let n = 0; n < S.BOAT; n++) {
    tryPlace(terrain, rng, 90, (x, z, t) => {
      const h = t.heightAt(x, z);
      if (h < 0.5 || h > 12) return false;
      if (t.slopeDegAt(x, z) > 20) return false;
      // Near water: sample slightly downhill/west
      const hw = t.heightAt(x - 12, z);
      return hw < 1.5 || t.heightAt(x, z + 12) < 1.5;
    }, (x, z) => {
      if (!claimFoot(x - 20, z, 30, 14)) return false;
      placeBoatHouse(sink, terrain, x, z, rng);
      stats.boat++;
    });
  }

  // --- Billboards ---
  for (let n = 0; n < S.BILLBOARD; n++) {
    tryPlace(terrain, rng, 40, (x, z, t) => dryLand(t, x, z, 20) && !tooCloseToPoiCore(x, z, 0.5),
      (x, z) => {
        if (!claimFoot(x - 2, z - 2, 8, 6)) return false;
        placeBillboard(sink, terrain, x, z, rng);
        stats.billboard++;
      });
  }

  // --- Parked vehicles near roads (never inside building footprints) ---
  for (let n = 0; n < S.VEHICLE; n++) {
    tryPlace(terrain, rng, 50, (x, z, t) => {
      if (!dryLand(t, x, z, 18)) return false;
      // Stay off pavement center, hug the shoulder
      if (t.roadAt(x, z) > 0.12) return false;
      const nearRoad = t.roadAt(x + 10, z) > 0.25 || t.roadAt(x - 10, z) > 0.25
        || t.roadAt(x, z + 10) > 0.25 || t.roadAt(x, z - 10) > 0.25;
      return nearRoad;
    }, (x, z) => {
      // Claim a car-sized pad so we never stack into towers / props
      if (!claimFoot(x, z, 5.2, 2.4)) return false;
      placeVehicle(sink, x, z, terrain.heightAt(x, z), rng);
      stats.vehicle++;
    });
  }

  // --- Hand-placed landmarks ---
  placeLandmarkStructures(sink, terrain, rng, stats);

  return stats;
}

function placeLandmarkStructures(sink, terrain, rng, stats) {
  // Fixed POI extras: claim before placing. Without this, a hand-tuned offset
  // that happens to land on another structure silently intersects it — which is
  // how the Kearny Mesa strip ended up with buildings inside each other.
  // The offsets are hand-placed for composition, so rather than dropping one
  // that no longer fits, walk it outward in a short spiral until it does.
  const fixed = (x, z, w, d, place) => {
    const RINGS = [0, 12, 24, 36];
    for (const r of RINGS) {
      const steps = r === 0 ? 1 : 8;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const px = x + Math.cos(a) * r;
        const pz = z + Math.sin(a) * r;
        // Deliberately no terrain test: these are authored spots and always
        // were placed unconditionally. The only new rule is that they may not
        // sit on top of something else.
        if (insideCity(px, pz, 8)) continue;
        if (!claimFoot(px, pz, w, d)) continue;
        place(px, pz);
        return true;
      }
    }
    return false;
  };

  // Harbor Island: a marina on the bay shore west of the airport. This used to
  // be two container terminals with gantry cranes, which — now that MCRD sits
  // just north of here — made the whole approach to the depot read as a
  // shipyard. The real waterfront on this stretch is pleasure craft.
  const ap = poi('airport');
  if (ap) {
    for (let i = 0; i < 5; i++) {
      const bx = ap.x - 120 + i * 26;
      const bz = ap.z + 34 + (i % 2) * 16;
      if (claimFoot(bx - 20, bz, 30, 14)) {
        placeBoatHouse(sink, terrain, bx, bz, rng);
        stats.boat++;
      }
    }
  }

  // Coronado bridge-style span (island → downtown approach)
  const cor = poi('coronado');
  const dt = poi('downtown');
  if (cor && dt) {
    placeBridge(sink, terrain, cor.x + 40, cor.z - 20, dt.x - 30, dt.z + 40, 14, 14);
  }

  // Mission Valley overpass feel (short span across valley trench)
  const mv = poi('missionvalley');
  if (mv) {
    placeBridge(sink, terrain, mv.x - 80, mv.z - 30, mv.x - 80, mv.z + 50, 16, 12);
    placeBridge(sink, terrain, mv.x + 90, mv.z - 40, mv.x + 90, mv.z + 45, 15, 12);
  }

  // Point Loma's two boathouses used to be dropped unguarded at +40,+30 and
  // +55,+55. Those offsets are inside Fort Rosecrans now, and structures/
  // PointLoma.js gives the peninsula a real waterfront out on Ballast Point.

  // La Jolla cove boathouse
  const lj = poi('lajolla');
  if (lj) {
    placeBoatHouse(sink, terrain, lj.x + 30, lj.z + 20, rng);
    placeFireStation(sink, terrain, lj.x + 50, lj.z - 10, rng);
    stats.fire++;
    stats.boat++;
  }

  // Zoo concessions. The animals used to be scattered loose on a ring around the
  // anchor and the "habitat sheds" were restaurants on a 55 m circle — both of
  // which now land inside the real enclosures built by structures/Zoo.js, so the
  // residents live in their habitats and only the food stands are placed here.
  const zoo = poi('zoo');
  if (zoo) {
    for (const [ox, oz] of [[-28, 112], [26, 110], [-64, 74]]) {
      if (fixed(zoo.x + ox, zoo.z + oz, 22, 18,
        (x, z) => placeRestaurant(sink, terrain, x, z, rng, true))) stats.restaurant++;
    }
  }

  // Downtown civic + strip — the approach roads into the district, outside the
  // block grid. Every offset here is a site verified clear of the freeway
  // corridors and the grid; if you move a freeway, re-check them.
  if (dt) {
    const civic = [
      // Southern approach strip, along the road in from Coronado / the bay
      { kind: 'fire', x: dt.x - 10, z: dt.z + 170, w: 40, d: 28 },
      { kind: 'restF', x: dt.x - 50, z: dt.z + 170, w: 22, d: 18 },
      { kind: 'restS', x: dt.x - 90, z: dt.z + 170, w: 22, d: 18 },
      { kind: 'biz', x: dt.x - 150, z: dt.z + 170, w: 30, d: 26 },
      { kind: 'bill', x: dt.x + 50, z: dt.z + 170, w: 8, d: 6 },
      // Northern approach off the valley
      { kind: 'biz', x: dt.x - 120, z: dt.z - 150, w: 30, d: 26 },
      // Eastern approach toward Balboa
      { kind: 'gas', x: dt.x + 250, z: dt.z + 120, w: 30, d: 26 },
    ];
    for (const s of civic) {
      // Hard ban anything that would land inside the block grid
      if (insideCity(s.x, s.z, 10)) continue;
      if (!claimFoot(s.x, s.z, s.w, s.d)) continue;
      if (s.kind === 'fire') {
        placeFireStation(sink, terrain, s.x, s.z, rng);
        stats.fire++;
      } else if (s.kind === 'biz') {
        placeBusinessCenter(sink, terrain, s.x, s.z, rng);
        stats.business++;
      } else if (s.kind === 'gas') {
        placeGasStation(sink, terrain, s.x, s.z, rng);
        stats.gas++;
      } else if (s.kind === 'restF') {
        placeRestaurant(sink, terrain, s.x, s.z, rng, true);
        stats.restaurant++;
      } else if (s.kind === 'restS') {
        placeRestaurant(sink, terrain, s.x, s.z, rng, false);
        stats.restaurant++;
      } else if (s.kind === 'bill') {
        placeBillboard(sink, terrain, s.x, s.z, rng);
        stats.billboard++;
      }
    }
  }

  // Balboa food + signs
  const bal = poi('balboa');
  if (bal) {
    if (fixed(bal.x - 40, bal.z + 50, 22, 18, (x, z) => placeRestaurant(sink, terrain, x, z, rng, false))) stats.restaurant++;
    if (fixed(bal.x + 50, bal.z - 30, 8, 6, (x, z) => placeBillboard(sink, terrain, x, z, rng))) stats.billboard++;
  }

  // Kearny Mesa commercial strip (dense)
  const km = poi('kearnymesa');
  if (km) {
    if (fixed(km.x + 45, km.z + 35, 30, 26, (x, z) => placeBusinessCenter(sink, terrain, x, z, rng))) stats.business++;
    if (fixed(km.x - 55, km.z - 25, 30, 26, (x, z) => placeBusinessCenter(sink, terrain, x, z, rng))) stats.business++;
    if (fixed(km.x - 55, km.z + 25, 24, 20, (x, z) => placeAutoRepair(sink, terrain, x, z, rng))) stats.auto++;
    if (fixed(km.x - 35, km.z - 55, 30, 26, (x, z) => placeGasStation(sink, terrain, x, z, rng))) stats.gas++;
    if (fixed(km.x + 60, km.z - 45, 22, 18, (x, z) => placeRestaurant(sink, terrain, x, z, rng, true))) stats.restaurant++;
    if (fixed(km.x + 30, km.z + 50, 22, 18, (x, z) => placeRestaurant(sink, terrain, x, z, rng, true))) stats.restaurant++;
    if (fixed(km.x + 70, km.z + 10, 40, 28, (x, z) => placeFireStation(sink, terrain, x, z, rng))) stats.fire++;
    if (fixed(km.x - 70, km.z + 40, 8, 6, (x, z) => placeBillboard(sink, terrain, x, z, rng))) stats.billboard++;
  }

  // Mission Valley mall strip
  if (mv) {
    if (fixed(mv.x + 75, mv.z + 25, 22, 18, (x, z) => placeRestaurant(sink, terrain, x, z, rng, true))) stats.restaurant++;
    if (fixed(mv.x - 75, mv.z - 20, 22, 18, (x, z) => placeRestaurant(sink, terrain, x, z, rng, false))) stats.restaurant++;
    if (fixed(mv.x + 40, mv.z - 55, 22, 18, (x, z) => placeRestaurant(sink, terrain, x, z, rng, true))) stats.restaurant++;
    if (fixed(mv.x + 55, mv.z - 55, 30, 26, (x, z) => placeGasStation(sink, terrain, x, z, rng))) stats.gas++;
    if (fixed(mv.x - 90, mv.z + 30, 30, 26, (x, z) => placeBusinessCenter(sink, terrain, x, z, rng))) stats.business++;
    if (fixed(mv.x + 100, mv.z, 8, 6, (x, z) => placeBillboard(sink, terrain, x, z, rng))) stats.billboard++;
  }

  // MCRD support — outside the wire. These offsets used to land inside the
  // depot, and being unguarded they punched a fire station through the barracks.
  const mcrd = poi('mcrd');
  if (mcrd) {
    const fx = mcrd.x - 5;
    const fz = mcrd.z - 100;
    if (!insideCity(fx, fz) && claimFoot(fx, fz, 40, 28)) {
      placeFireStation(sink, terrain, fx, fz, rng);
      stats.fire++;
    }
    const bx = mcrd.x;
    const bz = mcrd.z - 80;
    if (claimFoot(bx, bz, 8, 6)) {
      placeBillboard(sink, terrain, bx, bz, rng);
      stats.billboard++;
    }
  }
  if (ap) {
    if (fixed(ap.x + 75, ap.z - 25, 24, 20, (x, z) => placeAutoRepair(sink, terrain, x, z, rng))) stats.auto++;
    if (fixed(ap.x + 40, ap.z - 60, 30, 26, (x, z) => placeGasStation(sink, terrain, x, z, rng))) stats.gas++;
    // Harbor pier moved off the airport's west side: gantry cranes and stacked
    // containers 200 m from MCRD made the whole approach read as a shipyard.
    // San Diego's working terminal is on the bay south of downtown anyway.
    fixed(-150, 470, 60, 20, (x, z) => placeHarborPier(sink, terrain, x, z, rng));
  }

  // Coronado's own extras used to be dropped here — a restaurant at +40,-30 and
  // a boat house at -40,+20. structures/Coronado.js now owns the whole island
  // (airfield, village, hotel, quays) and claims it, so anything scattered on
  // those offsets would spiral out into the bay looking for a free lot.
}
