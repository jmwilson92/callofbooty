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

  // A street on The Grid's pad, looking into the city.
  SPAWN: { x: 6, z: -25 },
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
  BOB_FREQ_SCALE: 1.15, // cycles per meter travelled
  BOB_ADS_MULT: 0.3,
  STRAFE_ROLL_DEG: 0.6,
  ROLL_BLEND: 9.0,
};

export const WORLD = {
  SEED: 1337,
  SIZE: 1200, // metres, square, centred on origin
  CELL: 3, // heightfield + render mesh resolution in metres
  MAX_ELEVATION: 60,
  WATER_LEVEL: 0.0,

  // 4 octaves of simplex, per spec
  NOISE_OCTAVES: 4,
  NOISE_BASE_FREQ: 0.0016,
  NOISE_LACUNARITY: 2.0,
  NOISE_PERSISTENCE: 0.5,

  // Radial falloff -- edges drop into water so players cannot walk off the map
  FALLOFF_START: 0.62, // fraction of half-size where falloff begins
  FALLOFF_END: 0.97,
  BASE_LIFT: 7, // keeps the island interior comfortably above the waterline
  EDGE_DEPTH: 14, // how far below sea level the map rim sinks

  FOG_NEAR: 400,
  FOG_FAR: 900,
  SKY_COLOR: 0x9ab6cc,

  SUN_ELEVATION_DEG: 42,
  SUN_AZIMUTH_DEG: 215,
  SUN_INTENSITY: 2.2,
  SUN_COLOR: 0xffe8c4,
  AMBIENT_SKY: 0x8fa6be,
  AMBIENT_GROUND: 0x5a5344,
  AMBIENT_INTENSITY: 0.75,

  SHADOW_MAP_SIZE: 2048,
  SHADOW_BOX: 120, // shadow camera fitted to this box around the player
};

// Terrain vertex colouring by height and slope.
export const TERRAIN_COLORS = {
  SAND: 0xc2b49a,
  GRASS: 0x6b7f43,
  DRY_GRASS: 0x8a8b52,
  DIRT: 0x6e5a42,
  ROCK: 0x8c8a85,
  ROCK_DARK: 0x5d5b58,
  SNOW: 0xe8ecf0,
  ASPHALT: 0x3a3b3e,

  SAND_MAX: 2.5,
  GRASS_MAX: 34,
  ROCK_MIN_SLOPE_DEG: 34,
  ROCK_DARK_SLOPE_DEG: 48,
  SNOW_MIN: 46,
  // +/- brightness jitter so large flat areas are not a solid fill
  NOISE_VARIATION: 0.06,
};

// Seven hand-placed points of interest. Coordinates are (x, z) in metres.
// `flatten` carves a level pad so buildings never float or sink.
export const POIS = [
  { id: 'harbor',   name: 'Harbor',      x: -400, z:  430, radius: 105, flatten: 4.0,  loot: 'high' },
  { id: 'radiohill',name: 'Radio Hill',  x:  330, z: -400, radius:  80, flatten: null, loot: 'medium' },
  { id: 'grid',     name: 'The Grid',    x:   40, z:   30, radius: 130, flatten: 26.0, loot: 'highest' },
  { id: 'quarry',   name: 'Quarry',      x: -380, z: -330, radius: 100, flatten: 18.0, loot: 'medium' },
  { id: 'farm',     name: 'Farmstead',   x:  420, z:  260, radius:  95, flatten: 20.0, loot: 'medium' },
  { id: 'substation',name:'Substation',  x: -120, z: -450, radius:  75, flatten: 24.0, loot: 'low-medium' },
  { id: 'trailers', name: 'Trailer Row', x:  430, z:  520, radius:  85, flatten: 12.0, loot: 'low' },
];

export const ROADS = {
  WIDTH: 8,
  BLEND: 12, // metres of smoothstep back to natural terrain either side
  RAISE: 0.12, // road mesh sits above flattened terrain to avoid z-fighting
};

export const BUILDINGS = {
  FLOOR_HEIGHT: 3.4,
  GROUND_FLOOR_HEIGHT: 4.2,
  WALL_THICKNESS: 0.25,
  SLAB_THICKNESS: 0.3,
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
  },
};
