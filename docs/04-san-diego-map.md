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
| `kearnymesa` | **Kearny Mesa** | Industrial/commercial |
| `missionvalley` | **Mission Valley** | I-8 spawn hub |
| `airport` | **San Diego International Airport** | Hangars + bay flats |
| `mcrd` | **MCRD Depot** | Barracks grid |
| `downtown` | **Downtown** | Zoned street grid, highest loot — see below |
| `pointloma` | **Point Loma** | Ridge high ground |
| `balboa` | **Balboa Park** | Museums, on the mesa NE of downtown across I-5 |
| `zoo` | **San Diego Zoo** | Zoo grounds |
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
