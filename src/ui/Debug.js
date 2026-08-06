import { POIS } from '../config.js';
import { nearestPoi, poiContains } from '../world/Poi.js';

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
    const { poi: best, dist } = nearestPoi(POIS, x, z);
    if (!best) return '';
    if (dist <= 0.5 || poiContains(best, x, z)) return `${best.name} (inside)`;
    return `${best.name} ${dist.toFixed(0)}m away`;
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

  const prompt = document.createElement('div');
  prompt.id = 'interact-prompt';
  prompt.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:18%', 'transform:translateX(-50%)',
    'z-index:15', 'pointer-events:none', 'display:none',
    'padding:8px 14px', 'border-radius:6px',
    'background:rgba(8,12,16,0.78)', 'border:1px solid rgba(127,212,255,0.35)',
    'color:#e8ecf0', 'font:600 13px/1.2 ui-monospace,Menlo,Consolas,monospace',
    'letter-spacing:0.04em', 'text-shadow:0 1px 2px rgba(0,0,0,0.8)',
  ].join(';');
  document.body.appendChild(prompt);

  const hint = document.createElement('div');
  hint.id = 'hint';
  hint.innerHTML = `
    <h1>Call of Booty <small>— Phase 1</small></h1>
    <p class="lead">Click to lock the pointer and drop in.</p>
    <table>
      <tr><td>WASD</td><td>move</td></tr>
      <tr><td>Shift</td><td>sprint</td></tr>
      <tr><td>Space</td><td>jump / mantle</td></tr>
      <tr><td>C</td><td>crouch (not Ctrl — Ctrl+W closes the tab)</td></tr>
      <tr><td>E</td><td>vehicle / loot / door / elevator</td></tr>
      <tr><td>Shift+E</td><td>elevator / rappel express to TOP</td></tr>
      <tr><td>Rappel (gold)</td><td>W/S floor-by-floor · Shift+E or Shift+W express roof</td></tr>
      <tr><td>Zipline (blue)</td><td>E · ride between rooftops</td></tr>
      <tr><td>Heli pilot</td><td>WASD · Space up / C down · E bail (heli crashes)</td></tr>
      <tr><td>Heli gunner</td><td>V seat · T map/free aim · M click lock · LMB fire · G flares · X ECM</td></tr>
      <tr><td>Missiles</td><td>tubes → seek lock · roofs boom on top · free-aim = what’s ahead</td></tr>
      <tr><td>Rearm</td><td>land on Coronado NAS or MCRD gold pad (missiles + flares; fuel unlimited)</td></tr>
      <tr><td>Friends</td><td>top-left Host/Join room · npm run party on host machine</td></tr>
      <tr><td>LMB / RMB</td><td>fire / ADS (on foot)</td></tr>
      <tr><td>R · 1/2/Q</td><td>reload · weapon slots / swap</td></tr>
      <tr><td>P</td><td>test range</td></tr>
      <tr><td>Bots</td><td>squads of 4–5, smarter flanks (fair TTK)</td></tr>
      <tr><td>Sprint + C</td><td>slide</td></tr>
      <tr><td>M · F3 · Esc</td><td>map · perf · unlock</td></tr>
    </table>
    <p class="err"></p>`;
  document.body.appendChild(hint);
  const err = hint.querySelector('.err');

  return {
    setLocked(locked) {
      hint.style.display = locked ? 'none' : 'flex';
      cross.style.display = locked ? 'block' : 'none';
      if (!locked) prompt.style.display = 'none';
      if (locked) err.textContent = '';
    },
    setError(msg) {
      err.textContent = msg;
    },
    setPrompt(text) {
      if (!text) {
        prompt.style.display = 'none';
        return;
      }
      prompt.textContent = text;
      prompt.style.display = 'block';
    },
  };
}
