import * as THREE from 'three';
import { WEAPONS, RARITY, COMBAT, AMMO, ARMOR } from '../config.js';
import { buildViewModel } from './ViewModels.js';
import { classToModelKey } from './WeaponAssets.js';
import { Ballistics } from './Ballistics.js';

const DEG = Math.PI / 180;

/**
 * Data-driven weapon system. Inventory holds up to 2 weapon instances.
 * Fire, reload, swap, ADS, recoil (visual + aim offset), hip bloom.
 * Bullets use ballistics (velocity, drop, travel time → lead required).
 */
export class WeaponSystem {
  constructor(camera, hash, bus, effects) {
    this.camera = camera;
    this.hash = hash;
    this.bus = bus;
    this.effects = effects;
    this.ballistics = new Ballistics(hash, effects, bus);

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
    /** Kevlar helmet durability (0 = none). Only absorbs headshot damage. */
    this.helmet = 0;

    // Mount viewmodel on the dedicated overlay scene (not world camera) so it
    // never depth-fights walls and is always lit/visible.
    this.overlay = null;
    this.viewGroup = new THREE.Group();
    this.viewGroup.name = 'viewWeapon';
    this._vmRoot = null;
    this._vmMag = null;
    this._muzzle = new THREE.Object3D();
    this._kick = 0;
    this._muzzleFlash = null;
    this._muzzleLight = null;
    /** @type {Record<string, THREE.Object3D>} class → GLB template */
    this.weaponModels = {};

    // Give starter sidearm so player can shoot before finding loot
    this.giveWeapon('sidearm', 'common');

    /**
     * While downed: only the pistol is usable. Main guns stay in inventory but
     * are holstered until revive.
     */
    this.downedOnly = false;
    this._preDownedSlot = 0;
  }

  /** Attach to WeaponOverlay mount after construction. */
  attachOverlay(overlay) {
    this.overlay = overlay;
    overlay.mount.add(this.viewGroup);
    // Point light riding with the gun for specular pop
    this._muzzleLight = new THREE.PointLight(0xffcc88, 0, 1.2, 2);
    this.viewGroup.add(this._muzzleLight);
    this._rebuildView();
  }

  /** Set Imagine→Blender viewmodel library (class → template root). */
  setWeaponModels(byClass = {}) {
    this.weaponModels = byClass || {};
    this._rebuildView();
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
    if (this.downedOnly) return; // pistol only while downed
    if (i !== 0 && i !== 1) return;
    if (!this.slots[i] || i === this.active) return;
    this.prevSlot = this.active;
    this.active = i;
    this.swapDur = (this.def?.swapTime ?? 0.4);
    this.swapT = this.swapDur;
    this.reloading = false;
    this.shotIndex = 0;
    this._rebuildView();
  }

  quickSwap() {
    if (this.downedOnly) return;
    const other = this.active === 0 ? 1 : 0;
    if (this.slots[other]) this.selectSlot(other);
    else if (this.slots[this.prevSlot] && this.prevSlot !== this.active) {
      this.selectSlot(this.prevSlot);
    }
  }

  /**
   * Holster primary, pull sidearm (give one if missing). Call on setDowned.
   */
  enterDowned() {
    if (this.downedOnly) return;
    this.downedOnly = true;
    this._preDownedSlot = this.active;
    this.wantAds = false;
    this.ads = 0;
    this.reloading = false;

    // Prefer an existing sidearm / pistol in either slot
    let pistolSlot = -1;
    for (let i = 0; i < 2; i++) {
      const s = this.slots[i];
      if (!s) continue;
      const d = WEAPONS[s.weaponId];
      if (d && (d.class === 'pistol' || s.weaponId === 'sidearm')) {
        pistolSlot = i;
        break;
      }
    }
    if (pistolSlot < 0) {
      // No pistol in bag — force sidearm into free slot or temporarily replace
      const inst = WeaponSystem.makeInstance('sidearm', 'common');
      if (!this.slots[0]) {
        this.slots[0] = inst;
        pistolSlot = 0;
      } else if (!this.slots[1]) {
        this.slots[1] = inst;
        pistolSlot = 1;
      } else {
        // Both full: stash primary in prevSlot memory, put sidearm in active
        this._stashedForDowned = this.slots[this.active];
        this.slots[this.active] = inst;
        pistolSlot = this.active;
      }
    }
    if (pistolSlot >= 0 && pistolSlot !== this.active) {
      this.active = pistolSlot;
    }
    // Full mag for the clutch pistol fight
    const c = this.current;
    if (c && (WEAPONS[c.weaponId]?.class === 'pistol' || c.weaponId === 'sidearm')) {
      c.mag = c.magSize;
      const ammoType = c.ammoType || WEAPONS[c.weaponId]?.ammo || 'light';
      this.ammo[ammoType] = Math.max(this.ammo[ammoType] ?? 0, c.magSize * 2);
    }
    this.swapT = 0;
    this.shotIndex = 0;
    this.shotCooldown = 0;
    this._rebuildView();
  }

  /** Restore pre-downed weapon after self-revive / redeploy. */
  exitDowned() {
    if (!this.downedOnly) return;
    this.downedOnly = false;
    if (this._stashedForDowned) {
      // Put stashed primary back if we temporarily replaced it
      const cur = this.current;
      if (cur && (cur.weaponId === 'sidearm' || WEAPONS[cur.weaponId]?.class === 'pistol')) {
        this.slots[this.active] = this._stashedForDowned;
      }
      this._stashedForDowned = null;
    }
    const restore = this._preDownedSlot;
    if (this.slots[restore]) this.active = restore;
    else if (this.slots[0]) this.active = 0;
    else if (this.slots[1]) this.active = 1;
    this.swapT = 0;
    this._rebuildView();
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
    // Keep point light + FP hands (attached outside viewmodel rebuild)
    const keep = [];
    while (this.viewGroup.children.length) {
      const c = this.viewGroup.children[0];
      this.viewGroup.remove(c);
      if (c.isLight || c.name === 'fpArms' || c.userData?.isFpArms) {
        keep.push(c);
        continue;
      }
      c.traverse?.((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    for (const k of keep) this.viewGroup.add(k);

    this._vmRoot = null;
    this._vmMag = null;
    this._muzzleFlash = null;
    const def = this.def;
    if (!def) return;
    const key = classToModelKey(def.class);
    const glb = this.weaponModels[key] || null;
    const vm = buildViewModel(def, glb);
    this._vmRoot = vm.root;
    this._vmMag = vm.mag;
    this._muzzle = vm.muzzle;
    this.viewGroup.add(vm.root);

    // Soft viewmodel flash for non-scoped; sniper/DMR use world-space bloom only
    if (def.class === 'sniper' || def.class === 'dmr') {
      this._muzzleFlash = null;
    } else {
      const flash = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffe8a0, transparent: true, opacity: 0, depthTest: false, depthWrite: false,
        })
      );
      flash.position.copy(vm.muzzle.position);
      flash.position.x += 0.008;
      flash.visible = false;
      flash.frustumCulled = false;
      flash.renderOrder = 1000;
      vm.root.add(flash);
      this._muzzleFlash = flash;
    }
  }

  /**
   * Aim direction: camera look + recoil aim offset + hip/ADS spread cone.
   * Bloom (this.spread) is additive only — recovers to 0, not to hip base.
   * Range scatter beyond effectiveRange is applied in Ballistics.
   */
  getAimDir(out, rng) {
    const cam = this.camera.camera;
    out.set(0, 0, -1).applyQuaternion(cam.quaternion);

    const yawQ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0), this.aimOffsetH * DEG
    );
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const pitchQ = new THREE.Quaternion().setFromAxisAngle(right, -this.aimOffsetV * DEG);
    out.applyQuaternion(yawQ).applyQuaternion(pitchQ).normalize();

    const def = this.def;
    if (!def) return out;

    const adsT = this.ads * this.ads * (3 - 2 * this.ads);
    let cone = THREE.MathUtils.lerp(def.spreadHip, def.spreadAds, adsT);
    // Movement penalty is mostly a hip problem
    cone += (def.spreadMove || 0) * (1 - adsT);
    // Recoil bloom (deg) — less of it when fully ADS
    cone += this.spread * THREE.MathUtils.lerp(1.0, 0.35, adsT);

    if (cone > 0.02 && rng) {
      const ang = cone * DEG * (0.2 + rng() * 0.8);
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

    // Fire from camera center along aim — never offset sideways
    const speed = def.muzzleVelocity || 600;
    const longRange = def.class === 'sniper' || def.class === 'dmr';
    const fireDir = dir.clone().normalize();
    this.ballistics.fire({
      origin: origin.clone(),
      dir: fireDir,
      speed,
      damage: def.damage,
      def,
      rar,
      targetRange,
      maxDist: 500,
    });

    // Tracer from same origin/direction as the bullet (no lateral nudge)
    const streakLen = longRange ? 32 : 16;
    const streakEnd = origin.clone().addScaledVector(fireDir, streakLen);
    this.effects.spawnTracer(origin, streakEnd, { long: longRange, centered: true });
    this.effects.spawnMuzzleBloom?.(
      origin.clone().addScaledVector(fireDir, 0.4),
      longRange ? 1.4 : 0.9
    );

    // Brass only — intentionally off to the side (not the bullet)
    {
      const cam = this.camera.camera;
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      const eject = origin.clone()
        .addScaledVector(right, 0.14)
        .addScaledVector(up, -0.1)
        .addScaledVector(forward, 0.15);
      this.effects.spawnCasing(eject, right, up, forward);
    }
  }

  tryFire(targets, targetRange, rng, moving) {
    const def = this.def;
    const c = this.current;
    if (!def || !c) return false;
    // Downed: only pistol / sidearm
    if (this.downedOnly && def.class !== 'pistol' && c.weaponId !== 'sidearm') {
      return false;
    }
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
    this._kick = Math.min(1, this._kick + 0.65);
    // Small flash — not a big orb in the FOV
    if (this._muzzleFlash) {
      this._muzzleFlash.visible = true;
      this._muzzleFlash.material.opacity = 0.85;
      this._muzzleFlash.scale.setScalar(0.55 + Math.random() * 0.25);
    }
    if (this._muzzleLight) this._muzzleLight.intensity = 1.8;

    // Recoil pattern — much milder when ADS (class adsRecoilMult)
    const adsT = this.ads * this.ads * (3 - 2 * this.ads);
    const recM = THREE.MathUtils.lerp(1.0, def.adsRecoilMult ?? 0.45, adsT);
    const pat = def.recoilPattern;
    const idx = this.shotIndex % pat.length;
    const [h, v] = pat[idx];
    this.aimOffsetH += h * recM;
    this.aimOffsetV += v * recM;
    this.camera.recoilPitch += v * DEG * 0.55 * recM;
    this.camera.recoilYaw += h * DEG * 0.35 * recM;
    this.shotIndex++;

    // Bloom stacks; ADS still blooms less (sniper ADS barely blooms)
    const bloomScale = THREE.MathUtils.lerp(1.0, def.pellets > 1 ? 0.85 : 0.28, adsT);
    if (bloomScale > 0.05 || def.pellets > 1) {
      const add = def.spreadPerShot * bloomScale * (moving && this.ads < 0.5 ? 1.25 : 1);
      this.spread = Math.min(def.spreadMax, this.spread + add);
    }

    if (targetRange) targetRange.stats.shots++;
    this.bus.emit('combat:shot', { weapon: def.id });
    return true;
  }

  tick(dt, input, targets, targetRange, rng, moving) {
    // Advance live bullets (drop, travel, hits)
    this.ballistics.update(dt, targets || []);

    // ADS blend
    this.wantAds = input.buttons.has(2);
    const def = this.def;
    const adsSpeed = def ? 1 / Math.max(0.08, def.adsTime * (RARITY[this.current?.rarity]?.ads ?? 1)) : 4;
    if (this.wantAds && !this.reloading) this.ads = Math.min(1, this.ads + adsSpeed * dt);
    else this.ads = Math.max(0, this.ads - adsSpeed * 1.4 * dt);

    // Viewmodel pose: hip = tucked lower-right (clear of crosshair);
    // ADS = sight axis on camera center so only optic/irons sit on aim point.
    const adsT = this.ads * this.ads * (3 - 2 * this.ads); // smoothstep
    this._kick = Math.max(0, this._kick - dt * 7);
    if (this._muzzleFlash && this._muzzleFlash.material.opacity > 0) {
      this._muzzleFlash.material.opacity = Math.max(0, this._muzzleFlash.material.opacity - dt * 20);
      if (this._muzzleFlash.material.opacity <= 0.02) this._muzzleFlash.visible = false;
    }
    if (this._muzzleLight) {
      this._muzzleLight.intensity = Math.max(0, this._muzzleLight.intensity - dt * 28);
    }
    // Camera looks −Z: gun MUST sit at negative Z (in front).
    // Hip  = classic FPS lower-right — always visible.
    // ADS  = center so optic/irons hit the crosshair.
    const kickZ = this._kick * 0.035;
    const kickX = this._kick * 0.007;
    this.viewGroup.position.set(
      THREE.MathUtils.lerp(0.18, 0.0, adsT) + kickX,
      THREE.MathUtils.lerp(-0.16, -0.005, adsT) - this._kick * 0.01,
      THREE.MathUtils.lerp(-0.4, -0.3, adsT) + kickZ
    );
    this.viewGroup.rotation.set(
      THREE.MathUtils.lerp(0.05, 0.0, adsT) - this._kick * 0.055,
      THREE.MathUtils.lerp(0.2, 0.0, adsT),
      THREE.MathUtils.lerp(0.04, 0.0, adsT)
    );

    // Sniper: fade viewmodel out when fully scoped (overlay takes over)
    const hideOnAds = !!(def?.hideViewOnAds);
    if (this._vmRoot) {
      if (hideOnAds) {
        const vis = 1 - Math.max(0, (adsT - 0.55) / 0.45);
        this._vmRoot.visible = vis > 0.05;
        this._vmRoot.traverse((o) => {
          if (o.isMesh && o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of mats) {
              if (m.transparent || vis < 0.99) {
                m.transparent = true;
                m.opacity = Math.max(0.02, vis);
                m.depthWrite = vis > 0.5;
              }
            }
          }
        });
      } else {
        this._vmRoot.visible = true;
      }
    }

    // Tiny idle sway (hip only)
    if (this._vmRoot && !this.reloading && this._vmRoot.visible) {
      const t = performance.now() * 0.001;
      const sway = 1 - adsT;
      this._vmRoot.position.y = Math.sin(t * 1.5) * 0.003 * sway;
      this._vmRoot.rotation.z = Math.sin(t * 1.05) * 0.006 * sway;
    }

    // Magazine yank during reload
    if (this._vmMag) {
      const magMesh = this._vmMag.userData?.magMesh;
      if (this.reloading) {
        const t = 1 - this.reloadT / Math.max(1e-4, this.reloadDur);
        let my = 0;
        let mx = 0;
        if (t < 0.35) {
          my = -(t / 0.35) * 0.18;
          mx = (t / 0.35) * 0.04;
        } else if (t < 0.7) {
          my = -0.18;
          mx = 0.04;
        } else {
          const u = (t - 0.7) / 0.3;
          my = -0.18 * (1 - u);
          mx = 0.04 * (1 - u);
        }
        if (magMesh) {
          if (magMesh.userData._baseY == null) magMesh.userData._baseY = magMesh.position.y;
          magMesh.position.y = magMesh.userData._baseY + my;
          magMesh.visible = t < 0.4 || t > 0.65;
        } else {
          // Procedural viewmodel: mag is a child group we can move
          this._vmMag.position.set(mx, my, 0);
          this._vmMag.visible = t < 0.4 || t > 0.65;
        }
      } else if (magMesh) {
        if (magMesh.userData._baseY != null) magMesh.position.y = magMesh.userData._baseY;
        magMesh.visible = true;
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

    // Bloom recovery → 0 (base hip/ADS cone is separate in getAimDir)
    if (def) {
      const rec = (COMBAT.SPREAD_RECOVER ?? 4) * (1 + this.ads * 1.6) * dt;
      this.spread = Math.max(0, this.spread - rec);
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
      scopeOverlay: !!(def?.scopeOverlay),
      scopeZoomFov: def?.scopeZoomFov ?? null,
      weaponClass: def?.class ?? null,
      slot: this.active,
      slot0: this.slots[0] ? WEAPONS[this.slots[0].weaponId]?.name : null,
      slot1: this.slots[1] ? WEAPONS[this.slots[1].weaponId]?.name : null,
      health: this.health,
      armor: this.armor,
      armorLevel: this.armorLevel,
      helmet: this.helmet,
      helmetMax: ARMOR.HELMET?.max ?? 100,
    };
  }
}
