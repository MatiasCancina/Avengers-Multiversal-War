import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../error/error.utils';
import { ErrorCode } from '../error/error-code.enum';
import { GameFeatureApiService } from '../game-feature-api.service';
import { ApplicationContextModel } from '../model/application-context.model';

const CONTEXT_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.TEAM_CONTEXT_UNAVAILABLE,
    message: 'Unable to load the configured Team context.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.TEAM_CONTEXT_UNAVAILABLE,
    message: 'Team context is not available right now.',
  },
};

const CONTEXT_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.TEAM_CONTEXT_UNAVAILABLE,
  message: 'Unable to load the configured Team context.',
};

@Injectable()
export class ApplicationContextService {
  readonly teamId: string;

  readonly language: 'en' | 'es';

  constructor(
    private readonly game: GameFeatureApiService,
    config: ConfigService,
  ) {
    this.language = config.get<string>('APP_LANG', 'es').toLowerCase() === 'en' ? 'en' : 'es';
    this.teamId = config.get<string>('TEAM_ID', 'black-widow').trim().toLowerCase();
  }

  getCurrentTeamId(): string {
    return this.teamId;
  }

  async context(): Promise<ApplicationContextModel> {
    try {
      const [profile, teams, current] = await Promise.all([
        this.game.profile(this.teamId, this.language),
        this.game.assignedTeams(this.language),
        this.game.currentJourney(this.teamId, this.language),
      ]);
      const assignedTeam = teams.find((team) => team.id === this.teamId);
      if (!assignedTeam) {
        throw new NotFoundException(`Configured Team '${this.teamId}' was not found.`);
      }
      return {
        teamId: this.teamId,
        language: this.language,
        profile,
        assignedTeam,
        currentJourney: current.attempt,
      };
    } catch (error) {
      ErrorUtils.mapGameApiError(error, CONTEXT_API_ERROR_STATUS_MAP, CONTEXT_API_ERROR_FALLBACK);
    }
  }
}
