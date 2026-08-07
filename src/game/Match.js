import { BR } from '../config.js';

/**
 * Battle royale match: 5 shrinking zones → final map-wide contamination.
 * Win condition: last alive (player squad survives; all bots eliminated / die to gas).
 * Tracks combat stats for the end-of-match scoreboard.
 */
export class MatchController {
  /**
   * @param {import('../core/EventBus.js').EventBus} bus
   * @param {import('../combat/Bots.js').BotSystem} bots
   * @param {import('../net/Party.js').PartyClient} party
   * @param {import('./Zone.js').ZoneSystem} zone
   */
  constructor(bus, bots, party, zone = null) {
    this.bus = bus;
    this.bots = bots;
    this.party = party;
    this.zone = zone;
    this.phase = 'lobby'; // lobby | live | end | celebrating
    this.teamId = 0;
    this.startedAt = 0;
    this.endedAt = 0;
    this.winner = null;
    this.endReason = null;
    this._endCheckAcc = 0;
    this._gasHud = { outside: false, dps: 0 };

    /** @type {import('./MatchStats.js').MatchStats} */
    this.stats = this._freshStats();

    bus?.on?.('bot:killed', (ev) => {
      if (this.phase !== 'live') return;
      // Only YOUR kills count — not bot-vs-bot, gas, or friend's remote kills
      if (ev?.remote) return;
      if (ev?.source && ev.source !== 'player') return;
      if (ev?.part === 'gas') return;
      this.stats.kills += 1;
      this.bus?.emit?.('match:kill', { kills: this.stats.kills, id: ev?.id });
    });
    bus?.on?.('combat:hit', (ev) => {
      if (this.phase !== 'live') return;
      const dmg = Math.max(0, ev?.damage || 0);
      this.stats.damageDealt += dmg;
      if (ev?.part === 'head') this.stats.headshots += 1;
      this.stats.hits += 1;
    });
    bus?.on?.('player:damage', (ev) => {
      if (this.phase !== 'live') return;
      const amt = Math.max(0, ev?.amount || 0);
      if (amt > 0) this.stats.damageTaken += amt;
    });
    bus?.on?.('match:dead', () => {
      if (this.phase !== 'live') return;
      this.stats.deaths += 1;
    });
    bus?.on?.('match:downed', () => {
      if (this.phase !== 'live') return;
      this.stats.downs += 1;
    });
  }

  _freshStats() {
    return {
      kills: 0,
      deaths: 0,
      downs: 0,
      damageDealt: 0,
      damageTaken: 0,
      headshots: 0,
      hits: 0,
      shots: 0,
      cashEarned: 0,
    };
  }

  /** Call after bots spawn — retag bot teams as enemy squads for BR. */
  prepareBots() {
    for (const b of this.bots.bots) {
      b.teamId = (b.teamId ?? 0) + 100;
      b.isEnemy = true;
      b.noRespawn = true;
    }
  }

  /**
   * @param {number} [seed] optional shared seed (room hash)
   */
  start(seed) {
    this.phase = 'live';
    this.startedAt = performance.now() / 1000;
    this.endedAt = 0;
    this.winner = null;
    this.endReason = null;
    this.stats = this._freshStats();
    // legacy alias used by HUD
    this.kills = 0;
    if (this.zone) {
      this.zone.start(seed ?? undefined);
    }
    this.bus?.emit?.('match:start', { teamId: this.teamId, seed });
  }

  get kills() {
    return this.stats?.kills ?? 0;
  }

  set kills(v) {
    if (this.stats) this.stats.kills = v;
  }

  /**
   * @param {number} dt
   * @param {{ health:number }} vitals
   * @param {import('../player/Loadout.js').Loadout} loadout
   * @param {{ x:number, y:number, z:number }} playerPos
   * @param {{ inHeli?: boolean }} [opts]
   */
  update(dt, vitals, loadout, playerPos = null, opts = null) {
    if (this.phase !== 'live') return;

    // Zone tick + gas damage
    if (this.zone?.active) {
      this.zone.update(dt);
      if (playerPos && vitals && !loadout?.downed) {
        const prevHp = vitals.health;
        this._gasHud = this.zone.applyPlayerDamage(dt, vitals, playerPos, {
          immune: !!opts?.inHeli,
        });
        if (this._gasHud.damage > 0) {
          this.bus?.emit?.('player:damage', {
            amount: this._gasHud.damage,
            source: 'gas',
            dps: this._gasHud.dps,
          });
        } else if (prevHp !== vitals.health && vitals.health < prevHp) {
          this.bus?.emit?.('player:damage', {
            amount: prevHp - vitals.health,
            source: 'unknown',
          });
        }
      } else {
        this._gasHud = { outside: false, dps: 0, damage: 0 };
      }
      this._damageBotsInGas(dt);
      const snap = this.zone.snapshot();
      this.bots.setBrPressure?.(snap.rampIndex, snap);
    }

    if (vitals.health <= 0 && loadout && !loadout.downed && !loadout.dead) {
      loadout.setDowned?.() || ((loadout.downed = true), (loadout.downT = 45), (vitals.health = 0));
      this.bus?.emit?.('match:downed', {
        reason: this._gasHud?.damage ? 'gas' : 'damage',
      });
    }
    if (loadout?.downed && !loadout.dead) {
      loadout.downT -= dt;
      if (loadout.downT <= 0) {
        loadout.setDead?.() || ((loadout.dead = true), (loadout.waitingRedeploy = true), (loadout.downed = false));
        this.bus?.emit?.('match:dead', { reason: 'bleedout' });
      }
    }

    this._endCheckAcc += dt;
    if (this._endCheckAcc < 0.5) return;
    this._endCheckAcc = 0;

    const aliveBots = this.bots.bots.filter((b) => !b.dead).length;
    const playerAlive = !loadout?.downed && !loadout?.dead && (vitals?.health ?? 0) > 0;

    if (playerAlive && aliveBots === 0) {
      this._end('survivors', 'last_alive');
      return;
    }
  }

  _damageBotsInGas(dt) {
    if (!this.zone?.active || !this.zone.gasEnabled) return;
    const final = this.zone.isFinalContamination || this.zone.radius <= 0.05;
    for (const bot of this.bots.bots) {
      if (bot.dead) continue;
      const outside = final || !this.zone.isInside(bot.x, bot.z);
      if (!outside) continue;
      let use = this.zone.dps || 0;
      if (use <= 0) {
        if (final) {
          use = this.zone.phases?.[this.zone.phases.length - 1]?.dps ?? 45;
        } else {
          const prev = this.zone.phases?.[Math.max(0, this.zone.phaseIndex - 1)];
          use = prev?.dps ?? 1;
        }
      }
      bot._gasAcc = (bot._gasAcc || 0) + use * dt;
      if (bot._gasAcc >= 0.5) {
        const dmg = bot._gasAcc;
        bot._gasAcc = 0;
        bot.health -= dmg;
        if (bot.health <= 0) {
          this.bots.applyDamage?.(bot, 9999, 'gas');
        }
      }
    }
  }

  /**
   * Force end (win celebration). Used by last-alive and debug.
   * @param {string} winner
   * @param {string} reason
   */
  _end(winner, reason) {
    if (this.phase === 'end' || this.phase === 'celebrating') return;
    this.phase = 'celebrating';
    this.winner = winner;
    this.endReason = reason;
    this.endedAt = performance.now() / 1000;
    const report = this.buildReport();
    this.bus?.emit?.('match:end', report);
  }

  /** Debug / console: skip to extraction celebration. */
  forceWin(reason = 'debug') {
    this._end('survivors', reason);
  }

  /**
   * Full post-match report for cutscene + scoreboard.
   */
  buildReport() {
    const s = this.stats || this._freshStats();
    const duration = Math.max(0, (this.endedAt || performance.now() / 1000) - (this.startedAt || 0));
    const deaths = Math.max(0, s.deaths | 0);
    const kills = Math.max(0, s.kills | 0);
    const kdr = deaths <= 0 ? kills : kills / deaths;

    const squad = this._buildSquadRoster();

    return {
      phase: 'celebrating',
      winner: this.winner,
      endReason: this.endReason,
      kills,
      deaths,
      downs: s.downs | 0,
      damageDealt: Math.round(s.damageDealt || 0),
      damageTaken: Math.round(s.damageTaken || 0),
      headshots: s.headshots | 0,
      hits: s.hits | 0,
      kdr: Math.round(kdr * 100) / 100,
      durationSec: Math.round(duration),
      aliveBots: this.bots.bots.filter((b) => !b.dead).length,
      squad,
      localName: this.party?.name || 'You',
    };
  }

  _buildSquadRoster() {
    const roster = [];
    const localName = this.party?.name || 'You';
    roster.push({
      id: 'local',
      name: localName,
      local: true,
      // Status filled by caller with live loadout if needed
      status: 'extracted',
      kills: this.stats?.kills ?? 0,
      deaths: this.stats?.deaths ?? 0,
      damage: Math.round(this.stats?.damageDealt || 0),
    });
    if (this.party?.peers) {
      for (const [id, p] of this.party.peers) {
        roster.push({
          id: String(id),
          name: p.name || `Friend ${id}`,
          local: false,
          status: (p.health ?? 1) <= 0 ? 'kia' : 'extracted',
          kills: p.kills ?? '—',
          deaths: p.deaths ?? '—',
          damage: p.damage ?? '—',
        });
      }
    }
    // Pad solo squad to 4 for the "boys" cutscene feel
    while (roster.length < 4) {
      const n = roster.length;
      roster.push({
        id: `ai_${n}`,
        name: ['Ghost', 'Roach', 'Soap', 'Price'][n] || `Operator ${n + 1}`,
        local: false,
        status: n === 2 && (this.stats?.deaths > 0) ? 'kia' : 'extracted',
        kills: '—',
        deaths: '—',
        damage: '—',
        filler: true,
      });
    }
    return roster.slice(0, 4);
  }

  setHardcore(on) {
    if (on) {
      for (const b of this.bots.bots) {
        b.noRespawn = true;
      }
    }
  }

  hudState() {
    const live = this.bots.bots.filter((b) => !b.dead).length;
    const squads = new Set(
      this.bots.bots.filter((b) => !b.dead).map((b) => b.teamId)
    ).size;
    const z = this.zone?.snapshot?.() || null;
    return {
      phase: this.phase === 'celebrating' ? 'end' : this.phase,
      winner: this.winner,
      endReason: this.endReason,
      aliveBots: live,
      aliveSquads: squads,
      kills: this.stats?.kills ?? 0,
      gas: this._gasHud,
      zone: z,
    };
  }
}
