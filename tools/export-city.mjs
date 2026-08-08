// Generates the city and writes it where both consumers can read it.
//
//   node tools/export-city.mjs [--out tools/Heightmaps] [--field 1100]
//
// Two files come out:
//
//   city.json          metadata, district records, arterials and every street
//                      centreline. Text, because it is small enough and being
//                      able to read it is worth more than the bytes.
//   city-buildings.bin  packed little-endian float32, seven per building:
//                      u, v, rotation degrees, width m, depth m, height m,
//                      kind index into `kinds` in city.json.
//
// The buildings are binary because there are of the order of 150,000 of them.
// As JSON that is 12 MB of text to parse on every page load and every time the
// Unreal script runs; as float32 it is 4 MB that both sides read in one go.
// Nothing here is authored by hand, so the readability of that file buys
// nothing.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FRAME } from '../src/world/geo/SanDiegoGeo.js';
import { generateCity, buildField } from '../src/world/geo/CityFabric.js';
import { DISTRICTS } from '../src/world/geo/SanDiegoDistricts.js';

const args = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

const OUT = arg('out', 'out');
const FIELD_RES = parseInt(arg('field', '1100'), 10);

mkdirSync(OUT, { recursive: true });

console.log('rasterising buildability at %d...', FIELD_RES);
const field = buildField(FIELD_RES);

console.log('generating...');
const t0 = Date.now();
const city = generateCity({ field });
console.log('  %d streets, %d buildings in %ss',
  city.streets.length, city.buildings.length, ((Date.now() - t0) / 1000).toFixed(1));

// Kinds become small integers in the binary. The order is written into the
// JSON rather than assumed, so adding a kind later does not silently shift
// every building in an already-exported file.
const kinds = [...new Set(city.buildings.map((b) => b.kind))].sort();
const kindIndex = new Map(kinds.map((k, i) => [k, i]));

const buf = Buffer.alloc(city.buildings.length * 7 * 4);
city.buildings.forEach((b, i) => {
  const o = i * 28;
  buf.writeFloatLE(b.u, o);
  buf.writeFloatLE(b.v, o + 4);
  buf.writeFloatLE(b.rot, o + 8);
  buf.writeFloatLE(b.w, o + 12);
  buf.writeFloatLE(b.d, o + 16);
  buf.writeFloatLE(b.h, o + 20);
  buf.writeFloatLE(kindIndex.get(b.kind), o + 24);
});

// Round the street coordinates on the way out. Six decimal places of a
// normalised coordinate is 1.8 cm on this frame, which is far below anything
// that matters and cuts the file roughly in half.
const r6 = (n) => Math.round(n * 1e6) / 1e6;

const meta = {
  generatedFor: 'Call of Booty — San Diego',
  frameMetres: { width: FRAME.widthM, height: FRAME.heightM },
  centre: { lat: FRAME.centreLat, lon: FRAME.centreLon },
  fieldResolution: FIELD_RES,
  kinds,
  buildingCount: city.buildings.length,
  buildingStride: 7,
  buildingFile: 'city-buildings.bin',
  buildingFields: ['u', 'v', 'rotDeg', 'widthM', 'depthM', 'heightM', 'kind'],
  districts: DISTRICTS.map((d) => ({
    id: d.id,
    name: d.name,
    poly: d.poly.map(([u, v]) => [r6(u), r6(v)]),
    grid: d.grid,
    build: d.build,
  })),
  arterials: city.arterials.map((a) => ({
    id: a.id,
    name: a.name,
    w: a.w,
    pts: a.pts.map(([u, v]) => [r6(u), r6(v)]),
  })),
  streets: city.streets.map((s) => ({
    d: s.district,
    w: s.w,
    k: s.kind,
    pts: s.pts.map(([u, v]) => [r6(u), r6(v)]),
  })),
  stats: city.stats,
};

const jsonPath = join(OUT, 'city.json');
const binPath = join(OUT, 'city-buildings.bin');
writeFileSync(jsonPath, JSON.stringify(meta));
writeFileSync(binPath, buf);

const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
console.log('wrote %s (%s)', jsonPath, mb(JSON.stringify(meta).length));
console.log('wrote %s (%s, %d buildings)', binPath, mb(buf.length), city.buildings.length);
console.log();
console.log('kinds: %s', kinds.join(', '));
let totalFloor = 0;
for (const b of city.buildings) totalFloor += b.w * b.d;
console.log('total footprint: %s km2 over %s km2 of frame',
  (totalFloor / 1e6).toFixed(2),
  ((FRAME.widthM * FRAME.heightM) / 1e6).toFixed(0));
