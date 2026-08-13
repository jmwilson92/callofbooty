// Bakes the capture's flat surfaces — roads, water, land cover — into one
// ground texture the landscape material samples by world position.
//
//   node tools/maps3d-surfaces.mjs <capture.glb> --sidecar <sandiego.json> [--out DIR] [--res 4096]
//
// The roads in the capture are surfaces, not centrelines: triangle soup lying
// 2 cm above the terrain. Spawning them as geometry would z-fight against the
// landscape across the whole map, and skeletonising 12 classes of soup into
// centrelines is a lot of work to get back something the terrain can just be
// painted with. So they are rasterised instead. No geometry, no z-fighting, no
// draw calls, and the roads follow the ground exactly because they ARE the
// ground.
//
// Three channels, one job each:
//
//   R  road class, 0 for none. Bigger is more major, so the material can make
//      an arterial wider and paler than a service road without a second lookup.
//   G  land cover class — wood, grass, sand, rock and the rest.
//   B  water. Painted last and wins, because a bridge deck's surface polygon
//      sits over the channel it crosses and the water underneath is the thing
//      you want to see from the air.
//
// Centrelines are still worth having later for street furniture — a lamp post
// needs to know which way the kerb runs — but the map reads correctly without
// them, and it does not read at all with roads that flicker.

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
  console.error('usage: node tools/maps3d-surfaces.mjs <capture.glb> --sidecar <sandiego.json>');
  process.exit(1);
}
const OUT = arg('out', 'out');
const RES = parseInt(arg('res', '4096'), 10);
mkdirSync(OUT, { recursive: true });

const side = JSON.parse(readFileSync(arg('sidecar', join(OUT, 'sandiego.json')), 'utf8'));
const FRAME = side.frameMetres.width;
const K = side.mercatorToGround;

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

const tinAcc = gltf.accessors[gltf.meshes[gltf.nodes[roots.tinMesh].mesh].primitives[0].attributes.POSITION];
const cxU = (tinAcc.min[0] + tinAcc.max[0]) / 2;
const czU = (tinAcc.min[2] + tinAcc.max[2]) / 2;
const toCol = (x) => ((((x - cxU) * K) / FRAME) + 0.5) * (RES - 1);
const toRow = (z) => ((((z - czU) * K) / FRAME) + 0.5) * (RES - 1);

// Bigger is more major. The gaps leave room for the material to threshold.
const ROAD_CODE = {
  Roads_Arterial: 240, Roads_Collector: 200, Roads_Local: 160,
  Roads_Bridge: 220, Roads_Service: 120, Roads_Parking: 90,
  Roads_Paths: 60, Roads_Sidewalk: 45, Roads_Crosswalk: 50,
  Roads_Rail: 30, Roads_Tunnel: 0, Roads_Ferry: 0,
};
const COVER_CODE = {
  LandCover_Wood: 220, LandCover_Grass: 190, LandCover_Farmland: 165,
  LandCover_Wetland: 140, LandCover_Sand: 110, LandCover_Rock: 80,
  LandCover_Urban: 50, LandCover_Ice: 240, LandCover_Other: 30,
};

const R = new Uint8Array(RES * RES);
const G = new Uint8Array(RES * RES);
const B = new Uint8Array(RES * RES);

/** Fill every triangle of a node subtree into `target` with a constant value. */
function stamp(nodeIdx, target, value, counter) {
  const node = gltf.nodes[nodeIdx];
  if (node.mesh !== undefined) {
    for (const p of gltf.meshes[node.mesh].primitives) {
      const pos = readAccessor(p.attributes.POSITION);
      const idx = p.indices !== undefined ? readAccessor(p.indices) : null;
      const tri = idx ? idx.length : pos.length / 3;
      for (let t = 0; t + 2 < tri; t += 3) {
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
            const i = r * RES + col;
            // Keep the more major class where two overlap, so a slip road does
            // not erase the freeway it joins.
            if (value > target[i]) target[i] = value;
            counter.px++;
          }
        }
        counter.tris++;
      }
    }
  }
  for (const k of node.children ?? []) stamp(k, target, value, counter);
}

const report = [];
for (const [group, target, table] of [['Roads', R, ROAD_CODE], ['LandCover', G, COVER_CODE]]) {
  const idx = roots[group];
  if (idx === undefined) continue;
  for (const child of gltf.nodes[idx].children ?? []) {
    const name = gltf.nodes[child].name;
    const code = table[name] ?? 0;
    if (!code) {
      // A class with geometry and no code is silently thrown away. Count its
      // triangles before deciding that is fine — Roads_Paths had 118,494 of
      // them and no entry in the tracer's list for a week.
      const probe = { tris: 0, px: 0 };
      stamp(child, new Uint8Array(RES * RES), 1, probe);
      if (probe.tris) {
        console.warn('  %s has %d triangles and NO CODE — nothing will be '
          + 'painted for it', name, probe.tris);
      }
      report.push([name, probe.tris, 0]);
      continue;
    }
    const counter = { tris: 0, px: 0 };
    stamp(child, target, code, counter);
    report.push([name, counter.tris, counter.px]);
  }
}
if (roots.Water !== undefined) {
  const counter = { tris: 0, px: 0 };
  stamp(roots.Water, B, 255, counter);
  report.push(['Water', counter.tris, counter.px]);
}

const mPerPx = FRAME / (RES - 1);
const km2 = (px) => (px * mPerPx * mPerPx) / 1e6;
console.log('%-20s %10s %12s %10s', 'layer', 'triangles', 'pixels', 'km2');
for (const [n, t, p] of report) {
  console.log('%-20s %10d %12d %10.2f', n, t, p, km2(p));
}
let roadPx = 0; let coverPx = 0; let waterPx = 0;
for (let i = 0; i < R.length; i++) {
  if (R[i]) roadPx++;
  if (G[i]) coverPx++;
  if (B[i]) waterPx++;
}
console.log('\ncoverage of the %s km frame: road %s km2, land cover %s km2, water %s km2',
  (FRAME / 1000).toFixed(1), km2(roadPx).toFixed(2), km2(coverPx).toFixed(2),
  km2(waterPx).toFixed(2));

// ── Encode as 8-bit RGB ─────────────────────────────────────────────────────
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
ihdr.writeUInt32BE(RES, 0); ihdr.writeUInt32BE(RES, 4);
ihdr[8] = 8; ihdr[9] = 2;
const raw = Buffer.alloc(RES * (1 + RES * 3));
for (let r = 0; r < RES; r++) {
  const o = r * (1 + RES * 3);
  raw[o] = 0;
  for (let c = 0; c < RES; c++) {
    const i = r * RES + c;
    raw[o + 1 + c * 3] = R[i];
    raw[o + 2 + c * 3] = G[i];
    raw[o + 3 + c * 3] = B[i];
  }
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(join(OUT, 'sandiego-surfaces.png'), png);

writeFileSync(join(OUT, 'sandiego-surfaces.json'), JSON.stringify({
  producedBy: 'tools/maps3d-surfaces.mjs',
  source: src,
  resolution: RES,
  metresPerPixel: +mPerPx.toFixed(3),
  frameMetres: side.frameMetres,
  channels: {
    R: 'road class, 0 = none, larger = more major',
    G: 'land cover class',
    B: 'water, 255 = water',
  },
  roadCodes: ROAD_CODE,
  coverCodes: COVER_CODE,
  note: 'Sample by world position in the landscape material. The frame maps to '
    + 'the landscape exactly: pixel 0 is the minimum corner, pixel RES-1 the '
    + 'maximum, over frameMetres.',
}, null, 2));

console.log('\nwrote %s  (%s MB, %d x %d, %s m per pixel)',
  join(OUT, 'sandiego-surfaces.png'), (png.length / 1048576).toFixed(1), RES, RES,
  mPerPx.toFixed(2));
