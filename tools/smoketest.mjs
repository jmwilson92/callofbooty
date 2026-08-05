// Headless verification of the Phase 1 build. Boots the game in real WebGL and
// checks the things the Phase 1 "HOW TO TEST" list asks for that can be
// verified without a human at the controls.
//
//   node tools/smoketest.mjs [url]
//
// Exits non-zero on any failure.

import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.argv[2] || 'http://localhost:5173/';

// Prefer a Chromium already on the machine over making Playwright download one.
// CHROME_PATH wins; otherwise probe the usual pre-baked locations.
function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(root)) {
    for (const dir of readdirSync(root)) {
      if (!dir.startsWith('chromium-')) continue;
      const exe = join(root, dir, 'chrome-linux', 'chrome');
      if (existsSync(exe)) return exe;
    }
  }
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (existsSync(p)) return p;
  }
  return undefined; // fall back to Playwright's own download
}

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const executablePath = findChrome();
if (executablePath) console.log(`Using chromium at ${executablePath}`);

const browser = await chromium.launch({
  executablePath,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
  ],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

console.log(`\nLoading ${URL}`);
await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => !!window.__game, null, { timeout: 90000 });
// Let a few frames render so renderer.info is populated.
await page.waitForTimeout(2500);

check('boots without console errors', consoleErrors.length === 0,
  consoleErrors.slice(0, 3).join(' | '));

// --- world stats -------------------------------------------------------------
const stats = await page.evaluate(() => {
  const g = window.__game;
  return {
    calls: g.renderer.info.render.calls,
    tris: g.renderer.info.render.triangles,
    aabbs: g.stats.aabbs,
    props: g.stats.props,
    spawnY: g.controller.pos.y,
    terrainAtSpawn: g.terrain.heightAt(g.controller.pos.x, g.controller.pos.z),
  };
});

console.log(`\n  draw calls ${stats.calls} · triangles ${(stats.tris / 1000).toFixed(0)}k ` +
  `· AABBs ${stats.aabbs} · props ${stats.props}`);

check('draw calls under 400', stats.calls < 400, `${stats.calls}`);
check('static collision geometry registered', stats.aabbs > 2000, `${stats.aabbs} AABBs`);
check('props scattered', stats.props >= 380, `${stats.props}/400`);
check('player spawns on the surface',
  Math.abs(stats.spawnY - stats.terrainAtSpawn) < 1.5,
  `y=${stats.spawnY.toFixed(2)} terrain=${stats.terrainAtSpawn.toFixed(2)}`);

// --- no falling through terrain ---------------------------------------------
// Drop the player at points across the whole island and simulate; the capsule
// must never end up below the terrain surface.
const fall = await page.evaluate(() => {
  const g = window.__game;
  const c = g.controller;
  const idle = { action: () => false, actionPressed: () => false, buttons: new Set() };
  let worst = 0;
  let worstAt = null;
  let tested = 0;

  const save = { p: c.pos.clone(), v: c.vel.clone() };

  for (let i = 0; i < 400; i++) {
    // Deterministic spread over the island interior.
    const a = (i * 2.399963);
    const r = 560 * Math.sqrt((i + 0.5) / 400);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const th = g.terrain.heightAt(x, z);
    if (th < 1) continue; // skip open water
    tested++;

    c.pos.set(x, th + 6, z);
    c.prevPos.copy(c.pos);
    c.vel.set(0, 0, 0);
    c.mantling = false;
    c.sliding = false;
    for (let t = 0; t < 150; t++) c.tick(1 / 60, idle, 0);

    const ground = g.terrain.heightAt(c.pos.x, c.pos.z);
    const below = ground - c.pos.y;
    if (below > worst) { worst = below; worstAt = [x | 0, z | 0]; }
  }

  c.pos.copy(save.p); c.prevPos.copy(save.p); c.vel.copy(save.v);
  return { worst, worstAt, tested };
});

check('no falling through terrain (400 drop points)',
  fall.worst < 0.2,
  `${fall.tested} points, worst sink ${fall.worst.toFixed(3)}m${fall.worstAt ? ` at ${fall.worstAt}` : ''}`);

// --- stairs are climbable ----------------------------------------------------
// Walk forward from the base of a stair core in The Grid and confirm the player
// gains a full storey. This is the real test of step-up against box geometry.
const stairs = await page.evaluate(() => {
  const g = window.__game;
  const c = g.controller;
  const held = new Set(['KeyW']);
  const input = {
    action: (n) => n === 'forward' && held.has('KeyW'),
    actionPressed: () => false,
    buttons: new Set(),
  };

  // Stair core of the first Grid building: x -4.2..-0.4, run z 3.6..7.3, pad y 26.
  c.pos.set(-2.3, 26.05, 2.6);
  c.prevPos.copy(c.pos);
  c.vel.set(0, 0, 0);
  c.height = 1.8;
  c.mantling = false;
  c.sliding = false;

  const startY = c.pos.y;
  for (let t = 0; t < 260; t++) c.tick(1 / 60, input, Math.PI); // yaw PI => forward is +Z
  return { startY, endY: c.pos.y, endZ: c.pos.z, gain: c.pos.y - startY };
});

check('stairs climbable to the next floor',
  stairs.gain > 3.5,
  `climbed ${stairs.gain.toFixed(2)}m (y ${stairs.startY.toFixed(1)} -> ${stairs.endY.toFixed(1)})`);

// --- mantle chain at Harbor --------------------------------------------------
// Shipping containers are 2.59 m -- above the 1.6 m mantle ceiling -- so the
// spec's "mantle onto shipping containers at Harbor" is served by a crate
// placed alongside each stack. Verify both links of that chain.
const mantle = await page.evaluate(() => {
  const g = window.__game;
  const c = g.controller;

  // Hand-placed Harbor crates are exactly 1.45 m tall and seated on the pad,
  // which distinguishes them from the scattered props.
  const crates = g.hash.boxes.filter((b) =>
    Math.abs(b.max.y - b.min.y - 1.45) < 0.01 && Math.abs(b.min.y - 4) < 0.01);
  if (!crates.length) return { found: 0 };

  const run = (px, py, pz, yaw, ticks = 80) => {
    c.pos.set(px, py, pz);
    c.prevPos.copy(c.pos);
    c.vel.set(0, 0, 0);
    c.height = 1.8;
    c.mantling = false;
    c.sliding = false;
    c.grounded = true;
    c.coyote = 0.12;
    c.jumpBuffer = 0;
    let pressed = true;
    const input = {
      action: () => false,
      actionPressed: (n) => {
        if (n === 'jump' && pressed) { pressed = false; return true; }
        return false;
      },
      buttons: new Set(),
    };
    let peak = py;
    for (let t = 0; t < ticks; t++) {
      c.tick(1 / 60, input, yaw);
      if (c.pos.y > peak) peak = c.pos.y;
    }
    return { endY: c.pos.y, peak };
  };

  let ontoCrate = 0;
  let ontoContainer = 0;
  for (const crate of crates) {
    const cx = (crate.min.x + crate.max.x) / 2;
    const r1 = run(cx, crate.min.y, crate.min.z - 0.7, Math.PI);
    if (Math.abs(r1.endY - crate.max.y) < 0.25) {
      ontoCrate++;
      // From the crate top, the container beyond it is a 1.14 m mantle.
      const r2 = run(cx, crate.max.y, (crate.min.z + crate.max.z) / 2, Math.PI);
      if (Math.abs(r2.endY - (crate.min.y + 2.59)) < 0.25) ontoContainer++;
    }
  }

  // Regression guard: a jump from a box surface must arc and come back down,
  // not float. This catches the ground probe treating any surface below the
  // feet as standable, which suppresses gravity entirely.
  // Face yaw 0 (-Z, the open side) so this is a plain jump, not a mantle.
  const top = crates[0].max.y;
  const j = run(crates[0].min.x + 0.75, top, crates[0].min.z + 0.75, 0, 60);
  const apex = j.peak - top;
  const returned = Math.abs(j.endY - top) < 0.1;

  return { found: crates.length, ontoCrate, ontoContainer, apex, returned };
});

check('mantle from ground onto Harbor crates',
  mantle.found > 0 && mantle.ontoCrate > 0,
  `${mantle.ontoCrate}/${mantle.found} crates`);
check('mantle from crate onto shipping container',
  mantle.ontoContainer > 0,
  `${mantle.ontoContainer}/${mantle.ontoCrate} chains completed`);
check('jump from a box surface arcs under gravity and lands',
  mantle.apex > 0.8 && mantle.apex < 0.95 && mantle.returned,
  `apex ${mantle.apex?.toFixed(2)}m (spec ~0.87m), returned to surface: ${mantle.returned}`);

// --- slide reaches the boosted speed ----------------------------------------
const slide = await page.evaluate(() => {
  const g = window.__game;
  const c = g.controller;
  const keys = new Set(['KeyW', 'ShiftLeft']);
  const input = {
    action: (n) => (n === 'forward' && keys.has('KeyW')) || (n === 'sprint' && keys.has('ShiftLeft')) || (n === 'crouch' && keys.has('KeyC')),
    actionPressed: () => false,
    buttons: new Set(),
  };

  // Flat pad in The Grid.
  c.pos.set(6, g.terrain.heightAt(6, -25) + 0.1, -25);
  c.prevPos.copy(c.pos);
  c.vel.set(0, 0, 0);
  c.height = 1.8; c.sliding = false; c.mantling = false; c.slideCooldown = 0;

  for (let t = 0; t < 150; t++) c.tick(1 / 60, input, Math.PI);
  const sprintSpeed = c.speed;

  keys.add('KeyC');
  c.tick(1 / 60, input, Math.PI);
  const slidActive = c.sliding;
  const slideSpeed = c.speed;

  return { sprintSpeed, slideSpeed, slidActive };
});

check('sprint reaches 7.2 m/s',
  Math.abs(slide.sprintSpeed - 7.2) < 0.25, `${slide.sprintSpeed.toFixed(2)} m/s`);
check('slide triggers and boosts speed',
  slide.slidActive && slide.slideSpeed > slide.sprintSpeed,
  `${slide.sprintSpeed.toFixed(2)} -> ${slide.slideSpeed.toFixed(2)} m/s`);

// --- screenshot --------------------------------------------------------------
// Put the player somewhere scenic, hide the menu overlay, and let it render.
await page.evaluate(() => {
  const g = window.__game;
  g.controller.pos.set(6, g.terrain.heightAt(6, -60) + 1.7, -60);
  g.controller.prevPos.copy(g.controller.pos);
  g.playerCam.yaw = Math.PI;
  g.playerCam.pitch = -0.06;
  const hint = document.getElementById('hint');
  if (hint) hint.style.display = 'none';
});
await page.waitForTimeout(600);
await page.screenshot({ path: 'tools/screenshot.png' });
console.log('\n  screenshot written to tools/screenshot.png');

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed\n`);
process.exit(failed.length ? 1 : 0);
