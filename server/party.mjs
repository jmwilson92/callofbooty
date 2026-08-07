/**
 * Friends lobby WebSocket relay for Call of Booty.
 *
 * Standalone:  node server/party.mjs  → ws://0.0.0.0:8787
 * Embedded:    attachParty(httpServer) → same process as Vite (preferred for tunnels)
 *
 * Protocol (JSON):
 *   join | welcome | peers | state | leave | rocket | bot_kill | bot_dmg | redeploy | chat
 */
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.PARTY_PORT || 8787);

/**
 * Attach party relay to an existing HTTP server (Vite).
 * Handles upgrade requests whose URL starts with pathPrefix (default /party-ws).
 * @param {import('node:http').Server} httpServer
 * @param {{ pathPrefix?: string }} [opts]
 * @returns {{ wss: WebSocketServer, close: () => void }}
 */
export function attachParty(httpServer, opts = {}) {
  const pathPrefix = opts.pathPrefix || '/party-ws';
  const rooms = new Map(); // room -> Set of clients
  let nextId = 1;

  function roomList(room) {
    let set = rooms.get(room);
    if (!set) {
      set = new Set();
      rooms.set(room, set);
    }
    return set;
  }

  function broadcast(room, msg, except = null) {
    const raw = JSON.stringify(msg);
    for (const c of roomList(room)) {
      if (c === except) continue;
      if (c.ws.readyState === 1) {
        try { c.ws.send(raw); } catch { /* */ }
      }
    }
  }

  function peersPayload(room) {
    return [...roomList(room)].map((c) => ({
      id: c.id,
      name: c.name,
      host: !!c.host,
    }));
  }

  // noServer: we hand upgrades ourselves so Vite/HMR can share the port
  const wss = new WebSocketServer({ noServer: true });

  const onUpgrade = (req, socket, head) => {
    const url = req.url || '';
    if (!url.startsWith(pathPrefix)) return; // let Vite handle HMR etc.
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  };
  httpServer.on('upgrade', onUpgrade);

  wss.on('connection', (ws) => {
    const client = {
      id: `p${nextId++}_${randomBytes(2).toString('hex')}`,
      ws,
      room: null,
      name: 'Player',
      host: false,
    };

    ws.on('message', (data) => {
      let msg;
      try {
        msg = JSON.parse(String(data));
      } catch {
        return;
      }
      handleMessage(client, msg, { roomList, broadcast, peersPayload });
    });

    ws.on('close', () => {
      if (client.room) {
        roomList(client.room).delete(client);
        broadcast(client.room, { type: 'leave', id: client.id });
        broadcast(client.room, { type: 'peers', peers: peersPayload(client.room) });
        if (roomList(client.room).size === 0) rooms.delete(client.room);
        console.log(`[party] ${client.id} left ${client.room}`);
      }
    });
  });

  console.log(`[party] attached to HTTP server path ${pathPrefix}`);
  return {
    wss,
    close: () => {
      httpServer.off('upgrade', onUpgrade);
      try { wss.close(); } catch { /* */ }
    },
  };
}

/**
 * @param {object} client
 * @param {object} msg
 * @param {object} ctx
 */
function handleMessage(client, msg, ctx) {
  const { roomList, broadcast, peersPayload } = ctx;

  if (msg.type === 'join') {
    const room = String(msg.room || 'LOBBY').toUpperCase().slice(0, 8);
    if (client.room) {
      roomList(client.room).delete(client);
      broadcast(client.room, { type: 'leave', id: client.id });
    }
    client.room = room;
    client.name = String(msg.name || 'Player').slice(0, 16);
    client.host = !!msg.host;
    roomList(room).add(client);
    client.ws.send(JSON.stringify({
      type: 'welcome',
      id: client.id,
      room,
      host: client.host,
    }));
    broadcast(room, { type: 'peers', peers: peersPayload(room) });
    console.log(`[party] ${client.id} joined ${room} as ${client.name} host=${client.host} (${roomList(room).size})`);
    return;
  }

  if (!client.room) return;

  if (msg.type === 'state') {
    // Pass through FULL payload — heli + rockets (rk) + bots (bs) + kills (bk)
    const out = {
      type: 'state',
      id: client.id,
      name: client.name,
      x: msg.x, y: msg.y, z: msg.z,
      yaw: msg.yaw,
      seat: msg.seat ?? null,
      heliId: msg.heliId ?? null,
      health: msg.health,
      downed: !!msg.downed,
      dead: !!msg.dead,
      parachute: msg.parachute,
      veh: msg.veh || null,
      vehX: msg.vehX ?? msg.veh?.x,
      vehY: msg.vehY ?? msg.veh?.y,
      vehZ: msg.vehZ ?? msg.veh?.z,
      vehYaw: msg.vehYaw ?? msg.veh?.yaw,
      vehVx: msg.vehVx ?? msg.veh?.vx,
      vehVy: msg.vehVy ?? msg.veh?.vy,
      vehVz: msg.vehVz ?? msg.veh?.vz,
      host: !!msg.host || !!client.host,
      // Compact combat fields (same channel as veh — must not strip)
      rk: msg.rk || null,
      ri: Array.isArray(msg.ri) ? msg.ri.slice(0, 16) : null,
      bk: Array.isArray(msg.bk) ? msg.bk.slice(0, 32) : null,
      bs: Array.isArray(msg.bs) ? msg.bs : (Array.isArray(msg.botSnap) ? msg.botSnap : null),
      botSnap: Array.isArray(msg.botSnap) ? msg.botSnap : (Array.isArray(msg.bs) ? msg.bs : null),
      events: Array.isArray(msg.events) ? msg.events.slice(0, 32) : null,
    };
    broadcast(client.room, out, client);
    return;
  }

  if (msg.type === 'chat') {
    broadcast(client.room, {
      type: 'chat',
      id: client.id,
      name: client.name,
      text: String(msg.text || '').slice(0, 200),
    });
    return;
  }

  if (msg.type === 'redeploy') {
    broadcast(client.room, {
      type: 'redeploy',
      id: client.id,
      name: client.name,
    });
    return;
  }

  // Fan-out combat messages as-is (plus id/name)
  if (
    msg.type === 'rocket'
    || msg.type === 'rocket_impact'
    || msg.type === 'bot_kill'
    || msg.type === 'bot_dmg'
    || msg.type === 'flare'
  ) {
    broadcast(client.room, {
      ...msg,
      type: msg.type,
      id: client.id,
      name: client.name,
    }, client);
    if (msg.type === 'rocket') {
      console.log(`[party] rocket from ${client.name} in ${client.room} projs=${msg.projectiles?.length ?? msg.p?.length ?? 0}`);
    }
    if (msg.type === 'rocket_impact') {
      console.log(`[party] rocket_impact from ${client.name} @ ${msg.x?.toFixed?.(0)},${msg.z?.toFixed?.(0)}`);
    }
    if (msg.type === 'bot_kill') {
      console.log(`[party] bot_kill from ${client.name} bot=${msg.botId}`);
    }
  }
}

// ── Standalone mode (npm run party) ─────────────────────────────────
const isMain = process.argv[1] && (
  process.argv[1].endsWith('party.mjs')
  || process.argv[1].includes('server\\party')
  || process.argv[1].includes('server/party')
);

if (isMain) {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Call of Booty party relay OK\n');
  });
  // Accept any path when running alone (Vite embeds /party-ws itself)
  attachParty(server, { pathPrefix: '/' });
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[party] standalone on ws://0.0.0.0:${PORT}`);
  });
}
