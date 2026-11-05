import { Injectable } from '@nestjs/common';
import { TeamMemberStatus } from '../../teams/model/team-member-status.enum';
import { AvengersCatalog } from './avengers-catalog.service';
import { AvengersRules } from './avengers-rules.service';
import { AvengersAction } from './model/avengers-action.model';
import { AvengersStrategy } from './model/avengers-strategy.enum';
import { AvengersTeamState } from './model/avengers-team-state.model';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { HeroRole } from './model/hero-role.enum';
import { SynergyLevel } from './model/synergy-level.enum';

export const isTactical = (action: AvengersAction): boolean =>
  action.type === 'SWAP' || action.type === 'CHANGE_STRATEGY';

@Injectable()
export class AvengersActions {
  constructor(
    private readonly catalog: AvengersCatalog,
    private readonly rules: AvengersRules,
  ) {}

  list(data: AvengersTurnData, turn: number, side: 'PLAYER' | 'OPPONENT'): AvengersAction[] {
    const own = side === 'PLAYER' ? data.player : data.opponent;
    const enemy = side === 'PLAYER' ? data.opponent : data.player;
    const active = this.rules.active(own);
    const result: AvengersAction[] = [];
    const prefix = `${side}-${turn}-${data.timeline.length}`;
    const add = (action: AvengersAction): void => {
      result.push(action);
    };
    const targets = this.rules.active(enemy).map((hero) => hero.heroId);
    if (
      side === 'PLAYER' &&
      data.phase === 'DOOMSDAY' &&
      data.sueStormAppealStatus === 'AVAILABLE' &&
      active.some((hero) => hero.heroId === 'invisible-woman') &&
      data.doom &&
      data.doom.currentEnergy > 0
    ) {
      add({
        id: `${prefix}-sue-storm-appeal`,
        type: 'SUE_STORM_APPEAL',
        actorId: 'invisible-woman',
        targetId: 'DOOM',
        apCost: 0,
      });
    }
    if (side === 'PLAYER' && data.doom && data.doom.currentEnergy > 0) {
      targets.push('DOOM');
    }
    if (this.rules.validFormation(own)) {
      for (const hero of active) {
        const definition = this.catalog.hero(hero.heroId, data.content);
        for (const target of targets) {
          add({
            id: `${prefix}-basic-${hero.heroId}-${target}`,
            type: 'BASIC_ATTACK',
            actorId: hero.heroId,
            targetId: target,
            apCost: 0,
          });
        }
        const areaTargets: Array<'OPPONENT_TEAM' | 'DOOM'> = [];
        if (this.rules.active(enemy).length) {
          areaTargets.push('OPPONENT_TEAM');
        }
        if (side === 'PLAYER' && data.doom && data.doom.currentEnergy > 0) {
          areaTargets.push('DOOM');
        }
        if (hero.currentAbilityPoints >= definition.offensiveAbility.apCost) {
          for (const target of areaTargets) {
            add({
              id: `${prefix}-offensive-${hero.heroId}-${target}`,
              type: 'OFFENSIVE_SPECIAL',
              actorId: hero.heroId,
              targetId: target,
              apCost: definition.offensiveAbility.apCost,
            });
          }
        }
        const support = definition.supportAbility;
        const useful =
          support.effect === 'HEAL'
            ? this.rules.living(own).some((member) => member.currentEnergy < member.maxEnergy)
            : support.effect === 'CLEANSE'
              ? own.effects.some((effect) => effect.modifier < 0)
              : true;
        if (useful && hero.currentAbilityPoints >= support.apCost) {
          add({
            id: `${prefix}-support-${hero.heroId}`,
            type: 'SUPPORT_SPECIAL',
            actorId: hero.heroId,
            targetId: 'OWN_TEAM',
            apCost: support.apCost,
          });
        }
      }
    }
    const leader = active.find((hero) => hero.heroId === own.leaderId);
    if (this.rules.validFormation(own) && leader && own.leaderAbilityUsesRemaining > 0) {
      const ability = this.catalog.team(own.teamId, data.content).leaderAbility;
      const abilityTargets =
        ability.effect === 'STRIKE'
          ? targets
          : ability.effect === 'DISRUPT'
            ? this.rules.active(enemy).length
              ? ['ENEMY_TEAM']
              : targets
            : ['OWN_TEAM'];
      for (const target of abilityTargets) {
        add({
          id: `${prefix}-leader-${target}`,
          type: 'LEADER_ABILITY',
          actorId: leader.heroId,
          targetId: target,
          apCost: 0,
        });
      }
    }
    if (
      this.rules.validFormation(own) &&
      active.length === 3 &&
      own.teamActionsRemaining > 0 &&
      [SynergyLevel.HIGH, SynergyLevel.EXCELLENT].includes(own.synergy.level)
    ) {
      const roles = [
        ...new Set(active.map((hero) => this.catalog.hero(hero.heroId, data.content).primaryRole)),
      ]
        .sort()
        .join('+');
      for (const target of targets) {
        add({
          id: `${prefix}-team-${target}`,
          type: 'TEAM_ACTION',
          targetId: target,
          roleCombination: roles,
          apCost: 0,
        });
      }
    }
    if (own.strategyChangesRemaining > 0 && turn >= own.strategyChangeAtTurn) {
      for (const strategy of Object.values(AvengersStrategy)) {
        if (strategy !== own.strategy) {
          add({
            id: `${prefix}-strategy-${strategy}`,
            type: 'CHANGE_STRATEGY',
            strategy,
            apCost: 0,
          });
        }
      }
    }
    const incoming = own.heroes.filter(
      (hero) =>
        hero.status === TeamMemberStatus.INACTIVE &&
        hero.currentEnergy > 0 &&
        turn >= hero.returnAtTurn,
    );
    const deficit = active.length < Math.min(3, this.rules.living(own).length);
    const outgoing = deficit
      ? own.heroes.filter((hero) => own.vacantActiveHeroIds.includes(hero.heroId))
      : active;
    for (const next of incoming) {
      for (const previous of outgoing) {
        add({
          id: `${prefix}-swap-${previous.heroId}-${next.heroId}`,
          type: 'SWAP',
          outgoingId: previous.heroId,
          incomingId: next.heroId,
          apCost: 0,
        });
      }
    }
    if (side === 'PLAYER') {
      for (const item of data.inventory.filter((value) => value.quantity > 0)) {
        const powerTargets = this.powerUpTargets(item, own, active);
        for (const target of powerTargets) {
          add({
            id: `${prefix}-item-${item.id}-${target}`,
            type: 'POWER_UP',
            itemId: item.id,
            targetId: target,
            apCost: 0,
          });
        }
      }
    }
    return result;
  }

  private powerUpTargets(
    item: AvengersTurnData['inventory'][number],
    own: AvengersTeamState,
    active: AvengersTeamState['heroes'],
  ): string[] {
    if (item.target === 'HERO') {
      switch (item.effect.type) {
        case 'REVIVE':
          return own.heroes.filter((hero) => hero.currentEnergy <= 0).map((hero) => hero.heroId);
        case 'ENERGY':
          return own.heroes
            .filter((hero) => hero.currentEnergy > 0 && hero.currentEnergy < hero.maxEnergy)
            .map((hero) => hero.heroId);
        case 'AP':
        case 'AP_PERCENT':
        case 'FULL_AP':
          return own.heroes
            .filter(
              (hero) => hero.currentEnergy > 0 && hero.currentAbilityPoints < hero.maxAbilityPoints,
            )
            .map((hero) => hero.heroId);
        default:
          return [];
      }
    }

    if (!active.length) {
      return [];
    }
    switch (item.effect.type) {
      case 'AP':
      case 'AP_PERCENT':
      case 'FULL_AP':
        return active.some((hero) => hero.currentAbilityPoints < hero.maxAbilityPoints)
          ? ['OWN_TEAM']
          : [];
      case 'ENERGY':
        return active.some((hero) => hero.currentEnergy < hero.maxEnergy) ? ['OWN_TEAM'] : [];
      case 'BOOST':
      case 'EXTRA_TEAM_ACTION':
      case 'EXTRA_LEADER_ABILITY':
        return ['OWN_TEAM'];
      case 'REVIVE':
        return [];
    }
  }

  refresh(data: AvengersTurnData, turn: number): void {
    data.player.synergy = this.rules.synergy(data.player, data.content);
    data.opponent.synergy = this.rules.synergy(data.opponent, data.content);
    data.availableActions = data.outcome ? [] : this.list(data, turn, 'PLAYER');
  }

  teamActionName(team: AvengersTeamState, data?: AvengersTurnData): string {
    const roles = new Set(
      this.rules
        .active(team)
        .map((hero) => this.catalog.hero(hero.heroId, data?.content).primaryRole),
    );
    if (roles.has(HeroRole.TECH) && roles.has(HeroRole.MYSTIC)) {
      return 'Energy Nexus';
    }
    if (roles.has(HeroRole.WARRIOR) && roles.has(HeroRole.AGILE)) {
      return 'Coordinated Assault';
    }
    return 'United Strike';
  }
}
