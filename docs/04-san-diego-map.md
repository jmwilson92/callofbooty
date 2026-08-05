# San Diego Battle Royale Map

Reference screenshot: `map-reference-san-diego.png` (Google Maps crop of SD + surrounds).

## Coordinate frame

| Axis | Direction |
|------|-----------|
| **+X** | East (Mission Trails, inland) |
| **−X** | West (Pacific Ocean) |
| **−Z** | North (La Jolla, Miramar, University City) |
| **+Z** | South (Downtown, Airport, Balboa) |
| **Y** | Up; sea level = 0 |

Origin ≈ **Mission Valley** (between Old Town and University City).

World size: **1600 m** square (`WORLD.SIZE` in `src/config.js`).

## Terrain features

1. **Pacific coastline** — soft wavy shoreline near `COAST_X ≈ −520`, ocean west.
2. **Mission Bay** — elliptical lagoon cut around (−280, 40).
3. **San Diego Bay / airport flats** — larger cut around (−180, 420).
4. **Mission Trails mass** — eastern hills peaking toward Y ~88.
5. **La Jolla headland** — NW coastal elevation boost.
6. **Soft square rim** — edges sink so you cannot walk off the playable area.

## POIs

| ID | Name | Approx role |
|----|------|-------------|
| `lajolla` | La Jolla | NW coastal village, high loot |
| `university` | University City | North campus blocks |
| `miramar` | Miramar Ridge | Natural high ground + tower |
| `missiontrails` | Mission Trails | Rocky terraces, east hills |
| `missionbay` | Mission Bay | Recreation sheds, beach cover |
| `oldtown` | Old Town | Mid map hub / spawn approach |
| `balboa` | Balboa Park | Museums / halls mid-south |
| `downtown` | Downtown | Dense vertical, **highest loot** |
| `airport` | Lindbergh Field | Hangars + containers, open sightlines |

## Roads

`ROAD_LINKS` in `config.js` approximate freeways:

- Coastal **I-5** (La Jolla → Mission Bay → Old Town → Downtown)
- **Harbor / bay** (Old Town ↔ Airport ↔ Downtown)
- **SR-163** corridor (Downtown → Balboa → University)
- **SR-52 / I-15** north (University → Miramar → Mission Trails)
- **I-8** east–west (Mission Trails → Balboa / Downtown)

## Spawn

Default spawn: **Old Town** approach `(−20, 160)`, facing south toward Downtown.

## Not to scale

This is a **stylized BR compression** of the metro area, not a GIS-accurate model.
Landmarks and relative placement match the reference map enough to read as San Diego.
