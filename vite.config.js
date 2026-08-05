import { defineConfig } from 'vite';

// Codespaces / remote: must listen on 0.0.0.0 so the platform can forward the port.
export default defineConfig({
  server: {
    // 0.0.0.0 is required for GitHub Codespaces port forwarding.
    host: '0.0.0.0',
    port: 5173,
    // If 5173 is taken (or an older forward exists), try the next ports.
    strictPort: false,
    // Allow the *.app.github.dev / *.githubpreview.dev forwarded hostnames
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    allowedHosts: true,
  },
});
