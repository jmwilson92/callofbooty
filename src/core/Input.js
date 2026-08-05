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
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      // Stop space from scrolling and F3 from opening browser search.
      if (e.code === 'Space' || e.code === 'F3') e.preventDefault();
    });

    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    // Losing focus mid-key leaves a key stuck down forever otherwise.
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.buttons.clear();
    });

    this.dom.addEventListener('click', () => {
      if (!this.locked) this.dom.requestPointerLock();
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
