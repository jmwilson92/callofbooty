// Draws the generated city as a plan view PNG, so it can be looked at.
//
// This exists for the same reason the shaded-relief preview does: the only way
// to know whether a generated city looks like San Diego is to look at it, and
// waiting for a 4000-pixel heightmap to import into Unreal before finding out
// that the grid ran into the bay is a very slow way to iterate. Rendering the
// plan takes a few seconds and catches almost everything.
//
//   node tools/render-city.mjs [--res 2200] [--out city.png] [--only downtown]
//
// Green is untouched ground, grey is street, and buildings are shaded by
// height — dark for a bungalow, near-white for a tower.

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { FRAME } from '../src/world/geo/SanDiegoGeo.js';
import { generateCity, buildField, landAt, elevAt, slopeAt } from '../src/world/geo/CityFabric.js';
import { DISTRICTS } from '../src/world/geo/SanDiegoDistricts.js';

const args = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

const W = parseInt(arg('res', '2200'), 10);
const H = Math.round(W * (FRAME.heightM / FRAME.widthM));
const OUT = arg('out', 'city-preview.png');
const ONLY = arg('only', null);

// ── PNG, 8-bit RGB ──────────────────────────────────────────────────────────
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function writePng(path, rgb, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;      // bit depth
  ihdr[9] = 2;      // colour type: truecolour
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    rgb.copy(raw, y * (1 + w * 3) + 1, y * w * 3, (y + 1) * w * 3);
  }
  writeFileSync(path, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

// ── Canvas ──────────────────────────────────────────────────────────────────
const px = Buffer.alloc(W * H * 3);
const put = (x, y, r, g, b) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
};

const toX = (u) => u * (W - 1);
const toY = (v) => v * (H - 1);

/** Thick line in pixel space, drawn as a swept disc. Slow but obvious. */
function line(u0, v0, u1, v1, widthM, r, g, b) {
  const x0 = toX(u0);
  const y0 = toY(v0);
  const x1 = toX(u1);
  const y1 = toY(v1);
  const rad = Math.max(0.6, (widthM / FRAME.widthM) * W * 0.5);
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  const ri = Math.ceil(rad);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = x0 + (x1 - x0) * t;
    const cy = y0 + (y1 - y0) * t;
    for (let dy = -ri; dy <= ri; dy++) {
      for (let dx = -ri; dx <= ri; dx++) {
        if (dx * dx + dy * dy > rad * rad) continue;
        put(Math.round(cx + dx), Math.round(cy + dy), r, g, b);
      }
    }
  }
}

/** Filled, rotated rectangle — a building footprint. */
function rect(u, v, wM, dM, rotDeg, r, g, b) {
  const t = (rotDeg * Math.PI) / 180;
  const ex = [Math.cos(t), Math.sin(t)];
  const ey = [-Math.sin(t), Math.cos(t)];
  const hw = wM / 2;
  const hd = dM / 2;
  const cx = u * FRAME.widthM;
  const cy = v * FRAME.heightM;
  const sx = W / FRAME.widthM;
  const sy = H / FRAME.heightM;
  const na = Math.max(1, Math.ceil(wM * sx));
  const nb = Math.max(1, Math.ceil(dM * sy));
  for (let i = 0; i <= na; i++) {
    const a = -hw + (wM * i) / na;
    for (let j = 0; j <= nb; j++) {
      const bb = -hd + (dM * j) / nb;
      const x = (cx + ex[0] * a + ey[0] * bb) * sx;
      const y = (cy + ex[1] * a + ey[1] * bb) * sy;
      put(Math.round(x), Math.round(y), r, g, b);
    }
  }
}

// ── Terrain underlay ────────────────────────────────────────────────────────
console.log('rasterising the buildability field...');
const field = buildField(1400);

for (let y = 0; y < H; y++) {
  const v = y / (H - 1);
  for (let x = 0; x < W; x++) {
    const u = x / (W - 1);
    const l = landAt(field, u, v);
    if (l <= 0) {
      put(x, y, 26, 44, 68);
      continue;
    }
    const e = elevAt(field, u, v);
    const s = slopeAt(field, u, v);
    // Flat ground pale, steep ground dark: the canyons should read as a
    // drainage network before a single street is drawn.
    const shade = Math.max(0, 1 - s * 3.4);
    const hi = Math.min(1, e / 140);
    const r = Math.round((58 + hi * 46) * (0.42 + shade * 0.58));
    const g = Math.round((74 + hi * 34) * (0.42 + shade * 0.58));
    const b = Math.round((48 + hi * 30) * (0.42 + shade * 0.58));
    put(x, y, r, g, b);
  }
}

// ── The city ────────────────────────────────────────────────────────────────
console.log('generating the city...');
const t0 = Date.now();
const city = generateCity({ field, only: ONLY ? ONLY.split(',') : null });
console.log('  %d streets, %d buildings in %ss',
  city.streets.length, city.buildings.length, ((Date.now() - t0) / 1000).toFixed(1));

for (const s of city.streets) {
  for (let i = 1; i < s.pts.length; i++) {
    line(s.pts[i - 1][0], s.pts[i - 1][1], s.pts[i][0], s.pts[i][1], s.w, 86, 86, 90);
  }
}
for (const a of city.arterials) {
  for (let i = 1; i < a.pts.length; i++) {
    line(a.pts[i - 1][0], a.pts[i - 1][1], a.pts[i][0], a.pts[i][1], a.w, 128, 122, 112);
  }
}
for (const b of city.buildings) {
  const t = Math.min(1, b.h / 90);
  const g = Math.round(120 + t * 130);
  rect(b.u, b.v, b.w, b.d, b.rot, Math.round(112 + t * 138), g, Math.round(104 + t * 140));
}

// District outlines last, thin and bright, so it is obvious which cell is
// which. Off by default now that districts spread past them — the outline is
// where a neighbourhood is declared, not where its fabric ends, and drawing it
// over a continuous grid makes the city look chopped up when it is not.
for (const d of args.includes('--outlines') ? DISTRICTS : []) {
  if (ONLY && !ONLY.split(',').includes(d.id)) continue;
  for (let i = 0; i < d.poly.length; i++) {
    const a = d.poly[i];
    const b = d.poly[(i + 1) % d.poly.length];
    line(a[0], a[1], b[0], b[1], 12, 220, 80, 60);
  }
}

writePng(OUT, px, W, H);
console.log('wrote %s (%dx%d)', OUT, W, H);
console.log();
for (const s of city.stats) {
  console.log('  %s %s streets %s buildings',
    s.id.padEnd(20), String(s.streets).padStart(5), String(s.buildings).padStart(7));
}
