import { RARITY } from '../config.js';

// Weapon name, mag counter, reload bar, health/armor strips.

export class CombatHud {
  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'combat-hud';
    this.root.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:14',
      'pointer-events:none', 'font:600 13px/1.3 ui-monospace,Menlo,Consolas,monospace',
      'color:#e8ecf0', 'text-shadow:0 1px 2px #000',
    ].join(';');
    this.root.innerHTML = `
      <div id="ch-vitals" style="position:absolute;left:18px;bottom:18px;min-width:180px">
        <div style="margin-bottom:4px;opacity:0.7;font-size:11px">HEALTH</div>
        <div style="height:10px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.15);border-radius:3px;overflow:hidden">
          <div id="ch-hp" style="height:100%;width:100%;background:linear-gradient(90deg,#3d8f4a,#6dce5a)"></div>
        </div>
        <div style="margin:8px 0 4px;opacity:0.7;font-size:11px">ARMOR</div>
        <div style="height:8px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.12);border-radius:3px;overflow:hidden">
          <div id="ch-ar" style="height:100%;width:0%;background:linear-gradient(90deg,#3a6a9a,#6aafd0)"></div>
        </div>
      </div>
      <div id="ch-weapon" style="position:absolute;right:20px;bottom:18px;text-align:right;min-width:160px">
        <div id="ch-name" style="font-size:15px;letter-spacing:0.04em">—</div>
        <div id="ch-slots" style="font-size:11px;opacity:0.65;margin-top:2px"></div>
        <div id="ch-ammo" style="font-size:28px;margin-top:6px;letter-spacing:0.06em">
          <span id="ch-mag">0</span><span style="opacity:0.45;font-size:16px"> / <span id="ch-res">0</span></span>
        </div>
        <div id="ch-reload-wrap" style="margin-top:6px;height:6px;background:rgba(0,0,0,0.4);border-radius:2px;overflow:hidden;display:none">
          <div id="ch-reload" style="height:100%;width:0%;background:#7fd4ff"></div>
        </div>
        <div id="ch-reload-label" style="font-size:11px;color:#7fd4ff;margin-top:3px;display:none">RELOADING</div>
      </div>
      <div id="ch-range" style="position:absolute;left:50%;top:12px;transform:translateX(-50%);
        background:rgba(8,12,16,0.75);border:1px solid rgba(255,255,255,0.12);border-radius:6px;
        padding:6px 12px;font-size:11px;display:none"></div>
    `;
    document.body.appendChild(this.root);
    this._els = {
      hp: this.root.querySelector('#ch-hp'),
      ar: this.root.querySelector('#ch-ar'),
      name: this.root.querySelector('#ch-name'),
      slots: this.root.querySelector('#ch-slots'),
      mag: this.root.querySelector('#ch-mag'),
      res: this.root.querySelector('#ch-res'),
      reloadWrap: this.root.querySelector('#ch-reload-wrap'),
      reload: this.root.querySelector('#ch-reload'),
      reloadLabel: this.root.querySelector('#ch-reload-label'),
      range: this.root.querySelector('#ch-range'),
    };
  }

  setVisible(v) {
    this.root.style.display = v ? 'block' : 'none';
  }

  update(state, rangeStats = null) {
    if (!state) return;
    const rar = RARITY[state.rarity] || RARITY.common;
    this._els.name.textContent = state.name;
    this._els.name.style.color = `#${rar.color.toString(16).padStart(6, '0')}`;
    this._els.mag.textContent = String(state.mag);
    this._els.res.textContent = String(state.reserve);
    this._els.slots.textContent = `[1] ${state.slot0 ?? '—'}   [2] ${state.slot1 ?? '—'}`;

    this._els.hp.style.width = `${Math.max(0, Math.min(100, state.health))}%`;
    const arCap = 150;
    this._els.ar.style.width = `${Math.max(0, Math.min(100, (state.armor / arCap) * 100))}%`;

    if (state.reloading) {
      this._els.reloadWrap.style.display = 'block';
      this._els.reloadLabel.style.display = 'block';
      this._els.reload.style.width = `${Math.round(state.reloadFrac * 100)}%`;
    } else {
      this._els.reloadWrap.style.display = 'none';
      this._els.reloadLabel.style.display = 'none';
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
  }
}
