// Climb volumes for exterior ladders / fire-escape cages / roof rappels.
// Registered at world-gen time; the controller queries them each tick.

export class LadderRegistry {
  constructor() {
    this.volumes = [];
  }

  clear() {
    this.volumes.length = 0;
  }

  /**
   * Axis-aligned climb volume. Player feet can sit anywhere in y0..y1
   * while x/z stay within the rect (with small padding applied at query).
   * @param {object} [opts]
   * @param {number} [opts.speed]  climb speed override (rappel zip)
   * @param {string} [opts.kind]   'ladder' | 'rappel'
   */
  add(x0, y0, z0, x1, y1, z1, opts = {}) {
    if (y1 <= y0) return;
    this.volumes.push({
      x0: Math.min(x0, x1),
      y0,
      z0: Math.min(z0, z1),
      x1: Math.max(x0, x1),
      y1,
      z1: Math.max(z0, z1),
      cx: (x0 + x1) * 0.5,
      cz: (z0 + z1) * 0.5,
      speed: opts.speed ?? null,
      kind: opts.kind ?? 'ladder',
      // Roof landing for rappel express
      topY: opts.topY ?? Math.max(y0, y1),
      botY: opts.botY ?? Math.min(y0, y1),
    });
  }

  /** First volume that contains (x,y,z) expanded by radius. */
  findAt(x, y, z, radius = 0.45) {
    const r = radius + 0.15;
    for (const v of this.volumes) {
      if (x < v.x0 - r || x > v.x1 + r) continue;
      if (z < v.z0 - r || z > v.z1 + r) continue;
      // Body mid-height should be in range (allow a little below for mount)
      if (y + 0.2 < v.y0 - 0.4 || y > v.y1 + 0.2) continue;
      return v;
    }
    return null;
  }
}

/** Shared world ladders — filled during structure scatter, used by Controller. */
export const worldLadders = new LadderRegistry();
