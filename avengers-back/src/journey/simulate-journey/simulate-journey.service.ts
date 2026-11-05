import { ApplicationContextService } from '../../basic/services/application-context.service';
import { HttpStatus, Injectable } from '@nestjs/common';

import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { SimulateJourneyRequest } from './request/simulate-journey.request';
import { SimulateJourneyModel } from './model/simulate-journey.model';

const SIMULATION_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.JOURNEY_SIMULATION_UNAVAILABLE,
    message: 'Journey simulation is not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.JOURNEY_SIMULATION_UNAVAILABLE,
    message: 'Journey simulation is not available right now.',
  },
};

const SIMULATION_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.JOURNEY_SIMULATION_UNAVAILABLE,
  message: 'Unable to simulate the Journey right now.',
};

@Injectable()
export class SimulateJourneyService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
  ) {}

  async getSimulation(receipt?: SimulateJourneyModel['receipt']): Promise<SimulateJourneyModel> {
    const teamId = this.context.getCurrentTeamId();
    const language = this.context.language;
    try {
      const [configuration, current, catalog, profile] = await Promise.all([
        this.game.configuration(teamId),
        this.game.currentJourney(teamId, language),
        this.game.heroes(language),
        this.game.profile(teamId, language),
      ]);
      const attempt = current.attempt;
      const teams = attempt ? await this.game.currentTeams(teamId) : null;
      const names = new Map((teams?.teams ?? []).map((team) => [team.teamId, team.name]));
      const teamHeroes = new Map((teams?.teams ?? []).map((team) => [team.teamId, team.heroIds]));
      const playerTeamId = attempt?.finalistIds?.[0] ?? teamId;
      const configuredIds = configuration.configuration
        ? [configuration.configuration.leaderId, ...configuration.configuration.companionIds]
        : [];
      const playerHeroIds = teamHeroes.get(playerTeamId) ?? configuredIds;
      const heroNames = new Map(catalog.heroes.map((hero) => [hero.id, hero.displayName]));
      const playerTeam = teams?.teams.find((team) => team.teamId === playerTeamId);
      const teamLeaders = new Map((teams?.teams ?? []).map((team) => [team.teamId, team.leaderId]));
      const result: SimulateJourneyModel = {
        teamId,
        configuration: configuration.configuration,
        currentAttempt: attempt
          ? {
              id: attempt.id,
              status: attempt.status,
              spendingStrategy: attempt.spendingStrategy,
              stageCount: attempt.stageCount,
              encounterCount: attempt.encounterCount,
              finalists: attempt.finalistIds.map((id) => ({
                id,
                name: names.get(id) ?? id,
                heroes: (teamHeroes.get(id) ?? []).map((heroId) => ({
                  id: heroId,
                  name: heroNames.get(heroId) ?? heroId,
                  leader: heroId === teamLeaders.get(id),
                })),
              })),
            }
          : null,
        playerTeam: {
          id: playerTeamId,
          name: playerTeam?.name ?? names.get(playerTeamId) ?? profile.name,
          heroes: playerHeroIds.map((heroId) => ({
            id: heroId,
            name: heroNames.get(heroId) ?? heroId,
            leader: heroId === (configuration.configuration?.leaderId ?? playerTeamId),
          })),
        },
        canSimulate: attempt?.status !== 'FINAL_ACTIVE',
        reason:
          attempt?.status === 'FINAL_ACTIVE'
            ? language === 'es'
              ? 'FinalStage está activo.'
              : 'FinalStage is active.'
            : null,
        spendingStrategies: ['SAVE', 'BALANCED', 'AGGRESSIVE'],
        ...(receipt ? { receipt } : {}),
      };
      return result;
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        SIMULATION_API_ERROR_STATUS_MAP,
        SIMULATION_API_ERROR_FALLBACK,
      );
    }
  }

  async simulateJourney(request: SimulateJourneyRequest): Promise<SimulateJourneyModel> {
    const teamId = this.context.getCurrentTeamId();
    try {
      const simulationReceipt = await this.game.simulate(teamId, {
        spendingStrategy: request.spendingStrategy,
      });
      const result: SimulateJourneyModel = await this.getSimulation({
        attemptId: simulationReceipt.attemptId,
        replacedPrevious: simulationReceipt.replacedPrevious,
      });
      return result;
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        SIMULATION_API_ERROR_STATUS_MAP,
        SIMULATION_API_ERROR_FALLBACK,
      );
    }
  }
}
