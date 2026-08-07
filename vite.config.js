import { defineConfig } from 'vite';
import { partyPlugin } from './vite-plugin-party.js';

// GitHub Codespaces needs:
// 1) listen on 0.0.0.0 (not localhost-only) so the tunnel can reach Vite
// 2) HMR websocket pointed at the public forwarded host on 443/wss
const codespace = process.env.CODESPACE_NAME;
const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
const port = Number(process.env.PORT || 5173);

const hmr = codespace
  ? {
      protocol: 'wss',
      host: `${codespace}-${port}.${domain}`,
      clientPort: 443,
    }
  : true;

const pagesBase = process.env.GITHUB_PAGES === '1' || process.env.GITHUB_PAGES === 'true'
  ? '/callofbooty/'
  : '/';

export default defineConfig({
  base: pagesBase,
  plugins: [partyPlugin()],
  server: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    // Cloudflare quick tunnels rotate random *.trycloudflare.com hosts.
    allowedHosts: true,
    hmr,
    watch: {
      usePolling: false,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
});
