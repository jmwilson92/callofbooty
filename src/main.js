import * as THREE from 'three';
import { WORLD, PLAYER, SIM } from './config.js';
import { EventBus } from './core/EventBus.js';
import { Clock } from './core/Clock.js';
import { Input } from './core/Input.js';
import { mulberry32 } from './core/Noise.js';
import { Terrain } from './world/Terrain.js';
import { SpatialHash } from './world/Collision.js';
import { BoxSink } from './world/BoxSink.js';
import { buildAllStructures } from './world/Buildings.js';
import { scatterProps } from './world/Props.js';
import { scatterStructures } from './world/structures/Scatter.js';
import { loadPropLibrary, scatterAssetProps } from './world/Assets.js';
import { DoorSystem } from './world/Doors.js';
import { ElevatorSystem } from './world/Elevators.js';
import { VehicleSystem } from './world/Vehicles.js';
import { RappelSystem } from './world/Rappels.js';
import { Controller } from './player/Controller.js';
import { PlayerCamera } from './player/Camera.js';
import { DebugOverlay, createHud } from './ui/Debug.js';
import { MapView } from './ui/MapView.js';
import { CombatEffects } from './combat/Effects.js';
import { WeaponSystem } from './combat/WeaponSystem.js';
import { WeaponOverlay } from './combat/WeaponOverlay.js';
import { TargetRange } from './combat/Targets.js';
import { BotSystem } from './combat/Bots.js';
import { loadWeaponLibrary } from './combat/WeaponAssets.js';
import { LootSystem } from './loot/LootSystem.js';
import { CombatHud } from './ui/CombatHud.js';
import { PartyClient } from './net/Party.js';
import { VEHICLES } from './config.js';
import { worldBuildings } from './world/BuildingRegistry.js';

// Bootstrap and system wiring. Systems receive their dependencies here and
// otherwise talk through the event bus.

function buildWorld() {
  const rng = mulberry32(WORLD.SEED ^ 0x5f3a);
  const terrain = new Terrain(WORLD.SEED);
  const hash = new SpatialHash();
  const sink = new BoxSink();

  buildAllStructures(sink, terrain, rng);
  const structureStats = scatterStructures(sink, terrain, rng);
  const propStats = scatterProps(sink, terrain, rng);
  // Meshes first so glass instances link into collision boxes for breakables
  const structureMeshes = sink.buildMeshes();
  sink.registerCollision(hash);

  return { terrain, hash, sink, propStats, structureStats, roadPieces: terrain.roads?.length ?? 0, structureMeshes };
}

function setupLighting(scene) {
  const hemi = new THREE.HemisphereLight(
    WORLD.AMBIENT_SKY, WORLD.AMBIENT_GROUND, WORLD.AMBIENT_INTENSITY
  );
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(WORLD.SUN_COLOR, WORLD.SUN_INTENSITY);
  const el = WORLD.SUN_ELEVATION_DEG * Math.PI / 180;
  const az = WORLD.SUN_AZIMUTH_DEG * Math.PI / 180;
  sun.position.set(
    Math.cos(el) * Math.sin(az) * 300,
    Math.sin(el) * 300,
    Math.cos(el) * Math.cos(az) * 300
  );
  sun.castShadow = true;
  sun.shadow.mapSize.set(WORLD.SHADOW_MAP_SIZE, WORLD.SHADOW_MAP_SIZE);

  // Cascade-free: one shadow camera fitted to a box around the player,
  // repositioned every frame.
  const h = WORLD.SHADOW_BOX / 2;
  sun.shadow.camera.left = -h;
  sun.shadow.camera.right = h;
  sun.shadow.camera.top = h;
  sun.shadow.camera.bottom = -h;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 700;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.035;

  scene.add(sun);
  scene.add(sun.target);
  return sun;
}

async function start() {
  const bus = new EventBus();

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(WORLD.SKY_COLOR);
  scene.fog = new THREE.Fog(WORLD.SKY_COLOR, WORLD.FOG_NEAR, WORLD.FOG_FAR);

  const sun = setupLighting(scene);

  const t0 = performance.now();
  const { terrain, hash, sink, propStats, structureStats, roadPieces, structureMeshes } = buildWorld();
  // GLB props (Imagine refs → models) — async load, then scatter + collision
  const propLib = await loadPropLibrary();
  const assetPropStats = scatterAssetProps(
    scene, hash, terrain, mulberry32(WORLD.SEED ^ 0xa55e7), propLib, { count: 160 }
  );
  const genMs = performance.now() - t0;

  scene.add(terrain.buildMesh());
  scene.add(terrain.buildWater());
  for (const mesh of structureMeshes) scene.add(mesh);

  // Interactive doors + elevators — after hash exists, before play
  const doors = new DoorSystem(hash);
  const doorCount = doors.buildFromRegistry();
  scene.add(doors.group);
  const elevators = new ElevatorSystem(hash);
  const elevCount = elevators.buildFromRegistry();
  scene.add(elevators.group);

  const controller = new Controller(terrain, hash, bus);
  // Seat the player on the surface at spawn rather than trusting the config Y.
  controller.pos.y = terrain.heightAt(PLAYER.SPAWN.x, PLAYER.SPAWN.z) + 0.5;
  controller.prevPos.copy(controller.pos);

  const playerCam = new PlayerCamera(window.innerWidth / window.innerHeight);
  const input = new Input(renderer.domElement, bus);
  const hud = createHud();
  const combatHud = new CombatHud();
  const debug = new DebugOverlay(renderer);
  const mapView = new MapView(terrain);
  const clock = new Clock();

  // Combat + loot — weapon overlay scene (always-on-top gun)
  const effects = new CombatEffects(scene, playerCam.camera);
  const weaponOverlay = new WeaponOverlay(renderer);
  weaponOverlay.setAspect(window.innerWidth / window.innerHeight);
  const weapons = new WeaponSystem(playerCam, hash, bus, effects);
  weapons.attachOverlay(weaponOverlay);

  // Vehicles need hash + effects for collision / rockets
  const vehicles = new VehicleSystem(scene, terrain, bus, hash, effects);
  const vehicleCount = vehicles.spawn();
  // Roof rappel lines (after buildings exist)
  const rappels = new RappelSystem(scene, terrain);
  const rappelCount = rappels.spawn();
  // Friends multiplayer lobby UI
  const party = new PartyClient(bus);
  party.mountUi();
  // Map: rearm pads + gunner targeting (rooftop-aware)
  mapView.setRearmPads(VEHICLES.HELICOPTER?.rearmPads ?? []);
  mapView.setBuildings(worldBuildings);
  mapView.onTargetSelect = (t) => {
    vehicles.setMapTarget(t);
    const mode = vehicles.active?.aimMode === 'map' ? 'MAP' : 'FREE';
    hud.setError?.(`${mode} lock: ${t.kind}${t.label ? ` · ${t.label}` : ''} · T toggles mode`);
    setTimeout(() => hud.setError?.(''), 2200);
  };
  // Imagine → Blender viewmodels (async; falls back to procedural until loaded)
  const weaponLib = await loadWeaponLibrary();
  weapons.setWeaponModels(weaponLib.byClass);
  weapons.giveWeapon('vector7', 'common'); // starter AR for testing
  const loot = new LootSystem(scene, terrain, bus);
  loot.setWeaponModels(weaponLib.byClass); // ground loot uses same GLB silhouettes
  const lootStats = loot.populate(WORLD.SEED ^ 0x1007);
  const lootCount = lootStats.items ?? lootStats;
  const testRange = new TargetRange(scene, terrain);
  const bots = new BotSystem(scene, terrain, hash, bus, loot);
  const botCount = bots.spawn();
  const combatRng = mulberry32(WORLD.SEED ^ 0xc0b7);
  let prevFire = false;
  // Scratch list: live bots + optional P-key test range
  const combatTargets = [];

  bus.on('pointerlock', (locked) => {
    hud.setLocked(locked);
    combatHud.setVisible(locked);
    // Esc releases lock — close map only if it wasn't the map that exited lock.
    // Opening the map intentionally calls exitPointerLock so wheel/drag work.
    if (!locked && mapView.open && !mapView._suppressLockClose) {
      mapView.setOpen(false);
    }
  });
  bus.on('pointerlock:error', () => {
    // Chrome blocks re-locking for about a second after Esc.
    hud.setError('Pointer lock was blocked by the browser. Click again in a moment.');
  });
  hud.setLocked(false);
  combatHud.setVisible(false);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    playerCam.setAspect(window.innerWidth / window.innerHeight);
    weaponOverlay.setAspect(window.innerWidth / window.innerHeight);
  });

  const sunOffset = sun.position.clone();
  const stats = {
    aabbs: hash.count,
    props: propStats.placed,
    seed: WORLD.SEED,
  };

  console.info(
    `[world] generated in ${genMs.toFixed(0)}ms · ${sink.total} boxes · ` +
    `${hash.count} collision AABBs · ${propStats.placed}/${propStats.attempts} box-props · ` +
    `${assetPropStats.placed} glb-props · doors ${doorCount} · elevators ${elevCount} · ` +
    `vehicles ${vehicleCount} · rappels ${typeof rappelCount === 'object' ? `V${rappelCount.vertical}/H${rappelCount.horizontal}` : rappelCount} · loot ${lootStats.items ?? 0} items + ${lootStats.cases ?? 0} cases · bots ${botCount} · ` +
    `road segs ${roadPieces} · structures ${JSON.stringify(structureStats)}`
  );

  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  function frame() {
    requestAnimationFrame(frame);

    // Mouse look is applied once per frame; it is inherently frame-rate driven.
    // Freeze look while the tactical map is open so the cursor isn't fighting M.
    if (input.locked && !mapView.open) {
      const { dx, dy } = input.consumeMouse();
      playerCam.applyMouse(dx, dy);
    } else {
      input.consumeMouse();
    }

    if (input.actionPressed('debug')) debug.toggle();
    if (input.actionPressed('map')) mapView.toggle();
    if (input.actionPressed('testRange') && input.locked) {
      testRange.toggle(controller.pos);
    }

    clock.advance((dt) => {
      controller.ads = input.locked && input.buttons.has(2) && !mapView.open;
      // Allow movement while map is open, but not while pointer is unlocked.
      if (input.locked && !mapView.open) {
        // Weapon hotkeys
        if (input.actionPressed('weapon1')) weapons.selectSlot(0);
        if (input.actionPressed('weapon2')) weapons.selectSlot(1);
        if (input.actionPressed('quickSwap')) weapons.quickSwap();
        if (input.actionPressed('reload')) weapons.startReload();

        // Seat swap (solo pilot ↔ gunner)
        if (vehicles.riding && input.actionPressed('seatSwap')) {
          vehicles.swapSeat();
        }

        // E = vehicle → rappel/zipline → loot → elevator → door
        if (input.actionPressed('interact')) {
          const usedVeh = vehicles.tryUse(controller);
          if (!usedVeh) {
            // E = one floor; Shift+E = express to roof (or down if near top)
            const usedRappel = rappels.tryUse(controller, {
              express: input.action('sprint'),
            });
            if (!usedRappel) {
              const gotLoot = loot.tryPickup(
                weapons,
                controller.pos.x,
                controller.pos.y + controller.height * 0.35,
                controller.pos.z
              );
              if (!gotLoot) {
                // Shift+E = elevator express to top (or ground if already top)
                const usedElev = elevators.tryUse(controller, {
                  express: input.action('sprint'),
                });
                if (!usedElev) {
                  doors.tryToggle(
                    controller.pos.x,
                    controller.pos.y + controller.height * 0.5,
                    controller.pos.z
                  );
                }
              }
            }
          }
        }

        // Riding: vehicle → rappel express → on foot
        if (!vehicles.update(dt, controller, input, playerCam.yaw)) {
          if (!rappels.update(dt, controller, input)) {
            controller.tick(dt, input, playerCam.yaw);
          }
        }
        elevators.update(dt, vehicles.riding || rappels.riding ? null : controller);

        // Gunner map mode
        mapView.setGunnerMode(
          vehicles.isGunner,
          vehicles.isGunner ? vehicles.getMapTargets(bots.getLiveTargets()) : []
        );

        // Combat: bots move/engage first so bullets test current hitboxes
        const moving = controller.speed > 0.6;
        bots.update(dt, controller.pos, weapons);
        combatTargets.length = 0;
        const liveBots = bots.getLiveTargets();
        for (let i = 0; i < liveBots.length; i++) combatTargets.push(liveBots[i]);
        if (testRange.active) {
          const tr = testRange.getLiveTargets();
          for (let i = 0; i < tr.length; i++) combatTargets.push(tr[i]);
        }
        const fireDown = input.buttons.has(0);
        if (vehicles.rideType === 'helicopter' && vehicles.isGunner) {
          // Gunner: map lock or free-aim (T toggles). Missiles then seek.
          if (fireDown && !prevFire && !mapView.open) {
            const ok = vehicles.tryFireRockets(combatTargets, {
              yaw: playerCam.yaw,
              pitch: playerCam.pitch,
            });
            if (!ok) {
              const mode = vehicles.active?.aimMode === 'map' ? 'map' : 'direct';
              if (mode === 'map' && !vehicles.active?.mapTarget) {
                hud.setError?.('MAP mode: open M, click a target (or press T for free-aim)');
              } else {
                hud.setError?.('No shot — check range / ammo');
              }
              setTimeout(() => hud.setError?.(''), 2200);
            }
          }
          prevFire = fireDown;
        } else if (vehicles.rideType === 'helicopter') {
          // Pilot: no guns — just fly
          prevFire = fireDown;
        } else if (!vehicles.riding) {
          if (fireDown && !prevFire) {
            weapons.firePressed(combatTargets, testRange.active ? testRange : null, combatRng, moving);
          }
          prevFire = fireDown;
          weapons.tick(dt, input, combatTargets, testRange.active ? testRange : null, combatRng, moving);
        } else {
          // Motorcycle: still allow guns if wanted — but hide overlay is enough
          if (fireDown && !prevFire) {
            weapons.firePressed(combatTargets, testRange.active ? testRange : null, combatRng, moving);
          }
          prevFire = fireDown;
          weapons.tick(dt, input, combatTargets, testRange.active ? testRange : null, combatRng, moving);
        }
      } else {
        // Keep gravity and collision alive so the player settles while unlocked / on map.
        controller.tick(dt, IDLE_INPUT, playerCam.yaw);
        elevators.update(dt, null);
        vehicles.update(dt, null, IDLE_INPUT, playerCam.yaw);
        bots.update(dt, null, null);
        prevFire = false;
      }
      doors.update(dt);
      loot.update(dt);
      input.endTick();
    });

    const strafe = input.locked && !mapView.open
      ? (input.action('right') ? 1 : 0) - (input.action('left') ? 1 : 0)
      : 0;
    playerCam.update(
      clock.frameDelta,
      controller,
      clock.alpha,
      strafe,
      vehicles.active // third-person chase when riding
    );

    // Friends party state fan-out
    party.update(clock.frameDelta, {
      x: controller.pos.x,
      y: controller.pos.y,
      z: controller.pos.z,
      yaw: playerCam.yaw,
      seat: vehicles.riding ? vehicles.localSeat : null,
      heliId: vehicles.active?.id ?? null,
      health: weapons.health,
    });

    // Hide FPS gun completely while in any vehicle (overlay uses .root not .group)
    if (weaponOverlay?.root) weaponOverlay.root.visible = !vehicles.riding;
    if (weapons.viewGroup) weapons.viewGroup.visible = !vehicles.riding;

    if (!vehicles.riding) {
      const hipFov = playerCam.fov;
      const def = weapons.def;
      const zoomTarget = def?.scopeZoomFov ?? 48;
      const adsFov = THREE.MathUtils.lerp(hipFov, zoomTarget, weapons.ads);
      if (Math.abs(playerCam.camera.fov - adsFov) > 0.05) {
        playerCam.camera.fov = adsFov;
        playerCam.camera.updateProjectionMatrix();
      }
      const wFov = THREE.MathUtils.lerp(50, def?.scopeOverlay ? 38 : 42, weapons.ads);
      if (Math.abs(weaponOverlay.camera.fov - wFov) > 0.1) {
        weaponOverlay.camera.fov = wFov;
        weaponOverlay.camera.updateProjectionMatrix();
      }
    }

    // Refit the shadow camera to the player each frame.
    sun.target.position.set(controller.pos.x, controller.pos.y, controller.pos.z);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.target.updateMatrixWorld();

    effects.update(clock.frameDelta);

    // Interact prompt
    if (input.locked && !mapView.open) {
      const px = controller.pos.x;
      const py = controller.pos.y + controller.height * 0.5;
      const pz = controller.pos.z;
      hud.setPrompt(
        vehicles.prompt(px, py, pz)
        || loot.prompt(px, py, pz)
        || elevators.prompt(px, py, pz)
        || rappels.prompt(px, py, pz)
        || doors.prompt(px, py, pz)
      );
    } else {
      hud.setPrompt(null);
    }

    combatHud.update(
      weapons.hudState(),
      testRange.active ? testRange.stats : null
    );

    renderer.render(scene, playerCam.camera);
    // Gun overlay only on foot (hidden while riding)
    if (input.locked && !vehicles.riding) weaponOverlay.render();
    mapView.update(
      controller.pos,
      playerCam.yaw,
      vehicles.vehicles,
      vehicles.isGunner ? vehicles.getMapTargets(bots.getLiveTargets()) : null
    );
    debug.update(clock.frameDelta, controller, stats);
  }

  requestAnimationFrame(frame);

  // Expose for console poking and for the smoke test.
  window.__game = {
    scene, renderer, controller, terrain, hash, playerCam, stats, clock, SIM, mapView,
    weapons, loot, testRange, effects,
  };
}

// A no-op input so the controller can still simulate while the pointer is free.
const IDLE_INPUT = {
  action: () => false,
  actionPressed: () => false,
  buttons: new Set(),
};

// Let the loading text paint before the synchronous world build blocks.
requestAnimationFrame(() => requestAnimationFrame(start));
