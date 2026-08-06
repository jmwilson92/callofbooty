import * as THREE from 'three';
import { BOTS, WORLD, PLAYER } from '../config.js';
import { makeHumanoidParts } from './Targets.js';

/**
 * Simple wandering practice bots.
 * - Walk between random ground waypoints near downtown
 * - Take hitscan damage / die / respawn
 * - Do not shoot the player (training dummies that move)
 */

const _cand = [];

function hash2(i, salt) {
  let n = (i * 374761393 + salt * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export class BotSystem {
  constructor(scene, terrain, hash, bus) {
    this.scene = scene;
    this.terrain = terrain;
    this.hash = hash;
    this.bus = bus;
    this.group = new THREE.Group();
    this.group.name = 'bots';
    this.scene.add(this.group);
    this.bots = [];
    this._live = [];
  }

  /** Spawn bots around the player spawn / downtown plate. */
  spawn(count = BOTS.COUNT) {
    this.clear();
    const cx = PLAYER.SPAWN.x;
    const cz = PLAYER.SPAWN.z;
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 40) {
      attempts++;
      const ang = hash2(attempts, 11) * Math.PI * 2;
      const dist = BOTS.SPAWN_MIN + hash2(attempts, 29) * (BOTS.SPAWN_MAX - BOTS.SPAWN_MIN);
      const x = cx + Math.cos(ang) * dist;
      const z = cz + Math.sin(ang) * dist;
      if (!this._isWalkable(x, z)) continue;
      this._addBot(placed, x, z);
      placed++;
    }
    // Fallback: ring if terrain rejected too many
    while (placed < count) {
      const ang = (placed / count) * Math.PI * 2;
      const x = cx + Math.cos(ang) * 40;
      const z = cz + Math.sin(ang) * 40;
      this._addBot(placed, x, z);
      placed++;
    }
    return this.bots.length;
  }

  clear() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.bots.length = 0;
  }

  _addBot(id, x, z) {
    const y = this.terrain.heightAt(x, z);
    const color = BOTS.COLORS[id % BOTS.COLORS.length];
    const local = this._buildLocalMesh(color);
    local.position.set(x, y, z);
    this.group.add(local);

    const bot = {
      id,
      x,
      y,
      z,
      yaw: hash2(id, 7) * Math.PI * 2,
      speed: BOTS.SPEED + (hash2(id, 3) - 0.5) * 2 * BOTS.SPEED_JITTER,
      health: BOTS.HEALTH,
      maxHealth: BOTS.HEALTH,
      armor: 0,
      dead: false,
      respawnT: 0,
      waypoint: { x, z },
      pauseT: 0.2 + hash2(id, 5) * BOTS.WAYPOINT_PAUSE,
      homeX: x,
      homeZ: z,
      parts: makeHumanoidParts(x, y, z),
      mesh: local,
      color,
      applyDamage: null,
    };
    bot.applyDamage = (dmg, part) => this.applyDamage(bot, dmg, part);
    this._pickWaypoint(bot, id * 17 + 1);
    this.bots.push(bot);
    return bot;
  }

  /**
   * Operator-style humanoid (feet at origin).
   * Cylinders + beveled boxes for a less “Minecraft” read; still cheap to draw.
   */
  _buildLocalMesh(color) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.08 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.65, metalness: 0.2 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc9a07a, roughness: 0.82, metalness: 0.02 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x252830, roughness: 0.55, metalness: 0.25 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.7, metalness: 0.1 });

    const add = (mesh, parent = g) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Boots
    add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.24), bootMat)).position.set(-0.11, 0.05, 0.02);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.24), bootMat)).position.set(0.11, 0.05, 0.02);

    // Legs as thigh + shin cylinders (pivots at hips / knees for anim)
    const makeLeg = (x) => {
      const root = new THREE.Group();
      root.position.set(x, 0.95, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.42, 8), darkMat);
      thigh.position.y = -0.21;
      thigh.castShadow = true;
      root.add(thigh);
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.4, 8), darkMat);
      shin.position.y = -0.62;
      shin.castShadow = true;
      root.add(shin);
      // knee pad
      const knee = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), vestMat);
      knee.position.y = -0.42;
      root.add(knee);
      g.add(root);
      return root;
    };
    const lLeg = makeLeg(-0.12);
    const rLeg = makeLeg(0.12);

    // Hips / belt
    add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.22), darkMat)).position.set(0, 0.98, 0);

    // Torso + plate carrier
    add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.48, 0.22), bodyMat)).position.set(0, 1.28, 0);
    const vest = add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.26), vestMat));
    vest.position.set(0, 1.32, 0.01);
    // Mag pouches on chest
    for (const px of [-0.1, 0.1]) {
      const p = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), darkMat));
      p.position.set(px, 1.22, 0.16);
    }
    // Radio / admin pouch
    add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.06), darkMat)).position.set(0.18, 1.38, 0.14);

    // Shoulders / arms
    const makeArm = (x, sign) => {
      const root = new THREE.Group();
      root.position.set(x, 1.48, 0);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.32, 8), bodyMat);
      upper.position.y = -0.16;
      upper.castShadow = true;
      root.add(upper);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 8), bodyMat);
      lower.position.y = -0.45;
      lower.castShadow = true;
      root.add(lower);
      // glove
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.08), darkMat);
      hand.position.y = -0.62;
      root.add(hand);
      // slight rest pose (arms hang forward a bit)
      root.rotation.z = sign * 0.08;
      root.rotation.x = 0.12;
      g.add(root);
      return root;
    };
    const lArm = makeArm(-0.28, -1);
    const rArm = makeArm(0.28, 1);

    // Neck + head (sphere-ish)
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), skinMat)).position.set(0, 1.58, 0);
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), skinMat));
    head.position.set(0, 1.72, 0);
    head.scale.set(1, 1.05, 0.95);

    // Ballistic helmet
    const helm = add(new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), darkMat));
    helm.position.set(0, 1.78, 0);
    // NVG mount stub
    add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.08), vestMat)).position.set(0, 1.88, 0.08);
    // Goggles on helmet
    add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.06), vestMat)).position.set(0, 1.76, 0.12);

    // Backpack / assault pack
    const pack = add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.14), darkMat));
    pack.position.set(0, 1.3, -0.18);

    // Held rifle silhouette (low-poly, for read)
    const gun = new THREE.Group();
    gun.position.set(0.12, 1.15, 0.28);
    gun.rotation.set(-0.15, 0.35, 0.1);
    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.32), darkMat);
    gun.add(rec);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), vestMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.z = 0.28;
    gun.add(bar);
    g.add(gun);

    // Threat tag (small, above head)
    const tag = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.05, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xff3333 })
    );
    tag.position.set(0, 2.05, 0);
    g.add(tag);

    g.userData.lLeg = lLeg;
    g.userData.rLeg = rLeg;
    g.userData.lArm = lArm;
    g.userData.rArm = rArm;
    g.userData.gun = gun;
    return g;
  }

  _isWalkable(x, z) {
    if (Math.abs(x) > WORLD.SIZE * 0.45 || Math.abs(z) > WORLD.SIZE * 0.45) return false;
    const y = this.terrain.heightAt(x, z);
    if (y < WORLD.WATER_LEVEL + 0.4) return false;
    if (this.terrain.slopeDegAt && this.terrain.slopeDegAt(x, z) > 28) return false;
    // Reject if capsule would be inside a solid
    if (this._blocked(x, y, z)) return false;
    return true;
  }

  _blocked(x, y, z) {
    const r = BOTS.RADIUS;
    const h = BOTS.HEIGHT;
    this.hash.query(x - r - 0.2, z - r - 0.2, x + r + 0.2, z + r + 0.2, _cand);
    for (let i = 0; i < _cand.length; i++) {
      const b = _cand[i];
      if (b.disabled || b.tag === 'trigger' || b.tag === 'door' || b.tag === 'thin') continue;
      // Vertical overlap with body
      if (y + h < b.min.y || y + 0.3 > b.max.y) continue;
      // Horizontal capsule vs AABB
      const cx = Math.max(b.min.x, Math.min(x, b.max.x));
      const cz = Math.max(b.min.z, Math.min(z, b.max.z));
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  }

  _pickWaypoint(bot, salt = 0) {
    for (let i = 0; i < 12; i++) {
      const ang = hash2(bot.id + salt + i, 41) * Math.PI * 2;
      const dist = 4 + hash2(bot.id + salt + i, 43) * BOTS.WANDER_RADIUS;
      const x = bot.homeX + Math.cos(ang) * dist * (0.4 + hash2(bot.id + i, 47) * 0.6);
      const z = bot.homeZ + Math.sin(ang) * dist * (0.4 + hash2(bot.id + i, 53) * 0.6);
      if (this._isWalkable(x, z)) {
        bot.waypoint.x = x;
        bot.waypoint.z = z;
        return;
      }
    }
    // Stay near home
    bot.waypoint.x = bot.homeX + (hash2(bot.id + salt, 59) - 0.5) * 8;
    bot.waypoint.z = bot.homeZ + (hash2(bot.id + salt, 61) - 0.5) * 8;
  }

  _syncParts(bot) {
    const parts = makeHumanoidParts(bot.x, bot.y, bot.z);
    bot.parts = parts;
  }

  applyDamage(bot, dmg, part) {
    if (bot.dead) return { killed: false, applied: 0 };
    let remaining = dmg;
    if (bot.armor > 0) {
      const absorbed = Math.min(bot.armor, remaining);
      bot.armor -= absorbed;
      remaining -= absorbed;
    }
    bot.health -= remaining;
    if (bot.health <= 0) {
      bot.health = 0;
      bot.dead = true;
      bot.respawnT = BOTS.RESPAWN_TIME;
      bot.mesh.visible = false;
      this.bus.emit('bot:killed', { id: bot.id, part });
      return { killed: true, applied: dmg };
    }
    // Flinch tint
    bot.mesh.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive) {
        o.material.emissive.setHex(0x440000);
        o.material.emissiveIntensity = 0.6;
      }
    });
    bot._flinchT = 0.12;
    return { killed: false, applied: dmg };
  }

  update(dt) {
    for (const bot of this.bots) {
      if (bot.dead) {
        bot.respawnT -= dt;
        if (bot.respawnT <= 0) this._respawn(bot);
        continue;
      }

      if (bot._flinchT > 0) {
        bot._flinchT -= dt;
        if (bot._flinchT <= 0) {
          bot.mesh.traverse((o) => {
            if (o.isMesh && o.material && o.material.emissive) {
              o.material.emissive.setHex(0x000000);
              o.material.emissiveIntensity = 0;
            }
          });
        }
      }

      if (bot.pauseT > 0) {
        bot.pauseT -= dt;
        this._idleAnim(bot, dt);
        this._syncParts(bot);
        continue;
      }

      const wx = bot.waypoint.x - bot.x;
      const wz = bot.waypoint.z - bot.z;
      const dist = Math.hypot(wx, wz);
      if (dist < BOTS.WAYPOINT_REACH) {
        bot.pauseT = BOTS.WAYPOINT_PAUSE + hash2(bot.id, (performance.now() * 0.001) | 0) * 1.2;
        this._pickWaypoint(bot, (performance.now() * 0.01) | 0);
        this._syncParts(bot);
        continue;
      }

      const nx = wx / dist;
      const nz = wz / dist;
      const step = bot.speed * dt;
      let nextX = bot.x + nx * step;
      let nextZ = bot.z + nz * step;

      // Simple collision: if blocked, try slide axes then new waypoint
      const nextY = this.terrain.heightAt(nextX, nextZ);
      if (!this._isWalkable(nextX, nextZ) || this._blocked(nextX, nextY, nextZ)) {
        // try axis slide
        const onlyX = this._isWalkable(bot.x + nx * step, bot.z)
          && !this._blocked(bot.x + nx * step, this.terrain.heightAt(bot.x + nx * step, bot.z), bot.z);
        const onlyZ = this._isWalkable(bot.x, bot.z + nz * step)
          && !this._blocked(bot.x, this.terrain.heightAt(bot.x, bot.z + nz * step), bot.z + nz * step);
        if (onlyX) {
          nextX = bot.x + nx * step;
          nextZ = bot.z;
        } else if (onlyZ) {
          nextX = bot.x;
          nextZ = bot.z + nz * step;
        } else {
          this._pickWaypoint(bot, (performance.now() * 0.02 + bot.id) | 0);
          this._syncParts(bot);
          continue;
        }
      }

      bot.x = nextX;
      bot.z = nextZ;
      bot.y = this.terrain.heightAt(bot.x, bot.z);
      bot.yaw = Math.atan2(nx, nz);

      bot.mesh.position.set(bot.x, bot.y, bot.z);
      bot.mesh.rotation.y = bot.yaw;
      this._walkAnim(bot, dt, dist);
      this._syncParts(bot);
    }
  }

  _walkAnim(bot, dt, distToWp) {
    const t = performance.now() * 0.001;
    const phase = t * bot.speed * 2.4 + bot.id * 0.7;
    const swing = Math.sin(phase) * 0.55;
    const { lLeg, rLeg, lArm, rArm } = bot.mesh.userData;
    // Hip-rooted leg swing
    if (lLeg) lLeg.rotation.x = swing;
    if (rLeg) rLeg.rotation.x = -swing;
    // Opposite arm swing (natural gait)
    if (lArm) {
      lArm.rotation.x = 0.12 - swing * 0.55;
      lArm.rotation.z = -0.08;
    }
    if (rArm) {
      rArm.rotation.x = 0.12 + swing * 0.55;
      rArm.rotation.z = 0.08;
    }
    // Subtle torso bob + yaw sway
    bot.mesh.position.y = bot.y + Math.abs(Math.sin(phase)) * 0.025;
    bot.mesh.rotation.y = bot.yaw + Math.sin(phase * 0.5) * 0.03;
  }

  _idleAnim(bot, dt) {
    const { lLeg, rLeg, lArm, rArm } = bot.mesh.userData;
    const damp = Math.exp(-8 * dt);
    if (lLeg) lLeg.rotation.x *= damp;
    if (rLeg) rLeg.rotation.x *= damp;
    if (lArm) {
      lArm.rotation.x = THREE.MathUtils.lerp(lArm.rotation.x, 0.15, 1 - damp);
      lArm.rotation.z = THREE.MathUtils.lerp(lArm.rotation.z, -0.08, 1 - damp);
    }
    if (rArm) {
      rArm.rotation.x = THREE.MathUtils.lerp(rArm.rotation.x, 0.15, 1 - damp);
      rArm.rotation.z = THREE.MathUtils.lerp(rArm.rotation.z, 0.08, 1 - damp);
    }
    bot.mesh.position.set(bot.x, bot.y, bot.z);
    bot.mesh.rotation.y = bot.yaw;
    // Idle breathe
    const t = performance.now() * 0.001;
    bot.mesh.position.y = bot.y + Math.sin(t * 1.8 + bot.id) * 0.008;
  }

  _respawn(bot) {
    // New point near home
    for (let i = 0; i < 16; i++) {
      const ang = hash2(bot.id + i, 71) * Math.PI * 2;
      const dist = 5 + hash2(bot.id + i, 73) * 25;
      const x = bot.homeX + Math.cos(ang) * dist;
      const z = bot.homeZ + Math.sin(ang) * dist;
      if (this._isWalkable(x, z)) {
        bot.x = x;
        bot.z = z;
        bot.y = this.terrain.heightAt(x, z);
        bot.health = bot.maxHealth;
        bot.dead = false;
        bot.respawnT = 0;
        bot.mesh.visible = true;
        bot.mesh.position.set(bot.x, bot.y, bot.z);
        this._pickWaypoint(bot, i + 99);
        this._syncParts(bot);
        // reset materials
        bot.mesh.traverse((o) => {
          if (o.isMesh && o.material && o.material.emissive) {
            o.material.emissive.setHex(0x000000);
            o.material.emissiveIntensity = 0;
          }
        });
        return;
      }
    }
    // Force at home
    bot.x = bot.homeX;
    bot.z = bot.homeZ;
    bot.y = this.terrain.heightAt(bot.x, bot.z);
    bot.health = bot.maxHealth;
    bot.dead = false;
    bot.mesh.visible = true;
    bot.mesh.position.set(bot.x, bot.y, bot.z);
    this._syncParts(bot);
  }

  /** Targets for hitscan (live only). */
  getLiveTargets() {
    this._live.length = 0;
    for (const b of this.bots) {
      if (!b.dead) this._live.push(b);
    }
    return this._live;
  }
}
