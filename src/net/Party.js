import { MULTIPLAYER } from '../config.js';

/**
 * Friends multiplayer — same WebSocket that already syncs heli seats/poses.
 *
 * Combat uses the SAME state packet as heli (proven across laptops):
 *   rk  — sticky gunner rocket volley (compact number arrays)
 *   bs  — host bot world snapshot
 *   bk  — sticky bot kills
 *
 * Connect: wss://same-host-as-game/party-ws  (embedded in Vite)
 */
export class PartyClient {
  constructor(bus) {
    this.bus = bus;
    this.ws = null;
    this.connected = false;
    this.room = null;
    this.peerId = null;
    this.peers = new Map();
    this._sendAcc = 0;
    this.name = `Pilot${(Math.random() * 90 + 10) | 0}`;
    this._ui = null;
    this.onRoom = null;
    this._isHost = false;
    this._seq = 0;

    // Sticky combat (re-broadcast on every state tick until expiry)
    this._rk = null; // { seq, p: number[][], mode }
    this._rkUntil = 0;
    this._ri = []; // rocket impacts { seq, netId, x, y, z }
    this._riUntil = 0;
    this._bk = []; // { seq, botId, x, y, z }[]
    this._bkUntil = 0;

    // Inbound dedupe
    this._seenRk = new Map(); // peerId -> seq
    this._seenBk = new Set();
    this._seenBkOrder = [];

    // Host bot snap for local apply
    this.latestBotSnap = null;
    this._botSnapAt = 0;
    this._stats = { rkIn: 0, rkOut: 0, bkIn: 0, bsIn: 0 };
  }

  /** Solo / offline → true. Host button → true. Else follow room host. */
  isAuthority() {
    if (!this.connected || !this.peerId) return true;
    if (this._isHost) return true;
    for (const p of this.peers.values()) {
      if (p.host) return false;
    }
    let min = String(this.peerId);
    for (const id of this.peers.keys()) {
      if (String(id) < min) min = String(id);
    }
    return String(this.peerId) === min;
  }

  mountUi() {
    if (this._ui) return;
    const el = document.createElement('div');
    el.id = 'party-ui';
    el.innerHTML = `
      <div class="party-row party-title">
        <strong>FRIENDS LOBBY</strong>
        <span class="party-status">offline</span>
      </div>
      <div class="party-hint">
        Host on the pilot PC, Join on the gunner laptop — same room code.
        Party uses the same URL as the game (/party-ws).
      </div>
      <div class="party-row party-controls">
        <input class="party-name" maxlength="12" placeholder="name" value="${this.name}" />
        <input class="party-code" maxlength="6" placeholder="ROOM" />
        <button type="button" class="party-join">Join</button>
        <button type="button" class="party-host">Host</button>
      </div>
      <div class="party-peers"></div>
    `;
    const hint = document.getElementById('hint');
    if (hint) {
      const playBtn = hint.querySelector('#hint-play');
      if (playBtn?.parentNode) playBtn.insertAdjacentElement('afterend', el);
      else hint.appendChild(el);
    } else {
      document.body.appendChild(el);
      Object.assign(el.style, {
        position: 'fixed', left: '50%', top: '18%', transform: 'translateX(-50%)', zIndex: '28',
      });
    }
    this._ui = el;
    el.querySelector('.party-join').onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const code = el.querySelector('.party-code').value.trim().toUpperCase();
      this.name = el.querySelector('.party-name').value.trim() || this.name;
      if (code) this.join(code, false);
    };
    el.querySelector('.party-host').onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.name = el.querySelector('.party-name').value.trim() || this.name;
      this.host();
    };
    for (const input of el.querySelectorAll('input, button')) {
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('pointerdown', (e) => e.stopPropagation());
      input.addEventListener('keydown', (e) => e.stopPropagation());
    }
    this._updateSyncBadge();
  }

  setLobbyVisible(visible) {
    if (!this._ui) return;
    if (this._ui.parentElement?.id === 'hint') {
      this._ui.style.display = visible ? '' : 'none';
      return;
    }
    this._ui.style.display = visible ? 'block' : 'none';
  }

  _wsUrl() {
    const params = new URLSearchParams(location.search);
    if (params.get('party')) return params.get('party');
    if (MULTIPLAYER.defaultUrl) return MULTIPLAYER.defaultUrl;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    // Same host/port as the game page (Vite embeds party at /party-ws)
    return `${proto}://${location.host}/party-ws`;
  }

  host() {
    this.join(this._randomCode(MULTIPLAYER.roomCodeLen || 4), true);
  }

  join(room, asHost = false) {
    this.disconnect();
    this.room = String(room || 'LOBBY').toUpperCase().slice(0, 8);
    this._isHost = !!asHost;
    const url = this._wsUrl();
    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this._setStatus(`fail ${err.message}`);
      return;
    }
    this._setStatus(`connecting ${url}…`);
    this.ws.onopen = () => {
      this.connected = true;
      this.ws.send(JSON.stringify({
        type: 'join',
        room: this.room,
        name: this.name,
        host: asHost,
      }));
      if (this._ui) this._ui.querySelector('.party-code').value = this.room;
      this._setStatus(`room ${this.room} · ${asHost ? 'HOST' : 'JOIN'} · LIVE`);
      console.info('[party] CONNECTED', url, this.room, 'host=', asHost);
      this._updateSyncBadge();
    };
    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      this._onMsg(msg);
    };
    this.ws.onclose = () => {
      this.connected = false;
      this._setStatus('offline');
      this.peers.clear();
      this._renderPeers();
      this._updateSyncBadge();
    };
    this.ws.onerror = () => {
      this._setStatus(`WS ERROR · ${url}`);
      console.error('[party] websocket error', url);
      this._updateSyncBadge();
    };
  }

  disconnect() {
    if (this.ws) {
      try { this.ws.close(); } catch { /* */ }
      this.ws = null;
    }
    this.connected = false;
    this.peers.clear();
    this._rk = null;
    this._bk = [];
  }

  /**
   * Gunner called after local rocket spawn — rides every state packet like heli veh.
   * @param {object} payload from vehicle:rocket_net
   */
  noteRocket(payload) {
    if (!payload) return false;
    const seq = payload.volleySeq || (++this._seq);
    const volleySeq = payload.volleySeq || seq;
    const p = (payload.projectiles || []).map((pr, i) => [
      round(pr.x), round(pr.y), round(pr.z),
      round(pr.vx), round(pr.vy), round(pr.vz),
      pr.netId ?? (volleySeq * 10 + i),
    ]).filter((row) => row.slice(0, 6).every(Number.isFinite));
    if (!p.length) {
      console.warn('[party] noteRocket empty projectiles', payload);
      return false;
    }
    this._rk = {
      seq,
      volleySeq,
      mode: payload.mode || 'direct',
      heliId: payload.heliId || null,
      hx: round(payload.hx), hy: round(payload.hy), hz: round(payload.hz),
      hyaw: round(payload.hyaw),
      p,
    };
    this._rkUntil = performance.now() + 2000;
    this._stats.rkOut += 1;
    // Immediate dedicated message too
    this.send({
      type: 'rocket',
      ...this._rk,
      projectiles: p.map((row) => ({
        x: row[0], y: row[1], z: row[2],
        vx: row[3], vy: row[4], vz: row[5],
        netId: row[6],
      })),
    });
    console.info('[party] ROCKET OUT seq', seq, 'n=', p.length, 'peers=', this.peers.size);
    this._updateSyncBadge();
    return true;
  }

  /**
   * Local player kill — sticky so host/joiner both apply.
   */
  noteBotKill({ botId, x, y, z, part }) {
    if (botId == null) return false;
    const seq = ++this._seq;
    this._bk.push({ seq, botId, x: round(x), y: round(y), z: round(z), part: part || null });
    if (this._bk.length > 24) this._bk.splice(0, this._bk.length - 24);
    this._bkUntil = performance.now() + 2500;
    this.send({ type: 'bot_kill', seq, botId, x, y, z, part });
    return true;
  }

  /**
   * Gunner impact authority — pilot snaps boom to this point.
   */
  noteRocketImpact({ netId, volleySeq, x, y, z, heliId }) {
    const seq = ++this._seq;
    const imp = {
      seq,
      netId: netId ?? null,
      volleySeq: volleySeq ?? null,
      x: round(x), y: round(y), z: round(z),
      heliId: heliId || null,
    };
    this._ri.push(imp);
    if (this._ri.length > 16) this._ri.splice(0, this._ri.length - 16);
    this._riUntil = performance.now() + 2000;
    this.send({ type: 'rocket_impact', ...imp });
    return true;
  }

  send(msg) {
    if (!this.connected || !this.ws || this.ws.readyState !== 1) return false;
    try {
      this.ws.send(JSON.stringify({ ...msg, t: performance.now() }));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 20 Hz state — heli + sticky rockets + bot snap + kills (same channel that works).
   */
  update(dt, state) {
    if (!this.connected || !this.ws || this.ws.readyState !== 1) return;
    this._sendAcc += dt;
    const interval = 1 / (MULTIPLAYER.tickHz || 20);
    if (this._sendAcc < interval) return;
    this._sendAcc = 0;

    const now = performance.now();
    if (this._rk && now > this._rkUntil) this._rk = null;
    if (now > this._bkUntil) this._bk = [];
    if (now > this._riUntil) this._ri = [];

    const packet = {
      type: 'state',
      name: this.name,
      host: this._isHost,
      x: state.x, y: state.y, z: state.z,
      yaw: state.yaw,
      seat: state.seat ?? null,
      heliId: state.heliId ?? null,
      health: state.health,
      downed: !!state.downed,
      dead: !!state.dead,
      parachute: state.parachute,
      // Heli airframe (already proven)
      veh: state.veh || null,
      vehX: state.vehX ?? state.veh?.x,
      vehY: state.vehY ?? state.veh?.y,
      vehZ: state.vehZ ?? state.veh?.z,
      vehYaw: state.vehYaw ?? state.veh?.yaw,
      vehVx: state.vehVx ?? state.veh?.vx,
      vehVy: state.vehVy ?? state.veh?.vy,
      vehVz: state.vehVz ?? state.veh?.vz,
      // Combat — same packet as heli
      rk: this._rk,
      ri: this._ri.length ? this._ri : null,
      bk: this._bk.length ? this._bk : null,
      bs: state.botSnap || null,
      t: now,
    };

    try {
      this.ws.send(JSON.stringify(packet));
    } catch (err) {
      console.warn('[party] state send failed', err);
    }
    this._updateSyncBadge();
  }

  _onMsg(msg) {
    if (msg.type === 'welcome') {
      this.peerId = msg.id;
      this.room = msg.room;
      if (msg.host != null) this._isHost = !!msg.host;
      this._setStatus(`room ${this.room} · ${this._isHost ? 'HOST' : 'JOIN'} · LIVE`);
      this.bus?.emit?.('party:welcome', { id: msg.id, room: msg.room });
      this.onRoom?.(this.room);
      this._updateSyncBadge();
      return;
    }

    if (msg.type === 'peers') {
      const keep = new Set();
      for (const p of msg.peers || []) {
        if (p.id === this.peerId) continue;
        keep.add(p.id);
        const prev = this.peers.get(p.id) || {};
        this.peers.set(p.id, { ...prev, ...p });
      }
      for (const id of [...this.peers.keys()]) {
        if (!keep.has(id)) this.peers.delete(id);
      }
      this._renderPeers();
      this._updateSyncBadge();
      return;
    }

    if (msg.type === 'leave') {
      this.peers.delete(msg.id);
      this._renderPeers();
      this._updateSyncBadge();
      return;
    }

    if (msg.type === 'redeploy') {
      this.bus?.emit?.('party:redeploy', msg);
      return;
    }

    // Dedicated rocket (immediate)
    if (msg.type === 'rocket') {
      if (msg.id === this.peerId) return;
      this._ingestRocket(msg.id, msg);
      return;
    }
    if (msg.type === 'rocket_impact') {
      if (msg.id === this.peerId) return;
      this._ingestRocketImpact(msg.id, msg);
      return;
    }
    if (msg.type === 'bot_kill') {
      if (msg.id === this.peerId) return;
      this._ingestBotKill(msg.id, msg);
      return;
    }

    if (msg.type === 'state') {
      if (msg.id === this.peerId) return;
      const prev = this.peers.get(msg.id) || { id: msg.id, name: msg.name || 'Friend' };
      let veh = msg.veh || null;
      if (!veh && msg.vehX != null) {
        veh = {
          id: msg.heliId || prev.heliId,
          x: msg.vehX, y: msg.vehY, z: msg.vehZ, yaw: msg.vehYaw,
          vx: msg.vehVx || 0, vy: msg.vehVy || 0, vz: msg.vehVz || 0,
        };
      }
      this.peers.set(msg.id, {
        ...prev,
        ...msg,
        host: !!(msg.host || prev.host),
        downed: !!(msg.downed ?? prev.downed),
        dead: !!(msg.dead ?? prev.dead),
        veh: veh || (msg.seat === 'pilot' ? prev.veh : null),
      });

      // Bot world from whoever is broadcasting (host)
      if (Array.isArray(msg.bs) && msg.bs.length) {
        this.latestBotSnap = msg.bs;
        this._botSnapAt = performance.now();
        this._stats.bsIn += 1;
      } else if (Array.isArray(msg.botSnap) && msg.botSnap.length) {
        this.latestBotSnap = msg.botSnap;
        this._botSnapAt = performance.now();
        this._stats.bsIn += 1;
      }

      // Sticky rocket on state
      if (msg.rk) this._ingestRocket(msg.id, msg.rk);
      // Rocket impacts (gunner authority)
      if (Array.isArray(msg.ri)) {
        for (const imp of msg.ri) this._ingestRocketImpact(msg.id, imp);
      }
      // Sticky kills
      if (Array.isArray(msg.bk)) {
        for (const k of msg.bk) this._ingestBotKill(msg.id, k);
      }
      // Legacy events[] if present
      if (Array.isArray(msg.events)) {
        for (const ev of msg.events) {
          if (ev?.kind === 'rocket' || ev?.type === 'rocket') this._ingestRocket(msg.id, ev);
          if (ev?.kind === 'bot_kill' || ev?.type === 'bot_kill') this._ingestBotKill(msg.id, ev);
        }
      }
    }
  }

  _ingestRocket(fromId, rk) {
    if (!rk) return;
    const seq = rk.seq ?? 0;
    const prev = this._seenRk.get(fromId) ?? -1;
    if (seq && seq <= prev) return; // already handled
    if (seq) this._seenRk.set(fromId, seq);

    // Expand compact p[][] or full projectiles[]
    let projectiles = rk.projectiles;
    if (!projectiles?.length && Array.isArray(rk.p)) {
      projectiles = rk.p.map((row) => ({
        x: +row[0], y: +row[1], z: +row[2],
        vx: +row[3], vy: +row[4], vz: +row[5],
        netId: row[6] != null ? +row[6] : undefined,
      }));
    }
    if (!projectiles?.length) {
      console.warn('[party] rocket IN empty', rk);
      return;
    }
    this._stats.rkIn += 1;
    console.info('[party] ROCKET IN from', fromId, 'n=', projectiles.length, 'seq=', seq);
    this.bus?.emit?.('party:rocket', {
      id: fromId,
      seq,
      volleySeq: rk.volleySeq || seq,
      mode: rk.mode || 'direct',
      heliId: rk.heliId,
      hx: rk.hx, hy: rk.hy, hz: rk.hz, hyaw: rk.hyaw,
      projectiles,
    });
    this._updateSyncBadge();
  }

  _ingestBotKill(fromId, k) {
    if (!k || k.botId == null) return;
    const seq = k.seq ?? 0;
    const key = `${fromId}:${seq}:${k.botId}`;
    if (seq && this._seenBk.has(key)) return;
    if (seq) {
      this._seenBk.add(key);
      this._seenBkOrder.push(key);
      if (this._seenBkOrder.length > 300) {
        this._seenBk.delete(this._seenBkOrder.shift());
      }
    }
    this._stats.bkIn += 1;
    this.bus?.emit?.('party:bot_kill', {
      id: fromId,
      botId: k.botId,
      x: k.x, y: k.y, z: k.z,
      part: k.part,
    });
  }

  _ingestRocketImpact(fromId, imp) {
    if (!imp) return;
    const seq = imp.seq ?? 0;
    const key = `ri:${fromId}:${seq}:${imp.netId ?? ''}`;
    if (seq && this._seenBk.has(key)) return; // reuse dedupe set
    if (seq) {
      this._seenBk.add(key);
      this._seenBkOrder.push(key);
      if (this._seenBkOrder.length > 300) {
        this._seenBk.delete(this._seenBkOrder.shift());
      }
    }
    this.bus?.emit?.('party:rocket_impact', {
      id: fromId,
      netId: imp.netId,
      volleySeq: imp.volleySeq,
      x: imp.x, y: imp.y, z: imp.z,
      heliId: imp.heliId,
    });
  }

  /** True if peer is downed or dead (gunner can steal pilot seat). */
  peerIncapacitated(peerId) {
    if (!peerId || peerId === 'local') return false;
    const p = this.peers.get(peerId);
    return !!(p && (p.downed || p.dead));
  }

  _randomCode(len = 4) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < len; i++) s += alphabet[(Math.random() * alphabet.length) | 0];
    return s;
  }

  _setStatus(text) {
    const el = this._ui?.querySelector('.party-status');
    if (el) el.textContent = text;
    this._updateSyncBadge();
  }

  _renderPeers() {
    const el = this._ui?.querySelector('.party-peers');
    if (!el) return;
    if (!this.peers.size) {
      el.textContent = this.connected ? 'waiting for friends…' : '';
      return;
    }
    el.innerHTML = [...this.peers.values()]
      .map((p) => `<div>· ${p.name || p.id} ${p.seat ? `[${p.seat}]` : ''}${p.host ? ' ★HOST' : ''}</div>`)
      .join('');
  }

  _updateSyncBadge() {
    let el = document.getElementById('party-sync-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'party-sync-badge';
      Object.assign(el.style, {
        position: 'fixed',
        top: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '70',
        pointerEvents: 'none',
        padding: '7px 14px',
        borderRadius: '6px',
        font: '700 11px/1.35 ui-monospace, Menlo, Consolas, monospace',
        letterSpacing: '0.06em',
        background: 'rgba(0,0,0,0.72)',
        border: '1px solid rgba(127,212,255,0.4)',
        color: '#9fd4ff',
        textAlign: 'center',
        maxWidth: '92vw',
      });
      document.body.appendChild(el);
    }
    if (!this.connected) {
      el.innerHTML = 'PARTY OFFLINE — open lobby (Esc) · Host / Join same room';
      el.style.color = '#ff8a7a';
      return;
    }
    const n = this.peers.size;
    const auth = this.isAuthority() ? 'YOU OWN BOTS' : 'FOLLOWING HOST BOTS';
    const snapAge = this.latestBotSnap
      ? `${((performance.now() - this._botSnapAt) / 1000).toFixed(1)}s`
      : 'none';
    const s = this._stats;
    el.innerHTML = n
      ? `PARTY OK · ${n} friend · ${auth}<br><span style="opacity:0.85;font-weight:600">rk ${s.rkOut}→${s.rkIn} · kills in ${s.bkIn} · botSnap ${snapAge}</span>`
      : `PARTY ALONE · ${auth} · waiting for friend`;
    el.style.color = n ? '#8fef7a' : '#ffe080';
  }
}

function round(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}
