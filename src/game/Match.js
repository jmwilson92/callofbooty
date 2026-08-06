import { BR, BOTS } from '../config.js';

/**
 * Lightweight BR match state for friends + bot squads.
 * Full net authority comes later; this tracks teams, win, and lobby join.
 */
export class MatchController {
  constructor(bus, bots, party) {
    this.bus = bus;
    this.bots = bots;
    this.party = party;
    this.phase = 'lobby'; // lobby | live | end
    this.teamId = 0; // local player team
    this.startedAt = 0;
    this.winner = null;
    this._endCheckAcc = 0;
  }

  /** Call after bots spawn — retag bot teams as enemy squads for BR. */
  prepareBots() {
    // Bots already have teamIds from BotSystem; treat all as enemy team != 0
    for (const b of this.bots.bots) {
      // Offset so player team 0 never collides
      b.teamId = (b.teamId ?? 0) + 100;
      b.isEnemy = true;
    }
  }

  start() {
    this.phase = 'live';
    this.startedAt = performance.now() / 1000;
    this.winner = null;
    this.bus?.emit?.('match:start', { teamId: this.teamId });
  }

  /**
   * @param {number} dt
   * @param {{ health:number }} vitals
   * @param {import('../player/Loadout.js').Loadout} loadout
   */
  update(dt, vitals, loadout) {
    if (this.phase !== 'live') return;

    // Downed if health depleted
    if (vitals.health <= 0 && loadout && !loadout.downed) {
      loadout.downed = true;
      loadout.downT = 45; // bleed-out timer
      vitals.health = 0;
      this.bus?.emit?.('match:downed', {});
    }
    if (loadout?.downed) {
      loadout.downT -= dt;
      if (loadout.downT <= 0) {
        this.phase = 'end';
        this.winner = 'bots';
        this.bus?.emit?.('match:end', { winner: 'bots', reason: 'eliminated' });
      }
    }

    this._endCheckAcc += dt;
    if (this._endCheckAcc < 1.2) return;
    this._endCheckAcc = 0;

    // Win: all enemy bots dead (no respawn in BR — optional)
    // For now bots respawn; win by surviving match duration or manual
    const elapsed = performance.now() / 1000 - this.startedAt;
    if (elapsed > (BR.matchDuration ?? 1200)) {
      this.phase = 'end';
      this.winner = 'survivors';
      this.bus?.emit?.('match:end', { winner: 'survivors', reason: 'time' });
    }
  }

  /** Disable bot respawn for hardcore BR. */
  setHardcore(on) {
    if (on) {
      for (const b of this.bots.bots) {
        b.noRespawn = true;
      }
    }
  }
}
