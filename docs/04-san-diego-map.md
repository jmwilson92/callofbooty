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

Footprints are **rectangles** (`w` × `d` metres), not circles — shaped like
districts on the satellite map (valley corridor, airfield plate, downtown grid, etc.).

| ID | Name | Footprint shape | Role |
|----|------|-----------------|------|
| `lajolla` | **La Jolla** | Tall N–S strip | NW coastal cliffs / village |
| `kearnymesa` | **Kearny Mesa** | Wide mesa plate | Industrial/commercial |
| `missionvalley` | **Mission Valley** | Wide E–W corridor | I-8 spawn hub |
| `airport` | **San Diego International Airport** | Long E–W field | Hangars + bay flats |
| `mcrd` | **MCRD Depot** | Base rectangle | Barracks grid |
| `downtown` | **Downtown** | Large grid district | Skyline, highest loot |
| `pointloma` | **Point Loma** | Tall N–S peninsula | Ridge high ground |
| `balboa` | **Balboa Park** | Park rectangle | Museums |
| `zoo` | **San Diego Zoo** | Compact rectangle | Zoo grounds |
| `coronado` | **Coronado** | Wide E–W island strip | Resort island |
| `radiotower` | **Radio Tower** | Small square pad | East mountain outpost |

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
