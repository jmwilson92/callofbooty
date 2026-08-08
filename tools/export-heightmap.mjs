#!/usr/bin/env node
// Export the San Diego geography as a heightmap Unreal Engine can import.
//
//   node tools/export-heightmap.mjs                    # 4033, ~4.4 m/sample
//   node tools/export-heightmap.mjs --res 8129         # ~2.2 m/sample
//   node tools/export-heightmap.mjs --out out/sd.r16
//
// Writes 16-bit little-endian raw (.r16), which UE5's Landscape import accepts
// directly and which needs no PNG encoder. Also writes a .json sidecar with the
// scale values to type into the import dialog, and a weightmap-style land/water
// mask so the coastline can drive a material layer or a water body.
//
// Resolution note: Landscape likes (components x quads) + 1 sizes — 1009, 2017,
// 4033, 8129. Anything else still imports but gets resampled.

import { mkdirSync, writeFileSync } from 'node:fs';
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

// Height range the 16-bit values map onto. Everything the trace produces sits
// inside this, with headroom either side so nothing clips at the extremes.
const MIN_H = -60;   // seabed
const MAX_H = 180;   // highest mesa, plus headroom

// The frame is wider than it is tall, so a square heightmap has to letterbox or
// crop. Cropping loses coastline, so it letterboxes: v is sampled over the
// frame's real aspect and the remainder is left at sea.
const span = 1 / ASPECT;                 // v extent covered by a square sample
const vOffset = (1 - span) / 2;

const heights = new Uint16Array(RES * RES);
const mask = new Uint8Array(RES * RES);

let minSeen = Infinity;
let maxSeen = -Infinity;
let landCells = 0;

for (let r = 0; r < RES; r++) {
  // Unreal's landscape Y runs the same way as the trace's v (north at v=0)
  const v = vOffset + (r / (RES - 1)) * span;
  for (let c = 0; c < RES; c++) {
    const u = c / (RES - 1);
    const i = r * RES + c;

    let h;
    if (v < 0 || v > 1) {
      h = MIN_H * 0.5;                   // outside the traced frame: open sea
    } else {
      const land = landField(u, v);
      if (land > 0) {
        h = reliefAt(u, v);
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

// Landscape scale. Z is the awkward one: Unreal maps the full 16-bit range onto
// 512 units at Z scale 100, so the scale that reproduces our metre range is
// (range in cm) / 512.
const metresPerSample = FRAME.widthM / (RES - 1);
const zScale = ((MAX_H - MIN_H) * 100) / 512;

const outPath = path.resolve(OUT);
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, Buffer.from(heights.buffer));
writeFileSync(outPath.replace(/\.r16$/, '-landmask.raw'), Buffer.from(mask.buffer));

const meta = {
  source: 'src/world/geo/SanDiegoGeo.js',
  resolution: RES,
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
  note:
    'Import as 16-bit raw. Set the XYZ scale above. Z scale reproduces the '
    + `${MIN_H}..${MAX_H} m range: Unreal maps full 16-bit onto 512 uu at Z=100, `
    + 'so scale = range_cm / 512. Sea level lands at '
    + `${(((0 - MIN_H) / (MAX_H - MIN_H)) * 65535) | 0} of 65535.`,
};
writeFileSync(outPath.replace(/\.r16$/, '.json'), JSON.stringify(meta, null, 2));

console.log(`wrote ${outPath}`);
console.log(`  ${RES} x ${RES}, ${metresPerSample.toFixed(2)} m per sample`);
console.log(`  heights ${minSeen.toFixed(1)}..${maxSeen.toFixed(1)} m`);
console.log(`  land coverage ${(landCells / (RES * RES) * 100).toFixed(1)}%`);
console.log(`  landscape scale  X ${meta.unrealLandscapeScale.x}  Y ${meta.unrealLandscapeScale.y}  Z ${meta.unrealLandscapeScale.z}`);
console.log(`  sidecar ${path.basename(outPath).replace(/\.r16$/, '.json')}`);
