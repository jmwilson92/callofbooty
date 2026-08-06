import * as THREE from 'three';
import { VEHICLES, PLAYER, WORLD, POIS } from '../config.js';
import { worldBuildings } from './BuildingRegistry.js';

/**
 * Rideable motorcycles + helicopters.
 * Mesh nose faces local −Z (same as player look). Movement uses that forward.
 * E to mount/dismount. Motorcycle sticks to terrain; heli free-flies (Space/C).
 */

/** Player/camera forward XZ for a yaw (yaw 0 = −Z / north). */
function forwardXZ(yaw) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}
function rightXZ(yaw) {
  // Right of look: yaw 0 → +X
  return { x: Math.cos(yaw), z: -Math.sin(yaw) };
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
   */
  constructor(scene, terrain, bus) {
    this.scene = scene;
    this.terrain = terrain;
    this.bus = bus;
    this.group = new THREE.Group();
    this.group.name = 'vehicles';
    this.scene.add(this.group);
    this.vehicles = [];
    this.active = null; // currently ridden vehicle
    this._near = null;
  }

  /** Scatter motorcycles + helis around spawn / POIs / dry land. */
  spawn() {
    this.clear();
    const rng = mulberry(WORLD.SEED ^ 0x7e41c1e);
    const motoN = VEHICLES.MOTORCYCLE?.count ?? 16;
    const heliN = VEHICLES.HELICOPTER?.count ?? 5;

    // Motorcycles near spawn + POIs + random dry spots
    let placed = 0;
    const tryMoto = (x, z) => {
      if (placed >= motoN) return;
      const y = this.terrain.heightAt(x, z);
      if (y < WORLD.WATER_LEVEL + 0.8) return;
      if (this.terrain.slopeDegAt?.(x, z) > 22) return;
      this._addMotorcycle(x, y, z, rng() * Math.PI * 2, rng);
      placed++;
    };

    // Cluster near player spawn
    for (let i = 0; i < 5 && placed < motoN; i++) {
      const a = rng() * Math.PI * 2;
      const r = 8 + rng() * 35;
      tryMoto(PLAYER.SPAWN.x + Math.cos(a) * r, PLAYER.SPAWN.z + Math.sin(a) * r);
    }
    // Near each POI
    for (const p of POIS) {
      if (placed >= motoN) break;
      const a = rng() * Math.PI * 2;
      const r = 12 + rng() * 40;
      tryMoto(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r);
    }
    // Fill remaining randomly
    let guard = 0;
    while (placed < motoN && guard++ < motoN * 40) {
      const x = (rng() * 2 - 1) * WORLD.SIZE * 0.38;
      const z = (rng() * 2 - 1) * WORLD.SIZE * 0.38;
      tryMoto(x, z);
    }

    // Helicopters on tall building roofs (prefer downtown skyline)
    this._spawnRoofHelis(heliN, rng);

    return this.vehicles.length;
  }

  _spawnRoofHelis(count, rng) {
    const minF = VEHICLES.HELICOPTER?.minFloors ?? 10;
    const roofs = (worldBuildings || [])
      .filter((b) => b.floors >= minF && b.w >= 10 && b.d >= 10 && Number.isFinite(b.roofY ?? b.baseY))
      .map((b) => ({
        b,
        score: (b.floors || 0) * 2 + (b.w * b.d) * 0.01 + (Math.hypot((b.x + b.w * 0.5) - PLAYER.SPAWN.x, (b.z + b.d * 0.5) - PLAYER.SPAWN.z) < 200 ? 8 : 0),
      }))
      .sort((a, c) => c.score - a.score);

    let hi = 0;
    const used = [];
    for (const { b } of roofs) {
      if (hi >= count) break;
      const cx = b.x + b.w * 0.5;
      const cz = b.z + b.d * 0.5;
      // Avoid stacking two helis on the same roof
      if (used.some((u) => Math.hypot(u.x - cx, u.z - cz) < 18)) continue;
      const roofY = (b.roofY ?? (b.baseY + b.floors * 3.5)) + 0.35;
      this._addHelicopter(cx, roofY, cz, rng() * Math.PI * 2, rng);
      used.push({ x: cx, z: cz });
      hi++;
    }
    // Fallback: open ground near spawn if not enough tall roofs registered yet
    while (hi < count) {
      const a = rng() * Math.PI * 2;
      const r = 30 + rng() * 50;
      const x = PLAYER.SPAWN.x + Math.cos(a) * r;
      const z = PLAYER.SPAWN.z + Math.sin(a) * r;
      const y = this.terrain.heightAt(x, z) + 0.5;
      if (y > WORLD.WATER_LEVEL + 1.5) {
        this._addHelicopter(x, y, z, rng() * Math.PI * 2, rng);
        hi++;
      } else {
        break;
      }
    }
  }

  clear() {
    this.active = null;
    this.vehicles.length = 0;
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

    // Nose toward local −Z (player forward). Seat aft (+Z-ish), headlight −Z.
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

  _addHelicopter(x, y, z, yaw, rng) {
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

    // Nose toward local −Z (player forward); tail toward +Z
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

    root.userData.rotor = rotor;
    root.userData.tailRotor = tailRotor;

    // Roof pad marker (visible helipad ring)
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.2, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.85 })
    );
    pad.position.y = 0.02;
    root.add(pad);
    const H = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.05, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xe8e8e8, emissive: 0x404040, emissiveIntensity: 0.3 })
    );
    H.position.y = 0.08;
    root.add(H);

    this.group.add(root);
    this.vehicles.push({
      type: 'helicopter',
      root,
      x, y, z, yaw,
      speed: 0,
      vy: 0,
      vx: 0, vz: 0,
    });
  }

  findNear(px, py, pz) {
    let best = null;
    let bestD = Infinity;
    const range = VEHICLES.ENTER_RANGE ?? 3.4;
    for (const v of this.vehicles) {
      if (this.active === v) continue;
      const d = Math.hypot(v.x - px, v.z - pz);
      if (d > range + (v.type === 'helicopter' ? 1.5 : 0)) continue;
      // Helis on roofs need taller enter window
      const maxDy = v.type === 'helicopter' ? 6 : 3.5;
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
    // Exit if riding
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
    v.speed = 0;
    v.vy = 0;
    // Snap player onto seat
    const cfg = v.type === 'helicopter' ? VEHICLES.HELICOPTER : VEHICLES.MOTORCYCLE;
    controller.pos.set(v.x, v.y + (cfg.seatY ?? 1), v.z);
    controller.vel.set(0, 0, 0);
    controller.grounded = v.type === 'motorcycle';
    controller.sliding = false;
    controller.mantling = false;
    controller.onLadder = false;
    this.bus?.emit?.('vehicle:mount', { type: v.type });
  }

  _dismount(controller) {
    const v = this.active;
    if (!v) return;
    // Step off to the right of the vehicle
    const side = 1.6;
    const rx = Math.cos(v.yaw) * side;
    const rz = -Math.sin(v.yaw) * side;
    let x = v.x + rx;
    let z = v.z + rz;
    let y = this.terrain.heightAt(x, z);
    if (v.type === 'helicopter' && v.y - y > 4) {
      // Still airborne — soft land under heli if possible
      y = Math.min(v.y - 1.2, y + 0.5);
      x = v.x;
      z = v.z;
    }
    controller.pos.set(x, Math.max(y + 0.1, y), z);
    controller.vel.set(0, 0, 0);
    controller.grounded = true;
    this.active = null;
    this.bus?.emit?.('vehicle:dismount', { type: v.type });
  }

  /**
   * Drive active vehicle. Call instead of (or around) controller.tick when mounted.
   * @returns {boolean} true if player is currently in a vehicle
   */
  update(dt, controller, input, yaw) {
    // Spin parked heli rotors slowly; ridden ones fast
    for (const v of this.vehicles) {
      if (v.type !== 'helicopter') continue;
      const rotor = v.root.userData.rotor;
      const tail = v.root.userData.tailRotor;
      const spin = this.active === v ? 28 : 0.4;
      if (rotor) rotor.rotation.y += spin * dt;
      if (tail) tail.rotation.x += spin * 1.6 * dt;
    }

    if (!this.active || !controller) return false;
    const v = this.active;
    if (v.type === 'motorcycle') this._driveMoto(dt, v, controller, input, yaw);
    else this._driveHeli(dt, v, controller, input, yaw);
    return true;
  }

  _driveMoto(dt, v, controller, input, yaw) {
    const cfg = VEHICLES.MOTORCYCLE;
    const maxSp = cfg.speed ?? 22;
    const accel = cfg.accel ?? 28;
    const brake = cfg.brake ?? 35;

    // Steer toward look direction (yaw) + A/D nudge
    let steer = 0;
    if (input.action('left')) steer += 1;
    if (input.action('right')) steer -= 1;
    let dyaw = yaw - v.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    const turn = (cfg.turnRate ?? 2.4) * (0.35 + Math.min(1, Math.abs(v.speed) / maxSp));
    v.yaw += THREE.MathUtils.clamp(dyaw, -turn * dt, turn * dt);
    v.yaw += steer * turn * 0.55 * dt;

    // Throttle
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

    // Forward matches player look / mesh nose (−Z at yaw 0)
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
    const minAGL = cfg.minAGL ?? 2.5;
    const maxY = cfg.maxY ?? 220;

    let dyaw = yaw - v.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    v.yaw += THREE.MathUtils.clamp(dyaw, -2.8 * dt, 2.8 * dt);

    const f = forwardXZ(v.yaw);
    const r = rightXZ(v.yaw);

    let wishX = 0;
    let wishZ = 0;
    if (input.action('forward')) { wishX += f.x; wishZ += f.z; }
    if (input.action('back')) { wishX -= f.x; wishZ -= f.z; }
    if (input.action('left')) { wishX -= r.x; wishZ -= r.z; }
    if (input.action('right')) { wishX += r.x; wishZ += r.z; }
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

    let climbWish = 0;
    if (input.action('jump')) climbWish += 1;
    if (input.action('crouch')) climbWish -= 1;
    v.vy += climbWish * climb * dt;
    if (climbWish === 0) v.vy *= Math.exp(-2.2 * dt);
    v.vy = THREE.MathUtils.clamp(v.vy, -climb * 1.1, climb);

    v.x += v.vx * dt;
    v.z += v.vz * dt;
    v.y += v.vy * dt;

    const lim = WORLD.SIZE * 0.48;
    v.x = THREE.MathUtils.clamp(v.x, -lim, lim);
    v.z = THREE.MathUtils.clamp(v.z, -lim, lim);

    const ground = this.terrain.heightAt(v.x, v.z);
    const minY = ground + minAGL;
    if (v.y < minY) {
      v.y = minY;
      if (v.vy < 0) v.vy = 0;
    }
    if (v.y > maxY) {
      v.y = maxY;
      if (v.vy > 0) v.vy = 0;
    }

    v.root.position.set(v.x, v.y, v.z);
    v.root.rotation.y = v.yaw;
    // Nose-down when moving forward (mesh nose is −Z)
    const pitch = THREE.MathUtils.clamp(
      -v.vy * 0.02 - (input.action('forward') ? 0.12 : 0) + (input.action('back') ? 0.08 : 0),
      -0.25, 0.2
    );
    const bank = THREE.MathUtils.clamp((input.action('right') ? 1 : 0) - (input.action('left') ? 1 : 0), -1, 1) * 0.2;
    v.root.rotation.x = THREE.MathUtils.lerp(v.root.rotation.x || 0, pitch, 1 - Math.exp(-5 * dt));
    v.root.rotation.z = THREE.MathUtils.lerp(v.root.rotation.z || 0, -bank, 1 - Math.exp(-5 * dt));

    controller.pos.set(v.x, v.y + (cfg.seatY ?? 1.1), v.z);
    controller.vel.set(v.vx, v.vy, v.vz);
    controller.grounded = false;
    controller.speed = Math.hypot(v.vx, v.vz);
    controller.prevPos.copy(controller.pos);
  }

  prompt(px, py, pz) {
    if (this.active) {
      const t = this.active.type === 'helicopter' ? 'Helicopter' : 'Motorcycle';
      return `E · Exit ${t}`;
    }
    const v = this.findNear(px, py, pz);
    if (!v) return null;
    return v.type === 'helicopter' ? 'E · Board helicopter' : 'E · Ride motorcycle';
  }

  get riding() {
    return !!this.active;
  }

  get rideType() {
    return this.active?.type ?? null;
  }
}
