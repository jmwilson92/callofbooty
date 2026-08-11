// Plants the map from the capture's own land cover.
//
//   node tools/maps3d-vegetation.mjs --out out
//
// The capture classifies the ground: wood, grass, wetland, sand, rock, urban.
// maps3d-surfaces.mjs already baked that into the G channel of the surface map,
// along with paving in R and water in B, so the scatter needs nothing new out
// of the glTF — it needs to know where NOT to plant, and the surface map plus
// the building plan answer that between them.
//
// The rules are all rejections, and that is deliberate. The last four times
// something in this pipeline came out wrong it was a rule that silently
// excluded what it was meant to include, so every rejection here is counted
// and printed. A class that plants nothing says so in the table rather than
// quietly contributing zero.
//
// Output goes into the same packed buffer as the buildings and the road kit —
// same nine floats, same kinds mechanism — so Tools/build_sandiego.py spawns it
// through the instanced path it already has. Re-running truncates the buffer
// back to what it was before the first vegetation pass instead of appending a
// second forest on top of the first.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const OUT = arg('out', 'out');
const SEED = parseInt(arg('seed', '20260811'), 10);

const side = JSON.parse(readFileSync(join(OUT, 'sandiego.json'), 'utf8'));
const RES = side.resolution;
const FRAME = side.frameMetres.width;
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;

const cityPath = join(OUT, 'city.json');
const city = JSON.parse(readFileSync(cityPath, 'utf8'));
const STRIDE = city.buildingStride;
const binPath = join(OUT, city.buildingFile);
let bin = readFileSync(binPath);

// A re-run replaces the last pass rather than stacking on it.
const baseCount = city.vegetation?.baseCount ?? city.buildingCount;
if (baseCount !== city.buildingCount) {
  console.log('truncating %d earlier plants', city.buildingCount - baseCount);
}
bin = bin.subarray(0, baseCount * STRIDE * 4);

const kinds = city.kinds.slice();
const kindIndex = (name) => {
  let i = kinds.indexOf(name);
  if (i < 0) { kinds.push(name); i = kinds.length - 1; }
  return i;
};
const K_TREE = kindIndex('tree');
const K_TRUNK = kindIndex('tree_trunk');
const K_SHRUB = kindIndex('shrub');
const K_ROCK = kindIndex('rock');

// ── Terrain ─────────────────────────────────────────────────────────────────
const r16 = readFileSync(join(OUT, 'sandiego.r16'));
const heightAt = (u, v) => {
  const c = Math.max(0, Math.min(RES - 1, Math.round(u * (RES - 1))));
  const r = Math.max(0, Math.min(RES - 1, Math.round(v * (RES - 1))));
  return LO + (r16.readUInt16LE((r * RES + c) * 2) / 65535) * (HI - LO);
};

// ── Surface map ─────────────────────────────────────────────────────────────
function decodeRGB(buf) {
  let off = 8; let w = 0; let h = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 2) throw new Error('expected 8-bit RGB');
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const rawPx = inflateSync(Buffer.concat(idat));
  const stride = w * 3;
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    const f = rawPx[y * (stride + 1)];
    const line = rawPx.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    const up = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= 3 ? out[i - 3] : 0;
      const b = up ? up[i] : 0;
      const c = up && i >= 3 ? up[i - 3] : 0;
      let val = line[i];
      if (f === 1) val += a;
      else if (f === 2) val += b;
      else if (f === 3) val += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        val += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = val & 255;
    }
  }
  return { w, h, px };
}
const surf = decodeRGB(readFileSync(join(OUT, 'sandiego-surfaces.png')));
const SURF_M_PER_PX = FRAME / (surf.w - 1);

/** Cover code at (u, v), and whether anything within `margin` pixels is paved
 *  or wet. One lookup, because all three answers come off the same pixels. */
function probe(u, v, margin) {
  const c0 = Math.round(u * (surf.w - 1));
  const r0 = Math.round(v * (surf.h - 1));
  if (c0 < 0 || r0 < 0 || c0 >= surf.w || r0 >= surf.h) return null;
  const cover = surf.px[(r0 * surf.w + c0) * 3 + 1];
  let blocked = false;
  for (let dr = -margin; dr <= margin && !blocked; dr++) {
    const r = r0 + dr;
    if (r < 0 || r >= surf.h) continue;
    for (let dc = -margin; dc <= margin; dc++) {
      const c = c0 + dc;
      if (c < 0 || c >= surf.w) continue;
      const i = (r * surf.w + c) * 3;
      if (surf.px[i] || surf.px[i + 2]) { blocked = true; break; }
    }
  }
  return { cover, blocked };
}

// ── Where the buildings already are ─────────────────────────────────────────
// A 4 m occupancy grid, stamped from BUILDINGS ONLY.
//
// Stamping every part in the buffer was the first version, and it rejected
// 20,131 street trees: the road kit is in there too, so a 2.5 m margin around
// every kerb piece walled off both verges of every street in the city — the
// exact strip street trees go in. Carriageway is already handled by the R
// channel of the surface map, which is the right instrument for it.
const OCC_M = 4;
const OCC = Math.ceil(FRAME / OCC_M);
const occupied = new Uint8Array(OCC * OCC);
const MARGIN_M = 2.5;
// Listed by what is NOT a structure, not by what is.
//
// This was a hand-kept list of building kind names, and when `pad` was added it
// was not in it, so 37 plants ended up standing inside slabs. That is the fifth
// time a literal list in this pipeline has stopped matching what is actually
// built. Inverting it does not remove the list, but it changes which way a new
// kind fails: an unknown kind is now treated as something to keep clear of,
// which costs a few trees, rather than as open ground, which puts a tree
// through a wall.
const NOT_A_STRUCTURE = new Set([
  'road_deck', 'line_white', 'line_yellow', 'kerb', 'path', 'water',
  'sign', 'sign_post', 'lamp', 'lamp_post',
  'tree', 'tree_trunk', 'palm', 'shrub', 'rock',
]);
const buildingKind = new Set(kinds
  .map((n, i) => (NOT_A_STRUCTURE.has(n) ? -1 : i))
  .filter((i) => i >= 0));
console.log('avoiding %d of %d kinds as structures: %s',
  buildingKind.size, kinds.length,
  kinds.filter((n) => !NOT_A_STRUCTURE.has(n)).join(', '));
let stamped = 0;
let stampedParts = 0;
for (let i = 0; i < baseCount; i++) {
  const o = i * STRIDE * 4;
  if (!buildingKind.has(Math.round(bin.readFloatLE(o + 24)))) continue;
  stampedParts++;
  const u = bin.readFloatLE(o);
  const v = bin.readFloatLE(o + 4);
  const rot = (bin.readFloatLE(o + 8) * Math.PI) / 180;
  const w = bin.readFloatLE(o + 12) + MARGIN_M * 2;
  const d = bin.readFloatLE(o + 16) + MARGIN_M * 2;
  const cx = u * FRAME; const cy = v * FRAME;
  const ca = Math.cos(rot); const sa = Math.sin(rot);
  const reach = Math.ceil(Math.max(w, d) / 2 / OCC_M) + 1;
  const gc = Math.round(cx / OCC_M); const gr = Math.round(cy / OCC_M);
  for (let dr = -reach; dr <= reach; dr++) {
    for (let dc = -reach; dc <= reach; dc++) {
      const c = gc + dc; const r = gr + dr;
      if (c < 0 || r < 0 || c >= OCC || r >= OCC) continue;
      const px = c * OCC_M - cx; const py = r * OCC_M - cy;
      // Into the rectangle's own frame, then a plain box test.
      const lx = px * ca + py * sa;
      const ly = -px * sa + py * ca;
      if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= d / 2) {
        occupied[r * OCC + c] = 1;
        stamped++;
      }
    }
  }
}
console.log('%d of %d parts are buildings: %s km2 stamped into a %d m '
  + 'occupancy grid', stampedParts, baseCount,
  ((stamped * OCC_M * OCC_M) / 1e6).toFixed(2), OCC_M);
if (!stampedParts) {
  console.log('  ^ no building kinds matched %s — nothing will be avoided',
    kinds.join(', '));
}

// ── The planting rules ──────────────────────────────────────────────────────
//
// Codes come from maps3d-surfaces.mjs. Spacing is the jittered grid pitch, so
// the real density is a bit under one plant per pitch squared once the
// rejections have taken their share.
const PLANS = [
  {
    name: 'wood', code: 220, spacing: 8,
    tree: { chance: 0.92, h: [6.5, 14.0], canopy: [4.5, 8.5] },
    shrub: { chance: 0.35, size: [1.2, 2.4] },
  },
  {
    name: 'grass', code: 190, spacing: 18,
    tree: { chance: 0.30, h: [5.0, 10.5], canopy: [3.5, 7.0] },
    shrub: { chance: 0.45, size: [0.9, 1.9] },
  },
  {
    name: 'farmland', code: 165, spacing: 34,
    tree: { chance: 0.12, h: [4.5, 8.0], canopy: [3.0, 5.5] },
    shrub: { chance: 0.30, size: [0.8, 1.5] },
  },
  {
    name: 'wetland', code: 140, spacing: 13,
    tree: { chance: 0.06, h: [4.0, 7.5], canopy: [3.0, 5.0] },
    shrub: { chance: 0.80, size: [0.7, 1.6] },
  },
  {
    name: 'rock', code: 80, spacing: 30,
    tree: { chance: 0.05, h: [3.5, 6.0], canopy: [2.5, 4.0] },
    shrub: { chance: 0.55, size: [0.6, 1.4] },
    rock: { chance: 0.35, size: [0.8, 2.6] },
  },
  // Sand is left bare, and urban is left to the buildings.
];
const CODE_TOL = 6;
const MIN_GROUND_M = 0.8;    // below this the spawner treats it as sea anyway
const PAVE_MARGIN_PX = 1;    // about 4 m of clearance from kerbs and water

function rand(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const parts = [];
const push = (u, v, rot, w, d, h, base, kind) => {
  parts.push([u, v, rot, w, d, h, kind, 0, base]);
};

const table = [];
for (const plan of PLANS) {
  const rnd = rand(SEED + plan.code * 7919);
  const step = plan.spacing;
  const n = Math.floor(FRAME / step);
  const rej = { cover: 0, paved: 0, built: 0, sea: 0 };
  let sites = 0; let trees = 0; let shrubs = 0; let rocks = 0;
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const x = (gx + 0.15 + rnd() * 0.7) * step;
      const y = (gy + 0.15 + rnd() * 0.7) * step;
      const u = x / FRAME; const v = y / FRAME;
      const p = probe(u, v, PAVE_MARGIN_PX);
      if (!p) continue;
      if (Math.abs(p.cover - plan.code) > CODE_TOL) { rej.cover++; continue; }
      if (p.blocked) { rej.paved++; continue; }
      const gc = Math.round(x / OCC_M); const gr = Math.round(y / OCC_M);
      if (occupied[gr * OCC + gc]) { rej.built++; continue; }
      if (heightAt(u, v) < MIN_GROUND_M) { rej.sea++; continue; }
      sites++;

      const rot = rnd() * 360;
      if (plan.tree && rnd() < plan.tree.chance) {
        const [h0, h1] = plan.tree.h;
        const [c0, c1] = plan.tree.canopy;
        const th = h0 + rnd() * (h1 - h0);
        const cw = c0 + rnd() * (c1 - c0);
        // Trunk from the ground up; canopy centred on the top of it. The
        // canopy carries a base so the spawner leaves it alone — only what
        // stands on the ground gets sunk into it.
        const trunkW = Math.max(0.25, th * 0.055);
        push(u, v, rot, trunkW, trunkW, th * 0.72, 0, K_TRUNK);
        push(u, v, rot, cw, cw * (0.85 + rnd() * 0.3), cw * 0.9,
          th * 0.72, K_TREE);
        trees++;
      } else if (plan.shrub && rnd() < plan.shrub.chance) {
        const [s0, s1] = plan.shrub.size;
        const s = s0 + rnd() * (s1 - s0);
        push(u, v, rot, s, s * (0.8 + rnd() * 0.4), s * 0.75, 0, K_SHRUB);
        shrubs++;
      } else if (plan.rock && rnd() < plan.rock.chance) {
        const [s0, s1] = plan.rock.size;
        const s = s0 + rnd() * (s1 - s0);
        push(u, v, rot, s, s * (0.7 + rnd() * 0.5), s * 0.55, 0, K_ROCK);
        rocks++;
      }
    }
  }
  table.push({ name: plan.name, sites, trees, shrubs, rocks, rej });
}

console.log('\n%s %s %s %s %s   %s', 'cover'.padEnd(9), 'sites'.padStart(8),
  'trees'.padStart(8), 'shrubs'.padStart(8), 'rocks'.padStart(7),
  'rejected (wrong cover / paved / built / sea)');
for (const t of table) {
  console.log('%s %s %s %s %s   %d / %d / %d / %d',
    t.name.padEnd(9), String(t.sites).padStart(8), String(t.trees).padStart(8),
    String(t.shrubs).padStart(8), String(t.rocks).padStart(7),
    t.rej.cover, t.rej.paved, t.rej.built, t.rej.sea);
  if (!t.sites) {
    console.log('  ^ planted nothing. Either the capture has no %s, or the '
      + 'code moved.', t.name);
  }
}

// ── Street trees ────────────────────────────────────────────────────────────
//
// Land cover alone leaves the streets bare, and San Diego's streets are not
// bare. The centrelines already carry a measured width, so a tree goes on each
// verge at a fixed offset from the kerb. The rejections are different here:
// paving under a street tree is normal — that is the sidewalk — so only an
// actual carriageway (service class and up) blocks one, along with water and
// anything already built.
const STREET = {
  arterial: { spacing: 26, chance: 0.45 },
  collector: { spacing: 24, chance: 0.55 },
  local: { spacing: 22, chance: 0.5 },
};
const VERGE_M = 2.4;
const CARRIAGEWAY_CODE = 120;   // service and above; sidewalks and paths are lower
let roadsDoc = null;
try {
  roadsDoc = JSON.parse(readFileSync(join(OUT, 'roads.json'), 'utf8'));
} catch (err) {
  console.log('\nno roads.json (%s) — skipping street trees', err.message);
}
if (roadsDoc) {
  const rnd = rand(SEED + 104729);
  const rej = { paved: 0, built: 0, sea: 0, off: 0 };
  let street = 0;
  for (const road of roadsDoc.roads) {
    const spec = STREET[road.cls];
    if (!spec) continue;
    const off = road.w / 2 + VERGE_M;
    let carry = rnd() * spec.spacing;
    for (let i = 0; i + 1 < road.pts.length; i++) {
      const ax = road.pts[i][0] * FRAME; const ay = road.pts[i][1] * FRAME;
      const bx = road.pts[i + 1][0] * FRAME; const by = road.pts[i + 1][1] * FRAME;
      const dx = bx - ax; const dy = by - ay;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      const nx = -dy / len; const ny = dx / len;
      for (let t = carry; t < len; t += spec.spacing) {
        const px = ax + (dx * t) / len; const py = ay + (dy * t) / len;
        for (const sgn of [-1, 1]) {
          if (rnd() > spec.chance) continue;
          const x = px + nx * off * sgn; const y = py + ny * off * sgn;
          const u = x / FRAME; const v = y / FRAME;
          if (u < 0 || v < 0 || u > 1 || v > 1) { rej.off++; continue; }
          const c0 = Math.round(u * (surf.w - 1));
          const r0 = Math.round(v * (surf.h - 1));
          const si = (r0 * surf.w + c0) * 3;
          if (surf.px[si] >= CARRIAGEWAY_CODE) { rej.paved++; continue; }
          if (surf.px[si + 2]) { rej.sea++; continue; }
          const gc = Math.round(x / OCC_M); const gr = Math.round(y / OCC_M);
          if (occupied[gr * OCC + gc]) { rej.built++; continue; }
          if (heightAt(u, v) < MIN_GROUND_M) { rej.sea++; continue; }
          const th = 5.5 + rnd() * 3.8;
          const cw = 3.4 + rnd() * 2.6;
          const trunkW = Math.max(0.24, th * 0.05);
          const rot = rnd() * 360;
          push(u, v, rot, trunkW, trunkW, th * 0.68, 0, K_TRUNK);
          push(u, v, rot, cw, cw * (0.9 + rnd() * 0.2), cw * 0.85,
            th * 0.68, K_TREE);
          street++;
        }
      }
      carry = spec.spacing - ((len - carry) % spec.spacing);
    }
  }
  table.push({
    name: 'streets', sites: street, trees: street, shrubs: 0, rocks: 0,
    rej: { cover: 0, paved: rej.paved, built: rej.built, sea: rej.sea },
  });
  console.log('\n%d street trees, rejected %d on carriageway, %d on buildings, '
    + '%d on water, %d outside the frame',
    street, rej.paved, rej.built, rej.sea, rej.off);
}

// ── Append ──────────────────────────────────────────────────────────────────
const add = Buffer.alloc(parts.length * STRIDE * 4);
for (let i = 0; i < parts.length; i++) {
  const p = parts[i];
  for (let k = 0; k < STRIDE; k++) add.writeFloatLE(p[k], (i * STRIDE + k) * 4);
}
writeFileSync(binPath, Buffer.concat([bin, add]));

city.kinds = kinds;
city.buildingCount = baseCount + parts.length;
city.vegetation = {
  producedBy: 'tools/maps3d-vegetation.mjs',
  baseCount,
  parts: parts.length,
  seed: SEED,
  byCover: table.map((t) => ({
    cover: t.name, sites: t.sites, trees: t.trees, shrubs: t.shrubs,
    rocks: t.rocks,
  })),
  note: 'Scattered from the capture\'s land cover, rejecting paving, water, '
    + 'building footprints and anything below the waterline. Re-running '
    + 'truncates the buffer back to baseCount first.',
};
writeFileSync(cityPath, JSON.stringify(city));

const totals = table.reduce((a, t) => ({
  trees: a.trees + t.trees, shrubs: a.shrubs + t.shrubs, rocks: a.rocks + t.rocks,
}), { trees: 0, shrubs: 0, rocks: 0 });
console.log('\n%d trees, %d shrubs, %d rocks -> %d parts appended',
  totals.trees, totals.shrubs, totals.rocks, parts.length);
console.log('%d parts total in %s (%s MB)', city.buildingCount, binPath,
  ((bin.length + add.length) / 1048576).toFixed(1));
