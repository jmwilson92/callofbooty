// Simple axis-aligned occupancy so buildings/structures don't stack on each other.

export class Occupancy {
  constructor(cell = 10) {
    this.cell = cell;
    this.rects = [];
    this.buckets = new Map();
  }

  _key(cx, cz) {
    return `${cx},${cz}`;
  }

  _bucketRange(x0, z0, x1, z1) {
    const c = this.cell;
    return {
      ix0: Math.floor(x0 / c),
      iz0: Math.floor(z0 / c),
      ix1: Math.floor(x1 / c),
      iz1: Math.floor(z1 / c),
    };
  }

  /**
   * Try to claim [x, x+w] × [z, z+d] with optional margin.
   * Returns true if claimed, false if blocked.
   */
  claim(x, z, w, d, margin = 1.5) {
    const x0 = x - margin;
    const z0 = z - margin;
    const x1 = x + w + margin;
    const z1 = z + d + margin;
    if (this.blocked(x0, z0, x1, z1)) return false;
    this.rects.push({ x0, z0, x1, z1 });
    const { ix0, iz0, ix1, iz1 } = this._bucketRange(x0, z0, x1, z1);
    const idx = this.rects.length - 1;
    for (let iz = iz0; iz <= iz1; iz++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const k = this._key(ix, iz);
        let b = this.buckets.get(k);
        if (!b) {
          b = [];
          this.buckets.set(k, b);
        }
        b.push(idx);
      }
    }
    return true;
  }

  blocked(x0, z0, x1, z1) {
    const { ix0, iz0, ix1, iz1 } = this._bucketRange(x0, z0, x1, z1);
    const seen = new Set();
    for (let iz = iz0; iz <= iz1; iz++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const b = this.buckets.get(this._key(ix, iz));
        if (!b) continue;
        for (const idx of b) {
          if (seen.has(idx)) continue;
          seen.add(idx);
          const r = this.rects[idx];
          if (x0 < r.x1 && x1 > r.x0 && z0 < r.z1 && z1 > r.z0) return true;
        }
      }
    }
    return false;
  }

  /** Claim only if free; returns success. */
  tryClaim(x, z, w, d, margin = 1.5) {
    return this.claim(x, z, w, d, margin);
  }
}
