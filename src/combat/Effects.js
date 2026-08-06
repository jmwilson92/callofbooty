import * as THREE from 'three';
import { COMBAT } from '../config.js';

// Tracers, impact sparks, floating damage numbers, hitmarkers.

export class CombatEffects {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.name = 'fx';
    scene.add(this.group);

    this.tracers = [];
    this.impacts = [];
    this.numbers = [];
    this.hitmarker = { t: 0, head: false };

    // HUD hitmarker element
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

    this._lineGeo = new THREE.BufferGeometry();
    this._lineMat = new THREE.LineBasicMaterial({
      color: 0xffe0a0, transparent: true, opacity: 0.85, depthWidth: 1,
    });
  }

  spawnTracer(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const mat = this._lineMat.clone();
    mat.opacity = 0.9;
    const line = new THREE.Line(geo, mat);
    this.group.add(line);
    this.tracers.push({ line, mat, life: COMBAT.TRACER_LIFE });
  }

  spawnImpact(point, tag = 'solid') {
    const col = tag === 'thin' ? 0xc0c0c0 : tag === 'target' ? 0xff4040 : 0xb0a080;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: col })
    );
    mesh.position.copy(point);
    this.group.add(mesh);
    this.impacts.push({ mesh, life: 0.25 });
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
    this.numbers.push({ el, world: worldPos.clone(), life: COMBAT.DAMAGE_NUM_LIFE, max: COMBAT.DAMAGE_NUM_LIFE });
  }

  update(dt) {
    // Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      t.mat.opacity = Math.max(0, t.life / COMBAT.TRACER_LIFE);
      if (t.life <= 0) {
        this.group.remove(t.line);
        t.line.geometry.dispose();
        t.mat.dispose();
        this.tracers.splice(i, 1);
      }
    }
    // Impacts
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const p = this.impacts[i];
      p.life -= dt;
      p.mesh.scale.setScalar(1 + (0.25 - p.life) * 4);
      if (p.life <= 0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.impacts.splice(i, 1);
      }
    }
    // Hitmarker
    if (this.hitmarker.t > 0) {
      this.hitmarker.t -= dt;
      if (this.hitmarker.t <= 0) this.hmEl.style.opacity = '0';
    }
    // Damage numbers — project to screen
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
