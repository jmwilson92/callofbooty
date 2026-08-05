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
import { Controller } from './player/Controller.js';
import { PlayerCamera } from './player/Camera.js';
import { DebugOverlay, createHud } from './ui/Debug.js';

// Bootstrap and system wiring. Systems receive their dependencies here and
// otherwise talk through the event bus.

function buildWorld() {
  const rng = mulberry32(WORLD.SEED ^ 0x5f3a);
  const terrain = new Terrain(WORLD.SEED);
  const hash = new SpatialHash();
  const sink = new BoxSink();

  buildAllStructures(sink, terrain, rng);
  const propStats = scatterProps(sink, terrain, rng);
  sink.registerCollision(hash);

  return { terrain, hash, sink, propStats };
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

function start() {
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
  const { terrain, hash, sink, propStats } = buildWorld();
  const genMs = performance.now() - t0;

  scene.add(terrain.buildMesh());
  scene.add(terrain.buildWater());
  for (const mesh of sink.buildMeshes()) scene.add(mesh);

  const controller = new Controller(terrain, hash, bus);
  // Seat the player on the surface at spawn rather than trusting the config Y.
  controller.pos.y = terrain.heightAt(PLAYER.SPAWN.x, PLAYER.SPAWN.z) + 0.5;
  controller.prevPos.copy(controller.pos);

  const playerCam = new PlayerCamera(window.innerWidth / window.innerHeight);
  const input = new Input(renderer.domElement, bus);
  const hud = createHud();
  const debug = new DebugOverlay(renderer);
  const clock = new Clock();

  bus.on('pointerlock', (locked) => hud.setLocked(locked));
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
    `${hash.count} collision AABBs · ${propStats.placed}/${propStats.attempts} props placed`
  );

  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  function frame() {
    requestAnimationFrame(frame);

    // Mouse look is applied once per frame; it is inherently frame-rate driven.
    if (input.locked) {
      const { dx, dy } = input.consumeMouse();
      playerCam.applyMouse(dx, dy);
    } else {
      input.consumeMouse();
    }

    if (input.actionPressed('debug')) debug.toggle();

    clock.advance((dt) => {
      controller.ads = input.locked && input.buttons.has(2);
      if (input.locked) {
        controller.tick(dt, input, playerCam.yaw);
      } else {
        // Keep gravity and collision alive so the player settles while unlocked.
        controller.tick(dt, IDLE_INPUT, playerCam.yaw);
      }
      input.endTick();
    });

    const strafe = input.locked
      ? (input.action('right') ? 1 : 0) - (input.action('left') ? 1 : 0)
      : 0;
    playerCam.update(clock.frameDelta, controller, clock.alpha, strafe);

    // Refit the shadow camera to the player each frame.
    sun.target.position.set(controller.pos.x, controller.pos.y, controller.pos.z);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.target.updateMatrixWorld();

    renderer.render(scene, playerCam.camera);
    debug.update(clock.frameDelta, controller, stats);
  }

  requestAnimationFrame(frame);

  // Expose for console poking and for the smoke test.
  window.__game = { scene, renderer, controller, terrain, hash, playerCam, stats, clock, SIM };
}

// A no-op input so the controller can still simulate while the pointer is free.
const IDLE_INPUT = {
  action: () => false,
  actionPressed: () => false,
  buttons: new Set(),
};

// Let the loading text paint before the synchronous world build blocks.
requestAnimationFrame(() => requestAnimationFrame(start));
