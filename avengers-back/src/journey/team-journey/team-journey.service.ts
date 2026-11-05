import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { ErrorCode } from '../../basic/error/error-code.enum';
import {
  FinalEncounterApi,
  FinalEncounterDetailApi,
  FinalEncounterEventApi,
  FinalEncounterRoundApi,
  FinalJourneySummaryApi,
  FinalJourneyTeamsApi,
} from '../../basic/model/game-api/final-contract.model';
import {
  TeamJourneyFinalStageStatus,
  TeamJourneyModel,
  TeamJourneyOutcome,
  TeamJourneyProgressModel,
  TeamJourneyStopModel,
} from './model/team-journey.model';
import {
  TeamEncounterActiveHeroesModel,
  TeamEncounterDamageModel,
  TeamEncounterDetailModel,
  TeamEncounterEventModel,
  TeamEncounterHeroModel,
  TeamEncounterNarrativeLineModel,
  TeamEncounterRoundModel,
} from './model/team-encounter-detail.model';

const GAME_API_JOURNEY_REQUIRED_CODE = 'JOURNEY_REQUIRED';

const TEAM_JOURNEY_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.TEAM_JOURNEY_UNAVAILABLE,
    message: 'There is no current Journey. Simulate one to see the Team path.',
  },
};

const TEAM_JOURNEY_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
  message: 'Unable to load the Team path right now.',
};

const TEAM_ENCOUNTER_DETAIL_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
  message: 'Unable to load the encounter details right now.',
};

@Injectable()
export class TeamJourneyService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
  ) {}

  async getTeamJourney(): Promise<TeamJourneyModel> {
    const teamId = this.context.getCurrentTeamId();

    try {
      const [journey, encounters, teams] = await Promise.all([
        this.game.currentJourney(teamId, this.context.language),
        this.game.currentEncountersDetailed(teamId),
        this.game.currentTeams(teamId),
      ]);
      const stops = this.buildStops(encounters.encounters, teamId, teams);
      const finalStop = this.buildFinalStop(journey.summary, teamId, teams);

      if (finalStop) {
        stops.push(finalStop);
      }

      return {
        attemptId: encounters.attemptId,
        playerTeamId: teamId,
        stops,
        progress: this.buildProgress(stops),
      };
    } catch (error) {
      const details = ErrorUtils.extractExceptionDetails(error);

      if (
        details.statusCode === HttpStatus.NOT_FOUND ||
        details.messageCode === GAME_API_JOURNEY_REQUIRED_CODE
      ) {
        throw this.createJourneyUnavailableException();
      }

      ErrorUtils.mapGameApiError(
        error,
        TEAM_JOURNEY_API_ERROR_STATUS_MAP,
        TEAM_JOURNEY_API_ERROR_FALLBACK,
      );
    }
  }

  async getEncounterDetail(encounterId: string): Promise<TeamEncounterDetailModel> {
    const teamId = this.context.getCurrentTeamId();

    try {
      const [detail, teams, heroes] = await Promise.all([
        this.game.currentEncounterDetail(teamId, encounterId, this.context.language),
        this.game.currentTeams(teamId),
        this.game.heroes(this.context.language),
      ]);

      if (detail.teamAId !== teamId && detail.teamBId !== teamId) {
        throw this.createEncounterDetailUnavailableException();
      }

      const teamNames = this.buildTeamNames(teams);
      const heroNames = new Map(heroes.heroes.map((hero) => [hero.id, hero.displayName] as const));

      return this.buildEncounterDetail(detail, teamId, teamNames, heroNames);
    } catch (error) {
      const details = ErrorUtils.extractExceptionDetails(error);

      if (details.messageCode === GAME_API_JOURNEY_REQUIRED_CODE) {
        throw this.createEncounterDetailUnavailableException();
      }

      if (error instanceof HttpException) {
        throw error;
      }

      if (details.statusCode === HttpStatus.NOT_FOUND) {
        throw this.createEncounterDetailUnavailableException();
      }

      ErrorUtils.mapGameApiError(error, {}, TEAM_ENCOUNTER_DETAIL_API_ERROR_FALLBACK);
    }
  }

  private buildStops(
    encounters: FinalEncounterApi[],
    teamId: string,
    teams: FinalJourneyTeamsApi,
  ): TeamJourneyStopModel[] {
    const teamNames = this.buildTeamNames(teams);

    return encounters
      .filter((encounter) => encounter.teamAId === teamId || encounter.teamBId === teamId)
      .map((encounter) => this.buildEncounterStop(encounter, teamId, teamNames));
  }

  private buildEncounterStop(
    encounter: FinalEncounterApi,
    teamId: string,
    teamNames: Map<string, string>,
  ): TeamJourneyStopModel {
    const opponentTeamId = this.opponentOf(encounter, teamId);

    return {
      kind: 'ENCOUNTER',
      encounterId: encounter.encounterId,
      stageId: encounter.stageId,
      stageCode: encounter.stageCode,
      groupId: encounter.groupId,
      resolutionCode: encounter.resolutionCode,
      opponentTeamId,
      opponentTeamName: teamNames.get(opponentTeamId) ?? opponentTeamId,
      outcome: this.outcomeOf(encounter, teamId),
      damageDealt: this.damageOf(encounter, teamId),
      rivalEncounter: encounter.rivalEncounter,
      finalStageStatus: null,
    };
  }

  private buildFinalStop(
    summary: FinalJourneySummaryApi | null,
    teamId: string,
    teams: FinalJourneyTeamsApi,
  ): TeamJourneyStopModel | null {
    if (!summary) {
      return null;
    }

    const finalists = summary.finalists;

    if (finalists.playerTeamId !== teamId || finalists.opponentTeamId === teamId) {
      return null;
    }

    const finalStageStatus = this.finalStageStatusOf(summary);

    if (!finalStageStatus) {
      return null;
    }

    return {
      kind: 'FINAL',
      encounterId: null,
      stageId: null,
      stageCode: 'FINAL_STAGE',
      groupId: null,
      resolutionCode: null,
      opponentTeamId: finalists.opponentTeamId,
      opponentTeamName:
        this.buildTeamNames(teams).get(finalists.opponentTeamId) ?? finalists.opponentTeamId,
      outcome: this.finalOutcomeOf(finalStageStatus, summary.completionOutcome),
      damageDealt: null,
      rivalEncounter: null,
      finalStageStatus,
    };
  }

  private finalStageStatusOf(summary: FinalJourneySummaryApi): TeamJourneyFinalStageStatus | null {
    const status = summary.progress.finalStageStatus;

    if (status === 'READY' || status === 'ACTIVE' || status === 'COMPLETED') {
      return status;
    }

    return null;
  }

  private finalOutcomeOf(
    finalStageStatus: TeamJourneyFinalStageStatus,
    completionOutcome: FinalJourneySummaryApi['completionOutcome'],
  ): TeamJourneyOutcome {
    if (finalStageStatus !== 'COMPLETED') {
      return 'PENDING';
    }

    if (completionOutcome === 'VICTORY') {
      return 'WIN';
    }

    if (completionOutcome === 'DEFEAT') {
      return 'LOSS';
    }

    if (completionOutcome === 'ABANDON') {
      return 'ABANDONED';
    }

    return 'PENDING';
  }

  private buildEncounterDetail(
    detail: FinalEncounterDetailApi,
    teamId: string,
    teamNames: Map<string, string>,
    heroNames: Map<string, string>,
  ): TeamEncounterDetailModel {
    return {
      encounterId: detail.encounterId,
      stageId: detail.stageId,
      stageCode: detail.stageCode,
      groupId: detail.groupId,
      teamAId: detail.teamAId,
      teamBId: detail.teamBId,
      winnerTeamId: detail.winnerTeamId,
      resolutionCode: detail.resolutionCode,
      rivalEncounter: detail.rivalEncounter,
      outcome: this.outcomeOf(detail, teamId),
      damageDealt: this.damageOf(detail, teamId),
      rounds: detail.rounds.map((round) => this.buildRound(round, teamNames, heroNames)),
      extraRound: detail.extraRound
        ? this.buildRound(detail.extraRound, teamNames, heroNames)
        : null,
    };
  }

  private buildRound(
    round: FinalEncounterRoundApi,
    teamNames: Map<string, string>,
    heroNames: Map<string, string>,
  ): TeamEncounterRoundModel {
    return {
      number: round.number,
      roundType: round.roundType,
      initiativeTeamId: round.initiativeTeamId,
      initiativeTeamName: teamNames.get(round.initiativeTeamId) ?? round.initiativeTeamId,
      winnerTeamId: round.winnerTeamId,
      winnerTeamName: this.teamNameOf(round.winnerTeamId, teamNames),
      damageByTeam: round.damageByTeam.map((damage) => this.buildDamage(damage, teamNames)),
      activeHeroesByTeam: round.activeHeroIdsByTeam.map((activeHeroes) =>
        this.buildActiveHeroes(activeHeroes, teamNames, heroNames),
      ),
      events: round.events.map((event) => this.buildEvent(event, teamNames, heroNames)),
    };
  }

  private buildDamage(
    damage: FinalEncounterApi['damageByTeam'][number],
    teamNames: Map<string, string>,
  ): TeamEncounterDamageModel {
    return {
      teamId: damage.teamId,
      teamName: teamNames.get(damage.teamId) ?? damage.teamId,
      damageDealt: damage.damageDealt,
    };
  }

  private buildActiveHeroes(
    activeHeroes: FinalEncounterRoundApi['activeHeroIdsByTeam'][number],
    teamNames: Map<string, string>,
    heroNames: Map<string, string>,
  ): TeamEncounterActiveHeroesModel {
    return {
      teamId: activeHeroes.teamId,
      teamName: teamNames.get(activeHeroes.teamId) ?? activeHeroes.teamId,
      heroes: activeHeroes.heroIds.map((heroId) => this.buildHero(heroId, heroNames)),
    };
  }

  private buildHero(heroId: string, heroNames: Map<string, string>): TeamEncounterHeroModel {
    return {
      heroId,
      heroName: heroNames.get(heroId) ?? heroId,
    };
  }

  private buildEvent(
    event: FinalEncounterEventApi,
    teamNames: Map<string, string>,
    heroNames: Map<string, string>,
  ): TeamEncounterEventModel {
    return {
      sequence: event.sequence,
      eventCode: event.eventCode,
      teamId: event.teamId,
      teamName: this.teamNameOf(event.teamId, teamNames),
      actorHeroId: event.actorHeroId,
      actorHeroName: this.heroNameOf(event.actorHeroId, heroNames),
      targetHeroIds: event.targetHeroIds,
      targetHeroNames: event.targetHeroIds.map((heroId) => heroNames.get(heroId) ?? heroId),
      messageCode: event.messageCode,
      amount: typeof event.values?.amount === 'number' ? event.values.amount : null,
      narrativeLines: (event.narrative?.lines ?? []).map((line) =>
        this.buildNarrativeLine(line, heroNames),
      ),
    };
  }

  private buildNarrativeLine(
    line: NonNullable<FinalEncounterEventApi['narrative']>['lines'][number],
    heroNames: Map<string, string>,
  ): TeamEncounterNarrativeLineModel {
    return {
      lineSequence: line.lineSequence,
      type: line.type,
      speakerId: line.speakerId,
      speakerName: this.heroNameOf(line.speakerId, heroNames),
      text: line.text,
    };
  }

  private buildTeamNames(teams: FinalJourneyTeamsApi): Map<string, string> {
    return new Map(teams.teams.map((team) => [team.teamId, team.name]));
  }

  private teamNameOf(teamId: string | null, teamNames: Map<string, string>): string | null {
    if (!teamId) {
      return null;
    }

    return teamNames.get(teamId) ?? teamId;
  }

  private heroNameOf(heroId: string | null, heroNames: Map<string, string>): string | null {
    if (!heroId) {
      return null;
    }

    return heroNames.get(heroId) ?? heroId;
  }

  private opponentOf(encounter: FinalEncounterApi, teamId: string): string {
    if (encounter.teamAId === teamId) {
      return encounter.teamBId;
    }

    return encounter.teamAId;
  }

  private outcomeOf(encounter: FinalEncounterApi, teamId: string): TeamJourneyOutcome {
    const result = encounter.results.find((row) => row.teamId === teamId);
    const resultCode = result?.resultCode;

    if (resultCode === 'WIN' || resultCode === 'DRAW' || resultCode === 'LOSS') {
      return resultCode;
    }

    return 'PENDING';
  }

  private damageOf(encounter: FinalEncounterApi, teamId: string): number | null {
    return encounter.damageByTeam.find((row) => row.teamId === teamId)?.damageDealt ?? null;
  }

  private buildProgress(stops: TeamJourneyStopModel[]): TeamJourneyProgressModel {
    const progress: TeamJourneyProgressModel = {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    };

    for (const stop of stops) {
      if (stop.kind !== 'ENCOUNTER' || stop.outcome === 'PENDING') {
        continue;
      }

      progress.played += 1;
      if (stop.outcome === 'WIN') {
        progress.wins += 1;
      } else if (stop.outcome === 'LOSS') {
        progress.losses += 1;
      } else if (stop.outcome === 'DRAW') {
        progress.draws += 1;
      }
    }

    return progress;
  }

  private createJourneyUnavailableException(): HttpException {
    return new HttpException(
      {
        responseMessage: {
          messageCode: ErrorCode.TEAM_JOURNEY_UNAVAILABLE,
          message: 'There is no current Journey. Simulate one to see the Team path.',
        },
        data: null,
      },
      HttpStatus.NOT_FOUND,
    );
  }

  private createEncounterDetailUnavailableException(): HttpException {
    return new HttpException(
      {
        responseMessage: {
          messageCode: ErrorCode.TEAM_JOURNEY_UNAVAILABLE,
          message: 'The requested encounter detail is not available.',
        },
        data: null,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
