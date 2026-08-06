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
      type: 'motorcycle',
      root,
      x, y, z, yaw,
      speed: 0,
      vx: 0, vz: 0,
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
      id: `heli_${this.vehicles.length}_${(Math.random() * 1e6) | 0}`,
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
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    this._near = best;
    return best;
  }

  /** Pads for minimap / full map markers. */
  getRearmPads() {
    return this._rearmPads.map((p) => ({
      id: p.id, name: p.name, x: p.x, z: p.z, r: p.r, y: p.y,
    }));
  }

  tryUse(controller) {
    if (this.active) {
      this._dismount(controller);
      return true;
    }
    const v = this.findNear(controller.pos.x, controller.pos.y, controller.pos.z);
    if (!v) return false;
    if (v.wrecked || v.destroyed) return false;
    this._mount(v, controller);
    return true;
  }

  _mount(v, controller) {
    if (v.wrecked || v.destroyed) return;
    this.active = v;
    // Passenger / new pilot takes over — cancel unmanned crash (only if still flyable)
    v.crashing = false;
    // Do not clear wrecked — already blocked above
    v.speed = 0;
    if (v.type === 'helicopter') {
      v.vy = Math.min(0, v.vy * 0.35);
      v.vx *= 0.5;
      v.vz *= 0.5;
      // Solo default pilot; empty gunner for friend/passenger
      if (!v.seats) v.seats = { pilot: null, gunner: null };
      this.localSeat = v.seats.pilot && !v.seats.gunner ? 'gunner' : 'pilot';
      v.seats[this.localSeat] = 'local';
      if (!v.flaresMax) {
        v.flaresMax = VEHICLES.HELICOPTER?.flaresMax ?? 8;
        v.flares = v.flaresMax;
      }
      if (v.ecmAuto == null) v.ecmAuto = VEHICLES.HELICOPTER?.ecmDefaultAuto !== false;
    } else {
      v.vy = 0;
      v.vx = 0;
      v.vz = 0;
      this.localSeat = 'pilot';
    }
    const cfg = v.type === 'helicopter' ? VEHICLES.HELICOPTER : VEHICLES.MOTORCYCLE;
    controller.pos.set(v.x, v.y + (cfg.seatY ?? 1), v.z);
    controller.vel.set(0, 0, 0);
    controller.grounded = v.type === 'motorcycle';
    controller.sliding = false;
    controller.mantling = false;
    controller.onLadder = false;
    this.bus?.emit?.('vehicle:mount', { type: v.type, seat: this.localSeat, takeover: true });
  }

  /** Solo seat swap: pilot ↔ gunner (V). Multiplayer will assign seats externally. */
  swapSeat() {
    if (!this.active || this.active.type !== 'helicopter') return false;
    const v = this.active;
    const next = this.localSeat === 'pilot' ? 'gunner' : 'pilot';
    if (v.seats) {
      v.seats[this.localSeat] = null;
      v.seats[next] = 'local';
    }
    this.localSeat = next;
    this.bus?.emit?.('vehicle:seat', { seat: next });
    return true;
  }

  get isGunner() {
    return !!this.active && this.active.type === 'helicopter' && this.localSeat === 'gunner';
  }

  get isPilot() {
    return !!this.active && (this.active.type !== 'helicopter' || this.localSeat === 'pilot');
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

  /**
   * @returns {boolean} true if riding
   */
  update(dt, controller, input, yaw) {
    try {
      this._updateRockets(dt);
      this._updateFlares(dt);
    } catch (err) {
      console.warn('[vehicles] rocket/flare update failed', err);
      this._rockets.length = 0;
    }

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
      if (this.active === v) spin = 28;
      else if (v.crashing) spin = Math.max(1.5, 18 - (v.crashT ?? 0) * 4);
      else if (v.wrecked) spin = 0.15;
      else spin = 0.4;
      if (rotor) rotor.rotation.y += spin * dt;
      if (tail) tail.rotation.x += spin * 1.6 * dt;
      if (v.rocketCd > 0) v.rocketCd -= dt;
      if (v.flareCd > 0) v.flareCd -= dt;
    }

    if (!this.active || !controller) return false;
    const v = this.active;
    try {
      if (v.type === 'motorcycle') {
        this._driveMoto(dt, v, controller, input, yaw);
      } else {
        // Gunner: ride along, no flight controls. Pilot: fly.
        if (this.localSeat === 'gunner') {
          this._rideAlongGunner(dt, v, controller, input);
        } else {
          this._driveHeli(dt, v, controller, input, yaw);
        }
        this._updateRearm(dt, v);
        this._updateEcmAuto(dt, v, input);
      }
    } catch (err) {
      console.warn('[vehicles] drive failed — recovering', err);
      this._sanitizeVehicle(v);
      if (v.root) v.root.position.set(v.x, v.y, v.z);
      const cfg = v.type === 'helicopter' ? VEHICLES.HELICOPTER : VEHICLES.MOTORCYCLE;
      controller.pos.set(v.x, v.y + (cfg.seatY ?? 1), v.z);
      controller.vel.set(0, 0, 0);
      controller.prevPos?.copy?.(controller.pos);
    }
    return true;
  }

  /** Passenger holds seat; pilot (or physics) moves the airframe. */
  _rideAlongGunner(dt, v, controller, input) {
    const cfg = VEHICLES.HELICOPTER;
    // Solo gunner (no remote pilot): autopilot hover so you can map-target safely.
    // Multiplayer: remote pilot drives; gunner just rides along.
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
    }
    controller.pos.set(v.x, v.y + (cfg.seatY ?? 1.1), v.z);
    controller.vel.set(v.vx, v.vy, v.vz);
    controller.grounded = false;
    controller.speed = Math.hypot(v.vx, v.vz);
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
    if (this.active === v) this.active = null;
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
   */
  tryFireRockets(targets = [], aim = null) {
    const v = this.active;
    if (!v || v.type !== 'helicopter') return false;
    // Only gunner fires (solo: swap to gunner with V)
    if (this.localSeat !== 'gunner') return false;
    if (v.rocketCd > 0) return false;
    const left = v.rocketsLeft ?? 0;
    const right = v.rocketsRight ?? 0;
    if (left <= 0 && right <= 0) return false;

    const cfg = VEHICLES.HELICOPTER;
    const minR = cfg.rocketMinRange ?? 18;
    const maxR = cfg.rocketMaxRange ?? 220;
    const mode = v.aimMode === 'map' ? 'map' : 'direct';

    const bodyF = forwardXZ(v.yaw);
    const bodyR = rightXZ(v.yaw);
    const speed = cfg.rocketSpeed ?? 92;
    const nPer = cfg.rocketsPerSide ?? 8;

    // ── FREE AIM: dumbfire only — no lock, no seek ─────────────────────
    if (mode === 'direct') {
      // Exactly along heli nose (pod aim), level with airframe — no look curve
      const fireDir = new THREE.Vector3(bodyF.x, 0, bodyF.z).normalize();

      const fireSide = (side, remaining, tubes) => {
        if (remaining <= 0) return;
        const idx = nPer - remaining;
        const tube = tubes?.[idx];
        if (tube) {
          tube.visible = false;
          tube.userData.loaded = false;
        }
        // Spawn at pod hardpoints, velocity pure forward
        const ox = v.x + bodyR.x * side * 1.7 + bodyF.x * 0.55;
        const oy = v.y + 0.7 + (idx % 4) * 0.05;
        const oz = v.z + bodyR.z * side * 1.7 + bodyF.z * 0.55;
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6),
          new THREE.MeshStandardMaterial({
            color: 0xc8b060,
            metalness: 0.5,
            roughness: 0.35,
            emissive: 0x402000,
            emissiveIntensity: 0.35,
          })
        );
        mesh.position.set(ox, oy, oz);
        try {
          mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fireDir.clone());
        } catch { /* ok */ }
        this.group.add(mesh);

        this._rockets.push({
          mesh,
          x: ox, y: oy, z: oz,
          vx: fireDir.x * speed,
          vy: fireDir.y * speed, // 0 — level
          vz: fireDir.z * speed,
          speed,
          life: 5.5,
          age: 0,
          phase: 'boost',
          boostT: 99, // never enter guide phase
          damage: cfg.rocketDamage ?? 95,
          splash: cfg.rocketSplash ?? 5.5,
          targets,
          guided: false, // DUMBFIRE
          turnRate: 0,
          lock: null,
          lockTarget: null,
          lockHeli: null,
          accuracy: 1,
          owner: v,
          aimMode: 'direct',
          noGravity: true,
        });
        this.effects?.spawnMuzzleBloom?.(new THREE.Vector3(ox, oy, oz), 1.6);
      };

      if (left > 0) {
        fireSide(-1, left, v.root.userData.leftTubes);
        v.rocketsLeft = left - 1;
      }
      if (right > 0) {
        fireSide(1, right, v.root.userData.rightTubes);
        v.rocketsRight = right - 1;
      }
      v.rocketCd = cfg.rocketCooldown ?? 0.45;
      this.bus?.emit?.('vehicle:rocket', {
        left: v.rocketsLeft,
        right: v.rocketsRight,
        mode: 'direct',
      });
      return true;
    }

    // ── MAP MODE: guided pin strike ────────────────────────────────────
    if (!v.mapTarget) return false;
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

    // Path profile: loft if target is above heli, else fly straight to pin
    const launchY = v.y + 0.7;
    const horiz = Math.hypot(lock.x - v.x, lock.z - v.z);
    const altDelta = lock.y - launchY;
    const needLoft = altDelta > 4; // target clearly above launch
    // Climb high enough to clear, then dive onto the pin
    const loftExtra = Math.min(45, Math.max(12, altDelta + 10 + horiz * 0.08));
    const loftY = (needLoft ? lock.y : launchY) + (needLoft ? loftExtra : 0);
    // Loft waypoint ~halfway to target horizontally, at loft altitude
    const loftT = 0.42;
    const loftX = v.x + (lock.x - v.x) * loftT;
    const loftZ = v.z + (lock.z - v.z) * loftT;

    // Leave tubes: climb-out if lofting, else nose-forward toward target
    let fireDir;
    if (needLoft) {
      fireDir = new THREE.Vector3(bodyF.x * 0.75, 0.65, bodyF.z * 0.75).normalize();
    } else {
      // Point roughly at target (higher → lower strike)
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

    const fireSide = (side, remaining, tubes) => {
      if (remaining <= 0) return;
      const idx = nPer - remaining;
      const tube = tubes?.[idx];
      if (tube) {
        tube.visible = false;
        tube.userData.loaded = false;
      }
      const ox = v.x + bodyR.x * side * 1.7 + bodyF.x * 0.55;
      const oy = v.y + 0.7 + (idx % 4) * 0.05;
      const oz = v.z + bodyR.z * side * 1.7 + bodyF.z * 0.55;
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6),
        new THREE.MeshStandardMaterial({
          color: 0xc8b060,
          metalness: 0.5,
          roughness: 0.35,
          emissive: 0x402000,
          emissiveIntensity: 0.35,
        })
      );
      mesh.position.set(ox, oy, oz);
      try {
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fireDir.clone());
      } catch { /* ok */ }
      this.group.add(mesh);

      this._rockets.push({
        mesh,
        x: ox, y: oy, z: oz,
        vx: fireDir.x * speed,
        vy: fireDir.y * speed,
        vz: fireDir.z * speed,
        speed,
        life: needLoft ? 8 : 6,
        age: 0,
        phase: 'boost',
        boostT: needLoft ? 0.28 : (cfg.rocketBoostTime ?? 0.35),
        damage: cfg.rocketDamage ?? 95,
        splash: cfg.rocketSplash ?? 5.5,
        targets,
        guided: true,
        turnRate: (cfg.rocketTurnRate ?? 3.8) * (needLoft ? 1.5 : 1.35),
        lock: { ...lockPoint },
        lockTarget: lockPoint.target ?? null,
        lockHeli: lock.kind === 'heli' ? lock.target : null,
        accuracy: 0.98,
        owner: v,
        aimMode: 'map',
        // Loft profile when striking a higher target (e.g. roof from street level)
        mapPath: needLoft ? 'loft' : 'direct',
        loftX, loftY, loftZ,
        guidePhase: needLoft ? 'climb' : 'terminal', // climb → terminal dive
      });
      this.effects?.spawnMuzzleBloom?.(new THREE.Vector3(ox, oy, oz), 1.6);
    };

    if (left > 0) {
      fireSide(-1, left, v.root.userData.leftTubes);
      v.rocketsLeft = left - 1;
    }
    if (right > 0) {
      fireSide(1, right, v.root.userData.rightTubes);
      v.rocketsRight = right - 1;
    }
    v.rocketCd = cfg.rocketCooldown ?? 0.45;
    this.bus?.emit?.('vehicle:rocket', {
      left: v.rocketsLeft,
      right: v.rocketsRight,
      lock: lock.kind,
      dist,
      mode: 'map',
    });
    return true;
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

  _updateRockets(dt) {
    for (let i = this._rockets.length - 1; i >= 0; i--) {
      const r = this._rockets[i];
      r.life -= dt;
      r.age = (r.age ?? 0) + dt;

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
      for (let s = 0; s < steps && !hit; s++) {
        const sp = Math.hypot(r.vx, r.vy, r.vz) || 1;
        const d = (Math.hypot(r.vx, r.vy, r.vz) * dt) / steps;
        const dx = (r.vx / sp) * d;
        const dy = (r.vy / sp) * d;
        const dz = (r.vz / sp) * d;
        const nx = r.x + dx;
        const ny = r.y + dy;
        const nz = r.z + dz;

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
        // Air-to-air proximity on helicopters
        for (const h of this.vehicles) {
          if (h.type !== 'helicopter' || h === r.owner || h.wrecked) continue;
          const hd = Math.hypot(h.x - nx, (h.y + 1) - ny, h.z - nz);
          if (hd < 2.8) {
            this._explodeRocket(r, nx, ny, nz);
            // Damage airframe
            h.health = Math.max(0, (h.health ?? 100) - (r.damage ?? 95) * 0.65);
            if (h.health <= 0 && !h.crashing) {
              h.crashing = true;
              h.crashT = 0;
              h.vy = Math.min(h.vy, -4);
            }
            hit = true;
            break;
          }
        }
        if (hit) break;
        if (r.targets?.length) {
          for (const t of r.targets) {
            if (t.dead) continue;
            const dist = Math.hypot(t.x - nx, (t.y + 1) - ny, t.z - nz);
            if (dist < 1.5) {
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

  _explodeRocket(r, x, y, z) {
    if (r.mesh) {
      this.group.remove(r.mesh);
      r.mesh.geometry?.dispose?.();
    }
    const pt = new THREE.Vector3(x, y, z);
    // Big missile boom
    this.effects?.spawnExplosion?.(pt, 1.65);
    this.effects?.spawnImpact?.(pt, 'solid');
    this.effects?.spawnMuzzleBloom?.(pt, 5.5);
    // Splash damage to bots
    const splash = r.splash ?? 5;
    const dmg = r.damage ?? 90;
    if (r.targets) {
      for (const t of r.targets) {
        if (t.dead) continue;
        const dist = Math.hypot(t.x - x, (t.y + 1) - y, t.z - z);
        if (dist > splash) continue;
        const fall = 1 - dist / splash;
        const applied = dmg * (0.35 + 0.65 * fall);
        if (typeof t.applyDamage === 'function') t.applyDamage(applied, dist < 1.2 ? 'chest' : 'chest');
        else if (t.health != null) {
          t.health -= applied;
          if (t.health <= 0) {
            t.health = 0;
            t.dead = true;
          }
        }
      }
    }
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

  /** List map-targetable entities for gunner (bots + helis). */
  getMapTargets(bots = []) {
    const list = [];
    for (const t of bots) {
      if (t.dead) continue;
      list.push({
        kind: 'bot', id: t.id, x: t.x, y: t.y + 1.1, z: t.z,
        label: `Squad ${t.teamId ?? '?'}`, target: t,
      });
    }
    for (const h of this.vehicles) {
      if (h.type !== 'helicopter' || h === this.active || h.wrecked) continue;
      list.push({
        kind: 'heli', id: h.id ?? list.length, x: h.x, y: h.y + 1.2, z: h.z,
        label: 'Helicopter', target: h,
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
