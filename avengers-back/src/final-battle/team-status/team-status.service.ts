import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { GameApiService } from '../../basic/game-api.service';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import {
  FinalStageTeamsStatusApi,
  FinalStageStateApi,
} from '../../basic/model/game-api/final-contract.model';

const TEAM_STATUS_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: 'TEAM_STATUS_UNAVAILABLE',
    message: 'Team status is not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: 'TEAM_STATUS_UNAVAILABLE',
    message: 'Team status is not available right now.',
  },
};

const TEAM_STATUS_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: 'TEAM_STATUS_UNAVAILABLE',
  message: 'Unable to load the current Final Stage team status.',
};

export interface TeamStatusModel {
  teamId: string;
  attemptId: string;
  finalState: FinalStageStateApi;
  finalists: {
    playerTeamId: string;
    opponentTeamId: string;
  };
  teams: FinalStageTeamsStatusApi['player'][];
}

@Injectable()
export class TeamStatusService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameApiService,
  ) {}

  async getStatus(): Promise<TeamStatusModel> {
    const teamId = this.context.getCurrentTeamId();
    const language = this.context.language;

    try {
      const finalState = await this.game.get<FinalStageStateApi>(
        `/teams/${teamId}/journeys/current/final-stage`,
        { lang: language },
      );

      if (finalState.status === 'READY') {
        return {
          teamId,
          attemptId: finalState.attemptId,
          finalState,
          finalists: {
            playerTeamId: finalState.participants.playerTeamId,
            opponentTeamId: finalState.participants.opponentTeamId,
          },
          teams: [],
        };
      }

      const teamsData = await this.game.get<FinalStageTeamsStatusApi>(
        `/teams/${teamId}/journeys/current/final-stage/teams`,
      );

      return {
        teamId,
        attemptId: finalState.attemptId,
        finalState,
        finalists: {
          playerTeamId: teamsData.player.teamId,
          opponentTeamId: teamsData.opponent.teamId,
        },
        teams: [teamsData.player, teamsData.opponent],
      };
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        TEAM_STATUS_API_ERROR_STATUS_MAP,
        TEAM_STATUS_API_ERROR_FALLBACK,
      );
    }
  }
}
