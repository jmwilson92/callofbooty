import { MULTIPLAYER } from '../config.js';

/**
 * Lightweight friends multiplayer client.
 * Connects to the local party relay (npm run party).
 * Room codes keep your group private.
 *
 * Syncs (best-effort, 20 Hz): player pos/yaw, seat, heli id.
 * Full authority remains local for now — good enough for co-op testing.
 */
export class PartyClient {
  constructor(bus) {
    this.bus = bus;
    this.ws = null;
    this.connected = false;
    this.room = null;
    this.peerId = null;
    this.peers = new Map(); // id -> { x,y,z,yaw,name,seat,heliId }
    this._sendAcc = 0;
    this.name = `Pilot${(Math.random() * 90 + 10) | 0}`;
    this._ui = null;
  }

  /** Build join UI (top-left). */
  mountUi() {
    if (this._ui) return;
    const el = document.createElement('div');
    el.id = 'party-ui';
    el.innerHTML = `
      <div class="party-row">
        <strong>FRIENDS</strong>
        <span class="party-status">offline</span>
      </div>
      <div class="party-row">
        <input class="party-name" maxlength="12" placeholder="name" value="${this.name}" />
        <input class="party-code" maxlength="6" placeholder="ROOM" />
        <button type="button" class="party-join">Join</button>
        <button type="button" class="party-host">Host</button>
      </div>
      <div class="party-peers"></div>
    `;
    Object.assign(el.style, {
      position: 'fixed',
      top: '8px',
      left: '8px',
      zIndex: '40',
      background: 'rgba(8,12,16,0.78)',
      color: '#d8e0e8',
      font: '12px/1.35 ui-monospace, monospace',
      padding: '8px 10px',
      borderRadius: '6px',
      border: '1px solid rgba(120,160,200,0.25)',
      maxWidth: '280px',
    });
    document.body.appendChild(el);
    this._ui = el;
    el.querySelector('.party-join').onclick = () => {
      const code = el.querySelector('.party-code').value.trim().toUpperCase();
      this.name = el.querySelector('.party-name').value.trim() || this.name;
      if (code) this.join(code);
    };
    el.querySelector('.party-host').onclick = () => {
      this.name = el.querySelector('.party-name').value.trim() || this.name;
      this.host();
    };
  }

  _wsUrl() {
    const params = new URLSearchParams(location.search);
    if (params.get('party')) return params.get('party');
    if (MULTIPLAYER.defaultUrl) return MULTIPLAYER.defaultUrl;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = location.hostname || 'localhost';
    const port = MULTIPLAYER.defaultPort || 8787;
    return `${proto}://${host}:${port}`;
  }

  host() {
    const code = this._randomCode(MULTIPLAYER.roomCodeLen || 4);
    this.join(code, true);
  }

  join(room, asHost = false) {
    this.disconnect();
    this.room = room.toUpperCase();
    const url = this._wsUrl();
    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this._setStatus(`fail ${err.message}`);
      return;
    }
    this._setStatus('connecting…');
    this.ws.onopen = () => {
      this.connected = true;
      this.ws.send(JSON.stringify({
        type: 'join',
        room: this.room,
        name: this.name,
        host: asHost,
      }));
      this._setStatus(`room ${this.room}`);
      if (this._ui) this._ui.querySelector('.party-code').value = this.room;
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
    };
    this.ws.onerror = () => this._setStatus('error — run npm run party');
  }

  disconnect() {
    if (this.ws) {
      try { this.ws.close(); } catch { /* */ }
      this.ws = null;
    }
    this.connected = false;
    this.peers.clear();
  }

  _onMsg(msg) {
    if (msg.type === 'welcome') {
      this.peerId = msg.id;
      this.room = msg.room;
      this._setStatus(`room ${this.room} · you ${msg.id}`);
    } else if (msg.type === 'peers') {
      this.peers.clear();
      for (const p of msg.peers || []) {
        if (p.id === this.peerId) continue;
        this.peers.set(p.id, p);
      }
      this._renderPeers();
    } else if (msg.type === 'state') {
      if (msg.id === this.peerId) return;
      const prev = this.peers.get(msg.id) || { id: msg.id, name: msg.name || 'Friend' };
      this.peers.set(msg.id, { ...prev, ...msg });
    } else if (msg.type === 'leave') {
      this.peers.delete(msg.id);
      this._renderPeers();
    } else if (msg.type === 'chat') {
      this.bus?.emit?.('party:chat', msg);
    }
  }

  /**
   * Call from game loop with local snapshot.
   * @param {number} dt
   * @param {object} state { x,y,z,yaw,seat,heliId,name }
   */
  update(dt, state) {
    if (!this.connected || !this.ws || this.ws.readyState !== 1) return;
    this._sendAcc += dt;
    const interval = 1 / (MULTIPLAYER.tickHz || 20);
    if (this._sendAcc < interval) return;
    this._sendAcc = 0;
    try {
      this.ws.send(JSON.stringify({
        type: 'state',
        ...state,
        name: this.name,
        t: performance.now(),
      }));
    } catch { /* */ }
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
  }

  _renderPeers() {
    const el = this._ui?.querySelector('.party-peers');
    if (!el) return;
    if (!this.peers.size) {
      el.textContent = this.connected ? 'waiting for friends…' : '';
      return;
    }
    el.innerHTML = [...this.peers.values()]
      .map((p) => `<div>· ${p.name || p.id} ${p.seat ? `[${p.seat}]` : ''}</div>`)
      .join('');
  }
}
