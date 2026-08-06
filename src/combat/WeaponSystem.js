import * as THREE from 'three';
import { WEAPONS, RARITY, COMBAT, AMMO } from '../config.js';
import { castHitscan, falloffMult, partMult } from './Hitscan.js';
import { buildViewModel } from './ViewModels.js';

const DEG = Math.PI / 180;

/**
 * Data-driven weapon system. Inventory holds up to 2 weapon instances.
 * Fire, reload, swap, ADS, recoil (visual + aim offset), hip bloom.
 */
export class WeaponSystem {
  constructor(camera, hash, bus, effects) {
    this.camera = camera;
    this.hash = hash;
    this.bus = bus;
    this.effects = effects;

    // slots[0], slots[1] = weapon instances or null
    this.slots = [null, null];
    this.active = 0;
    this.prevSlot = 0;

    this.ads = 0; // 0..1 blend
    this.wantAds = false;
    this.reloading = false;
    this.reloadT = 0;
    this.reloadDur = 0;
    this.swapT = 0;
    this.swapDur = 0;
    this.shotCooldown = 0;
    this.shotIndex = 0; // for recoil pattern
    this.lastShotAge = 999;
    this.aimOffsetH = 0; // degrees — does NOT auto-snap
    this.aimOffsetV = 0;
    this.spread = 0;
    this.boltReady = true;

    // Ammo pools shared by type
    this.ammo = { light: 60, heavy: 90, long: 10, shell: 16 };

    // Player vitals (Phase 3 hooks)
    this.health = COMBAT.BASE_HEALTH;
    this.armor = 0;
    this.armorLevel = 0;

    this.viewGroup = new THREE.Group();
    this.viewGroup.name = 'viewWeapon';
    this.camera.camera.add(this.viewGroup);
    // Local fill light so the gun is never black against dark maps
    const fill = new THREE.PointLight(0xfff0e0, 0.85, 2.5, 1.5);
    fill.position.set(0.1, 0.05, 0.1);
    this.camera.camera.add(fill);
    this._vmRoot = null;
    this._vmMag = null;
    this._muzzle = new THREE.Object3D();
    this._kick = 0; // visual gun kick on fire
    this._muzzleFlash = null;

    // Give starter sidearm so player can shoot before finding loot
    this.giveWeapon('sidearm', 'common');
  }

  get current() {
    return this.slots[this.active];
  }

  get def() {
    const c = this.current;
    return c ? WEAPONS[c.weaponId] : null;
  }

  /** Create a weapon instance from id + rarity. */
  static makeInstance(weaponId, rarityId = 'common') {
    const def = WEAPONS[weaponId];
    if (!def) return null;
    const rar = RARITY[rarityId] || RARITY.common;
    const mag = Math.max(1, Math.round(def.magSize * rar.mag));
    return {
      weaponId,
      rarity: rar.id,
      mag,
      magSize: mag,
      ammoType: def.ammo,
    };
  }

  giveWeapon(weaponId, rarityId = 'common') {
    const inst = WeaponSystem.makeInstance(weaponId, rarityId);
    if (!inst) return false;
    if (!this.slots[0]) {
      this.slots[0] = inst;
      this.active = 0;
    } else if (!this.slots[1]) {
      this.slots[1] = inst;
      this.prevSlot = this.active;
      this.active = 1;
    } else {
      // Drop active, replace
      this.slots[this.active] = inst;
    }
    this._rebuildView();
    this.reloading = false;
    this.shotIndex = 0;
    return true;
  }

  /**
   * Pick up a ground weapon. If both slots full, drops the held weapon
   * (returns the dropped instance for the loot system to spawn).
   */
  pickupWeapon(weaponId, rarityId = 'common') {
    const inst = WeaponSystem.makeInstance(weaponId, rarityId);
    if (!inst) return { ok: false, dropped: null };
    let dropped = null;
    if (!this.slots[0]) {
      this.slots[0] = inst;
      this.active = 0;
    } else if (!this.slots[1]) {
      this.slots[1] = inst;
      this.prevSlot = this.active;
      this.active = 1;
    } else {
      dropped = this.slots[this.active];
      this.slots[this.active] = inst;
    }
    this._rebuildView();
    this.reloading = false;
    this.shotIndex = 0;
    this.swapT = 0;
    return { ok: true, dropped };
  }

  dropActive() {
    const d = this.slots[this.active];
    this.slots[this.active] = null;
    if (!this.slots[0] && this.slots[1]) this.active = 1;
    else if (!this.slots[1] && this.slots[0]) this.active = 0;
    this._rebuildView();
    return d;
  }

  selectSlot(i) {
    if (i !== 0 && i !== 1) return;
    if (!this.slots[i] || i === this.active) return;
    const def = this.def;
    this.prevSlot = this.active;
    this.active = i;
    this.swapDur = (this.def?.swapTime ?? 0.4);
    this.swapT = this.swapDur;
    this.reloading = false;
    this.shotIndex = 0;
    this._rebuildView();
  }

  quickSwap() {
    const other = this.active === 0 ? 1 : 0;
    if (this.slots[other]) this.selectSlot(other);
    else if (this.slots[this.prevSlot] && this.prevSlot !== this.active) {
      this.selectSlot(this.prevSlot);
    }
  }

  startReload() {
    const c = this.current;
    const def = this.def;
    if (!c || !def || this.reloading || this.swapT > 0) return;
    if (c.mag >= c.magSize) return;
    const pool = this.ammo[def.ammo] ?? 0;
    if (pool <= 0) return;
    this.reloading = true;
    this.reloadDur = c.mag <= 0 ? def.reloadTimeEmpty : def.reloadTime;
    const rar = RARITY[c.rarity] || RARITY.common;
    this.reloadDur *= rar.reload;
    this.reloadT = this.reloadDur;
  }

  _finishReload() {
    const c = this.current;
    const def = this.def;
    if (!c || !def) { this.reloading = false; return; }
    const need = c.magSize - c.mag;
    const pool = this.ammo[def.ammo] ?? 0;
    const take = Math.min(need, pool);
    c.mag += take;
    this.ammo[def.ammo] = pool - take;
    this.reloading = false;
    this.shotIndex = 0;
  }

  _rebuildView() {
    while (this.viewGroup.children.length) {
      const c = this.viewGroup.children[0];
      this.viewGroup.remove(c);
      c.traverse?.((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    this._vmRoot = null;
    this._vmMag = null;
    const def = this.def;
    if (!def) return;
    const vm = buildViewModel(def);
    this._vmRoot = vm.root;
    this._vmMag = vm.mag;
    this._muzzle = vm.muzzle;
    this.viewGroup.add(vm.root);
    // Muzzle flash sprite
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0 })
    );
    flash.position.copy(vm.muzzle.position);
    vm.root.add(flash);
    this._muzzleFlash = flash;
  }

  /**
   * Aim direction: camera look + aim offset (recoil) + optional bloom cone sample.
   */
  getAimDir(out, rng) {
    const cam = this.camera.camera;
    // Base forward from camera (includes visual recoil on camera quat)
    out.set(0, 0, -1).applyQuaternion(cam.quaternion);

    // Apply aim offset as additional pitch/yaw in degrees
    const yawQ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0), this.aimOffsetH * DEG
    );
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const pitchQ = new THREE.Quaternion().setFromAxisAngle(right, -this.aimOffsetV * DEG);
    out.applyQuaternion(yawQ).applyQuaternion(pitchQ).normalize();

    // Bloom / spread cone (not applied on perfect ADS still first shot for non-shotgun)
    const def = this.def;
    if (!def) return out;
    let cone = this.spread;
    if (this.ads > 0.85 && this.spread < 0.05 && def.pellets === 1) {
      cone = def.spreadAds * 0.15;
    }
    if (cone > 0.01 && rng) {
      const ang = cone * DEG * (0.3 + rng() * 0.7);
      const theta = rng() * Math.PI * 2;
      const up = new THREE.Vector3(0, 1, 0);
      const r = new THREE.Vector3().crossVectors(out, up);
      if (r.lengthSq() < 1e-6) r.set(1, 0, 0);
      r.normalize();
      const u = new THREE.Vector3().crossVectors(r, out).normalize();
      out.addScaledVector(r, Math.cos(theta) * Math.tan(ang));
      out.addScaledVector(u, Math.sin(theta) * Math.tan(ang));
      out.normalize();
    }
    return out;
  }

  _fireOne(origin, dir, targets, targetRange, rar) {
    const def = this.def;
    const c = this.current;
    if (!def || !c) return;

    const hit = castHitscan(origin, dir, this.hash, targets, 500);
    this.effects.spawnTracer(origin, hit.point);
    this.effects.spawnImpact(hit.point, hit.tag || 'solid');

    if (hit.target && hit.part) {
      let dmg = def.damage * rar.dmg;
      dmg *= partMult(hit.part, def);
      dmg *= falloffMult(hit.dist, def);
      dmg *= hit.damageMult;
      const res = targetRange
        ? targetRange.applyDamage(hit.target, dmg, hit.part)
        : { killed: hit.target.health <= 0, applied: dmg };
      // If targets manage their own health outside TargetRange
      if (!targetRange && hit.target.health != null) {
        hit.target.health -= dmg;
        if (hit.target.health <= 0) hit.target.dead = true;
      }
      this.effects.showHitmarker(hit.part === 'head');
      this.effects.spawnDamageNumber(hit.point, dmg, hit.part === 'head');
      this.bus.emit('combat:hit', {
        damage: dmg, part: hit.part, dist: hit.dist, killed: res.killed,
      });
    }
  }

  tryFire(targets, targetRange, rng, moving) {
    const def = this.def;
    const c = this.current;
    if (!def || !c) return false;
    if (this.reloading || this.swapT > 0) return false;
    if (this.shotCooldown > 0) return false;
    if (def.fireMode === 'bolt' && !this.boltReady) return false;
    if (c.mag <= 0) {
      this.startReload();
      return false;
    }

    const cam = this.camera.camera;
    const origin = cam.position.clone();
    const rar = RARITY[c.rarity] || RARITY.common;
    const pellets = def.pellets || 1;
    const dir = new THREE.Vector3();

    for (let p = 0; p < pellets; p++) {
      this.getAimDir(dir, rng);
      this._fireOne(origin, dir, targets, targetRange, rar);
    }

    c.mag--;
    this.shotCooldown = 60 / def.rpm;
    this.lastShotAge = 0;
    this.boltReady = def.fireMode !== 'bolt';
    this._kick = Math.min(1, this._kick + 0.55);
    if (this._muzzleFlash) {
      this._muzzleFlash.material.opacity = 1;
      this._muzzleFlash.scale.setScalar(1.4 + Math.random() * 0.8);
    }

    // Recoil pattern (first shot deterministic)
    const pat = def.recoilPattern;
    const idx = this.shotIndex % pat.length;
    const [h, v] = pat[idx];
    this.aimOffsetH += h;
    this.aimOffsetV += v;
    // Visual kick (camera recovers separately)
    this.camera.recoilPitch += v * DEG * 0.55;
    this.camera.recoilYaw += h * DEG * 0.35;
    this.shotIndex++;

    // Spread bloom
    const adsStill = this.ads > 0.8 && !moving;
    if (!adsStill || def.pellets > 1) {
      this.spread = Math.min(def.spreadMax, this.spread + def.spreadPerShot);
    }

    if (targetRange) targetRange.stats.shots++;
    this.bus.emit('combat:shot', { weapon: def.id });
    return true;
  }

  tick(dt, input, targets, targetRange, rng, moving) {
    // ADS blend
    this.wantAds = input.buttons.has(2);
    const def = this.def;
    const adsSpeed = def ? 1 / Math.max(0.08, def.adsTime * (RARITY[this.current?.rarity]?.ads ?? 1)) : 4;
    if (this.wantAds && !this.reloading) this.ads = Math.min(1, this.ads + adsSpeed * dt);
    else this.ads = Math.max(0, this.ads - adsSpeed * 1.4 * dt);

    // Viewmodel ADS pose + fire kick + reload mag motion
    const adsT = this.ads;
    this._kick = Math.max(0, this._kick - dt * 6);
    if (this._muzzleFlash && this._muzzleFlash.material.opacity > 0) {
      this._muzzleFlash.material.opacity = Math.max(0, this._muzzleFlash.material.opacity - dt * 18);
    }
    const kickZ = this._kick * 0.04;
    const kickX = this._kick * 0.01;
    this.viewGroup.position.set(
      THREE.MathUtils.lerp(0.02, -0.14, adsT) + kickX,
      THREE.MathUtils.lerp(-0.02, 0.05, adsT) - this._kick * 0.015,
      THREE.MathUtils.lerp(0.02, 0.1, adsT) + kickZ
    );
    this.viewGroup.rotation.set(
      THREE.MathUtils.lerp(0.02, -0.02, adsT) - this._kick * 0.08,
      THREE.MathUtils.lerp(0.08, 0, adsT),
      THREE.MathUtils.lerp(0.03, 0, adsT)
    );

    // Magazine yank during reload
    if (this._vmMag) {
      if (this.reloading) {
        const t = 1 - this.reloadT / Math.max(1e-4, this.reloadDur);
        // 0–0.35 drop out, 0.35–0.7 hold, 0.7–1 insert
        let my = 0;
        let mx = 0;
        if (t < 0.35) {
          const u = t / 0.35;
          my = -u * 0.35;
          mx = u * 0.08;
        } else if (t < 0.7) {
          my = -0.35;
          mx = 0.08;
        } else {
          const u = (t - 0.7) / 0.3;
          my = -0.35 * (1 - u);
          mx = 0.08 * (1 - u);
        }
        this._vmMag.position.set(mx, my, 0);
        this._vmMag.visible = t < 0.38 || t > 0.68;
      } else {
        this._vmMag.position.set(0, 0, 0);
        this._vmMag.visible = true;
      }
    }

    // Visual recoil recover
    this.camera.recoilPitch *= Math.exp(-12 * dt);
    this.camera.recoilYaw *= Math.exp(-12 * dt);
    if (Math.abs(this.camera.recoilPitch) < 1e-4) this.camera.recoilPitch = 0;
    if (Math.abs(this.camera.recoilYaw) < 1e-4) this.camera.recoilYaw = 0;

    // Aim offset recovery after delay
    this.lastShotAge += dt;
    if (this.lastShotAge >= COMBAT.RECOIL_RECOVERY_DELAY) {
      const rec = COMBAT.RECOIL_RECOVERY_RATE * dt;
      if (this.aimOffsetV > 0) this.aimOffsetV = Math.max(0, this.aimOffsetV - rec);
      if (this.aimOffsetH > 0) this.aimOffsetH = Math.max(0, this.aimOffsetH - rec);
      else if (this.aimOffsetH < 0) this.aimOffsetH = Math.min(0, this.aimOffsetH + rec);
    }

    // Spread recovery
    if (def) {
      const base = this.ads > 0.5 ? def.spreadAds : def.spreadHip;
      const moveAdd = moving ? def.spreadMove : 0;
      const target = base + moveAdd;
      this.spread = Math.max(target, this.spread - dt * 2.5);
      if (this.spread < target) this.spread = target;
    }

    if (this.shotCooldown > 0) this.shotCooldown -= dt;
    if (this.swapT > 0) this.swapT -= dt;

    if (this.reloading) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) this._finishReload();
    }

    // Bolt cycle
    if (def?.fireMode === 'bolt' && !this.boltReady && this.shotCooldown <= 0) {
      this.boltReady = true;
    }

    // Fire
    if (!input.locked) return;
    const fireHeld = input.buttons.has(0);
    const fireMode = def?.fireMode;
    if (fireHeld && def) {
      if (fireMode === 'auto') {
        this.tryFire(targets, targetRange, rng, moving);
      } else if (fireMode === 'semi' || fireMode === 'bolt' || fireMode === 'pump') {
        // edge fire handled via pressed mouse — check buttons edge in main
      }
    }
  }

  /** Call on mouse down for semi/bolt/pump */
  firePressed(targets, targetRange, rng, moving) {
    const def = this.def;
    if (!def) return;
    if (def.fireMode === 'auto') return; // handled in tick
    this.tryFire(targets, targetRange, rng, moving);
  }

  // HUD snapshot
  hudState() {
    const c = this.current;
    const def = this.def;
    return {
      name: def?.name ?? '—',
      rarity: c?.rarity ?? 'common',
      mag: c?.mag ?? 0,
      magSize: c?.magSize ?? 0,
      reserve: def ? (this.ammo[def.ammo] ?? 0) : 0,
      reloading: this.reloading,
      reloadFrac: this.reloading ? 1 - this.reloadT / Math.max(1e-4, this.reloadDur) : 0,
      ads: this.ads,
      slot: this.active,
      slot0: this.slots[0] ? WEAPONS[this.slots[0].weaponId]?.name : null,
      slot1: this.slots[1] ? WEAPONS[this.slots[1].weaponId]?.name : null,
      health: this.health,
      armor: this.armor,
    };
  }
}
