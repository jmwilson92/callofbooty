# San Diego Battle Royale Map

References:

- `../satellite view.png` — Google satellite of metro SD
- `../terrain map.png` — topography / elevation view
- `map-reference-san-diego.png` — earlier street-map crop

## Coordinate frame

| Axis | Direction |
|------|-----------|
| **+X** | East (Mission Trails, inland hills) |
| **−X** | West (Pacific Ocean) |
| **−Z** | North (La Jolla, Miramar, University City) |
| **+Z** | South (Downtown, Coronado, Point Loma tip) |
| **Y** | Up; sea level = 0 |

Origin ≈ **Mission Valley** (I-8 × I-805).

World size: **1800 m** square (`WORLD.SIZE`).

## Geography (from satellite + terrain maps)

1. **Pacific coastline** — west edge, noise-warped shoreline.
2. **Point Loma peninsula** — land hook SW that defines San Diego Bay.
3. **Coronado** — island / spit across the bay.
4. **San Diego Bay** — long N–S basin between peninsula and mainland.
5. **Mission Bay** — multi-lobe lagoon west of Old Town / Mission Beach.
6. **Mission Valley trench** — E–W low corridor (I-8).
7. **North mesas** — Clairemont / UC shelf with canyon cuts.
8. **Eastern hills** — Mission Trails mass → chaparral foothills.
9. **Freeways** — I-5, I-8, I-15, I-805, SR-52, SR-163 as polylines.

## POIs (12)

| ID | Name | Role |
|----|------|------|
| `lajolla` | La Jolla | NW coastal cliffs |
| `university` | University City | North campus / 52–805 |
| `miramar` | Miramar | North high ground |
| `clairemont` | Clairemont | Mesa suburbs |
| `missiontrails` | Mission Trails | East rocky park |
| `missionbay` | Mission Bay | Lagoon recreation |
| `oldtown` | Old Town | I-5 / I-8 hub |
| `balboa` | Balboa Park | Green mid-south |
| `downtown` | Downtown | Highest loot |
| `airport` | Lindbergh Field | Bay flats / hangars |
| `pointloma` | Point Loma | Peninsula ridge |
| `coronado` | Coronado | Island strip |

## Spawn

Mission Valley `(−30, 90)`, facing south toward Downtown.

## Not to scale

Stylized BR compression of the metro — readable as San Diego from the references, not GIS-accurate.
