import { BUY_CACHES, BR, ARMOR } from '../config.js';

/**
 * Player economy + consumables / revive gear for caches & BR.
 */
export class Loadout {
  constructor(weapons) {
    this.weapons = weapons;
    this.cash = BUY_CACHES.startCash ?? BR.startingCash ?? 2500;
    this.plates = 0;
    this.grenades = 0;
    this.smokes = 0;
    this.stims = 0;
    this.revives = 0; // socks + ibuprofen
    this.instantRevives = 0; // silver bullets
    this.hasUav = false;
    // Downed state
    this.downed = false;
    this.downT = 0;
  }

  /**
   * Purchase catalog entry.
   * @returns {boolean}
   */
  buy(id, def) {
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
      case 'plates':
        this.plates += def.amount ?? 2;
        break;
      case 'armor': {
        const level = def.level ?? 2;
        const max = ARMOR.LEVELS?.[level] ?? 100;
        w.armorLevel = Math.max(w.armorLevel || 0, level);
        w.armor = Math.max(w.armor || 0, max);
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
      case 'revive':
        this.revives += def.amount ?? 1;
        break;
      case 'instant_revive':
        this.instantRevives += def.amount ?? 1;
        break;
      default:
        return false;
    }
    this.cash -= def.cost;
    return true;
  }

  /** Apply plate from inventory. */
  usePlate() {
    if (this.plates <= 0 || !this.weapons) return false;
    const cap = ARMOR.LEVELS?.[this.weapons.armorLevel || 1] ?? 50;
    if ((this.weapons.armor || 0) >= cap) return false;
    this.plates -= 1;
    this.weapons.armor = Math.min(cap, (this.weapons.armor || 0) + (ARMOR.PLATE_RESTORE ?? 50));
    return true;
  }

  useStim() {
    if (this.stims <= 0 || !this.weapons) return false;
    this.stims -= 1;
    this.weapons.health = Math.min(100, (this.weapons.health || 0) + 20);
    return true;
  }

  /** Self-revive when downed. */
  tryRevive(instant = false) {
    if (!this.downed) return false;
    if (instant) {
      if (this.instantRevives <= 0) return false;
      this.instantRevives -= 1;
      this.downed = false;
      this.downT = 0;
      this.weapons.health = 75;
      return true;
    }
    if (this.revives <= 0) return false;
    this.revives -= 1;
    this.downed = false;
    this.downT = 0;
    this.weapons.health = 40;
    return true;
  }
}
