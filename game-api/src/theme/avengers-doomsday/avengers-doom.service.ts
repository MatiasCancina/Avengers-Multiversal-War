import { Injectable } from '@nestjs/common';
import { AvengersCombat } from './avengers-combat.service';
import { AvengersConfig } from './avengers-config.service';
import { AvengersEvents } from './avengers-events.service';
import { AvengersRandom } from './abstract-avengers-random.provider';
import { AvengersRules } from './avengers-rules.service';
import { AvengersTurnData } from './model/avengers-turn-data.model';

@Injectable()
export class AvengersDoom {
  constructor(
    private readonly config: AvengersConfig,
    private readonly events: AvengersEvents,
    private readonly combat: AvengersCombat,
    private readonly rules: AvengersRules,
    private readonly random: AvengersRandom,
  ) {}

  updateThreat(data: AvengersTurnData, turn: number): void {
    if (!data.doom) {
      return;
    }
    const next = this.rules.threat(data.doom.currentEnergy, data.doom.maxEnergy);
    if (next !== data.doom.threatLevel) {
      data.doom.threatLevel = next;
      this.events.emit(data, turn, {
        type: 'DOOM_THREAT',
        source: 'DOOM',
        actorId: 'DOOM',
        values: { energy: data.doom.currentEnergy },
        parameters: { threat: next },
      });
    }
  }

  intervene(data: AvengersTurnData, turn: number): void {
    if (!data.doom || data.doom.currentEnergy <= 0 || !this.rules.active(data.player).length) {
      return;
    }
    const level = data.doom.threatLevel;
    if (this.random.next(data) >= this.config.balance.doomProbability[level]) {
      return;
    }
    const roll = this.random.next(data);
    const intervention =
      roll < 0.35
        ? 'Arcane Bolt'
        : roll < 0.6
          ? 'Doom Shockwave'
          : roll < 0.8
            ? 'Power Suppression'
            : 'AP Drain';
    this.events.emit(data, turn, {
      type: 'DOOM_INTERVENTION',
      source: 'DOOM',
      actorId: 'DOOM',
      parameters: { intervention, threat: level },
    });
    const active = this.rules.active(data.player);
    const scaling = this.config.balance.doomScaling[level];
    if (intervention === 'Power Suppression') {
      this.combat.effect(data, turn, 'DOOM', 'PLAYER', 'power', -0.1 * scaling, 2, 'DOOM');
    } else if (intervention === 'AP Drain') {
      for (const hero of active) {
        const previous = hero.currentAbilityPoints;
        hero.currentAbilityPoints = Math.max(
          0,
          previous - Math.round(this.config.balance.baseAttackDamage * 0.3 * scaling),
        );
        this.events.emit(data, turn, {
          type: 'AP_CHANGE',
          source: 'DOOM',
          actorId: 'DOOM',
          targetIds: [hero.heroId],
          targetSide: 'PLAYER',
          values: { apChange: hero.currentAbilityPoints - previous, ap: hero.currentAbilityPoints },
        });
      }
    } else {
      const targets =
        intervention === 'Arcane Bolt'
          ? [
              active[
                Math.min(active.length - 1, Math.floor(this.random.next(data) * active.length))
              ],
            ]
          : active;
      for (const hero of targets) {
        const damage = this.rules.damage(
          this.rules.doomStats(),
          this.rules.effectiveStats(data.player, hero, data.content),
          'SPECIAL',
          scaling * (intervention === 'Arcane Bolt' ? 1 : 0.55),
          this.random.next(data),
        );
        this.combat.damageHero(data, turn, 'DOOM', 'PLAYER', hero, damage, 'DOOM');
      }
    }
  }
}
