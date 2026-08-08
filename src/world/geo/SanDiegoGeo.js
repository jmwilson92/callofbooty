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
  // The bay's north-east shore. This used to run straight to the bottom-right
  // corner, which made San Diego Bay a triangle swallowing a third of the map
  // and drowned National City, Chula Vista and the whole south bay. The real
  // bay is a finger roughly 2-3 km across: the shore runs south-east past the
  // airport and the embarcadero, then turns hard south and stays a couple of
  // kilometres off the Silver Strand all the way to the bottom of the frame.
  [0.404, 0.372], [0.442, 0.398], [0.476, 0.428], [0.512, 0.452],
  [0.552, 0.468], [0.586, 0.496], [0.614, 0.534], [0.638, 0.578],
  [0.658, 0.624], [0.674, 0.672], [0.688, 0.722], [0.700, 0.776],
  [0.710, 0.832], [0.718, 0.890], [0.724, 0.948], [0.728, 1.000],
  // South and east of the bay is land, not water — the frame's bottom-right
  // corner is Bonita and Lincoln Acres.
  [1.000, 1.000],
  [1.000, 0.000],
];

/**
 * Point Loma — the hook that closes the bay. Runs south from Ocean Beach to
 * Cabrillo at the tip, narrow the whole way, with Sunset Cliffs on the ocean
 * side and the sub base tucked behind it on the bay side.
 */
export const POINT_LOMA = [
  // West shore — Ocean Beach down through Sunset Cliffs to the tip
  [0.068, 0.316], [0.074, 0.372], [0.080, 0.436], [0.086, 0.502],
  [0.094, 0.568], [0.104, 0.634], [0.116, 0.698], [0.132, 0.760],
  [0.150, 0.818], [0.168, 0.866], [0.192, 0.892],
  // Bay shore back north — Fort Rosecrans, Fleetridge, the sub base
  [0.214, 0.872], [0.224, 0.820], [0.230, 0.760], [0.240, 0.694],
  [0.250, 0.626], [0.258, 0.556], [0.266, 0.488], [0.272, 0.420],
  [0.276, 0.360], [0.250, 0.332], [0.186, 0.320], [0.120, 0.314],
];

/**
 * Coronado and the Silver Strand. North Island is the wide lobe at the top,
 * the town sits on its south-east shoulder, and the Strand runs south as a
 * thin ribbon back to the mainland — which is what makes the bay a bay rather
 * than an inlet.
 */
export const CORONADO = [
  // North Island: a broad lobe about 3 x 2 km, not the ribbon this used to be.
  // It is the widest land on the bay's west side and the reason the channel
  // reads as a channel.
  [0.302, 0.548], [0.348, 0.530], [0.400, 0.532], [0.446, 0.552],
  [0.470, 0.586], [0.482, 0.626], [0.488, 0.664],
  // Coronado town, on the island's south-east shoulder
  [0.504, 0.700], [0.520, 0.742], [0.534, 0.788],
  // The Silver Strand, running south off the bottom of the frame
  [0.548, 0.850], [0.560, 0.920], [0.572, 1.000],
  [0.612, 1.000], [0.600, 0.918], [0.588, 0.848], [0.574, 0.786],
  [0.558, 0.742], [0.532, 0.706], [0.500, 0.688],
  // South shore of North Island, back west to the start
  [0.454, 0.686], [0.408, 0.680], [0.364, 0.664], [0.330, 0.634],
  [0.310, 0.592],
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

/**
 * Flat-topped tables, as outlines rather than radii.
 *
 * They used to be circles with a smooth falloff over the outer 38% of the
 * radius. Two things were wrong with that and both showed up the moment the
 * terrain was rendered: ten circles with one falloff curve is the same landform
 * stamped ten times, and a 0.13 radius spends 870 m dropping 120 m, which is a
 * 4-degree grade — a hill. San Diego's mesas end in escarpments you cannot
 * drive up, and it is that edge, not the height, that makes a mesa read as one.
 *
 * `edge` is how far the escarpment runs, in normalised units; 0.010 is about
 * 175 m, so a 120 m table falls at roughly 35 degrees. Inside the outline the
 * top is dead flat, which is the half that makes the city buildable.
 */
export const MESAS = [
  // The eastern tableland: one continuous surface from Hillcrest out past City
  // Heights, dissected by canyons rather than broken into separate hills. This
  // was three circles before, which is why the east read as scattered bumps on
  // a plain instead of a plateau with cuts in it.
  { id: 'east_mesa', h: 122, edge: 0.011, poly: [
    [0.598, 0.286], [0.622, 0.222], [0.664, 0.178], [0.732, 0.152],
    [0.812, 0.142], [0.902, 0.146], [1.000, 0.158], [1.000, 0.512],
    [0.938, 0.520], [0.868, 0.508], [0.800, 0.486], [0.742, 0.452],
    [0.692, 0.412], [0.648, 0.362], [0.616, 0.322] ] },
  // Kearny Mesa — the wide table north of Mission Valley
  { id: 'kearny', h: 120, edge: 0.011, poly: [
    [0.432, 0.000], [0.552, 0.000], [0.618, 0.010], [0.638, 0.032],
    [0.622, 0.062], [0.552, 0.076], [0.472, 0.070], [0.436, 0.044] ] },
  // Clairemont — north of Mission Valley, west of Kearny, cut off from the
  // ocean by the Mission Bay lowland
  { id: 'clairemont', h: 104, edge: 0.010, poly: [
    [0.228, 0.036], [0.288, 0.014], [0.352, 0.022], [0.392, 0.056],
    [0.386, 0.100], [0.336, 0.124], [0.268, 0.120], [0.230, 0.084] ] },
  // Linda Vista — the smaller bench between Mission Valley and the bay flats
  { id: 'linda_vista', h: 94, edge: 0.009, poly: [
    [0.352, 0.152], [0.412, 0.142], [0.462, 0.160], [0.472, 0.198],
    [0.444, 0.230], [0.386, 0.234], [0.352, 0.202] ] },
  // The Point Loma ridge. It has to run the whole peninsula — the old circle
  // covered barely a third of it, which is why Cabrillo at the tip sampled at
  // 5.7 m when it stands about 130 m above the water.
  { id: 'pointloma_ridge', h: 128, edge: 0.008, poly: [
    [0.104, 0.428], [0.114, 0.510], [0.121, 0.598], [0.128, 0.686],
    [0.135, 0.770], [0.142, 0.846], [0.158, 0.886], [0.180, 0.874],
    [0.186, 0.798], [0.180, 0.714], [0.172, 0.630], [0.164, 0.546],
    [0.154, 0.470], [0.132, 0.432] ] },
  // Golden Hill / Sherman Heights, the shoulder that drops to the bay
  { id: 'goldenhill', h: 78, edge: 0.010, poly: [
    [0.686, 0.446], [0.762, 0.436], [0.822, 0.462], [0.816, 0.518],
    [0.746, 0.540], [0.690, 0.508] ] },
  // Downtown sits on a low bench, not a mesa — a couple of storeys above the
  // embarcadero and no more
  { id: 'downtown', h: 22, edge: 0.012, poly: [
    [0.574, 0.452], [0.640, 0.468], [0.664, 0.506], [0.638, 0.542],
    [0.582, 0.524], [0.564, 0.484] ] },
  // National City / Chula Vista — low rolling ground behind the south bay
  { id: 'nationalcity', h: 38, edge: 0.014, poly: [
    [0.858, 0.702], [0.946, 0.722], [1.000, 0.756], [1.000, 0.860],
    [0.926, 0.842], [0.868, 0.786] ] },
];

/**
 * Valleys and canyons, as polylines with a half-width and a depth. These cut
 * back down through the mesas, which is what gives the city its shape.
 */
export const VALLEYS = [
  // Mission Valley — the I-8 trench, the biggest single cut on the map
  { id: 'mission_valley', halfW: 0.020, depth: 82, floor: 12,
    pts: [[0.24, 0.135], [0.34, 0.105], [0.46, 0.075], [0.58, 0.055], [0.72, 0.040], [0.88, 0.030]] },
  // Rose Canyon, running north-west out of Mission Valley
  { id: 'rose_canyon', halfW: 0.018, depth: 52, floor: 25,
    pts: [[0.26, 0.130], [0.30, 0.080], [0.34, 0.030], [0.37, 0.000]] },
  // Switzer / Chollas canyons behind downtown
  { id: 'chollas', halfW: 0.016, depth: 46, floor: 30,
    pts: [[0.78, 0.360], [0.86, 0.330], [0.94, 0.310]] },
  // The canyon system through Balboa Park
  { id: 'balboa_canyons', halfW: 0.014, depth: 42, floor: 35,
    pts: [[0.665, 0.300], [0.700, 0.345], [0.735, 0.395], [0.760, 0.440]] },
  // Tecolote — the notch between Clairemont and Linda Vista
  { id: 'tecolote', halfW: 0.011, depth: 56, floor: 22,
    pts: [[0.330, 0.128], [0.344, 0.088], [0.352, 0.048], [0.356, 0.008]] },
  // Murphy Canyon, the SR-163 trench running north out of Mission Valley
  { id: 'murphy', halfW: 0.012, depth: 54, floor: 34,
    pts: [[0.646, 0.052], [0.662, 0.106], [0.672, 0.166], [0.676, 0.226]] },
  // Auburn / Manzanita, cutting west into the eastern tableland
  { id: 'auburn', halfW: 0.012, depth: 46, floor: 44,
    pts: [[0.760, 0.200], [0.820, 0.226], [0.878, 0.244], [0.936, 0.256]] },
  // The 47th Street cut, separating City Heights from the southern slopes
  { id: 'southcrest', halfW: 0.013, depth: 44, floor: 30,
    pts: [[0.720, 0.440], [0.796, 0.408], [0.870, 0.386], [0.948, 0.372]] },
  // Florida Canyon, the cut that makes Balboa Park an island of mesa
  { id: 'florida', halfW: 0.010, depth: 44, floor: 38,
    pts: [[0.700, 0.216], [0.712, 0.268], [0.720, 0.322], [0.724, 0.376]] },
];

// ── Freeways ────────────────────────────────────────────────────────────────
// Real corridors, traced from the shields on the reference map. These are the
// spine of how the map plays, so they follow the actual routes rather than
// convenient straight lines.
export const FREEWAYS = [
  // Re-traced off a Google Maps capture and registered onto this frame with
  // three landmarks — Cabrillo, downtown and National City. The registration
  // checks out: National City lands on u 0.972, which is where PLACES
  // independently puts it.
  //
  // The previous trace had I-8 starting too far east, SR-94 running south-east
  // when it actually climbs north of east toward Lemon Grove, and SR-75 as one
  // route when it is a bridge over the channel and then an ordinary road down
  // the Silver Strand.
  { id: 'i5', width: 26, pts: [
    [0.445, 0.000], [0.454, 0.082], [0.465, 0.217], [0.485, 0.298],
    [0.513, 0.365], [0.547, 0.419], [0.582, 0.473], [0.616, 0.514],
    [0.661, 0.567], [0.713, 0.615], [0.764, 0.655], [0.821, 0.702],
    [0.878, 0.742], [0.935, 0.783], [0.992, 0.850] ] },
  { id: 'i8', width: 24, pts: [
    [0.149, 0.153], [0.206, 0.153], [0.297, 0.136], [0.388, 0.116],
    [0.490, 0.103], [0.582, 0.089], [0.690, 0.069], [0.809, 0.055],
    [0.923, 0.042], [1.000, 0.035] ] },
  { id: 'i805', width: 22, pts: [
    [0.809, 0.000], [0.832, 0.082], [0.855, 0.177], [0.889, 0.285],
    [0.923, 0.378], [0.958, 0.460], [0.986, 0.541], [1.000, 0.585] ] },
  { id: 'sr163', width: 18, pts: [
    [0.650, 0.095], [0.659, 0.163], [0.665, 0.210], [0.670, 0.284],
    [0.670, 0.365], [0.661, 0.433], [0.644, 0.487], [0.627, 0.514] ] },
  { id: 'sr94', width: 18, pts: [
    [0.650, 0.554], [0.718, 0.548], [0.809, 0.527], [0.901, 0.507],
    [0.992, 0.498], [1.000, 0.497] ] },
  // The Coronado bridge holds its deck; the Strand does not.
  { id: 'sr75_bridge', width: 16, bridge: true, deckM: 62, pts: [
    [0.678, 0.597], [0.650, 0.618], [0.616, 0.641], [0.582, 0.664],
    [0.547, 0.682], [0.519, 0.696] ] },
  { id: 'sr75_strand', width: 16, pts: [
    [0.519, 0.696], [0.536, 0.783], [0.570, 0.864], [0.593, 0.945],
    [0.616, 1.000] ] },
  // I-15 is deliberately absent: it runs east of this frame's edge, and a stub
  // drawn along the boundary would be a line rather than a freeway.
];

// ── Places ──────────────────────────────────────────────────────────────────
// POI anchors at their true relative positions, read off the reference map.
export const PLACES = [
  { id: 'missionbeach', u: 0.070, v: 0.026 },
  { id: 'oceanbeach', u: 0.099, v: 0.213 },
  { id: 'sunsetcliffs', u: 0.101, v: 0.426 },
  { id: 'pointloma', u: 0.140, v: 0.620 },
  { id: 'cabrillo', u: 0.160, v: 0.864 },
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

/** Elevation right at the waterline. */
const SHELF = 6;
/** How high the coastal plain has climbed by the time it reaches the mesas. */
const PLAIN_RISE = 48;
/** Distance inland, normalised, over which it does that climbing. */
const PLAIN_REACH = 0.085;

// Deterministic value noise. Without it every surface between the landforms is
// exactly flat, which is what made the first render read as tables sitting on a
// drawing board — real ground is never level, and the eye knows it immediately.
function hash2(i, j) {
  let n = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function noise2(u, v, freq) {
  const x = u * freq;
  const y = v * freq;
  const i = Math.floor(x);
  const j = Math.floor(y);
  const sx = (x - i) * (x - i) * (3 - 2 * (x - i));
  const sy = (y - j) * (y - j) * (3 - 2 * (y - j));
  const a = hash2(i, j);
  const b = hash2(i + 1, j);
  const c = hash2(i, j + 1);
  const d = hash2(i + 1, j + 1);
  const top = a + (b - a) * sx;
  return top + ((c + (d - c) * sx) - top) * sy;
}

/** Two octaves, centred on zero. */
function undulation(u, v) {
  return (noise2(u, v, 46) - 0.5) * 1.35 + (noise2(u, v, 121) - 0.5) * 0.5;
}

/**
 * Bounding boxes, built once. Every sample would otherwise run point-in-polygon
 * and a full edge-distance sweep against all eight mesas and ten valleys, and
 * at 16 million samples that is the difference between an export you wait for
 * and one you abandon. Nearly every sample is outside nearly every landform, so
 * a box test answers it in four comparisons.
 */
let _boxes = null;
function boxes() {
  if (_boxes) return _boxes;
  const box = (pts, pad) => {
    let u0 = Infinity; let v0 = Infinity; let u1 = -Infinity; let v1 = -Infinity;
    for (const [u, v] of pts) {
      if (u < u0) u0 = u;
      if (u > u1) u1 = u;
      if (v < v0) v0 = v;
      if (v > v1) v1 = v;
    }
    return { u0: u0 - pad, v0: v0 - pad, u1: u1 + pad, v1: v1 + pad };
  };
  _boxes = {
    mesas: MESAS.map((m) => ({ m, b: box(m.poly, (m.edge ?? 0.010) + 1e-4) })),
    valleys: VALLEYS.map((val) => ({ val, b: box(val.pts, val.halfW * 2.2 + 1e-4) })),
  };
  return _boxes;
}

const inBox = (b, u, v) => u >= b.u0 && u <= b.u1 && v >= b.v0 && v <= b.v1;

/**
 * Terrain elevation in metres at (u,v), before water cuts.
 *
 * @param {number} u
 * @param {number} v
 * @param {number} [land] signed landField value, if the caller already has it.
 *   It is the distance inland, which is exactly what the coastal rise needs;
 *   recomputing it here would double the cost of every one of 16 million
 *   samples for a number the exporter is already holding.
 */
export function reliefAt(u, v, land = null) {
  const B = boxes();

  // The coastal plain climbs away from the water. Leaving it flat is what made
  // the mesas read as islands on a board: San Diego west of the tables is not
  // level ground, it is a ramp, and the tables are what the ramp runs into.
  const inland = land == null ? Math.max(0, landField(u, v)) : Math.max(0, land);
  const g = Math.min(1, inland / PLAIN_REACH);
  let h = SHELF + PLAIN_RISE * (g * g * (3 - 2 * g));
  h += undulation(u, v) * 5.5 * Math.min(1, inland / 0.012);

  // Mesas: flat on top, and steep at the rim. Taking the max means two tables
  // that touch form a saddle rather than one summing into a dome.
  for (const { m, b } of B.mesas) {
    if (!inBox(b, u, v)) continue;
    // Signed distance to the outline, positive inside, then wobbled. Testing
    // the polygon directly makes every rim a run of straight segments with
    // visible corners — an eight-sided mesa reads as drawn, not eroded. The
    // wobble is about +/-90 m of wander, which is the scale real canyons chew
    // into a rim, and it costs one noise lookup.
    const inside = inPoly(m.poly, u, v);
    const sd = (inside ? 1 : -1) * distToPoly(m.poly, u, v)
      + (noise2(u, v, 34) - 0.5) * 0.0105;

    let e;
    if (sd >= 0) {
      // Even a mesa top rolls a little — dead flat is the tell of a machine.
      e = m.h + undulation(u, v) * 2.6;
    } else {
      const w = m.edge ?? 0.010;
      if (-sd >= w) continue;
      const t = 1 + sd / w;
      e = SHELF + (m.h - SHELF) * (t * t * (3 - 2 * t));
    }
    if (e > h) h = e;
  }

  // Canyons cut back down through whatever the mesas just built. Order matters:
  // a cut applied before the tables exist has nothing to cut.
  //
  // The floor is a depth below local ground rather than an absolute height. As
  // an absolute it gouged 90 m out of the tableland and left nothing where it
  // crossed the plain, so the same canyon read as a black trench at one end and
  // vanished at the other.
  for (const { val, b } of B.valleys) {
    if (!inBox(b, u, v)) continue;
    const reach = val.halfW * 2.2;
    const d = distToLine(val.pts, u, v);
    if (d >= reach) continue;
    const t = d / reach;
    const cut = 1 - t * t * (3 - 2 * t);
    const floor = Math.max(val.floor, h - val.depth);
    h = h * (1 - cut) + Math.min(h, floor) * cut;
  }
  return h;
}
