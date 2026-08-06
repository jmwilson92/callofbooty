import * as THREE from 'three';
import { COMBAT } from '../config.js';
import { rayAABB, falloffMult, partMult } from './Hitscan.js';

/**
 * Ballistic projectiles: velocity, gravity drop, travel time (lead),
 * and range/caliber damage falloff. Targets preferred near walls.
 */

const _tmp = new THREE.Vector3();
const _cand = [];
const GRAVITY = 9.81; // m/s² downward (game-scale; sniper needs visible drop)

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
    this.projectiles.push({
      pos: origin.clone(),
      vel: v,
      prev: origin.clone(),
      age: 0,
      pathDist: 0,
      maxLife: maxDist / Math.max(80, speed) + 0.5,
      damage,
      def,
      rar,
      targetRange,
      speed,
    });
  }

  /**
   * Advance all bullets. `targets` must be current live list.
   * Bots should have .parts, .dead, optional .vx/.vz for debug.
   */
  update(dt, targets) {
    if (dt <= 0) return;
    // Cap step so fast bullets don't tunnel through thin walls
    const maxStep = 0.35; // metres per substep
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      if (p.age > p.maxLife) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Gravity (bullet drop)
      p.vel.y -= GRAVITY * (p.def.dropScale ?? 1) * dt;

      let remaining = dt;
      let hitSomething = false;
      while (remaining > 1e-5 && !hitSomething) {
        const speed = p.vel.length();
        if (speed < 1) {
          this.projectiles.splice(i, 1);
          hitSomething = true;
          break;
        }
        const distThis = speed * remaining;
        const stepDist = Math.min(maxStep, distThis);
        const stepT = stepDist / speed;
        const dir = _tmp.copy(p.vel).multiplyScalar(1 / speed);

        p.prev.copy(p.pos);
        const next = p.pos.clone().addScaledVector(dir, stepDist);

        const hit = this._segmentHit(p.prev, next, dir, stepDist, targets);
        if (hit) {
          p.pathDist += hit.t;
          this._resolveHit(p, hit);
          this.projectiles.splice(i, 1);
          hitSomething = true;
          break;
        }

        p.pathDist += stepDist;
        p.pos.copy(next);
        remaining -= stepT;
      }

      if (!hitSomething) {
        this.effects?.spawnBallisticTrace?.(p.prev, p.pos);
      }
    }
  }

  _segmentHit(from, to, dir, maxT, targets) {
    const hits = [];

    // World boxes along segment AABB
    const minX = Math.min(from.x, to.x) - 0.4;
    const maxX = Math.max(from.x, to.x) + 0.4;
    const minZ = Math.min(from.z, to.z) - 0.4;
    const maxZ = Math.max(from.z, to.z) + 0.4;
    this.hash.query(minX, minZ, maxX, maxZ, _cand);

    for (let i = 0; i < _cand.length; i++) {
      const box = _cand[i];
      if (box.disabled) continue;
      const tag = box.tag || 'solid';
      if (tag === 'trigger' || tag === 'door' || tag === 'ladder') continue;
      const t = rayAABB(from, dir, box.min, box.max, maxT + 0.05);
      if (t == null || t > maxT + 0.02) continue;
      hits.push({ t, kind: 'world', box, tag });
    }

    for (const tgt of targets) {
      if (!tgt || tgt.dead || !tgt.parts) continue;
      for (const part of tgt.parts) {
        const t = rayAABB(from, dir, part.min, part.max, maxT + 0.05);
        if (t == null || t > maxT + 0.02) continue;
        hits.push({ t, kind: 'target', target: tgt, part: part.name });
      }
    }

    if (!hits.length) return null;
    hits.sort((a, b) => a.t - b.t);

    const TARGET_BIAS = 0.55; // generous when bots hug walls
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i];
      if (h.kind === 'target') return h;

      // Prefer any target slightly behind this surface
      for (let j = i + 1; j < hits.length; j++) {
        const n = hits[j];
        if (n.t > h.t + TARGET_BIAS) break;
        if (n.kind === 'target') {
          // Skip wall if it overlaps the bot (bot standing in/against geometry)
          if (this._wallOverlapsTarget(h.box, n.target)) return n;
          // Or if wall is paper-thin in ray direction and target is close
          if (n.t - h.t < 0.45) return n;
        }
      }

      const tag = h.tag || 'solid';
      if (tag === 'thin') continue; // pass through thin

      // Floor slabs rarely block chest-height horizontal fire
      const box = h.box;
      const isFloorish = (box.max.y - box.min.y) < 0.4
        && (box.max.x - box.min.x) > 1.2
        && (box.max.z - box.min.z) > 1.2;
      if (isFloorish && Math.abs(dir.y) < 0.35) {
        let hasTgt = false;
        for (let j = i + 1; j < hits.length; j++) {
          if (hits[j].kind === 'target' && hits[j].t < h.t + 3) {
            hasTgt = true;
            break;
          }
        }
        if (hasTgt) continue;
      }

      // If ANY target center is nearly inside this solid box, ignore box for blocking
      let block = true;
      for (const tgt of targets) {
        if (!tgt || tgt.dead) continue;
        if (this._wallOverlapsTarget(box, tgt)) {
          // Only ignore if there's a target hit on this ray
          for (let j = i + 1; j < hits.length; j++) {
            if (hits[j].kind === 'target' && hits[j].target === tgt) {
              block = false;
              break;
            }
          }
        }
        if (!block) break;
      }
      if (!block) continue;

      return h;
    }
    return null;
  }

  _wallOverlapsTarget(box, tgt) {
    if (!box || !tgt) return false;
    const px = tgt.x;
    const py = (tgt.y ?? 0) + 1.1;
    const pz = tgt.z;
    const pad = 0.55;
    return (
      px >= box.min.x - pad && px <= box.max.x + pad
      && py >= box.min.y - pad && py <= box.max.y + pad
      && pz >= box.min.z - pad && pz <= box.max.z + pad
    );
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
