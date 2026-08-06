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
import { Controller } from './player/Controller.js';
import { PlayerCamera } from './player/Camera.js';
import { DebugOverlay, createHud } from './ui/Debug.js';
import { MapView } from './ui/MapView.js';

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
  sink.registerCollision(hash);

  return { terrain, hash, sink, propStats, structureStats, roadPieces: terrain.roads?.length ?? 0 };
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
  const { terrain, hash, sink, propStats, structureStats, roadPieces } = buildWorld();
  // GLB props (Imagine refs → models) — async load, then scatter + collision
  const propLib = await loadPropLibrary();
  const assetPropStats = scatterAssetProps(
    scene, hash, terrain, mulberry32(WORLD.SEED ^ 0xa55e7), propLib, { count: 160 }
  );
  const genMs = performance.now() - t0;

  scene.add(terrain.buildMesh());
  scene.add(terrain.buildWater());
  for (const mesh of sink.buildMeshes()) scene.add(mesh);

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
  const debug = new DebugOverlay(renderer);
  const mapView = new MapView(terrain);
  const clock = new Clock();

  bus.on('pointerlock', (locked) => {
    hud.setLocked(locked);
    // Closing pointer lock with Esc should also dismiss the tactical map.
    if (!locked && mapView.open) mapView.setOpen(false);
  });
  bus.on('pointerlock:error', () => {
    // Chrome blocks re-locking for about a second after Esc.
    hud.setError('Pointer lock was blocked by the browser. Click again in a moment.');
  });
  hud.setLocked(false);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    playerCam.setAspect(window.innerWidth / window.innerHeight);
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

    clock.advance((dt) => {
      controller.ads = input.locked && input.buttons.has(2) && !mapView.open;
      // Allow movement while map is open, but not while pointer is unlocked.
      if (input.locked && !mapView.open) {
        // E = elevator first (if near), else door
        if (input.actionPressed('interact')) {
          const usedElev = elevators.tryUse(controller);
          if (!usedElev) {
            doors.tryToggle(
              controller.pos.x,
              controller.pos.y + controller.height * 0.5,
              controller.pos.z
            );
          }
        }
        controller.tick(dt, input, playerCam.yaw);
        // Stick player to elevator after movement solve
        elevators.update(dt, controller);
      } else {
        // Keep gravity and collision alive so the player settles while unlocked / on map.
        controller.tick(dt, IDLE_INPUT, playerCam.yaw);
        elevators.update(dt, null);
      }
      doors.update(dt);
      input.endTick();
    });

    const strafe = input.locked && !mapView.open
      ? (input.action('right') ? 1 : 0) - (input.action('left') ? 1 : 0)
      : 0;
    playerCam.update(clock.frameDelta, controller, clock.alpha, strafe);

    // Refit the shadow camera to the player each frame.
    sun.target.position.set(controller.pos.x, controller.pos.y, controller.pos.z);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.target.updateMatrixWorld();

    // Interact prompt (elevator or door)
    if (input.locked && !mapView.open) {
      const px = controller.pos.x;
      const py = controller.pos.y + controller.height * 0.5;
      const pz = controller.pos.z;
      hud.setPrompt(elevators.prompt(px, py, pz) || doors.prompt(px, py, pz));
    } else {
      hud.setPrompt(null);
    }

    renderer.render(scene, playerCam.camera);
    mapView.update(controller.pos, playerCam.yaw);
    debug.update(clock.frameDelta, controller, stats);
  }

  requestAnimationFrame(frame);

  // Expose for console poking and for the smoke test.
  window.__game = { scene, renderer, controller, terrain, hash, playerCam, stats, clock, SIM, mapView };
}

// A no-op input so the controller can still simulate while the pointer is free.
const IDLE_INPUT = {
  action: () => false,
  actionPressed: () => false,
  buttons: new Set(),
};

// Let the loading text paint before the synchronous world build blocks.
requestAnimationFrame(() => requestAnimationFrame(start));
