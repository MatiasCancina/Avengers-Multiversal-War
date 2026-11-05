import { Injectable } from '@nestjs/common';
import { TeamMemberStatus } from '../../teams/model/team-member-status.enum';
import { AvengersCatalog } from './avengers-catalog.service';
import { AvengersConfig } from './avengers-config.service';
import { AvengersStrategy as S } from './model/avengers-strategy.enum';
import { AvengersTeamState } from './model/avengers-team-state.model';
import { BossThreatLevel } from './model/boss-threat-level.enum';
import { HeroCombatState } from './model/hero-combat-state.model';
import { HeroRelationship } from './model/hero-relationship.enum';
import { HeroStats } from './model/hero-stats.model';
import { Synergy } from './model/synergy.model';
import { SynergyLevel } from './model/synergy-level.enum';
import { AvengersMechanics } from './combat/avengers-mechanics.service';
import { AvengersBattleContent } from './model/avengers-turn-data.model';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

@Injectable()
export class AvengersRules {
  private readonly mechanics: AvengersMechanics;

  constructor(
    private readonly catalog: AvengersCatalog,
    private readonly config: AvengersConfig,
    mechanics?: AvengersMechanics,
  ) {
    this.mechanics = mechanics ?? new AvengersMechanics(config);
  }

  relationship(a: string, b: string, content?: AvengersBattleContent): HeroRelationship {
    const first = this.catalog.hero(a, content);
    const second = this.catalog.hero(b, content);
    if (first.rivals.includes(b) || second.rivals.includes(a)) {
      return HeroRelationship.RIVAL;
    }
    if (first.allies.includes(b) || second.allies.includes(a)) {
      return HeroRelationship.ALLY;
    }
    return HeroRelationship.NORMAL;
  }

  active(team: AvengersTeamState): HeroCombatState[] {
    return team.heroes.filter(
      (hero) => hero.status === TeamMemberStatus.ACTIVE && hero.currentEnergy > 0,
    );
  }

  living(team: AvengersTeamState): HeroCombatState[] {
    return team.heroes.filter((hero) => hero.currentEnergy > 0);
  }

  energy(team: AvengersTeamState): number {
    return this.active(team).reduce((sum, hero) => sum + hero.currentEnergy, 0);
  }

  abilityPoints(team: AvengersTeamState): number {
    return this.active(team).reduce((sum, hero) => sum + hero.currentAbilityPoints, 0);
  }

  synergy(team: AvengersTeamState, content?: AvengersBattleContent): Synergy {
    const active = this.active(team);
    const values = { ALLY: 100, NORMAL: 50, RIVAL: 0 };
    const pairs: number[] = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        pairs.push(values[this.relationship(active[i].heroId, active[j].heroId, content)]);
      }
    }
    const roles = new Set(
      active.flatMap((hero) => {
        const definition = this.catalog.hero(hero.heroId, content);
        return [definition.primaryRole, definition.secondaryRole];
      }),
    );
    const base = pairs.length ? pairs.reduce((a, b) => a + b, 0) / pairs.length : 0;
    const value = clamp(
      base + Math.max(0, roles.size - 2) * this.config.balance.roleCoverageBonus,
      0,
      100,
    );
    const level =
      value < 40
        ? SynergyLevel.LOW
        : value < 60
          ? SynergyLevel.MEDIUM
          : value < 80
            ? SynergyLevel.HIGH
            : SynergyLevel.EXCELLENT;
    return {
      value,
      level,
      statModifier: this.config.balance.synergyModifiers[level],
      teamActionBonus:
        level === SynergyLevel.EXCELLENT ? this.config.balance.excellentTeamActionBonus : 0,
    };
  }

  compatibility(profile: S, strategy: S): 'HIGH' | 'MEDIUM' | 'LOW' {
    return this.mechanics.compatibility(profile, strategy);
  }

  effectiveStats(
    team: AvengersTeamState,
    hero: HeroCombatState,
    content?: AvengersBattleContent,
  ): HeroStats {
    const stats = hero.baseStats ?? this.catalog.hero(hero.heroId, content).stats;
    const alignment =
      this.config.balance.leaderCompatibility[
        this.compatibility(team.leaderProfile, team.strategy)
      ];
    let modifiers = { ...this.config.balance.strategyModifiers[team.strategy] };
    if (team.strategy === S.PRAGMATIC) {
      const energyRatio = hero.currentEnergy / hero.maxEnergy;
      modifiers =
        energyRatio < 0.4
          ? { power: 0, ability: 0.04, agility: 0.03, resistance: 0.09 }
          : hero.currentAbilityPoints >=
              this.catalog.hero(hero.heroId, content).offensiveAbility.apCost
            ? { power: 0, ability: 0.07, agility: 0.03, resistance: 0 }
            : { power: 0.07, ability: 0, agility: 0.03, resistance: 0 };
    }
    const output = { ...stats };
    for (const stat of ['power', 'agility', 'resistance', 'ability'] as const) {
      const effects = team.effects
        .filter(
          (effect) =>
            effect.stat === stat && (!effect.heroIds || effect.heroIds.includes(hero.heroId)),
        )
        .reduce((sum, effect) => sum + effect.modifier, 0);
      output[stat] = clamp(
        stats[stat] *
          (1 + modifiers[stat] * alignment + team.synergy.statModifier + clamp(effects, -0.3, 0.3)),
        0,
        120,
      );
    }
    return output;
  }

  hitChance(attacker: HeroStats, target: HeroStats): number {
    return this.mechanics.hitChance(attacker, target);
  }

  damage(
    attacker: HeroStats,
    target: HeroStats,
    kind: 'BASIC' | 'SPECIAL',
    multiplier: number,
    variation: number,
  ): number {
    return this.mechanics.damage(attacker, target, kind, multiplier, variation);
  }

  doomStats(): HeroStats {
    return { power: 85, agility: 55, resistance: 60, ability: 95 };
  }

  threat(energy: number, max: number): BossThreatLevel {
    if (energy <= 0) {
      return BossThreatLevel.DEFEATED;
    }
    const percent = (100 * energy) / max;
    const [medium, high, critical] = this.config.balance.doomThresholds;
    return percent > medium
      ? BossThreatLevel.LOW
      : percent > high
        ? BossThreatLevel.MEDIUM
        : percent > critical
          ? BossThreatLevel.HIGH
          : BossThreatLevel.CRITICAL;
  }

  validFormation(team: AvengersTeamState): boolean {
    const living = this.living(team);
    const active = this.active(team);
    return active.length === Math.min(3, living.length);
  }

  validStartingFormation(team: AvengersTeamState): boolean {
    const living = this.living(team);
    const leader = living.find((hero) => hero.heroId === team.leaderId);
    return this.validFormation(team) && (!leader || leader.status === TeamMemberStatus.ACTIVE);
  }
}
