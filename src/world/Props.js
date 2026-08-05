import { PROPS, POIS, WORLD } from '../config.js';
import { lerp } from '../core/Noise.js';

// Cover props scattered by dart-throwing with a spatial grid enforcing the
// minimum spacing (Poisson-disc). Props are axis-aligned boxes so their
// collision AABB is exactly the shape you see -- no standing on invisible
// corners.

const TYPE_KEYS = Object.keys(PROPS.TYPES);

class SpacingGrid {
  constructor(size, cell) {
    this.cell = cell;
    this.dim = Math.ceil(size / cell);
    this.half = size / 2;
    this.buckets = new Map();
  }

  _key(cx, cz) {
    return cx * 73856093 ^ cz * 19349663;
  }

  tooClose(x, z, minDist) {
    const cx = Math.floor((x + this.half) / this.cell);
    const cz = Math.floor((z + this.half) / this.cell);
    const d2 = minDist * minDist;
    for (let iz = cz - 1; iz <= cz + 1; iz++) {
      for (let ix = cx - 1; ix <= cx + 1; ix++) {
        const b = this.buckets.get(this._key(ix, iz));
        if (!b) continue;
        for (let i = 0; i < b.length; i += 2) {
          const dx = b[i] - x;
          const dz = b[i + 1] - z;
          if (dx * dx + dz * dz < d2) return true;
        }
      }
    }
    return false;
  }

  insert(x, z) {
    const cx = Math.floor((x + this.half) / this.cell);
    const cz = Math.floor((z + this.half) / this.cell);
    const k = this._key(cx, cz);
    let b = this.buckets.get(k);
    if (!b) {
      b = [];
      this.buckets.set(k, b);
    }
    b.push(x, z);
  }
}

export function scatterProps(sink, terrain, rng) {
  const grid = new SpacingGrid(WORLD.SIZE, PROPS.MIN_SPACING);
  const half = WORLD.SIZE / 2 - 40;
  let placed = 0;
  let attempts = 0;
  const maxAttempts = PROPS.COUNT * 220;

  while (placed < PROPS.COUNT && attempts < maxAttempts) {
    attempts++;
    const x = (rng() * 2 - 1) * half;
    const z = (rng() * 2 - 1) * half;

    const h = terrain.heightAt(x, z);
    if (h < 2.5) continue;                       // no props in the water or on wet sand
    if (terrain.slopeDegAt(x, z) > 28) continue; // nothing perched on a cliff
    if (terrain.roadAt(x, z) > 0.25) continue;   // keep the roads clear

    // Bias away from POI interiors -- those spaces get their own hand-placed cover.
    let inPoi = false;
    for (const p of POIS) {
      if (Math.hypot(x - p.x, z - p.z) < p.radius * 0.6) { inPoi = true; break; }
    }
    if (inPoi && rng() > PROPS.POI_BIAS) continue;

    if (grid.tooClose(x, z, PROPS.MIN_SPACING)) continue;

    const key = TYPE_KEYS[Math.floor(rng() * TYPE_KEYS.length) % TYPE_KEYS.length];
    const def = PROPS.TYPES[key];
    let sx = lerp(def.min[0], def.max[0], rng());
    const sy = lerp(def.min[1], def.max[1], rng());
    let sz = lerp(def.min[2], def.max[2], rng());

    // Quarter-turn only, so the axis-aligned collision box stays exact.
    if (rng() > 0.5) { const t = sx; sx = sz; sz = t; }

    // Sink slightly so nothing floats on uneven ground.
    const y = terrain.heightAt(x, z) - sy * 0.06;
    sink.add(x, y + sy / 2, z, sx, sy, sz, def.color);

    grid.insert(x, z);
    placed++;
  }

  return { placed, attempts };
}
