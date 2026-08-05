// All tunable gameplay numbers live here. Never hardcode a gameplay value in a
// system file -- if a system needs a number to feel right, it belongs in this file.

export const SIM = {
  TICK_RATE: 60,
  TICK_DT: 1 / 60,
  MAX_TICKS_PER_FRAME: 5, // spiral-of-death guard
};

export const PLAYER = {
  CAPSULE_RADIUS: 0.4,
  HEIGHT_STAND: 1.8,
  HEIGHT_CROUCH: 1.0,
  EYE_STAND: 1.65,
  EYE_CROUCH: 0.85,

  SPEED_WALK: 4.4,
  SPEED_SPRINT: 7.2,
  SPEED_CROUCH: 2.1,
  ADS_MOVE_MULT: 0.45,

  ACCEL_GROUND: 60,
  FRICTION_GROUND: 10,
  ACCEL_AIR: 12,
  AIR_CONTROL: 0.3,

  GRAVITY: -22,
  JUMP_IMPULSE: 6.2,

  MAX_STEP_HEIGHT: 0.45,
  MAX_SLOPE_DEG: 47,

  COYOTE_TIME: 0.12,
  JUMP_BUFFER: 0.15,

  // Crouch transition speed (m/s of capsule height change)
  CROUCH_LERP: 8.0,

  // Mission Valley pad, looking south toward Downtown / MCRD.
  SPAWN: { x: -20, z: 20 },
};

export const SLIDE = {
  SPEED_MULT: 1.35,
  SPEED_CAP: 10.5,
  FRICTION: 6.0,
  DURATION: 1.1,
  COOLDOWN: 0.9,
  CAMERA_HEIGHT: 0.75,
  CAMERA_ROLL_DEG: 4,
  CAMERA_BLEND: 0.1,
  // Downhill adds accel proportional to slope, uphill decays faster.
  SLOPE_ACCEL: 26,
  UPHILL_DECAY_MULT: 2.6,
  // Minimum speed before a slide gives out on its own
  MIN_SPEED: 2.6,
};

export const MANTLE = {
  MIN_HEIGHT: 0.5,
  MAX_HEIGHT: 1.6,
  DURATION: 0.35,
  REACH: 1.0,
  // Vertical clearance required above the ledge for the player to fit
  CLEARANCE: 1.9,
};

export const CAMERA = {
  FOV_BASE: 80,
  FOV_SPRINT: 88,
  FOV_UP_TIME: 0.18,
  FOV_DOWN_TIME: 0.12,
  SENSITIVITY: 0.0022, // rad per pixel
  PITCH_CLAMP_DEG: 88,
  // Eye node chases the capsule eye position; smooths step-ups.
  FOLLOW_RATE: 25,
  NEAR: 0.1,
  FAR: 2800,

  BOB_AMP_VERT: 0.035,
  BOB_AMP_HORIZ: 0.025,
  // Sway cycles per metre travelled. The vertical bob runs at twice this (one
  // dip per footfall), so at the 4.4 m/s walk speed this lands near 2.2 Hz --
  // roughly human footfall cadence. Anything much above ~3 Hz reads as the
  // screen vibrating rather than as walking.
  BOB_FREQ_SCALE: 0.25,
  BOB_MAX_INTENSITY: 1.2,
  BOB_ADS_MULT: 0.3,
  STRAFE_ROLL_DEG: 0.6,
  ROLL_BLEND: 9.0,
};

export const WORLD = {
  SEED: 1337,
  // Compressed San Diego metro from satellite + terrain reference maps.
  // +X = east, -Z = north, -X = west (Pacific). Origin ≈ Mission Valley / I-8 × I-805.
  SIZE: 1800,
  CELL: 4,
  MAX_ELEVATION: 185,
  WATER_LEVEL: 0.0,

  NOISE_OCTAVES: 5,
  NOISE_BASE_FREQ: 0.0012,
  NOISE_LACUNARITY: 2.05,
  NOISE_PERSISTENCE: 0.48,

  FALLOFF_START: 0.90,
  FALLOFF_END: 0.995,
  BASE_LIFT: 5,
  EDGE_DEPTH: 22,

  // Pacific coast baseline (west). Actual shoreline is noise-warped + Point Loma.
  COAST_X: -560,
  COAST_BLEND: 70,

  // Mission Bay — multi-lobe lagoon (satellite: round system west of I-5).
  MISSION_BAY_LOBES: [
    { x: -360, z: -20, rx: 150, rz: 120, depth: 5.0 }, // main basin
    { x: -420, z: 60, rx: 90, rz: 70, depth: 4.5 },   // west arm toward Mission Beach
    { x: -280, z: 70, rx: 70, rz: 55, depth: 4.0 },   // east finger toward Old Town
  ],

  // San Diego Bay — long N–S basin (satellite: between Point Loma/Coronado and mainland).
  SD_BAY: { x: -180, z: 380, rx: 200, rz: 260, depth: 8.0 },

  // Point Loma peninsula restored after bay cut (hook west of the bay).
  POINT_LOMA: { x: -420, z: 420, rx: 95, rz: 200, ridge: 38 },
  // Coronado island / spit across the bay.
  CORONADO: { x: -200, z: 520, rx: 110, rz: 55, height: 8 },

  // Foothills just west of the true mountain wall (Mission Trails–scale).
  EAST_HILLS: { x: 480, z: 20, radius: 280, peak: 95 },
  // Secondary ridge: Clairemont / Linda Vista mesas north of Mission Valley.
  NORTH_MESA: { x: -80, z: -220, radius: 260, peak: 52 },
  // Mission Valley trench (I-8 corridor) — low E–W slot through the middle.
  MISSION_VALLEY: { z: 90, halfWidth: 95, depth: 14 },

  // Far-eastern mountain system (stylized BR wall — not GIS-accurate).
  // N–S spine along the map's east edge with secondary ridges + high peaks.
  EAST_MOUNTAINS: {
    // Main spine runs north–south inside the eastern playable rim
    // (kept west of falloff so peaks aren't shaved by the map edge).
    spineX: 680,
    spineHalfWidth: 260,   // how far west the massif reaches
    foothillStart: 320,    // world X where foothills begin rising hard
    peakMax: 180,          // highest summit Y
    peakMin: 100,          // saddle / lower ridge Y
    // Named summit centers (x, z, peakY, radius)
    peaks: [
      { x: 640, z: -400, peak: 172, r: 170 }, // north massif
      { x: 700, z: -60, peak: 180, r: 190 },  // central high peak
      { x: 660, z: 240, peak: 162, r: 160 },  // south-central
      { x: 620, z: 500, peak: 150, r: 150 },  // southern shoulder
    ],
    // Secondary N–S ridges offset west of the spine (layered ranges)
    ridges: [
      { x: 520, z: -220, rx: 95, rz: 300, peak: 118 },
      { x: 560, z: 160, rx: 90, rz: 280, peak: 128 },
      { x: 500, z: 20, rx: 75, rz: 220, peak: 105 },
    ],
  },

  // Clearer air: push fog out so the playspace stays readable.
  FOG_NEAR: 900,
  FOG_FAR: 2200,
  SKY_COLOR: 0x9ec6de,

  // Brighter, cleaner late-afternoon light
  SUN_ELEVATION_DEG: 42,
  SUN_AZIMUTH_DEG: 245,
  SUN_INTENSITY: 2.85,
  SUN_COLOR: 0xffebd0,
  AMBIENT_SKY: 0xb0cce0,
  AMBIENT_GROUND: 0x7a6a50,
  AMBIENT_INTENSITY: 0.92,

  SHADOW_MAP_SIZE: 2048,
  SHADOW_BOX: 160,
};

// SoCal coastal + chaparral palette — higher contrast, less smear.
export const TERRAIN_COLORS = {
  SAND: 0xe0d0a8,
  GRASS: 0x5a8238,
  DRY_GRASS: 0xb09850,
  CHAPARRAL: 0x8f7540,
  DIRT: 0x7a6348,
  ROCK: 0x969490,
  ROCK_DARK: 0x555350,
  SNOW: 0xf0f4f8,
  ASPHALT: 0x343538,
  URBAN: 0x8a8c8e,

  // Tighter height bands = clearer biome read
  SAND_MAX: 2.8,
  GRASS_MAX: 32,
  CHAPARRAL_MIN: 45,
  ALPINE_MIN: 100,
  ROCK_MIN_SLOPE_DEG: 30,
  ROCK_DARK_SLOPE_DEG: 44,
  SNOW_MIN: 158,
  // Keep low — per-vertex noise is what made terrain look smeared.
  NOISE_VARIATION: 0.015,
};

// Playable POIs — anchors only (x,z). No flatten pads / footprints.
// Buildings seat on natural terrain height at their footprint.
// Coord frame: +X east, -Z north, -X west (Pacific). Origin ≈ Mission Valley.
export const POIS = [
  {
    id: 'lajolla', name: 'La Jolla',
    x: -480, z: -480, loot: 'high',
    note: 'NW coastal cliffs / village (on land)',
  },
  {
    id: 'kearnymesa', name: 'Kearny Mesa',
    x: 140, z: -380, loot: 'medium',
    note: 'North mesa industrial/commercial',
  },
  {
    id: 'missionvalley', name: 'Mission Valley',
    x: -20, z: 40, loot: 'high',
    note: 'I-8 corridor valley floor — spawn hub',
  },
  {
    id: 'airport', name: 'San Diego International Airport',
    x: -160, z: 200, loot: 'medium',
    note: 'SAN hangars on bay flats (dry apron)',
  },
  {
    id: 'mcrd', name: 'MCRD Depot',
    x: 40, z: 260, loot: 'high',
    note: 'Barracks grid east of the airport',
  },
  {
    id: 'downtown', name: 'Downtown',
    x: 60, z: 420, loot: 'highest',
    note: 'Bayfront skyline (downtown.png)',
  },
  {
    id: 'pointloma', name: 'Point Loma',
    x: -420, z: 400, loot: 'high',
    note: 'Peninsula ridge (on Point Loma land mass)',
  },
  {
    id: 'balboa', name: 'Balboa Park',
    x: 240, z: 320, loot: 'high',
    note: 'Park / museum area NE of downtown',
  },
  {
    id: 'zoo', name: 'San Diego Zoo',
    x: 360, z: 100, loot: 'high',
    note: 'Zoo grounds north of Balboa',
  },
  {
    id: 'coronado', name: 'Coronado',
    x: -200, z: 520, loot: 'high',
    note: 'Island land mass across San Diego Bay',
  },
  {
    id: 'radiotower', name: 'Radio Tower',
    x: 700, z: -60, loot: 'high',
    note: 'Summit outpost on eastern mountain spine',
  },
];

// Arterials between POIs.
export const ROAD_LINKS = [
  ['lajolla', 'kearnymesa'],
  ['lajolla', 'missionvalley'],
  ['lajolla', 'airport'],
  ['lajolla', 'pointloma'],
  ['kearnymesa', 'missionvalley'],
  ['missionvalley', 'airport'],
  ['missionvalley', 'downtown'],
  ['missionvalley', 'mcrd'],
  ['missionvalley', 'balboa'],
  ['airport', 'mcrd'],
  ['airport', 'downtown'],
  ['mcrd', 'downtown'],
  ['pointloma', 'airport'],
  ['pointloma', 'downtown'],
  ['pointloma', 'coronado'],
  ['kearnymesa', 'downtown'],
  ['kearnymesa', 'zoo'],
  ['downtown', 'balboa'],
  ['balboa', 'zoo'],
  ['balboa', 'missionvalley'],
  ['coronado', 'downtown'],
  ['coronado', 'airport'],
  ['radiotower', 'kearnymesa'],
  ['radiotower', 'missionvalley'],
  ['radiotower', 'balboa'],
  ['radiotower', 'zoo'],
];

// Multi-point freeways from the satellite map (world metres). Drawn as road corridors.
export const FREEWAYS = [
  // I-5 coastal spine (Torrey → La Jolla → Mission Bay → Downtown → south)
  {
    id: 'i5', width: 16,
    pts: [
      [-480, -700], [-500, -480], [-420, -280], [-340, -40],
      [-200, 120], [-80, 220], [10, 340], [40, 520], [30, 780],
    ],
  },
  // I-8 Mission Valley east–west
  {
    id: 'i8', width: 16,
    pts: [
      [-700, 70], [-420, 80], [-200, 95], [0, 100],
      [220, 90], [420, 70], [620, 50], [800, 40],
    ],
  },
  // I-15 inland north–south
  {
    id: 'i15', width: 14,
    pts: [
      [180, -700], [170, -460], [140, -200], [100, 40],
      [80, 220], [90, 400], [120, 600], [140, 800],
    ],
  },
  // I-805 parallel corridor
  {
    id: 'i805', width: 14,
    pts: [
      [-80, -700], [-90, -420], [-70, -180], [-20, 40],
      [40, 200], [70, 380], [100, 560], [120, 780],
    ],
  },
  // SR-52 east–west north city
  {
    id: 'sr52', width: 12,
    pts: [
      [-520, -380], [-300, -400], [-100, -420], [120, -440],
      [320, -420], [520, -380],
    ],
  },
  // SR-163 Balboa / downtown connector
  {
    id: 'sr163', width: 12,
    pts: [
      [-40, -500], [-20, -280], [20, -80], [60, 100],
      [90, 220], [40, 320],
    ],
  },
];

export const ROADS = {
  WIDTH: 10,
  BLEND: 14,
  RAISE: 0.12,
  FREEWAY_BLEND: 18,
};

export const BUILDINGS = {
  FLOOR_HEIGHT: 3.4,
  GROUND_FLOOR_HEIGHT: 4.2,
  WALL_THICKNESS: 0.25,
  SLAB_THICKNESS: 0.3,
  // A building seated on a flattened POI pad puts its ground floor at exactly
  // the terrain height, leaving two coplanar surfaces fighting for the same
  // depth -- which reads in-game as a blotchy, flickering ground floor. Lift
  // the ground slab clear of the terrain. Small enough to walk over without
  // noticing (well under MAX_STEP_HEIGHT), large enough to beat depth
  // precision at the ranges a building interior is ever visible from.
  GROUND_SLAB_LIFT: 0.08,
  DOOR_WIDTH: 1.4,
  DOOR_HEIGHT: 2.2,
  WINDOW_SILL: 0.9,
  WINDOW_HEIGHT: 1.3,
  STAIR_WIDTH: 1.4,
  STAIR_STEPS_PER_FLOOR: 14,
  // Stairs are a thick stringer rather than solid columns from the floor, so
  // the flight above leaves real head clearance over the flight below.
  STAIR_THICKNESS: 0.55,
  RAILING_HEIGHT: 1.05,
  PARAPET_HEIGHT: 1.0,

  PALETTE: [0x8a8880, 0x7a4a3c, 0x9a968c, 0x6b5943, 0x87857f, 0x8fa0a8],
  ROOF_COLOR: 0x4a4744,
  FLOOR_COLOR: 0x9c9a94,
};

export const PROPS = {
  COUNT: 350,
  MIN_SPACING: 7,
  POI_BIAS: 0.3,
  TYPES: {
    ROCK:      { color: 0x6e6c68, min: [1.0, 0.7, 1.0], max: [2.8, 2.2, 2.8] },
    CRATE:     { color: 0x8e7a5a, min: [1.0, 1.0, 1.0], max: [1.6, 1.6, 1.6] },
    LOW_WALL:  { color: 0x87857f, min: [3.0, 1.1, 0.5], max: [6.0, 1.4, 0.7] },
    CONTAINER: { color: 0x4a6b7a, min: [6.06, 2.59, 2.44], max: [6.06, 2.59, 2.44] },
    VEHICLE:   { color: 0x5c6166, min: [4.6, 1.45, 1.8], max: [5.7, 1.9, 2.0] },
  },
};

// World-detail structure scatter (procedural kits in world/structures/).
// Counts are targets; placement retries if terrain is bad.
export const STRUCTURES = {
  SUBURBAN: 110,
  TRAILER: 16,
  GAS: 20,
  RESTAURANT: 28,
  AUTO: 14,
  FIRE: 8,
  BUSINESS: 24,
  SKY: 8, // extra towers beyond the downtown district grid
  BOAT: 16,
  BILLBOARD: 20,
  VEHICLE: 70,
  ANIMALS: 36,
};

export const COLLISION = {
  CELL_SIZE: 8, // spatial hash cell, metres
  SOLVER_ITERATIONS: 3,
  GROUND_PROBE: 0.15, // downward capsule cast distance
  SKIN: 0.005, // depenetration slop so the capsule never rests exactly touching
  MAX_SUBSTEP: 0.25, // metres of travel per collision substep (anti-tunnelling)
};

export const INPUT = {
  KEYS: {
    forward: ['KeyW'],
    back: ['KeyS'],
    left: ['KeyA'],
    right: ['KeyD'],
    jump: ['Space'],
    sprint: ['ShiftLeft', 'ShiftRight'],
    crouch: ['KeyC', 'ControlLeft'],
    debug: ['F3'],
    map: ['KeyM'],
  },
};

// Minimap (always-on square, top-left) + full map (toggle with M).
export const MAP = {
  MINIMAP_SIZE: 168, // CSS px, square
  MINIMAP_RANGE: 280, // metres of world visible on the minimap (edge to edge)
  FULL_MAP_MAX: 720, // max CSS px for the full-map square on large screens
  // Baked height-color raster resolution (power of two-ish is fine)
  RASTER: 512,
  WATER: '#1a4a5c',
  SAND: '#c9b896',
  GRASS: '#5f7a3f',
  DRY: '#8f8750',
  ROCK: '#7a7874',
  ROAD: '#3a3b3e',
  POI: '#f0c14a',
  POI_TEXT: '#e8ecf0',
  PLAYER: '#7fd4ff',
  PLAYER_RING: 'rgba(127, 212, 255, 0.35)',
  BORDER: 'rgba(255, 255, 255, 0.18)',
  BG: 'rgba(8, 12, 16, 0.82)',
};
