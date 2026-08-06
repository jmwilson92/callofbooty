import * as THREE from 'three';
import { WEAPONS, RARITY, LOOT, AMMO, POIS, WORLD, CASES } from '../config.js';
import { mulberry32 } from '../core/Noise.js';
import { worldBuildings } from '../world/BuildingRegistry.js';
import { classToModelKey } from '../combat/WeaponAssets.js';

// Ground loot + interior pelican cases.
// Outdoor free loot is sparse; most gear comes from opening cases in buildings.

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

function mat(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.rough ?? 0.55,
    metalness: opts.metal ?? 0.25,
    emissive: new THREE.Color(hex).multiplyScalar(opts.em ?? 0),
    emissiveIntensity: 1,
  });
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
    this.cases = [];
    this._id = 0;
    /** @type {Record<string, THREE.Object3D>} optional weapon class GLBs for ground look */
    this.weaponModels = {};
  }

  setWeaponModels(byClass = {}) {
    this.weaponModels = byClass || {};
  }

  clear() {
    while (this.group.children.length) {
      const c = this.group.children[0];
      this.group.remove(c);
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    this.items.length = 0;
    this.cases.length = 0;
  }

  // ── meshes ──────────────────────────────────────────────────────────────

  _meshFor(item) {
    const g = new THREE.Group();
    if (item.kind === 'weapon') {
      const def = WEAPONS[item.weaponId];
      const rar = RARITY[item.rarity] || RARITY.common;
      const key = classToModelKey(def?.class || 'ar');
      const tpl = this.weaponModels[key];
      if (tpl) {
        const m = tpl.clone(true);
        m.scale.setScalar(0.55);
        m.rotation.x = -0.15;
        m.rotation.y = Math.PI * 0.15;
        m.position.y = 0.06;
        m.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.frustumCulled = true;
          }
        });
        g.add(m);
      } else {
        // Procedural mini-gun silhouette
        const bodyCol = def?.color ?? 0x555555;
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, def?.viewModel?.len ?? 0.45),
          mat(bodyCol, { metal: 0.4, rough: 0.45 })
        );
        body.position.y = 0.08;
        body.castShadow = true;
        g.add(body);
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8),
          mat(0x999aaa, { metal: 0.8, rough: 0.3 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.08, -(def?.viewModel?.len ?? 0.45) * 0.45);
        g.add(barrel);
      }
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.025, 0.025),
        mat(rar.color, { em: 0.35, metal: 0.1, rough: 0.4 })
      );
      bar.position.set(0, 0.2, 0);
      g.add(bar);
    } else if (item.kind === 'ammo') {
      const c = { light: 0xc8b050, heavy: 0x6a8a4a, long: 0x4a6a9a, shell: 0x9a5a3a }[item.ammoType] || 0xc4a030;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.16), mat(c, { rough: 0.6 }));
      box.position.y = 0.08;
      box.castShadow = true;
      g.add(box);
      // Lid stripe
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.14), mat(0x2a2a2a, { metal: 0.5 }));
      lid.position.y = 0.16;
      g.add(lid);
    } else if (item.kind === 'armor') {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.08, 0.22),
        mat(0x3a5a7a, { metal: 0.55, rough: 0.4 })
      );
      plate.position.y = 0.06;
      plate.castShadow = true;
      g.add(plate);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.18), mat(0x1a1a1e));
      pad.position.y = 0.12;
      g.add(pad);
    } else if (item.kind === 'heal') {
      const col = item.healType === 'medkit' ? 0xe0e0e8 : item.healType === 'stim' ? 0x40c8a0 : 0xf0f0f0;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.16), mat(col, { rough: 0.5 }));
      box.position.y = 0.07;
      g.add(box);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), mat(0xcc2020, { em: 0.2 }));
      cross.position.y = 0.13;
      g.add(cross);
      const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.1), mat(0xcc2020, { em: 0.2 }));
      cross2.position.y = 0.13;
      g.add(cross2);
    } else {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), mat(0xb0b0b0));
      box.position.y = 0.08;
      g.add(box);
    }
    return g;
  }

  /** Hard pelican / rifle case — olive body, black latches, hinged lid. */
  _buildCaseMesh() {
    const g = new THREE.Group();
    const bodyMat = mat(0x3d5230, { rough: 0.62, metal: 0.12 });
    const black = mat(0x1a1a1c, { rough: 0.4, metal: 0.5 });
    const yellow = mat(0xe8b020, { rough: 0.4, metal: 0.2, em: 0.15 });

    // Slightly larger + taller so they read in dim interiors
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 0.72), bodyMat);
    body.position.y = 0.22;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Beveled top edge lip
    const lip = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.04, 0.74), bodyMat);
    lip.position.y = 0.42;
    g.add(lip);

    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.44, -0.32);
    lidPivot.name = 'lidPivot';
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.09, 0.68), bodyMat);
    lid.position.set(0, 0.05, 0.32);
    lid.castShadow = true;
    lidPivot.add(lid);
    const foam = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.58), mat(0x1e1e28, { rough: 0.92 }));
    foam.position.set(0, -0.01, 0.32);
    lidPivot.add(foam);
    g.add(lidPivot);

    for (const lx of [-0.4, 0.0, 0.4]) {
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.07), black);
      latch.position.set(lx, 0.45, 0.38);
      g.add(latch);
    }
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 6, 14, Math.PI), black);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.3, 0.4);
    g.add(handle);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), yellow);
        c.position.set(sx * 0.64, 0.14, sz * 0.32);
        g.add(c);
      }
    }
    // Bright loot beacon (emissive) — easy to spot in towers
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.03, 0.08),
      mat(0x40e0ff, { em: 0.55, metal: 0.05, rough: 0.35 })
    );
    stripe.position.set(0, 0.5, 0);
    stripe.name = 'caseStripe';
    g.add(stripe);
    // Soft point light so cases glow in dark floors
    const light = new THREE.PointLight(0x50d0ff, 0.55, 6, 2);
    light.position.set(0, 0.55, 0);
    g.add(light);
    g.userData.lidPivot = lidPivot;
    g.userData.stripe = stripe;
    g.userData.light = light;
    return g;
  }

  // ── spawn ───────────────────────────────────────────────────────────────

  spawnItem(item, x, y, z) {
    const mesh = this._meshFor(item);
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    const rec = { id: ++this._id, ...item, x, y, z, mesh, bob: true };
    this.items.push(rec);
    return rec;
  }

  spawnItemAtGround(item, x, z) {
    const y = this.terrain.heightAt(x, z);
    if (y < 2.0) return null;
    return this.spawnItem(item, x, y, z);
  }

  spawnWeaponDrop(inst, x, z) {
    if (!inst) return null;
    return this.spawnItemAtGround({
      kind: 'weapon',
      weaponId: inst.weaponId,
      rarity: inst.rarity,
      mag: inst.mag,
    }, x, z);
  }

  _rollItem(rng) {
    const cls = weightedPick(rng, LOOT.CLASS_WEIGHTS);
    if (cls === 'weapon') {
      const wid = weightedPick(rng, LOOT.WEAPON_SPAWN_WEIGHTS);
      return { kind: 'weapon', weaponId: wid, rarity: rollRarity(rng) };
    }
    if (cls === 'ammo') {
      const type = weightedPick(rng, { light: 30, heavy: 35, long: 14, shell: 15 });
      return { kind: 'ammo', ammoType: type, amount: LOOT.AMMO_PICKUPS[type]?.amount ?? 20 };
    }
    if (cls === 'armor') {
      const level = rng() > 0.7 ? (rng() > 0.5 ? 3 : 2) : 1;
      return { kind: 'armor', level, plates: 1 };
    }
    if (cls === 'heal') {
      return { kind: 'heal', healType: weightedPick(rng, { bandage: 50, medkit: 30, stim: 20 }) };
    }
    return { kind: 'ammo', ammoType: 'heavy', amount: 24 };
  }

  _spawnCase(x, y, z, yaw, rng) {
    const mesh = this._buildCaseMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = yaw;
    this.group.add(mesh);
    const n = CASES.MIN_ITEMS + Math.floor(rng() * (CASES.MAX_ITEMS - CASES.MIN_ITEMS + 1));
    const contents = [];
    for (let i = 0; i < n; i++) contents.push(this._rollItem(rng));
    // Bias at least one weapon often
    if (!contents.some((c) => c.kind === 'weapon') && rng() > 0.35) {
      contents[0] = {
        kind: 'weapon',
        weaponId: weightedPick(rng, LOOT.WEAPON_SPAWN_WEIGHTS),
        rarity: rollRarity(rng),
      };
    }
    this.cases.push({
      id: ++this._id,
      x, y, z, yaw,
      mesh,
      open: false,
      openT: 0,
      contents,
    });
  }

  /** Scatter sparse outdoor loot + pelican cases inside buildings. */
  populate(seed = 42) {
    this.clear();
    const rng = mulberry32(seed ^ 0x1007);

    // Sparse outdoor only (roadsides / POI edges — not carpeted streets)
    for (const p of POIS) {
      const n = LOOT.OUTDOOR_PER_POI + (p.id === 'downtown' ? LOOT.OUTDOOR_DOWNTOWN_EXTRA : 0);
      for (let i = 0; i < n; i++) {
        if (rng() > LOOT.OUTDOOR_SPAWN_CHANCE) continue;
        const ang = rng() * Math.PI * 2;
        const r = 20 + rng() * 70;
        const x = p.x + Math.cos(ang) * r;
        const z = p.z + Math.sin(ang) * r;
        this._rollAndSpawnOutdoor(rng, x, z);
      }
    }
    const half = WORLD.SIZE / 2 - 100;
    for (let i = 0; i < LOOT.OUTDOOR_SCATTER; i++) {
      if (rng() > LOOT.OUTDOOR_SPAWN_CHANCE) continue;
      const x = (rng() * 2 - 1) * half;
      const z = (rng() * 2 - 1) * half;
      if (this.terrain.heightAt(x, z) < 3) continue;
      this._rollAndSpawnOutdoor(rng, x, z);
    }

    // Pelican cases — interior of every registered building (incl. skyline towers)
    let caseCount = 0;
    const margin = 1.6;
    for (const b of worldBuildings) {
      if (b.w < 5 || b.d < 5) continue;
      let placedHere = 0;
      const maxB = CASES.MAX_PER_BUILDING ?? 8;
      // Cap floors scanned on super-tall towers (still cover low + mid + high)
      const floors = b.floors;
      const floorList = [];
      for (let f = 0; f < floors; f++) floorList.push(f);
      // Always include ground; sample upper floors
      const sample = new Set([0]);
      if (floors > 1) sample.add(Math.floor(floors * 0.35));
      if (floors > 2) sample.add(Math.floor(floors * 0.65));
      if (floors > 3) sample.add(floors - 1);
      for (const f of floorList) {
        if (sample.has(f)) continue;
        if (rng() < (CASES.PER_FLOOR_CHANCE ?? 0.7)) sample.add(f);
      }

      for (const f of sample) {
        if (placedHere >= maxB) break;
        const guarantee = f === 0 && CASES.GUARANTEE_GROUND;
        if (!guarantee && rng() > (CASES.PER_FLOOR_CHANCE ?? 0.7)) continue;
        const n = Math.min(
          CASES.MAX_PER_FLOOR ?? 2,
          guarantee ? 1 + (rng() > 0.5 ? 1 : 0) : (rng() > 0.5 ? 2 : 1)
        );
        for (let k = 0; k < n; k++) {
          if (placedHere >= maxB) break;
          // Keep away from walls / stair corner (+X/+Z)
          const lx = margin + rng() * Math.max(0.5, b.w - margin * 2);
          const lz = margin + rng() * Math.max(0.5, b.d - margin * 2);
          if (lx > b.w * 0.62 && lz > b.d * 0.62) continue;
          const x = b.x + lx;
          const z = b.z + lz;
          const y = b.floorYs?.[f] ?? (b.baseY + 0.15 + f * 3.4);
          this._spawnCase(x, y, z, rng() * Math.PI * 2, rng);
          caseCount++;
          placedHere++;
        }
      }
    }

    console.info(`[loot] outdoor items ${this.items.length} · supply cases ${caseCount} · buildings ${worldBuildings.length}`);
    return { items: this.items.length, cases: caseCount };
  }

  _rollAndSpawnOutdoor(rng, x, z) {
    // Outdoor: mostly ammo/heal, rare weapons
    const outdoorWeights = { weapon: 12, ammo: 50, armor: 12, heal: 26 };
    const cls = weightedPick(rng, outdoorWeights);
    let item;
    if (cls === 'weapon') {
      item = {
        kind: 'weapon',
        weaponId: weightedPick(rng, LOOT.WEAPON_SPAWN_WEIGHTS),
        rarity: rollRarity(rng),
      };
    } else if (cls === 'ammo') {
      const type = weightedPick(rng, { light: 30, heavy: 35, long: 10, shell: 15 });
      item = { kind: 'ammo', ammoType: type, amount: LOOT.AMMO_PICKUPS[type]?.amount ?? 20 };
    } else if (cls === 'armor') {
      item = { kind: 'armor', level: 1, plates: 1 };
    } else {
      item = { kind: 'heal', healType: weightedPick(rng, { bandage: 60, medkit: 20, stim: 20 }) };
    }
    this.spawnItemAtGround(item, x, z);
  }

  nearest(px, py, pz, maxDist = 2.8) {
    let best = null;
    let bestD = maxDist;
    for (const it of this.items) {
      const d = Math.hypot(it.x - px, it.z - pz);
      const dy = Math.abs((it.y ?? 0) - (py ?? it.y ?? 0));
      if (d < bestD && dy < 2.5) {
        bestD = d;
        best = { type: 'item', ref: it };
      }
    }
    for (const c of this.cases) {
      if (c.open && c.openT >= 1) continue; // already emptied
      const d = Math.hypot(c.x - px, c.z - pz);
      const dy = Math.abs(c.y - (py ?? c.y));
      if (d < bestD && dy < 2.2) {
        bestD = d;
        best = { type: 'case', ref: c };
      }
    }
    return best;
  }

  nearestItem(px, pz, maxDist = 2.8) {
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

  tryPickup(weaponSystem, px, py, pz) {
    const hit = this.nearest(px, py, pz);
    if (!hit) return false;

    if (hit.type === 'case') {
      return this._tryOpenCase(hit.ref, px, pz);
    }

    const it = hit.ref;
    if (it.kind === 'weapon') {
      const { ok, dropped } = weaponSystem.pickupWeapon(it.weaponId, it.rarity);
      if (!ok) return false;
      this._remove(it);
      if (dropped) this.spawnWeaponDrop(dropped, px + 0.6, pz + 0.4);
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
      if (it.healType === 'bandage') weaponSystem.health = Math.min(75, weaponSystem.health + 25);
      else if (it.healType === 'medkit') weaponSystem.health = 100;
      else weaponSystem.health = Math.min(100, weaponSystem.health + 20);
      this._remove(it);
      return true;
    }
    return false;
  }

  _tryOpenCase(c) {
    if (c.open) return false;
    c.open = true;
    c.openT = 0;
    if (c.mesh.userData.stripe) c.mesh.userData.stripe.visible = false;
    // Spit items in a tight arc in front of the case
    const cos = Math.cos(c.yaw);
    const sin = Math.sin(c.yaw);
    c.contents.forEach((item, i) => {
      const side = (i - (c.contents.length - 1) * 0.5) * 0.38;
      const forward = 0.7 + i * 0.1;
      const wx = c.x + side * cos - forward * sin;
      const wz = c.z + side * sin + forward * cos;
      this.spawnItem(item, wx, c.y + 0.05, wz);
    });
    c.contents = [];
    this.bus.emit('loot:case', { id: c.id });
    return true;
  }

  _remove(it) {
    const i = this.items.indexOf(it);
    if (i >= 0) this.items.splice(i, 1);
    if (it.mesh) {
      this.group.remove(it.mesh);
      it.mesh.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
  }

  prompt(px, py, pz) {
    const hit = this.nearest(px, py ?? 0, pz);
    if (!hit) return null;
    if (hit.type === 'case') {
      return hit.ref.open ? null : 'E · Open supply case';
    }
    const it = hit.ref;
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
    const t = performance.now() * 0.002;
    for (const it of this.items) {
      if (!it.mesh || it.bob === false) continue;
      it.mesh.position.y = it.y + 0.04 + Math.sin(t + it.id) * 0.03;
      it.mesh.rotation.y += dt * 0.7;
    }
    // Case lid open animation
    for (const c of this.cases) {
      if (!c.open) continue;
      c.openT = Math.min(1, c.openT + dt * 2.2);
      const pivot = c.mesh.userData.lidPivot;
      if (pivot) {
        // Open ~100°
        const e = c.openT * c.openT * (3 - 2 * c.openT);
        pivot.rotation.x = -e * 1.75;
      }
    }
  }
}
