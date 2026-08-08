// Walks every arterial against the land mask and the grids it crosses.
//
//   node tools/check-city.mjs
//
// Two questions the plan view only hints at, answered as numbers:
//
//   Does this road run into the bay? A road drawn by eye against a coastline
//   traced by eye lands in the water often enough that guessing is not good
//   enough, and in a plan view at 10 m per pixel a 200 m stretch of road over
//   the harbour is two pixels.
//
//   Does it run along its neighbourhood's grain, or slash across it? Named
//   streets are mostly part of the grid they run through — Broadway IS a
//   downtown street, not a diagonal over it — and an arterial a few degrees off
//   its district's rotation cuts every block it passes into triangles. That is
//   the single loudest artefact in a generated city, and it is invisible until
//   you measure the angle.
//
// Harbor Drive, Rosecrans and the Silver Strand are meant to be diagonal: they
// follow the water and the ridge rather than any plat. They are listed as
// expected so the report stays worth reading.

import { FRAME, landField, reliefAt, inPoly } from '../src/world/geo/SanDiegoGeo.js';
import { ARTERIALS, DISTRICTS } from '../src/world/geo/SanDiegoDistricts.js';

/** Roads that genuinely run over water: causeways, piers and the embarcadero. */
const OVER_WATER_BY_DESIGN = new Set([
  'ingraham',        // crosses Mission Bay on two causeways
  'harbor_dr',       // runs along the quayside, half of it on fill
  'north_harbor',    // Harbor Island is dredge spoil the coastline trace has no
                     // record of, so the road correctly runs over "water"
  'india_kettner',   // hugs the waterfront north of the depot
]);

/** Roads that follow geography rather than a plat, and so may cut across one. */
const DIAGONAL_BY_DESIGN = new Set([
  'harbor_dr', 'north_harbor', 'pacific_hwy', 'rosecrans', 'nimitz', 'ingraham',
  'catalina', 'sunsetcliffs', 'morena', 'national_ave', 'canon',
  'texas_st', 'india_kettner', 'laurel', 'orange_ave', 'alameda',
  'fourth_st_cor', 'linda_vista_rd',
]);

// Ten degrees, not zero. Real arterials are a few degrees off the plat they
// run through — the grid was laid to the block and the road to the destination.
// What this is looking for is a road at forty degrees to its own neighbourhood,
// which slices every block it touches into triangles.
const GRAIN_TOLERANCE_DEG = 10;

const bearing = (a, b) => {
  const dx = (b[0] - a[0]) * FRAME.widthM;
  const dy = (b[1] - a[1]) * FRAME.heightM;
  return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 180;
};

const districtAt = (u, v) => DISTRICTS.find((d) => inPoly(d.poly, u, v));

let wetCount = 0;
let grainCount = 0;

ARTERIALS.forEach((a) => {
  const wet = [];
  let len = 0;
  const grains = new Map();

  for (let i = 0; i < a.pts.length; i++) {
    const [u, v] = a.pts[i];
    // A point sitting exactly on the frame edge reads as water whatever the
    // ground does: landField is the signed distance to the mainland outline,
    // and the mainland outline runs along the frame edge. Those are artefacts
    // of the test, not roads in the sea, so ignore the outermost sliver.
    const onEdge = u < 0.004 || u > 0.996 || v < 0.004 || v > 0.996;
    if (!onEdge && (landField(u, v) <= 0 || reliefAt(u, v) < 1.5)) wet.push(i);
    if (i === 0) continue;

    const prev = a.pts[i - 1];
    len += Math.hypot((u - prev[0]) * FRAME.widthM, (v - prev[1]) * FRAME.heightM);

    const mid = [(u + prev[0]) / 2, (v + prev[1]) / 2];
    const d = districtAt(mid[0], mid[1]);
    if (!d || d.grid.kind !== 'grid') continue;
    const br = bearing(prev, a.pts[i]);
    const rot = ((d.grid.rotDeg % 180) + 180) % 180;
    // Either family of the grid counts as running with the grain.
    const off = Math.min(
      Math.abs(br - rot), Math.abs(br - rot - 90),
      Math.abs(br - rot + 90), Math.abs(br - rot - 180), Math.abs(br - rot + 180)
    );
    grains.set(d.id, Math.max(grains.get(d.id) ?? 0, off));
  }

  const crossing = DIAGONAL_BY_DESIGN.has(a.id)
    ? []
    : [...grains].filter(([, off]) => off > GRAIN_TOLERANCE_DEG);

  if (OVER_WATER_BY_DESIGN.has(a.id)) wet.length = 0;
  if (!wet.length && !crossing.length) return;

  console.log('%s  %s  (%s km)', a.id.padEnd(18), a.name, (len / 1000).toFixed(1));
  if (wet.length) {
    wetCount++;
    console.log('    over water at point %s of %s', wet.join(', '), a.pts.length);
  }
  for (const [id, off] of crossing) {
    grainCount++;
    const d = DISTRICTS.find((x) => x.id === id);
    console.log('    cuts across %s (grid at %s deg) by %s deg',
      id, d.grid.rotDeg, off.toFixed(0));
  }
});

console.log();
console.log('%d arterials with a stretch over water, %d cutting across a grid, '
  + 'of %d total', wetCount, grainCount, ARTERIALS.length);
