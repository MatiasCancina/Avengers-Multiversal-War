import { Injectable } from '@nestjs/common';
import { FinalStageStatus } from '../../final-stage/model/final-stage-status.enum';
import { TurnResult } from '../../final-stage/model/turn-result.model';
import { TeamMemberStatus } from '../../teams/model/team-member-status.enum';
import { AvengersCatalog } from './avengers-catalog.service';
import { AvengersConfig } from './avengers-config.service';
import { AvengersRuleError } from './error/avengers-rule.error';
import { AvengersRules } from './avengers-rules.service';
import { AvengersTeamState } from './model/avengers-team-state.model';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { BattleSetup, TeamSetup } from './model/battle-setup.model';
import { HeroRelationship } from './model/hero-relationship.enum';
import { AvengersFinalStagePhase } from './model/avengers-final-stage-phase.enum';
import { LEGACY_FINAL_BATTLE_DIFFICULTY } from './model/final-battle-difficulty-profile.model';

@Injectable()
export class AvengersState {
  constructor(
    private readonly catalog: AvengersCatalog,
    private readonly config: AvengersConfig,
    private readonly rules: AvengersRules,
  ) {}

  ready(setup: BattleSetup): TurnResult<AvengersTurnData> {
    if (!Number.isInteger(setup.seed) || setup.seed < 0 || setup.seed > 0xffffffff) {
      throw new AvengersRuleError('INVALID_SEED', 'Seed must be a uint32.');
    }
    const player = this.team(setup.player);
    const opponent = this.team(setup.opponent);
    const inventory = structuredClone(setup.inventory);
    if (new Set(inventory.map((item) => item.id)).size !== inventory.length) {
      throw new AvengersRuleError('INVALID_INVENTORY', 'Inventory IDs must be unique.');
    }
    for (const item of inventory) {
      if (!item.id || !Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new AvengersRuleError('INVALID_INVENTORY', 'Invalid inventory quantity.');
      }
      if (item.target !== 'HERO' && item.target !== 'TEAM') {
        throw new AvengersRuleError('INVALID_INVENTORY', 'Power-Up target must be HERO or TEAM.');
      }
      const effect = item.effect;
      if (
        ![
          'ENERGY',
          'AP',
          'AP_PERCENT',
          'FULL_AP',
          'BOOST',
          'REVIVE',
          'EXTRA_TEAM_ACTION',
          'EXTRA_LEADER_ABILITY',
        ].includes(effect.type)
      ) {
        throw new AvengersRuleError('INVALID_INVENTORY', 'Unknown Power-Up effect.');
      }
      if (
        (effect.type === 'ENERGY' || effect.type === 'AP_PERCENT' || effect.type === 'BOOST') &&
        (!Number.isFinite(effect.percent) || effect.percent < 1 || effect.percent > 100)
      ) {
        throw new AvengersRuleError('INVALID_INVENTORY', 'Power-Up percentage must be 1..100.');
      }
      if (
        effect.type === 'AP' &&
        (!Number.isInteger(effect.amount) || effect.amount < 1 || effect.amount > 500)
      ) {
        throw new AvengersRuleError('INVALID_INVENTORY', 'Invalid AP amount.');
      }
      if (
        effect.type === 'BOOST' &&
        (!['power', 'agility', 'resistance', 'ability'].includes(effect.stat) ||
          !Number.isInteger(effect.duration) ||
          effect.duration < 1 ||
          effect.duration > 10)
      ) {
        throw new AvengersRuleError('INVALID_INVENTORY', 'Invalid temporary boost.');
      }
    }
    return {
      status: FinalStageStatus.READY,
      turn: 0,
      data: {
        themeId: 'avengers-doomsday',
        player,
        opponent,
        doom: null,
        rivalry:
          this.rules.relationship(player.leaderId, opponent.leaderId) === HeroRelationship.RIVAL,
        inventory,
        phase: AvengersFinalStagePhase.TOURNAMENT_FINAL,
        revealOccurred: false,
        opponentHadLivingAtActIIStart: false,
        doomAloneNarrativeEmitted: false,
        sueStormAppealStatus: 'LOCKED',
        endingCode: null,
        terminalReasonCode: null,
        difficultyProfile: this.config.finalBattleDifficulty ?? LEGACY_FINAL_BATTLE_DIFFICULTY,
        finalAttackInitiator: null,
        outcome: null,
        randomState: setup.seed || 0x9e3779b9,
        availableActions: [],
        events: [],
        timeline: [],
        cycleFacts: [],
      },
    };
  }

  private team(setup: TeamSetup): AvengersTeamState {
    const definition = this.catalog.team(setup.teamId);
    const ids = [definition.leaderId, ...setup.activeHeroIds, ...setup.benchHeroIds];
    if (
      setup.activeHeroIds.length !== 2 ||
      setup.benchHeroIds.length !== 3 ||
      new Set(ids).size !== 6
    ) {
      throw new AvengersRuleError(
        'INVALID_FORMATION',
        'Select a fixed Leader, two additional active heroes and three distinct bench heroes.',
      );
    }
    if (!['AGGRESSIVE', 'DEFENSIVE', 'BALANCED', 'PRAGMATIC'].includes(setup.strategy)) {
      throw new AvengersRuleError('INVALID_STRATEGY', 'Unknown Avengers Strategy.');
    }
    if (setup.resources && Object.keys(setup.resources).some((id) => !ids.includes(id))) {
      throw new AvengersRuleError('INVALID_RESOURCES', 'Resources must belong to selected heroes.');
    }
    const balance = this.config.balance;
    const state: AvengersTeamState = {
      teamId: definition.id,
      leaderId: definition.leaderId,
      leaderProfile: definition.leaderProfile,
      strategy: setup.strategy,
      heroes: ids.map((id, index) => {
        const hero = this.catalog.hero(id);
        const resources = setup.resources?.[id];
        const energy = resources?.energy ?? hero.maxEnergy;
        const ap = resources?.abilityPoints ?? hero.maxAbilityPoints;
        if (
          !Number.isFinite(energy) ||
          energy < 0 ||
          energy > hero.maxEnergy ||
          !Number.isFinite(ap) ||
          ap < 0 ||
          ap > hero.maxAbilityPoints
        ) {
          throw new AvengersRuleError(
            'INVALID_RESOURCES',
            'Individual resources must be finite and within their maxima.',
          );
        }
        return {
          heroId: id,
          status: index < 3 ? TeamMemberStatus.ACTIVE : TeamMemberStatus.INACTIVE,
          condition: energy > 0 ? 'AVAILABLE' : 'KNOCKED_OUT',
          maxEnergy: hero.maxEnergy,
          currentEnergy: energy,
          maxAbilityPoints: hero.maxAbilityPoints,
          currentAbilityPoints: ap,
          returnAtTurn: 0,
        };
      }),
      vacantActiveHeroIds: ids.slice(0, 3).filter((id) => setup.resources?.[id]?.energy === 0),
      synergy: {
        value: 0,
        level: 'LOW' as AvengersTeamState['synergy']['level'],
        statModifier: 0,
        teamActionBonus: 0,
      },
      effects: [],
      strategyChangesRemaining: balance.maxStrategyChanges,
      strategyChangeAtTurn: 0,
      teamActionsRemaining: balance.maxTeamActions,
      leaderAbilityUsesRemaining: balance.maxLeaderUses,
    };
    for (const hero of state.heroes) {
      if (hero.currentEnergy <= 0) {
        hero.status = TeamMemberStatus.INACTIVE;
      }
    }
    state.synergy = this.rules.synergy(state);
    return state;
  }
}
