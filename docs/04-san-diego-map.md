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
| `airport` | **San Diego International Airport** | Hangars + bay flats |
| `mcrd` | **MCRD Depot** | Parade deck + arcaded barracks — see below |
| `downtown` | **Downtown** | Zoned street grid, highest loot — see below |
| `pointloma` | **Point Loma** | Ridge high ground |
| `balboa` | **Balboa Park** | Museums, on the mesa NE of downtown across I-5 |
| `zoo` | **San Diego Zoo** | Canyon-terraced habitats, aviary, Skyfari |
| `coronado` | **Coronado** | Resort island |
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

## Geography (still present under the POIs)

Pacific west, Point Loma peninsula, San Diego Bay, Mission Bay lagoon,
Mission Valley trench, mesa/canyon relief, freeways
(I-5 / I-8 / I-15 / I-805 / SR-52 / SR-163).

### Far-eastern mountain system

Stylized BR wall on the east rim (`WORLD.EAST_MOUNTAINS`) — **not GIS-accurate**,
but necessary for map readable high ground and a hard eastern edge:

- N–S spine near `x ≈ 720`
- Layered foothill ridges west of the spine
- Four summit masses (peaks ~145–175 m)
- Canyon cuts between ridges for rotation routes
- Chaparral → rock → light summit snow vertex colors

## Spawn

Mission Valley `(0, 70)`, facing south toward Downtown / MCRD.
