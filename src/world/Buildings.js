import { BUILDINGS, POIS } from '../config.js';
import { makeBuilding, makeShed, slab } from './BuildingKit.js';

// Seven hand-placed points of interest, each with a distinct silhouette.
// Structures sit on the POI's flattened pad where one exists, otherwise they
// are seated on the highest terrain sample under their footprint so nothing
// floats or sinks.

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

// --- The Grid: dense city block, 12 buildings of 2-4 stories, highest loot ---
function buildGrid(sink, terrain, rng) {
  const p = poi('grid');
  const cols = 4, rows = 3;
  const bw = 22, bd = 18, street = 12;
  const stepX = bw + street, stepZ = bd + street;
  const x0 = p.x - (cols * stepX - street) / 2;
  const z0 = p.z - (rows * stepZ - street) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = x0 + c * stepX;
      const bz = z0 + r * stepZ;
      const floors = 2 + Math.floor(rng() * 3); // 2-4 stories
      makeBuilding(sink, {
        x: bx, z: bz, w: bw, d: bd, floors,
        baseY: seatY(terrain, p, bx, bz, bw, bd),
        color: pick(rng, PAL), rng,
      });
    }
  }
}

// --- Harbor: warehouses plus a container yard, coastal ---
function buildHarbor(sink, terrain, rng) {
  const p = poi('harbor');
  const base = p.flatten;

  for (let i = 0; i < 3; i++) {
    const w = 42, d = 24;
    const x = p.x - 60 + i * 50;
    const z = p.z - 55;
    makeShed(sink, { x, z, w, d, h: 9, baseY: seatY(terrain, p, x, z, w, d), color: pick(rng, PAL) });
  }

  // A small two-storey office so the POI has an interior route to a roof.
  makeBuilding(sink, {
    x: p.x - 70, z: p.z + 30, w: 18, d: 16, floors: 2,
    baseY: base, color: PAL[0], rng,
  });

  // Container yard. Containers are 2.59 m tall -- taller than the 1.6 m mantle
  // limit -- so crates are placed alongside as an intermediate step, giving a
  // real crate -> container mantle chain.
  const CW = 6.06, CH = 2.59, CD = 2.44;
  const yardX = p.x + 10;
  const yardZ = p.z + 20;
  const colors = [0x4a6b7a, 0x7a4a3c, 0x6b7f43, 0x8a8880];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const cx = yardX + col * (CW + 2.2);
      const cz = yardZ + row * (CD + 3.4);
      const stack = rng() > 0.6 ? 2 : 1;
      for (let s = 0; s < stack; s++) {
        sink.addSpan(cx, base + s * CH, cz, cx + CW, base + (s + 1) * CH, cz + CD, colors[(row + col + s) % colors.length]);
      }
      // Step crate against the container's long face.
      if (rng() > 0.35) {
        const kx = cx + rng() * (CW - 1.6);
        sink.addSpan(kx, base, cz - 1.7, kx + 1.5, base + 1.45, cz - 0.2, 0x8e7a5a);
      }
    }
  }
}

// --- Radio Hill: tower plus three outbuildings on natural high ground ---
function buildRadioHill(sink, terrain, rng) {
  const p = poi('radiohill');
  const tw = 10, td = 10;
  const tx = p.x - tw / 2, tz = p.z - td / 2;
  const baseY = seatY(terrain, p, tx, tz, tw, td);

  makeBuilding(sink, {
    x: tx, z: tz, w: tw, d: td, floors: 5,
    baseY, color: PAL[4], rng,
  });

  // Antenna mast above the tower roof -- silhouette, no collision surprise.
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

// --- Quarry: terraced benches around a low pit floor, deliberately cover-poor ---
function buildQuarry(sink, terrain, rng) {
  const p = poi('quarry');
  const base = p.flatten;
  const benchH = 3.2;
  const rock = 0x6e6c68;
  const rockDark = 0x5d5b58;

  // Concentric benches stepping up and outward from the pit floor.
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

  // A ramp cut through the benches so the pit floor is reachable on foot.
  const rampW = 9;
  for (let k = 0; k < 4; k++) {
    const y = base + k * benchH;
    const z0 = p.z + 22 + k * 15;
    slab(sink, p.x - rampW / 2, z0, p.x + rampW / 2, z0 + 15, y + benchH, rockDark);
  }

  // Two equipment sheds on the pit floor.
  makeShed(sink, { x: p.x - 26, z: p.z - 14, w: 14, d: 10, h: 5, baseY: base, color: PAL[2] });
  makeShed(sink, { x: p.x + 8, z: p.z + 2, w: 12, d: 9, h: 4.5, baseY: base, color: PAL[0] });
}

// --- Farmstead: barn, silos, outbuildings ---
function buildFarm(sink, terrain, rng) {
  const p = poi('farm');
  const base = p.flatten;

  makeShed(sink, { x: p.x - 18, z: p.z - 12, w: 34, d: 20, h: 10, baseY: base, color: 0x7a4a3c, doorW: 5 });

  // Three silos. Boxes stand in for cylinders at placeholder-art fidelity.
  for (let i = 0; i < 3; i++) {
    const sx = p.x + 26 + i * 11;
    const sz = p.z - 6;
    sink.addSpan(sx, base, sz, sx + 8, base + 17, sz + 8, 0x9a968c);
    sink.addSpan(sx - 0.4, base + 17, sz - 0.4, sx + 8.4, base + 18.6, sz + 8.4, 0x6e6c68);
  }

  makeBuilding(sink, {
    x: p.x - 40, z: p.z + 18, w: 14, d: 12, floors: 2,
    baseY: base, color: PAL[5], rng,
  });
  makeShed(sink, { x: p.x - 6, z: p.z + 26, w: 16, d: 10, h: 4.2, baseY: base, color: PAL[3] });

  // Fence line along the field edge -- low cover, vaultable.
  for (let i = 0; i < 26; i++) {
    const fx = p.x - 60 + i * 5;
    sink.addSpan(fx, base, p.z + 46, fx + 4.2, base + 1.2, p.z + 46.25, 0x6b5943, 'thin');
  }
}

// --- Substation: transformer sheds and pylons ---
function buildSubstation(sink, terrain, rng) {
  const p = poi('substation');
  const base = p.flatten;

  for (let i = 0; i < 3; i++) {
    const x = p.x - 30 + i * 24;
    makeShed(sink, { x, z: p.z - 8, w: 16, d: 12, h: 5.5, baseY: base, color: 0x87857f });
  }

  // Transformer blocks -- hard cover on an open pad.
  for (let i = 0; i < 8; i++) {
    const tx = p.x - 34 + (i % 4) * 20;
    const tz = p.z + 18 + Math.floor(i / 4) * 14;
    sink.addSpan(tx, base, tz, tx + 3.2, base + 2.6, tz + 2.2, 0x5c6166);
  }

  // Pylons: four legs plus a cross member, no interior.
  for (let i = 0; i < 3; i++) {
    const px = p.x - 26 + i * 26;
    const pz = p.z - 40;
    for (const [ox, oz] of [[0, 0], [4, 0], [0, 4], [4, 4]]) {
      sink.addSpan(px + ox, base, pz + oz, px + ox + 0.7, base + 26, pz + oz + 0.7, 0x6e6c68);
    }
    sink.addSpan(px - 3, base + 26, pz - 3, px + 7.7, base + 27.4, pz + 7.7, 0x6e6c68);
  }
}

// --- Trailer Row: scattered small structures, good rotations ---
function buildTrailers(sink, terrain, rng) {
  const p = poi('trailers');
  const base = p.flatten;
  for (let i = 0; i < 12; i++) {
    const a = rng() * Math.PI * 2;
    const r = 12 + rng() * 62;
    const w = 9 + rng() * 4;
    const d = 3.4;
    const x = p.x + Math.cos(a) * r;
    const z = p.z + Math.sin(a) * r;
    makeShed(sink, {
      x, z, w, d, h: 3.0,
      baseY: seatY(terrain, p, x, z, w, d),
      color: pick(rng, PAL), doorW: 1.4,
    });
    // Step block at the door so trailers are enterable and mantle-able.
    sink.addSpan(x + w / 2 - 0.8, base, z - 1.2, x + w / 2 + 0.8, base + 0.6, z, 0x6b5943);
  }
}

export function buildAllStructures(sink, terrain, rng) {
  buildGrid(sink, terrain, rng);
  buildHarbor(sink, terrain, rng);
  buildRadioHill(sink, terrain, rng);
  buildQuarry(sink, terrain, rng);
  buildFarm(sink, terrain, rng);
  buildSubstation(sink, terrain, rng);
  buildTrailers(sink, terrain, rng);
}
