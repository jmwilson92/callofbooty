# Direction: the architecture the three requirements force

The requirements are fixed:

1. **The map shall be destroyable.**
2. **The map shall have all buildings you can enter.** Skyscrapers have more than
   two storeys. Some homes are one storey, some are two.
3. **The map shall support as many players as needed, in squads of 5–6, to not
   feel empty.**

Taken one at a time each of these is hard. Taken together they are not three
problems, they are one, because all three want the same 63,985 buildings and
they want incompatible things from them. Destruction wants per-building actors.
Interiors want geometry that cannot fit in memory. The player count wants
everything on the wire to be small.

**There is one decision that satisfies all three, and everything else follows
from it: a building stops being an instanced box and becomes a procedural
structure generated on demand from a small record and a seed.**

Nothing about a building's geometry is ever authored, stored at full size, or
sent over the network. The server and every client generate the identical
interior from the same record. What travels is damage.

## The record

Built and in the pipeline as of this document: `maps3d-city.mjs` now writes
`city-structures.bin` alongside the parts buffer — **63,985 records, 14 fields,
3.42 MB**, one per source building, grouping the parts that draw it.

```
partIndex partCount u v rotDeg widthM depthM heightM
storeys floorHeightM archetype tier seed flags
```

The grouping only exists at that point in the pipeline. After `decompose()` cuts
an L-shaped block into two boxes there is nothing in the buffer tying them back
together, and no later pass can recover it. That is why the record is emitted
there and not derived afterwards.

`seed` is a hash of the building's position, so it is stable across rebuilds and
independent of iteration order. That matters more than it looks: it is the whole
reason the server and a client that joined ten minutes apart agree on where the
stairs are.

The archetype is classified from height and floorplate, and the floor-to-floor
height comes from the archetype rather than a single global number — an office
is not an apartment is not a shed, and one number puts eleven storeys in a
warehouse.

| Archetype | Tier | Count | Storeys | Mean | Floor area | Share |
|-----------|------|-------|---------|------|-----------|-------|
| house | C | 48,938 | 97,155 | 2.0 | 14.93 km² | 24.3% |
| highrise | A | 968 | 6,798 | 7.0 | 13.30 km² | 21.6% |
| midrise | B | 8,146 | 31,665 | 3.9 | 13.15 km² | 21.4% |
| warehouse | B | 804 | 1,392 | 1.7 | 7.23 km² | 11.8% |
| tower | A | 173 | 3,340 | 19.3 | 6.68 km² | 10.9% |
| lowrise | C | 4,657 | 9,506 | 2.0 | 6.17 km² | 10.0% |
| pad | — | 299 | 0 | — | — | — |

**61.46 km² of interior floor across 149,856 storeys.** The requirement about
storey counts comes out of the capture's own heights rather than being imposed:
towers average 19.3 storeys and highrises 7.0, so no skyscraper is two storeys;
and the houses land at **11,972 one-storey, 30,180 two-storey, 11,443
three-storey**, which is the mix the requirement asks for without anyone
choosing it.

One thing worth having checked rather than assumed: the capture splits 62
buildings across several nodes each, up to 13, which would have given one
building thirteen disconnected lobbies. **Every one of them is a zero-height
pad.** Every building that has a height is exactly one node, so one record per
node is correct and no regrouping is needed.

## Interiors are generated, never authored

61.46 km² of floor is roughly sixty times the largest interior space any game
has shipped. It is not an authoring problem at any budget. The generator reads a
record and emits, deterministically from the seed: floor slabs at the storey
pitch, a perimeter shell with openings, a circulation core, partition walls, and
props — all from a kit.

The tiers are not a quality setting, they are three different generators:

- **Tier A — 1,141 structures** (towers and highrises, 2% of buildings, 32% of
  the floor). Lift core and stair flights running the full height, a lobby at
  grade, per-floor partition layouts, desks, monitors, planters, escalators
  where the floorplate warrants one. Small enough a human can pass over all of
  them afterwards and fix what looks wrong.
- **Tier B — 8,950 structures** (midrises and warehouses, 29% of the elements).
  Open floorplates, stairs, sparse props, long sightlines. The KSAN terminal and
  the North Island hangars live here.
- **Tier C — 53,595 structures** (houses and low-rise retail, 34% of the floor).
  A door, one to three rooms, windows, a handful of props. Walkable and honest,
  not detailed.

**What people author is a kit, not buildings** — on the order of 150 to 250
pieces: wall and window panels, door units, stair flights, lift cars, desks,
chairs, monitors, shelving, planters. The generator places them. That is the
whole difference between a plan that ships and one that does not.

### Tier C — built

`tools/interior-c.mjs` lays out all 53,595 of them and `tools/maps3d-interior.mjs`
runs it over the map. A floorplate is cut by binary partition, and the split tree
is the plan rather than a by-product: **every internal node is a wall and gets
exactly one door**, so the rooms form a tree and every room is reachable without
any connectivity pass. Doing it any other way ends with a bedroom nobody can get
into, and at 53,595 buildings nobody would ever find it. The harness asserts
`rooms == walls + 1` on every level as the standing proof.

| | |
|---|---|
| Instances | **6.10 M**, 114 per building, 828 worst |
| Rooms | 800,848 — 7 per level at p50, 22.4 m² at p50 |
| Generation | 26 µs a building |
| Kit pieces | **39 distinct** |

The heaviest pieces, which is the order they should be modelled in: 1.13 M wall
partitions, 1.13 M interior doors, 981 K windows, 615 K shelves, 449 K chairs.

**6.10 M is not a runtime number.** Nothing is stored — each building is laid out
on stream-in from its seed, so what has to fit is 114 instances per building
times however many buildings are resident, not six million of anything.

Three things the run settled that guesswork had wrong:

- **A dwelling and a shop are not the same problem.** One room per 17 m² for both
  put eleven rooms in a house and chopped a retail unit into cubicles. At 22 m²
  for a house and 48 m² for a shop the house gets seven and the shop keeps an
  open floor with a back of house — and that open floor is the only large
  interior space Tier C has, which is where a fight needs somewhere to happen.
- **Windows at one per 3.2 m of wall made them 17% of every instance on the map**
  and gave a semi-detached sixteen a floor. That is a glazed band, not a house.
  One per 5 m.
- **The stairwell has to be chosen once for the whole building**, before any
  level is partitioned, and no wall may cross it. Laid out per floor, the
  upstairs opening lands on a partition and the stairs arrive into brickwork —
  plainly wrong in a plan and invisible in every count.

And what it found about the ground, which the record made possible: of the
53,595, only **7,656 sit level**. **30,897 need a plinth** on the low side of up
to 1.2 m, and **15,042 fall more than that and need a partly buried lower level**.
A further **436 have an upper floor but no plate wide enough for a straight stair
run** — those need a spiral in the kit, and are reported rather than quietly
given an unreachable first floor.

## Destruction is state on a graph, not physics

Chaos geometry collections are per-actor and will not survive 63,985 buildings,
let alone 63,985 buildings full of furniture with 500 players watching. So
destruction does not run on the mesh. It runs on the structural graph the
interior generator already has to build.

Each structure resolves to slabs, columns and wall panels. Every element carries
an accumulated damage value and a **two-bit state** — intact, damaged, critical,
destroyed. Removing supports propagates: a slab with nothing under it goes, and
what it carried goes with it. Collapse is a solve over a graph of a few thousand
nodes, not a rigid-body simulation.

This is built: `tools/structgraph.mjs` is the reference implementation and
`tools/maps3d-struct.mjs` runs it over all 63,985 records. **The numbers first
written here were an estimate and they were wrong — 2.3× low.** The real ones,
measured:

| | Elements | Share |
|---|---|---|
| Tier A | 1.15 M | 15% |
| Tier B | 1.84 M | 24% |
| Tier C | 4.71 M | 61% |
| **Whole map** | **7.69 M** | **1.92 MB of damage state** |
| Worst single building | 25,311 | 6.2 KB |

By element: 3.11 M columns, 1.93 M slabs, 2.65 M wall panels. 9,833 structures
get a circulation core. The estimate was low because it counted columns per bay
rather than per grid point and gave each storey one slab instead of one per bay —
and per-bay slabs are what let a hole be blown in a floor, so the extra cost buys
the thing the requirement is about.

**1.92 MB for the destruction state of every building in San Diego**, 6.2 KB for
the worst one, 18 bytes for a two-storey house — and the server never holds the
whole map loaded anyway. **This is the number that makes requirements 1 and 3
compatible.** A late joiner gets the whole city's damage in one packet; a tower
falling replicates as a few hundred bytes of state change. Being 2.3× over the
estimate changes nothing about that argument, which is why it is worth having
measured rather than argued.

Cost to build and to solve, in JavaScript, which is a floor not a target:
**1.0 µs to build a building's graph**, and a collapse solve on the 49-storey
tower — 6,174 elements — is **166 µs**, a two-storey house 4.2 µs.

The rule behaves. On the tallest building on the map:

| Hit | Brought down with it | Left standing |
|-----|---------------------|---------------|
| One ground-floor corner column | 47 | 99.2% |
| The ground-floor column line down one long side | 235 | 96.0% |
| Every ground-floor column | 6,035 | 0.8% |
| Every column on storey 24 of 49 | 3,011 | 49.8% |

A corner takes the column line above it and little else. Cutting a whole side
drops a strip. Taking the ground floor away brings the entire tower down and
leaves only the walls that stood on grade. A shell through storey 24 removes
almost exactly the half above it. None of that was tuned — it falls out of the
load-path rule.

And an invariant worth having checked rather than reasoned about: because the
sweep resolves the whole load path in one pass, **applying it can never expose
anything it did not already account for**. Over 2,055 structures with 5–25% of
their elements shot out at random, the fixed point was reached in two rounds
every time. If that ever stops holding, a dependency in the sweep points the
wrong way and buildings would settle in stages instead of at once.

The visual collapse is a **client-side** event played on the state transition —
Chaos, animation, particles, whatever looks best, costing the server nothing.
The server keeps a simplified collision proxy for rubble. The two never have to
agree exactly, because nothing about the debris is authoritative.

## How many players

The requirement is an outcome, not a number, so it needs a measure. The one that
matters is not density, it is whether you can see anybody: how many players fall
inside a 300 m sight disc on open ground, over the map's 94.7 km² of land.

| Players | Per km² | Visible on open ground | Squads |
|---------|---------|------------------------|--------|
| 108 | 1.14 | 0.32 | 20 |
| 300 | 3.17 | 0.90 | 55 |
| **500** | **5.28** | **1.49** | **91** |
| 800 | 8.45 | 2.39 | 145 |
| 1,200 | 12.67 | 3.58 | 218 |

Erangel is 1.56 per km² and is famous for a quiet first ten minutes. **500 is
the target**: at 1.49 visible on average, open ground stops being empty, and it
is already past anything shipped on this engine. 800 is the stretch.

But the count is not the lever it looks like, for two reasons. **Interiors are
the other half of the answer** — 61 km² of floor pulls players off the open
ground and into buildings, where a contact happens at 20 m instead of 300, so
the same headcount produces far more fighting. And **concentration beats
headcount**: 500 players funnelled onto a dozen objectives feels denser than
1,200 spread evenly, which is what the drop, the objectives and the zone are
for.

So: **build the count as a dial.** Zone radius schedule, loot density, vehicle
counts and objective counts all derive from the player count rather than being
constants. Then the number can move when the tick budget says what it can carry.

And it must be measured before anything is built on it. At a typical
character-movement cost of 0.10 ms, 500 characters is 50 ms of server tick
against a 33 ms budget at 30 Hz. **Stand 500 players in an empty field on target
hardware and measure.** That is a short spike and it decides whether the answer
is Iris alone or Iris plus sharding.

## What this makes cheap, and what it does not

Cheap, because it all falls out of the same record: streaming per building,
loot placed by tier and floor, navmesh generated with the interior, spawn points,
objective volumes, and the named-places overlay keyed to a structure id.

Not cheap, and worth naming so nobody is surprised:

- **Server-side interior collision.** 500 players spread over the whole map
  means the server cannot unload much of it, and interior collision is far
  heavier than a box. This is the likeliest place the plan breaks.
- **Deterministic generation is a hard contract.** Server and client must
  produce byte-identical layouts from the seed, forever, across patches. Any
  change to the generator changes every building. Version the generator and
  pin it per match.
- **The 299 pads still have no height.** They are floor without a building, and
  the interior generator has to skip them rather than invent something.
- **A door can open onto its neighbour.** The entrance is placed on the face the
  street is on, not on the face that is clear. In a dense block those are
  sometimes different, and nothing checks the adjacent footprint yet.

## Entrances and the ground under them — built

`maps3d-doors.mjs` runs after the water dig and enriches the record from **22
fields**: `doorU`, `doorV`, `doorSide`, `frontageM`, `frontageClass`, `groundM`,
`groundMinM`, `groundMaxM`. It resamples all 10,421 non-bridge road runs to a
6 m step — 347,518 samples — into a uniform grid, and searches outward in rings
because road density varies by a factor of six across the map. The door goes on
whichever face the street is on, judged by offset as a fraction of each
half-extent rather than in metres, so a long thin block gets its door on the
long wall; it then slides along that face towards the street and stops short of
the corners.

**Every structure found a street.** Frontage is 19.8 m at the median, 29.0 m at
p90, and the furthest building on the map is 430 m from a road. By street type:
24,398 on service roads, 24,204 on local streets, 8,511 on collectors, 5,857 on
footpaths, 1,015 on arterials.

The ground survey was the part that changed a plan. Sampling a 5×5 grid in each
footprint's own frame: the median building falls **0.70 m** across its plan, p90
is 3.36 m, and the worst is a 56 × 78 m highrise on the hillside north of the
airport with **25.74 m** of fall. **25,497 of 63,686 structures — 40% — fall more
than a metre.** A generator that assumes a level slab would bury the back door of
two buildings in five, so a stepped or sunk ground floor is not an edge case to
handle later, it is the common path.

## Build order

1. **Entrance facing.** Enrich the record from `roads.json`: nearest road, the
   side that faces it, and the grade elevation at that point. Without it no
   generated building has a way in.
2. **The structural graph.** Slabs, columns, panels, and the support-propagation
   solve — with no art at all. It is the destruction system and the interior
   skeleton in one, and it can be tested as pure data.
3. **The 500-player spike.** Empty field, target hardware, measure the tick.
   Runs in parallel with 1 and 2 and gates everything after them.
4. **Tier C generator.** 53,595 buildings, the simplest layout, the largest
   count — it proves streaming and determinism at scale before the hard art.
5. **The kit**, sized from what Tier C actually asks for, then extended.
6. **Tier A generator**, hand-checked over 1,141 buildings.
7. **Tier B**, which is the two above meeting in the middle.
