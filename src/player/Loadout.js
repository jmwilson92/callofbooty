import { BUY_CACHES, BR, ARMOR, DOWNED, THROWABLES, HEALING } from '../config.js';

/**
 * Player economy + consumables / revive gear for caches & BR.
 * Life cycle: alive → downed (bleed) → dead (wait for deploy flare) → parachute drop.
 */
export class Loadout {
  constructor(weapons) {
    this.weapons = weapons;
    this.cash = BUY_CACHES.startCash ?? BR.startingCash ?? 2500;
    this.plates = 2; // starter plates — press 3 to insert
    this.bandages = 2; // press 6 to apply
    this.medkits = 0; // press 7 to apply
    this.smokes = 1;
    this.stims = 1;
    this.grenades = 2; // starter frags
    this.revives = 0; // socks + ibuprofen (self-revive while downed only)
    this.instantRevives = 0; // silver bullets
    this.hasUav = false;
    // Active gear timers
    this.uavT = 0; // remaining recon time
    this.uavCd = 0;
    this.stimSpeedT = 0;
    this.stimSpeedMult = 1;
    // Plate insert channel (seconds remaining)
    this.plateT = 0;
    this.plateMax = ARMOR.PLATE_TIME ?? 2;
    // Heal channel (bandage / medkit)
    this.healT = 0;
    this.healMax = 0;
    this.healKind = null; // 'bandage' | 'medkit'
    // Downed / dead
    this.downed = false;
    this.downT = 0;
    this.dead = false; // permanent until deploy flare
    this.waitingRedeploy = false;
  }

  get isOut() {
    return this.dead || this.waitingRedeploy;
  }

  /** Body armor capacity for current vest level. */
  armorCap() {
    const lvl = this.weapons?.armorLevel ?? 0;
    return ARMOR.LEVELS?.[lvl] ?? ARMOR.LEVELS?.[0] ?? 50;
  }

  /**
   * Purchase catalog entry.
   * @param {string} id
   * @param {object} def
   * @param {{ onDeployFlare?: () => boolean }} [ctx]
   * @returns {boolean}
   */
  buy(id, def, ctx = null) {
    if (!def || this.cash < def.cost) return false;
    const w = this.weapons;
    switch (def.kind) {
      case 'uav':
        this.hasUav = true;
        break;
      case 'weapon':
        if (!def.weaponId) return false;
        w.pickupWeapon?.(def.weaponId, def.rarity || 'common');
        break;
      case 'plates': {
        const max = ARMOR.MAX_CARRIED_PLATES ?? 5;
        const add = def.amount ?? 2;
        if (this.plates >= max) return false;
        this.plates = Math.min(max, this.plates + add);
        break;
      }
      case 'armor': {
        // Body vest (flak) — raises plate capacity and tops armor bar
        const level = def.level ?? 2;
        const max = ARMOR.LEVELS?.[level] ?? 100;
        w.armorLevel = Math.max(w.armorLevel || 0, level);
        w.armor = Math.max(w.armor || 0, max);
        break;
      }
      case 'helmet': {
        // Kevlar — head-only protection
        const maxH = ARMOR.HELMET?.max ?? 100;
        if ((w.helmet || 0) >= maxH) return false;
        w.helmet = maxH;
        break;
      }
      case 'grenade':
        this.grenades += def.amount ?? 1;
        break;
      case 'smoke':
        this.smokes += def.amount ?? 1;
        break;
      case 'stim':
        this.stims += def.amount ?? 1;
        break;
      case 'bandage': {
        const maxB = HEALING.bandage?.maxCarry ?? 5;
        const add = def.amount ?? 1;
        if (this.bandages >= maxB) return false;
        this.bandages = Math.min(maxB, this.bandages + add);
        break;
      }
      case 'medkit': {
        const maxM = HEALING.medkit?.maxCarry ?? 2;
        const add = def.amount ?? 1;
        if (this.medkits >= maxM) return false;
        this.medkits = Math.min(maxM, this.medkits + add);
        break;
      }
      case 'revive':
        this.revives += def.amount ?? 1;
        break;
      case 'instant_revive':
        this.instantRevives += def.amount ?? 1;
        break;
      case 'deploy_flare':
        // Handled specially by BuyCaches (needs success flag)
        return false;
      default:
        return false;
    }
    this.cash -= def.cost;
    return true;
  }

  /**
   * Start inserting a plate (channel). Completes in updatePlating.
   * @returns {boolean}
   */
  startPlate() {
    if (this.plates <= 0 || !this.weapons || this.downed || this.dead) return false;
    if (this.plateT > 0 || this.healT > 0) return false;
    const cap = this.armorCap();
    if ((this.weapons.armor || 0) >= cap - 0.5) return false;
    this.plateMax = ARMOR.PLATE_TIME ?? 2;
    this.plateT = this.plateMax;
    return true;
  }

  /** Cancel plate insert (damage, sprint, fire, etc.). */
  cancelPlate() {
    this.plateT = 0;
  }

  /**
   * Start bandage or medkit channel.
   * @param {'bandage'|'medkit'} kind
   * @returns {boolean}
   */
  startHeal(kind) {
    if (!this.weapons || this.downed || this.dead) return false;
    if (this.plateT > 0 || this.healT > 0) return false;
    const cfg = HEALING[kind];
    if (!cfg) return false;
    const hp = this.weapons.health ?? 0;
    const cap = cfg.cap ?? 100;
    if (hp >= cap - 0.5) return false;
    if (kind === 'bandage') {
      if (this.bandages <= 0) return false;
    } else if (kind === 'medkit') {
      if (this.medkits <= 0) return false;
    } else return false;
    this.healKind = kind;
    this.healMax = cfg.time ?? 3;
    this.healT = this.healMax;
    return true;
  }

  cancelHeal() {
    this.healT = 0;
    this.healMax = 0;
    this.healKind = null;
  }

  /**
   * Tick heal channel. Returns true if a heal just finished applying.
   * @param {number} dt
   * @param {{ moving?: boolean }} [opts]
   * @returns {boolean}
   */
  updateHealing(dt, opts = {}) {
    if (this.healT <= 0) return false;
    const cfg = HEALING[this.healKind] || {};
    // Medkit cancels if you walk
    if (cfg.noMove && opts.moving) {
      this.cancelHeal();
      return false;
    }
    this.healT -= dt;
    if (this.healT > 0) return false;
    this.healT = 0;
    return this._finishHeal();
  }

  _finishHeal() {
    if (!this.weapons || this.downed || this.dead) {
      this.cancelHeal();
      return false;
    }
    const kind = this.healKind;
    const cfg = HEALING[kind];
    this.healKind = null;
    this.healMax = 0;
    if (!cfg) return false;
    if (kind === 'bandage') {
      if (this.bandages <= 0) return false;
      this.bandages -= 1;
    } else if (kind === 'medkit') {
      if (this.medkits <= 0) return false;
      this.medkits -= 1;
    } else return false;
    const cap = cfg.cap ?? 100;
    const heal = cfg.heal ?? 25;
    this.weapons.health = Math.min(cap, (this.weapons.health || 0) + heal);
    // Medkit tops off fully to cap
    if (kind === 'medkit') this.weapons.health = Math.min(100, cap);
    return true;
  }

  /**
   * Tick plate channel. Returns true if a plate was just applied.
   * @param {number} dt
   * @returns {boolean}
   */
  updatePlating(dt) {
    if (this.plateT <= 0) return false;
    this.plateT -= dt;
    if (this.plateT > 0) return false;
    this.plateT = 0;
    return this._finishPlate();
  }

  /** Instant plate (legacy / debug). Prefer startPlate + updatePlating. */
  usePlate() {
    if (this.plateT > 0) return false;
    return this._finishPlate();
  }

  _finishPlate() {
    if (this.plates <= 0 || !this.weapons || this.downed || this.dead) return false;
    const cap = this.armorCap();
    if ((this.weapons.armor || 0) >= cap - 0.5) return false;
    this.plates -= 1;
    this.weapons.armor = Math.min(cap, (this.weapons.armor || 0) + (ARMOR.PLATE_RESTORE ?? 50));
    return true;
  }

  useStim() {
    if (this.stims <= 0 || !this.weapons || this.downed || this.dead) return false;
    this.cancelPlate();
    this.stims -= 1;
    const cfg = THROWABLES.STIM || {};
    this.weapons.health = Math.min(100, (this.weapons.health || 0) + (cfg.heal ?? 28));
    this.stimSpeedMult = cfg.speedMult ?? 1.22;
    this.stimSpeedT = cfg.speedDur ?? 6.5;
    return true;
  }

  /** Spend one frag if available. */
  takeFrag() {
    if (this.grenades <= 0 || this.downed || this.dead) return false;
    this.cancelPlate();
    this.grenades -= 1;
    return true;
  }

  takeSmoke() {
    if (this.smokes <= 0 || this.downed || this.dead) return false;
    this.cancelPlate();
    this.smokes -= 1;
    return true;
  }

  /**
   * Activate UAV recon kit (temporary overhead spotter).
   * @returns {boolean}
   */
  activateUav() {
    if (!this.hasUav || this.downed || this.dead) return false;
    if (this.uavT > 0 || this.uavCd > 0) return false;
    const cfg = THROWABLES.UAV || {};
    this.uavT = cfg.duration ?? 28;
    return true;
  }

  /** Tick gear timers. */
  updateGear(dt) {
    if (this.uavT > 0) {
      this.uavT -= dt;
      if (this.uavT <= 0) {
        this.uavT = 0;
        this.uavCd = THROWABLES.UAV?.cooldown ?? 8;
      }
    } else if (this.uavCd > 0) {
      this.uavCd = Math.max(0, this.uavCd - dt);
    }
    if (this.stimSpeedT > 0) {
      this.stimSpeedT -= dt;
      if (this.stimSpeedT <= 0) {
        this.stimSpeedT = 0;
        this.stimSpeedMult = 1;
      }
    }
  }

  get gearHud() {
    return {
      frags: this.grenades,
      smokes: this.smokes,
      stims: this.stims,
      plates: this.plates,
      bandages: this.bandages,
      medkits: this.medkits,
      plateProgress: this.plateT > 0 ? 1 - this.plateT / Math.max(1e-4, this.plateMax) : 0,
      plating: this.plateT > 0,
      healProgress: this.healT > 0 ? 1 - this.healT / Math.max(1e-4, this.healMax) : 0,
      healing: this.healT > 0,
      healKind: this.healKind,
      uav: this.hasUav,
      uavActive: this.uavT > 0,
      uavT: this.uavT,
      uavCd: this.uavCd,
      stimSpeedT: this.stimSpeedT,
      helmet: this.weapons?.helmet ?? 0,
      helmetMax: ARMOR.HELMET?.max ?? 100,
      armorCap: this.armorCap(),
    };
  }

  /** Enter downed state (bleed-out). Holster main gun → pistol. */
  setDowned() {
    if (this.dead || this.downed) return true;
    this.downed = true;
    this.downT = DOWNED.BLEED_TIME ?? 45;
    this.cancelPlate();
    this.cancelHeal();
    if (this.weapons) {
      this.weapons.health = 0;
      this.weapons.enterDowned?.();
    }
    return true;
  }

  /** Bleed finished → permanently dead until deploy flare. */
  setDead() {
    this.downed = false;
    this.downT = 0;
    this.dead = true;
    this.waitingRedeploy = true;
    this.cancelPlate();
    this.cancelHeal();
    if (this.weapons) {
      this.weapons.health = 0;
      // No shooting while fully dead — keep holstered until redeploy
      this.weapons.enterDowned?.();
    }
  }

  /** Self-revive while still downed (not after full death). */
  tryRevive(instant = false) {
    if (!this.downed || this.dead) return false;
    if (instant) {
      if (this.instantRevives <= 0) return false;
      this.instantRevives -= 1;
      this.downed = false;
      this.downT = 0;
      this.weapons.health = 75;
      this.weapons.exitDowned?.();
      return true;
    }
    if (this.revives <= 0) return false;
    this.revives -= 1;
    this.downed = false;
    this.downT = 0;
    this.weapons.health = 40;
    this.weapons.exitDowned?.();
    return true;
  }

  /**
   * Bring back from permanent death (parachute drop handled by caller).
   * @param {number} [health]
   */
  redeploy(health = 80) {
    this.dead = false;
    this.waitingRedeploy = false;
    this.downed = false;
    this.downT = 0;
    this.cancelPlate();
    if (this.weapons) {
      this.weapons.health = health;
      this.weapons.armor = Math.max(this.weapons.armor || 0, 0);
      this.weapons.exitDowned?.();
    }
  }

  /** Reward for getting a kill while downed — Space for instant self-revive. */
  grantSilverBullet(n = 1) {
    this.instantRevives = (this.instantRevives || 0) + Math.max(1, n | 0);
    return this.instantRevives;
  }
}
