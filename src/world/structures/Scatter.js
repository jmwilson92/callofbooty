import { WORLD, POIS, STRUCTURES } from '../../config.js';
import { poiContains } from '../Poi.js';
import { worldOcc } from '../Buildings.js';
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

  // --- Gas stations along arterials (near roads) ---
  for (let n = 0; n < S.GAS; n++) {
    tryPlace(terrain, rng, 100, (x, z, t) => {
      if (!dryLand(t, x, z, 14)) return false;
      if (tooCloseToPoiCore(x, z, 1.0)) return false;
      // Prefer near roads
      let nearRoad = t.roadAt(x, z) > 0.05;
      for (let k = 0; k < 8 && !nearRoad; k++) {
        const a = (k / 8) * Math.PI * 2;
        if (t.roadAt(x + Math.cos(a) * 18, z + Math.sin(a) * 18) > 0.15) nearRoad = true;
      }
      return nearRoad;
    }, (x, z) => {
      if (!claimFoot(x, z, 28, 24)) return;
      placeGasStation(sink, terrain, x, z, rng);
      stats.gas++;
    });
  }

  // --- Restaurants / fast food ---
  for (let n = 0; n < S.RESTAURANT; n++) {
    tryPlace(terrain, rng, 70, (x, z, t) => {
      if (!dryLand(t, x, z, 16)) return false;
      if (tooCloseToPoiCore(x, z, 0.8)) return false;
      return t.heightAt(x, z) < 50;
    }, (x, z) => {
      if (!claimFoot(x, z, 22, 18)) return;
      placeRestaurant(sink, terrain, x, z, rng, rng() > 0.35);
      stats.restaurant++;
    });
  }

  // --- Auto repair ---
  for (let n = 0; n < S.AUTO; n++) {
    tryPlace(terrain, rng, 60, (x, z, t) => dryLand(t, x, z, 16) && !tooCloseToPoiCore(x, z, 0.85) && t.heightAt(x, z) < 55,
      (x, z) => {
        if (!claimFoot(x, z, 24, 20)) return;
        placeAutoRepair(sink, terrain, x, z, rng);
        stats.auto++;
      });
  }

  // --- Fire stations ---
  for (let n = 0; n < S.FIRE; n++) {
    tryPlace(terrain, rng, 80, (x, z, t) => dryLand(t, x, z, 14) && !tooCloseToPoiCore(x, z, 1.0),
      (x, z) => {
        if (!claimFoot(x, z, 36, 24)) return;
        placeFireStation(sink, terrain, x, z, rng);
        stats.fire++;
      });
  }

  // --- Business centers (mid density) ---
  for (let n = 0; n < S.BUSINESS; n++) {
    tryPlace(terrain, rng, 70, (x, z, t) => {
      if (!dryLand(t, x, z, 14)) return false;
      if (tooCloseToPoiCore(x, z, 0.7)) return false;
      return (Math.abs(x) < 280 && z > -200 && z < 400) || (x > 50 && x < 250 && z < -100);
    }, (x, z) => {
      if (!claimFoot(x, z, 28, 24)) return;
      placeBusinessCenter(sink, terrain, x, z, rng);
      stats.business++;
    });
  }

  // --- Extra towers on downtown fringe (district itself is built in Buildings.js) ---
  const dt = poi('downtown');
  if (dt) {
    let attempts = 0;
    while (stats.sky < S.SKY && attempts < S.SKY * 40) {
      attempts++;
      const a = rng() * Math.PI * 2;
      const r = 100 + rng() * 160;
      const x = dt.x + Math.cos(a) * r;
      const z = dt.z + Math.sin(a) * r;
      if (terrain.heightAt(x, z) < 3 || terrain.slopeDegAt(x, z) > 16) continue;
      if (terrain.roadAt(x, z) > 0.25) continue;
      if (!claimFoot(x - 8, z - 8, 20, 18)) continue;
      const samples = [
        terrain.heightAt(x, z),
        terrain.heightAt(x + 14, z),
        terrain.heightAt(x, z + 14),
        terrain.heightAt(x + 14, z + 14),
        terrain.heightAt(x + 7, z + 7),
      ];
      const lo = Math.min(...samples);
      const hi = Math.max(...samples);
      if (hi - lo > 1.25) continue; // skip dips / uneven fringe lots
      let by = hi;
      if (terrain.downtownPlateY != null) {
        by = Math.max(by, terrain.downtownPlateY - 0.15);
      }
      placeSkylineTower(sink, x - 8, z - 8, by, rng, 12 + Math.floor(rng() * 12));
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

  // Downtown civic + strip
  if (dt) {
    placeFireStation(sink, terrain, dt.x - 80, dt.z - 50, rng);
    placeBusinessCenter(sink, terrain, dt.x + 70, dt.z - 55, rng);
    placeBusinessCenter(sink, terrain, dt.x - 60, dt.z + 50, rng);
    placeGasStation(sink, terrain, dt.x - 100, dt.z + 25, rng);
    placeRestaurant(sink, terrain, dt.x + 85, dt.z + 30, rng, true);
    placeRestaurant(sink, terrain, dt.x + 40, dt.z - 70, rng, false);
    placeBillboard(sink, terrain, dt.x - 50, dt.z + 70, rng);
    stats.fire++;
    stats.business += 2;
    stats.gas++;
    stats.restaurant += 2;
    stats.billboard++;
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
