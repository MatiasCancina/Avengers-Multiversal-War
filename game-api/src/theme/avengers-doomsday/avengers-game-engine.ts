import { Injectable } from '@nestjs/common';
import { GameEngine } from '../../final-stage/game-engine';
import { EnginePlayInput } from '../../final-stage/model/engine-play-input.model';
import { EngineTurnInput } from '../../final-stage/model/engine-turn-input.model';
import { FinalStageStatus } from '../../final-stage/model/final-stage-status.enum';
import { TurnResult } from '../../final-stage/model/turn-result.model';
import { AvengersActions, isTactical } from './avengers-actions.service';
import { AvengersCombat } from './avengers-combat.service';
import { AvengersConfig } from './avengers-config.service';
import { AvengersDoom } from './avengers-doom.service';
import { AvengersRuleError } from './error/avengers-rule.error';
import { AvengersEvents } from './avengers-events.service';
import { AvengersOpponentAi } from './avengers-opponent-ai.service';
import { AvengersRandom } from './abstract-avengers-random.provider';
import { AvengersRules, clamp } from './avengers-rules.service';
import { AvengersAction } from './model/avengers-action.model';
import { AvengersOutcome } from './model/avengers-outcome.enum';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { BossThreatLevel } from './model/boss-threat-level.enum';
import { AvengersFinalStagePhase } from './model/avengers-final-stage-phase.enum';
import { AvengersEndingCode } from './model/avengers-ending-code.enum';
import { AvengersTerminalReason } from './model/avengers-terminal-reason.enum';

@Injectable()
export class AvengersGameEngine extends GameEngine<AvengersTurnData> {
  constructor(
    private readonly actions: AvengersActions,
    private readonly combat: AvengersCombat,
    private readonly config: AvengersConfig,
    private readonly rules: AvengersRules,
    private readonly events: AvengersEvents,
    private readonly ai: AvengersOpponentAi,
    private readonly doom: AvengersDoom,
    private readonly random: AvengersRandom,
  ) {
    super();
  }

  override async resolveTurn(
    input: EngineTurnInput<AvengersTurnData>,
  ): Promise<TurnResult<AvengersTurnData>> {
    return this.play({
      current: input.current,
      command: { type: 'CHOOSE_ACTION', actionId: input.actionId },
    });
  }

  override async play(
    input: EnginePlayInput<AvengersTurnData>,
  ): Promise<TurnResult<AvengersTurnData>> {
    const state = structuredClone(input.current);
    const { data } = state;
    if (data.themeId !== 'avengers-doomsday' || !Number.isInteger(state.turn) || state.turn < 0) {
      throw new AvengersRuleError(
        'INVALID_STATE',
        'Expected an Avengers state with a non-negative turn counter.',
      );
    }
    data.events = [];
    data.cycleFacts ??= [];
    if (input.command.type === 'START') {
      if (state.status !== FinalStageStatus.READY || state.turn !== 0) {
        throw new AvengersRuleError('INVALID_LIFECYCLE', 'Only a READY FinalStage can start.');
      }
      if (
        !this.rules.validStartingFormation(data.player) ||
        !this.rules.validStartingFormation(data.opponent)
      ) {
        throw new AvengersRuleError(
          'INVALID_FORMATION',
          'FinalStage must start with a valid three-Hero Active formation and the living Leader Active.',
        );
      }
      state.status = FinalStageStatus.ACTIVE;
      data.phase = AvengersFinalStagePhase.TOURNAMENT_FINAL;
      data.revealOccurred = false;
      data.opponentHadLivingAtActIIStart = false;
      data.doomAloneNarrativeEmitted = false;
      data.sueStormAppealStatus = 'LOCKED';
      data.endingCode = null;
      data.doom = null;
      this.events.emit(data, 0, {
        type: 'TOURNAMENT_FINAL_STARTED',
        source: 'SILVER_SURFER',
        actorId: 'SILVER_SURFER',
      });
      this.checkOutcome(state);
      this.actions.refresh(data, state.turn);
      return state;
    }
    if (state.status !== FinalStageStatus.ACTIVE) {
      throw new AvengersRuleError('INVALID_LIFECYCLE', 'The FinalStage must be ACTIVE.');
    }
    if (input.command.type === 'ABANDON') {
      const eventTurn = Math.max(state.turn, data.timeline.at(-1)?.turn ?? 0);
      data.events = data.timeline.filter((event) => event.turn === eventTurn);
      this.events.emit(data, eventTurn, {
        type: data.revealOccurred ? 'POST_REVEAL_ABANDON' : 'PRE_REVEAL_ABANDON',
        source: 'PLAYER',
        actorId: data.player.leaderId,
        parameters: { playerLeader: data.player.leaderId, opponentLeader: data.opponent.leaderId },
      });
      this.complete(
        state,
        AvengersOutcome.ABANDON,
        eventTurn,
        data.revealOccurred
          ? AvengersEndingCode.POST_REVEAL_ABANDON
          : AvengersEndingCode.PRE_REVEAL_ABANDON,
        AvengersTerminalReason.PLAYER_ABANDONED,
      );
      return state;
    }
    const actionId = input.command.actionId;
    const action = this.actions
      .list(data, state.turn, 'PLAYER')
      .find((option) => option.id === actionId);
    if (!action) {
      throw new AvengersRuleError(
        'ILLEGAL_ACTION',
        'Choose a currently available action; stale or fabricated options are invalid.',
      );
    }
    if (isTactical(action)) {
      this.combat.tactical(data, state.turn, 'PLAYER', action);
      this.actions.refresh(data, state.turn);
      // A non-turn tactical operation must never leave an ACTIVE FinalStage
      // with no legal way to continue. Resolve that state before returning it.
      this.checkOutcome(state);
      return state;
    }
    if (data.phase === AvengersFinalStagePhase.FINAL_ATTACK) {
      return this.finalResponse(state, action);
    }
    if (action.type === 'SUE_STORM_APPEAL') {
      data.sueStormAppealStatus = 'RESOLVED';
      this.events.emit(data, state.turn, {
        type: 'SUE_STORM_APPEAL',
        source: 'PLAYER',
        actorId: 'invisible-woman',
        targetIds: ['DOOM'],
      });
      this.complete(
        state,
        AvengersOutcome.VICTORY,
        state.turn,
        AvengersEndingCode.SUE_STORM_SECRET,
        AvengersTerminalReason.SUE_STORM_APPEAL,
      );
      return state;
    }
    if (actionHasActor(action, 'invisible-woman') && data.sueStormAppealStatus === 'AVAILABLE') {
      data.sueStormAppealStatus = 'LOST';
    }
    const turn = state.turn + 1;
    data.cycleFacts.push({
      turn,
      phase: data.phase as
        | AvengersFinalStagePhase.TOURNAMENT_FINAL
        | AvengersFinalStagePhase.DOOMSDAY,
      playerActiveHeroIds: this.rules.active(data.player).map((hero) => hero.heroId),
      opponentActiveHeroIds: this.rules.active(data.opponent).map((hero) => hero.heroId),
      playerHeroDamage: 0,
      opponentHeroDamage: 0,
      winnerSide: null,
    });
    // Include preparatory tactical events in this complete human decision cycle.
    data.events = data.timeline.filter((event) => event.turn === turn);
    this.combat.resolve(data, turn, 'PLAYER', action);
    this.doom.updateThreat(data, turn);
    this.finalizeCycleFact(data, turn);
    state.turn = turn;
    if (this.checkOutcome(state)) {
      return state;
    }
    this.actions.refresh(data, turn);
    // AI tactical preparation is part of the same cycle; cooldown uses completed
    // cycles before this response, not the already incremented output counter.
    this.ai.prepare(data, turn - 1);
    const response = this.ai.choose(data, turn - 1);
    if (response) {
      this.combat.resolve(data, turn, 'OPPONENT', response);
    }
    this.finalizeCycleFact(data, turn);
    if (this.checkOutcome(state)) {
      return state;
    }
    if (data.phase === AvengersFinalStagePhase.DOOMSDAY) {
      this.doom.intervene(data, turn);
    }
    if (this.checkOutcome(state)) {
      return state;
    }
    this.maybeEmitDoomAlone(data, turn);
    this.combat.expire(data, turn);
    if (
      data.phase === AvengersFinalStagePhase.TOURNAMENT_FINAL &&
      !data.revealOccurred &&
      !this.rules.living(data.opponent).length
    ) {
      this.reveal(state);
    } else if (data.phase === AvengersFinalStagePhase.TOURNAMENT_FINAL && turn === 4) {
      this.reveal(state);
    } else if (
      data.phase === AvengersFinalStagePhase.DOOMSDAY &&
      data.doom?.threatLevel === BossThreatLevel.CRITICAL
    ) {
      this.beginFinalAttack(state);
    }
    this.actions.refresh(data, turn);
    this.checkOutcome(state);
    return state;
  }

  private checkOutcome(state: TurnResult<AvengersTurnData>): boolean {
    const data = state.data;
    if (data.doom && data.doom.currentEnergy <= 0) {
      this.complete(
        state,
        AvengersOutcome.VICTORY,
        state.turn,
        data.endingCode ?? AvengersEndingCode.NORMAL_VICTORY,
      );
      return true;
    }
    const wasPreReveal =
      data.phase === AvengersFinalStagePhase.TOURNAMENT_FINAL && !data.revealOccurred;
    const living = this.rules.living(data.player);
    const revive = data.inventory.some(
      (item) =>
        item.quantity > 0 &&
        item.effect.type === 'REVIVE' &&
        data.player.heroes.some((hero) => hero.currentEnergy <= 0),
    );
    const canFill =
      this.rules.validFormation(data.player) ||
      this.actions.list(data, state.turn, 'PLAYER').some((action) => action.type === 'SWAP');
    const hasLegalAction = this.actions.list(data, state.turn, 'PLAYER').length > 0;
    if (!hasLegalAction || ((!living.length || !canFill) && !revive)) {
      if (data.phase === AvengersFinalStagePhase.TOURNAMENT_FINAL && !data.revealOccurred) {
        this.earlyDefeatReveal(state);
      }
      this.complete(
        state,
        AvengersOutcome.DEFEAT,
        state.turn,
        wasPreReveal ? AvengersEndingCode.EARLY_DEFEAT : AvengersEndingCode.NORMAL_DEFEAT,
        AvengersTerminalReason.PLAYER_NO_LEGAL_PROGRESS,
      );
      return true;
    }
    return false;
  }

  private complete(
    state: TurnResult<AvengersTurnData>,
    outcome: AvengersOutcome,
    eventTurn = state.turn,
    endingCode?: AvengersEndingCode,
    terminalReason?: AvengersTerminalReason,
  ): void {
    state.status = FinalStageStatus.COMPLETED;
    state.data.outcome = outcome;
    state.data.endingCode = endingCode ?? this.defaultEndingCode(state, outcome);
    state.data.terminalReasonCode =
      terminalReason ??
      (outcome === AvengersOutcome.VICTORY
        ? AvengersTerminalReason.DOOM_DEFEATED
        : outcome === AvengersOutcome.ABANDON
          ? AvengersTerminalReason.PLAYER_ABANDONED
          : AvengersTerminalReason.PLAYER_NO_LEGAL_PROGRESS);
    state.data.availableActions = [];
    state.data.phase = AvengersFinalStagePhase.COMPLETED;
    const terminalEventType =
      state.data.endingCode === AvengersEndingCode.EARLY_DEFEAT ? 'EARLY_DEFEAT_SCENE' : outcome;
    this.events.emit(state.data, eventTurn, {
      type: terminalEventType,
      source: 'SYSTEM',
      parameters: {
        act: state.data.revealOccurred ? 'DOOMSDAY' : 'TOURNAMENT_FINAL',
        playerLeader: state.data.player.leaderId,
        opponentLeader: state.data.opponent.leaderId,
        endingCode: state.data.endingCode,
        terminalReasonCode: state.data.terminalReasonCode,
      },
      ...(outcome === AvengersOutcome.ABANDON ? { variant: 10 } : {}),
    });
  }

  private beginFinalAttack(state: TurnResult<AvengersTurnData>): void {
    const data = state.data;
    if (!data.doom) {
      throw new Error('The Final Attack cannot begin before Doctor Doom is active.');
    }
    data.phase = AvengersFinalStagePhase.FINAL_ATTACK;
    data.finalAttackInitiator =
      !this.rules.living(data.opponent).length ||
      [BossThreatLevel.HIGH, BossThreatLevel.CRITICAL].includes(data.doom.threatLevel)
        ? 'DOOM'
        : 'OPPONENT';
    this.events.emit(data, state.turn, {
      type: 'FINAL_ATTACK',
      source: data.finalAttackInitiator,
      actorId: data.finalAttackInitiator,
    });
  }

  finalResponseChance(data: AvengersTurnData, action: AvengersAction): number {
    const player = this.combat.averageStats(data, data.player);
    const enemy =
      data.finalAttackInitiator === 'DOOM'
        ? this.rules.doomStats()
        : this.combat.averageStats(data, data.opponent);
    const capability = (player.power + player.ability + player.agility + player.resistance) / 4;
    const pressure = (enemy.power + enemy.ability + enemy.agility + enemy.resistance) / 4;
    const bonus: Record<AvengersAction['type'], number> = {
      BASIC_ATTACK: 0,
      OFFENSIVE_SPECIAL: 0.09,
      SUPPORT_SPECIAL: 0.06,
      LEADER_ABILITY: 0.16,
      TEAM_ACTION: 0.13,
      POWER_UP: 0.1,
      SWAP: 0,
      CHANGE_STRATEGY: 0,
      SUE_STORM_APPEAL: 0,
    };
    const threatPenalty =
      data.finalAttackInitiator === 'DOOM' && data.doom
        ? (this.config.balance.doomScaling[data.doom.threatLevel] - 1) * 0.2
        : 0;
    const doomEnergyRatio =
      data.doom && data.doom.maxEnergy > 0
        ? clamp(data.doom.currentEnergy / data.doom.maxEnergy, 0, 1)
        : 0.5;
    const doomEnergyBonus = (0.5 - doomEnergyRatio) * 0.2;
    return clamp(
      this.config.balance.finalAttackBaseChance +
        (capability - pressure) / 250 +
        bonus[action.type] -
        threatPenalty +
        doomEnergyBonus,
      0.1,
      0.9,
    );
  }

  private finalResponse(
    state: TurnResult<AvengersTurnData>,
    action: AvengersAction,
  ): TurnResult<AvengersTurnData> {
    const data = state.data;
    const chance = this.finalResponseChance(data, action);
    this.combat.resolve(data, state.turn, 'PLAYER', action);
    this.doom.updateThreat(data, state.turn);
    if (this.checkOutcome(state)) {
      return state;
    }
    this.events.emit(data, state.turn, {
      type: 'FINAL_RESPONSE',
      source: 'PLAYER',
      actorId: 'actorId' in action ? action.actorId : 'PLAYER',
      values: { score: Math.round(chance * 100) },
      parameters: { action: this.combat.actionName(data, data.player, action) },
    });
    if (this.random.next(data) < chance) {
      if (!data.doom) {
        throw new Error('Doctor Doom must be active during the Final Attack.');
      }
      const energy = data.doom.currentEnergy;
      data.doom.currentEnergy = 0;
      this.events.emit(data, state.turn, {
        type: 'DAMAGE',
        source: 'PLAYER',
        targetIds: ['DOOM'],
        targetSide: 'DOOM',
        values: { damage: energy, energy: 0 },
      });
      this.doom.updateThreat(data, state.turn);
      this.complete(
        state,
        AvengersOutcome.VICTORY,
        state.turn,
        AvengersEndingCode.NORMAL_VICTORY,
        AvengersTerminalReason.FINAL_RESPONSE_SUCCEEDED,
      );
    } else {
      this.complete(
        state,
        AvengersOutcome.DEFEAT,
        state.turn,
        AvengersEndingCode.NORMAL_DEFEAT,
        AvengersTerminalReason.FINAL_RESPONSE_FAILED,
      );
    }
    return state;
  }

  /** Owner-approved phase transition. It is narrative plus boss activation; no Team state is reset. */
  private reveal(state: TurnResult<AvengersTurnData>): void {
    const data = state.data;
    data.revealOccurred = true;
    data.opponentHadLivingAtActIIStart = this.rules.living(data.opponent).length > 0;
    data.doomAloneNarrativeEmitted = !data.opponentHadLivingAtActIIStart;
    data.sueStormAppealStatus = this.rules
      .active(data.player)
      .some((hero) => hero.heroId === 'invisible-woman')
      ? 'AVAILABLE'
      : 'LOCKED';
    this.events.emit(data, state.turn, {
      type: 'SURFER_ENOUGH',
      source: 'SILVER_SURFER',
      actorId: 'SILVER_SURFER',
    });
    data.doom = {
      maxEnergy: this.config.balance.doomMaxEnergy,
      currentEnergy: this.config.balance.doomMaxEnergy,
      threatLevel: this.rules.threat(
        this.config.balance.doomMaxEnergy,
        this.config.balance.doomMaxEnergy,
      ),
    };
    this.events.emit(data, state.turn, { type: 'DOOM_REVEALED', source: 'DOOM', actorId: 'DOOM' });
    this.events.emit(data, state.turn, {
      type: 'DOOM_EXPLANATION',
      source: 'DOOM',
      actorId: 'DOOM',
    });
    this.events.emit(data, state.turn, {
      type: 'PLAYER_REJECTION',
      source: 'PLAYER',
      actorId: data.player.leaderId,
      parameters: {
        playerLeader: data.player.leaderId,
        opponentLeader: data.opponent.leaderId,
      },
    });
    if (this.rules.living(data.opponent).length > 0) {
      this.events.emit(data, state.turn, {
        type: 'OPPONENT_ALLIANCE',
        source: 'OPPONENT',
        actorId: data.opponent.leaderId,
        parameters: {
          playerLeader: data.player.leaderId,
          opponentLeader: data.opponent.leaderId,
        },
      });
    }
    data.phase = AvengersFinalStagePhase.DOOMSDAY;
    this.events.emit(data, state.turn, {
      type: 'DOOMSDAY_BEGINS',
      source: 'DOOM',
      actorId: 'DOOM',
    });
  }

  private earlyDefeatReveal(state: TurnResult<AvengersTurnData>): void {
    const data = state.data;
    data.revealOccurred = true;
    data.opponentHadLivingAtActIIStart = false;
    data.doomAloneNarrativeEmitted = true;
    data.sueStormAppealStatus = 'LOCKED';
  }

  private maybeEmitDoomAlone(data: AvengersTurnData, turn: number): void {
    if (
      data.phase !== AvengersFinalStagePhase.DOOMSDAY ||
      !data.doom ||
      data.doom.currentEnergy <= 0 ||
      data.doomAloneNarrativeEmitted ||
      !data.opponentHadLivingAtActIIStart ||
      this.rules.living(data.opponent).length > 0
    ) {
      return;
    }
    data.doomAloneNarrativeEmitted = true;
    this.events.emit(data, turn, {
      type: 'DOOM_ALONE',
      source: 'DOOM',
      actorId: 'DOOM',
      parameters: {
        playerLeader: data.player.leaderId,
        opponentLeader: data.opponent.leaderId,
      },
    });
  }

  private defaultEndingCode(
    state: TurnResult<AvengersTurnData>,
    outcome: AvengersOutcome,
  ): AvengersEndingCode {
    if (outcome === AvengersOutcome.VICTORY) {
      return AvengersEndingCode.NORMAL_VICTORY;
    }
    if (outcome === AvengersOutcome.DEFEAT) {
      return state.data.revealOccurred
        ? AvengersEndingCode.NORMAL_DEFEAT
        : AvengersEndingCode.EARLY_DEFEAT;
    }
    return state.data.revealOccurred
      ? AvengersEndingCode.POST_REVEAL_ABANDON
      : AvengersEndingCode.PRE_REVEAL_ABANDON;
  }

  private finalizeCycleFact(data: AvengersTurnData, turn: number): void {
    const fact = data.cycleFacts.find((value) => value.turn === turn);
    if (!fact) {
      return;
    }
    const events = data.timeline.filter((event) => event.turn === turn && event.type === 'DAMAGE');
    fact.playerHeroDamage = events
      .filter((event) => event.source === 'PLAYER')
      .reduce((sum, event) => sum + (event.values.damage ?? 0), 0);
    fact.opponentHeroDamage = events
      .filter((event) => event.source === 'OPPONENT')
      .reduce((sum, event) => sum + (event.values.damage ?? 0), 0);
    fact.winnerSide =
      fact.playerHeroDamage === fact.opponentHeroDamage
        ? null
        : fact.playerHeroDamage > fact.opponentHeroDamage
          ? 'PLAYER'
          : 'OPPONENT';
  }
}

function actionHasActor(action: AvengersAction, actorId: string): boolean {
  return 'actorId' in action && action.actorId === actorId;
}
