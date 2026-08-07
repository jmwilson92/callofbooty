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
      <div class="panel" style="position:absolute;left:16px;bottom:16px;padding:12px 14px;min-width:210px">
        <div style="font-size:10px;letter-spacing:0.14em;opacity:0.65;margin-bottom:5px">HEALTH</div>
        <div style="height:12px;background:rgba(0,0,0,0.45);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div id="ch-hp" style="height:100%;width:100%;background:linear-gradient(90deg,#2f7a3a,#6dce5a)"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin:10px 0 5px">
          <div style="font-size:10px;letter-spacing:0.14em;opacity:0.65">ARMOR</div>
          <div id="ch-plates" style="font-size:11px;font-weight:700;color:#8ec8e8;letter-spacing:0.04em">3 · 0 plates</div>
        </div>
        <div style="height:9px;background:rgba(0,0,0,0.45);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div id="ch-ar" style="height:100%;width:0%;background:linear-gradient(90deg,#2a5a8a,#6aafd0)"></div>
        </div>
        <div id="ch-plate-ch" style="display:none;margin-top:6px">
          <div style="font-size:10px;color:#7fd4ff;letter-spacing:0.1em;margin-bottom:3px">INSERTING PLATE…</div>
          <div style="height:6px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;border:1px solid rgba(127,212,255,0.35)">
            <div id="ch-plate-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#3a9fd4,#9fe0ff)"></div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;gap:8px;margin-top:8px;font-size:11px;font-weight:700;letter-spacing:0.04em">
          <div id="ch-bandages" style="color:#e8c8a0">6 · 0 band</div>
          <div id="ch-medkits" style="color:#a0e8c8">7 · 0 kit</div>
        </div>
        <div id="ch-heal-ch" style="display:none;margin-top:6px">
          <div id="ch-heal-label" style="font-size:10px;color:#a0e8a0;letter-spacing:0.1em;margin-bottom:3px">HEALING…</div>
          <div style="height:6px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;border:1px solid rgba(160,232,160,0.35)">
            <div id="ch-heal-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#2f7a3a,#6dce5a)"></div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin:10px 0 5px">
          <div style="font-size:10px;letter-spacing:0.14em;opacity:0.65">HELMET</div>
          <div id="ch-helm-lbl" style="font-size:10px;opacity:0.55">—</div>
        </div>
        <div style="height:7px;background:rgba(0,0,0,0.45);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
          <div id="ch-helm" style="height:100%;width:0%;background:linear-gradient(90deg,#6a5a2a,#e0c060)"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px">
          <div style="font-size:10px;letter-spacing:0.14em;opacity:0.65">CASH</div>
          <div id="ch-cash" style="font-size:16px;font-weight:700;color:#ffe080;letter-spacing:0.04em">$0</div>
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
        <div id="ch-gear" style="margin-top:10px;font-size:11px;opacity:0.9;line-height:1.45;text-align:right">
          <span style="opacity:0.55">G</span> <span id="ch-frag">0</span>
          &nbsp;·&nbsp;
          <span style="opacity:0.55">F</span> <span id="ch-smoke">0</span>
          &nbsp;·&nbsp;
          <span style="opacity:0.55">4</span> <span id="ch-uav">—</span>
          &nbsp;·&nbsp;
          <span style="opacity:0.55">5</span> <span id="ch-stim">0</span>
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

      <!-- Battle royale: squad pressure + gas circle -->
      <div id="ch-br" class="panel" style="position:absolute;top:12px;right:16px;padding:10px 12px;min-width:168px;text-align:right;display:none">
        <div style="font-size:10px;letter-spacing:0.14em;opacity:0.6;margin-bottom:4px">BATTLE ROYALE</div>
        <div id="ch-br-alive" style="font-size:14px;font-weight:700;color:#7fd4ff">—</div>
        <div id="ch-br-kills" style="font-size:13px;font-weight:700;color:#ffc060;margin-top:4px;letter-spacing:0.06em">KILLS 0</div>
        <div id="ch-br-zone" style="font-size:11px;opacity:0.85;margin-top:6px;line-height:1.35">Zone —</div>
        <div id="ch-br-gas" style="font-size:11px;font-weight:700;color:#ff6a5a;margin-top:6px;display:none">IN THE GAS</div>
      </div>

      <!-- Full-screen gas vignette when taking zone damage -->
      <div id="ch-gas-fx" style="
        position:absolute;inset:0;display:none;pointer-events:none;z-index:5;
        background: radial-gradient(circle at center,
          transparent 35%,
          rgba(20, 90, 110, 0.18) 55%,
          rgba(10, 50, 70, 0.55) 78%,
          rgba(0, 30, 40, 0.75) 100%);
        box-shadow: inset 0 0 80px rgba(0, 180, 220, 0.35);
      ">
        <div id="ch-gas-fx-label" style="
          position:absolute;left:50%;top:14%;transform:translateX(-50%);
          padding:10px 18px;border-radius:8px;
          background:rgba(8,20,28,0.85);border:1px solid rgba(100,220,255,0.55);
          color:#9ae8ff;font:700 14px/1.3 ui-monospace,monospace;letter-spacing:0.12em;
          text-shadow:0 0 12px rgba(100,220,255,0.6);
        ">⚠ GAS · GET INSIDE THE CIRCLE</div>
      </div>

      <!-- Scope look-through: large clear center so peripherals stay visible -->
      <div id="ch-scope" style="
        position:absolute;inset:0;display:none;pointer-events:none;
        background: radial-gradient(circle at center,
          transparent 0%, transparent 48%,
          rgba(0,0,0,0.25) 56%, rgba(0,0,0,0.7) 68%, rgba(0,0,0,0.92) 78%);
      ">
        <svg id="ch-scope-reticle" width="100%" height="100%" style="position:absolute;inset:0">
          <g id="ch-scope-marks" stroke="#d0d8e0" stroke-width="1" opacity="0.8">
            <line x1="50%" y1="38%" x2="50%" y2="47%" />
            <line x1="50%" y1="53%" x2="50%" y2="62%" />
            <line x1="38%" y1="50%" x2="47%" y2="50%" />
            <line x1="53%" y1="50%" x2="62%" y2="50%" />
            <circle cx="50%" cy="46%" r="1.2" fill="#d0d8e0" />
            <circle cx="50%" cy="54%" r="1.2" fill="#d0d8e0" />
            <circle cx="46%" cy="50%" r="1.2" fill="#d0d8e0" />
            <circle cx="54%" cy="50%" r="1.2" fill="#d0d8e0" />
          </g>
          <circle cx="50%" cy="50%" r="1.6" fill="#ff3030" opacity="0.95" />
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
      br: this.root.querySelector('#ch-br'),
      brAlive: this.root.querySelector('#ch-br-alive'),
      brKills: this.root.querySelector('#ch-br-kills'),
      brZone: this.root.querySelector('#ch-br-zone'),
      brGas: this.root.querySelector('#ch-br-gas'),
      gasFx: this.root.querySelector('#ch-gas-fx'),
      gasFxLabel: this.root.querySelector('#ch-gas-fx-label'),
      cash: this.root.querySelector('#ch-cash'),
      plates: this.root.querySelector('#ch-plates'),
      plateCh: this.root.querySelector('#ch-plate-ch'),
      plateBar: this.root.querySelector('#ch-plate-bar'),
      bandages: this.root.querySelector('#ch-bandages'),
      medkits: this.root.querySelector('#ch-medkits'),
      healCh: this.root.querySelector('#ch-heal-ch'),
      healBar: this.root.querySelector('#ch-heal-bar'),
      healLabel: this.root.querySelector('#ch-heal-label'),
      helm: this.root.querySelector('#ch-helm'),
      helmLbl: this.root.querySelector('#ch-helm-lbl'),
      frag: this.root.querySelector('#ch-frag'),
      smoke: this.root.querySelector('#ch-smoke'),
      uav: this.root.querySelector('#ch-uav'),
      stim: this.root.querySelector('#ch-stim'),
    };
    this._lastMagKey = '';
    this._gasPulse = 0;

    // Damage toast (bot fire was previously invisible)
    this._dmgToast = document.createElement('div');
    this._dmgToast.id = 'ch-dmg-toast';
    Object.assign(this._dmgToast.style, {
      position: 'absolute',
      left: '50%',
      top: '28%',
      transform: 'translateX(-50%)',
      padding: '10px 16px',
      borderRadius: '8px',
      background: 'rgba(40,8,8,0.88)',
      border: '1px solid rgba(255,80,80,0.65)',
      color: '#ff8a7a',
      font: '700 15px/1.2 ui-monospace, monospace',
      letterSpacing: '0.08em',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '20',
      textShadow: '0 0 12px rgba(255,40,40,0.5)',
    });
    this.root.appendChild(this._dmgToast);

    this._dmgVignette = document.createElement('div');
    Object.assign(this._dmgVignette.style, {
      position: 'absolute',
      inset: '0',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '4',
      background: 'radial-gradient(circle at center, transparent 40%, rgba(120,0,0,0.45) 100%)',
    });
    this.root.appendChild(this._dmgVignette);
  }

  /**
   * Brief cash pickup feedback.
   * @param {number} amount
   * @param {number} [total]
   */
  flashCash(amount, total) {
    if (this._els.cash) {
      this._els.cash.textContent = `$${Math.max(0, (total ?? 0) | 0)}`;
      this._els.cash.style.color = '#fff0a0';
      this._els.cash.style.textShadow = '0 0 12px rgba(255, 220, 80, 0.8)';
      clearTimeout(this._cashFlashT);
      this._cashFlashT = setTimeout(() => {
        if (this._els.cash) {
          this._els.cash.style.color = '#ffe080';
          this._els.cash.style.textShadow = 'none';
        }
      }, 450);
    }
    this._dmgToast.textContent = `+$${Math.round(amount)}  CASH`;
    this._dmgToast.style.display = 'block';
    this._dmgToast.style.background = 'rgba(28, 24, 8, 0.9)';
    this._dmgToast.style.borderColor = 'rgba(255, 210, 80, 0.7)';
    this._dmgToast.style.color = '#ffe080';
    clearTimeout(this._dmgToastT);
    this._dmgToastT = setTimeout(() => {
      this._dmgToast.style.display = 'none';
      this._dmgToast.style.background = 'rgba(40,8,8,0.88)';
      this._dmgToast.style.borderColor = 'rgba(255,80,80,0.65)';
      this._dmgToast.style.color = '#ff8a7a';
    }, 700);
  }

  /**
   * Show a clear hit indicator (bots used to drain HP with zero feedback).
   * @param {number} amount
   * @param {string} source
   */
  flashDamage(amount, source = 'DAMAGE') {
    if (source === 'HELMET' || (amount <= 0 && source === 'HELMET')) {
      this._dmgToast.textContent = 'HELMET BLOCK';
      this._dmgToast.style.display = 'block';
      this._dmgToast.style.color = '#e0c060';
      clearTimeout(this._dmgToastT);
      this._dmgToastT = setTimeout(() => {
        this._dmgToast.style.display = 'none';
        this._dmgToast.style.color = '';
      }, 650);
      return;
    }
    const a = Math.max(1, Math.round(amount));
    this._dmgToast.textContent = `−${a}  ${source}`;
    this._dmgToast.style.display = 'block';
    this._dmgVignette.style.display = 'block';
    if (this._els.hp) {
      this._els.hp.style.background = 'linear-gradient(90deg,#5a1010,#ff4040)';
    }
    clearTimeout(this._dmgToastT);
    clearTimeout(this._dmgVigT);
    this._dmgToastT = setTimeout(() => {
      this._dmgToast.style.display = 'none';
    }, 700);
    this._dmgVigT = setTimeout(() => {
      this._dmgVignette.style.display = 'none';
      if (this._els.hp) {
        this._els.hp.style.background = 'linear-gradient(90deg,#2f7a3a,#6dce5a)';
      }
    }, 180);
  }

  /**
   * @param {object|null} br match.hudState()
   */
  setBr(br) {
    const el = this._els.br;
    if (!el) return;
    if (!br || br.phase === 'lobby') {
      el.style.display = 'none';
      if (this._els.gasFx) this._els.gasFx.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    if (br.phase === 'end') {
      const win = br.winner === 'survivors' ? 'VICTORY · EXTRACTING' : 'DEFEATED';
      this._els.brAlive.textContent = win;
      if (this._els.brKills) {
        this._els.brKills.textContent = `KILLS ${br.kills ?? 0}`;
      }
      this._els.brZone.textContent = 'Cutscene · scoreboard next';
      this._els.brGas.style.display = 'none';
      if (this._els.gasFx) this._els.gasFx.style.display = 'none';
      return;
    }
    this._els.brAlive.textContent =
      `${br.aliveBots} alive · ${br.aliveSquads} squads`;
    if (this._els.brKills) {
      this._els.brKills.textContent = `KILLS ${br.kills ?? 0}`;
    }
    const z = br.zone;
    if (z?.active) {
      const n = z.displayZone ?? Math.min(z.phaseCount, Math.max(1, (z.phase ?? 0) + 1));
      const total = z.phaseCount || 5;
      const t = Math.ceil(z.timer || 0);
      const grace = z.gasEnabled === false || br.gas?.grace;
      if (z.finalContamination || z.mode === 'done') {
        this._els.brZone.textContent =
          `ZONE ${total}/${total} · MAP CONTAMINATED · last alive wins`;
      } else if (grace) {
        this._els.brZone.textContent =
          `Zone ${n}/${total} · HOLD ${t}s · first close soon`;
      } else if (z.mode === 'shrink') {
        this._els.brZone.textContent =
          `Zone ${n}/${total} · CLOSING ${t}s` +
          (br.gas?.outside ? ` · GAS ${Math.round(br.gas?.dps || z.dps || 0)}/s` : '');
      } else {
        this._els.brZone.textContent =
          `Zone ${n}/${total} · HOLD ${t}s · next circle marked` +
          (br.gas?.outside ? ` · GAS ${Math.round(br.gas?.dps || z.dps || 0)}/s` : '');
      }
    } else {
      this._els.brZone.textContent = 'Zone —';
    }
    const burning = !!(
      (br.gas?.outside && (br.gas?.dps > 0) && !br.gas?.grace)
      || z?.finalContamination
    );
    this._els.brGas.style.display = burning ? 'block' : 'none';
    if (this._els.gasFx) {
      this._els.gasFx.style.display = burning ? 'block' : 'none';
      if (burning && this._els.gasFxLabel) {
        this._els.gasFxLabel.textContent = z?.finalContamination
          ? `⚠ MAP CONTAMINATED · ${Math.round(br.gas?.dps || z.dps || 45)}/s · LAST ALIVE WINS`
          : `⚠ GAS ${Math.round(br.gas?.dps || 0)}/s · GET INSIDE THE CIRCLE`;
      }
    }
    // Flash HP bar when gas ticks
    if (burning && br.gas?.damage > 0 && this._els.hp) {
      this._els.hp.style.background = 'linear-gradient(90deg,#5a2020,#ff5050)';
      clearTimeout(this._gasPulse);
      this._gasPulse = setTimeout(() => {
        if (this._els.hp) {
          this._els.hp.style.background = 'linear-gradient(90deg,#2f7a3a,#6dce5a)';
        }
      }, 120);
    }
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

  update(state, rangeStats = null, cash = null, gear = null) {
    if (!state) return;
    const rar = RARITY[state.rarity] || RARITY.common;
    const hex = `#${rar.color.toString(16).padStart(6, '0')}`;

    this._els.name.textContent = state.name;
    this._els.name.style.color = hex;
    this._els.rarity.textContent = rar.label;
    this._els.rarity.style.color = hex;

    this._els.mag.textContent = String(state.mag);
    this._els.res.textContent = String(state.reserve);

    if (this._els.cash && cash != null) {
      this._els.cash.textContent = `$${Math.max(0, cash | 0)}`;
    }
    if (gear) {
      if (this._els.frag) this._els.frag.textContent = String(gear.frags ?? 0);
      if (this._els.smoke) this._els.smoke.textContent = String(gear.smokes ?? 0);
      if (this._els.stim) this._els.stim.textContent = String(gear.stims ?? 0);
      if (this._els.uav) {
        if (!gear.uav) this._els.uav.textContent = '—';
        else if (gear.uavActive) this._els.uav.textContent = `ON ${Math.ceil(gear.uavT)}s`;
        else if (gear.uavCd > 0) this._els.uav.textContent = `CD ${Math.ceil(gear.uavCd)}s`;
        else this._els.uav.textContent = 'RDY';
      }
      if (this._els.plates) {
        const n = gear.plates ?? 0;
        this._els.plates.textContent = `3 · ${n} plate${n === 1 ? '' : 's'}`;
        this._els.plates.style.opacity = n > 0 ? '1' : '0.45';
      }
      if (this._els.bandages) {
        const n = gear.bandages ?? 0;
        this._els.bandages.textContent = `6 · ${n} band`;
        this._els.bandages.style.opacity = n > 0 ? '1' : '0.45';
      }
      if (this._els.medkits) {
        const n = gear.medkits ?? 0;
        this._els.medkits.textContent = `7 · ${n} kit`;
        this._els.medkits.style.opacity = n > 0 ? '1' : '0.45';
      }
      if (this._els.plateCh && this._els.plateBar) {
        if (gear.plating) {
          this._els.plateCh.style.display = 'block';
          this._els.plateBar.style.width = `${Math.round((gear.plateProgress || 0) * 100)}%`;
        } else {
          this._els.plateCh.style.display = 'none';
          this._els.plateBar.style.width = '0%';
        }
      }
      if (this._els.healCh && this._els.healBar) {
        if (gear.healing) {
          this._els.healCh.style.display = 'block';
          this._els.healBar.style.width = `${Math.round((gear.healProgress || 0) * 100)}%`;
          if (this._els.healLabel) {
            this._els.healLabel.textContent = gear.healKind === 'medkit'
              ? 'USING MEDKIT… STAY STILL'
              : 'APPLYING BANDAGE…';
          }
        } else {
          this._els.healCh.style.display = 'none';
          this._els.healBar.style.width = '0%';
        }
      }
      const hMax = gear.helmetMax || 100;
      const h = Math.max(0, gear.helmet ?? 0);
      if (this._els.helm) {
        this._els.helm.style.width = `${Math.max(0, Math.min(100, (h / hMax) * 100))}%`;
      }
      if (this._els.helmLbl) {
        this._els.helmLbl.textContent = h > 0 ? `${Math.ceil(h)}` : 'none';
        this._els.helmLbl.style.opacity = h > 0 ? '0.9' : '0.45';
        this._els.helmLbl.style.color = h > 0 ? '#e0c060' : '';
      }
    }

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
    {
      const cap = (gear && gear.armorCap) || ({ 0: 50, 1: 50, 2: 100, 3: 150 }[state.armorLevel ?? 0] ?? 100);
      this._els.ar.style.width = `${Math.max(0, Math.min(100, ((state.armor || 0) / Math.max(1, cap)) * 100))}%`;
    }

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
        // Marksman: huge clear center so map stays in peripherals.
        // Sniper: slightly tighter ring (still mostly open).
        const open = state.weaponClass === 'dmr' || state.weaponClass === 'marksman';
        this._els.scope.style.background = open
          ? `radial-gradient(circle at center,
              transparent 0%, transparent 58%,
              rgba(0,0,0,0.2) 66%, rgba(0,0,0,0.55) 76%, rgba(0,0,0,0.88) 88%)`
          : `radial-gradient(circle at center,
              transparent 0%, transparent 48%,
              rgba(0,0,0,0.25) 56%, rgba(0,0,0,0.7) 68%, rgba(0,0,0,0.92) 78%)`;
      }
    }
  }
}
