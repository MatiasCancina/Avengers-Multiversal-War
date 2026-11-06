import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { JourneyStandingApi } from '../../basic/model/game-api/journey-stages.model';
import { FinalEncounterApi } from '../../basic/model/game-api/final-contract.model';
import { GroupStageModel, GroupStageStandingModel } from './model/group-stage.model';

const GROUP_STAGE_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
    message: 'Group stage is not available for the current Journey.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
    message: 'Group stage is not available for the current Journey.',
  },
};

const GROUP_STAGE_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.JOURNEY_UNAVAILABLE,
  message: 'Unable to load the group stage right now.',
};

@Injectable()
export class GroupStageService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
  ) {}

  async getGroupStage(): Promise<GroupStageModel> {
    const teamId = this.context.getCurrentTeamId();
    const language = this.context.language;

    try {
      const current = await this.game.currentJourney(teamId, language);

      if (!current.attempt) {
        return {
          journeyAvailable: false,
          playerTeamId: teamId,
          playerGroupId: null,
          groups: [],
        };
      }

      const stages = await this.game.currentStages(teamId);
      const teams = await this.game.currentTeams(teamId);
      const encounters = await this.game.currentEncountersDetailed(teamId);
      const teamNames = new Map(teams.teams.map((team) => [team.teamId, team.name]));
      const groups = stages.groupStage.groups.map((group) => {
        const standings = group.standings.map((standing) =>
          this.toStanding(standing, teamId, teamNames),
        );

        return {
          groupId: group.groupId,
          playerGroup: standings.some((standing) => standing.playerTeam),
          standings,
          encounters: encounters.encounters.filter(
            (encounter: FinalEncounterApi) => encounter.groupId === group.groupId,
          ),
        };
      });

      const playerGroup = groups.find((group) => group.playerGroup);

      return {
        journeyAvailable: true,
        playerTeamId: teamId,
        playerGroupId: playerGroup?.groupId ?? null,
        groups,
      };
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        GROUP_STAGE_API_ERROR_STATUS_MAP,
        GROUP_STAGE_API_ERROR_FALLBACK,
      );
    }
  }

  private toStanding(
    standing: JourneyStandingApi,
    playerTeamId: string,
    teamNames: Map<string, string>,
  ): GroupStageStandingModel {
    return {
      position: standing.position,
      teamId: standing.teamId,
      teamName: teamNames.get(standing.teamId) ?? standing.teamId,
      played: standing.played,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      points: standing.points,
      damageDealt: standing.damageDealt,
      damageReceived: standing.damageReceived,
      damageDifference: standing.damageDifference,
      qualified: standing.qualified,
      playerTeam: standing.teamId === playerTeamId,
    };
  }
}
