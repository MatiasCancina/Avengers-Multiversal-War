import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiError, toApiError } from '../../../../core/models/api-error.interface';
import { AppContextService } from '../../../../core/services/app-context.service';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { AppCopyKey } from '../../../../core/services/i18n.service';
import {
  TeamJourneyApi,
  TeamJourneyOutcomeApi,
  TeamJourneyStopApi,
} from '../model/team-journey-api.interface';
import {
  TeamJourneyDetailApi,
  TeamJourneyEventApi,
  TeamJourneyRoundApi,
} from '../model/team-encounter-detail-api.interface';
import {
  TeamJourneyDetailViewModel,
  TeamJourneyEventViewModel,
  TeamJourneyOutcome,
  TeamJourneyProgressViewModel,
  TeamJourneyRoundViewModel,
  TeamJourneyStopViewModel,
  TeamJourneyViewModel,
} from '../model/team-journey-view-model.interface';

/**
 * Backend contract error code emitted when no Journey has been simulated yet.
 * It is matched as an opaque code: the backend message text is never parsed.
 */
const TEAM_JOURNEY_UNAVAILABLE_CODE = 'BFF_TEAM_JOURNEY_UNAVAILABLE';

const TEAM_JOURNEY_ENDPOINT = '/journey/team/encounters';
const SIMULATE_JOURNEY_URL = '/journey/simulate';
const FINAL_BATTLE_URL = '/final-stage/play';
const FINAL_STOP_ID = 'final-stage';

const STAGE_LABEL_KEYS: Record<string, AppCopyKey> = {
  GROUP_STAGE: 'historyRivals.stage.groupStage',
  ROUND_OF_16: 'historyRivals.stage.roundOf16',
  QUARTERFINAL: 'historyRivals.stage.quarterfinal',
  SEMIFINAL: 'historyRivals.stage.semifinal',
  FINAL_STAGE: 'r7.finalBattle',
};

const RESOLUTION_LABEL_KEYS: Record<string, AppCopyKey> = {
  TOTAL_KO: 'tournament.resolution.totalKo',
  SPECIAL_SHOWDOWN: 'tournament.resolution.specialShowdown',
  SHOWDOWN_FORFEIT: 'tournament.resolution.showdownForfeit',
  TECHNICAL_VERDICT: 'tournament.resolution.technicalVerdict',
};

const ROUND_TYPE_LABEL_KEYS: Record<'NORMAL' | 'EXTRA_ROUND', AppCopyKey> = {
  NORMAL: 'r7.roundType.normal',
  EXTRA_ROUND: 'r7.roundType.extra',
};

const EVENT_LABEL_KEYS: Record<string, AppCopyKey> = {
  ACTION: 'r7.event.action',
  DAMAGE: 'r7.event.damage',
  HEAL: 'r7.event.heal',
  KO: 'r7.event.ko',
  STAT_GAIN: 'r7.event.statGain',
  RECOVERY: 'r7.event.recovery',
  POWER_UP: 'r7.event.purchaseUse',
  PURCHASE_USE: 'r7.event.purchaseUse',
  AUTO_PURCHASE_USE: 'r7.event.purchaseUse',
  ACTION_SKIPPED: 'r7.event.actionSkipped',
  SPECIAL_SHOWDOWN: 'r7.event.specialShowdown',
  SHOWDOWN_FORFEIT: 'r7.event.showdownForfeit',
  SHOWDOWN_VERDICT: 'r7.event.showdownVerdict',
};

const OUTCOME_BY_API_CODE: Record<TeamJourneyOutcomeApi, TeamJourneyOutcome> = {
  WIN: 'win',
  DRAW: 'draw',
  LOSS: 'loss',
  PENDING: 'pending',
  ABANDONED: 'abandoned',
};

const OUTCOME_LABEL_KEYS: Record<TeamJourneyOutcome, AppCopyKey> = {
  win: 'r7.win',
  draw: 'r7.draw',
  loss: 'r7.loss',
  pending: 'r7.pending',
  abandoned: 'r7.abandoned',
};

const EMPTY_PROGRESS: TeamJourneyProgressViewModel = {
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
};

@Injectable({ providedIn: 'root' })
export class TeamJourneyService extends BaseApiService {
  private detailRequest: Subscription | null = null;

  private readonly pageState: TeamJourneyViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    teamId: null,
    stops: [],
    progress: { ...EMPTY_PROGRESS },
    simulateJourneyUrl: SIMULATE_JOURNEY_URL,
    lang: 'en',
    emptyReason: null,
    selectedStopId: null,
    selectedStop: null,
    detailStatus: 'idle',
    detail: null,
    detailError: null,
    finalBattleUrl: FINAL_BATTLE_URL,
  };

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService,
  ) {
    super(api);
  }

  getViewModel(): TeamJourneyViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.loadTeamJourney();
  }

  retry(): void {
    this.loadTeamJourney();
  }

  retryDetail(): void {
    const selectedStop = this.pageState.selectedStop;

    if (!selectedStop) {
      return;
    }

    if (selectedStop.kind === 'final') {
      this.applyFinalDetailState(selectedStop);
      return;
    }

    this.applyEncounterDetailState(selectedStop);
  }

  selectEncounter(encounterId: string): void {
    const stop =
      this.pageState.stops.find(
        (item) => item.kind === 'encounter' && item.encounterId === encounterId,
      ) ?? null;

    if (!stop) {
      return;
    }

    if (this.pageState.selectedStopId === stop.stopId) {
      this.clearSelection();
      return;
    }

    this.pageState.selectedStopId = stop.stopId;
    this.pageState.selectedStop = stop;
    this.applyEncounterDetailState(stop);
  }

  selectFinalStop(): void {
    const stop = this.pageState.stops.find((item) => item.kind === 'final') ?? null;

    if (!stop) {
      return;
    }

    if (this.pageState.selectedStopId === stop.stopId) {
      this.clearSelection();
      return;
    }

    this.pageState.selectedStopId = stop.stopId;
    this.pageState.selectedStop = stop;
    this.applyFinalDetailState(stop);
  }

  private loadTeamJourney(): void {
    this.cancelDetailRequest();
    this.resetDetail();
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;
    this.pageState.emptyReason = null;

    this.getData<TeamJourneyApi>(TEAM_JOURNEY_ENDPOINT).subscribe({
      next: (data) => {
        this.applyJourney(data);
      },
      error: (error: unknown) => {
        const apiError: ApiError = toApiError(error);

        if (apiError.messageCode === TEAM_JOURNEY_UNAVAILABLE_CODE) {
          this.resetJourney();
          return;
        }

        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }

  private applyJourney(data: TeamJourneyApi): void {
    const stops = data.stops.map((stop) => this.toStopViewModel(stop));

    this.pageState.teamId = data.playerTeamId;
    this.pageState.stops = stops;
    this.pageState.progress = data.progress;
    this.pageState.status = stops.length ? 'data' : 'empty';
    this.pageState.emptyReason = stops.length ? null : 'no-encounters';
    this.applySelection(stops);
  }

  private applySelection(stops: TeamJourneyStopViewModel[]): void {
    const selected = this.pageState.selectedStopId
      ? (stops.find((stop) => stop.stopId === this.pageState.selectedStopId) ?? null)
      : null;

    if (!selected) {
      this.clearSelection();
      return;
    }

    this.pageState.selectedStop = selected;

    if (selected.kind === 'final') {
      this.applyFinalDetailState(selected);
      return;
    }

    this.applyEncounterDetailState(selected);
  }

  private applyEncounterDetailState(stop: TeamJourneyStopViewModel): void {
    if (stop.outcome === 'pending') {
      this.cancelDetailRequest();
      this.resetDetail();
      this.pageState.detailStatus = 'pending';
      return;
    }

    this.loadEncounterDetail(stop);
  }

  private loadEncounterDetail(stop: TeamJourneyStopViewModel): void {
    if (!stop.encounterId) {
      this.resetDetail();
      this.pageState.detailStatus = 'unavailable';
      return;
    }

    this.cancelDetailRequest();
    this.pageState.detailStatus = 'loading';
    this.pageState.detail = null;
    this.pageState.detailError = null;

    this.detailRequest = this.getData<TeamJourneyDetailApi>(
      `${TEAM_JOURNEY_ENDPOINT}/${encodeURIComponent(stop.encounterId)}`,
    ).subscribe({
      next: (detail) => {
        if (this.pageState.selectedStopId !== stop.stopId) {
          return;
        }

        const detailViewModel = this.toDetailViewModel(detail);

        this.pageState.detail = detailViewModel;
        this.pageState.detailStatus =
          detailViewModel.rounds.length || detailViewModel.extraRound ? 'data' : 'unavailable';
      },
      error: (error: unknown) => {
        if (this.pageState.selectedStopId !== stop.stopId) {
          return;
        }

        const apiError: ApiError = toApiError(error);

        if (apiError.messageCode === TEAM_JOURNEY_UNAVAILABLE_CODE) {
          this.pageState.detail = null;
          this.pageState.detailStatus = 'unavailable';
          this.pageState.detailError = null;
          return;
        }

        this.pageState.detail = null;
        this.pageState.detailStatus = 'error';
        this.pageState.detailError = apiError.message;
      },
    });
  }

  private applyFinalDetailState(stop: TeamJourneyStopViewModel): void {
    this.cancelDetailRequest();
    this.pageState.detail = null;
    this.pageState.detailError = null;
    this.pageState.detailStatus = stop.finalStageStatus === 'COMPLETED' ? 'unavailable' : 'pending';
  }

  private clearSelection(): void {
    this.cancelDetailRequest();
    this.pageState.selectedStopId = null;
    this.pageState.selectedStop = null;
    this.resetDetail();
  }

  private resetDetail(): void {
    this.pageState.detail = null;
    this.pageState.detailError = null;
    this.pageState.detailStatus = 'idle';
  }

  private cancelDetailRequest(): void {
    this.detailRequest?.unsubscribe();
    this.detailRequest = null;
  }

  private resetJourney(): void {
    this.cancelDetailRequest();
    this.pageState.teamId = null;
    this.pageState.stops = [];
    this.pageState.progress = { ...EMPTY_PROGRESS };
    this.pageState.selectedStopId = null;
    this.pageState.selectedStop = null;
    this.resetDetail();
    this.pageState.status = 'empty';
    this.pageState.emptyReason = 'no-journey';
  }

  private toStopViewModel(stop: TeamJourneyStopApi): TeamJourneyStopViewModel {
    const outcome = OUTCOME_BY_API_CODE[stop.outcome] ?? 'pending';

    return {
      stopId: stop.kind === 'FINAL' ? FINAL_STOP_ID : (stop.encounterId ?? ''),
      kind: stop.kind === 'FINAL' ? 'final' : 'encounter',
      encounterId: stop.encounterId,
      stageId: stop.stageId,
      stageCode: stop.stageCode,
      groupId: stop.groupId,
      stageLabelKey: STAGE_LABEL_KEYS[stop.stageCode] ?? null,
      resolutionLabelKey: stop.resolutionCode
        ? (RESOLUTION_LABEL_KEYS[stop.resolutionCode] ?? null)
        : null,
      opponentTeamId: stop.opponentTeamId,
      opponentTeamName: stop.opponentTeamName,
      outcome,
      outcomeLabelKey: OUTCOME_LABEL_KEYS[outcome],
      damageDealt: stop.damageDealt,
      rivalEncounter: stop.rivalEncounter,
      finalStageStatus: stop.finalStageStatus,
    };
  }

  private toDetailViewModel(detail: TeamJourneyDetailApi): TeamJourneyDetailViewModel {
    return {
      encounterId: detail.encounterId,
      stageCode: detail.stageCode,
      stageLabelKey: STAGE_LABEL_KEYS[detail.stageCode] ?? null,
      groupId: detail.groupId,
      rounds: detail.rounds.map((round) => this.toRoundViewModel(round)),
      extraRound: detail.extraRound ? this.toRoundViewModel(detail.extraRound) : null,
    };
  }

  private toRoundViewModel(round: TeamJourneyRoundApi): TeamJourneyRoundViewModel {
    return {
      roundId: `${round.roundType}-${round.number}`,
      number: round.number,
      roundTypeLabelKey: ROUND_TYPE_LABEL_KEYS[round.roundType],
      initiativeTeamName: round.initiativeTeamName,
      winnerTeamName: round.winnerTeamName,
      damageByTeam: round.damageByTeam.map((damage) => ({
        teamId: damage.teamId,
        teamName: damage.teamName,
        damageDealt: damage.damageDealt,
      })),
      activeHeroesByTeam: round.activeHeroesByTeam.map((activeHeroes) => ({
        teamId: activeHeroes.teamId,
        teamName: activeHeroes.teamName,
        heroes: activeHeroes.heroes.map((hero) => ({
          heroId: hero.heroId,
          heroName: hero.heroName,
        })),
      })),
      events: round.events.map((event) => this.toEventViewModel(event)),
    };
  }

  private toEventViewModel(event: TeamJourneyEventApi): TeamJourneyEventViewModel {
    return {
      sequence: event.sequence,
      eventCode: event.eventCode,
      eventLabelKey: EVENT_LABEL_KEYS[event.eventCode] ?? 'r7.event.other',
      teamName: event.teamName,
      actorHeroName: event.actorHeroName,
      targetHeroNames: event.targetHeroNames,
      amount: event.amount,
      narrativeLines: event.narrativeLines.map((line) => ({
        lineSequence: line.lineSequence,
        speakerName: line.speakerName,
        text: line.text,
      })),
    };
  }
}
