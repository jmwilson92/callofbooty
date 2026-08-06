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

  /**
   * Realistic hard-shell pelican / rifle case (not a CoD loot crate).
   * Layout (local): +Z = front (latches + handle), −Z = hinge.
   * Lid pivots on rear hinge and flips open over −Z; loot ejects toward +Z.
   */
  _buildCaseMesh() {
    const g = new THREE.Group();
    // Classic pelican OD / desert-tan polymer
    const shell = mat(0x4a4f3a, { rough: 0.72, metal: 0.08 });
    const shellDark = mat(0x35382c, { rough: 0.75, metal: 0.06 });
    const black = mat(0x1c1c1e, { rough: 0.45, metal: 0.55 });
    const steel = mat(0x8a8e94, { rough: 0.35, metal: 0.7 });
    const foamMat = mat(0x2a2e38, { rough: 0.95, metal: 0.0 });
    const pad = mat(0x1a1a1c, { rough: 0.8, metal: 0.05 });

    const W = 1.28; // length (X)
    const D = 0.78; // depth (Z)
    const H = 0.38; // body height
    const halfD = D * 0.5;

    // Bottom tub
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), shell);
    body.position.y = H * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    // Slight under-cut base pad
    const base = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, 0.04, D * 0.96), shellDark);
    base.position.y = 0.02;
    g.add(base);

    // Ribbed lid (stacked ridges = classic pelican look)
    const lidPivot = new THREE.Group();
    lidPivot.name = 'lidPivot';
    // Hinge on rear edge (−Z)
    lidPivot.position.set(0, H, -halfD);
    const lidH = 0.11;
    const lid = new THREE.Group();
    lid.position.set(0, lidH * 0.5, halfD); // rest closed over body
    const lidMain = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, lidH, D * 0.98), shell);
    lidMain.castShadow = true;
    lid.add(lidMain);
    // Raised ribs on lid top
    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.9, 0.025, 0.07),
        shellDark
      );
      rib.position.set(0, lidH * 0.5 + 0.01, i * 0.12);
      lid.add(rib);
    }
    // Interior egg-crate foam on lid underside
    const lidFoam = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88, 0.035, D * 0.88), foamMat);
    lidFoam.position.set(0, -lidH * 0.35, 0);
    lid.add(lidFoam);
    lidPivot.add(lid);
    g.add(lidPivot);

    // Foam bed inside tub (visible when open)
    const bed = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 0.06, D * 0.88), foamMat);
    bed.position.set(0, H - 0.05, 0.02);
    g.add(bed);
    // Cutout trays in foam
    for (const ox of [-0.28, 0.28]) {
      const cut = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.5), pad);
      cut.position.set(ox, H - 0.02, 0.02);
      g.add(cut);
    }

    // Butterfly latches on FRONT (+Z)
    for (const lx of [-0.38, 0, 0.38]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), steel);
      plate.position.set(lx, H - 0.02, halfD + 0.01);
      g.add(plate);
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.05), black);
      latch.position.set(lx, H + 0.02, halfD + 0.03);
      g.add(latch);
    }

    // Folding handle on front
    const handleBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.05), black);
    handleBase.position.set(0, H * 0.45, halfD + 0.04);
    g.add(handleBase);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.016, 6, 16, Math.PI), black);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, H * 0.45, halfD + 0.09);
    g.add(handle);

    // Corner protectors (dark grey polymer, not neon gold “loot”)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.09), shellDark);
        c.position.set(sx * (W * 0.5 - 0.04), 0.1, sz * (halfD - 0.04));
        g.add(c);
      }
    }

    // Pressure-equalization valve (detail)
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10), black);
    valve.rotation.z = Math.PI / 2;
    valve.position.set(W * 0.45, H * 0.55, halfD * 0.2);
    g.add(valve);

    // Subtle status sticker (small, not a CoD glow bar)
    const sticker = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.02, 0.08),
      mat(0xc8a030, { em: 0.2, rough: 0.5, metal: 0.1 })
    );
    sticker.position.set(-0.35, H + lidH + 0.02, 0.05);
    sticker.name = 'caseStripe';
    g.add(sticker);

    // Open direction in local space: front = +Z (away from hinge)
    g.userData.lidPivot = lidPivot;
    g.userData.stripe = sticker;
    g.userData.openDir = new THREE.Vector3(0, 0, 1);
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

    // Pelican cases — along walls, facing open room, never clustered
    let caseCount = 0;
    const placedXZ = []; // world XZ for min-separation across all buildings
    const MIN_SEP = CASES.MIN_SEPARATION ?? 2.8;

    for (const b of worldBuildings) {
      if (b.w < 6 || b.d < 6) continue;
      let placedHere = 0;
      const maxB = CASES.MAX_PER_BUILDING ?? 6;
      const floors = b.floors;
      const sample = new Set([0]);
      if (floors > 1) sample.add(Math.floor(floors * 0.4));
      if (floors > 3) sample.add(Math.floor(floors * 0.7));
      if (floors > 2) sample.add(floors - 1);
      for (let f = 0; f < floors; f++) {
        if (rng() < (CASES.PER_FLOOR_CHANCE ?? 0.55) * 0.5) sample.add(f);
      }

      for (const f of [...sample]) {
        if (placedHere >= maxB) break;
        const guarantee = f === 0 && CASES.GUARANTEE_GROUND;
        if (!guarantee && rng() > (CASES.PER_FLOOR_CHANCE ?? 0.55)) continue;

        const want = Math.min(CASES.MAX_PER_FLOOR ?? 1, guarantee ? 1 : 1);
        for (let k = 0; k < want; k++) {
          if (placedHere >= maxB) break;
          const spot = this._pickWallCaseSpot(b, f, rng, placedXZ, MIN_SEP);
          if (!spot) continue;
          this._spawnCase(spot.x, spot.y, spot.z, spot.yaw, rng);
          placedXZ.push({ x: spot.x, z: spot.z });
          caseCount++;
          placedHere++;
        }
      }
    }

    console.info(`[loot] outdoor items ${this.items.length} · supply cases ${caseCount} · buildings ${worldBuildings.length}`);
    return { items: this.items.length, cases: caseCount };
  }

  /**
   * Place case against a wall, facing room center (opens outward).
   * Avoids doorways (south mid for kit buildings), elevators (inner core),
   * stair corner (+X/+Z), and other cases.
   */
  _pickWallCaseSpot(b, floorIdx, rng, placedXZ, minSep) {
    const wallInset = 0.75; // off wall so lid/body fit
    const doorKeepout = 1.8; // no cases mid-south facade (door)
    const elevKeep = 2.2; // clear center/core
    const y = b.floorYs?.[floorIdx] ?? (b.baseY + 0.15 + floorIdx * 3.4);

    // Candidate wall slots: N/S/E/W edges, several positions along each
    const candidates = [];
    const along = (len) => {
      const n = Math.max(2, Math.floor(len / 2.5));
      const out = [];
      for (let i = 0; i < n; i++) out.push((i + 0.5) / n);
      return out;
    };

    // South wall (z = min) — skip middle (doorway)
    for (const t of along(b.w)) {
      if (Math.abs(t - 0.5) < 0.22) continue; // doorway keepout
      candidates.push({
        lx: b.w * t, lz: wallInset,
        yaw: 0, // front (+local Z) faces +world Z = into room
      });
    }
    // North wall (z = max) — front faces -Z into room
    for (const t of along(b.w)) {
      candidates.push({
        lx: b.w * t, lz: b.d - wallInset,
        yaw: Math.PI,
      });
    }
    // West wall (x = min) — front faces +X into room
    for (const t of along(b.d)) {
      if (t < 0.15) continue; // near south door corner
      candidates.push({
        lx: wallInset, lz: b.d * t,
        yaw: -Math.PI / 2,
      });
    }
    // East wall (x = max) — avoid stair/elev core in +X/+Z
    for (const t of along(b.d)) {
      if (t > 0.55) continue; // skip stair core region
      candidates.push({
        lx: b.w - wallInset, lz: b.d * t,
        yaw: Math.PI / 2,
      });
    }

    // Shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = candidates[i];
      candidates[i] = candidates[j];
      candidates[j] = tmp;
    }

    const cx = b.x + b.w * 0.5;
    const cz = b.z + b.d * 0.5;

    for (const c of candidates) {
      const x = b.x + c.lx;
      const z = b.z + c.lz;
      // Not in building core (elevators / open shaft)
      if (Math.hypot(x - cx, z - cz) < elevKeep * 0.55 && b.w > 10 && b.d > 10) {
        // Only reject deep-center placements; wall spots are fine
        if (c.lx > b.w * 0.3 && c.lx < b.w * 0.7 && c.lz > b.d * 0.3 && c.lz < b.d * 0.7) {
          continue;
        }
      }
      // Stair/elev corner +X/+Z of footprint
      if (c.lx > b.w * 0.65 && c.lz > b.d * 0.65) continue;
      // Separation from other cases
      let ok = true;
      for (const p of placedXZ) {
        if (Math.hypot(p.x - x, p.z - z) < minSep) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      return { x, y, z, yaw: c.yaw };
    }
    return null;
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

    // Eject toward case FRONT (+local Z = latches), not the hinge side.
    // Use the mesh quaternion so yaw/orientation always match.
    c.mesh.updateMatrixWorld(true);
    const front = new THREE.Vector3(0, 0, 1).applyQuaternion(c.mesh.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(c.mesh.quaternion);
    c.contents.forEach((item, i) => {
      const n = c.contents.length;
      const side = (i - (n - 1) * 0.5) * 0.42;
      const ahead = 0.85 + (i % 2) * 0.12;
      const wx = c.x + right.x * side + front.x * ahead;
      const wz = c.z + right.z * side + front.z * ahead;
      this.spawnItem(item, wx, c.y + 0.06, wz);
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
