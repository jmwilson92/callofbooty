import * as THREE from 'three';
import { WORLD, PLAYER, SIM, PARACHUTE, DOWNED } from './config.js';
import { EventBus } from './core/EventBus.js';
import { Clock } from './core/Clock.js';
import { Input } from './core/Input.js';
import { mulberry32, clamp } from './core/Noise.js';
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
import { PeerBodies } from './net/PeerBodies.js';
import {
  buildFpArms,
  buildWorldAvatar,
  buildParachuteCanopy,
  animateAvatar,
  animateFpArms,
} from './player/Avatar.js';
import { VEHICLES, BR } from './config.js';
import { worldBuildings } from './world/BuildingRegistry.js';
import { BuyCacheSystem } from './world/BuyCaches.js';
import { Loadout } from './player/Loadout.js';
import { SpottingSystem } from './combat/Spotting.js';
import { ThrowableSystem } from './combat/Throwables.js';
import { MatchController } from './game/Match.js';
import { ZoneSystem } from './game/Zone.js';
import { THROWABLES } from './config.js';
import { EndScreen } from './ui/EndScreen.js';

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
  // Temp seat on ground; moved to roof pad after helis spawn
  controller.pos.set(
    PLAYER.SPAWN.x,
    terrain.heightAt(PLAYER.SPAWN.x, PLAYER.SPAWN.z) + 0.5,
    PLAYER.SPAWN.z
  );
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
  // Rocket splash needs live bots + player vitals (wired after systems exist; re-set below)
  // Drop in on the roof next to a heli
  const heliSpawn = vehicles.getHeliRoofSpawn();
  if (heliSpawn) {
    controller.pos.set(heliSpawn.x, heliSpawn.y, heliSpawn.z);
    controller.prevPos.copy(controller.pos);
    controller.vel.set(0, 0, 0);
    controller.grounded = true;
    playerCam.yaw = heliSpawn.yaw;
    playerCam._initialised = false; // snap cam on first frame
  }
  // Roof rappel lines (after buildings exist)
  const rappels = new RappelSystem(scene, terrain);
  const rappelCount = rappels.spawn();
  // Friends multiplayer lobby UI + visible peer bodies
  const party = new PartyClient(bus);
  party.mountUi();
  const peerBodies = new PeerBodies(scene, party, vehicles);

  // First-person hands — parented under the weapon so they stick to the gun
  const fpArms = buildFpArms();
  weapons.viewGroup.add(fpArms);
  const localBody = buildWorldAvatar({
    color: 0x3a8fd4,
    ally: true,
    name: null,
  });
  localBody.visible = false; // third-person: vehicles / parachute / downed
  const localChute = buildParachuteCanopy({
    radius: PARACHUTE.CANOPY_RADIUS,
    height: PARACHUTE.CANOPY_HEIGHT,
    color: 0xc84a3a,
  });
  localBody.add(localChute);
  scene.add(localBody);
  let avatarTime = 0;

  // Visible player damage (bots were silently chewing HP in the heli)
  bus.on('player:damage', (ev) => {
    const amt = Math.round(ev?.amount || 0);
    if (ev?.blocked && ev?.head) {
      combatHud.flashDamage?.(0, 'HELMET');
      loadout.cancelPlate?.();
      loadout.cancelHeal?.();
      return;
    }
    if (amt <= 0) return;
    loadout.cancelPlate?.();
    loadout.cancelHeal?.();
    const src = ev?.source === 'gas' ? 'GAS'
      : ev?.source === 'bot_head' ? 'HEADSHOT'
        : ev?.source === 'bot' ? 'BOT FIRE'
          : ev?.source === 'rocket' ? 'EXPLOSION'
            : ev?.source === 'grenade' ? 'FRAG'
              : 'DAMAGE';
    combatHud.flashDamage?.(amt, src);
  });
  bus.on('loot:pickup', (ev) => {
    if (ev?.kind === 'cash' && ev.amount > 0) {
      combatHud.flashCash?.(ev.amount, ev.total);
    }
    if (ev?.kind === 'silver') {
      hud.setError?.('SILVER BULLET — Space to self-revive');
      setTimeout(() => hud.setError?.(''), 2200);
    }
  });

  /** Drop player from the sky after a deploy flare (self or party). */
  const doRedeploy = () => {
    if (!loadout.dead && !loadout.waitingRedeploy) return false;
    // Exit vehicle if any
    if (vehicles.riding) {
      try {
        vehicles.tryUse(controller, { allowDismount: true });
      } catch { /* */ }
    }
    loadout.redeploy(PARACHUTE.REDEPLOY_HEALTH ?? 80);
    // Spawn high above current map area (or spawn POI)
    const sx = PLAYER.SPAWN.x + (Math.random() - 0.5) * 80;
    const sz = PLAYER.SPAWN.z + (Math.random() - 0.5) * 80;
    const ground = terrain.heightAt(sx, sz);
    const h = PARACHUTE.REDEPLOY_HEIGHT ?? 160;
    controller.pos.set(sx, ground + h, sz);
    controller.prevPos.copy(controller.pos);
    controller.vel.set(0, -2, 0);
    controller.grounded = false;
    controller.parachute = true;
    controller.chuteCutsLeft = PARACHUTE.MAX_CUTS ?? 2;
    controller._chuteCutsMade = 0;
    controller._airborneSession = true;
    playerCam._initialised = false;
    hud.setError?.('REDEPLOY — Space cut chute · Space again to reopen (2 cuts)');
    setTimeout(() => hud.setError?.(''), 4000);
    bus.emit('player:redeploy', {});
    return true;
  };

  bus.on('shop:deploy_flare', (ev) => {
    const cacheSys = ev?.cache;
    // Prefer bringing back local player if dead; else notify party
    if (loadout.dead || loadout.waitingRedeploy) {
      if (cacheSys) cacheSys._deployOk = true;
      doRedeploy();
      return;
    }
    // Ask party for a dead teammate (they redeploy on their client when they receive it)
    if (party.connected && party.ws?.readyState === 1) {
      try {
        party.ws.send(JSON.stringify({ type: 'redeploy', room: party.room }));
        if (cacheSys) cacheSys._deployOk = true;
        hud.setError?.('Deploy flare fired for teammates');
        setTimeout(() => hud.setError?.(''), 2500);
      } catch {
        if (cacheSys) cacheSys._deployOk = false;
      }
    } else if (cacheSys) {
      cacheSys._deployOk = false;
    }
  });

  // Party redeploy broadcast → local drop if dead
  bus.on('party:redeploy', () => {
    if (loadout.dead || loadout.waitingRedeploy) doRedeploy();
  });
  const _partyOnMsg = party._onMsg.bind(party);
  party._onMsg = (msg) => {
    _partyOnMsg(msg);
  };
  bus.on('bot:tracer', (ev) => {
    if (!ev?.from || !ev?.to || !effects?.spawnTracer) return;
    try {
      const a = new THREE.Vector3(ev.from.x, ev.from.y, ev.from.z);
      const b = new THREE.Vector3(ev.to.x, ev.to.y, ev.to.z);
      // opts object (color via material defaults) — bright long tracer
      effects.spawnTracer?.(a, b, { long: true, life: 0.12 });
    } catch { /* optional */ }
  });

  // Map: rearm pads (live positions after terrain seat) + gunner targeting
  mapView.setRearmPads(vehicles.getRearmPads());
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
  const loadout = new Loadout(weapons);
  const loot = new LootSystem(scene, terrain, bus);
  loot.setWeaponModels(weaponLib.byClass); // ground loot uses same GLB silhouettes
  const lootStats = loot.populate(WORLD.SEED ^ 0x1007);
  const lootCount = lootStats.items ?? lootStats;
  const buyCaches = new BuyCacheSystem(scene, terrain, bus);
  const cacheCount = buyCaches.spawn();
  const testRange = new TargetRange(scene, terrain);
  const bots = new BotSystem(scene, terrain, hash, bus, loot);
  const botCount = bots.spawn();
  // ── Shared combat: same state channel as heli (rk / bs / bk) ────────
  bus.on('vehicle:rocket_net', (payload) => {
    if (!party.connected) {
      hud.setError?.('PARTY OFFLINE — rockets not shared');
      setTimeout(() => hud.setError?.(''), 2000);
      return;
    }
    const ok = party.noteRocket?.(payload);
    if (!ok) console.warn('[party] noteRocket failed', payload);
  });
  // Gunner impact point — pilot snaps boom here (same map spot)
  bus.on('vehicle:rocket_impact', (payload) => {
    if (!party.connected) return;
    party.noteRocketImpact?.(payload);
  });
  bus.on('party:rocket', (msg) => {
    try {
      const n = msg?.projectiles?.length ?? 0;
      const ok = vehicles.spawnNetworkRockets?.(msg, bots.getLiveTargets?.() || []);
      console.info('[party] spawn remote rockets', n, 'ok=', ok);
      if (ok) {
        hud.setError?.(`GUNNER FIRE · ${n} rockets`);
        setTimeout(() => hud.setError?.(''), 1000);
      }
    } catch (err) {
      console.warn('[party] rocket spawn error', err);
    }
  });
  bus.on('party:rocket_impact', (msg) => {
    try {
      vehicles.applyNetworkImpact?.(msg);
    } catch (err) {
      console.warn('[party] rocket impact error', err);
    }
  });
  bus.on('bot:killed', (ev) => {
    // Clutch: kill while downed → silver bullet for self-revive (drop + grant)
    if (!ev?.remote && ev?.source === 'player' && loadout.downed && !loadout.dead) {
      loadout.grantSilverBullet?.(1);
      if (loot.spawnSilverBullet && ev.x != null && ev.z != null) {
        loot.spawnSilverBullet(ev.x, ev.z);
      }
      hud.setError?.('SILVER BULLET — Space to self-revive');
      setTimeout(() => hud.setError?.(''), 2800);
    }
    if (!party.connected || ev?.remote) return;
    if (ev?.source && ev.source !== 'player') return;
    if (ev?.part === 'gas') return;
    party.noteBotKill?.({
      botId: ev?.id,
      x: ev?.x,
      y: ev?.y,
      z: ev?.z,
      part: ev?.part,
    });
  });
  bus.on('party:bot_kill', (msg) => {
    try {
      const ok = bots.applyRemoteKill?.(msg);
      if (ok) {
        hud.setError?.('SQUAD KILL');
        setTimeout(() => hud.setError?.(''), 800);
      }
    } catch (err) {
      console.warn('[party] bot_kill error', err);
    }
  });

  // Gunner can take pilot when friend is downed
  vehicles.setPeerIncapCheck?.((peerId) => party.peerIncapacitated?.(peerId));
  let _wasDowned = false;
  // Missile blast radius damages bots, vehicles, and the local player
  const playerVitalsProxy = () => ({
    get x() { return controller.pos.x; },
    get y() { return controller.pos.y; },
    get z() { return controller.pos.z; },
    get health() { return weapons.health; },
    set health(v) { weapons.health = v; },
    get armor() { return weapons.armor; },
    set armor(v) { weapons.armor = v; },
    get helmet() { return weapons.helmet; },
    set helmet(v) { weapons.helmet = v; },
    get dead() { return loadout.dead; },
    applyDamage: (amount) => {
      weapons.health = Math.max(0, weapons.health - amount);
    },
  });
  vehicles.setSplashProviders(
    () => bots.getLiveTargets(),
    playerVitalsProxy
  );
  const spotting = new SpottingSystem(hash);
  const throwables = new ThrowableSystem(scene, terrain, bus, effects);
  throwables.setProviders(
    () => bots.getLiveTargets(),
    playerVitalsProxy
  );
  // Smoke blocks bot vision
  const _botHasLos = bots._hasLOS.bind(bots);
  bots._hasLOS = (x0, y0, z0, x1, y1, z1) => {
    if (throwables.inSmoke(x1, y1, z1) || throwables.inSmoke(x0, y0, z0)) return false;
    return _botHasLos(x0, y0, z0, x1, y1, z1);
  };
  const zone = new ZoneSystem(scene, terrain, WORLD.SEED ^ 0xb07a);
  const match = new MatchController(bus, bots, party, zone);
  match.prepareBots();
  if (BR.enabled) {
    match.setHardcore(true); // no bot respawn during BR
    match.start();
  }
  // Friends: shared zone seed + vehicle peer id for co-op heli seats
  party.onRoom = (room) => {
    vehicles.setLocalPeerId(party.peerId);
    if (!BR.enabled || !room) return;
    match.start(ZoneSystem.seedFromRoom(room));
    match.setHardcore(true);
  };
  // Also set peer id when welcome arrives (before/without BR restart)
  bus.on?.('party:welcome', () => vehicles.setLocalPeerId(party.peerId));

  const endScreen = new EndScreen();
  endScreen.preload();
  endScreen.onPlayAgain = () => {
    // Soft restart: reload is the reliable wipe for bots/zone/loot state
    window.location.reload();
  };
  endScreen.onMainMenu = () => {
    window.location.reload();
  };
  bus.on('match:end', (report) => {
    const localStatus = loadout.dead || loadout.waitingRedeploy
      ? 'kia'
      : loadout.downed
        ? 'downed'
        : 'extracted';
    // Mark one filler as KIA if local died so the cutscene still shows "the boys"
    if (report?.squad) {
      for (const op of report.squad) {
        if (op.local) op.status = localStatus;
      }
    }
    endScreen.play(report, { localStatus });
    combatHud.setVisible(false);
    try {
      document.exitPointerLock?.();
    } catch { /* */ }
    hud.setError?.('EXTRACTING…');
    setTimeout(() => hud.setError?.(''), 1500);
  });
  // Console debug: window.__forceWin()
  if (typeof window !== 'undefined') {
    window.__forceWin = () => match.forceWin('debug');
    window.__match = match;
  }

  const combatRng = mulberry32(WORLD.SEED ^ 0xc0b7);
  let prevFire = false;
  // Scratch list: live bots + optional P-key test range
  const combatTargets = [];

  bus.on('pointerlock', (locked) => {
    if (locked) {
      // Enter / resume play — hide start overlay until Esc
      hud.setLocked(true);
      combatHud.setVisible(true);
      party.setLobbyVisible(false);
      return;
    }
    // Unlocked: map / shop temporarily release lock — do NOT show pause overlay
    if (mapView.open || mapView._suppressLockClose || buyCaches.openCache) {
      hud.setLocked(false, { keepPlaying: true });
      combatHud.setVisible(true);
      party.setLobbyVisible(false);
      return;
    }
    // Esc (or other intentional unlock) — show pause / start overlay only
    hud.setLocked(false, { forceMenu: true });
    combatHud.setVisible(false);
    party.setLobbyVisible(true);
    hud.setGunnerMode?.(null);
    // Close map if it was open without suppress flag
    if (mapView.open) mapView.setOpen(false);
  });
  bus.on('pointerlock:error', () => {
    hud.setError(
      'Pointer lock blocked — click CLICK TO PLAY again. ' +
      'If this keeps failing, open the game in a normal browser tab (not a VS Code Simple Browser).'
    );
  });
  hud.setLocked(false);
  combatHud.setVisible(false);
  // Explicit play button (pointer-events: auto) so start isn't stuck behind UI
  hud.bindPlay?.(() => input.requestLock());
  // Closing map re-locks pointer without showing pause menu
  mapView.onClose = () => {
    setTimeout(() => input.requestLock(), 30);
  };
  bus.on('shop:open', () => {
    // keepPlaying so pause menu doesn't appear while shopping
    hud.setLocked(false, { keepPlaying: true });
  });
  bus.on('shop:close', (ev) => {
    if (ev?.relock) setTimeout(() => input.requestLock(), 40);
  });

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
    `vehicles ${vehicleCount} · rappels ${typeof rappelCount === 'object' ? `V${rappelCount.vertical}/H${rappelCount.horizontal}` : rappelCount} · loot ${lootStats.items ?? 0} items + ${lootStats.cases ?? 0} cases · caches ${cacheCount} · bots ${botCount} · ` +
    `road segs ${roadPieces} · structures ${JSON.stringify(structureStats)} · BR ${match.phase}`
  );

  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  function frame() {
    requestAnimationFrame(frame);

    // Victory cutscene / scoreboard owns the screen — freeze combat sim
    if (endScreen.visible) {
      input.consumeMouse();
      // Advance clock for real dt without running gameplay ticks
      clock.advance(() => {});
      endScreen.update(clock.frameDelta || 1 / 60);
      // Keep rendering the frozen world under the overlay for atmosphere
      renderer.render(scene, playerCam.camera);
      return;
    }

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
      // Missiles keep flying even if you're not the one who fired (remote gunner)
      vehicles.tickProjectiles?.(dt);
      // Shared heli airframe from remote pilot (before local vehicle / gunner ride-along)
      if (party.connected && party.peers.size) {
        if (!vehicles.localPeerId && party.peerId) vehicles.setLocalPeerId(party.peerId);
        vehicles.applyPartyPeers(party.peers, dt);
      }
      // Allow movement while map is open, but not while pointer is unlocked.
      if (input.locked && !mapView.open) {
        // Weapon hotkeys (blocked while downed — pistol only via enterDowned)
        if (!loadout.downed && !loadout.dead) {
          if (input.actionPressed('weapon1')) weapons.selectSlot(0);
          if (input.actionPressed('weapon2')) weapons.selectSlot(1);
          if (input.actionPressed('quickSwap')) weapons.quickSwap();
        }
        // Reload pistol while downed; no reload after full death
        if (!loadout.dead && input.actionPressed('reload')) weapons.startReload();

        // Seat swap (solo pilot ↔ gunner). Gunner can steal pilot if pilot is downed.
        if (vehicles.riding && input.actionPressed('seatSwap')) {
          const before = vehicles.localSeat;
          const ok = vehicles.localSeat === 'gunner'
            ? (vehicles.tryClaimPilot() || vehicles.swapSeat())
            : vehicles.swapSeat();
          if (ok) {
            hud.setError?.(
              vehicles.localSeat === 'pilot'
                ? 'PILOT — you have the stick'
                : vehicles.localSeat === 'gunner'
                  ? 'GUNNER — rockets ready'
                  : 'PASSENGER'
            );
            setTimeout(() => hud.setError?.(''), 1600);
          } else if (before === 'gunner') {
            hud.setError?.('Pilot seat held by healthy teammate');
            setTimeout(() => hud.setError?.(''), 1600);
          }
        }
        // Pilot just went down in the bird — free the stick for gunner
        if (loadout.downed && !_wasDowned && vehicles.riding && vehicles.localSeat === 'pilot') {
          vehicles.yieldPilotWhenDowned?.();
          hud.setError?.('DOWNED — gunner can press V to pilot');
          setTimeout(() => hud.setError?.(''), 2800);
        }
        _wasDowned = !!loadout.downed;
        // Alert gunner when remote pilot is incapacitated
        if (vehicles.isGunner && vehicles.active) {
          const pilotId = vehicles.active.seats?.pilot;
          if (pilotId && pilotId !== 'local' && party.peerIncapacitated?.(pilotId)) {
            if (!vehicles._warnedPilotDown) {
              vehicles._warnedPilotDown = true;
              hud.setError?.('PILOT DOWNED — press V to take the stick');
              setTimeout(() => hud.setError?.(''), 3200);
            }
          } else {
            vehicles._warnedPilotDown = false;
          }
        }

        // Close shop without locking if Esc while shop open
        if (buyCaches.openCache && input.actionPressed('interact')) {
          buyCaches.closeShop();
        } else if (input.actionPressed('interact')) {
          // Dead: shops only (deploy flare).
          // Downed: can pick up silver bullets / nearby loot for self-revive.
          // Alive: full interact chain.
          if (loadout.dead || loadout.waitingRedeploy) {
            buyCaches.tryUse(controller, loadout);
          } else if (loadout.downed) {
            // Only silver / self-revive pickups while bleeding out
            const near = loot.nearestItem?.(controller.pos.x, controller.pos.z, 2.8);
            if (near && (near.kind === 'silver' || near.kind === 'instant_revive')) {
              const n = Math.max(1, near.amount | 0);
              loadout.grantSilverBullet?.(n);
              loot._remove?.(near);
              hud.setError?.('SILVER BULLET — Space to self-revive');
              setTimeout(() => hud.setError?.(''), 2200);
            }
          } else if (!loadout.downed) {
            const usedShop = buyCaches.tryUse(controller, loadout);
            if (!usedShop) {
              const usedVeh = vehicles.tryUse(controller, {
                requireLanded: vehicles.rideType === 'helicopter',
              });
              if (usedVeh && vehicles.riding) {
                const seat = vehicles.localSeat;
                hud.setError?.(
                  seat === 'gunner'
                    ? 'GUNNER SEAT — friend is piloting'
                    : 'PILOT SEAT — fly the bird'
                );
                setTimeout(() => hud.setError?.(''), 1800);
              } else if (!usedVeh && vehicles.findNear?.(controller.pos.x, controller.pos.y, controller.pos.z)) {
                // Near a full bird
                const near = vehicles.findNear(controller.pos.x, controller.pos.y, controller.pos.z);
                if (near?.seats?.pilot && near?.seats?.gunner) {
                  hud.setError?.('Chopper full — both seats taken');
                  setTimeout(() => hud.setError?.(''), 1800);
                }
              }
              if (!usedVeh) {
                const usedRappel = rappels.tryUse(controller, {
                  express: input.action('sprint'),
                });
                if (!usedRappel) {
                  const gotLoot = loot.tryPickup(
                    weapons,
                    controller.pos.x,
                    controller.pos.y + controller.height * 0.35,
                    controller.pos.z,
                    loadout
                  );
                  if (!gotLoot) {
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
          }
        }

        // Consumables / gear
        // Self-revive only while downed (not after permanent death)
        if (loadout.downed && !loadout.dead) {
          if (input.actionPressed('jump')) loadout.tryRevive(true);
          else if (input.actionPressed('crouch')) loadout.tryRevive(false);
        }

        // Throwables + UAV + stim + plates (on foot, alive)
        if (!loadout.downed && !loadout.dead && !vehicles.riding) {
          const eye = controller.eyePosition;

          // 3 = insert armor plate (channel)
          if (input.actionPressed('plate')) {
            if (loadout.startPlate()) {
              hud.setError?.('Inserting plate…');
            } else if (loadout.plates <= 0) {
              hud.setError?.('No plates — buy at supply cache');
              setTimeout(() => hud.setError?.(''), 1800);
            } else if ((weapons.armor || 0) >= loadout.armorCap() - 0.5) {
              hud.setError?.('Armor full');
              setTimeout(() => hud.setError?.(''), 1200);
            }
          }
          // 6 = bandage, 7 = medkit (channel heal)
          if (input.actionPressed('bandage')) {
            if (loadout.startHeal('bandage')) {
              hud.setError?.('Applying bandage…');
            } else if ((loadout.bandages || 0) <= 0) {
              hud.setError?.('No bandages — loot or buy at cache');
              setTimeout(() => hud.setError?.(''), 1800);
            } else if ((weapons.health || 0) >= 74.5) {
              hud.setError?.('Bandage only heals to 75 HP');
              setTimeout(() => hud.setError?.(''), 1500);
            }
          }
          if (input.actionPressed('medkit')) {
            if (loadout.startHeal('medkit')) {
              hud.setError?.('Using medkit… stay still');
            } else if ((loadout.medkits || 0) <= 0) {
              hud.setError?.('No medkit — loot or buy at cache');
              setTimeout(() => hud.setError?.(''), 1800);
            } else if ((weapons.health || 0) >= 99.5) {
              hud.setError?.('Already full health');
              setTimeout(() => hud.setError?.(''), 1200);
            }
          }
          // Cancel plate / heal on fire / sprint / jump / weapon swap
          const cancelChannel = input.buttons.has(0) || input.action('sprint')
            || input.actionPressed('jump') || input.actionPressed('reload')
            || input.actionPressed('weapon1') || input.actionPressed('weapon2');
          if (loadout.plateT > 0) {
            if (cancelChannel) {
              loadout.cancelPlate();
              hud.setError?.('Plate cancelled');
              setTimeout(() => hud.setError?.(''), 1000);
            } else if (loadout.updatePlating(dt)) {
              hud.setError?.(`Plate on · ${loadout.plates} left`);
              setTimeout(() => hud.setError?.(''), 1400);
            }
          }
          if (loadout.healT > 0) {
            const moving = controller.speed > 0.55;
            const kindBefore = loadout.healKind;
            if (cancelChannel) {
              loadout.cancelHeal();
              hud.setError?.('Heal cancelled');
              setTimeout(() => hud.setError?.(''), 1000);
            } else {
              const done = loadout.updateHealing(dt, { moving });
              if (done) {
                const left = kindBefore === 'medkit'
                  ? `${loadout.medkits} medkit(s)`
                  : `${loadout.bandages} bandage(s)`;
                hud.setError?.(`Healed · ${Math.round(weapons.health)} HP · ${left}`);
                setTimeout(() => hud.setError?.(''), 1600);
              } else if (loadout.healT <= 0 && kindBefore === 'medkit' && moving) {
                hud.setError?.('Medkit cancelled — stay still');
                setTimeout(() => hud.setError?.(''), 1400);
              }
            }
          }

          // G = frag (not heli flares when on foot)
          if (input.actionPressed('frag') && loadout.takeFrag()) {
            throwables.throw('frag', {
              x: eye.x,
              y: eye.y - 0.1,
              z: eye.z,
            }, playerCam.yaw, playerCam.pitch);
            hud.setError?.(`Frag out · ${loadout.grenades} left`);
            setTimeout(() => hud.setError?.(''), 1200);
          }
          if (input.actionPressed('smoke') && loadout.takeSmoke()) {
            throwables.throw('smoke', {
              x: eye.x,
              y: eye.y - 0.1,
              z: eye.z,
            }, playerCam.yaw, playerCam.pitch);
            hud.setError?.(`Smoke out · ${loadout.smokes} left`);
            setTimeout(() => hud.setError?.(''), 1200);
          }
          if (input.actionPressed('uav')) {
            if (loadout.activateUav()) {
              hud.setError?.('UAV online — recon active');
              setTimeout(() => hud.setError?.(''), 2000);
            } else if (!loadout.hasUav) {
              hud.setError?.('No UAV kit — buy at supply cache');
              setTimeout(() => hud.setError?.(''), 2000);
            } else if (loadout.uavT > 0) {
              hud.setError?.('UAV already active');
              setTimeout(() => hud.setError?.(''), 1200);
            } else {
              hud.setError?.(`UAV cooldown ${Math.ceil(loadout.uavCd)}s`);
              setTimeout(() => hud.setError?.(''), 1200);
            }
          }
          if (input.actionPressed('stim')) {
            if (loadout.useStim()) {
              hud.setError?.('Stim — speed boost');
              setTimeout(() => hud.setError?.(''), 1500);
            }
          }
        } else if (loadout.plateT > 0) {
          loadout.cancelPlate();
        }
        loadout.updateGear?.(dt);
        throwables.update(dt);

        // Dead / downed: crawl (prone cam + slow move); no vehicles / sprint
        const incap = loadout.dead || loadout.waitingRedeploy || loadout.downed;
        controller.crawlMode = incap && !vehicles.riding;
        if (incap) {
          if (vehicles.riding) {
            vehicles.update(dt, controller, IDLE_INPUT, playerCam.yaw);
          } else {
            const crawlInput = {
              action: (n) => (n === 'forward' || n === 'back' || n === 'left' || n === 'right')
                ? input.action(n)
                : false,
              actionPressed: () => false,
              buttons: new Set(),
            };
            controller.speedMult = 1;
            controller.tick(dt, crawlInput, playerCam.yaw);
            // Extra hard cap (Controller also caps in crawlMode)
            const cap = loadout.dead ? 1.25 : (DOWNED.CRAWL_SPEED ?? 1.05);
            const hs = Math.hypot(controller.vel.x, controller.vel.z);
            if (hs > cap) {
              controller.vel.x *= cap / hs;
              controller.vel.z *= cap / hs;
            }
          }
        } else if (vehicles.riding) {
          controller.crawlMode = false;
          vehicles.update(dt, controller, input, playerCam.yaw);
        } else {
          controller.crawlMode = false;
          controller.speedMult = loadout.stimSpeedMult || 1;
          if (!rappels.update(dt, controller, input)) {
            controller.tick(dt, input, playerCam.yaw);
          }
        }
        elevators.update(
          dt,
          vehicles.riding || rappels.riding || loadout.downed || loadout.dead ? null : controller
        );

        // Combat: bots move/engage first so bullets test current hitboxes
        const moving = controller.speed > 0.6;
        const inHeli = vehicles.rideType === 'helicopter';
        const botOpts = {
          inVehicle: vehicles.riding,
          rideType: vehicles.rideType,
          airborne: inHeli || controller.pos.y > terrain.heightAt(controller.pos.x, controller.pos.z) + 10,
        };
        // Bots keep fighting (each other + player) even if you're downed/dead.
        // Mutable vitals so damage writes through (helmet + plates + HP).
        const vitalsForBots = {
          get health() { return weapons.health; },
          set health(v) { weapons.health = v; },
          get armor() { return weapons.armor; },
          set armor(v) { weapons.armor = v; },
          get helmet() { return weapons.helmet; },
          set helmet(v) { weapons.helmet = v; },
          get downed() { return loadout.downed; },
          get dead() { return loadout.dead; },
        };
        // ONE bot world: host/authority simulates; joiner only follows snapshot
        const botAuth = !party.connected || party.isAuthority();
        bots.authority = botAuth;
        if (botAuth) {
          if (!loadout.dead) {
            bots.update(dt, controller.pos, vitalsForBots, botOpts);
          } else {
            bots.update(dt, null, null, botOpts);
          }
        } else {
          // Puppet mode — no local AI wander
          bots.update(dt, null, null, botOpts);
          if (party.latestBotSnap) {
            bots.applyNetSnapshot(party.latestBotSnap, dt);
          }
        }
        match.update(dt, weapons, loadout, controller.pos, { inHeli });
        combatTargets.length = 0;
        const liveBots = bots.getLiveTargets();
        for (let i = 0; i < liveBots.length; i++) combatTargets.push(liveBots[i]);
        if (testRange.active) {
          const tr = testRange.getLiveTargets();
          for (let i = 0; i < tr.length; i++) combatTargets.push(tr[i]);
        }
        const fireDown = input.buttons.has(0);
        if (vehicles.rideType === 'helicopter' && vehicles.isGunner) {
          // GUNNER ONLY fires rockets
          if (fireDown && !prevFire && !mapView.open) {
            const ok = vehicles.tryFireRockets(combatTargets, {
              yaw: playerCam.yaw,
              pitch: playerCam.pitch,
            });
            if (!ok) {
              hud.setError?.(vehicles.lastFireDeny || 'No shot');
              setTimeout(() => hud.setError?.(''), 2200);
            }
          }
          if (input.actionPressed('aimMode')) {
            vehicles.toggleAimMode?.();
          }
          prevFire = fireDown;
        } else if (vehicles.rideType === 'helicopter') {
          // Pilot: fly only — rockets are gunner seat (V to swap when solo)
          if (fireDown && !prevFire && !mapView.open) {
            hud.setError?.('GUNNER ONLY — press V for gunner seat');
            setTimeout(() => hud.setError?.(''), 1600);
          }
          prevFire = fireDown;
        } else if (loadout.dead || loadout.waitingRedeploy) {
          // Fully dead — no shooting (bullets still in flight update via tick w/ no fire)
          prevFire = false;
          weapons.tick(dt, { buttons: new Set(), locked: false }, combatTargets, null, combatRng, false);
        } else if (loadout.downed && !vehicles.riding) {
          // Downed crawl: pistol only (enterDowned already holstered main)
          if (!weapons.downedOnly) weapons.enterDowned?.();
          if (fireDown && !prevFire) {
            weapons.firePressed(combatTargets, testRange.active ? testRange : null, combatRng, true);
          }
          prevFire = fireDown;
          weapons.tick(dt, input, combatTargets, testRange.active ? testRange : null, combatRng, true);
        } else if (!vehicles.riding) {
          if (weapons.downedOnly) weapons.exitDowned?.();
          if (fireDown && !prevFire) {
            weapons.firePressed(combatTargets, testRange.active ? testRange : null, combatRng, moving);
          }
          prevFire = fireDown;
          weapons.tick(dt, input, combatTargets, testRange.active ? testRange : null, combatRng, moving);
        } else {
          // Motorcycle: still allow guns if wanted — but hide overlay is enough
          if (weapons.downedOnly) weapons.exitDowned?.();
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

      // Fog of war + aerial spot every sim tick (works with map open / gunner)
      {
        const aerial = vehicles.rideType === 'helicopter' && vehicles.active
          ? vehicles.active
          : null;
        const uavLive = loadout.uavT > 0;
        const uavPos = uavLive
          ? {
            x: controller.pos.x,
            y: controller.pos.y + (THROWABLES.UAV?.height ?? 48),
            z: controller.pos.z,
          }
          : null;
        const highKit = loadout.hasUav
          && controller.pos.y > terrain.heightAt(controller.pos.x, controller.pos.z) + 12;
        const spotOrigin = aerial
          ? { x: aerial.x, y: aerial.y, z: aerial.z }
          : (uavPos || (highKit ? { x: controller.pos.x, y: controller.pos.y, z: controller.pos.z } : null));
        const spotOpts = uavLive
          ? { radius: THROWABLES.UAV?.radius ?? 72, depth: THROWABLES.UAV?.height ?? 48 }
          : null;
        spotting.update(dt, spotOrigin, bots.getLiveTargets(), !!spotOrigin, spotOpts);
        mapView.setSpotPings(spotting.pings);

        const spottedIds = new Set(spotting.pings.map((p) => String(p.id)));
        const mapBots = bots.getMapVisibleTargets(spottedIds);
        // Fire blips only here; aerial LOS uses existing red spot-pings (no double-draw)
        const enemyContacts = bots.getFiringRevealed().map((b) => ({
          x: b.x, z: b.z, reason: 'fire', id: b.id,
        }));
        mapView.setEnemyContacts(enemyContacts);
        mapView.setGunnerMode(
          vehicles.isGunner,
          vehicles.isGunner ? vehicles.getMapTargets(mapBots) : []
        );
      }

      input.endTick();
    });

    const strafe = input.locked && !mapView.open
      ? (input.action('right') ? 1 : 0) - (input.action('left') ? 1 : 0)
      : 0;
    const chuteOpen = !!controller.parachute && !vehicles.riding;
    playerCam.update(
      clock.frameDelta,
      controller,
      clock.alpha,
      strafe,
      vehicles.active, // third-person chase when riding
      { parachute: chuteOpen }
    );

    // Friends party: heli veh + rk rockets + bs bots (same packet)
    {
      const pilotVeh = vehicles.getPilotNetState?.() || null;
      const botSnap = (party.connected && party.isAuthority())
        ? bots.getNetSnapshot()
        : null;
      party.update(clock.frameDelta, {
        x: controller.pos.x,
        y: controller.pos.y,
        z: controller.pos.z,
        yaw: playerCam.yaw,
        seat: vehicles.riding ? vehicles.localSeat : null,
        heliId: vehicles.active?.id ?? null,
        health: weapons.health,
        downed: !!loadout.downed,
        dead: !!loadout.dead,
        parachute: chuteOpen,
        veh: pilotVeh,
        vehX: pilotVeh?.x,
        vehY: pilotVeh?.y,
        vehZ: pilotVeh?.z,
        vehYaw: pilotVeh?.yaw,
        vehVx: pilotVeh?.vx,
        vehVy: pilotVeh?.vy,
        vehVz: pilotVeh?.vz,
        botSnap,
      });
    }
    // Peers snap to shared heli seats (after airframe has been updated this frame)
    peerBodies.update(clock.frameDelta);

    // Local + FP body presentation
    avatarTime += clock.frameDelta;
    const onFoot = !vehicles.riding && !chuteOpen;
    // Hide FPS gun + arms while in vehicle or under canopy
    if (weaponOverlay?.root) weaponOverlay.root.visible = onFoot;
    if (weapons.viewGroup) weapons.viewGroup.visible = onFoot;
    if (fpArms) {
      // Parent is viewGroup — only toggle visibility; pose tracks gun + ADS
      fpArms.visible = onFoot && input.locked && !!weapons.def;
      if (fpArms.visible) {
        animateFpArms(fpArms, avatarTime, weapons.ads ?? 0, weapons._kick ?? 0);
      }
    }
    // Body: vehicle seats, parachute third-person, downed/dead prone
    if (localBody) {
      const showBody = vehicles.riding || chuteOpen || loadout.downed || loadout.dead;
      localBody.visible = showBody;
      if (localChute) localChute.visible = chuteOpen;
      if (localBody.visible) {
        if (vehicles.riding && !loadout.downed && !loadout.dead) {
          const seat = vehicles.getSeatWorldPose?.();
          if (seat) {
            localBody.position.set(seat.x, seat.y, seat.z);
            localBody.rotation.y = seat.yaw;
            const mode = seat.type === 'helicopter' ? 'heli' : 'moto';
            animateAvatar(localBody, avatarTime, 0, false, mode);
          }
        } else if (chuteOpen) {
          localBody.position.set(controller.pos.x, controller.pos.y, controller.pos.z);
          localBody.rotation.y = playerCam.yaw;
          // Soft bank into glide direction
          const hs = Math.hypot(controller.vel.x, controller.vel.z);
          localBody.rotation.z = hs > 0.5
            ? clamp((controller.vel.x * Math.cos(playerCam.yaw) - controller.vel.z * Math.sin(playerCam.yaw)) * 0.04, -0.2, 0.2)
            : 0;
          animateAvatar(localBody, avatarTime, hs, false, 'chute');
          // Gentle canopy sway
          if (localChute) {
            localChute.rotation.y = Math.sin(avatarTime * 0.7) * 0.08;
            localChute.rotation.x = Math.sin(avatarTime * 0.9) * 0.04;
            localChute.position.y = Math.sin(avatarTime * 1.1) * 0.05;
          }
        } else {
          localBody.position.set(controller.pos.x, controller.pos.y + 0.15, controller.pos.z);
          localBody.rotation.y = playerCam.yaw;
          localBody.rotation.z = 0;
          animateAvatar(
            localBody,
            avatarTime,
            0,
            false,
            loadout.dead ? 'dead' : 'downed'
          );
        }
      }
    }

    if (onFoot) {
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
        (loadout.dead || loadout.waitingRedeploy
          ? 'DEAD · buddy: buy Deploy flare at a supply cache'
          : loadout.downed
            ? (vehicles.riding
              ? (loadout.instantRevives > 0
                ? 'DOWNED · Space silver revive · or bleed out'
                : loadout.revives > 0
                  ? 'DOWNED · C socks revive · or bleed out'
                  : `DOWNED · bleed ${Math.ceil(loadout.downT || 0)}s`)
              : (loadout.instantRevives > 0
                ? 'DOWNED · crawl · Space silver revive'
                : loadout.revives > 0
                  ? 'DOWNED · crawl · C socks revive'
                  : `DOWNED · crawl · bleed ${Math.ceil(loadout.downT || 0)}s`))
            : (!controller.grounded && !vehicles.riding
              ? (controller.parachute
                ? `CHUTE OPEN · Space cut (${controller.chuteCutsLeft} left)`
                : (controller.pos.y - terrain.heightAt(controller.pos.x, controller.pos.z) >= (PARACHUTE.MIN_HEIGHT ?? 7)
                  ? ((controller._chuteCutsMade || 0) < (PARACHUTE.MAX_CUTS ?? 2)
                    ? 'Space · open parachute'
                    : null)
                  : null))
              : null))
        || buyCaches.prompt(px, py, pz)
        || vehicles.prompt(px, py, pz)
        || loot.prompt(px, py, pz)
        || elevators.prompt(px, py, pz)
        || rappels.prompt(px, py, pz)
        || doors.prompt(px, py, pz)
      );
    } else {
      hud.setPrompt(null);
    }

    // Gunner free/map mode badge (always visible while in gunner seat)
    if (vehicles.isGunner && vehicles.active) {
      const v = vehicles.active;
      const volleys = Math.min(v.rocketsLeft ?? 0, v.rocketsRight ?? 0);
      hud.setGunnerMode?.({
        mode: v.aimMode === 'map' ? 'map' : 'direct',
        target: v.mapTarget,
        volleys,
        flares: v.flares ?? 0,
        seat: 'gunner',
      });
    } else {
      hud.setGunnerMode?.(null);
    }

    combatHud.update(
      weapons.hudState(),
      testRange.active ? testRange.stats : null,
      loadout.cash,
      loadout.gearHud
    );
    if (BR.enabled) {
      combatHud.setBr?.(match.hudState());
      mapView.setZone?.(zone.snapshot());
    }

    renderer.render(scene, playerCam.camera);
    // Gun overlay only in first-person on foot
    if (input.locked && !vehicles.riding && !controller.parachute) weaponOverlay.render();
    {
      const spottedIds = new Set((spotting.pings || []).map((p) => String(p.id)));
      const mapBots = bots.getMapVisibleTargets(spottedIds);
      mapView.update(
        controller.pos,
        playerCam.yaw,
        vehicles.vehicles,
        vehicles.isGunner ? vehicles.getMapTargets(mapBots) : null
      );
    }
    debug.update(clock.frameDelta, controller, stats);
  }

  requestAnimationFrame(frame);

  // Expose for console poking and for the smoke test.
  window.__game = {
    scene, renderer, controller, terrain, hash, playerCam, stats, clock, SIM, mapView,
    weapons, loot, testRange, effects, party, peerBodies, localBody, fpArms,
    match, zone, bots,
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
