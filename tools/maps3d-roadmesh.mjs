// Builds drivable roads from the recovered centrelines: graded ground, a
// carriageway you can drive on, lane markings that mean something, and signs.
//
//   node tools/maps3d-roadmesh.mjs --dir out [--deck 14]
//
// Reads roads.json and the landscape heightmap, and does three things in an
// order that matters.
//
// FIRST it carves the terrain. A road deck laid on raw ground follows every
// bump the elevation data has, which is undrivable and also z-fights: the deck
// and the landscape are within centimetres of each other over most of their
// length and the depth buffer cannot choose. Real roads are graded before they
// are surfaced, so the ground under each corridor is flattened to a smoothed
// profile along the line first. After that the deck can sit a few centimetres
// proud of flat ground and there is nothing to fight with.
//
// THEN it lays the carriageway on the graded ground.
//
// THEN the markings, which are what make a road read as a road rather than a
// grey stripe: a double yellow centre and dashed lane lines on an arterial, a
// single yellow on a collector, nothing at all on a residential street —
// because that is what is actually painted on them.
//
// Signs go on last, at the junctions the centreline network already knows
// about: a road that ends within a few metres of another road is a junction.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const DIR = arg('dir', 'out');
const DECK_M = parseFloat(arg('deck', '14'));

const side = JSON.parse(readFileSync(join(DIR, 'sandiego.json'), 'utf8'));
const roadsDoc = JSON.parse(readFileSync(join(DIR, 'roads.json'), 'utf8'));
const RES = side.resolution;
const FRAME = side.frameMetres.width;
const M_PER_SAMPLE = FRAME / (RES - 1);
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;

// Elevation as float metres, so the carve can work in real units.
const r16 = readFileSync(join(DIR, 'sandiego.r16'));
const height = new Float32Array(RES * RES);
for (let i = 0; i < height.length; i++) {
  height[i] = LO + (r16.readUInt16LE(i * 2) / 65535) * (HI - LO);
}
const sampleAt = (u, v) => {
  const c = Math.min(RES - 1, Math.max(0, Math.round(u * (RES - 1))));
  const r = Math.min(RES - 1, Math.max(0, Math.round(v * (RES - 1))));
  return height[r * RES + c];
};

// Where the water is. maps3d-water.mjs has not run yet — it runs after this —
// so the heightmap still says the bay is dry ground 3.5 m up. The surface map
// knows better, and steps over water are left for maps3d-bridges.mjs to build
// on piles once the bay has actually been dug.
let wetPx = null; let wetW = 0;
try {
  const buf = readFileSync(join(DIR, 'sandiego-surfaces.png'));
  let off = 8; const idat = [];
  let w = 0; let h = 0;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); }
    else if (type === 'IDAT') idat.push(data);
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
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = v & 255;
    }
  }
  wetPx = px; wetW = w;
} catch (err) {
  console.log('no surface map (%s) — roads over water cannot be detected',
    err.message);
}
const wetAt = (u, v) => {
  if (!wetPx) return false;
  const c = Math.min(wetW - 1, Math.max(0, Math.round(u * (wetW - 1))));
  const r = Math.min(wetW - 1, Math.max(0, Math.round(v * (wetW - 1))));
  return wetPx[(r * wetW + c) * 3 + 2] > 0;
};

// ── What each class carries ─────────────────────────────────────────────────
//
// Deliberately not "every road gets everything". American residential streets
// have no centre line and no edge line; painting them turns a suburb into an
// industrial estate. Kerbs likewise: 1,067 km of kerb both sides is a quarter
// of a million instances for something nobody looks at on a service road.
const SPEC = {
  arterial: { centre: 'double_yellow', laneDashes: true, edge: true, kerb: true },
  collector: { centre: 'yellow', laneDashes: false, edge: true, kerb: true },
  // Bridges are built by tools/maps3d-bridges.mjs, after the water is dug.
  bridge: { skip: true },
  local: { centre: 'none', laneDashes: false, edge: false, kerb: true },
  service: { centre: 'none', laneDashes: false, edge: false, kerb: false },
};

const MARK_W = 0.14;          // painted line width, metres
const MARK_H = 0.02;          // proud of the deck, so it is never coplanar
const DASH_LEN = 3.0;
const DASH_PERIOD = 12.0;
const DECK_THICK = 0.30;
const DECK_LIFT = 0.05;       // above the graded ground
const KERB_H = 0.15;
const KERB_W = 0.40;
const SHOULDER_M = 2.0;       // graded ground either side of the carriageway


// ── Walk the centrelines in metres ──────────────────────────────────────────
function walk(pts, stepM) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0] * FRAME;
    const ay = pts[i - 1][1] * FRAME;
    const bx = pts[i][0] * FRAME;
    const by = pts[i][1] * FRAME;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const n = Math.max(1, Math.round(len / stepM));
    const dir = [(bx - ax) / len, (by - ay) / len];
    for (let s = 0; s < n; s++) {
      const t = (s + 0.5) / n;
      out.push({
        x: ax + (bx - ax) * t,
        y: ay + (by - ay) * t,
        len: len / n,
        dir,
        nrm: [-dir[1], dir[0]],
        head: (Math.atan2(dir[1], dir[0]) * 180) / Math.PI,
      });
    }
  }
  return out;
}

// ── 1. Carve ────────────────────────────────────────────────────────────────
//
// Minor classes first so majors win where they overlap: at a junction the
// arterial's grade is the one that should survive, not the driveway's.
// Bridges are NOT in this list. Grading ground up to meet a bridge deck is
// what builds an embankment across the channel it crosses; a bridge stands on
// piers instead, and the ground under it is left alone.
const CARVE_ORDER = ['service', 'local', 'collector', 'arterial'];
const byClass = {};
for (const r of roadsDoc.roads) (byClass[r.cls] ??= []).push(r);

let carved = 0;
for (const cls of CARVE_ORDER) {
  for (const road of byClass[cls] ?? []) {
    const steps = walk(road.pts, 4);
    if (steps.length < 2) continue;

    // Smooth the elevation along the line before writing it back. This is the
    // grading: a road climbs at a constant rate between two points, it does
    // not reproduce every hummock the survey found under it.
    const raw = steps.map((s) => sampleAt(s.x / FRAME, s.y / FRAME));
    const smooth = new Float32Array(raw.length);
    const R = 12;
    for (let i = 0; i < raw.length; i++) {
      let sum = 0; let n = 0;
      for (let k = Math.max(0, i - R); k <= Math.min(raw.length - 1, i + R); k++) {
        sum += raw[k]; n++;
      }
      smooth[i] = sum / n;
    }

    const halfCorridor = road.w / 2 + SHOULDER_M;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const target = smooth[i];
      const reach = Math.ceil(halfCorridor / M_PER_SAMPLE) + 1;
      const c0 = Math.round(s.x / M_PER_SAMPLE);
      const r0 = Math.round(s.y / M_PER_SAMPLE);
      for (let dr = -reach; dr <= reach; dr++) {
        for (let dc = -reach; dc <= reach; dc++) {
          const c = c0 + dc; const r = r0 + dr;
          if (c < 0 || r < 0 || c >= RES || r >= RES) continue;
          // Distance from the centreline, perpendicular.
          const px = c * M_PER_SAMPLE - s.x;
          const py = r * M_PER_SAMPLE - s.y;
          const perp = Math.abs(px * s.nrm[0] + py * s.nrm[1]);
          const along = Math.abs(px * s.dir[0] + py * s.dir[1]);
          if (along > s.len / 2 + M_PER_SAMPLE) continue;
          if (perp > halfCorridor) continue;
          // Full grade across the carriageway, easing out over the shoulder so
          // the verge meets the natural ground instead of stepping off it.
          const t = Math.min(1, Math.max(0, (perp - road.w / 2) / SHOULDER_M));
          const blend = 1 - t * t * (3 - 2 * t);
          const i2 = r * RES + c;
          height[i2] = height[i2] * (1 - blend) + target * blend;
          carved++;
        }
      }
    }
  }
}
console.log('carved %d heightmap samples (%.2f km2 of graded corridor)',
  carved, (carved * M_PER_SAMPLE * M_PER_SAMPLE) / 1e6);

// ── Junction boxes ──────────────────────────────────────────────────────────
//
// Two centrelines that cross need one of them to give way, and until now
// neither did: both decks were built through the crossing at the same
// elevation, so the carriageways interpenetrated and the depth buffer picked a
// winner per pixel. The lane markings were painted straight through as well,
// which no real intersection has — the paint stops at the box.
//
// The capture cannot say which road is on top, because it drapes its roads on
// the terrain: only 0.76% of road vertices sit more than 4 m above the ground
// under them, and those are the bridges. In plan view a flyover and a
// crossroads are the same picture. So nothing here invents a flyover. The more
// major road keeps its carriageway through the box, the minor one stops at the
// kerb line, and neither paints through — which is what an at-grade
// intersection looks like, and is the honest reading of what the data says.
const RANK = { arterial: 4, collector: 3, bridge: 3, local: 2, service: 1 };
const ZONE_PAD_M = 1.0;

const runLen = roadsDoc.roads.map((r) => {
  let L = 0;
  for (let i = 1; i < r.pts.length; i++) {
    L += Math.hypot((r.pts[i][0] - r.pts[i - 1][0]) * FRAME,
      (r.pts[i][1] - r.pts[i - 1][1]) * FRAME);
  }
  return L;
});
const xsegs = [];
roadsDoc.roads.forEach((r, ri) => {
  for (let i = 1; i < r.pts.length; i++) {
    xsegs.push({
      ri,
      ax: r.pts[i - 1][0] * FRAME, ay: r.pts[i - 1][1] * FRAME,
      bx: r.pts[i][0] * FRAME, by: r.pts[i][1] * FRAME,
    });
  }
});
const XCELL = 40;
const key = (x, y) => `${Math.floor(x / XCELL)},${Math.floor(y / XCELL)}`;
const segGrid = new Map();
xsegs.forEach((sg, i) => {
  const x0 = Math.min(sg.ax, sg.bx); const x1 = Math.max(sg.ax, sg.bx);
  const y0 = Math.min(sg.ay, sg.by); const y1 = Math.max(sg.ay, sg.by);
  for (let c = Math.floor(x0 / XCELL); c <= Math.floor(x1 / XCELL); c++) {
    for (let r = Math.floor(y0 / XCELL); r <= Math.floor(y1 / XCELL); r++) {
      const k = `${c},${r}`;
      (segGrid.get(k) ?? segGrid.set(k, []).get(k)).push(i);
    }
  }
});
const zones = [];
const seenPair = new Set();
for (const list of segGrid.values()) {
  for (let a = 0; a < list.length; a++) {
    for (let b = a + 1; b < list.length; b++) {
      const p = xsegs[list[a]]; const q = xsegs[list[b]];
      if (p.ri === q.ri) continue;
      const pk = list[a] < list[b] ? `${list[a]}_${list[b]}` : `${list[b]}_${list[a]}`;
      if (seenPair.has(pk)) continue;
      seenPair.add(pk);
      const d1x = p.bx - p.ax; const d1y = p.by - p.ay;
      const d2x = q.bx - q.ax; const d2y = q.by - q.ay;
      const den = d1x * d2y - d1y * d2x;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((q.ax - p.ax) * d2y - (q.ay - p.ay) * d2x) / den;
      const u = ((q.ax - p.ax) * d1y - (q.ay - p.ay) * d1x) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      const A = roadsDoc.roads[p.ri]; const B = roadsDoc.roads[q.ri];
      const ra = RANK[A.cls] ?? 1; const rb = RANK[B.cls] ?? 1;
      const aWins = ra !== rb ? ra > rb : runLen[p.ri] >= runLen[q.ri];
      zones.push({
        x: p.ax + d1x * t,
        y: p.ay + d1y * t,
        winner: aWins ? p.ri : q.ri,
        loser: aWins ? q.ri : p.ri,
        rWinner: (aWins ? B.w : A.w) / 2 + ZONE_PAD_M,
        rLoser: (aWins ? A.w : B.w) / 2 + ZONE_PAD_M,
      });
    }
  }
}
const zoneGrid = new Map();
zones.forEach((z, i) => {
  const rad = Math.max(z.rWinner, z.rLoser);
  for (let c = Math.floor((z.x - rad) / XCELL); c <= Math.floor((z.x + rad) / XCELL); c++) {
    for (let r = Math.floor((z.y - rad) / XCELL); r <= Math.floor((z.y + rad) / XCELL); r++) {
      const k = `${c},${r}`;
      (zoneGrid.get(k) ?? zoneGrid.set(k, []).get(k)).push(i);
    }
  }
});
/** How a step of run `ri` at (x, y) is affected: 'clear', 'box' or 'yield'. */
function zoneAt(x, y, ri) {
  const c = Math.floor(x / XCELL); const r = Math.floor(y / XCELL);
  let state = 'clear';
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      for (const zi of zoneGrid.get(`${c + dc},${r + dr}`) ?? []) {
        const z = zones[zi];
        if (z.winner !== ri && z.loser !== ri) continue;
        const mine = z.winner === ri;
        const rad = mine ? z.rWinner : z.rLoser;
        if (Math.hypot(z.x - x, z.y - y) > rad) continue;
        if (!mine) return 'yield';       // the other road owns this ground
        state = 'box';                   // mine, but do not paint through it
      }
    }
  }
  return state;
}
console.log('%d centreline crossings -> junction boxes', zones.length);

// ── 2 & 3. Deck, markings, kerbs ────────────────────────────────────────────
const parts = [];
const push = (u, v, rot, w, d, h, base, kind) =>
  parts.push({ u, v, rot, w, d, h, base, kind });

let deckN = 0; let markN = 0; let kerbN = 0; let wetSteps = 0;
let yielded = 0; let boxed = 0;
let skipped = 0;
for (let roadIndex = 0; roadIndex < roadsDoc.roads.length; roadIndex++) {
  const road = roadsDoc.roads[roadIndex];
  const spec = SPEC[road.cls] ?? SPEC.local;
  if (spec.skip) { skipped++; continue; }
  const steps = walk(road.pts, DECK_M);
  if (!steps.length) continue;
  const halfW = road.w / 2;

  let travelled = 0;
  for (const s of steps) {
    const u = s.x / FRAME;
    const v = s.y / FRAME;
    if (wetAt(u, v)) { wetSteps++; travelled += s.len; continue; }
    const zone = zoneAt(s.x, s.y, roadIndex);
    if (zone === 'yield') { yielded++; travelled += s.len; continue; }
    const paint = zone === 'clear';
    // The deck's underside sits at the graded height; `base` is relative to
    // the terrain the consumer samples, which is now the same graded height.
    push(u, v, s.head, s.len + 0.6, road.w, DECK_THICK, DECK_LIFT, 'road_deck');
    deckN++;

    const markBase = DECK_LIFT + DECK_THICK + MARK_H;
    const offsetPart = (offM, w, len, kind) => {
      const ou = (s.x + s.nrm[0] * offM) / FRAME;
      const ov = (s.y + s.nrm[1] * offM) / FRAME;
      push(ou, ov, s.head, len, w, MARK_H, markBase, kind);
      markN++;
    };

    if (!paint) boxed++;
    if (paint && spec.centre === 'double_yellow') {
      offsetPart(-0.16, MARK_W, s.len + 0.4, 'line_yellow');
      offsetPart(0.16, MARK_W, s.len + 0.4, 'line_yellow');
    } else if (paint && spec.centre === 'yellow') {
      offsetPart(0, MARK_W, s.len + 0.4, 'line_yellow');
    }

    if (paint && spec.edge) {
      offsetPart(-(halfW - 0.35), MARK_W, s.len + 0.4, 'line_white');
      offsetPart(halfW - 0.35, MARK_W, s.len + 0.4, 'line_white');
    }

    // Lane dashes: one stripe per period, not per step, so the dash pattern is
    // a property of the road rather than of the tessellation.
    if (paint && spec.laneDashes) {
      const phase = travelled % DASH_PERIOD;
      if (phase < s.len) {
        for (const side of [-1, 1]) {
          offsetPart(side * halfW * 0.5, MARK_W, DASH_LEN, 'line_white');
        }
      }
    }

    if (paint && spec.kerb) {
      for (const side of [-1, 1]) {
        const off = side * (halfW + KERB_W / 2);
        const ou = (s.x + s.nrm[0] * off) / FRAME;
        const ov = (s.y + s.nrm[1] * off) / FRAME;
        push(ou, ov, s.head, s.len + 0.4, KERB_W, KERB_H, DECK_LIFT, 'kerb');
        kerbN++;
      }
    }

    travelled += s.len;
  }
}
console.log('%d deck segments, %d markings, %d kerb pieces', deckN, markN, kerbN);
console.log('%d steps yielded to a more major road at a crossing, %d left '
  + 'unpainted inside a junction box', yielded, boxed);
console.log('%d bridges and %d steps over water left for '
  + 'tools/maps3d-bridges.mjs, which runs after the water is dug',
  skipped, wetSteps);

// ── 4. Signs ────────────────────────────────────────────────────────────────
//
// A centreline ends where it meets a junction — the tracer deliberately stops
// there rather than walking through. So the ends of the runs ARE the junction
// list, and any end within a few metres of another road's end is a crossroads.
const ends = [];
for (const road of roadsDoc.roads) {
  const rank = { arterial: 4, collector: 3, bridge: 3, local: 2, service: 1 }[road.cls] ?? 1;
  for (const idx of [0, road.pts.length - 1]) {
    ends.push({ x: road.pts[idx][0] * FRAME, y: road.pts[idx][1] * FRAME, rank, cls: road.cls });
  }
}
// Cluster ends into junctions on a coarse grid, which is O(n) rather than the
// O(n^2) a pairwise search over 16,000 endpoints would be.
const CELL = 22;
const cells = new Map();
for (const e of ends) {
  const key = `${Math.round(e.x / CELL)},${Math.round(e.y / CELL)}`;
  const cur = cells.get(key);
  if (!cur) cells.set(key, { x: e.x, y: e.y, n: 1, rank: e.rank });
  else { cur.n++; cur.rank = Math.max(cur.rank, e.rank); cur.x = (cur.x + e.x) / 2; cur.y = (cur.y + e.y) / 2; }
}
let signN = 0;
for (const j of cells.values()) {
  if (j.n < 2) continue;                     // a dead end, not a junction
  if (j.rank < 2) continue;                  // service roads get nothing
  const u = j.x / FRAME; const v = j.y / FRAME;
  if (u < 0 || u > 1 || v < 0 || v > 1) continue;
  // Post plus panel. Two assemblies on opposing corners at a real crossroads.
  const n = j.n >= 4 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    const off = k === 0 ? 9 : -9;
    push((j.x + off) / FRAME, (j.y + off) / FRAME, 0, 0.12, 0.12, 2.6, 0, 'sign_post');
    push((j.x + off) / FRAME, (j.y + off) / FRAME, 0, 0.9, 0.06, 0.72, 1.9, 'sign');
    signN++;
  }
}
console.log('%d sign assemblies at %d junctions', signN, cells.size);

// ── Merge with the buildings and write ──────────────────────────────────────
const cityDoc = JSON.parse(readFileSync(join(DIR, 'city.json'), 'utf8'));
const STRIDE = cityDoc.buildingStride ?? 9;
const oldBin = readFileSync(join(DIR, 'city-buildings.bin'));
const oldKinds = cityDoc.kinds ?? ['building'];

const newKinds = ['road_deck', 'line_white', 'line_yellow', 'kerb', 'sign_post', 'sign'];
const kinds = [...oldKinds];
for (const k of newKinds) if (!kinds.includes(k)) kinds.push(k);
const kindIdx = new Map(kinds.map((k, i) => [k, i]));

const total = cityDoc.buildingCount + parts.length;
const bin = Buffer.alloc(total * STRIDE * 4);
// Buildings keep their indices: the kinds array was extended, not reordered.
oldBin.copy(bin, 0);
parts.forEach((p, i) => {
  const o = (cityDoc.buildingCount + i) * STRIDE * 4;
  bin.writeFloatLE(p.u, o);
  bin.writeFloatLE(p.v, o + 4);
  bin.writeFloatLE(p.rot, o + 8);
  bin.writeFloatLE(p.w, o + 12);
  bin.writeFloatLE(p.d, o + 16);
  bin.writeFloatLE(p.h, o + 20);
  bin.writeFloatLE(kindIdx.get(p.kind), o + 24);
  bin.writeFloatLE(0, o + 28);
  bin.writeFloatLE(p.base, o + 32);
});
cityDoc.kinds = kinds;
cityDoc.buildingCount = total;
cityDoc.roadStats = { deck: deckN, markings: markN, kerbs: kerbN, signs: signN,
  totalKm: roadsDoc.totalKm, carvedSamples: carved };
writeFileSync(join(DIR, 'city.json'), JSON.stringify(cityDoc));
writeFileSync(join(DIR, 'city-buildings.bin'), bin);

// ── Write the carved heightmap back ─────────────────────────────────────────
let lo = Infinity; let hi = -Infinity;
for (const v of height) { if (v < lo) lo = v; if (v > hi) hi = v; }
// Keep the declared range: the carve only ever moves ground between existing
// heights, so re-ranging would change the landscape Z scale for no reason and
// silently invalidate the import recipe the user already has.
console.log('elevation after carve %.2f .. %.2f m (declared range %s..%s kept)',
  lo, hi, LO, HI);

const samples = new Uint16Array(RES * RES);
for (let i = 0; i < height.length; i++) {
  samples[i] = Math.max(0, Math.min(65535, Math.round(((height[i] - LO) / (HI - LO)) * 65535)));
}
const out16 = Buffer.alloc(RES * RES * 2);
for (let i = 0; i < samples.length; i++) out16.writeUInt16LE(samples[i], i * 2);
writeFileSync(join(DIR, 'sandiego.r16'), out16);

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(RES, 0); ihdr.writeUInt32BE(RES, 4); ihdr[8] = 16; ihdr[9] = 0;
const rawPng = Buffer.alloc(RES * (1 + RES * 2));
for (let r = 0; r < RES; r++) {
  const o = r * (1 + RES * 2);
  rawPng[o] = 0;
  for (let c = 0; c < RES; c++) {
    const val = samples[r * RES + c];
    rawPng[o + 1 + c * 2] = val >> 8;
    rawPng[o + 2 + c * 2] = val & 0xff;
  }
}
writeFileSync(join(DIR, 'sandiego.png'), Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(rawPng, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
]));

console.log('\n%d road parts + %d buildings = %d total',
  parts.length, total - parts.length, total);
console.log('kinds: %s', kinds.join(', '));
console.log('rewrote sandiego.png / .r16 with the graded corridors');
