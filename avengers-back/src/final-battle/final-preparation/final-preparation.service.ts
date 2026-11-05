import { Injectable } from '@nestjs/common';

import { ApplicationContextService } from '../../basic/services/application-context.service';
import { GameApiService } from '../../basic/game-api.service';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';

import {
  CurrentJourneyData,
  FinalStageData,
  InventoryData,
  PowerUpCatalogData,
  PurchasePowerUpResult,
  RewardAccountData,
  StrategyCatalogData,
  TournamentTeam,
  TournamentTeamsData,
  UpdateFinalPreparationResult,
  UsePreparationItemResult,
} from './model/final-preparation-api.models';

export interface FinalPreparationPageData {
  hasJourney: boolean;
  teamId: string;
  journey: CurrentJourneyData;
  player: TournamentTeam | null;
  opponent: TournamentTeam | null;
  finalists: TournamentTeamsData['finalists'] | null;
  finalStage: FinalStageData | null;
  teams: TournamentTeamsData | null;
  rewards: RewardAccountData | null;
  inventory: InventoryData | null;
  powerUps: PowerUpCatalogData | null;
  strategies: StrategyCatalogData | null;
}

@Injectable()
export class FinalPreparationService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameApiService,
    private readonly gameFeatures: GameFeatureApiService,
  ) {}

  async getPreparation(): Promise<FinalPreparationPageData> {
    const teamId = this.context.getCurrentTeamId();
    const lang = this.context.language;

    const journey = await this.game.get<CurrentJourneyData>(`/teams/${teamId}/journeys/current`, {
      lang,
    });

    if (!journey.summary || !journey.attempt) {
      return {
        hasJourney: false,
        teamId,
        journey,
        player: null,
        opponent: null,
        finalists: journey.summary?.finalists ?? null,
        finalStage: null,
        teams: null,
        rewards: null,
        inventory: null,
        powerUps: null,
        strategies: null,
      };
    }

    const [teams, rewards, inventory, powerUps, strategies, heroCatalog] = await Promise.all([
      this.game.get<TournamentTeamsData>(`/teams/${teamId}/journeys/current/teams`),
      this.game.get<RewardAccountData>(`/teams/${teamId}/journeys/current/rewards`),
      this.game.get<InventoryData>(`/teams/${teamId}/journeys/current/inventory`),
      this.game.get<PowerUpCatalogData>('/reference/power-ups', {
        lang,
        teamId,
        attemptId: journey.attempt.attemptId,
      }),
      this.game.get<StrategyCatalogData>('/reference/strategies', {
        teamId,
        attemptId: journey.attempt.attemptId,
        lang,
      }),
      this.gameFeatures.heroes(lang),
    ]);

    // Completa los máximos usando el catálogo compartido de héroes.
    // Conserva los valores actuales que devuelve el endpoint de equipos.
    const teamsWithMaxima: TournamentTeamsData = {
      ...teams,
      teams: teams.teams.map((team) => ({
        ...team,
        heroes: team.heroes?.map((hero) => {
          const catalogHero = heroCatalog.heroes.find((item) => item.id === hero.heroId);

          return {
            ...hero,
            maximumEnergy: catalogHero?.maxima.energy,
            maximumAbilityPoints: catalogHero?.maxima.abilityPoints,
          };
        }),
      })),
    };

    const finalStage = await this.game
      .get<FinalStageData>(`/teams/${teamId}/journeys/current/final-stage`, { lang })
      .catch((): null => null);

    const player = teamsWithMaxima.teams.find((team) => team.teamId === teamId) ?? null;

    const opponentId =
      teamsWithMaxima.finalists.opponentTeamId ?? journey.summary.finalists.opponentTeamId;

    const opponent = teamsWithMaxima.teams.find((team) => team.teamId === opponentId) ?? null;

    return {
      hasJourney: true,
      teamId,
      journey,
      player,
      opponent,
      finalists: teamsWithMaxima.finalists ?? journey.summary.finalists,
      finalStage,
      teams: teamsWithMaxima,
      rewards,
      inventory,
      powerUps,
      strategies,
    };
  }

  async getPowerUps(): Promise<PowerUpCatalogData> {
    const teamId = this.context.getCurrentTeamId();

    return this.game.get<PowerUpCatalogData>('/reference/power-ups', {
      lang: this.context.language,
      teamId,
    });
  }

  async updatePreparation(body: {
    activeHeroIds: string[];
    strategy: string;
  }): Promise<UpdateFinalPreparationResult> {
    const teamId = this.context.getCurrentTeamId();

    return this.game.put<UpdateFinalPreparationResult>(
      `/teams/${teamId}/journeys/current/preparation`,
      body,
    );
  }

  async purchase(body: { itemId: string; quantity: number }): Promise<PurchasePowerUpResult> {
    const teamId = this.context.getCurrentTeamId();

    return this.game.post<PurchasePowerUpResult>(
      `/teams/${teamId}/journeys/current/purchases`,
      body,
    );
  }

  async useItem(body: {
    itemId: string;
    targetHeroId?: string;
  }): Promise<UsePreparationItemResult> {
    const teamId = this.context.getCurrentTeamId();

    return this.game.post<UsePreparationItemResult>(
      `/teams/${teamId}/journeys/current/preparation/items`,
      body,
    );
  }
}
