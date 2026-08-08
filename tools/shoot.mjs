#!/usr/bin/env node
// World screenshot tool.
//
//   npm run dev                         # in one terminal
//   node tools/shoot.mjs <shots.json>   # in another
//   node tools/shoot.mjs --poi downtown --out shots/
//
// Drives __game.freeCam() so the view is detached from the player — the
// simulation keeps ticking the controller underneath, which is why moving the
// player was never a reliable way to frame a shot.
//
// A shot is [name, x, y, z, pitchRad, yawRad]. Yaw 0 looks north (−Z),
// +PI/2 looks west (−X); negative pitch looks down.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

// Ambient occlusion runs far too slowly under the software rasteriser to
// capture with, so post-processing is off unless explicitly asked for (--fx).
const WANT_FX = process.argv.includes('--fx');
const BASE_URL = process.env.GAME_URL || 'http://localhost:5173/';
const URL = WANT_FX ? BASE_URL : BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + 'fx=0';
const args = process.argv.slice(2);

function flag(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const outDir = flag('--out', 'shots');
const width = Number(flag('--width', 1400));
const height = Number(flag('--height', 900));

// Framing presets per POI: an aerial and a ground-level view of each.
const POI_SHOTS = {
  downtown: [['downtown-air', 140, 260, 620, -0.60, 0], ['downtown-street', 142, 38, 300, -0.02, 0]],
  mcrd: [['mcrd-air', -110, 150, 75, -0.70, 0], ['mcrd-deck', -60, 43, -80, -0.02, Math.PI / 2]],
  zoo: [['zoo-air', 360, 165, 300, -0.60, 0], ['zoo-entry', 358, 39, 210, -0.03, 0]],
  kearnymesa: [['kearny-air', 140, 190, -180, -0.62, 0], ['kearny-street', -110, 52, -470, -0.03, 0]],
  coronado: [
    ['coronado-air', -215, 165, 700, -0.52, 0],
    ['coronado-fleet', -245, 95, 560, -0.34, 0],
    ['coronado-deck', -237, 22, 462, -0.06, 0],
    ['coronado-hotel', -172, 34, 606, -0.12, 0],
  ],
  pointloma: [
    ['pointloma-air', -400, 190, 640, -0.55, 0],
    ['pointloma-cemetery', -352, 90, 580, -0.42, 0.35],
    ['pointloma-lighthouse', -404, 48, 600, -0.10, 0],
    ['pointloma-ballast', -300, 70, 500, -0.38, 0],
  ],
  balboa: [['balboa-air', 385, 150, 380, -0.60, 0]],
  airport: [
    ['airport-air', -127, 165, 300, -0.60, 0],
    ['airport-apron', -127, 60, 205, -0.35, 0],
    ['airport-kerb', -127, 20, 20, -0.04, Math.PI],
    ['airport-runway', -190, 16, 145, -0.01, -Math.PI / 2],
  ],
};

function resolveShots() {
  const poi = flag('--poi');
  if (poi) {
    const key = poi.toLowerCase();
    if (key === 'all') return Object.values(POI_SHOTS).flat();
    if (!POI_SHOTS[key]) {
      console.error(`unknown --poi "${poi}". known: ${Object.keys(POI_SHOTS).join(', ')}, all`);
      process.exit(2);
    }
    return POI_SHOTS[key];
  }
  const file = args.find((a) => !a.startsWith('--') && a.endsWith('.json'));
  if (file) return JSON.parse(readFileSync(file, 'utf8'));
  // Inline shot list, so a one-off framing does not need a file on disk.
  const inline = args.find((a) => a.trimStart().startsWith('[['));
  if (inline) return JSON.parse(inline);
  return POI_SHOTS.downtown;
}

function findChromium() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  for (const p of ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (existsSync(p)) return p;
  }
  try {
    return execSync('which chromium || which chromium-browser', { encoding: 'utf8' }).trim() || undefined;
  } catch {
    return undefined;
  }
}

const shots = resolveShots();
mkdirSync(outDir, { recursive: true });

const executablePath = findChromium();
console.log(`chromium: ${executablePath || '(playwright default)'}`);
console.log(`loading ${URL}`);

const browser = await chromium.launch({
  executablePath,
  args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--no-sandbox', '--disable-dev-shm-usage',
  ],
});
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
await page.waitForFunction(() => !!window.__game, null, { timeout: 180000 });
await page.waitForTimeout(3000);

if (await page.evaluate(() => typeof window.__game.freeCam) !== 'function') {
  console.error('__game.freeCam is missing — the page is running an older build.');
  await browser.close();
  process.exit(1);
}

// Hide the DOM overlays so the shot is the 3D view only.
await page.evaluate(() => {
  for (const el of document.body.children) {
    if (el.tagName !== 'CANVAS') el.style.display = 'none';
  }
});

const seen = new Map();
for (const [name, x, y, z, pitch = 0, yaw = 0] of shots) {
  await page.evaluate(([a, b, c, d, e]) => window.__game.freeCam(a, b, c, d, e), [x, y, z, pitch, yaw]);
  // Software rasteriser runs at a few FPS, so give it real frames to settle.
  await page.waitForTimeout(2500);
  const file = path.join(outDir, `${name}.png`);
  const buf = await page.screenshot({ timeout: 180000 });
  writeFileSync(file, buf);
  // Identical bytes across two different viewpoints means the camera never
  // moved — the exact failure this tool exists to make impossible to miss.
  const key = buf.length;
  if (seen.has(key)) console.warn(`  ! ${name} is the same size as ${seen.get(key)} — check the framing`);
  seen.set(key, name);
  console.log(`  ${file}  (${(buf.length / 1024).toFixed(0)} kB)`);
}

await page.evaluate(() => window.__game.freeCam(null));
console.log(errors.length ? `page errors: ${errors.slice(0, 3).join(' | ')}` : 'page errors: none');
await browser.close();
