import { Injectable } from '@nestjs/common';
import { AvengersConfig } from '../avengers-config.service';
import { AvengersStrategy } from '../model/avengers-strategy.enum';
import { HeroStats } from '../model/hero-stats.model';

export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

@Injectable()
export class AvengersMechanics {
  constructor(private readonly config: AvengersConfig) {}

  compatibility(profile: AvengersStrategy, strategy: AvengersStrategy): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (profile === strategy) {
      return 'HIGH';
    }
    if (
      (profile === AvengersStrategy.AGGRESSIVE && strategy === AvengersStrategy.DEFENSIVE) ||
      (profile === AvengersStrategy.DEFENSIVE && strategy === AvengersStrategy.AGGRESSIVE)
    ) {
      return 'LOW';
    }
    return 'MEDIUM';
  }

  effectiveStats(
    base: HeroStats,
    profile: AvengersStrategy,
    strategy: AvengersStrategy,
    energyRatio: number,
    canSpecial: boolean,
    synergyModifier = 0,
  ): HeroStats {
    const alignment =
      this.config.balance.leaderCompatibility[this.compatibility(profile, strategy)];
    let modifiers = { ...this.config.balance.strategyModifiers[strategy] };
    if (strategy === AvengersStrategy.PRAGMATIC) {
      modifiers =
        energyRatio < 0.4
          ? { power: 0, ability: 0.04, agility: 0.03, resistance: 0.09 }
          : canSpecial
            ? { power: 0, ability: 0.07, agility: 0.03, resistance: 0 }
            : { power: 0.07, ability: 0, agility: 0.03, resistance: 0 };
    }
    const result = { ...base };
    for (const stat of ['power', 'agility', 'resistance', 'ability'] as const) {
      result[stat] = clampNumber(
        base[stat] * (1 + modifiers[stat] * alignment + synergyModifier),
        0,
        120,
      );
    }
    return result;
  }

  hitChance(attacker: HeroStats, target: HeroStats): number {
    return clampNumber(
      this.config.balance.hitBase + (attacker.agility - target.agility) / 250,
      this.config.balance.hitMinimum,
      this.config.balance.hitMaximum,
    );
  }

  damage(
    attacker: HeroStats,
    target: HeroStats,
    kind: 'BASIC' | 'SPECIAL',
    multiplier: number,
    variation: number,
  ): number {
    const offense =
      kind === 'BASIC'
        ? 0.5 + attacker.power / 100
        : 0.4 + (0.8 * attacker.ability) / 100 + (0.2 * attacker.power) / 100;
    const mitigation =
      1 - (this.config.balance.resistanceMitigation * clampNumber(target.resistance, 0, 100)) / 100;
    return Math.max(
      1,
      Math.round(
        this.config.balance.baseAttackDamage *
          offense *
          mitigation *
          multiplier *
          (1 + (variation * 2 - 1) * this.config.balance.randomVariation),
      ),
    );
  }
}
