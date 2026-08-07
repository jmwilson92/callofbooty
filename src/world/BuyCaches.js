import * as THREE from 'three';
import { BUY_CACHES, POIS, WORLD } from '../config.js';
import { mulberry32 } from '../core/Noise.js';

/**
 * Supply / black-market caches — walk up, E to open shop, spend cash.
 * Stock: UAVs, guns, plates, armor, nades, stims, revive items.
 */
export class BuyCacheSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./Terrain.js').Terrain} terrain
   * @param {import('../core/EventBus.js').EventBus} bus
   */
  constructor(scene, terrain, bus) {
    this.scene = scene;
    this.terrain = terrain;
    this.bus = bus;
    this.group = new THREE.Group();
    this.group.name = 'buyCaches';
    scene.add(this.group);
    /** @type {Array<object>} */
    this.caches = [];
    this.openCache = null;
    this._panel = null;
  }

  spawn(seed = WORLD.SEED ^ 0xcace) {
    this.clear();
    const rng = mulberry32(seed);
    const n = BUY_CACHES.count ?? 14;
    const spots = [];

    // Prefer POIs first
    for (const p of POIS) {
      spots.push({
        x: p.x + (rng() - 0.5) * 30,
        z: p.z + (rng() - 0.5) * 30,
        label: p.name,
      });
    }
    // Fill random dry land
    let guard = 0;
    while (spots.length < n && guard++ < n * 40) {
      const x = (rng() * 2 - 1) * WORLD.SIZE * 0.38;
      const z = (rng() * 2 - 1) * WORLD.SIZE * 0.38;
      const y = this.terrain.heightAt(x, z);
      if (y < WORLD.WATER_LEVEL + 1.2) continue;
      if (this.terrain.slopeDegAt?.(x, z) > 24) continue;
      spots.push({ x, z, label: 'Cache' });
    }

    for (let i = 0; i < Math.min(n, spots.length); i++) {
      const s = spots[i];
      const y = this.terrain.heightAt(s.x, s.z);
      this._addCache(s.x, y, s.z, s.label || `Cache ${i + 1}`, rng);
    }
    return this.caches.length;
  }

  _addCache(x, y, z, label, rng) {
    const root = new THREE.Group();
    root.position.set(x, y, z);

    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.4, 1.6),
      new THREE.MeshStandardMaterial({
        color: 0x3a4a32,
        roughness: 0.7,
        metalness: 0.2,
        emissive: 0x1a2810,
        emissiveIntensity: 0.25,
      })
    );
    crate.position.y = 0.7;
    crate.castShadow = true;
    root.add(crate);

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(2.25, 0.12, 1.65),
      new THREE.MeshStandardMaterial({ color: 0x4a5a38, roughness: 0.65, metalness: 0.25 })
    );
    lid.position.y = 1.42;
    root.add(lid);

    // Beacon light
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6),
      new THREE.MeshStandardMaterial({
        color: 0x80ff60,
        emissive: 0x40ff20,
        emissiveIntensity: 0.9,
      })
    );
    beacon.position.set(0, 1.85, 0);
    root.add(beacon);

    // Sign
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.35, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x102010,
        emissive: 0x204020,
        emissiveIntensity: 0.4,
      })
    );
    sign.position.set(0, 2.15, 0);
    root.add(sign);

    this.group.add(root);
    this.caches.push({
      x, y, z, label,
      root,
      open: false,
    });
  }

  clear() {
    this.closeShop();
    this.caches.length = 0;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }

  findNear(px, py, pz) {
    const r = BUY_CACHES.interactRange ?? 2.8;
    let best = null;
    let bestD = Infinity;
    for (const c of this.caches) {
      const d = Math.hypot(c.x - px, c.z - pz);
      if (d > r) continue;
      if (Math.abs(c.y - py) > 4) continue;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  prompt(px, py, pz) {
    if (this.openCache) return 'Esc / E · Close shop';
    const c = this.findNear(px, py, pz);
    if (!c) return null;
    return `E · Buy cache · ${c.label}`;
  }

  tryUse(controller, loadout) {
    if (this.openCache) {
      this.closeShop();
      return true;
    }
    const c = this.findNear(controller.pos.x, controller.pos.y, controller.pos.z);
    if (!c) return false;
    this.openShop(c, loadout);
    return true;
  }

  openShop(cache, loadout) {
    this.openCache = cache;
    this._ensurePanel();
    this._renderPanel(loadout);
    this._panel.style.display = 'block';
    // Free cursor so player can click shop buttons
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      this._hadLock = true;
      document.exitPointerLock();
    }
    this.bus?.emit?.('shop:open', { label: cache.label });
  }

  closeShop() {
    this.openCache = null;
    if (this._panel) this._panel.style.display = 'none';
    this.bus?.emit?.('shop:close', { relock: !!this._hadLock });
    this._hadLock = false;
  }

  _ensurePanel() {
    if (this._panel) return;
    const el = document.createElement('div');
    el.id = 'buy-cache-panel';
    Object.assign(el.style, {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '45',
      width: 'min(420px, 92vw)',
      maxHeight: '70vh',
      overflow: 'auto',
      background: 'rgba(8,14,12,0.94)',
      border: '1px solid rgba(120,220,120,0.45)',
      borderRadius: '10px',
      padding: '14px 16px',
      color: '#e8f0e8',
      font: '13px/1.35 ui-monospace, Menlo, Consolas, monospace',
      boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
      display: 'none',
      pointerEvents: 'auto',
    });
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
        <strong style="color:#8fef7a;letter-spacing:0.08em">SUPPLY CACHE</strong>
        <span id="bc-cash" style="color:#ffe080"></span>
      </div>
      <div id="bc-list"></div>
      <div style="margin-top:12px;opacity:0.55;font-size:11px">E / Esc close · click item to buy</div>
    `;
    document.body.appendChild(el);
    this._panel = el;
  }

  _renderPanel(loadout) {
    if (!this._panel || !loadout) return;
    const cashEl = this._panel.querySelector('#bc-cash');
    const list = this._panel.querySelector('#bc-list');
    cashEl.textContent = `$${loadout.cash | 0}`;
    list.innerHTML = '';
    const cat = BUY_CACHES.catalog || {};
    for (const [id, def] of Object.entries(cat)) {
      const row = document.createElement('button');
      row.type = 'button';
      Object.assign(row.style, {
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        margin: '0 0 6px',
        padding: '10px 12px',
        background: 'rgba(20,32,22,0.9)',
        border: '1px solid rgba(100,180,100,0.25)',
        borderRadius: '6px',
        color: '#e8f0e8',
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
      });
      row.innerHTML = `<span>${def.label}</span><span style="color:#ffe080">$${def.cost}</span>`;
      row.onclick = () => {
        if (def.kind === 'deploy_flare') {
          if (loadout.cash < def.cost) {
            cashEl.textContent = `$${loadout.cash | 0} — can't afford`;
            cashEl.style.color = '#ff8080';
            setTimeout(() => {
              cashEl.style.color = '#ffe080';
              this._renderPanel(loadout);
            }, 900);
            return;
          }
          // Handler in main sets success if someone dead can be brought back
          this._deployOk = false;
          this.bus?.emit?.('shop:deploy_flare', { loadout, cache: this });
          if (this._deployOk) {
            loadout.cash -= def.cost;
            this._renderPanel(loadout);
            this.bus?.emit?.('shop:buy', { id, def });
            this.closeShop();
          } else {
            cashEl.textContent = `$${loadout.cash | 0} — nobody waiting for flare`;
            cashEl.style.color = '#ff8080';
            setTimeout(() => {
              cashEl.style.color = '#ffe080';
              this._renderPanel(loadout);
            }, 1200);
          }
          return;
        }
        const ok = loadout.buy?.(id, def);
        if (ok) {
          this._renderPanel(loadout);
          this.bus?.emit?.('shop:buy', { id, def });
        } else {
          cashEl.textContent = `$${loadout.cash | 0} — can't afford / full`;
          cashEl.style.color = '#ff8080';
          setTimeout(() => {
            cashEl.style.color = '#ffe080';
            this._renderPanel(loadout);
          }, 900);
        }
      };
      list.appendChild(row);
    }
  }

  update() {
    // Panel follows open state only
  }
}
