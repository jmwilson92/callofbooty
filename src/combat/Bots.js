import * as THREE from 'three';
import { BOTS, WORLD, PLAYER } from '../config.js';
import { makeBotParts } from './Targets.js';
import { worldBuildings } from '../world/BuildingRegistry.js';
import { rayAABB } from './Hitscan.js';

/**
 * World bots — wander, approach buildings, some engage the player with gunfire.
 */

const _cand = [];
const _losDir = new THREE.Vector3();

function hash2(i, salt) {
  let n = (i * 374761393 + salt * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export class BotSystem {
  /**
   * @param {import('../loot/LootSystem.js').LootSystem|null} [loot]
   */
  constructor(scene, terrain, hash, bus, loot = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.hash = hash;
    this.bus = bus;
    this.loot = loot;
    this.group = new THREE.Group();
    this.group.name = 'bots';
    this.scene.add(this.group);
    this.bots = [];
    this._live = [];
  }

  setLoot(loot) {
    this.loot = loot;
  }

  /**
   * Spawn bots in squads of 4–5 around the map.
   * Teams share aggro and stick together.
   */
  spawn(count = BOTS.COUNT) {
    this.clear();
    const cx = PLAYER.SPAWN.x;
    const cz = PLAYER.SPAWN.z;
    const tMin = BOTS.TEAM_SIZE_MIN ?? 4;
    const tMax = BOTS.TEAM_SIZE_MAX ?? 5;
    const spacing = BOTS.TEAM_SPACING ?? 4.5;
    let placed = 0;
    let teamId = 0;
    let attempts = 0;

    while (placed < count && attempts < count * 50) {
      attempts++;
      const ang = hash2(attempts, 11) * Math.PI * 2;
      const dist = BOTS.SPAWN_MIN + hash2(attempts, 29) * (BOTS.SPAWN_MAX - BOTS.SPAWN_MIN);
      const hx = cx + Math.cos(ang) * dist;
      const hz = cz + Math.sin(ang) * dist;
      if (!this._isWalkable(hx, hz)) continue;

      const teamSize = tMin + Math.floor(hash2(teamId, 41) * (tMax - tMin + 1));
      const teamColor = (BOTS.TEAM_COLORS || BOTS.COLORS)[teamId % (BOTS.TEAM_COLORS || BOTS.COLORS).length];
      let members = 0;
      for (let m = 0; m < teamSize && placed < count; m++) {
        const a2 = hash2(placed + m, 53) * Math.PI * 2;
        const r2 = spacing * (0.3 + hash2(placed + m, 59) * 0.9);
        const x = hx + Math.cos(a2) * r2;
        const z = hz + Math.sin(a2) * r2;
        if (!this._isWalkable(x, z) && m > 0) continue;
        this._addBot(placed, this._isWalkable(x, z) ? x : hx, this._isWalkable(x, z) ? z : hz, {
          teamId,
          teamColor,
          isLeader: m === 0,
          homeX: hx,
          homeZ: hz,
        });
        placed++;
        members++;
      }
      if (members > 0) teamId++;
    }
    // Fallback ring
    while (placed < count) {
      const ang = (placed / count) * Math.PI * 2;
      const x = cx + Math.cos(ang) * 50;
      const z = cz + Math.sin(ang) * 50;
      this._addBot(placed, x, z, { teamId: teamId++, teamColor: BOTS.COLORS[0], isLeader: true });
      placed++;
    }
    this._teams = teamId;
    console.info(`[bots] ${this.bots.length} in ${teamId} squads (~${tMin}–${tMax})`);
    return this.bots.length;
  }

  clear() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.bots.length = 0;
  }

  _addBot(id, x, z, opts = {}) {
    const y = this.terrain.heightAt(x, z);
    const color = opts.teamColor ?? BOTS.COLORS[id % BOTS.COLORS.length];
    const local = this._buildLocalMesh(color);
    local.position.set(x, y, z);
    this.group.add(local);

    const aggressive = hash2(id, 19) < (BOTS.AGGRESSIVE_FRACTION ?? 0.5);
    const bot = {
      id,
      teamId: opts.teamId ?? 0,
      isLeader: !!opts.isLeader,
      x,
      y,
      z,
      yaw: hash2(id, 7) * Math.PI * 2,
      speed: BOTS.SPEED + (hash2(id, 3) - 0.5) * 2 * BOTS.SPEED_JITTER,
      vx: 0,
      vz: 0,
      health: BOTS.HEALTH,
      maxHealth: BOTS.HEALTH,
      armor: BOTS.ARMOR ?? 0,
      dead: false,
      respawnT: 0,
      waypoint: { x, z },
      pauseT: 0.2 + hash2(id, 5) * BOTS.WAYPOINT_PAUSE,
      homeX: opts.homeX ?? x,
      homeZ: opts.homeZ ?? z,
      parts: makeBotParts(x, y, z),
      mesh: local,
      color,
      applyDamage: null,
      aggressive,
      state: 'wander', // wander | engage | flank | cover
      aggroT: 0,
      fireCd: hash2(id, 23) * 0.4,
      aimYaw: 0,
      suppressT: 0,
      flankSide: hash2(id, 31) > 0.5 ? 1 : -1,
    };
    bot.applyDamage = (dmg, part) => this.applyDamage(bot, dmg, part);
    this._pickWaypoint(bot, id * 17 + 1);
    this.bots.push(bot);
    return bot;
  }

  /** Share aggro across squad when one member spots the player. */
  _alertTeam(teamId, exceptId = -1) {
    if (!BOTS.TEAM_SHARE_AGGRO) return;
    for (const b of this.bots) {
      if (b.dead || b.teamId !== teamId || b.id === exceptId) continue;
      if (b.state === 'wander') {
        b.state = 'engage';
        b.aggroT = BOTS.REACTION_TIME ?? 0.45;
        b.pauseT = 0;
      }
    }
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
      if (b.disabled || b.tag === 'trigger' || b.tag === 'door' || b.tag === 'thin' || b.tag === 'glass') continue;
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
    // Often path toward a building entrance / ground-floor interior
    const buildings = worldBuildings;
    if (
      buildings?.length
      && hash2(bot.id + salt, 77) < (BOTS.BUILDING_WAYPOINT_CHANCE ?? 0.4)
    ) {
      const b = buildings[Math.floor(hash2(bot.id + salt, 79) * buildings.length) % buildings.length];
      if (b && b.w > 5 && b.d > 5) {
        const interior = hash2(bot.id + salt, 81) > 0.45;
        let x;
        let z;
        if (interior) {
          // Inside footprint (ground floor approach)
          x = b.x + b.w * (0.25 + hash2(bot.id + salt, 83) * 0.5);
          z = b.z + b.d * (0.25 + hash2(bot.id + salt, 85) * 0.5);
        } else {
          // South entrance approach (most buildings open on −Z)
          x = b.x + b.w * 0.5 + (hash2(bot.id + salt, 87) - 0.5) * b.w * 0.3;
          z = b.z - 1.5 - hash2(bot.id + salt, 89) * 3;
        }
        if (this._isWalkable(x, z)) {
          bot.waypoint.x = x;
          bot.waypoint.z = z;
          return;
        }
      }
    }

    for (let i = 0; i < 14; i++) {
      const ang = hash2(bot.id + salt + i, 41) * Math.PI * 2;
      const dist = 5 + hash2(bot.id + salt + i, 43) * BOTS.WANDER_RADIUS;
      const x = bot.homeX + Math.cos(ang) * dist * (0.35 + hash2(bot.id + i, 47) * 0.65);
      const z = bot.homeZ + Math.sin(ang) * dist * (0.35 + hash2(bot.id + i, 53) * 0.65);
      if (this._isWalkable(x, z)) {
        bot.waypoint.x = x;
        bot.waypoint.z = z;
        return;
      }
    }
    bot.waypoint.x = bot.homeX + (hash2(bot.id + salt, 59) - 0.5) * 10;
    bot.waypoint.z = bot.homeZ + (hash2(bot.id + salt, 61) - 0.5) * 10;
  }

  /** True if a solid wall blocks eye→target (glass does not count as full block). */
  _hasLOS(fromX, fromY, fromZ, toX, toY, toZ) {
    _losDir.set(toX - fromX, toY - fromY, toZ - fromZ);
    const dist = _losDir.length();
    if (dist < 0.5) return true;
    _losDir.multiplyScalar(1 / dist);
    const minX = Math.min(fromX, toX) - 0.5;
    const maxX = Math.max(fromX, toX) + 0.5;
    const minZ = Math.min(fromZ, toZ) - 0.5;
    const maxZ = Math.max(fromZ, toZ) + 0.5;
    this.hash.query(minX, minZ, maxX, maxZ, _cand);
    const o = new THREE.Vector3(fromX, fromY, fromZ);
    for (let i = 0; i < _cand.length; i++) {
      const b = _cand[i];
      if (b.disabled) continue;
      const tag = b.tag || 'solid';
      if (tag === 'trigger' || tag === 'door' || tag === 'ladder' || tag === 'glass' || tag === 'thin' || tag === 'elevator') {
        continue;
      }
      // Skip floor slabs (horizontal)
      if ((b.max.y - b.min.y) < 0.4 && (b.max.x - b.min.x) > 1.5) continue;
      const t = rayAABB(o, _losDir, b.min, b.max, dist - 0.4);
      if (t != null && t > 0.3 && t < dist - 0.5) return false;
    }
    return true;
  }

  _syncParts(bot) {
    // Always sync from feet position (not bobbed mesh Y) for stable hit reg
    bot.parts = makeBotParts(bot.x, bot.y, bot.z);
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
      // Body stays ~2 minutes, then despawns / respawns elsewhere
      bot.respawnT = BOTS.CORPSE_TIME ?? BOTS.RESPAWN_TIME ?? 120;
      bot.corpse = true;
      bot.droppedLoot = false;
      // Keep mesh visible — flop onto side
      bot.mesh.visible = true;
      bot.mesh.position.set(bot.x, bot.y + 0.15, bot.z);
      bot.mesh.rotation.x = 0;
      bot.mesh.rotation.z = Math.PI / 2 * (bot.id % 2 === 0 ? 1 : -1);
      bot.mesh.rotation.y = bot.yaw;
      // Dim corpse
      bot.mesh.traverse((o) => {
        if (o.isMesh && o.material) {
          if (o.material.emissive) {
            o.material.emissive.setHex(0x000000);
            o.material.emissiveIntensity = 0;
          }
          if (o.material.color && o.material.color.multiplyScalar) {
            o.material.color.multiplyScalar(0.55);
          }
        }
      });
      // Drop loot around the body once
      if (this.loot?.spawnBotDrop) {
        this.loot.spawnBotDrop(bot.x, bot.z, bot.id * 9973 + 17);
        bot.droppedLoot = true;
      }
      this.bus?.emit?.('bot:killed', { id: bot.id, part, x: bot.x, z: bot.z });
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

  /**
   * @param {number} dt
   * @param {{x:number,y:number,z:number}|null} playerPos
   * @param {{ health:number, armor:number }|null} playerVitals  WeaponSystem vitals
   */
  update(dt, playerPos = null, playerVitals = null) {
    for (const bot of this.bots) {
      if (bot.dead) {
        // Corpse linger — fade slightly near the end
        bot.respawnT -= dt;
        if (bot.mesh?.visible) {
          bot.mesh.position.set(bot.x, bot.y + 0.15, bot.z);
          if (bot.respawnT < 8) {
            const a = Math.max(0.15, bot.respawnT / 8);
            bot.mesh.traverse((o) => {
              if (o.isMesh && o.material && o.material.opacity != null) {
                o.material.transparent = true;
                o.material.opacity = a;
              }
            });
          }
        }
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

      // --- Combat awareness ---
      if (bot.aggressive && playerPos && playerVitals && playerVitals.health > 0) {
        const pdx = playerPos.x - bot.x;
        const pdz = playerPos.z - bot.z;
        const pDist = Math.hypot(pdx, pdz);
        const eyeY = bot.y + 1.55;
        const pEyeY = playerPos.y + 1.5;

        if (bot.state === 'wander' && pDist < (BOTS.AGGRO_RANGE ?? 62)) {
          if (this._hasLOS(bot.x, eyeY, bot.z, playerPos.x, pEyeY, playerPos.z)) {
            bot.aggroT += dt;
            if (bot.aggroT >= (BOTS.REACTION_TIME ?? 0.45)) {
              bot.state = 'engage';
              bot.pauseT = 0;
              this._alertTeam(bot.teamId, bot.id);
            }
          } else {
            bot.aggroT = Math.max(0, bot.aggroT - dt * 0.5);
          }
        } else if (bot.state === 'engage' || bot.state === 'flank') {
          if (pDist > (BOTS.LOSE_RANGE ?? 90)) {
            bot.state = 'wander';
            bot.aggroT = 0;
            this._pickWaypoint(bot, (performance.now() * 0.01) | 0);
          } else {
            const hasLos = this._hasLOS(bot.x, eyeY, bot.z, playerPos.x, pEyeY, playerPos.z);
            bot.yaw = Math.atan2(pdx, pdz);
            bot.mesh.rotation.y = bot.yaw;

            // Tactics: flank / close / hold
            if (bot.suppressT > 0) bot.suppressT -= dt;
            const wantFlank = bot.state === 'flank'
              || (pDist > 14 && hash2(bot.id, (performance.now() * 0.05) | 0) < (BOTS.FLANK_CHANCE ?? 0.4));
            if (wantFlank && pDist > 12 && pDist < (BOTS.FIRE_RANGE ?? 48) + 10) {
              bot.state = 'flank';
              // Strafe perpendicular while edging closer
              const nx = pdx / Math.max(0.01, pDist);
              const nz = pdz / Math.max(0.01, pDist);
              const fx = -nz * bot.flankSide;
              const fz = nx * bot.flankSide;
              const step = bot.speed * 0.7 * dt;
              const close = pDist > 16 ? 0.35 : 0.1;
              const nx2 = bot.x + fx * step + nx * step * close;
              const nz2 = bot.z + fz * step + nz * step * close;
              if (this._isWalkable(nx2, nz2) && !this._blocked(nx2, this.terrain.heightAt(nx2, nz2), nz2)) {
                bot.x = nx2;
                bot.z = nz2;
                bot.y = this.terrain.heightAt(bot.x, bot.z);
              }
            } else if (pDist > 20 && pDist < (BOTS.FIRE_RANGE ?? 48) && hasLos) {
              // Slow advance
              const nx = pdx / pDist;
              const nz = pdz / pDist;
              const step = bot.speed * 0.45 * dt;
              const nx2 = bot.x + nx * step;
              const nz2 = bot.z + nz * step;
              if (this._isWalkable(nx2, nz2) && !this._blocked(nx2, this.terrain.heightAt(nx2, nz2), nz2)) {
                bot.x = nx2;
                bot.z = nz2;
                bot.y = this.terrain.heightAt(bot.x, bot.z);
              }
            }

            bot.fireCd -= dt;
            if (
              bot.suppressT <= 0
              && bot.fireCd <= 0
              && pDist < (BOTS.FIRE_RANGE ?? 48)
              && hasLos
            ) {
              this._botShoot(bot, playerPos, playerVitals, pDist);
              bot.fireCd = (BOTS.FIRE_COOLDOWN ?? 0.22)
                * (0.9 + hash2(bot.id, (performance.now() * 0.01) | 0) * 0.35);
              bot.suppressT = (BOTS.SUPPRESS_PAUSE ?? 0.55)
                * (0.7 + hash2(bot.id, 71) * 0.6);
            }
            bot.mesh.position.set(bot.x, bot.y, bot.z);
            this._idleAnim(bot, dt);
            const { lArm, rArm, gun } = bot.mesh.userData;
            if (lArm) { lArm.rotation.x = -0.9; lArm.rotation.z = -0.15; }
            if (rArm) { rArm.rotation.x = -0.95; rArm.rotation.z = 0.2; }
            if (gun) gun.rotation.set(-0.05, 0.1, 0.05);
            this._syncParts(bot);
            continue;
          }
        }
      }

      // Squad cohesion: non-leaders pull toward leader home / leader pos while wandering
      if (bot.state === 'wander' && !bot.isLeader) {
        const leader = this.bots.find((b) => b.teamId === bot.teamId && b.isLeader && !b.dead);
        if (leader) {
          const dx = leader.x - bot.x;
          const dz = leader.z - bot.z;
          const d = Math.hypot(dx, dz);
          if (d > 14) {
            bot.waypoint.x = leader.x + (hash2(bot.id, 3) - 0.5) * 6;
            bot.waypoint.z = leader.z + (hash2(bot.id, 5) - 0.5) * 6;
          }
        }
      }

      if (bot.pauseT > 0) {
        bot.pauseT -= dt;
        bot.vx = 0;
        bot.vz = 0;
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

      const nextY = this.terrain.heightAt(nextX, nextZ);
      if (!this._isWalkable(nextX, nextZ) || this._blocked(nextX, nextY, nextZ)) {
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

      bot.vx = nx * bot.speed;
      bot.vz = nz * bot.speed;
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

  _botShoot(bot, playerPos, vitals, dist) {
    // Cone miss chance — worse at range (they're accurate enough, not snipers)
    const spread = (BOTS.FIRE_SPREAD_DEG ?? 5.5) * (1 + dist / 38);
    const miss = Math.abs(hash2(bot.id, (performance.now() * 0.1) | 0) - 0.5) * 2 * spread;
    if (miss > 2.5) return; // wide miss

    let dmg = BOTS.FIRE_DAMAGE ?? 7;
    if (dist > 28) dmg *= Math.max(0.4, 1 - (dist - 28) / 45);
    let remaining = dmg;
    if (vitals.armor > 0) {
      const absorbed = Math.min(vitals.armor, remaining);
      vitals.armor -= absorbed;
      remaining -= absorbed;
    }
    vitals.health = Math.max(0, vitals.health - remaining);
    this.bus?.emit?.('bot:shot', { id: bot.id, dmg, dist });
    // Muzzle flash tint on gun
    const gun = bot.mesh.userData?.gun;
    if (gun) {
      gun.traverse((o) => {
        if (o.isMesh && o.material?.emissive) {
          o.material.emissive.setHex(0xffaa40);
          o.material.emissiveIntensity = 1.2;
        }
      });
      bot._muzzleT = 0.06;
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
    const resetPose = () => {
      bot.health = bot.maxHealth;
      bot.armor = BOTS.ARMOR ?? 0;
      bot.dead = false;
      bot.corpse = false;
      bot.droppedLoot = false;
      bot.respawnT = 0;
      bot.state = 'wander';
      bot.aggroT = 0;
      bot.mesh.visible = true;
      bot.mesh.rotation.set(0, bot.yaw, 0);
      bot.mesh.position.set(bot.x, bot.y, bot.z);
      bot.mesh.traverse((o) => {
        if (o.isMesh && o.material) {
          if (o.material.emissive) {
            o.material.emissive.setHex(0x000000);
            o.material.emissiveIntensity = 0;
          }
          if (o.material.opacity != null) {
            o.material.opacity = 1;
            o.material.transparent = false;
          }
          // Restore team color if we stored it
          if (o.material.color && bot.color != null && o.userData?.isBody) {
            o.material.color.setHex(bot.color);
          }
        }
      });
      // Rebuild mesh colors by recreating materials is hard; tint back up
      bot.mesh.traverse((o) => {
        if (o.isMesh && o.material?.color && !o.userData?.skipColorRestore) {
          // Slight brighten from corpse dim
          o.material.color.offsetHSL(0, 0, 0.08);
        }
      });
      this._syncParts(bot);
    };

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
        bot.yaw = hash2(bot.id + i, 7) * Math.PI * 2;
        resetPose();
        this._pickWaypoint(bot, i + 99);
        return;
      }
    }
    // Force at home
    bot.x = bot.homeX;
    bot.z = bot.homeZ;
    bot.y = this.terrain.heightAt(bot.x, bot.z);
    resetPose();
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
