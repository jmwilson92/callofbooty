// San Diego, traced from the reference map, in NORMALISED coordinates.
//
// Everything here is (u, v) in 0..1 over the reference frame: u runs east,
// v runs south. Nothing in this file knows how big the world is. `WORLD.SIZE`
// is the only scale knob, so the same geography can be generated at 4 km for
// fast iteration and at full scale for play without retracing anything.
//
// Reference frame — Google Maps @32.706329,-117.195805,11.96z, captured at
// device pixel ratio 2, which works out at 16.53 m per pixel. Two independent
// checks fix that scale: San Diego International to Coronado measures 6.5 km
// (real 6.5) and Cabrillo to Old Town measures 11.8 km (real 11.5).
export const FRAME = {
  widthM: 17600,
  heightM: 14200,
  centreLat: 32.706329,
  centreLon: -117.195805,
};

/** Aspect of the real frame. A square world crops to this. */
export const ASPECT = FRAME.widthM / FRAME.heightM;

// ── Land ────────────────────────────────────────────────────────────────────
// Polygons that are dry land. Traced coarsely — the coastline is a game
// boundary, not a survey — but the silhouette is what makes the map read as
// San Diego from the air, so the big moves are right: the Point Loma hook, the
// bay behind it, Coronado closing the bay, and the Silver Strand running south.

/**
 * The mainland. West edge is the Pacific shore; the south-east edge traces the
 * bay's north shore directly — past the airport, along the downtown waterfront
 * and on down to National City.
 *
 * San Diego Bay is deliberately NOT a carved polygon. It is the negative space
 * between this shore, Point Loma to the west and Coronado to the south, which
 * is what it physically is. Modelling it as a carve on top of a mainland whose
 * edge already followed the bay cut the water twice and put the shoreline in
 * two different places at once.
 */
export const MAINLAND = [
  [0.055, 0.000], [0.030, 0.055], [0.048, 0.120], [0.070, 0.170],
  [0.062, 0.215], [0.080, 0.265], [0.070, 0.320], [0.095, 0.345],
  [0.150, 0.352], [0.230, 0.348], [0.310, 0.345], [0.362, 0.352],
  [0.420, 0.382], [0.480, 0.422], [0.540, 0.466], [0.600, 0.512],
  [0.660, 0.560], [0.720, 0.610], [0.780, 0.660], [0.840, 0.710],
  [0.900, 0.760], [0.960, 0.810], [1.000, 0.845],
  [1.000, 0.000],
];

/**
 * Point Loma — the hook that closes the bay. Runs south from Ocean Beach to
 * Cabrillo at the tip, narrow the whole way, with Sunset Cliffs on the ocean
 * side and the sub base tucked behind it on the bay side.
 */
export const POINT_LOMA = [
  [0.070, 0.320], [0.086, 0.360], [0.100, 0.420], [0.104, 0.490],
  [0.108, 0.560], [0.116, 0.640], [0.126, 0.720], [0.134, 0.800],
  [0.146, 0.870], [0.166, 0.905], [0.190, 0.895], [0.196, 0.840],
  [0.190, 0.770], [0.182, 0.690], [0.176, 0.610], [0.170, 0.530],
  [0.164, 0.460], [0.150, 0.405], [0.120, 0.360], [0.096, 0.322],
];

/**
 * Coronado and the Silver Strand. North Island is the wide lobe at the top,
 * the town sits on its south-east shoulder, and the Strand runs south as a
 * thin ribbon back to the mainland — which is what makes the bay a bay rather
 * than an inlet.
 */
export const CORONADO = [
  [0.290, 0.560], [0.300, 0.620], [0.320, 0.680], [0.360, 0.720],
  [0.420, 0.745], [0.470, 0.760], [0.510, 0.780], [0.530, 0.820],
  [0.545, 0.880], [0.560, 0.940], [0.575, 1.000],
  [0.615, 1.000], [0.600, 0.935], [0.585, 0.875], [0.572, 0.820],
  [0.560, 0.775], [0.540, 0.735], [0.500, 0.712], [0.450, 0.700],
  [0.400, 0.686], [0.360, 0.660], [0.335, 0.620], [0.325, 0.565],
  [0.310, 0.535],
];

export const LAND = [MAINLAND, POINT_LOMA, CORONADO];

// ── Water carved back out of the land ───────────────────────────────────────

/** Mission Bay — the multi-lobe lagoon behind Mission Beach. */
export const MISSION_BAY = [
  [0.075, 0.020], [0.110, 0.010], [0.170, 0.020], [0.205, 0.055],
  [0.215, 0.100], [0.195, 0.140], [0.150, 0.160], [0.105, 0.150],
  [0.078, 0.115], [0.068, 0.065],
];

// San Diego Bay needs no polygon of its own — see MAINLAND. Only genuinely
// enclosed water is carved back out of the land.
export const WATER = [MISSION_BAY];

// ── Relief ──────────────────────────────────────────────────────────────────
// Elevation is layered on top of the land mask. Heights are in metres; the
// horizontal extents are normalised, so relief scales with the world.
//
// San Diego is a mesa-and-canyon city: flat-topped tables 100-140 m up, cut by
// steep canyons and one big east-west river valley. That texture — flat where
// you build, sharp where you don't — is the thing to get right.

/** Flat-topped tables. `r` is a normalised radius; falloff is smooth. */
export const MESAS = [
  { id: 'clairemont', u: 0.30, v: 0.13, r: 0.135, h: 105 },
  { id: 'kearny', u: 0.52, v: 0.05, r: 0.130, h: 120 },
  { id: 'linda_vista', u: 0.42, v: 0.16, r: 0.090, h: 95 },
  { id: 'balboa', u: 0.71, v: 0.34, r: 0.105, h: 110 },
  { id: 'northpark', u: 0.84, v: 0.24, r: 0.120, h: 120 },
  { id: 'cityheights', u: 0.96, v: 0.29, r: 0.110, h: 130 },
  { id: 'pointloma_ridge', u: 0.150, v: 0.620, r: 0.075, h: 130 },
  { id: 'downtown', u: 0.615, v: 0.500, r: 0.055, h: 20 },
  { id: 'goldenhill', u: 0.760, v: 0.470, r: 0.070, h: 80 },
  { id: 'nationalcity', u: 0.930, v: 0.800, r: 0.090, h: 35 },
];

/**
 * Valleys and canyons, as polylines with a half-width and a depth. These cut
 * back down through the mesas, which is what gives the city its shape.
 */
export const VALLEYS = [
  // Mission Valley — the I-8 trench, the biggest single cut on the map
  { id: 'mission_valley', halfW: 0.030, depth: 95, floor: 12,
    pts: [[0.24, 0.135], [0.34, 0.105], [0.46, 0.075], [0.58, 0.055], [0.72, 0.040], [0.88, 0.030]] },
  // Rose Canyon, running north-west out of Mission Valley
  { id: 'rose_canyon', halfW: 0.018, depth: 60, floor: 25,
    pts: [[0.26, 0.130], [0.30, 0.080], [0.34, 0.030], [0.37, 0.000]] },
  // Switzer / Chollas canyons behind downtown
  { id: 'chollas', halfW: 0.016, depth: 55, floor: 30,
    pts: [[0.78, 0.360], [0.86, 0.330], [0.94, 0.310]] },
  // The canyon system through Balboa Park
  { id: 'balboa_canyons', halfW: 0.014, depth: 50, floor: 35,
    pts: [[0.665, 0.300], [0.700, 0.345], [0.735, 0.395], [0.760, 0.440]] },
];

// ── Freeways ────────────────────────────────────────────────────────────────
// Real corridors, traced from the shields on the reference map. These are the
// spine of how the map plays, so they follow the actual routes rather than
// convenient straight lines.
export const FREEWAYS = [
  { id: 'i5', width: 26, pts: [
    [0.34, 0.000], [0.36, 0.060], [0.40, 0.140], [0.45, 0.230],
    [0.505, 0.300], [0.545, 0.360], [0.575, 0.420], [0.605, 0.470],
    [0.650, 0.530], [0.720, 0.600], [0.790, 0.660], [0.860, 0.720], [0.930, 0.780] ] },
  { id: 'i8', width: 24, pts: [
    [0.240, 0.140], [0.330, 0.108], [0.450, 0.078], [0.580, 0.056],
    [0.720, 0.040], [0.860, 0.028], [1.000, 0.020] ] },
  { id: 'i15', width: 22, pts: [
    [0.880, 0.000], [0.885, 0.100], [0.890, 0.200], [0.888, 0.300],
    [0.878, 0.400], [0.860, 0.470], [0.830, 0.530] ] },
  { id: 'i805', width: 22, pts: [
    [0.800, 0.000], [0.820, 0.090], [0.845, 0.180], [0.868, 0.270],
    [0.885, 0.360], [0.900, 0.460], [0.915, 0.560], [0.930, 0.660], [0.945, 0.770] ] },
  { id: 'sr163', width: 18, pts: [
    [0.700, 0.045], [0.680, 0.130], [0.664, 0.215], [0.648, 0.300], [0.628, 0.400] ] },
  { id: 'sr94', width: 18, pts: [
    [0.660, 0.500], [0.730, 0.510], [0.800, 0.525], [0.880, 0.540], [0.960, 0.555] ] },
  // SR-75: the Coronado bridge, downtown across the bay to the island
  { id: 'sr75', width: 16, pts: [
    [0.640, 0.545], [0.600, 0.590], [0.560, 0.640], [0.520, 0.690], [0.492, 0.735] ] },
];

// ── Places ──────────────────────────────────────────────────────────────────
// POI anchors at their true relative positions, read off the reference map.
export const PLACES = [
  { id: 'missionbeach', u: 0.070, v: 0.026 },
  { id: 'oceanbeach', u: 0.099, v: 0.213 },
  { id: 'sunsetcliffs', u: 0.101, v: 0.426 },
  { id: 'pointloma', u: 0.140, v: 0.620 },
  { id: 'cabrillo', u: 0.150, v: 0.870 },
  { id: 'airport', u: 0.370, v: 0.337 },
  { id: 'oldtown', u: 0.508, v: 0.136 },
  { id: 'missionvalley', u: 0.658, v: 0.048 },
  { id: 'hillcrest', u: 0.589, v: 0.227 },
  { id: 'balboa', u: 0.710, v: 0.354 },
  { id: 'downtown', u: 0.611, v: 0.500 },
  { id: 'littleitaly', u: 0.569, v: 0.436 },
  { id: 'northisland', u: 0.349, v: 0.644 },
  { id: 'coronado', u: 0.497, v: 0.772 },
  { id: 'nationalcity', u: 0.972, v: 0.820 },
  { id: 'northpark', u: 0.802, v: 0.245 },
  { id: 'cityheights', u: 0.968, v: 0.294 },
  { id: 'kearnymesa', u: 0.520, v: 0.040 },
  { id: 'clairemont', u: 0.300, v: 0.130 },
  { id: 'mcrd', u: 0.395, v: 0.285 },
  { id: 'zoo', u: 0.700, v: 0.310 },
];

// ── Sampling helpers ────────────────────────────────────────────────────────

/** Standard even-odd point-in-polygon on normalised coords. */
export function inPoly(poly, u, v) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ui, vi] = poly[i];
    const [uj, vj] = poly[j];
    if ((vi > v) !== (vj > v) && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) {
      inside = !inside;
    }
  }
  return inside;
}

/** Shortest distance from (u,v) to a polygon's edges, in normalised units. */
export function distToPoly(poly, u, v) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-9;
    let t = ((u - ax) * dx + (v - ay) * dy) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + dx * t;
    const py = ay + dy * t;
    const d = Math.hypot(u - px, v - py);
    if (d < best) best = d;
  }
  return best;
}

/** Shortest distance from (u,v) to a polyline, in normalised units. */
export function distToLine(pts, u, v) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-9;
    let t = ((u - ax) * dx + (v - ay) * dy) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + dx * t;
    const py = ay + dy * t;
    const d = Math.hypot(u - px, v - py);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Signed "landness" at (u,v): > 0 on land, < 0 on water, magnitude is the
 * normalised distance to the nearest shoreline. Used both to build the
 * heightfield and to feather the coast.
 */
export function landField(u, v) {
  let onLand = false;
  let dLand = Infinity;
  for (const poly of LAND) {
    if (inPoly(poly, u, v)) onLand = true;
    dLand = Math.min(dLand, distToPoly(poly, u, v));
  }
  if (onLand) {
    // Water bodies punch back through
    for (const w of WATER) {
      if (inPoly(w, u, v)) return -Math.min(dLand, distToPoly(w, u, v));
      dLand = Math.min(dLand, distToPoly(w, u, v));
    }
    return dLand;
  }
  return -dLand;
}

/** Terrain elevation in metres at (u,v), before noise and before water cuts. */
export function reliefAt(u, v) {
  let h = 6;   // coastal shelf
  for (const m of MESAS) {
    const d = Math.hypot(u - m.u, (v - m.v) / ASPECT * ASPECT);
    if (d >= m.r) continue;
    // Flat top with a smooth shoulder: most of the radius is table, the outer
    // third falls away. This is what makes a mesa a mesa and not a hill.
    const t = d / m.r;
    const k = t < 0.62 ? 1 : 1 - (t - 0.62) / 0.38;
    h = Math.max(h, m.h * (k * k * (3 - 2 * k)));
  }
  for (const val of VALLEYS) {
    const d = distToLine(val.pts, u, v);
    if (d >= val.halfW * 2.2) continue;
    const t = Math.min(1, d / (val.halfW * 2.2));
    const cut = 1 - t * t * (3 - 2 * t);
    h = h * (1 - cut) + Math.min(h, val.floor) * cut;
  }
  return h;
}
