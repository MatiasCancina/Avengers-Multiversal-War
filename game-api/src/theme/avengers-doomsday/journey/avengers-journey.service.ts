import { createHash, randomInt, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { GameError } from '../../../basic/error/game-error';
import { GameErrorCode } from '../../../basic/error/game-error-code.enum';
import { FinalStageStatus } from '../../../final-stage/model/final-stage-status.enum';
import { PlayCommand } from '../../../final-stage/model/engine-play-input.model';
import { JourneyAttemptEntity } from '../../../journey/entity/journey-attempt.entity';
import { TeamMemberStatus } from '../../../teams/model/team-member-status.enum';
import { TeamProfileEntity } from '../../../teams/entity/team-profile.entity';
import { AvengersCatalogQueryService } from '../catalog/avengers-catalog-query.service';
import { AvengersGameEngine } from '../avengers-game-engine';
import { AvengersNarrative } from '../avengers-narrative.service';
import { AvengersAction } from '../model/avengers-action.model';
import { AvengersEvent } from '../model/avengers-event.model';
import { AvengersStrategy } from '../model/avengers-strategy.enum';
import { AvengersEndingCode } from '../model/avengers-ending-code.enum';
import { AvengersRuleError } from '../error/avengers-rule.error';
import { AvengersTeamState } from '../model/avengers-team-state.model';
import { DoomState } from '../model/doom-state.model';
import { AvengersPublicLocalization } from '../public/avengers-public-localization.service';
import { AVENGERS_POWER_UPS } from '../store/avengers-power-up.catalog';
import { AvengersJourneyMetadataMapper } from './mapper/avengers-journey-metadata.mapper';
import {
  CompletedFinalStateModel,
  CompletedFinalTeamsDataModel,
  DoomsdayFinalStateModel,
  DoomsdayFinalTeamsDataModel,
  FinalStageCommandReceiptModel,
  FinalStageEventsDataModel,
  LegalFinalStageActionsDataModel,
  TournamentFinalStateModel,
  TournamentFinalTeamsDataModel,
} from './model/avengers-public-final-stage.model';
import {
  AvengersJourneyMetadata,
  AvengersJourneyEvent,
  AvengersEncounter,
  AvengersInventoryEntry,
  AvengersRoundFact,
  AvengersAwardDecision,
  AvengersHeroStatisticsFacts,
  AvengersTeamConfiguration,
  AvengersTournamentTeam,
} from './model/avengers-journey-metadata.model';
import { JourneySpendingStrategy } from './model/journey-spending-strategy.enum';
import {
  CurrentJourneyDataModel,
  EncounterDetailModel,
  EncounterSummaryDataModel,
  InventoryDataModel,
  JourneyEventsDataModel,
  JourneyStagesDataModel,
  JourneySummaryModel,
  PurchasePowerUpResultModel,
  RewardAccountDataModel,
  SimulateJourneyResultModel,
  TournamentTeamsDataModel,
  UpdateFinalPreparationResultModel,
  UsePreparationItemResultModel,
} from './model/avengers-public-journey.model';
import {
  CompletedJourneyHistoryDataModel,
  SaveTeamConfigurationResultModel,
  TeamConfigurationDataModel,
} from './model/avengers-public-team.model';
import { CompetitionStatisticsDataModel } from './model/avengers-public-statistics.model';
import { AvengersJourneySimulator } from './avengers-journey-simulator.service';
import { AvengersStatisticsService } from './avengers-statistics.service';
import { SaveTeamConfigurationRequest } from './request/save-team-configuration.request';
import { PurchasePowerUpRequest } from './request/purchase-power-up.request';
import { SimulateJourneyRequest } from './request/simulate-journey.request';
import { UpdateFinalPreparationRequest } from './request/update-final-preparation.request';
import { UsePowerUpRequest } from './request/use-power-up.request';

@Injectable()
export class AvengersJourneyService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly catalog: AvengersCatalogQueryService,
    private readonly simulator: AvengersJourneySimulator,
    private readonly mapper: AvengersJourneyMetadataMapper,
    private readonly engine: AvengersGameEngine,
    private readonly narrative: AvengersNarrative,
    private readonly statistics: AvengersStatisticsService,
    private readonly localization: AvengersPublicLocalization,
  ) {}

  async configuration(teamId: string): Promise<TeamConfigurationDataModel> {
    const profile = await this.profile(teamId);
    const current = profile.currentAttemptId
      ? await this.attempt(profile.currentAttemptId, teamId)
      : null;
    const locked = current?.status === 'FINAL_ACTIVE';
    const result: TeamConfigurationDataModel = {
      teamId,
      configured: profile.metadata !== null,
      configuration: profile.metadata
        ? this.publicConfiguration(this.configurationFrom(profile))
        : null,
      currentAttempt: current ? this.attemptReference(current) : null,
      editability: {
        members: !locked,
        formation: !locked,
        strategy: !locked,
      },
    };

    return result;
  }

  async saveConfiguration(
    teamId: string,
    request: SaveTeamConfigurationRequest,
  ): Promise<SaveTeamConfigurationResultModel> {
    const profile = await this.profile(teamId);
    const existing = profile.currentAttemptId
      ? await this.attempt(profile.currentAttemptId, teamId)
      : null;
    const current = this.configurationFrom(profile);
    const next: AvengersTeamConfiguration = {
      ...current,
      companionIds: [...request.companionIds],
      activeHeroIds: [...request.activeHeroIds],
      strategy: request.strategy,
    };
    await this.validateConfiguration(teamId, next);
    const memberChanged =
      current.companionIds.slice().sort().join('|') !== next.companionIds.slice().sort().join('|');
    if (existing?.status === 'FINAL_ACTIVE') {
      throw new GameError(
        GameErrorCode.JOURNEY_LOCKED,
        'Team configuration is locked while FinalStage is active.',
      );
    }
    if (existing?.status === 'PRE_FINAL' && memberChanged) {
      const previous = this.mapper.fromStorage(existing.metadata);
      const replacement = await this.simulation(
        teamId,
        next,
        previous.seed,
        previous.spendingStrategy,
      );
      const nextId = randomUUID();
      await this.dataSource.transaction(async (manager) => {
        await this.casProfile(
          manager,
          teamId,
          profile.configurationRevision,
          profile.contextRevision,
          next,
          nextId,
        );
        await manager
          .getRepository(JourneyAttemptEntity)
          .save(this.entity(nextId, teamId, replacement));
        await manager
          .getRepository(JourneyAttemptEntity)
          .delete({ id: existing.id, teamId, status: 'PRE_FINAL' });
      });
      const result: SaveTeamConfigurationResultModel = {
        teamId,
        configuration: this.publicConfiguration(next),
        journeyReplaced: true,
        currentAttempt: {
          attemptId: nextId,
          status: 'PRE_FINAL',
        },
      };

      return result;
    }
    await this.dataSource.transaction(async (manager) => {
      await this.casProfile(
        manager,
        teamId,
        profile.configurationRevision,
        profile.contextRevision,
        next,
        profile.currentAttemptId,
      );
      if (existing?.status === 'PRE_FINAL') {
        const metadata = this.mapper.fromStorage(existing.metadata);
        this.applyPreparation(metadata, next);
        await this.casAttempt(manager, existing, metadata, 'PRE_FINAL');
      }
    });
    const result: SaveTeamConfigurationResultModel = {
      teamId,
      configuration: this.publicConfiguration(next),
      journeyReplaced: false,
      currentAttempt: existing
        ? {
            attemptId: existing.id,
            status: existing.status,
          }
        : null,
    };

    return result;
  }

  async simulate(
    teamId: string,
    request: SimulateJourneyRequest,
  ): Promise<SimulateJourneyResultModel> {
    const { spendingStrategy: strategy } = request;
    const profile = await this.profile(teamId);
    const old = profile.currentAttemptId
      ? await this.attempt(profile.currentAttemptId, teamId)
      : null;
    const config = this.configurationFrom(profile);
    await this.validateConfiguration(teamId, config);
    const resolvedSeed = randomInt(0, 0x100000000);
    const metadata = await this.simulation(teamId, config, resolvedSeed, strategy);
    const id = randomUUID();
    if (old?.status === 'FINAL_ACTIVE') {
      throw new GameError(GameErrorCode.JOURNEY_LOCKED, 'An active FinalStage cannot be replaced.');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(JourneyAttemptEntity).save(this.entity(id, teamId, metadata));
      const updated = await manager
        .getRepository(TeamProfileEntity)
        .createQueryBuilder()
        .update()
        .set({
          currentAttemptId: id,
          contextRevision: () => 'contextRevision + 1',
          updatedAt: new Date(),
        })
        .where(
          'id = :teamId AND configurationRevision = :configurationRevision AND contextRevision = :contextRevision',
          {
            teamId,
            configurationRevision: profile.configurationRevision,
            contextRevision: profile.contextRevision,
          },
        )
        .andWhere(
          profile.currentAttemptId === null
            ? 'currentAttemptId IS NULL'
            : 'currentAttemptId = :currentAttemptId',
          profile.currentAttemptId === null ? {} : { currentAttemptId: profile.currentAttemptId },
        )
        .execute();
      if (updated.affected !== 1) {
        throw new GameError(
          GameErrorCode.STATE_CONFLICT,
          'Team configuration changed while Journey was simulated.',
        );
      }
      if (old && old.status !== 'COMPLETED') {
        await manager.getRepository(JourneyAttemptEntity).delete({ id: old.id, teamId });
      }
    });
    const result: SimulateJourneyResultModel = {
      attemptId: id,
      teamId,
      status: 'PRE_FINAL',
      spendingStrategyCode: strategy,
      playerQualified: true,
      finalists: this.finalists(metadata, teamId),
      summary: {
        stagesCompleted: this.stageCount(metadata),
        encountersSimulated: metadata.encounters.length,
        playerRewardPointsRemaining: this.player(metadata, teamId).rewardPoints,
      },
      replacedPrevious: old !== null,
    };

    return result;
  }

  async current(teamId: string): Promise<CurrentJourneyDataModel> {
    const profile = await this.profile(teamId);
    if (!profile.currentAttemptId) {
      const result: CurrentJourneyDataModel = { teamId, attempt: null, summary: null };
      return result;
    }
    const attempt = await this.attemptRequired(profile.currentAttemptId, teamId);
    const result: CurrentJourneyDataModel = {
      teamId,
      attempt: this.currentReference(attempt),
      summary: this.safeCurrentSummary(attempt, this.mapper.fromStorage(attempt.metadata)),
    };

    return result;
  }

  async currentAttemptId(teamId: string): Promise<string> {
    const profile = await this.profile(teamId);
    if (!profile.currentAttemptId) {
      throw new GameError(GameErrorCode.JOURNEY_REQUIRED, 'No current Journey exists.');
    }
    return profile.currentAttemptId;
  }

  async journey(teamId: string, attemptId: string): Promise<JourneySummaryModel> {
    const attempt = await this.attemptRequired(attemptId, teamId);
    const data = this.mapper.fromStorage(attempt.metadata);
    return this.journeySummary(attempt, data);
  }

  async teams(teamId: string, attemptId: string): Promise<TournamentTeamsDataModel> {
    const data = await this.metadata(attemptId, teamId);
    const result: TournamentTeamsDataModel = {
      attemptId,
      teams: data.teams.map((team) => this.publicTournamentTeam(team)),
      finalists: this.finalists(data, teamId),
    };

    return result;
  }

  async stages(teamId: string, attemptId: string): Promise<JourneyStagesDataModel> {
    const data = await this.metadata(attemptId, teamId);
    const groups = data.stages
      .filter((stage) => stage.type === 'GROUP_STAGE')
      .map((stage) => ({
        groupId: stage.groupId!,
        encounterIds: [...stage.encounterIds],
        standings: [...stage.standings]
          .sort(
            (a, b) =>
              b.points - a.points ||
              b.damageDifference - a.damageDifference ||
              b.damageDealt - a.damageDealt ||
              a.tieRank - b.tieRank,
          )
          .map((standing, index) => ({
            position: index + 1,
            teamId: standing.teamId,
            played: standing.played,
            wins: standing.wins,
            draws: standing.draws,
            losses: standing.losses,
            points: standing.points,
            damageDealt: standing.damageDealt,
            damageReceived: standing.damageReceived,
            damageDifference: standing.damageDifference,
            tieBreakRank: standing.tieRank,
            qualified: standing.qualified,
          })),
      }));
    const rounds = (['ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL'] as const).map((stageCode) => ({
      stageCode,
      matches: data.stages
        .filter((stage) => stage.type === stageCode)
        .flatMap((stage) => stage.encounterIds)
        .map((id) => data.encounters.find((encounter) => encounter.id === id))
        .filter((encounter): encounter is NonNullable<typeof encounter> => Boolean(encounter))
        .map((encounter, index) => ({
          slot: index + 1,
          encounterId: encounter.id,
          teamAId: encounter.teamAId,
          teamBId: encounter.teamBId,
          winnerTeamId: encounter.winnerTeamId!,
          nextStageCode: this.nextStageCode(stageCode),
          nextSlot: Math.floor(index / 2) + 1,
        })),
    }));
    const result: JourneyStagesDataModel = {
      attemptId,
      groupStage: { groups },
      knockout: { rounds },
      finalists: this.finalists(data, teamId),
    };

    return result;
  }

  async encounters(
    teamId: string,
    attemptId: string,
    stageId?: string,
  ): Promise<EncounterSummaryDataModel> {
    const data = await this.metadata(attemptId, teamId);
    const result: EncounterSummaryDataModel = {
      attemptId,
      encounters: data.encounters
        .filter((encounter) => !stageId || encounter.stageId === stageId)
        .map((encounter) => this.encounterSummary(encounter)),
    };

    return result;
  }

  async encounter(
    teamId: string,
    attemptId: string,
    encounterId: string,
    lang = 'en',
  ): Promise<EncounterDetailModel> {
    const data = await this.metadata(attemptId, teamId);
    const value = data.encounters.find((item) => item.id === encounterId);
    if (!value) {
      throw new GameError(GameErrorCode.RESOURCE_NOT_FOUND, 'Encounter was not found.');
    }
    const result: EncounterDetailModel = {
      ...this.encounterSummary(value),
      rounds: value.rounds.map((round) => this.publicRound(round, value, lang, 'NORMAL', data)),
      extraRound: value.extraRound
        ? this.publicRound(value.extraRound, value, lang, 'EXTRA_ROUND', data)
        : null,
      resourceConsequences: value.resourceConsequences ?? [],
      rewardEntries: data.rewardLedger
        .filter((entry) => entry.encounterId === value.id && entry.amount > 0)
        .map((entry) => ({
          teamId: entry.teamId,
          reasonCode: entry.reason,
          amount: entry.amount,
        })),
      statGains: value.statGains.map((gain) => ({
        teamId: gain.teamId,
        heroId: gain.heroId,
        statCode: gain.stat.toUpperCase(),
        amount: gain.amount,
      })),
    };

    return result;
  }

  async events(teamId: string, attemptId: string, lang = 'en'): Promise<JourneyEventsDataModel> {
    const language = this.localization.language(lang);
    const metadata = await this.metadata(attemptId, teamId);
    const result: JourneyEventsDataModel = {
      attemptId,
      language,
      events: metadata.events.map((event) => this.publicJourneyEvent(event, language, metadata)),
    };

    return result;
  }

  async rewards(teamId: string, attemptId: string): Promise<RewardAccountDataModel> {
    const data = await this.metadata(attemptId, teamId);
    const account = this.player(data, teamId);
    const ledger = data.rewardLedger.filter((entry) => entry.teamId === teamId);
    const result: RewardAccountDataModel = {
      attemptId,
      teamId,
      earned: ledger
        .filter((entry) => entry.amount > 0)
        .reduce((sum, entry) => sum + entry.amount, 0),
      spent: ledger
        .filter((entry) => entry.amount < 0)
        .reduce((sum, entry) => sum - entry.amount, 0),
      balance: account.rewardPoints,
      ledger: ledger.map((entry) => ({
        entryId: entry.id,
        encounterId: entry.encounterId,
        reasonCode: entry.reason,
        amount: entry.amount,
        balanceAfter: entry.balanceAfter,
      })),
    };

    return result;
  }

  async inventory(teamId: string, attemptId: string): Promise<InventoryDataModel> {
    const attempt = await this.attemptRequired(attemptId, teamId);
    const data = this.mapper.fromStorage(attempt.metadata);
    const team = this.player(data, teamId);
    const result: InventoryDataModel = {
      attemptId,
      teamId,
      items: team.inventory.map((entry) => this.publicInventoryEntry(entry)),
    };

    return result;
  }

  async purchase(
    teamId: string,
    attemptId: string,
    request: PurchasePowerUpRequest,
  ): Promise<PurchasePowerUpResultModel> {
    return this.mutate(teamId, attemptId, 'PRE_FINAL', (metadata) => {
      const item = AVENGERS_POWER_UPS.find((value) => value.id === request.itemId);
      if (!item) {
        throw new GameError(GameErrorCode.POWER_UP_UNAVAILABLE, 'Power-Up was not found.');
      }
      const team = this.player(metadata, teamId);
      const total = item.price * request.quantity;
      if (team.rewardPoints < total) {
        throw new GameError(
          GameErrorCode.INSUFFICIENT_REWARD_POINTS,
          'The Team does not have enough Reward Points.',
        );
      }
      team.rewardPoints -= total;
      const existing = team.inventory.find((value) => value.itemId === item.id);
      if (existing) {
        existing.quantity += request.quantity;
      } else {
        team.inventory.push({ itemId: item.id, quantity: request.quantity });
      }
      this.syncPreparedTeam(metadata, teamId);
      metadata.rewardLedger.push({
        id: `ledger-${metadata.rewardLedger.length + 1}`,
        teamId,
        encounterId: null,
        reason: 'PURCHASE',
        amount: -total,
        balanceAfter: team.rewardPoints,
      });
      return {
        teamId,
        rewardPoints: team.rewardPoints,
        purchasedItemId: request.itemId,
        purchasedQuantity: request.quantity,
        items: team.inventory.map((entry) => this.publicInventoryEntry(entry)),
      };
    });
  }

  async usePowerUp(
    teamId: string,
    attemptId: string,
    request: UsePowerUpRequest,
  ): Promise<UsePreparationItemResultModel> {
    return this.mutate(teamId, attemptId, 'PRE_FINAL', (metadata) => {
      const team = this.player(metadata, teamId);
      const inventory = team.inventory.find(
        (value) => value.itemId === request.itemId && value.quantity > 0,
      );
      const definition = AVENGERS_POWER_UPS.find((value) => value.id === request.itemId);
      if (!inventory || !definition) {
        throw new GameError(
          GameErrorCode.POWER_UP_UNAVAILABLE,
          'Power-Up is not available in inventory.',
        );
      }
      if (definition.target === 'HERO' && !request.targetHeroId) {
        throw new GameError(
          GameErrorCode.POWER_UP_UNAVAILABLE,
          'This Power-Up requires a Hero target.',
        );
      }
      if (definition.target === 'TEAM' && request.targetHeroId) {
        throw new GameError(
          GameErrorCode.POWER_UP_UNAVAILABLE,
          'This Power-Up targets the Active Team.',
        );
      }
      const hero = request.targetHeroId
        ? team.heroes.find((value) => value.heroId === request.targetHeroId)
        : undefined;
      const content = hero
        ? metadata.content.heroes.find((value) => value.id === hero.heroId)
        : undefined;
      const activeHeroes = team.heroes.filter((value) => value.active && !value.knockedOut);
      const targets =
        definition.target === 'HERO'
          ? hero && content
            ? [{ hero, content }]
            : []
          : activeHeroes.flatMap((activeHero) => {
              const activeContent = metadata.content.heroes.find(
                (value) => value.id === activeHero.heroId,
              );
              return activeContent ? [{ hero: activeHero, content: activeContent }] : [];
            });
      if (definition.target === 'TEAM' && !targets.length) {
        throw new GameError(
          GameErrorCode.POWER_UP_UNAVAILABLE,
          'No Active Hero can receive this Power-Up.',
        );
      }
      const usefulTargets = targets.filter(({ hero: target }) => {
        switch (definition.effect.type) {
          case 'ENERGY':
            return (
              !target.knockedOut &&
              target.currentEnergy <
                metadata.content.heroes.find((entry) => entry.id === target.heroId)!.maxEnergy
            );
          case 'AP':
          case 'AP_PERCENT':
          case 'FULL_AP':
            return (
              !target.knockedOut &&
              target.currentAbilityPoints <
                metadata.content.heroes.find((entry) => entry.id === target.heroId)!
                  .maxAbilityPoints
            );
          case 'REVIVE':
            return target.knockedOut;
          default:
            return !target.knockedOut;
        }
      });
      if (!usefulTargets.length) {
        throw new GameError(
          GameErrorCode.POWER_UP_UNAVAILABLE,
          'Power-Up would have no useful effect.',
        );
      }
      switch (definition.effect.type) {
        case 'ENERGY':
          for (const { hero: target, content: targetContent } of usefulTargets) {
            target.currentEnergy = Math.min(
              targetContent.maxEnergy,
              target.currentEnergy +
                Math.max(
                  1,
                  Math.round((targetContent.maxEnergy * definition.effect.percent) / 100),
                ),
            );
          }
          break;
        case 'AP_PERCENT':
          for (const { hero: target, content: targetContent } of usefulTargets) {
            target.currentAbilityPoints = Math.min(
              targetContent.maxAbilityPoints,
              target.currentAbilityPoints +
                Math.max(
                  1,
                  Math.round((targetContent.maxAbilityPoints * definition.effect.percent) / 100),
                ),
            );
          }
          break;
        case 'AP':
          for (const { hero: target, content: targetContent } of usefulTargets) {
            target.currentAbilityPoints = Math.min(
              targetContent.maxAbilityPoints,
              target.currentAbilityPoints + definition.effect.amount,
            );
          }
          break;
        case 'FULL_AP':
          for (const { hero: target, content: targetContent } of usefulTargets) {
            target.currentAbilityPoints = targetContent.maxAbilityPoints;
          }
          break;
        case 'REVIVE': {
          const target = usefulTargets[0];
          target.hero.knockedOut = false;
          target.hero.currentEnergy = Math.max(1, Math.round(target.content.maxEnergy * 0.4));
          target.hero.currentAbilityPoints = Math.round(target.content.maxAbilityPoints * 0.25);
          target.hero.active = false;
          break;
        }
        case 'BOOST':
          team.temporaryEffects.push({
            stat: definition.effect.stat,
            percent: definition.effect.percent,
            remainingRounds: definition.effect.duration,
            ...(definition.target === 'TEAM'
              ? { heroIds: usefulTargets.map(({ hero: target }) => target.heroId) }
              : {}),
          });
          break;
        case 'EXTRA_TEAM_ACTION':
          team.extraTeamActions++;
          metadata.finalStage.data.player.teamActionsRemaining++;
          break;
        case 'EXTRA_LEADER_ABILITY':
          team.extraLeaderAbilities++;
          metadata.finalStage.data.player.leaderAbilityUsesRemaining++;
          break;
      }
      inventory.quantity--;
      this.syncPreparedTeam(metadata, teamId);
      return {
        teamId,
        usedItemId: request.itemId,
        targetHeroId: request.targetHeroId ?? null,
        items: team.inventory.map((entry) => this.publicInventoryEntry(entry)),
      };
    });
  }

  async updatePreparation(
    teamId: string,
    attemptId: string,
    request: UpdateFinalPreparationRequest,
  ): Promise<UpdateFinalPreparationResultModel> {
    return this.mutate(
      teamId,
      attemptId,
      'PRE_FINAL',
      (metadata) => {
        const configuration = metadata.initialConfiguration;
        const allHeroIds = [configuration.leaderId, ...configuration.companionIds];
        if (
          request.activeHeroIds.length !== 3 ||
          new Set(request.activeHeroIds).size !== 3 ||
          !request.activeHeroIds.includes(configuration.leaderId) ||
          request.activeHeroIds.some((heroId) => !allHeroIds.includes(heroId))
        ) {
          throw new GameError(
            GameErrorCode.INVALID_TEAM_CONFIGURATION,
            'Choose exactly three distinct ACTIVE Heroes, including the assigned Leader.',
          );
        }
        const next = {
          ...configuration,
          activeHeroIds: [...request.activeHeroIds],
          strategy: request.strategy,
        };
        this.applyPreparation(metadata, next);
        return {
          strategyCode: request.strategy,
          activeHeroIds: [...request.activeHeroIds],
        };
      },
      GameErrorCode.INVALID_LIFECYCLE,
    );
  }

  async finalState(
    teamId: string,
    attemptId: string,
    lang = 'en',
  ): Promise<TournamentFinalStateModel | DoomsdayFinalStateModel | CompletedFinalStateModel> {
    const attempt = await this.attemptRequired(attemptId, teamId);
    const metadata = this.mapper.fromStorage(attempt.metadata);
    return this.publicFinalState(attempt, metadata, lang);
  }

  async finalTeams(
    teamId: string,
    attemptId: string,
  ): Promise<
    TournamentFinalTeamsDataModel | DoomsdayFinalTeamsDataModel | CompletedFinalTeamsDataModel
  > {
    const attempt = await this.attemptRequired(attemptId, teamId);
    if (attempt.status === 'PRE_FINAL') {
      throw new GameError(
        GameErrorCode.FINAL_STAGE_NOT_ACTIVE,
        'FinalStage Team state is available after the final has started.',
      );
    }
    const metadata = this.mapper.fromStorage(attempt.metadata);
    const data = metadata.finalStage.data;
    const common = {
      attemptId,
      player: this.publicFinalTeam(data.player),
      opponent: this.publicFinalTeam(data.opponent),
    };
    if (!data.revealOccurred) {
      return { variant: 'TOURNAMENT_FINAL', ...common };
    }
    if (attempt.status === 'COMPLETED') {
      return {
        variant: 'COMPLETED',
        ...common,
        ...(data.doom ? { doom: this.publicDoom(data.doom) } : {}),
      };
    }
    return {
      variant: 'DOOMSDAY',
      ...common,
      doom: this.publicDoom(data.doom!),
    };
  }

  async finalActions(
    teamId: string,
    attemptId: string,
    lang = 'en',
    actionCode?: string,
  ): Promise<LegalFinalStageActionsDataModel> {
    const attempt = await this.attemptRequired(attemptId, teamId);
    const metadata = this.mapper.fromStorage(attempt.metadata);
    const data = metadata.finalStage.data;
    if (attempt.status !== 'FINAL_ACTIVE') {
      throw new GameError(
        GameErrorCode.FINAL_STAGE_NOT_ACTIVE,
        'FinalStage actions are available only while the final is active.',
      );
    }
    const language = this.localization.language(lang);
    const result: LegalFinalStageActionsDataModel = {
      attemptId,
      phase: data.phase,
      normalTurn: metadata.finalStage.turn,
      language,
      actions: data.availableActions
        .filter((action) => !actionCode || action.type === actionCode)
        .map((action) => this.publicFinalAction(action, language, metadata, attempt)),
    };

    return result;
  }

  async finalEvents(
    teamId: string,
    attemptId: string,
    lang = 'en',
  ): Promise<FinalStageEventsDataModel> {
    const data = await this.metadata(attemptId, teamId);
    const language = this.localization.language(lang);
    const result: FinalStageEventsDataModel = {
      attemptId,
      language,
      events: data.finalStage.data.timeline.map((event, index) =>
        this.publicFinalEvent(event, index + 1, language, data),
      ),
    };

    return result;
  }

  async play(
    teamId: string,
    attemptId: string,
    command: PlayCommand,
    lang = 'en',
  ): Promise<FinalStageCommandReceiptModel> {
    const expectedStatus = command.type === 'START' ? 'PRE_FINAL' : 'FINAL_ACTIVE';
    const attempt = await this.attemptRequired(attemptId, teamId);
    if (attempt.status !== expectedStatus) {
      throw new GameError(
        GameErrorCode.INVALID_LIFECYCLE,
        'The command is invalid for the current Journey lifecycle.',
      );
    }
    if (command.type === 'CHOOSE_ACTION' && !command.actionId) {
      throw new GameError(GameErrorCode.INVALID_FINAL_ACTION, 'Choose one currently legal action.');
    }
    const metadata = this.mapper.fromStorage(attempt.metadata);
    if (command.type === 'CHOOSE_ACTION') {
      const selectedActionId = command.actionId;
      const legalAction = metadata.finalStage.data.availableActions.find(
        (action) => this.publicActionId(attempt, action.id) === selectedActionId,
      );
      if (!legalAction) {
        throw new GameError(
          GameErrorCode.INVALID_FINAL_ACTION,
          'Selected action is no longer legal.',
        );
      }
      command = { type: 'CHOOSE_ACTION', actionId: legalAction.id };
    }
    if (command.type === 'START') {
      this.applyPreparation(metadata, metadata.initialConfiguration);
      if (
        !this.isValidInitialFinalFormation(metadata.finalStage.data.player, true) ||
        !this.isValidInitialFinalFormation(metadata.finalStage.data.opponent, false)
      ) {
        throw new GameError(
          GameErrorCode.INVALID_TEAM_CONFIGURATION,
          'FinalStage cannot start with an invalid Active/Reserve formation.',
        );
      }
    }
    const previousTimelineLength = metadata.finalStage.data.timeline.length;
    try {
      metadata.finalStage = await this.engine.play({ current: metadata.finalStage, command });
    } catch (error) {
      if (error instanceof AvengersRuleError && error.code === 'POWER_UP_UNAVAILABLE') {
        throw new GameError(GameErrorCode.POWER_UP_UNAVAILABLE, error.message);
      }
      throw error instanceof GameError
        ? error
        : new GameError(
            GameErrorCode.INVALID_FINAL_ACTION,
            error instanceof Error ? error.message : 'Invalid FinalStage action.',
          );
    }
    this.syncFinalStageInventory(metadata, teamId);
    const completed = metadata.finalStage.status === FinalStageStatus.COMPLETED;
    if (completed) {
      metadata.completionReason = metadata.finalStage.data.outcome;
      metadata.endingCode = metadata.finalStage.data.endingCode;
      metadata.terminalReasonCode = metadata.finalStage.data.terminalReasonCode;
      metadata.completedAt = new Date().toISOString();
      metadata.statistics = this.statistics.project(metadata);
    }
    const nextStatus = completed ? 'COMPLETED' : 'FINAL_ACTIVE';
    await this.dataSource.transaction((manager) =>
      this.casAttempt(manager, attempt, metadata, nextStatus),
    );
    const language = this.localization.language(lang);
    const result: FinalStageCommandReceiptModel = {
      phase: metadata.finalStage.data.phase,
      normalTurn: metadata.finalStage.turn,
      status: completed ? 'COMPLETED' : 'ACTIVE',
      completionOutcome: metadata.completionReason,
      endingCode: metadata.endingCode,
      terminalReasonCode: metadata.terminalReasonCode,
      emittedEvents: metadata.finalStage.data.timeline
        .slice(previousTimelineLength)
        .map((event, index) =>
          this.publicFinalEvent(event, previousTimelineLength + index + 1, language, metadata),
        ),
      nextDecisionRequired: nextStatus === 'FINAL_ACTIVE',
    };

    return result;
  }

  async statisticsView(
    teamId: string,
    attemptId: string,
    lang = 'en',
  ): Promise<CompetitionStatisticsDataModel> {
    const attempt = await this.attemptRequired(attemptId, teamId);
    const data = this.mapper.fromStorage(attempt.metadata);
    if (!data.statistics) {
      throw new GameError(
        GameErrorCode.STATISTICS_UNAVAILABLE,
        'Statistics are available after FinalStage completion.',
      );
    }
    const language = this.localization.language(lang);
    const result: CompetitionStatisticsDataModel = {
      attemptId,
      status: 'COMPLETED',
      completionOutcome: data.completionReason!,
      endingCode: data.endingCode ?? AvengersEndingCode.NORMAL_VICTORY,
      terminalReasonCode: data.terminalReasonCode,
      completedAt: attempt.completedAt?.toISOString() ?? data.completedAt!,
      language,
      eligibility: {
        minimumStageCode: 'QUARTERFINAL',
        eligibleTeamIds: data.statistics.eligibleTeamIds,
      },
      competition: {
        journeyEncounters: data.encounters.length,
        finalStagePlayed:
          data.finalStage.data.cycleFacts.length > 0 || data.finalStage.data.timeline.length > 0,
        finalStageNormalTurnsPlayed: data.finalStage.data.cycleFacts.length,
      },
      teamStatistics: data.statistics.teamStatistics,
      heroStatistics: data.statistics.heroStatistics.map((hero) => ({
        teamId: hero.teamId,
        heroId: hero.heroId,
        eligible: hero.eligible,
        totals: this.statisticsFacts(hero),
        journey: hero.journey,
        finalStage: hero.finalStage,
      })),
      awards: data.statistics.awards.map((award) => this.publicAward(award, language, data)),
    };

    return result;
  }

  async history(teamId: string, lang = 'en'): Promise<CompletedJourneyHistoryDataModel> {
    await this.profile(teamId);
    const items = await this.dataSource.getRepository(JourneyAttemptEntity).find({
      where: { teamId, status: 'COMPLETED' },
      order: { completedAt: 'DESC', createdAt: 'DESC' },
    });
    const language = this.localization.language(lang);
    const result: CompletedJourneyHistoryDataModel = {
      teamId,
      language,
      items: items.map((item) => {
        const data = this.mapper.fromStorage(item.metadata);
        return {
          attemptId: item.id,
          status: 'COMPLETED',
          createdAt: item.createdAt.toISOString(),
          completedAt: item.completedAt!.toISOString(),
          spendingStrategyCode: data.spendingStrategy,
          outcomeCode: data.completionReason!,
          endingCode: data.endingCode ?? AvengersEndingCode.NORMAL_VICTORY,
          terminalReasonCode: data.terminalReasonCode,
          opponentFinalistId: data.finalistIds.find((value) => value !== teamId)!,
          opponentFinalistName: data.teams.find(
            (team) => team.id === data.finalistIds.find((value) => value !== teamId),
          )!.name,
          endingSummary: this.historyEnding(data.completionReason, language),
        };
      }),
    };

    return result;
  }

  private async simulation(
    teamId: string,
    configuration: AvengersTeamConfiguration,
    seed: number,
    spendingStrategy: JourneySpendingStrategy,
  ) {
    return this.simulator.simulate({
      teamId,
      configuration,
      seed,
      spendingStrategy,
      heroes: await this.catalog.definitions(),
      narrativeCharacters: await this.catalog.narrativeCharacters(),
    });
  }

  private entity(
    id: string,
    teamId: string,
    metadata: AvengersJourneyMetadata,
  ): JourneyAttemptEntity {
    const now = new Date();
    return Object.assign(new JourneyAttemptEntity(), {
      id,
      teamId,
      themeId: 'avengers-doomsday',
      status: 'PRE_FINAL',
      revision: 0,
      metadata: this.mapper.toStorage(metadata),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });
  }

  private async profile(teamId: string) {
    const value = await this.dataSource.getRepository(TeamProfileEntity).findOneBy({ id: teamId });
    if (!value || value.themeId !== 'avengers-doomsday') {
      throw new GameError(GameErrorCode.TEAM_NOT_FOUND, 'Avengers Team was not found.');
    }
    return value;
  }

  private async attempt(id: string, teamId: string) {
    return this.dataSource.getRepository(JourneyAttemptEntity).findOneBy({ id, teamId });
  }

  private async attemptRequired(id: string, teamId: string) {
    const value = await this.attempt(id, teamId);
    if (!value) {
      throw new GameError(GameErrorCode.RESOURCE_NOT_FOUND, 'Journey was not found.');
    }
    return value;
  }

  private async metadata(id: string, teamId: string) {
    return this.mapper.fromStorage((await this.attemptRequired(id, teamId)).metadata);
  }

  private configurationFrom(profile: TeamProfileEntity): AvengersTeamConfiguration {
    const value = profile.metadata;
    if (
      !value ||
      !Array.isArray(value.companionIds) ||
      !Array.isArray(value.activeHeroIds) ||
      typeof value.leaderId !== 'string' ||
      typeof value.visualKey !== 'string' ||
      !Object.values(AvengersStrategy).includes(value.strategy as AvengersStrategy)
    ) {
      throw new GameError(
        GameErrorCode.INVALID_TEAM_CONFIGURATION,
        'Persisted Team configuration is invalid.',
      );
    }
    return {
      leaderId: value.leaderId,
      companionIds: value.companionIds.map(String),
      activeHeroIds: value.activeHeroIds.map(String),
      strategy: value.strategy as AvengersStrategy,
      visualKey: value.visualKey,
    };
  }

  private async validateConfiguration(teamId: string, config: AvengersTeamConfiguration) {
    if (
      config.leaderId !== teamId ||
      config.companionIds.length !== 5 ||
      new Set([config.leaderId, ...config.companionIds]).size !== 6 ||
      config.activeHeroIds.length !== 3 ||
      !config.activeHeroIds.includes(config.leaderId) ||
      config.activeHeroIds.some((id) => ![config.leaderId, ...config.companionIds].includes(id))
    ) {
      throw new GameError(
        GameErrorCode.INVALID_TEAM_CONFIGURATION,
        'Choose the fixed Leader, five distinct companions, and exactly three ACTIVE Heroes including the Leader.',
      );
    }
    const heroes = await this.catalog.definitions();
    const byId = new Map(heroes.map((hero) => [hero.id, hero]));
    if (![config.leaderId, ...config.companionIds].every((id) => byId.has(id))) {
      throw new GameError(
        GameErrorCode.INVALID_TEAM_CONFIGURATION,
        'One or more configured Heroes do not exist.',
      );
    }
  }

  private applyPreparation(metadata: AvengersJourneyMetadata, config: AvengersTeamConfiguration) {
    metadata.initialConfiguration = structuredClone(config);
    const player = this.player(metadata, config.leaderId);
    player.strategy = config.strategy;
    const living = player.heroes.filter((hero) => !hero.knockedOut && hero.currentEnergy > 0);
    const desiredActiveCount = Math.min(3, living.length);
    const preferred = [
      ...config.activeHeroIds,
      ...player.heroes.filter((hero) => hero.active).map((hero) => hero.heroId),
      ...living.map((hero) => hero.heroId),
    ];
    const activeIds: string[] = [];
    if (living.some((hero) => hero.heroId === config.leaderId)) {
      activeIds.push(config.leaderId);
    }
    for (const heroId of preferred) {
      if (activeIds.length >= desiredActiveCount) {
        break;
      }
      if (living.some((hero) => hero.heroId === heroId) && !activeIds.includes(heroId)) {
        activeIds.push(heroId);
      }
    }
    for (const hero of player.heroes) {
      hero.active = activeIds.includes(hero.heroId);
    }
    this.syncPreparedTeam(metadata, config.leaderId);
  }

  private syncPreparedTeam(metadata: AvengersJourneyMetadata, teamId: string) {
    const source = this.player(metadata, teamId);
    const target = metadata.finalStage.data.player;
    target.strategy = source.strategy;
    for (const hero of target.heroes) {
      const current = source.heroes.find((value) => value.heroId === hero.heroId)!;
      hero.currentEnergy = current.currentEnergy;
      hero.currentAbilityPoints = current.currentAbilityPoints;
      hero.condition = current.knockedOut ? 'KNOCKED_OUT' : 'AVAILABLE';
      hero.status =
        current.active && !current.knockedOut ? TeamMemberStatus.ACTIVE : TeamMemberStatus.INACTIVE;
    }
    target.effects = source.temporaryEffects.map((effect, index) => ({
      id: `journey-prep-${index}`,
      stat: effect.stat,
      modifier: effect.percent / 100,
      expiresAfterTurn: effect.remainingRounds,
      source: 'POWER_UP',
      ...(effect.heroIds ? { heroIds: [...effect.heroIds] } : {}),
    }));
    metadata.finalStage.data.inventory = source.inventory.map((entry) => {
      const definition = AVENGERS_POWER_UPS.find((item) => item.id === entry.itemId)!;
      return {
        id: entry.itemId,
        name: definition.name.en,
        target: definition.target,
        quantity: entry.quantity,
        effect: definition.effect,
      };
    });
  }

  private syncFinalStageInventory(metadata: AvengersJourneyMetadata, teamId: string): void {
    const team = this.player(metadata, teamId);
    const remaining = new Map(
      metadata.finalStage.data.inventory.map((item) => [item.id, item.quantity]),
    );
    team.inventory = team.inventory.map((item) => ({
      ...item,
      quantity: remaining.get(item.itemId) ?? 0,
    }));
  }

  private player(metadata: AvengersJourneyMetadata, teamId: string): AvengersTournamentTeam {
    const team = metadata.teams.find((value) => value.id === teamId);
    if (!team) {
      throw new GameError(
        GameErrorCode.INVALID_TEAM_CONFIGURATION,
        'Player Team is missing from Journey.',
      );
    }
    return team;
  }

  private async casProfile(
    manager: EntityManager,
    teamId: string,
    configurationRevision: number,
    contextRevision: number,
    config: AvengersTeamConfiguration,
    currentAttemptId: string | null,
  ) {
    const result = await manager
      .getRepository(TeamProfileEntity)
      .createQueryBuilder()
      .update()
      .set({
        metadata: () => ':metadataJson',
        currentAttemptId,
        configurationRevision: () => 'configurationRevision + 1',
        contextRevision: () => 'contextRevision + 1',
        updatedAt: new Date(),
      })
      .setParameter('metadataJson', JSON.stringify(config))
      .where(
        'id = :teamId AND configurationRevision = :configurationRevision AND contextRevision = :contextRevision',
        { teamId, configurationRevision, contextRevision },
      )
      .execute();
    if (result.affected !== 1) {
      throw new GameError(GameErrorCode.STATE_CONFLICT, 'Team configuration revision conflict.');
    }
  }

  private async casAttempt(
    manager: EntityManager,
    attempt: JourneyAttemptEntity,
    metadata: AvengersJourneyMetadata,
    status: string,
  ) {
    const currentOwner = await manager.getRepository(TeamProfileEntity).findOneBy({
      id: attempt.teamId,
      currentAttemptId: attempt.id,
    });
    if (!currentOwner) {
      throw new GameError(
        GameErrorCode.STATE_CONFLICT,
        'Current Journey changed during the operation.',
      );
    }
    const result = await manager
      .getRepository(JourneyAttemptEntity)
      .createQueryBuilder()
      .update()
      .set({
        metadata: () => ':metadataJson',
        status,
        revision: () => 'revision + 1',
        updatedAt: new Date(),
        completedAt: status === 'COMPLETED' ? new Date(metadata.completedAt!) : null,
      })
      .setParameter('metadataJson', JSON.stringify(this.mapper.toStorage(metadata)))
      .where('id = :id AND teamId = :teamId AND revision = :revision', {
        id: attempt.id,
        teamId: attempt.teamId,
        revision: attempt.revision,
      })
      .execute();
    if (result.affected !== 1) {
      throw new GameError(GameErrorCode.STATE_CONFLICT, 'Journey revision conflict.');
    }
  }

  private async mutate<T>(
    teamId: string,
    id: string,
    status: string,
    mutation: (metadata: AvengersJourneyMetadata) => T,
    lifecycleErrorCode = GameErrorCode.STORE_CLOSED,
  ) {
    const attempt = await this.attemptRequired(id, teamId);
    if (attempt.status !== status) {
      throw new GameError(lifecycleErrorCode, 'This operation is available only during PRE_FINAL.');
    }
    const metadata = this.mapper.fromStorage(attempt.metadata);
    const result = mutation(metadata);
    await this.dataSource.transaction((manager) =>
      this.casAttempt(manager, attempt, metadata, status),
    );
    return result;
  }

  private publicConfiguration(configuration: AvengersTeamConfiguration) {
    const allHeroIds = [configuration.leaderId, ...configuration.companionIds];
    return {
      leaderId: configuration.leaderId,
      companionIds: [...configuration.companionIds],
      activeHeroIds: [...configuration.activeHeroIds],
      inactiveHeroIds: allHeroIds.filter((heroId) => !configuration.activeHeroIds.includes(heroId)),
      strategyCode: configuration.strategy,
    };
  }

  private attemptReference(attempt: JourneyAttemptEntity) {
    return {
      attemptId: attempt.id,
      status: attempt.status,
    };
  }

  private currentReference(attempt: JourneyAttemptEntity) {
    const metadata = this.mapper.fromStorage(attempt.metadata);
    return {
      ...this.attemptReference(attempt),
      stageCount: this.stageCount(metadata),
      encounterCount: metadata.encounters.length,
    };
  }

  private finalists(metadata: AvengersJourneyMetadata, playerTeamId: string) {
    return {
      playerTeamId,
      opponentTeamId:
        metadata.finalistIds.find((finalistId) => finalistId !== playerTeamId) ??
        metadata.finalistIds[1],
    };
  }

  private journeySummary(attempt: JourneyAttemptEntity, metadata: AvengersJourneyMetadata) {
    return {
      attemptId: attempt.id,
      teamId: attempt.teamId,
      status: attempt.status,
      spendingStrategyCode: metadata.spendingStrategy,
      createdAt: attempt.createdAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() ?? null,
      configuration: this.publicConfiguration(metadata.initialConfiguration),
      finalists: this.finalists(metadata, attempt.teamId),
      progress: {
        stagesCompleted: this.stageCount(metadata),
        encountersPlayedByPlayer: metadata.encounters.filter((encounter) =>
          [encounter.teamAId, encounter.teamBId].includes(attempt.teamId),
        ).length,
        finalStageStatus: metadata.finalStage.status,
      },
      completionOutcome: metadata.completionReason,
      endingCode: metadata.endingCode,
      terminalReasonCode: metadata.terminalReasonCode,
    };
  }

  private safeCurrentSummary(attempt: JourneyAttemptEntity, metadata: AvengersJourneyMetadata) {
    const summary = this.journeySummary(attempt, metadata);
    return {
      attemptId: summary.attemptId,
      teamId: summary.teamId,
      status: summary.status,
      spendingStrategyCode: summary.spendingStrategyCode,
      createdAt: summary.createdAt,
      completedAt: summary.completedAt,
      configuration: summary.configuration,
      finalists: summary.finalists,
      progress: summary.progress,
      completionOutcome: summary.completionOutcome,
      endingCode: summary.endingCode,
      terminalReasonCode: summary.terminalReasonCode,
    };
  }

  private publicActionId(attempt: JourneyAttemptEntity, internalId: string): string {
    return createHash('sha256')
      .update(`${attempt.id}:${attempt.revision}:${internalId}`)
      .digest('base64url');
  }

  private publicTournamentTeam(team: AvengersTournamentTeam) {
    return {
      teamId: team.id,
      name: team.name,
      leaderId: team.leaderId,
      heroIds: [...team.heroIds],
      strategyCode: team.strategy,
      generationModeCode: team.generationMode,
      heroes: team.heroes.map((hero) => ({
        heroId: hero.heroId,
        currentEnergy: hero.currentEnergy,
        currentAbilityPoints: hero.currentAbilityPoints,
        status: hero.active ? TeamMemberStatus.ACTIVE : TeamMemberStatus.INACTIVE,
        knockedOut: hero.knockedOut,
        statGains: Object.entries(hero.statGains).map(([statCode, amount]) => ({
          statCode: statCode.toUpperCase(),
          amount,
        })),
      })),
      rewardPoints: team.rewardPoints,
      eliminated: team.eliminated,
    };
  }

  private stageCount(metadata: AvengersJourneyMetadata): number {
    return new Set(metadata.stages.map((stage) => stage.type)).size;
  }

  private nextStageCode(stageCode: AvengersEncounter['stageType']): string {
    switch (stageCode) {
      case 'ROUND_OF_16':
        return 'QUARTERFINAL';
      case 'QUARTERFINAL':
        return 'SEMIFINAL';
      case 'SEMIFINAL':
        return 'FINAL_STAGE';
      default:
        return 'ROUND_OF_16';
    }
  }

  private encounterSummary(encounter: AvengersEncounter) {
    return {
      encounterId: encounter.id,
      stageId: encounter.stageId,
      stageCode: encounter.stageType,
      groupId: encounter.groupId,
      teamAId: encounter.teamAId,
      teamBId: encounter.teamBId,
      winnerTeamId: encounter.winnerTeamId,
      resolutionCode: encounter.resolution,
      rivalEncounter: encounter.rival,
      results: [encounter.teamAId, encounter.teamBId].map((teamId) => ({
        teamId,
        resultCode: encounter.resultByTeam[teamId],
      })),
      damageByTeam: [encounter.teamAId, encounter.teamBId].map((teamId) => ({
        teamId,
        damageDealt: encounter.damageByTeam[teamId],
      })),
    };
  }

  private publicRound(
    round: AvengersRoundFact,
    encounter: AvengersEncounter,
    lang: string,
    roundType: 'NORMAL' | 'EXTRA_ROUND',
    metadata: AvengersJourneyMetadata,
  ) {
    return {
      number: round.round,
      roundType,
      initiativeTeamId: round.initiativeTeamId,
      winnerTeamId: round.winnerTeamId,
      damageByTeam: [
        { teamId: encounter.teamAId, damageDealt: round.playerDamage },
        { teamId: encounter.teamBId, damageDealt: round.opponentDamage },
      ],
      activeHeroIdsByTeam: Object.entries(round.participantHeroIds).map(([teamId, heroIds]) => ({
        teamId,
        heroIds,
      })),
      events: round.events.map((event) => this.publicJourneyEvent(event, lang, metadata)),
    };
  }

  private publicJourneyEvent(
    event: AvengersJourneyEvent,
    lang: string,
    metadata: AvengersJourneyMetadata,
  ) {
    const values: Record<string, number | string | boolean> = {};
    if (event.actorHeroId) {
      values.actorHeroId = event.actorHeroId;
    }
    if (event.targetHeroIds[0] && event.encounterId) {
      const encounter = metadata.encounters.find((value) => value.id === event.encounterId);
      const targetTeamId = encounter
        ? [encounter.teamAId, encounter.teamBId].find((id) => id !== event.teamId)
        : undefined;
      if (targetTeamId) {
        values.targetTeamId = targetTeamId;
      }
    }
    const amount = event.values.damage ?? event.values.healing ?? event.values.amount;
    if (typeof amount === 'number') {
      values.amount = amount;
    }
    if (typeof event.values.actionType === 'string') {
      values.actionCode = event.values.actionType;
    }
    if (typeof event.values.stat === 'string') {
      values.statCode = event.values.stat.toUpperCase();
    }
    if (typeof event.values.reason === 'string') {
      values.reasonCode = event.values.reason;
    }
    if (typeof event.values.itemId === 'string') {
      values.itemId = event.values.itemId;
    }
    if (typeof event.values.energy === 'number') {
      values.energy = event.values.energy;
    }
    if (typeof event.values.abilityPoints === 'number') {
      values.abilityPoints = event.values.abilityPoints;
    }
    return {
      sequence: event.sequence,
      eventCode: event.type,
      stageCode: event.stageId
        ? event.stageId.startsWith('group-')
          ? 'GROUP_STAGE'
          : event.stageId.replaceAll('-', '_').toUpperCase()
        : null,
      encounterId: event.encounterId,
      round: event.round,
      teamId: event.teamId,
      actorHeroId: event.actorHeroId,
      targetHeroIds: [...event.targetHeroIds],
      messageCode: event.messageCode,
      values,
      narrative: {
        lines: [
          this.narrative.narration(
            this.localization.journeyEvent(event, lang, (id) =>
              this.publicDisplayName(metadata, id),
            ),
          ),
        ],
      },
    };
  }

  private publicInventoryEntry(entry: AvengersInventoryEntry) {
    const item = AVENGERS_POWER_UPS.find((definition) => definition.id === entry.itemId);
    return {
      itemId: entry.itemId,
      quantity: entry.quantity,
      legalUseContexts: item ? ['PRE_FINAL', 'FINAL_STAGE'] : [],
    };
  }

  private isValidInitialFinalFormation(
    team: AvengersTeamState,
    requireLeaderActive: boolean,
  ): boolean {
    const active = team.heroes.filter(
      (hero) => hero.status === TeamMemberStatus.ACTIVE && hero.condition === 'AVAILABLE',
    );
    const reserve = team.heroes.filter(
      (hero) => hero.status === TeamMemberStatus.INACTIVE && hero.condition === 'AVAILABLE',
    );
    const living = team.heroes.filter((hero) => hero.condition === 'AVAILABLE');
    return (
      active.length === Math.min(3, living.length) &&
      active.length + reserve.length === living.length &&
      (!requireLeaderActive ||
        team.heroes.find((hero) => hero.heroId === team.leaderId)?.status ===
          TeamMemberStatus.ACTIVE)
    );
  }

  private publicFinalState(
    attempt: JourneyAttemptEntity,
    metadata: AvengersJourneyMetadata,
    lang: string,
  ): TournamentFinalStateModel | DoomsdayFinalStateModel | CompletedFinalStateModel {
    const state = metadata.finalStage;
    const data = state.data;
    const language = this.localization.language(lang);
    const participants = {
      playerTeamId: data.player.teamId,
      opponentTeamId: data.opponent.teamId,
    };
    if (attempt.status === 'COMPLETED') {
      return {
        variant: 'COMPLETED',
        attemptId: attempt.id,
        status: 'COMPLETED',
        phase: 'COMPLETED',
        phaseLabel: this.localization.label('COMPLETED', language),
        normalTurn: state.turn,
        turnState: 'COMPLETED',
        participants,
        completion: {
          outcomeCode: metadata.completionReason!,
          endingCode: metadata.endingCode ?? AvengersEndingCode.NORMAL_VICTORY,
          terminalReasonCode: metadata.terminalReasonCode,
          endingEventSequences: data.timeline
            .map((event, index) => ({ event, sequence: index + 1 }))
            .filter(({ event }) =>
              ['VICTORY', 'DEFEAT', 'ABANDON', 'EARLY_DEFEAT_REVEAL'].includes(event.type),
            )
            .map(({ sequence }) => sequence),
        },
      };
    }
    if (!data.revealOccurred) {
      return {
        variant: 'TOURNAMENT_FINAL',
        attemptId: attempt.id,
        status: state.status,
        phase: 'TOURNAMENT_FINAL',
        phaseLabel: this.localization.label('TOURNAMENT_FINAL', language),
        normalTurn: state.turn,
        turnState:
          state.status === FinalStageStatus.READY ? 'AWAITING_START' : 'AWAITING_PLAYER_ACTION',
        participants,
        completion: null,
      };
    }
    return {
      variant: 'DOOMSDAY',
      attemptId: attempt.id,
      status: 'ACTIVE',
      phase: data.phase,
      phaseLabel: this.localization.label(data.phase, language),
      normalTurn: state.turn,
      turnState: 'AWAITING_PLAYER_ACTION',
      participants,
      doom: this.publicDoom(data.doom!),
      opponentAlignmentCode: 'ALLIED_WITH_DOOM',
      revealEventSequence: data.timeline.findIndex((event) => event.type === 'DOOM_REVEALED') + 1,
      completion: null,
    };
  }

  private publicFinalTeam(team: AvengersTeamState) {
    return {
      teamId: team.teamId,
      leaderId: team.leaderId,
      strategyCode: team.strategy,
      heroes: team.heroes.map((hero) => ({
        heroId: hero.heroId,
        status: hero.status,
        condition: hero.condition,
        maximumEnergy: hero.maxEnergy,
        currentEnergy: hero.currentEnergy,
        maximumAbilityPoints: hero.maxAbilityPoints,
        currentAbilityPoints: hero.currentAbilityPoints,
        returnAtTurn: hero.returnAtTurn,
      })),
      vacantActiveHeroIds: [...team.vacantActiveHeroIds],
      synergyCode: team.synergy.level,
      teamActionsRemaining: team.teamActionsRemaining,
      leaderAbilityUsesRemaining: team.leaderAbilityUsesRemaining,
      strategyChangesRemaining: team.strategyChangesRemaining,
    };
  }

  private publicDoom(doom: DoomState) {
    return {
      narrativeCharacterId: 'doctor-doom',
      maximumEnergy: doom.maxEnergy,
      currentEnergy: doom.currentEnergy,
      threatLevelCode: doom.threatLevel,
    };
  }

  private publicFinalAction(
    action: AvengersAction,
    lang: string,
    metadata: AvengersJourneyMetadata,
    attempt: JourneyAttemptEntity,
  ) {
    const data = metadata.finalStage.data;
    const actorHeroId = 'actorId' in action ? action.actorId : undefined;
    const targetId = 'targetId' in action ? action.targetId : undefined;
    const target = targetId
      ? targetId === 'DOOM'
        ? { targetType: 'ANTAGONIST', targetId: 'doctor-doom', sideCode: 'DOOM' }
        : targetId === 'OPPONENT_TEAM' || targetId === 'ENEMY_TEAM'
          ? { targetType: 'TEAM', targetId: 'opponent', sideCode: 'OPPONENT' }
          : targetId === 'OWN_TEAM'
            ? { targetType: 'TEAM', targetId: 'player', sideCode: 'PLAYER' }
            : {
                targetType: 'HERO',
                targetId,
                sideCode: data.player.heroes.some((hero) => hero.heroId === targetId)
                  ? 'PLAYER'
                  : 'OPPONENT',
              }
      : null;
    const hero = actorHeroId
      ? metadata.content.heroes.find((definition) => definition.id === actorHeroId)
      : undefined;
    const abilityId =
      action.type === 'BASIC_ATTACK'
        ? 'basic-attack'
        : action.type === 'OFFENSIVE_SPECIAL'
          ? 'offensive-special'
          : action.type === 'SUPPORT_SPECIAL'
            ? 'support-special'
            : action.type === 'LEADER_ABILITY'
              ? 'leader-ability'
              : undefined;
    const description = this.publicActionDescription(action, lang, metadata, actorHeroId);
    const localizedLanguage = this.localization.language(lang);
    const label =
      action.type === 'BASIC_ATTACK' && hero?.basicAttack
        ? (hero.basicAttack.localizedName?.[localizedLanguage] ??
          hero.basicAttack.localizedName?.en ??
          'Strike')
        : action.type === 'OFFENSIVE_SPECIAL' && hero?.offensiveAbility
          ? (hero.offensiveAbility.localizedName?.[localizedLanguage] ?? hero.offensiveAbility.name)
          : action.type === 'SUPPORT_SPECIAL' && hero?.supportAbility
            ? (hero.supportAbility.localizedName?.[localizedLanguage] ?? hero.supportAbility.name)
            : action.type === 'LEADER_ABILITY' && hero?.leadership?.ability
              ? (hero.leadership.ability.localizedName?.[localizedLanguage] ??
                hero.leadership.ability.name)
              : this.narrative.actionLabel(action, lang, data);
    return {
      actionId: this.publicActionId(attempt, action.id),
      actionCode: action.type,
      label,
      description,
      ...(actorHeroId ? { actorHeroId } : {}),
      ...(abilityId ? { abilityId } : {}),
      ...(action.type === 'POWER_UP' ? { itemId: action.itemId } : {}),
      ...(action.type === 'CHANGE_STRATEGY' ? { strategyCode: action.strategy } : {}),
      ...(action.type === 'TEAM_ACTION' ? { roleCombination: action.roleCombination } : {}),
      ...('outgoingId' in action ? { outgoingHeroId: action.outgoingId } : {}),
      ...('incomingId' in action ? { incomingHeroId: action.incomingId } : {}),
      target,
      cost: { abilityPoints: action.apCost },
    };
  }

  private publicActionDescription(
    action: AvengersAction,
    lang: string,
    metadata: AvengersJourneyMetadata,
    actorHeroId?: string,
  ): string {
    const language = this.localization.language(lang);
    if (action.type === 'SUE_STORM_APPEAL') {
      return language === 'es'
        ? 'Invisible Woman intenta llegar al hombre detrás de la armadura.'
        : 'Invisible Woman reaches for the person behind the armor.';
    }
    if (actorHeroId) {
      const hero = metadata.content.heroes.find((definition) => definition.id === actorHeroId);
      const ability =
        action.type === 'BASIC_ATTACK'
          ? hero?.basicAttack
          : action.type === 'OFFENSIVE_SPECIAL'
            ? hero?.offensiveAbility
            : action.type === 'SUPPORT_SPECIAL'
              ? hero?.supportAbility
              : undefined;
      if (ability?.description?.[language]) {
        return ability.description[language];
      }
      if (action.type === 'LEADER_ABILITY') {
        if (hero?.leadership?.ability.description?.[language]) {
          return hero.leadership.ability.description[language];
        }
      }
    }
    return this.localization.actionDescription(action, lang, (id) =>
      this.publicDisplayName(metadata, id),
    );
  }

  private publicFinalEvent(
    event: AvengersEvent,
    sequence: number,
    lang: string,
    metadata: AvengersJourneyMetadata,
  ) {
    const messageCodes: Partial<Record<AvengersEvent['type'], string>> = {
      TOURNAMENT_FINAL_STARTED: 'finalStage.opening.silverSurfer',
      SURFER_ENOUGH: 'finalStage.reveal.enough',
      DOOM_REVEALED: 'finalStage.reveal.identity',
      DOOM_EXPLANATION: 'finalStage.reveal.doomExplanation',
      PLAYER_REJECTION: 'finalStage.reveal.playerRejection',
      OPPONENT_ALLIANCE: 'finalStage.reveal.opponentAlliance',
      DOOMSDAY_BEGINS: 'finalStage.reveal.finalBattleBegins',
      EARLY_DEFEAT_REVEAL: 'finalStage.ending.earlyDefeatReveal',
      DOOM_ALONE: 'finalStage.intermediate.doomAlone',
      PRE_REVEAL_ABANDON: 'finalStage.ending.preRevealAbandon',
      POST_REVEAL_ABANDON: 'finalStage.ending.postRevealAbandon',
      EARLY_DEFEAT_SCENE: 'finalStage.ending.earlyDefeat',
      SUE_STORM_APPEAL: 'finalStage.ending.sueStormAppeal',
    };
    const amount = event.values.damage ?? event.values.healing;
    const values: Record<string, unknown> = {};
    if (event.actorId && metadata.content.heroes.some((hero) => hero.id === event.actorId)) {
      values.actorHeroId = event.actorId;
    } else if (event.actorId === 'DOOM' || event.actorId === 'SILVER_SURFER') {
      values.actorIdentityId = event.actorId === 'DOOM' ? 'doctor-doom' : 'silver-surfer';
    } else if (event.actorId === 'PLAYER' || event.actorId === 'OPPONENT') {
      values.actorSideCode = event.actorId;
    }
    const targetHeroIds = event.targetIds.filter((targetId) =>
      metadata.content.heroes.some((hero) => hero.id === targetId),
    );
    if (targetHeroIds.length) {
      values.targetHeroIds = targetHeroIds;
    }
    if (event.targetIds.length === 1) {
      const targetId = event.targetIds[0];
      if (targetId === 'DOOM') {
        values.targetId = 'doctor-doom';
      } else {
        values.targetId = targetId;
      }
    }
    if (event.targetSide === 'PLAYER' || event.targetSide === 'OPPONENT') {
      values.targetSideCode = event.targetSide;
    }
    if (typeof amount === 'number') {
      values.amount = amount;
    }
    if (typeof event.values.damage === 'number') {
      values.damage = event.values.damage;
    }
    if (typeof event.values.healing === 'number') {
      values.healing = event.values.healing;
    }
    if (typeof event.values.apChange === 'number') {
      values.apChange = event.values.apChange;
    }
    if (typeof event.values.ap === 'number') {
      values.abilityPoints = event.values.ap;
    }
    if (typeof event.values.energy === 'number') {
      values.energy = event.values.energy;
    }
    for (const [sourceKey, targetKey] of [
      ['action', 'actionName'],
      ['actionType', 'actionCode'],
      ['strategy', 'strategyCode'],
      ['item', 'itemName'],
      ['effectType', 'effectCode'],
      ['stat', 'statCode'],
    ]) {
      const value = event.parameters[sourceKey];
      if (typeof value === 'string') {
        values[targetKey] = value;
      }
    }
    if (typeof event.values.percent === 'number') {
      values.percent = event.values.percent;
    }
    if (typeof event.values.duration === 'number') {
      values.duration = event.values.duration;
    }
    if (event.type === 'DOOM_REVEALED') {
      values.previousIdentityId = 'silver-surfer';
      values.revealedIdentityId = 'doctor-doom';
    }
    if (event.type === 'TOURNAMENT_FINAL_STARTED') {
      values.playerTeamId = metadata.finalStage.data.player.teamId;
      values.opponentTeamId = metadata.finalStage.data.opponent.teamId;
    }
    if (event.type === 'PLAYER_REJECTION') {
      values.speakerTeamId = metadata.finalStage.data.player.teamId;
    }
    if (event.type === 'OPPONENT_ALLIANCE') {
      values.speakerTeamId = metadata.finalStage.data.opponent.teamId;
      values.alignmentCode = 'ALLIED_WITH_DOOM';
    }
    if (event.type === 'DOOMSDAY_BEGINS') {
      values.nextNormalTurn = 5;
    }
    return {
      sequence,
      turn: event.turn,
      phase: [
        'DOOM_REVEALED',
        'DOOM_EXPLANATION',
        'PLAYER_REJECTION',
        'OPPONENT_ALLIANCE',
        'DOOMSDAY_BEGINS',
      ].includes(event.type)
        ? 'DOOMSDAY'
        : event.phase,
      eventCode: event.type,
      messageCode: messageCodes[event.type] ?? `finalStage.combat.${this.camelCase(event.type)}`,
      values,
      narrative: this.narrative.renderLines(event, lang).length
        ? { lines: this.narrative.renderLines(event, lang) }
        : null,
    };
  }

  private publicDisplayName(metadata: AvengersJourneyMetadata, id: string): string {
    const hero = metadata.content.heroes.find((definition) => definition.id === id);
    if (hero) {
      return hero.displayName;
    }
    const team = metadata.teams.find((value) => value.id === id);
    if (team) {
      return team.name.replace(/^Team /, '');
    }
    return this.localization.title(id);
  }

  private statisticsFacts(hero: AvengersHeroStatisticsFacts) {
    return {
      activeEncounters: hero.activeEncounters,
      activeRounds: hero.activeRounds,
      winningActiveRounds: hero.winningActiveRounds,
      damageDealt: hero.damageDealt,
      damageReceived: hero.damageReceived,
      healing: hero.healing,
      kosCaused: hero.kosCaused,
      kosSuffered: hero.kosSuffered,
      offensiveSpecialsUsed: hero.offensiveSpecialsUsed,
      supportSpecialsUsed: hero.supportSpecialsUsed,
      statGains: hero.statGains,
    };
  }

  private publicAward(
    award: AvengersAwardDecision,
    lang: string,
    metadata: AvengersJourneyMetadata,
  ) {
    const winner = award.winner
      ? metadata.statistics?.heroStatistics.find(
          (hero) => hero.teamId === award.winner!.teamId && hero.heroId === award.winner!.heroId,
        )
      : null;
    const winningFacts = !winner
      ? null
      : award.code === 'MIGHTIEST_HERO'
        ? { metricCode: 'DAMAGE_DEALT', value: winner.damageDealt, damageDealt: winner.damageDealt }
        : award.code === 'BEST_SUPPORT'
          ? { metricCode: 'HEALING', value: winner.healing, healing: winner.healing }
          : award.code === 'MOST_RESILIENT'
            ? {
                metricCode: 'KO_RATE',
                value: winner.kosSuffered / winner.activeEncounters,
                kosSuffered: winner.kosSuffered,
                activeEncounters: winner.activeEncounters,
                koRate: winner.kosSuffered / winner.activeEncounters,
                activeRounds: winner.activeRounds,
                damageReceived: winner.damageReceived,
              }
            : {
                metricCode: 'WINNING_ACTIVE_ROUNDS',
                value: winner.winningActiveRounds,
                winningActiveRounds: winner.winningActiveRounds,
                kosCaused: winner.kosCaused,
                damageDealt: winner.damageDealt,
              };
    return {
      code: award.code,
      label: this.localization.label(award.code, lang),
      explanation: this.localization.description('awards', award.code, lang),
      winner: award.winner,
      winningFacts,
      reason: this.localization.awardReason(award.code, award.value, award.tieBreak, lang),
    };
  }

  private historyEnding(outcome: AvengersJourneyMetadata['completionReason'], lang: string) {
    const spanish = lang === 'es';
    switch (outcome) {
      case 'VICTORY':
        return spanish
          ? 'El Equipo del Jugador venció la amenaza final.'
          : 'The Player Team defeated the final threat.';
      case 'DEFEAT':
        return spanish
          ? 'El Equipo del Jugador fue derrotado en la Etapa Final.'
          : 'The Player Team was defeated in FinalStage.';
      case 'ABANDON':
        return spanish ? 'El Jugador abandonó la Etapa Final.' : 'The Player abandoned FinalStage.';
      default:
        return spanish ? 'La competencia finalizó.' : 'The competition was completed.';
    }
  }

  private camelCase(code: string): string {
    const [first, ...rest] = code.toLowerCase().split('_');
    return first + rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
}
