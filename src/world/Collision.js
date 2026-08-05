import * as THREE from 'three';
import { COLLISION } from '../config.js';

// Uniform spatial hash over static AABBs. Character collision is a custom
// kinematic solve -- no rigid body physics anywhere near player movement.
export class SpatialHash {
  constructor(cellSize = COLLISION.CELL_SIZE) {
    this.cellSize = cellSize;
    this.map = new Map();
    this.boxes = [];
  }

  _key(cx, cz) {
    // Cantor-ish pack; cell indices stay well inside 32-bit for a 2km map.
    return cx * 73856093 ^ cz * 19349663;
  }

  add(min, max, tag = 'solid', userData = null) {
    const box = { min, max, tag, userData, id: this.boxes.length };
    this.boxes.push(box);

    const x0 = Math.floor(min.x / this.cellSize);
    const x1 = Math.floor(max.x / this.cellSize);
    const z0 = Math.floor(min.z / this.cellSize);
    const z1 = Math.floor(max.z / this.cellSize);

    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        const k = this._key(cx, cz);
        let bucket = this.map.get(k);
        if (!bucket) {
          bucket = [];
          this.map.set(k, bucket);
        }
        bucket.push(box);
      }
    }
    return box;
  }

  addBox3(box3, tag = 'solid', userData = null) {
    return this.add(box3.min.clone(), box3.max.clone(), tag, userData);
  }

  // Fills `out` with unique candidate boxes overlapping the query AABB.
  query(minX, minZ, maxX, maxZ, out) {
    out.length = 0;
    const x0 = Math.floor(minX / this.cellSize);
    const x1 = Math.floor(maxX / this.cellSize);
    const z0 = Math.floor(minZ / this.cellSize);
    const z1 = Math.floor(maxZ / this.cellSize);

    this._stamp = (this._stamp || 0) + 1;
    const stamp = this._stamp;

    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        const bucket = this.map.get(this._key(cx, cz));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const b = bucket[i];
          if (b._stamp === stamp) continue;
          b._stamp = stamp;
          out.push(b);
        }
      }
    }
    return out;
  }

  get count() {
    return this.boxes.length;
  }
}

// Closest points between a vertical segment (x, y0..y1, z) and an AABB.
// Exact for the axis-aligned case, which is all a character capsule needs.
function closestVerticalSegmentToAABB(x, y0, y1, z, box, outSeg, outBox) {
  const bx = Math.min(Math.max(x, box.min.x), box.max.x);
  const bz = Math.min(Math.max(z, box.min.z), box.max.z);

  let sy, by;
  if (y1 < box.min.y) {
    sy = y1; by = box.min.y;
  } else if (y0 > box.max.y) {
    sy = y0; by = box.max.y;
  } else {
    const lo = Math.max(y0, box.min.y);
    const hi = Math.min(y1, box.max.y);
    sy = (lo + hi) * 0.5;
    by = sy;
  }

  outSeg.set(x, sy, z);
  outBox.set(bx, by, bz);
}

const _segP = new THREE.Vector3();
const _boxP = new THREE.Vector3();
const _delta = new THREE.Vector3();

/**
 * Push a vertical capsule out of every overlapping box.
 * `pos` is the capsule's FEET position and is mutated in place.
 * Returns { hitGround, groundY, groundNormalY, hitWall, wallNormal }.
 */
export function resolveCapsule(pos, radius, height, hash, candidates, result) {
  result.hitWall = false;
  result.hitGround = false;
  result.groundY = -Infinity;
  result.wallNormal.set(0, 0, 0);
  result.hitCeiling = false;

  for (let iter = 0; iter < COLLISION.SOLVER_ITERATIONS; iter++) {
    const y0 = pos.y + radius;
    const y1 = pos.y + height - radius;

    hash.query(
      pos.x - radius - 0.5, pos.z - radius - 0.5,
      pos.x + radius + 0.5, pos.z + radius + 0.5,
      candidates
    );

    let moved = false;
    for (let i = 0; i < candidates.length; i++) {
      const box = candidates[i];
      if (box.tag === 'trigger') continue;

      // Cheap reject on the vertical axis first.
      if (pos.y + height < box.min.y || pos.y > box.max.y) continue;

      closestVerticalSegmentToAABB(pos.x, y0, y1, pos.z, box, _segP, _boxP);
      _delta.subVectors(_segP, _boxP);
      let dist = _delta.length();

      if (dist >= radius) continue;

      if (dist < 1e-6) {
        // Capsule axis is inside the box -- eject along the shallowest axis.
        const dxMin = _segP.x - box.min.x;
        const dxMax = box.max.x - _segP.x;
        const dzMin = _segP.z - box.min.z;
        const dzMax = box.max.z - _segP.z;
        const dyMax = box.max.y - _segP.y;
        let best = dxMin, ax = 0, sign = -1;
        if (dxMax < best) { best = dxMax; ax = 0; sign = 1; }
        if (dzMin < best) { best = dzMin; ax = 2; sign = -1; }
        if (dzMax < best) { best = dzMax; ax = 2; sign = 1; }
        if (dyMax < best) { best = dyMax; ax = 1; sign = 1; }
        _delta.set(0, 0, 0);
        if (ax === 0) _delta.x = sign;
        else if (ax === 1) _delta.y = sign;
        else _delta.z = sign;
        dist = 0;
      } else {
        _delta.divideScalar(dist);
      }

      const push = radius - dist + COLLISION.SKIN;
      pos.addScaledVector(_delta, push);
      moved = true;

      if (_delta.y > 0.5) {
        // Standing on top of this box
        result.hitGround = true;
        if (box.max.y > result.groundY) result.groundY = box.max.y;
      } else if (_delta.y < -0.5) {
        result.hitCeiling = true;
      } else {
        result.hitWall = true;
        result.wallNormal.add(_delta);
      }
    }

    if (!moved) break;
  }

  if (result.wallNormal.lengthSq() > 1e-8) result.wallNormal.normalize();
  return result;
}

export function makeCollisionResult() {
  return {
    hitWall: false,
    hitGround: false,
    hitCeiling: false,
    groundY: -Infinity,
    groundNormalY: 1,
    wallNormal: new THREE.Vector3(),
  };
}

// Note: Phase 2 adds hitscan raycasting against this same hash. It is left out
// here deliberately rather than shipped untested -- nothing in Phase 1 fires a
// ray (the mantle probe uses column queries on the controller instead).
