import { defineConfig } from 'vite';

// Codespaces / remote: must listen on 0.0.0.0 so the platform can forward the port.
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Allow the *.app.github.dev / *.githubpreview.dev forwarded hostnames
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
});
