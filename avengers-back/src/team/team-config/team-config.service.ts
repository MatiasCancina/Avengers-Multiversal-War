import { HttpStatus, Injectable } from '@nestjs/common';
import { GameFeatureApiService } from 'src/basic/game-feature-api.service';
import { ApplicationContextService } from 'src/basic/services/application-context.service';
import { TeamConfigurationApi } from 'src/basic/model/game-api/team-configuration.model';
import {
  TeamConfigHeroModel,
  TeamConfigModel,
  TeamConfigSaveModel,
  TeamConfigSlot,
} from './model/team-config.model';
import { HeroApi } from 'src/basic/model/game-api/hero-catalog.model';
import { SaveTeamConfigRequest } from './request/team-config-query.request';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from 'src/basic/error/error.utils';
import { ErrorCode } from 'src/basic/error/error-code.enum';

const TEAM_CONFIG_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.TEAM_CONFIGURATION_UNAVAILABLE,
    message: 'Team configuration is not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.TEAM_CONFIGURATION_LOCKED,
    message: 'Team configuration is locked while the Final Battle is active.',
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    messageCode: ErrorCode.TEAM_CONFIGURATION_INVALID,
    message: 'The Team configuration is not valid.',
  },
};

const TEAM_CONFIG_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.TEAM_CONFIGURATION_UNAVAILABLE,
  message: 'Unable to load the Team configuration right now.',
};

@Injectable()
export class TeamConfigService {
  constructor(
    private context: ApplicationContextService,
    private gameFeatureService: GameFeatureApiService,
  ) {}

  async getConfiguration(): Promise<TeamConfigModel> {
    try {
      const teamId = this.context.getCurrentTeamId();
      const language = this.context.language;

      // 1. Pedir los datos a la Game API
      const [configuration, catalog, strats] = await Promise.all([
        this.gameFeatureService.configuration(teamId),
        this.gameFeatureService.heroes(language),
        this.gameFeatureService.strategies(teamId, language),
      ]);

      const config = configuration.configuration;

      // 2. Buscar los 6 héroes del equipo, cada uno con su posición
      const teamHeroes: TeamConfigHeroModel[] = [];
      for (const hero of catalog.heroes) {
        const slot = this.getSlot(hero.id, config);
        if (slot !== null) {
          teamHeroes.push(this.toTeamHero(hero, slot));
        }
      }

      // 3. Armar la respuesta
      return {
        teamId: configuration.teamId,
        configured: config !== null,
        leader: teamHeroes.find((hero) => hero.slot === 'LEADER') ?? null,
        activeHeroes: teamHeroes.filter((hero) => hero.slot === 'ACTIVE'),
        reserveHeroes: teamHeroes.filter((hero) => hero.slot === 'RESERVE'),
        catalog: catalog.heroes.map((hero) => ({
          id: hero.id,
          displayName: hero.displayName,
          roles: hero.roles,
          eligibility: hero.eligibility,
          slot: this.getSlot(hero.id, config),
        })),
        strategies: strats.strategies.map((strategy) => ({
          code: strategy.code,
          label: strategy.label,
          description: strategy.description,
          selected: strategy.code === config?.strategy,
        })),
        selectedStrategy: config?.strategy ?? null,
        editability: configuration.editability,
        currentAttempt: configuration.currentAttempt,
      } satisfies TeamConfigModel;
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        TEAM_CONFIG_API_ERROR_STATUS_MAP,
        TEAM_CONFIG_API_ERROR_FALLBACK,
      );
    }
  }

  /** Devuelve la posición del héroe en el equipo, o null si no está. */
  private getSlot(heroId: string, config: TeamConfigurationApi | null): TeamConfigSlot | null {
    if (config === null) {
      return null;
    }
    if (heroId === config.leaderId) {
      return 'LEADER';
    }
    if (config.activeHeroIds.includes(heroId)) {
      return 'ACTIVE';
    }
    if (config.companionIds.includes(heroId)) {
      return 'RESERVE';
    }
    return null;
  }

  /** Se queda solo con los datos del héroe que usa la pantalla. */
  private toTeamHero(hero: HeroApi, slot: TeamConfigSlot): TeamConfigHeroModel {
    return {
      id: hero.id,
      displayName: hero.displayName,
      roles: hero.roles,
      stats: hero.stats,
      eligibility: hero.eligibility,
      slot: slot,
    };
  }

  async saveConfiguration(request: SaveTeamConfigRequest): Promise<TeamConfigSaveModel> {
    try {
      const teamId = this.context.getCurrentTeamId();
      const result = await this.gameFeatureService.saveConfiguration(teamId, request);

      return {
        journeyReplaced: result.journeyReplaced,
        configuration: await this.getConfiguration(),
      };
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        TEAM_CONFIG_API_ERROR_STATUS_MAP,
        TEAM_CONFIG_API_ERROR_FALLBACK,
      );
    }
  }
}
