import { ConfigService } from '@nestjs/config';
import { FinalStageStatus } from '../../final-stage/model/final-stage-status.enum';
import { TurnResult } from '../../final-stage/model/turn-result.model';
import { AvengersActions, isTactical } from './avengers-actions.service';
import { AvengersCatalog } from './avengers-catalog.service';
import { AvengersCombat } from './avengers-combat.service';
import { AvengersConfig } from './avengers-config.service';
import { AvengersDoom } from './avengers-doom.service';
import { AvengersEvents } from './avengers-events.service';
import { AvengersGameEngine } from './avengers-game-engine';
import { AvengersOpponentAi } from './avengers-opponent-ai.service';
import { SeededAvengersRandom } from './seeded-avengers-random.provider';
import { AvengersRules } from './avengers-rules.service';
import { AvengersState } from './avengers-state.service';
import { sampleBattle, SAMPLE_INVENTORY } from './content/sample-battle';
import { AvengersAction } from './model/avengers-action.model';
import { AvengersStrategy as S } from './model/avengers-strategy.enum';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { BattleSetup } from './model/battle-setup.model';
import { AvengersMechanics } from './combat/avengers-mechanics.service';

type Policy = 'DOOM_FIRST' | 'OPPONENT_FIRST';
export interface BalanceMetrics {
  victories: number;
  defeats: number;
  finalAttacks: number;
  turns: number;
  actOneDefeats: number;
  revealReached: number;
  actTwoVictories: number;
  actTwoDefeats: number;
  actOneCycles: number;
  actTwoCycles: number;
  maximumObservedTurns: number;
  playerEnergy: number;
  opponentEnergy: number;
  doomEnergy: number;
  apSpent: number;
  apRecovered: number;
  playerActions: number;
  basicAttacks: number;
  specials: number;
  teamActions: number;
  leaderAbilities: number;
  powerUps: number;
  knockouts: number;
  revives: number;
  swaps: number;
  strategyChanges: number;
  doomInterventions: number;
  rivalryEffects: number;
}
export interface BalanceRow {
  archetype: string;
  policy: Policy;
  battles: number;
  metrics: BalanceMetrics;
}
export interface BalanceReport {
  seedStart: number;
  battlesPerCohort: number;
  configuration: AvengersConfig['balance'];
  rows: BalanceRow[];
}

/** Lightweight fixture runner. Decisions are inspectable heuristics, not optimal play. */
export class AvengersBalanceSimulation {
  private readonly catalog = new AvengersCatalog();

  private readonly random = new SeededAvengersRandom();

  private readonly config: AvengersConfig;

  private readonly rules: AvengersRules;

  private readonly actions: AvengersActions;

  private readonly combat: AvengersCombat;

  private readonly state: AvengersState;

  private readonly engine: AvengersGameEngine;

  constructor(overrides: Record<string, unknown> = {}) {
    this.config = new AvengersConfig(new ConfigService(overrides));
    const mechanics = new AvengersMechanics(this.config);
    this.rules = new AvengersRules(this.catalog, this.config, mechanics);
    this.actions = new AvengersActions(this.catalog, this.rules);
    const events = new AvengersEvents(this.catalog);
    this.combat = new AvengersCombat(
      this.catalog,
      this.config,
      this.rules,
      this.random,
      events,
      this.actions,
    );
    const doom = new AvengersDoom(this.config, events, this.combat, this.rules, this.random);
    const ai = new AvengersOpponentAi(this.actions, this.combat, this.rules, this.random);
    this.state = new AvengersState(this.catalog, this.config, this.rules);
    this.engine = new AvengersGameEngine(
      this.actions,
      this.combat,
      this.config,
      this.rules,
      events,
      ai,
      doom,
      this.random,
    );
  }

  async battle(setup: BattleSetup, policy: Policy): Promise<TurnResult<AvengersTurnData>> {
    let state = await this.engine.play({
      current: this.state.ready(setup),
      command: { type: 'START' },
    });
    this.assertActiveProgress(state);
    const initialStrategy = setup.player.strategy;
    // Runner safety budget only; this is not a FinalStage domain turn limit.
    for (let cycle = 0; cycle <= 500 && state.status === FinalStageStatus.ACTIVE; cycle++) {
      for (let step = 0; step < 3 && !this.rules.validFormation(state.data.player); step++) {
        const swap = this.bestSwap(state, true);
        if (!swap) {
          break;
        }
        state = await this.engine.play({
          current: state,
          command: { type: 'CHOOSE_ACTION', actionId: swap.id },
        });
        this.assertActiveProgress(state);
      }
      const team = state.data.player;
      const active = this.rules.active(team);
      const ratio =
        active.reduce((sum, hero) => sum + hero.currentEnergy, 0) /
        Math.max(
          1,
          active.reduce((sum, hero) => sum + hero.maxEnergy, 0),
        );
      const desired = ratio < 0.5 ? S.DEFENSIVE : initialStrategy;
      const change = state.data.availableActions.find(
        (action) => action.type === 'CHANGE_STRATEGY' && action.strategy === desired,
      );
      if (change) {
        state = await this.engine.play({
          current: state,
          command: { type: 'CHOOSE_ACTION', actionId: change.id },
        });
        this.assertActiveProgress(state);
      }
      const swap = this.bestSwap(state, false);
      if (swap) {
        state = await this.engine.play({
          current: state,
          command: { type: 'CHOOSE_ACTION', actionId: swap.id },
        });
        this.assertActiveProgress(state);
      }
      const options = state.data.availableActions.filter((action) => !isTactical(action));
      options.sort((a, b) => this.score(state, b, policy) - this.score(state, a, policy));
      if (!options.length) {
        throw new Error('Simulation found an ACTIVE state with no continuation.');
      }
      state = await this.engine.play({
        current: state,
        command: { type: 'CHOOSE_ACTION', actionId: options[0].id },
      });
      this.assertActiveProgress(state);
    }
    if (state.status !== FinalStageStatus.COMPLETED) {
      throw new Error('Simulation exceeded the FinalStage lifecycle.');
    }
    return state;
  }

  private assertActiveProgress(state: TurnResult<AvengersTurnData>): void {
    if (state.status === FinalStageStatus.ACTIVE && !state.data.availableActions.length) {
      const active = this.rules
        .active(state.data.player)
        .map((hero) => hero.heroId)
        .join(',');
      const living = this.rules
        .living(state.data.player)
        .map((hero) => hero.heroId)
        .join(',');
      throw new Error(
        `ACTIVE FinalStage has no legal continuation at turn ${state.turn} (${state.data.phase}); active=[${active}], living=[${living}].`,
      );
    }
  }

  private bestSwap(state: TurnResult<AvengersTurnData>, required: boolean): AvengersAction | null {
    const swaps = state.data.availableActions.filter(
      (action): action is Extract<AvengersAction, { type: 'SWAP' }> => action.type === 'SWAP',
    );
    const team = state.data.player;
    const score = (action: Extract<AvengersAction, { type: 'SWAP' }>): number => {
      const incoming = team.heroes.find((hero) => hero.heroId === action.incomingId)!;
      const outgoing = team.heroes.find((hero) => hero.heroId === action.outgoingId)!;
      return (
        incoming.currentEnergy / incoming.maxEnergy -
        outgoing.currentEnergy / outgoing.maxEnergy +
        (incoming.heroId === team.leaderId ? 2 : 0)
      );
    };
    swaps.sort((a, b) => score(b) - score(a));
    return swaps.length && (required || score(swaps[0]) > 0.55) ? swaps[0] : null;
  }

  private score(
    state: TurnResult<AvengersTurnData>,
    action: AvengersAction,
    policy: Policy,
  ): number {
    const data = state.data;
    const own = data.player;
    if (data.phase === 'FINAL_ATTACK') {
      return this.engine.finalResponseChance(data, action) * 1000;
    }
    if (action.type === 'POWER_UP') {
      const item = data.inventory.find((value) => value.id === action.itemId)!;
      const target = own.heroes.find((hero) => hero.heroId === action.targetId);
      switch (item.effect.type) {
        case 'REVIVE':
          return this.rules.validFormation(own) ? 1 : 300;
        case 'ENERGY':
          return target && target.currentEnergy / target.maxEnergy < 0.35 ? 120 : 0;
        case 'AP':
        case 'AP_PERCENT':
        case 'FULL_AP':
          return target && target.currentAbilityPoints < 20 ? 100 : 0;
        case 'BOOST':
          return state.turn === 0 ? 110 : 0;
        case 'EXTRA_TEAM_ACTION':
          return own.teamActionsRemaining === 0 && own.synergy.value >= 60 ? 105 : 0;
        case 'EXTRA_LEADER_ABILITY':
          return own.leaderAbilityUsesRemaining === 0 ? 85 : 0;
      }
    }
    if (action.type === 'SUPPORT_SPECIAL' || action.type === 'LEADER_ABILITY') {
      const actorId = action.actorId;
      const definition = this.catalog.hero(actorId);
      const support =
        action.type === 'SUPPORT_SPECIAL'
          ? definition.supportAbility
          : this.catalog.team(own.teamId).leaderAbility;
      if (support.effect === 'HEAL') {
        const actor = own.heroes.find((hero) => hero.heroId === actorId)!;
        const healing =
          this.config.balance.baseAttackDamage *
          (0.5 + this.rules.effectiveStats(own, actor).ability / 100) *
          support.potency;
        return (
          this.rules
            .living(own)
            .reduce(
              (sum, hero) => sum + Math.min(hero.maxEnergy - hero.currentEnergy, healing),
              0,
            ) * 0.8
        );
      }
      if (action.type === 'SUPPORT_SPECIAL') {
        return 5;
      }
      if (support.effect === 'PROTECT') {
        return own.effects.some((effect) => effect.source === 'LEADER') ? 1 : 15;
      }
      if (support.effect === 'DISRUPT' && action.targetId !== 'DOOM') {
        return data.opponent.effects.some((effect) => effect.source === 'LEADER') ? 1 : 15;
      }
    }
    if (!('targetId' in action)) {
      return 0;
    }
    const targetId = action.targetId;
    const enemyAlive = this.rules.living(data.opponent).length > 0;
    const preferredDoom = policy === 'DOOM_FIRST' || !enemyAlive;
    const preference = (targetId === 'DOOM') === preferredDoom ? 1 : 0.03;
    const actor =
      'actorId' in action ? own.heroes.find((hero) => hero.heroId === action.actorId)! : null;
    const stats = actor
      ? this.rules.effectiveStats(own, actor)
      : this.combat.averageStats(data, own);
    const targets =
      targetId === 'DOOM'
        ? [this.rules.doomStats()]
        : targetId === 'OPPONENT_TEAM'
          ? this.rules
              .living(data.opponent)
              .map((hero) => this.rules.effectiveStats(data.opponent, hero))
          : [
              this.rules.effectiveStats(
                data.opponent,
                data.opponent.heroes.find((hero) => hero.heroId === targetId)!,
              ),
            ];
    const multiplier =
      action.type === 'TEAM_ACTION'
        ? this.config.balance.teamActionMultiplier * (1 + own.synergy.teamActionBonus)
        : action.type === 'LEADER_ABILITY'
          ? this.catalog.team(own.teamId).leaderAbility.potency
          : action.type === 'OFFENSIVE_SPECIAL'
            ? this.config.balance.specialMultiplier *
              this.catalog.hero(action.actorId).offensiveAbility.multiplier *
              (targetId === 'DOOM' ? 1 : this.config.balance.specialTeamMultiplier)
            : 1;
    const expected = targets.reduce(
      (sum, target) =>
        sum +
        this.rules.damage(
          stats,
          target,
          action.type === 'BASIC_ATTACK' ? 'BASIC' : 'SPECIAL',
          multiplier,
          0.5,
        ) *
          this.rules.hitChance(stats, target),
      0,
    );
    return (
      expected * preference +
      (action.type === 'BASIC_ATTACK' &&
      actor &&
      actor.currentAbilityPoints < actor.maxAbilityPoints - 10
        ? 6
        : 0)
    );
  }

  async run(battlesPerCohort = 100, seedStart = 1000): Promise<BalanceReport> {
    if (!Number.isInteger(battlesPerCohort) || battlesPerCohort < 1 || battlesPerCohort > 10000) {
      throw new Error('Battles per cohort must be 1..10000.');
    }
    const rows: BalanceRow[] = [];
    for (const name of [
      'HIGH_POWER',
      'HIGH_ABILITY',
      'HIGH_SYNERGY',
      'LOW_SYNERGY',
      'AGGRESSIVE_ALIGNED',
      'AGGRESSIVE_MISMATCHED',
      'BALANCED',
      'PRAGMATIC',
      'WITH_POWER_UPS',
    ]) {
      for (const policy of ['DOOM_FIRST', 'OPPONENT_FIRST'] as const) {
        const metrics: BalanceMetrics = {
          victories: 0,
          defeats: 0,
          finalAttacks: 0,
          turns: 0,
          playerEnergy: 0,
          opponentEnergy: 0,
          doomEnergy: 0,
          actOneDefeats: 0,
          revealReached: 0,
          actTwoVictories: 0,
          actTwoDefeats: 0,
          actOneCycles: 0,
          actTwoCycles: 0,
          maximumObservedTurns: 0,
          apSpent: 0,
          apRecovered: 0,
          playerActions: 0,
          basicAttacks: 0,
          specials: 0,
          teamActions: 0,
          leaderAbilities: 0,
          powerUps: 0,
          knockouts: 0,
          revives: 0,
          swaps: 0,
          strategyChanges: 0,
          doomInterventions: 0,
          rivalryEffects: 0,
        };
        for (let index = 0; index < battlesPerCohort; index++) {
          const setup = this.archetype(name, seedStart + index);
          const result = await this.battle(setup, policy);
          const data = result.data;
          metrics[data.outcome === 'VICTORY' ? 'victories' : 'defeats']++;
          metrics.turns += result.turn;
          metrics.maximumObservedTurns = Math.max(metrics.maximumObservedTurns, result.turn);
          metrics.actOneCycles += data.cycleFacts.filter(
            (value) => value.phase === 'TOURNAMENT_FINAL',
          ).length;
          metrics.actTwoCycles += data.cycleFacts.filter(
            (value) => value.phase === 'DOOMSDAY',
          ).length;
          if (!data.revealOccurred) {
            metrics.actOneDefeats++;
          } else {
            metrics.revealReached++;
            if (data.outcome === 'VICTORY') {
              metrics.actTwoVictories++;
            } else {
              metrics.actTwoDefeats++;
            }
          }
          metrics.playerEnergy += data.player.heroes.reduce(
            (sum, hero) => sum + hero.currentEnergy,
            0,
          );
          metrics.opponentEnergy += data.opponent.heroes.reduce(
            (sum, hero) => sum + hero.currentEnergy,
            0,
          );
          metrics.doomEnergy += data.doom?.currentEnergy ?? 0;
          for (const event of data.timeline) {
            if (event.type === 'FINAL_ATTACK') {
              metrics.finalAttacks++;
            }
            if (event.type === 'KO') {
              metrics.knockouts++;
            }
            if (event.type === 'REVIVE') {
              metrics.revives++;
            }
            if (event.type === 'SWAP' || event.type === 'FORMATION_RESTORED') {
              metrics.swaps++;
            }
            if (event.type === 'STRATEGY_CHANGE') {
              metrics.strategyChanges++;
            }
            if (event.type === 'DOOM_INTERVENTION') {
              metrics.doomInterventions++;
            }
            if (event.type === 'RIVALRY') {
              metrics.rivalryEffects++;
            }
            if (event.source !== 'PLAYER') {
              continue;
            }
            if (event.type === 'AP_CHANGE') {
              metrics.apSpent += Math.max(0, -event.values.apChange);
              metrics.apRecovered += Math.max(0, event.values.apChange);
            }
            if (event.type === 'ACTION') {
              metrics.playerActions++;
              const kind = event.parameters.actionType;
              if (kind === 'BASIC_ATTACK') {
                metrics.basicAttacks++;
              }
              if (kind === 'OFFENSIVE_SPECIAL' || kind === 'SUPPORT_SPECIAL') {
                metrics.specials++;
              }
              if (kind === 'TEAM_ACTION') {
                metrics.teamActions++;
              }
              if (kind === 'LEADER_ABILITY') {
                metrics.leaderAbilities++;
              }
              if (kind === 'POWER_UP') {
                metrics.powerUps++;
              }
            }
          }
        }
        rows.push({ archetype: name, policy, battles: battlesPerCohort, metrics });
      }
    }
    return {
      seedStart,
      battlesPerCohort,
      configuration: structuredClone(this.config.balance),
      rows,
    };
  }

  private archetype(name: string, seed: number): BattleSetup {
    const setup = sampleBattle(seed);
    switch (name) {
      case 'HIGH_POWER':
      case 'AGGRESSIVE_ALIGNED':
      case 'AGGRESSIVE_MISMATCHED':
        setup.player = {
          teamId: 'hulk-team',
          activeHeroIds: ['wolverine', 'captain-america'],
          benchHeroIds: ['spider-man', 'sue-storm', 'doctor-strange'],
          strategy: name === 'AGGRESSIVE_MISMATCHED' ? S.DEFENSIVE : S.AGGRESSIVE,
        };
        break;
      case 'HIGH_ABILITY':
        setup.player = {
          teamId: 'strange-team',
          activeHeroIds: ['scarlet-witch', 'sue-storm'],
          benchHeroIds: ['hulk', 'iron-man', 'spider-man'],
          strategy: S.DEFENSIVE,
        };
        break;
      case 'HIGH_SYNERGY':
        setup.player = {
          teamId: 'spider-man-team',
          activeHeroIds: ['captain-america', 'sue-storm'],
          benchHeroIds: ['hulk', 'doctor-strange', 'iron-man'],
          strategy: S.PRAGMATIC,
        };
        break;
      case 'LOW_SYNERGY':
        setup.player.activeHeroIds = ['hulk', 'wolverine'];
        setup.player.benchHeroIds = ['doctor-strange', 'sue-storm', 'iron-man'];
        break;
      case 'BALANCED':
        setup.player = {
          teamId: 'captain-america-team',
          activeHeroIds: ['hulk', 'sue-storm'],
          benchHeroIds: ['spider-man', 'doctor-strange', 'wolverine'],
          strategy: S.BALANCED,
        };
        break;
      case 'WITH_POWER_UPS':
        setup.inventory = structuredClone(SAMPLE_INVENTORY);
        break;
      case 'PRAGMATIC':
        break;
    }
    return setup;
  }
}
