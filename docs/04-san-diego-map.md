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
| `downtown` | **Downtown** | Skyline, highest loot |
| `pointloma` | **Point Loma** | Ridge high ground |
| `balboa` | **Balboa Park** | Museums |
| `zoo` | **San Diego Zoo** | Zoo grounds |
| `coronado` | **Coronado** | Resort island |
| `radiotower` | **Radio Tower** | East mountain outpost |

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
