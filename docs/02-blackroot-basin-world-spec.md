# World Build Spec — "Blackroot Basin" Map

**How to use:** Paste GLOBAL CONTEXT first. Then paste sections **A through H one at a time**, in order. Section A must be complete and verified before B — every later section reads terrain height, and if the heightmap changes afterward, every building floats or sinks.

---

## GLOBAL CONTEXT (re-paste at the top of every section)

```
We are replacing the existing procedural island with a hand-authored 2048m x 2048m
map called Blackroot Basin. Four major biomes, connected by a road network.

COORDINATE SYSTEM:
- World spans X: -1024 to +1024, Z: -1024 to +1024. Origin (0,0) is map center.
- North = -Z. East = +X. South = +Z. West = -X.
- Y is up. Sea level = Y 0. Anything below Y 0 is water.
- All coordinates in this spec are (X, Z) pairs in meters unless stated otherwise.

CONSTRAINTS:
- Everything is procedural or primitive-assembled geometry. No downloaded models,
  no downloaded textures. Materials are flat/vertex colors plus procedurally
  generated canvas textures where noted.
- All repeated geometry uses InstancedMesh, one instance group per prop type
  per terrain cell.
- The world is split into a 16 x 16 grid of 128m streaming cells. Cells load
  geometry within 3 cells of the camera, LOD proxies within 6, and are culled
  beyond that. Loot spawn points and collision load with the cell.
- Total scene budget: under 900 draw calls and under 4.5M triangles at any camera
  position. Report actuals at the end of every section.
- Every gameplay-tunable number in this document goes into src/config.js under a
  WORLD namespace. Nothing hardcoded in geometry files.

OUTPUT RULES:
- Complete runnable files only. No "// rest of implementation" placeholders.
- End every section with a HOW TO TEST list and a reported draw call / triangle
  count.
- Where I give a hex color, use it exactly. Where I give a dimension, use it
  exactly. These are load-bearing for readability and gameplay, not suggestions.
```

---

# SECTION A — Terrain Foundation

Everything else sits on this. Get it exact.

## A.1 Heightmap composition

Generate a 2049 × 2049 float heightmap (1 m resolution), then downsample to a mesh at 2 m resolution (1024 × 1024 quads) with a second 0.5 m detail displacement applied only within 200 m of the camera.

Compose the height from **five stacked layers**, in this order:

**Layer 1 — Continental base.** Radial falloff from map center. Height = 1.0 at radius 0–700 m, falling on a smoothstep curve to 0.0 at radius 1150 m. This guarantees water on all edges and stops players walking off the map. Multiply the whole stack by this.

**Layer 2 — Regional mass.** 3 octaves of simplex noise, base frequency 0.0008, persistence 0.5, amplitude 45 m. This is the gentle rolling that makes the map feel like land instead of a plate.

**Layer 3 — Biome masks.** Four radial-plus-noise masks, each a 0–1 field, blended with smoothstep transitions **60 m wide**. Do not use hard biome edges. Mask centers and radii:

| Biome | Center (X, Z) | Core radius | Falloff radius |
|---|---|---|---|
| Ashfall Range (mountains) | (−600, −620) | 300 m | 520 m |
| Meridian City (metropolis) | (560, −420) | 280 m | 400 m |
| Blackroot Swamp | (420, 580) | 320 m | 480 m |
| Cedar Hollow (suburbs) | (−450, 350) | 300 m | 460 m |

**Layer 4 — Per-biome height modifiers**, multiplied by their mask:

- **Mountains:** ridged multifractal noise (1 − |noise|, 5 octaves, base frequency 0.0022, lacunarity 2.1), amplitude 140 m, plus a hand-placed ridge spline (see A.4). Peak elevation clamps at **Y 185**.
- **Metropolis:** flatten aggressively. Blend terrain height toward a constant **Y 18** with a weight of 0.92 inside the core radius. The city sits on a low bluff above the surrounding land — this reads instantly on the map and gives approach routes a climb.
- **Swamp:** blend toward **Y 1.5**, then subtract a low-frequency noise (frequency 0.006, amplitude 3.5 m) so roughly 40% of the swamp floor sits below Y 0 and floods. Add scattered hummocks: 60 Poisson-sampled bumps, radius 8–22 m, height 2.5–5 m, which become the only dry ground.
- **Suburbs:** gentle rolling, 2 octaves at frequency 0.0035, amplitude 22 m, centered on **Y 40**. Then apply road flattening (Section B) which does most of the shaping.

**Layer 5 — Hydraulic erosion pass.** Run 250,000 droplet iterations across the whole map: inertia 0.05, capacity 4.0, deposition 0.3, erosion 0.3, evaporation 0.02, radius 3, max lifetime 30. This is what makes the mountains read as real instead of noise-lumpy — it carves gullies that feed the river and deposits sediment fans at the mountain base. Do not skip it. Cache the eroded heightmap to a binary file keyed by seed so it doesn't recompute every load.

## A.2 The river

Carve a single river using flow accumulation on the eroded heightmap, but **constrain it to a hand-authored spline** so it always connects the biomes the way the level design needs:

Control points: `(−520, −540) → (−380, −430) → (−180, −280) → (−40, −90) → (60, 60) → (180, 260) → (300, 430) → (420, 620) → (560, 900)`

- Width: 6 m at the mountain source, widening linearly to 45 m at the swamp delta.
- Depth below surrounding terrain: 4 m upstream, 2 m in the mid-map, 1 m in the swamp (it stops being a channel and becomes sheet water).
- Carve with a smooth U-profile, banks sloped at 30° so players can enter and exit anywhere except the three gorge segments.
- **Three gorge segments** where banks are vertical rock, 12–18 m tall, crossable only at bridges: centered at `(−400, −450)`, `(−100, −180)`, and `(150, 220)`. These create real chokepoints.
- Water is a single flat plane per elevation step with a scrolling normal-map shader (procedurally generated normal map, two layers scrolling at different speeds and angles). Water surface heights: Y 62 at the mountain lake, Y 24 mid-map, Y 1.2 in the swamp. Step down between them with three small waterfalls at the elevation breaks — particle spray + audio emitters.

## A.3 Water behavior (gameplay)

| Depth | Effect |
|---|---|
| 0 – 0.5 m | No penalty. Footstep sound switches to water splash, audible at 28 m (vs 20 m normal) |
| 0.5 – 1.2 m | Move speed ×0.62, sprint disabled, splash audible at 40 m |
| 1.2 – 2.5 m | Move speed ×0.45, weapon lowered to a ready-carry, cannot ADS |
| > 2.5 m | Swimming: speed 2.8 m/s, pistols and melee only, no armor plating |

Bullets entering water lose 60% damage per 0.5 m traveled and stop entirely at 1.5 m. This makes water a real defensive option, not just a texture.

## A.4 Terrain material and vertex coloring

Color the terrain per-vertex by blending on slope and height and biome mask. Use these exact colors:

| Surface | Hex | Applied when |
|---|---|---|
| Wet sand / shoreline | `#C2B49A` | Y < 1.5, any biome |
| Swamp muck | `#4A4B32` | swamp mask > 0.4, Y < 4 |
| Swamp grass | `#5F6B3A` | swamp mask > 0.4, Y 4–8 |
| Lowland grass | `#6B7F43` | Y 4–55, slope < 20° |
| Dry grass | `#8A8B52` | suburbs mask > 0.5, Y 30–70 |
| Bare dirt | `#6E5A42` | slope 25–35° |
| Rock (light) | `#8C8A85` | slope > 35°, Y < 130 |
| Rock (dark) | `#5D5B58` | slope > 48° |
| Scree | `#9A958C` | slope 30–42°, Y 90–140 |
| Alpine grass | `#59683E` | Y 100–130, slope < 28° |
| Snow | `#E8ECF0` | Y > 138, slope < 40°, blended in over 12 m |
| Asphalt | `#3A3B3E` | road mask (Section B) |
| Concrete | `#87857F` | city plateau, under buildings |

Add a subtle per-vertex noise variation of ±6% brightness at frequency 0.05 so large flat areas don't look like a solid fill. Add a second macro variation at frequency 0.004, ±10%, which breaks up the readability-killing uniformity at distance.

## A.5 Elevation landmarks

Fixed reference points, so verify these read correctly after generation:

| Feature | Location | Elevation |
|---|---|---|
| Ashfall Peak (highest point) | (−660, −690) | Y 185 |
| Secondary summit | (−480, −730) | Y 152 |
| Mountain lake surface | (−520, −520) | Y 62 |
| City plateau | (560, −420) | Y 18 |
| Tallest building roof | (585, −405) | Y 132 |
| Suburb high ground | (−520, 300) | Y 58 |
| Swamp floor | (420, 580) | Y −1 to 2 |
| The Interchange (map center) | (0, 0) | Y 28 |

**HOW TO TEST:** I can walk from the swamp delta to Ashfall Peak without hitting an impassable wall or a place where I clip into terrain. The river runs continuously from the mountain lake to the sea. The three gorges are genuinely uncrossable on foot. Snow line is visible from the map center. No terrain seams or z-fighting between biome blends.

---

# SECTION B — Road Network

Roads are the skeleton. They dictate rotations, sightlines, and vehicle routes. Build them before any building.

## B.1 Road hierarchy

| Tier | Width | Lanes | Shoulder | Surface | Center line |
|---|---|---|---|---|---|
| Highway | 22 m | 4 | 2.5 m paved + guardrail | `#3A3B3E` asphalt | Double yellow `#C9A227` + white lane dashes |
| Arterial | 14 m | 2 | 1.5 m | `#3A3B3E` | Single yellow, white edge lines |
| Residential | 8 m | 2 | curb + 1.5 m sidewalk `#9C9A94` | `#454548` weathered | None |
| Service / alley | 5 m | 1 | none | `#4B4B4D` | None |
| Dirt track | 6 m | 1 | none | `#6E5A42` | None |
| Boardwalk (swamp) | 2.4 m | — | rail on one side | wood `#6B5943` | None |

## B.2 Road generation method

Generate each road from a **Catmull-Rom spline** through control points, then:

1. **Flatten terrain** in a corridor: full flatten to road height across the road width, then blend back to natural terrain over an additional 12 m on each side using smoothstep. Cut into hillsides (cut slope 45°, exposed as rock material) and fill across dips (fill slope 32°, grass).
2. **Extrude the road mesh** 0.12 m above the flattened terrain so there is never z-fighting.
3. **Generate markings** into a procedurally drawn canvas texture tiled along the spline UVs — do not use separate geometry for lane lines.
4. Place **guardrails** on any highway or arterial segment where the adjacent terrain drops more than 3 m within 8 m of the shoulder. Guardrail: 0.75 m tall, posts every 4 m, `#8C8A85`. Guardrails are `thin` penetration material.
5. **Bridges** wherever a road crosses the river or a gorge (see B.4).

## B.3 The road layout

**Highway 9 (the ring/spine).** The primary rotation route. Runs a rough loop:
`(−780, −180) → (−400, −80) → (0, 0) → (400, −120) → (700, −300) → (820, 0) → (760, 400) → (520, 700) → (100, 760) → (−300, 640) → (−620, 400) → (−780, 80) → close`
Elevated on embankment 4–8 m above surrounding terrain for most of its length — this makes it a fast rotation but an exposed one, which is exactly the tradeoff you want. Two segments run through **cuttings** (below grade, 6 m rock walls both sides) at `(−700, 250)` and `(600, −480)` — safe rotation corridors that block sightlines.

**The Interchange.** At `(0, 0)`, a full four-level stack interchange: ground level, two ramp decks at Y 34 and Y 42, and an upper deck at Y 50. Ramps are 9 m wide with 1.1 m parapets. This is the map's central vertical playground — a POI in its own right, with sightlines down all four highway approaches. Include a collapsed ramp section on the northeast quadrant creating a 14 m gap (jumpable only by vehicle, or crossable via a fallen sign gantry). Underneath: a shadowed ground-level area with support columns 2.5 m diameter on a 24 m grid, concrete barriers, and a small encampment of shipping containers.

**Arterial roads (6 total)**, each connecting a POI to Highway 9:
- Meridian Ave: city center `(560, −420)` south to Highway 9 at `(620, −180)`
- Harborline: city east edge to Kestrel Docks `(790, 180)`
- Cedar Road: suburbs `(−450, 350)` east to the Interchange
- Ashfall Pass Road: suburbs north to the mountain base `(−560, −380)`, becoming Mountain Switchback
- Blackroot Causeway: Highway 9 at `(300, 500)` into the swamp, ending at the boardwalk network `(430, 600)`
- Old Mill Road: mid-map `(−100, 100)` to the river gorge crossing at `(150, 220)`

**Mountain Switchback.** From `(−560, −380)` at Y 55 up to the observatory at `(−620, −660)` at Y 168. Eleven hairpin turns, 8 m wide, no guardrail on four of the turns, average grade 11%, max 16%. Two **tunnels**: a 90 m tunnel at Y 105 and a 40 m tunnel at Y 140. Tunnels are 9 m wide, 6.5 m tall, lit by procedurally emissive strips every 15 m, with a service alcove every 30 m. Rockfall debris partially blocks one lane in the long tunnel.

**Suburban street grid.** See Section D.

## B.4 Bridges — 6 total, all distinct

| Bridge | Location | Type | Length | Deck height above water | Notes |
|---|---|---|---|---|---|
| Ironspan | (−400, −450) | Steel arch | 70 m | 18 m | Over the upper gorge. Climbable arch ribs give a sniper perch at Y 92 |
| Stillwater Crossing | (−100, −180) | Concrete box girder | 55 m | 16 m | Two piers; a maintenance catwalk runs underneath the deck |
| Mill Bridge | (150, 220) | Covered timber | 40 m | 9 m | Fully enclosed, dark, windows every 4 m. Brutal close-quarters chokepoint |
| Highway 9 Viaduct | (300, 480) | Concrete, 7 spans | 210 m | 12 m | The longest sightline on the map. Piers below are usable cover |
| The Causeway | (400, 560) | Low earth causeway | 180 m | 1.5 m | Culverts every 30 m are crawl-through passages |
| Foot Trestle | (520, 700) | Rotting wooden rail trestle | 95 m | 7 m | Three collapsed sections force jumps of 2.5 m, 3 m, and 3.5 m |

## B.5 Roadside detail

Along every arterial and highway, scatter at intervals:
- Streetlights every 32 m on arterials, 45 m on highway. 9 m tall, `#6B6B6E`, procedurally emissive head.
- Road signs: 42 total, each naming a real destination from this spec so players can navigate by them. Green highway signs, white arterial signs, yellow warning signs at the switchback hairpins.
- Abandoned vehicles: 180 across the map, from a kit of 6 shapes (sedan, pickup, box truck, bus, van, semi trailer). Cars are `solid` for the lower half, `thin` for glass and upper doors. 30% have open doors. 15% are burned out (charcoal `#2A2826`, no glass). Cluster density: 4× on highway near the Interchange, 6× at the city approaches (a traffic jam), 0.3× on dirt tracks.
- Jersey barriers, orange cones, and a construction zone on the Highway 9 north segment with an 80 m single-lane closure.
- Utility poles along all residential roads and dirt tracks, 24 m spacing, with sagging catenary wires between them (render as thin tapered geometry, no collision).

**HOW TO TEST:** I can drive or run the entire Highway 9 loop without hitting a terrain wall or floating road segment. Every bridge is crossable. The switchback reaches the summit. Roads are flattened into the terrain with no gaps under the road mesh. Tunnels are traversable and lit.

---

# SECTION C — Meridian City (Metropolis)

The high-risk, high-reward POI. Vertical, dense, and dangerous. Footprint roughly `(300, −680)` to `(820, −180)`.

## C.1 Block structure

A **7 × 6 grid of city blocks** on the Y 18 plateau. Block dimensions 68 m × 54 m. Streets between blocks: 18 m (two lanes + parking + 4 m sidewalks both sides). Four **avenues** are 26 m wide, running north-south at grid columns 2, 4, 6 and east-west at row 3.

Rotate the entire grid **14° off world axis**. A perfectly axis-aligned city reads as fake immediately and creates unnaturally long sightlines down every street.

Each block is one of six types:

**Type 1 — Tower block (8 blocks).** One high-rise, footprint 44 × 34 m, 14–32 floors (see C.2), plus a plaza or surface lot filling the rest of the block.

**Type 2 — Midrise infill (12 blocks).** 3–5 separate buildings, 6–11 floors, sharing party walls, footprints 18–26 m wide. Ground floors are retail with large glass frontage; upper floors are offices or apartments. Rear alley 5 m wide with dumpsters, fire escapes, and a service door into each building.

**Type 3 — Parking structure (4 blocks).** 6 levels of open-sided parking, floor-to-floor 2.9 m, spiral ramp at one corner, 1.1 m parapets, stair core and dead elevator shaft. Roof level is open. Excellent mid-range fighting space with hard cover on a regular grid — these are the best-feeling combat spaces in most city maps, so make the column grid 8 m and keep sightlines partially broken by parked cars.

**Type 4 — Low commercial (10 blocks).** 2–3 floors, wide flat roofs connected to neighbors by roof-height differences of only 0.5–2 m, so a player can traverse an entire block at roof level. Rooftop HVAC units, water tanks, stair bulkheads, and parapets 1.0 m tall provide cover.

**Type 5 — Plaza / civic (4 blocks).** Open space. One holds a transit station entrance (see C.4), one a sunken plaza 4 m below street level with wide steps on two sides, one a park with mature trees and a fountain, one a civic building with a colonnade and a 12 m tall lobby.

**Type 6 — Construction site (4 blocks).** A building under construction: exposed floor slabs and columns with no exterior walls above floor 3, a tower crane 68 m tall with a climbable ladder and a walkable jib, scaffolding on one face, stacked materials, a site trailer, and open elevator shafts that are lethal falls. Maximum verticality, minimum cover — a high-skill space.

## C.2 Building specification

**Floor-to-floor height: 3.4 m** for offices and apartments, **4.8 m** for ground floors, **5.5 m** for lobbies.

Every building must satisfy these rules. Verify each one:

1. **At least two ground entrances**, on different faces.
2. **At least one continuous route to the roof** — stairwell, fire escape, or ladder. Buildings players can't get on top of are dead volume.
3. **Interior partitioning:** floors are not open boxes. Each floor gets a procedurally generated partition layout — a core (stairs, elevator shaft, restrooms) plus 4–9 rooms off a corridor loop. Doorways 1.0 m wide, no doors above floor 1 (avoids door-opening netcode and animation cost).
4. **Windows are enterable** on floors 1–2 (sill height 0.9 m, mantle-able) and non-enterable but breakable above.
5. **Glass is destructible** and a `thin` penetration material. Breaking it makes noise audible at 45 m.
6. **No room without a second exit** on floors 1–3.
7. **Interior lighting:** baked emissive panels, not real lights. Interiors are 30% darker than exteriors — enough to matter for spotting, not enough to be unplayable.

**Tower heights (the 8 Type-1 blocks), so the skyline reads deliberately:**

| Tower | Location (X, Z) | Floors | Roof Y | Feature |
|---|---|---|---|---|
| Meridian One | (585, −405) | 32 | 132 | Tallest. Rooftop helipad, antenna mast, external maintenance ladder from floor 28 |
| Ardent Tower | (520, −455) | 26 | 110 | Sky bridge at floor 18 to Kalder Building |
| Kalder Building | (470, −430) | 22 | 95 | Sky bridge connection; setback terraces at floors 12 and 18 |
| Cormorant Plaza | (630, −360) | 24 | 102 | Glass curtain wall — highly breakable, very loud |
| The Estuary | (555, −310) | 18 | 79 | Residential, balconies every floor (each is a firing position) |
| Northgate | (490, −540) | 20 | 87 | Under partial demolition: floors 14–20 have missing exterior walls on two faces |
| Warrick Center | (655, −480) | 16 | 71 | Atrium void through floors 1–8, with a mezzanine ring at each level |
| Bell Tower | (415, −380) | 14 | 62 | Older masonry, narrow windows, thick `solid` walls. Bullet-resistant fortress |

**Sky bridges:** 3 total. Ardent↔Kalder at Y 79. Cormorant↔Meridian One at Y 68. A pedestrian bridge over Meridian Ave at Y 26. All are 4 m wide with glazed sides (breakable).

## C.3 Facade and material treatment

Generate facades as **procedural canvas textures** — window grids drawn to a canvas at 512×512 and tiled. Four facade families with these palettes:

| Family | Wall | Window | Trim | Used on |
|---|---|---|---|---|
| Modern glass | `#4A5560` | `#2E3A44` reflective | `#8E9296` mullions | Cormorant, Meridian One |
| Concrete brutalist | `#8A8880` | `#232628` | `#6E6C66` | Warrick, parking structures |
| Brick prewar | `#7A4A3C` | `#2A2C2E` | `#C4BFB4` stone | Bell Tower, low commercial |
| Panel residential | `#9A968C` | `#33383C` | `#5C6166` balcony rail | The Estuary, midrise infill |

Add ground-floor variation: awnings, roll shutters (50% closed, `solid`), signage boards, planters, bollards, bus shelters, newspaper boxes, ATM alcoves. This layer of clutter is what separates a city that reads as a city from a collection of boxes. Budget 2,400 instanced street props across the metropolis.

## C.4 The transit level (underground)

A **subway system**, because a metropolis without an underground layer wastes its best asset — an escape route that is invisible from above.

- **Three stations** at `(490, −500)`, `(560, −400)`, `(640, −310)`. Each has a street-level entrance (stair down, 2 per station on opposite sides of the street), a mezzanine at Y 10, and a platform level at Y 2.
- Platforms 90 m long, 12 m wide, with a track trench 1.2 m deep on both sides.
- **Connecting tunnels** between stations, 7 m wide, 5 m tall, lit every 20 m with emissive strips, with maintenance alcoves and a cross-passage between the two bores every 60 m.
- One tunnel section is **flooded to 1.1 m**, applying the water movement penalty and making it extremely loud to cross.
- A **derailed train** occupies 60 m of tunnel between stations 2 and 3 — enterable through blown-out car ends, four cars, interior seating as cover.
- Two **emergency exits** surfacing outside the city footprint at `(700, −520)` and `(430, −280)` — these are rotation routes out of the city that bypass the open plateau approach.
- Audio: heavy reverb, footsteps carry 40 m, gunfire is deafening and audible above ground at the station entrances.

## C.5 Kestrel Docks (city satellite, `(790, 180)`)

Where the city meets the swamp. Container yard on a 6.1 m × 2.44 m container grid, 14 stacks up to 4 high with walkable tops and gaps forming a maze. Two gantry cranes (climbable to Y 42). Three warehouses, 60 × 30 m, clear-span interiors with mezzanine catwalks. A grounded cargo ship, 140 m long, listing 8°, with three interior deck levels. Fuel tanks (6, cylindrical, 14 m diameter, external spiral stair). A rail spur with 12 freight cars.

**HOW TO TEST:** I can enter every building in the city and reach its roof. I can cross the map at rooftop level across at least one full Type-4 block. I can enter the subway at one station and exit at another without surfacing. The sky bridges are usable. Skyline silhouette reads with clear height variation from the map center 800 m away. Draw calls in the city under 900.

---

# SECTION D — Cedar Hollow (Suburbs)

Medium risk, high loot volume, the map's connective residential zone. Footprint roughly `(−760, 100)` to `(−160, 620)`. Rolling terrain Y 30–58.

## D.1 Street pattern

**Not a grid.** Suburban legibility comes from a hierarchy of curves. Generate:

- **One collector loop** (Cedar Road) running an irregular oval around the neighborhood, 8 m wide, following terrain contours so it rises and falls 20 m over its length.
- **Nine cul-de-sacs** branching off the loop, each 60–140 m long, terminating in a 20 m diameter bulb with a central landscaped island.
- **Four through-streets** connecting the loop to the arterials, so the neighborhood has real exits.
- **Sidewalks** on both sides, 1.5 m, curb height 0.15 m, with a 2 m grass verge between curb and sidewalk holding street trees at 14 m spacing.
- **Storm drains** at every low point — 1.2 m culvert openings that are crawl-through connections to a shallow drainage tunnel network beneath three of the cul-de-sacs. Emerges at a retention pond at `(−300, 520)`.

## D.2 House kit

Build **seven parametric floorplans**, then vary each by roof style, color, garage orientation, and a mirror flag. This gives visual variety without a hundred unique models.

| Plan | Footprint | Floors | Notes |
|---|---|---|---|
| A — Ranch | 16 × 9 m | 1 | Attached 1-car garage, low-pitch roof, no attic |
| B — Split-level | 14 × 11 m | 1.5 | Half-flight interior stairs, garage under the upper half |
| C — Two-story colonial | 12 × 10 m | 2 | Central stair, 4 upstairs rooms, front porch |
| D — Cape | 11 × 9 m | 1.5 | Dormer windows, steep roof, attic is enterable and a real firing position |
| E — Large modern | 18 × 13 m | 2 | Open plan ground floor, 2-car garage, rear deck at 1.2 m |
| F — Bungalow | 12 × 8 m | 1 | Detached garage at rear off an alley |
| G — Duplex | 20 × 10 m | 2 | Two mirrored units, separate entrances, shared wall |

**Every house must have:**
- Front door, rear door, and a garage door (garage doors 50% open).
- Interior stairs on multi-floor plans, plus attic access on plans C, D, E, G via a pull-down ladder in a hallway.
- Windows at sill height 0.9 m on the ground floor, all mantle-able.
- Interior furniture as cover: counters, sofas, beds, tables, bookshelves. Furniture is `thin` except counters and refrigerators.
- Interior walls are `thin` penetration; exterior walls are `thin` for plans A, C, D, F, G (wood frame) and `solid` for plans B and E (masonry). Players should learn which house types they can shoot through.

**Count: 118 houses.** Distribution: 22× Plan A, 14× B, 26× C, 18× D, 12× E, 16× F, 10× G.

**Exterior color palette** (assign randomly per house, weighted): `#C9C2B2` beige (25%), `#8FA0A8` blue-grey (18%), `#B8A98F` tan (16%), `#9BA88C` sage (14%), `#C4B0A0` clay (12%), `#7E8489` slate (9%), `#A85C4A` brick red (6%). Roofs: `#4A4744` charcoal shingle, `#6B5E52` brown shingle, `#7A8286` grey shingle, plus 8 houses with `#5E7A6B` metal roofs.

## D.3 Yards and lots

Lot size 24 × 32 m average. Each yard gets a procedural fill from this kit, 4–9 items per lot:
- Fences: wood privacy (1.8 m, `thin`, blocks sight), chain link (1.4 m, no sight block, no vault), picket (1.0 m, vaultable). 60% of lots fenced; fences must not fully enclose a yard without a gate.
- Above-ground pools (2.4), in-ground pools (5 total, one drained and enterable as a pit), trampolines, sheds (enterable, 3 × 2.5 m), swing sets, hedges (dense, 1.6 m, sight-blocking), garden beds, patio sets, grills, kids' toys, doghouses, cars in driveways, boats on trailers, RVs (3 total, enterable).
- Mature trees: 2–5 per lot, canopy 6–11 m.

## D.4 Suburban anchor buildings

Six non-residential structures that give the neighborhood shape and loot concentration:

**Cedar Hollow Elementary** `(−540, 260)`. Single story, 78 × 44 m, a double-loaded corridor with 14 classrooms, a double-height gymnasium (18 × 30 m, 9 m tall, with bleachers and a catwalk at Y 6.5), a cafeteria, a central courtyard open to the sky, and a flat roof with three access points. Playground and a 200 m running track outside. Highest loot density in the suburbs.

**Hollow Plaza strip mall** `(−300, 420)`. L-shaped, 9 storefronts, 2 floors on the corner unit. Continuous rear service corridor connecting all units — an interior rotation route invisible from the parking lot. Large parking lot (80 spaces, 22 vehicles present) with a light pole grid.

**Fuel & Go** `(−250, 250)`. Gas station: canopy 20 × 14 m at 5.5 m, six pumps, convenience store 14 × 10 m, service bay with a lift and a car on it, rear storage.

**Cedar Hollow Fire Station** `(−620, 400)`. Three apparatus bays 6 m tall with roll-up doors, one engine present, upper floor bunk room and day room, a training tower 18 m tall attached at the rear with open floor levels and a roof.

**Water Tower** `(−700, 200)`. 34 m to the catwalk, climbable ladder with a cage, walkable ring catwalk at Y 34, tank above. Highest suburban vantage point. Visible from the map center — a navigation landmark.

**Riverside Church & lot** `(−200, 560)`. Nave with a 12 m ceiling, balcony at Y 6, bell tower climbable to Y 22, small cemetery with headstones as low cover, detached hall.

**HOW TO TEST:** Every house is enterable through at least two openings and every multi-story house's upper floor and attic are reachable. The storm drain network connects three cul-de-sacs to the retention pond. The water tower is climbable and the strip mall's rear corridor connects all storefronts. No house intersects a road or another house.

---

# SECTION E — Blackroot Swamp

Low visibility, low mobility, high concealment. The map's ambush biome. Footprint roughly `(120, 280)` to `(820, 900)`. Ground Y −1 to 5.

## E.1 Water and ground structure

The swamp is **not a flat pond**. Generate a braided system:

- **Sheet water** at Y 1.2 covering roughly 55% of the biome at depths of 0.2–1.1 m.
- **Channels**: 8 deeper channels, 8–20 m wide, 1.8–3.2 m deep, carved by the flow-accumulation field, converging toward the delta at `(560, 900)`. These force swimming.
- **Hummocks**: the 60 dry mounds from Section A, Y 3–6, each 8–22 m across. These are the fighting positions. Everything else is a movement penalty.
- **Mud flats** at the water margins: a 0.3 m deep band applying a ×0.75 move speed and leaving visible footprint decals that persist 90 s. Tracking players through mud should be possible.
- **Peat bog patches**: 12 areas, 15–30 m across, where movement is ×0.5 and jumping is disabled. Visually distinct — darker `#33351F` with surface scum.

## E.2 Vegetation — the defining feature

| Species | Count | Height | Canopy | Distribution |
|---|---|---|---|---|
| Bald cypress | 620 | 18–28 m | 6–10 m | In water and margins. Flared buttressed trunk 2.5–4 m wide at base — **this is cover**, make the base collision real |
| Cypress knees | 3,400 | 0.4–1.4 m | — | Clustered around each cypress within 8 m. Crouch cover, and they break sightlines at prone/crouch height |
| Tupelo | 380 | 12–20 m | 5–8 m | Mixed with cypress |
| Dead snags | 240 | 8–22 m | none | Bare vertical trunks, some leaning at 15–40°, some fallen and walkable |
| Palmetto | 2,800 | 1.2–2.2 m | 2 m | On hummocks and margins. Dense sight blocker at standing height |
| Cattails / reeds | 9,000 | 1.6–2.4 m | — | In water 0.2–0.8 m deep, in beds of 20–200. Full concealment while crouched |
| Hanging moss | on 40% of trees | 1–4 m drape | — | Vertical drape geometry, no collision, heavy visual noise |
| Duckweed mats | 90 patches | surface | 6–20 m | Bright `#6E8F3E` surface scum, breaks the water read |
| Floating logs | 160 | 4–9 m long | — | Walkable, slight bob animation, some form makeshift bridges |

Canopy coverage should be **60–75%** across the biome, which means the swamp is genuinely darker — reduce ambient light by 35% under canopy and add dappled light patches.

## E.3 Structures

**The Boardwalk Network.** 1.4 km total of elevated walkway at Y 2.8, 2.4 m wide, wooden, on pilings every 4 m, with handrail on one side only. Branches at 11 junctions, reaching seven of the swamp's structures. **Fourteen collapsed sections** create gaps of 1.5–4 m requiring jumps, and three sections have collapsed entirely, forcing a detour or a swim. Boardwalk footsteps are loud — audible at 50 m — making it fast but announcing your position. This tradeoff is the heart of swamp movement.

**Blackroot Chapel** `(430, 620)`. A half-sunken church, floor flooded to 0.9 m, listing 6°, roof partially collapsed with light shafts, bell tower still standing to Y 19 with an interior ladder. The map's most memorable single structure — make the silhouette distinctive through fog.

**Stilt Village** `(340, 700)`. Fourteen shacks on pilings at Y 3.5–5, connected by rope-and-plank walkways at varied heights, corrugated roofs `#6B6257`, single-room interiors with a window on each face. Ladders from the water to five of them. A close-quarters vertical fight space with no hard cover — everything is `thin`.

**The Grounded Barge** `(600, 780)`. 62 m steel barge run aground and half-submerged, listing 12°. Three interior compartments accessed through deck hatches, a wheelhouse at Y 11, engine room flooded to 1.4 m. Rust palette `#7A4A32` over `#4A4E52`.

**Cypress Mill** `(250, 450)`. Abandoned sawmill: main shed 40 × 22 m with a partially collapsed roof, log pond, conveyor at 20° rising to a hopper at Y 12, stacked timber (walkable, forming stepped cover), an office annex, and a 24 m smokestack. On dry ground — the swamp's northern anchor and a natural rotation point toward the Interchange.

**Airboat Docks** `(520, 520)`. Six covered slips, fuel drums, a repair shed, and a raised office. Three airboats present as static geometry (or drivable, if vehicles exist).

**Hunting Blinds.** 18 scattered elevated stands, Y 4–7, single-ladder access, 2 × 2 m platform with a 1.1 m rail, roofed. Excellent sniper nests, terrible escape routes.

**The Sunken Highway** `(200, 340)` to `(400, 480)`. A 300 m section of old road that the swamp reclaimed — asphalt visible under 0.4 m of water, guardrails half-drowned, six abandoned vehicles with only their roofs above water. A recognizable navigation line through featureless terrain.

## E.4 Atmosphere

Swamp-local fog: exponential-squared, density 0.011, color `#5A6350`, starting at 30 m and near-total by 140 m. Add a low-lying ground mist plane at Y 2.2, 3 m thick, scrolling slowly — players crouched in it are substantially concealed. Insect particle swarms (small, dark, 200-particle systems) at 30 locations. Ambient audio: frogs, insects, water lapping, occasional distant bird calls, with a lowpassed and reverbed profile distinct from every other biome.

**HOW TO TEST:** Visibility in open swamp is under 100 m. I can cross the biome entirely by boardwalk with jumps, or by water at a heavy speed cost. Cypress trunks stop bullets. Reeds conceal a crouched player at 20 m. The chapel silhouette is identifiable through fog from 120 m.

---

# SECTION F — Ashfall Range (Mountains)

Long sightlines, extreme verticality, punishing rotations. Footprint roughly `(−1000, −1000)` to `(−280, −220)`. Y 55 to 185.

## F.1 Terrain features

The erosion pass from Section A does the heavy lifting. Add these authored features on top:

**Ridgelines.** Three primary ridges radiating from Ashfall Peak `(−660, −690)`: southeast toward the suburbs, east toward the map center, and south. Ridge crests are 8–20 m wide walkable spines with drops on both sides — the fastest but most exposed mountain routes.

**Cliff bands.** Six vertical rock faces, 15–45 m tall, generated by clamping slope above 70° and applying a stratified rock material with horizontal banding every 2–4 m (`#5D5B58` / `#6E6A64` alternating). Cliffs are impassable and must read as impassable from a distance — no ambiguity about whether a route goes through.

**Talus slopes** below each cliff band: scree material, angle 33°, with 400–900 scattered boulders each (0.4–2.5 m). Boulder collision is real, and larger ones are mantle-able. Movement on scree applies ×0.85 speed and a distinct loud footstep.

**The Cirque** `(−520, −520)`. A glacial bowl holding the mountain lake at Y 62. Steep walls on three sides, open to the east where the river exits. Lake is 220 m across, up to 14 m deep, swimmable with a shore path.

**Ashfall Gorge** `(−400, −450)`. The upper river gorge, 18 m deep vertical rock walls, 30 m wide, crossed only by Ironspan bridge. A creek path runs along the gorge floor — a hidden low route with zero escape options.

**Boulder fields.** Two areas, `(−780, −450)` and `(−450, −800)`, each 180 × 140 m of house-sized boulders (3–9 m) with walkable tops and a maze of gaps below. Two-level combat space.

**Snow.** Above Y 138. Snow footsteps are loud and leave persistent trails (decals lasting 120 s) — players can be tracked across snowfields. Above Y 160, add a light drifting snow particle effect and reduce visibility with fog density 0.006.

**Avalanche chute** `(−600, −560)`. A 40 m wide, 220 m long, 38° snow slope that players can **slide down** at speed — entering it at a sprint and crouching triggers a controlled slide reaching 24 m/s, dropping 90 m of elevation in about 12 seconds. A one-way high-speed rotation off the mountain. It must be visibly distinct: smooth snow with debris cones at the base.

## F.2 Structures

**Ashfall Observatory** `(−620, −660)`, Y 168. The summit POI. A 22 m diameter dome (openable slit showing an interior telescope), attached three-story research building, an equipment yard, and a helipad. Interior: control room, dormitory wing, generator room in a partial basement, and a catwalk ring inside the dome at Y 178. Best sightlines on the map — from the dome you can see the city skyline, the Interchange, and on clear settings the swamp fog line.

**Timberline Lodge** `(−480, −520)`, Y 118. Three-story A-frame ski lodge, 46 × 26 m, with a double-height great room, a stone chimney (climbable exterior for a skilled route to the second-floor balcony), a wraparound deck at Y 121, a basement equipment room, and a detached bunkhouse. Rustic palette: `#6B5943` timber, `#4A4744` roof, `#7A756E` stone.

**The Aerial Tramway.** From a base station at `(−400, −340)`, Y 72, to the summit station at `(−600, −640)`, Y 160. Two towers at Y 96 and Y 128, both climbable via a maintenance ladder to a small platform. Two cabins, each 4 × 3 m, stopped mid-line — one at tower 1, one 40 m from the summit, both enterable via a roof hatch from the cable (a genuinely dangerous traversal route). The cable itself is walkable geometry with a 0.35 m width, which is a real risk/reward line for players who commit.

**Ashfall Mine** `(−800, −620)`, entrance at Y 108. An underground network: a main adit 4 m wide running 180 m in, three branch drifts, two vertical shafts with ladders connecting three levels (Y 108, Y 88, Y 70), an ore cart rail with carts as cover, timber supports every 6 m, and a **second exit** emerging at `(−720, −480)`, Y 74. Pitch dark except for scattered emissive work lights — the only place on the map where a flashlight would matter, so consider whether to add one.

**Ranger Station** `(−400, −760)`, Y 96. Small: a cabin, a garage with a snow vehicle, a fuel store, and a 14 m fire lookout tower with an enclosed cab and an exterior stair.

**Radio Relay** `(−760, −280)`, Y 122. Three lattice towers, 30–48 m, climbable to platforms at 18 m and 34 m. Two equipment sheds, a satellite dish 8 m diameter, and a fenced compound.

**Switchback ruins.** Along the mountain road: two collapsed retaining walls, an overturned truck blocking half a hairpin, a small avalanche shelter (concrete half-tunnel, 40 m), and three roadside pullouts with guardrail and a viewpoint sign.

## F.3 Alpine vegetation

| Species | Zone | Count | Notes |
|---|---|---|---|
| Douglas fir | Y 55–125 | 4,200 | 18–34 m, dense conical canopy, real trunk collision |
| Subalpine fir | Y 110–145 | 1,600 | 8–16 m, narrow spire form |
| Krummholz | Y 138–158 | 900 | 0.8–2.5 m, twisted, wind-flagged, low sight blockers |
| Aspen stands | Y 70–100 | 1,100 | In 9 clusters, pale trunks `#C9C4B2`, visually distinct groves |
| Deadfall | all | 700 | Fallen trunks, walkable, vaultable |
| Boulder / rock scatter | all | 5,000 | Instanced, 0.3–3 m |
| Shrub / huckleberry | Y 60–130 | 3,800 | 0.5–1.2 m |

**Tree line at Y 145.** Above it, bare rock, scree, snow, and krummholz only. The tree line must be visible as a clean band from across the map — it's a primary distance cue.

**HOW TO TEST:** I can reach Ashfall Peak by road, by ridgeline, and by the tramway. The avalanche chute slide works and deposits me safely at the base. The mine has two working entrances and connects three levels. From the observatory I can see the city towers. No cliff face is accidentally climbable.

---

# SECTION G — Transition Zones, Detail Pass, and Atmosphere

## G.1 The transition zones (do not skip these)

The 60 m biome blends handle terrain, but the **props must blend too** or the map reads as four separate maps glued together. Author four transition bands:

**Mountains → Suburbs** (around `(−520, 60)`): foothill farmland. Four farmsteads with barns (enterable, hay loft at Y 5), silos (climbable exterior ladder, 14 m), equipment sheds, tractors, irrigation pivots, and 6 fenced fields of low crops. Dirt tracks connect them. Fir gives way to scattered oak.

**Suburbs → Swamp** (around `(−80, 500)`): a river-bottom lowland. Drainage ditches, a trailer park of 22 units on a gravel loop, a scrapyard with stacked cars 4 high (climbable), and increasingly waterlogged fields with standing water and dead grass.

**Swamp → City** (around `(700, 320)`): industrial fringe feeding into Kestrel Docks. Warehouses, a water treatment plant with three circular clarifier tanks 22 m diameter (walkable rims and center bridges), a substation with transformers and pylons, and a rail yard.

**City → Mountains** (around `(150, −520)`): open agricultural plateau and low hills. Long sightlines, sparse cover — the most dangerous rotation on the map. Give it a windbreak tree line, three grain silos, an irrigation canal (1.5 m deep, usable as a crawl trench for 400 m), and a single roadside motel with 12 units.

## G.2 Global vegetation and scatter budget

| Category | Total instances | Note |
|---|---|---|
| Trees (all species) | 14,800 | LOD: full mesh <60 m, simplified <140 m, billboard <450 m |
| Shrubs / undergrowth | 22,000 | Culled beyond 90 m entirely |
| Grass tufts | 180,000 | Instanced, only within 60 m of camera, fade in over the last 10 m |
| Rocks / boulders | 9,400 | |
| Vehicles | 260 | |
| Street / yard props | 6,800 | |
| Loot spawn markers | 2,400 | See G.5 |

Place all vegetation with **Poisson-disc sampling per biome**, using per-species minimum spacing, then reject any point within 3 m of a road, 2 m of a building footprint, or on slope > 42°.

## G.3 Time of day and lighting

Pick **one** fixed lighting setup and commit — dynamic time of day multiplies shadow cost for no gameplay gain.

Recommended: **late afternoon, overcast-breaking.** Sun elevation 28°, azimuth 215° (from the southwest), so the mountains cast long shadows east across the map and the city towers throw shadows toward the Interchange. Sun color `#FFE8C4` at intensity 2.4. Ambient/hemisphere: sky `#8FA6BE`, ground `#5A5344`, intensity 0.75.

Sky: procedural gradient — zenith `#4E76A8`, horizon `#C8B89E`, with three layers of scrolling cloud noise. No skybox texture.

Global fog: exponential, color `#A8AEB0`, density 0.0016, plus the biome-local overrides for the swamp and high alpine.

**Per-biome ambient tint** applied as a subtle post-process or hemisphere light color shift, blended on the biome mask:
- Mountains: cool, `#A8BCD4`, slightly desaturated, higher contrast
- City: neutral-cool, `#B4B8BE`, higher specular
- Suburbs: warm neutral, `#D4C8AC`
- Swamp: green-desaturated, `#8A9E7E`, lifted blacks (haze)

## G.4 Audio zones

Assign each biome an ambient bed, procedurally generated, crossfading over the 60 m blend bands: mountain wind (filtered noise, pitch varying with elevation, stronger above Y 140), city ambience (distant low hum, occasional metal creaks), suburban (birds, faint wind through leaves, insect chatter), swamp (frogs, insects, water). Add **reverb zones**: heavy in the subway, mine, tunnels, and gym; medium in warehouses, the chapel, and parking structures; none outdoors.

## G.5 Loot density map

Recalibrate spawn density per zone. Values are relative multipliers against the Phase 3 base rate:

| Zone | Multiplier | Character |
|---|---|---|
| Meridian City core | 2.6 | Highest risk, best loot, worst escape |
| Kestrel Docks | 2.0 | |
| Ashfall Observatory | 1.9 | Isolated jackpot |
| Cedar Hollow Elementary | 1.8 | |
| Construction sites | 1.7 | |
| Subway stations | 1.6 | Safe-ish, good loot |
| Stilt Village / Chapel | 1.5 | |
| Hollow Plaza | 1.4 | |
| Suburban houses | 1.1 | High total volume, low per-building |
| Timberline Lodge | 1.3 | |
| Ashfall Mine | 1.3 | |
| Farmsteads / transition | 0.9 | |
| Open swamp | 0.4 | |
| Open mountain | 0.3 | |
| Highway / roads | 0.5 | Vehicle-adjacent only |

## G.6 Zone (circle) placement bias

With four biomes of very different character, unbiased circle placement produces unplayable finals. Constrain final zones:

- Zones 1–4: unrestricted within the playable radius.
- Zone 5–6: reject any center where terrain slope at the center exceeds 25° or where the circle is more than 60% water.
- Zone 7–8: must center on ground with at least 30% cover density within 60 m. Weight toward: the Interchange, Cedar Hollow, the city plateau edge, the mountain lodge bench, and the swamp's larger hummock clusters. Explicitly exclude Ashfall Peak, the open agricultural plateau, and the deep swamp channels — finals there are coin flips, not fights.

## G.7 Named location labels

Every one of these must appear on the in-game map and on the compass bar when within 120 m:

Meridian City · Kestrel Docks · The Interchange · Cedar Hollow · Hollow Plaza · Cedar Hollow Elementary · Fuel & Go · Riverside Church · Water Tower · Blackroot Swamp · Blackroot Chapel · Stilt Village · Cypress Mill · Airboat Docks · The Sunken Highway · Ashfall Range · Ashfall Peak · Ashfall Observatory · Timberline Lodge · Ashfall Mine · Radio Relay · Ranger Station · The Cirque · Ashfall Gorge · Ironspan · Mill Bridge · Highway 9 Viaduct · The Causeway · Foot Trestle · Northfield Farms · Trailer Row · The Scrapyard · Water Treatment · Roadside Motel

---

# SECTION H — Validation and Optimization

Run these checks and report results. Fix anything that fails before calling the map done.

## H.1 Automated validation

Write a `validateWorld.js` script that runs at build time and reports failures:

1. **Floating geometry:** every building footprint corner is within 0.15 m of terrain height. Report any object whose lowest vertex is more than 0.3 m above terrain.
2. **Buried geometry:** no building's ground floor is more than 0.5 m below terrain at any footprint point.
3. **Intersection:** no two building bounding boxes overlap. No building intersects a road corridor.
4. **Reachability:** flood-fill a navmesh from 12 seed points spread across the map. Report any interior floor area not reachable. Every building interior must be in the connected set.
5. **Roof access:** for every building over 2 floors, confirm a path exists from ground to roof.
6. **Loot spawn validity:** every spawn point is within 0.4 m of a walkable surface, not inside geometry, and reachable.
7. **Terrain holes:** raycast down on a 4 m grid across the whole map; report any ray that hits nothing.
8. **Zone playability:** simulate 500 zone-8 placements and report the percentage that land on water or slope > 25°.

## H.2 Performance validation

Fly a scripted camera path through all four biomes, the subway, the mine, and the city rooftops, sampling every 60 frames. Report min/avg/max for FPS, draw calls, triangles, and memory. Targets:

| Metric | Target | Hard fail |
|---|---|---|
| FPS (integrated GPU, 1080p) | ≥ 60 avg | < 45 min |
| Draw calls | ≤ 700 avg | > 900 peak |
| Triangles | ≤ 3.5M avg | > 4.5M peak |
| Cell load hitch | < 4 ms | > 12 ms |
| Total heap | < 900 MB | > 1.4 GB |

If the city fails the draw call budget, the fix order is: merge static building geometry per block into a single mesh, then reduce facade material variants, then cut interior partition detail on floors above 6 — **not** reduce building count.

## H.3 Gameplay validation

Play-test checklist, verified manually:

- Longest unbroken sightline on the map is between 380 m and 450 m (should be the Highway 9 Viaduct or an observatory-to-city line). Anything over 600 m makes snipers oppressive.
- Rotation time from any POI edge to any adjacent POI edge on foot: 55–110 seconds. Report actuals for all six adjacent pairs.
- Every POI has at least **three** distinct approach routes, at least one of which is concealed.
- No POI can be fully covered by a single sniper position.
- Cover density in the four transition zones is high enough that a player crossing has a usable route — walk each transition and confirm you're never in the open for more than 12 seconds.

**HOW TO TEST:** All validation checks pass with zero hard failures. The scripted flythrough holds the performance budget. I can complete a full match without encountering a hole in the world.
