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
    placeFn(x, z);
    return true;
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

  // --- Suburban homes: mid-city rings (Clairemont / Kearny / Mission valleys) ---
  for (let n = 0; n < S.SUBURBAN; n++) {
    const ok = tryPlace(terrain, rng, 80, (x, z, t) => {
      if (!dryLand(t, x, z, 18)) return false;
      if (tooCloseToPoiCore(x, z, 0.9)) return false;
      // Prefer north/central mesas, avoid pure downtown bay core
      if (z > 380 && Math.abs(x) < 150) return false;
      if (x > 450) return false; // not deep mountains
      return true;
    }, (x, z) => {
      if (!claimFoot(x, z, 16, 14)) return;
      placeSuburbanHome(sink, terrain, x, z, rng);
      stats.suburban++;
    });
    if (!ok) break;
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
      if (!claimFoot(x, z, 30, 26)) return;
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
      if (!claimFoot(x, z, 22, 18)) return;
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
      if (!claimFoot(x, z, 24, 20)) return;
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
      if (!claimFoot(x, z, 40, 28)) return;
      placeFireStation(sink, terrain, x, z, rng);
      stats.fire++;
    });
  }

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
      if (!claimFoot(x, z, 30, 26)) return;
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
      if (!claimFoot(x - 20, z, 30, 14)) return;
      placeBoatHouse(sink, terrain, x, z, rng);
      stats.boat++;
    });
  }

  // --- Billboards ---
  for (let n = 0; n < S.BILLBOARD; n++) {
    tryPlace(terrain, rng, 40, (x, z, t) => dryLand(t, x, z, 20) && !tooCloseToPoiCore(x, z, 0.5),
      (x, z) => {
        if (!claimFoot(x - 2, z - 2, 8, 6)) return;
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
      if (!claimFoot(x, z, 5.2, 2.4)) return;
      placeVehicle(sink, x, z, terrain.heightAt(x, z), rng);
      stats.vehicle++;
    });
  }

  // --- Hand-placed landmarks ---
  placeLandmarkStructures(sink, terrain, rng, stats);

  return stats;
}

function placeLandmarkStructures(sink, terrain, rng, stats) {
  // Harbor at airport / bay
  const ap = poi('airport');
  if (ap) {
    placeHarborPier(sink, terrain, ap.x - 90, ap.z + 40, rng);
    placeHarborPier(sink, terrain, ap.x - 50, ap.z + 70, rng);
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

  // Point Loma boathouses
  const pl = poi('pointloma');
  if (pl) {
    placeBoatHouse(sink, terrain, pl.x + 40, pl.z + 30, rng);
    placeBoatHouse(sink, terrain, pl.x + 55, pl.z + 55, rng);
    stats.boat += 2;
  }

  // La Jolla cove boathouse
  const lj = poi('lajolla');
  if (lj) {
    placeBoatHouse(sink, terrain, lj.x + 30, lj.z + 20, rng);
    placeFireStation(sink, terrain, lj.x + 50, lj.z - 10, rng);
    stats.fire++;
    stats.boat++;
  }

  // Zoo animals — mixed habitats around the pad
  const zoo = poi('zoo');
  if (zoo) {
    const kinds = ['large', 'tall', 'bulk', 'small', 'bird', 'long', 'large', 'tall', 'small', 'bird', 'bulk', 'long'];
    for (let i = 0; i < STRUCTURES.ANIMALS; i++) {
      const a = (i / STRUCTURES.ANIMALS) * Math.PI * 2 + rng() * 0.4;
      const r = 12 + (i % 5) * 10 + rng() * 8;
      const x = zoo.x + Math.cos(a) * r;
      const z = zoo.z + Math.sin(a) * r;
      const y = terrain.heightAt(x, z);
      if (y < 2) continue;
      placeAnimal(sink, x, z, y, rng, kinds[i % kinds.length]);
      stats.animal++;
    }
    // Extra habitat sheds around zoo edge
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      placeRestaurant(sink, terrain, zoo.x + Math.cos(a) * 55, zoo.z + Math.sin(a) * 55, rng, true);
      stats.restaurant++;
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
    placeRestaurant(sink, terrain, bal.x - 40, bal.z + 50, rng, false);
    placeBillboard(sink, terrain, bal.x + 50, bal.z - 30, rng);
    stats.restaurant++;
    stats.billboard++;
  }

  // Kearny Mesa commercial strip (dense)
  const km = poi('kearnymesa');
  if (km) {
    placeBusinessCenter(sink, terrain, km.x + 45, km.z + 35, rng);
    placeBusinessCenter(sink, terrain, km.x - 55, km.z - 25, rng);
    placeAutoRepair(sink, terrain, km.x - 55, km.z + 25, rng);
    placeGasStation(sink, terrain, km.x - 35, km.z - 55, rng);
    placeRestaurant(sink, terrain, km.x + 60, km.z - 45, rng, true);
    placeRestaurant(sink, terrain, km.x + 30, km.z + 50, rng, true);
    placeFireStation(sink, terrain, km.x + 70, km.z + 10, rng);
    placeBillboard(sink, terrain, km.x - 70, km.z + 40, rng);
    stats.business += 2;
    stats.auto++;
    stats.gas++;
    stats.restaurant += 2;
    stats.fire++;
    stats.billboard++;
  }

  // Mission Valley mall strip
  if (mv) {
    placeRestaurant(sink, terrain, mv.x + 75, mv.z + 25, rng, true);
    placeRestaurant(sink, terrain, mv.x - 75, mv.z - 20, rng, false);
    placeRestaurant(sink, terrain, mv.x + 40, mv.z - 55, rng, true);
    placeGasStation(sink, terrain, mv.x + 55, mv.z - 55, rng);
    placeBusinessCenter(sink, terrain, mv.x - 90, mv.z + 30, rng);
    placeBillboard(sink, terrain, mv.x + 100, mv.z, rng);
    stats.restaurant += 3;
    stats.gas++;
    stats.business++;
    stats.billboard++;
  }

  // MCRD / Airport support
  const mcrd = poi('mcrd');
  if (mcrd) {
    placeFireStation(sink, terrain, mcrd.x + 55, mcrd.z - 35, rng);
    placeBillboard(sink, terrain, mcrd.x - 40, mcrd.z + 40, rng);
    stats.fire++;
    stats.billboard++;
  }
  if (ap) {
    placeAutoRepair(sink, terrain, ap.x + 75, ap.z - 25, rng);
    placeGasStation(sink, terrain, ap.x + 40, ap.z - 60, rng);
    placeHarborPier(sink, terrain, ap.x - 120, ap.z + 20, rng);
    stats.auto++;
    stats.gas++;
  }

  // Coronado resort extras
  if (cor) {
    placeRestaurant(sink, terrain, cor.x + 40, cor.z - 30, rng, false);
    placeBoatHouse(sink, terrain, cor.x - 40, cor.z + 20, rng);
    stats.restaurant++;
    stats.boat++;
  }
}
