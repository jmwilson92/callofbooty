import * as THREE from 'three';
import { RAPPEL, WORLD } from '../config.js';
import { worldBuildings } from './BuildingRegistry.js';

/**
 * Express rappel / zipline system.
 * - Vertical: grab rope → rides straight to the roof (no floor stops), then scoots onto the deck.
 * - Horizontal: a few building-to-building cables for side-to-side travel.
 */

function mulberry(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class RappelSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./Terrain.js').Terrain} terrain
   */
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.group.name = 'rappels';
    this.scene.add(this.group);
    /** @type {Array<object>} */
    this.lines = [];
    /** @type {object|null} active express ride */
    this.ride = null;

    this._ropeMat = new THREE.MeshStandardMaterial({
      color: 0xc4a050,
      roughness: 0.55,
      metalness: 0.15,
    });
    this._zipMat = new THREE.MeshStandardMaterial({
      color: 0x70c0e8,
      roughness: 0.4,
      metalness: 0.35,
      emissive: 0x104060,
      emissiveIntensity: 0.25,
    });
    this._clampMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3e,
      roughness: 0.5,
      metalness: 0.55,
    });
  }

  spawn(seed = WORLD.SEED ^ 0x2a11e1) {
    this.clear();
    const rng = mulberry(seed);
    const maxN = RAPPEL.MAX_COUNT ?? 28;
    const minF = RAPPEL.MIN_FLOORS ?? 5;
    const out = RAPPEL.FACADE_OUT ?? 0.55;

    const buildings = (worldBuildings || []).filter(
      (b) => b.floors >= minF && b.w >= 8 && b.d >= 8
    );
    const ranked = buildings
      .map((b) => ({ b, score: b.floors * 3 + b.w * 0.05 + rng() * 4 }))
      .sort((a, c) => c.score - a.score);

    let n = 0;
    for (const { b } of ranked) {
      if (n >= maxN) break;
      const side = rng() > 0.5 ? 0.28 : 0.72;
      const x = b.x + b.w * side;
      const zFacade = b.z; // south wall
      const z = zFacade - out;
      const bot = Math.max(
        this.terrain.heightAt(x, z) + 0.2,
        (b.baseY ?? this.terrain.heightAt(x, z)) + 0.05
      );
      const roofY = b.roofY ?? (b.baseY + b.floors * 3.5);
      const top = roofY + 0.15;
      if (top - bot < 12) continue;

      // Landing point: scoot onto roof deck inside the footprint
      const landX = THREE.MathUtils.clamp(x, b.x + 1.2, b.x + b.w - 1.2);
      const landZ = b.z + Math.min(2.2, b.d * 0.25);
      const landY = roofY + 0.12;

      this._addVertical(x, bot, z, top, landX, landY, landZ);
      n++;
    }

    // Horizontal ziplines between nearby buildings
    const hzN = RAPPEL.HORIZONTAL_COUNT ?? 8;
    const minDist = RAPPEL.HORIZONTAL_MIN_DIST ?? 14;
    const maxDist = RAPPEL.HORIZONTAL_MAX_DIST ?? 48;
    const horizCandidates = buildings
      .filter((b) => b.floors >= (RAPPEL.HORIZONTAL_MIN_FLOORS ?? 6))
      .slice(0, 40);

    let hCount = 0;
    const usedPairs = new Set();
    for (let i = 0; i < horizCandidates.length && hCount < hzN; i++) {
      const a = horizCandidates[i];
      let best = null;
      let bestD = Infinity;
      for (let j = i + 1; j < horizCandidates.length; j++) {
        const b = horizCandidates[j];
        const ax = a.x + a.w * 0.5;
        const az = a.z + a.d * 0.5;
        const bx = b.x + b.w * 0.5;
        const bz = b.z + b.d * 0.5;
        const d = Math.hypot(bx - ax, bz - az);
        if (d < minDist || d > maxDist) continue;
        const key = `${Math.min(a.x, b.x)}_${Math.min(a.z, b.z)}_${Math.max(a.x, b.x)}`;
        if (usedPairs.has(key)) continue;
        // Prefer similar heights
        const ra = a.roofY ?? a.baseY + a.floors * 3.5;
        const rb = b.roofY ?? b.baseY + b.floors * 3.5;
        if (Math.abs(ra - rb) > 14) continue;
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      if (!best) continue;
      const b = best;
      usedPairs.add(`${Math.min(a.x, b.x)}_${Math.min(a.z, b.z)}_${Math.max(a.x, b.x)}`);

      // Connect near-facing edges at roof height
      const ra = (a.roofY ?? a.baseY + a.floors * 3.5) + 0.4;
      const rb = (b.roofY ?? b.baseY + b.floors * 3.5) + 0.4;
      // Pick closest facade points
      const acx = a.x + a.w * 0.5;
      const acz = a.z + a.d * 0.5;
      const bcx = b.x + b.w * 0.5;
      const bcz = b.z + b.d * 0.5;
      const dx = bcx - acx;
      const dz = bcz - acz;
      // Start on edge of A toward B, end on edge of B toward A
      const aEdge = this._edgePoint(a, dx, dz, 0.4);
      const bEdge = this._edgePoint(b, -dx, -dz, 0.4);
      // Land scoots: inward from edges toward centers
      const aLand = {
        x: lerp(aEdge.x, acx, 0.35),
        y: (a.roofY ?? a.baseY + a.floors * 3.5) + 0.12,
        z: lerp(aEdge.z, acz, 0.35),
      };
      const bLand = {
        x: lerp(bEdge.x, bcx, 0.35),
        y: (b.roofY ?? b.baseY + b.floors * 3.5) + 0.12,
        z: lerp(bEdge.z, bcz, 0.35),
      };

      this._addHorizontal(
        aEdge.x, ra, aEdge.z,
        bEdge.x, rb, bEdge.z,
        aLand, bLand
      );
      hCount++;
    }

    return { vertical: n, horizontal: hCount };
  }

  /** Point on building footprint edge in direction (dx,dz). */
  _edgePoint(b, dx, dz, inset = 0.3) {
    const cx = b.x + b.w * 0.5;
    const cz = b.z + b.d * 0.5;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    // Ray from center to edge of AABB
    const tx = ux > 0 ? (b.x + b.w - inset - cx) / ux : ux < 0 ? (b.x + inset - cx) / ux : Infinity;
    const tz = uz > 0 ? (b.z + b.d - inset - cz) / uz : uz < 0 ? (b.z + inset - cz) / uz : Infinity;
    const t = Math.min(Math.abs(tx), Math.abs(tz));
    return { x: cx + ux * t, z: cz + uz * t };
  }

  _addVertical(x, bot, z, top, landX, landY, landZ) {
    const h = top - bot;
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, h, 5),
      this._ropeMat
    );
    rope.position.set(x, bot + h * 0.5, z);
    rope.castShadow = true;
    this.group.add(rope);

    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.5), this._clampMat);
    clamp.position.set(x, top + 0.08, z + 0.2);
    this.group.add(clamp);

    const stake = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.28), this._clampMat);
    stake.position.set(x, bot + 0.2, z);
    this.group.add(stake);

    const tip = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.14, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0xffc040,
        emissive: 0xaa6000,
        emissiveIntensity: 0.6,
      })
    );
    tip.position.set(x, bot + 1.15, z);
    this.group.add(tip);

    this.lines.push({
      kind: 'vertical',
      x, z, bot, top,
      // Express ride endpoints
      from: { x, y: bot + 0.1, z },
      to: { x, y: top - 0.1, z },
      // Final land on roof deck (scooted in)
      land: { x: landX, y: landY, z: landZ },
      // Grab radius at base / along line
      grabR: 1.5,
    });
  }

  _addHorizontal(ax, ay, az, bx, by, bz, landA, landB) {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.hypot(dx, dy, dz) || 1;
    // Cable along direction
    const mid = new THREE.Vector3(ax + dx * 0.5, ay + dy * 0.5, az + dz * 0.5);
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, len, 5),
      this._zipMat
    );
    cable.position.copy(mid);
    // Align Y-axis cylinder to (dx,dy,dz)
    cable.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx / len, dy / len, dz / len)
    );
    cable.castShadow = true;
    this.group.add(cable);

    // End anchors
    for (const [px, py, pz] of [[ax, ay, az], [bx, by, bz]]) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), this._clampMat);
      a.position.set(px, py, pz);
      this.group.add(a);
    }

    this.lines.push({
      kind: 'horizontal',
      from: { x: ax, y: ay, z: az },
      to: { x: bx, y: by, z: bz },
      landFrom: landA,
      landTo: landB,
      grabR: 2.2,
      len,
    });
  }

  clear() {
    this.ride = null;
    this.lines.length = 0;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }

  get riding() {
    return !!this.ride;
  }

  /**
   * Start a ride if near a line and player presses interact / climb intent.
   * @returns {boolean}
   */
  tryUse(controller, opts = {}) {
    if (this.ride) return false; // already riding — let update finish
    const line = this._findNear(controller.pos.x, controller.pos.y, controller.pos.z);
    if (!line) return false;
    this._startRide(line, controller, opts);
    return true;
  }

  /**
   * Auto-start vertical zip when near base and holding W (optional).
   * @returns {boolean} true while a ride is active (caller should skip foot control)
   */
  update(dt, controller, input) {
    if (!controller) {
      this.ride = null;
      return false;
    }

    // Auto-grab vertical rope at base when pressing forward
    if (!this.ride && input) {
      const near = this._findNear(controller.pos.x, controller.pos.y, controller.pos.z);
      if (near?.kind === 'vertical') {
        const atBase = controller.pos.y < near.bot + 3.5;
        if (atBase && (input.action('forward') || input.actionPressed('jump'))) {
          this._startRide(near, controller, { up: true });
        }
      }
    }

    if (!this.ride) return false;

    const r = this.ride;
    r.t += dt / r.duration;
    const u = Math.min(1, r.t);
    // Smooth ease-in-out
    const e = u * u * (3 - 2 * u);

    controller.pos.x = lerp(r.from.x, r.to.x, e);
    controller.pos.y = lerp(r.from.y, r.to.y, e);
    controller.pos.z = lerp(r.from.z, r.to.z, e);
    controller.vel.set(0, 0, 0);
    controller.grounded = false;
    controller.sliding = false;
    controller.mantling = false;
    controller.onLadder = false;
    controller.prevPos.copy(controller.pos);

    if (u >= 1) {
      // Land / scoot onto roof deck
      const land = r.land;
      controller.pos.set(land.x, land.y, land.z);
      controller.vel.set(0, 0, 0);
      controller.grounded = true;
      controller.prevPos.copy(controller.pos);
      this.ride = null;
    }
    return true;
  }

  _startRide(line, controller, opts = {}) {
    const zipSpeed = RAPPEL.ZIP_SPEED ?? 32;

    if (line.kind === 'vertical') {
      const py = controller.pos.y;
      const nearTop = py > (line.top + line.bot) * 0.55;
      // Default: go up to roof. From top half, go down to base (unless forced up).
      const goUp = opts.up || opts.express || !nearTop;
      if (goUp) {
        const from = {
          x: line.x,
          y: Math.max(line.bot + 0.15, Math.min(py, line.top - 1)),
          z: line.z,
        };
        const to = { x: line.x, y: line.top - 0.15, z: line.z };
        const dist = Math.abs(to.y - from.y);
        this.ride = {
          kind: 'vertical',
          from,
          to,
          land: { ...line.land },
          t: 0,
          duration: Math.max(0.55, dist / zipSpeed),
        };
      } else {
        // Ride down to base
        const from = { x: line.x, y: Math.min(line.top - 0.2, py), z: line.z };
        const to = { x: line.x, y: line.bot + 0.2, z: line.z };
        const dist = Math.abs(to.y - from.y);
        this.ride = {
          kind: 'vertical',
          from,
          to,
          land: { x: line.x, y: line.bot + 0.15, z: line.z + 0.8 },
          t: 0,
          duration: Math.max(0.55, dist / zipSpeed),
        };
      }
      // Snap to rope column immediately
      controller.pos.x = line.x;
      controller.pos.z = line.z;
      return;
    }

    // Horizontal: pick direction based on which end you're closer to
    const dA = Math.hypot(
      controller.pos.x - line.from.x,
      controller.pos.y - line.from.y,
      controller.pos.z - line.from.z
    );
    const dB = Math.hypot(
      controller.pos.x - line.to.x,
      controller.pos.y - line.to.y,
      controller.pos.z - line.to.z
    );
    const startAtA = dA <= dB;
    const from = startAtA ? { ...line.from } : { ...line.to };
    const to = startAtA ? { ...line.to } : { ...line.from };
    const land = startAtA ? { ...line.landTo } : { ...line.landFrom };
    const dist = line.len || Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
    this.ride = {
      kind: 'horizontal',
      from,
      to,
      land,
      t: 0,
      duration: Math.max(0.7, dist / (zipSpeed * 0.95)),
    };
    controller.pos.set(from.x, from.y, from.z);
  }

  _findNear(px, py, pz) {
    let best = null;
    let bestD = Infinity;
    for (const line of this.lines) {
      if (line.kind === 'vertical') {
        const d = Math.hypot(line.x - px, line.z - pz);
        if (d > (line.grabR ?? 1.5)) continue;
        if (py < line.bot - 0.5 || py > line.top + 1.5) continue;
        if (d < bestD) {
          bestD = d;
          best = line;
        }
      } else {
        // Distance to segment endpoints (either end is a mount point)
        const dA = Math.hypot(line.from.x - px, line.from.y - py, line.from.z - pz);
        const dB = Math.hypot(line.to.x - px, line.to.y - py, line.to.z - pz);
        const d = Math.min(dA, dB);
        if (d > (line.grabR ?? 2.2)) continue;
        if (d < bestD) {
          bestD = d;
          best = line;
        }
      }
    }
    return best;
  }

  prompt(px, py, pz) {
    if (this.ride) {
      return this.ride.kind === 'horizontal' ? 'Zipping…' : 'Rappelling to roof…';
    }
    const line = this._findNear(px, py, pz);
    if (!line) return null;
    if (line.kind === 'horizontal') return 'E · Ride zipline';
    const nearTop = py > (line.top + line.bot) * 0.55;
    if (nearTop) return 'E · Rappel down';
    return 'E / W · Zip to roof';
  }
}
