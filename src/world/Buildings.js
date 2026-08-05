import { BUILDINGS, POIS } from '../config.js';
import { makeBuilding, makeShed, slab } from './BuildingKit.js';

// San Diego POIs — each has a distinct silhouette for readable rotations.
// Structures sit on the POI's flattened pad where one exists, otherwise they
// are seated on the highest terrain sample under their footprint.

const PAL = BUILDINGS.PALETTE;

function poi(id) {
  return POIS.find((p) => p.id === id);
}

// Highest terrain corner under a footprint -- seating on the max avoids the
// far more visible failure of a building hovering over a dip.
function seatY(terrain, p, x, z, w, d) {
  if (p.flatten !== null && p.flatten !== undefined) return p.flatten;
  let m = -Infinity;
  for (const [ax, az] of [[x, z], [x + w, z], [x, z + d], [x + w, z + d], [x + w / 2, z + d / 2]]) {
    m = Math.max(m, terrain.heightAt(ax, az));
  }
  return m;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

// --- Downtown San Diego: dense city block, tallest loot ---
function buildDowntown(sink, terrain, rng) {
  const p = poi('downtown');
  const cols = 4, rows = 3;
  const bw = 22, bd = 18, street = 12;
  const stepX = bw + street, stepZ = bd + street;
  const x0 = p.x - (cols * stepX - street) / 2;
  const z0 = p.z - (rows * stepZ - street) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = x0 + c * stepX;
      const bz = z0 + r * stepZ;
      // Downtown gets taller mid-block towers.
      const floors = 3 + Math.floor(rng() * 4); // 3-6 stories
      makeBuilding(sink, {
        x: bx, z: bz, w: bw, d: bd, floors,
        baseY: seatY(terrain, p, bx, bz, bw, bd),
        color: pick(rng, PAL), rng,
      });
    }
  }
}

// --- Lindbergh Field / bay: hangars + container yard ---
function buildAirport(sink, terrain, rng) {
  const p = poi('airport');
  const base = p.flatten;

  for (let i = 0; i < 3; i++) {
    const w = 48, d = 26;
    const x = p.x - 70 + i * 55;
    const z = p.z - 50;
    makeShed(sink, { x, z, w, d, h: 11, baseY: seatY(terrain, p, x, z, w, d), color: pick(rng, PAL) });
  }

  makeBuilding(sink, {
    x: p.x - 80, z: p.z + 25, w: 20, d: 16, floors: 2,
    baseY: base, color: PAL[0], rng,
  });

  // Container yard on the bay side
  const CW = 6.06, CH = 2.59, CD = 2.44;
  const yardX = p.x + 15;
  const yardZ = p.z + 15;
  const colors = [0x4a6b7a, 0x7a4a3c, 0x6b7f43, 0x8a8880];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const cx = yardX + col * (CW + 2.2);
      const cz = yardZ + row * (CD + 3.4);
      const stack = rng() > 0.55 ? 2 : 1;
      for (let s = 0; s < stack; s++) {
        sink.addSpan(cx, base + s * CH, cz, cx + CW, base + (s + 1) * CH, cz + CD, colors[(row + col + s) % colors.length]);
      }
      if (rng() > 0.35) {
        const kx = cx + rng() * (CW - 1.6);
        sink.addSpan(kx, base, cz - 1.7, kx + 1.5, base + 1.45, cz - 0.2, 0x8e7a5a);
      }
    }
  }
}

// --- Miramar Ridge: tower + outbuildings on natural high ground ---
function buildMiramar(sink, terrain, rng) {
  const p = poi('miramar');
  const tw = 10, td = 10;
  const tx = p.x - tw / 2, tz = p.z - td / 2;
  const baseY = seatY(terrain, p, tx, tz, tw, td);

  makeBuilding(sink, {
    x: tx, z: tz, w: tw, d: td, floors: 5,
    baseY, color: PAL[4], rng,
  });

  const mastY = baseY + BUILDINGS.GROUND_FLOOR_HEIGHT + 4 * BUILDINGS.FLOOR_HEIGHT;
  sink.addSpan(p.x - 0.5, mastY, p.z - 0.5, p.x + 0.5, mastY + 22, p.z + 0.5, 0x6e6c68);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.6;
    const w = 12, d = 9;
    const x = p.x + Math.cos(a) * 34 - w / 2;
    const z = p.z + Math.sin(a) * 34 - d / 2;
    makeShed(sink, { x, z, w, d, h: 4.5, baseY: seatY(terrain, p, x, z, w, d), color: pick(rng, PAL) });
  }
}

// --- Mission Trails: terraced rocky benches (cover-poor high ground) ---
function buildMissionTrails(sink, terrain, rng) {
  const p = poi('missiontrails');
  // Seat pit floor on terrain under the POI center (no flatten pad).
  const base = terrain.heightAt(p.x, p.z) - 6;
  const benchH = 3.2;
  const rock = 0x6e6c68;
  const rockDark = 0x5d5b58;

  for (let k = 1; k <= 4; k++) {
    const inset = 22 + k * 15;
    const y0 = base + (k - 1) * benchH;
    const y1 = base + k * benchH;
    const c = k % 2 ? rock : rockDark;
    const t = 15;
    sink.addSpan(p.x - inset, y0, p.z - inset, p.x + inset, y1, p.z - inset + t, c);
    sink.addSpan(p.x - inset, y0, p.z + inset - t, p.x + inset, y1, p.z + inset, c);
    sink.addSpan(p.x - inset, y0, p.z - inset + t, p.x - inset + t, y1, p.z + inset - t, c);
    sink.addSpan(p.x + inset - t, y0, p.z - inset + t, p.x + inset, y1, p.z + inset - t, c);
  }

  const rampW = 9;
  for (let k = 0; k < 4; k++) {
    const y = base + k * benchH;
    const z0 = p.z + 22 + k * 15;
    slab(sink, p.x - rampW / 2, z0, p.x + rampW / 2, z0 + 15, y + benchH, rockDark);
  }

  makeShed(sink, { x: p.x - 26, z: p.z - 14, w: 14, d: 10, h: 5, baseY: base, color: PAL[2] });
  makeShed(sink, { x: p.x + 8, z: p.z + 2, w: 12, d: 9, h: 4.5, baseY: base, color: PAL[0] });
}

// --- Balboa Park: large sheds + mid buildings (museums / halls stand-ins) ---
function buildBalboa(sink, terrain, rng) {
  const p = poi('balboa');
  const base = p.flatten;

  makeShed(sink, { x: p.x - 22, z: p.z - 16, w: 40, d: 22, h: 12, baseY: base, color: 0x9a968c, doorW: 5 });
  makeShed(sink, { x: p.x + 28, z: p.z - 10, w: 28, d: 18, h: 10, baseY: base, color: 0x8a8880, doorW: 4 });

  for (let i = 0; i < 2; i++) {
    makeBuilding(sink, {
      x: p.x - 40 + i * 50, z: p.z + 20, w: 18, d: 14, floors: 2 + i,
      baseY: base, color: pick(rng, PAL), rng,
    });
  }

  // Low walls / plaza edges for cover
  for (let i = 0; i < 18; i++) {
    const fx = p.x - 50 + i * 6;
    sink.addSpan(fx, base, p.z + 48, fx + 5, base + 1.15, p.z + 48.3, 0x87857f, 'thin');
  }
}

// --- University City: campus blocks + service sheds ---
function buildUniversity(sink, terrain, rng) {
  const p = poi('university');
  const base = p.flatten;

  for (let i = 0; i < 4; i++) {
    const x = p.x - 45 + (i % 2) * 48;
    const z = p.z - 30 + Math.floor(i / 2) * 40;
    makeBuilding(sink, {
      x, z, w: 24, d: 18, floors: 2 + Math.floor(rng() * 2),
      baseY: base, color: pick(rng, PAL), rng,
    });
  }

  for (let i = 0; i < 3; i++) {
    const x = p.x - 20 + i * 22;
    makeShed(sink, { x, z: p.z + 55, w: 14, d: 10, h: 5, baseY: base, color: 0x87857f });
  }
}

// --- La Jolla: cliffside village — smaller structures + deck cover ---
function buildLaJolla(sink, terrain, rng) {
  const p = poi('lajolla');
  const base = p.flatten;

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 1.4 - 0.4;
    const r = 18 + (i % 3) * 16;
    const w = 12 + rng() * 6;
    const d = 10 + rng() * 4;
    const x = p.x + Math.cos(a) * r - w / 2;
    const z = p.z + Math.sin(a) * r - d / 2;
    makeBuilding(sink, {
      x, z, w, d, floors: 1 + Math.floor(rng() * 3),
      baseY: seatY(terrain, p, x, z, w, d),
      color: pick(rng, PAL), rng,
    });
  }

  // Seaside low walls
  for (let i = 0; i < 12; i++) {
    const wx = p.x - 55 + i * 9;
    sink.addSpan(wx, base, p.z + 40, wx + 7, base + 1.2, p.z + 40.35, 0x9a968c, 'thin');
  }
}

// --- Mission Bay: recreation sheds + scattered small cover ---
function buildMissionBay(sink, terrain, rng) {
  const p = poi('missionbay');
  const base = p.flatten;

  makeShed(sink, { x: p.x - 40, z: p.z - 20, w: 30, d: 16, h: 7, baseY: base, color: 0x4a6b7a, doorW: 4 });
  makeShed(sink, { x: p.x + 10, z: p.z - 15, w: 24, d: 14, h: 6, baseY: base, color: 0x6b7f43, doorW: 3.5 });

  for (let i = 0; i < 10; i++) {
    const a = rng() * Math.PI * 2;
    const r = 20 + rng() * 55;
    const w = 8 + rng() * 4;
    const d = 3.5;
    const x = p.x + Math.cos(a) * r;
    const z = p.z + Math.sin(a) * r;
    makeShed(sink, {
      x, z, w, d, h: 3.0,
      baseY: seatY(terrain, p, x, z, w, d),
      color: pick(rng, PAL), doorW: 1.4,
    });
    sink.addSpan(x + w / 2 - 0.8, base, z - 1.2, x + w / 2 + 0.8, base + 0.6, z, 0x6b5943);
  }
}

// --- Old Town: mixed low buildings near the interchange ---
function buildOldTown(sink, terrain, rng) {
  const p = poi('oldtown');
  const base = p.flatten;

  for (let i = 0; i < 6; i++) {
    const x = p.x - 40 + (i % 3) * 28;
    const z = p.z - 25 + Math.floor(i / 3) * 32;
    makeBuilding(sink, {
      x, z, w: 16 + rng() * 6, d: 12 + rng() * 4, floors: 1 + Math.floor(rng() * 2),
      baseY: base, color: pick(rng, PAL), rng,
    });
  }

  for (let i = 0; i < 4; i++) {
    makeShed(sink, {
      x: p.x - 30 + i * 18, z: p.z + 40, w: 12, d: 8, h: 4,
      baseY: base, color: pick(rng, PAL),
    });
  }
}

export function buildAllStructures(sink, terrain, rng) {
  buildDowntown(sink, terrain, rng);
  buildAirport(sink, terrain, rng);
  buildMiramar(sink, terrain, rng);
  buildMissionTrails(sink, terrain, rng);
  buildBalboa(sink, terrain, rng);
  buildUniversity(sink, terrain, rng);
  buildLaJolla(sink, terrain, rng);
  buildMissionBay(sink, terrain, rng);
  buildOldTown(sink, terrain, rng);
}
