import { Injectable } from '@nestjs/common';
import { AvengersActions, isTactical } from './avengers-actions.service';
import { AvengersCombat } from './avengers-combat.service';
import { AvengersRandom } from './abstract-avengers-random.provider';
import { AvengersRules } from './avengers-rules.service';
import { AvengersAction } from './model/avengers-action.model';
import { AvengersStrategy as S } from './model/avengers-strategy.enum';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { BossThreatLevel } from './model/boss-threat-level.enum';

@Injectable()
export class AvengersOpponentAi {
  constructor(
    private readonly actions: AvengersActions,
    private readonly combat: AvengersCombat,
    private readonly rules: AvengersRules,
    private readonly random: AvengersRandom,
  ) {}

  desiredStrategy(data: AvengersTurnData): S {
    const team = data.opponent;
    const living = this.rules.living(team);
    const ratio =
      living.reduce((sum, hero) => sum + hero.currentEnergy, 0) /
      Math.max(
        1,
        living.reduce((sum, hero) => sum + hero.maxEnergy, 0),
      );
    const threatened = data.doom
      ? [BossThreatLevel.HIGH, BossThreatLevel.CRITICAL].includes(data.doom.threatLevel)
      : false;
    switch (team.leaderProfile) {
      case S.AGGRESSIVE:
        return ratio < 0.25 ? S.DEFENSIVE : S.AGGRESSIVE;
      case S.DEFENSIVE:
        return ratio > 0.8 && !threatened ? S.BALANCED : S.DEFENSIVE;
      case S.BALANCED:
        return ratio < 0.4 ? S.DEFENSIVE : S.BALANCED;
      case S.PRAGMATIC:
        return ratio < 0.55 || threatened || team.effects.some((effect) => effect.modifier < 0)
          ? S.DEFENSIVE
          : this.rules.active(data.player).some((hero) => hero.currentEnergy / hero.maxEnergy < 0.3)
            ? S.AGGRESSIVE
            : S.PRAGMATIC;
    }
  }

  prepare(data: AvengersTurnData, turn: number): void {
    if (!this.rules.living(data.opponent).length) {
      return;
    }
    // Replace KO heroes automatically, while the human's formation is never auto-filled.
    for (let attempt = 0; attempt < 3 && !this.rules.validFormation(data.opponent); attempt++) {
      const swaps = this.actions
        .list(data, turn, 'OPPONENT')
        .filter((action) => action.type === 'SWAP');
      swaps.sort((a, b) => {
        const score = (action: Extract<AvengersAction, { type: 'SWAP' }>): number => {
          const hero = data.opponent.heroes.find((value) => value.heroId === action.incomingId)!;
          return (hero.heroId === data.opponent.leaderId ? 1000 : 0) + hero.currentEnergy;
        };
        return score(b) - score(a);
      });
      if (!swaps.length) {
        break;
      }
      this.combat.tactical(data, turn, 'OPPONENT', swaps[0]);
    }
    const desired = this.desiredStrategy(data);
    const change = this.actions
      .list(data, turn, 'OPPONENT')
      .find((action) => action.type === 'CHANGE_STRATEGY' && action.strategy === desired);
    const willingness = { AGGRESSIVE: 0.15, DEFENSIVE: 0.3, BALANCED: 0.4, PRAGMATIC: 0.75 }[
      data.opponent.leaderProfile
    ];
    if (change && this.random.next(data) < willingness) {
      this.combat.tactical(data, turn, 'OPPONENT', change);
    }
    const weak = this.rules
      .active(data.opponent)
      .find(
        (hero) =>
          hero.heroId !== data.opponent.leaderId && hero.currentEnergy / hero.maxEnergy < 0.25,
      );
    if (weak) {
      const swaps = this.actions
        .list(data, turn, 'OPPONENT')
        .filter(
          (action): action is Extract<AvengersAction, { type: 'SWAP' }> =>
            action.type === 'SWAP' && action.outgoingId === weak.heroId,
        );
      swaps.sort(
        (a, b) =>
          data.opponent.heroes.find((hero) => hero.heroId === b.incomingId)!.currentEnergy -
          data.opponent.heroes.find((hero) => hero.heroId === a.incomingId)!.currentEnergy,
      );
      if (swaps.length) {
        this.combat.tactical(data, turn, 'OPPONENT', swaps[0]);
      }
    }
  }

  choose(data: AvengersTurnData, turn: number): AvengersAction | null {
    const options = this.actions
      .list(data, turn, 'OPPONENT')
      .filter((action) => !isTactical(action));
    if (!options.length) {
      return null;
    }
    const weights = options.map((action) => this.weight(data, action));
    let roll = this.random.next(data) * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < options.length; index++) {
      roll -= weights[index];
      if (roll < 0) {
        return options[index];
      }
    }
    return options[options.length - 1];
  }

  weight(data: AvengersTurnData, action: AvengersAction): number {
    const team = data.opponent;
    const injured = this.rules
      .active(team)
      .some((hero) => hero.currentEnergy / hero.maxEnergy < 0.55);
    const weights = {
      BASIC_ATTACK: 1,
      OFFENSIVE_SPECIAL: 2.2,
      SUPPORT_SPECIAL: injured ? 3 : 0.35,
      LEADER_ABILITY: 2.5,
      TEAM_ACTION: 2.6,
      POWER_UP: 0,
      SWAP: 0,
      CHANGE_STRATEGY: 0,
      SUE_STORM_APPEAL: 0,
    };
    let weight = weights[action.type];
    if (action.type === 'SUPPORT_SPECIAL') {
      weight *= team.strategy === S.DEFENSIVE ? 2 : team.strategy === S.AGGRESSIVE ? 0.4 : 1;
    } else {
      weight *= team.strategy === S.AGGRESSIVE ? 1.5 : team.strategy === S.DEFENSIVE ? 0.75 : 1;
    }
    if (team.strategy === S.PRAGMATIC && injured) {
      weight *= action.type === 'SUPPORT_SPECIAL' ? 1.5 : 0.9;
    }
    if ('targetId' in action) {
      const target = data.player.heroes.find((hero) => hero.heroId === action.targetId);
      if (target) {
        weight *=
          1 +
          (1 - target.currentEnergy / target.maxEnergy) * (team.strategy === S.AGGRESSIVE ? 2 : 1);
      }
    }
    if ('actorId' in action) {
      const actor = team.heroes.find((hero) => hero.heroId === action.actorId)!;
      const stats = this.rules.effectiveStats(team, actor, data.content);
      weight *= 0.5 + (action.type === 'BASIC_ATTACK' ? stats.power : stats.ability) / 100;
      if (
        action.apCost > 0 &&
        actor.currentAbilityPoints < action.apCost * 1.5 &&
        team.strategy === S.DEFENSIVE
      ) {
        weight *= 0.7;
      }
    }
    return Math.max(0.01, weight);
  }
}
