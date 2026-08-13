// Free-roam the map that ships to Unreal, without Unreal.
//
//   node tools/flyover.mjs --out out --shots tools/flyover-shots.json
//   node tools/flyover.mjs --out out --at 0.3217,0.2802 --eye 60 --look 220
//   node tools/flyover.mjs --out out --list
//
// Every defect that has survived this pipeline was one no count could show. The
// aprons that landed on the wrong airfield, the road that stepped 105 cm, the
// three ramps on MCRD land, the flight lines that were not in the buffer at
// all — each of them passed its assertions, printed a healthy log, and was
// caught by somebody opening the editor and looking. That is a very slow way to
// find out, and it puts a human in the loop for something a machine can see.
//
// So this renders the shipped bytes in perspective. It reads city.json,
// city-buildings.bin and sandiego.r16 — the same files copied into
// Tools/Heightmaps, not a parallel description of them — places a camera
// anywhere in the frame and takes a picture, using the same palette
// Tools/build_sandiego.py imports with and the same placement arithmetic it
// applies.
//
// WHAT THIS PROVES AND WHAT IT DOES NOT
//
// It proves geometry: where a part is, how big it is, which way it points,
// whether it stands on the ground or floats over it, whether it intersects
// something it should not. That is the whole class of bug this project keeps
// producing.
//
// It cannot prove anything the engine owns — materials, lighting, LOD popping,
// HISM cull distances, collision, streaming. If this looks right and the editor
// does not, the fault is on the Unreal side, which is a much smaller place to
// look. Same bargain maps3d-preview.mjs makes for the landscape material.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const has = (n) => args.includes('--' + n);

const DIR = resolve(arg('out', 'out'));
const SHOTDIR = resolve(arg('shots-out', 'shots'));
const W = parseInt(arg('res', '1280'), 10);
const H = parseInt(arg('height', '720'), 10);
// How far the camera can see. Everything inside this radius is sent to the
// renderer and everything outside it is not: the buffer is 1.57 M parts and the
// headless browser has no GPU, so drawing the whole city to photograph one
// street corner is how this ends up taking an hour per shot.
const RADIUS = parseFloat(arg('radius', '700'));
const kindSet = (n) => {
  const s = arg(n, null);
  if (!s) return null;
  const set = new Set(s.split(',').map((x) => x.trim()));
  return set;
};

const side = JSON.parse(readFileSync(join(DIR, 'sandiego.json'), 'utf8'));
const city = JSON.parse(readFileSync(join(DIR, 'city.json'), 'utf8'));
const RES = side.resolution;
const FRAME = side.frameMetres.width;
const LO = side.heightRangeMetres.min;
const HI = side.heightRangeMetres.max;
const M_PER_SAMPLE = FRAME / (RES - 1);
const STRIDE = city.buildingStride ?? 10;
const KINDS = city.kinds ?? ['building'];

const r16 = readFileSync(join(DIR, 'sandiego.r16'));
const height = new Float32Array(RES * RES);
for (let i = 0; i < height.length; i++) {
  height[i] = LO + (r16.readUInt16LE(i * 2) / 65535) * (HI - LO);
}
const groundAt = (u, v) => {
  const c = Math.min(RES - 1, Math.max(0, Math.round(u * (RES - 1))));
  const r = Math.min(RES - 1, Math.max(0, Math.round(v * (RES - 1))));
  return height[r * RES + c];
};

const bin = readFileSync(join(DIR, 'city-buildings.bin'));
const PARTS = bin.length / (STRIDE * 4);
if (!Number.isInteger(PARTS)) {
  console.error('city-buildings.bin is %d bytes, which is not a whole number of '
    + '%d-field parts', bin.length, STRIDE);
  process.exit(1);
}

// The same colours Tools/build_sandiego.py imports with, so a part that looks
// wrong here looks wrong there for the same reason. Kept as a plain table
// rather than parsed out of the Python, because the two drifting apart is
// exactly the failure this file exists to catch — and a kind with no colour is
// reported rather than quietly drawn grey.
const PALETTE = {
  building: [0.402, 0.386, 0.358],
  pad: [0.430, 0.424, 0.412],
  road_deck: [0.052, 0.051, 0.055],
  line_white: [0.880, 0.880, 0.860],
  line_yellow: [0.880, 0.680, 0.130],
  kerb: [0.560, 0.556, 0.540],
  path: [0.512, 0.470, 0.398],
  lamp_post: [0.470, 0.478, 0.486],
  lamp: [0.780, 0.760, 0.700],
  sign_post: [0.550, 0.560, 0.570],
  sign: [0.055, 0.235, 0.145],
  water: [0.036, 0.114, 0.130],
  pier: [0.520, 0.514, 0.500],
  tree: [0.118, 0.170, 0.086],
  tree_trunk: [0.128, 0.104, 0.078],
  shrub: [0.176, 0.190, 0.116],
  rock: [0.310, 0.288, 0.252],
  runway: [0.318, 0.316, 0.308],
  runway_centreline: [0.900, 0.900, 0.880],
  runway_threshold: [0.920, 0.920, 0.900],
  runway_light: [0.760, 0.700, 0.320],
  taxiway: [0.105, 0.102, 0.098],
};
const ONLY = kindSet('only');
const HIDE = kindSet('hide');
for (const s of [ONLY, HIDE]) {
  for (const k of s ?? []) {
    if (!KINDS.includes(k)) {
      console.error('no kind called %s in this buffer — it has %s', k,
        KINDS.join(', '));
      process.exit(1);
    }
  }
}

const missing = KINDS.filter((k) => !PALETTE[k]);
if (missing.length) {
  console.error('no colour for %s — add them rather than letting them render '
    + 'grey, which is how 741 airfield parts hid in plain sight',
    missing.join(', '));
  process.exit(1);
}

// Flags, as maps3d writes them and build_sandiego.py reads them.
const FLAG_WATER = 2;
const FLAG_STRUCTURE = 4;
const FLAG_CLEARED = 8;
const BUILDING_SINK_M = 1.8;

// ── A grid over the parts, so a shot costs its own neighbourhood ────────────
const CELL_M = 250;
const GRID = Math.ceil(FRAME / CELL_M);
const cells = new Map();
for (let i = 0; i < PARTS; i++) {
  const o = i * STRIDE * 4;
  const u = bin.readFloatLE(o);
  const v = bin.readFloatLE(o + 4);
  const key = Math.floor((v * FRAME) / CELL_M) * GRID
    + Math.floor((u * FRAME) / CELL_M);
  let a = cells.get(key);
  if (!a) { a = []; cells.set(key, a); }
  a.push(i);
}

// Placement, matching Tools/build_sandiego.py field for field. If these two ever
// disagree the render is a lie, so the arithmetic is transcribed rather than
// reinvented: same sink rule, same water rule, same cleared-flag skip.
function place(i) {
  const o = i * STRIDE * 4;
  const u = bin.readFloatLE(o);
  const v = bin.readFloatLE(o + 4);
  const rot = bin.readFloatLE(o + 8);
  const w = bin.readFloatLE(o + 12);
  const d = bin.readFloatLE(o + 16);
  const h = bin.readFloatLE(o + 20);
  const kind = bin.readFloatLE(o + 24) | 0;
  const flags = bin.readFloatLE(o + 28) | 0;
  const base = bin.readFloatLE(o + 32);
  let pitch = STRIDE > 9 ? bin.readFloatLE(o + 36) : 0;
  if (pitch !== pitch) pitch = 0;

  if (flags & FLAG_CLEARED) return null;
  const onWater = !!(flags & FLAG_WATER);
  const structure = !!(flags & FLAG_STRUCTURE);
  let ground = groundAt(u, v);
  if (onWater) ground = 0;
  else if (ground < 0.6 && !structure) return null;

  const sink = (Math.abs(base) > 0.01 || onWater || structure)
    ? 0 : Math.min(BUILDING_SINK_M, h * 0.25);

  return {
    x: u * FRAME,
    y: v * FRAME,
    z: ground + base - sink + h / 2,
    w, d, h, rot, pitch, kind,
  };
}

// ── Where to point it ───────────────────────────────────────────────────────
//
// Named places. These are given as latitude and longitude, not as u,v, because
// the first version of this table was hand-picked in u,v and every entry was
// wrong — the KSAN one by 740 m, which put the camera in a suburb looking at
// nothing and would have been reported as "the runways are still missing".
// A real coordinate can be checked against the world; a guessed one cannot.
const { lat: LAT0, lon: LON0 } = side.centre;
const COS_LAT = side.mercatorToGround;
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320;
const toUV = (lat, lon) => [
  0.5 + ((lon - LON0) * M_PER_DEG_LON * COS_LAT) / FRAME,
  0.5 - ((lat - LAT0) * M_PER_DEG_LAT) / FRAME,
];

const PLACES = {
  ksan: [32.7325, -117.1897, 'San Diego International, midpoint of 09/27'],
  northisland: [32.6999, -117.2129, 'NAS North Island, between 18/36 and 11/29'],
  downtown: [32.7157, -117.1611, 'downtown, the tower cluster'],
  coronado: [32.6915, -117.1470, 'the Coronado bridge crossing'],
  pointloma: [32.6722, -117.2415, 'Point Loma at Cabrillo, the steep west side'],
  mcrd: [32.7400, -117.1980, 'MCRD, where three ramps once landed'],
  zoo: [32.7353, -117.1490, 'Balboa Park and the zoo'],
  // Not Kearny Mesa. That POI belongs to the JS prototype world in
  // src/world/geo, which is synthesised and unbounded; this capture is a
  // 13.2 x 11.8 km frame centred on downtown, and Kearny Mesa is 12.6 km north
  // of it — outside the playable area entirely. The guard below is what caught
  // it, and is why every place is checked rather than trusted.
  oldtown: [32.7550, -117.1970, 'Old Town and the Mission Valley mouth'],
};

// A place outside the playable area is a camera pointed at out-of-bounds ring
// terrain, which renders as an empty green field and reads exactly like "the
// thing I was looking for was never built".
{
  const halfU = side.playableMetres.width / FRAME / 2;
  const halfV = side.playableMetres.height / FRAME / 2;
  const bad = Object.entries(PLACES).filter(([, [lat, lon]]) => {
    const [u, v] = toUV(lat, lon);
    return Math.abs(u - 0.5) > halfU || Math.abs(v - 0.5) > halfV;
  });
  if (bad.length) {
    console.error('%s is outside the playable area — the capture is %s x %s km '
      + 'centred on %s, %s', bad.map(([k]) => k).join(', '),
      (side.playableMetres.width / 1000).toFixed(1),
      (side.playableMetres.height / 1000).toFixed(1), LAT0, LON0);
    process.exit(1);
  }
}

// Where a kind actually is, according to the buffer rather than according to
// me. `--find runway` answers "did this get built, and where", which is the
// question that went unanswered for a week while the answer was "it is not in
// the file at all".
if (has('find')) {
  const want = arg('find', '');
  const seen = new Map();
  for (let i = 0; i < PARTS; i++) {
    const o = i * STRIDE * 4;
    const k = KINDS[bin.readFloatLE(o + 24) | 0];
    if (want && k !== want) continue;
    let a = seen.get(k);
    if (!a) { a = { n: 0, u: 0, v: 0, u0: 1, u1: 0, v0: 1, v1: 0 }; seen.set(k, a); }
    const u = bin.readFloatLE(o); const v = bin.readFloatLE(o + 4);
    a.n++; a.u += u; a.v += v;
    a.u0 = Math.min(a.u0, u); a.u1 = Math.max(a.u1, u);
    a.v0 = Math.min(a.v0, v); a.v1 = Math.max(a.v1, v);
  }
  if (!seen.size) {
    console.error('no parts of kind %s in the buffer — it has %s',
      want, KINDS.join(', '));
    process.exit(1);
  }
  for (const [k, a] of [...seen].sort((x, y) => y[1].n - x[1].n)) {
    console.log('%s  n=%s  centroid u %s v %s  spans %s x %s m', k.padEnd(18),
      a.n.toLocaleString('en-GB'), (a.u / a.n).toFixed(4), (a.v / a.n).toFixed(4),
      ((a.u1 - a.u0) * FRAME).toFixed(0), ((a.v1 - a.v0) * FRAME).toFixed(0));
  }
  process.exit(0);
}

if (has('list')) {
  console.log('places (%d):', Object.keys(PLACES).length);
  for (const [k, [lat, lon, what]] of Object.entries(PLACES)) {
    const [u, v] = toUV(lat, lon);
    console.log('  %s  %s, %s  ->  u %s v %s  — %s', k.padEnd(12),
      lat.toFixed(4), lon.toFixed(4), u.toFixed(4), v.toFixed(4), what);
  }
  process.exit(0);
}

// A shot is a camera: where it stands, which way it looks, how high its eye is.
// `look` is a compass-style bearing in degrees so a shot list is writable by
// hand; `tilt` is negative to look down.
function shotsFromArgs() {
  const file = arg('shots', null);
  if (file) return JSON.parse(readFileSync(file, 'utf8'));
  const at = arg('at', null);
  const place = arg('place', null);
  let u; let v; let name;
  if (place) {
    if (!PLACES[place]) {
      console.error('no place called %s — try --list', place);
      process.exit(1);
    }
    [u, v] = toUV(PLACES[place][0], PLACES[place][1]); name = place;
  } else if (at) {
    [u, v] = at.split(',').map(Number); name = arg('name', 'shot');
  } else {
    console.error('need --place, --at u,v or --shots file.json (--list for names)');
    process.exit(1);
  }
  return [{
    name,
    u,
    v,
    eye: parseFloat(arg('eye', '25')),
    look: parseFloat(arg('look', '0')),
    tilt: parseFloat(arg('tilt', '-12')),
    fov: parseFloat(arg('fov', '70')),
  }];
}
const shots = shotsFromArgs();

// ── Gather one shot's worth of world ────────────────────────────────────────
function gather(shot) {
  const cx = shot.u * FRAME;
  const cy = shot.v * FRAME;
  const c0 = Math.floor((cx - RADIUS) / CELL_M);
  const c1 = Math.floor((cx + RADIUS) / CELL_M);
  const r0 = Math.floor((cy - RADIUS) / CELL_M);
  const r1 = Math.floor((cy + RADIUS) / CELL_M);
  const byKind = new Map();
  let n = 0;
  // `--only runway,taxiway` answers "is it there and where", which a full scene
  // cannot: a runway is grey asphalt laid flat among grey asphalt laid flat.
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const a = cells.get(r * GRID + c);
      if (!a) continue;
      for (const i of a) {
        const p = place(i);
        if (!p) continue;
        if (ONLY && !ONLY.has(KINDS[p.kind])) continue;
        if (HIDE && HIDE.has(KINDS[p.kind])) continue;
        if (Math.hypot(p.x - cx, p.y - cy) > RADIUS) continue;
        let k = byKind.get(p.kind);
        if (!k) { k = []; byKind.set(p.kind, k); }
        k.push(p);
        n++;
      }
    }
  }

  // Terrain patch, as a grid of samples the page turns into a mesh.
  const pad = RADIUS + 60;
  const s0c = Math.max(0, Math.floor((cx - pad) / M_PER_SAMPLE));
  const s1c = Math.min(RES - 1, Math.ceil((cx + pad) / M_PER_SAMPLE));
  const s0r = Math.max(0, Math.floor((cy - pad) / M_PER_SAMPLE));
  const s1r = Math.min(RES - 1, Math.ceil((cy + pad) / M_PER_SAMPLE));
  const tw = s1c - s0c + 1;
  const th = s1r - s0r + 1;
  const terrain = new Float32Array(tw * th);
  for (let r = 0; r < th; r++) {
    for (let c = 0; c < tw; c++) {
      terrain[r * tw + c] = height[(s0r + r) * RES + (s0c + c)];
    }
  }

  const groups = [];
  for (const [kind, list] of byKind) {
    const m = new Float32Array(list.length * 8);
    list.forEach((p, i) => {
      const o = i * 8;
      m[o] = p.x; m[o + 1] = p.y; m[o + 2] = p.z;
      m[o + 3] = p.w; m[o + 4] = p.d; m[o + 5] = p.h;
      m[o + 6] = p.rot; m[o + 7] = p.pitch;
    });
    groups.push({ kind: KINDS[kind], colour: PALETTE[KINDS[kind]], n: list.length, m: [...m] });
  }
  return {
    groups,
    parts: n,
    terrain: {
      x0: s0c * M_PER_SAMPLE,
      y0: s0r * M_PER_SAMPLE,
      step: M_PER_SAMPLE,
      w: tw,
      h: th,
      z: [...terrain],
    },
    cam: {
      x: cx,
      y: cy,
      z: groundAt(shot.u, shot.v) + (shot.eye ?? 25),
      look: shot.look ?? 0,
      tilt: shot.tilt ?? -12,
      fov: shot.fov ?? 70,
    },
  };
}

// ── The page ────────────────────────────────────────────────────────────────
//
// Z-up and metres, matching Unreal rather than three.js's Y-up default, so the
// numbers in the buffer go straight in without a mental transform in between —
// which is where a sign flip would hide.
//
// Rotation is the one place the two engines genuinely differ. maps3d stores a
// heading as atan2(dir.y, dir.x), so a part's local +X must end up pointing
// along (cos rot, sin rot): that is a right-handed turn about +Z. Unreal's
// positive pitch RAISES local +X, which about the +Y axis of a right-handed
// frame is a NEGATIVE rotation — hence the minus. Get this wrong and every
// deck on a hill leans backwards, which is visible immediately and is the point
// of rendering it at all.
const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;overflow:hidden;background:#8fb4d8}canvas{display:block}</style>
</head><body>
<script type="importmap">{"imports":{"three":"/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';
window.__render = async (S) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(${W}, ${H}, false);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fb4d8);
  scene.fog = new THREE.Fog(0x8fb4d8, ${RADIUS * 0.55}, ${RADIUS * 1.15});

  // Z-up world.
  const cam = new THREE.PerspectiveCamera(S.cam.fov, ${W} / ${H}, 0.5, ${RADIUS * 2});
  cam.up.set(0, 0, 1);
  cam.position.set(S.cam.x, S.cam.y, S.cam.z);
  const yaw = S.cam.look * Math.PI / 180;
  const tilt = S.cam.tilt * Math.PI / 180;
  cam.lookAt(
    S.cam.x + Math.cos(yaw) * Math.cos(tilt) * 100,
    S.cam.y + Math.sin(yaw) * Math.cos(tilt) * 100,
    S.cam.z + Math.sin(tilt) * 100);

  // A sun low enough in the south-west to throw the long shadows that make a
  // slope legible. A flat-lit render hides exactly the defect being hunted.
  const sun = new THREE.DirectionalLight(0xfff2dd, 2.4);
  sun.position.set(-0.5, -0.7, 0.9);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbcd6f0, 0x3a3428, 1.1));

  // Terrain.
  const T = S.terrain;
  const geo = new THREE.PlaneGeometry(
    (T.w - 1) * T.step, (T.h - 1) * T.step, T.w - 1, T.h - 1);
  const pos = geo.attributes.position;
  for (let r = 0; r < T.h; r++) {
    for (let c = 0; c < T.w; c++) pos.setZ(r * T.w + c, T.z[r * T.w + c]);
  }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.34, 0.36, 0.26), roughness: 0.95 }));
  ground.position.set(
    T.x0 + ((T.w - 1) * T.step) / 2, T.y0 + ((T.h - 1) * T.step) / 2, 0);
  scene.add(ground);

  // Parts, one InstancedMesh per kind.
  const box = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();
  for (const g of S.groups) {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(g.colour[0], g.colour[1], g.colour[2]),
      roughness: 0.85 });
    const inst = new THREE.InstancedMesh(box, mat, g.n);
    for (let i = 0; i < g.n; i++) {
      const o = i * 8;
      dummy.position.set(g.m[o], g.m[o + 1], g.m[o + 2]);
      dummy.rotation.set(0, -g.m[o + 7] * Math.PI / 180, g.m[o + 6] * Math.PI / 180, 'ZYX');
      dummy.scale.set(g.m[o + 3], g.m[o + 4], g.m[o + 5]);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
  }

  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
};
</script></body></html>`;

// ── Serve, shoot, write ─────────────────────────────────────────────────────
const three = readFileSync('node_modules/three/build/three.module.js');
const server = createServer((req, res) => {
  if (req.url === '/three.module.js') {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    res.end(three);
  } else {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(PAGE);
  }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

if (!existsSync(SHOTDIR)) mkdirSync(SHOTDIR, { recursive: true });
// There is no GPU here, so WebGL runs on SwiftShader. That is slow but exact,
// which is the right trade for a tool whose whole job is to be believed.
// CHROME_PATH lets a machine with a Playwright build that does not match its
// browser cache point at the one it has, rather than downloading another.
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => { console.error('page error:', e.message); });
await page.goto(`http://127.0.0.1:${port}/`);

for (const shot of shots) {
  const t0 = Date.now();
  const scene = gather(shot);
  const url = await page.evaluate((s) => window.__render(s), scene);
  const png = Buffer.from(url.split(',')[1], 'base64');
  const out = join(SHOTDIR, `${shot.name}.png`);
  writeFileSync(out, png);
  console.log('%s  %s parts, %s x %s, %ss  ->  %s',
    shot.name.padEnd(16), scene.parts.toLocaleString('en-GB'), W, H,
    ((Date.now() - t0) / 1000).toFixed(1), out);
}

await browser.close();
server.close();
