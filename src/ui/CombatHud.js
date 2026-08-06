import { RARITY } from '../config.js';

// Big, readable weapon + mag + reload UI.

export class CombatHud {
  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'combat-hud';
    this.root.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'top:0', 'z-index:14',
      'pointer-events:none',
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
      'color:#e8ecf0',
    ].join(';');

    this.root.innerHTML = `
      <style>
        #combat-hud .panel {
          background: linear-gradient(180deg, rgba(10,14,20,0.55), rgba(8,12,16,0.82));
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 10px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(6px);
        }
        #ch-ammo-big.empty { color: #ff5a4a; animation: chPulse 0.7s ease-in-out infinite; }
        #ch-ammo-big.low { color: #ffb040; }
        @keyframes chPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.04); }
        }
        #ch-reload-overlay {
          position: absolute; left: 50%; bottom: 22%; transform: translateX(-50%);
          min-width: 220px; padding: 12px 18px; text-align: center;
          display: none;
        }
        #ch-reload-bar-bg {
          height: 10px; margin-top: 8px; border-radius: 5px;
          background: rgba(0,0,0,0.5); border: 1px solid rgba(127,212,255,0.35);
          overflow: hidden;
        }
        #ch-reload-bar {
          height: 100%; width: 0%;
          background: linear-gradient(90deg, #3a9fd4, #7fd4ff);
          box-shadow: 0 0 12px rgba(127,212,255,0.6);
        }
        #ch-bullets {
          display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 3px;
          max-width: 220px; margin-left: auto; margin-top: 8px;
        }
        #ch-bullets i {
          display: block; width: 5px; height: 14px; border-radius: 1px;
          background: #d8e0e8; box-shadow: 0 0 4px rgba(200,220,255,0.35);
        }
        #ch-bullets i.off { background: rgba(255,255,255,0.12); box-shadow: none; }
        #ch-bullets i.low { background: #ffb040; }
        #ch-bullets i.empty { background: #ff4a3a; }
      </style>

      <!-- Vitals -->
      <div class="panel" style="position:absolute;left:16px;bottom:16px;padding:12px 14px;min-width:200px">
        <div style="font-size:10px;letter-spacing:0.14em;opacity:0.65;margin-bottom:5px">HEALTH</div>
        <div style="height:12px;background:rgba(0,0,0,0.45);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div id="ch-hp" style="height:100%;width:100%;background:linear-gradient(90deg,#2f7a3a,#6dce5a)"></div>
        </div>
        <div style="font-size:10px;letter-spacing:0.14em;opacity:0.65;margin:10px 0 5px">ARMOR</div>
        <div style="height:9px;background:rgba(0,0,0,0.45);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div id="ch-ar" style="height:100%;width:0%;background:linear-gradient(90deg,#2a5a8a,#6aafd0)"></div>
        </div>
      </div>

      <!-- Weapon panel -->
      <div class="panel" id="ch-weapon" style="position:absolute;right:16px;bottom:16px;padding:14px 16px 12px;min-width:240px;text-align:right">
        <div id="ch-rarity" style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;margin-bottom:2px">COMMON</div>
        <div id="ch-name" style="font-size:20px;font-weight:700;letter-spacing:0.04em;text-shadow:0 2px 8px rgba(0,0,0,0.8)">—</div>
        <div id="ch-slots" style="font-size:11px;opacity:0.6;margin-top:4px"></div>

        <div style="display:flex;align-items:flex-end;justify-content:flex-end;gap:10px;margin-top:10px">
          <div style="text-align:right">
            <div style="font-size:10px;letter-spacing:0.12em;opacity:0.55;margin-bottom:2px">MAG</div>
            <div id="ch-ammo-big" style="font-size:42px;font-weight:800;line-height:1;letter-spacing:0.04em;text-shadow:0 2px 10px rgba(0,0,0,0.75)">
              <span id="ch-mag">0</span>
            </div>
          </div>
          <div style="padding-bottom:6px;opacity:0.5;font-size:18px">/</div>
          <div style="text-align:left;padding-bottom:4px">
            <div style="font-size:10px;letter-spacing:0.12em;opacity:0.55;margin-bottom:2px">RESERVE</div>
            <div id="ch-res" style="font-size:22px;font-weight:700;opacity:0.85">0</div>
          </div>
        </div>

        <div id="ch-bullets"></div>

        <div id="ch-reload-inline" style="display:none;margin-top:10px">
          <div style="font-size:11px;color:#7fd4ff;letter-spacing:0.14em;margin-bottom:4px">RELOADING MAG…</div>
          <div style="height:8px;background:rgba(0,0,0,0.5);border-radius:4px;overflow:hidden;border:1px solid rgba(127,212,255,0.3)">
            <div id="ch-reload" style="height:100%;width:0%;background:linear-gradient(90deg,#3a9fd4,#7fd4ff);box-shadow:0 0 10px rgba(127,212,255,0.5)"></div>
          </div>
        </div>
        <div id="ch-empty-hint" style="display:none;margin-top:10px;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#ff6a5a">
          PRESS R · RELOAD MAG
        </div>
      </div>

      <!-- Center reload banner -->
      <div class="panel" id="ch-reload-overlay">
        <div style="font-size:13px;letter-spacing:0.2em;color:#7fd4ff;font-weight:700">RELOADING</div>
        <div id="ch-reload-overlay-name" style="font-size:12px;opacity:0.7;margin-top:2px"></div>
        <div id="ch-reload-bar-bg"><div id="ch-reload-bar"></div></div>
      </div>

      <div id="ch-range" class="panel" style="position:absolute;left:50%;top:12px;transform:translateX(-50%);
        padding:7px 14px;font-size:11px;display:none"></div>

      <!-- Sniper / DMR scope: black ring + mildot crosshairs -->
      <div id="ch-scope" style="
        position:absolute;inset:0;display:none;pointer-events:none;
        background: radial-gradient(circle at center,
          transparent 0%, transparent 28%,
          rgba(0,0,0,0.55) 32%, rgba(0,0,0,0.92) 38%, #000 42%);
      ">
        <svg id="ch-scope-reticle" width="100%" height="100%" style="position:absolute;inset:0">
          <g stroke="#1a1a1a" stroke-width="1.2" opacity="0.85">
            <line x1="50%" y1="35%" x2="50%" y2="65%" />
            <line x1="35%" y1="50%" x2="65%" y2="50%" />
          </g>
          <g stroke="#c8d0d8" stroke-width="1" opacity="0.7">
            <line x1="50%" y1="38%" x2="50%" y2="47%" />
            <line x1="50%" y1="53%" x2="50%" y2="62%" />
            <line x1="38%" y1="50%" x2="47%" y2="50%" />
            <line x1="53%" y1="50%" x2="62%" y2="50%" />
            <!-- mildots -->
            <circle cx="50%" cy="46%" r="1.5" fill="#c8d0d8" />
            <circle cx="50%" cy="54%" r="1.5" fill="#c8d0d8" />
            <circle cx="46%" cy="50%" r="1.5" fill="#c8d0d8" />
            <circle cx="54%" cy="50%" r="1.5" fill="#c8d0d8" />
          </g>
          <circle cx="50%" cy="50%" r="2" fill="#ff3030" opacity="0.9" />
        </svg>
      </div>
    `;
    document.body.appendChild(this.root);

    this._els = {
      hp: this.root.querySelector('#ch-hp'),
      ar: this.root.querySelector('#ch-ar'),
      name: this.root.querySelector('#ch-name'),
      rarity: this.root.querySelector('#ch-rarity'),
      slots: this.root.querySelector('#ch-slots'),
      mag: this.root.querySelector('#ch-mag'),
      ammoBig: this.root.querySelector('#ch-ammo-big'),
      res: this.root.querySelector('#ch-res'),
      bullets: this.root.querySelector('#ch-bullets'),
      reloadInline: this.root.querySelector('#ch-reload-inline'),
      reload: this.root.querySelector('#ch-reload'),
      reloadOverlay: this.root.querySelector('#ch-reload-overlay'),
      reloadBar: this.root.querySelector('#ch-reload-bar'),
      reloadOverlayName: this.root.querySelector('#ch-reload-overlay-name'),
      emptyHint: this.root.querySelector('#ch-empty-hint'),
      range: this.root.querySelector('#ch-range'),
      scope: this.root.querySelector('#ch-scope'),
    };
    this._lastMagKey = '';
  }

  setVisible(v) {
    this.root.style.display = v ? 'block' : 'none';
  }

  _renderBullets(mag, magSize) {
    const key = `${mag}/${magSize}`;
    if (key === this._lastMagKey) return;
    this._lastMagKey = key;
    const el = this._els.bullets;
    el.innerHTML = '';
    // Cap visual bullets so huge LMG mags don't explode the HUD
    const maxIcons = Math.min(magSize, 40);
    const filled = magSize <= 40 ? mag : Math.round((mag / magSize) * maxIcons);
    const low = magSize > 0 && mag / magSize <= 0.25;
    const empty = mag <= 0;
    for (let i = 0; i < maxIcons; i++) {
      const b = document.createElement('i');
      if (i >= filled) b.classList.add('off');
      else if (empty) b.classList.add('empty');
      else if (low) b.classList.add('low');
      el.appendChild(b);
    }
  }

  update(state, rangeStats = null) {
    if (!state) return;
    const rar = RARITY[state.rarity] || RARITY.common;
    const hex = `#${rar.color.toString(16).padStart(6, '0')}`;

    this._els.name.textContent = state.name;
    this._els.name.style.color = hex;
    this._els.rarity.textContent = rar.label;
    this._els.rarity.style.color = hex;

    this._els.mag.textContent = String(state.mag);
    this._els.res.textContent = String(state.reserve);

    const active = state.slot;
    const s0 = state.slot0 ?? '—';
    const s1 = state.slot1 ?? '—';
    this._els.slots.innerHTML =
      `<span style="opacity:${active === 0 ? 1 : 0.45}">[1] ${s0}</span>` +
      `&nbsp;&nbsp;` +
      `<span style="opacity:${active === 1 ? 1 : 0.45}">[2] ${s1}</span>`;

    // Mag color state
    this._els.ammoBig.classList.remove('empty', 'low');
    if (state.mag <= 0) this._els.ammoBig.classList.add('empty');
    else if (state.magSize > 0 && state.mag / state.magSize <= 0.25) {
      this._els.ammoBig.classList.add('low');
    }

    this._renderBullets(state.mag, state.magSize);

    this._els.hp.style.width = `${Math.max(0, Math.min(100, state.health))}%`;
    this._els.ar.style.width = `${Math.max(0, Math.min(100, (state.armor / 150) * 100))}%`;

    if (state.reloading) {
      const pct = Math.round(state.reloadFrac * 100);
      this._els.reloadInline.style.display = 'block';
      this._els.reload.style.width = `${pct}%`;
      this._els.reloadOverlay.style.display = 'block';
      this._els.reloadBar.style.width = `${pct}%`;
      this._els.reloadOverlayName.textContent = `${state.name}  ·  mag ${state.mag} → ${state.magSize}`;
      this._els.emptyHint.style.display = 'none';
    } else {
      this._els.reloadInline.style.display = 'none';
      this._els.reloadOverlay.style.display = 'none';
      // Empty mag cue
      this._els.emptyHint.style.display =
        (state.mag <= 0 && state.reserve > 0) ? 'block' : 'none';
    }

    if (rangeStats) {
      this._els.range.style.display = 'block';
      const acc = rangeStats.shots > 0
        ? ((rangeStats.hits / rangeStats.shots) * 100).toFixed(0)
        : '—';
      this._els.range.textContent =
        `TEST RANGE  ·  shots ${rangeStats.shots}  hits ${rangeStats.hits}  ` +
        `acc ${acc}%  dmg ${rangeStats.damage.toFixed(0)}  HS ${rangeStats.headshots}  ·  P to clear`;
    } else {
      this._els.range.style.display = 'none';
    }

    // Scope overlay (sniper / DMR when ADS)
    if (this._els.scope) {
      const show = !!(state.scopeOverlay && state.ads > 0.55);
      this._els.scope.style.display = show ? 'block' : 'none';
      if (show) {
        const a = Math.min(1, (state.ads - 0.55) / 0.45);
        this._els.scope.style.opacity = String(a);
      }
    }
  }
}
