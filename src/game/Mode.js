// Game modes.
//
// Battle royale is the game; free explore is the map. Explore exists because the
// world is the thing most of the work goes into, and you cannot look at it
// properly while a gas wall is closing on you and 90 bots are shooting.
//
// The choice is resolved once at boot and never changes for the life of the
// page — every system reads it during setup rather than branching per frame, so
// there is nothing to keep in sync at runtime. Switching modes reloads.

export const MODES = {
  BR: 'br',
  EXPLORE: 'explore',
};

const STORAGE_KEY = 'cob:mode';

/** URL wins over the stored choice, so a link can pin a mode: ?mode=explore */
function fromUrl() {
  try {
    const v = new URLSearchParams(location.search).get('mode');
    if (!v) return null;
    const k = v.toLowerCase();
    if (k === 'explore' || k === 'free' || k === 'sandbox') return MODES.EXPLORE;
    if (k === 'br' || k === 'battleroyale' || k === 'battle-royale') return MODES.BR;
  } catch { /* no location in a headless harness */ }
  return null;
}

function fromStorage() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === MODES.EXPLORE || v === MODES.BR ? v : null;
  } catch { return null; }
}

let current = fromUrl() ?? fromStorage() ?? MODES.BR;

export function getMode() {
  return current;
}

export function isExplore() {
  return current === MODES.EXPLORE;
}

export function isBattleRoyale() {
  return current === MODES.BR;
}

/**
 * Store the choice and reload into it. Half the world state — bots, the zone,
 * loot, the match controller — is built during boot, so switching in place would
 * mean tearing all of it down. The reload is both simpler and more reliable,
 * and it is what the end screen's "play again" already does.
 */
export function setMode(mode, { reload = true } = {}) {
  if (mode !== MODES.BR && mode !== MODES.EXPLORE) return;
  current = mode;
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* private mode */ }
  if (reload) {
    // Drop any ?mode= from the URL so the stored choice is the single source.
    try {
      const url = new URL(location.href);
      url.searchParams.delete('mode');
      location.replace(url.toString());
      return;
    } catch { /* fall through */ }
    location.reload();
  }
}
