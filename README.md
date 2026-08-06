# Call of Booty

A browser-based battle royale FPS, built in phases from the specs in `docs/`.

**Current state: Phase 1 complete** — movement, camera, collision, and the map.
No weapons, loot, bots, or match loop yet.

## Play (public URL for friends)

After deploy, the live game is:

**https://jmwilson92.github.io/callofbooty/**

Share that link — not a Codespaces `*.app.github.dev` URL (those are private to your session and 404 for others).

Deploys automatically on every push to `main` via GitHub Pages (Actions).

## Run it locally

```bash
npm install
npm run dev
```

Vite listens on **0.0.0.0:5173** so GitHub Codespaces can forward the port.

**Codespaces:** after `npm run dev`, open the **Ports** tab → find **5173** → **Open in Browser**
(or click the globe icon). If 5173 is missing, click **Forward a Port** and enter `5173`.

**Local:** open http://localhost:5173

Click the page to lock the pointer.

| Input | Action |
|---|---|
| `WASD` | move |
| `Shift` | sprint |
| `Space` | jump / mantle |
| `C` or `Ctrl` | crouch |
| Sprint + `C` | slide — jump to cancel and keep your horizontal speed |
| Right mouse | ADS stance (movement/bob only; no weapons yet) |
| `M` | open / close tactical map (shows your location) |
| `F3` | performance overlay |
| `Esc` | release pointer (also closes the map) |

## What Phase 1 covers

- **Kinematic character controller** — not a rigid body. Walk 4.4 / sprint 7.2 /
  crouch 2.1 m/s, gravity −22, jump peaking ~0.87 m, coyote time, jump
  buffering, 0.45 m step-up, 47° slope limit.
- **Slide** with a 1.35× speed boost capped at 10.5 m/s, slope-dependent
  accel/decay, and slide-cancel-into-jump that preserves horizontal velocity.
- **Mantle** onto ledges 0.5–1.6 m with a 0.35 s scripted pull-up.
- **Collision** — uniform spatial hash (8 m cells) over static AABBs, with an
  exact vertical-capsule-vs-AABB narrowphase and 3 solver iterations per tick.
  Terrain is a hard floor; the player cannot pass through it.
- **Fixed 60 Hz simulation** decoupled from rendering via an accumulator, with
  the camera interpolating between ticks.
- **Seeded 1800 m San Diego playspace** — shaped from satellite + terrain
  reference maps: Pacific west, Point Loma peninsula, Coronado island,
  Mission Bay multi-lobe lagoon, San Diego Bay, Mission Valley (I-8) trench,
  mesa/canyon city, eastern chaparral hills. Freeways I-5 / I-8 / I-15 /
  I-805 / SR-52 / SR-163 as real corridors.
- **Eleven POIs** — La Jolla, Kearny Mesa, Mission Valley, San Diego International
  Airport, MCRD Depot, Downtown (highest loot), Point Loma, Balboa Park,
  San Diego Zoo, Coronado, Radio Tower. Spaced for readability; clearer fog and
  terrain definition. See `docs/04-san-diego-map.md`.
- **Detail structures** — suburban homes, trailers, gas stations, restaurants,
  fast food, auto shops, fire stations, business centers, skyscrapers, boat
  houses, harbors, bridges, billboards, parked vehicles, and abstract zoo
  animals (`src/world/structures/`). Counts in `STRUCTURES` config.
- **Cover props** scattered by Poisson-disc.

All tunable values live in `src/config.js`. Nothing gameplay-related is
hardcoded in a system file.

## Architecture

```
src/
  main.js            bootstrap, fixed-timestep loop, system wiring
  config.js          every tunable constant
  core/
    EventBus.js      pub/sub; systems do not import each other
    Clock.js         fixed timestep accumulator
    Input.js         keyboard/mouse, pointer lock
    Noise.js         seeded PRNG + simplex + fbm
  world/
    Terrain.js       heightfield, POI pads, roads, mesh + vertex colours
    Collision.js     spatial hash + capsule/AABB narrowphase
    BoxSink.js       batches boxes into InstancedMesh + collision AABBs
    BuildingKit.js   walls, slabs, stairs, parametric buildings
    Buildings.js     the seven POI layouts
    Props.js         Poisson-disc cover scatter
  player/
    Controller.js    kinematic character controller
    Camera.js        FPS camera, FOV, view bob, recoil socket
  ui/
    Debug.js         F3 overlay and HUD
```

Every box the world generator emits becomes both a rendered instance and a
collision AABB, so what you see is exactly what you collide with.

## Tests

```bash
npm run dev            # in one terminal
npm run smoketest      # in another
```

Boots the game in headless Chromium with real WebGL and checks the Phase 1
criteria that can be verified without a human: draw call budget, 400 terrain
drop points for fall-through, stair climbing, the Harbor mantle chain, jump
arc, sprint speed, and slide activation.

It reuses a Chromium already on the machine (`CHROME_PATH`, or a
`PLAYWRIGHT_BROWSERS_PATH` install) rather than downloading one.

Note that the smoke test runs under a software GL rasteriser at a few FPS, so
its frame rate is not meaningful — check real FPS with `F3` in a browser. The
movement checks are measured against simulation ticks rather than wall time for
that reason.

Related: the fixed-timestep loop caps the simulation at `SIM.MAX_TICKS_PER_FRAME`
(5) ticks per rendered frame to prevent a death spiral. Below roughly 12 FPS the
game therefore runs in slow motion rather than skipping ahead. That is a
deliberate trade — raise the cap in `src/config.js` if you would rather it drop
time than slow down.

## Not yet built

Phases 2–6 (weapons and damage, loot and inventory, the match loop with zone
and bots, UI and audio, netcode) plus the Blackroot Basin map replacement and
the micro-detail pass. See `docs/`.
