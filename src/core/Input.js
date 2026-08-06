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

    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    // Losing focus mid-key leaves a key stuck down forever otherwise.
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.buttons.clear();
      this.pressed.clear();
    });

    // Listen on `window`, not on the canvas. The menu overlay covers the whole
    // viewport, so a canvas-only listener never sees the click that is supposed
    // to start the game. Skip when the tactical map is open (needs drag/zoom).
    window.addEventListener('click', (e) => {
      if (e.target?.closest?.('#fullmap')) return;
      this.requestLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      this.bus.emit('pointerlock', this.locked);
      if (!this.locked) this.keys.clear();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });

    this.dom.addEventListener('mousedown', (e) => this.buttons.add(e.button));
    window.addEventListener('mouseup', (e) => this.buttons.delete(e.button));
    this.dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Ask for pointer lock. Browsers reject this if it is not driven by a user
  // gesture, and Chrome enforces a ~1s cooldown after Esc -- report the failure
  // rather than leaving the player clicking at a screen that does nothing.
  requestLock() {
    if (this.locked) return;
    try {
      const p = this.dom.requestPointerLock();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => this.bus.emit('pointerlock:error', err));
      }
    } catch (err) {
      this.bus.emit('pointerlock:error', err);
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
