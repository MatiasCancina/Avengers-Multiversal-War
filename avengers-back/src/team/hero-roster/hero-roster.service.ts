import { ApplicationContextService } from '../../basic/services/application-context.service';
import { HttpStatus, Injectable } from '@nestjs/common';

import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ErrorCode } from '../../basic/error/error-code.enum';
import { HeroRosterModel } from './model/hero-roster.model';
import { HeroRosterQueryRequest } from './request/hero-roster-query.request';

const HERO_ROSTER_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.HERO_ROSTER_UNAVAILABLE,
    message: 'Hero roster is not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.HERO_ROSTER_UNAVAILABLE,
    message: 'Hero roster is not available right now.',
  },
};

const HERO_ROSTER_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.HERO_ROSTER_UNAVAILABLE,
  message: 'Unable to load the Hero roster right now.',
};

@Injectable()
export class HeroRosterService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
  ) {}

  async getHeroes(request: HeroRosterQueryRequest): Promise<HeroRosterModel> {
    const teamId = this.context.getCurrentTeamId();
    const language = this.context.language;
    const searchTerm = request.searchTerm?.trim() ?? '';
    const normalizedSearchTerm = searchTerm.toLocaleLowerCase();
    const role = request.role ?? 'ALL';

    try {
      const [configuration, catalog] = await Promise.all([
        this.game.configuration(teamId),
        this.game.heroes(language),
      ]);
      const configuredHeroIds = [
        configuration.configuration.leaderId,
        ...configuration.configuration.companionIds,
      ];
      const relationCatalog = await this.game.relationships(configuredHeroIds);
      const heroes = catalog.heroes.map((hero) => {
        const relationships = relationCatalog.relationships.filter(
          (relationship) => relationship.heroAId === hero.id || relationship.heroBId === hero.id,
        );
        return {
          ...hero,
          allies: relationships
            .filter((relationship) => relationship.relationship === 'ALLY')
            .map((relationship) =>
              relationship.heroAId === hero.id ? relationship.heroBId : relationship.heroAId,
            ),
          rivals: relationships
            .filter((relationship) => relationship.relationship === 'RIVAL')
            .map((relationship) =>
              relationship.heroAId === hero.id ? relationship.heroBId : relationship.heroAId,
            ),
          selected: configuredHeroIds.includes(hero.id),
          leader: hero.id === configuration.configuration.leaderId,
          active: configuration.configuration.activeHeroIds.includes(hero.id),
        };
      });
      const roleCoverage = heroes
        .filter((hero) => hero.selected)
        .reduce<Record<string, number>>((coverage, hero) => {
          coverage[hero.roles.primary] = (coverage[hero.roles.primary] ?? 0) + 1;
          coverage[hero.roles.secondary] = (coverage[hero.roles.secondary] ?? 0) + 1;
          return coverage;
        }, {});
      const filteredHeroes = heroes.filter((hero) => {
        const matchesSearch =
          !normalizedSearchTerm ||
          hero.displayName.toLocaleLowerCase().includes(normalizedSearchTerm) ||
          hero.id.toLocaleLowerCase().includes(normalizedSearchTerm);
        const matchesRole =
          role === 'ALL' || hero.roles.primary === role || hero.roles.secondary === role;
        return matchesSearch && matchesRole;
      });

      const result: HeroRosterModel = {
        configuredTeamId: teamId,
        configuredHeroIds,
        heroes: filteredHeroes,
        totalHeroes: catalog.count,
        visibleHeroes: filteredHeroes.length,
        appliedFilters: { searchTerm, role },
        configuredRelationships: relationCatalog.relationships,
        roleCoverage,
      };
      return result;
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        HERO_ROSTER_API_ERROR_STATUS_MAP,
        HERO_ROSTER_API_ERROR_FALLBACK,
      );
    }
  }
}
