import * as THREE from 'three';
import { COMBAT } from '../config.js';
import { rayAABB, falloffMult, partMult } from './Hitscan.js';
import { breakGlassBox } from '../world/Glass.js';

/**
 * Ballistic projectiles: velocity, gravity drop, travel time (lead),
 * and range/caliber damage falloff. Targets preferred near walls.
 */

const _tmp = new THREE.Vector3();
const _cand = [];
// Game-readable drop (real 9.81 is almost invisible at 800+ m/s)
const GRAVITY = 18.5;

export class Ballistics {
  constructor(hash, effects, bus) {
    this.hash = hash;
    this.effects = effects;
    this.bus = bus;
    this.projectiles = [];
  }

  /**
   * Spawn one bullet/pellet.
   * @param {object} opts
   */
  fire({
    origin, dir, speed, damage, def, rar, targetRange, maxDist = 450,
  }) {
    const v = dir.clone().normalize().multiplyScalar(speed);
    const longRange = def.class === 'sniper' || def.class === 'dmr';
    const mesh = this.effects?.createBulletMesh?.(longRange) || null;
    if (mesh) mesh.position.copy(origin);
    this.projectiles.push({
      pos: origin.clone(),
      vel: v,
      prev: origin.clone(),
      age: 0,
      pathDist: 0,
      maxLife: maxDist / Math.max(80, speed) + 0.85,
      damage,
      def,
      rar,
      targetRange,
      speed,
      longRange,
      mesh,
      trailAcc: 0,
      // Range accuracy: past effectiveRange, direction walks off-target
      effectiveRange: def.effectiveRange ?? 80,
      rangeScatterDeg: def.rangeScatterDeg ?? 0,
    });
  }

  _killProjectile(i) {
    const p = this.projectiles[i];
    if (p?.mesh) this.effects?.releaseBulletMesh?.(p.mesh);
    this.projectiles.splice(i, 1);
  }

  /**
   * Advance all bullets. `targets` must be current live list.
   */
  update(dt, targets) {
    if (dt <= 0) return;
    // Larger steps for long-range readability; still sub-stepped for collision
    const maxStep = 1.2;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      if (p.age > p.maxLife) {
        this._killProjectile(i);
        continue;
      }

      // Gravity (bullet drop) — stronger so sniper arcs are visible
      p.vel.y -= GRAVITY * (p.def.dropScale ?? 1) * dt;

      let remaining = dt;
      let hitSomething = false;
      const frameStart = p.pos.clone();
      while (remaining > 1e-5 && !hitSomething) {
        const speed = p.vel.length();
        if (speed < 1) {
          this._killProjectile(i);
          hitSomething = true;
          break;
        }
        const distThis = speed * remaining;
        const stepDist = Math.min(maxStep, distThis);
        const stepT = stepDist / speed;
        const dir = _tmp.copy(p.vel).multiplyScalar(1 / speed);

        // Past effective range, SMGs etc. walk off even if ADS was on target
        if (p.rangeScatterDeg > 0 && p.pathDist > p.effectiveRange) {
          const over = p.pathDist - p.effectiveRange;
          const deg = (p.rangeScatterDeg / 100) * stepDist * (0.4 + Math.random() * 0.9);
          const rad = deg * (Math.PI / 180) * Math.min(3, 1 + over / 40);
          const yaw = (Math.random() - 0.5) * 2 * rad;
          const pitch = (Math.random() - 0.5) * 2 * rad;
          const sp = p.vel.length();
          // yaw around world up, pitch around right
          const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
          if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
          else right.normalize();
          p.vel.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
          p.vel.applyAxisAngle(right, pitch);
          p.vel.setLength(sp);
          dir.copy(p.vel).multiplyScalar(1 / sp);
        }

        p.prev.copy(p.pos);
        const next = p.pos.clone().addScaledVector(dir, stepDist);

        const hit = this._segmentHit(p.prev, next, dir, stepDist, targets);
        if (hit) {
          p.pathDist += hit.t;
          this._resolveHit(p, hit);
          this._killProjectile(i);
          hitSomething = true;
          break;
        }

        p.pathDist += stepDist;
        p.pos.copy(next);
        remaining -= stepT;
      }

      if (!hitSomething) {
        // Long glowing trail segments so you can see the arc
        this.effects?.spawnBallisticTrace?.(frameStart, p.pos, {
          bright: p.longRange,
          life: p.longRange ? 0.35 : 0.12,
        });
        if (p.mesh) {
          p.mesh.position.copy(p.pos);
          // Stretch slightly along velocity for a “streak” read
          const sp = p.vel.length();
          if (sp > 1) {
            p.mesh.lookAt(p.pos.clone().add(p.vel));
            p.mesh.scale.set(
              p.longRange ? 1.2 : 0.8,
              p.longRange ? 1.2 : 0.8,
              p.longRange ? 2.8 : 1.6
            );
          }
        }
      }
    }
  }

  _segmentHit(from, to, dir, maxT, targets) {
    const worldHits = [];
    const targetHits = [];

    const minX = Math.min(from.x, to.x) - 0.5;
    const maxX = Math.max(from.x, to.x) + 0.5;
    const minZ = Math.min(from.z, to.z) - 0.5;
    const maxZ = Math.max(from.z, to.z) + 0.5;
    this.hash.query(minX, minZ, maxX, maxZ, _cand);

    for (let i = 0; i < _cand.length; i++) {
      const box = _cand[i];
      if (box.disabled) continue;
      const tag = box.tag || 'solid';
      if (tag === 'trigger' || tag === 'door' || tag === 'ladder') continue;
      const t = rayAABB(from, dir, box.min, box.max, maxT + 0.08);
      if (t == null || t > maxT + 0.04) continue;
      worldHits.push({ t, kind: 'world', box, tag });
    }

    for (const tgt of targets) {
      if (!tgt || tgt.dead || !tgt.parts) continue;
      for (const part of tgt.parts) {
        const t = rayAABB(from, dir, part.min, part.max, maxT + 0.08);
        if (t == null || t > maxT + 0.04) continue;
        targetHits.push({ t, kind: 'target', target: tgt, part: part.name });
      }
    }

    worldHits.sort((a, b) => a.t - b.t);
    targetHits.sort((a, b) => a.t - b.t);

    // Resolve targets first: only blocked by walls clearly in front that don't hug the bot
    for (const th of targetHits) {
      let blocked = false;
      for (const wh of worldHits) {
        if (wh.t >= th.t - 0.02) break;
        if (wh.tag === 'thin') continue;
        // Glass shatters on the way through — bullet continues into the target
        if (wh.tag === 'glass') {
          if (!wh.box.disabled) {
            const pt = from.clone().addScaledVector(dir, wh.t);
            breakGlassBox(wh.box, this.effects, pt);
          }
          continue;
        }
        if (this._isFloorish(wh.box) && Math.abs(dir.y) < 0.4) continue;
        // Wall the bot is standing against / inside — never blocks that bot
        if (this._wallOverlapsTarget(wh.box, th.target)) continue;
        // Wall is truly in front of the bot along the ray
        if (th.t - wh.t > 0.12) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return th;
    }

    // No target: first real solid; glass shatters and the bullet continues
    for (const wh of worldHits) {
      if (wh.tag === 'thin') continue;
      if (wh.tag === 'glass') {
        const pt = from.clone().addScaledVector(dir, wh.t);
        breakGlassBox(wh.box, this.effects, pt);
        continue; // penetrate after break
      }
      if (this._isFloorish(wh.box) && Math.abs(dir.y) < 0.35) continue;
      return wh;
    }
    return null;
  }

  _isFloorish(box) {
    return (box.max.y - box.min.y) < 0.45
      && (box.max.x - box.min.x) > 1.2
      && (box.max.z - box.min.z) > 1.2;
  }

  _wallOverlapsTarget(box, tgt) {
    if (!box || !tgt) return false;
    // Fat pad: bots standing against exterior walls often sit inside wall AABB slightly
    const pad = 1.15;
    const feet = tgt.y ?? 0;
    // Test feet, torso, head
    const pts = [
      [tgt.x, feet + 0.3, tgt.z],
      [tgt.x, feet + 1.1, tgt.z],
      [tgt.x, feet + 1.65, tgt.z],
    ];
    for (const [px, py, pz] of pts) {
      if (
        px >= box.min.x - pad && px <= box.max.x + pad
        && py >= box.min.y - pad && py <= box.max.y + pad
        && pz >= box.min.z - pad && pz <= box.max.z + pad
      ) return true;
    }
    // Also: horizontal proximity — wall within 1.2 m of bot on XZ
    const cx = (box.min.x + box.max.x) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    const hx = Math.max(box.min.x - tgt.x, 0, tgt.x - box.max.x);
    const hz = Math.max(box.min.z - tgt.z, 0, tgt.z - box.max.z);
    const distXZ = Math.hypot(hx, hz);
    if (distXZ < 1.1 && feet + 1.2 >= box.min.y - 0.5 && feet <= box.max.y + 0.5) {
      return true;
    }
    return false;
  }

  _resolveHit(p, hit) {
    const point = p.prev.clone().addScaledVector(
      p.vel.clone().normalize(),
      hit.t
    );
    const pathDist = p.pathDist;

    if (hit.kind === 'target') {
      let dmg = p.damage * (p.rar?.dmg ?? 1);
      dmg *= partMult(hit.part, p.def);
      dmg *= falloffMult(pathDist, p.def);
      let res = { killed: false, applied: dmg };
      if (typeof hit.target.applyDamage === 'function') {
        res = hit.target.applyDamage(dmg, hit.part);
      } else if (p.targetRange) {
        res = p.targetRange.applyDamage(hit.target, dmg, hit.part);
      } else if (hit.target.health != null) {
        hit.target.health -= dmg;
        if (hit.target.health <= 0) {
          hit.target.health = 0;
          hit.target.dead = true;
          res.killed = true;
        }
      }
      this.effects?.showHitmarker?.(hit.part === 'head');
      this.effects?.spawnDamageNumber?.(point, dmg, hit.part === 'head');
      this.effects?.spawnImpact?.(point, 'target');
      this.bus?.emit?.('combat:hit', {
        damage: dmg, part: hit.part, dist: pathDist, killed: res.killed,
      });
    } else {
      this.effects?.spawnImpact?.(point, hit.tag || 'solid');
    }
  }
}
