import * as THREE from 'three';
import { COMBAT } from '../config.js';

// Ray–AABB hitscan against world geometry + target hitboxes.

const _inv = new THREE.Vector3();
const _tmin = new THREE.Vector3();
const _tmax = new THREE.Vector3();

/** Slab method ray vs AABB. Returns tEnter or null. */
export function rayAABB(origin, dir, boxMin, boxMax, tMax = 1e6) {
  _inv.set(
    dir.x !== 0 ? 1 / dir.x : 1e12,
    dir.y !== 0 ? 1 / dir.y : 1e12,
    dir.z !== 0 ? 1 / dir.z : 1e12
  );
  let t0 = 0;
  let t1 = tMax;
  for (let a = 0; a < 3; a++) {
    const o = a === 0 ? origin.x : a === 1 ? origin.y : origin.z;
    const inv = a === 0 ? _inv.x : a === 1 ? _inv.y : _inv.z;
    const bmin = a === 0 ? boxMin.x : a === 1 ? boxMin.y : boxMin.z;
    const bmax = a === 0 ? boxMax.x : a === 1 ? boxMax.y : boxMax.z;
    let tNear = (bmin - o) * inv;
    let tFar = (bmax - o) * inv;
    if (tNear > tFar) { const tmp = tNear; tNear = tFar; tFar = tmp; }
    if (tNear > t0) t0 = tNear;
    if (tFar < t1) t1 = tFar;
    if (t0 > t1 || t1 < 0) return null;
  }
  return t0 >= 0 ? t0 : (t1 >= 0 ? 0 : null);
}

/**
 * Cast a hitscan ray from camera origin along dir.
 * @returns {{
 *   hit: boolean, point: THREE.Vector3, dist: number,
 *   part: string|null, target: object|null, tag: string|null,
 *   surfaces: number, damageMult: number
 * }}
 */
export function castHitscan(origin, dir, hash, targets, maxDist = 400) {
  const result = {
    hit: false,
    point: new THREE.Vector3(),
    dist: maxDist,
    part: null,
    target: null,
    tag: null,
    surfaces: 0,
    damageMult: 1,
  };

  // Collect world candidates along a coarse AABB of the ray segment
  const end = origin.clone().addScaledVector(dir, maxDist);
  const minX = Math.min(origin.x, end.x) - 1;
  const maxX = Math.max(origin.x, end.x) + 1;
  const minZ = Math.min(origin.z, end.z) - 1;
  const maxZ = Math.max(origin.z, end.z) + 1;
  const candidates = [];
  hash.query(minX, minZ, maxX, maxZ, candidates);

  // Sort hits by distance; handle thin penetration
  const worldHits = [];
  for (const box of candidates) {
    if (box.disabled) continue;
    if (box.tag === 'trigger' || box.tag === 'door') continue;
    // Skip thin vertical span for Y filter loosely
    const t = rayAABB(origin, dir, box.min, box.max, maxDist);
    if (t == null) continue;
    worldHits.push({ t, box, kind: 'world' });
  }

  // Target hitboxes
  for (const tgt of targets) {
    if (tgt.dead) continue;
    for (const part of tgt.parts) {
      const t = rayAABB(origin, dir, part.min, part.max, maxDist);
      if (t == null) continue;
      worldHits.push({ t, part: part.name, target: tgt, kind: 'target' });
    }
  }

  worldHits.sort((a, b) => a.t - b.t);

  let thinCount = 0;
  let dmgMult = 1;
  for (const h of worldHits) {
    if (h.kind === 'target') {
      result.hit = true;
      result.dist = h.t;
      result.point.copy(origin).addScaledVector(dir, h.t);
      result.part = h.part;
      result.target = h.target;
      result.tag = 'target';
      result.surfaces = thinCount;
      result.damageMult = dmgMult;
      return result;
    }
    // world surface
    const tag = h.box.tag || 'solid';
    if (tag === 'thin') {
      thinCount++;
      dmgMult *= (1 - COMBAT.PENETRATION_LOSS);
      if (thinCount > COMBAT.PENETRATION_MAX) {
        result.hit = true;
        result.dist = h.t;
        result.point.copy(origin).addScaledVector(dir, h.t);
        result.tag = tag;
        result.surfaces = thinCount;
        result.damageMult = 0;
        return result;
      }
      continue; // pass through
    }
    // solid stop
    result.hit = true;
    result.dist = h.t;
    result.point.copy(origin).addScaledVector(dir, h.t);
    result.tag = tag;
    result.surfaces = thinCount;
    result.damageMult = dmgMult;
    return result;
  }

  result.point.copy(end);
  return result;
}

/** Damage mult by range using linear falloff. */
export function falloffMult(dist, wpn) {
  if (dist <= wpn.falloffStart) return 1;
  if (dist >= wpn.falloffEnd) return wpn.falloffMinMult;
  const t = (dist - wpn.falloffStart) / Math.max(1e-4, wpn.falloffEnd - wpn.falloffStart);
  return 1 + (wpn.falloffMinMult - 1) * t;
}

/** Body-part multiplier. */
export function partMult(part, wpn) {
  if (part === 'head') return wpn.headMult;
  if (part === 'arm' || part === 'leg') return wpn.limbMult;
  return 1; // chest / abdomen
}
