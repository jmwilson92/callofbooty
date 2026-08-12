// Runs the Tier C interior generator over every building it applies to, and
// draws one so the plan can be looked at rather than trusted.
//
//   node tools/maps3d-interior.mjs --out out [--plan N] [--planName house]
//
// Nothing is written but the debug plan. What this produces is the budget — how
// many instances Tier C really costs, which kit pieces the artists have to make
// first, and how many buildings need a plinth or a buried level — plus the
// checks that the layout is deterministic and that no room is unreachable.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { buildInterior as buildC } from './interior-c.mjs';
import { buildInterior as buildA } from './interior-a.mjs';
import { buildInterior as buildB } from './interior-b.mjs';
import { buildGraph } from './structgraph.mjs';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const OUT = arg('out', arg('dir', 'out'));

const city = JSON.parse(readFileSync(join(OUT, 'city.json'), 'utf8'));
const bin = readFileSync(join(OUT, 'city-structures.bin'));
const S = city.structures;
const F = Object.fromEntries(S.fields.map((f, i) => [f, i]));
for (const f of ['doorSide', 'groundMinM', 'groundMaxM', 'tier']) {
  if (F[f] === undefined) {
    console.error('city-structures.bin has no %s — run maps3d-doors.mjs first', f);
    process.exit(1);
  }
}
const rd = (i, f) => bin.readFloatLE(i * S.stride * 4 + F[f] * 4);
const recAt = (i) => ({
  widthM: rd(i, 'widthM'), depthM: rd(i, 'depthM'), storeys: rd(i, 'storeys'),
  archetype: S.archetypes[rd(i, 'archetype')], tier: rd(i, 'tier'),
  seed: rd(i, 'seed'), doorSide: rd(i, 'doorSide'), floorHeightM: rd(i, 'floorHeightM'),
  groundMinM: rd(i, 'groundMinM'), groundMaxM: rd(i, 'groundMaxM'),
});

// Tier A is a core with a corridor round it; tier C is a tree of rooms. They
// are different generators and the only thing they share is the record they
// read and the shape they hand back.
const TIER = arg('tier', 'C').toUpperCase();
const WANT = TIER === 'A' ? 3 : TIER === 'B' ? 2 : 1;
const buildInterior = TIER === 'A' ? (r) => buildA(r, buildGraph(r))
  : TIER === 'B' ? buildB
    : buildC;

const CLEARED = (S.flags && S.flags.cleared) || 8;
let skipped = 0;
const PICKED = [];
for (let i = 0; i < S.count; i++) {
  if (rd(i, 'tier') !== WANT) continue;
  // Flagged by maps3d-airfields.mjs for standing on runway pavement. It is not
  // going to be there, so it does not get an inside.
  if (F.flags !== undefined && (rd(i, 'flags') & CLEARED)) { skipped++; continue; }
  PICKED.push(i);
}
if (skipped) console.log('%d cleared for airfield pavement, not laid out', skipped);
const TIER_C = PICKED;
console.log('%s tier %s structures of %s\n',
  PICKED.length.toLocaleString('en-GB'), TIER, S.count.toLocaleString('en-GB'));

// ── The budget ──────────────────────────────────────────────────────────────

const kit = new Map();
let placements = 0; let rooms = 0; let buried = 0; let plinthed = 0; let stairless = 0;
let coreInvented = 0; let coreTooTight = 0; let escalators = 0;
let lifts = 0; let stairFlights = 0; const useCount = {};
let withLower = 0; let lowerTotal = 0; const aFalls = [];
const bKind = {}; let mezzanines = 0; let singleLoaded = 0;
let rackRuns = 0; let docks = 0; let bSlim = 0; const bFalls = [];
let worst = 0; let worstIdx = 0;
let tinyRooms = 0; let unreachable = 0;
const perLevel = []; const roomAreas = [];
const t0 = Date.now();
for (const i of TIER_C) {
  const r = recAt(i);
  const it = buildInterior(r);
  placements += it.placements.length;
  for (const [k, n] of Object.entries(it.counts)) kit.set(k, (kit.get(k) ?? 0) + n);
  for (const l of it.levels) {
    rooms += l.rooms.length;
    perLevel.push(l.rooms.length);
    for (const rm of l.rooms) { if (rm.area < 2) tinyRooms++; roomAreas.push(rm.area); }
    if (TIER === 'A') {
      // A tier A floor is reachable if every room either is the corridor, is
      // open to it, or shares an edge with it. Nothing hangs off another room.
      // A tier A floor is reachable if every room touches the corridor, or
      // touches an open zone that does. Two hops, no more: a cellular office
      // opens onto the open plan, the open plan opens onto the corridor.
      const arms = l.rooms.filter((x) => x.corridor);
      const edge = (a, b) => (Math.abs(a.x1 - b.x0) < 0.01 || Math.abs(a.x0 - b.x1) < 0.01
        ? a.y0 < b.y1 - 0.01 && a.y1 > b.y0 + 0.01
        : (Math.abs(a.y1 - b.y0) < 0.01 || Math.abs(a.y0 - b.y1) < 0.01)
          && a.x0 < b.x1 - 0.01 && a.x1 > b.x0 + 0.01);
      const opens = l.rooms.filter((x) => x.open && arms.some((a) => edge(x, a)));
      for (const rm of l.rooms) {
        if (rm.corridor || !arms.length) continue;
        if (arms.some((a) => edge(rm, a))) continue;
        if (opens.some((o) => edge(rm, o))) continue;
        unreachable++; break;
      }
    } else if (TIER === 'B') {
      // A block is a spine with units either side; a shed is one volume. Both
      // are reachable if every room touches the corridor or is the open floor.
      const spine = l.rooms.find((x) => x.corridor);
      for (const rm of l.rooms) {
        if (rm.corridor || rm.open || rm.level) continue;
        if (!spine) { unreachable++; break; }
        const t = (Math.abs(rm.x1 - spine.x0) < 0.01 || Math.abs(rm.x0 - spine.x1) < 0.01)
          ? rm.y0 < spine.y1 - 0.01 && rm.y1 > spine.y0 + 0.01
          : (Math.abs(rm.y1 - spine.y0) < 0.01 || Math.abs(rm.y0 - spine.y1) < 0.01)
            && rm.x0 < spine.x1 - 0.01 && rm.x1 > spine.x0 + 0.01;
        if (!t) { unreachable++; break; }
      }
    } else if (l.rooms.length !== l.walls + 1) {
      // Every partition wall carries exactly one door and the rooms come from a
      // binary split, so rooms = walls + 1 on every level. If that ever fails
      // the tree is not a tree and something is sealed off.
      unreachable++;
    }
  }
  if (it.stairless) stairless++;
  if (TIER === 'B') {
    bKind[it.kind] = (bKind[it.kind] ?? 0) + 1;
    if (it.mezz) mezzanines++;
    if (it.singleLoaded && !it.slim) singleLoaded++;
    if (it.slim) bSlim++;
    if (it.rackRuns) rackRuns += it.rackRuns;
    if (it.docks) docks += it.docks;
    bFalls.push(it.fall);
  }
  if (TIER === 'A') {
    if (!it.coreFromGraph) coreInvented++;
    if (!it.coreOK) coreTooTight++;
    if (it.escalator) escalators++;
    if (it.lowerLevels > 0) { withLower++; lowerTotal += it.lowerLevels; }
    aFalls.push(it.fall);
    lifts += it.lifts; stairFlights += it.stairs;
    for (const l of it.levels) useCount[l.use] = (useCount[l.use] ?? 0) + 1;
  }
  if (it.buried) buried++; else if (it.plinthM > 0.15) plinthed++;
  if (it.placements.length > worst) { worst = it.placements.length; worstIdx = i; }
}
const ms = Date.now() - t0;

console.log('instances');
console.log('  tier %s total     %s M over %s rooms', TIER,
  (placements / 1e6).toFixed(2), rooms.toLocaleString('en-GB'));
console.log('  per building     %s mean, %s worst',
  (placements / TIER_C.length).toFixed(0), worst.toLocaleString('en-GB'));
{
  const r = recAt(worstIdx);
  console.log('  worst is a %s of %d x %d m, %d storeys',
    r.archetype, Math.round(r.widthM), Math.round(r.depthM), Math.round(r.storeys));
}
console.log('  generated in     %s s (%s us a building)',
  (ms / 1000).toFixed(2), ((ms * 1000) / TIER_C.length).toFixed(0));
perLevel.sort((a, b) => a - b);
roomAreas.sort((a, b) => a - b);
const q = (arr, p) => arr[Math.floor(arr.length * p)];
console.log('  rooms per level  p50 %d   p90 %d   max %d',
  q(perLevel, 0.5), q(perLevel, 0.9), perLevel[perLevel.length - 1]);
console.log('  room area        p10 %s   p50 %s   p90 %s m2',
  q(roomAreas, 0.1).toFixed(1), q(roomAreas, 0.5).toFixed(1), q(roomAreas, 0.9).toFixed(1));

console.log('\nkit pieces, by how many the map needs — build them in this order');
const rows = [...kit].sort((a, b) => b[1] - a[1]);
for (const [k, n] of rows) {
  console.log('  %s %s  %s%%', k.padEnd(18),
    String(n.toLocaleString('en-GB')).padStart(11),
    ((n / placements) * 100).toFixed(1).padStart(5));
}
console.log('  %d distinct pieces', rows.length);

if (TIER === 'A') {
  console.log('\ncirculation');
  console.log('  %s lift cars over %s buildings, %s mean',
    lifts.toLocaleString('en-GB'), PICKED.length.toLocaleString('en-GB'),
    (lifts / PICKED.length).toFixed(1));
  console.log('  %s stair flights per floor, %s mean',
    stairFlights.toLocaleString('en-GB'), (stairFlights / PICKED.length).toFixed(2));
  console.log('  %s lobbies get escalators', escalators.toLocaleString('en-GB'));
  console.log('  core taken from the structural graph in %s, invented in %s, '
    + 'too tight for a corridor in %s',
    (PICKED.length - coreInvented).toLocaleString('en-GB'),
    coreInvented.toLocaleString('en-GB'), coreTooTight.toLocaleString('en-GB'));
  console.log('  floors by use  %s', Object.entries(useCount)
    .sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n.toLocaleString('en-GB')}`).join('   '));
}

if (TIER === 'B') {
  console.log('\nthe two halves of tier B');
  console.log('  %s', Object.entries(bKind)
    .map(([k, n]) => `${k} ${n.toLocaleString('en-GB')}`).join('   '));
  console.log('  %s blocks are too shallow for units both sides of the spine, '
    + 'and %s are too small for a spine at all — those are shafts, and get one '
    + 'open volume a floor with a single flight',
    singleLoaded.toLocaleString('en-GB'), bSlim.toLocaleString('en-GB'));
  console.log('  %s sheds get a mezzanine, %s racking runs and %s loading doors '
    + 'in all', mezzanines.toLocaleString('en-GB'),
    rackRuns.toLocaleString('en-GB'), docks.toLocaleString('en-GB'));
}

console.log('\nsitting on the ground');
if (TIER === 'B') {
  bFalls.sort((a, b) => a - b);
  console.log('  fall across the plate  p50 %s m   p90 %s m   max %s m',
    bFalls[bFalls.length >> 1].toFixed(2),
    bFalls[Math.floor(bFalls.length * 0.9)].toFixed(2),
    bFalls[bFalls.length - 1].toFixed(2));
} else if (TIER === 'A') {
  // A tower is cut into the slope, not sat on it, so plinths do not apply — the
  // downhill side comes out of the ground and becomes floor.
  aFalls.sort((a, b) => a - b);
  console.log('  fall across the plate  p50 %s m   p90 %s m   max %s m',
    aFalls[aFalls.length >> 1].toFixed(2),
    aFalls[Math.floor(aFalls.length * 0.9)].toFixed(2),
    aFalls[aFalls.length - 1].toFixed(2));
  console.log('  %s buildings are cut deep enough to gain a lower ground level, '
    + '%s such levels in all', withLower.toLocaleString('en-GB'),
    lowerTotal.toLocaleString('en-GB'));
  console.log('  %s plates too narrow for a core get a single stair against the '
    + 'long wall instead', coreTooTight.toLocaleString('en-GB'));
} else {
  console.log('  %s buildings sit level or near enough (fall under 0.15 m)',
    (PICKED.length - buried - plinthed).toLocaleString('en-GB'));
  console.log('  %s need a plinth on the low side, up to 1.2 m',
    plinthed.toLocaleString('en-GB'));
  console.log('  %s fall more than 1.2 m and need a partly buried lower level',
    buried.toLocaleString('en-GB'));
  console.log('  %s have an upper floor but no plate for a straight stair run — '
    + 'they need a spiral in the kit', stairless.toLocaleString('en-GB'));
}

console.log('\nchecks');
console.log('  connectivity     %s',
  unreachable ? `${unreachable} levels with an unreachable room` : 'every room reachable on every level');
console.log('  rooms under 2 m2 %s (furniture is skipped in these)', tinyRooms.toLocaleString('en-GB'));

let drift = 0;
for (let n = 0; n < TIER_C.length; n += 211) {
  const r = recAt(TIER_C[n]);
  const a = buildInterior(r); const b = buildInterior(r);
  if (a.placements.length !== b.placements.length) { drift++; continue; }
  for (let p = 0; p < a.placements.length; p++) {
    const x = a.placements[p]; const y = b.placements[p];
    if (x.kit !== y.kit || x.x !== y.x || x.y !== y.y || x.rot !== y.rot) { drift++; break; }
  }
}
console.log('  determinism      %s over %d sampled buildings',
  drift ? `${drift} DIFFER between runs` : 'placement for placement identical',
  Math.ceil(TIER_C.length / 211));
if (unreachable || drift) process.exit(1);

// ── Draw one ────────────────────────────────────────────────────────────────

const PLAN = arg('plan', null);
if (PLAN !== null) {
  // Pick a two-storey house of a decent size rather than the first index, so the
  // picture shows the case that matters.
  let pick = -1;
  const wanted = parseInt(PLAN, 10);
  if (Number.isFinite(wanted) && wanted >= 0 && wanted < S.count) pick = wanted;
  else {
    for (const i of TIER_C) {
      const r = recAt(i);
      if (TIER === 'A' ? Math.round(r.storeys) >= 8
        : r.archetype === 'house' && Math.round(r.storeys) === 2
        && r.widthM > 11 && r.depthM > 9) { pick = i; break; }
    }
  }
  const r = recAt(pick);
  const it = buildInterior(r);
  console.log('\nplan: structure %d — %s, %s x %s m, %d storeys, %s',
    pick, r.archetype, r.widthM.toFixed(1), r.depthM.toFixed(1),
    Math.round(r.storeys),
    TIER === 'A'
      ? `${it.lifts} lifts, ${it.stairs} stairs, ${it.escalator ? 'escalators' : 'no escalator'}`
        + `, ${it.fall.toFixed(1)} m of fall`
      : TIER === 'B'
        ? it.kind === 'warehouse'
          ? `shed, ${it.clearM.toFixed(1)} m clear, ${it.rackRuns} racking runs, `
            + `${it.docks} loading doors, ${it.mezz ? 'mezzanine' : 'no mezzanine'}`
          : `block, ${it.slim ? 'slim' : it.singleLoaded ? 'single-loaded' : 'double-loaded'}`
            + `, ${it.lift ? 'lift' : 'stairs only'}`
        : it.buried ? `buried lower level (${it.fall.toFixed(1)} m of fall)`
          : `${it.plinthM.toFixed(2)} m plinth`);

  const PAD = 30;
  const SC = 46;                       // pixels per metre
  const MAXL = parseInt(arg('planLevels', '4'), 10);
  const levels = Math.min(it.levels.length, MAXL);
  const w = Math.round(r.widthM * SC) + PAD * 2;
  const hOne = Math.round(r.depthM * SC) + PAD * 2;
  const H = hOne * levels;
  const img = Buffer.alloc(w * H * 3, 20);
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= w || y >= H) return;
    const o = (y * w + x) * 3;
    img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2];
  };
  const line = (x0, y0, x1, y1, c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      put(Math.round(x0 + ((x1 - x0) * s) / n), Math.round(y0 + ((y1 - y0) * s) / n), c);
    }
  };
  const box = (x, y, rx, ry, c) => {
    for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) put(x + i, y + j, c);
  };

  const COL = {
    wall_partition: [200, 200, 205], door_interior: [235, 170, 60],
    door_front: [255, 90, 60], door_shop: [255, 90, 60],
    window_small: [110, 190, 235], window_shopfront: [110, 190, 235],
    stair_flight: [150, 235, 150], stair_opening: [90, 150, 90],
    // tier A
    stair_flight_dogleg: [150, 235, 150], door_fire: [90, 200, 110],
    lift_shaft: [255, 120, 220], lift_door: [255, 120, 220],
    lift_door_lobby: [255, 120, 220], escalator: [255, 210, 80],
    // tier B
    door_roller: [255, 150, 60], dock_leveller: [180, 110, 50],
    rack_pallet: [130, 150, 120], mezzanine_deck: [90, 110, 150],
    stair_industrial: [150, 235, 150], window_clerestory: [110, 190, 235],
    door_revolving: [255, 90, 60], facade_curtain: [110, 190, 235],
    facade_window: [110, 190, 235], wc_block: [120, 160, 200],
  };
  for (let k = 0; k < levels; k++) {
    const oy = k * hOne;
    const px = (x) => PAD + Math.round((x + r.widthM / 2) * SC);
    const py = (y) => oy + PAD + Math.round((y + r.depthM / 2) * SC);
    // outline
    line(px(-r.widthM / 2), py(-r.depthM / 2), px(r.widthM / 2), py(-r.depthM / 2), [120, 120, 130]);
    line(px(r.widthM / 2), py(-r.depthM / 2), px(r.widthM / 2), py(r.depthM / 2), [120, 120, 130]);
    line(px(r.widthM / 2), py(r.depthM / 2), px(-r.widthM / 2), py(r.depthM / 2), [120, 120, 130]);
    line(px(-r.widthM / 2), py(r.depthM / 2), px(-r.widthM / 2), py(-r.depthM / 2), [120, 120, 130]);
    // rooms
    for (const rm of it.levels[k].rooms) {
      if (rm.corridor) {
        for (let yy = py(rm.y0); yy <= py(rm.y1); yy += 3) {
          for (let xx = px(rm.x0); xx <= px(rm.x1); xx += 3) put(xx, yy, [52, 58, 70]);
        }
      }
      line(px(rm.x0), py(rm.y0), px(rm.x1), py(rm.y0), [60, 66, 74]);
      line(px(rm.x1), py(rm.y0), px(rm.x1), py(rm.y1), [60, 66, 74]);
      line(px(rm.x1), py(rm.y1), px(rm.x0), py(rm.y1), [60, 66, 74]);
      line(px(rm.x0), py(rm.y1), px(rm.x0), py(rm.y0), [60, 66, 74]);
    }
    for (const p of it.placements) {
      if (Math.abs(p.z - it.levels[k].z) > 0.01) continue;
      const c = COL[p.kit];
      const x = px(p.x); const y = py(p.y);
      if (p.kit === 'wall_partition' || p.kit === 'wall_core') continue;
      if (c) box(x, y, 3, 3, c);
      else box(x, y, 2, 2, [130, 120, 150]);           // furniture
    }
  }

  const raw = Buffer.alloc(H * (w * 3 + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (w * 3 + 1)] = 0;
    img.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const CRC = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let x = n;
      for (let q = 0; q < 8; q++) x = x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1;
      t[n] = x;
    }
    return t;
  })();
  const crc32 = (b) => {
    let x = 0xffffffff;
    for (let i = 0; i < b.length; i++) x = CRC[(x ^ b[i]) & 0xff] ^ (x >>> 8);
    return (x ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const dest = join(OUT, arg('planName', 'interior-plan') + '.png');
  writeFileSync(dest, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log('wrote %s — %d of %d levels stacked, ground floor at the top',
  dest, levels, it.levels.length);
}
