import * as THREE from 'three';
import { WEAPONS, RARITY, LOOT, AMMO, POIS, WORLD } from '../config.js';
import { mulberry32 } from '../core/Noise.js';

// Ground loot: weapons + ammo piles. Pickup with E; 2-weapon inventory handled
// by WeaponSystem.pickupWeapon.

function weightedPick(rng, weights) {
  let total = 0;
  for (const w of Object.values(weights)) total += w;
  let r = rng() * total;
  for (const [k, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return k;
  }
  return Object.keys(weights)[0];
}

function rollRarity(rng) {
  return weightedPick(rng, Object.fromEntries(
    Object.values(RARITY).map((r) => [r.id, r.weight])
  ));
}

export class LootSystem {
  constructor(scene, terrain, bus) {
    this.scene = scene;
    this.terrain = terrain;
    this.bus = bus;
    this.group = new THREE.Group();
    this.group.name = 'loot';
    scene.add(this.group);
    this.items = [];
    this._id = 0;
  }

  clear() {
    while (this.group.children.length) {
      const c = this.group.children[0];
      this.group.remove(c);
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.items.length = 0;
  }

  _meshFor(item) {
    const g = new THREE.Group();
    if (item.kind === 'weapon') {
      const def = WEAPONS[item.weaponId];
      const rar = RARITY[item.rarity] || RARITY.common;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.1, def?.viewModel?.len ?? 0.5),
        new THREE.MeshStandardMaterial({ color: def?.color ?? 0x666666, roughness: 0.5, metalness: 0.4 })
      );
      body.position.y = 0.08;
      body.castShadow = true;
      g.add(body);
      // Rarity glow bar
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.03, 0.03),
        new THREE.MeshStandardMaterial({
          color: rar.color, emissive: rar.color, emissiveIntensity: 0.45,
        })
      );
      bar.position.set(0, 0.18, 0);
      g.add(bar);
    } else if (item.kind === 'ammo') {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.12, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xc4a030, roughness: 0.6 })
      );
      box.position.y = 0.08;
      g.add(box);
    } else if (item.kind === 'armor') {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.1, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x4a6a8a, metalness: 0.5, roughness: 0.4 })
      );
      box.position.y = 0.08;
      g.add(box);
    } else {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.12, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.5 })
      );
      box.position.y = 0.08;
      g.add(box);
    }
    return g;
  }

  spawnItem(item, x, z) {
    const y = this.terrain.heightAt(x, z);
    if (y < 2.5) return null;
    const mesh = this._meshFor(item);
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    const rec = {
      id: ++this._id,
      ...item,
      x, y, z,
      mesh,
    };
    this.items.push(rec);
    return rec;
  }

  spawnWeaponDrop(inst, x, z) {
    if (!inst) return null;
    return this.spawnItem({
      kind: 'weapon',
      weaponId: inst.weaponId,
      rarity: inst.rarity,
      mag: inst.mag,
    }, x, z);
  }

  /** Scatter loot across POIs + downtown + general map. */
  populate(seed = 42) {
    this.clear();
    const rng = mulberry32(seed ^ 0x1007);
    // POI denser piles
    for (const p of POIS) {
      const n = LOOT.PER_POI + (p.id === 'downtown' ? LOOT.DOWNTOWN_EXTRA : 0);
      for (let i = 0; i < n; i++) {
        if (rng() > LOOT.SPAWN_CHANCE) continue;
        const ang = rng() * Math.PI * 2;
        const r = 8 + rng() * 55;
        const x = p.x + Math.cos(ang) * r;
        const z = p.z + Math.sin(ang) * r;
        this._rollAndSpawn(rng, x, z);
      }
    }
    // Map scatter
    const half = WORLD.SIZE / 2 - 80;
    for (let i = 0; i < LOOT.SCATTER; i++) {
      if (rng() > LOOT.SPAWN_CHANCE) continue;
      const x = (rng() * 2 - 1) * half;
      const z = (rng() * 2 - 1) * half;
      if (this.terrain.heightAt(x, z) < 3) continue;
      this._rollAndSpawn(rng, x, z);
    }
    return this.items.length;
  }

  _rollAndSpawn(rng, x, z) {
    const cls = weightedPick(rng, LOOT.CLASS_WEIGHTS);
    if (cls === 'weapon') {
      const wid = weightedPick(rng, LOOT.WEAPON_SPAWN_WEIGHTS);
      const rar = rollRarity(rng);
      this.spawnItem({ kind: 'weapon', weaponId: wid, rarity: rar }, x, z);
    } else if (cls === 'ammo') {
      const type = weightedPick(rng, { light: 30, heavy: 35, long: 10, shell: 15 });
      const amt = LOOT.AMMO_PICKUPS[type]?.amount ?? 20;
      this.spawnItem({ kind: 'ammo', ammoType: type, amount: amt }, x, z);
    } else if (cls === 'armor') {
      const level = rng() > 0.7 ? (rng() > 0.5 ? 3 : 2) : 1;
      this.spawnItem({ kind: 'armor', level, plates: 1 }, x, z);
    } else if (cls === 'heal') {
      const t = weightedPick(rng, { bandage: 50, medkit: 30, stim: 20 });
      this.spawnItem({ kind: 'heal', healType: t }, x, z);
    } else {
      this.spawnItem({ kind: 'ammo', ammoType: 'heavy', amount: 24 }, x, z);
    }
  }

  nearest(px, pz, maxDist = 2.8) {
    let best = null;
    let bestD = maxDist;
    for (const it of this.items) {
      const d = Math.hypot(it.x - px, it.z - pz);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    return best;
  }

  /** Try pickup into weaponSystem. Returns prompt text if near but not picked. */
  tryPickup(weaponSystem, px, py, pz) {
    const it = this.nearest(px, pz);
    if (!it) return false;

    if (it.kind === 'weapon') {
      const { ok, dropped } = weaponSystem.pickupWeapon(it.weaponId, it.rarity);
      if (!ok) return false;
      // Remove from ground
      this._remove(it);
      // Drop previous weapon at feet
      if (dropped) {
        this.spawnWeaponDrop(dropped, px + 0.6, pz + 0.4);
      }
      this.bus.emit('loot:pickup', { kind: 'weapon', id: it.weaponId });
      return true;
    }
    if (it.kind === 'ammo') {
      const cap = AMMO[it.ammoType]?.stack ?? 100;
      const cur = weaponSystem.ammo[it.ammoType] ?? 0;
      const room = Math.max(0, cap - cur);
      if (room <= 0) return false;
      const take = Math.min(room, it.amount);
      weaponSystem.ammo[it.ammoType] = cur + take;
      it.amount -= take;
      if (it.amount <= 0) this._remove(it);
      this.bus.emit('loot:pickup', { kind: 'ammo', type: it.ammoType, amount: take });
      return true;
    }
    if (it.kind === 'armor') {
      // Simple: equip level if higher, grant plate restore
      if (it.level > weaponSystem.armorLevel) {
        weaponSystem.armorLevel = it.level;
        weaponSystem.armor = Math.max(weaponSystem.armor, it.level * 50);
      } else {
        weaponSystem.armor = Math.min(
          (weaponSystem.armorLevel || 1) * 50 || 50,
          weaponSystem.armor + 50
        );
      }
      this._remove(it);
      return true;
    }
    if (it.kind === 'heal') {
      // Instant partial for now (full use-time later)
      if (it.healType === 'bandage') {
        weaponSystem.health = Math.min(75, weaponSystem.health + 25);
      } else if (it.healType === 'medkit') {
        weaponSystem.health = 100;
      } else {
        weaponSystem.health = Math.min(100, weaponSystem.health + 20);
      }
      this._remove(it);
      return true;
    }
    return false;
  }

  _remove(it) {
    const i = this.items.indexOf(it);
    if (i >= 0) this.items.splice(i, 1);
    if (it.mesh) {
      this.group.remove(it.mesh);
      it.mesh.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
  }

  prompt(px, pz) {
    const it = this.nearest(px, pz);
    if (!it) return null;
    if (it.kind === 'weapon') {
      const n = WEAPONS[it.weaponId]?.name ?? it.weaponId;
      const r = RARITY[it.rarity]?.label ?? '';
      return `E · Pick up ${r} ${n}`;
    }
    if (it.kind === 'ammo') return `E · Pick up ${it.ammoType} ammo (${it.amount})`;
    if (it.kind === 'armor') return `E · Pick up Armor Lv${it.level}`;
    if (it.kind === 'heal') return `E · Pick up ${it.healType}`;
    return 'E · Pick up';
  }

  update(dt) {
    // Gentle bob for visibility
    const t = performance.now() * 0.002;
    for (const it of this.items) {
      if (!it.mesh) continue;
      it.mesh.position.y = it.y + 0.05 + Math.sin(t + it.id) * 0.04;
      it.mesh.rotation.y += dt * 0.8;
    }
  }
}
