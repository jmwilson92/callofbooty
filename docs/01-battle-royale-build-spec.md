# Battle Royale FPS — Build Spec for AI Code Generation

**How to use this document:** Paste the "GLOBAL CONTEXT" block first, then paste **one phase at a time**. Wait for working, tested code before moving to the next phase. Do not paste the whole document at once — the output will be truncated and the systems will not integrate.

---

## GLOBAL CONTEXT (paste this first, and re-paste at the top of every phase)

```
You are building a browser-based battle royale first-person shooter. This is a
multi-phase build. Follow these constraints exactly on every phase.

TECH STACK (non-negotiable):
- Vanilla JavaScript (ES modules), Three.js for rendering, no game engine.
- Vite as the build tool. Project runs with `npm install && npm run dev`.
- Cannon-es for rigid body physics ONLY where needed (loot drops, vehicles).
  Player movement uses a custom kinematic character controller, NOT rigid body
  physics — physics-driven FPS movement feels floaty and is a common failure.
- No external asset downloads. All geometry is procedural or primitive-based.
  All materials are MeshStandardMaterial with flat colors. Placeholder art is
  fine and expected.
- Target: 60 FPS on integrated graphics at 1920x1080.

CODE STRUCTURE:
- One module per system. No file over 400 lines. If a file exceeds 400 lines,
  split it.
- All tunable numbers live in a single `src/config.js` exported as nested
  objects. Never hardcode a gameplay number inside a system file.
- Use a central event bus (`src/core/EventBus.js`) for cross-system messages
  (damage dealt, player died, item picked up). Systems do not import each other
  directly except through explicit dependency injection in `main.js`.
- Fixed timestep simulation at 60Hz, decoupled from render loop. Accumulator
  pattern. Render interpolates.

RULES FOR YOUR OUTPUT:
- Output complete, runnable files. Never write "// ... rest of the code" or
  "// implement this later" in a file you are asked to produce.
- At the end of each phase, output a short "HOW TO TEST" section listing the
  exact things I should be able to do in the browser to verify the phase works.
- If a requirement is ambiguous, pick the option that is simpler to implement
  and state the assumption in one line. Do not ask me questions mid-build.
- Do not use any trademarked names, logos, weapon model names, or audio from
  existing commercial games. All naming is original.
```

---

## PHASE 1 — Movement, Camera, and the Map

**Goal:** A player can run, jump, crouch, and slide around a terrain with buildings at a locked 60 FPS. Nothing else.

### 1.1 Project scaffold

```
src/
  main.js              — bootstrap, fixed-timestep loop, system wiring
  config.js            — ALL tunable constants
  core/
    EventBus.js
    Clock.js           — fixed timestep accumulator
    Input.js           — keyboard/mouse state, pointer lock
  world/
    Terrain.js
    Buildings.js
    Collision.js       — spatial hash broadphase + AABB/capsule narrowphase
  player/
    Controller.js      — kinematic character controller
    Camera.js          — first person camera, view bob, recoil socket
```

### 1.2 Character controller — exact values

Put these in `config.js` under `PLAYER`:

| Property | Value |
|---|---|
| Capsule radius | 0.4 m |
| Capsule height (standing) | 1.8 m |
| Capsule height (crouched) | 1.0 m |
| Eye height offset from feet | 1.65 m standing / 0.85 m crouched |
| Walk speed | 4.4 m/s |
| Sprint speed | 7.2 m/s |
| Crouch speed | 2.1 m/s |
| ADS movement multiplier | 0.45 |
| Ground acceleration | 60 m/s² |
| Ground friction | 10 |
| Air acceleration | 12 m/s² |
| Air control factor | 0.30 |
| Gravity | −22 m/s² |
| Jump impulse | 6.2 m/s (peaks ~0.87 m) |
| Max step height | 0.45 m |
| Max walkable slope | 47° |
| Coyote time | 0.12 s |
| Jump buffer | 0.15 s |

**Slide mechanic:** pressing crouch while sprinting and grounded triggers a slide. Initial speed = current speed × 1.35, capped at 10.5 m/s. Slide friction 6.0, slide duration hard cap 1.1 s, cooldown 0.9 s. Camera drops to 0.75 m and rolls 4° toward movement direction over 0.1 s. Sliding downhill adds acceleration proportional to slope; sliding uphill decays faster. The player can cancel a slide into a jump, keeping horizontal velocity (this is the core movement skill expression — do not remove it).

**Mantle:** if the player is airborne or grounded and a forward raycast hits a ledge between 0.5 m and 1.6 m high with clear space above, pressing jump triggers a 0.35 s scripted mantle that lerps the capsule onto the ledge. Disable input during the mantle.

### 1.3 Collision

Do **not** use a physics engine for this. Implement:

- A uniform spatial hash grid, cell size 8 m, storing static AABBs.
- Swept capsule-vs-AABB resolution with depenetration, run in 3 solver iterations per tick.
- Ground detection via a short downward capsule cast (0.15 m probe), not a single ray, so edges do not cause jitter.

### 1.4 Camera

FOV 80° base. Sprint pushes FOV to 88° over 0.18 s and back over 0.12 s. Mouse sensitivity 0.0022 rad/pixel, exposed in config. Pitch clamped to ±88°. Camera position is not the capsule center — it is a separate node lerped toward the eye position at 25/s to smooth step-ups.

**View bob:** sine-based, amplitude 0.035 m vertical / 0.025 m horizontal, frequency scaled to speed, amplitude cut to 30% while ADS. Add a 0.6° camera roll when strafing.

### 1.5 The map

Generate a **1200 m × 1200 m** island, procedural but seeded (same seed = same map every reload; expose the seed in config).

- Terrain: heightmap from 4 octaves of simplex noise, max elevation 60 m, with a radial falloff so edges drop into water. Vertex-colored by height and slope (sand → grass → rock → snow). Single merged BufferGeometry, no per-chunk objects at this scale.
- **7 named points of interest**, hand-placed at fixed coordinates, each with a distinct silhouette and loot density rating:
  1. **Harbor** (coastal, warehouses + shipping containers, high loot)
  2. **Radio Hill** (highest point, tower + 3 outbuildings, medium loot, strong sightlines)
  3. **The Grid** (dense city block, 12 buildings 2–4 stories, highest loot, high risk)
  4. **Quarry** (open pit, terraced, cover-poor, medium loot)
  5. **Farmstead** (barn + silos + fields, medium loot)
  6. **Substation** (industrial, pylons + transformer sheds, low-medium loot)
  7. **Trailer Row** (scattered small structures, low loot, good rotations)
- Buildings are procedurally assembled from a kit: floor slabs, walls (with door and window cutouts as separate wall variants), stairs, railings, roofs. Every building must have at least two entrances and at least one interior route to its roof or top floor. **Verify no building has a room the player cannot physically enter or exit.**
- Scatter 400 cover props (rocks, crates, low walls, vehicles as static geometry) using Poisson-disc sampling with minimum spacing 6 m, biased away from POI interiors.
- Roads connecting POIs, baked as terrain vertex color + flattened height, 8 m wide.

### 1.6 Performance requirements

- Frustum culling on. Instanced meshes for all repeated props (`InstancedMesh`, one per prop type).
- Single directional light with a 2048 shadow map, cascade-free, shadow camera fitted to a 120 m box around the player and updated each frame.
- Fog matching sky color starting at 400 m, ending at 900 m.
- Add an FPS/drawcall/triangle counter overlay toggled with F3.

**HOW TO TEST:** Pointer lock on click. WASD moves, Shift sprints, Space jumps, C crouches, sprint+C slides. I can reach the top floor of every building in The Grid. I can mantle onto shipping containers at Harbor. No falling through terrain anywhere. F3 shows ≥60 FPS and <400 draw calls.

---

## PHASE 2 — Weapons, Shooting, and Damage

**Goal:** Working gunplay against static targets.

### 2.1 Weapon architecture

Weapons are **data, not classes**. One `WEAPONS` object in `config.js`, one generic `WeaponSystem` that reads it. Adding a gun means adding a data entry, nothing else.

Each weapon entry defines: `fireMode`, `rpm`, `magSize`, `reloadTime`, `reloadTimeEmpty`, `adsTime`, `swapTime`, `damage`, `headMult`, `limbMult`, `falloffStart`, `falloffEnd`, `falloffMinMult`, `muzzleVelocity` (null = hitscan), `recoilPattern`, `spread`, `pellets`.

### 2.2 The weapon table

Base health is 100. Armor is a separate pool absorbing 100% of incoming damage until depleted (see 3.3). Damage below is applied to armor first, then health.

| Weapon | Class | Mode | RPM | Mag | Body dmg | Head mult | Limb mult | Falloff | Reload |
|---|---|---|---|---|---|---|---|---|---|
| **Vector-7** | Assault Rifle | Auto | 680 | 30 | 26 | 1.6 | 0.9 | 100% to 55 m, 68% at 90 m | 2.3 s / 2.9 s |
| **Kestrel** | Assault Rifle | Auto | 780 | 25 | 22 | 1.55 | 0.9 | 100% to 45 m, 65% at 80 m | 2.1 s / 2.7 s |
| **Pike SMG** | SMG | Auto | 900 | 32 | 18 | 1.4 | 0.95 | 100% to 20 m, 50% at 45 m | 1.9 s / 2.4 s |
| **Warden** | LMG | Auto | 620 | 75 | 28 | 1.4 | 0.9 | 100% to 70 m, 75% at 120 m | 4.2 s / 5.0 s |
| **Longshot** | Sniper | Bolt | 45 | 5 | 95 | 2.2 | 0.75 | none | 3.1 s / 3.6 s |
| **Marksman DM** | DMR | Semi | 300 | 15 | 45 | 1.9 | 0.85 | 100% to 90 m, 80% at 150 m | 2.5 s / 3.0 s |
| **Breaker** | Shotgun | Pump | 70 | 6 | 11 × 9 pellets | 1.5 | 1.0 | 100% to 8 m, 25% at 20 m | 0.5 s/shell |
| **Sidearm P9** | Pistol | Semi | 400 | 15 | 20 | 1.7 | 0.9 | 100% to 25 m, 55% at 50 m | 1.6 s / 2.0 s |

**Design intent to preserve:** the AR is a 4-shot-to-head / 6-shot-to-body kill at range against unarmored targets. The sniper is a one-shot headshot kill through any armor but never a one-shot body kill. The shotgun kills in one shot inside 6 m and is nearly useless past 15 m. Do not "balance" these numbers; implement them exactly.

### 2.3 Recoil — this is the part most implementations get wrong

Recoil has two independent components:

1. **Visual kick** — camera punches up/back, then returns. Purely cosmetic, fully recovers.
2. **Aim offset** — the actual crosshair direction moves along a fixed per-weapon pattern and does **not** auto-recover instantly. This is what the player must learn to counter with mouse movement.

Each weapon has a `recoilPattern`: an array of `[horizontal, vertical]` offsets in degrees, one entry per shot in the magazine, cycling if the mag is longer than the array. Vertical is always positive (upward). Horizontal follows a shaped curve — the Vector-7 should pull straight up for 5 shots, then drift left, then snap right at shot 12, then become semi-random with a bias. Give each weapon a distinguishable pattern.

Recovery: aim offset decays back toward zero at 8°/s starting 0.25 s after the last shot. First-shot recoil is always identical (no randomness on shot 1) so single-tapping is precise.

**Spread (bloom)** is separate from recoil: a cone that grows per shot toward a max, applied only when hip-firing or moving while ADS. Standing still while ADS gives perfect first-shot accuracy on every weapon except the shotgun.

### 2.4 Hit registration

- Hitscan raycast from camera center (not from the gun muzzle — muzzle-origin rays cause shots to hit cover the player can see past).
- **Hitboxes:** head (sphere r=0.18 at eye height), chest+abdomen (box), arms (2 boxes), legs (2 boxes). Colliders are separate simple meshes parented to the character, updated per tick.
- Penetration: bullets pass through materials tagged `thin` (wood walls, sheet metal, glass) losing 35% damage per surface, max 2 surfaces. Tagged `solid` (concrete, rock, terrain) stops all bullets.
- Every shot spawns: a tracer (fading line, 0.06 s life), an impact decal + particle burst matched to surface material, and a shell casing ejection.

### 2.5 Feedback

- Hitmarker: white X on crosshair, 0.12 s. Red-tinted X for headshots. Distinct sound per hit type.
- Damage numbers floating at hit position, small and fading over 0.7 s.
- Kill confirmation: larger marker, distinct tone, kill feed entry.
- Screen edge blood vignette scaled to missing health; directional damage indicator arc pointing at the attacker for 2.5 s.

### 2.6 Test range

Add a debug mode (key `P`) that spawns 12 static humanoid targets at ranges from 5 m to 200 m and a DPS/accuracy readout so gunplay can be tuned without the rest of the game existing.

**HOW TO TEST:** Left click fires, right click ADS, R reloads, 1/2 swap weapons, Q quick-swaps to previous. Recoil pattern is consistent and learnable — I can hold the trigger and counter it with mouse movement to keep hits on a target at 60 m. Headshots do measurably more damage. Shotgun is lethal up close and pathetic at 30 m.

---

## PHASE 3 — Loot, Inventory, and Survival Items

### 3.1 Rarity tiers

Common (grey) → Uncommon (green) → Rare (blue) → Epic (purple) → Legendary (gold). Rarity affects weapon stats via multipliers, not via different weapons:

| Rarity | Damage mult | Reload mult | ADS time mult | Mag size mult | Spawn weight |
|---|---|---|---|---|---|
| Common | 1.00 | 1.00 | 1.00 | 1.00 | 40 |
| Uncommon | 1.05 | 0.95 | 0.95 | 1.00 | 28 |
| Rare | 1.10 | 0.90 | 0.90 | 1.20 | 18 |
| Epic | 1.15 | 0.85 | 0.85 | 1.20 | 10 |
| Legendary | 1.20 | 0.80 | 0.80 | 1.35 | 4 |

### 3.2 Ammo

Four ammo types: **Light** (SMG, pistol), **Heavy** (AR, LMG, DMR), **Long** (sniper), **Shell** (shotgun). Stack sizes: Light 180, Heavy 120, Long 30, Shell 40. Ammo is shared across all weapons using that type.

### 3.3 Armor and healing

- **Armor plates:** each plate restores 50 armor. Max 3 plates carried beyond the equipped armor. Armor capacity: Level 1 = 50, Level 2 = 100, Level 3 = 150. Applying a plate takes 2.0 s and is interrupted by taking damage (progress is lost, plate is not consumed).
- **Bandage:** +25 health, 3.0 s, caps at 75 health.
- **Medkit:** full health, 6.5 s, cannot be used while moving.
- **Stim:** +20 health over 3 s + 25% move speed for 6 s, 1.5 s to use.
- Health does not regenerate passively. This is a deliberate design choice — it makes healing items the primary resource pressure.

### 3.4 Inventory

- 2 weapon slots, 1 melee (always present), 5-slot consumable/utility grid, armor slot, backpack slot.
- **Backpack** (Common/Rare/Epic) increases consumable grid to 5/7/9 slots.
- Tab opens inventory: a grid UI with drag-drop, plus a ground-loot panel showing items within 3 m.
- E picks up nearest item, hold E opens the ground panel.

### 3.5 Throwables

| Item | Fuse | Damage | Radius | Notes |
|---|---|---|---|---|
| Frag | 3.0 s | 110 center → 25 edge | 7 m | Falloff is quadratic, blocked by line of sight |
| Smoke | 1.0 s | 0 | 9 m radius, 20 s duration | Must actually block AI vision, not just render a sprite |
| Flash | 1.6 s | 0 | 12 m | Screen whiteout scaled by view angle to the blast and distance; 0.5–3.5 s |
| Molotov | impact | 12/s | 5 m, 8 s | Denies ground area |

Throwables use cannon-es rigid bodies with a bounce restitution of 0.3 and a cooked/overhand throw arc. Show a trajectory arc preview while the throw is held.

### 3.6 Spawning

Loot spawns at fixed spawn points baked into building geometry (floors, shelves, corners) — never floating, never inside walls. Density per POI from Phase 1. Each spawn point rolls: 60% chance to produce an item; if it produces, weighted roll on item class then rarity. Total map loot must support ~40 players finding a weapon within 45 seconds of landing.

**HOW TO TEST:** I can land in The Grid, find a weapon within 30 seconds, pick up ammo that stacks, equip armor, apply a plate and see it interrupted by taking damage, and throw a frag that damages a target behind partial cover less than one in the open.

---

## PHASE 4 — The Match Loop, Zone, and Bots

### 4.1 Match flow

`LOBBY → DEPLOYMENT → DROP → PLAYING → ZONE PHASES → VICTORY/DEFEAT → RESULTS`

- **Deployment:** aircraft flies a random straight line across the map at 400 m altitude over 45 s. Player presses Space to jump. Show the flight path on the map.
- **Freefall:** dive speed 55 m/s, glide speed 22 m/s, horizontal control ±18 m/s. Parachute auto-deploys at 40 m above terrain, descent 8 m/s, steerable at 12 m/s. Manual deploy allowed at any time.
- 39 bots deploy at spread-out points along the flight path with realistic dispersion (weighted toward POIs).

### 4.2 Zone — exact schedule

Total match: ~14 minutes. Each phase has a hold time then a shrink time. Damage is per second, applied outside the zone, ignoring armor.

| Phase | Hold | Shrink | New radius | DPS |
|---|---|---|---|---|
| 1 | 150 s | 120 s | 400 m | 1 |
| 2 | 100 s | 90 s | 250 m | 2 |
| 3 | 80 s | 70 s | 150 m | 5 |
| 4 | 60 s | 55 s | 90 m | 8 |
| 5 | 45 s | 45 s | 50 m | 12 |
| 6 | 35 s | 35 s | 25 m | 18 |
| 7 | 25 s | 25 s | 10 m | 25 |
| 8 | 15 s | 20 s | 0 m | 40 |

Next-zone center is chosen randomly within the current zone such that the new circle is fully contained, biased 30% toward the current center. The next zone is visible on the map during the hold, and the wall closes as a translucent shader-driven cylinder with an animated scrolling texture. Wall is visible from both sides.

### 4.3 Bot AI

Bots are a hierarchical state machine, not a behavior tree (simpler, adequate here). States:

`DROPPING → LOOTING → ROTATING → ENGAGING → REPOSITIONING → HEALING → FLEEING → DEAD`

**Perception model (critical — bots that cheat feel awful):**
- Vision cone: 110° horizontal, view distance 150 m, reduced to 60 m in smoke, 0 through solid geometry (raycast to target's chest and head).
- Detection is **not instant**. Bots accumulate an awareness meter toward the target: fill rate scales with target distance, target movement speed, whether the target is crouched (×0.6), and whether the target is firing (×3.0). Full awareness takes 0.25 s at 15 m for a sprinting target, 1.4 s at 100 m for a crouched one.
- Bots hear gunfire within 200 m (unsuppressed) and footsteps within 20 m (sprinting) / 8 m (walking), producing an investigate target with position error of ±8 m.

**Combat behavior:**
- Reaction delay 180–420 ms depending on difficulty, sampled per engagement.
- Aim uses a simulated mouse: the bot's aim vector moves toward the target with a max angular velocity (280°/s) and a per-difficulty error cone that shrinks over time-on-target. Bots must never snap.
- Bots lead moving targets only at higher difficulty. Bots miss deliberately — a target error offset is applied and re-rolled every 0.3 s.
- Bots strafe, use cover (query nearby cover props for positions that break LOS to the threat), reload behind cover, and back off when below 35 health.

**Difficulty mix per match:** 40% Easy, 40% Medium, 15% Hard, 5% Elite. Easy bots have 520 ms reaction and a 6° error cone; Elite has 180 ms and 1.2°.

**Navigation:** bake a navmesh from the terrain and building floors at startup (or use a grid-based A* on a 2 m grid with height sampling and a jump-link table for building entrances — simpler and acceptable). Bots must path indoors, up stairs, and around cliffs. Path recalculation at most every 0.5 s, spread across frames.

**Bot-vs-bot combat must run at full fidelity when off-screen but with perception checks throttled to 5 Hz** so the kill feed stays believable without tanking performance.

### 4.4 Death and results

Death: ragdoll or a simple death animation, drops all inventory into a loot cache with a distinct marker, spectate the killer. Show placement, kills, damage dealt, survival time, and accuracy on the results screen.

**HOW TO TEST:** A full match completes in roughly 14 minutes with the player count ticking down at a believable rate — roughly 10 dead in the first 90 seconds, 20 alive at zone 3, 5 alive at zone 6. Bots do not shoot me through walls. Bots take cover. I can win.

---

## PHASE 5 — UI, Audio, and Polish

### 5.1 HUD

Bottom-left: health bar + armor bar (segmented into plates). Bottom-right: weapon name, rarity color, ammo `current/reserve`, fire mode. Top-left: alive count, kills. Top-right: minimap (rotating, 120 m radius, showing zone circle, teammates, ping markers, own facing cone). Center: dynamic crosshair whose gap scales with current bloom.

Full map on `M`: zone circles, flight path, player marker, ping system.

Kill feed top-right, entries fade after 6 s, max 5 visible.

### 5.2 Audio

Use the Web Audio API with a `PositionalAudio` node per source and a shared listener on the camera. Generate all sounds procedurally with oscillators and noise buffers (no downloads):

- Gunfire: noise burst + filtered low-frequency thump, per-weapon envelope. Distant gunfire is a low-passed, longer-tailed variant crossfaded by distance.
- Footsteps: surface-dependent filtered noise, stereo-panned, triggered by movement distance not a timer.
- Zone wall: a low drone whose gain rises with proximity.
- UI: distinct hit, headshot, kill, pickup, and low-health tones.

Add a **sound occlusion** approximation: raycast from listener to source, apply a lowpass filter and gain reduction per blocking surface.

### 5.3 Settings menu (Esc)

Sensitivity, ADS sensitivity multiplier, FOV (70–110), master/SFX/UI volume, invert Y, toggle vs hold ADS, toggle vs hold crouch, shadow quality (off/low/high), render scale (0.5–1.0), crosshair color, FPS counter, full keybind remapping. Persist to `localStorage`.

### 5.4 Optimization pass

- Object pooling for bullets, tracers, decals, particles, damage numbers, and audio nodes. Zero allocation in the hot loop.
- LOD: bots beyond 80 m render as a simplified mesh; beyond 150 m as a billboard.
- Cap decals at 200, oldest recycled.
- Profile and report the frame budget breakdown.

---

## PHASE 6 (OPTIONAL) — Real Multiplayer

Only attempt this after Phases 1–5 are stable. Read this section carefully before starting: **retrofitting netcode onto a single-player build is a rewrite of the player controller and weapon system, not an addition.** If real multiplayer is the goal, tell me now and I will restructure Phase 1 to be server-authoritative from the start.

Architecture if proceeding:

- Node.js + `ws` authoritative server. The server runs the same fixed-timestep simulation as the client, importing the same `config.js` and movement code (shared `src/shared/` directory).
- Client-side prediction: client applies input immediately and stores it with a sequence number. Server responds with authoritative state + last processed sequence. Client rewinds and replays unacknowledged inputs on mismatch beyond a 0.05 m threshold.
- Entity interpolation for remote players at 100 ms behind server time.
- Lag compensation: server stores 1 s of hitbox history at 60 Hz; on a shot, rewind other players to the shooter's rendered time before the raycast.
- Binary protocol with a bitpacked snapshot format, delta-compressed against the last acknowledged snapshot. Send only entities within 200 m or otherwise relevant.
- 20 Hz snapshot rate, 60 Hz input rate.
- Anti-cheat basics: validate movement speed, fire rate, and line of sight server-side. Never trust a client-reported hit.

Realistic target: 20 players per match on a single Node process. Bots fill remaining slots server-side using the Phase 4 AI.

---

## Notes on scope

A few honest expectations to set with whatever tool builds this:

- **Phases 1–2 are the make-or-break.** If movement and shooting feel good, a rough map and dumb bots are still fun. If they feel bad, nothing else saves it. Budget most of the iteration time here, and re-tune the Phase 1 and 2 numbers by feel after playing — they are starting points, not gospel.
- **Phase 4's bot AI is the largest single chunk of work** and is where generated code most often produces something that technically runs but plays terribly (bots that laser you instantly, or stand still). The perception and aim-error models above exist specifically to prevent that; if the generator simplifies them away, push back.
- **Do not ask for Phase 6 in the first pass.** Authoritative netcode with lag compensation is genuinely harder than everything else in this document combined.
- Keep all naming, art, and audio original. Building a battle royale is fine; shipping one with copied weapon names, maps, or sound effects is not.
