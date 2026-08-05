import { defineConfig } from 'vite';

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

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    // Critical: accept the *.app.github.dev Host header from the tunnel
    allowedHosts: true,
    hmr,
    // Print clear localhost lines so VS Code "output" auto-forward can detect the port
    // even if process-based detection is flaky.
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
