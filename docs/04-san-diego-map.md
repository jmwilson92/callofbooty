# San Diego Battle Royale Map

References: `satellite view.png`, `terrain map.png` (repo root).

## Coordinate frame

| Axis | Direction |
|------|-----------|
| **+X** | East |
| **−X** | West (Pacific) |
| **−Z** | North |
| **+Z** | South |
| **Y** | Up; sea level = 0 |

Origin ≈ **Mission Valley**. World size: **1800 m**.

## POIs (playable)

POIs are **anchors only** (`x`, `z`) — **no flatten pads or footprints**.
Terrain follows the natural map; buildings seat on local height.

| ID | Name | Role |
|----|------|------|
| `lajolla` | **La Jolla** | NW coastal cliffs / village |
| `kearnymesa` | **Kearny Mesa** | Suburbs + big-box retail + business park |
| `missionvalley` | **Mission Valley** | I-8 spawn hub |
| `airport` | **San Diego International (SAN)** | Lindbergh Field — runway, terminal, tower |
| `mcrd` | **MCRD Depot** | Parade deck + arcaded barracks — see below |
| `downtown` | **Downtown** | Zoned street grid, highest loot — see below |
| `pointloma` | **Point Loma** | Lighthouse, Fort Rosecrans, submarine base |
| `balboa` | **Balboa Park** | Museums, on the mesa NE of downtown across I-5 |
| `zoo` | **San Diego Zoo** | Canyon-terraced habitats, aviary, Skyfari |
| `coronado` | **Coronado** | NAS North Island, carrier + destroyer, Hotel del |
| `radiotower` | **Radio Tower** | East mountain outpost |

## Downtown district

Downtown is the one POI with a real street plan rather than a scatter of
buildings. Everything about it lives in `DOWNTOWN_GRID` (`src/config.js`);
`src/world/DowntownPlan.js` turns that into block rectangles and street
polylines, and both the pavement (`Roads.js`) and the buildings
(`structures/Catalog.js`) read that one plan.

- **Grid** — 6 × 6 blocks of 38 m (E–W) × 30 m (N–S), roughly half-scale
  Horton's-grid proportions, on 11 m streets. Two spines carry the district:
  a 20 m Broadway (E–W) and a 16 m bayfront Harbor Drive (the west avenue).
- **Lot coverage** — buildings are built to the lot line behind a 1.8 m
  sidewalk, so facades front the pavement and streets read as canyons
  (14.6 m facade to facade, 23.6 m on Broadway). Blocks are subdivided into
  parcels rather than holding a single centred tower.
- **Neighbourhoods** — the `districts` array is an ASCII map, one character
  per block, north at the top and the bay on the left. Edit it to rezone:

  | Code | District | Character |
  |------|----------|-----------|
  | `M` | Marina / Embarcadero | bayfront hotel slabs |
  | `L` | Little Italy | low-rise, wide parcels |
  | `F` | Financial (Columbia) | the tall towers |
  | `C` | Civic / core | mid-rise offices |
  | `G` | Gaslamp Quarter | 2–4 storey street wall, alleys, neon |
  | `E` | East Village | brick warehouses and lofts |
  | `P` | Surface parking | stamped and dressed by the lot pass |

- **Landmarks** — `landmarks` claims an inclusive rect of blocks *and* the
  streets inside it, so nothing bisects them: the ballpark, the convention
  centre's sail roof, the rail depot, and the signature crowned tower.
- **The bay is west.** Waterfront means column 0, not the south rows.

Freeways and arterials stop at the district edge — inside the grid the
street plan is the road network, and arterial links land on the ring road
rather than the city centre. Move a freeway and you must re-check the
civic-building sites in `structures/Scatter.js`, which are hand-verified
clear of the corridors.

## MCRD Depot

The other authored POI. Bertram Goodhue's 1921 plan is a Spanish Colonial
Revival campus — cream stucco, red clay tile, continuous arcades — wrapped
around one enormous parade deck, and the depot is laid out the same way:

- **The parade deck ("the grinder")** is the organising element. It is paved
  by `Terrain` through the same stamp the parking lots use, then painted with
  formation lines and the yellow footprints at receiving.
- **Barracks** — four two-storey squad bays along the north edge, arcades
  facing the deck, tile roofs.
- **South row** — mess hall, chapel (bell tower and cross) and the command
  museum, all fronting the deck behind arcades.
- **Command building** closes the west head of the deck; its tower is the
  landmark you navigate the depot by.
- **East field** — confidence course, rappel tower and water tower.
- **Perimeter fence** with a single main gate on the south side.

Geometry comes from `MCRD_DEPOT` in `src/config.js` as `(u, v)` offsets from
the depot's north-west corner; `src/world/McrdPlan.js` resolves them to world
space and `src/world/structures/Mcrd.js` builds them.

A parade deck has to be dead flat and nothing on the natural map is — the
flattest candidate site still had ~20 m of relief — so the depot gets a
levelled pad (`MCRD_PLATE`) using the same machinery as `DOWNTOWN_PLATE`.
Freeways and arterials stop at the fence, and every approach road lands on
the gate, the same way city traffic stops at downtown's ring.

## San Diego Zoo

Deliberately *not* levelled. The zoo is built into canyons, which is why it
looks the way it does — exhibits terrace into the hillsides, paths switch back
along the contours, and the Skyfari gondola crosses overhead because walking it
is a climb. The site here runs from 15 m at the west end to 90 m on the east
ridge and the layout takes that as given (`src/world/structures/Zoo.js`).

It also pioneered cageless moated enclosures, so a habitat is a public viewing
wall, a moat gap and an inner retaining wall — not a barred cage. On a slope the
pad cuts to its high corner and the retaining wall grows downhill to meet grade.

Contains the entry plaza and gate arch, five moated habitats, a walk-through
mesh aviary down in the canyon, reptile and primate houses, a canyon footbridge,
and the Skyfari running from the low west terminal up to the east ridge.

## Kearny Mesa

A flat-topped mesa split into four quadrants by the I-15 and SR-52 corridors
that cross at the anchor. Big-box retail and the dealership row sit on the two
freeway-adjacent quadrants — which is where they really are — and the two quiet
quadrants hold residential tracts.

Streets come from `src/world/KearnyPlan.js` (a collector with cross streets and
a cul-de-sac per tract, plus one access spine per commercial quadrant);
`src/world/structures/KearnyMesa.js` fills the lots. Residential lot depth is
derived from the street spacing so back-to-back houses on adjacent streets
cannot meet in the middle of the block.

Every building pours a terrace pad down to its low corner rather than demanding
already-flat ground, which is what lets a suburb sit on rolling mesa.

Arterials stop at the district edge, the same rule downtown and MCRD use — five
of them converged on the anchor and paved the quadrants flat before that.

## San Diego International (Lindbergh Field)

Everything about SAN follows from having exactly one runway on a strip of land
too narrow for a second, and the model follows the same constraint:

- **The terminal is a single linear block** with its gates coming straight off
  the airside face. Concourse piers were built first and thrown away: on a 134 m
  frontage three piers give a 27 m pitch, an airliner is 22 m across the wings,
  and every aircraft parked between two piers flew through both of them. The
  real Lindbergh has a linear terminal for the same reason.
- **Cargo and general aviation** are squeezed onto the west end, where the field
  runs out of width.
- **One runway**, with a parallel taxiway and turn-offs, marked with piano-key
  thresholds, centreline dashes, touchdown-zone bars and edge lights.
- **The control tower** closes the east end, and is somewhere you can actually
  fight from. A tower you cannot get into is scenery, so this one has a caged
  ladder up the back of the shaft (registered as a real climb volume), a gallery
  floor at 34 m, and a waist-high parapet running right round an open walkway
  outside the cab — glass above the parapet only, so nothing blocks a shot taken
  from cover. The whole field, the approach and MCRD to the north are all
  covered from it, and it is registered as a building so loot spawns up there.

The airfield gets its own levelled plate (`AIRPORT_PLATE`) because a runway is
flat by definition. Its west edge stops at x −206 — about 18 m short of the bay
inlet, so the blend has dry ground to ramp down through instead of ending as a
wall out of the water (at x −224 it did exactly that, an 83° drop straight into
the bay). The east edge stops at x −40, short of Mission Valley's district,
cutting 3–8 m off the rising ground there. Together those two gains take the
runway from 128 m to 158 m.

Runway, taxiway and apron are graded into the heightfield through the same stamp
the parking lots use, so they are ground you can run and land on rather than a
deck laid over one. The **car park is deliberately not** in that set — it goes
through `defaultParkingLots()` so the normal stall-and-cars pass dresses it. Put
the airside surfaces in there instead and that pass paints parking bays down the
runway, which is exactly what two stale hand-placed lots at the old anchor were
already doing.

Layout is `AIRPORT_FIELD` in `src/config.js`, resolved by
`src/world/AirportPlan.js`, which the road pass reads too — arterials land on
the terminal kerb rather than driving down the runway, the same rule the depot
gate and the downtown ring use.

Mission Valley's malls and hotels moved east of the field. They used to be laid
out west of their anchor, which put them on the only flat ground in the valley
mouth — the ground the airport now occupies — and that is also where the real
Mission Valley sits relative to Lindbergh.

## Coronado

Three things share the island, west to east (`src/world/structures/Coronado.js`):

- **Naval Air Station North Island** on the west end — apron, runway with
  centreline and threshold markings, a hangar line, the control tower, a fuel
  farm and a parked air wing.
- A low-rise **village** of cottage rows facing a street, with a short
  commercial block behind them.
- The **Hotel del Coronado** on the ocean beach at the south: white walls, steep
  red shingle roof, dormers, a wrap-around verandah and the fat conical corner
  turret it is famous for.

A **carrier and two destroyers** are moored off the north shore on the bay side,
bow out to the channel, which is where the real berths are. The carrier deck is
the point of the whole POI — the largest flat surface on the map, readable from
every approach, and registered as a floor so it is a genuinely good fight. Deck
overhang on sponsons, angled landing area, catapult tracks, arresting wires,
island superstructure to starboard, deck-edge lifts, and the air wing parked
clear of the landing lane.

## Point Loma

The peninsula ridge that closes the bay (`src/world/structures/PointLoma.js`),
north to south:

- A **residential grid** of streets and lots on the flat plateau.
- **Fort Rosecrans National Cemetery** on the east-facing slope above the bay —
  eight terraced benches of white markers, each faced with a retaining wall at
  its downhill nose, with a flagpole and rostrum at the head of the plot. The
  slope loses ~32 m over 100 m; markers laid on that raw grade would vanish into
  the hillside, which is also why the real cemetery is terraced.
- The **Old Point Loma Lighthouse** on the southern crest — white tower through
  the keeper's cottage roof, gallery and black lantern room — and the **Cabrillo
  overlook** beyond it.
- The **submarine base out on Ballast Point**, the spit that runs east off the
  ridge at around z 420, with a boat alongside the quay.

Sunset Cliffs gets a railed footpath along the west edge, which walks the coast
to find it rather than assuming a line — the west shore wanders by 30 m over the
length of the ridge.

### Anything that touches the water

`src/world/structures/Waterfront.js` is the shared marine kit, used by both
peninsulas. Both coastlines are noise-shaped ellipses rather than surveyed
geometry, so nothing at the waterline may be placed on a hardcoded coordinate:

- `findShore()` walks to the real waterline before a quay commits, and tests the
  quay's full width rather than one sample.
- `berth()` searches for open water fore-and-aft **and** athwartships. The bay
  floor is noise, not a dredged channel — the two berths either side of one pier
  differ by 8 m of depth, and there are shoals that run the whole length of a
  mooring line. Point Loma's quay is rooted at the *seaward* end of Ballast
  Point for the same reason: from the landward end the only water a berth can
  reach is a 55 m pocket closed off by a bar.
- Beaches are graded ramps, not tiles sampled off the heightfield. A shore that
  loses 6 m in 10 m of z turns per-tile sampling into a checkerboard of paving
  stones hovering over the water.

A carrier placed on faith ends up parked on the island. That is not
hypothetical — it is what the first version of this POI did, and it survived a
1080-point drop test, because a drop test measures whether you fall through the
world, not whether a ship is in it.

## Geography (still present under the POIs)

Pacific west, Point Loma peninsula, San Diego Bay, Mission Bay lagoon,
Mission Valley trench, mesa/canyon relief, freeways
(I-5 / I-8 / I-15 / I-805 / SR-52 / SR-163).

### Freeway grade separation

Every corridor is painted into the heightfield, so where two crossed they used
to merge into one wide patch of asphalt with nothing to tell you which road you
were on. `src/world/Interchanges.js` works out where the corridors actually
intersect, clusters the duplicate hits that shared vertices produce, and decides
which road flies — priority runs `i5 < i8 < i15 < i805 < sr52 < sr163`, so the
state routes go over the interstates, which is what SR-163 does over I-8.

The flying road stops carving the ground for the length of its deck (`isFlying`
is checked in `_applyRoads`) and `structures/Overpass.js` carries it instead:
a ramped deck on piers, Jersey barriers, a centre stripe, two quadrant connector
ramps peeling down to the road below, and a sign gantry on the approach.

Both the deck and its ramps run a **grade**, not the ground: the abutments set a
straight baseline and the profile humps over it, and the ramp interpolates from
the deck down to grade at its far end. Sampling terrain at every station and
adding the profile to that made the deck inherit every bump between the
abutments, so a 124 m span came out of the generator as a staircase of
disconnected slabs. The piers underneath vary in length instead, which is what
really happens.

### Far-eastern mountain system

Stylized BR wall on the east rim (`WORLD.EAST_MOUNTAINS`) — **not GIS-accurate**,
but necessary for map readable high ground and a hard eastern edge:

- N–S spine near `x ≈ 720`
- Layered foothill ridges west of the spine
- Four summit masses (peaks ~145–175 m)
- Canyon cuts between ridges for rotation routes
- Chaparral → rock → light summit snow vertex colors

## Filling between the districts

A quarter of the buildable map used to have nothing within 70 m of it, which
made the POIs read as islands. `STRUCTURES` counts are raised across the board —
they are actually reached now that `tryPlace` retries on a failed occupancy
claim instead of spending the whole structure on one contested spot — and
housing prefers to grow within 75 m of a road, the way suburbia actually
spreads. It is a preference rather than a rule, because the western coastal
shelf has few roads and still needs to fill.

**Large footprints are placed first.** Raising `SUBURBAN` to 190 saturated the
mid-city band with 16 × 14 house lots before the 30 × 26 business centres and
the 24 × 22 fringe towers got a turn, and both dropped to zero placed. Of 1015
sites that passed the business-centre predicate, 1011 were already claimed.
Moving those two passes ahead of the small fill restored them at no other cost.

## Spawn

Mission Valley `(0, 70)`, facing south toward Downtown / MCRD.

## Looking at the map

Free explore (`?mode=explore`, or the picker on the start screen) turns off the
zone and the bots and leaves everything else. It exists for exactly the reason
this document keeps giving: most of the defects in here were only ever found by
looking at the thing, and you cannot look at it while a gas wall is closing.
