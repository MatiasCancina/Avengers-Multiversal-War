import { HttpStatus, Injectable } from '@nestjs/common';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import {
  JourneyEncounterApi,
  JourneyKnockoutMatchApi,
} from '../../basic/model/game-api/journey-stages.model';
import {
  KnockoutMatchModel,
  KnockoutStageModel,
  KnockoutTeamModel,
} from './model/knockout-stage.model';

const KNOCKOUT_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
    message: 'There is no current Journey. Simulate one to see the knockout bracket.',
  },
};

const KNOCKOUT_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
  message: 'Unable to load the knockout stage right now.',
};

@Injectable()
export class KnockoutStageService {
  constructor(
    private readonly game: GameFeatureApiService,
    private readonly context: ApplicationContextService,
  ) {}

  async getKnockoutStage(): Promise<KnockoutStageModel> {
    const teamId = this.context.getCurrentTeamId();

    try {
      const [stages, currentTeams, encounters] = await Promise.all([
        this.game.currentStages(teamId),
        this.game.currentTeams(teamId),
        this.game.currentEncounters(teamId),
      ]);

      const teamNames = new Map(currentTeams.teams.map((team) => [team.teamId, team.name]));
      const encountersById = new Map(
        encounters.encounters.map((encounter) => [encounter.encounterId, encounter]),
      );

      return {
        attemptId: stages.attemptId,
        playerTeamId: teamId,
        rounds: stages.knockout.rounds.map((round) => ({
          stageCode: round.stageCode,
          matches: round.matches.map((match) =>
            this.toMatchModel(match, teamId, teamNames, encountersById.get(match.encounterId)),
          ),
        })),
        finalists: stages.finalists,
      };
    } catch (error) {
      ErrorUtils.mapGameApiError(error, KNOCKOUT_API_ERROR_STATUS_MAP, KNOCKOUT_API_ERROR_FALLBACK);
    }
  }

  private toMatchModel(
    match: JourneyKnockoutMatchApi,
    playerTeamId: string,
    teamNames: Map<string, string>,
    encounter: JourneyEncounterApi | undefined,
  ): KnockoutMatchModel {
    return {
      slot: match.slot,
      encounterId: match.encounterId,
      teamA: this.toTeamModel(match.teamAId, teamNames, encounter),
      teamB: this.toTeamModel(match.teamBId, teamNames, encounter),
      winnerTeamId: match.winnerTeamId,
      pending: !match.winnerTeamId,
      involvesPlayer: match.teamAId === playerTeamId || match.teamBId === playerTeamId,
      nextStageCode: match.nextStageCode,
      nextSlot: match.nextSlot,
    };
  }

  private toTeamModel(
    teamId: string,
    teamNames: Map<string, string>,
    encounter: JourneyEncounterApi | undefined,
  ): KnockoutTeamModel {
    const damage = encounter?.damageByTeam.find((entry) => entry.teamId === teamId);
    return {
      teamId,
      name: teamNames.get(teamId) ?? teamId,
      damageDealt: damage?.damageDealt ?? null,
    };
  }
}
