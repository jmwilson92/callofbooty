// Everything on the map that nobody built: rivers, ponds, parks, trees, rock.
//
// The city fabric has been filling the flat ground and stopping at the canyon
// rims, which is correct and leaves roughly half the land bare dirt. Bare dirt
// is not what is there. San Diego's unbuilt ground is a specific and
// recognisable thing: chaparral on the canyon walls, eucalyptus in the parks
// and along the arroyos, palms on the boulevards and the beach fronts, sandstone
// breaking out of the steeper slopes, and a river running the length of Mission
// Valley that the freeway was built beside.
//
// Two mechanisms. The named things — rivers, ponds, the parks whose planting is
// deliberate — are written down here. Everything else is scattered by rule onto
// whatever ground the city did not take, which is why the canyons fill in on
// their own: they are unbuilt because they are steep, and steep unbuilt ground
// is exactly where the scrub is.

import { FRAME } from './SanDiegoGeo.js';

// ── Rivers ──────────────────────────────────────────────────────────────────
//
// Traced along the valley floors already cut into the terrain by VALLEYS in
// SanDiegoGeo, so the water sits in the trench rather than across it. Widths
// are the wetted channel, not the flood plain — the San Diego River is a
// concrete-lined 60 m channel for most of its length through the city, which is
// both true and the reason it reads as a hard line from the air.

export const RIVERS = [
  {
    id: 'san_diego_river',
    name: 'San Diego River',
    w: 62,
    // East to west down Mission Valley, under I-5, out to the sea between
    // Ocean Beach and Mission Beach. The longest single line on the map.
    pts: [[1.000, 0.050], [0.900, 0.060], [0.800, 0.072], [0.700, 0.084],
      [0.600, 0.096], [0.500, 0.108], [0.420, 0.120], [0.348, 0.138],
      [0.286, 0.168], [0.226, 0.216], [0.170, 0.268], [0.126, 0.306],
      [0.088, 0.326]],
  },
  {
    id: 'sweetwater',
    name: 'Sweetwater River',
    w: 44,
    pts: [[1.000, 0.856], [0.930, 0.868], [0.862, 0.884], [0.800, 0.906],
      [0.752, 0.924], [0.726, 0.934]],
  },
  {
    id: 'chollas_creek',
    name: 'Chollas Creek',
    w: 26,
    // Down through Southcrest to the bay at the shipyards. Mostly a concrete
    // ditch with a road either side, which is how it reads.
    pts: [[0.916, 0.418], [0.868, 0.462], [0.820, 0.506], [0.774, 0.548],
      [0.732, 0.588], [0.700, 0.614]],
  },
  {
    id: 'rose_creek',
    name: 'Rose Creek',
    w: 20,
    pts: [[0.238, 0.000], [0.230, 0.036], [0.222, 0.072], [0.212, 0.104]],
  },
  {
    id: 'tecolote',
    name: 'Tecolote Creek',
    w: 18,
    pts: [[0.330, 0.108], [0.300, 0.114], [0.268, 0.122], [0.238, 0.128]],
  },
];

// ── Standing water ──────────────────────────────────────────────────────────
//
// Reservoirs and park ponds. Mission Bay is already water in the land mask and
// San Diego Bay is the negative space between the shores, so neither is here.

export const PONDS = [
  {
    id: 'lake_murray',
    name: 'Lake Murray',
    h: 160,          // metres above sea level: it is a reservoir up on the mesa
    poly: [[0.938, 0.076], [0.968, 0.070], [0.988, 0.086], [0.986, 0.114],
      [0.962, 0.126], [0.938, 0.112], [0.930, 0.092]],
  },
  {
    id: 'chollas_lake',
    name: 'Chollas Lake',
    h: 88,
    poly: [[0.888, 0.386], [0.906, 0.382], [0.916, 0.396], [0.910, 0.410],
      [0.892, 0.410], [0.884, 0.398]],
  },
];

// ── Parks and open space ────────────────────────────────────────────────────
//
// `cover` is how much of the ground the scatter fills, 0..1, and `kind` picks
// what grows there. These override the default scrub rule inside their outline.
//
//   'grove'    dense broadleaf — the eucalyptus and ficus of the old parks
//   'scrub'    coastal sage, low and grey-green: the canyon walls
//   'palm'     boulevard and beach-front planting, tall and thin
//   'turf'     mown grass with specimen trees: golf courses, ball fields
//   'bare'     sand and pavement — beaches, the parade deck, the strand

export const PARKS = [
  {
    id: 'balboa_park',
    name: 'Balboa Park',
    kind: 'grove', cover: 0.55,
    poly: [[0.640, 0.270], [0.706, 0.258], [0.752, 0.288], [0.762, 0.352],
      [0.744, 0.416], [0.694, 0.436], [0.648, 0.400], [0.634, 0.334]],
  },
  {
    id: 'balboa_golf',
    name: 'Balboa Park golf course',
    kind: 'turf', cover: 0.10,
    poly: [[0.744, 0.352], [0.786, 0.348], [0.804, 0.386], [0.786, 0.424],
      [0.746, 0.420]],
  },
  {
    id: 'presidio',
    name: 'Presidio Park',
    kind: 'grove', cover: 0.5,
    poly: [[0.452, 0.140], [0.492, 0.134], [0.508, 0.158], [0.496, 0.184],
      [0.462, 0.180], [0.446, 0.162]],
  },
  {
    id: 'mission_bay_park',
    name: 'Mission Bay Park',
    kind: 'turf', cover: 0.18,
    // The mown ring round the lagoon: playing fields, picnic lawns and palms.
    poly: [[0.062, 0.010], [0.120, 0.000], [0.190, 0.006], [0.226, 0.046],
      [0.236, 0.104], [0.208, 0.152], [0.150, 0.176], [0.094, 0.164],
      [0.060, 0.126], [0.050, 0.062]],
  },
  {
    id: 'coronado_golf',
    name: 'Coronado golf course',
    kind: 'turf', cover: 0.12,
    poly: [[0.524, 0.686], [0.560, 0.694], [0.578, 0.722], [0.556, 0.742],
      [0.522, 0.726], [0.512, 0.702]],
  },
  {
    id: 'rosecrans_cemetery_ground',
    name: 'Fort Rosecrans',
    // Mown grass and headstones, almost no trees. The absence is the landmark.
    kind: 'turf', cover: 0.05,
    poly: [[0.146, 0.696], [0.200, 0.708], [0.220, 0.792], [0.206, 0.872],
      [0.174, 0.888], [0.148, 0.840], [0.140, 0.764]],
  },
  {
    id: 'mission_trails',
    name: 'Mission Trails & Cowles',
    kind: 'scrub', cover: 0.42,
    poly: [[0.800, 0.000], [0.912, 0.000], [0.948, 0.028], [0.930, 0.056],
      [0.856, 0.052], [0.802, 0.030]],
  },
  {
    id: 'sunset_cliffs_park',
    name: 'Sunset Cliffs',
    kind: 'scrub', cover: 0.22,
    poly: [[0.070, 0.320], [0.096, 0.330], [0.104, 0.430], [0.112, 0.520],
      [0.086, 0.512], [0.076, 0.420]],
  },
  {
    id: 'ob_beach',
    name: 'Ocean Beach & the strand',
    kind: 'bare', cover: 0.0,
    poly: [[0.026, 0.000], [0.052, 0.000], [0.062, 0.120], [0.058, 0.240],
      [0.052, 0.330], [0.022, 0.320], [0.018, 0.150]],
  },
  {
    id: 'silver_strand_beach',
    name: 'Silver Strand beach',
    kind: 'bare', cover: 0.02,
    poly: [[0.532, 0.800], [0.548, 0.846], [0.556, 0.944], [0.560, 1.000],
      [0.542, 1.000], [0.534, 0.900]],
  },
];

// ── What grows where, when no park says otherwise ───────────────────────────
//
// The default. Unbuilt ground in this city is canyon wall and mesa edge, and
// what is on it is coastal sage scrub: waist-high, grey-green, and dense enough
// to be impassable but nowhere near tree height. The tall stuff is in the parks
// and the arroyo bottoms, which is where the water is.

export const SCATTER = {
  /** Metres between scatter samples before jitter and rejection. */
  spacingM: 15,

  /** Default cover on unclaimed ground. */
  cover: 0.34,

  /**
   * How close a plant may stand to a road or a building, metres.
   *
   * Two metres, not five. At five the clearance swallowed the front gardens,
   * the back gardens and the verges — 85% of all dry land came back occupied
   * and the county came out with sixteen thousand trees on it. The gaps
   * between suburban houses are where most of a city's canopy actually is.
   */
  clearM: 2.0,

  /**
   * Species by kind. `h` is trunk-top-to-crown-top total height in metres,
   * `r` the crown radius, and `w` the relative chance of being picked.
   */
  species: {
    grove: [
      { id: 'eucalyptus', h: [14, 26], r: [3.5, 6.5], w: 5 },
      { id: 'ficus', h: [9, 16], r: [4.0, 7.5], w: 3 },
      { id: 'palm', h: [10, 20], r: [1.6, 2.6], w: 2 },
      { id: 'shrub', h: [1.4, 2.6], r: [0.9, 1.8], w: 4 },
    ],
    scrub: [
      { id: 'shrub', h: [0.9, 2.2], r: [0.8, 1.7], w: 9 },
      { id: 'sumac', h: [2.4, 4.2], r: [1.4, 2.6], w: 3 },
      { id: 'eucalyptus', h: [10, 18], r: [3.0, 5.0], w: 1 },
    ],
    palm: [
      { id: 'palm', h: [11, 21], r: [1.6, 2.8], w: 9 },
      { id: 'shrub', h: [1.0, 2.0], r: [0.8, 1.5], w: 3 },
    ],
    turf: [
      { id: 'ficus', h: [8, 15], r: [4.0, 7.0], w: 3 },
      { id: 'palm', h: [10, 18], r: [1.6, 2.6], w: 2 },
      { id: 'shrub', h: [1.0, 2.0], r: [0.8, 1.6], w: 1 },
    ],
    bare: [],
  },

  /**
   * Rock. Sandstone breaks out of the steeper canyon walls and the sea cliffs,
   * and nowhere else — a boulder on a mesa top is a boulder somebody put there.
   */
  rock: {
    // Only 2.6% of the map is steeper than 0.22, so that threshold produced
    // six hundred boulders across 250 km2. 0.15 is still unambiguously a
    // canyon wall and there is eight times as much of it.
    minSlope: 0.15,
    spacingM: 34,
    cover: 0.40,
    size: [1.2, 4.6],
  },
};

/** Convenience: the rivers and ponds as one list of things to fill with water. */
export function waterFeatures() {
  return { rivers: RIVERS, ponds: PONDS };
}

/** Metres per normalised unit, for callers working in the traced frame. */
export const FRAME_M = { u: FRAME.widthM, v: FRAME.heightM };
