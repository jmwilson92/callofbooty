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
  // Allow the play button to receive clicks; rest of overlay stays pass-through
  // via CSS on #hint (pointer-events: none) + button (pointer-events: auto).
  hint.innerHTML = `
    <h1>Call of Booty <small>— Phase 1</small></h1>
    <p class="lead">Click below (or anywhere) to lock the pointer and drop in.</p>
    <p class="lead" style="opacity:0.55;font-size:0.8rem;margin-top:-0.5rem">Esc pauses and returns here. Opening the map does not.</p>
    <button type="button" id="hint-play" class="hint-play">CLICK TO PLAY</button>
    <table>
      <tr><td>WASD</td><td>move</td></tr>
      <tr><td>Shift</td><td>sprint / heli descend</td></tr>
      <tr><td>Space</td><td>jump / heli ascend</td></tr>
      <tr><td>C</td><td>crouch</td></tr>
      <tr><td>E</td><td>shop / vehicle / loot / door</td></tr>
      <tr><td>V / T</td><td>heli gunner · map/free aim</td></tr>
      <tr><td>M</td><td>map · gold H+ = rearm · red = UAV pings</td></tr>
      <tr><td>Esc</td><td>pause (only way back to this screen)</td></tr>
    </table>
    <p class="err"></p>`;
  document.body.appendChild(hint);
  const err = hint.querySelector('.err');
  const playBtn = hint.querySelector('#hint-play');

  // Gunner mode badge (top-center) — only while in gunner seat
  const gunnerBadge = document.createElement('div');
  gunnerBadge.id = 'gunner-mode-badge';
  Object.assign(gunnerBadge.style, {
    position: 'fixed',
    top: '14px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '18',
    pointerEvents: 'none',
    display: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    font: '700 13px/1.25 ui-monospace, Menlo, Consolas, monospace',
    letterSpacing: '0.1em',
    textAlign: 'center',
    textShadow: '0 1px 3px rgba(0,0,0,0.85)',
    border: '2px solid rgba(255,255,255,0.25)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
  });
  document.body.appendChild(gunnerBadge);

  // Inline styles so the button always works even if CSS is stale
  if (playBtn) {
    Object.assign(playBtn.style, {
      pointerEvents: 'auto',
      cursor: 'pointer',
      margin: '0.5rem 0 1.2rem',
      padding: '14px 28px',
      font: '700 16px/1 ui-monospace, Menlo, Consolas, monospace',
      letterSpacing: '0.12em',
      color: '#0d1116',
      background: 'linear-gradient(180deg, #9ae0ff, #7fd4ff)',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 4px 24px rgba(127,212,255,0.45)',
      zIndex: '50',
    });
  }

  /** Once you've entered play, only Esc brings the menu back (not map unlock). */
  let hasEnteredPlay = false;
  let menuVisible = true;

  return {
    /**
     * @param {boolean} locked pointer currently locked
     * @param {{ forceMenu?: boolean, keepPlaying?: boolean }} [opts]
     *   forceMenu — Esc pause: show overlay
     *   keepPlaying — temporary unlock (map): hide menu, stay "in game"
     */
    setLocked(locked, opts = {}) {
      if (locked) {
        hasEnteredPlay = true;
        menuVisible = false;
        hint.style.display = 'none';
        cross.style.display = 'block';
        err.textContent = '';
        return;
      }
      // Unlocked
      cross.style.display = 'none';
      prompt.style.display = 'none';
      if (opts.keepPlaying && hasEnteredPlay) {
        // Map open etc. — do NOT show start/pause overlay
        menuVisible = false;
        hint.style.display = 'none';
        return;
      }
      // First load or Esc pause
      menuVisible = true;
      hint.style.display = 'flex';
      if (hasEnteredPlay) {
        const lead = hint.querySelector('.lead');
        if (lead) lead.textContent = 'Paused — click CLICK TO PLAY or press Enter to resume.';
        if (playBtn) playBtn.textContent = 'RESUME';
      }
    },
    setError(msg) {
      err.textContent = msg || '';
    },
    setPrompt(text) {
      if (!text) {
        prompt.style.display = 'none';
        return;
      }
      prompt.textContent = text;
      prompt.style.display = 'block';
    },
    /**
     * Gunner aim mode HUD.
     * @param {null|{ mode:'map'|'direct', target?: object|null, volleys?: number, flares?: number }} state
     */
    setGunnerMode(state) {
      if (!state) {
        gunnerBadge.style.display = 'none';
        return;
      }
      const isMap = state.mode === 'map';
      gunnerBadge.style.display = 'block';
      if (isMap) {
        gunnerBadge.style.background = 'rgba(40, 20, 8, 0.88)';
        gunnerBadge.style.borderColor = 'rgba(255, 180, 60, 0.85)';
        gunnerBadge.style.color = '#ffc040';
        const tgt = state.target
          ? ` · LOCK: ${(state.target.kind || 'target').toUpperCase()}${state.target.label ? ` ${state.target.label}` : ''}`
          : ' · click map (M) to lock target';
        gunnerBadge.innerHTML =
          `<div style="font-size:15px">MAP MODE</div>` +
          `<div style="font-size:11px;font-weight:600;opacity:0.9;margin-top:4px;letter-spacing:0.04em">Pin strike · loft if target is higher${tgt}</div>` +
          `<div style="font-size:10px;opacity:0.65;margin-top:5px">T · free aim · Rockets ${state.volleys ?? '—'}/8 · Flares ${state.flares ?? '—'}</div>`;
      } else {
        gunnerBadge.style.background = 'rgba(8, 28, 40, 0.88)';
        gunnerBadge.style.borderColor = 'rgba(100, 210, 255, 0.85)';
        gunnerBadge.style.color = '#7fd4ff';
        gunnerBadge.innerHTML =
          `<div style="font-size:15px">FREE AIM</div>` +
          `<div style="font-size:11px;font-weight:600;opacity:0.9;margin-top:4px;letter-spacing:0.04em">Dumbfire — straight from pods, hits first thing</div>` +
          `<div style="font-size:10px;opacity:0.65;margin-top:5px">T · map mode · Rockets ${state.volleys ?? '—'}/8 · Flares ${state.flares ?? '—'}</div>`;
      }
    },
    get menuOpen() {
      return menuVisible;
    },
    /** Wire the CLICK TO PLAY button to Input.requestLock */
    bindPlay(requestLockFn) {
      if (!playBtn) return;
      const go = (e) => {
        e.preventDefault();
        e.stopPropagation();
        requestLockFn?.();
      };
      playBtn.addEventListener('click', go);
      playBtn.addEventListener('pointerup', go);
      // Keyboard when menu is up
      window.addEventListener('keydown', (e) => {
        if (!menuVisible) return;
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          requestLockFn?.();
        }
      });
    },
  };
}
