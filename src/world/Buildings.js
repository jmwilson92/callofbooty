import { BUILDINGS, POIS } from '../config.js';
import { makeBuilding, makeShed, slab } from './BuildingKit.js';
import { placeDowntownDistrict, placeVehicle } from './structures/Catalog.js';
import { Occupancy } from './Occupancy.js';
import { claimRoadCorridors, placeParkingLotDetails } from './Roads.js';
import { worldLadders } from './Ladders.js';

// San Diego POIs — anchors only; buildings seat on natural terrain.

const PAL = BUILDINGS.PALETTE;
// Shared world occupancy — prevents POI structures from stacking.
export const worldOcc = new Occupancy(10);

export function resetOccupancy() {
  worldOcc.rects.length = 0;
  worldOcc.buckets.clear();
}

function poi(id) {
  return POIS.find((p) => p.id === id);
}

// Highest terrain under a footprint (no flatten pads). Dense sample = no float.
function seatY(terrain, p, x, z, w = 0, d = 0) {
  let m = terrain.heightAt(x, z);
  if (w || d) {
    const samples = [
      [0, 0], [1, 0], [0, 1], [1, 1],
      [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5], [0.5, 0.5],
      [0.25, 0.25], [0.75, 0.75],
    ];
    for (const [u, v] of samples) {
      m = Math.max(m, terrain.heightAt(x + w * u, z + d * v));
    }
  }
  return m;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

// --- Downtown: satellite-style grid + packed high-rises (downtown.png) ---
// Local occupancy only — world road claims use fat AABB stamps that blanketed
// every block when freeways skimmed the district. Buildings still avoid roads
// via terrain.roadAt inside placeDowntownDistrict.
function buildDowntown(sink, terrain, rng) {
  const p = poi('downtown');
  const local = new Occupancy(12);
  placeDowntownDistrict(sink, terrain, p.x, p.z, null, rng, local);
  // Publish footprints so scatter structures don't stack on towers
  for (const r of local.rects) {
    worldOcc.claim(r.x0, r.z0, r.x1 - r.x0, r.z1 - r.z0, 0, true);
  }
}

function claimOrSkip(x, z, w, d) {
  return worldOcc.tryClaim(x, z, w, d, 2);
}

// --- San Diego International Airport: hangars + container/yard cover ---
function buildAirport(sink, terrain, rng) {
  const p = poi('airport');

  // Terminal / hangar row
  for (let i = 0; i < 4; i++) {
    const w = 50, d = 26;
    const x = p.x - 90 + i * 55;
    const z = p.z - 48;
    makeShed(sink, {
      x, z, w, d, h: 12,
      baseY: seatY(terrain, p, x, z, w, d),
      color: pick(rng, [0x8a8880, 0x87857f, 0x9a968c]),
    });
  }

  // Control / office block
  const ox = p.x - 70, oz = p.z + 30;
  makeBuilding(sink, {
    x: ox, z: oz, w: 22, d: 16, floors: 3,
    baseY: seatY(terrain, p, ox, oz, 22, 16), color: PAL[0], rng,
  });

  // Cargo containers on the apron
  const CW = 6.06, CH = 2.59, CD = 2.44;
  const yardX = p.x + 10;
  const yardZ = p.z + 20;
  const colors = [0x4a6b7a, 0x7a4a3c, 0x6b7f43, 0x8a8880];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const cx = yardX + col * (CW + 2.2);
      const cz = yardZ + row * (CD + 3.4);
      const base = seatY(terrain, p, cx, cz, CW, CD);
      const stack = rng() > 0.55 ? 2 : 1;
      for (let s = 0; s < stack; s++) {
        sink.addSpan(
          cx, base + s * CH, cz,
          cx + CW, base + (s + 1) * CH, cz + CD,
          colors[(row + col + s) % colors.length]
        );
      }
      if (rng() > 0.35) {
        const kx = cx + rng() * (CW - 1.6);
        sink.addSpan(kx, base, cz - 1.7, kx + 1.5, base + 1.45, cz - 0.2, 0x8e7a5a);
      }
    }
  }
}

// --- MCRD Depot: disciplined barracks grid + drill field ---
function buildMcrd(sink, terrain, rng) {
  const p = poi('mcrd');
  const base = seatY(terrain, p, p.x, p.z, 24, 24);

  // Barracks rows — long low buildings in a grid
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = p.x - 55 + c * 30;
      const z = p.z - 45 + r * 28;
      makeBuilding(sink, {
        x, z, w: 24, d: 12, floors: 2,
        baseY: base,
        color: pick(rng, [0x6b5943, 0x8a8880, 0x87857f]),
        rng,
      });
    }
  }

  // HQ / admin
  makeBuilding(sink, {
    x: p.x - 14, z: p.z + 50, w: 28, d: 18, floors: 3,
    baseY: base, color: 0x87857f, rng,
  });

  // Low perimeter walls / cover on the drill edge
  for (let i = 0; i < 16; i++) {
    const fx = p.x - 70 + i * 9;
    sink.addSpan(fx, base, p.z + 72, fx + 7.5, base + 1.15, p.z + 72.35, 0x6e6c68, 'thin');
  }

  // Obstacle / crate line for mid-field cover
  for (let i = 0; i < 8; i++) {
    const cx = p.x - 40 + i * 11;
    sink.addSpan(cx, base, p.z + 8, cx + 2.2, base + 1.5, p.z + 10, 0x5c6166);
  }
}

// --- Point Loma: ridge housing + lighthouse tower ---
function buildPointLoma(sink, terrain, rng) {
  const p = poi('pointloma');
  const base = seatY(terrain, p, p.x, p.z, 24, 24);

  makeBuilding(sink, {
    x: p.x - 6, z: p.z - 6, w: 12, d: 12, floors: 4,
    baseY: base, color: PAL[4], rng,
  });
  const mastY = base + BUILDINGS.GROUND_FLOOR_HEIGHT + 3 * BUILDINGS.FLOOR_HEIGHT;
  sink.addSpan(p.x - 0.6, mastY, p.z - 0.6, p.x + 0.6, mastY + 18, p.z + 0.6, 0x9a968c);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 1.7 + 0.3;
    const r = 24 + (i % 2) * 16;
    const w = 14, d = 10;
    const x = p.x + Math.cos(a) * r - w / 2;
    const z = p.z + Math.sin(a) * r - d / 2;
    makeBuilding(sink, {
      x, z, w, d, floors: 1 + Math.floor(rng() * 2),
      baseY: seatY(terrain, p, x, z, w, d),
      color: pick(rng, PAL), rng,
    });
  }

  // Cliff-edge low walls
  for (let i = 0; i < 10; i++) {
    const wx = p.x - 50 + i * 10;
    sink.addSpan(wx, base, p.z + 48, wx + 8, base + 1.2, p.z + 48.35, 0x9a968c, 'thin');
  }
}

// --- Mission Valley: hotel / mall blocks on the valley floor ---
function buildMissionValley(sink, terrain, rng) {
  const p = poi('missionvalley');
  const base = seatY(terrain, p, p.x, p.z, 24, 24);

  // Big box / mall sheds along the valley
  makeShed(sink, {
    x: p.x - 70, z: p.z - 30, w: 55, d: 32, h: 14,
    baseY: base, color: 0x8a8880, doorW: 8,
  });
  makeShed(sink, {
    x: p.x + 10, z: p.z - 24, w: 48, d: 28, h: 12,
    baseY: base, color: 0x9a968c, doorW: 6,
  });

  // Hotel towers
  for (let i = 0; i < 3; i++) {
    makeBuilding(sink, {
      x: p.x - 50 + i * 40, z: p.z + 30, w: 20, d: 16,
      floors: 4 + Math.floor(rng() * 3),
      baseY: base, color: pick(rng, PAL), rng,
    });
  }

  // Parking / low cover
  for (let i = 0; i < 12; i++) {
    const vx = p.x - 60 + (i % 6) * 22;
    const vz = p.z + 55 + Math.floor(i / 6) * 14;
    sink.addSpan(vx, base, vz, vx + 4.8, base + 1.5, vz + 2.0, 0x5c6166);
  }
}

// --- Kearny Mesa: commercial / industrial plateau ---
function buildKearnyMesa(sink, terrain, rng) {
  const p = poi('kearnymesa');
  const base = seatY(terrain, p, p.x, p.z, 24, 24);

  // Office / light industrial grid
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = p.x - 50 + c * 38;
      const z = p.z - 45 + r * 36;
      const industrial = rng() > 0.45;
      if (industrial) {
        makeShed(sink, {
          x, z, w: 28 + rng() * 8, d: 20 + rng() * 6, h: 8 + rng() * 4,
          baseY: base, color: pick(rng, [0x87857f, 0x6b5943, 0x8a8880]),
          doorW: 5,
        });
      } else {
        makeBuilding(sink, {
          x, z, w: 22, d: 16, floors: 2 + Math.floor(rng() * 3),
          baseY: base, color: pick(rng, PAL), rng,
        });
      }
    }
  }

  // Transformer / utility blocks as hard cover
  for (let i = 0; i < 6; i++) {
    const tx = p.x - 40 + i * 16;
    sink.addSpan(tx, base, p.z + 55, tx + 3.2, base + 2.4, p.z + 57.5, 0x5c6166);
  }
}

// --- Balboa Park: museum halls + plaza walls ---
function buildBalboa(sink, terrain, rng) {
  const p = poi('balboa');
  const base = seatY(terrain, p, p.x, p.z, 24, 24);

  // Large exhibition halls
  makeShed(sink, {
    x: p.x - 40, z: p.z - 28, w: 48, d: 26, h: 14,
    baseY: base, color: 0x9a968c, doorW: 6,
  });
  makeShed(sink, {
    x: p.x + 20, z: p.z - 20, w: 36, d: 22, h: 12,
    baseY: base, color: 0x8a8880, doorW: 5,
  });

  // Museum wings / galleries
  for (let i = 0; i < 3; i++) {
    makeBuilding(sink, {
      x: p.x - 50 + i * 42, z: p.z + 18, w: 22, d: 16,
      floors: 2 + (i === 1 ? 1 : 0),
      baseY: base, color: pick(rng, PAL), rng,
    });
  }

  // Plaza edge walls (low cover)
  for (let i = 0; i < 14; i++) {
    const fx = p.x - 55 + i * 8;
    sink.addSpan(fx, base, p.z + 48, fx + 6.5, base + 1.15, p.z + 48.3, 0x87857f, 'thin');
  }
}

// --- San Diego Zoo: pavilions + winding low walls / habitat sheds ---
function buildZoo(sink, terrain, rng) {
  const p = poi('zoo');
  const base = seatY(terrain, p, p.x, p.z, 24, 24);

  // Entry / large pavilion
  makeShed(sink, {
    x: p.x - 20, z: p.z - 30, w: 40, d: 24, h: 11,
    baseY: base, color: 0x6b7f43, doorW: 6,
  });

  // Habitat sheds scattered on a ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 28 + (i % 3) * 10;
    const w = 12 + rng() * 6;
    const d = 10 + rng() * 4;
    const x = p.x + Math.cos(a) * r - w / 2;
    const z = p.z + Math.sin(a) * r - d / 2;
    makeShed(sink, {
      x, z, w, d, h: 4 + rng() * 3,
      baseY: seatY(terrain, p, x, z, w, d),
      color: pick(rng, [0x6b7f43, 0x8a8b52, 0x7a4a3c, 0x8a8880]),
      doorW: 2.5,
    });
  }

  // Viewing platforms / mid buildings
  makeBuilding(sink, {
    x: p.x - 8, z: p.z + 8, w: 16, d: 14, floors: 2,
    baseY: base, color: PAL[5], rng,
  });

  // Winding low habitat walls for cover
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const r = 42;
    const x = p.x + Math.cos(a) * r;
    const z = p.z + Math.sin(a) * r;
    const x2 = p.x + Math.cos(a + 0.25) * r;
    const z2 = p.z + Math.sin(a + 0.25) * r;
    const minX = Math.min(x, x2), maxX = Math.max(x, x2);
    const minZ = Math.min(z, z2), maxZ = Math.max(z, z2);
    sink.addSpan(
      minX, base, minZ,
      Math.max(minX + 1.2, maxX), base + 1.3, Math.max(minZ + 0.5, maxZ),
      0x6b5943, 'thin'
    );
  }
}

// --- Coronado: resort strip across the bay ---
function buildCoronado(sink, terrain, rng) {
  const p = poi('coronado');
  const base = seatY(terrain, p, p.x, p.z, 24, 24);

  // Hotel del–scale block
  makeBuilding(sink, {
    x: p.x - 30, z: p.z - 16, w: 40, d: 24, floors: 5,
    baseY: base, color: 0x9a968c, rng,
  });
  makeBuilding(sink, {
    x: p.x + 18, z: p.z - 12, w: 24, d: 18, floors: 3,
    baseY: base, color: PAL[5], rng,
  });

  // Beach cottages / small sheds along the strip
  for (let i = 0; i < 7; i++) {
    makeShed(sink, {
      x: p.x - 45 + i * 14, z: p.z + 24, w: 10, d: 7, h: 3.4,
      baseY: base, color: pick(rng, PAL),
    });
  }

  // Seawall cover
  for (let i = 0; i < 12; i++) {
    const wx = p.x - 50 + i * 9;
    sink.addSpan(wx, base, p.z + 42, wx + 7.5, base + 1.1, p.z + 42.35, 0x9a968c, 'thin');
  }
}

// --- La Jolla: cliffside village on the NW coast ---
function buildLaJolla(sink, terrain, rng) {
  const p = poi('lajolla');
  const base = seatY(terrain, p, p.x, p.z, 24, 24);

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 1.5 - 0.3;
    const r = 18 + (i % 3) * 14;
    const w = 12 + rng() * 5;
    const d = 10 + rng() * 4;
    const x = p.x + Math.cos(a) * r - w / 2;
    const z = p.z + Math.sin(a) * r - d / 2;
    makeBuilding(sink, {
      x, z, w, d, floors: 1 + Math.floor(rng() * 3),
      baseY: seatY(terrain, p, x, z, w, d),
      color: pick(rng, PAL), rng,
    });
  }

  makeShed(sink, {
    x: p.x - 8, z: p.z + 20, w: 18, d: 12, h: 5,
    baseY: base, color: 0x8fa0a8, doorW: 3,
  });

  for (let i = 0; i < 10; i++) {
    const wx = p.x - 45 + i * 9;
    sink.addSpan(wx, base, p.z + 42, wx + 7, base + 1.15, p.z + 42.3, 0x9a968c, 'thin');
  }
}

// --- Radio Tower: summit outpost on the eastern mountain spine ---
function buildRadioTower(sink, terrain, rng) {
  const p = poi('radiotower');
  const base = seatY(terrain, p, p.x - 5, p.z - 5, 12, 12);

  // Equipment building under the mast
  const tw = 12, td = 12;
  const tx = p.x - tw / 2, tz = p.z - td / 2;
  makeBuilding(sink, {
    x: tx, z: tz, w: tw, d: td, floors: 3,
    baseY: base, color: 0x6e6c68, rng,
  });

  // Main lattice mast (silhouette landmark)
  const mastY = base + BUILDINGS.GROUND_FLOOR_HEIGHT + 2 * BUILDINGS.FLOOR_HEIGHT;
  sink.addSpan(p.x - 0.7, mastY, p.z - 0.7, p.x + 0.7, mastY + 36, p.z + 0.7, 0x8a8880);
  // Cross-arms
  sink.addSpan(p.x - 4, mastY + 28, p.z - 0.35, p.x + 4, mastY + 29.2, p.z + 0.35, 0x6e6c68);
  sink.addSpan(p.x - 0.35, mastY + 22, p.z - 3.5, p.x + 0.35, mastY + 23.2, p.z + 3.5, 0x6e6c68);
  // Beacon tip
  sink.addSpan(p.x - 0.9, mastY + 36, p.z - 0.9, p.x + 0.9, mastY + 38.5, p.z + 0.9, 0xc44a3c);

  // Outbuildings ring
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const r = 28;
    const w = 10, d = 8;
    const x = p.x + Math.cos(a) * r - w / 2;
    const z = p.z + Math.sin(a) * r - d / 2;
    makeShed(sink, {
      x, z, w, d, h: 4.5,
      baseY: seatY(terrain, p, x, z, w, d),
      color: pick(rng, [0x6e6c68, 0x87857f, 0x5d5b58]),
    });
  }

  // Generator blocks / hard cover on the pad
  for (let i = 0; i < 5; i++) {
    const gx = p.x - 18 + i * 9;
    sink.addSpan(gx, base, p.z + 16, gx + 2.8, base + 2.2, p.z + 18.5, 0x5c6166);
  }

  // Perimeter sandbags / low wall
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = 38;
    const x = p.x + Math.cos(a) * r;
    const z = p.z + Math.sin(a) * r;
    const x2 = p.x + Math.cos(a + 0.4) * r;
    const z2 = p.z + Math.sin(a + 0.4) * r;
    const minX = Math.min(x, x2), maxX = Math.max(x, x2);
    const minZ = Math.min(z, z2), maxZ = Math.max(z, z2);
    sink.addSpan(
      minX, base, minZ,
      Math.max(minX + 1.0, maxX), base + 1.25, Math.max(minZ + 0.45, maxZ),
      0x8e7a5a, 'thin'
    );
  }
}

export function buildAllStructures(sink, terrain, rng) {
  resetOccupancy();
  worldLadders.clear();
  // Roads win: claim freeways/arterials/ramps/downtown streets before any building
  if (terrain.roadLines) claimRoadCorridors(worldOcc, terrain.roadLines);
  buildDowntown(sink, terrain, rng);
  buildAirport(sink, terrain, rng);
  buildMcrd(sink, terrain, rng);
  buildPointLoma(sink, terrain, rng);
  buildMissionValley(sink, terrain, rng);
  buildKearnyMesa(sink, terrain, rng);
  buildBalboa(sink, terrain, rng);
  buildZoo(sink, terrain, rng);
  buildCoronado(sink, terrain, rng);
  buildRadioTower(sink, terrain, rng);
  buildLaJolla(sink, terrain, rng);
  // Parking lot curbs + white stalls + cars (asphalt already in heightfield)
  if (terrain.parkingLots?.length) {
    placeParkingLotDetails(sink, terrain, terrain.parkingLots, rng, placeVehicle);
  }
}
