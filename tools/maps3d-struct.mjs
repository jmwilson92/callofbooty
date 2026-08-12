// Runs the structural graph over the whole map and proves the numbers the
// architecture rests on.
//
//   node tools/maps3d-struct.mjs --out out
//
// Nothing is written. The graph is derived from the record and never stored, so
// what this produces is evidence: how many elements the map really has, how many
// bytes of damage state that is, how long a building takes to build and solve,
// and whether the collapse rule does anything sensible when a tower is hit.
//
// The budget in docs/07-map-architecture.md was an estimate made before any of
// this existed. If the real number disagrees with it, the document is wrong and
// gets corrected — that is the point of running it.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildGraph, solve, collapse, stateBytes, KIND, KIND_NAME, STATE,
} from './structgraph.mjs';

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
const need = ['widthM', 'depthM', 'storeys', 'archetype', 'tier', 'seed'];
for (const f of need) {
  if (F[f] === undefined) {
    console.error('city-structures.bin has no %s field — run maps3d-city.mjs '
      + 'and maps3d-doors.mjs first', f);
    process.exit(1);
  }
}
const rd = (i, f) => bin.readFloatLE(i * S.stride * 4 + F[f] * 4);
const recAt = (i) => ({
  widthM: rd(i, 'widthM'), depthM: rd(i, 'depthM'),
  storeys: rd(i, 'storeys'), archetype: S.archetypes[rd(i, 'archetype')],
  tier: rd(i, 'tier'), seed: rd(i, 'seed'),
});

console.log('%d structures, %d fields\n', S.count, S.stride);

// ── The budget ──────────────────────────────────────────────────────────────

const byKind = [0, 0, 0, 0];
const byTier = [0, 0, 0, 0];
const byArch = new Map();
let total = 0; let worst = 0; let worstIdx = 0; let cored = 0;
const t0 = Date.now();
for (let i = 0; i < S.count; i++) {
  const rec = recAt(i);
  const g = buildGraph(rec);
  if (!g.count) continue;
  total += g.count;
  byTier[rec.tier] += g.count;
  byArch.set(rec.archetype, (byArch.get(rec.archetype) ?? 0) + g.count);
  if (g.coreBay >= 0) cored++;
  byKind[KIND.COLUMN] += g.perStoreyCols * g.storeys;   // core columns included
  byKind[KIND.SLAB] += g.perStoreySlabs * g.storeys;
  byKind[KIND.WALL] += g.perStoreyWalls * g.storeys;
  if (g.count > worst) { worst = g.count; worstIdx = i; }
}
const buildMs = Date.now() - t0;

console.log('structural elements');
console.log('  total            %s M', (total / 1e6).toFixed(2));
for (const [k, n] of [...byArch].sort((a, b) => b[1] - a[1])) {
  console.log('  %s %s M  (%s%%)', k.padEnd(15), (n / 1e6).toFixed(2),
    ((n / total) * 100).toFixed(1).padStart(4));
}
console.log('  by tier          A %s M   B %s M   C %s M',
  (byTier[3] / 1e6).toFixed(2), (byTier[2] / 1e6).toFixed(2), (byTier[1] / 1e6).toFixed(2));
console.log('  by element       columns %s M   slabs %s M   walls %s M',
  (byKind[KIND.COLUMN] / 1e6).toFixed(2), (byKind[KIND.SLAB] / 1e6).toFixed(2),
  (byKind[KIND.WALL] / 1e6).toFixed(2));
console.log('  %s structures have a circulation core', cored.toLocaleString('en-GB'));

console.log('\ndamage state at two bits an element');
console.log('  whole map        %s MB', (total / 4 / 1e6).toFixed(2));
{
  const g = buildGraph(recAt(worstIdx));
  const r = recAt(worstIdx);
  console.log('  worst building   %s elements = %s KB  (%s, %d storeys, %d x %d m, %dx%d bays)',
    worst.toLocaleString('en-GB'), (stateBytes(g) / 1024).toFixed(1),
    r.archetype, g.storeys, Math.round(r.widthM), Math.round(r.depthM), g.nx, g.ny);
}
console.log('  built all %s graphs in %s s (%s us each)',
  S.count.toLocaleString('en-GB'), (buildMs / 1000).toFixed(2),
  ((buildMs * 1000) / S.count).toFixed(1));

// ── Determinism ─────────────────────────────────────────────────────────────
//
// The server and a client that joined ten minutes later must produce the same
// graph from the same record, or they disagree about which element the shell
// just hit. Same seed, same everything — checked rather than assumed.

let mismatch = 0;
for (let i = 0; i < S.count; i += 97) {
  const a = buildGraph(recAt(i));
  const b = buildGraph(recAt(i));
  if (a.count !== b.count || a.coreBay !== b.coreBay || a.nx !== b.nx || a.ny !== b.ny) mismatch++;
}
console.log('\ndeterminism: %s over %d sampled structures',
  mismatch ? `${mismatch} MISMATCHES` : 'identical', Math.ceil(S.count / 97));

// ── Does the collapse rule do anything sensible ─────────────────────────────

const tallest = (() => {
  let b = 0;
  for (let i = 0; i < S.count; i++) if (rd(i, 'heightM') > rd(b, 'heightM')) b = i;
  return b;
})();
const rec = recAt(tallest);
console.log('\ncollapse, on the tallest building on the map — %s, %d storeys, %d x %d m',
  rec.archetype, Math.round(rec.storeys), Math.round(rec.widthM), Math.round(rec.depthM));

const scenario = (name, hit) => {
  const g = buildGraph(rec);
  const state = new Uint8Array(g.count);
  const struck = hit(g, state);
  const t = process.hrtime.bigint();
  const { collapsed, rounds } = collapse(g, state);
  const us = Number(process.hrtime.bigint() - t) / 1000;
  let standing = 0;
  for (let i = 0; i < g.count; i++) if (state[i] !== STATE.DESTROYED) standing++;
  console.log('  %s', name);
  console.log('    struck %d, brought down %d more, %s of %s left standing (%s%%), %d rounds, %s us',
    struck, collapsed - struck, standing.toLocaleString('en-GB'),
    g.count.toLocaleString('en-GB'), ((standing / g.count) * 100).toFixed(1),
    rounds, us.toFixed(0));
  return rounds;
};

let maxRounds = 0;
maxRounds = Math.max(maxRounds, scenario(
  'one ground-floor corner column taken out',
  (g, s) => { s[g.columnAt(0, 0, 0)] = STATE.DESTROYED; return 1; },
));
maxRounds = Math.max(maxRounds, scenario(
  'the whole ground floor column line down one long side',
  (g, s) => {
    let n = 0;
    for (let i = 0; i <= g.nx; i++) { s[g.columnAt(0, i, 0)] = STATE.DESTROYED; n++; }
    return n;
  },
));
maxRounds = Math.max(maxRounds, scenario(
  'every ground-floor column — the building has nothing left to stand on',
  (g, s) => {
    let n = 0;
    for (let j = 0; j <= g.gy - 1; j++) for (let i = 0; i <= g.gx - 1; i++) {
      s[g.columnAt(0, i, j)] = STATE.DESTROYED; n++;
    }
    return n;
  },
));
maxRounds = Math.max(maxRounds, scenario(
  'a shell through the middle: every column on storey 24',
  (g, s) => {
    const k = Math.min(g.storeys - 1, 24);
    let n = 0;
    for (let j = 0; j < g.gy; j++) for (let i = 0; i < g.gx; i++) {
      s[g.columnAt(k, i, j)] = STATE.DESTROYED; n++;
    }
    return n;
  },
));

// ── The invariant ───────────────────────────────────────────────────────────
//
// solve() already resolves the whole load path in one sweep, so applying it can
// never expose something it did not already account for: the second round must
// always find nothing. If that ever stops being true the sweep has a dependency
// pointing the wrong way, and a building would settle in stages instead of at
// once. Worth asserting on real geometry rather than reasoning about it.

let bad = 0; let checked = 0;
for (let i = 0; i < S.count; i += 31) {
  const g = buildGraph(recAt(i));
  if (g.count < 8) continue;
  const state = new Uint8Array(g.count);
  const r = ((i * 2654435761) >>> 0) / 4294967296;
  for (let k = 0; k < g.count; k++) if (((k * 31 + i) % 97) / 97 < 0.05 + r * 0.2) {
    state[k] = STATE.DESTROYED;
  }
  const { rounds } = collapse(g, state);
  checked++;
  if (rounds > 2) bad++;
}
console.log('\nfixed point: %s over %d structures with 5-25%% of elements shot out',
  bad ? `${bad} needed more than 2 rounds` : 'always reached in 2 rounds', checked);
if (bad) process.exit(1);
