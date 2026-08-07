import * as THREE from 'three';
import { VEHICLES, PLAYER, WORLD, POIS } from '../config.js';
import { worldBuildings } from './BuildingRegistry.js';
import { rayAABB } from '../combat/Hitscan.js';

/**
 * Rideable motorcycles + helicopters.
 * Mesh nose faces local −Z (same as player look). Movement uses that forward.
 * Helis: building collision, static roof pads, dual rocket pods (8+8).
 */

function forwardXZ(yaw) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}
function rightXZ(yaw) {
  return { x: Math.cos(yaw), z: -Math.sin(yaw) };
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mulberry(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export class VehicleSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./Terrain.js').Terrain} terrain
   * @param {import('../core/EventBus.js').EventBus} bus
   * @param {import('./Collision.js').SpatialHash|null} hash
   * @param {import('../combat/Effects.js').CombatEffects|null} effects
   */
  constructor(scene, terrain, bus, hash = null, effects = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.bus = bus;
    this.hash = hash;
    this.effects = effects;
    this.group = new THREE.Group();
    this.group.name = 'vehicles';
    this.scene.add(this.group);
    this.vehicles = [];
    this.active = null;
    /** @type {'pilot'|'gunner'} local seat when solo / assigned */
    this.localSeat = 'pilot';
    this._near = null;
    this._rockets = [];
    this._cand = [];
    this._rearmPads = [];
    this._flareClouds = []; // active ECM spoofs
    /** @type {null|(() => Array)} live combat targets for splash (bots etc.) */
    this._getSplashTargets = null;
    /** @type {null|(() => {x:number,y:number,z:number,health?:number,armor?:number,applyDamage?:Function}|null)} */
    this._getLocalPlayer = null;
    /** Stable spawn counters so multiplayer clients share the same vehicle ids */
    this._heliSeq = 0;
    this._motoSeq = 0;
    /** Local party peer id (for seat conflict resolution) */
    this.localPeerId = null;
  }

  /** @param {string|null} id */
  setLocalPeerId(id) {
    this.localPeerId = id || null;
  }

  /** @param {string} id */
  getById(id) {
    if (!id) return null;
    return this.vehicles.find((v) => v.id === id) || null;
  }

  /**
   * Wire living entities for rocket splash (call from main after bots spawn).
   * @param {() => Array} getTargets  bots / targets with x,y,z,health,applyDamage
   * @param {() => object|null} [getLocalPlayer] player vitals + position for friendly-fire/self splash
   */
  setSplashProviders(getTargets, getLocalPlayer = null) {
    this._getSplashTargets = getTargets;
    this._getLocalPlayer = getLocalPlayer;
  }

  spawn() {
    this.clear();
    const rng = mulberry(WORLD.SEED ^ 0x7e41c1e);
    const motoN = VEHICLES.MOTORCYCLE?.count ?? 16;
    const heliN = VEHICLES.HELICOPTER?.count ?? 2;
    this._spawnRearmPads();

    let placed = 0;
    const tryMoto = (x, z) => {
      if (placed >= motoN) return;
      const y = this.terrain.heightAt(x, z);
      if (y < WORLD.WATER_LEVEL + 0.8) return;
      if (this.terrain.slopeDegAt?.(x, z) > 22) return;
      this._addMotorcycle(x, y, z, rng() * Math.PI * 2, rng);
      placed++;
    };

    for (let i = 0; i < 5 && placed < motoN; i++) {
      const a = rng() * Math.PI * 2;
      const r = 8 + rng() * 35;
      tryMoto(PLAYER.SPAWN.x + Math.cos(a) * r, PLAYER.SPAWN.z + Math.sin(a) * r);
    }
    for (const p of POIS) {
      if (placed >= motoN) break;
      const a = rng() * Math.PI * 2;
      const r = 12 + rng() * 40;
      tryMoto(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r);
    }
    let guard = 0;
    while (placed < motoN && guard++ < motoN * 40) {
      const x = (rng() * 2 - 1) * WORLD.SIZE * 0.38;
      const z = (rng() * 2 - 1) * WORLD.SIZE * 0.38;
      tryMoto(x, z);
    }

    this._spawnRoofHelis(heliN, rng);
    return this.vehicles.length;
  }

  /**
   * Player spawn next to the first roof helicopter (feet on deck).
   * @returns {{ x:number, y:number, z:number, yaw:number }|null}
   */
  getHeliRoofSpawn() {
    for (const v of this.vehicles) {
      if (v.type !== 'helicopter') continue;
      // Prefer roof birds (well above terrain)
      const ground = this.terrain.heightAt(v.x, v.z);
      if (v.y < ground + 6) continue;
      const r = rightXZ(v.yaw);
      // Stand on the pad beside the skids
      const x = v.x + r.x * 4.2;
      const z = v.z + r.z * 4.2;
      const y = v.y; // same deck as heli base
      return { x, y: y + 0.05, z, yaw: v.yaw + Math.PI }; // face the heli
    }
    // Fallback: any heli
    for (const v of this.vehicles) {
      if (v.type !== 'helicopter') continue;
      const r = rightXZ(v.yaw);
      return {
        x: v.x + r.x * 4.2,
        y: v.y + 0.05,
        z: v.z + r.z * 4.2,
        yaw: v.yaw + Math.PI,
      };
    }
    return null;
  }

  _spawnRoofHelis(count, rng) {
    const minF = VEHICLES.HELICOPTER?.minFloors ?? 10;
    const roofs = (worldBuildings || [])
      .filter((b) => b.floors >= minF && b.w >= 10 && b.d >= 10 && Number.isFinite(b.roofY ?? b.baseY))
      .map((b) => ({
        b,
        score: (b.floors || 0) * 2 + (b.w * b.d) * 0.01
          + (Math.hypot((b.x + b.w * 0.5) - PLAYER.SPAWN.x, (b.z + b.d * 0.5) - PLAYER.SPAWN.z) < 200 ? 8 : 0),
      }))
      .sort((a, c) => c.score - a.score);

    let hi = 0;
    const used = [];
    // Guarantee first heli on the best roof near spawn (player drop point)
    for (const { b } of roofs) {
      if (hi >= count) break;
      const cx = b.x + b.w * 0.5;
      const cz = b.z + b.d * 0.5;
      if (used.some((u) => Math.hypot(u.x - cx, u.z - cz) < 18)) continue;
      // Slightly offset heli so there's room to stand on the deck
      const yaw = rng() * Math.PI * 2;
      const side = rightXZ(yaw);
      const hx = cx - side.x * 1.5;
      const hz = cz - side.z * 1.5;
      const roofY = (b.roofY ?? (b.baseY + b.floors * 3.5)) + 0.35;
      this._addHelicopter(hx, roofY, hz, yaw, rng, true);
      used.push({ x: hx, z: hz });
      hi++;
    }
    while (hi < count) {
      const a = rng() * Math.PI * 2;
      const r = 30 + rng() * 50;
      const x = PLAYER.SPAWN.x + Math.cos(a) * r;
      const z = PLAYER.SPAWN.z + Math.sin(a) * r;
      const y = this.terrain.heightAt(x, z) + 0.5;
      if (y > WORLD.WATER_LEVEL + 1.5) {
        this._addHelicopter(x, y, z, rng() * Math.PI * 2, rng, false);
        hi++;
      } else break;
    }
  }

  clear() {
    this.active = null;
    this.localSeat = 'pilot';
    this.vehicles.length = 0;
    this._heliSeq = 0;
    this._motoSeq = 0;
    this._rockets.length = 0;
    this._flareClouds.length = 0;
    this._rearmPads.length = 0;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }

  _addMotorcycle(x, y, z, yaw, rng) {
    const root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.y = yaw;

    const bodyCol = [0xc02020, 0x1a1a1a, 0x2040a0, 0xe0a010, 0x2a8a40][Math.floor(rng() * 5)];
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.45, metalness: 0.35 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.7, metalness: 0.2 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xb0b4b8, roughness: 0.3, metalness: 0.85 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 1.7), bodyMat);
    body.position.set(0, 0.55, 0);
    body.castShadow = true;
    root.add(body);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.55), bodyMat);
    tank.position.set(0, 0.85, -0.15);
    root.add(tank);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.55), dark);
    seat.position.set(0, 0.82, 0.35);
    root.add(seat);
    for (const zz of [-0.65, 0.7]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 12), dark);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, 0.32, zz);
      w.castShadow = true;
      root.add(w);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), chrome);
    bar.position.set(0, 1.0, -0.55);
    root.add(bar);
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffe080, emissiveIntensity: 0.4 })
    );
    light.position.set(0, 0.7, -0.9);
    root.add(light);

    this.group.add(root);
    this.vehicles.push({
      id: `moto_${this._motoSeq++}`,
      type: 'motorcycle',
      root,
      x, y, z, yaw,
      speed: 0,
      vx: 0, vz: 0,
      health: 55,
      maxHealth: 55,
      seats: { pilot: null, gunner: null },
    });
  }

  _addHelicopter(x, y, z, yaw, rng, onRoof = false) {
    // Static roof pad stays on the building — NOT parented to the heli
    if (onRoof) {
      const padGroup = new THREE.Group();
      padGroup.position.set(x, y - 0.28, z);
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(4.2, 4.2, 0.1, 24),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.85 })
      );
      pad.receiveShadow = true;
      padGroup.add(pad);
      const H = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.06, 0.35),
        new THREE.MeshStandardMaterial({ color: 0xe8e8e8, emissive: 0x303030, emissiveIntensity: 0.35 })
      );
      H.position.y = 0.08;
      padGroup.add(H);
      // Ring edge
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.6, 0.08, 6, 32),
        new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.6 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.06;
      padGroup.add(ring);
      this.group.add(padGroup);
    }

    const root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.y = yaw;

    const bodyCol = [0x2a3a2a, 0x3a4a5a, 0x4a3a2a, 0x1a2a3a][Math.floor(rng() * 4)];
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.55, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.6, metalness: 0.3 });
    const glass = new THREE.MeshStandardMaterial({
      color: 0x6ab0d0, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.45,
    });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.5, metalness: 0.5 });
    const podMat = new THREE.MeshStandardMaterial({ color: 0x3a3a30, roughness: 0.55, metalness: 0.45 });
    const rocketMat = new THREE.MeshStandardMaterial({ color: 0xb0a060, roughness: 0.4, metalness: 0.5 });

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 3.4), bodyMat);
    cabin.position.set(0, 1.1, 0);
    cabin.castShadow = true;
    root.add(cabin);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.9), glass);
    nose.position.set(0, 1.25, -1.5);
    root.add(nose);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 3.2), bodyMat);
    boom.position.set(0, 1.3, 3.0);
    root.add(boom);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.7), bodyMat);
    fin.position.set(0, 1.85, 4.4);
    root.add(fin);
    for (const sx of [-0.75, 0.75]) {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.0), dark);
      skid.position.set(sx, 0.2, -0.1);
      root.add(skid);
      const legF = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), dark);
      legF.position.set(sx, 0.5, -0.9);
      root.add(legF);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), dark);
      legR.position.set(sx, 0.5, 0.7);
      root.add(legR);
    }
    const rotor = new THREE.Group();
    rotor.position.set(0, 2.0, 0);
    rotor.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 7.5), rotorMat));
    rotor.add(new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.04, 0.18), rotorMat));
    rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.25, 8), dark));
    root.add(rotor);
    const tailRotor = new THREE.Group();
    tailRotor.position.set(0.25, 1.85, 4.5);
    tailRotor.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.12), rotorMat));
    root.add(tailRotor);

    // Rocket pods: 8 tubes per side (hardpoints)
    const nR = VEHICLES.HELICOPTER?.rocketsPerSide ?? 8;
    const leftTubes = [];
    const rightTubes = [];
    for (const side of [-1, 1]) {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 1.8), podMat);
      pylon.position.set(side * 1.35, 0.75, 0.1);
      root.add(pylon);
      for (let i = 0; i < nR; i++) {
        const row = i % 4;
        const col = Math.floor(i / 4);
        const tube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.95, 6),
          rocketMat
        );
        tube.rotation.x = Math.PI / 2;
        tube.position.set(
          side * (1.55 + col * 0.22),
          0.55 + row * 0.16,
          0.15
        );
        tube.userData.loaded = true;
        root.add(tube);
        if (side < 0) leftTubes.push(tube);
        else rightTubes.push(tube);
      }
    }

    root.userData.rotor = rotor;
    root.userData.tailRotor = tailRotor;
    root.userData.leftTubes = leftTubes;
    root.userData.rightTubes = rightTubes;

    this.group.add(root);
    const cfg = VEHICLES.HELICOPTER;
    this.vehicles.push({
      // Deterministic id so friends share the same airframe over the party relay
      id: `heli_${this._heliSeq++}`,
      type: 'helicopter',
      root,
      x, y, z, yaw,
      speed: 0,
      vy: 0,
      vx: 0, vz: 0,
      rocketsLeft: nR,
      rocketsRight: nR,
      rocketCd: 0,
      // Crew: pilot flies, gunner targets/fires/ECM
      // seat values: null | 'local' | peerId string
      seats: { pilot: null, gunner: null },
      // Gunner map-selected target {x,y,z,kind,id?}
      mapTarget: null,
      // 'map' = fire at map lock · 'direct' = free-aim what's under the reticle
      aimMode: 'direct',
      // ECM
      flares: cfg.flaresMax ?? 8,
      flaresMax: cfg.flaresMax ?? 8,
      ecmAuto: cfg.ecmDefaultAuto !== false,
      flareCd: 0,
      // Fuel reserved (disabled)
      fuel: cfg.maxFuel ?? 100,
      // Rearm progress while on pad
      rearmT: 0,
      onPad: null,
      health: 100,
      maxHealth: 100,
    });
  }

  /** Military rearm pads (Coronado NAS, MCRD). Visual + zone. */
  _spawnRearmPads() {
    const pads = VEHICLES.HELICOPTER?.rearmPads ?? [];
    for (const p of pads) {
      const y = this.terrain.heightAt(p.x, p.z) + 0.05;
      const g = new THREE.Group();
      g.position.set(p.x, y, p.z);
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(p.r * 0.55, p.r * 0.55, 0.12, 28),
        new THREE.MeshStandardMaterial({ color: 0x2a3228, roughness: 0.85, metalness: 0.15 })
      );
      pad.receiveShadow = true;
      g.add(pad);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(p.r * 0.48, 0.1, 6, 36),
        new THREE.MeshStandardMaterial({
          color: 0xc8a020, emissive: 0x604000, emissiveIntensity: 0.45, metalness: 0.4,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      g.add(ring);
      // "REARM" marker bars
      const barMat = new THREE.MeshStandardMaterial({
        color: 0xe8d080, emissive: 0x806000, emissiveIntensity: 0.35,
      });
      for (const [ox, oz, sx, sz] of [[0, 0, 3.2, 0.45], [0, 0, 0.45, 3.2]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.08, sz), barMat);
        b.position.set(ox, 0.12, oz);
        g.add(b);
      }
      this.group.add(g);
      this._rearmPads.push({ ...p, y, mesh: g });
    }
  }

  findNear(px, py, pz) {
    let best = null;
    let bestD = Infinity;
    let bestFriend = null;
    let bestFriendD = Infinity;
    const range = VEHICLES.ENTER_RANGE ?? 3.4;
    for (const v of this.vehicles) {
      if (this.active === v) continue;
      if (v.wrecked || v.destroyed) continue; // wreckage is not boardable
      const d = Math.hypot(v.x - px, v.z - pz);
      const pad = v.type === 'helicopter' ? (v.crashing ? 3.5 : 1.5) : 0;
      if (d > range + pad) continue;
      // Falling birds: allow larger vertical grab so a passenger can take over mid-crash
      let maxDy = 3.5;
      if (v.type === 'helicopter') maxDy = v.crashing ? 14 : 6;
      if (Math.abs(v.y - py) > maxDy) continue;
      // Prefer a bird a friend is already piloting (shared co-op chopper)
      const friendPilot = v.seats?.pilot && v.seats.pilot !== 'local';
      const gunnerOpen = !v.seats?.gunner || v.seats.gunner === 'local';
      if (friendPilot && gunnerOpen && d < bestFriendD) {
        bestFriendD = d;
        bestFriend = v;
      }
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    this._near = bestFriend || best;
    return this._near;
  }

  /** Pads for minimap / full map markers. */
  getRearmPads() {
    return this._rearmPads.map((p) => ({
      id: p.id, name: p.name, x: p.x, z: p.z, r: p.r, y: p.y,
    }));
  }

  /**
   * @param {object} controller
   * @param {{ allowDismount?: boolean }} [opts]
   *   allowDismount — false while downed so you stay strapped in
   */
  tryUse(controller, opts = {}) {
    if (this.active) {
      if (opts.allowDismount === false) return false;
      // Airborne bail while critically hurt is a death trap — require grounded-ish
      if (opts.requireLanded && this.active.type === 'helicopter') {
        const v = this.active;
        const support = this._supportY(v.x, v.y, v.z);
        if (v.y - support > (VEHICLES.HELICOPTER?.crashBailHeight ?? 4.5)) {
          return false;
        }
      }
      this._dismount(controller);
      return true;
    }
    const v = this.findNear(controller.pos.x, controller.pos.y, controller.pos.z);
    if (!v) return false;
    if (v.wrecked || v.destroyed) return false;
    return !!this._mount(v, controller);
  }

  /**
   * World-space seat pose for local body / camera attachment.
   * Pilot sits forward in cabin; gunner slightly aft. Feet at returned y.
   * @returns {{ x:number, y:number, z:number, yaw:number, seat:'pilot'|'gunner', type:string }|null}
   */
  getSeatWorldPose() {
    if (!this.active) return null;
    return this.getSeatWorldPoseFor(this.active, this.localSeat);
  }

  /**
   * Seat pose on any vehicle (local + remote peer bodies).
   * @param {object} v
   * @param {'pilot'|'gunner'|string|null} seat
   */
  getSeatWorldPoseFor(v, seat = 'pilot') {
    if (!v) return null;
    const role = seat === 'gunner' ? 'gunner' : 'pilot';
    const yaw = v.yaw ?? 0;
    const f = forwardXZ(yaw);
    const r = rightXZ(yaw);
    if (v.type === 'helicopter') {
      // Cabin: pilot forward-left, gunner aft-right. Hip height under rotor hub.
      const isGunner = role === 'gunner';
      const localY = 0.28;
      const localZ = isGunner ? 0.25 : -0.35;
      const localX = isGunner ? 0.12 : -0.1;
      return {
        x: v.x + r.x * localX + f.x * localZ,
        y: v.y + localY,
        z: v.z + r.z * localX + f.z * localZ,
        yaw,
        seat: role,
        type: v.type,
      };
    }
    return {
      x: v.x,
      y: v.y + 0.15,
      z: v.z,
      yaw,
      seat: role,
      type: v.type || 'motorcycle',
    };
  }

  /** @param {string} id @param {'pilot'|'gunner'} seat */
  getSeatWorldPoseForId(id, seat = 'pilot') {
    return this.getSeatWorldPoseFor(this.getById(id), seat);
  }

  /**
   * Resolve which local vehicle a remote peer is on.
   * Prefer stable heliId; fall back to nearest airframe to their body
   * (covers old clients / id desync).
   */
  _resolvePeerVehicle(p) {
    if (!p) return null;
    if (p.heliId) {
      const byId = this.getById(p.heliId);
      if (byId) return byId;
    }
    if (p.veh?.id) {
      const byVeh = this.getById(p.veh.id);
      if (byVeh) return byVeh;
    }
    if (p.x == null || p.z == null) return null;
    let best = null;
    let bestD = Infinity;
    for (const v of this.vehicles) {
      if (v.wrecked || v.destroyed) continue;
      // Prefer helicopters when peer reports a heli seat
      if (p.seat && v.type !== 'helicopter' && p.heliId) continue;
      const d = Math.hypot((v.x - p.x), (v.z - p.z));
      // In flight the pad heli is far — also score by height similarity once moving
      const dy = Math.abs((v.y ?? 0) - (p.y ?? 0));
      const score = d + dy * 0.15;
      if (score < bestD && d < 40) {
        bestD = score;
        best = v;
      }
    }
    return best;
  }

  /**
   * Apply remote party vehicle occupancy + pilot kinematics so friends share one bird.
   * Call every frame before local vehicle update.
   * @param {Map|Iterable} peers  party.peers
   * @param {number} [dt]
   */
  applyPartyPeers(peers, dt = 1 / 20) {
    if (!peers) return;
    const list = peers instanceof Map ? [...peers.values()] : [...peers];

    // Clear remote seat claims (keep local)
    for (const v of this.vehicles) {
      if (!v.seats) continue;
      if (v.seats.pilot && v.seats.pilot !== 'local') v.seats.pilot = null;
      if (v.seats.gunner && v.seats.gunner !== 'local') v.seats.gunner = null;
    }

    /** @type {object|null} */
    let remotePilotPeer = null;
    /** @type {object|null} */
    let remotePilotVeh = null;

    for (const p of list) {
      if (!p?.seat) continue;
      const v = this._resolvePeerVehicle(p);
      if (!v) continue;
      if (!v.seats) v.seats = { pilot: null, gunner: null };
      const role = p.seat === 'gunner' ? 'gunner' : 'pilot';

      // Seat conflict: two pilots — lower peer id wins pilot, other becomes gunner
      if (role === 'pilot' && v.seats.pilot === 'local' && this.active === v && this.localSeat === 'pilot') {
        const remoteId = String(p.id || '');
        const localId = String(this.localPeerId || 'zzzz');
        if (remoteId && remoteId < localId) {
          if (!v.seats.gunner || v.seats.gunner === 'local') {
            v.seats.pilot = p.id;
            v.seats.gunner = 'local';
            this.localSeat = 'gunner';
          }
        } else {
          v.seats.pilot = 'local';
        }
      } else if (v.seats[role] !== 'local') {
        v.seats[role] = p.id;
      }

      if (role === 'pilot') {
        remotePilotPeer = p;
        remotePilotVeh = v;
        // Prefer explicit airframe packet; else reconstruct from pilot body
        if (p.veh && Number.isFinite(p.veh.x) && Number.isFinite(p.veh.z)) {
          this._applyRemotePilot(v, p.veh, dt);
        } else if (p.x != null && p.z != null) {
          this._applyFromPilotBody(v, p, dt);
        }
      }
    }

    // Local gunner MUST ride the remote pilot's bird (even if we boarded a different mesh id)
    if (this.active && this.localSeat === 'gunner' && remotePilotPeer && remotePilotVeh) {
      if (this.active !== remotePilotVeh) {
        if (this.active.seats?.gunner === 'local') this.active.seats.gunner = null;
        this.active = remotePilotVeh;
        if (!remotePilotVeh.seats) remotePilotVeh.seats = { pilot: null, gunner: null };
        remotePilotVeh.seats.gunner = 'local';
        // Re-apply transform onto the bird we just switched to
        if (remotePilotPeer.veh && Number.isFinite(remotePilotPeer.veh.x)) {
          this._applyRemotePilot(remotePilotVeh, remotePilotPeer.veh, dt);
        } else if (remotePilotPeer.x != null) {
          this._applyFromPilotBody(remotePilotVeh, remotePilotPeer, dt);
        }
      }
    }
  }

  /**
   * Soft-follow remote pilot kinematics (gunner / empty local).
   * Local pilot always ignores this (authority).
   */
  _applyRemotePilot(v, veh, dt = 1 / 20) {
    if (!v || !veh) return;
    if (this.active === v && this.localSeat === 'pilot') return;

    const tx = Number(veh.x);
    const ty = Number(veh.y);
    const tz = Number(veh.z);
    const tyaw = Number(veh.yaw);
    if (![tx, ty, tz].every(Number.isFinite)) return;

    const k = 1 - Math.exp(-18 * Math.max(0.001, dt));
    const jump = Math.hypot(tx - v.x, ty - v.y, tz - v.z);
    // Passengers need hard snaps when the pilot banks hard / climbs
    if (jump > 4 || (this.active === v && this.localSeat === 'gunner' && jump > 1.2)) {
      v.x = tx;
      v.y = ty;
      v.z = tz;
      if (Number.isFinite(tyaw)) v.yaw = tyaw;
    } else {
      v.x = lerp(v.x, tx, k);
      v.y = lerp(v.y, ty, k);
      v.z = lerp(v.z, tz, k);
      if (Number.isFinite(tyaw)) {
        let dy = tyaw - v.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        v.yaw += dy * k;
      }
    }
    v.vx = Number.isFinite(veh.vx) ? veh.vx : (v.vx || 0);
    v.vy = Number.isFinite(veh.vy) ? veh.vy : (v.vy || 0);
    v.vz = Number.isFinite(veh.vz) ? veh.vz : (v.vz || 0);
    v.crashing = false;
    if (v.root) {
      v.root.position.set(v.x, v.y, v.z);
      v.root.rotation.y = v.yaw;
      v.root.rotation.x = 0;
      v.root.rotation.z = 0;
    }
  }

  /**
   * Reconstruct airframe pose from the pilot's networked body (seat offset inverse).
   * Used when `veh` packet is missing (old relay) or dropped.
   */
  _applyFromPilotBody(v, p, dt = 1 / 20) {
    if (!v || p?.x == null || p?.z == null) return;
    if (this.active === v && this.localSeat === 'pilot') return;
    const yaw = Number.isFinite(p.yaw) ? p.yaw : (v.yaw || 0);
    const f = forwardXZ(yaw);
    const r = rightXZ(yaw);
    // Must match getSeatWorldPoseFor helicopter pilot offsets
    const localY = 0.28;
    const localZ = -0.35;
    const localX = -0.1;
    const hx = p.x - r.x * localX - f.x * localZ;
    const hz = p.z - r.z * localX - f.z * localZ;
    const hy = (p.y ?? v.y + localY) - localY;
    this._applyRemotePilot(v, {
      x: hx,
      y: hy,
      z: hz,
      yaw,
      vx: 0,
      vy: 0,
      vz: 0,
    }, dt);
  }

  /** Snapshot for party broadcast when local is piloting. */
  getPilotNetState() {
    if (!this.active || this.localSeat !== 'pilot') return null;
    const v = this.active;
    return {
      id: v.id,
      x: +v.x,
      y: +v.y,
      z: +v.z,
      yaw: +v.yaw,
      vx: +(v.vx || 0),
      vy: +(v.vy || 0),
      vz: +(v.vz || 0),
      type: v.type,
    };
  }

  _mount(v, controller) {
    if (v.wrecked || v.destroyed) return false;
    // Passenger / new pilot takes over — cancel unmanned crash (only if still flyable)
    v.crashing = false;
    v.speed = 0;
    if (v.type === 'helicopter') {
      v.vy = Math.min(0, v.vy * 0.35);
      v.vx *= 0.5;
      v.vz *= 0.5;
      if (!v.seats) v.seats = { pilot: null, gunner: null };
      const pilotTaken = !!(v.seats.pilot && v.seats.pilot !== 'local');
      const gunnerTaken = !!(v.seats.gunner && v.seats.gunner !== 'local');
      if (pilotTaken && gunnerTaken) {
        this.bus?.emit?.('vehicle:full', { id: v.id });
        return false;
      }
      // Friend already piloting → jump in as gunner. Else take pilot.
      if (pilotTaken) this.localSeat = 'gunner';
      else if (gunnerTaken) this.localSeat = 'pilot';
      else this.localSeat = 'pilot';
      v.seats[this.localSeat] = 'local';
      if (!v.flaresMax) {
        v.flaresMax = VEHICLES.HELICOPTER?.flaresMax ?? 8;
        v.flares = v.flaresMax;
      }
      if (v.ecmAuto == null) v.ecmAuto = VEHICLES.HELICOPTER?.ecmDefaultAuto !== false;
      // Always start free-aim so click-to-fire works immediately
      if (!v.aimMode) v.aimMode = 'direct';
      v.aimMode = 'direct';
      v.rocketCd = 0;
      {
        const nR = VEHICLES.HELICOPTER?.rocketsPerSide ?? 8;
        if (!Number.isFinite(v.rocketsLeft) || v.rocketsLeft < 0) v.rocketsLeft = nR;
        if (!Number.isFinite(v.rocketsRight) || v.rocketsRight < 0) v.rocketsRight = nR;
        if ((v.rocketsLeft | 0) + (v.rocketsRight | 0) <= 0) {
          v.rocketsLeft = nR;
          v.rocketsRight = nR;
        }
      }
    } else {
      if (!v.seats) v.seats = { pilot: null, gunner: null };
      if (v.seats.pilot && v.seats.pilot !== 'local') {
        this.bus?.emit?.('vehicle:full', { id: v.id });
        return false;
      }
      v.vy = 0;
      v.vx = 0;
      v.vz = 0;
      this.localSeat = 'pilot';
      v.seats.pilot = 'local';
    }
    this.active = v;
    controller.vel.set(0, 0, 0);
    controller.sliding = false;
    controller.mantling = false;
    controller.onLadder = false;
    const seat = this.getSeatWorldPose();
    if (seat) {
      controller.pos.set(seat.x, seat.y, seat.z);
      controller.grounded = v.type === 'motorcycle';
    } else {
      const cfg = v.type === 'helicopter' ? VEHICLES.HELICOPTER : VEHICLES.MOTORCYCLE;
      controller.pos.set(v.x, v.y + (cfg.seatY ?? 1), v.z);
      controller.grounded = v.type === 'motorcycle';
    }
    controller.prevPos?.copy?.(controller.pos);
    this.bus?.emit?.('vehicle:mount', {
      type: v.type,
      seat: this.localSeat,
      id: v.id,
      takeover: this.localSeat === 'pilot',
    });
    return true;
  }

  /**
   * Solo seat swap: pilot ↔ gunner (V).
   * Blocked if a healthy friend holds the seat; allowed if they are downed/dead
   * so the gunner can take the stick when the pilot is incapacitated.
   */
  swapSeat() {
    if (!this.active || this.active.type !== 'helicopter') return false;
    if (this.localSeat === 'passenger') {
      // Downed pilot recovering into gunner or pilot if free
      return this.tryClaimPilot() || this._forceSeat('gunner');
    }
    const v = this.active;
    const next = this.localSeat === 'pilot' ? 'gunner' : 'pilot';
    if (v.seats) {
      const holder = v.seats[next];
      const taken = holder && holder !== 'local';
      if (taken) {
        const downed = this._peerIncap?.(holder);
        if (!downed) {
          this.bus?.emit?.('vehicle:seat_blocked', { seat: next, by: holder });
          return false;
        }
        // Steal from incapacitated friend
      }
      if (this.localSeat === 'pilot' || this.localSeat === 'gunner') {
        v.seats[this.localSeat] = null;
      }
      v.seats[next] = 'local';
    }
    this.localSeat = next;
    this.bus?.emit?.('vehicle:seat', { seat: next });
    return true;
  }

  /**
   * Gunner takes pilot when the current pilot is downed/dead or seat empty.
   * @returns {boolean}
   */
  tryClaimPilot() {
    if (!this.active || this.active.type !== 'helicopter') return false;
    if (this.localSeat === 'pilot') return true;
    const v = this.active;
    if (!v.seats) v.seats = { pilot: null, gunner: null };
    const holder = v.seats.pilot;
    if (holder && holder !== 'local') {
      if (!this._peerIncap?.(holder)) {
        this.bus?.emit?.('vehicle:seat_blocked', { seat: 'pilot', by: holder });
        return false;
      }
    }
    if (this.localSeat === 'gunner' && v.seats.gunner === 'local') {
      v.seats.gunner = null;
    }
    v.seats.pilot = 'local';
    this.localSeat = 'pilot';
    this.bus?.emit?.('vehicle:seat', { seat: 'pilot', claim: true });
    return true;
  }

  /** Release pilot controls when downed — free the stick for the gunner. */
  yieldPilotWhenDowned() {
    if (!this.active || this.active.type !== 'helicopter') return false;
    if (this.localSeat !== 'pilot') return false;
    const v = this.active;
    if (v.seats) {
      v.seats.pilot = null;
    }
    this.localSeat = 'passenger';
    this.bus?.emit?.('vehicle:seat', { seat: 'passenger', yield: true });
    return true;
  }

  _forceSeat(seat) {
    if (!this.active) return false;
    const v = this.active;
    if (!v.seats) v.seats = { pilot: null, gunner: null };
    if (this.localSeat === 'pilot' || this.localSeat === 'gunner') {
      if (v.seats[this.localSeat] === 'local') v.seats[this.localSeat] = null;
    }
    if (seat === 'pilot' || seat === 'gunner') v.seats[seat] = 'local';
    this.localSeat = seat;
    return true;
  }

  /** @param {(peerId: string) => boolean} fn */
  setPeerIncapCheck(fn) {
    this._peerIncap = fn;
  }

  get isGunner() {
    return !!this.active && this.active.type === 'helicopter' && this.localSeat === 'gunner';
  }

  get isPilot() {
    // Passenger / downed pilot does not fly
    if (!this.active) return false;
    if (this.localSeat === 'passenger') return false;
    return this.active.type !== 'helicopter' || this.localSeat === 'pilot';
  }

  /**
   * Only the gunner seat fires rockets. Pilot flies; gunner shoots.
   * Solo: press V to swap into gunner.
   */
  get canFireRockets() {
    if (!this.active || this.active.type !== 'helicopter') return false;
    if (this.active.wrecked || this.active.destroyed) return false;
    return this.localSeat === 'gunner';
  }

  /** Human-readable why tryFireRockets failed (for HUD). */
  get lastFireDeny() {
    return this._lastFireDeny || null;
  }

  /** Gunner map-select a world target (bot / heli / ground / roof). */
  setMapTarget(target) {
    if (!this.active || this.active.type !== 'helicopter') return false;
    if (target && Number.isFinite(target.x) && Number.isFinite(target.z)) {
      // Snap Y to roof / ground surface so missiles hit the top of buildings
      target = { ...target, y: this._surfaceYAt(target.x, target.z, target.y) };
      if (this._buildingAt(target.x, target.z)) target.kind = target.kind || 'building';
    }
    this.active.mapTarget = target;
    this.active.aimMode = 'map'; // selecting on map switches into map mode
    this.bus?.emit?.('vehicle:target', target);
    return true;
  }

  clearMapTarget() {
    if (this.active) this.active.mapTarget = null;
  }

  /** Toggle gunner aim: map lock ↔ free aim (what's directly ahead). */
  toggleAimMode() {
    if (!this.active || this.active.type !== 'helicopter') return null;
    const next = this.active.aimMode === 'map' ? 'direct' : 'map';
    this.active.aimMode = next;
    if (next === 'direct') {
      // Free aim doesn't need a stale map pin
      // (keep pin so switching back to map restores last lock)
    }
    this.bus?.emit?.('vehicle:aimMode', { mode: next });
    return next;
  }

  /**
   * Highest solid surface under (x,z): building roof if any, else terrain.
   * Optional preferredY keeps a ray-hit height when it's already on the roof deck.
   */
  _surfaceYAt(x, z, preferredY = null) {
    const ground = this.terrain.heightAt(x, z);
    let best = ground;
    const b = this._buildingAt(x, z);
    if (b) {
      const roof = (b.roofY ?? ((b.baseY ?? ground) + (b.floors || 1) * 3.5)) + 0.25;
      best = Math.max(best, roof);
      // If preferred is already near the roof deck, keep it
      if (preferredY != null && preferredY >= roof - 1.5 && preferredY <= roof + 4) {
        return preferredY;
      }
      return roof;
    }
    if (preferredY != null && preferredY > ground + 0.5) return preferredY;
    return ground + 0.3;
  }

  toggleEcmMode() {
    if (!this.active || this.active.type !== 'helicopter') return false;
    this.active.ecmAuto = !this.active.ecmAuto;
    this.bus?.emit?.('vehicle:ecm', { auto: this.active.ecmAuto });
    return this.active.ecmAuto;
  }

  /** Manual flare deploy (gunner). */
  deployFlares() {
    const v = this.active;
    if (!v || v.type !== 'helicopter') return false;
    if ((v.flareCd ?? 0) > 0) return false;
    if ((v.flares ?? 0) <= 0) return false;
    const cfg = VEHICLES.HELICOPTER;
    v.flares -= 1;
    v.flareCd = cfg.flareCooldown ?? 0.55;
    this._flareClouds.push({
      x: v.x, y: v.y, z: v.z,
      life: cfg.flareDuration ?? 2.8,
      r: cfg.flareRadius ?? 28,
      mesh: this._makeFlareMesh(v.x, v.y, v.z),
    });
    this.effects?.spawnMuzzleBloom?.(new THREE.Vector3(v.x, v.y, v.z), 2.2);
    this.bus?.emit?.('vehicle:flare', { left: v.flares });
    return true;
  }

  _makeFlareMesh(x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffaa40, transparent: true, opacity: 0.9 })
      );
      m.position.set(Math.cos(a) * 1.2, 0.3 + (i % 3) * 0.2, Math.sin(a) * 1.2);
      g.add(m);
    }
    this.group.add(g);
    return g;
  }

  _dismount(controller) {
    const v = this.active;
    if (!v) return;
    const side = 1.8;
    const r = rightXZ(v.yaw);
    const f = forwardXZ(v.yaw);

    if (v.type === 'helicopter') {
      const support = this._supportY(v.x, v.y, v.z);
      const agl = v.y - support;
      const bailH = VEHICLES.HELICOPTER?.crashBailHeight ?? 4.5;

      // Jump out beside the airframe at current altitude (then fall)
      const ex = v.x + r.x * side;
      const ez = v.z + r.z * side;
      controller.pos.set(ex, v.y + 0.2, ez);
      controller.vel.set(r.x * 5 + v.vx * 0.4, Math.min(0, v.vy) - 1.5, r.z * 5 + v.vz * 0.4);
      controller.grounded = false;
      controller.sliding = false;
      controller.mantling = false;

      // No pilot left → crash unless someone remounts (passenger takeover)
      // Grounded / pad height just settles; airborne free-falls.
      if (agl > bailH && !v.wrecked) {
        v.crashing = true;
        v.crashT = 0;
        // Nudge off pad so it doesn't sit forever
        v.vx += r.x * 1.5 + f.x * 0.5;
        v.vz += r.z * 1.5 + f.z * 0.5;
        v.vy = Math.min(v.vy, -2);
      } else {
        v.crashing = false;
        // Soft settle on support
        v.y = support + (VEHICLES.HELICOPTER?.minAGL ?? 2.5) * 0.35;
        v.vx = 0;
        v.vy = 0;
        v.vz = 0;
        if (v.root) v.root.position.set(v.x, v.y, v.z);
      }
    } else {
      let x = v.x + r.x * side;
      let z = v.z + r.z * side;
      let y = this.terrain.heightAt(x, z);
      controller.pos.set(x, Math.max(y + 0.15, y), z);
      controller.vel.set(0, 0, 0);
      controller.grounded = true;
    }

    controller.prevPos?.copy?.(controller.pos);
    if (v.seats) {
      if (v.seats.pilot === 'local') v.seats.pilot = null;
      if (v.seats.gunner === 'local') v.seats.gunner = null;
    }
    this.active = null;
    this.localSeat = 'pilot';
    this.bus?.emit?.('vehicle:dismount', { type: v.type, crashing: !!v.crashing });
  }

  /**
   * Highest solid support under a point (roof or terrain).
   */
  _supportY(x, y, z) {
    let best = this.terrain.heightAt(x, z);
    for (const b of worldBuildings || []) {
      if (x < b.x - 0.5 || x > b.x + b.w + 0.5) continue;
      if (z < b.z - 0.5 || z > b.z + b.d + 0.5) continue;
      const top = b.roofY ?? (b.baseY + (b.floors || 1) * 3.5);
      if (top <= y + 0.5 && top > best) best = top;
    }
    return best;
  }

  /**
   * AABB overlap with building volumes (blocks heli from clipping through).
   * Skids may rest slightly above a roof; the body may not bury into floors.
   */
  _heliHitsBuilding(x, y, z) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return true;
    const cfg = VEHICLES.HELICOPTER;
    const hw = cfg.halfW ?? 3.6;
    const hh = cfg.halfH ?? 1.6;
    const hd = cfg.halfD ?? 4.2;
    const y0 = y;
    const y1 = y + hh * 2;
    const roofClear = 0.45; // skids/pad clearance above roof slab

    for (const b of worldBuildings || []) {
      if (!Number.isFinite(b?.w) || !Number.isFinite(b?.d)) continue;
      // Expand footprint slightly for rotors
      const bx0 = b.x - 0.4;
      const bx1 = b.x + b.w + 0.4;
      const bz0 = b.z - 0.4;
      const bz1 = b.z + b.d + 0.4;
      if (x + hw < bx0 || x - hw > bx1) continue;
      if (z + hd < bz0 || z - hd > bz1) continue;
      const bot = (b.baseY ?? 0) - 0.2;
      const top = (b.roofY ?? ((b.baseY ?? 0) + (b.floors || 1) * 3.5)) + 0.15;
      if (!Number.isFinite(bot) || !Number.isFinite(top)) continue;
      // Above the roof deck → free air (pad / hover)
      if (y0 >= top - roofClear) continue;
      // Overlap building mass
      if (y0 < top - 0.05 && y1 > bot) return true;
    }
    return false;
  }

  /** Push heli out of the nearest building AABB if deeply embedded. */
  _ejectHeliFromBuilding(v) {
    const cfg = VEHICLES.HELICOPTER;
    const hw = cfg.halfW ?? 3.6;
    const hd = cfg.halfD ?? 4.2;
    let best = null;
    let bestPen = Infinity;
    for (const b of worldBuildings || []) {
      if (!Number.isFinite(b?.w) || !Number.isFinite(b?.d)) continue;
      const bx0 = b.x - 0.4;
      const bx1 = b.x + b.w + 0.4;
      const bz0 = b.z - 0.4;
      const bz1 = b.z + b.d + 0.4;
      if (v.x + hw < bx0 || v.x - hw > bx1) continue;
      if (v.z + hd < bz0 || v.z - hd > bz1) continue;
      const top = (b.roofY ?? ((b.baseY ?? 0) + (b.floors || 1) * 3.5)) + 0.15;
      if (v.y >= top - 0.45) continue;
      // Penetration depth on each axis (how far to clear horizontally)
      const left = (v.x + hw) - bx0;
      const right = bx1 - (v.x - hw);
      const south = (v.z + hd) - bz0;
      const north = bz1 - (v.z - hd);
      const up = top + 0.5 - v.y;
      const opts = [
        { pen: left, dx: -left - 0.2, dy: 0, dz: 0 },
        { pen: right, dx: right + 0.2, dy: 0, dz: 0 },
        { pen: south, dx: 0, dy: 0, dz: -south - 0.2 },
        { pen: north, dx: 0, dy: 0, dz: north + 0.2 },
        { pen: up + 2, dx: 0, dy: Math.min(up + 0.6, 6), dz: 0 },
      ];
      for (const o of opts) {
        if (o.pen < bestPen) {
          bestPen = o.pen;
          best = o;
        }
      }
    }
    if (!best) {
      // No building claim — lift slightly and kill vertical speed
      v.y += 0.5;
      v.vy = Math.max(0, v.vy);
      return;
    }
    v.x += best.dx;
    v.y += best.dy;
    v.z += best.dz;
    v.vx *= 0.2;
    v.vz *= 0.2;
    if (best.dy > 0) v.vy = Math.max(0, v.vy);
    else v.vy *= 0.2;
  }

  /** Advance missiles / flares even when nobody is driving (needed for remote volleys). */
  tickProjectiles(dt) {
    try {
      this._updateRockets(dt);
      this._updateFlares(dt);
    } catch (err) {
      console.warn('[vehicles] rocket/flare update failed', err);
      this._rockets.length = 0;
    }
  }

  /**
   * @returns {boolean} true if riding
   * Note: call tickProjectiles(dt) separately each frame (main loop) so remote
   * missiles still fly when you're not driving.
   */
  update(dt, controller, input, yaw) {
    try {
      this._updateCrashes(dt);
    } catch (err) {
      console.warn('[vehicles] crash update failed', err);
    }

    for (const v of this.vehicles) {
      if (v.type !== 'helicopter') continue;
      const rotor = v.root?.userData?.rotor;
      const tail = v.root?.userData?.tailRotor;
      let spin;
      const crewed = this.active === v
        || (v.seats?.pilot && v.seats.pilot !== null)
        || (v.seats?.gunner && v.seats.gunner !== null);
      if (crewed && !v.wrecked) spin = 28;
      else if (v.crashing) spin = Math.max(1.5, 18 - (v.crashT ?? 0) * 4);
      else if (v.wrecked) spin = 0.15;
      else spin = 0.4;
      if (rotor) rotor.rotation.y += spin * dt;
      if (tail) tail.rotation.x += spin * 1.6 * dt;
      if (v.rocketCd > 0) v.rocketCd -= dt;
      if (v.flareCd > 0) v.flareCd -= dt;
    }

    // Crash eject applied next frame that has a controller
    if (this._pendingCrashEject && controller) {
      const e = this._pendingCrashEject;
      this._pendingCrashEject = null;
      controller.pos.set(e.x, e.y, e.z);
      controller.vel.set(0, 0, 0);
      controller.grounded = true;
      controller.prevPos?.copy?.(controller.pos);
    }

    if (!this.active || !controller) return false;
    const v = this.active;
    try {
      if (v.type === 'motorcycle') {
        this._driveMoto(dt, v, controller, input, yaw);
      } else {
        // Gunner / passenger ride along; only healthy pilot flies
        if (this.localSeat === 'gunner' || this.localSeat === 'passenger') {
          this._rideAlongGunner(dt, v, controller, input);
        } else if (this.localSeat === 'pilot') {
          this._driveHeli(dt, v, controller, input, yaw);
        } else {
          this._rideAlongGunner(dt, v, controller, input);
        }
        this._updateRearm(dt, v);
        this._updateEcmAuto(dt, v, input);
      }
      // Keep controller snapped to the actual seat (not rotor hub)
      const seat = this.getSeatWorldPose();
      if (seat) {
        controller.pos.set(seat.x, seat.y, seat.z);
        controller.vel.set(v.vx || 0, v.vy || 0, v.vz || 0);
        controller.grounded = v.type === 'motorcycle';
        controller.speed = Math.hypot(v.vx || 0, v.vz || 0);
        controller.prevPos?.copy?.(controller.pos);
      }
    } catch (err) {
      console.warn('[vehicles] drive failed — recovering', err);
      this._sanitizeVehicle(v);
      if (v.root) v.root.position.set(v.x, v.y, v.z);
      const seat = this.getSeatWorldPose();
      if (seat) controller.pos.set(seat.x, seat.y, seat.z);
      else {
        const cfg = v.type === 'helicopter' ? VEHICLES.HELICOPTER : VEHICLES.MOTORCYCLE;
        controller.pos.set(v.x, v.y + (cfg.seatY ?? 1), v.z);
      }
      controller.vel.set(0, 0, 0);
      controller.prevPos?.copy?.(controller.pos);
    }
    return true;
  }

  /** Passenger holds seat; pilot (or physics) moves the airframe. */
  _rideAlongGunner(dt, v, controller, input) {
    const cfg = VEHICLES.HELICOPTER;
    // Solo gunner (no remote pilot): autopilot hover so you can map-target safely.
    // Multiplayer: remote pilot drives via applyPartyPeers — just sit in seat.
    const remotePilot = v.seats?.pilot && v.seats.pilot !== 'local';
    if (!remotePilot) {
      v.vx *= Math.exp(-2.2 * dt);
      v.vz *= Math.exp(-2.2 * dt);
      v.vy *= Math.exp(-2.5 * dt);
      const support = this._supportY(v.x, v.y + 2, v.z);
      const minY = support + (cfg.minAGL ?? 2.5);
      if (v.y < minY) v.y = minY;
      if (v.root) {
        v.root.position.set(v.x, v.y, v.z);
        v.root.rotation.y = v.yaw;
      }
    } else {
      // Keep mesh glued to latest applied pilot transform (belt-and-suspenders)
      if (v.root) {
        v.root.position.set(v.x, v.y, v.z);
        v.root.rotation.y = v.yaw;
      }
    }
    // Always snap to gunner seat on the shared airframe (not cabin center)
    const seat = this.getSeatWorldPoseFor(v, 'gunner');
    if (seat) {
      controller.pos.set(seat.x, seat.y, seat.z);
    } else {
      controller.pos.set(v.x, v.y + (cfg.seatY ?? 1.1), v.z);
    }
    controller.vel.set(v.vx || 0, v.vy || 0, v.vz || 0);
    controller.grounded = false;
    controller.speed = Math.hypot(v.vx || 0, v.vz || 0);
    controller.prevPos?.copy?.(controller.pos);

    // Gunner hotkeys
    if (input?.actionPressed?.('flares')) this.deployFlares();
    if (input?.actionPressed?.('ecmMode')) this.toggleEcmMode();
    if (input?.actionPressed?.('aimMode')) this.toggleAimMode();
  }

  _updateEcmAuto(dt, v, input) {
    if (this.localSeat !== 'gunner' && this.localSeat !== 'pilot') return;
    // Auto ECM only when gunner seat is local (or solo pilot holds both for testing)
    if (this.localSeat === 'pilot' && v.seats?.gunner && v.seats.gunner !== 'local') return;
    if (!v.ecmAuto) return;
    if ((v.flareCd ?? 0) > 0 || (v.flares ?? 0) <= 0) return;
    // Threat: rocket seeking this heli
    const threat = this._incomingThreat(v);
    if (threat) this.deployFlares();
  }

  _incomingThreat(v) {
    for (const r of this._rockets) {
      if (r.lockHeli === v || r.lockTarget === v) return true;
      if (r.lock?.kind === 'heli' && r.lock.id === v.id) return true;
      // Proximity seek toward us
      if (r.lock && Math.hypot(r.lock.x - v.x, r.lock.y - (v.y + 1), r.lock.z - v.z) < 40) {
        if (r.age > 0.2 && Math.hypot(r.x - v.x, r.y - v.y, r.z - v.z) < 55) return true;
      }
    }
    return false;
  }

  _updateFlares(dt) {
    for (let i = this._flareClouds.length - 1; i >= 0; i--) {
      const c = this._flareClouds[i];
      c.life -= dt;
      if (c.mesh) {
        c.mesh.position.y += dt * 1.5;
        c.mesh.traverse((o) => {
          if (o.material?.opacity != null) o.material.opacity = Math.max(0, c.life / 2.8);
        });
      }
      if (c.life <= 0) {
        if (c.mesh) this.group.remove(c.mesh);
        this._flareClouds.splice(i, 1);
      }
    }
  }

  _updateRearm(dt, v) {
    const cfg = VEHICLES.HELICOPTER;
    const pads = this._rearmPads;
    if (!pads?.length) return;
    let on = null;
    for (const p of pads) {
      const d = Math.hypot(v.x - p.x, v.z - p.z);
      const support = this._supportY(v.x, v.y + 2, v.z);
      const low = v.y - support < (cfg.minAGL ?? 2.5) + 1.5;
      if (d < p.r && low && Math.abs(v.vy) < 4) {
        on = p;
        break;
      }
    }
    v.onPad = on;
    if (!on) {
      v.rearmT = 0;
      return;
    }
    // Stationary-ish on pad
    if (Math.hypot(v.vx, v.vz) > 3) {
      v.rearmT = 0;
      return;
    }
    v.rearmT = (v.rearmT ?? 0) + dt;
    const need = cfg.rearmHoverTime ?? 2.2;
    if (v.rearmT >= need) {
      const nR = cfg.rocketsPerSide ?? 8;
      v.rocketsLeft = nR;
      v.rocketsRight = nR;
      v.flares = v.flaresMax ?? cfg.flaresMax ?? 8;
      // Restock visual tubes
      const left = v.root?.userData?.leftTubes ?? [];
      const right = v.root?.userData?.rightTubes ?? [];
      for (const t of left) { t.visible = true; t.userData.loaded = true; }
      for (const t of right) { t.visible = true; t.userData.loaded = true; }
      v.rearmT = 0;
      this.bus?.emit?.('vehicle:rearm', { pad: on.name });
      this.effects?.spawnMuzzleBloom?.(new THREE.Vector3(v.x, v.y + 1, v.z), 1.4);
    }
  }

  /**
   * Abandoned helicopters freefall and wreck on impact.
   * Remounting (passenger/pilot takeover) clears crashing in _mount.
   */
  _updateCrashes(dt) {
    const cfg = VEHICLES.HELICOPTER;
    const g = cfg.crashGravity ?? 26;
    const maxFall = cfg.crashMaxFall ?? 55;
    const lim = WORLD.SIZE * 0.48;

    for (const v of this.vehicles) {
      if (v.type !== 'helicopter') continue;
      if (this.active === v) continue; // piloted
      if (!v.crashing || v.wrecked) continue;

      v.crashT = (v.crashT ?? 0) + dt;
      v.vy -= g * dt;
      if (v.vy < -maxFall) v.vy = -maxFall;
      // Air drag
      v.vx *= Math.exp(-0.35 * dt);
      v.vz *= Math.exp(-0.35 * dt);

      let nx = THREE.MathUtils.clamp(v.x + v.vx * dt, -lim, lim);
      let ny = v.y + v.vy * dt;
      let nz = THREE.MathUtils.clamp(v.z + v.vz * dt, -lim, lim);

      // Soft building collision while falling — bounce off sides, smash into roofs
      if (this._heliHitsBuilding(nx, ny, nz)) {
        if (!this._heliHitsBuilding(v.x, ny, v.z)) {
          // hit wall — stop horizontal
          nx = v.x;
          nz = v.z;
          v.vx *= -0.15;
          v.vz *= -0.15;
        } else {
          // hit mass / roof from above → impact
          this._heliImpact(v, nx, ny, nz);
          continue;
        }
      }

      const support = this._supportY(nx, ny + 1, nz);
      const skid = support + 0.35;
      if (ny <= skid) {
        this._heliImpact(v, nx, skid, nz);
        continue;
      }

      v.x = nx;
      v.y = ny;
      v.z = nz;

      if (v.root) {
        v.root.position.set(v.x, v.y, v.z);
        // Tumble
        const tumble = Math.min(1.2, (v.crashT ?? 0) * 0.55);
        v.root.rotation.y = v.yaw;
        v.root.rotation.x = THREE.MathUtils.lerp(v.root.rotation.x || 0, tumble * 0.7, 1 - Math.exp(-3 * dt));
        v.root.rotation.z = THREE.MathUtils.lerp(
          v.root.rotation.z || 0,
          Math.sin((v.crashT ?? 0) * 3.5) * tumble * 0.5,
          1 - Math.exp(-3 * dt)
        );
      }
    }
  }

  _heliImpact(v, x, y, z) {
    v.x = x;
    v.y = y;
    v.z = z;
    const speed = Math.hypot(v.vx, v.vy, v.vz);
    v.vx = 0;
    v.vy = 0;
    v.vz = 0;
    v.crashing = false;
    v.wrecked = true;
    v.destroyed = true; // permanent — never board again
    v.wreckT = 0;
    v.rocketsLeft = 0;
    v.rocketsRight = 0;
    v.flares = 0;
    // Eject local rider onto the wreck deck (don't leave them floating in the sky)
    if (this.active === v) {
      this._pendingCrashEject = {
        x: v.x,
        y: v.y + 0.6,
        z: v.z,
        yaw: v.yaw,
      };
      if (v.seats) {
        if (v.seats.pilot === 'local') v.seats.pilot = null;
        if (v.seats.gunner === 'local') v.seats.gunner = null;
      }
      this.active = null;
      this.localSeat = 'pilot';
    }
    if (v.root) {
      v.root.position.set(v.x, v.y, v.z);
      v.root.rotation.x = 0.25 + Math.min(0.5, speed * 0.012);
      v.root.rotation.z = (Math.random() - 0.5) * 0.55;
      // Charred wreckage look
      v.root.traverse((o) => {
        if (o.isMesh && o.material) {
          const m = o.material.clone?.() || o.material;
          if (m.color) m.color.setHex(0x1a1614);
          if (m.emissive) {
            m.emissive.setHex(0x2a1008);
            m.emissiveIntensity = 0.35;
          }
          if (m.metalness != null) m.metalness = 0.15;
          if (m.roughness != null) m.roughness = 0.92;
          o.material = m;
        }
      });
      // Hide rotors / tubes on wreck
      if (v.root.userData.rotor) v.root.userData.rotor.visible = false;
      if (v.root.userData.tailRotor) v.root.userData.tailRotor.visible = false;
    }
    const pt = new THREE.Vector3(v.x, v.y + 0.5, v.z);
    this.effects?.spawnExplosion?.(pt, 2.6 + Math.min(1.4, speed * 0.035));
    this.effects?.spawnMuzzleBloom?.(pt, 5.5 + Math.min(2, speed * 0.04));
    this.effects?.spawnImpact?.(pt, 'solid');
    const splash = 10;
    const dmg = 55 + Math.min(90, speed * 1.3);
    this.bus?.emit?.('vehicle:crash', { x: v.x, y: v.y, z: v.z, speed, splash, dmg, destroyed: true });
  }

  _sanitizeVehicle(v) {
    const lim = WORLD.SIZE * 0.48;
    if (!Number.isFinite(v.x)) v.x = 0;
    if (!Number.isFinite(v.y)) v.y = 20;
    if (!Number.isFinite(v.z)) v.z = 0;
    if (!Number.isFinite(v.vx)) v.vx = 0;
    if (!Number.isFinite(v.vy)) v.vy = 0;
    if (!Number.isFinite(v.vz)) v.vz = 0;
    if (!Number.isFinite(v.yaw)) v.yaw = 0;
    if (!Number.isFinite(v.speed)) v.speed = 0;
    v.x = THREE.MathUtils.clamp(v.x, -lim, lim);
    v.z = THREE.MathUtils.clamp(v.z, -lim, lim);
    const ground = this.terrain.heightAt(v.x, v.z);
    if (!Number.isFinite(v.y) || v.y < ground + 1) v.y = ground + 3;
    if (v.y > (VEHICLES.HELICOPTER?.maxY ?? 220)) v.y = VEHICLES.HELICOPTER.maxY;
  }

  /**
   * Gunner fires dual rockets.
   * MAP mode  → guided seek to map pin (rooftops land on roof deck).
   * FREE mode → pure dumbfire: straight out of the pods, hit first thing.
   * Successful fires emit `vehicle:rocket_net` so party peers can see the volley.
   */
  tryFireRockets(targets = [], aim = null) {
    this._lastFireDeny = null;
    const v = this.active;
    if (!v || v.type !== 'helicopter') {
      this._lastFireDeny = 'Not in a helicopter';
      return false;
    }
    if (this.localSeat !== 'gunner') {
      this._lastFireDeny = 'GUNNER ONLY — press V to take gunner seat';
      return false;
    }
    if (v.wrecked || v.destroyed) {
      this._lastFireDeny = 'Heli is wrecked';
      return false;
    }
    if (v.rocketCd > 0) {
      this._lastFireDeny = `Cooldown ${v.rocketCd.toFixed(1)}s`;
      return false;
    }
    // Heal corrupted counters only (not empty — rearm pad for that)
    const nPer = VEHICLES.HELICOPTER?.rocketsPerSide ?? 8;
    if (!Number.isFinite(v.rocketsLeft) || v.rocketsLeft < 0) v.rocketsLeft = nPer;
    if (!Number.isFinite(v.rocketsRight) || v.rocketsRight < 0) v.rocketsRight = nPer;
    const left = v.rocketsLeft | 0;
    const right = v.rocketsRight | 0;
    if (left <= 0 && right <= 0) {
      this._lastFireDeny = 'No rockets — land on a rearm pad';
      return false;
    }

    const cfg = VEHICLES.HELICOPTER;
    const minR = cfg.rocketMinRange ?? 18;
    const maxR = cfg.rocketMaxRange ?? 220;
    // Map mode without a pin → fall back to dumbfire (don't soft-lock the player)
    let mode = v.aimMode === 'map' ? 'map' : 'direct';
    if (mode === 'map' && !v.mapTarget) mode = 'direct';

    const bodyF = forwardXZ(v.yaw);
    const speed = cfg.rocketSpeed ?? 92;

    // ── FREE AIM: dumbfire only — no lock, no seek ─────────────────────
    if (mode === 'direct') {
      const fireDir = new THREE.Vector3(bodyF.x, 0, bodyF.z);
      if (fireDir.lengthSq() < 1e-8) fireDir.set(0, 0, -1);
      fireDir.normalize();
      const volley = this._spawnRocketVolley(v, {
        mode: 'direct',
        fireDir,
        speed,
        nPer,
        targets,
        guided: false,
        boostT: 99,
        life: 5.5,
        turnRate: 0,
        lock: null,
        noGravity: true,
        fireLeft: left > 0,
        fireRight: right > 0,
        leftBefore: left,
        rightBefore: right,
      });
      if (!volley.ok) {
        this._lastFireDeny = 'Spawn failed';
        return false;
      }
      v.rocketCd = cfg.rocketCooldown ?? 0.45;
      this.bus?.emit?.('vehicle:rocket', {
        left: v.rocketsLeft,
        right: v.rocketsRight,
        mode: 'direct',
      });
      this._emitRocketNet(v, {
        mode: 'direct',
        dirX: fireDir.x, dirY: fireDir.y, dirZ: fireDir.z,
        fireLeft: left > 0,
        fireRight: right > 0,
        leftBefore: left,
        rightBefore: right,
        guided: false,
        boostT: 99,
        life: 5.5,
      }, volley.projectiles);
      return true;
    }

    // ── MAP MODE: guided pin strike ────────────────────────────────────
    if (!v.mapTarget) {
      this._lastFireDeny = 'MAP mode needs a lock (M click or T for free-aim)';
      return false;
    }
    let lock = { ...v.mapTarget };
    if (lock.target && !lock.target.dead) {
      lock.x = lock.target.x;
      lock.y = (lock.target.y ?? 0) + (lock.kind === 'heli' ? 1.2 : 1.1);
      lock.z = lock.target.z;
    } else {
      lock.y = this._surfaceYAt(lock.x, lock.z, lock.y);
      if (this._buildingAt(lock.x, lock.z)) lock.kind = 'roof';
    }
    if (!Number.isFinite(lock.x + lock.y + lock.z)) return false;

    const dist = Math.hypot(lock.x - v.x, lock.y - (v.y + 1), lock.z - v.z);
    if (dist < minR || dist > maxR) {
      this.bus?.emit?.('vehicle:rocket-denied', { reason: dist > maxR ? 'range' : 'tooclose', dist });
      return false;
    }

    const lockPoint = {
      x: lock.x, y: lock.y, z: lock.z,
      kind: lock.kind, id: lock.id, target: lock.target,
    };

    const launchY = v.y + 0.7;
    const horiz = Math.hypot(lock.x - v.x, lock.z - v.z);
    const altDelta = lock.y - launchY;
    const needLoft = altDelta > 4;
    const loftExtra = Math.min(45, Math.max(12, altDelta + 10 + horiz * 0.08));
    const loftY = (needLoft ? lock.y : launchY) + (needLoft ? loftExtra : 0);
    const loftT = 0.42;
    const loftX = v.x + (lock.x - v.x) * loftT;
    const loftZ = v.z + (lock.z - v.z) * loftT;

    let fireDir;
    if (needLoft) {
      fireDir = new THREE.Vector3(bodyF.x * 0.75, 0.65, bodyF.z * 0.75).normalize();
    } else {
      const tx = lock.x - v.x;
      const ty = lock.y - launchY;
      const tz = lock.z - v.z;
      const tl = Math.hypot(tx, ty, tz) || 1;
      fireDir = new THREE.Vector3(
        tx / tl * 0.85 + bodyF.x * 0.15,
        ty / tl * 0.85,
        tz / tl * 0.85 + bodyF.z * 0.15
      ).normalize();
    }

    const volley = this._spawnRocketVolley(v, {
      mode: 'map',
      fireDir,
      speed,
      nPer,
      targets,
      guided: true,
      boostT: needLoft ? 0.28 : (cfg.rocketBoostTime ?? 0.35),
      life: needLoft ? 8 : 6,
      turnRate: (cfg.rocketTurnRate ?? 3.8) * (needLoft ? 1.5 : 1.35),
      lock: lockPoint,
      mapPath: needLoft ? 'loft' : 'direct',
      loftX, loftY, loftZ,
      guidePhase: needLoft ? 'climb' : 'terminal',
      fireLeft: left > 0,
      fireRight: right > 0,
      leftBefore: left,
      rightBefore: right,
    });
    if (!volley.ok) return false;
    v.rocketCd = cfg.rocketCooldown ?? 0.45;
    this.bus?.emit?.('vehicle:rocket', {
      left: v.rocketsLeft,
      right: v.rocketsRight,
      lock: lock.kind,
      dist,
      mode: 'map',
    });
    this._emitRocketNet(v, {
      mode: 'map',
      dirX: fireDir.x, dirY: fireDir.y, dirZ: fireDir.z,
      fireLeft: left > 0,
      fireRight: right > 0,
      leftBefore: left,
      rightBefore: right,
      guided: true,
      boostT: needLoft ? 0.28 : (cfg.rocketBoostTime ?? 0.35),
      life: needLoft ? 8 : 6,
      turnRate: (cfg.rocketTurnRate ?? 3.8) * (needLoft ? 1.5 : 1.35),
      lockX: lockPoint.x,
      lockY: lockPoint.y,
      lockZ: lockPoint.z,
      lockKind: lockPoint.kind || null,
      mapPath: needLoft ? 'loft' : 'direct',
      loftX, loftY, loftZ,
      guidePhase: needLoft ? 'climb' : 'terminal',
    }, volley.projectiles);
    return true;
  }

  /** Party payload so pilot / spectators see gunner missiles. */
  _emitRocketNet(v, extra = {}, projectiles = []) {
    const volleySeq = (this._rocketVolleySeq = (this._rocketVolleySeq || 0) + 1);
    const n = projectiles.length;
    // Tag newest local rockets (end of list) so impacts match on peers
    let tagged = 0;
    for (let i = this._rockets.length - 1; i >= 0 && tagged < n; i--) {
      const r = this._rockets[i];
      if (r.remote || r.netId != null) continue;
      const idx = n - 1 - tagged;
      r.volleySeq = volleySeq;
      r.netId = volleySeq * 10 + idx;
      if (projectiles[idx]) projectiles[idx].netId = r.netId;
      tagged += 1;
    }
    this.bus?.emit?.('vehicle:rocket_net', {
      heliId: v.id,
      hx: v.x,
      hy: v.y,
      hz: v.z,
      hyaw: v.yaw,
      leftAfter: v.rocketsLeft,
      rightAfter: v.rocketsRight,
      volleySeq,
      projectiles,
      ...extra,
    });
  }

  /**
   * Spawn dual-pod rockets on a heli (local gunner or remote network volley).
   * @returns {{ ok:boolean, projectiles:object[] }}
   */
  _spawnRocketVolley(v, opts) {
    if (!v || v.type !== 'helicopter') return { ok: false, projectiles: [] };
    const cfg = VEHICLES.HELICOPTER;
    const bodyF = forwardXZ(v.yaw);
    const bodyR = rightXZ(v.yaw);
    const speed = opts.speed ?? cfg.rocketSpeed ?? 92;
    const nPer = opts.nPer ?? cfg.rocketsPerSide ?? 8;
    const fireDir = opts.fireDir instanceof THREE.Vector3
      ? opts.fireDir.clone().normalize()
      : new THREE.Vector3(
        Number.isFinite(opts.dirX) ? opts.dirX : bodyF.x,
        Number.isFinite(opts.dirY) ? opts.dirY : 0,
        Number.isFinite(opts.dirZ) ? opts.dirZ : bodyF.z
      ).normalize();
    const targets = opts.targets || [];
    /** @type {object[]} */
    const projectiles = [];

    const fireSide = (side, remainingBefore, tubes) => {
      if (remainingBefore <= 0) return;
      const idx = Math.max(0, nPer - remainingBefore);
      const tube = tubes?.[idx];
      if (tube) {
        tube.visible = false;
        tube.userData.loaded = false;
      }
      const ox = v.x + bodyR.x * side * 1.7 + bodyF.x * 0.55;
      const oy = v.y + 0.7 + (idx % 4) * 0.05;
      const oz = v.z + bodyR.z * side * 1.7 + bodyF.z * 0.55;
      const vx = fireDir.x * speed;
      const vy = fireDir.y * speed;
      const vz = fireDir.z * speed;
      this._pushRocket({
        x: ox, y: oy, z: oz, vx, vy, vz, speed,
        owner: v,
        targets,
        mode: opts.mode || 'direct',
        guided: !!opts.guided,
        boostT: opts.boostT ?? 99,
        life: opts.life ?? 5.5,
        turnRate: opts.turnRate ?? 0,
        lock: opts.lock
          ? { x: opts.lock.x, y: opts.lock.y, z: opts.lock.z, kind: opts.lock.kind, id: opts.lock.id }
          : null,
        lockTarget: opts.lock?.target ?? null,
        mapPath: opts.mapPath || null,
        loftX: opts.loftX, loftY: opts.loftY, loftZ: opts.loftZ,
        guidePhase: opts.guidePhase || null,
        noGravity: opts.noGravity !== false && !opts.guided,
        remote: !!opts.remote,
      });
      projectiles.push({
        x: ox, y: oy, z: oz, vx, vy, vz, speed,
        side,
        mode: opts.mode || 'direct',
        guided: !!opts.guided,
        boostT: opts.boostT ?? 99,
        life: opts.life ?? 5.5,
        turnRate: opts.turnRate ?? 0,
        lockX: opts.lock?.x, lockY: opts.lock?.y, lockZ: opts.lock?.z,
        lockKind: opts.lock?.kind || null,
        mapPath: opts.mapPath || null,
        loftX: opts.loftX, loftY: opts.loftY, loftZ: opts.loftZ,
        guidePhase: opts.guidePhase || null,
      });
    };

    const leftBefore = opts.leftBefore ?? (v.rocketsLeft ?? 0);
    const rightBefore = opts.rightBefore ?? (v.rocketsRight ?? 0);
    if (opts.fireLeft !== false && leftBefore > 0) {
      fireSide(-1, leftBefore, v.root?.userData?.leftTubes);
      v.rocketsLeft = Math.max(0, leftBefore - 1);
    }
    if (opts.fireRight !== false && rightBefore > 0) {
      fireSide(1, rightBefore, v.root?.userData?.rightTubes);
      v.rocketsRight = Math.max(0, rightBefore - 1);
    }
    return { ok: projectiles.length > 0, projectiles };
  }

  /**
   * Create one live rocket mesh + sim entry.
   * @param {object} p
   */
  _pushRocket(p) {
    const cfg = VEHICLES.HELICOPTER;
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6),
      new THREE.MeshStandardMaterial({
        color: 0xc8b060,
        metalness: 0.5,
        roughness: 0.35,
        emissive: 0x402000,
        emissiveIntensity: 0.55,
      })
    );
    mesh.position.set(p.x, p.y, p.z);
    const dir = new THREE.Vector3(p.vx, p.vy, p.vz);
    if (dir.lengthSq() > 1e-6) {
      dir.normalize();
      try {
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      } catch { /* ok */ }
    }
    this.group.add(mesh);

    this._rockets.push({
      mesh,
      x: p.x, y: p.y, z: p.z,
      vx: p.vx, vy: p.vy, vz: p.vz,
      speed: p.speed ?? cfg.rocketSpeed ?? 92,
      life: p.life ?? 5.5,
      age: 0,
      pathDist: 0,
      // Don't arm fuse until clear of the launching airframe
      sx: p.x, sy: p.y, sz: p.z,
      armDist: p.armDist ?? 12,
      phase: 'boost',
      boostT: p.boostT ?? 99,
      damage: cfg.rocketDamage ?? 140,
      splash: cfg.rocketSplash ?? 18,
      splashInner: cfg.rocketSplashInner ?? 5,
      splashMinMult: cfg.rocketSplashMinMult ?? 0.2,
      vehicleMult: cfg.rocketVehicleMult ?? 1.15,
      targets: p.targets || [],
      guided: !!p.guided,
      turnRate: p.turnRate ?? 0,
      lock: p.lock || null,
      lockTarget: p.lockTarget ?? null,
      lockHeli: p.lock?.kind === 'heli' ? p.lockTarget : null,
      accuracy: p.guided ? 0.98 : 1,
      owner: p.owner || null,
      ownerId: p.owner?.id || p.ownerId || null,
      aimMode: p.mode || 'direct',
      noGravity: p.noGravity !== false && !p.guided,
      mapPath: p.mapPath || null,
      loftX: p.loftX, loftY: p.loftY, loftZ: p.loftZ,
      guidePhase: p.guidePhase || null,
      remote: !!p.remote,
      // Network identity (impact sync)
      netId: p.netId ?? null,
      volleySeq: p.volleySeq ?? null,
      // Remote rockets: fly visually, detonate at networked impact
      visualOnly: !!p.visualOnly || !!p.remote,
      pendingImpact: null,
    });
    const bloom = p.remote ? 3.2 : 1.8;
    this.effects?.spawnMuzzleBloom?.(new THREE.Vector3(p.x, p.y, p.z), bloom);
    this.effects?.spawnTracer?.(
      new THREE.Vector3(p.x, p.y, p.z),
      new THREE.Vector3(p.x + p.vx * 0.12, p.y + p.vy * 0.12, p.z + p.vz * 0.12),
      { long: true, life: p.remote ? 0.35 : 0.15 }
    );
  }

  /**
   * Spawn rockets fired by a remote gunner (party relay).
   * Prefers absolute `projectiles[]` from the gunner (reliable).
   * Pilot sees launch + flight + splash on their screen.
   * @param {object} msg party rocket packet
   * @param {Array} [targets]
   */
  spawnNetworkRockets(msg, targets = []) {
    if (!msg) return false;

    // Prefer absolute projectile snapshots from the shooter
    const list = Array.isArray(msg.projectiles) ? msg.projectiles : null;
    if (list && list.length) {
      let spawned = 0;
      // Owning airframe — critical so fuse doesn't detonate on our own heli
      const ownerHeli = (msg.heliId && this.getById(msg.heliId))
        || this.active
        || null;
      const volleySeq = msg.volleySeq || msg.seq || 0;
      for (let pi = 0; pi < list.length; pi++) {
        const pr = list[pi];
        let x = Number(pr.x);
        let y = Number(pr.y);
        let z = Number(pr.z);
        let vx = Number(pr.vx);
        let vy = Number(pr.vy);
        let vz = Number(pr.vz);
        if (![x, y, z].every(Number.isFinite)) continue;
        // Recover zero velocity (bad pack) from heli nose if needed
        let sp = Math.hypot(vx || 0, vy || 0, vz || 0);
        if (sp < 5) {
          const yaw = Number(msg.hyaw) || ownerHeli?.yaw || 0;
          const f = forwardXZ(yaw);
          const speed = VEHICLES.HELICOPTER?.rocketSpeed ?? 92;
          vx = f.x * speed;
          vy = 0;
          vz = f.z * speed;
          sp = speed;
          // Spawn slightly ahead of fire-time heli so we clear the airframe
          if (Number.isFinite(msg.hx)) {
            x = msg.hx + f.x * 4;
            y = (msg.hy ?? y) + 0.5;
            z = msg.hz + f.z * 4;
          }
        } else {
          // Nudge spawn forward along velocity so we don't start inside the cabin
          const inv = 1 / sp;
          x += vx * inv * 3;
          y += vy * inv * 3;
          z += vz * inv * 3;
        }
        const lock = (pr.lockX != null)
          ? { x: +pr.lockX, y: +pr.lockY, z: +pr.lockZ, kind: pr.lockKind || 'ground' }
          : (msg.lockX != null
            ? { x: +msg.lockX, y: +msg.lockY, z: +msg.lockZ, kind: msg.lockKind || 'ground' }
            : null);
        this._pushRocket({
          x, y, z,
          vx, vy, vz,
          speed: sp || Number(pr.speed) || undefined,
          targets,
          mode: pr.mode || msg.mode || 'direct',
          guided: !!(pr.guided ?? msg.guided),
          boostT: pr.boostT ?? msg.boostT ?? 99,
          life: pr.life ?? msg.life ?? 5.5,
          turnRate: pr.turnRate ?? msg.turnRate ?? 0,
          lock,
          mapPath: pr.mapPath || msg.mapPath || null,
          loftX: pr.loftX ?? msg.loftX,
          loftY: pr.loftY ?? msg.loftY,
          loftZ: pr.loftZ ?? msg.loftZ,
          guidePhase: pr.guidePhase || msg.guidePhase || null,
          noGravity: !(pr.guided ?? msg.guided),
          remote: true,
          visualOnly: true,
          owner: ownerHeli,
          ownerId: msg.heliId || ownerHeli?.id || null,
          armDist: 14,
          netId: pr.netId ?? (volleySeq * 10 + pi),
          volleySeq,
        });
        spawned += 1;
      }
      // Don't overwrite local ammo if we're the ones shooting this bird
      const v = msg.heliId ? this.getById(msg.heliId) : null;
      if (v && this.active !== v) {
        if (msg.leftAfter != null) v.rocketsLeft = msg.leftAfter;
        if (msg.rightAfter != null) v.rocketsRight = msg.rightAfter;
      }
      return spawned > 0;
    }

    // Fallback: reconstruct from heli pose (older packets)
    let v = msg.heliId ? this.getById(msg.heliId) : null;
    if (!v) v = this._resolvePeerVehicle?.({ heliId: msg.heliId, x: msg.hx, z: msg.hz, y: msg.hy, seat: 'gunner' });
    if (!v || v.type !== 'helicopter') {
      v = {
        id: msg.heliId || 'remote_heli',
        type: 'helicopter',
        x: msg.hx ?? 0,
        y: msg.hy ?? 0,
        z: msg.hz ?? 0,
        yaw: msg.hyaw ?? 0,
        rocketsLeft: msg.leftAfter ?? 8,
        rocketsRight: msg.rightAfter ?? 8,
        root: null,
      };
    } else if (Number.isFinite(msg.hx)) {
      v.x = msg.hx;
      v.y = msg.hy ?? v.y;
      v.z = msg.hz ?? v.z;
      if (Number.isFinite(msg.hyaw)) v.yaw = msg.hyaw;
      if (v.root) {
        v.root.position.set(v.x, v.y, v.z);
        v.root.rotation.y = v.yaw;
      }
    }

    const lock = (msg.lockX != null)
      ? { x: msg.lockX, y: msg.lockY, z: msg.lockZ, kind: msg.lockKind || 'ground' }
      : null;

    const res = this._spawnRocketVolley(v, {
      mode: msg.mode || 'direct',
      dirX: msg.dirX,
      dirY: msg.dirY,
      dirZ: msg.dirZ,
      fireLeft: msg.fireLeft !== false,
      fireRight: msg.fireRight !== false,
      leftBefore: msg.leftBefore ?? ((msg.leftAfter ?? 0) + 1),
      rightBefore: msg.rightBefore ?? ((msg.rightAfter ?? 0) + 1),
      targets,
      guided: !!msg.guided,
      boostT: msg.boostT ?? (msg.guided ? 0.35 : 99),
      life: msg.life ?? (msg.guided ? 6 : 5.5),
      turnRate: msg.turnRate ?? 0,
      lock,
      mapPath: msg.mapPath || null,
      loftX: msg.loftX, loftY: msg.loftY, loftZ: msg.loftZ,
      guidePhase: msg.guidePhase || null,
      noGravity: !msg.guided,
      remote: true,
    });
    return res.ok;
  }

  /** Unit look vector from yaw/pitch (matches PlayerCamera YXZ convention). */
  _lookDir(yaw, pitch) {
    const cp = Math.cos(pitch);
    return {
      x: -Math.sin(yaw) * cp,
      y: Math.sin(pitch),
      z: -Math.cos(yaw) * cp,
    };
  }

  /**
   * Soft lock: enemy helis, bots, then building/ground under reticle.
   * @param {object} selfHeli skip self for A2A
   */
  _acquireRocketLock(eye, look, targets, cfg, selfHeli = null) {
    const range = cfg.rocketMaxRange ?? 220;
    const cone = (14 * Math.PI) / 180;
    const cosCone = Math.cos(cone);

    // Air-to-air: other helicopters
    let bestHeli = null;
    let bestHeliScore = -Infinity;
    for (const h of this.vehicles) {
      if (h.type !== 'helicopter' || h === selfHeli || h.wrecked) continue;
      const tx = h.x - eye.x;
      const ty = (h.y + 1.2) - eye.y;
      const tz = h.z - eye.z;
      const dist = Math.hypot(tx, ty, tz);
      if (dist < 12 || dist > range) continue;
      const inv = 1 / dist;
      const dot = look.x * tx * inv + look.y * ty * inv + look.z * tz * inv;
      if (dot < cosCone) continue;
      const score = dot * 2.2 - dist / range;
      if (score > bestHeliScore) {
        bestHeliScore = score;
        bestHeli = h;
      }
    }
    if (bestHeli) {
      return {
        x: bestHeli.x, y: bestHeli.y + 1.2, z: bestHeli.z,
        kind: 'heli', target: bestHeli, id: bestHeli.id,
      };
    }

    let bestBot = null;
    let bestBotScore = -Infinity;
    if (targets?.length) {
      for (const t of targets) {
        if (t.dead) continue;
        const tx = t.x - eye.x;
        const ty = (t.y + 1.1) - eye.y;
        const tz = t.z - eye.z;
        const dist = Math.hypot(tx, ty, tz);
        if (dist < 3 || dist > range) continue;
        const inv = 1 / dist;
        const dot = look.x * tx * inv + look.y * ty * inv + look.z * tz * inv;
        if (dot < cosCone) continue;
        const score = dot * 2 - dist / range;
        if (score > bestBotScore) {
          bestBotScore = score;
          bestBot = t;
        }
      }
    }
    if (bestBot) {
      return {
        x: bestBot.x, y: bestBot.y + 1.1, z: bestBot.z,
        kind: 'bot', target: bestBot, id: bestBot.id,
      };
    }

    const step = 4;
    const maxSteps = Math.ceil(range / step);
    for (let i = 1; i <= maxSteps; i++) {
      const d = i * step;
      const px = eye.x + look.x * d;
      const py = eye.y + look.y * d;
      const pz = eye.z + look.z * d;
      const gY = this.terrain.heightAt(px, pz);
      if (py < gY + 0.5) {
        return { x: px, y: gY + 0.3, z: pz, kind: 'ground' };
      }
      if (this._pointInBuilding(px, py, pz)) {
        const b = this._buildingAt(px, pz);
        if (b) {
          const roof = (b.roofY ?? ((b.baseY ?? 0) + (b.floors || 1) * 3.5)) + 0.25;
          const cx = b.x + b.w * 0.5;
          const cz = b.z + b.d * 0.5;
          // Looking down onto the roof (or near roof height) → lock roof deck
          if (look.y < -0.08 || py >= roof - 3) {
            // Aim point: blend ray hit toward center so we hit the top slab
            const ax = lerp(px, cx, 0.25);
            const az = lerp(pz, cz, 0.25);
            return {
              x: ax,
              y: roof,
              z: az,
              kind: 'roof',
            };
          }
          // Side facade hit — still prefer roof if ray is steep; else impact height
          return {
            x: px,
            y: Math.min(roof, Math.max(py, (b.baseY ?? 0) + 2)),
            z: pz,
            kind: 'building',
          };
        }
        return { x: px, y: py, z: pz, kind: 'building' };
      }
    }
    // End of range: project onto surface under look so we don't aim into the sky forever
    const ex = eye.x + look.x * range;
    const ez = eye.z + look.z * range;
    return {
      x: ex,
      y: this._surfaceYAt(ex, ez),
      z: ez,
      kind: 'ground',
    };
  }

  _buildingAt(x, z) {
    for (const b of worldBuildings || []) {
      if (x >= b.x && x <= b.x + b.w && z >= b.z && z <= b.z + b.d) return b;
    }
    return null;
  }

  /**
   * Peer reported impact — snap remote rocket to that point and boom.
   * Gunner is authority; this keeps pilot impacts matching.
   */
  applyNetworkImpact({ netId, volleySeq, x, y, z }) {
    const tx = Number(x);
    const ty = Number(y);
    const tz = Number(z);
    if (![tx, ty, tz].every(Number.isFinite)) return false;
    for (let i = this._rockets.length - 1; i >= 0; i--) {
      const r = this._rockets[i];
      if (!r.remote && !r.visualOnly) continue;
      if (netId != null && r.netId === netId) {
        this._explodeRocket(r, tx, ty, tz, { silentNet: true });
        this._rockets.splice(i, 1);
        return true;
      }
    }
    // Fallback: first remote rocket of this volley still flying
    if (volleySeq != null) {
      for (let i = this._rockets.length - 1; i >= 0; i--) {
        const r = this._rockets[i];
        if (!r.remote && !r.visualOnly) continue;
        if (r.volleySeq === volleySeq) {
          this._explodeRocket(r, tx, ty, tz, { silentNet: true });
          this._rockets.splice(i, 1);
          return true;
        }
      }
    }
    // Rocket already gone — still show boom at gunner's true impact
    const pt = new THREE.Vector3(tx, ty, tz);
    this.effects?.spawnExplosion?.(pt, 2.2);
    this.effects?.spawnImpact?.(pt, 'solid');
    this.effects?.spawnMuzzleBloom?.(pt, 5);
    return true;
  }

  _updateRockets(dt) {
    for (let i = this._rockets.length - 1; i >= 0; i--) {
      const r = this._rockets[i];
      r.life -= dt;
      r.age = (r.age ?? 0) + dt;

      // Remote / visual-only: coast along velocity, wait for networked impact
      if (r.visualOnly || r.remote) {
        if (r.pendingImpact) {
          const pi = r.pendingImpact;
          r.x = pi.x; r.y = pi.y; r.z = pi.z;
          this._explodeRocket(r, pi.x, pi.y, pi.z, { silentNet: true });
          this._rockets.splice(i, 1);
          continue;
        }
        r.x += (r.vx || 0) * dt;
        r.y += (r.vy || 0) * dt;
        r.z += (r.vz || 0) * dt;
        if (r.mesh) {
          r.mesh.position.set(r.x, r.y, r.z);
          const sp = Math.hypot(r.vx, r.vy, r.vz) || 1;
          try {
            r.mesh.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              new THREE.Vector3(r.vx / sp, r.vy / sp, r.vz / sp)
            );
          } catch { /* */ }
        }
        if ((r._trailAcc = (r._trailAcc || 0) + dt) > 0.04) {
          r._trailAcc = 0;
          this.effects?.spawnBallisticTrace?.(
            new THREE.Vector3(r.x - r.vx * 0.02, r.y - r.vy * 0.02, r.z - r.vz * 0.02),
            new THREE.Vector3(r.x, r.y, r.z),
            { bright: true, life: 0.22 }
          );
        }
        // Timeout: no impact packet — soft boom at current (shouldn't happen often)
        if (r.life <= 0) {
          this._explodeRocket(r, r.x, r.y, r.z, { silentNet: true });
          this._rockets.splice(i, 1);
        }
        continue;
      }

      // FREE dumbfire: never guide, never gravity-curve — laser-straight
      if (r.aimMode === 'direct' || r.guided === false || r.noGravity) {
        r.phase = 'boost';
      } else if (r.phase === 'boost') {
        r.boostT = (r.boostT ?? 0.42) - dt;
        if (r.boostT <= 0) r.phase = 'guide';
        // Keep loft climb energy; light drop only on direct path
        if (r.mapPath !== 'loft') r.vy -= 1.5 * dt;
      } else if (r.guided && r.phase === 'guide') {
        // ECM spoof: if flare cloud near missile, retarget toward flare
        let spoofed = false;
        for (const c of this._flareClouds) {
          if (Math.hypot(r.x - c.x, r.y - c.y, r.z - c.z) < (c.r ?? 28)) {
            r.lock = { x: c.x, y: c.y + 2, z: c.z, kind: 'flare' };
            r.lockTarget = null;
            r.lockHeli = null;
            r.guidePhase = 'terminal';
            spoofed = true;
            break;
          }
        }

        // Final strike point (live bots/helis update)
        let tx = r.lock?.x;
        let ty = r.lock?.y;
        let tz = r.lock?.z;
        const lt = r.lockTarget;
        if (!spoofed && lt && !lt.dead) {
          tx = lt.x;
          ty = (lt.y ?? 0) + (r.lock?.kind === 'heli' ? 1.2 : 1.1);
          tz = lt.z;
          if (r.lock) { r.lock.x = tx; r.lock.y = ty; r.lock.z = tz; }
        }
        const lh = r.lockHeli;
        if (!spoofed && lh && !lh.wrecked) {
          tx = lh.x; ty = lh.y + 1.2; tz = lh.z;
          if (r.lock) { r.lock.x = tx; r.lock.y = ty; r.lock.z = tz; }
        }

        // LOFT: climb to altitude above target first, then dive
        // DIRECT (higher than target): fly straight at pin
        let seekX = tx;
        let seekY = ty;
        let seekZ = tz;
        if (!spoofed && r.mapPath === 'loft' && r.guidePhase !== 'terminal') {
          seekX = r.loftX ?? tx;
          seekY = r.loftY ?? (ty + 20);
          seekZ = r.loftZ ?? tz;
          const nearLoft = Math.hypot(r.x - seekX, r.z - seekZ) < 12;
          const highEnough = r.y >= (r.loftY ?? seekY) - 3;
          if (highEnough || nearLoft) {
            r.guidePhase = 'terminal';
            seekX = tx; seekY = ty; seekZ = tz;
          }
        }

        if (Number.isFinite(seekX + seekY + seekZ)) {
          const dx = seekX - r.x;
          const dy = seekY - r.y;
          const dz = seekZ - r.z;
          const dist = Math.hypot(dx, dy, dz) || 1;
          const wantX = dx / dist;
          const wantY = dy / dist;
          const wantZ = dz / dist;
          const sp = Math.hypot(r.vx, r.vy, r.vz) || (r.speed ?? 92);
          const curX = r.vx / sp;
          const curY = r.vy / sp;
          const curZ = r.vz / sp;
          // Climb phase turns a bit harder upward
          const turnMul = (r.mapPath === 'loft' && r.guidePhase !== 'terminal') ? 1.25 : 1;
          const maxTurn = (r.turnRate ?? 3.8) * turnMul * dt;
          const dot = THREE.MathUtils.clamp(curX * wantX + curY * wantY + curZ * wantZ, -1, 1);
          const ang = Math.acos(dot);
          if (ang > 1e-4) {
            const t = Math.min(1, maxTurn / ang);
            let nx = curX + (wantX - curX) * t;
            let ny = curY + (wantY - curY) * t;
            let nz = curZ + (wantZ - curZ) * t;
            const nl = Math.hypot(nx, ny, nz) || 1;
            nx /= nl; ny /= nl; nz /= nl;
            const hold = Math.min((r.speed ?? 92) * 1.08, sp + 12 * dt);
            r.vx = nx * hold;
            r.vy = ny * hold;
            r.vz = nz * hold;
          }
        }
      }

      const steps = Math.max(1, Math.ceil(Math.hypot(r.vx, r.vy, r.vz) * dt / 1.5));
      let hit = false;
      // Unarmed until clear of the launch heli (remote rockets used to nuke the bird instantly)
      const flown = Math.hypot(
        r.x - (r.sx ?? r.x),
        r.y - (r.sy ?? r.y),
        r.z - (r.sz ?? r.z)
      );
      r.pathDist = flown;
      const armed = r.age >= 0.18 || flown >= (r.armDist ?? 12);

      for (let s = 0; s < steps && !hit; s++) {
        const sp = Math.hypot(r.vx, r.vy, r.vz) || 1;
        const d = (Math.hypot(r.vx, r.vy, r.vz) * dt) / steps;
        const dx = (r.vx / sp) * d;
        const dy = (r.vy / sp) * d;
        const dz = (r.vz / sp) * d;
        const nx = r.x + dx;
        const ny = r.y + dy;
        const nz = r.z + dz;

        // Coast clear of pods / cabin before any fuse or solid checks
        if (!armed) {
          r.x = nx; r.y = ny; r.z = nz;
          continue;
        }

        // Proximity fuse on final target — MAP guided only, and only after climb (if lofting)
        const canFuse = r.guided && r.lock && r.age > 0.15
          && (r.mapPath !== 'loft' || r.guidePhase === 'terminal');
        if (canFuse) {
          const pd = Math.hypot(r.lock.x - nx, r.lock.y - ny, r.lock.z - nz);
          if (pd < 2.4) {
            let ex = nx;
            let ey = ny;
            let ez = nz;
            if (r.lock.kind === 'roof' || r.lock.kind === 'building') {
              ex = r.lock.x;
              ey = r.lock.y;
              ez = r.lock.z;
            }
            this._explodeRocket(r, ex, ey, ez);
            hit = true;
            break;
          }
        }
        // During loft climb, ignore mid-building clips if still well below loft height
        if (r.mapPath === 'loft' && r.guidePhase !== 'terminal' && this._pointInBuilding(nx, ny, nz)) {
          const b = this._buildingAt(nx, nz);
          const roof = b
            ? (b.roofY ?? ((b.baseY ?? 0) + (b.floors || 1) * 3.5)) + 0.25
            : ny;
          // Only pass through if we're climbing above this roof toward loft
          if (r.loftY != null && r.loftY > roof + 4 && ny < r.loftY - 2) {
            // skip solid hit this step — keep climbing
            r.x = nx; r.y = ny; r.z = nz;
            continue;
          }
        }

        const gY = this.terrain.heightAt(nx, nz);
        if (ny < gY + 0.4) {
          this._explodeRocket(r, nx, gY + 0.3, nz);
          hit = true;
          break;
        }
        // Building collision — explode on roof when diving onto a slab
        if (this._pointInBuilding(nx, ny, nz)) {
          const b = this._buildingAt(nx, nz);
          if (b) {
            const roof = (b.roofY ?? ((b.baseY ?? 0) + (b.floors || 1) * 3.5)) + 0.25;
            // Came from above the roof → detonate on the top of the building
            if (r.y >= roof - 0.8 || (r.lock && (r.lock.kind === 'roof' || r.lock.kind === 'building') && r.lock.y >= roof - 2)) {
              this._explodeRocket(r, nx, roof + 0.15, nz);
            } else {
              // Side impact
              this._explodeRocket(r, nx, ny, nz);
            }
          } else {
            this._explodeRocket(r, nx, ny, nz);
          }
          hit = true;
          break;
        }
        if (this.hash && this._rocketHitsSolid(r.x, r.y, r.z, nx, ny, nz)) {
          // Prefer roof surface under impact if solid is a floor/roof slab
          const surf = this._surfaceYAt(nx, nz, ny);
          const ey = (Math.abs(surf - ny) < 3.5 && surf > this.terrain.heightAt(nx, nz) + 2)
            ? surf
            : ny;
          this._explodeRocket(r, nx, ey, nz);
          hit = true;
          break;
        }
        // Air-to-air proximity fuse — never the launching heli
        for (const h of this.vehicles) {
          if (h.type !== 'helicopter' || h.wrecked) continue;
          if (h === r.owner || (r.ownerId && h.id === r.ownerId)) continue;
          // Also ignore active local bird if it's the same launch platform
          if (this.active && h === this.active && r.remote) continue;
          const hd = Math.hypot(h.x - nx, (h.y + 1) - ny, h.z - nz);
          if (hd < 3.5) {
            this._explodeRocket(r, nx, ny, nz);
            hit = true;
            break;
          }
        }
        if (hit) break;
        // Proximity fuse on infantry / targets in flight path
        if (r.targets?.length) {
          for (const t of r.targets) {
            if (t.dead) continue;
            const dist = Math.hypot(t.x - nx, (t.y + 1) - ny, t.z - nz);
            if (dist < 2.2) {
              this._explodeRocket(r, nx, ny, nz);
              hit = true;
              break;
            }
          }
        }
        // Also fuse near any live splash entity (bots that joined after fire)
        if (!hit && typeof this._getSplashTargets === 'function') {
          const live = this._getSplashTargets() || [];
          for (const t of live) {
            if (!t || t.dead) continue;
            const dist = Math.hypot((t.x ?? 0) - nx, ((t.y ?? 0) + 1) - ny, (t.z ?? 0) - nz);
            if (dist < 2.2) {
              this._explodeRocket(r, nx, ny, nz);
              hit = true;
              break;
            }
          }
        }
        r.x = nx;
        r.y = ny;
        r.z = nz;
      }
      if (hit) {
        this._rockets.splice(i, 1);
        continue;
      }
      if (r.life <= 0) {
        this.group.remove(r.mesh);
        r.mesh.geometry?.dispose?.();
        this._rockets.splice(i, 1);
        continue;
      }
      if (!Number.isFinite(r.x + r.y + r.z)) {
        this.group.remove(r.mesh);
        r.mesh.geometry?.dispose?.();
        this._rockets.splice(i, 1);
        continue;
      }
      r.mesh.position.set(r.x, r.y, r.z);
      const sp = Math.hypot(r.vx, r.vy, r.vz) || 1;
      const dir = new THREE.Vector3(r.vx / sp, r.vy / sp, r.vz / sp);
      if (dir.lengthSq() > 1e-8) {
        try {
          r.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        } catch {
          /* ignore degenerate rocket orientation */
        }
      }
      if ((r._trailAcc = (r._trailAcc || 0) + dt) > 0.04) {
        r._trailAcc = 0;
        this.effects?.spawnBallisticTrace?.(
          new THREE.Vector3(r.x - r.vx * 0.02, r.y - r.vy * 0.02, r.z - r.vz * 0.02),
          new THREE.Vector3(r.x, r.y, r.z),
          { bright: true, life: 0.2 }
        );
      }
    }
  }

  _pointInBuilding(x, y, z) {
    for (const b of worldBuildings || []) {
      if (x < b.x || x > b.x + b.w || z < b.z || z > b.z + b.d) continue;
      const bot = b.baseY ?? 0;
      const top = b.roofY ?? (bot + (b.floors || 1) * 3.5);
      if (y >= bot && y <= top + 0.5) return true;
    }
    return false;
  }

  _rocketHitsSolid(x0, y0, z0, x1, y1, z1) {
    if (!this.hash) return false;
    const dir = new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0);
    const len = dir.length();
    if (len < 1e-4) return false;
    dir.multiplyScalar(1 / len);
    const origin = new THREE.Vector3(x0, y0, z0);
    this.hash.query(
      Math.min(x0, x1) - 0.5, Math.min(z0, z1) - 0.5,
      Math.max(x0, x1) + 0.5, Math.max(z0, z1) + 0.5,
      this._cand
    );
    for (const box of this._cand) {
      if (box.disabled) continue;
      const tag = box.tag || 'solid';
      if (tag === 'trigger' || tag === 'door' || tag === 'ladder' || tag === 'glass' || tag === 'thin' || tag === 'elevator') {
        continue;
      }
      if ((box.max.y - box.min.y) < 0.35) continue; // floors
      const t = rayAABB(origin, dir, box.min, box.max, len + 0.1);
      if (t != null && t >= 0 && t <= len) return true;
    }
    return false;
  }

  /**
   * Detonate warhead: visual boom + radius damage to infantry, vehicles, player.
   * Falloff: full damage inside splashInner, down to splashMinMult at outer edge.
   * @param {object} r
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {{ silentNet?: boolean }} [opts] silentNet = don't re-broadcast (already remote impact)
   */
  _explodeRocket(r, x, y, z, opts = null) {
    if (r._exploded) return;
    r._exploded = true;
    if (r.mesh) {
      this.group.remove(r.mesh);
      r.mesh.geometry?.dispose?.();
    }
    const pt = new THREE.Vector3(x, y, z);
    const splash = r.splash ?? VEHICLES.HELICOPTER?.rocketSplash ?? 18;
    const dmg = r.damage ?? VEHICLES.HELICOPTER?.rocketDamage ?? 140;
    const inner = r.splashInner ?? VEHICLES.HELICOPTER?.rocketSplashInner ?? 5;
    const minMult = r.splashMinMult ?? VEHICLES.HELICOPTER?.rocketSplashMinMult ?? 0.2;
    const vehMult = r.vehicleMult ?? VEHICLES.HELICOPTER?.rocketVehicleMult ?? 1.15;

    // Gunner is authority for impact point — peers snap boom here
    if (!r.remote && !opts?.silentNet && r.netId != null) {
      this.bus?.emit?.('vehicle:rocket_impact', {
        netId: r.netId,
        volleySeq: r.volleySeq,
        x, y, z,
        heliId: r.ownerId || r.owner?.id || null,
      });
    }

    // Scale VFX with warhead size
    const power = 1.4 + Math.min(2.2, splash / 10);
    this.effects?.spawnExplosion?.(pt, power);
    this.effects?.spawnImpact?.(pt, 'solid');
    this.effects?.spawnMuzzleBloom?.(pt, 4 + splash * 0.25);

    const appliedList = [];

    // ── Infantry / bots / test targets ──
    const live = typeof this._getSplashTargets === 'function'
      ? (this._getSplashTargets() || [])
      : (r.targets || []);
    // Merge fire-time targets so we never miss a locked unit
    const seen = new Set();
    const entities = [];
    for (const t of live) {
      if (!t || t.dead) continue;
      const key = t.id ?? t;
      if (seen.has(key)) continue;
      seen.add(key);
      entities.push(t);
    }
    for (const t of r.targets || []) {
      if (!t || t.dead) continue;
      const key = t.id ?? t;
      if (seen.has(key)) continue;
      seen.add(key);
      entities.push(t);
    }

    for (const t of entities) {
      const ty = (t.y ?? 0) + 1.0;
      const dist = Math.hypot((t.x ?? 0) - x, ty - y, (t.z ?? 0) - z);
      if (dist > splash) continue;
      const applied = this._splashFalloff(dmg, dist, splash, inner, minMult);
      if (applied <= 0) continue;
      let killed = false;
      if (typeof t.applyDamage === 'function') {
        const res = t.applyDamage(applied, dist < inner * 0.5 ? 'chest' : 'chest');
        killed = !!res?.killed || t.dead || (t.health != null && t.health <= 0);
      } else if (t.health != null) {
        t.health -= applied;
        if (t.health <= 0) {
          t.health = 0;
          t.dead = true;
          killed = true;
        }
      }
      appliedList.push({ kind: 'infantry', id: t.id, dmg: applied, dist, killed });
    }

    // ── Vehicles (helis + motos) ──
    for (const h of this.vehicles) {
      if (!h || h.wrecked || h.destroyed) continue;
      // Don't splash-damage the firing airframe if the blast is right under it
      // (still allow if far enough that it's a real nearby hit)
      const hy = (h.y ?? 0) + (h.type === 'helicopter' ? 1.0 : 0.5);
      const dist = Math.hypot((h.x ?? 0) - x, hy - y, (h.z ?? 0) - z);
      if (dist > splash) continue;
      // Owner aircraft only takes reduced self-splash (pod cook-off / near miss)
      let mult = vehMult;
      if (h === r.owner) {
        if (dist < 4) continue; // ignore under-own-skids
        mult *= 0.35;
      }
      const applied = this._splashFalloff(dmg * mult, dist, splash, inner, minMult);
      if (applied <= 0) continue;
      h.health = Math.max(0, (h.health ?? 100) - applied);
      let destroyed = false;
      if (h.health <= 0) {
        destroyed = true;
        if (h.type === 'helicopter') {
          if (!h.crashing && !h.wrecked) {
            h.crashing = true;
            h.crashT = 0;
            h.vy = Math.min(h.vy ?? 0, -5);
            h.vx = (h.vx || 0) + (Math.random() - 0.5) * 4;
            h.vz = (h.vz || 0) + (Math.random() - 0.5) * 4;
          }
        } else {
          // Motorcycle — wreck in place
          h.wrecked = true;
          h.destroyed = true;
          h.speed = 0;
          if (h.root) {
            h.root.rotation.z = (Math.random() - 0.5) * 0.8;
            h.root.traverse((o) => {
              if (o.isMesh && o.material?.color) {
                o.material = o.material.clone?.() || o.material;
                o.material.color?.setHex?.(0x2a2018);
              }
            });
          }
          if (this.active === h) {
            this.active = null;
            this.localSeat = 'pilot';
          }
        }
      }
      appliedList.push({
        kind: 'vehicle',
        id: h.id,
        type: h.type,
        dmg: applied,
        dist,
        health: h.health,
        destroyed,
      });
    }

    // ── Local player ──
    if (typeof this._getLocalPlayer === 'function') {
      const p = this._getLocalPlayer();
      if (p && p.health > 0) {
        const py = (p.y ?? 0) + 1.0;
        const dist = Math.hypot((p.x ?? 0) - x, py - y, (p.z ?? 0) - z);
        // If player is piloting the owner heli and blast is under them, skip
        const ridingOwner = this.active && this.active === r.owner;
        if (dist <= splash && !(ridingOwner && dist < 5)) {
          let applied = this._splashFalloff(dmg, dist, splash, inner, minMult);
          if (applied > 0) {
            // Armor absorbs
            if (p.armor > 0) {
              const abs = Math.min(p.armor, applied);
              p.armor -= abs;
              applied -= abs;
            }
            if (applied > 0 && typeof p.applyDamage === 'function') {
              p.applyDamage(applied);
            } else if (applied > 0 && p.health != null) {
              p.health = Math.max(0, p.health - applied);
            }
            this.bus?.emit?.('player:damage', {
              amount: applied,
              source: 'rocket',
              dist,
            });
            appliedList.push({ kind: 'player', dmg: applied, dist });
          }
        }
      }
    }

    this.bus?.emit?.('rocket:explode', {
      x, y, z,
      damage: dmg,
      splash,
      hits: appliedList,
    });
  }

  /** Damage at distance: full to `inner`, linear down to `minMult` at `outer`. */
  _splashFalloff(baseDmg, dist, outer, inner, minMult) {
    if (dist <= 0) return baseDmg;
    if (dist <= inner) return baseDmg;
    if (dist >= outer) return 0;
    const t = (dist - inner) / Math.max(1e-4, outer - inner);
    const mult = 1 - t * (1 - minMult);
    return baseDmg * mult;
  }

  _driveMoto(dt, v, controller, input, yaw) {
    const cfg = VEHICLES.MOTORCYCLE;
    const maxSp = cfg.speed ?? 22;
    const accel = cfg.accel ?? 28;
    const brake = cfg.brake ?? 35;

    let steer = 0;
    if (input.action('left')) steer += 1;
    if (input.action('right')) steer -= 1;
    let dyaw = yaw - v.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    const turn = (cfg.turnRate ?? 2.4) * (0.35 + Math.min(1, Math.abs(v.speed) / maxSp));
    v.yaw += THREE.MathUtils.clamp(dyaw, -turn * dt, turn * dt);
    v.yaw += steer * turn * 0.55 * dt;

    let throttle = 0;
    if (input.action('forward')) throttle += 1;
    if (input.action('back')) throttle -= 0.7;
    if (throttle > 0) v.speed = Math.min(maxSp, v.speed + accel * throttle * dt);
    else if (throttle < 0) v.speed = Math.max(-maxSp * 0.35, v.speed + brake * throttle * dt);
    else {
      const fr = 6 * dt;
      if (v.speed > 0) v.speed = Math.max(0, v.speed - fr);
      else v.speed = Math.min(0, v.speed + fr);
    }

    const { x: fx, z: fz } = forwardXZ(v.yaw);
    let nx = v.x + fx * v.speed * dt;
    let nz = v.z + fz * v.speed * dt;
    const lim = WORLD.SIZE * 0.48;
    nx = THREE.MathUtils.clamp(nx, -lim, lim);
    nz = THREE.MathUtils.clamp(nz, -lim, lim);

    const ground = this.terrain.heightAt(nx, nz);
    if (ground < WORLD.WATER_LEVEL + 0.15) {
      v.speed *= 0.85;
    } else {
      v.x = nx;
      v.z = nz;
    }
    v.y = this.terrain.heightAt(v.x, v.z);

    v.root.position.set(v.x, v.y, v.z);
    v.root.rotation.y = v.yaw;
    const lean = THREE.MathUtils.clamp(-dyaw * 0.8 - steer * 0.25, -0.35, 0.35);
    v.root.rotation.z = THREE.MathUtils.lerp(v.root.rotation.z || 0, lean, 1 - Math.exp(-8 * dt));

    controller.pos.set(v.x, v.y + (cfg.seatY ?? 0.85), v.z);
    controller.vel.set(fx * v.speed, 0, fz * v.speed);
    controller.grounded = true;
    controller.speed = Math.abs(v.speed);
    controller.prevPos.copy(controller.pos);
  }

  _driveHeli(dt, v, controller, input, yaw) {
    const cfg = VEHICLES.HELICOPTER;
    const maxSp = cfg.speed ?? 38;
    const accel = cfg.accel ?? 18;
    const climb = cfg.climb ?? 14;
    // Hover clearance above terrain/roofs. Keep modest so Ctrl/C descend feels responsive.
    const minAGL = cfg.minAGL ?? 2.5;
    const maxY = cfg.maxY ?? 220;
    const lim = WORLD.SIZE * 0.48;

    // Guard bad state from a previous glitch before integrating
    if (!Number.isFinite(v.x + v.y + v.z + v.vx + v.vy + v.vz + v.yaw)) {
      this._sanitizeVehicle(v);
    }

    // Smooth yaw toward look — lower rate = less nose whip / cam shake
    let dyaw = (Number.isFinite(yaw) ? yaw : v.yaw) - v.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    const yawRate = cfg.yawRate ?? 1.9;
    v.yaw += THREE.MathUtils.clamp(dyaw, -yawRate * dt, yawRate * dt);

    const f = forwardXZ(v.yaw);
    const r = rightXZ(v.yaw);

    let wishX = 0;
    let wishZ = 0;
    if (input?.action?.('forward')) { wishX += f.x; wishZ += f.z; }
    if (input?.action?.('back')) { wishX -= f.x; wishZ -= f.z; }
    if (input?.action?.('left')) { wishX -= r.x; wishZ -= r.z; }
    if (input?.action?.('right')) { wishX += r.x; wishZ += r.z; }
    const wlen = Math.hypot(wishX, wishZ);
    if (wlen > 1e-4) {
      wishX /= wlen;
      wishZ /= wlen;
      // Ease into thrust so taps don't lurch
      v.vx += wishX * accel * dt;
      v.vz += wishZ * accel * dt;
    } else {
      v.vx *= Math.exp(-1.4 * dt);
      v.vz *= Math.exp(-1.4 * dt);
    }
    const hsp = Math.hypot(v.vx, v.vz);
    if (hsp > maxSp) {
      v.vx *= maxSp / hsp;
      v.vz *= maxSp / hsp;
    }

    // Space = climb, Shift = descend (C stays crouch on foot only)
    let climbWish = 0;
    if (input?.action?.('jump')) climbWish += 1;
    if (input?.action?.('sprint')) climbWish -= 1;
    v.vy += climbWish * climb * dt;
    if (climbWish === 0) v.vy *= Math.exp(-1.8 * dt);
    v.vy = THREE.MathUtils.clamp(v.vy, -climb * 1.05, climb);

    // Integrate with collision — full step, then axis slides, then eject (no thrash)
    const tryPos = (nx, ny, nz) => {
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) return null;
      nx = THREE.MathUtils.clamp(nx, -lim, lim);
      nz = THREE.MathUtils.clamp(nz, -lim, lim);
      let support = this._supportY(nx, ny + 2, nz);
      if (!Number.isFinite(support)) support = this.terrain.heightAt(nx, nz) || 0;
      const minY = support + minAGL;
      if (ny < minY) {
        ny = minY;
        if (v.vy < 0) v.vy = 0;
      }
      if (ny > maxY) {
        ny = maxY;
        if (v.vy > 0) v.vy = 0;
      }
      if (this._heliHitsBuilding(nx, ny, nz)) return null;
      return { x: nx, y: ny, z: nz };
    };

    const nx = v.x + v.vx * dt;
    const ny = v.y + v.vy * dt;
    const nz = v.z + v.vz * dt;
    let ok = tryPos(nx, ny, nz);
    if (!ok) {
      // Prefer sliding along the hit surface over violent bounce
      ok = tryPos(nx, v.y, nz);
      if (ok) {
        v.vy *= 0.15;
      } else {
        ok = tryPos(v.x, ny, v.z);
        if (ok) {
          v.vx *= 0.12;
          v.vz *= 0.12;
        } else {
          // Fully blocked / embedded: stop motion and eject once (stable)
          v.vx = 0;
          v.vz = 0;
          v.vy = 0;
          this._ejectHeliFromBuilding(v);
          ok = tryPos(v.x, v.y, v.z) || { x: v.x, y: v.y, z: v.z };
        }
      }
    }
    v.x = ok.x;
    v.y = ok.y;
    v.z = ok.z;
    this._sanitizeVehicle(v);

    if (v.root) {
      v.root.position.set(v.x, v.y, v.z);
      v.root.rotation.y = v.yaw;
      // Subtle visual attitude only — big bank/pitch reads as screen shake in 3rd person
      const pitchMax = cfg.pitchMax ?? 0.1;
      const bankMax = cfg.bankMax ?? 0.12;
      const pitch = THREE.MathUtils.clamp(
        -v.vy * 0.012
          - (input?.action?.('forward') ? 0.06 : 0)
          + (input?.action?.('back') ? 0.04 : 0),
        -pitchMax, pitchMax
      );
      const bank = THREE.MathUtils.clamp(
        (input?.action?.('right') ? 1 : 0) - (input?.action?.('left') ? 1 : 0),
        -1, 1
      ) * bankMax;
      const rx = Number.isFinite(v.root.rotation.x) ? v.root.rotation.x : 0;
      const rz = Number.isFinite(v.root.rotation.z) ? v.root.rotation.z : 0;
      // Slow attitude blend
      v.root.rotation.x = THREE.MathUtils.lerp(rx, pitch, 1 - Math.exp(-2.8 * dt));
      v.root.rotation.z = THREE.MathUtils.lerp(rz, -bank, 1 - Math.exp(-2.8 * dt));
    }

    controller.pos.set(v.x, v.y + (cfg.seatY ?? 1.1), v.z);
    controller.vel.set(v.vx, v.vy, v.vz);
    controller.grounded = false;
    controller.speed = Math.hypot(v.vx, v.vz);
    // Keep prevPos one tick behind so any residual systems interpolate cleanly
    if (controller.prevPos) {
      if (!v._hadPrev) {
        controller.prevPos.copy(controller.pos);
        v._hadPrev = true;
      } else {
        // prev already set last frame by physics consumers; leave as-is if not used
        controller.prevPos.lerp(controller.pos, 0.35);
      }
    }
  }

  prompt(px, py, pz) {
    if (this.active) {
      if (this.active.type === 'helicopter') {
        const v = this.active;
        const volleys = Math.min(v.rocketsLeft ?? 0, v.rocketsRight ?? 0);
        const seat = this.localSeat === 'gunner' ? 'GUNNER' : 'PILOT';
        const ecm = v.ecmAuto ? 'ECM AUTO' : 'ECM MAN';
        const tgt = v.mapTarget ? ` · TGT ${v.mapTarget.kind}` : '';
        const rearm = v.onPad ? ` · REARM ${(v.rearmT / (VEHICLES.HELICOPTER.rearmHoverTime || 2.2) * 100) | 0}%` : '';
        if (this.localSeat === 'gunner') {
          const mode = v.aimMode === 'map' ? 'MAP' : 'FREE';
          return `${seat} [${mode}] · T mode · M map-lock · LMB fire ${volleys}/8 · G flares (${v.flares}) · X ${ecm} · V pilot${tgt}${rearm}`;
        }
        return `${seat} · WASD · Space↑ Shift↓ · V gunner · E bail · rkt ${volleys}/8${rearm}`;
      }
      return 'E · Exit motorcycle';
    }
    const v = this.findNear(px, py, pz);
    if (!v) return null;
    if (v.type === 'helicopter') {
      if (v.wrecked || v.destroyed) return null; // wreckage — no prompt
      if (v.crashing) return 'E · Take over (falling!)';
      return 'E · Board helicopter';
    }
    return 'E · Ride motorcycle';
  }

  /**
   * List map-targetable entities for gunner.
   * `bots` should already be fog-filtered (firing / aerial-spotted only).
   */
  getMapTargets(bots = []) {
    const list = [];
    for (const t of bots) {
      if (t.dead) continue;
      list.push({
        kind: 'bot',
        id: t.id,
        x: t.x,
        y: t.y + 1.1,
        z: t.z,
        label: `Squad ${t.teamId ?? '?'}`,
        target: t,
        revealed: true, // caller only passes visible bots
      });
    }
    for (const h of this.vehicles) {
      if (h.type !== 'helicopter' || h === this.active || h.wrecked) continue;
      list.push({
        kind: 'heli', id: h.id ?? list.length, x: h.x, y: h.y + 1.2, z: h.z,
        label: 'Helicopter', target: h, revealed: true,
      });
    }
    return list;
  }

  get riding() {
    return !!this.active;
  }

  get rideType() {
    return this.active?.type ?? null;
  }
}
