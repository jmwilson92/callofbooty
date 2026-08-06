import * as THREE from 'three';
import { RAPPEL, WORLD, BUILDINGS } from '../config.js';
import { worldBuildings } from './BuildingRegistry.js';

/**
 * Rappel / zipline system.
 * Vertical (gold):
 *   - Floor-by-floor: grab rope, W/S (or E) steps one level at a time.
 *   - Express: Shift+E / Shift+W rides straight to the roof, then scoots onto the deck.
 * Horizontal (blue): building-to-building rooftop ziplines.
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

function ease(u) {
  return u * u * (3 - 2 * u);
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
    /** @type {object|null} animated ride segment */
    this.ride = null;
    /** @type {object|null} hanging on a vertical rope between steps */
    this.hang = null;

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

      const landX = THREE.MathUtils.clamp(x, b.x + 1.5, b.x + b.w - 1.5);
      const landZ = b.z + Math.min(3.2, Math.max(2.0, b.d * 0.28));
      const landY = roofY + 0.15;
      const stops = this._buildStops(b, bot, top);

      this._addVertical(x, bot, z, top, landX, landY, landZ, stops);
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

      const ra = (a.roofY ?? a.baseY + a.floors * 3.5) + 0.4;
      const rb = (b.roofY ?? b.baseY + b.floors * 3.5) + 0.4;
      const acx = a.x + a.w * 0.5;
      const acz = a.z + a.d * 0.5;
      const bcx = b.x + b.w * 0.5;
      const bcz = b.z + b.d * 0.5;
      const dx = bcx - acx;
      const dz = bcz - acz;
      const aEdge = this._edgePoint(a, dx, dz, 0.4);
      const bEdge = this._edgePoint(b, -dx, -dz, 0.4);
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

  /** Floor stop heights along a vertical rope (ground → each floor → roof). */
  _buildStops(b, bot, top) {
    const stops = [];
    const push = (y) => {
      const yy = Math.max(bot + 0.1, Math.min(top - 0.05, y));
      if (!stops.length || Math.abs(stops[stops.length - 1] - yy) > 0.6) stops.push(yy);
    };

    push(bot + 0.15);
    if (Array.isArray(b.floorYs) && b.floorYs.length) {
      for (const fy of b.floorYs) {
        if (Number.isFinite(fy)) push(fy + 0.05);
      }
    } else {
      const floorH = BUILDINGS?.FLOOR_HEIGHT ?? RAPPEL.FLOOR_HEIGHT ?? 3.5;
      const base = b.baseY ?? bot;
      const floors = Math.max(1, b.floors | 0);
      for (let f = 1; f < floors; f++) push(base + f * floorH + 0.05);
    }
    push(top - 0.05);
    // Ensure sorted unique
    stops.sort((a, c) => a - c);
    return stops;
  }

  /** Point on building footprint edge in direction (dx,dz). */
  _edgePoint(b, dx, dz, inset = 0.3) {
    const cx = b.x + b.w * 0.5;
    const cz = b.z + b.d * 0.5;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    const tx = ux > 0 ? (b.x + b.w - inset - cx) / ux : ux < 0 ? (b.x + inset - cx) / ux : Infinity;
    const tz = uz > 0 ? (b.z + b.d - inset - cz) / uz : uz < 0 ? (b.z + inset - cz) / uz : Infinity;
    const t = Math.min(Math.abs(tx), Math.abs(tz));
    return { x: cx + ux * t, z: cz + uz * t };
  }

  _addVertical(x, bot, z, top, landX, landY, landZ, stops) {
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

    // Small rung markers at floor stops (skip ground + roof)
    for (let i = 1; i < stops.length - 1; i++) {
      const y = stops[i];
      const rung = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.06, 0.12),
        this._clampMat
      );
      rung.position.set(x, y, z + 0.08);
      this.group.add(rung);
    }

    this.lines.push({
      kind: 'vertical',
      x, z, bot, top,
      stops: stops.slice(),
      land: { x: landX, y: landY, z: landZ },
      grabR: 1.5,
    });
  }

  _addHorizontal(ax, ay, az, bx, by, bz, landA, landB) {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.hypot(dx, dy, dz) || 1;
    const mid = new THREE.Vector3(ax + dx * 0.5, ay + dy * 0.5, az + dz * 0.5);
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, len, 5),
      this._zipMat
    );
    cable.position.copy(mid);
    cable.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx / len, dy / len, dz / len)
    );
    cable.castShadow = true;
    this.group.add(cable);

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
    this.hang = null;
    this.lines.length = 0;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }

  /** True while hanging on a rope or mid-ride (caller should skip foot control). */
  get riding() {
    return !!(this.ride || this.hang);
  }

  /**
   * Interact (E). Floor step by default; Shift+E = express to roof (or ground if near top).
   * @returns {boolean}
   */
  tryUse(controller, opts = {}) {
    if (this.ride) return true; // busy

    // Already hanging — E steps one floor (or express with Shift)
    if (this.hang) {
      const line = this.hang.line;
      if (opts.express) {
        const nearTop = this.hang.stopIdx >= line.stops.length - 2;
        this._startExpress(line, controller, !nearTop);
      } else {
        this._stepFloor(line, controller, opts.dir ?? 1);
      }
      return true;
    }

    const line = this._findNear(controller.pos.x, controller.pos.y, controller.pos.z);
    if (!line) return false;

    if (line.kind === 'horizontal') {
      this._startHorizontal(line, controller);
      return true;
    }

    // Vertical
    const py = controller.pos.y;
    const nearTop = py > (line.top + line.bot) * 0.72;
    if (opts.express) {
      this._startExpress(line, controller, !nearTop);
      return true;
    }

    // Mount + one floor step in intended direction
    const dir = opts.dir != null ? opts.dir : (nearTop ? -1 : 1);
    this._mountHang(line, controller);
    this._stepFloor(line, controller, dir);
    return true;
  }

  /**
   * @returns {boolean} true while a ride/hang is active
   */
  update(dt, controller, input) {
    if (!controller) {
      this.ride = null;
      this.hang = null;
      return false;
    }

    // Auto-mount vertical rope at base with W (one floor up)
    if (!this.ride && !this.hang && input) {
      const near = this._findNear(controller.pos.x, controller.pos.y, controller.pos.z);
      if (near?.kind === 'vertical') {
        const atBase = controller.pos.y < near.bot + 3.5;
        if (atBase && (input.action('forward') || input.actionPressed('jump'))) {
          const express = input.action('sprint');
          if (express) this._startExpress(near, controller, true);
          else {
            this._mountHang(near, controller);
            this._stepFloor(near, controller, 1);
          }
        }
      }
    }

    // Hang: accept climb input between floors
    if (this.hang && !this.ride && input) {
      this._holdHang(controller);
      const line = this.hang.line;

      if (input.actionPressed('crouch')) {
        // C dismounts mid-climb
        this._dismount(controller, line, 'side');
      } else if (
        (input.actionPressed('interact') && input.action('sprint'))
        || input.actionPressed('jump')
        || (input.actionPressed('forward') && input.action('sprint'))
      ) {
        // Shift+E, Jump, or Shift+W → express to roof
        this._startExpress(line, controller, true);
      } else if (input.actionPressed('interact')) {
        // E while hanging: step up, or dismount at ends
        const idx = this.hang.stopIdx;
        if (idx <= 0) this._dismount(controller, line, 'bot');
        else if (idx >= line.stops.length - 1) this._dismount(controller, line, 'top');
        else this._stepFloor(line, controller, 1);
      } else if (input.actionPressed('forward') && !input.action('sprint')) {
        this._stepFloor(line, controller, 1);
      } else if (input.actionPressed('back')) {
        this._stepFloor(line, controller, -1);
      }

      // Hold W/S to keep stepping floor-by-floor
      if (!this.ride && this.hang) {
        if (input.action('forward') && !input.action('back') && !input.action('sprint')) {
          this.hang._holdUp = (this.hang._holdUp ?? 0) + dt;
          if (this.hang._holdUp > 0.22) {
            this.hang._holdUp = 0;
            this._stepFloor(line, controller, 1);
          }
        } else this.hang._holdUp = 0;
        if (input.action('back') && !input.action('forward')) {
          this.hang._holdDown = (this.hang._holdDown ?? 0) + dt;
          if (this.hang._holdDown > 0.22) {
            this.hang._holdDown = 0;
            this._stepFloor(line, controller, -1);
          }
        } else this.hang._holdDown = 0;
      }
    }

    if (!this.ride) return !!this.hang;

    // Animate ride
    const r = this.ride;
    r.t += dt / r.duration;
    const u = Math.min(1, r.t);
    const e = ease(u);

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
      if (r.phase === 'zip' && r.land) {
        // Roof scoot after express
        const scootSpeed = RAPPEL.SCOOT_SPEED ?? 12;
        const from = { x: r.to.x, y: r.to.y, z: r.to.z };
        const to = { ...r.land };
        const dist = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
        if (dist > 0.15) {
          this.ride = {
            kind: r.kind,
            phase: 'scoot',
            from,
            to,
            land: null,
            t: 0,
            duration: Math.max(0.22, dist / scootSpeed),
            after: null,
          };
          this.hang = null;
          return true;
        }
        controller.pos.set(to.x, to.y, to.z);
        controller.vel.set(0, 0, 0);
        controller.grounded = true;
        controller.prevPos.copy(controller.pos);
        this.ride = null;
        this.hang = null;
        return false;
      }

      if (r.phase === 'scoot' || r.after === 'free') {
        controller.pos.set(r.to.x, r.to.y, r.to.z);
        controller.vel.set(0, 0, 0);
        controller.grounded = true;
        controller.prevPos.copy(controller.pos);
        this.ride = null;
        this.hang = null;
        return false;
      }

      // Floor step finished → hang at stop (or free if base)
      if (r.after === 'hang' && r.line) {
        controller.pos.set(r.to.x, r.to.y, r.to.z);
        controller.vel.set(0, 0, 0);
        this.ride = null;
        this.hang = {
          line: r.line,
          stopIdx: r.stopIdx ?? this._nearestStopIdx(r.line, r.to.y),
          _holdUp: 0,
          _holdDown: 0,
        };
        this._holdHang(controller);
        return true;
      }

      controller.pos.set(r.to.x, r.to.y, r.to.z);
      controller.vel.set(0, 0, 0);
      controller.grounded = true;
      controller.prevPos.copy(controller.pos);
      this.ride = null;
      this.hang = null;
    }
    return true;
  }

  _holdHang(controller) {
    if (!this.hang) return;
    const line = this.hang.line;
    const y = line.stops[this.hang.stopIdx] ?? controller.pos.y;
    controller.pos.x = line.x;
    controller.pos.y = y;
    controller.pos.z = line.z;
    controller.vel.set(0, 0, 0);
    controller.grounded = false;
    controller.sliding = false;
    controller.mantling = false;
    controller.onLadder = true;
    controller.prevPos.copy(controller.pos);
  }

  _mountHang(line, controller) {
    const idx = this._nearestStopIdx(line, controller.pos.y);
    controller.pos.x = line.x;
    controller.pos.z = line.z;
    controller.pos.y = line.stops[idx];
    this.hang = { line, stopIdx: idx, _holdUp: 0, _holdDown: 0 };
    this._holdHang(controller);
  }

  _nearestStopIdx(line, y) {
    const stops = line.stops;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < stops.length; i++) {
      const d = Math.abs(stops[i] - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  _stepFloor(line, controller, dir) {
    if (!line?.stops?.length) return;
    if (!this.hang || this.hang.line !== line) this._mountHang(line, controller);
    const cur = this.hang.stopIdx;
    const next = THREE.MathUtils.clamp(cur + (dir >= 0 ? 1 : -1), 0, line.stops.length - 1);
    if (next === cur) {
      // At end of rope
      if (dir > 0 && cur >= line.stops.length - 1) {
        // Top stop → scoot onto roof
        this._startExpress(line, controller, true, /*alreadyAtTop*/ true);
      } else if (dir < 0 && cur <= 0) {
        this._dismount(controller, line, 'bot');
      }
      return;
    }

    const fromY = line.stops[cur];
    const toY = line.stops[next];
    const dist = Math.abs(toY - fromY);
    const speed = RAPPEL.FLOOR_SPEED ?? 14;
    this.ride = {
      kind: 'vertical',
      phase: 'floor',
      line,
      stopIdx: next,
      from: { x: line.x, y: fromY, z: line.z },
      to: { x: line.x, y: toY, z: line.z },
      land: null,
      after: 'hang',
      t: 0,
      duration: Math.max(0.2, dist / speed),
    };
    this.hang = null;
    controller.pos.x = line.x;
    controller.pos.z = line.z;
  }

  _startExpress(line, controller, goUp, alreadyAtTop = false) {
    const zipSpeed = RAPPEL.ZIP_SPEED ?? 34;
    const py = controller.pos.y;

    if (goUp) {
      const fromY = alreadyAtTop
        ? line.top - 0.05
        : Math.max(line.bot + 0.15, Math.min(py, line.top - 0.2));
      const toY = line.top - 0.05;
      const dist = Math.abs(toY - fromY);
      if (dist < 0.25) {
        // Already at top — just scoot onto roof
        this.ride = {
          kind: 'vertical',
          phase: 'scoot',
          from: { x: line.x, y: toY, z: line.z },
          to: { ...line.land },
          land: null,
          after: 'free',
          t: 0,
          duration: Math.max(
            0.22,
            Math.hypot(line.land.x - line.x, line.land.z - line.z) / (RAPPEL.SCOOT_SPEED ?? 14)
          ),
        };
      } else {
        this.ride = {
          kind: 'vertical',
          phase: 'zip',
          from: { x: line.x, y: fromY, z: line.z },
          to: { x: line.x, y: toY, z: line.z },
          land: { ...line.land },
          after: null,
          t: 0,
          duration: Math.max(0.45, dist / zipSpeed),
        };
      }
    } else {
      const fromY = Math.min(line.top - 0.2, py);
      const toY = line.bot + 0.2;
      const dist = Math.abs(toY - fromY);
      this.ride = {
        kind: 'vertical',
        phase: 'zip',
        from: { x: line.x, y: fromY, z: line.z },
        to: { x: line.x, y: toY, z: line.z },
        land: { x: line.x, y: line.bot + 0.15, z: line.z + 0.8 },
        after: 'free',
        t: 0,
        duration: Math.max(0.45, dist / zipSpeed),
      };
    }
    this.hang = null;
    controller.pos.x = line.x;
    controller.pos.z = line.z;
  }

  _startHorizontal(line, controller) {
    const zipSpeed = RAPPEL.ZIP_SPEED ?? 34;
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
      phase: 'zip',
      from,
      to,
      land,
      after: null,
      t: 0,
      duration: Math.max(0.7, dist / (zipSpeed * 0.95)),
    };
    this.hang = null;
    controller.pos.set(from.x, from.y, from.z);
  }

  _dismount(controller, line, where = 'side') {
    this.ride = null;
    this.hang = null;
    if (where === 'bot') {
      controller.pos.set(line.x, line.bot + 0.15, line.z + 0.9);
    } else if (where === 'top') {
      controller.pos.set(line.land.x, line.land.y, line.land.z);
    } else {
      // Step off slightly south of rope
      controller.pos.set(line.x, controller.pos.y, line.z + 0.85);
    }
    controller.vel.set(0, 0, 0);
    controller.grounded = true;
    controller.onLadder = false;
    controller.prevPos.copy(controller.pos);
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
      if (this.ride.phase === 'scoot') return 'Landing on roof…';
      if (this.ride.phase === 'floor') return 'Climbing…';
      return this.ride.kind === 'horizontal' ? 'Zipping…' : 'Express to roof…';
    }
    if (this.hang) {
      const line = this.hang.line;
      const idx = this.hang.stopIdx;
      const floor = idx + 1;
      const max = line.stops.length;
      return `W/S floor ${floor}/${max} · Shift+W roof · C drop`;
    }
    const line = this._findNear(px, py, pz);
    if (!line) return null;
    if (line.kind === 'horizontal') return 'E · Ride zipline';
    const nearTop = py > (line.top + line.bot) * 0.72;
    if (nearTop) return 'E · Rappel down · Shift+E express ground';
    return 'E / W · Floor climb · Shift+E express roof';
  }
}
