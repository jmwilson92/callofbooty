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
| 2 | `maps3d-city.mjs` | `city.json`, `city-buildings.bin` | 67,240 parts from 63,985 buildings. Every building in the capture is a flat-topped extrusion of a polygon, so the footprint is a min-area rectangle over the roof outline — except where that fits badly, when it is cut along its long axis and each half fitted again. |
| 3 | `maps3d-surfaces.mjs` | `sandiego-surfaces.png` | One RGB ground map: R road class, G land cover, B water. The landscape material samples it by world position. |
| 4 | `maps3d-roads.mjs` | `roads.json` | Road centrelines recovered from the road surfaces by thinning: 10,822 runs, 2,329 km, each with a measured width — including 442 km of footpath, which the class list simply did not mention until it was checked against the capture's own node list. Three things had to be right before that number stopped being 1,067 km — see the note below. |
| 5 | `maps3d-roadmesh.mjs` | appends to `city-buildings.bin`, rewrites the heightmap | Grades the corridors flat, then builds carriageway, lane markings, kerbs and signs on top of them. |
| 6 | `maps3d-water.mjs` | rewrites the heightmap, appends to `city-buildings.bin` | Digs the water: bathymetry the capture does not have, since its water surfaces come back as ground 3.5 m above datum. **Must run after 5** so the road carve is already in the heightmap it reads. Also gives the inland bodies their own water surface: the ocean actor is one plane at Z=0, so it covers the tidal water and nothing else, and the San Diego River sits 6 to 11 m up. |
| 7 | `maps3d-bridges.mjs` | appends to `city-buildings.bin` | Builds the bridges: ramped deck, markings, parapets and piers. **Must run after 6** — a part's elevation is relative to the terrain under it, so a bridge built before the dig sinks with the bed it spans. |
| 8 | `maps3d-vegetation.mjs` | appends to `city-buildings.bin` | Scatters trees, shrubs and rocks from the land cover, and street trees along the verges. Reads the buffer to find the buildings, so it runs after 2 and 5. |
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
