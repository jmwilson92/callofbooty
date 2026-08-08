// The buildings you would actually name.
//
// A procedural fabric can produce a convincing city and cannot produce a
// recognisable one. It knows that downtown blocks carry towers; it does not
// know that the tallest is One America Plaza and that it stands beside the
// railway station, or that the convention centre is a 300 m slab on the
// waterfront with a tented roof, or that Balboa Park's museums line one
// pedestrian street rather than sitting on a grid. Those are the things that
// make a map read as San Diego rather than as a city, and every one of them has
// to be written down.
//
// Positions are in the same traced (u, v) as everything else, placed against
// the district outlines and the shoreline rather than converted from latitude
// and longitude — see the note at the top of SanDiegoDistricts.js for why that
// conversion does not exist on this frame. They are good to a couple of hundred
// metres, which at 17.6 km is close enough that the relationships read: the
// ballpark east of the towers, the convention centre between the towers and the
// water, the Hotel del at the ocean end of Orange Avenue.
//
// Heights are real. Those are worth being right about because they are what the
// skyline is made of, and they are published.

/**
 * A landmark is one or more boxes in its own local frame.
 *
 * `parts` are [dx, dy, w, d, h, base] in metres: offset east, offset south,
 * width, depth, height, and how far the box's underside sits above the
 * landmark's ground. `base` is optional and defaults to 0. It exists for the
 * things that are stacked rather than standing: a carrier's flight deck is
 * 19 m above the waterline and its island is above that again, and without a
 * base every one of those boxes starts at the water and the ship comes out as
 * a solid slab. Rotation is applied to the offsets, not to the box.
 *
 * A single box needs no parts; give w/d/h on the landmark itself.
 *
 * `clearM` is how far around it the procedural fabric is deleted. It defaults
 * to the footprint, but a stadium needs its car park cleared too, and a museum
 * on a park lawn needs nothing cleared at all.
 */
export const LANDMARKS = [
  // ── Downtown: the skyline ────────────────────────────────────────────────
  // Real heights. One America Plaza is the tallest building in the city at
  // 152 m — there is a hard cap here, because the airport approach runs
  // straight over downtown and nothing may be taller.
  {
    id: 'one_america_plaza',
    name: 'One America Plaza',
    u: 0.5775, v: 0.4525, rot: 9, kind: 'tower',
    parts: [
      [0, 0, 44, 44, 152],          // the tower
      [0, 34, 60, 26, 22],          // the station podium beside it
    ],
    clearM: 70,
  },
  {
    id: 'symphony_towers',
    name: 'Symphony Towers',
    u: 0.5960, v: 0.4700, rot: 9, kind: 'tower',
    w: 40, d: 40, h: 152, clearM: 60,
  },
  {
    id: 'emerald_plaza',
    name: 'Emerald Plaza',
    // Six green hexagonal shafts of different heights, stepped. Approximated
    // as four boxes because the silhouette is the recognisable part.
    u: 0.5820, v: 0.4600, rot: 9, kind: 'tower',
    parts: [
      [-14, -14, 22, 22, 136],
      [12, -10, 20, 20, 118],
      [-8, 14, 20, 20, 104],
      [16, 14, 18, 18, 88],
    ],
    clearM: 60,
  },
  {
    id: 'manchester_grand_hyatt',
    name: 'Manchester Grand Hyatt',
    // Twin towers on the water, the taller one 151 m.
    u: 0.5930, v: 0.4980, rot: 9, kind: 'tower',
    parts: [
      [-22, 0, 34, 34, 151],
      [24, 6, 30, 30, 122],
      [0, 34, 90, 34, 20],
    ],
    clearM: 80,
  },
  {
    id: 'electra',
    name: 'Electra',
    u: 0.5760, v: 0.4660, rot: 9, kind: 'tower', w: 32, d: 32, h: 145, clearM: 50,
  },
  {
    id: 'pinnacle_marina',
    name: 'Pinnacle on the Park',
    u: 0.6390, v: 0.5140, rot: 9, kind: 'tower', w: 34, d: 34, h: 137, clearM: 50,
  },
  {
    id: 'wyndham_bayside',
    name: 'Bayside towers',
    u: 0.5860, v: 0.4880, rot: 9, kind: 'tower', w: 30, d: 30, h: 130, clearM: 45,
  },

  // ── Downtown: the ground floor ───────────────────────────────────────────
  {
    id: 'santa_fe_depot',
    name: 'Santa Fe Depot',
    // Two domed towers and a long shed. The train hall runs away from the
    // street, which is why it is deeper than it is wide.
    u: 0.5710, v: 0.4560, rot: 9, kind: 'commercial',
    parts: [
      [0, 0, 58, 30, 18],
      [-22, -2, 12, 12, 26],
      [22, -2, 12, 12, 26],
      [0, 40, 40, 110, 12],         // the platforms
    ],
    clearM: 60,
  },
  {
    id: 'county_admin',
    name: 'County Administration Center',
    // A long neoclassical block on the waterfront with a central tower.
    u: 0.5500, v: 0.4450, rot: 26, kind: 'commercial',
    parts: [
      [0, 0, 130, 34, 26],
      [0, 0, 30, 30, 48],
    ],
    clearM: 70,
  },
  {
    id: 'convention_center',
    name: 'San Diego Convention Center',
    // The largest single footprint downtown: about 300 m along the water, with
    // the tented Sails Pavilion on the roof of the middle third.
    u: 0.6160, v: 0.5220, rot: 26, kind: 'commercial',
    parts: [
      [0, 0, 300, 96, 28],
      [0, -6, 110, 60, 42],         // Sails Pavilion
      [-130, 10, 56, 76, 22],
      [130, 10, 56, 76, 22],
    ],
    clearM: 120,
  },
  {
    id: 'petco_park',
    name: 'Petco Park',
    // The bowl, plus the Western Metal Supply building the left-field corner
    // was built around — which is the one detail that makes it this ballpark
    // and not a ballpark.
    u: 0.6470, v: 0.5140, rot: 9, kind: 'commercial',
    parts: [
      [0, 0, 190, 180, 8],          // the field platform
      [0, -74, 170, 34, 34],        // the main stand
      [-84, 6, 34, 130, 28],
      [84, 6, 34, 130, 26],
      [0, 82, 150, 26, 18],
      [-72, -60, 26, 26, 24],       // Western Metal Supply
    ],
    clearM: 130,
  },
  {
    id: 'horton_plaza',
    name: 'Horton Plaza',
    u: 0.6010, v: 0.4810, rot: 9, kind: 'commercial',
    parts: [[0, 0, 130, 110, 26]],
    clearM: 80,
  },
  {
    id: 'seaport_village',
    name: 'Seaport Village',
    // Low, scattered, timber. Reads as a gap in the wall of the waterfront.
    u: 0.5980, v: 0.5060, rot: 26, kind: 'commercial',
    parts: [
      [-40, -10, 40, 26, 9],
      [10, 4, 44, 24, 9],
      [56, -6, 32, 22, 8],
    ],
    clearM: 60,
  },
  {
    id: 'uss_midway',
    name: 'USS Midway Museum',
    // Moored at Navy Pier, so it sits off the shoreline on the water. The
    // flight deck overhangs the hull, which is most of the silhouette.
    u: 0.5640, v: 0.4700, rot: 30, kind: 'military', water: true,
    parts: [
      [0, 0, 300, 34, 18],              // hull, from the waterline up
      [0, 0, 300, 72, 4, 17],           // flight deck, wider than the hull
      [10, -26, 46, 16, 26, 21],        // island, on the deck
    ],
    clearM: 0,
  },
  {
    id: 'broadway_pier',
    name: 'Broadway Pier & cruise terminal',
    u: 0.5560, v: 0.4600, rot: 30, kind: 'commercial', water: true,
    parts: [[0, 0, 180, 34, 14]],
    clearM: 0,
  },

  // ── Balboa Park ──────────────────────────────────────────────────────────
  // The museums line El Prado, a single pedestrian street running east from the
  // Cabrillo Bridge. Laying them on a grid is exactly the mistake that makes a
  // generated park look like a business district with trees.
  {
    id: 'california_tower',
    name: 'California Tower & Museum of Us',
    u: 0.6690, v: 0.3480, rot: 4, kind: 'campus',
    parts: [
      [0, 0, 20, 20, 60],           // the tower
      [-4, 26, 54, 30, 22],         // the museum and the chapel dome
      [24, 6, 26, 26, 30],
    ],
    clearM: 0,
  },
  {
    id: 'el_prado_museums',
    name: 'El Prado',
    u: 0.6960, v: 0.3400, rot: 4, kind: 'campus',
    parts: [
      [-100, -26, 70, 30, 18],      // Museum of Art
      [-100, 30, 64, 28, 16],       // Timken
      [-20, -30, 76, 32, 20],       // Natural History
      [-20, 32, 80, 30, 18],        // Casa de Balboa
      [60, -28, 60, 28, 17],        // Fleet Science Center
      [64, 30, 66, 30, 16],         // Botanical Building
      [130, 0, 40, 40, 14],
    ],
    clearM: 0,
  },
  {
    id: 'spreckels_organ',
    name: 'Spreckels Organ Pavilion',
    u: 0.6940, v: 0.3760, rot: 4, kind: 'campus',
    parts: [[0, 0, 44, 22, 20], [0, 22, 70, 30, 3]],
    clearM: 0,
  },
  {
    id: 'san_diego_zoo',
    name: 'San Diego Zoo',
    // Enclosures and the aviaries, north of the museums across the canyon.
    u: 0.6900, v: 0.3020, rot: 4, kind: 'campus',
    parts: [
      [-70, -30, 46, 30, 12],
      [10, -50, 40, 34, 16],
      [70, -10, 36, 30, 22],        // the big aviary
      [-30, 46, 54, 30, 10],
      [60, 60, 40, 28, 11],
    ],
    clearM: 40,
  },
  {
    id: 'naval_medical',
    name: 'Naval Medical Center San Diego',
    // On the park's south-east shoulder, above Florida Canyon. Large, pink,
    // and impossible to miss from the freeway.
    u: 0.7280, v: 0.4020, rot: 6, kind: 'campus',
    parts: [
      [0, 0, 150, 60, 40],
      [-60, -50, 60, 40, 30],
      [70, 40, 70, 44, 26],
    ],
    clearM: 90,
  },

  // ── Mission Valley ───────────────────────────────────────────────────────
  {
    id: 'stadium',
    name: 'Snapdragon Stadium',
    // The bowl on the old Qualcomm site, ringed by the largest car park in the
    // county — which is a bigger landmark from the air than the stadium.
    u: 0.7060, v: 0.0640, rot: 352, kind: 'commercial',
    parts: [
      [0, 0, 190, 170, 10],
      [0, -80, 180, 34, 38],
      [0, 80, 180, 34, 34],
      [-88, 0, 34, 140, 32],
      [88, 0, 34, 140, 32],
    ],
    clearM: 320,
  },
  {
    id: 'fashion_valley',
    name: 'Fashion Valley',
    u: 0.4720, v: 0.1000, rot: 352, kind: 'commercial',
    parts: [
      [0, 0, 260, 130, 18],
      [-150, 20, 80, 90, 16],
      [150, -10, 90, 100, 16],
      [0, 110, 200, 60, 14],        // the parking structure
    ],
    clearM: 200,
  },
  {
    id: 'mission_valley_mall',
    name: 'Westfield Mission Valley',
    u: 0.5680, v: 0.0860, rot: 352, kind: 'commercial',
    parts: [[0, 0, 230, 110, 16], [0, 90, 180, 50, 13]],
    clearM: 170,
  },
  {
    id: 'usd',
    name: 'University of San Diego',
    // On the Linda Vista bench above the valley. The Immaculata's blue dome is
    // the thing you see from I-5.
    u: 0.4180, v: 0.1780, rot: 350, kind: 'campus',
    parts: [
      [0, 0, 70, 46, 26],
      [0, -6, 24, 24, 46],          // the dome
      [-90, 30, 80, 40, 22],
      [86, 20, 76, 40, 24],
      [10, 80, 100, 44, 20],
    ],
    clearM: 120,
  },
  {
    id: 'sdsu',
    name: 'San Diego State University',
    u: 0.9280, v: 0.1640, rot: 6, kind: 'campus',
    parts: [
      [0, 0, 90, 56, 28],
      [-100, -30, 80, 46, 24],
      [96, -20, 84, 48, 26],
      [-30, 70, 110, 50, 22],
      [110, 66, 70, 60, 30],
      [0, -80, 130, 44, 18],
    ],
    clearM: 150,
  },

  // ── Old Town, Midway and the harbour ─────────────────────────────────────
  {
    id: 'old_town_plaza',
    name: 'Old Town State Historic Park',
    u: 0.5050, v: 0.1500, rot: 10, kind: 'campus',
    parts: [
      [-40, -20, 26, 16, 7],
      [12, -26, 30, 14, 7],
      [46, 4, 22, 18, 8],
      [-20, 34, 34, 16, 7],
    ],
    clearM: 70,
  },
  {
    id: 'pechanga_arena',
    name: 'Pechanga Arena',
    u: 0.2720, v: 0.3020, rot: 14, kind: 'commercial',
    parts: [[0, 0, 130, 120, 30], [0, 0, 100, 92, 36]],
    clearM: 200,
  },
  {
    id: 'airport_terminals',
    name: 'San Diego International terminals',
    // Two long linear terminals along the north side of the single runway,
    // with the control tower between them.
    u: 0.3760, v: 0.3420, rot: 8, kind: 'commercial',
    parts: [
      [-130, 0, 260, 46, 20],       // Terminal 1
      [150, -10, 200, 44, 22],      // Terminal 2
      [20, -34, 18, 18, 60],        // the tower
      [-40, 54, 240, 60, 16],       // the parking structures
    ],
    clearM: 160,
  },
  {
    id: 'mcrd_parade',
    name: 'MCRD parade deck & arcade',
    u: 0.3760, v: 0.2900, rot: 16, kind: 'military',
    parts: [
      [0, 0, 300, 130, 1],          // the deck itself
      [0, -84, 280, 24, 12],        // the arcaded barracks along one side
      [0, 84, 280, 24, 12],
      [-160, 0, 30, 60, 20],
    ],
    clearM: 120,
  },

  // ── The working bay ──────────────────────────────────────────────────────
  {
    id: 'nassco_yard',
    name: 'NASSCO & BAE shipyards',
    // Gantry cranes and dry docks south of the bridge. The cranes are the
    // tallest things on the bay after the bridge itself.
    u: 0.7000, v: 0.6060, rot: 26, kind: 'industrial',
    parts: [
      [0, 0, 240, 90, 24],
      [-140, -20, 60, 50, 62],      // gantry
      [140, 10, 60, 50, 58],
      [0, 90, 200, 60, 18],
    ],
    clearM: 120,
  },
  {
    id: 'naval_base_sd',
    name: 'Naval Base San Diego',
    // The 32nd Street piers: a comb of finger piers with grey ships alongside.
    u: 0.7660, v: 0.6800, rot: 26, kind: 'military',
    parts: [
      [0, 0, 300, 70, 14],
      [-110, -90, 40, 190, 6],
      [-10, -90, 40, 190, 6],
      [90, -90, 40, 190, 6],
      [0, 90, 260, 60, 20],
    ],
    clearM: 100,
  },
  {
    id: 'tenth_ave_terminal',
    name: 'Tenth Avenue Marine Terminal',
    u: 0.6660, v: 0.5680, rot: 26, kind: 'industrial',
    parts: [[0, 0, 200, 110, 22], [0, -70, 160, 30, 40]],
    clearM: 90,
  },

  // ── Coronado and North Island ────────────────────────────────────────────
  {
    id: 'hotel_del',
    name: 'Hotel del Coronado',
    // At the ocean end of Orange Avenue: a sprawling red-roofed timber pile
    // with a conical turret, and nothing else near it above three storeys.
    u: 0.5450, v: 0.7950, rot: 32, kind: 'commercial',
    parts: [
      [0, 0, 130, 90, 24],
      [-64, -40, 26, 26, 38],       // the turret
      [80, 20, 70, 50, 20],
      [-20, 76, 110, 40, 18],
    ],
    clearM: 130,
  },
  {
    id: 'coronado_ferry',
    name: 'Coronado Ferry Landing',
    u: 0.5250, v: 0.7060, rot: 32, kind: 'commercial',
    parts: [[0, 0, 70, 30, 10], [40, 20, 40, 22, 8]],
    clearM: 50,
  },
  {
    id: 'north_island_hangars',
    name: 'NAS North Island flight line',
    // The hangar row along the runway's north side, and the carrier piers on
    // the channel. A supercarrier alongside is 330 m long and is, from the
    // air, the single most identifiable object on this map.
    u: 0.3980, v: 0.6060, rot: 22, kind: 'military',
    parts: [
      [-150, 0, 120, 70, 26],
      [0, 0, 120, 70, 26],
      [150, 0, 120, 70, 26],
      [0, -90, 300, 40, 12],
    ],
    clearM: 90,
  },
  {
    id: 'carrier_pier',
    name: 'North Island carrier piers',
    u: 0.4520, v: 0.6320, rot: 40, kind: 'military', water: true,
    parts: [
      [0, 0, 400, 40, 6],               // the pier
      [0, -60, 330, 40, 20],            // a carrier alongside: hull
      [0, -60, 330, 76, 4, 19],         // flight deck
      [30, -84, 46, 16, 24, 23],        // island
    ],
    clearM: 0,
  },

  // ── Point Loma ───────────────────────────────────────────────────────────
  {
    id: 'cabrillo_monument',
    name: 'Cabrillo National Monument',
    u: 0.1780, v: 0.8620, rot: 12, kind: 'campus',
    parts: [
      [0, 0, 26, 18, 9],
      [30, -16, 8, 8, 14],          // the old lighthouse
      [-30, 20, 40, 24, 6],
    ],
    clearM: 60,
  },
  {
    id: 'rosecrans_cemetery',
    name: 'Fort Rosecrans National Cemetery',
    // No buildings to speak of. It is here so the fabric is cleared off it —
    // the white headstone field on the ridge is a landmark made of absence.
    u: 0.1700, v: 0.7700, rot: 12, kind: 'park',
    parts: [[0, 0, 20, 14, 5]],
    clearM: 420,
  },
  {
    id: 'submarine_base',
    name: 'Naval Base Point Loma piers',
    u: 0.2480, v: 0.6440, rot: 14, kind: 'military',
    parts: [
      [0, 0, 150, 60, 18],
      [-60, 70, 40, 140, 5],
      [60, 70, 40, 140, 5],
    ],
    clearM: 70,
  },

  // ── South bay ────────────────────────────────────────────────────────────
  {
    id: 'national_city_terminal',
    name: 'National City marine terminal',
    // Acres of flat ground stacked with imported cars, and two very long sheds.
    u: 0.7940, v: 0.7240, rot: 26, kind: 'industrial',
    parts: [
      [0, 0, 340, 60, 18],
      [0, 110, 300, 50, 16],
    ],
    clearM: 260,
  },
  {
    id: 'plaza_bonita',
    name: 'Westfield Plaza Bonita',
    u: 0.9260, v: 0.8760, rot: 4, kind: 'commercial',
    parts: [[0, 0, 210, 110, 16], [0, 90, 170, 50, 13]],
    clearM: 170,
  },
];

/**
 * Expand a landmark into world boxes.
 * Returns objects shaped like the ones CityFabric emits, so both go through
 * the same export and the same consumers.
 */
export function landmarkBoxes(lm, frameW, frameH) {
  const t = ((lm.rot ?? 0) * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const cx = lm.u * frameW;
  const cy = lm.v * frameH;
  const parts = lm.parts ?? [[0, 0, lm.w ?? 20, lm.d ?? 20, lm.h ?? 10]];
  return parts.map(([dx, dy, w, d, h, base]) => {
    const x = cx + dx * cos - dy * sin;
    const y = cy + dx * sin + dy * cos;
    return {
      u: x / frameW,
      v: y / frameH,
      rot: lm.rot ?? 0,
      w,
      d: d,
      h,
      base: base ?? 0,
      kind: lm.kind ?? 'commercial',
      district: lm.id,
      landmark: true,
      water: !!lm.water,
    };
  });
}

/** Metres of procedural fabric to clear around a landmark. */
export function landmarkClearance(lm) {
  if (lm.clearM != null) return lm.clearM;
  const parts = lm.parts ?? [[0, 0, lm.w ?? 20, lm.d ?? 20, lm.h ?? 10]];
  let r = 0;
  for (const [dx, dy, w, d] of parts) {
    r = Math.max(r, Math.hypot(dx, dy) + Math.max(w, d) / 2);
  }
  return r;
}
