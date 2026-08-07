import * as THREE from 'three';
import { BR, WORLD, PLAYER } from '../config.js';

/**
 * Battle royale gas circle: hold → shrink → next phase.
 * Deterministic when given a seed (share room code so friends share the same circle).
 */
export class ZoneSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {import('../world/Terrain.js').Terrain} terrain
   * @param {number} [seed]
   */
  constructor(scene, terrain, seed = WORLD.SEED) {
    this.scene = scene;
    this.terrain = terrain;
    this.seed = seed >>> 0;
    this._rngState = this.seed || 1;

    const z = BR.zone || {};
    this.phases = z.phases || [
      { hold: 90, shrink: 70, radius: 400, dps: 1 },
    ];
    this.centerBias = z.centerBias ?? 0.3;
    this.wallHeight = z.wallHeight ?? 220;

    // Live circle (interpolates during shrink)
    this.cx = 0;
    this.cz = 0;
    this.radius = z.initialRadius ?? 780;
    this.dps = 0;

    // Shrink endpoints
    this._fromCx = 0;
    this._fromCz = 0;
    this._fromR = this.radius;
    this._toCx = 0;
    this._toCz = 0;
    this._toR = this.radius;

    // Next circle preview (visible during hold)
    this.nextCx = 0;
    this.nextCz = 0;
    this.nextRadius = this.phases[0]?.radius ?? this.radius * 0.6;

    this.phaseIndex = -1; // -1 = pre-start / initial hold before phase 0 shrink target is "current"
    this.mode = 'hold'; // hold | shrink | done
    this.timer = 0;
    this.modeDuration = 0;
    this.elapsed = 0;
    this.active = false;

    this._damageAcc = 0;
    this._scroll = 0;

    this.group = new THREE.Group();
    this.group.name = 'brZone';
    this.scene.add(this.group);
    this._buildMeshes(z.wallSegments ?? 96);
  }

  _rand() {
    // mulberry32
    let t = (this._rngState += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  _buildMeshes(segments) {
    // Current wall — translucent scrolling cylinder (inside + outside)
    const wallGeo = new THREE.CylinderGeometry(1, 1, 1, segments, 1, true);
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0x66e0ff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.wall = new THREE.Mesh(wallGeo, wallMat);
    this.wall.frustumCulled = false;
    this.group.add(this.wall);

    // Outer haze ring (thicker feel)
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0x2288aa,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.haze = new THREE.Mesh(wallGeo.clone(), hazeMat);
    this.haze.frustumCulled = false;
    this.group.add(this.haze);

    // Next-zone ground ring (thin torus-ish via ring geometry on XZ)
    const nextGeo = new THREE.RingGeometry(0.96, 1.0, segments);
    nextGeo.rotateX(-Math.PI / 2);
    const nextMat = new THREE.MeshBasicMaterial({
      color: 0xffc040,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.nextRing = new THREE.Mesh(nextGeo, nextMat);
    this.nextRing.frustumCulled = false;
    this.group.add(this.nextRing);

    // Current zone ground ring
    const curGeo = new THREE.RingGeometry(0.985, 1.0, segments);
    curGeo.rotateX(-Math.PI / 2);
    const curMat = new THREE.MeshBasicMaterial({
      color: 0x7fd4ff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.curRing = new THREE.Mesh(curGeo, curMat);
    this.curRing.frustumCulled = false;
    this.group.add(this.curRing);
  }

  /**
   * Begin match. Optional seed override (e.g. hash of party room code).
   * @param {number} [seed]
   */
  start(seed) {
    if (seed != null) {
      this.seed = seed >>> 0;
      this._rngState = this.seed || 1;
    }
    this.active = true;
    this.elapsed = 0;
    this.phaseIndex = 0;
    this.mode = 'hold';
    this.dps = 0;
    this._damageAcc = 0;
    // No gas damage until the wall first starts closing (opening grace)
    this.gasEnabled = false;

    // Anchor near player spawn so the drop-in area is never "already in gas"
    const spawn = PLAYER.SPAWN || { x: 0, z: 0 };
    const jitter = WORLD.SIZE * 0.06;
    this.cx = spawn.x + (this._rand() - 0.5) * jitter;
    this.cz = spawn.z + (this._rand() - 0.5) * jitter;
    let radius = BR.zone?.initialRadius ?? 780;
    // Guarantee spawn (and a wide play pad) is inside the opening circle
    const need = Math.hypot(spawn.x - this.cx, spawn.z - this.cz) + 220;
    if (radius < need) radius = need;
    this.radius = radius;
    this._fromCx = this.cx;
    this._fromCz = this.cz;
    this._fromR = this.radius;
    this._toCx = this.cx;
    this._toCz = this.cz;
    this._toR = this.radius;

    this._pickNextCircle();
    const p0 = this.phases[0];
    this.modeDuration = p0?.hold ?? 90;
    this.timer = this.modeDuration;
    this._syncMeshes();
    this.group.visible = true;
  }

  stop() {
    this.active = false;
    this.group.visible = false;
  }

  _pickNextCircle() {
    const p = this.phases[this.phaseIndex];
    if (!p) {
      this.nextRadius = 0;
      this.nextCx = this.cx;
      this.nextCz = this.cz;
      return;
    }
    const newR = Math.max(0, p.radius);
    // New circle fully inside current: center must be within (R - newR)
    const maxOff = Math.max(0, this.radius - newR);
    // Bias toward current center
    const ang = this._rand() * Math.PI * 2;
    const dist = maxOff * Math.pow(this._rand(), 1 + this.centerBias * 2);
    let nx = this.cx + Math.cos(ang) * dist;
    let nz = this.cz + Math.sin(ang) * dist;
    // Keep on map
    const limit = WORLD.SIZE * 0.42;
    nx = Math.max(-limit, Math.min(limit, nx));
    nz = Math.max(-limit, Math.min(limit, nz));
    this.nextCx = nx;
    this.nextCz = nz;
    this.nextRadius = newR;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;
    this._scroll += dt;
    this.timer -= dt;

    if (this.mode === 'hold') {
      // Outside still hurts after gas has been enabled (post first shrink)
      // but hold itself does not raise dps beyond last shrink phase.
      if (this.timer <= 0) {
        // Begin shrink toward next — gas becomes active
        this.gasEnabled = true;
        this._fromCx = this.cx;
        this._fromCz = this.cz;
        this._fromR = this.radius;
        this._toCx = this.nextCx;
        this._toCz = this.nextCz;
        this._toR = this.nextRadius;
        const p = this.phases[this.phaseIndex];
        this.mode = 'shrink';
        this.modeDuration = p?.shrink ?? 60;
        this.timer = this.modeDuration;
        this.dps = p?.dps ?? 1;
      }
    } else if (this.mode === 'shrink') {
      const p = this.phases[this.phaseIndex];
      this.dps = p?.dps ?? 1;
      const u = 1 - Math.max(0, this.timer) / Math.max(1e-4, this.modeDuration);
      const t = u * u * (3 - 2 * u); // smoothstep
      this.cx = this._fromCx + (this._toCx - this._fromCx) * t;
      this.cz = this._fromCz + (this._toCz - this._fromCz) * t;
      this.radius = this._fromR + (this._toR - this._fromR) * t;

      if (this.timer <= 0) {
        this.cx = this._toCx;
        this.cz = this._toCz;
        this.radius = this._toR;
        this.phaseIndex++;
        if (this.phaseIndex >= this.phases.length) {
          this.mode = 'done';
          this.timer = 0;
          this.dps = this.phases[this.phases.length - 1]?.dps ?? 35;
          this.nextRadius = 0;
        } else {
          this._pickNextCircle();
          const np = this.phases[this.phaseIndex];
          this.mode = 'hold';
          this.modeDuration = np?.hold ?? 40;
          this.timer = this.modeDuration;
          this.dps = 0; // hold is safe inside; outside still takes prior edge dps? Spec: damage outside always using current phase dps during shrink. During hold, still damage outside with previous phase dps.
          // Use last completed phase dps for outside during hold
          const prev = this.phases[this.phaseIndex - 1];
          this.dps = prev?.dps ?? 1;
        }
      }
    } else {
      // Final zone complete — radius 0, entire map is deadly contamination
      this.radius = 0;
      this.dps = this.phases[this.phases.length - 1]?.dps ?? 45;
      this.gasEnabled = true;
      this.nextRadius = 0;
    }

    this._syncMeshes();
  }

  /** True when zone 5 has finished collapsing (map-wide gas). */
  get isFinalContamination() {
    return this.mode === 'done' || (this.radius <= 0.5 && this.gasEnabled && this.phaseIndex >= this.phases.length);
  }

  _syncMeshes() {
    const final = this.mode === 'done' || this.radius <= 0.05;
    const h = this.wallHeight;
    const y = (this.terrain?.heightAt?.(this.cx, this.cz) ?? 0) + h * 0.35;

    if (final) {
      // No safe circle left — hide wall; ring flashes as map-wide hazard
      this.wall.visible = false;
      this.haze.visible = false;
      this.curRing.visible = true;
      this.nextRing.visible = false;
      const groundY = (this.terrain?.heightAt?.(this.cx, this.cz) ?? 0) + 1.5;
      // Full-map pulse ring (visual cue that nowhere is safe)
      const mapR = WORLD.SIZE * 0.48;
      this.curRing.position.set(0, groundY, 0);
      this.curRing.scale.set(mapR, 1, mapR);
      if (this.curRing.material) {
        this.curRing.material.color.setHex(0xff4040);
        this.curRing.material.opacity = 0.35 + Math.sin(this._scroll * 4) * 0.2;
      }
      return;
    }

    const r = Math.max(0.5, this.radius);
    this.wall.position.set(this.cx, y, this.cz);
    this.wall.scale.set(r, h, r);
    if (this.wall.material) {
      this.wall.material.opacity = 0.16 + Math.sin(this._scroll * 2.2) * 0.04
        + (this.mode === 'shrink' ? 0.08 : 0);
      this.wall.material.color.setHex(0x66e0ff);
    }

    this.haze.position.set(this.cx, y, this.cz);
    this.haze.scale.set(r * 1.02, h * 1.05, r * 1.02);

    const groundY = (this.terrain?.heightAt?.(this.cx, this.cz) ?? 0) + 1.2;
    this.curRing.position.set(this.cx, groundY, this.cz);
    this.curRing.scale.set(r, 1, r);
    if (this.curRing.material) {
      this.curRing.material.color.setHex(0x7fd4ff);
      this.curRing.material.opacity = 0.7;
    }

    // Next zone preview during hold (including final → 0 shown as tiny gold pin)
    const showNext = this.mode === 'hold' && this.phaseIndex < this.phases.length;
    this.nextRing.visible = showNext && this.nextRadius > 0.5;
    if (showNext && this.nextRadius > 0.5) {
      const nr = this.nextRadius;
      const ny = (this.terrain?.heightAt?.(this.nextCx, this.nextCz) ?? 0) + 1.5;
      this.nextRing.position.set(this.nextCx, ny, this.nextCz);
      this.nextRing.scale.set(nr, 1, nr);
    } else if (showNext && this.nextRadius <= 0.5) {
      // Zone 5 preview: gold X at collapse point
      this.nextRing.visible = true;
      const ny = (this.terrain?.heightAt?.(this.nextCx, this.nextCz) ?? 0) + 1.5;
      this.nextRing.position.set(this.nextCx, ny, this.nextCz);
      this.nextRing.scale.set(8, 1, 8);
    }

    this.wall.visible = r > 1;
    this.haze.visible = r > 1;
    this.curRing.visible = r > 1;
  }

  /** Horizontal distance from point to zone center. */
  distFromCenter(x, z) {
    return Math.hypot(x - this.cx, z - this.cz);
  }

  isInside(x, z, margin = 0) {
    return this.distFromCenter(x, z) <= this.radius - margin;
  }

  /**
   * Apply gas damage to player vitals if outside.
   * @param {number} dt
   * @param {{ health:number }} vitals
   * @param {{ x:number, z:number, y?:number }} pos
   * @param {{ immune?: boolean }} [opts]  e.g. in helicopter — no ground gas
   * @returns {{ outside:boolean, dps:number, damage:number, grace?:boolean, immune?:boolean }}
   */
  applyPlayerDamage(dt, vitals, pos, opts = null) {
    if (!this.active || !vitals) {
      return { outside: false, dps: 0, damage: 0 };
    }
    // Radius 0 / final contamination = everyone is "outside"
    const outside = this.radius <= 0.05 || !this.isInside(pos.x, pos.z);
    // Opening grace: no gas until the wall has closed at least once
    if (!this.gasEnabled) {
      return { outside, dps: 0, damage: 0, grace: true };
    }
    // Early zones: heli can fly above fog. Final contamination kills everyone airborne too.
    if (opts?.immune && !this.isFinalContamination && this.radius > 8) {
      return { outside, dps: 0, damage: 0, immune: true };
    }
    let useDps = 0;
    if (outside) {
      if (this.mode === 'done' || this.radius <= 0.05) {
        useDps = this.phases[this.phases.length - 1]?.dps ?? 45;
      } else if (this.mode === 'shrink') {
        useDps = this.dps || this.phases[this.phaseIndex]?.dps || 1;
      } else if (this.mode === 'hold') {
        // After a shrink, outside still burns at the last completed phase dps
        const prev = this.phases[Math.max(0, this.phaseIndex - 1)];
        useDps = prev?.dps ?? this.dps ?? 1;
      } else {
        useDps = this.phases[this.phases.length - 1]?.dps ?? 45;
      }
    }
    let damage = 0;
    if (outside && useDps > 0 && vitals.health > 0) {
      this._damageAcc += useDps * dt;
      if (this._damageAcc >= 0.25) {
        damage = this._damageAcc;
        this._damageAcc = 0;
        // Gas ignores armor
        vitals.health = Math.max(0, vitals.health - damage);
      }
    } else {
      this._damageAcc = 0;
    }
    return { outside, dps: outside ? useDps : 0, damage, grace: false };
  }

  /** Snapshot for maps / HUD / bots. */
  snapshot() {
    // Display zone number 1..5 (phaseIndex advances after each shrink completes)
    let displayZone = 1;
    if (this.mode === 'done') displayZone = this.phases.length;
    else if (this.mode === 'shrink') displayZone = Math.min(this.phases.length, this.phaseIndex + 1);
    else displayZone = Math.min(this.phases.length, Math.max(1, this.phaseIndex + 1));

    return {
      active: this.active,
      cx: this.cx,
      cz: this.cz,
      radius: this.radius,
      nextCx: this.nextCx,
      nextCz: this.nextCz,
      nextRadius: this.nextRadius,
      phase: this.phaseIndex,
      phaseCount: this.phases.length,
      displayZone,
      mode: this.mode,
      timer: Math.max(0, this.timer),
      dps: this.dps,
      elapsed: this.elapsed,
      gasEnabled: !!this.gasEnabled,
      finalContamination: this.isFinalContamination,
      // Difficulty ramp index (0..4 for five zones)
      rampIndex: Math.max(0, Math.min(
        (BR.botRamp?.damage?.length ?? 1) - 1,
        this.mode === 'done'
          ? this.phases.length - 1
          : (this.mode === 'shrink' ? this.phaseIndex : Math.max(0, this.phaseIndex - 1))
      )),
    };
  }

  /**
   * Hash a room code into a seed so friends share the same circle.
   * @param {string} room
   */
  static seedFromRoom(room) {
    const s = String(room || '').toUpperCase();
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
}
