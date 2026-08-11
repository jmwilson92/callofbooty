# The gameplay vision against the map that exists

The design calls the mode *Warfront Royale*: 12–18 squads of 5–6 fighting for
temporary combined-arms assets — naval fire support through Command Centers,
military and civilian aircraft, permanent destruction — under a zone whose final
circle is randomised across regions.

This document does one thing: check that vision against the map actually built
from the maps3d capture, with measured numbers rather than impressions. It says
what is already there, what has to be authored, and where the design and the
data disagree. Everything below is measured from `Tools/Heightmaps/` — the
heightmap, `city.json` / `city-buildings.bin` (745,575 parts, 17 kinds) and
`roads.json` (10,822 runs, 2,103 km, 10,263 junctions).

## Every region the design names is on the map

The playable rectangle is 13.187 × 11.800 km — 155.6 km² — centred on
32.71128 N, 117.1933 W, with a 2 km out-of-bounds ring outside it.

| Region | Buildings | Over 30 m | Tallest | Terrain | Roads | Trees |
|--------|-----------|-----------|---------|---------|-------|-------|
| Downtown / Gaslamp | 2,510 | 263 | 186 m | −9 .. 105 m | 218 km | 5,784 |
| Coronado village + Del | 6,005 | 27 | 64 m | −9 .. 20 m | 120 km | 3,089 |
| NAS North Island | 1,286 | 20 | 48 m | −9 .. 17 m | 88 km | 2,336 |
| Point Loma peninsula | 6,426 | 29 | 52 m | −9 .. 154 m | 239 km | 8,222 |
| San Diego Intl (KSAN) | 1,154 | 17 | 56 m | −9 .. 104 m | 169 km | 2,313 |
| Balboa Park | 2,258 | 13 | 59 m | 47 .. 127 m | 103 km | 8,892 |
| Barrio Logan / 32nd St | 4,450 | 5 | 37 m | −9 .. 44 m | 110 km | 1,999 |
| Shelter + Harbor Island | 1,178 | 30 | 48 m | −9 .. 36 m | 111 km | 1,844 |
| Coronado Bridge span | 346 | 5 | 31 m | −9 .. 20 m | 22 km | 575 |
| Silver Strand (south) | 327 | 20 | 66 m | −9 .. 12 m | 35 km | 741 |

All of them are inside the playable area. Silver Strand is the only one clipped
at all, and only at 1% — its southern tail runs off the bottom edge. Mission Bay
and SeaWorld sit just outside the northern edge and the design does not use them.

Two edges are worth knowing before objectives are placed:

- **The east edge falls at 117.1229 W, through Barrio Logan.** Naval Base San
  Diego at 32nd Street is only half on the map: its western piers are in, the
  rest is not. "Coastal facilities" for Command Centers realistically means NAS
  North Island, the Naval Amphibious Base on Coronado (32.678 N, 117.166 W, fully
  inside), the Embarcadero piers, and those western 32nd Street berths.
- **Point Loma reaches 154 m** and is the only high ground with a sea view. The
  design's coastal gun batteries belong there, and so does the real Fort
  Rosecrans. Balboa Park is the other high ground at 47–127 m, but it is inland
  and heavily wooded — 8,892 trees in 4.2 km².

## The bay works as a naval theatre

The water was measured as one question: can a ship actually get anywhere?

The bay and the Pacific are **one connected body of 60.8 km²** inside the
playable area — 99.8% of all the water on the map. A hull can transit from open
ocean to the south bay without leaving it. Measured open-water widths across the
passages a ship has to make:

| Passage | Open water |
|---------|-----------|
| Harbour mouth, Ballast Point to Zuniga | 1,649 m |
| Under the Coronado Bridge | 1,540 m |
| Off the Embarcadero | 1,548 m |
| South bay off 32nd Street | 2,532 m |

The furthest any point of water gets from a shore is 1,611 m, off the south end
of North Island. So there is no chokepoint under 1.5 km, and no open water more
than about 1.6 km from a bank — which is the shape the design wants: ships are
always transiting and always within reach of a shore-launched counter.

**The Coronado Bridge sets the carrier rule for free.** It is built on the real
alignment, 2,127 m across the water, peaking at **60.2 m** above the surface
(the real bridge clears 61 m). A destroyer passes under it. A carrier does not —
which is exactly why the real carrier piers are on the seaward side. Adopt it as
a hard rule and the naval map divides itself: carriers north and west of the
bridge, destroyers anywhere, and the south bay becomes a destroyer-only theatre
that a carrier squad has to influence indirectly.

The bay is dug to a flat −9 m. That is fine for surfaced ships and boarding from
boats; it carries no depth variation, so anything that reads the seabed —
underwater approach routes, a scuttling animation that settles on the bottom,
diver insertion — has nothing to read.

## What the capture does not contain

The source capture has been fully enumerated: 147 node families, all of them
buildings, six road classes, land cover, water, and the terrain mesh. Five gaps
matter to this design, and all five are authoring work, not pipeline work.

**1. There are no interiors. Anywhere.** All 63,985 buildings are flat-topped
extrusions of their footprint — solid boxes, two Y levels each. Airport terminals
as "large mixed indoor/outdoor spaces", hangar objectives, ship interior spaces,
and downtown vertical combat all need interior volumes that do not exist in any
form. This is the single largest gap between the design and the data.

**2. There are no runways, aprons, taxiways or hangars as such.** No aeroway node
exists in the capture. KSAN and North Island come through as ordinary paved
service roads plus anonymous boxes — nothing wider than the 40 m width cap
anywhere on either field. North Island has 39 buildings over 5,000 m² on the
flight line and KSAN has 36, the largest a 68,184 m² box 29 m tall, but nothing
distinguishes a hangar from a warehouse. Both of the design's aviation
objectives sit on the two patches of map where the source gives least.

**3. Nothing is named.** The buffer format carries a `landmark` flag and **zero
parts set it**. The Hotel del Coronado, the convention centre, Petco Park, the
Midway, the terminals — all present, all anonymous boxes. Objective placement
needs a hand-authored list of named places keyed to lat/lon; there is no way to
recover identity from the geometry.

**4. There are no berths.** The 251 "pier" parts near downtown are *bridge*
piers, not the Embarcadero's quays. Ships need somewhere to moor and the
boarding gameplay needs approach geometry against a hull.

**5. Grade separation is not recoverable.** Of 316,926 road vertices, 0.76% sit
more than 4 m above the ground beneath them, and those are the bridges. In plan
view a flyover and a crossroads are the same picture. Freeway overpasses on I-5
and SR-75 are not built, which constrains both vehicle routing and the design's
rubble-blocks-the-road idea.

## Where the design and the build will actually collide

**Destruction versus instancing.** The 745,575 parts are placed as HISM
instances in 10,000-instance chunks — that is what makes a map this size run at
all. Chaos destruction is per-actor. Permanent per-match destruction therefore
means pulling a subset out of instancing and paying for it in draw calls.
Downtown's 2,510 buildings and 289 pads is a plausible carve-out — 4% of the
map's buildings; the whole map is not. Deciding that boundary early matters,
because "buildings in downtown, Coronado, industrial zones, and many other areas
are destroyable" is, as written, most of the map.

**Two kill systems that do not know about each other.** The map already has an
out-of-bounds ring — 2 km wide, four PainCausingVolumes, escalating damage, no
harsh cutoff, exactly as asked for. The design's shrinking zone is a separate
system with a separate rule. They need reconciling or a player will be inside
the circle and dying anyway. The cheapest fix is to treat the ring as the zone
system's floor and constrain the circle generator so a final centre never lands
within about 1.5 km of the playable edge — which also protects the randomised
final regions, since Silver Strand and the eastern industrial zone are the two
candidates closest to an edge.

**Player density: see the 500-player section below.** Of the 155.6 km² playable,
60.9 km² is water and **94.7 km² is land**. At the 12–18 squads the design text
names that is 1.14 players per km² against Erangel's 1.56, and the early game
would feel empty. At 500 it is 5.28 per km², and the map is correctly sized.

**Verticality is massing, not playspace.** Downtown has 263 buildings over 30 m
and 41 over 100 m, but the median building on the map is 6.8 m and the 90th
percentile is 11.8 m. The skyline reads correctly from the bay, which is what
matters for naval fire missions and for the look of a strike. It does not yet
give anyone a rooftop to fight on.

## What this map is already good at

Worth stating plainly, because the gaps above are the long list and they are not
the whole picture:

- The regional character the design asks for is **already in the terrain and the
  massing**, not something that has to be built: Point Loma really is a 154 m
  ridge over a 1.6 km strait; Balboa Park really is a wooded mesa at 95 m mean
  with no water in it; Coronado really is flat, 5 m mean, and 32% waterline;
  downtown really does have a 186 m tower. Six of the design's seven endgame
  regions feel different because the ground is different.
- **2,103 km of road centrelines with measured widths and 10,263 junctions**
  is a ready-made source for vehicle routing, navmesh seeding, drop-path
  scoring and zone-edge weighting. None of that needs new data.
- The bay is a genuine naval corridor, and the bridge gives the carrier/destroyer
  split for nothing.

## 500 players, 45 to 60 minutes

The map is the right size for it. The engine is the part that has to be proved.

| Players | Per km² of land | Land each | Squads of 5–6 |
|---------|-----------------|-----------|---------------|
| 108 | 1.14 | 877,000 m² | 20 |
| 300 | 3.17 | 316,000 m² | 55 |
| **500** | **5.28** | **189,000 m²** | **91** |
| 800 | 8.45 | 118,000 m² | 145 |

Erangel is 1.56 players per km². At 500 this map is **3.4× denser than Erangel**,
which settles the density question in the design's favour — 500 is close to the
number this map wants, and the 12–18 squads in the current text is the number
that would leave it empty.

The match length is consistent too. 91 squads means 90 wipes; over 50 minutes
that is 1.8 squad wipes a minute sustained, which is an ordinary BR elimination
curve. The 17.7 km diagonal takes 59 minutes on foot and 13 minutes in a car, so
vehicles stop being a convenience and become the thing that makes the zone
survivable — which is what the design already wants them to be.

**Where 500 gets hard is the server, and it is not a settings change.**

- *CPU.* At a typical character-movement cost of 0.10 ms per character, 500
  characters is 50 ms of server tick against a 33 ms budget at 30 Hz — 1.5×
  over before anything else runs. At 0.05 ms it fits with nothing to spare; at
  0.20 ms it is 3× over. So the movement and animation path has to be measured
  and probably rewritten, not tuned.
- *Bandwidth.* 500 clients at 50 KB/s each is 195 Mbit/s of upstream from one
  server process, and 391 Mbit/s at 100 KB/s. Affordable, not free, and it caps
  how much fidelity each client can be sent.
- *Relevancy.* Average density is not the problem — the endgame is. Sixty alive
  inside a 600 m circle is 3,540 relevancy pairs with everyone seeing everyone.
  That spike is the load case to design for.

Two routes exist. **Iris**, UE's replacement for the legacy replication system,
is built for exactly this scale and is the cheaper bet. **Sharding** the world
across server processes is the heavier one, and this map offers unusually clean
seams — the bay separates Point Loma, North Island and Coronado, downtown and
Balboa, and Barrio Logan into four near-independent theatres. The catch is that
a battle royale collapses every player into one circle at the end, which defeats
sharding exactly when the load peaks. Note though that at 500 players the final
circle cannot be small: sixty survivors in a 600 m circle is one shard's worth of
work, so a hybrid — shard the early game, hand off to a single process for the
last phase — is the shape that fits.

None of this is map work, and none of it should be assumed. **Stand 500 players
in an empty field on the target hardware and measure the tick.** That is a short
spike and it decides the architecture for everything after it.

## Hollowing out the buildings

This is the largest single piece of work in the project, by a wide margin, and
the number that shows why is this: the map's 67,240 building parts carry 18.10
km² of footprint across 145,846 storeys, which is **60.32 km² of interior floor**
— roughly two thirds of the map's land area again, indoors.

For scale, the largest interior spaces any shipped game has are on the order of a
square kilometre. This is sixty times that. Hand-authoring is not "a lot of
work", it is out of reach by two orders of magnitude. Interiors have to be
generated, which is the good news, because generating a few hundred thousand
placed parts from the capture is what this pipeline already does.

The cost, counting a slab per storey, a wall panel every 4 m of perimeter, and a
three-part stair-and-shaft core:

| Treatment | Instances | Against today's 0.75 M |
|-----------|-----------|------------------------|
| Bare shell, no props | 3.1 M | 4× |
| Sparse, 1 prop per 30 m² | 5.1 M | 7× |
| Furnished, 1 prop per 15 m² | 7.2 M | 10× |
| Dressed, 1 prop per 8 m² | 10.7 M | 14× |

**But the whole map does not need the same treatment, and the height bands say so
plainly.**

| Height | Buildings | Share of buildings | Storeys | Floor area | Share of floor |
|--------|-----------|--------------------|---------|------------|----------------|
| under 5 m | 16,235 | 24% | 16,235 | 1.99 km² | 3.3% |
| 5–10 m | 39,806 | 59% | 80,886 | 18.28 km² | 30.3% |
| 10–20 m | 9,809 | 15% | 35,314 | 21.13 km² | 35.0% |
| 20–40 m | 1,184 | 1.8% | 9,074 | 12.56 km² | 20.8% |
| 40–80 m | 133 | 0.2% | 1,928 | 3.61 km² | 6.0% |
| over 80 m | 73 | 0.1% | 2,409 | 2.74 km² | 4.5% |

The mean building is 2.2 storeys on a 269 m² floorplate. Escalators, elevator
banks, lobbies and office floors belong to the **1,390 buildings of 20 m and
over — 2% of the buildings and 31% of the floor area**. Furnishing only those
costs 1.75 M instances: 2.3× today's map rather than 10×. So:

- **Tier A — 1,390 buildings, 20 m and up.** The full treatment. A core with
  stair flights and elevator shafts, a lobby, per-floor partition layouts, desks,
  monitors, plants, escalators in the ones that warrant them. This is where the
  design's ambition actually lives, and it is a small enough set to tune by hand
  afterwards.
- **Tier B — 9,809 buildings, 10 to 20 m.** Apartment blocks, warehouses, the
  KSAN terminal, the North Island hangars. Open floorplates, stairs, sparse
  props, generous sightlines.
- **Tier C — 56,041 buildings under 10 m.** Houses, garages, strip retail. A
  door, one or two rooms, a window, a handful of props. Walkable and honest, not
  detailed.

What artists author is **not buildings — a kit**. On the order of 150 to 250
pieces: wall panels, door and window units, stair flights, elevator cars, desks,
chairs, monitors, shelving, planters. The generator places them from the
footprint, the height and the tier. That is the difference between a plan that
ships and one that does not.

Three constraints that shape the generator before a line of it is written:

- **Interiors must stream, and per building.** World Partition plus a packed
  level actor per archetype, loaded when a player is near or inside. Sixty square
  kilometres of floor cannot be resident.
- **Server-side collision is the sleeper cost.** 500 players spread across the
  whole map means the server cannot unload much of it, and interior collision is
  far heavier than a box.
- **Windows need the cheap trick at distance.** An interior cubemap on the shell
  until a player is close enough to warrant the real geometry.

And one interaction worth naming: **interiors and permanent destruction fight
each other.** Destroying a building that contains a generated interior is a much
harder problem than destroying a box, and the two features want the same
buildings — downtown. Whichever is picked first should be picked knowing that.

## The order these should be tackled in

1. **Named places.** Everything else keys off it — objectives, drop funnels, zone
   weights, loot tiers. It is a lat/lon list and the `landmark` flag is already
   in the format waiting for it.
2. **The zone system, reconciled with the ring.** It is the design's primary
   pacing tool and the map's existing kill volumes contradict it today.
3. **Interiors for the objective buildings only** — Command Centers, the two
   airfields' hangars, a handful of downtown towers. Not a general interior pass.
4. **The destruction carve-out**, scoped to a named region rather than "many
   areas", and measured against the draw-call budget before it is committed to.
5. **Runways, aprons and berths**, authored, since the capture will never supply
   them.
