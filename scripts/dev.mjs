#!/usr/bin/env node
/**
 * Codespaces-friendly dev launcher.
 * - Starts Vite on 0.0.0.0:5173
 * - Prints the public *.app.github.dev URL
 * - Tries to open it via $BROWSER (Codespaces browser helper)
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const port = process.env.PORT || '5173';
const name = process.env.CODESPACE_NAME;
const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
const publicUrl = name ? `https://${name}-${port}.${domain}/` : `http://127.0.0.1:${port}/`;

console.log('');
console.log('  ╔══════════════════════════════════════════════════════════╗');
console.log('  ║  Call of Booty — dev server                              ║');
console.log('  ╠══════════════════════════════════════════════════════════╣');
console.log(`  ║  Local:   http://127.0.0.1:${port}/`);
console.log(`  ║  Local:   http://localhost:${port}/`);
if (name) {
  console.log(`  ║  Public:  ${publicUrl}`);
  console.log('  ║                                                          ║');
  console.log('  ║  If Ports tab is blank: open the Public URL above.       ║');
  console.log('  ║  Or: Command Palette → “Ports: Focus on Ports View”      ║');
  console.log('  ║  Or: Command Palette → “Simple Browser: Show”            ║');
}
console.log('  ╚══════════════════════════════════════════════════════════╝');
console.log('');

// These exact localhost lines help VS Code output-based auto-forward.
console.log(`  Detect me: http://localhost:${port}/`);
console.log(`  Detect me: http://127.0.0.1:${port}/`);
console.log('');

const child = spawn(
  process.execPath,
  [
    new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname,
    '--host', '0.0.0.0',
    '--port', String(port),
    '--strictPort',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
  }
);

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
  child.kill(signal);
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

child.on('exit', (code) => process.exit(code ?? 0));
