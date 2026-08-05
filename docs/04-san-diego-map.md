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

| ID | Name | Approx role |
|----|------|-------------|
| `kearnymesa` | **Kearny Mesa** | North industrial/commercial mesa |
| `missionvalley` | **Mission Valley** | I-8 corridor — spawn hub |
| `airport` | **San Diego International Airport** | Hangars + open bay flats |
| `mcrd` | **MCRD Depot** | Barracks grid beside the airport |
| `downtown` | **Downtown** | Dense core, highest loot |
| `pointloma` | **Point Loma** | Peninsula high ground |
| `balboa` | **Balboa Park** | Museums / park NE of downtown |
| `zoo` | **San Diego Zoo** | Zoo grounds north of Balboa |
| `coronado` | **Coronado** | Island across San Diego Bay |

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
