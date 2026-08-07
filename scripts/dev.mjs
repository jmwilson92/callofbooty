#!/usr/bin/env node
/**
 * Dev launcher.
 * - Starts Vite on 0.0.0.0:5173
 * - Party WebSocket is EMBEDDED in Vite at /party-ws (same port)
 *   → one cloudflared tunnel carries game + co-op for remote laptops
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const port = process.env.PORT || '5173';
const name = process.env.CODESPACE_NAME;
const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
const publicUrl = name ? `https://${name}-${port}.${domain}/` : `http://127.0.0.1:${port}/`;
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));

console.log('');
console.log('  ╔══════════════════════════════════════════════════════════╗');
console.log('  ║  Call of Booty — dev server                              ║');
console.log('  ╠══════════════════════════════════════════════════════════╣');
console.log(`  ║  Game:    http://127.0.0.1:${port}/`);
console.log(`  ║  Game:    http://localhost:${port}/`);
console.log(`  ║  Party:   ws://localhost:${port}/party-ws  (embedded in Vite)`);
console.log('  ║                                                          ║');
console.log('  ║  Remote: cloudflared tunnel --url http://localhost:5173  ║');
console.log('  ║  Friends open that URL, Host/Join same room code         ║');
if (name) {
  console.log(`  ║  Public:  ${publicUrl}`);
}
console.log('  ╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`  Detect me: http://localhost:${port}/`);
console.log(`  Detect me: http://127.0.0.1:${port}/`);
console.log('');

/** @type {import('node:child_process').ChildProcess[]} */
const children = [];

const child = spawn(
  process.execPath,
  [
    viteBin,
    '--host', '0.0.0.0',
    '--port', String(port),
    '--strictPort',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
    cwd: projectRoot,
  }
);
children.push(child);

// After a short delay, try to open the browser (Codespaces sets $BROWSER).
(async () => {
  await sleep(1500);
  const browser = process.env.BROWSER;
  if (!browser || !name) return;
  try {
    spawn(browser, [publicUrl], { stdio: 'ignore', detached: true }).unref();
    console.log(`  Opened browser helper → ${publicUrl}`);
  } catch {
    // ignore
  }
})();

const shutdown = (signal) => {
  for (const c of children) {
    try { c.kill(signal); } catch { /* */ }
  }
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

child.on('exit', (code) => {
  for (const c of children) {
    if (c !== child) {
      try { c.kill('SIGTERM'); } catch { /* */ }
    }
  }
  process.exit(code ?? 0);
});
