#!/usr/bin/env node
// Export the San Diego geography as a heightmap Unreal Engine can import.
//
//   node tools/export-heightmap.mjs                    # 4033, ~4.4 m/sample
//   node tools/export-heightmap.mjs --res 8129         # ~2.2 m/sample
//   node tools/export-heightmap.mjs --out out/sd.r16
//
// Writes a 16-bit greyscale PNG, which is the format UE5's Landscape import is
// built around: it carries its own resolution and bit depth, so there is nothing
// for the import dialog to guess at.
//
// The .r16 goes out alongside it, but as a secondary. Raw has no header, so UE
// reads its dimensions from a companion .json declaring width/height/bpp — and
// that file lives at exactly the path this script was already using for its own
// metadata. UE parsed the metadata as a descriptor, found no `width`, and the
// import silently fell back to a default 505x505 landscape. The sidecar now
// declares both, so either file works, but PNG is the one to reach for.
//
// Resolution note: Landscape likes (components x quads) + 1 sizes — 1009, 2017,
// 4033, 8129. Anything else still imports but gets resampled.

import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import {
  FRAME, ASPECT, landField, reliefAt,
} from '../src/world/geo/SanDiegoGeo.js';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const RES = Number(flag('--res', 4033));
const OUT = flag('--out', 'out/sandiego.r16');

// --- 16-bit greyscale PNG ------------------------------------------------
// Hand-rolled rather than pulled in as a dependency: the whole encoder is one
// IHDR, one deflated IDAT and an IEND, and a build tool that needs npm install
// to produce the terrain is a build tool that stops working.

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** @param {Uint16Array} samples row-major, length w*h */
function encodePng16(samples, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 16;   // bit depth
  ihdr[9] = 0;    // colour type: greyscale
  ihdr[10] = 0;   // deflate
  ihdr[11] = 0;   // adaptive filtering
  ihdr[12] = 0;   // no interlace

  // Scanlines carry a leading filter byte. Filter 0 (None) throughout: the data
  // is already smooth, so the filters that help photographs cost time here
  // without buying much, and deflate still finds the redundancy.
  const stride = w * 2 + 1;
  const raw = Buffer.allocUnsafe(stride * h);
  for (let y = 0; y < h; y++) {
    const o = y * stride;
    raw[o] = 0;
    const row = y * w;
    for (let x = 0; x < w; x++) {
      // PNG is big-endian; the .r16 is little-endian. Same samples, opposite order.
      const v = samples[row + x];
      raw[o + 1 + x * 2] = v >>> 8;
      raw[o + 2 + x * 2] = v & 0xff;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Height range the 16-bit values map onto. Everything the trace produces sits
// inside this, with headroom either side so nothing clips at the extremes.
const MIN_H = -60;   // seabed
const MAX_H = 180;   // highest mesa, plus headroom

// The frame is wider than it is tall, so a square heightmap has to letterbox or
// crop. Cropping loses coastline, so it letterboxes: the traced frame occupies a
// band down the middle of the image and the rows either side are open sea.
//
// `band` is how much of the image height that band takes up, and `vOffset` is
// where it starts. Going from an image row to a trace v means subtracting the
// offset and dividing — the other way round samples v over [vOffset, 1-vOffset]
// instead, which silently crops the northern and southern tenth of the county
// and stretches what is left across the full height.
const band = 1 / ASPECT;                 // image fraction the traced frame fills
const vOffset = (1 - band) / 2;

const heights = new Uint16Array(RES * RES);
const mask = new Uint8Array(RES * RES);

let minSeen = Infinity;
let maxSeen = -Infinity;
let landCells = 0;

for (let r = 0; r < RES; r++) {
  // Unreal's landscape Y runs the same way as the trace's v (north at v=0).
  // Outside 0..1 is the letterbox, and the sea-fill below handles it.
  const v = (r / (RES - 1) - vOffset) / band;
  for (let c = 0; c < RES; c++) {
    const u = c / (RES - 1);
    const i = r * RES + c;

    let h;
    if (v < 0 || v > 1) {
      h = MIN_H * 0.5;                   // outside the traced frame: open sea
    } else {
      const land = landField(u, v);
      if (land > 0) {
        h = reliefAt(u, v, land);
        // Feather the last few metres to the shoreline so the coast is a beach
        // rather than a wall standing out of the water.
        const shore = Math.min(1, land / 0.004);
        h = h * (shore * shore * (3 - 2 * shore));
        mask[i] = 255;
        landCells++;
      } else {
        // Seabed deepens away from the coast, so the water reads as water
        const off = Math.min(1, -land / 0.03);
        h = -4 - 42 * (off * off * (3 - 2 * off));
      }
    }

    if (h < minSeen) minSeen = h;
    if (h > maxSeen) maxSeen = h;

    const t = (h - MIN_H) / (MAX_H - MIN_H);
    heights[i] = Math.max(0, Math.min(65535, Math.round(t * 65535)));
  }
}

// Landscape scale. Z is the awkward one: one unit of Unreal's landscape Z scale
// spans 512 m of the 16-bit height range, so the scale that reproduces our
// metre range is (range in metres * 100) / 512.
//
// Note the encoded range is not centred on zero, and landscape-local Z=0 is the
// 16-bit midpoint — so the imported actor also needs lifting to put the
// waterline at world Z=0. See zOffsetUU below.
const metresPerSample = FRAME.widthM / (RES - 1);
const zScale = ((MAX_H - MIN_H) * 100) / 512;
// Elevation that lands on the 16-bit midpoint, in centimetres — the lift the
// Landscape actor needs so that 0 m of real elevation is world Z=0.
const zOffsetUU = (MIN_H + (32768 / 65535) * (MAX_H - MIN_H)) * 100;

const outPath = path.resolve(OUT);
const pngPath = outPath.replace(/\.r16$/, '.png');
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, Buffer.from(heights.buffer));
writeFileSync(outPath.replace(/\.r16$/, '-landmask.raw'), Buffer.from(mask.buffer));
writeFileSync(pngPath, encodePng16(heights, RES, RES));

const meta = {
  source: 'src/world/geo/SanDiegoGeo.js',
  resolution: RES,
  // Unreal reads a headerless .raw/.r16 through a sidecar declaring these three
  // fields, and looks for it at exactly this path. Without them the import does
  // not fail loudly — it reports "(Invalid)" resolution and quietly offers a
  // default 505x505 landscape instead. The PNG needs none of this.
  width: RES,
  height: RES,
  bpp: 16,
  frameMetres: { width: FRAME.widthM, height: FRAME.heightM },
  heightRangeMetres: { min: MIN_H, max: MAX_H },
  observedMetres: { min: +minSeen.toFixed(1), max: +maxSeen.toFixed(1) },
  landCoverage: +(landCells / (RES * RES)).toFixed(3),
  // Type these into Landscape → Import from File
  unrealLandscapeScale: {
    x: +(metresPerSample * 100).toFixed(3),
    y: +(metresPerSample * 100).toFixed(3),
    z: +zScale.toFixed(3),
  },
  // Actor Z location that puts sea level on world Z=0. Landscape-local Z=0 is
  // the 16-bit midpoint, which here is well above the waterline; import without
  // this and the whole coastline sits underwater.
  unrealLandscapeZOffsetUU: +(zOffsetUU).toFixed(1),
  note:
    'Import the .png — it carries its own resolution and bit depth. Set the XYZ '
    + 'scale above and lift the actor by unrealLandscapeZOffsetUU. Z scale '
    + `reproduces the ${MIN_H}..${MAX_H} m range: one unit of landscape Z scale `
    + 'spans 512 m of the 16-bit range, so scale = range_m * 100 / 512. Sea '
    + `level lands at ${(((0 - MIN_H) / (MAX_H - MIN_H)) * 65535) | 0} of 65535.`,
};
writeFileSync(outPath.replace(/\.r16$/, '.json'), JSON.stringify(meta, null, 2));

const kb = (p) => (statSync(p).size / 1048576).toFixed(1);
console.log(`wrote ${pngPath}  (${kb(pngPath)} MB)  <- import this one`);
console.log(`      ${outPath}  (${kb(outPath)} MB)`);
console.log(`  ${RES} x ${RES}, ${metresPerSample.toFixed(2)} m per sample`);
console.log(`  heights ${minSeen.toFixed(1)}..${maxSeen.toFixed(1)} m`);
console.log(`  land coverage ${(landCells / (RES * RES) * 100).toFixed(1)}%`);
console.log(`  landscape scale  X ${meta.unrealLandscapeScale.x}  Y ${meta.unrealLandscapeScale.y}  Z ${meta.unrealLandscapeScale.z}`);
console.log(`  sidecar ${path.basename(outPath).replace(/\.r16$/, '.json')}`);
