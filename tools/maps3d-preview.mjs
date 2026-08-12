// Shades the landscape the way the Unreal material shades it, and writes a PNG.
//
//   node tools/maps3d-preview.mjs --out out [--res 2048]
//
// Tools/build_sandiego.py builds M_SanDiego_Land as a height-and-slope base
// with the capture's own surface map composited over it: land cover, then
// paving, then water. That graph cannot be run here, and the last time a
// terrain problem went unnoticed it was because nothing rendered what the
// editor would actually show. So this reproduces the same arithmetic — same
// thresholds, same palette, same channel decode, same world-to-UV mapping — and
// renders it.
//
// It proves the data and the maths, not the import. If this looks right and the
// editor does not, the fault is in the material graph or the import, and that
// is a much smaller place to look than "somewhere in the pipeline".

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const OUT = arg('out', 'out');
const W = parseInt(arg('res', '2048'), 10);
// A window on the frame, so the same script does the whole map and a street.
const CENTRE = arg('centre', '0.5,0.5').split(',').map(Number);
const NAME = arg('name', 'terrain-shaded');

const side = JSON.parse(readFileSync(join(OUT, 'sandiego.json'), 'utf8'));
const SPAN_M = parseFloat(arg('span', String(side.frameMetres.width)));
const RES = side.resolution;
const FRAME = side.frameMetres.width;
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;

const r16 = readFileSync(join(OUT, 'sandiego.r16'));
const heights = new Uint16Array(
  Uint8Array.from(r16.subarray(0, RES * RES * 2)).buffer);

// ── Decode the surface map ──────────────────────────────────────────────────
function decodePNG(buf) {
  let off = 8;
  let w = 0; let h = 0; let bits = 0; let colour = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bits = data[8]; colour = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bits !== 8 || colour !== 2) throw new Error('expected 8-bit RGB');
  const raw = inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 3);
  const stride = w * 3;
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    const up = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= 3 ? out[i - 3] : 0;
      const b = up ? up[i] : 0;
      const c = up && i >= 3 ? up[i - 3] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = v & 255;
    }
  }
  return { w, h, px };
}
const surf = decodePNG(readFileSync(join(OUT, 'sandiego-surfaces.png')));

// ── The same palette the material carries ───────────────────────────────────
const SAND = [0.470, 0.412, 0.290];
const SCRUB = [0.166, 0.180, 0.104];
const MESA = [0.250, 0.230, 0.148];
const ROCK = [0.196, 0.174, 0.150];
const BEACH_TOP = 11.0;
const MESA_START = 45.0;
const MESA_SPAN = 55.0;
const SLOPE_GAIN = 3.2;

const COVER_BANDS = [
  [30, [0.235, 0.216, 0.180]],
  [50, [0.268, 0.256, 0.240]],
  [80, [0.196, 0.174, 0.150]],
  [110, [0.505, 0.446, 0.322]],
  [140, [0.148, 0.163, 0.122]],
  [165, [0.243, 0.238, 0.130]],
  [190, [0.196, 0.216, 0.110]],
  [220, [0.098, 0.128, 0.072]],
];
const PAVE_PALE = [0.400, 0.392, 0.372];
const PAVE_DARK = [0.052, 0.051, 0.055];
const WATER_BED = [0.036, 0.070, 0.078];
const SEA = [0.043, 0.098, 0.130];

const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Height in metres at fractional heightmap coordinates, bilinear. */
function heightAt(fc, fr) {
  const c0 = Math.max(0, Math.min(RES - 1, Math.floor(fc)));
  const r0 = Math.max(0, Math.min(RES - 1, Math.floor(fr)));
  const c1 = Math.min(RES - 1, c0 + 1);
  const r1 = Math.min(RES - 1, r0 + 1);
  const tx = fc - c0; const ty = fr - r0;
  const s = (c, r) => LO + (heights[r * RES + c] / 65535) * (HI - LO);
  const a = s(c0, r0) + (s(c1, r0) - s(c0, r0)) * tx;
  const b = s(c0, r1) + (s(c1, r1) - s(c0, r1)) * tx;
  return a + (b - a) * ty;
}

const mPerHeightPx = FRAME / (RES - 1);
const VSPAN = SPAN_M / FRAME;
const U0 = CENTRE[0] - VSPAN / 2;
const V0 = CENTRE[1] - VSPAN / 2;
const M_PER_OUT_PX = SPAN_M / W;
const out = Buffer.alloc(W * (1 + W * 3));
const counts = { cover: 0, pave: 0, water: 0, sea: 0 };

for (let y = 0; y < W; y++) {
  const o = y * (1 + W * 3);
  out[o] = 0;
  const v = V0 + ((y + 0.5) / W) * VSPAN;
  const fr = v * (RES - 1);
  for (let x = 0; x < W; x++) {
    const u = U0 + ((x + 0.5) / W) * VSPAN;
    const fc = u * (RES - 1);

    const h = heightAt(fc, fr);
    // Slope from the height gradient, in metres per metre.
    const gx = (heightAt(fc + 1, fr) - heightAt(fc - 1, fr)) / (2 * mPerHeightPx);
    const gy = (heightAt(fc, fr + 1) - heightAt(fc, fr - 1)) / (2 * mPerHeightPx);
    const nlen = Math.sqrt(gx * gx + gy * gy + 1);
    const nz = 1 / nlen;

    // Height and slope base, node for node.
    let col = mix(SAND, SCRUB, sat(h / BEACH_TOP));
    col = mix(col, MESA, sat((h - MESA_START) / MESA_SPAN));
    col = mix(col, ROCK, sat((1 - nz) * SLOPE_GAIN));

    // Surface map, sampled the way the material samples it.
    const sc = Math.max(0, Math.min(surf.w - 1, Math.round(u * (surf.w - 1))));
    const sr = Math.max(0, Math.min(surf.h - 1, Math.round(v * (surf.h - 1))));
    const si = (sr * surf.w + sc) * 3;
    const R = surf.px[si] / 255;
    const G = surf.px[si + 1] / 255;
    const B = surf.px[si + 2] / 255;

    if (G > 0) {
      let cover = COVER_BANDS[0][1];
      for (let i = 1; i < COVER_BANDS.length; i++) {
        const lo = COVER_BANDS[i - 1][0] / 255;
        const hi = COVER_BANDS[i][0] / 255;
        cover = mix(cover, COVER_BANDS[i][1], sat((G - lo) / (hi - lo)));
      }
      col = mix(col, cover, sat(G * 20));
      counts.cover++;
    }
    if (R > 0) {
      col = mix(col, mix(PAVE_PALE, PAVE_DARK, sat((R - 0.28) / 0.18)),
        sat(R * 14));
      counts.pave++;
    }
    if (B > 0) {
      col = mix(col, WATER_BED, sat(B * 4));
      counts.water++;
    }

    // The ocean plane is a separate actor at Z=0; draw it so the coast reads.
    if (h < 0.05) { col = SEA; counts.sea++; }

    // Sun from the north-west, the angle every San Diego aerial is shot at.
    const shade = h < 0.05 ? 1 : sat(0.42 + 0.75 * sat(
      (-gx * 0.55 - gy * 0.55 + 1) / nlen));
    const p = o + 1 + x * 3;
    for (let k = 0; k < 3; k++) {
      out[p + k] = Math.round(255 * Math.pow(sat(col[k] * shade), 1 / 2.2));
    }
  }
}

// ── The city on top ─────────────────────────────────────────────────────────
//
// Buildings, road kit and planting all live in the same packed buffer. Drawn
// from directly above as rotated rectangles, in order of how high the top of
// each part sits, which is close enough to a painter's sort for a plan view.
const KIND_COLOUR = {
  building: [0.402, 0.386, 0.358],
  runway: [0.088, 0.086, 0.090],
  taxiway: [0.105, 0.102, 0.098],
  apron: [0.140, 0.138, 0.134],
  runway_centreline: [0.900, 0.900, 0.880],
  runway_threshold: [0.920, 0.920, 0.900],
  runway_light: [0.760, 0.700, 0.320],
  road_deck: [0.052, 0.051, 0.055],
  path: [0.512, 0.470, 0.398],
  pad: [0.430, 0.424, 0.412],
  water: [0.036, 0.114, 0.130],
  line_white: [0.880, 0.880, 0.860],
  line_yellow: [0.880, 0.680, 0.130],
  kerb: [0.560, 0.556, 0.540],
  sign_post: [0.550, 0.560, 0.570],
  sign: [0.055, 0.235, 0.145],
  tree: [0.118, 0.170, 0.086],
  tree_trunk: [0.128, 0.104, 0.078],
  palm: [0.150, 0.196, 0.104],
  shrub: [0.176, 0.190, 0.116],
  rock: [0.310, 0.288, 0.252],
  pier: [0.520, 0.514, 0.500],
  lamp_post: [0.470, 0.478, 0.486],
  lamp: [0.780, 0.760, 0.700],
};
let drawn = 0;
try {
  const city = JSON.parse(readFileSync(join(OUT, 'city.json'), 'utf8'));
  const stride = city.buildingStride;
  const bin = readFileSync(join(OUT, city.buildingFile));
  const kinds = city.kinds ?? ['building'];
  const list = [];
  for (let i = 0; i < city.buildingCount; i++) {
    const o = i * stride * 4;
    const u = bin.readFloatLE(o);
    const v = bin.readFloatLE(o + 4);
    if (u < U0 || v < V0 || u > U0 + VSPAN || v > V0 + VSPAN) continue;
    list.push({
      u,
      v,
      rot: (bin.readFloatLE(o + 8) * Math.PI) / 180,
      w: bin.readFloatLE(o + 12),
      d: bin.readFloatLE(o + 16),
      h: bin.readFloatLE(o + 20),
      kind: kinds[Math.round(bin.readFloatLE(o + 24))] ?? 'building',
      flags: stride > 7 ? Math.round(bin.readFloatLE(o + 28)) : 0,
      base: stride > 8 ? bin.readFloatLE(o + 32) : 0,
    });
  }
  const uncoloured = (city.kinds ?? []).filter((k) => !KIND_COLOUR[k]);
  if (uncoloured.length) {
    console.log('no colour for %s — drawn in the fallback, so this preview '
      + 'does not match the editor', uncoloured.join(', '));
  }
  list.sort((a, b) => (a.base + a.h) - (b.base + b.h));
  for (const p of list) {
    if (p.flags & 8) continue;      // cleared for airfield pavement
    const col = KIND_COLOUR[p.kind] ?? [0.5, 0.45, 0.4];
    // A tall part catches more light from above than the ground beside it.
    const lift = 1 + Math.min(0.35, (p.base + p.h) * 0.012);
    const cx = ((p.u - U0) / VSPAN) * W;
    const cy = ((p.v - V0) / VSPAN) * W;
    const hw = p.w / 2 / M_PER_OUT_PX;
    const hd = p.d / 2 / M_PER_OUT_PX;
    const ca = Math.cos(p.rot); const sa = Math.sin(p.rot);
    const reach = Math.ceil(Math.hypot(hw, hd)) + 1;
    if (reach > W) continue;
    for (let dy = -reach; dy <= reach; dy++) {
      const y = Math.round(cy + dy);
      if (y < 0 || y >= W) continue;
      for (let dx = -reach; dx <= reach; dx++) {
        const x = Math.round(cx + dx);
        if (x < 0 || x >= W) continue;
        const px = x + 0.5 - cx; const py = y + 0.5 - cy;
        const lx = px * ca + py * sa;
        const ly = -px * sa + py * ca;
        if (Math.abs(lx) > hw || Math.abs(ly) > hd) continue;
        const o = y * (1 + W * 3) + 1 + x * 3;
        for (let k = 0; k < 3; k++) {
          out[o + k] = Math.round(255 * Math.pow(sat(col[k] * lift), 1 / 2.2));
        }
      }
    }
    drawn++;
  }
  console.log('drew %d of %d city parts in the window', drawn, city.buildingCount);
} catch (err) {
  console.log('no city plan to draw (%s)', err.message);
}

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (b) => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4);
ihdr[8] = 8; ihdr[9] = 2;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(out, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
]);
const dest = join(OUT, NAME + '.png');
writeFileSync(dest, png);

const total = W * W;
const pc = (n) => ((n * 100) / total).toFixed(1);
console.log('surface map %d x %d, heightmap %d, window %s m centred on %s, %s',
  surf.w, surf.h, RES, SPAN_M.toFixed(0), CENTRE[0], CENTRE[1]);
console.log('of %d shaded pixels: land cover %s%%, paving %s%%, water %s%%, sea %s%%',
  total, pc(counts.cover), pc(counts.pave), pc(counts.water), pc(counts.sea));
console.log('wrote %s (%s MB)', dest, (png.length / 1048576).toFixed(1));
