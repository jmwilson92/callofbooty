# Building the map from the maps3d capture

The Unreal map is generated from one file: a glTF capture of real San Diego,
about 13 km across, with a TIN for the terrain and separate groups for roads,
water, land cover and buildings. Everything below reads that capture and writes
into `out/`, which is copied into `callofbootyunreal/Tools/Heightmaps/`.

Run them in this order. The order is not a style preference — each step reads
what the one before it wrote.

| # | Script | Writes | Why it must be here |
|---|--------|--------|---------------------|
| 1 | `maps3d-terrain.mjs` | `sandiego.r16`, `sandiego.png`, `sandiego.json` | Fixes the frame: 17.187 km square, the capture centred, a 2 km out-of-bounds ring around it. Every later step reads the frame out of the sidecar and none of them recompute it. |
| 2 | `maps3d-city.mjs` | `city.json`, `city-buildings.bin`, `city-structures.bin` | 67,626 parts from 63,985 buildings. Every building in the capture is a flat-topped extrusion of a polygon, so the footprint is a min-area rectangle over the roof outline — except where that fits badly, when it is cut along its long axis and each half fitted again. Also writes one record per building — footprint before the cut, archetype, storeys, tier, seed — because the grouping exists only here and cannot be recovered from the parts buffer. See `docs/07-map-architecture.md`. |
| 3 | `maps3d-surfaces.mjs` | `sandiego-surfaces.png` | One RGB ground map: R road class, G land cover, B water. The landscape material samples it by world position. |
| 4 | `maps3d-roads.mjs` | `roads.json` | Road centrelines recovered from the road surfaces by thinning: 10,822 runs, 2,329 km, each with a measured width — including 442 km of footpath, which the class list simply did not mention until it was checked against the capture's own node list. Three things had to be right before that number stopped being 1,067 km — see the note below. |
| 5 | `maps3d-roadmesh.mjs` | appends to `city-buildings.bin`, rewrites the heightmap | Grades the corridors flat, then builds carriageway, lane markings, kerbs, signs, street lighting, junction boxes, stop bars and crossings on top of them. |
| 6 | `maps3d-water.mjs` | rewrites the heightmap, appends to `city-buildings.bin` | Digs the water: bathymetry the capture does not have, since its water surfaces come back as ground 3.5 m above datum. **Must run after 5** so the road carve is already in the heightmap it reads. Also gives the inland bodies their own water surface: the ocean actor is one plane at Z=0, so it covers the tidal water and nothing else, and the San Diego River sits 6 to 11 m up. |
| 7 | `maps3d-bridges.mjs` | appends to `city-buildings.bin` | Builds the bridges: ramped deck, markings, parapets and piers. **Must run after 6** — a part's elevation is relative to the terrain under it, so a bridge built before the dig sinks with the bed it spans. |
| 8 | `maps3d-vegetation.mjs` | appends to `city-buildings.bin` | Scatters trees, shrubs and rocks from the land cover, and street trees along the verges. Reads the buffer to find the buildings, so it runs after 2 and 5. |
| 9 | `maps3d-doors.mjs` | rewrites `city-structures.bin` | Gives every building an entrance and tells it what the ground under it does: nearest street, which face of the footprint it is on, and the graded elevation at the door and across the plan. **Must run after 6** — it samples the finished heightmap, and a door placed before the water dig sits at the wrong height. Rewrites the record in place; base fields are copied through untouched, so re-running is safe. |
| 10 | `maps3d-airfields.mjs` | rewrites the heightmap, appends to `city-buildings.bin` | **The only authored geometry in the pipeline.** The capture has no aeroway node of any kind — not even an empty group, unlike `Roads_Rail` and the rest — so KSAN's runway 09/27 and North Island's 18/36 and 11/29 do not exist to be recovered and are laid from published airfield data instead. A runway is stated as a midpoint, a published length and its **magnetic** designator; the true heading is the designator plus San Diego's 11 deg east declination. Stating both thresholds by hand instead left every strip several degrees off its real alignment. Taxiways are perpendicular offsets from their runway, so they cannot drift out of parallel. Grades each strip flat to a least-squares fit of the ground beneath it, clamped to the 1% a runway is allowed, then paves, marks and lights it. **Must run after 6** for the same reason the doors pass does. Also flags **every part** standing on runway or taxiway pavement as **cleared** (flag 8) rather than deleting it — deleting one would shift every index after it and the structure record addresses parts by index. Aprons are not cleared for: apron pavement is laid under whatever is already there, because an apron is the lowest-confidence geometry on the map and the buildings are real. Aprons are not placed by hand — the table gives a hint and the script searches outward from it for ground that clears every runway, sits on the fewest buildings, is on the taxiway's side of the runway, and is not in the bay. Correct the alignments in the `AIRFIELDS` table, not in code. |
| — | `structgraph.mjs` | nothing | Not a step. The reference implementation of the structural graph — columns, slabs, wall panels, the circulation core, and the load-path solve that decides what collapses. Derived from the record and a seed, never stored, because the server and every client have to build the identical graph from the same 88 bytes. Whatever builds this in the engine must agree with it index for index. |
| — | `maps3d-struct.mjs` | nothing | Runs the graph over all 63,985 records and prints the evidence: 7.69 M elements, 1.92 MB of damage state, determinism, collapse behaviour, and the two-round fixed point. Exits non-zero if the fixed point is ever missed. |
| — | `interior-a.mjs` | nothing | Not a step. The Tier A generator — a lift core taken from the structural graph, fire stairs, a lobby, escalators, and a corridor cross running out to all four facades with rooms in the four quadrants off it. Derived from the seed, never stored. |
| — | `interior-b.mjs` | nothing | Not a step. Tier B, which is two generators: a spine corridor with units either side for the 8,146 midrises, and one open volume with racking, a mezzanine and roller doors for the 804 warehouses. |
| — | `interior-c.mjs` | nothing | Not a step. The Tier C interior generator — rooms by binary partition, one door per partition wall so the plan is connected by construction, a stairwell chosen once and never cut through, windows, and furniture by room type. Derived from the seed, never stored. |
| — | `maps3d-interior.mjs` | `interior-plan.png` with `--plan` | Runs a tier over the map and prints the budget and the kit list in the order pieces should be modelled. `--tier C` (default) does 53,595 buildings at 6.10 M instances, `--tier B` 8,950 at 1.86 M, `--tier A` 1,141 at 1.48 M. Checks connectivity the way each tier is built — `rooms == walls + 1` for the tree, every room on an arm or an open zone for the cross — and exits non-zero if a room is ever sealed off. |
| — | `maps3d-preview.mjs` | `terrain-shaded.png` | Not part of the build. Shades the result the way the Unreal landscape material shades it and draws the packed buffer over the top, so a defect shows up here rather than in the editor. `--span 900 --centre 0.70,0.52 --name closeup` windows in on a few blocks. |

```sh
node tools/maps3d-terrain.mjs  capture.glb --out out
node tools/maps3d-city.mjs     capture.glb --sidecar out/sandiego.json --out out
node tools/maps3d-surfaces.mjs capture.glb --sidecar out/sandiego.json --out out
node tools/maps3d-roads.mjs    capture.glb --sidecar out/sandiego.json --out out
node tools/maps3d-roadmesh.mjs --out out
node tools/maps3d-water.mjs    capture.glb --out out
node tools/maps3d-bridges.mjs  --out out
node tools/maps3d-vegetation.mjs --out out
node tools/maps3d-doors.mjs    --out out
node tools/maps3d-airfields.mjs --out out
node tools/maps3d-preview.mjs  --out out
```

## Recovering a centreline from a surface

Three stages sit between a road surface and a centreline — rasterise, thin,
trace — and each of them can lose the road without any stage reporting a
problem. All three did, and the symptom was the same every time: a road that
was plainly in the capture came out of the pipeline as nothing.

- **Rasterising interiors only misses thin geometry.** Some of what the capture
  calls a road is not a filled ribbon; a bridge deck is two edge strips a few
  metres apart. At 2 m a pixel those sample to a dotted line. Triangle edges are
  drawn as lines, so a sliver always comes out connected.
- **The skeleton of a hollow ribbon is its two edges, not its centre.** Classes
  can declare a `closePx`, and the mask is closed before the distance transform.
- **A thinned diagonal is a staircase.** Its ordinary points have three
  8-neighbours, so counting neighbours and calling three a junction stops the
  walker every few pixels on any road not aligned to the raster — the fragments
  then fall under the length floor and are discarded. Junctions are found with
  the crossing number instead: 0-to-1 transitions once around the ring, which is
  1 at an endpoint, 2 on a curve and 3 or more at a real branch, whatever the
  orientation. This one alone was worth 500 km of road.

`--debug <class>:<u0,v0,u1,v1> [--debugScale N]` dumps the raw mask, the closed
mask and the skeleton for one class over one window as a PNG, with sample counts
for each. Use it before theorising about a missing road. A clean skeleton with
no traced runs on it points at the walker; an empty mask points at the
rasteriser.

## What the capture actually contains

Every node has now been enumerated and counted. This is the list, so that nobody
plans work against something that is not there — and so that nobody goes looking
twice for something that is.

| Node | Triangles | What it is |
|------|-----------|------------|
| `tinMesh` | — | The terrain. Horizontal axes are Web Mercator, vertical is true metres. No bathymetry: water surfaces come back as flat ground 3.5 m above datum. |
| `Buildings` | 63,985 children | One primitive each, exactly two Y levels — flat-topped extrusions of polygons. No pitched roofs, no multi-level massing. 134 of them have no height at all. |
| `Roads_Arterial` | 35,603 | |
| `Roads_Collector` | 56,835 | |
| `Roads_Local` | 75,253 | |
| `Roads_Service` | 89,454 | |
| `Roads_Paths` | 118,494 | The largest road class in the capture, and the last one anybody thought to look for. 442 km. |
| `Roads_Bridge` | 29,425 | Stored as two thin edge strips, not a filled ribbon. |
| `Roads_Rail`, `_Ferry`, `_Tunnel`, `_Sidewalk`, `_Crosswalk`, `_Parking` | **0** | Empty. Do not plan work that depends on them. |
| *aeroway of any kind* | **absent** | Not empty — **absent**. There is no runway, taxiway or apron group at all, so both airfields come through as ordinary paved service roads and anonymous boxes. `maps3d-airfields.mjs` authors them. |
| `LandCover_Grass` | 212,080 | |
| `LandCover_Wood` | 67,712 | |
| `LandCover_Urban` | 62,822 | A classification polygon draped on the terrain — 82% of its vertices sit within a metre of the ground, with a symmetric tail either side, which is sampling noise and not structure. There is nothing in it but the colour it already contributes to the surface map. |
| `LandCover_Sand`, `_Rock`, `_Wetland` | 6,728 / 4,628 / 3,440 | |
| `LandCover_Farmland`, `_Ice`, `_Other` | **0** | Empty. |
| `Water` | 11,778 | Surfaces only. Every body is flat; depth is invented by `maps3d-water.mjs`. |

Two things the capture does **not** record, both checked rather than assumed:

- **Grade separation.** Of 316,926 road vertices, 0.76% sit more than 4 m above
  the ground under them and 0.15% more than 8 m — and those are the bridges. In
  plan view a flyover and a crossroads are the same picture, so freeway
  overpasses cannot be recovered or inferred, and are not built.
- **Building height for 134 structures**, covering 0.53 km2. Those are laid as
  pads rather than given an invented height.

## A bug family worth knowing about

Six defects in this pipeline have had the same shape: a hand-kept list or a
literal that stopped matching what is actually built, failing silently while the
count in the log looked healthy. The tracer's class list omitting `Roads_Paths`
(442 km). Two `kinds` literals, one in the road pass and one in the city pass.
A hardcoded `0` written as every part's kind index. A `heightM > 0.4` guard
dropping 299 footprints. A structure list in the planting pass that did not
know about `pad`.

So the rule here is: derive the list from what was built, or list the exclusions
so an unknown case fails safe — and make the script exit non-zero rather than
carry on. `maps3d-roadmesh.mjs` refuses to run on a road class it has no spec
for, `maps3d-surfaces.mjs` counts the triangles of any class it has no code for,
`maps3d-preview.mjs` names kinds it has no colour for, and
`Tools/build_sandiego.py` warns rather than importing a kind as default grey.

## Two things worth knowing before changing any of it

**The horizontal axes of the capture are Web Mercator metres, the vertical is
already true metres.** Multiply X and Z by `cos(32.71128°) = 0.8414` to get
ground metres; the sidecar carries it as `mercatorToGround`. Skip it and the
whole city is 19% too wide, which looks almost right and is not.

**The declared height range is fixed at −10 .. 250 m.** The Unreal import recipe
is derived from it — Z scale is `range × 100 / 512` and the actor lift puts sea
level on Z=0 — so a step that pushes the terrain outside that range invalidates
a recipe the user has already typed into the import dialog. `maps3d-water.mjs`
checks and refuses rather than silently widening it.
