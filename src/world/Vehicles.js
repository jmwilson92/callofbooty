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
    this._near = null;
    this._rockets = [];
    this._cand = [];
  }

  spawn() {
    this.clear();
    const rng = mulberry(WORLD.SEED ^ 0x7e41c1e);
    const motoN = VEHICLES.MOTORCYCLE?.count ?? 16;
    const heliN = VEHICLES.HELICOPTER?.count ?? 2;

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
    for (const { b } of roofs) {
      if (hi >= count) break;
      const cx = b.x + b.w * 0.5;
      const cz = b.z + b.d * 0.5;
      if (used.some((u) => Math.hypot(u.x - cx, u.z - cz) < 18)) continue;
      const roofY = (b.roofY ?? (b.baseY + b.floors * 3.5)) + 0.35;
      this._addHelicopter(cx, roofY, cz, rng() * Math.PI * 2, rng, true);
      used.push({ x: cx, z: cz });
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
    this.vehicles.length = 0;
    this._rockets.length = 0;
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
    this.vehicles.push({
      type: 'helicopter',
      root,
      x, y, z, yaw,
      speed: 0,
      vy: 0,
      vx: 0, vz: 0,
      rocketsLeft: nR,
      rocketsRight: nR,
      rocketCd: 0,
    });
  }

  findNear(px, py, pz) {
    let best = null;
    let bestD = Infinity;
    const range = VEHICLES.ENTER_RANGE ?? 3.4;
    for (const v of this.vehicles) {
      if (this.active === v) continue;
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

  tryUse(controller) {
    if (this.active) {
      this._dismount(controller);
      return true;
    }
    const v = this.findNear(controller.pos.x, controller.pos.y, controller.pos.z);
    if (!v) return false;
    this._mount(v, controller);
    return true;
  }

  _mount(v, controller) {
    this.active = v;
    // Passenger / new pilot takes over — cancel unmanned crash
    v.crashing = false;
    v.wrecked = false;
    v.speed = 0;
    // Keep a little residual fall if they grab a falling bird mid-crash
    if (v.type === 'helicopter') {
      v.vy = Math.min(0, v.vy * 0.35);
      v.vx *= 0.5;
      v.vz *= 0.5;
    } else {
      v.vy = 0;
      v.vx = 0;
      v.vz = 0;
    }
    const cfg = v.type === 'helicopter' ? VEHICLES.HELICOPTER : VEHICLES.MOTORCYCLE;
    controller.pos.set(v.x, v.y + (cfg.seatY ?? 1), v.z);
    controller.vel.set(0, 0, 0);
    controller.grounded = v.type === 'motorcycle';
    controller.sliding = false;
    controller.mantling = false;
    controller.onLadder = false;
    this.bus?.emit?.('vehicle:mount', { type: v.type, takeover: true });
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
    this.active = null;
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
      // Rockets always tick
      this._updateRockets(dt);
    } catch (err) {
      console.warn('[vehicles] rocket update failed', err);
      this._rockets.length = 0;
    }

    // Unmanned / abandoned helis keep falling even when player is on foot
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
    }

    if (!this.active || !controller) return false;
    const v = this.active;
    try {
      if (v.type === 'motorcycle') this._driveMoto(dt, v, controller, input, yaw);
      else this._driveHeli(dt, v, controller, input, yaw);
    } catch (err) {
      // Never let a vehicle glitch freeze the whole game loop
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
    v.wreckT = 0;
    if (v.root) {
      v.root.position.set(v.x, v.y, v.z);
      v.root.rotation.x = 0.15 + Math.min(0.4, speed * 0.01);
      v.root.rotation.z = (Math.random() - 0.5) * 0.35;
    }
    const pt = new THREE.Vector3(v.x, v.y + 0.5, v.z);
    this.effects?.spawnMuzzleBloom?.(pt, 3.5 + Math.min(2, speed * 0.04));
    this.effects?.spawnImpact?.(pt, 'solid');
    // Splash damage near crash
    const splash = 8;
    const dmg = 40 + Math.min(80, speed * 1.2);
    // Damage is applied when rockets know targets; crash uses bus for future hooks
    this.bus?.emit?.('vehicle:crash', { x: v.x, y: v.y, z: v.z, speed, splash, dmg });
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
   * Fire one rocket from each wing (if ammo remains). Call on LMB edge.
   * Aim with look direction — missiles guide toward reticle lock
   * (bots, buildings, or ground aim point).
   * @param {Array} targets live bots / combat targets
   * @param {{ yaw:number, pitch:number }} [aim] camera look
   * @returns {boolean} true if rockets fired
   */
  tryFireRockets(targets = [], aim = null) {
    const v = this.active;
    if (!v || v.type !== 'helicopter') return false;
    if (v.rocketCd > 0) return false;
    const left = v.rocketsLeft ?? 0;
    const right = v.rocketsRight ?? 0;
    if (left <= 0 && right <= 0) return false;

    const cfg = VEHICLES.HELICOPTER;
    const bodyF = forwardXZ(v.yaw);
    const bodyR = rightXZ(v.yaw);
    const speed = cfg.rocketSpeed ?? 88;
    const nPer = cfg.rocketsPerSide ?? 8;

    const yaw = aim?.yaw ?? v.yaw;
    const pitch = aim?.pitch ?? -0.12;
    const look = this._lookDir(yaw, pitch);
    const eye = {
      x: v.x,
      y: v.y + (cfg.seatY ?? 1.1) + 0.4,
      z: v.z,
    };
    const lock = this._acquireRocketLock(eye, look, targets, cfg);

    // Fire slightly toward look, not just nose-forward
    const fireDir = new THREE.Vector3(look.x, look.y, look.z).normalize();
    // Blend a little body forward so pods don't clip cabin
    fireDir.x = fireDir.x * 0.85 + bodyF.x * 0.15;
    fireDir.z = fireDir.z * 0.85 + bodyF.z * 0.15;
    fireDir.normalize();

    const fireSide = (side, remaining, tubes) => {
      if (remaining <= 0) return;
      const idx = nPer - remaining;
      const tube = tubes?.[idx];
      if (tube) {
        tube.visible = false;
        tube.userData.loaded = false;
      }
      const ox = v.x + bodyR.x * side * 1.7 + bodyF.x * 0.3;
      const oy = v.y + 0.7 + (idx % 4) * 0.05;
      const oz = v.z + bodyR.z * side * 1.7 + bodyF.z * 0.3;
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
        mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          fireDir.clone()
        );
      } catch { /* ok */ }
      this.group.add(mesh);

      // Slight outward spread per wing so dual fire isn't identical
      const spread = side * 0.04;
      const dir = fireDir.clone();
      dir.x += bodyR.x * spread;
      dir.z += bodyR.z * spread;
      dir.normalize();

      this._rockets.push({
        mesh,
        x: ox, y: oy, z: oz,
        vx: dir.x * speed,
        vy: dir.y * speed,
        vz: dir.z * speed,
        speed,
        life: 5.5,
        age: 0,
        damage: cfg.rocketDamage ?? 90,
        splash: cfg.rocketSplash ?? 5.5,
        targets,
        // Guidance
        guided: true,
        guideDelay: cfg.rocketGuideDelay ?? 0.08,
        turnRate: cfg.rocketTurnRate ?? 3.4,
        lock: lock ? { ...lock } : null,
        lockTarget: lock?.target ?? null, // live bot ref for tracking
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
    v.rocketCd = cfg.rocketCooldown ?? 0.4;
    this.bus?.emit?.('vehicle:rocket', {
      left: v.rocketsLeft,
      right: v.rocketsRight,
      lock: lock?.kind ?? null,
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
   * Soft lock under reticle: bots first, then building aim point, else ground.
   * @returns {{ x:number, y:number, z:number, kind:string, target?:object }|null}
   */
  _acquireRocketLock(eye, look, targets, cfg) {
    const range = cfg.rocketLockRange ?? 260;
    const cone = ((cfg.rocketLockConeDeg ?? 14) * Math.PI) / 180;
    const cosCone = Math.cos(cone);

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
        // Prefer near-center + closer targets
        const score = dot * 2 - dist / range;
        if (score > bestBotScore) {
          bestBotScore = score;
          bestBot = t;
        }
      }
    }
    if (bestBot) {
      return {
        x: bestBot.x,
        y: bestBot.y + 1.1,
        z: bestBot.z,
        kind: 'bot',
        target: bestBot,
      };
    }

    // Ray march toward look for building / ground aim point
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
        // Prefer building center-ish at impact height for a solid hit
        const b = this._buildingAt(px, pz);
        if (b) {
          const cx = b.x + b.w * 0.5;
          const cz = b.z + b.d * 0.5;
          // Keep the hit height, pull slightly toward facade under aim
          return {
            x: lerp(px, cx, 0.15),
            y: py,
            z: lerp(pz, cz, 0.15),
            kind: 'building',
          };
        }
        return { x: px, y: py, z: pz, kind: 'building' };
      }
    }
    // Far point along look
    return {
      x: eye.x + look.x * range,
      y: eye.y + look.y * range,
      z: eye.z + look.z * range,
      kind: 'sky',
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

      // --- Guidance: steer velocity toward lock point ---
      if (r.guided && r.age >= (r.guideDelay ?? 0.08)) {
        let tx = r.lock?.x;
        let ty = r.lock?.y;
        let tz = r.lock?.z;
        // Track live bot if still alive
        const lt = r.lockTarget;
        if (lt && !lt.dead) {
          tx = lt.x;
          ty = lt.y + 1.1;
          tz = lt.z;
          if (r.lock) {
            r.lock.x = tx;
            r.lock.y = ty;
            r.lock.z = tz;
          }
        }
        if (Number.isFinite(tx + ty + tz)) {
          const dx = tx - r.x;
          const dy = ty - r.y;
          const dz = tz - r.z;
          const dist = Math.hypot(dx, dy, dz) || 1;
          const wantX = dx / dist;
          const wantY = dy / dist;
          const wantZ = dz / dist;
          const sp = Math.hypot(r.vx, r.vy, r.vz) || (r.speed ?? 88);
          const curX = r.vx / sp;
          const curY = r.vy / sp;
          const curZ = r.vz / sp;
          // Max turn this frame
          const maxTurn = (r.turnRate ?? 3.4) * dt;
          const dot = THREE.MathUtils.clamp(
            curX * wantX + curY * wantY + curZ * wantZ,
            -1, 1
          );
          const ang = Math.acos(dot);
          if (ang > 1e-4) {
            const t = Math.min(1, maxTurn / ang);
            // Slerp-ish blend on direction
            let nx = curX + (wantX - curX) * t;
            let ny = curY + (wantY - curY) * t;
            let nz = curZ + (wantZ - curZ) * t;
            const nl = Math.hypot(nx, ny, nz) || 1;
            nx /= nl; ny /= nl; nz /= nl;
            // Hold speed (slight boost toward target)
            const hold = Math.min((r.speed ?? 88) * 1.05, sp + 8 * dt);
            r.vx = nx * hold;
            r.vy = ny * hold;
            r.vz = nz * hold;
          }
        }
      } else {
        r.vy -= 4 * dt; // mild drop before guide kicks in
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

        // Proximity fuse near lock
        if (r.lock && r.age > 0.15) {
          const pd = Math.hypot(r.lock.x - nx, r.lock.y - ny, r.lock.z - nz);
          if (pd < 1.6) {
            this._explodeRocket(r, nx, ny, nz);
            hit = true;
            break;
          }
        }

        const gY = this.terrain.heightAt(nx, nz);
        if (ny < gY + 0.4) {
          this._explodeRocket(r, nx, gY + 0.3, nz);
          hit = true;
          break;
        }
        if (this._pointInBuilding(nx, ny, nz)) {
          this._explodeRocket(r, nx, ny, nz);
          hit = true;
          break;
        }
        if (this.hash && this._rocketHitsSolid(r.x, r.y, r.z, nx, ny, nz)) {
          this._explodeRocket(r, nx, ny, nz);
          hit = true;
          break;
        }
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
    this.effects?.spawnImpact?.(pt, 'solid');
    this.effects?.spawnMuzzleBloom?.(pt, 2.8);
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

    let dyaw = (Number.isFinite(yaw) ? yaw : v.yaw) - v.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    v.yaw += THREE.MathUtils.clamp(dyaw, -2.8 * dt, 2.8 * dt);

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
      v.vx += wishX * accel * dt;
      v.vz += wishZ * accel * dt;
    } else {
      v.vx *= Math.exp(-1.8 * dt);
      v.vz *= Math.exp(-1.8 * dt);
    }
    const hsp = Math.hypot(v.vx, v.vz);
    if (hsp > maxSp) {
      v.vx *= maxSp / hsp;
      v.vz *= maxSp / hsp;
    }

    // Space = climb, C / Ctrl = descend (crouch binding)
    let climbWish = 0;
    if (input?.action?.('jump')) climbWish += 1;
    if (input?.action?.('crouch')) climbWish -= 1;
    v.vy += climbWish * climb * dt;
    if (climbWish === 0) v.vy *= Math.exp(-2.2 * dt);
    v.vy = THREE.MathUtils.clamp(v.vy, -climb * 1.1, climb);

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
      const pitch = THREE.MathUtils.clamp(
        -v.vy * 0.02
          - (input?.action?.('forward') ? 0.12 : 0)
          + (input?.action?.('back') ? 0.08 : 0),
        -0.25, 0.2
      );
      const bank = THREE.MathUtils.clamp(
        (input?.action?.('right') ? 1 : 0) - (input?.action?.('left') ? 1 : 0),
        -1, 1
      ) * 0.2;
      const rx = Number.isFinite(v.root.rotation.x) ? v.root.rotation.x : 0;
      const rz = Number.isFinite(v.root.rotation.z) ? v.root.rotation.z : 0;
      v.root.rotation.x = THREE.MathUtils.lerp(rx, pitch, 1 - Math.exp(-5 * dt));
      v.root.rotation.z = THREE.MathUtils.lerp(rz, -bank, 1 - Math.exp(-5 * dt));
    }

    controller.pos.set(v.x, v.y + (cfg.seatY ?? 1.1), v.z);
    controller.vel.set(v.vx, v.vy, v.vz);
    controller.grounded = false;
    controller.speed = Math.hypot(v.vx, v.vz);
    if (controller.prevPos) controller.prevPos.copy(controller.pos);
  }

  prompt(px, py, pz) {
    if (this.active) {
      if (this.active.type === 'helicopter') {
        const volleys = Math.min(this.active.rocketsLeft ?? 0, this.active.rocketsRight ?? 0);
        return `E · Bail · Guided rockets ${volleys}/8 (LMB aim)`;
      }
      return 'E · Exit motorcycle';
    }
    const v = this.findNear(px, py, pz);
    if (!v) return null;
    if (v.type === 'helicopter') {
      if (v.crashing) return 'E · Take over (falling!)';
      if (v.wrecked) return 'E · Board wrecked heli';
      return 'E · Board helicopter';
    }
    return 'E · Ride motorcycle';
  }

  /** Soft lock info for HUD while piloting (optional). */
  getRocketLockHint(targets, aim) {
    const v = this.active;
    if (!v || v.type !== 'helicopter' || !aim) return null;
    const cfg = VEHICLES.HELICOPTER;
    const eye = {
      x: v.x,
      y: v.y + (cfg.seatY ?? 1.1) + 0.4,
      z: v.z,
    };
    const look = this._lookDir(aim.yaw, aim.pitch);
    const lock = this._acquireRocketLock(eye, look, targets, cfg);
    if (!lock) return null;
    return lock.kind;
  }

  get riding() {
    return !!this.active;
  }

  get rideType() {
    return this.active?.type ?? null;
  }
}
