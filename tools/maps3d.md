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
| 2 | `maps3d-city.mjs` | `city.json`, `city-buildings.bin` | 63,686 building footprints, min-area rectangles over the roof outlines. |
| 3 | `maps3d-surfaces.mjs` | `sandiego-surfaces.png` | One RGB ground map: R road class, G land cover, B water. The landscape material samples it by world position. |
| 4 | `maps3d-roads.mjs` | `roads.json` | Road centrelines recovered from the road surfaces by thinning: 7,962 runs, 1,067 km, each with a measured width. |
| 5 | `maps3d-roadmesh.mjs` | appends to `city-buildings.bin`, rewrites the heightmap | Grades the corridors flat, then builds carriageway, lane markings, kerbs and signs on top of them. |
| 6 | `maps3d-water.mjs` | rewrites the heightmap | Digs the water. **Must run after 5**: the road carve grades ground up to meet the deck and does it for bridges too, so run in the other order and the Coronado bridge leaves an embankment across the bay. |
| — | `maps3d-preview.mjs` | `terrain-shaded.png` | Not part of the build. Shades the result the way the Unreal landscape material shades it, so a defect shows up here rather than in the editor. |

```sh
node tools/maps3d-terrain.mjs  capture.glb --out out
node tools/maps3d-city.mjs     capture.glb --sidecar out/sandiego.json --out out
node tools/maps3d-surfaces.mjs capture.glb --sidecar out/sandiego.json --out out
node tools/maps3d-roads.mjs    capture.glb --sidecar out/sandiego.json --out out
node tools/maps3d-roadmesh.mjs --out out
node tools/maps3d-water.mjs    capture.glb --out out
node tools/maps3d-preview.mjs  --out out
```

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
