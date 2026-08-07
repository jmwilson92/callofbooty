import { INPUT } from '../config.js';

// Keyboard/mouse state plus pointer lock. Mouse delta accumulates between
// simulation ticks and is drained by the camera each tick.
export class Input {
  constructor(domElement, bus) {
    this.dom = domElement;
    this.bus = bus;
    this.keys = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.locked = false;
    this.buttons = new Set();

    // Edge-triggered actions consumed once by the simulation.
    this.pressed = new Set();

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      // Typing in friends lobby / shop / any form field — don't steal keys for map (M), etc.
      if (this._isTypingTarget(e.target)) return;

      // While playing, kill browser shortcuts that close/reload the tab.
      // Ctrl+W was closing the game mid-heli (looked like a crash).
      // Note: some browsers still refuse to cancel Ctrl+W; we also unbound Ctrl from crouch.
      if (this.locked && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      // Stop browser chrome from eating gameplay keys
      // (Space scroll, F3 search, M find, Tab focus).
      if (
        e.code === 'Space'
        || e.code === 'F3'
        || e.code === 'KeyM'
        || e.code === 'Tab'
      ) {
        e.preventDefault();
      }
    }, true); // capture so we beat browser default handlers when allowed

    window.addEventListener('keyup', (e) => {
      if (this._isTypingTarget(e.target)) return;
      this.keys.delete(e.code);
    });

    // Losing focus mid-key leaves a key stuck down forever otherwise.
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.buttons.clear();
      this.pressed.clear();
    });

    // Pointer lock from any click that isn't interactive UI / map.
    // Hint overlay uses pointer-events:none so clicks fall through to canvas/body.
    const tryLockFromEvent = (e) => {
      if (e.target?.closest?.('#fullmap')) return;
      if (e.target?.closest?.('#party-ui')) return;
      if (e.target?.closest?.('input, button, textarea, select, a, label')) return;
      this.requestLock();
    };
    window.addEventListener('click', tryLockFromEvent);
    // Also bind canvas / document — some embeds only count element-local gestures
    this.dom.addEventListener('click', tryLockFromEvent);
    this.dom.style.touchAction = 'none';
    this.dom.style.outline = 'none';
    // Canvas must fill the viewport so clicks hit it
    Object.assign(this.dom.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      zIndex: '1',
    });

    document.addEventListener('pointerlockchange', () => {
      // Treat any pointer-lock element as locked (some browsers retarget)
      this.locked = !!document.pointerLockElement;
      this.bus.emit('pointerlock', this.locked);
      if (!this.locked) this.keys.clear();
    });

    document.addEventListener('pointerlockerror', () => {
      this.bus.emit('pointerlock:error', new Error('pointerlockerror'));
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX || 0;
      this.mouseDY += e.movementY || 0;
    });

    this.dom.addEventListener('mousedown', (e) => this.buttons.add(e.button));
    window.addEventListener('mouseup', (e) => this.buttons.delete(e.button));
    this.dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * True when the user is typing into a text field / lobby UI.
   * Gameplay binds (M map, WASD, Space…) must not fire then.
   */
  _isTypingTarget(el) {
    if (!el || el === document.body || el === document.documentElement) {
      // Also treat focused element (capture phase target can be window-ish)
      el = document.activeElement;
    }
    if (!el || el === document.body) return false;
    if (el.closest?.('#party-ui')) return true;
    if (el.closest?.('input, textarea, select, [contenteditable="true"]')) return true;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  // Ask for pointer lock. Must run in a user-gesture stack (click / key).
  // Chrome enforces a short cooldown after Esc.
  requestLock() {
    if (this.locked || document.pointerLockElement) return;
    const el = this.dom;
    if (!el || typeof el.requestPointerLock !== 'function') {
      this.bus.emit('pointerlock:error', new Error('Pointer Lock API unavailable'));
      return;
    }
    try {
      // Focus helps some browsers accept the lock
      el.focus?.({ preventScroll: true });
      const p = el.requestPointerLock({ unadjustedMovement: false });
      if (p && typeof p.then === 'function') {
        p.then(() => {
          // success handled by pointerlockchange
        }).catch((err) => {
          // Retry without options (older Chrome / Safari)
          try {
            const p2 = el.requestPointerLock();
            if (p2 && typeof p2.catch === 'function') {
              p2.catch((err2) => this.bus.emit('pointerlock:error', err2 || err));
            }
          } catch (err2) {
            this.bus.emit('pointerlock:error', err2 || err);
          }
        });
      }
    } catch (err) {
      try {
        el.requestPointerLock();
      } catch (err2) {
        this.bus.emit('pointerlock:error', err2 || err);
      }
    }
  }

  action(name) {
    const codes = INPUT.KEYS[name];
    if (!codes) return false;
    for (const c of codes) if (this.keys.has(c)) return true;
    return false;
  }

  // True exactly once per physical press.
  actionPressed(name) {
    const codes = INPUT.KEYS[name];
    if (!codes) return false;
    for (const c of codes) {
      if (this.pressed.has(c)) {
        this.pressed.delete(c);
        return true;
      }
    }
    return false;
  }

  consumeMouse() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  endTick() {
    this.pressed.clear();
  }
}
