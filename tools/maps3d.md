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
| 5 | `maps3d-roadmesh.mjs` | appends to `city-buildings.bin`, rewrites the heightmap | Gives every road an elevation profile, carves the ground to it, then builds carriageway, lane markings, kerbs, signs, street lighting, junction boxes, stop bars and crossings on it. |
| 6 | `maps3d-water.mjs` | rewrites the heightmap, appends to `city-buildings.bin` | Digs the water: bathymetry the capture does not have, since its water surfaces come back as ground 3.5 m above datum. **Must run after 5** so the road carve is already in the heightmap it reads. Also gives the inland bodies their own water surface: the ocean actor is one plane at Z=0, so it covers the tidal water and nothing else, and the San Diego River sits 6 to 11 m up. |
| 7 | `maps3d-bridges.mjs` | appends to `city-buildings.bin` | Builds the bridges: ramped deck, markings, parapets and piers. **Must run after 6** — a part's elevation is relative to the terrain under it, so a bridge built before the dig sinks with the bed it spans. |
| 8 | `maps3d-vegetation.mjs` | appends to `city-buildings.bin` | Scatters trees, shrubs and rocks from the land cover, and street trees along the verges. Reads the buffer to find the buildings, so it runs after 2 and 5. |
| 9 | `maps3d-doors.mjs` | rewrites `city-structures.bin` | Gives every building an entrance and tells it what the ground under it does: nearest street, which face of the footprint it is on, and the graded elevation at the door and across the plan. **Must run after 6** — it samples the finished heightmap, and a door placed before the water dig sits at the wrong height. Rewrites the record in place; base fields are copied through untouched, so re-running is safe. |
| 10 | `maps3d-airfields.mjs` | rewrites the heightmap, appends to `city-buildings.bin` | **The only authored geometry in the pipeline.** The capture has no aeroway node of any kind — not even an empty group, unlike `Roads_Rail` and the rest — so KSAN's runway 09/27 and North Island's 18/36 and 11/29 do not exist to be recovered and are laid from published airfield data instead. A runway is stated as a midpoint, a published length and its **magnetic** designator; the true heading is the designator plus San Diego's 11 deg east declination. Stating both thresholds by hand instead left every strip several degrees off its real alignment. Taxiways are perpendicular offsets from their runway, so they cannot drift out of parallel. Grades each strip flat to a least-squares fit of the ground beneath it, clamped to the 1% a runway is allowed, then paves, marks and lights it. **Must run after 6** for the same reason the doors pass does. Also flags **every part** standing on runway or taxiway pavement as **cleared** (flag 8) rather than deleting it — deleting one would shift every index after it and the structure record addresses parts by index. Builds runways and parallel taxiways only — aprons are left to be placed by hand. Correct the alignments in the `AIRFIELDS` table, not in code. |
| 11 | `maps3d-clearroads.mjs` | rewrites `city-buildings.bin`, `city.json` | Takes the buildings out of the roads. Footprints and centrelines are traced by different passes and nothing ever asked whether they disagreed, so a building over a carriageway was simply extruded through it — 2.2% of every metre of the network. Flags a footprint carrying 8 m or more of centreline through it, with **flag 8** rather than deleting, because the structure record addresses parts by index. **Must run last**, after every pass that can add a drivable surface. |
| — | `road-audit.mjs` | nothing | Not a step. Walks all 2,043 km of built centreline and reports BREAKS, BLOCKED and BURIED, with ready-made `flyover.mjs` cameras for the worst of each. Exits non-zero over 0.5% of the network without carriageway. |
| — | `flyover.mjs` | `shots/*.png` | Not a step. Renders the shipped bytes in perspective, so a defect can be seen without opening the editor. |
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
node tools/maps3d-clearroads.mjs --out out
node tools/maps3d-preview.mjs  --out out
node tools/road-audit.mjs      --out out
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

## Looking at it, without Unreal

Every defect that has survived this pipeline was one no count could show. The
aprons on the wrong airfield, the road that stepped 105 cm, the three ramps on
MCRD land, the flight lines that were not in the buffer at all — each passed its
assertions, printed a healthy log, and was caught by a human opening the editor.

`tools/flyover.mjs` renders the shipped bytes in perspective so that stops being
a human's job:

```
node tools/flyover.mjs --out out --list              # named places
node tools/flyover.mjs --out out --find runway       # where a kind actually is
node tools/flyover.mjs --out out --place ksan --eye 260 --look 100
node tools/flyover.mjs --out out --shots shots.json --only runway,taxiway
```

It reads `city.json`, `city-buildings.bin` and `sandiego.r16` — the same files
copied into `Tools/Heightmaps`, not a parallel description of them — and
transcribes `build_sandiego.py`'s placement arithmetic field for field: same
sink rule, same water rule, same cleared-flag skip, same palette. If the two
ever disagree the render is a lie, so they are kept side by side deliberately.

About three seconds a shot. There is no GPU, so WebGL runs on SwiftShader;
`--radius` bounds how much world is sent, because drawing all 1.57 M parts to
photograph one street corner is how this becomes an hour a shot. On a machine
whose Playwright build does not match its browser cache, set `CHROME_PATH`.

**What it proves:** where a part is, how big it is, which way it points, whether
it stands on the ground or floats, whether it intersects something it should
not. That is the whole class of bug this project keeps producing.

**What it cannot prove:** anything the engine owns — materials, lighting, LOD
popping, HISM cull distances, collision, streaming. The ground renders as flat
green because the landscape material is not run here; `maps3d-preview.mjs` is
the tool for that question. If flyover looks right and the editor does not, the
fault is on the Unreal side, which is a much smaller place to look.

Two traps it now guards against, both hit on the first run:

- **Places are latitude and longitude, never u,v.** The first table was
  hand-picked in u,v and every entry was wrong — KSAN by 740 m, which put the
  camera in a suburb looking at nothing and would have been reported as "the
  runways are still missing".
- **A place outside the playable area fails the run.** Out-of-bounds ring
  terrain renders as an empty green field, which is indistinguishable from a
  thing that was never built. This is how the `kearny` entry was caught: Kearny
  Mesa is 12.6 km north of centre and this capture is ±5.9 km, so that POI
  belongs to the synthesised world in `src/world/geo`, not to this one.

## Buildings in the road

Nothing in this pipeline ever asked whether a building was standing in a road.
The capture supplies footprints and centrelines separately, different passes
trace them, and where they disagree the building is extruded straight through
the carriageway. Measured against the line the decks are actually laid on that
was 2.2% of every metre of the network.

`tools/maps3d-clearroads.mjs` runs last, after every pass that can add a
drivable surface, and flags a footprint carrying 8 m or more of centreline
through it. Eight metres, not one: a garage clipping a driveway is a tolerance
problem, eight metres of road inside a building is a building in the road. It
took BLOCKED from 2.23% to 0.20% by clearing 1,365 footprints over 239 ha.

It **flags with bit 8 rather than deleting**, for the reason
`maps3d-airfields.mjs` does: `city-structures.bin` addresses parts by index, so
removing one silently reassigns every interior after it.

Fourteen of the cleared footprints are over 2 ha, the largest carrying 2.4 km of
road through a 598 x 88 m building. A road through a footprint that big is
better read as the two tracers disagreeing than as a building in the street, and
those are called out in the log rather than deleted quietly.

## Auditing every road, not the ones a camera faced

`tools/flyover.mjs` can photograph any corner of the map, but there are 10,822
road runs and 2,020 km of centreline: looking at all of it one frame at a time
is not a plan. Measuring all of it takes about a minute.

```
node tools/road-audit.mjs --out out --json audit.json
node tools/flyover.mjs   --out out --shots audit.json   # look at the worst
```

It walks every centreline at 2 m and asks the three questions a road can fail —
BREAKS (is there carriageway under every metre), BLOCKED (is a building
standing in it), BURIED (is terrain above the surface) — then writes ready-made
cameras for the worst of each, because a finding nobody looks at is a finding
nobody fixes. More than 0.5% of the network without carriageway fails the build.

Three ways this audit lied before it was trusted, all worth knowing because
they are the shape of measurement bugs generally:

- **Counting legitimate absences.** A centreline over water has no deck on
  purpose — `maps3d-bridges.mjs` builds one on piles after the bay is dug.
  Counting those buried the real breaks under 1,046 fake ones.
- **Measuring at the wrong place.** BURIED first sampled at the kerb line and
  reported 4.9% of the network. Most of that was roads in cuttings, where
  ground rising at the kerb is a retaining face and entirely correct. Sampling
  inside the carriageway, where wheels go, gives 1.8%.
- **Measuring against the wrong thing.** A slack tolerance is right for "is
  there carriageway near here" and wrong for "is the ground above the deck I am
  on": on a bluff it finds a neighbouring road's deck 20 m below and reports
  21 m of terrain over a road that is fine. BREAKS and BURIED now use different
  tolerances on purpose.

## Roads bury each other, and the last one carved wins

The carve writes each road's profile into the ground one road at a time. That
is right where roads meet at grade and wrong everywhere else: two parallel
carriageways on a hillside get their own profiles, sit at different heights,
and whichever is carved second raises the ground back over the first. On a
freeway it renders as the hillside sawtoothing through the carriageway.

So after every road has carved, one more pass that can only ever **lower** the
ground, and only inside a carriageway. Order stops mattering — a pixel ends up
at or below every deck above it. It moved 969,391 samples, by up to 14.2 m, and
took BURIED from 1.77% to 1.14%.

Where two carriageways genuinely conflict the lower one wins and the upper
road's deck stands proud of the ground. That is what a grade separation looks
like, and it is the honest reading of a capture that cannot tell a flyover from
a crossroads: only 0.76% of road vertices sit more than 4 m above the ground
under them.

## The road knows its own height; the ground does not get a vote

A deck box used to take its elevation from the heightmap under its centre. That
is a 3.2 m raster read serving a 14 m box, nearest-neighbour, on a surface every
other road in the city also writes into — so two consecutive boxes could read
pixels that disagreed, and the road stepped. Adding a pitch field fixed the tilt
but not the disagreement: pitch rotates a box about its own centre, it does not
make its ends meet its neighbours'.

So each road now gets one elevation profile as a function of distance along it,
built once in `buildProfile()`, and everything that road owns — deck, paint,
kerb, lamp, stop bar, crossing — is placed against that profile. The terrain is
carved to match it, at each pixel's own distance along the road rather than at
the nearest 4 m station, so the graded ground is a ramp instead of a staircase.
Consecutive segments share an endpoint height by construction, because they read
the same continuous function at the same station.

The profile is four stages: a ±48 m moving average of the natural ground; a
grade limit; an earthwork bound; and a rounding pass for the crests and sags.
The grade limit is the one that matters. Measured along these centrelines the
natural ground reaches **176%** — a 60° bank that a trail crosses sideways, and
that a raster read turned into an 86° wall. Each class gets the steepest grade it
really carries (8% arterial, 25% footpath), and the limiter runs **last**,
because the rounding pass can carry a difference from a long span onto a short
one and put slope back — which is exactly how 36% grades survived the first
attempt.

Two things are asserted rather than assumed, and both fail the build:

- **No span may exceed its class grade cap.** Catches anything that touches the
  profile after the limiter.
- **Every deck segment must land on its own profile**, to within the 2 cm
  dead-band nudge described below. This is the whole fix as one number: if the
  carve and the placement ever stop agreeing about the ground, the build stops
  rather than shipping a road that steps.

One wrinkle worth knowing: `Tools/build_sandiego.py` reads a base of almost
exactly zero as "this stands on the ground" and sinks it to hide the gap under a
box on a slope. A road deck is not standing on anything, so a base that lands in
that band by arithmetic accident is nudged clear of it — **keeping its sign**,
because flipping −19 mm to +20 mm moves the part 39 mm and was the largest
placement error left on the map.

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
