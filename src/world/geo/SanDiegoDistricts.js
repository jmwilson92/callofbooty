// San Diego's city fabric: neighbourhoods, their street grids, and what gets
// built in them. Normalised (u, v) like everything else in this folder.
//
// Positions are traced against the landforms and freeways already in
// SanDiegoGeo.js rather than converted from latitude and longitude. That is a
// deliberate choice, not a shortcut: fitting an affine transform from real
// coordinates onto the traced frame leaves residuals of up to 3.5 km, because
// the coastline was traced by eye from a screen capture and is not a
// projection. Real coordinates pushed through a transform that does not exist
// would put Ocean Beach in the water and North Park on a freeway. Tracing
// against the freeways — which the map already agrees with — keeps the city
// consistent with the ground it stands on.
//
// What IS taken from the real city is everything that does not depend on that
// registration: which neighbourhood sits in which freeway cell, how its streets
// are oriented, how big its blocks are, and what stands on them. A 60 m block of
// single-storey bungalows in North Park and a 120 m superblock of tilt-up
// warehouses in Kearny Mesa read completely differently from the air and on
// foot, and that difference is most of what makes a city legible.

import { FRAME } from './SanDiegoGeo.js';

/** Normalised (u,v) to metres in the frame. All fabric geometry is metric. */
export function uvToM(u, v) {
  return [u * FRAME.widthM, v * FRAME.heightM];
}

/** Metres back to normalised (u,v). */
export function mToUv(x, y) {
  return [x / FRAME.widthM, y / FRAME.heightM];
}

// ── Fabric vocabulary ───────────────────────────────────────────────────────
//
// grid.kind
//   'grid'    straight streets, two families at right angles. Downtown, North
//             Park, Coronado, National City — anything platted in one go.
//   'curvi'   the same two families, but each line bent by smooth noise. This
//             is the post-war mesa suburb: Clairemont, Serra Mesa, Point Loma
//             Heights. Curving because the platter followed the canyon rims.
//   'super'   very large blocks, few streets. Industrial and commercial parks.
//   'none'    no street grid at all. Parks, the runway, open military ground.
//
// grid.rotDeg
//   Angle of the primary (long) street family, degrees, measured from due east
//   and increasing clockwise on the map — that is, toward +v, toward the south.
//   0 puts the primary streets dead east-west.
//
// build.kind
//   'tower'      downtown high-rise; one building fills most of a block
//   'midrise'    4-8 storey infill, courtyard blocks
//   'commercial' strip retail and offices, big flat roofs, parking aprons
//   'house'      detached single-family, four to eight per block face
//   'rowhouse'   attached or near-attached small lots, beach and old streetcar
//   'industrial' tilt-up warehouses, long low boxes
//   'campus'     scattered large buildings in open ground
//   'military'   hangars, barracks, long sheds
//   'park'       almost nothing
//
// build.cover      fraction of each parcel the building covers
// build.minH/maxH  building height range, metres
// build.lotW/lotD  typical parcel frontage and depth, metres

export const DISTRICTS = [
  // ── The coast and Mission Bay ─────────────────────────────────────────────
  {
    id: 'missionbeach',
    name: 'Mission Beach',
    // The barrier spit: ocean on one side, Mission Bay on the other, two blocks
    // wide the whole way. Nothing else in San Diego is built this tight —
    // 25 ft lots, alleys instead of streets, and no parking.
    poly: [[0.036, 0.000], [0.062, 0.000], [0.078, 0.052], [0.082, 0.108],
      [0.070, 0.150], [0.052, 0.140], [0.046, 0.088], [0.034, 0.040]],
    grid: { kind: 'grid', rotDeg: 78, blockW: 58, blockH: 34, streetW: 9, aveW: 12, curveAmp: 0 },
    build: { kind: 'rowhouse', cover: 0.72, minH: 6, maxH: 11, lotW: 9, lotD: 17 },
  },
  {
    id: 'pacificbeach',
    name: 'Pacific Beach',
    poly: [[0.062, 0.000], [0.150, 0.000], [0.168, 0.018], [0.150, 0.038],
      [0.098, 0.034], [0.072, 0.020]],
    grid: { kind: 'grid', rotDeg: 4, blockW: 96, blockH: 66, streetW: 11, aveW: 14, curveAmp: 0 },
    build: { kind: 'rowhouse', cover: 0.56, minH: 5, maxH: 12, lotW: 13, lotD: 24 },
  },
  {
    id: 'oceanbeach',
    name: 'Ocean Beach',
    // West shore at the top of Point Loma, between the cliffs and the river.
    poly: [[0.068, 0.170], [0.104, 0.176], [0.124, 0.214], [0.118, 0.264],
      [0.092, 0.290], [0.070, 0.262], [0.062, 0.212]],
    grid: { kind: 'grid', rotDeg: 8, blockW: 78, blockH: 52, streetW: 10, aveW: 13, curveAmp: 0 },
    build: { kind: 'rowhouse', cover: 0.58, minH: 5, maxH: 11, lotW: 12, lotD: 22 },
  },

  // ── Point Loma ────────────────────────────────────────────────────────────
  {
    id: 'pointlomaheights',
    name: 'Point Loma Heights & Sunset Cliffs',
    // Up on the ridge above the cliffs. Platted in pieces down the slope, so
    // the streets bend to follow the contour rather than running true.
    poly: [[0.086, 0.296], [0.140, 0.312], [0.176, 0.348], [0.186, 0.412],
      [0.172, 0.470], [0.140, 0.496], [0.106, 0.470], [0.092, 0.404],
      [0.086, 0.346]],
    grid: { kind: 'curvi', rotDeg: 12, blockW: 108, blockH: 62, streetW: 11, aveW: 14, curveAmp: 26 },
    build: { kind: 'house', cover: 0.34, minH: 4, maxH: 9, lotW: 17, lotD: 30 },
  },
  {
    id: 'lomaportal',
    name: 'Loma Portal & Roseville',
    // The bay side, between Rosecrans and the water. Older, tighter, and laid
    // out on the true grid because it was platted off the harbour, not the
    // hillside.
    poly: [[0.180, 0.330], [0.244, 0.344], [0.276, 0.376], [0.272, 0.432],
      [0.242, 0.462], [0.196, 0.446], [0.176, 0.396]],
    grid: { kind: 'grid', rotDeg: 20, blockW: 92, blockH: 58, streetW: 11, aveW: 14, curveAmp: 0 },
    build: { kind: 'house', cover: 0.38, minH: 4, maxH: 10, lotW: 15, lotD: 28 },
  },
  {
    id: 'laplaya',
    name: 'La Playa & Fleetridge',
    poly: [[0.176, 0.462], [0.238, 0.474], [0.262, 0.514], [0.256, 0.572],
      [0.222, 0.598], [0.184, 0.570], [0.168, 0.512]],
    grid: { kind: 'curvi', rotDeg: 16, blockW: 124, blockH: 74, streetW: 10, aveW: 13, curveAmp: 30 },
    build: { kind: 'house', cover: 0.30, minH: 5, maxH: 11, lotW: 21, lotD: 36 },
  },
  {
    id: 'subbase',
    name: 'Naval Base Point Loma',
    // Bay side below Fleetridge: piers, long sheds, fuel tanks. Sparse and
    // rectangular, nothing residential.
    poly: [[0.226, 0.600], [0.256, 0.590], [0.268, 0.636], [0.258, 0.690],
      [0.230, 0.700], [0.216, 0.652]],
    grid: { kind: 'super', rotDeg: 14, blockW: 200, blockH: 130, streetW: 14, aveW: 18, curveAmp: 0 },
    build: { kind: 'military', cover: 0.40, minH: 8, maxH: 18, lotW: 60, lotD: 40 },
  },
  {
    id: 'rosecrans',
    name: 'Fort Rosecrans',
    // Cemetery, the lighthouse road and the monument. Deliberately almost
    // empty — this is the one stretch of the peninsula with no city on it.
    poly: [[0.150, 0.700], [0.196, 0.712], [0.216, 0.790], [0.204, 0.868],
      [0.176, 0.884], [0.152, 0.836], [0.144, 0.766]],
    grid: { kind: 'none', rotDeg: 12, blockW: 300, blockH: 200, streetW: 9, aveW: 11, curveAmp: 0 },
    build: { kind: 'park', cover: 0.02, minH: 4, maxH: 8, lotW: 20, lotD: 20 },
  },

  // ── Midway, the airport and the river mouth ───────────────────────────────
  {
    id: 'midway',
    name: 'Midway & Sports Arena',
    // Flat filled ground between the river and the harbour: big-box retail,
    // car lots and the arena. Superblocks, aprons of parking, nothing tall.
    poly: [[0.222, 0.262], [0.306, 0.276], [0.344, 0.302], [0.336, 0.344],
      [0.278, 0.348], [0.226, 0.318]],
    grid: { kind: 'super', rotDeg: 14, blockW: 190, blockH: 140, streetW: 14, aveW: 20, curveAmp: 0 },
    build: { kind: 'commercial', cover: 0.42, minH: 7, maxH: 15, lotW: 55, lotD: 45 },
  },
  {
    id: 'mcrd',
    name: 'MCRD San Diego',
    // Parade deck and arcaded barracks along the north side of the runway.
    poly: [[0.336, 0.256], [0.406, 0.266], [0.428, 0.294], [0.412, 0.322],
      [0.352, 0.316], [0.332, 0.288]],
    grid: { kind: 'grid', rotDeg: 16, blockW: 150, blockH: 92, streetW: 12, aveW: 16, curveAmp: 0 },
    build: { kind: 'military', cover: 0.34, minH: 9, maxH: 15, lotW: 48, lotD: 30 },
  },
  {
    id: 'airport',
    name: 'San Diego International',
    // The runway itself. No fabric — the airport plan places the terminals.
    poly: [[0.318, 0.318], [0.418, 0.330], [0.436, 0.356], [0.412, 0.376],
      [0.336, 0.362], [0.314, 0.340]],
    grid: { kind: 'none', rotDeg: 8, blockW: 400, blockH: 300, streetW: 16, aveW: 20, curveAmp: 0 },
    build: { kind: 'park', cover: 0.0, minH: 0, maxH: 0, lotW: 40, lotD: 40 },
  },

  // ── The northern mesas ────────────────────────────────────────────────────
  {
    id: 'clairemont',
    name: 'Clairemont',
    // The archetype of the 1950s mesa suburb: curving collectors following the
    // canyon rims, cul-de-sacs hanging off them, one storey and a carport.
    poly: [[0.222, 0.026], [0.292, 0.006], [0.362, 0.016], [0.398, 0.052],
      [0.392, 0.104], [0.336, 0.130], [0.262, 0.124], [0.222, 0.086]],
    grid: { kind: 'curvi', rotDeg: 6, blockW: 122, blockH: 68, streetW: 11, aveW: 15, curveAmp: 34 },
    build: { kind: 'house', cover: 0.32, minH: 4, maxH: 8, lotW: 18, lotD: 31 },
  },
  {
    id: 'kearnymesa',
    name: 'Kearny Mesa',
    // Industrial and commercial superblocks. Convoy Street's strip malls, the
    // car dealerships, and a lot of tilt-up. Almost no houses.
    poly: [[0.428, 0.000], [0.560, 0.000], [0.624, 0.012], [0.642, 0.036],
      [0.618, 0.066], [0.548, 0.080], [0.470, 0.074], [0.432, 0.046]],
    grid: { kind: 'super', rotDeg: 3, blockW: 210, blockH: 150, streetW: 14, aveW: 20, curveAmp: 0 },
    build: { kind: 'industrial', cover: 0.46, minH: 8, maxH: 16, lotW: 70, lotD: 50 },
  },
  {
    id: 'baypark',
    name: 'Bay Park & Bay Ho',
    // The slope between Clairemont's rim and the Morena flats. Streets run
    // along the contour because nothing else works on a 1-in-8 hillside.
    poly: [[0.148, 0.020], [0.216, 0.014], [0.238, 0.052], [0.234, 0.104],
      [0.196, 0.132], [0.156, 0.108], [0.144, 0.062]],
    grid: { kind: 'curvi', rotDeg: 348, blockW: 112, blockH: 62, streetW: 10, aveW: 14, curveAmp: 28 },
    build: { kind: 'house', cover: 0.34, minH: 4, maxH: 9, lotW: 16, lotD: 28 },
  },
  {
    id: 'lindavista',
    name: 'Linda Vista',
    // Wartime housing on the bench above the valley, later filled in. Tight
    // lots by mesa standards and a grid that bends where the bench narrows.
    poly: [[0.346, 0.148], [0.414, 0.138], [0.468, 0.158], [0.478, 0.198],
      [0.448, 0.234], [0.384, 0.238], [0.348, 0.204]],
    grid: { kind: 'curvi', rotDeg: 350, blockW: 104, blockH: 60, streetW: 10, aveW: 14, curveAmp: 22 },
    build: { kind: 'house', cover: 0.36, minH: 4, maxH: 9, lotW: 15, lotD: 27 },
  },
  {
    id: 'serramesa',
    name: 'Serra Mesa',
    poly: [[0.482, 0.098], [0.552, 0.092], [0.598, 0.108], [0.602, 0.144],
      [0.564, 0.166], [0.504, 0.160], [0.480, 0.132]],
    grid: { kind: 'curvi', rotDeg: 8, blockW: 116, blockH: 66, streetW: 11, aveW: 14, curveAmp: 30 },
    build: { kind: 'house', cover: 0.32, minH: 4, maxH: 8, lotW: 18, lotD: 30 },
  },
  {
    id: 'tierrasanta',
    name: 'Tierrasanta',
    // A planned community dropped on the mesa in one piece: loop roads, no
    // through streets, and the canyons left as open space between the arms.
    poly: [[0.652, 0.000], [0.748, 0.000], [0.786, 0.024], [0.780, 0.058],
      [0.724, 0.072], [0.666, 0.062], [0.646, 0.030]],
    grid: { kind: 'curvi', rotDeg: 12, blockW: 130, blockH: 72, streetW: 11, aveW: 15, curveAmp: 44 },
    build: { kind: 'house', cover: 0.30, minH: 5, maxH: 9, lotW: 18, lotD: 30 },
  },
  {
    id: 'alliedgardens',
    name: 'Allied Gardens, Del Cerro & San Carlos',
    poly: [[0.796, 0.030], [0.902, 0.038], [0.976, 0.056], [1.000, 0.082],
      [1.000, 0.126], [0.918, 0.126], [0.836, 0.108], [0.792, 0.072]],
    grid: { kind: 'curvi', rotDeg: 6, blockW: 118, blockH: 68, streetW: 11, aveW: 14, curveAmp: 32 },
    build: { kind: 'house', cover: 0.32, minH: 4, maxH: 8, lotW: 17, lotD: 29 },
  },
  {
    id: 'grantville',
    name: 'Grantville & Mission Village',
    poly: [[0.660, 0.104], [0.740, 0.098], [0.786, 0.116], [0.782, 0.152],
      [0.722, 0.166], [0.664, 0.146]],
    grid: { kind: 'super', rotDeg: 4, blockW: 170, blockH: 110, streetW: 13, aveW: 18, curveAmp: 0 },
    build: { kind: 'industrial', cover: 0.42, minH: 7, maxH: 14, lotW: 52, lotD: 40 },
  },
  {
    id: 'missionvalley',
    name: 'Mission Valley',
    // The I-8 trench floor. Malls, hotels and car parks on the flat, built
    // long and low because the valley floods and nothing here is old.
    poly: [[0.300, 0.116], [0.420, 0.096], [0.560, 0.078], [0.700, 0.058],
      [0.760, 0.056], [0.766, 0.086], [0.700, 0.098], [0.560, 0.116],
      [0.420, 0.136], [0.306, 0.150]],
    grid: { kind: 'super', rotDeg: 352, blockW: 220, blockH: 130, streetW: 14, aveW: 22, curveAmp: 0 },
    build: { kind: 'commercial', cover: 0.40, minH: 8, maxH: 26, lotW: 62, lotD: 44 },
  },

  // ── Old Town and Uptown ───────────────────────────────────────────────────
  {
    id: 'oldtown',
    name: 'Old Town',
    poly: [[0.462, 0.108], [0.524, 0.116], [0.552, 0.148], [0.542, 0.186],
      [0.494, 0.194], [0.462, 0.162]],
    grid: { kind: 'grid', rotDeg: 10, blockW: 84, blockH: 56, streetW: 10, aveW: 13, curveAmp: 0 },
    build: { kind: 'rowhouse', cover: 0.44, minH: 4, maxH: 10, lotW: 13, lotD: 22 },
  },
  {
    id: 'missionhills',
    name: 'Mission Hills',
    poly: [[0.494, 0.176], [0.552, 0.184], [0.578, 0.212], [0.568, 0.246],
      [0.520, 0.252], [0.492, 0.220]],
    grid: { kind: 'curvi', rotDeg: 6, blockW: 100, blockH: 62, streetW: 10, aveW: 14, curveAmp: 20 },
    build: { kind: 'house', cover: 0.36, minH: 5, maxH: 11, lotW: 17, lotD: 29 },
  },
  {
    id: 'hillcrest',
    name: 'Hillcrest & Bankers Hill',
    // Streetcar-era grid: 300 ft blocks, mid-rise on the avenues, canyon-edge
    // apartment blocks looking over the park.
    poly: [[0.548, 0.186], [0.618, 0.196], [0.650, 0.232], [0.640, 0.286],
      [0.594, 0.306], [0.550, 0.276], [0.540, 0.226]],
    grid: { kind: 'grid', rotDeg: 6, blockW: 92, blockH: 92, streetW: 11, aveW: 16, curveAmp: 0 },
    build: { kind: 'midrise', cover: 0.52, minH: 8, maxH: 26, lotW: 22, lotD: 30 },
  },
  {
    id: 'balboapark',
    name: 'Balboa Park',
    // The mesa between SR-163 and Florida Canyon. Museums along El Prado, the
    // zoo north of them, and a great deal of grass and eucalyptus.
    poly: [[0.646, 0.276], [0.702, 0.264], [0.746, 0.292], [0.756, 0.352],
      [0.740, 0.412], [0.694, 0.430], [0.652, 0.396], [0.640, 0.334]],
    grid: { kind: 'none', rotDeg: 4, blockW: 260, blockH: 180, streetW: 10, aveW: 14, curveAmp: 0 },
    build: { kind: 'park', cover: 0.05, minH: 8, maxH: 22, lotW: 46, lotD: 34 },
  },

  // ── The mid-city grid, east of the park ───────────────────────────────────
  {
    id: 'northpark',
    name: 'North Park & University Heights',
    // The big streetcar grid: dead straight, 300 ft blocks, alleys, and a
    // craftsman bungalow on nearly every lot with commercial on the corners.
    poly: [[0.752, 0.182], [0.848, 0.194], [0.872, 0.238], [0.860, 0.298],
      [0.796, 0.316], [0.746, 0.286], [0.740, 0.226]],
    grid: { kind: 'grid', rotDeg: 4, blockW: 92, blockH: 62, streetW: 11, aveW: 15, curveAmp: 0 },
    build: { kind: 'house', cover: 0.42, minH: 4, maxH: 12, lotW: 14, lotD: 26 },
  },
  {
    id: 'normalheights',
    name: 'Normal Heights & Kensington',
    poly: [[0.744, 0.136], [0.842, 0.144], [0.878, 0.172], [0.868, 0.200],
      [0.790, 0.200], [0.742, 0.176]],
    grid: { kind: 'grid', rotDeg: 4, blockW: 90, blockH: 60, streetW: 10, aveW: 14, curveAmp: 0 },
    build: { kind: 'house', cover: 0.40, minH: 4, maxH: 10, lotW: 14, lotD: 26 },
  },
  {
    id: 'cityheights',
    name: 'City Heights',
    // Same grid as North Park, denser and poorer: courtyard apartments filling
    // lots that started with one house on them.
    poly: [[0.868, 0.212], [0.972, 0.222], [1.000, 0.248], [1.000, 0.336],
      [0.926, 0.348], [0.868, 0.316], [0.858, 0.256]],
    grid: { kind: 'grid', rotDeg: 4, blockW: 90, blockH: 60, streetW: 10, aveW: 15, curveAmp: 0 },
    build: { kind: 'midrise', cover: 0.48, minH: 5, maxH: 15, lotW: 15, lotD: 25 },
  },
  {
    id: 'universityheights',
    name: 'University Heights',
    poly: [[0.652, 0.196], [0.740, 0.190], [0.756, 0.222], [0.748, 0.272],
      [0.696, 0.290], [0.652, 0.264], [0.644, 0.226]],
    grid: { kind: 'grid', rotDeg: 4, blockW: 92, blockH: 62, streetW: 11, aveW: 15, curveAmp: 0 },
    build: { kind: 'house', cover: 0.44, minH: 4, maxH: 13, lotW: 14, lotD: 25 },
  },
  {
    id: 'southpark',
    name: 'South Park & Burlingame',
    poly: [[0.758, 0.316], [0.844, 0.328], [0.872, 0.366], [0.862, 0.418],
      [0.800, 0.434], [0.752, 0.400], [0.744, 0.352]],
    grid: { kind: 'grid', rotDeg: 4, blockW: 90, blockH: 60, streetW: 10, aveW: 14, curveAmp: 0 },
    build: { kind: 'house', cover: 0.42, minH: 4, maxH: 11, lotW: 14, lotD: 25 },
  },
  {
    id: 'oakpark',
    name: 'Oak Park & Chollas View',
    poly: [[0.878, 0.348], [0.966, 0.360], [1.000, 0.386], [1.000, 0.446],
      [0.930, 0.450], [0.874, 0.416], [0.866, 0.378]],
    grid: { kind: 'curvi', rotDeg: 6, blockW: 100, blockH: 62, streetW: 10, aveW: 14, curveAmp: 20 },
    build: { kind: 'house', cover: 0.38, minH: 4, maxH: 10, lotW: 15, lotD: 26 },
  },
  {
    id: 'collegearea',
    name: 'College Area & Rolando',
    poly: [[0.872, 0.126], [0.966, 0.132], [1.000, 0.156], [1.000, 0.210],
      [0.914, 0.206], [0.872, 0.170]],
    grid: { kind: 'curvi', rotDeg: 6, blockW: 104, blockH: 64, streetW: 10, aveW: 14, curveAmp: 18 },
    build: { kind: 'house', cover: 0.38, minH: 4, maxH: 12, lotW: 16, lotD: 27 },
  },

  // ── Downtown ──────────────────────────────────────────────────────────────
  {
    id: 'bankershill',
    name: 'Bankers Hill & Middletown',
    // The strip between the park's west edge and the harbour: canyon-rim
    // apartment towers at the top, warehouses and the airport approach at the
    // bottom, and a hard grade between the two.
    poly: [[0.536, 0.302], [0.606, 0.312], [0.636, 0.348], [0.628, 0.406],
      [0.588, 0.446], [0.544, 0.428], [0.526, 0.364]],
    grid: { kind: 'grid', rotDeg: 8, blockW: 88, blockH: 76, streetW: 11, aveW: 15, curveAmp: 0 },
    build: { kind: 'midrise', cover: 0.50, minH: 7, maxH: 42, lotW: 20, lotD: 28 },
  },
  {
    id: 'downtown',
    name: 'Downtown & the Core',
    // Horton's plat: 200 ft square blocks, no alleys, and the towers standing
    // one to a block. The grid is turned a few degrees off true so the avenues
    // meet the harbour square.
    poly: [[0.556, 0.442], [0.616, 0.454], [0.652, 0.484], [0.644, 0.522],
      [0.598, 0.532], [0.560, 0.500], [0.548, 0.468]],
    grid: { kind: 'grid', rotDeg: 9, blockW: 74, blockH: 74, streetW: 16, aveW: 20, curveAmp: 0 },
    build: { kind: 'tower', cover: 0.74, minH: 24, maxH: 152, lotW: 46, lotD: 46 },
  },
  {
    id: 'littleitaly',
    name: 'Little Italy',
    poly: [[0.532, 0.404], [0.582, 0.416], [0.600, 0.444], [0.584, 0.466],
      [0.542, 0.454], [0.526, 0.428]],
    grid: { kind: 'grid', rotDeg: 9, blockW: 74, blockH: 74, streetW: 14, aveW: 18, curveAmp: 0 },
    build: { kind: 'midrise', cover: 0.62, minH: 10, maxH: 46, lotW: 24, lotD: 30 },
  },
  {
    id: 'eastvillage',
    name: 'East Village',
    // Same blocks, lower and looser: warehouses, the ballpark, and infill
    // towers punched into the middle of it.
    poly: [[0.620, 0.470], [0.686, 0.494], [0.702, 0.534], [0.678, 0.566],
      [0.628, 0.548], [0.610, 0.508]],
    grid: { kind: 'grid', rotDeg: 9, blockW: 74, blockH: 74, streetW: 15, aveW: 18, curveAmp: 0 },
    build: { kind: 'midrise', cover: 0.60, minH: 9, maxH: 78, lotW: 28, lotD: 34 },
  },
  {
    id: 'embarcadero',
    name: 'Embarcadero & the shipyards',
    // The working waterfront: piers, cranes, the convention centre, and the
    // long sheds of the yards south of it.
    poly: [[0.520, 0.446], [0.588, 0.486], [0.646, 0.540], [0.676, 0.588],
      [0.652, 0.606], [0.606, 0.560], [0.548, 0.506], [0.506, 0.468]],
    grid: { kind: 'super', rotDeg: 40, blockW: 180, blockH: 110, streetW: 14, aveW: 20, curveAmp: 0 },
    build: { kind: 'industrial', cover: 0.36, minH: 9, maxH: 24, lotW: 58, lotD: 38 },
  },

  // ── South-east of downtown ────────────────────────────────────────────────
  {
    id: 'goldenhill',
    name: 'Golden Hill & Sherman Heights',
    poly: [[0.688, 0.444], [0.766, 0.438], [0.822, 0.464], [0.816, 0.514],
      [0.750, 0.538], [0.692, 0.506]],
    grid: { kind: 'grid', rotDeg: 9, blockW: 84, blockH: 62, streetW: 11, aveW: 15, curveAmp: 0 },
    build: { kind: 'house', cover: 0.44, minH: 5, maxH: 14, lotW: 14, lotD: 25 },
  },
  {
    id: 'barriologan',
    name: 'Barrio Logan',
    // Wedged between the freeway, the rail yard and the shipyards. Houses and
    // metal shops on the same block, which is exactly how it reads.
    poly: [[0.664, 0.554], [0.726, 0.578], [0.752, 0.618], [0.728, 0.646],
      [0.678, 0.616], [0.656, 0.582]],
    grid: { kind: 'grid', rotDeg: 22, blockW: 88, blockH: 60, streetW: 11, aveW: 15, curveAmp: 0 },
    build: { kind: 'industrial', cover: 0.50, minH: 5, maxH: 16, lotW: 20, lotD: 26 },
  },
  {
    id: 'loganheights',
    name: 'Logan Heights & Southcrest',
    poly: [[0.726, 0.520], [0.822, 0.546], [0.868, 0.598], [0.848, 0.652],
      [0.774, 0.640], [0.720, 0.586]],
    grid: { kind: 'grid', rotDeg: 20, blockW: 88, blockH: 60, streetW: 11, aveW: 15, curveAmp: 0 },
    build: { kind: 'house', cover: 0.44, minH: 4, maxH: 12, lotW: 14, lotD: 24 },
  },
  {
    id: 'encanto',
    name: 'Encanto & Lemon Grove',
    poly: [[0.860, 0.418], [0.960, 0.436], [1.000, 0.474], [1.000, 0.560],
      [0.918, 0.560], [0.856, 0.502]],
    grid: { kind: 'curvi', rotDeg: 8, blockW: 108, blockH: 66, streetW: 11, aveW: 14, curveAmp: 24 },
    build: { kind: 'house', cover: 0.36, minH: 4, maxH: 9, lotW: 17, lotD: 28 },
  },
  {
    id: 'lincolnpark',
    name: 'Lincoln Park & Valencia Park',
    poly: [[0.826, 0.484], [0.910, 0.500], [0.948, 0.536], [0.938, 0.590],
      [0.868, 0.604], [0.816, 0.564], [0.812, 0.518]],
    grid: { kind: 'grid', rotDeg: 12, blockW: 96, blockH: 62, streetW: 11, aveW: 15, curveAmp: 0 },
    build: { kind: 'house', cover: 0.38, minH: 4, maxH: 10, lotW: 16, lotD: 27 },
  },
  {
    id: 'paradisehills',
    name: 'Paradise Hills & Skyline',
    poly: [[0.878, 0.592], [0.968, 0.606], [1.000, 0.638], [1.000, 0.716],
      [0.930, 0.716], [0.874, 0.672], [0.866, 0.626]],
    grid: { kind: 'curvi', rotDeg: 10, blockW: 112, blockH: 66, streetW: 11, aveW: 14, curveAmp: 30 },
    build: { kind: 'house', cover: 0.34, minH: 4, maxH: 9, lotW: 17, lotD: 28 },
  },
  {
    id: 'nationalcity',
    name: 'National City',
    // Its own plat, laid out square to the compass rather than to the bay, and
    // that mismatch with the shoreline is very visible from the air.
    poly: [[0.842, 0.690], [0.948, 0.716], [1.000, 0.756], [1.000, 0.878],
      [0.916, 0.856], [0.850, 0.786], [0.834, 0.732]],
    grid: { kind: 'grid', rotDeg: 0, blockW: 106, blockH: 74, streetW: 12, aveW: 16, curveAmp: 0 },
    build: { kind: 'house', cover: 0.40, minH: 4, maxH: 12, lotW: 16, lotD: 27 },
  },
  {
    id: 'nationalcityport',
    name: 'National City marine terminal',
    // The car terminal: acres of flat ground, a few very long sheds.
    poly: [[0.752, 0.664], [0.836, 0.702], [0.850, 0.756], [0.812, 0.774],
      [0.752, 0.722], [0.736, 0.684]],
    grid: { kind: 'super', rotDeg: 26, blockW: 240, blockH: 150, streetW: 14, aveW: 20, curveAmp: 0 },
    build: { kind: 'industrial', cover: 0.26, minH: 10, maxH: 20, lotW: 90, lotD: 46 },
  },
  {
    id: 'chulavista',
    name: 'Chula Vista west',
    // Its own downtown grid on Third Avenue, square to the compass like
    // National City and equally at odds with the shoreline beside it.
    poly: [[0.752, 0.856], [0.858, 0.876], [0.884, 0.930], [0.876, 0.996],
      [0.760, 1.000], [0.736, 0.936], [0.738, 0.884]],
    grid: { kind: 'grid', rotDeg: 0, blockW: 108, blockH: 74, streetW: 12, aveW: 16, curveAmp: 0 },
    build: { kind: 'house', cover: 0.38, minH: 4, maxH: 11, lotW: 17, lotD: 28 },
  },
  {
    id: 'bonita',
    name: 'Bonita & Chula Vista north',
    poly: [[0.902, 0.884], [1.000, 0.898], [1.000, 1.000], [0.860, 1.000],
      [0.868, 0.930]],
    grid: { kind: 'curvi', rotDeg: 4, blockW: 118, blockH: 70, streetW: 11, aveW: 15, curveAmp: 28 },
    build: { kind: 'house', cover: 0.32, minH: 4, maxH: 8, lotW: 19, lotD: 31 },
  },

  // ── Coronado ──────────────────────────────────────────────────────────────
  {
    id: 'northisland',
    name: 'NAS North Island',
    // Hangars along the flight line, the runway crossing the middle of the
    // lobe, and the carrier piers on the channel side.
    poly: [[0.322, 0.556], [0.400, 0.542], [0.452, 0.566], [0.472, 0.614],
      [0.462, 0.660], [0.404, 0.674], [0.348, 0.652], [0.318, 0.606]],
    grid: { kind: 'super', rotDeg: 22, blockW: 230, blockH: 150, streetW: 14, aveW: 20, curveAmp: 0 },
    build: { kind: 'military', cover: 0.28, minH: 10, maxH: 24, lotW: 80, lotD: 48 },
  },
  {
    id: 'coronado',
    name: 'Coronado',
    // A resort plat: wide streets, deep lots, and the Hotel del at the bottom
    // of Orange Avenue. Square to itself, not to the mainland.
    poly: [[0.476, 0.672], [0.522, 0.694], [0.546, 0.740], [0.552, 0.792],
      [0.522, 0.812], [0.490, 0.774], [0.470, 0.718]],
    grid: { kind: 'grid', rotDeg: 32, blockW: 96, blockH: 68, streetW: 12, aveW: 18, curveAmp: 0 },
    build: { kind: 'house', cover: 0.38, minH: 5, maxH: 14, lotW: 18, lotD: 30 },
  },
  {
    id: 'silverstrand',
    name: 'Silver Strand',
    // Barely a district: the highway, a naval reserve and dunes.
    poly: [[0.540, 0.840], [0.586, 0.856], [0.612, 0.980], [0.578, 0.992],
      [0.548, 0.884]],
    grid: { kind: 'none', rotDeg: 30, blockW: 200, blockH: 120, streetW: 10, aveW: 14, curveAmp: 0 },
    build: { kind: 'park', cover: 0.04, minH: 4, maxH: 9, lotW: 24, lotD: 24 },
  },
];

// ── Arterials ───────────────────────────────────────────────────────────────
// The named surface roads that carry between districts. These are drawn on top
// of the generated grid, wider than it and continuous across district
// boundaries, because that is what makes a city navigable: you can be lost in
// North Park's blocks and still know which way University Avenue runs.
//
// `w` is the carriageway width in metres. Six lanes and a median is about 30 m;
// a four-lane arterial about 22; a two-lane collector about 14.

export const ARTERIALS = [
  // — along the coast and through the beaches —
  { id: 'mission_blvd', name: 'Mission Blvd', w: 16, pts: [
    [0.040, 0.000], [0.052, 0.038], [0.062, 0.082], [0.070, 0.126], [0.074, 0.150]] },
  { id: 'ingraham', name: 'Ingraham St', w: 18, pts: [
    [0.096, 0.000], [0.100, 0.036], [0.108, 0.076], [0.120, 0.114], [0.134, 0.146]] },
  { id: 'garnet', name: 'Garnet Ave', w: 20, pts: [
    [0.058, 0.006], [0.104, 0.010], [0.152, 0.014], [0.196, 0.018]] },
  { id: 'sunsetcliffs', name: 'Sunset Cliffs Blvd', w: 20, pts: [
    [0.092, 0.196], [0.098, 0.256], [0.104, 0.320], [0.112, 0.386], [0.120, 0.450],
    [0.128, 0.492]] },
  { id: 'catalina', name: 'Catalina Blvd', w: 16, pts: [
    [0.128, 0.402], [0.138, 0.480], [0.146, 0.562], [0.154, 0.646], [0.162, 0.730],
    [0.170, 0.812], [0.180, 0.868]] },
  { id: 'voltaire', name: 'Voltaire St & Point Loma Ave', w: 16, pts: [
    [0.074, 0.246], [0.118, 0.256], [0.164, 0.268], [0.208, 0.282], [0.242, 0.296]] },
  { id: 'canon', name: 'Canon St', w: 14, pts: [
    [0.146, 0.336], [0.190, 0.352], [0.232, 0.372], [0.262, 0.392]] },
  { id: 'rosecrans', name: 'Rosecrans St', w: 26, pts: [
    [0.450, 0.246], [0.396, 0.260], [0.342, 0.278], [0.296, 0.306], [0.256, 0.344],
    [0.230, 0.394], [0.216, 0.454], [0.208, 0.516], [0.208, 0.578]] },
  { id: 'nimitz', name: 'Nimitz Blvd', w: 22, pts: [
    [0.302, 0.302], [0.256, 0.316], [0.212, 0.324], [0.166, 0.328], [0.126, 0.322],
    [0.104, 0.302]] },

  // — Midway, the harbour and Pacific Highway —
  { id: 'midway_dr', name: 'Midway Dr & Sports Arena Blvd', w: 24, pts: [
    [0.232, 0.298], [0.276, 0.306], [0.320, 0.312], [0.362, 0.312], [0.402, 0.302]] },
  { id: 'pacific_hwy', name: 'Pacific Highway', w: 26, pts: [
    [0.436, 0.194], [0.446, 0.246], [0.446, 0.300], [0.462, 0.348], [0.492, 0.390],
    [0.526, 0.424], [0.556, 0.452]] },
  { id: 'harbor_dr', name: 'Harbor Drive', w: 28, pts: [
    [0.352, 0.320], [0.404, 0.352], [0.452, 0.386], [0.500, 0.422], [0.542, 0.458],
    [0.582, 0.496], [0.620, 0.534], [0.656, 0.572], [0.686, 0.606], [0.716, 0.648],
    [0.744, 0.690], [0.774, 0.730]] },
  { id: 'north_harbor', name: 'North Harbor Drive', w: 24, pts: [
    [0.286, 0.334], [0.330, 0.348], [0.372, 0.368], [0.412, 0.392], [0.452, 0.418]] },

  // — Mission Valley and the mesas —
  { id: 'friars', name: 'Friars Road', w: 26, pts: [
    [0.302, 0.128], [0.372, 0.116], [0.446, 0.104], [0.522, 0.094], [0.600, 0.082],
    [0.678, 0.070], [0.744, 0.062]] },
  { id: 'camino_del_rio', name: 'Camino del Rio', w: 22, pts: [
    [0.418, 0.126], [0.496, 0.114], [0.578, 0.100], [0.660, 0.086], [0.740, 0.076]] },
  { id: 'clairemont_mesa', name: 'Clairemont Mesa Blvd', w: 26, pts: [
    [0.226, 0.062], [0.302, 0.054], [0.382, 0.048], [0.462, 0.042], [0.546, 0.036],
    [0.630, 0.030]] },
  { id: 'balboa_ave', name: 'Balboa Ave', w: 26, pts: [
    [0.076, 0.014], [0.152, 0.020], [0.230, 0.024], [0.310, 0.022], [0.392, 0.018],
    [0.470, 0.014]] },
  { id: 'genesee', name: 'Genesee Ave', w: 22, pts: [
    [0.284, 0.000], [0.290, 0.036], [0.298, 0.074], [0.310, 0.110], [0.326, 0.140]] },
  { id: 'convoy', name: 'Convoy St', w: 20, pts: [
    [0.500, 0.000], [0.504, 0.028], [0.510, 0.056], [0.518, 0.080]] },
  { id: 'kearny_villa', name: 'Kearny Villa Rd', w: 20, pts: [
    [0.596, 0.000], [0.602, 0.030], [0.610, 0.060], [0.620, 0.090], [0.628, 0.116]] },
  { id: 'morena', name: 'Morena Blvd', w: 22, pts: [
    [0.286, 0.098], [0.322, 0.130], [0.360, 0.164], [0.398, 0.198], [0.432, 0.228]] },
  { id: 'linda_vista_rd', name: 'Linda Vista Rd', w: 20, pts: [
    [0.336, 0.196], [0.386, 0.180], [0.436, 0.166], [0.480, 0.150], [0.512, 0.132]] },

  // — Uptown and mid-city, the streetcar lines —
  { id: 'washington', name: 'Washington St', w: 22, pts: [
    [0.494, 0.196], [0.540, 0.208], [0.586, 0.218], [0.632, 0.226], [0.672, 0.230]] },
  { id: 'university', name: 'University Ave', w: 24, pts: [
    [0.556, 0.246], [0.632, 0.250], [0.712, 0.254], [0.792, 0.258], [0.872, 0.264],
    [0.952, 0.270], [1.000, 0.274]] },
  { id: 'elcajon', name: 'El Cajon Blvd', w: 28, pts: [
    [0.612, 0.212], [0.692, 0.216], [0.774, 0.220], [0.856, 0.226], [0.938, 0.232],
    [1.000, 0.236]] },
  { id: 'adams', name: 'Adams Ave', w: 18, pts: [
    [0.664, 0.176], [0.740, 0.178], [0.816, 0.182], [0.890, 0.186], [0.958, 0.190]] },
  { id: 'fifth_ave', name: '5th & 6th Avenue', w: 20, pts: [
    [0.588, 0.196], [0.592, 0.256], [0.594, 0.318], [0.596, 0.380], [0.596, 0.440],
    [0.594, 0.492]] },
  { id: 'park_blvd', name: 'Park Blvd', w: 22, pts: [
    [0.664, 0.174], [0.664, 0.238], [0.662, 0.302], [0.658, 0.366], [0.652, 0.430],
    [0.648, 0.488], [0.646, 0.520]] },
  { id: 'thirtieth', name: '30th St', w: 18, pts: [
    [0.788, 0.148], [0.790, 0.204], [0.792, 0.260], [0.794, 0.316], [0.796, 0.368],
    [0.798, 0.420]] },
  { id: 'fairmount', name: 'Fairmount Ave', w: 20, pts: [
    [0.898, 0.156], [0.900, 0.216], [0.902, 0.276], [0.904, 0.336], [0.906, 0.396]] },
  { id: 'euclid', name: 'Euclid Ave', w: 22, pts: [
    [0.948, 0.220], [0.950, 0.290], [0.952, 0.360], [0.952, 0.432], [0.950, 0.506],
    [0.946, 0.572]] },
  { id: 'texas_st', name: 'Texas St & Mission Center', w: 18, pts: [
    [0.660, 0.196], [0.652, 0.156], [0.640, 0.118], [0.624, 0.086]] },
  { id: 'laurel', name: 'Laurel St & Sixth', w: 20, pts: [
    [0.548, 0.416], [0.592, 0.396], [0.636, 0.376], [0.682, 0.356], [0.720, 0.342]] },
  { id: 'elprado', name: 'El Prado', w: 14, pts: [
    [0.664, 0.348], [0.694, 0.342], [0.724, 0.336], [0.750, 0.332]] },

  // — Downtown —
  { id: 'broadway', name: 'Broadway', w: 24, pts: [
    [0.532, 0.436], [0.566, 0.452], [0.600, 0.468], [0.634, 0.484], [0.668, 0.500],
    [0.700, 0.514]] },
  { id: 'market', name: 'Market St', w: 22, pts: [
    [0.548, 0.474], [0.582, 0.490], [0.616, 0.506], [0.650, 0.522], [0.684, 0.538]] },
  { id: 'india_kettner', name: 'India & Kettner', w: 18, pts: [
    [0.528, 0.398], [0.548, 0.432], [0.568, 0.466], [0.586, 0.498]] },
  { id: 'first_ave', name: '1st Avenue', w: 18, pts: [
    [0.552, 0.418], [0.572, 0.452], [0.592, 0.486], [0.610, 0.518]] },
  { id: 'tenth_ave', name: '10th & 11th Avenue', w: 18, pts: [
    [0.616, 0.454], [0.636, 0.488], [0.654, 0.520], [0.670, 0.548]] },

  // — south-east —
  { id: 'imperial', name: 'Imperial Ave', w: 22, pts: [
    [0.656, 0.540], [0.726, 0.548], [0.798, 0.556], [0.870, 0.564], [0.942, 0.572],
    [1.000, 0.578]] },
  { id: 'national_ave', name: 'National Ave & Main St', w: 22, pts: [
    [0.668, 0.570], [0.724, 0.604], [0.780, 0.640], [0.836, 0.678], [0.888, 0.716],
    [0.930, 0.748]] },
  { id: 'highland', name: 'Highland Ave', w: 20, pts: [
    [0.884, 0.704], [0.892, 0.764], [0.900, 0.824], [0.908, 0.882], [0.914, 0.936]] },
  { id: 'plaza_blvd', name: 'Plaza Blvd', w: 22, pts: [
    [0.846, 0.766], [0.902, 0.772], [0.958, 0.778], [1.000, 0.784]] },
  { id: 'division', name: 'Division St', w: 18, pts: [
    [0.782, 0.590], [0.846, 0.606], [0.908, 0.622], [0.968, 0.638]] },
  { id: 'market_creek', name: 'Market St east', w: 20, pts: [
    [0.700, 0.516], [0.774, 0.502], [0.848, 0.490], [0.922, 0.480], [0.992, 0.472]] },

  // — Coronado —
  { id: 'orange_ave', name: 'Orange Ave', w: 22, pts: [
    [0.462, 0.646], [0.486, 0.688], [0.508, 0.730], [0.528, 0.772], [0.542, 0.806]] },
  { id: 'fourth_st_cor', name: '3rd & 4th St', w: 20, pts: [
    [0.478, 0.690], [0.510, 0.712], [0.540, 0.732], [0.560, 0.746]] },
  { id: 'alameda', name: 'Alameda Blvd', w: 16, pts: [
    [0.492, 0.678], [0.516, 0.716], [0.536, 0.756], [0.550, 0.790]] },
];
