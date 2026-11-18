import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../basic/error/error-code.enum';
import {
  ApiErrorMappingRule,
  ApiErrorStatusMap,
  ErrorUtils,
} from '../../basic/error/error.utils';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { AwardsModel } from '../model/results.model';
import { JourneyStatisticsApi } from 'src/basic/model/game-api/results-contract.model';

const POST_GAME_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.POST_GAME_UNAVAILABLE,
    message: 'Post-game statistics are not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.POST_GAME_UNAVAILABLE,
    message: 'Post-game statistics are not available right now.',
  },
};

const POST_GAME_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.POST_GAME_UNAVAILABLE,
  message: 'Unable to load post-game statistics right now.',
};

@Injectable()
export class AwardsService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
  ) { }

  async getAwards(): Promise<AwardsModel> {
    const teamId = this.context.getCurrentTeamId();
    const language = this.context.language;

    try {
      const [statistics, heroCatalog] = await Promise.all([
        this.game.journeyStatistics(teamId, language),
        this.game.heroes(language),
      ]);

      const heroNames = new Map<string, string>(
        heroCatalog.heroes.map((hero): [string, string] => [hero.id, hero.displayName]),
      );
      
      return this.toAwardsModel(statistics, heroNames, teamId);
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        POST_GAME_API_ERROR_STATUS_MAP,
        POST_GAME_API_ERROR_FALLBACK,
      );
    }
  }

  private toAwardsModel(
    statistics: JourneyStatisticsApi,
    heroNames: Map<string, string>,
    teamId: string,
  ): AwardsModel {
    return {
      attemptId: statistics.attemptId,
      outcomeCode: statistics.completionOutcome,
      awards: statistics.awards.map((award) => ({
        code: award.code,
        label: award.label,
        explanation: award.explanation,
        reason: award.reason,
        metricCode: award.winningFacts?.metricCode ?? null,
        value: award.winningFacts?.value ?? null,
        winner: award.winner
          ? {
              teamId: award.winner.teamId,
              heroId: award.winner.heroId,
              heroName: heroNames.get(award.winner.heroId) ?? award.winner.heroId,
              isPlayerTeam: award.winner.teamId === teamId,
            }
          : null,
      })),
    };
  }
}
