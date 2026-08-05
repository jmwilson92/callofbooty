import { POIS } from '../config.js';

// F3 overlay: frame rate, draw calls, triangles, and player state.
export class DebugOverlay {
  constructor(renderer) {
    this.renderer = renderer;
    this.visible = false;

    this.el = document.createElement('div');
    this.el.id = 'debug-overlay';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    this.frames = 0;
    this.fps = 0;
    this.minFps = Infinity;
    this.accum = 0;
    this._sampleGrace = 1.5; // ignore the first moments, they include warm-up
  }

  toggle() {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'block' : 'none';
  }

  nearestPoi(x, z) {
    let best = null;
    let bestD = Infinity;
    for (const p of POIS) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best && bestD < best.radius * 1.6 ? `${best.name} (${bestD.toFixed(0)}m)` : `${best.name} ${bestD.toFixed(0)}m away`;
  }

  update(dt, controller, extra = {}) {
    this.frames++;
    this.accum += dt;
    if (this._sampleGrace > 0) this._sampleGrace -= dt;

    if (this.accum >= 0.5) {
      this.fps = this.frames / this.accum;
      if (this._sampleGrace <= 0) this.minFps = Math.min(this.minFps, this.fps);
      this.frames = 0;
      this.accum = 0;
    }

    if (!this.visible) return;

    const info = this.renderer.info;
    const p = controller.pos;
    const state = controller.mantling ? 'MANTLE'
      : controller.sliding ? 'SLIDE'
      : !controller.grounded ? 'AIR'
      : controller.sprinting ? 'SPRINT'
      : controller.crouching ? 'CROUCH'
      : controller.speed > 0.3 ? 'WALK' : 'IDLE';

    this.el.innerHTML = `
      <div class="dbg-row"><b>${this.fps.toFixed(0)} FPS</b> <span class="dim">min ${
        this.minFps === Infinity ? '-' : this.minFps.toFixed(0)}</span></div>
      <div class="dbg-row">draws <b>${info.render.calls}</b> · tris <b>${(info.render.triangles / 1000).toFixed(0)}k</b></div>
      <div class="dbg-row">geom ${info.memory.geometries} · tex ${info.memory.textures}</div>
      <hr/>
      <div class="dbg-row">pos ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}</div>
      <div class="dbg-row">speed <b>${controller.speed.toFixed(2)}</b> m/s · vy ${controller.vel.y.toFixed(2)}</div>
      <div class="dbg-row">state <b>${state}</b> · h ${controller.height.toFixed(2)}</div>
      <div class="dbg-row">${this.nearestPoi(p.x, p.z)}</div>
      <hr/>
      <div class="dbg-row dim">static AABBs ${extra.aabbs ?? '-'} · props ${extra.props ?? '-'}</div>
      <div class="dbg-row dim">seed ${extra.seed ?? '-'}</div>
    `;
  }
}

// Minimal always-on HUD: crosshair plus the controls hint before pointer lock.
export function createHud() {
  const cross = document.createElement('div');
  cross.id = 'crosshair';
  cross.innerHTML = '<span></span><span></span>';
  document.body.appendChild(cross);

  const hint = document.createElement('div');
  hint.id = 'hint';
  hint.innerHTML = `
    <h1>Call of Booty <small>— Phase 1</small></h1>
    <p class="lead">Click to lock the pointer and drop in.</p>
    <table>
      <tr><td>WASD</td><td>move</td></tr>
      <tr><td>Shift</td><td>sprint</td></tr>
      <tr><td>Space</td><td>jump / mantle</td></tr>
      <tr><td>C or Ctrl</td><td>crouch</td></tr>
      <tr><td>Sprint + C</td><td>slide (jump to cancel and keep your speed)</td></tr>
      <tr><td>F3</td><td>performance overlay</td></tr>
      <tr><td>Esc</td><td>release pointer</td></tr>
    </table>`;
  document.body.appendChild(hint);

  return {
    setLocked(locked) {
      hint.style.display = locked ? 'none' : 'block';
      cross.style.display = locked ? 'block' : 'none';
    },
  };
}
