// Recovers drivable road centrelines from the capture's road surfaces.
//
//   node tools/maps3d-roads.mjs <capture.glb> --sidecar <sandiego.json> [--out DIR]
//
// The capture gives roads as ribbons of triangles lying 2 cm above the terrain.
// That is enough to paint the ground with and not enough to drive on: there is
// no centreline, no direction of travel, no width, and nothing to hang lane
// markings or signs off. All of that has to be recovered.
//
// Rasterise each class to its own mask, thin the mask to a one-pixel skeleton,
// then walk the skeleton into polylines. The width comes back from a distance
// transform sampled along the line — which is better than assuming the class
// width, because a real arterial widens at its junctions and that is exactly
// where the extra lanes are.
//
// Resolution matters here in a way it does not for the painted version. A local
// road is 4 m wide; at the surface texture's 4.2 m per pixel it rasterises to a
// broken dotted line and thins to confetti. This works at 2.1 m per pixel, so
// the narrowest class is still two pixels across and survives thinning.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const src = args[0];
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
if (!src) {
  console.error('usage: node tools/maps3d-roads.mjs <capture.glb> --sidecar <sandiego.json>');
  process.exit(1);
}
const OUT = arg('out', 'out');
const RES = parseInt(arg('res', '8192'), 10);
mkdirSync(OUT, { recursive: true });

const side = JSON.parse(readFileSync(arg('sidecar', join(OUT, 'sandiego.json')), 'utf8'));
const FRAME = side.frameMetres.width;
const K = side.mercatorToGround;
const M_PER_PX = FRAME / (RES - 1);

// ── glb ─────────────────────────────────────────────────────────────────────
const buf = readFileSync(src);
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
const binOff = 20 + jsonLen;
const BIN = buf.subarray(binOff + 8, binOff + 8 + buf.readUInt32LE(binOff));
const COMPONENT = {
  5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2],
  5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4],
};
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function readAccessor(i) {
  const a = gltf.accessors[i];
  const [Type, bytes] = COMPONENT[a.componentType];
  const n = NUM[a.type];
  const bv = gltf.bufferViews[a.bufferView];
  const base = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const stride = bv.byteStride ?? 0;
  if (!stride || stride === bytes * n) {
    return new Type(Uint8Array.from(BIN.subarray(base, base + a.count * n * bytes)).buffer);
  }
  const out = new Type(a.count * n);
  for (let e = 0; e < a.count; e++) {
    const o = base + e * stride;
    for (let c = 0; c < n; c++) {
      out[e * n + c] = new Type(
        Uint8Array.from(BIN.subarray(o + c * bytes, o + (c + 1) * bytes)).buffer)[0];
    }
  }
  return out;
}
const roots = {};
for (const i of gltf.scenes[gltf.scene ?? 0].nodes) roots[gltf.nodes[i].name ?? String(i)] = i;
// The road classes are children of the Roads group, not scene roots. Looking
// for them at the top level found nothing and produced a silent zero.
const byName = { ...roots };
for (const g of ['Roads', 'Water', 'LandCover']) {
  if (roots[g] === undefined) continue;
  for (const c of gltf.nodes[roots[g]].children ?? []) {
    byName[gltf.nodes[c].name ?? String(c)] = c;
  }
}
const tinAcc = gltf.accessors[gltf.meshes[gltf.nodes[roots.tinMesh].mesh].primitives[0].attributes.POSITION];
const cxU = (tinAcc.min[0] + tinAcc.max[0]) / 2;
const czU = (tinAcc.min[2] + tinAcc.max[2]) / 2;
const toCol = (x) => ((((x - cxU) * K) / FRAME) + 0.5) * (RES - 1);
const toRow = (z) => ((((z - czU) * K) / FRAME) + 0.5) * (RES - 1);

// Lane counts and marking rules per class. These are what make a road read as
// that kind of road: a four-lane arterial with a yellow centre and white lane
// dashes is not the same object as a residential street with nothing on it.
const CLASSES = [
  { node: 'Roads_Arterial', id: 'arterial', lanes: 4, centre: 'double_yellow', dashes: true, minLenM: 60 },
  { node: 'Roads_Collector', id: 'collector', lanes: 2, centre: 'yellow', dashes: false, minLenM: 50 },
  { node: 'Roads_Bridge', id: 'bridge', lanes: 2, centre: 'yellow', dashes: false, minLenM: 30 },
  { node: 'Roads_Local', id: 'local', lanes: 2, centre: 'none', dashes: false, minLenM: 40 },
  { node: 'Roads_Service', id: 'service', lanes: 1, centre: 'none', dashes: false, minLenM: 40 },
];

// ── Rasterise one class ─────────────────────────────────────────────────────
function rasterise(nodeIdx) {
  const mask = new Uint8Array(RES * RES);
  let tris = 0;
  const walk = (ni) => {
    const node = gltf.nodes[ni];
    if (node.mesh !== undefined) {
      for (const p of gltf.meshes[node.mesh].primitives) {
        const pos = readAccessor(p.attributes.POSITION);
        const idx = p.indices !== undefined ? readAccessor(p.indices) : null;
        const n = idx ? idx.length : pos.length / 3;
        for (let t = 0; t + 2 < n; t += 3) {
          const a = (idx ? idx[t] : t) * 3;
          const b = (idx ? idx[t + 1] : t + 1) * 3;
          const c = (idx ? idx[t + 2] : t + 2) * 3;
          const ax = toCol(pos[a]); const ay = toRow(pos[a + 2]);
          const bx = toCol(pos[b]); const by = toRow(pos[b + 2]);
          const cx = toCol(pos[c]); const cy = toRow(pos[c + 2]);
          const r0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
          const r1 = Math.min(RES - 1, Math.ceil(Math.max(ay, by, cy)));
          const c0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
          const c1 = Math.min(RES - 1, Math.ceil(Math.max(ax, bx, cx)));
          const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
          if (Math.abs(den) < 1e-12) continue;
          for (let r = r0; r <= r1; r++) {
            for (let col = c0; col <= c1; col++) {
              const w0 = ((by - cy) * (col - cx) + (cx - bx) * (r - cy)) / den;
              const w1 = ((cy - ay) * (col - cx) + (ax - cx) * (r - cy)) / den;
              if (w0 < -0.004 || w1 < -0.004 || 1 - w0 - w1 < -0.004) continue;
              mask[r * RES + col] = 1;
            }
          }
          tris++;
        }
      }
    }
    for (const k of node.children ?? []) walk(k);
  };
  walk(nodeIdx);
  return { mask, tris };
}

// ── Distance transform (two-pass chamfer) ───────────────────────────────────
// Half-width in pixels at every road pixel, so a centreline can report the
// width it actually has rather than the width its class nominally has.
function distanceTransform(mask) {
  const INF = 1e9;
  const d = new Float32Array(RES * RES);
  for (let i = 0; i < mask.length; i++) d[i] = mask[i] ? INF : 0;
  const D1 = 1; const D2 = 1.41421356;
  for (let r = 0; r < RES; r++) {
    for (let c = 0; c < RES; c++) {
      const i = r * RES + c;
      if (!mask[i]) continue;
      let v = d[i];
      if (r > 0) { v = Math.min(v, d[i - RES] + D1); if (c > 0) v = Math.min(v, d[i - RES - 1] + D2); if (c < RES - 1) v = Math.min(v, d[i - RES + 1] + D2); }
      if (c > 0) v = Math.min(v, d[i - 1] + D1);
      d[i] = v;
    }
  }
  for (let r = RES - 1; r >= 0; r--) {
    for (let c = RES - 1; c >= 0; c--) {
      const i = r * RES + c;
      if (!mask[i]) continue;
      let v = d[i];
      if (r < RES - 1) { v = Math.min(v, d[i + RES] + D1); if (c > 0) v = Math.min(v, d[i + RES - 1] + D2); if (c < RES - 1) v = Math.min(v, d[i + RES + 1] + D2); }
      if (c < RES - 1) v = Math.min(v, d[i + 1] + D1);
      d[i] = v;
    }
  }
  return d;
}

// ── Zhang-Suen thinning ─────────────────────────────────────────────────────
// Reduces the ribbon to a one-pixel skeleton while preserving connectivity,
// which is the property that matters: a skeleton that breaks at junctions
// gives disconnected road stubs, and a road network you cannot drive along is
// no better than the painted one.
function thin(maskIn) {
  const m = Uint8Array.from(maskIn);
  const idx = (r, c) => r * RES + c;
  let changed = true;
  let passes = 0;
  const del = [];
  while (changed && passes < 64) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      del.length = 0;
      for (let r = 1; r < RES - 1; r++) {
        for (let c = 1; c < RES - 1; c++) {
          if (!m[idx(r, c)]) continue;
          const p2 = m[idx(r - 1, c)]; const p3 = m[idx(r - 1, c + 1)];
          const p4 = m[idx(r, c + 1)]; const p5 = m[idx(r + 1, c + 1)];
          const p6 = m[idx(r + 1, c)]; const p7 = m[idx(r + 1, c - 1)];
          const p8 = m[idx(r, c - 1)]; const p9 = m[idx(r - 1, c - 1)];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let A = 0;
          for (let k = 0; k < 8; k++) if (seq[k] === 0 && seq[k + 1] === 1) A++;
          if (A !== 1) continue;
          if (step === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }
          del.push(idx(r, c));
        }
      }
      if (del.length) { for (const i of del) m[i] = 0; changed = true; }
    }
    passes++;
  }
  return m;
}

// ── Trace the skeleton into polylines ───────────────────────────────────────
function trace(skel, dist, minLenM) {
  const deg = new Uint8Array(RES * RES);
  const N8 = [-RES - 1, -RES, -RES + 1, -1, 1, RES - 1, RES, RES + 1];
  for (let r = 1; r < RES - 1; r++) {
    for (let c = 1; c < RES - 1; c++) {
      const i = r * RES + c;
      if (!skel[i]) continue;
      let n = 0;
      for (const o of N8) if (skel[i + o]) n++;
      deg[i] = n;
    }
  }
  const used = new Uint8Array(RES * RES);
  const lines = [];

  const walkFrom = (start) => {
    let i = start;
    const pts = [];
    for (;;) {
      pts.push(i);
      used[i] = 1;
      let next = -1;
      // Prefer straight-on and orthogonal steps before diagonals, so a chain
      // does not zig-zag across a two-pixel-wide stub.
      for (const o of [-RES, RES, -1, 1, -RES - 1, -RES + 1, RES - 1, RES + 1]) {
        const j = i + o;
        if (j < 0 || j >= skel.length) continue;
        if (!skel[j] || used[j]) continue;
        next = j; break;
      }
      if (next < 0) break;
      // Stop at junctions: they are shared by several roads and walking
      // through one welds two different streets into a single polyline.
      if (deg[next] > 2) { pts.push(next); break; }
      i = next;
    }
    return pts;
  };

  const emit = (pts) => {
    if (pts.length < 2) return;
    const poly = pts.map((i) => {
      const r = Math.floor(i / RES); const c = i - r * RES;
      return { c, r, halfW: dist[i] * M_PER_PX };
    });
    let len = 0;
    for (let k = 1; k < poly.length; k++) {
      len += Math.hypot(poly[k].c - poly[k - 1].c, poly[k].r - poly[k - 1].r) * M_PER_PX;
    }
    if (len < minLenM) return;
    lines.push({ poly, len });
  };

  // Endpoints first so chains start at a real end, then anything left, which
  // picks up closed loops.
  for (let i = 0; i < skel.length; i++) if (skel[i] && !used[i] && deg[i] === 1) emit(walkFrom(i));
  for (let i = 0; i < skel.length; i++) if (skel[i] && !used[i] && deg[i] !== 2) emit(walkFrom(i));
  for (let i = 0; i < skel.length; i++) if (skel[i] && !used[i]) emit(walkFrom(i));
  return lines;
}

/** Douglas-Peucker, in pixels. */
function simplify(poly, tolPx) {
  if (poly.length < 3) return poly;
  const keep = new Uint8Array(poly.length);
  keep[0] = 1; keep[poly.length - 1] = 1;
  const stack = [[0, poly.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const ax = poly[a].c; const ay = poly[a].r;
    const bx = poly[b].c; const by = poly[b].r;
    const dx = bx - ax; const dy = by - ay;
    const den = Math.hypot(dx, dy) || 1;
    let worst = -1; let wi = -1;
    for (let k = a + 1; k < b; k++) {
      const d = Math.abs(dy * (poly[k].c - ax) - dx * (poly[k].r - ay)) / den;
      if (d > worst) { worst = d; wi = k; }
    }
    if (worst > tolPx) { keep[wi] = 1; stack.push([a, wi], [wi, b]); }
  }
  return poly.filter((_, i) => keep[i]);
}

// ── Run ─────────────────────────────────────────────────────────────────────
const out = [];
const report = [];
for (const cls of CLASSES) {
  const idx = byName[cls.node];
  if (idx === undefined) { report.push([cls.id, 0, 0, 0]); continue; }
  const t0 = Date.now();
  const { mask, tris } = rasterise(idx);
  let px = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) px++;
  if (!px) { report.push([cls.id, tris, 0, 0]); continue; }
  const dist = distanceTransform(mask);
  const skel = thin(mask);
  const lines = trace(skel, dist, cls.minLenM);

  let totalKm = 0;
  for (const ln of lines) {
    const poly = simplify(ln.poly, 1.6);
    const pts = poly.map((p) => [
      +((p.c / (RES - 1))).toFixed(6),
      +((p.r / (RES - 1))).toFixed(6),
    ]);
    // Median half-width over the run, doubled. The median rather than the mean
    // because junction blobs pull a mean up and would make every street report
    // the width of its widest intersection.
    const hw = poly.map((p) => p.halfW).sort((a, b) => a - b);
    const width = Math.max(3, Math.min(40, 2 * hw[Math.floor(hw.length / 2)]));
    totalKm += ln.len / 1000;
    out.push({ cls: cls.id, lanes: cls.lanes, centre: cls.centre, dashes: cls.dashes, w: +width.toFixed(2), pts });
  }
  report.push([cls.id, tris, lines.length, totalKm, ((Date.now() - t0) / 1000).toFixed(1)]);
  console.log(`  ${cls.id}: ${tris} triangles -> ${lines.length} centrelines, `
    + `${totalKm.toFixed(1)} km (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

const totalKm = report.reduce((a, r) => a + (r[3] || 0), 0);
console.log(`\n${out.length} centrelines, ${totalKm.toFixed(1)} km of road total`);
const byCls = {};
for (const r of out) byCls[r.cls] = (byCls[r.cls] ?? 0) + 1;
console.log('by class:', byCls);
const widths = out.map((r) => r.w).sort((a, b) => a - b);
if (widths.length) {
  console.log(`width  p10 ${widths[Math.floor(widths.length * 0.1)].toFixed(1)}`
    + `  p50 ${widths[Math.floor(widths.length * 0.5)].toFixed(1)}`
    + `  p90 ${widths[Math.floor(widths.length * 0.9)].toFixed(1)}`
    + `  max ${widths[widths.length - 1].toFixed(1)} m`);
}

writeFileSync(join(OUT, 'roads.json'), JSON.stringify({
  producedBy: 'tools/maps3d-roads.mjs',
  source: src,
  frameMetres: side.frameMetres,
  skeletonResolution: RES,
  metresPerPixel: +M_PER_PX.toFixed(3),
  totalKm: +totalKm.toFixed(1),
  count: out.length,
  note: 'pts are normalised (u, v) over the frame. w is the measured '
    + 'carriageway width in metres, from a distance transform, not the class '
    + 'nominal. lanes/centre/dashes drive the lane markings.',
  roads: out,
}));
console.log('\nwrote %s', join(OUT, 'roads.json'));
