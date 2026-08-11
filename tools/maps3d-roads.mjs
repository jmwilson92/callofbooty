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
import { deflateSync } from 'node:zlib';

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
  // closePx: some of what the capture calls a road is a hollow outline rather
  // than a filled ribbon. The bridge deck is two edge strips a few metres
  // apart, and the skeleton of a hollow ribbon is its two edges, not its
  // centre — which is why the Coronado bridge came out as a few hundred
  // metres of stub. Closing the mask first fills the deck so there is a
  // centreline to find.
  { node: 'Roads_Bridge', id: 'bridge', lanes: 2, centre: 'yellow', dashes: false, minLenM: 30, closePx: 8 },
  { node: 'Roads_Local', id: 'local', lanes: 2, centre: 'none', dashes: false, minLenM: 40 },
  { node: 'Roads_Service', id: 'service', lanes: 1, centre: 'none', dashes: false, minLenM: 40 },
  // Paths carry more triangles than any other class in this capture — 118,494,
  // against 89,454 for service roads — and were not being traced at all. Park
  // paths, canyon trails, the beach boardwalk. minW is lower because the 3 m
  // floor the roads use would turn a footpath into a lane.
  { node: 'Roads_Paths', id: 'path', lanes: 1, centre: 'none', dashes: false, minLenM: 25, minW: 1.5 },
];

// ── Rasterise one class ─────────────────────────────────────────────────────
/** Bresenham, clipped to the grid. Used to guarantee thin triangles connect. */
function line(x0, y0, x1, y1, mask) {
  let x = Math.round(x0); let y = Math.round(y0);
  const xe = Math.round(x1); const ye = Math.round(y1);
  const dx = Math.abs(xe - x); const dy = -Math.abs(ye - y);
  const sx = x < xe ? 1 : -1; const sy = y < ye ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 100000; guard++) {
    if (x >= 0 && y >= 0 && x < RES && y < RES) mask[y * RES + x] = 1;
    if (x === xe && y === ye) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

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
          // And the edges, as lines.
          //
          // A sampled interior misses thin geometry. Some of what the capture
          // calls a road is not a filled ribbon at all — the Coronado bridge is
          // stored as two edge strips a few metres apart — and at 2 m a pixel
          // those rasterise to a dotted line. A dotted line thins to a handful
          // of isolated pixels, traces to nothing, and 3.4 km of bridge
          // disappears without any stage reporting a problem. Drawing the edges
          // guarantees a sliver comes out connected, and costs nothing on a
          // triangle wide enough to have filled properly anyway.
          line(ax, ay, bx, by, mask);
          line(bx, by, cx, cy, mask);
          line(cx, cy, ax, ay, mask);
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
/** Morphological closing by `k` pixels, built from two distance transforms.
 *
 * Dilating is "within k of the mask" and eroding is "further than k from the
 * complement", and the chamfer transform answers both in two passes each, which
 * matters at 8192 squared. */
function closeMask(mask, k) {
  const inv = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) inv[i] = mask[i] ? 0 : 1;
  const toMask = distanceTransform(inv);
  const dilated = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    dilated[i] = mask[i] || toMask[i] <= k ? 1 : 0;
  }
  const toEdge = distanceTransform(dilated);
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    out[i] = dilated[i] && toEdge[i] > k ? 1 : 0;
  }
  return out;
}

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
/** Crossing number: how many separate arms of skeleton meet at a pixel.
 *
 * NOT the neighbour count. A thinned diagonal is a staircase, and a staircase
 * pixel routinely has three 8-neighbours while being an ordinary point on a
 * single curve. Counting neighbours and calling three a junction stops the
 * walker every few pixels on any road that does not run along a raster axis —
 * which is why San Diego's grid traced beautifully and the one long diagonal in
 * the city, the Coronado bridge, came through as nothing.
 *
 * The number of 0-to-1 transitions going once around the ring is the right
 * measure: 1 is an endpoint, 2 is a curve, 3 or more is a real branch.
 */
const RING = [-RES, -RES + 1, 1, RES + 1, RES, RES - 1, -1, -RES - 1];
function crossings(skel, i) {
  let a = 0;
  for (let k = 0; k < 8; k++) {
    const cur = skel[i + RING[k]] ? 1 : 0;
    const nxt = skel[i + RING[(k + 1) % 8]] ? 1 : 0;
    if (!cur && nxt) a++;
  }
  return a;
}

/** Remove skeleton spurs shorter than `maxSpur` pixels.
 *
 * Thinning a ribbon that is more than a couple of pixels wide leaves whiskers
 * hanging off the centreline — one or two pixels each, from every wobble in the
 * edge. They are invisible in a picture and fatal to the trace: the walker stops
 * at any pixel of degree three, so a line with a whisker every few pixels comes
 * apart into pieces shorter than the floor and every one of them is discarded.
 * That is how 750 m of the Coronado bridge came through as nothing at all, with
 * a perfectly good mask and a perfectly good skeleton on either side of it.
 */
function prune(skel, maxSpur) {
  const N8 = [-RES - 1, -RES, -RES + 1, -1, 1, RES - 1, RES, RES + 1];
  const s = Uint8Array.from(skel);
  let removed = 0;
  for (let round = 0; round < 4; round++) {
    const deg = new Uint8Array(s.length);
    const ends = [];
    for (let r = 1; r < RES - 1; r++) {
      for (let c = 1; c < RES - 1; c++) {
        const i = r * RES + c;
        if (!s[i]) continue;
        const a = crossings(s, i);
        deg[i] = a;
        if (a === 1) ends.push(i);
      }
    }
    let any = false;
    for (const e of ends) {
      if (!s[e]) continue;
      const path = [];
      let i = e; let prev = -1;
      let hitJunction = false;
      while (path.length <= maxSpur) {
        path.push(i);
        let next = -1;
        for (const o of N8) {
          const j = i + o;
          if (j < 0 || j >= s.length) continue;
          if (!s[j] || j === prev || path.includes(j)) continue;
          next = j; break;
        }
        if (next < 0) break;
        if (deg[next] > 2) { hitJunction = true; break; }
        prev = i; i = next;
      }
      // Only a whisker off a junction gets cut. A short free-standing fragment
      // is left alone — the length filter downstream is the right place for it,
      // and the stitch may yet make something of it.
      if (hitJunction && path.length <= maxSpur) {
        for (const q of path) s[q] = 0;
        removed += path.length;
        any = true;
      }
    }
    if (!any) break;
  }
  return { skel: s, removed };
}

function trace(skel, dist, minLenM) {
  const deg = new Uint8Array(RES * RES);
  for (let r = 1; r < RES - 1; r++) {
    for (let c = 1; c < RES - 1; c++) {
      const i = r * RES + c;
      if (!skel[i]) continue;
      deg[i] = crossings(skel, i);
    }
  }
  const used = new Uint8Array(RES * RES);
  const lines = [];
  // Where the skeleton actually branches. This is the only honest way to tell
  // an at-grade intersection from a flyover: two roads that cross with a branch
  // node between them meet, two that cross without one pass. The stitch removes
  // some of these nodes from the centrelines afterwards, so they are recorded
  // here, before anything is joined.
  const junctions = [];
  for (let r = 1; r < RES - 1; r++) {
    for (let c = 1; c < RES - 1; c++) {
      const i = r * RES + c;
      if (skel[i] && deg[i] >= 3) junctions.push(i);
    }
  }

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
  lines.junctions = junctions;
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

// ── Debug crops ─────────────────────────────────────────────────────────────
//
//   --debug bridge:0.712,0.605,0.748,0.646
//
// Writes the rasterised mask, the closed mask and the skeleton for one class
// over one window, as a PNG. Three stages happen between a road surface and a
// centreline and each can lose the road; looking at all three at once is the
// difference between fixing it and guessing at it.
const DEBUG = arg('debug', '');
const DEBUG_SCALE = parseInt(arg('debugScale', '1'), 10);
function debugCrop(id, stages, box) {
  const [u0, v0, u1, v1] = box;
  const c0 = Math.round(u0 * (RES - 1)); const c1 = Math.round(u1 * (RES - 1));
  const r0 = Math.round(v0 * (RES - 1)); const r1 = Math.round(v1 * (RES - 1));
  const W0 = c1 - c0 + 1; const H0 = r1 - r0 + 1;
  const S = Math.max(1, DEBUG_SCALE);
  const W = W0 * S; const H = H0 * S;
  const cols = [[190, 60, 60], [70, 130, 220], [90, 255, 110]];
  const rows = Buffer.alloc(H * (1 + W * 3));
  for (let r = 0; r < H; r++) {
    const o = r * (1 + W * 3);
    rows[o] = 0;
    for (let c = 0; c < W; c++) {
      const i = (r0 + Math.floor(r / S)) * RES + (c0 + Math.floor(c / S));
      let col = [16, 20, 26];
      for (let k = 0; k < stages.length; k++) if (stages[k][i]) col = cols[k];
      const p = o + 1 + c * 3;
      rows[p] = col[0]; rows[p + 1] = col[1]; rows[p + 2] = col[2];
    }
  }
  const CRCT = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  const crc = (b) => {
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (ty, data) => {
    const l = Buffer.alloc(4); l.writeUInt32BE(data.length, 0);
    const b = Buffer.concat([Buffer.from(ty, 'ascii'), data]);
    const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(b), 0);
    return Buffer.concat([l, b, cc]);
  };
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
  const dest = join(OUT, `debug-${id}.png`);
  writeFileSync(dest, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ih), chunk('IDAT', deflateSync(rows, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  const counts = stages.map((st) => {
    let n = 0;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) n += st[r * RES + c] ? 1 : 0;
    return n;
  });
  console.log('wrote %s (%d x %d) — red raw mask, blue closed, green skeleton; '
    + 'samples in window: raw %d, closed %d, skeleton %d',
    dest, W, H, counts[0], counts[1], counts[2]);
}

// ── Stitch ──────────────────────────────────────────────────────────────────
//
// The traced skeleton comes out in fragments. The capture's road surfaces are
// not continuous ribbons — they are laid down span by span, panel by panel —
// and every seam between two panels that the rasteriser cannot quite close
// becomes a break in the skeleton and therefore two centrelines instead of one.
//
// On ordinary streets that costs nothing much. On the Coronado bridge it cost
// the bridge: 3.4 km of deck came through as 456 fragments with a median length
// of 81 m and 886 endpoint pairs within 50 m of each other, and the longest
// continuous run over water was 442 m. Built from that, the bridge is a stub in
// the middle of the bay.
//
// So fragments are joined back up where the geometry says they were one road:
// two ends close together, both tangents pointing along the gap, nothing else.
// The angle test is what keeps it honest — without it this would weld every
// road that happens to end near another one, and a city is mostly roads ending
// near other roads.
const STITCH_GAP_M = 46;
const STITCH_ANGLE = 34;      // degrees, tangent to tangent and to the gap

function stitch(lines, mPerPx) {
  const alive = lines.map(() => true);
  const polys = lines.map((l) => l.poly.slice());
  const gapPx = STITCH_GAP_M / mPerPx;
  const cosMax = Math.cos((STITCH_ANGLE * Math.PI) / 180);

  // Tangent at an end, pointing OUT of the run.
  const tangent = (poly, end) => {
    const n = poly.length;
    const k = Math.min(6, n - 1);
    const a = end ? poly[n - 1 - k] : poly[k];
    const b = end ? poly[n - 1] : poly[0];
    const dx = b.c - a.c; const dy = b.r - a.r;
    const len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  };

  let joins = 0;
  let pass = 0;
  while (pass++ < 12) {
    // Rebuild the endpoint index each pass: joining changes the ends.
    const ends = [];
    for (let i = 0; i < polys.length; i++) {
      if (!alive[i] || polys[i].length < 2) continue;
      for (const end of [0, 1]) {
        const p = end ? polys[i][polys[i].length - 1] : polys[i][0];
        ends.push({ i, end, c: p.c, r: p.r, t: tangent(polys[i], end) });
      }
    }
    const cell = Math.max(1, Math.ceil(gapPx));
    const grid = new Map();
    for (let k = 0; k < ends.length; k++) {
      const key = `${Math.floor(ends[k].c / cell)},${Math.floor(ends[k].r / cell)}`;
      (grid.get(key) ?? grid.set(key, []).get(key)).push(k);
    }

    let madeOne = false;
    const taken = new Uint8Array(ends.length);
    for (let a = 0; a < ends.length; a++) {
      if (taken[a] || !alive[ends[a].i]) continue;
      const A = ends[a];
      let best = -1; let bestScore = -1;
      const gc = Math.floor(A.c / cell); const gr = Math.floor(A.r / cell);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          for (const b of grid.get(`${gc + dc},${gr + dr}`) ?? []) {
            if (b === a || taken[b]) continue;
            const B = ends[b];
            if (B.i === A.i || !alive[B.i]) continue;
            const dx = B.c - A.c; const dy = B.r - A.r;
            const gap = Math.hypot(dx, dy);
            if (gap > gapPx || gap < 1e-6) continue;
            const ux = dx / gap; const uy = dy / gap;
            // A's tangent points out of A, so it should point along the gap;
            // B's points out of B, so it should point back against it.
            const ca = A.t[0] * ux + A.t[1] * uy;
            const cb = -(B.t[0] * ux + B.t[1] * uy);
            // Outward tangents of two runs that were once one road point in
            // opposite directions, so this one wants to be near -1.
            const cc = -(A.t[0] * B.t[0] + A.t[1] * B.t[1]);
            if (ca < cosMax || cb < cosMax || cc < cosMax) continue;
            const score = Math.min(ca, cb, cc) - gap / gapPx * 0.15;
            if (score > bestScore) { bestScore = score; best = b; }
          }
        }
      }
      if (best < 0) continue;
      const B = ends[best];
      // Orient both so A's tail meets B's head, then concatenate.
      let pa = polys[A.i]; let pb = polys[B.i];
      if (!A.end) pa = pa.slice().reverse();
      if (B.end) pb = pb.slice().reverse();
      polys[A.i] = pa.concat(pb);
      polys[B.i] = [];
      alive[B.i] = false;
      taken[a] = 1; taken[best] = 1;
      joins++;
      madeOne = true;
    }
    if (!madeOne) break;
  }

  const out = [];
  for (let i = 0; i < polys.length; i++) {
    if (!alive[i] || polys[i].length < 2) continue;
    let len = 0;
    for (let k = 1; k < polys[i].length; k++) {
      len += Math.hypot(polys[i][k].c - polys[i][k - 1].c,
        polys[i][k].r - polys[i][k - 1].r) * mPerPx;
    }
    out.push({ poly: polys[i], len });
  }
  return { lines: out, joins };
}

// ── Run ─────────────────────────────────────────────────────────────────────
const out = [];
const report = [];
const junctionPx = new Set();
for (const cls of CLASSES) {
  const idx = byName[cls.node];
  if (idx === undefined) { report.push([cls.id, 0, 0, 0]); continue; }
  const t0 = Date.now();
  const raster = rasterise(idx);
  const tris = raster.tris;
  const mask = cls.closePx ? closeMask(raster.mask, cls.closePx) : raster.mask;
  let px = 0; let rawPx = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) px++;
  for (let i = 0; i < raster.mask.length; i++) if (raster.mask[i]) rawPx++;
  if (cls.closePx) {
    console.log(`  ${cls.id}: closed by ${cls.closePx} px, `
      + `${rawPx} -> ${px} mask samples`);
  }
  if (!px) { report.push([cls.id, tris, 0, 0]); continue; }
  const dist = distanceTransform(mask);
  const thinned = thin(mask);
  const pruned = prune(thinned, 9);
  const skel = pruned.skel;
  if (DEBUG.startsWith(cls.id + ':')) {
    debugCrop(cls.id, [raster.mask, mask, skel],
      DEBUG.slice(cls.id.length + 1).split(',').map(Number));
  }
  // Trace with a low floor and apply the class minimum after stitching. The
  // fragments a bridge breaks into are individually shorter than the class
  // minimum, so filtering first throws away the pieces the stitch needs.
  const traced = trace(skel, dist, 8);
  for (const i of traced.junctions ?? []) junctionPx.add(i);
  if (DEBUG.startsWith(cls.id + ':')) {
    const [bu0, bv0, bu1, bv1] = DEBUG.slice(cls.id.length + 1).split(',').map(Number);
    const bc0 = Math.round(bu0 * (RES - 1)); const bc1 = Math.round(bu1 * (RES - 1));
    const br0 = Math.round(bv0 * (RES - 1)); const br1 = Math.round(bv1 * (RES - 1));
    const hits = traced.filter((l) => l.poly.some((p) => p.c >= bc0 && p.c <= bc1
      && p.r >= br0 && p.r <= br1));
    console.log('  debug: %d of %d traced runs touch the window; lengths %s',
      hits.length, traced.length,
      hits.map((l) => Math.round(l.len)).sort((a, b) => b - a).slice(0, 12).join(', ') || 'none');
  }
  const stitched = stitch(traced, M_PER_PX);
  const joins = stitched.joins;
  const lines = stitched.lines.filter((l) => l.len >= cls.minLenM);
  const dropped = stitched.lines.length - lines.length;

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
    const width = Math.max(cls.minW ?? 3, Math.min(40, 2 * hw[Math.floor(hw.length / 2)]));
    totalKm += ln.len / 1000;
    out.push({ cls: cls.id, lanes: cls.lanes, centre: cls.centre, dashes: cls.dashes, w: +width.toFixed(2), pts });
  }
  report.push([cls.id, tris, lines.length, totalKm, ((Date.now() - t0) / 1000).toFixed(1)]);
  console.log(`  ${cls.id}: ${tris} triangles -> ${traced.length} fragments, `
    + `${pruned.removed} spur samples pruned, ${joins} stitched, `
    + `${dropped} under ${cls.minLenM} m dropped -> `
    + `${lines.length} centrelines, ${totalKm.toFixed(1)} km `
    + `(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

// Cluster the branch nodes onto a 12 m grid. One intersection produces a
// cluster of them and the consumer only needs to know an intersection is there.
const jcell = new Map();
for (const i of junctionPx) {
  const r = Math.floor(i / RES); const c = i - r * RES;
  const x = (c / (RES - 1)); const y = (r / (RES - 1));
  const key = `${Math.round(x * side.frameMetres.width / 12)},`
    + `${Math.round(y * side.frameMetres.width / 12)}`;
  if (!jcell.has(key)) jcell.set(key, [+x.toFixed(6), +y.toFixed(6)]);
}
const junctions = [...jcell.values()];
console.log('%d skeleton branch samples -> %d intersections',
  junctionPx.size, junctions.length);

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
  stitch: { gapMetres: STITCH_GAP_M, angleDegrees: STITCH_ANGLE },
  junctionCount: junctions.length,
  note: 'pts are normalised (u, v) over the frame. w is the measured '
    + 'carriageway width in metres, from a distance transform, not the class '
    + 'nominal. lanes/centre/dashes drive the lane markings.',
  roads: out,
  junctions,
}));
console.log('\nwrote %s', join(OUT, 'roads.json'));
