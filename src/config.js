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

  // Downtown core on dry land (east of the bay).
  SPAWN: { x: 140, z: 350 },
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

// Exterior ladder / fire-escape climb (W = up, S = down while in volume).
export const LADDER = {
  SPEED: 3.6,
  // Snap horizontal velocity while climbing so you stick to the rails
  STICK: 0.88,
  // How far off-ladder center the player may drift before auto-centering
  CENTER_PULL: 6.0,
};

/** Roof rappel / zipline — floor-by-floor climb + optional express to roof. */
export const RAPPEL = {
  // Vertical ropes on tall facades
  MAX_COUNT: 28,
  MIN_FLOORS: 5,
  FACADE_OUT: 0.55,
  // Fallback floor spacing when building has no floorYs
  FLOOR_HEIGHT: 3.5,
  // Speed between floors (m/s)
  FLOOR_SPEED: 14,
  // Express zip speed (m/s) along the full cable
  ZIP_SPEED: 34,
  // After reaching rope top, scoot onto roof deck (m/s)
  SCOOT_SPEED: 14,
  // Horizontal building-to-building lines
  HORIZONTAL_COUNT: 8,
  HORIZONTAL_MIN_DIST: 14,
  HORIZONTAL_MAX_DIST: 48,
  HORIZONTAL_MIN_FLOORS: 6,
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
  NEAR: 0.05,
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

  // San Diego Bay — stays west of the downtown plate (do not flood the city).
  SD_BAY: { x: -280, z: 420, rx: 170, rz: 240, depth: 8.0 },

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
  FOG_NEAR: 1100,
  FOG_FAR: 2600,
  SKY_COLOR: 0xa8c8dc,

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
    x: -120, z: 100, loot: 'medium',
    note: 'SAN hangars on dry apron north of the bay',
  },
  {
    id: 'mcrd', name: 'MCRD Depot',
    x: 30, z: 180, loot: 'high',
    note: 'Barracks grid east of the airport',
  },
  {
    id: 'downtown', name: 'Downtown',
    // Solid mesa plate east of the bay — full skyline grid stays dry
    x: 140, z: 360, loot: 'highest',
    note: 'Bayfront skyline on land (downtown.png)',
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

// Freeways routed through current POI anchors (dry land). Continuous corridors.
export const FREEWAYS = [
  // I-5-ish: La Jolla → airport → west of downtown core → south
  {
    id: 'i5', width: 16,
    pts: [
      [-480, -620], [-480, -480], [-360, -200], [-200, 40],
      [-120, 100], [20, 200], [40, 300], [30, 420], [40, 560],
    ],
  },
  // I-8-ish: west → Mission Valley → east foothills (north of downtown)
  {
    id: 'i8', width: 16,
    pts: [
      [-500, 30], [-280, 40], [-20, 40], [140, 50],
      [300, 40], [480, 20], [640, 0],
    ],
  },
  // I-15-ish: Kearny Mesa → valley → east of downtown → south
  {
    id: 'i15', width: 14,
    pts: [
      [140, -500], [140, -380], [100, -160], [60, 40],
      [100, 200], [200, 280], [260, 360], [280, 460], [260, 560],
    ],
  },
  // I-805-ish: north mesa → west edge of city core → south (skirts downtown)
  {
    id: 'i805', width: 14,
    pts: [
      [40, -520], [60, -300], [20, -80], [0, 40],
      [20, 180], [50, 280], [60, 360], [80, 460], [100, 540],
    ],
  },
  // SR-52: La Jolla → Kearny → east
  {
    id: 'sr52', width: 12,
    pts: [
      [-480, -480], [-280, -420], [0, -400], [140, -380],
      [320, -300], [500, -200], [640, -80],
    ],
  },
  // SR-163: Kearny → Balboa → approaches downtown from north (stops at ring)
  {
    id: 'sr163', width: 12,
    pts: [
      [140, -380], [160, -200], [180, 40], [200, 180],
      [210, 260], [180, 300], [140, 320],
    ],
  },
  // Harbor / bay frontage: Point Loma → airport → south of downtown → Coronado
  {
    id: 'harbor', width: 12,
    pts: [
      [-420, 400], [-300, 280], [-160, 160], [-80, 200],
      [20, 300], [40, 380], [60, 460], [20, 500], [-80, 520], [-200, 520],
    ],
  },
];

export const ROADS = {
  WIDTH: 12,
  BLEND: 12,
  RAISE: 0.12, // crown height at road centerline (metres)
  FREEWAY_BLEND: 14,
  MIN_HEIGHT: 2.5, // never flatten road below this (stay out of water)
};

// Downtown city plate — keep the skyline district roughly level.
// Soft blend at the rim so freeways/terrain still connect naturally.
// Structures skip residual dips (see Catalog.footprintOk).
export const DOWNTOWN_PLATE = {
  // Matches POI downtown anchor; half-extents cover grid + ring + fringe lots
  cx: 140,
  cz: 360,
  halfW: 185,
  halfD: 165,
  blend: 55,       // metres of soft falloff outside the hard plate
  // Target height: null = sample median of dry land in the core
  targetY: null,
  minDry: 4.0,
  // After leveling, tiny noise only (metres peak) — streets stay walkable
  microAmp: 0.35,
  // Max height range under a building footprint before we refuse placement
  maxFootprintDelta: 1.25,
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
  STAIR_WIDTH: 1.55, // clear tread width (uniform); capsule r=0.4 needs ≥1.3
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
    // C only — do NOT bind Ctrl (Ctrl+W closes the browser tab).
    crouch: ['KeyC'],
    interact: ['KeyE'], // doors, loot, vehicles, elevators
    reload: ['KeyR'],
    weapon1: ['Digit1'],
    weapon2: ['Digit2'],
    quickSwap: ['KeyQ'],
    inventory: ['Tab'],
    testRange: ['KeyP'],
    debug: ['F3'],
    map: ['KeyM'],
  },
};

/** Rideable vehicles for faster map travel. */
export const VEHICLES = {
  ENTER_RANGE: 3.4,
  // Third-person chase cam while riding
  CAM_MOTO_DIST: 7.5,
  CAM_MOTO_HEIGHT: 2.4,
  CAM_HELI_DIST: 16,
  CAM_HELI_HEIGHT: 5.5,
  CAM_LOOK_Y: 1.15,
  MOTORCYCLE: {
    count: 18,
    speed: 22,
    accel: 28,
    brake: 35,
    turnRate: 2.4, // rad/s when steering
    seatY: 0.85,
    eyeY: 1.35,
  },
  HELICOPTER: {
    // Prefer rooftop pads on tall buildings (1–2 guaranteed + optional ground)
    count: 2,
    rooftopOnly: true,
    minFloors: 10,
    speed: 38,
    accel: 18,
    climb: 14,
    seatY: 1.1,
    eyeY: 1.55,
    minAGL: 2.5, // min altitude above ground/roof
    maxY: 220,
    halfW: 3.6,
    halfH: 1.6,
    halfD: 4.2,
    // Bail-out crash: unmanned heli falls unless someone remounts (takes over)
    crashGravity: 26,
    crashMaxFall: 55,
    crashBailHeight: 4.5, // AGL above this → crash; lower just lands
    // 8 pods per side; each LMB fires L+R together (8 dual volleys)
    rocketsPerSide: 8,
    rocketSpeed: 88,
    rocketDamage: 90,
    rocketSplash: 5.5,
    rocketCooldown: 0.4,
    // Guided missiles — steer toward look lock (bots / buildings / ground)
    rocketTurnRate: 3.4, // rad/s seek rate
    rocketLockRange: 260,
    rocketLockConeDeg: 14, // soft lock cone around reticle
    rocketGuideDelay: 0.08, // s before seek engages
  },
};

// ===================== COMBAT =====================
export const COMBAT = {
  BASE_HEALTH: 100,
  RECOIL_RECOVERY_DELAY: 0.18, // s after last shot before aim offset recovers
  RECOIL_RECOVERY_RATE: 10, // deg/s
  SPREAD_RECOVER: 4.2, // bloom decay deg/s (ADS faster via ads mult in code)
  HITMARKER_TIME: 0.12,
  DAMAGE_NUM_LIFE: 0.7,
  TRACER_LIFE: 0.06,
  PENETRATION_LOSS: 0.35, // per thin surface
  PENETRATION_MAX: 2,
  PICKUP_RANGE: 2.8,
  GROUND_LOOT_RANGE: 3.0,
};

/**
 * World bots — wander, enter building approaches, sometimes engage the player.
 * TTK vs 100 HP: SMG CQC ~0.35s, AR mid ~0.4s, sniper head 1-shot / body 2.
 */
export const BOTS = {
  COUNT: 52,
  HEALTH: 100,
  SPEED: 2.7,
  SPEED_JITTER: 0.7,
  // Spawn ring around player SPAWN (metres)
  SPAWN_MIN: 18,
  SPAWN_MAX: 220,
  WANDER_RADIUS: 90,
  WAYPOINT_REACH: 1.4,
  WAYPOINT_PAUSE: 0.35,
  RESPAWN_TIME: 8,
  // Building approaches
  BUILDING_WAYPOINT_CHANCE: 0.42,
  // Combat
  AGGRO_RANGE: 58,
  LOSE_RANGE: 78,
  FIRE_RANGE: 52,
  FIRE_COOLDOWN: 0.14,
  FIRE_DAMAGE: 9,
  FIRE_SPREAD_DEG: 4.5,
  AGGRESSIVE_FRACTION: 0.55, // fraction that will shoot when they see you
  REACTION_TIME: 0.35,
  // Camo / kit palette
  COLORS: [0x3d5234, 0x2c3d52, 0x4a3c2e, 0x3a3a3e, 0x4a5240, 0x2a3830, 0x3a4540, 0x2e3540],
  RADIUS: 0.35,
  HEIGHT: 1.8,
};

// Rarity multipliers (Phase 3)
export const RARITY = {
  common:    { id: 'common',    color: 0x9a9a9a, label: 'Common',    dmg: 1.00, reload: 1.00, ads: 1.00, mag: 1.00, weight: 40 },
  uncommon:  { id: 'uncommon',  color: 0x4caf50, label: 'Uncommon',  dmg: 1.05, reload: 0.95, ads: 0.95, mag: 1.00, weight: 28 },
  rare:      { id: 'rare',      color: 0x2196f3, label: 'Rare',      dmg: 1.10, reload: 0.90, ads: 0.90, mag: 1.20, weight: 18 },
  epic:      { id: 'epic',      color: 0x9c27b0, label: 'Epic',      dmg: 1.15, reload: 0.85, ads: 0.85, mag: 1.20, weight: 10 },
  legendary: { id: 'legendary', color: 0xffc107, label: 'Legendary', dmg: 1.20, reload: 0.80, ads: 0.80, mag: 1.35, weight: 4 },
};

export const AMMO = {
  light: { id: 'light', label: 'Light', stack: 180 },
  heavy: { id: 'heavy', label: 'Heavy', stack: 120 },
  long:  { id: 'long',  label: 'Long',  stack: 30 },
  shell: { id: 'shell', label: 'Shell', stack: 40 },
};

export const ARMOR = {
  LEVELS: { 1: 50, 2: 100, 3: 150 },
  PLATE_RESTORE: 50,
  PLATE_TIME: 2.0,
  MAX_CARRIED_PLATES: 3,
};

export const HEALING = {
  bandage: { heal: 25, time: 3.0, cap: 75 },
  medkit:  { heal: 100, time: 6.5, cap: 100, noMove: true },
  stim:    { heal: 20, time: 1.5, overTime: 3.0, speedMult: 1.25, speedDur: 6.0 },
};

/**
 * Weapons are data. One generic WeaponSystem reads these entries.
 * recoilPattern: [hDeg, vDeg] per shot. adsRecoilMult scales pattern when ADS.
 * spreadHip/Ads in degrees. bloom (spreadPerShot) is extra, recovers to 0.
 * effectiveRange + rangeScatterDeg: past effectiveRange, cone grows (deg/100m).
 * falloff: damage mult by path distance. TTK @ 100 HP: SMG CQC best, sniper long.
 */
export const WEAPONS = {
  vector7: {
    id: 'vector7', name: 'Vector-7', class: 'ar', fireMode: 'auto',
    ammo: 'heavy', rpm: 700, magSize: 30,
    reloadTime: 2.3, reloadTimeEmpty: 2.9, adsTime: 0.28, swapTime: 0.45,
    // Mid-range king — solid to ~120 m ADS, loses to sniper past that
    damage: 24, headMult: 1.6, limbMult: 0.88,
    falloffStart: 45, falloffEnd: 130, falloffMinMult: 0.62,
    muzzleVelocity: 740, dropScale: 0.5, pellets: 1,
    effectiveRange: 95, rangeScatterDeg: 0.55,
    spreadHip: 4.8, spreadAds: 0.11, spreadMove: 1.5, spreadMax: 8.5, spreadPerShot: 0.32,
    adsRecoilMult: 0.42,
    recoilPattern: [
      [0, 0.62], [0.03, 0.65], [-0.03, 0.68], [0.04, 0.7], [-0.04, 0.72],
      [-0.22, 0.65], [-0.32, 0.62], [-0.4, 0.58], [-0.36, 0.55], [-0.25, 0.52],
      [-0.1, 0.55], [0.14, 0.58], [0.48, 0.62], [0.42, 0.55], [0.28, 0.52],
      [0.16, 0.5], [-0.12, 0.52], [0.24, 0.55], [-0.28, 0.5], [0.2, 0.48],
      [-0.18, 0.48], [0.25, 0.5], [-0.22, 0.48], [0.12, 0.46], [-0.14, 0.47],
      [0.18, 0.48], [-0.2, 0.46], [0.1, 0.45], [-0.12, 0.45], [0.14, 0.44],
    ],
    color: 0x4a6a4a, viewModel: { len: 0.55, thick: 0.06 },
  },
  kestrel: {
    id: 'kestrel', name: 'Kestrel', class: 'ar', fireMode: 'auto',
    ammo: 'heavy', rpm: 780, magSize: 25,
    reloadTime: 2.1, reloadTimeEmpty: 2.7, adsTime: 0.26, swapTime: 0.42,
    damage: 22, headMult: 1.55, limbMult: 0.88,
    falloffStart: 40, falloffEnd: 115, falloffMinMult: 0.6,
    muzzleVelocity: 720, dropScale: 0.52, pellets: 1,
    effectiveRange: 85, rangeScatterDeg: 0.65,
    spreadHip: 5.0, spreadAds: 0.14, spreadMove: 1.6, spreadMax: 9.0, spreadPerShot: 0.34,
    adsRecoilMult: 0.4,
    recoilPattern: [
      [0, 0.55], [0.06, 0.58], [-0.05, 0.6], [0.1, 0.56], [-0.12, 0.54],
      [0.18, 0.52], [0.26, 0.5], [0.22, 0.48], [-0.14, 0.5], [-0.28, 0.52],
      [-0.22, 0.48], [0.12, 0.48], [0.32, 0.5], [0.18, 0.46], [-0.2, 0.48],
      [0.14, 0.45], [-0.16, 0.46], [0.22, 0.48], [-0.1, 0.44], [0.16, 0.45],
      [-0.14, 0.44], [0.18, 0.45], [-0.22, 0.43], [0.12, 0.43], [-0.12, 0.43],
    ],
    color: 0x5a6a8a, viewModel: { len: 0.52, thick: 0.055 },
  },
  pike: {
    id: 'pike', name: 'Pike SMG', class: 'smg', fireMode: 'auto',
    ammo: 'light', rpm: 950, magSize: 32,
    reloadTime: 1.85, reloadTimeEmpty: 2.35, adsTime: 0.18, swapTime: 0.32,
    // CQC shredder — hipfire strong close; past ~30 m sprays / falls off hard
    damage: 18, headMult: 1.4, limbMult: 0.92,
    falloffStart: 10, falloffEnd: 38, falloffMinMult: 0.22,
    muzzleVelocity: 360, dropScale: 1.25, pellets: 1,
    effectiveRange: 22, rangeScatterDeg: 4.8, // past 22 m ADS still walks off target
    spreadHip: 1.9, spreadAds: 0.55, spreadMove: 0.55, spreadMax: 7.5, spreadPerShot: 0.42,
    adsRecoilMult: 0.55, // still bouncy ADS — SMG recoil character
    recoilPattern: [
      [0, 0.55], [0.14, 0.62], [-0.18, 0.68], [0.22, 0.65], [-0.28, 0.7],
      [0.32, 0.68], [-0.3, 0.72], [0.26, 0.7], [-0.35, 0.75], [0.3, 0.72],
      [-0.28, 0.7], [0.34, 0.74], [-0.32, 0.76], [0.2, 0.7], [-0.24, 0.72],
      [0.28, 0.74], [-0.3, 0.72], [0.18, 0.68], [-0.22, 0.7], [0.26, 0.72],
      [-0.24, 0.7], [0.2, 0.68], [-0.28, 0.72], [0.22, 0.68], [-0.18, 0.66],
      [0.2, 0.68], [-0.22, 0.66], [0.16, 0.64], [-0.2, 0.66], [0.18, 0.64],
      [-0.16, 0.62], [0.14, 0.62],
    ],
    color: 0x6a5a4a, viewModel: { len: 0.42, thick: 0.05 },
  },
  warden: {
    id: 'warden', name: 'Warden', class: 'lmg', fireMode: 'auto',
    ammo: 'heavy', rpm: 520, magSize: 75,
    reloadTime: 4.4, reloadTimeEmpty: 5.2, adsTime: 0.42, swapTime: 0.7,
    // Sustained mid-long — slower RoF, hits out further than AR slightly
    damage: 29, headMult: 1.45, limbMult: 0.88,
    falloffStart: 55, falloffEnd: 160, falloffMinMult: 0.66,
    muzzleVelocity: 700, dropScale: 0.65, pellets: 1,
    effectiveRange: 110, rangeScatterDeg: 0.7,
    spreadHip: 6.2, spreadAds: 0.26, spreadMove: 2.2, spreadMax: 10.0, spreadPerShot: 0.2,
    adsRecoilMult: 0.48,
    recoilPattern: [
      [0, 0.78], [0.05, 0.82], [-0.06, 0.85], [0.1, 0.8], [-0.12, 0.78],
      [0.18, 0.74], [0.26, 0.7], [0.32, 0.68], [0.28, 0.64], [0.16, 0.62],
      [-0.12, 0.64], [-0.28, 0.68], [-0.34, 0.65], [-0.22, 0.62], [0.12, 0.63],
      [0.28, 0.66], [0.2, 0.6], [-0.16, 0.62], [0.14, 0.58], [-0.22, 0.6],
    ],
    color: 0x3a3a3a, viewModel: { len: 0.62, thick: 0.08 },
  },
  longshot: {
    id: 'longshot', name: 'Longshot', class: 'sniper', fireMode: 'bolt',
    ammo: 'long', rpm: 42, magSize: 5,
    reloadTime: 3.1, reloadTimeEmpty: 3.6, adsTime: 0.48, swapTime: 0.72,
    // Laser ADS long-range; hipfire nearly unusable. Head = delete, body = 2 taps.
    damage: 92, headMult: 2.25, limbMult: 0.72,
    falloffStart: 220, falloffEnd: 450, falloffMinMult: 0.9,
    muzzleVelocity: 860, dropScale: 2.2, pellets: 1,
    effectiveRange: 320, rangeScatterDeg: 0.08,
    spreadHip: 14.0, spreadAds: 0.018, spreadMove: 4.5, spreadMax: 16.0, spreadPerShot: 0.9,
    adsRecoilMult: 0.55,
    recoilPattern: [[0, 3.2], [0.18, 2.9], [-0.14, 2.7], [0.22, 2.6], [-0.18, 2.5]],
    color: 0x2a3a4a, viewModel: { len: 0.72, thick: 0.05 },
    scopeZoomFov: 14, scopeOverlay: true, hideViewOnAds: true,
  },
  marksman: {
    id: 'marksman', name: 'Marksman DM', class: 'dmr', fireMode: 'semi',
    ammo: 'heavy', rpm: 280, magSize: 15,
    reloadTime: 2.5, reloadTimeEmpty: 3.0, adsTime: 0.34, swapTime: 0.52,
    damage: 52, headMult: 2.0, limbMult: 0.82,
    falloffStart: 90, falloffEnd: 220, falloffMinMult: 0.74,
    muzzleVelocity: 780, dropScale: 1.75, pellets: 1,
    effectiveRange: 160, rangeScatterDeg: 0.28,
    spreadHip: 6.5, spreadAds: 0.05, spreadMove: 2.0, spreadMax: 10.0, spreadPerShot: 0.38,
    adsRecoilMult: 0.4,
    scopeZoomFov: 28, scopeOverlay: true, hideViewOnAds: true,
    recoilPattern: [
      [0, 1.2], [0.1, 1.15], [-0.12, 1.1], [0.14, 1.05], [-0.1, 1.0],
      [0.16, 0.98], [-0.14, 0.95], [0.12, 0.92], [-0.16, 0.94], [0.1, 0.9],
      [-0.12, 0.9], [0.14, 0.88], [-0.1, 0.86], [0.12, 0.86], [-0.12, 0.84],
    ],
    color: 0x4a5a3a, viewModel: { len: 0.6, thick: 0.05 },
  },
  breaker: {
    id: 'breaker', name: 'Breaker', class: 'shotgun', fireMode: 'pump',
    ammo: 'shell', rpm: 68, magSize: 6,
    reloadTime: 0.5, reloadTimeEmpty: 0.5, adsTime: 0.28, swapTime: 0.48,
    damage: 13, headMult: 1.35, limbMult: 1.0,
    falloffStart: 5, falloffEnd: 20, falloffMinMult: 0.1,
    muzzleVelocity: 330, dropScale: 1.5, pellets: 9,
    effectiveRange: 12, rangeScatterDeg: 2.5,
    spreadHip: 7.0, spreadAds: 3.8, spreadMove: 1.3, spreadMax: 11.0, spreadPerShot: 0.5,
    adsRecoilMult: 0.7,
    recoilPattern: [[0, 3.8], [0.35, 3.4], [-0.3, 3.2], [0.25, 3.0], [-0.32, 2.9], [0.18, 2.8]],
    color: 0x5a4030, viewModel: { len: 0.48, thick: 0.07 },
  },
  sidearm: {
    id: 'sidearm', name: 'Sidearm P9', class: 'pistol', fireMode: 'semi',
    ammo: 'light', rpm: 420, magSize: 15,
    reloadTime: 1.55, reloadTimeEmpty: 1.95, adsTime: 0.16, swapTime: 0.28,
    damage: 24, headMult: 1.75, limbMult: 0.88,
    falloffStart: 12, falloffEnd: 42, falloffMinMult: 0.3,
    muzzleVelocity: 370, dropScale: 1.15, pellets: 1,
    effectiveRange: 28, rangeScatterDeg: 1.8,
    spreadHip: 2.2, spreadAds: 0.16, spreadMove: 0.85, spreadMax: 5.0, spreadPerShot: 0.28,
    adsRecoilMult: 0.5,
    recoilPattern: [
      [0, 0.95], [0.12, 0.9], [-0.14, 0.85], [0.16, 0.82], [-0.12, 0.8],
      [0.14, 0.76], [-0.16, 0.74], [0.1, 0.72], [-0.12, 0.7], [0.12, 0.68],
      [-0.1, 0.68], [0.14, 0.66], [-0.12, 0.65], [0.1, 0.64], [-0.1, 0.64],
    ],
    color: 0x2a2a2a, viewModel: { len: 0.22, thick: 0.04 },
  },
};

export const LOOT = {
  // Relative class weights when an item spawns (cases + outdoor)
  CLASS_WEIGHTS: {
    weapon: 38,
    ammo: 36,
    armor: 12,
    heal: 14,
  },
  WEAPON_SPAWN_WEIGHTS: {
    // Longshot weighted high so snipers show up often in cases
    vector7: 10, kestrel: 9, pike: 12, warden: 5,
    longshot: 18, marksman: 11, breaker: 9, sidearm: 14,
  },
  AMMO_PICKUPS: {
    light: { amount: 30 },
    heavy: { amount: 24 },
    long:  { amount: 8 },
    shell: { amount: 8 },
  },
  // Outdoor free loot is intentionally sparse — cases are the main source
  OUTDOOR_SPAWN_CHANCE: 0.35,
  OUTDOOR_PER_POI: 6,
  OUTDOOR_DOWNTOWN_EXTRA: 8,
  OUTDOOR_SCATTER: 28,
};

/** Pelican / hard cases inside buildings — open for 3–4 random items. */
export const CASES = {
  // Chance a given floor gets a case (ground floors always get ≥1 if building registered)
  PER_FLOOR_CHANCE: 0.6,
  GUARANTEE_GROUND: true,
  MIN_ITEMS: 3,
  MAX_ITEMS: 4,
  MAX_PER_FLOOR: 1,
  MAX_PER_BUILDING: 5,
  /** Min distance between any two cases (metres) */
  MIN_SEPARATION: 3.0,
};

// Minimap (always-on square, top-left) + full map (toggle with M).
export const MAP = {
  MINIMAP_SIZE: 168, // CSS px, square
  MINIMAP_RANGE: 280, // metres of world visible on the minimap (edge to edge)
  FULL_MAP_MAX: 720, // max CSS px for the full-map square on large screens
  // Full map zoom (1 = whole world, higher = closer)
  ZOOM_MIN: 1,
  ZOOM_MAX: 14,
  ZOOM_DEFAULT: 1,
  ZOOM_WHEEL: 0.15,
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
