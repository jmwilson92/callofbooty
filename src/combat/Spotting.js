import { UAV } from '../config.js';
import { worldBuildings } from '../world/BuildingRegistry.js';
import { rayAABB } from './Hitscan.js';
import * as THREE from 'three';

const _dir = new THREE.Vector3();
const _cand = [];

/**
 * Aerial spotting: when in a heli (or with UAV kit), ping people
 * under the craft that have clear LOS (not indoors / not blocked).
 */
export class SpottingSystem {
  constructor(hash) {
    this.hash = hash;
    /** @type {Array<{x:number,z:number,life:number,max:number,id:string}>} */
    this.pings = [];
    this._acc = 0;
  }

  /**
   * @param {number} dt
   * @param {{ x:number,y:number,z:number }|null} aerialPos  heli / UAV position
   * @param {Array<{id?:number,x:number,y:number,z:number,dead?:boolean}>} people
   * @param {boolean} enabled
   * @param {{ radius?: number, depth?: number }|null} [opts]  override spot cone (UAV kit)
   */
  update(dt, aerialPos, people, enabled, opts = null) {
    // Age existing pings
    for (let i = this.pings.length - 1; i >= 0; i--) {
      this.pings[i].life -= dt;
      if (this.pings[i].life <= 0) this.pings.splice(i, 1);
    }
    if (!enabled || !aerialPos) return;

    this._acc += dt;
    const interval = UAV.pingInterval ?? 0.35;
    if (this._acc < interval) return;
    this._acc = 0;

    const R = opts?.radius ?? UAV.spotRadius ?? 55;
    const depth = opts?.depth ?? UAV.spotDepth ?? 120;
    const ttl = UAV.pingTtl ?? 2.8;
    const ax = aerialPos.x;
    const ay = aerialPos.y;
    const az = aerialPos.z;

    for (const p of people) {
      if (!p || p.dead) continue;
      const dx = p.x - ax;
      const dz = p.z - az;
      const horiz = Math.hypot(dx, dz);
      if (horiz > R) continue;
      // Must be below the craft
      if (p.y > ay - 2) continue;
      if (ay - p.y > depth) continue;
      // Inside a building footprint with roof above them → no ping
      if (this._isIndoors(p.x, p.y, p.z)) continue;
      // LOS from aerial eye down to person
      if (!this._hasLos(ax, ay - 0.5, az, p.x, p.y + 1.4, p.z)) continue;

      const id = String(p.id ?? `${p.x | 0}_${p.z | 0}`);
      const existing = this.pings.find((q) => q.id === id);
      if (existing) {
        existing.life = ttl;
        existing.x = p.x;
        existing.z = p.z;
      } else {
        this.pings.push({ id, x: p.x, z: p.z, life: ttl, max: ttl });
      }
    }
  }

  _isIndoors(x, y, z) {
    for (const b of worldBuildings || []) {
      if (x < b.x || x > b.x + b.w || z < b.z || z > b.z + b.d) continue;
      const bot = b.baseY ?? 0;
      const top = b.roofY ?? (bot + (b.floors || 1) * 3.5);
      // Body under roof slab → indoors
      if (y >= bot - 0.5 && y < top - 0.4) return true;
    }
    return false;
  }

  _hasLos(x0, y0, z0, x1, y1, z1) {
    if (!this.hash) return true;
    _dir.set(x1 - x0, y1 - y0, z1 - z0);
    const len = _dir.length();
    if (len < 0.5) return true;
    _dir.multiplyScalar(1 / len);
    const origin = new THREE.Vector3(x0, y0, z0);
    this.hash.query(
      Math.min(x0, x1) - 0.5, Math.min(z0, z1) - 0.5,
      Math.max(x0, x1) + 0.5, Math.max(z0, z1) + 0.5,
      _cand
    );
    for (const box of _cand) {
      if (box.disabled) continue;
      const tag = box.tag || 'solid';
      if (tag === 'trigger' || tag === 'door' || tag === 'ladder' || tag === 'glass' || tag === 'thin' || tag === 'elevator') {
        continue;
      }
      // Skip thin floor slabs so looking down through open air works
      if ((box.max.y - box.min.y) < 0.45 && (box.max.x - box.min.x) > 2) continue;
      const t = rayAABB(origin, _dir, box.min, box.max, len - 0.6);
      if (t != null && t > 0.4 && t < len - 0.5) return false;
    }
    return true;
  }
}
