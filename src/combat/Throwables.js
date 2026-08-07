import * as THREE from 'three';
import { THROWABLES, WORLD } from '../config.js';

/**
 * Lethal frags + smoke grenades (arc throw, bounce, detonate).
 * UAV / stim are activated via Loadout; this system owns in-world nades + smoke volumes.
 */
export class ThrowableSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {import('../world/Terrain.js').Terrain} terrain
   * @param {import('../core/EventBus.js').EventBus} bus
   * @param {import('./Effects.js').CombatEffects|null} effects
   */
  constructor(scene, terrain, bus, effects = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.bus = bus;
    this.effects = effects;
    this.group = new THREE.Group();
    this.group.name = 'throwables';
    scene.add(this.group);

    /** @type {Array<object>} live nades in flight / fuse */
    this.nades = [];
    /** @type {Array<{x:number,y:number,z:number,r:number,life:number,mesh:THREE.Object3D}>} */
    this.smokes = [];

    /** @type {null|(() => Array)} bots for splash */
    this._getTargets = null;
    /** @type {null|(() => object|null)} local player vitals+pos */
    this._getPlayer = null;
  }

  setProviders(getTargets, getPlayer) {
    this._getTargets = getTargets;
    this._getPlayer = getPlayer;
  }

  /**
   * Throw a frag or smoke from eye along look direction.
   * @param {'frag'|'smoke'} kind
   * @param {{x:number,y:number,z:number}} origin
   * @param {number} yaw
   * @param {number} pitch
   * @returns {boolean}
   */
  throw(kind, origin, yaw, pitch) {
    const cfg = kind === 'smoke' ? THROWABLES.SMOKE : THROWABLES.FRAG;
    if (!cfg) return false;

    const speed = cfg.throwSpeed ?? 22;
    // Look vector (matches PlayerCamera YXZ: forward -Z)
    const cp = Math.cos(pitch);
    const dir = new THREE.Vector3(
      -Math.sin(yaw) * cp,
      Math.sin(pitch),
      -Math.cos(yaw) * cp
    ).normalize();
    // Slight lob
    dir.y += 0.12;
    dir.normalize();

    const color = kind === 'smoke' ? 0xc8c8c0 : 0x3a5a2a;
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.35,
        emissive: kind === 'frag' ? 0x1a2a10 : 0x222220,
        emissiveIntensity: 0.25,
      })
    );
    mesh.position.set(origin.x, origin.y, origin.z);
    mesh.castShadow = true;
    this.group.add(mesh);

    this.nades.push({
      kind,
      mesh,
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx: dir.x * speed,
      vy: dir.y * speed,
      vz: dir.z * speed,
      fuse: cfg.fuse ?? 2,
      bounce: cfg.bounce ?? 0.3,
      age: 0,
    });
    this.bus?.emit?.('nade:throw', { kind });
    return true;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    const gNade = THROWABLES.FRAG?.gravity ?? 19;
    const lim = WORLD.SIZE * 0.48;

    for (let i = this.nades.length - 1; i >= 0; i--) {
      const n = this.nades[i];
      n.age += dt;
      n.fuse -= dt;

      const grav = n.kind === 'smoke'
        ? (THROWABLES.SMOKE?.gravity ?? 17)
        : gNade;
      n.vy -= grav * dt;

      let nx = n.x + n.vx * dt;
      let ny = n.y + n.vy * dt;
      let nz = n.z + n.vz * dt;
      nx = Math.max(-lim, Math.min(lim, nx));
      nz = Math.max(-lim, Math.min(lim, nz));

      const ground = this.terrain.heightAt(nx, nz) + 0.08;
      if (ny < ground) {
        ny = ground;
        // Bounce
        if (Math.abs(n.vy) > 1.2) {
          n.vy = -n.vy * (n.bounce ?? 0.3);
          n.vx *= 0.72;
          n.vz *= 0.72;
        } else {
          n.vy = 0;
          n.vx *= 0.88;
          n.vz *= 0.88;
        }
      }

      n.x = nx;
      n.y = ny;
      n.z = nz;
      if (n.mesh) {
        n.mesh.position.set(n.x, n.y, n.z);
        n.mesh.rotation.x += dt * 8;
        n.mesh.rotation.z += dt * 5;
      }

      if (n.fuse <= 0) {
        this._detonate(n);
        if (n.mesh) {
          this.group.remove(n.mesh);
          n.mesh.geometry?.dispose?.();
          n.mesh.material?.dispose?.();
        }
        this.nades.splice(i, 1);
      }
    }

    // Smoke clouds
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      const s = this.smokes[i];
      s.life -= dt;
      if (s.mesh) {
        const u = Math.max(0, s.life / (s.maxLife || 16));
        s.mesh.scale.setScalar(0.85 + (1 - u) * 0.35);
        s.mesh.traverse((o) => {
          if (o.material?.opacity != null) {
            o.material.opacity = 0.15 + u * 0.45;
          }
        });
        s.mesh.position.y += dt * 0.15;
      }
      if (s.life <= 0) {
        if (s.mesh) {
          this.group.remove(s.mesh);
          s.mesh.traverse((o) => {
            o.geometry?.dispose?.();
            o.material?.dispose?.();
          });
        }
        this.smokes.splice(i, 1);
      }
    }
  }

  _detonate(n) {
    const pt = new THREE.Vector3(n.x, n.y, n.z);
    if (n.kind === 'smoke') {
      this._spawnSmoke(n.x, n.y, n.z);
      this.effects?.spawnMuzzleBloom?.(pt, 1.2);
      this.bus?.emit?.('nade:smoke', { x: n.x, y: n.y, z: n.z });
      return;
    }

    // Frag
    const cfg = THROWABLES.FRAG || {};
    const dmg = cfg.damage ?? 115;
    const splash = cfg.splash ?? 7.5;
    const inner = cfg.splashInner ?? 2.2;
    const selfMult = cfg.selfMult ?? 0.45;

    this.effects?.spawnExplosion?.(pt, 1.15);
    this.effects?.spawnImpact?.(pt, 'solid');
    this.bus?.emit?.('nade:frag', { x: n.x, y: n.y, z: n.z, splash, damage: dmg });

    const falloff = (dist) => {
      if (dist <= inner) return 1;
      if (dist >= splash) return 0;
      return 1 - (dist - inner) / (splash - inner);
    };

    const targets = typeof this._getTargets === 'function' ? (this._getTargets() || []) : [];
    for (const t of targets) {
      if (!t || t.dead) continue;
      const dist = Math.hypot((t.x ?? 0) - n.x, ((t.y ?? 0) + 1) - n.y, (t.z ?? 0) - n.z);
      if (dist > splash) continue;
      const applied = dmg * (0.35 + 0.65 * falloff(dist));
      if (applied <= 0) continue;
      if (typeof t.applyDamage === 'function') t.applyDamage(applied, 'chest');
      else if (t.health != null) {
        t.health -= applied;
        if (t.health <= 0) {
          t.health = 0;
          t.dead = true;
        }
      }
    }

    const p = typeof this._getPlayer === 'function' ? this._getPlayer() : null;
    if (p && (p.health ?? 0) > 0 && !p.dead) {
      const dist = Math.hypot((p.x ?? 0) - n.x, ((p.y ?? 0) + 1) - n.y, (p.z ?? 0) - n.z);
      if (dist <= splash) {
        let applied = dmg * (0.35 + 0.65 * falloff(dist)) * selfMult;
        if (p.armor > 0) {
          const abs = Math.min(p.armor, applied);
          p.armor -= abs;
          applied -= abs;
        }
        if (applied > 0) {
          if (typeof p.applyDamage === 'function') p.applyDamage(applied);
          else p.health = Math.max(0, p.health - applied);
          this.bus?.emit?.('player:damage', { amount: applied, source: 'grenade' });
        }
      }
    }
  }

  _spawnSmoke(x, y, z) {
    const cfg = THROWABLES.SMOKE || {};
    const r = cfg.radius ?? 8.5;
    const life = cfg.duration ?? 16;
    const g = new THREE.Group();
    g.position.set(x, y + 0.6, z);
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(r * (0.35 + i * 0.12), 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xb0b4b0,
          transparent: true,
          opacity: 0.35 - i * 0.04,
          depthWrite: false,
        })
      );
      s.position.set(
        (Math.random() - 0.5) * r * 0.4,
        i * 0.35,
        (Math.random() - 0.5) * r * 0.4
      );
      g.add(s);
    }
    this.group.add(g);
    this.smokes.push({
      x, y, z, r, life, maxLife: life, mesh: g,
    });
  }

  /** True if a world point is inside a live smoke cloud (blocks bot vision). */
  inSmoke(x, y, z) {
    for (const s of this.smokes) {
      const d = Math.hypot(x - s.x, z - s.z);
      if (d < s.r && Math.abs((y ?? 0) - s.y) < s.r * 0.85) return true;
    }
    return false;
  }

  dispose() {
    this.scene.remove(this.group);
    this.nades.length = 0;
    this.smokes.length = 0;
  }
}
