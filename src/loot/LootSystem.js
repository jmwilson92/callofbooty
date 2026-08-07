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
    } else if (item.kind === 'silver' || item.kind === 'instant_revive') {
      // Bright silver bullet — easy to spot while crawling for self-revive
      const silver = mat(0xd8e0f0, { metal: 0.92, rough: 0.18, em: 0.35 });
      const tip = mat(0xf0f4ff, { metal: 0.85, rough: 0.22, em: 0.25 });
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.04, 0.22, 10),
        silver
      );
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.08;
      body.castShadow = true;
      g.add(body);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 10), tip);
      nose.rotation.z = -Math.PI / 2;
      nose.position.set(0.15, 0.08, 0);
      g.add(nose);
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xc0d0ff, transparent: true, opacity: 0.35, depthWrite: false,
        })
      );
      glow.position.y = 0.1;
      g.add(glow);
    } else if (item.kind === 'cash') {
      // Stack of bills / coin pile — readable gold
      const gold = mat(0xe8c040, { metal: 0.55, rough: 0.35, em: 0.18 });
      const darkGold = mat(0xa07820, { metal: 0.45, rough: 0.45, em: 0.08 });
      const amt = item.amount ?? 100;
      const stacks = amt >= 400 ? 4 : amt >= 150 ? 3 : 2;
      for (let i = 0; i < stacks; i++) {
        const bill = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.02, 0.11),
          i % 2 === 0 ? gold : darkGold
        );
        bill.position.set((i - stacks * 0.5) * 0.02, 0.04 + i * 0.022, (i % 2) * 0.015);
        bill.rotation.y = (i - 1) * 0.12;
        bill.castShadow = true;
        g.add(bill);
      }
      // Coin on top
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12),
        gold
      );
      coin.position.y = 0.06 + stacks * 0.022;
      coin.castShadow = true;
      g.add(coin);
      // Soft glow marker so piles read at a distance
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        mat(0xffe080, { em: 0.55, rough: 0.8, metal: 0 })
      );
      glow.position.y = 0.12 + stacks * 0.01;
      glow.material.transparent = true;
      glow.material.opacity = 0.35;
      glow.material.depthWrite = false;
      g.add(glow);
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

  /**
   * Silver bullet for self-revive (dropped when a downed player scores a kill).
   * @param {number} x
   * @param {number} z
   */
  spawnSilverBullet(x, z) {
    const ang = Math.random() * Math.PI * 2;
    const r = 0.35 + Math.random() * 0.45;
    return this.spawnItemAtGround(
      { kind: 'silver', amount: 1 },
      x + Math.cos(ang) * r,
      z + Math.sin(ang) * r
    );
  }

  /**
   * Bot death loot — 1–3 pickups scattered around the body.
   * @param {number} x
   * @param {number} z
   * @param {number} [seed]
   */
  spawnBotDrop(x, z, seed = (Math.random() * 1e9) | 0) {
    const rng = mulberry32(seed ^ 0xb07);
    const n = 1 + Math.floor(rng() * 3); // 1–3 items
    const drops = [];
    for (let i = 0; i < n; i++) {
      const ang = rng() * Math.PI * 2;
      const r = 0.45 + rng() * 0.9;
      const ix = x + Math.cos(ang) * r;
      const iz = z + Math.sin(ang) * r;
      // Prefer ammo / heal / armor / cash; occasional weapon
      let item;
      const roll = rng();
      if (roll < 0.34) {
        const type = weightedPick(rng, { light: 28, heavy: 38, long: 12, shell: 14 });
        item = { kind: 'ammo', ammoType: type, amount: LOOT.AMMO_PICKUPS[type]?.amount ?? 20 };
      } else if (roll < 0.5) {
        item = { kind: 'heal', healType: weightedPick(rng, { bandage: 55, medkit: 25, stim: 20 }) };
      } else if (roll < 0.62) {
        item = { kind: 'armor', level: rng() > 0.75 ? 2 : 1, plates: 1 };
      } else if (roll < 0.88) {
        item = this._rollCash(rng);
      } else {
        item = {
          kind: 'weapon',
          weaponId: weightedPick(rng, LOOT.WEAPON_SPAWN_WEIGHTS),
          rarity: rollRarity(rng),
        };
      }
      const rec = this.spawnItemAtGround(item, ix, iz);
      if (rec) drops.push(rec);
    }
    // Extra small chance of a pure cash drop next to body
    if (rng() < (LOOT.MONEY?.BOT_DROP_CHANCE ?? 0.4) * 0.6) {
      const ang = rng() * Math.PI * 2;
      const r = 0.5 + rng() * 0.7;
      const rec = this.spawnItemAtGround(this._rollCash(rng), x + Math.cos(ang) * r, z + Math.sin(ang) * r);
      if (rec) drops.push(rec);
    }
    return drops;
  }

  /** Roll a cash pickup amount from configured tiers. */
  _rollCash(rng) {
    const tiers = LOOT.MONEY?.TIERS || [
      { w: 50, min: 50, max: 140 },
      { w: 35, min: 150, max: 380 },
      { w: 15, min: 400, max: 850 },
    ];
    const weights = {};
    tiers.forEach((t, i) => { weights[i] = t.w; });
    const idx = Number(weightedPick(rng, weights));
    const t = tiers[idx] || tiers[0];
    const amount = t.min + Math.floor(rng() * (t.max - t.min + 1));
    return { kind: 'cash', amount };
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
    if (cls === 'cash') {
      return this._rollCash(rng);
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
    // Cash often falls out of supply cases
    const mon = LOOT.MONEY || {};
    if (rng() < (mon.CASE_CHANCE ?? 0.58)) {
      contents.push(this._rollCash(rng));
    }
    if (rng() < (mon.CASE_BONUS_CHANCE ?? 0.25)) {
      contents.push(this._rollCash(rng));
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

    // Dedicated cash piles — common enough to fund shops, not carpeted
    const mon = LOOT.MONEY || {};
    let cashPiles = 0;
    for (const p of POIS) {
      const n = (mon.OUTDOOR_PER_POI ?? 5) + (p.id === 'downtown' ? (mon.OUTDOOR_DOWNTOWN_EXTRA ?? 8) : 0);
      for (let i = 0; i < n; i++) {
        const ang = rng() * Math.PI * 2;
        const r = 12 + rng() * 55;
        const x = p.x + Math.cos(ang) * r;
        const z = p.z + Math.sin(ang) * r;
        if (this.terrain.heightAt(x, z) < 3) continue;
        this.spawnItemAtGround(this._rollCash(rng), x, z);
        cashPiles++;
      }
    }
    for (let i = 0; i < (mon.OUTDOOR_PILES ?? 110); i++) {
      const x = (rng() * 2 - 1) * half;
      const z = (rng() * 2 - 1) * half;
      if (this.terrain.heightAt(x, z) < 3) continue;
      // Small piles: 1 stack; sometimes a double pile
      this.spawnItemAtGround(this._rollCash(rng), x, z);
      cashPiles++;
      if (rng() < 0.18) {
        this.spawnItemAtGround(
          this._rollCash(rng),
          x + (rng() - 0.5) * 1.2,
          z + (rng() - 0.5) * 1.2
        );
        cashPiles++;
      }
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

    const cashOnGround = this.items.filter((it) => it.kind === 'cash').length;
    console.info(
      `[loot] outdoor items ${this.items.length} · cash piles ~${cashOnGround} · supply cases ${caseCount} · buildings ${worldBuildings.length}`
    );
    return { items: this.items.length, cases: caseCount, cash: cashOnGround };
  }

  /**
   * Place case against a wall, clear of doors and walk paths.
   * Mesh: local +Z = front (opens into room). BuildingKit puts main entrance
   * on the south center and a second door on the east face (~32% along depth).
   */
  _pickWallCaseSpot(b, floorIdx, rng, placedXZ, minSep) {
    // Deeper inset so the case body + open lid stay out of the walkway
    const wallInset = 1.05;
    const y = b.floorYs?.[floorIdx] ?? (b.baseY + 0.15 + floorIdx * 3.4);
    const isGround = floorIdx === 0;

    // Keep-out rectangles in building-local (lx, lz) space
    const keepouts = [];
    // Stair bulkhead / SE core
    keepouts.push({
      lx0: b.w * 0.52, lx1: b.w + 0.5,
      lz0: b.d * 0.52, lz1: b.d + 0.5,
    });
    if (isGround) {
      // South main entrance — wide + deep so cases never sit in the door
      const doorHalf = Math.max(2.4, Math.min(3.2, b.w * 0.2));
      keepouts.push({
        lx0: b.w * 0.5 - doorHalf - 1.6,
        lx1: b.w * 0.5 + doorHalf + 1.6,
        lz0: -0.5,
        lz1: Math.min(b.d * 0.45, 4.2),
      });
      // East side door (BuildingKit: centre at z + d*0.32)
      const eastDoor = b.d * 0.32;
      keepouts.push({
        lx0: b.w - Math.min(b.w * 0.4, 4.0),
        lx1: b.w + 0.5,
        lz0: eastDoor - 2.4,
        lz1: eastDoor + 2.4,
      });
      // Clear a strip just inside the south facade (entry walk-in)
      keepouts.push({
        lx0: 0.4,
        lx1: b.w - 0.4,
        lz0: 0,
        lz1: 2.2,
      });
    }

    const inKeepout = (lx, lz) => {
      for (const k of keepouts) {
        if (lx >= k.lx0 && lx <= k.lx1 && lz >= k.lz0 && lz <= k.lz1) return true;
      }
      return false;
    };

    const along = (len, margin = 0.12) => {
      // denser samples, stay off extreme corners a bit
      const n = Math.max(3, Math.floor(len / 2.0));
      const out = [];
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        if (t < margin || t > 1 - margin) continue;
        out.push(t);
      }
      return out;
    };

    // Candidates: prefer back/side walls; deprioritize south on ground floor
    const candidates = [];
    const push = (lx, lz, yaw, wall, priority) => {
      if (inKeepout(lx, lz)) return;
      // Stay inside footprint with margin
      if (lx < 0.85 || lx > b.w - 0.85 || lz < 0.85 || lz > b.d - 0.85) return;
      candidates.push({ lx, lz, yaw, wall, priority });
    };

    // North wall (best for ground — opposite the main door)
    for (const t of along(b.w, 0.1)) {
      push(b.w * t, b.d - wallInset, Math.PI, 'N', isGround ? 10 : 6);
    }
    // West wall
    for (const t of along(b.d, 0.14)) {
      // Ground: skip near south (entry) and near east door depth
      if (isGround && t < 0.28) continue;
      push(wallInset, b.d * t, Math.PI / 2, 'W', isGround ? 8 : 5);
    }
    // East wall — skip around side door on ground
    for (const t of along(b.d, 0.14)) {
      if (isGround && Math.abs(t - 0.32) < 0.28) continue;
      if (isGround && t < 0.22) continue; // near SE entry corner
      if (t > 0.72) continue; // stair core
      push(b.w - wallInset, b.d * t, -Math.PI / 2, 'E', isGround ? 4 : 5);
    }
    // South wall — upper floors only (ground south is the entrance face)
    if (!isGround) {
      for (const t of along(b.w, 0.18)) {
        if (Math.abs(t - 0.5) < 0.2) continue;
        push(b.w * t, wallInset, 0, 'S', 3);
      }
    } else {
      // Ground: only far corners of south wall, well clear of door
      for (const t of [0.12, 0.18, 0.82, 0.88]) {
        push(b.w * t, wallInset + 0.15, 0, 'S', 1);
      }
    }

    // Interior-ish fallback: against north wall mid, deeper inset
    push(b.w * 0.28, b.d - wallInset - 0.2, Math.PI, 'N', 7);
    push(b.w * 0.72, b.d - wallInset - 0.2, Math.PI, 'N', 7);

    // Score: higher priority + distance from door keepouts + not clustered
    const scored = [];
    for (const c of candidates) {
      const x = b.x + c.lx;
      const z = b.z + c.lz;
      let sepOk = true;
      let nearest = 99;
      for (const p of placedXZ) {
        const d = Math.hypot(p.x - x, p.z - z);
        nearest = Math.min(nearest, d);
        if (d < minSep) {
          sepOk = false;
          break;
        }
      }
      if (!sepOk) continue;

      // Distance to nearest keepout center (prefer farther from doors)
      let doorDist = 20;
      for (const k of keepouts) {
        const cx = (k.lx0 + k.lx1) * 0.5;
        const cz = (k.lz0 + k.lz1) * 0.5;
        doorDist = Math.min(doorDist, Math.hypot(c.lx - cx, c.lz - cz));
      }
      // Prefer corners of the room (away from open middle)
      const edgeScore = Math.min(c.lx, b.w - c.lx, c.lz, b.d - c.lz);
      const score = c.priority * 3 + doorDist * 0.8 + nearest * 0.35 - edgeScore * 0.15
        + rng() * 0.8;
      scored.push({ ...c, x, y, z, score });
    }

    if (!scored.length) return null;
    scored.sort((a, b) => b.score - a.score);
    // Pick among top few for variety
    const top = scored.slice(0, Math.min(4, scored.length));
    const pick = top[Math.floor(rng() * top.length)];
    return { x: pick.x, y: pick.y, z: pick.z, yaw: pick.yaw };
  }

  _rollAndSpawnOutdoor(rng, x, z) {
    // Outdoor: ammo/heal/cash, rare weapons
    const outdoorWeights = {
      weapon: 12,
      ammo: 40,
      armor: 10,
      heal: 18,
      cash: LOOT.MONEY?.OUTDOOR_CLASS_WEIGHT ?? 24,
    };
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
    } else if (cls === 'cash') {
      item = this._rollCash(rng);
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

  /**
   * @param {import('../combat/WeaponSystem.js').WeaponSystem} weaponSystem
   * @param {number} px
   * @param {number} py
   * @param {number} pz
   * @param {import('../player/Loadout.js').Loadout|null} [loadout] needed for cash
   */
  tryPickup(weaponSystem, px, py, pz, loadout = null) {
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
      // Vest upgrade + spare plates into inventory (press 3 to equip)
      if (it.level > (weaponSystem.armorLevel || 0)) {
        weaponSystem.armorLevel = it.level;
      }
      if (loadout) {
        const max = 5;
        const add = Math.max(1, it.plates | 0) || 1;
        loadout.plates = Math.min(max, (loadout.plates || 0) + add);
      } else {
        const cap = (weaponSystem.armorLevel || 1) * 50 || 50;
        weaponSystem.armor = Math.min(cap, (weaponSystem.armor || 0) + 50);
      }
      this._remove(it);
      this.bus.emit('loot:pickup', { kind: 'armor', level: it.level, plates: it.plates ?? 1 });
      return true;
    }
    if (it.kind === 'helmet') {
      const maxH = 100;
      weaponSystem.helmet = maxH;
      this._remove(it);
      this.bus.emit('loot:pickup', { kind: 'helmet' });
      return true;
    }
    if (it.kind === 'heal') {
      // Stims still apply on pickup (instant). Bandages / medkits go to inventory.
      if (it.healType === 'stim') {
        weaponSystem.health = Math.min(100, (weaponSystem.health || 0) + 20);
        if (loadout) loadout.stims = (loadout.stims || 0) + 1;
        this._remove(it);
        this.bus.emit('loot:pickup', { kind: 'heal', healType: 'stim' });
        return true;
      }
      if (!loadout) {
        // No loadout: fall back to instant heal
        if (it.healType === 'medkit') weaponSystem.health = 100;
        else weaponSystem.health = Math.min(75, (weaponSystem.health || 0) + 25);
        this._remove(it);
        return true;
      }
      if (it.healType === 'medkit') {
        const maxM = 2;
        if ((loadout.medkits || 0) >= maxM) return false;
        loadout.medkits = (loadout.medkits || 0) + 1;
      } else {
        // bandage (default)
        const maxB = 5;
        if ((loadout.bandages || 0) >= maxB) return false;
        loadout.bandages = (loadout.bandages || 0) + 1;
      }
      this._remove(it);
      this.bus.emit('loot:pickup', { kind: 'heal', healType: it.healType || 'bandage' });
      return true;
    }
    if (it.kind === 'cash') {
      if (!loadout) return false;
      const amt = Math.max(0, it.amount | 0);
      loadout.cash = (loadout.cash || 0) + amt;
      this._remove(it);
      this.bus.emit('loot:pickup', { kind: 'cash', amount: amt, total: loadout.cash });
      return true;
    }
    if (it.kind === 'silver' || it.kind === 'instant_revive') {
      if (!loadout) return false;
      const n = Math.max(1, it.amount | 0);
      loadout.grantSilverBullet?.(n) ?? (loadout.instantRevives = (loadout.instantRevives || 0) + n);
      this._remove(it);
      this.bus.emit('loot:pickup', { kind: 'silver', amount: n, total: loadout.instantRevives });
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
    if (it.kind === 'armor') return `E · Armor vest Lv${it.level} + plate`;
    if (it.kind === 'helmet') return 'E · Pick up Kevlar helmet';
    if (it.kind === 'heal') {
      if (it.healType === 'medkit') return 'E · Pick up medkit (7 to use)';
      if (it.healType === 'stim') return 'E · Pick up stim';
      return 'E · Pick up bandage (6 to use)';
    }
    if (it.kind === 'cash') return `E · Pick up $${it.amount | 0}`;
    if (it.kind === 'silver' || it.kind === 'instant_revive') {
      return 'E · Pick up silver bullet (self-revive)';
    }
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
