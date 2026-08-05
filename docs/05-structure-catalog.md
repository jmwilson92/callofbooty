# Structure catalog (Phase 1 detail pass)

All geometry is **box primitives** (no downloaded models). Tunables live in
`STRUCTURES` and colors are original (no trademarked brands).

## Modules

| File | Role |
|------|------|
| `src/world/structures/Catalog.js` | Builders for each structure type |
| `src/world/structures/Scatter.js` | Region + POI placement |
| `src/config.js` → `STRUCTURES` | Counts |

## Types

| Type | Notes |
|------|--------|
| Suburban home | 1–2 story + optional garage / fence |
| Trailer | Clustered trailer parks |
| Gas station | Canopy, pumps, mini-mart, sign |
| Restaurant / fast food | Building + patio; drive-thru canopy when fast |
| Auto repair | Bay shed, lifts, tire stacks, wreck |
| Fire station | Apparatus bay, red tower, engine block |
| Business center | Mid-rise office + plaza planters |
| Skyscraper | 8–15 floors, roof antenna (downtown ring) |
| Boat house | Shed + pier pilings |
| Harbor pier | Long pier, crates, warehouse |
| Bridge | Deck + rails + support piers |
| Billboard | Pole + panel |
| Vehicle | Abstract parked cars |
| Zoo animals | Stylized block creatures (large/tall/bulk/small/bird) |

## Hand landmarks

- Harbor piers at the Airport
- Coronado ↔ Downtown bridge span
- Mission Valley overpasses
- Extra commercial / civic at Downtown, Kearny Mesa, Mission Valley, La Jolla, MCRD
- Animal scatter inside San Diego Zoo POI

## Next refinement ideas

- Road surface meshes / lane markings
- More interior props
- Unique skyscraper silhouettes per tower
- Moving / animated animals later
