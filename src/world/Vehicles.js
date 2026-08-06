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
      if (d > range + (v.type === 'helicopter' ? 1.5 : 0)) continue;
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
    v.vx = 0;
    v.vz = 0;
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
    const side = 1.6;
    const r = rightXZ(v.yaw);
    let x = v.x + r.x * side;
    let z = v.z + r.z * side;
    let y = this.terrain.heightAt(x, z);
    if (v.type === 'helicopter' && v.y - y > 4) {
      // Prefer rooftop under heli if near a building roof
      y = this._supportY(v.x, v.y, v.z) ?? Math.min(v.y - 1.2, y + 0.5);
      x = v.x;
      z = v.z;
    }
    controller.pos.set(x, Math.max(y + 0.15, y), z);
    controller.vel.set(0, 0, 0);
    controller.grounded = true;
    this.active = null;
    this.bus?.emit?.('vehicle:dismount', { type: v.type });
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
   */
  _heliHitsBuilding(x, y, z) {
    const cfg = VEHICLES.HELICOPTER;
    const hw = cfg.halfW ?? 3.6;
    const hh = cfg.halfH ?? 1.6;
    const hd = cfg.halfD ?? 4.2;
    const y0 = y;
    const y1 = y + hh * 2;

    for (const b of worldBuildings || []) {
      // Expand footprint slightly for rotors
      const bx0 = b.x - 0.4;
      const bx1 = b.x + b.w + 0.4;
      const bz0 = b.z - 0.4;
      const bz1 = b.z + b.d + 0.4;
      if (x + hw < bx0 || x - hw > bx1) continue;
      if (z + hd < bz0 || z - hd > bz1) continue;
      const bot = (b.baseY ?? 0) - 0.2;
      const top = (b.roofY ?? (b.baseY + (b.floors || 1) * 3.5)) + 0.15;
      // Allow sitting just above roof (pad clearance)
      if (y0 < top - 0.05 && y1 > bot) {
        // If mostly above roof top with skids, not a hit
        if (y0 >= top - 0.35) continue;
        return true;
      }
    }
    return false;
  }

  /**
   * @returns {boolean} true if riding
   */
  update(dt, controller, input, yaw) {
    // Rockets always tick
    this._updateRockets(dt);

    for (const v of this.vehicles) {
      if (v.type !== 'helicopter') continue;
      const rotor = v.root.userData.rotor;
      const tail = v.root.userData.tailRotor;
      const spin = this.active === v ? 28 : 0.4;
      if (rotor) rotor.rotation.y += spin * dt;
      if (tail) tail.rotation.x += spin * 1.6 * dt;
      if (v.rocketCd > 0) v.rocketCd -= dt;
    }

    if (!this.active || !controller) return false;
    const v = this.active;
    if (v.type === 'motorcycle') this._driveMoto(dt, v, controller, input, yaw);
    else this._driveHeli(dt, v, controller, input, yaw);
    return true;
  }

  /**
   * Fire one rocket from each wing (if ammo remains). Call on LMB edge.
   * @returns {boolean} true if rockets fired
   */
  tryFireRockets(targets = []) {
    const v = this.active;
    if (!v || v.type !== 'helicopter') return false;
    if (v.rocketCd > 0) return false;
    const left = v.rocketsLeft ?? 0;
    const right = v.rocketsRight ?? 0;
    if (left <= 0 && right <= 0) return false;

    const cfg = VEHICLES.HELICOPTER;
    const f = forwardXZ(v.yaw);
    const r = rightXZ(v.yaw);
    const speed = cfg.rocketSpeed ?? 95;
    const nPer = cfg.rocketsPerSide ?? 8;

    // Index of next tube (from front of remaining)
    const fireSide = (side, remaining, tubes) => {
      if (remaining <= 0) return;
      const idx = nPer - remaining; // 0..7 which tube empties
      const tube = tubes?.[idx];
      if (tube) {
        tube.visible = false;
        tube.userData.loaded = false;
      }
      const ox = v.x + r.x * side * 1.7 + f.x * 0.3;
      const oy = v.y + 0.7 + (idx % 4) * 0.05;
      const oz = v.z + r.z * side * 1.7 + f.z * 0.3;
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
      // Point along velocity (−Z of rocket mesh = forward)
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(f.x, 0.02, f.z).normalize()
      );
      this.group.add(mesh);
      this._rockets.push({
        mesh,
        x: ox, y: oy, z: oz,
        vx: f.x * speed,
        vy: 0.5,
        vz: f.z * speed,
        life: 4.5,
        damage: cfg.rocketDamage ?? 90,
        splash: cfg.rocketSplash ?? 5,
        targets,
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
    });
    return true;
  }

  _updateRockets(dt) {
    for (let i = this._rockets.length - 1; i >= 0; i--) {
      const r = this._rockets[i];
      r.life -= dt;
      r.vy -= 6 * dt; // slight drop
      const step = Math.min(2.2, Math.hypot(r.vx, r.vy, r.vz) * dt + 0.01);
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

        // Ground
        const gY = this.terrain.heightAt(nx, nz);
        if (ny < gY + 0.4) {
          this._explodeRocket(r, nx, gY + 0.3, nz);
          hit = true;
          break;
        }
        // Buildings
        if (this._pointInBuilding(nx, ny, nz)) {
          this._explodeRocket(r, nx, ny, nz);
          hit = true;
          break;
        }
        // World solids via hash (quick segment)
        if (this.hash && this._rocketHitsSolid(r.x, r.y, r.z, nx, ny, nz)) {
          this._explodeRocket(r, nx, ny, nz);
          hit = true;
          break;
        }
        // Bots
        if (r.targets?.length) {
          for (const t of r.targets) {
            if (t.dead) continue;
            const dist = Math.hypot(t.x - nx, (t.y + 1) - ny, t.z - nz);
            if (dist < 1.4) {
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
      r.mesh.position.set(r.x, r.y, r.z);
      const sp = Math.hypot(r.vx, r.vy, r.vz) || 1;
      r.mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(r.vx / sp, r.vy / sp, r.vz / sp)
      );
      // Trail
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

    // Integrate with collision — try full step, then axis slides
    const tryPos = (nx, ny, nz) => {
      const lim = WORLD.SIZE * 0.48;
      nx = THREE.MathUtils.clamp(nx, -lim, lim);
      nz = THREE.MathUtils.clamp(nz, -lim, lim);
      const support = this._supportY(nx, ny + 2, nz);
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
      // Slide: try horizontal only, vertical only, or stop into surface
      ok = tryPos(nx, v.y, nz);
      if (ok) {
        v.vy *= 0.2;
      } else {
        ok = tryPos(v.x, ny, v.z);
        if (ok) {
          v.vx *= 0.15;
          v.vz *= 0.15;
        } else {
          // Push out of building if embedded
          v.vx *= -0.3;
          v.vz *= -0.3;
          v.vy = Math.max(v.vy, 2);
          ok = tryPos(v.x + v.vx * dt, v.y + 0.4, v.z + v.vz * dt)
            || { x: v.x, y: v.y + 0.5, z: v.z };
        }
      }
    }
    v.x = ok.x;
    v.y = ok.y;
    v.z = ok.z;

    v.root.position.set(v.x, v.y, v.z);
    v.root.rotation.y = v.yaw;
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
      if (this.active.type === 'helicopter') {
        const n = Math.min(this.active.rocketsLeft ?? 0, this.active.rocketsRight ?? 0);
        const pairs = Math.max(this.active.rocketsLeft ?? 0, this.active.rocketsRight ?? 0);
        // Remaining dual-fire volleys
        const volleys = Math.min(this.active.rocketsLeft ?? 0, this.active.rocketsRight ?? 0);
        return `E · Exit heli · Rockets ${volleys}/8 (LMB)`;
      }
      return 'E · Exit motorcycle';
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
