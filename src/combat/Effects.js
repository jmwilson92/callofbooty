import * as THREE from 'three';
import { COMBAT } from '../config.js';

// Tracers, ballistic bullet meshes, impact sparks, brass, hitmarkers, damage numbers.

export class CombatEffects {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.name = 'fx';
    scene.add(this.group);

    this.tracers = [];
    this.impacts = [];
    this.casings = [];
    this.numbers = [];
    this.hitmarker = { t: 0, head: false };

    this.hmEl = document.createElement('div');
    this.hmEl.id = 'hitmarker';
    this.hmEl.style.cssText = [
      'position:fixed', 'left:50%', 'top:50%', 'transform:translate(-50%,-50%)',
      'width:18px', 'height:18px', 'pointer-events:none', 'z-index:12',
      'opacity:0', 'transition:opacity 0.05s',
    ].join(';');
    this.hmEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M2 2 L7 7 M16 2 L11 7 M2 16 L7 11 M16 16 L11 11"
          stroke="#fff" stroke-width="2" fill="none" id="hm-path"/>
      </svg>`;
    document.body.appendChild(this.hmEl);

    this.dmgLayer = document.createElement('div');
    this.dmgLayer.id = 'dmg-numbers';
    this.dmgLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:11;overflow:hidden';
    document.body.appendChild(this.dmgLayer);

    this._lineMat = new THREE.LineBasicMaterial({
      color: 0xffe0a0, transparent: true, opacity: 0.55, linewidth: 1,
    });
    this._brassGeo = new THREE.CylinderGeometry(0.004, 0.0045, 0.018, 5);
    this._brassMat = new THREE.MeshStandardMaterial({
      color: 0xc4a050, metalness: 0.85, roughness: 0.35, emissive: 0x221100, emissiveIntensity: 0.15,
    });
    this._bulletGeo = new THREE.SphereGeometry(0.05, 6, 6);
    this._flashLight = new THREE.PointLight(0xffcc88, 0, 12, 2);
    this.group.add(this._flashLight);
    this._flashLightT = 0;
  }

  /**
   * In-flight trail. Sniper/DMR: bright + long life so drop/arc is visible.
   * @param {{ bright?: boolean, life?: number }} opts
   */
  spawnBallisticTrace(from, to, opts = {}) {
    if (!from || !to) return;
    if (from.distanceToSquared(to) < 1e-5) return;
    const bright = !!opts.bright;
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const mat = this._lineMat.clone();
    mat.opacity = bright ? 0.92 : 0.5;
    mat.color = new THREE.Color(bright ? 0xffe090 : 0xfff0c0);
    const line = new THREE.Line(geo, mat);
    this.group.add(line);
    this.tracers.push({ line, mat, life: opts.life ?? (bright ? 0.45 : 0.1) });
  }

  /** Glowing projectile head that rides the bullet through the world. */
  createBulletMesh(bright = false) {
    const mat = new THREE.MeshBasicMaterial({
      color: bright ? 0xfff2a8 : 0xffe8c0,
      transparent: true,
      opacity: bright ? 1 : 0.8,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this._bulletGeo, mat);
    mesh.scale.setScalar(bright ? 1.8 : 1.0);
    mesh.frustumCulled = false;
    this.group.add(mesh);
    return mesh;
  }

  releaseBulletMesh(mesh) {
    if (!mesh) return;
    this.group.remove(mesh);
    if (mesh.material) mesh.material.dispose();
  }

  /** World-space muzzle bloom (all weapons, including sniper/DMR). */
  spawnMuzzleBloom(worldPos, power = 1) {
    this._flashLight.position.copy(worldPos);
    this._flashLight.intensity = 6 * power;
    this._flashLightT = 0.08 + 0.05 * power;
  }

  /**
   * Muzzle flash streak along aim — always centerline (no side offset).
   * @param {{ long?: boolean }} opts
   */
  spawnTracer(from, to, opts = {}) {
    const dir = to.clone().sub(from);
    const len = dir.length();
    if (len < 0.2) return;
    dir.normalize();
    const maxLen = opts.long ? 55 : 18;
    const start = len > maxLen ? from.clone().addScaledVector(dir, len - maxLen) : from.clone();
    const geo = new THREE.BufferGeometry().setFromPoints([start, to.clone()]);
    const mat = this._lineMat.clone();
    mat.opacity = opts.long ? 0.9 : 0.55;
    mat.color = new THREE.Color(opts.long ? 0xffe090 : 0xffe0a0);
    const line = new THREE.Line(geo, mat);
    this.group.add(line);
    this.tracers.push({ line, mat, life: opts.long ? 0.25 : COMBAT.TRACER_LIFE * 0.9 });
  }

  /** Tiny impact spark. */
  spawnImpact(point, tag = 'solid') {
    const col = tag === 'thin' ? 0xc0c0c0 : tag === 'target' ? 0xff5050 : 0xc8b890;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 5, 5),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 })
    );
    mesh.position.copy(point);
    this.group.add(mesh);
    this.impacts.push({ mesh, life: 0.14, max: 0.14 });
  }

  spawnCasing(origin, right, up, forward) {
    if (this.casings.length > 24) {
      const old = this.casings.shift();
      this.group.remove(old.mesh);
    }
    const mesh = new THREE.Mesh(this._brassGeo, this._brassMat);
    mesh.position.copy(origin);
    mesh.position.addScaledVector(right, 0.08);
    mesh.position.addScaledVector(up, 0.02);
    mesh.position.addScaledVector(forward, -0.05);
    this.group.add(mesh);
    const vel = new THREE.Vector3()
      .addScaledVector(right, 1.6 + Math.random() * 0.8)
      .addScaledVector(up, 0.9 + Math.random() * 0.5)
      .addScaledVector(forward, -0.3 + Math.random() * 0.2);
    const spin = new THREE.Vector3(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 18
    );
    this.casings.push({ mesh, vel, spin, life: 0.55 });
  }

  showHitmarker(headshot) {
    this.hitmarker.t = COMBAT.HITMARKER_TIME;
    this.hitmarker.head = headshot;
    const path = this.hmEl.querySelector('#hm-path');
    if (path) path.setAttribute('stroke', headshot ? '#ff4040' : '#ffffff');
    this.hmEl.style.opacity = '1';
  }

  spawnDamageNumber(worldPos, amount, headshot) {
    const el = document.createElement('div');
    el.textContent = String(Math.round(amount));
    el.style.cssText = [
      'position:absolute', 'transform:translate(-50%,-50%)',
      'font:700 14px/1 ui-monospace,Menlo,monospace',
      `color:${headshot ? '#ff6060' : '#ffe8a0'}`,
      'text-shadow:0 1px 2px #000', 'opacity:1', 'pointer-events:none',
    ].join(';');
    this.dmgLayer.appendChild(el);
    this.numbers.push({
      el, world: worldPos.clone(), life: COMBAT.DAMAGE_NUM_LIFE, max: COMBAT.DAMAGE_NUM_LIFE,
    });
  }

  update(dt) {
    if (this._flashLightT > 0) {
      this._flashLightT -= dt;
      this._flashLight.intensity = Math.max(0, this._flashLight.intensity - dt * 70);
      if (this._flashLightT <= 0) this._flashLight.intensity = 0;
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      const maxL = t.life + dt;
      t.mat.opacity = Math.max(0, t.mat.opacity * (t.life / Math.max(1e-4, maxL)));
      if (t.life <= 0) {
        this.group.remove(t.line);
        t.line.geometry.dispose();
        t.mat.dispose();
        this.tracers.splice(i, 1);
      }
    }
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const p = this.impacts[i];
      p.life -= dt;
      const u = 1 - p.life / p.max;
      p.mesh.scale.setScalar(1 + u * 1.5);
      p.mesh.material.opacity = Math.max(0, 1 - u);
      if (p.life <= 0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.impacts.splice(i, 1);
      }
    }
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.life -= dt;
      c.vel.y -= 12 * dt;
      c.mesh.position.addScaledVector(c.vel, dt);
      c.mesh.rotation.x += c.spin.x * dt;
      c.mesh.rotation.y += c.spin.y * dt;
      c.mesh.rotation.z += c.spin.z * dt;
      if (c.life <= 0) {
        this.group.remove(c.mesh);
        this.casings.splice(i, 1);
      }
    }
    if (this.hitmarker.t > 0) {
      this.hitmarker.t -= dt;
      if (this.hitmarker.t <= 0) this.hmEl.style.opacity = '0';
    }
    const cam = this.camera;
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.life -= dt;
      n.world.y += dt * 0.8;
      const v = n.world.clone().project(cam);
      const x = (v.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
      n.el.style.left = `${x}px`;
      n.el.style.top = `${y}px`;
      n.el.style.opacity = String(Math.max(0, n.life / n.max));
      if (n.life <= 0 || v.z > 1) {
        n.el.remove();
        this.numbers.splice(i, 1);
      }
    }
  }
}
