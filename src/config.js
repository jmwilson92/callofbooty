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

  // Old Town / Mission Valley approach, facing Downtown (south).
  SPAWN: { x: -20, z: 160 },
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
  FAR: 2000,

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
  // San Diego metro playspace. +X = east, -Z = north, -X = west (Pacific).
  SIZE: 1600, // metres, square, centred near Mission Valley
  CELL: 4, // heightfield + render mesh resolution in metres
  MAX_ELEVATION: 95,
  WATER_LEVEL: 0.0,

  // 4 octaves of simplex for coastal rolling + inland foothills
  NOISE_OCTAVES: 4,
  NOISE_BASE_FREQ: 0.0014,
  NOISE_LACUNARITY: 2.0,
  NOISE_PERSISTENCE: 0.5,

  // Soft rim so players cannot walk off the playable square; ocean is authored west.
  FALLOFF_START: 0.88,
  FALLOFF_END: 0.99,
  BASE_LIFT: 6,
  EDGE_DEPTH: 18,

  // Pacific shoreline (west). Land is generally x > COAST_X with bays cut in.
  COAST_X: -520,
  COAST_BLEND: 90,

  // Mission Bay lagoon (inland water cut) — keep clear of the east-shore POI pad
  MISSION_BAY: { x: -320, z: 20, rx: 140, rz: 100, depth: 4.5 },
  // San Diego Bay water (southwest of downtown; does not cover the city pad)
  SD_BAY: { x: -320, z: 480, rx: 170, rz: 130, depth: 6.0 },

  // Mission Trails / eastern hills boost
  EAST_HILLS: { x: 480, z: -60, radius: 280, peak: 88 },

  FOG_NEAR: 450,
  FOG_FAR: 1100,
  SKY_COLOR: 0x8eb8d4,

  // Afternoon sun over the Pacific (west-southwest)
  SUN_ELEVATION_DEG: 38,
  SUN_AZIMUTH_DEG: 240,
  SUN_INTENSITY: 2.35,
  SUN_COLOR: 0xffe4b8,
  AMBIENT_SKY: 0x9ab8d0,
  AMBIENT_GROUND: 0x6a5f4a,
  AMBIENT_INTENSITY: 0.78,

  SHADOW_MAP_SIZE: 2048,
  SHADOW_BOX: 120,
};

// Terrain vertex colouring by height and slope — SoCal coastal palette.
export const TERRAIN_COLORS = {
  SAND: 0xd4c4a0,
  GRASS: 0x6b8a45,
  DRY_GRASS: 0xa09058,
  DIRT: 0x7a6348,
  ROCK: 0x8c8a85,
  ROCK_DARK: 0x5d5b58,
  SNOW: 0xe8ecf0, // unused at SD elevations; kept for blend safety
  ASPHALT: 0x3a3b3e,

  SAND_MAX: 3.5,
  GRASS_MAX: 48,
  ROCK_MIN_SLOPE_DEG: 32,
  ROCK_DARK_SLOPE_DEG: 46,
  SNOW_MIN: 120,
  NOISE_VARIATION: 0.035,
};

// San Diego battle-royale POIs, laid out from map.png (Google Maps screenshot).
// Coord frame: +X east, -Z north, -X west (Pacific). Origin ≈ Mission Valley.
// `flatten` carves a level pad so buildings never float or sink.
export const POIS = [
  {
    id: 'lajolla', name: 'La Jolla',
    x: -480, z: -400, radius: 95, flatten: 22.0, loot: 'high',
    note: 'NW coastal cliffs — Village of La Jolla / Shores',
  },
  {
    id: 'university', name: 'University City',
    x: 50, z: -360, radius: 100, flatten: 38.0, loot: 'medium',
    note: 'North campus / UTC corridor',
  },
  {
    id: 'miramar', name: 'Miramar Ridge',
    x: 300, z: -400, radius: 85, flatten: null, loot: 'medium',
    note: 'High ground north — air station ridge silhouette',
  },
  {
    id: 'missiontrails', name: 'Mission Trails',
    x: 500, z: -40, radius: 115, flatten: null, loot: 'medium',
    note: 'East hills / regional park rocky terrain',
  },
  {
    id: 'missionbay', name: 'Mission Bay',
    // Shore pad on the east bank of the lagoon (not in the water).
    x: -140, z: 60, radius: 85, flatten: 6.0, loot: 'medium',
    note: 'Bay parks, beach strip, recreational cover',
  },
  {
    id: 'oldtown', name: 'Old Town',
    x: -50, z: 170, radius: 90, flatten: 12.0, loot: 'high',
    note: 'I-5 / I-8 interchange approach',
  },
  {
    id: 'balboa', name: 'Balboa Park',
    x: 130, z: 280, radius: 100, flatten: 18.0, loot: 'high',
    note: 'Park + museum blocks mid-south',
  },
  {
    id: 'downtown', name: 'Downtown',
    x: 80, z: 400, radius: 140, flatten: 10.0, loot: 'highest',
    note: 'Dense city — highest loot, vertical play',
  },
  {
    id: 'airport', name: 'Lindbergh Field',
    x: -160, z: 340, radius: 100, flatten: 7.0, loot: 'medium',
    note: 'SAN airport / bay flats — hangars + open sightlines',
  },
];

// Freeway-inspired corridors between POIs (I-5, I-8, I-15, I-805, SR-52/163).
export const ROAD_LINKS = [
  ['lajolla', 'missionbay'],       // coastal I-5
  ['missionbay', 'oldtown'],       // I-5 south
  ['oldtown', 'downtown'],         // into the city
  ['oldtown', 'airport'],          // Harbor Dr / bay
  ['airport', 'downtown'],         // waterfront
  ['downtown', 'balboa'],          // SR-163 / park
  ['balboa', 'university'],        // 163 north corridor
  ['oldtown', 'university'],       // mid-city north
  ['university', 'miramar'],       // SR-52 / 15
  ['miramar', 'missiontrails'],    // I-15 east hills
  ['missiontrails', 'balboa'],     // I-8 / east approach
  ['missiontrails', 'downtown'],   // long east-west artery
  ['lajolla', 'university'],       // SR-52 west
];

export const ROADS = {
  WIDTH: 10, // arterial / freeway feel
  BLEND: 14,
  RAISE: 0.12,
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
  COUNT: 400,
  MIN_SPACING: 6, // Poisson-disc minimum distance
  POI_BIAS: 0.35, // scatter weight inside POI footprints
  TYPES: {
    ROCK:      { color: 0x6e6c68, min: [1.0, 0.7, 1.0], max: [2.8, 2.2, 2.8] },
    CRATE:     { color: 0x8e7a5a, min: [1.0, 1.0, 1.0], max: [1.6, 1.6, 1.6] },
    LOW_WALL:  { color: 0x87857f, min: [3.0, 1.1, 0.5], max: [6.0, 1.4, 0.7] },
    CONTAINER: { color: 0x4a6b7a, min: [6.06, 2.59, 2.44], max: [6.06, 2.59, 2.44] },
    VEHICLE:   { color: 0x5c6166, min: [4.6, 1.45, 1.8], max: [5.7, 1.9, 2.0] },
  },
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
