/**
 * Embed friends party WebSocket on Vite's HTTP server (same port as the game).
 * Required for cloudflared: one tunnel → game + co-op rockets/bots.
 */
import { attachParty } from './server/party.mjs';

export function partyPlugin() {
  /** @type {{ close: () => void }|null} */
  let handle = null;

  function boot(httpServer, label) {
    if (!httpServer || handle) return;
    handle = attachParty(httpServer, { pathPrefix: '/party-ws' });
    console.log(`[vite] party WebSocket ready at /party-ws (${label})`);
  }

  return {
    name: 'callofbooty-party-ws',
    configureServer(server) {
      // Post-hook: httpServer is listening and middleware is installed
      return () => {
        boot(server.httpServer, 'dev');
      };
    },
    configurePreviewServer(server) {
      return () => {
        boot(server.httpServer, 'preview');
      };
    },
  };
}
