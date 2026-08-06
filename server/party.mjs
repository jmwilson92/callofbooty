/**
 * Tiny friends lobby relay for Call of Booty.
 *   node server/party.mjs
 *   npm run party
 *
 * Protocol (JSON over WebSocket):
 *   client → { type:'join', room, name }
 *   server → { type:'welcome', id, room }
 *   server → { type:'peers', peers:[{id,name}] }
 *   client → { type:'state', x,y,z,yaw,... }
 *   server → broadcast { type:'state', id, ... }
 *   server → { type:'leave', id }
 *
 * No game authority — pure fan-out for co-op testing with your group.
 */
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.PARTY_PORT || 8787);

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
    if (c.ws.readyState === 1) c.ws.send(raw);
  }
}

function peersPayload(room) {
  return [...roomList(room)].map((c) => ({
    id: c.id,
    name: c.name,
  }));
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Call of Booty party relay OK\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const client = {
    id: `p${nextId++}_${randomBytes(2).toString('hex')}`,
    ws,
    room: null,
    name: 'Player',
  };

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(String(data));
    } catch {
      return;
    }

    if (msg.type === 'join') {
      const room = String(msg.room || 'LOBBY').toUpperCase().slice(0, 8);
      if (client.room) {
        roomList(client.room).delete(client);
        broadcast(client.room, { type: 'leave', id: client.id });
      }
      client.room = room;
      client.name = String(msg.name || 'Player').slice(0, 16);
      roomList(room).add(client);
      ws.send(JSON.stringify({ type: 'welcome', id: client.id, room }));
      // Everyone gets peer list
      broadcast(room, { type: 'peers', peers: peersPayload(room) });
      console.log(`[party] ${client.id} joined ${room} as ${client.name} (${roomList(room).size})`);
      return;
    }

    if (!client.room) return;

    if (msg.type === 'state') {
      broadcast(client.room, {
        type: 'state',
        id: client.id,
        name: client.name,
        x: msg.x, y: msg.y, z: msg.z,
        yaw: msg.yaw,
        seat: msg.seat,
        heliId: msg.heliId,
        health: msg.health,
      }, client);
      return;
    }

    if (msg.type === 'chat') {
      broadcast(client.room, {
        type: 'chat',
        id: client.id,
        name: client.name,
        text: String(msg.text || '').slice(0, 200),
      });
    }
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[party] friends relay on ws://0.0.0.0:${PORT}`);
});
