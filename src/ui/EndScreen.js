/**
 * Victory extraction cutscene (slideshow) → post-match scoreboard.
 * Frames live under /assets/cutscene/.
 */

const FRAMES = [
  {
    src: '/assets/cutscene/01_approach.jpg',
    caption: 'EXTRACT INBOUND — all operators to the pad',
    hold: 3.2,
  },
  {
    src: '/assets/cutscene/02_boarding.jpg',
    caption: 'STACK UP — wounded first, nobody left behind',
    hold: 3.6,
  },
  {
    src: '/assets/cutscene/03_liftoff.jpg',
    caption: 'WHEELS UP — the boys are on the bird',
    hold: 3.4,
  },
  {
    src: '/assets/cutscene/04_extract.jpg',
    caption: 'MISSION COMPLETE — last squad standing',
    hold: 3.8,
  },
];

function fmtTime(sec) {
  const s = Math.max(0, sec | 0);
  const m = (s / 60) | 0;
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function fmtNum(n) {
  if (n == null || n === '—') return '—';
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n);
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
}

export class EndScreen {
  constructor() {
    this.root = null;
    this.visible = false;
    this._mode = 'idle'; // idle | cutscene | stats
    this._frame = 0;
    this._holdT = 0;
    this._report = null;
    this._img = null;
    this._cap = null;
    this._stats = null;
    this._bar = null;
    this._onSkip = null;
    this._preloaded = false;
  }

  /** Warm image cache so the first frame is instant. */
  preload() {
    if (this._preloaded) return;
    this._preloaded = true;
    for (const f of FRAMES) {
      const im = new Image();
      im.src = f.src;
    }
  }

  _ensure() {
    if (this.root) return;
    const el = document.createElement('div');
    el.id = 'end-screen';
    el.innerHTML = `
      <style>
        #end-screen {
          position: fixed; inset: 0; z-index: 80;
          display: none; font-family: ui-monospace, Menlo, Consolas, monospace;
          color: #e8f0f4; background: #05080c;
        }
        #end-screen.show { display: block; }
        #end-cut {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #05080c;
        }
        #end-cut.hidden { display: none; }
        #end-frame {
          width: min(96vw, 1400px); height: min(78vh, 788px);
          object-fit: cover; border-radius: 6px;
          box-shadow: 0 20px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(127,212,255,0.15);
          background: #0a1018;
        }
        #end-cap {
          margin-top: 18px; font-size: clamp(13px, 1.6vw, 18px);
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #9fd4ff; text-shadow: 0 2px 16px rgba(0,0,0,0.9);
          text-align: center; max-width: 90vw;
        }
        #end-progress {
          margin-top: 16px; width: min(420px, 70vw); height: 3px;
          background: rgba(255,255,255,0.12); border-radius: 2px; overflow: hidden;
        }
        #end-progress > i {
          display: block; height: 100%; width: 0%;
          background: linear-gradient(90deg, #3a9fd4, #7fd4ff);
          box-shadow: 0 0 10px rgba(127,212,255,0.5);
        }
        #end-skip {
          position: absolute; bottom: 22px; right: 28px;
          font-size: 12px; letter-spacing: 0.12em; opacity: 0.55;
        }
        #end-stats {
          position: absolute; inset: 0;
          display: none; flex-direction: column; align-items: center;
          justify-content: flex-start; padding: 48px 20px 32px;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(40,90,60,0.35), transparent 55%),
            linear-gradient(180deg, #0a1210 0%, #05080c 100%);
          overflow: auto;
        }
        #end-stats.show { display: flex; }
        #end-stats h1 {
          margin: 0 0 6px; font-size: clamp(28px, 4vw, 42px);
          letter-spacing: 0.14em; color: #8fef7a;
          text-shadow: 0 0 28px rgba(100,220,100,0.35);
        }
        #end-stats .sub {
          opacity: 0.65; font-size: 13px; letter-spacing: 0.16em;
          margin-bottom: 28px; text-transform: uppercase;
        }
        #end-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px; width: min(920px, 96vw); margin-bottom: 28px;
        }
        #end-cards .card {
          background: rgba(12,20,18,0.88);
          border: 1px solid rgba(120,200,140,0.28);
          border-radius: 10px; padding: 14px 12px; text-align: center;
        }
        #end-cards .card .lab {
          font-size: 10px; letter-spacing: 0.16em; opacity: 0.55; margin-bottom: 6px;
        }
        #end-cards .card .val {
          font-size: clamp(22px, 3vw, 32px); font-weight: 800;
          color: #ffe080; letter-spacing: 0.04em;
        }
        #end-cards .card.kdr .val { color: #7fd4ff; }
        #end-cards .card.dmg .val { color: #ff9a6a; }
        #end-roster {
          width: min(920px, 96vw);
          background: rgba(8,14,12,0.9);
          border: 1px solid rgba(100,180,120,0.3);
          border-radius: 10px; overflow: hidden; margin-bottom: 24px;
        }
        #end-roster table { width: 100%; border-collapse: collapse; font-size: 13px; }
        #end-roster th {
          text-align: left; padding: 10px 14px; font-size: 10px;
          letter-spacing: 0.14em; opacity: 0.5; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        #end-roster td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        #end-roster tr:last-child td { border-bottom: none; }
        #end-roster .you { color: #7fd4ff; font-weight: 700; }
        #end-roster .status-extracted { color: #8fef7a; }
        #end-roster .status-kia { color: #ff6a5a; }
        #end-roster .status-downed { color: #ffc060; }
        #end-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        #end-actions button {
          pointer-events: auto; cursor: pointer;
          padding: 12px 22px; border-radius: 8px;
          border: 1px solid rgba(127,212,255,0.4);
          background: rgba(20,40,50,0.9); color: #e8f0f4;
          font: 700 13px/1 ui-monospace, Menlo, Consolas, monospace;
          letter-spacing: 0.12em; text-transform: uppercase;
        }
        #end-actions button.primary {
          background: linear-gradient(180deg, #2a6a3a, #1a4024);
          border-color: rgba(140,240,140,0.5); color: #c8ffc0;
        }
        #end-actions button:hover { filter: brightness(1.12); }
      </style>
      <div id="end-cut">
        <img id="end-frame" alt="extraction" />
        <div id="end-cap"></div>
        <div id="end-progress"><i></i></div>
        <div id="end-skip">SPACE / CLICK · SKIP</div>
      </div>
      <div id="end-stats">
        <h1 id="end-title">VICTORY</h1>
        <div class="sub" id="end-sub">Last squad standing · extraction complete</div>
        <div id="end-cards"></div>
        <div id="end-roster"><table>
          <thead><tr>
            <th>OPERATOR</th><th>STATUS</th><th>KILLS</th><th>DEATHS</th><th>DAMAGE</th>
          </tr></thead>
          <tbody id="end-roster-body"></tbody>
        </table></div>
        <div id="end-actions">
          <button type="button" class="primary" id="end-again">DROP AGAIN</button>
          <button type="button" id="end-menu">MAIN MENU</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    this.root = el;
    this._img = el.querySelector('#end-frame');
    this._cap = el.querySelector('#end-cap');
    this._bar = el.querySelector('#end-progress > i');
    this._cut = el.querySelector('#end-cut');
    this._statsEl = el.querySelector('#end-stats');
    this._cards = el.querySelector('#end-cards');
    this._rosterBody = el.querySelector('#end-roster-body');
    this._title = el.querySelector('#end-title');
    this._sub = el.querySelector('#end-sub');

    const skip = () => {
      if (this._mode === 'cutscene') this._showStats();
    };
    el.addEventListener('click', (e) => {
      if (e.target.closest('#end-actions')) return;
      skip();
    });
    this._onSkip = (e) => {
      if (!this.visible) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener('keydown', this._onSkip, true);

    el.querySelector('#end-again').onclick = () => {
      this.hide();
      this.onPlayAgain?.();
    };
    el.querySelector('#end-menu').onclick = () => {
      this.hide();
      this.onMainMenu?.();
    };
  }

  /**
   * @param {object} report match.buildReport()
   * @param {{ localStatus?: string }} [opts]
   */
  play(report, opts = null) {
    this._ensure();
    this.preload();
    this._report = report || {};
    if (opts?.localStatus && this._report.squad?.[0]) {
      this._report.squad[0].status = opts.localStatus;
    }
    this.visible = true;
    this.root.classList.add('show');
    this._mode = 'cutscene';
    this._frame = 0;
    this._holdT = 0;
    this._cut.classList.remove('hidden');
    this._statsEl.classList.remove('show');
    this._applyFrame(0);
    // Free cursor for skip / buttons
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  hide() {
    this.visible = false;
    this._mode = 'idle';
    if (this.root) this.root.classList.remove('show');
  }

  _applyFrame(i) {
    const f = FRAMES[i];
    if (!f || !this._img) return;
    this._img.src = f.src;
    this._cap.textContent = f.caption;
    this._holdT = 0;
    if (this._bar) this._bar.style.width = '0%';
  }

  _showStats() {
    this._mode = 'stats';
    this._cut.classList.add('hidden');
    this._statsEl.classList.add('show');
    this._renderStats();
  }

  _renderStats() {
    const r = this._report || {};
    const win = r.winner === 'survivors';
    this._title.textContent = win ? 'VICTORY' : 'DEFEATED';
    this._title.style.color = win ? '#8fef7a' : '#ff6a5a';
    this._sub.textContent = win
      ? `Last squad standing · ${fmtTime(r.durationSec)} · extraction complete`
      : `Mission failed · ${fmtTime(r.durationSec)}`;

    const cards = [
      { lab: 'KILLS', val: r.kills ?? 0 },
      { lab: 'DEATHS', val: r.deaths ?? 0 },
      { lab: 'K/D', val: (r.kdr ?? 0).toFixed(2), cls: 'kdr' },
      { lab: 'DAMAGE', val: fmtNum(r.damageDealt), cls: 'dmg' },
      { lab: 'DMG TAKEN', val: fmtNum(r.damageTaken) },
      { lab: 'HEADSHOTS', val: r.headshots ?? 0 },
      { lab: 'DOWNS', val: r.downs ?? 0 },
      { lab: 'TIME', val: fmtTime(r.durationSec) },
    ];
    this._cards.innerHTML = cards.map((c) => `
      <div class="card ${c.cls || ''}">
        <div class="lab">${c.lab}</div>
        <div class="val">${c.val}</div>
      </div>
    `).join('');

    const squad = r.squad || [];
    this._rosterBody.innerHTML = squad.map((op) => {
      const st = String(op.status || 'extracted').toLowerCase();
      const stLabel = st === 'kia' ? 'KIA' : st === 'downed' ? 'DOWNED' : 'EXTRACTED';
      return `<tr>
        <td class="${op.local ? 'you' : ''}">${op.local ? '★ ' : ''}${escapeHtml(op.name)}</td>
        <td class="status-${st}">${stLabel}</td>
        <td>${op.kills ?? '—'}</td>
        <td>${op.deaths ?? '—'}</td>
        <td>${fmtNum(op.damage)}</td>
      </tr>`;
    }).join('');
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (!this.visible || this._mode !== 'cutscene') return;
    const f = FRAMES[this._frame];
    if (!f) {
      this._showStats();
      return;
    }
    this._holdT += dt;
    const p = Math.min(1, this._holdT / Math.max(0.1, f.hold));
    if (this._bar) this._bar.style.width = `${Math.round(p * 100)}%`;
    if (this._holdT >= f.hold) {
      this._frame += 1;
      if (this._frame >= FRAMES.length) this._showStats();
      else this._applyFrame(this._frame);
    }
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
