import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { DataSource } from 'typeorm';
import { FinalStageStatus } from '../../../final-stage/model/final-stage-status.enum';
import { JourneyAttemptEntity } from '../../../journey/entity/journey-attempt.entity';
import { TeamProfileRepository } from '../../../teams/repository/team-profile.repository';
import { AvengersCatalogQueryService } from '../catalog/avengers-catalog-query.service';
import { AvengersGameEngine } from '../avengers-game-engine';
import { AvengersFinalStagePhase } from '../model/avengers-final-stage-phase.enum';
import { AvengersAction } from '../model/avengers-action.model';
import { AvengersJourneySimulator } from './avengers-journey-simulator.service';
import { AvengersJourneyMetadataMapper } from './mapper/avengers-journey-metadata.mapper';
import {
  AvengersJourneyMetadata,
  AvengersTeamConfiguration,
} from './model/avengers-journey-metadata.model';
import { JourneySpendingStrategy } from './model/journey-spending-strategy.enum';
import { AvengersStatisticsService } from './avengers-statistics.service';

@Injectable()
export class AvengersJourneyDiagnostics {
  constructor(
    private readonly profiles: TeamProfileRepository,
    private readonly catalog: AvengersCatalogQueryService,
    private readonly simulator: AvengersJourneySimulator,
    private readonly engine: AvengersGameEngine,
    private readonly dataSource: DataSource,
    private readonly metadataMapper: AvengersJourneyMetadataMapper,
    private readonly statistics: AvengersStatisticsService,
  ) {}

  async run(seedsPerConfiguration = 100, includeFinalStage = true) {
    const leaders = [
      'spider-man',
      'doctor-strange',
      'captain-america',
      'thor',
      'black-widow',
      'wolverine',
      'reed-richards',
      'iron-man',
    ];
    const heroes = await this.catalog.definitions();
    const narrativeCharacters = await this.catalog.narrativeCharacters();
    const timings: number[] = [];
    const commitTimings: number[] = [];
    const requestTimings: number[] = [];
    const metrics = {
      journeys: 0,
      playerFinals: 0,
      groupDraws: 0,
      extraRounds: 0,
      playerExtraRounds: 0,
      guaranteedWinningRounds: 0,
      playerRounds: 0,
      koAtFinalHandoff: 0,
      rewardPointsEarned: 0,
      rewardPointsSpent: 0,
      statGains: 0,
      metadataBytes: 0,
      actOneDefeats: 0,
      actOneAbandons: 0,
      revealReached: 0,
      actTwoVictories: 0,
      actTwoDefeats: 0,
      actTwoAbandons: 0,
      eligibleTeams: 0,
      eligibleHeroes: 0,
      mvpDiffersFromMightiest: 0,
      awardsChangedByFinalStage: 0,
      awardWinners: {} as Record<string, Record<string, number>>,
      awardsByFinish: { QUARTERFINALIST: 0, SEMIFINALIST: 0, FINALIST: 0 },
      finalTurns: [] as number[],
      opponents: {} as Record<string, number>,
      strategies: {} as Record<string, { remainingPoints: number; spent: number; ko: number }>,
    };
    for (const strategy of Object.values(JourneySpendingStrategy)) {
      metrics.strategies[strategy] = { remainingPoints: 0, spent: 0, ko: 0 };
    }
    for (let configIndex = 0; configIndex < leaders.length; configIndex += 1) {
      const profile = await this.profiles.findEntity(leaders[configIndex]);
      if (!profile?.metadata) {
        throw new Error(`Missing diagnostic Team profile ${leaders[configIndex]}.`);
      }
      const configuration = profile.metadata as unknown as AvengersTeamConfiguration;
      for (const strategy of Object.values(JourneySpendingStrategy)) {
        for (let seedIndex = 0; seedIndex < seedsPerConfiguration; seedIndex += 1) {
          const seed = (1000 + configIndex * 100000 + seedIndex) >>> 0;
          const started = performance.now();
          const data = this.simulator.simulate({
            teamId: profile.id,
            configuration,
            heroes,
            narrativeCharacters,
            seed,
            spendingStrategy: strategy,
          });
          const simulatedAt = performance.now();
          await this.measurePersistenceCommit(profile.id, data);
          const persistedAt = performance.now();
          timings.push(simulatedAt - started);
          commitTimings.push(persistedAt - simulatedAt);
          requestTimings.push(persistedAt - started);
          metrics.journeys++;
          metrics.playerFinals += data.finalistIds.includes(profile.id) ? 1 : 0;
          metrics.groupDraws += data.encounters.filter(
            (value) => value.stageType === 'GROUP_STAGE' && !value.winnerTeamId,
          ).length;
          metrics.extraRounds += data.encounters.filter((value) => value.extraRound).length;
          metrics.playerExtraRounds += data.encounters.filter(
            (value) => value.extraRound && [value.teamAId, value.teamBId].includes(profile.id),
          ).length;
          const playerEncounters = data.encounters.filter((value) =>
            [value.teamAId, value.teamBId].includes(profile.id),
          );
          metrics.playerRounds += playerEncounters.reduce(
            (sum, value) => sum + value.rounds.length,
            0,
          );
          metrics.guaranteedWinningRounds += playerEncounters.reduce(
            (sum, value) =>
              sum + value.rounds.filter((round) => round.mode === 'PLAYER_WIN').length,
            0,
          );
          const player = data.teams.find((value) => value.id === profile.id)!;
          metrics.koAtFinalHandoff += player.heroes.filter((value) => value.knockedOut).length;
          metrics.rewardPointsEarned += data.rewardLedger
            .filter((value) => value.teamId === profile.id && value.amount > 0)
            .reduce((sum, value) => sum + value.amount, 0);
          const spent = -data.rewardLedger
            .filter((value) => value.teamId === profile.id && value.amount < 0)
            .reduce((sum, value) => sum + value.amount, 0);
          metrics.rewardPointsSpent += spent;
          metrics.statGains += data.encounters.reduce(
            (sum, value) => sum + value.statGains.length,
            0,
          );
          metrics.metadataBytes += Buffer.byteLength(JSON.stringify(data));
          metrics.strategies[strategy].remainingPoints += player.rewardPoints;
          metrics.strategies[strategy].spent += spent;
          metrics.strategies[strategy].ko += player.heroes.filter(
            (value) => value.knockedOut,
          ).length;
          const opponent = data.finalistIds.find((value) => value !== profile.id)!;
          metrics.opponents[opponent] = (metrics.opponents[opponent] ?? 0) + 1;
          if (includeFinalStage) {
            let final = await this.engine.play({
              current: data.finalStage,
              command: { type: 'START' },
            });
            for (
              let operation = 0;
              operation < 500 && final.status === FinalStageStatus.ACTIVE;
              operation += 1
            ) {
              const action = this.pick(final.data.availableActions, final.data.phase);
              if (!action) {
                final = await this.engine.play({ current: final, command: { type: 'ABANDON' } });
                break;
              }
              final = await this.engine.play({
                current: final,
                command: { type: 'CHOOSE_ACTION', actionId: action.id },
              });
            }
            metrics.finalTurns.push(final.turn);
            if (!final.data.revealOccurred) {
              if (final.data.outcome === 'DEFEAT') {
                metrics.actOneDefeats++;
              } else if (final.data.outcome === 'ABANDON') {
                metrics.actOneAbandons++;
              }
            } else {
              metrics.revealReached++;
              if (final.data.outcome === 'VICTORY') {
                metrics.actTwoVictories++;
              } else if (final.data.outcome === 'DEFEAT') {
                metrics.actTwoDefeats++;
              } else if (final.data.outcome === 'ABANDON') {
                metrics.actTwoAbandons++;
              }
            }
            data.finalStage = final;
            data.completionReason = final.data.outcome;
            const completed = this.statistics.project(data);
            const journeyOnlyData = structuredClone(data);
            journeyOnlyData.finalStage.data.timeline = [];
            journeyOnlyData.finalStage.data.cycleFacts = [];
            const journeyOnly = this.statistics.project(journeyOnlyData);
            metrics.eligibleTeams += completed.eligibleTeamIds.length;
            metrics.eligibleHeroes += completed.heroStatistics.filter(
              (value) => value.eligible,
            ).length;
            const mightiest = completed.awards.find(
              (value) => value.code === 'MIGHTIEST_HERO',
            )?.winner;
            const mvp = completed.awards.find((value) => value.code === 'JOURNEY_MVP')?.winner;
            if (this.identity(mightiest) !== this.identity(mvp)) {
              metrics.mvpDiffersFromMightiest++;
            }
            for (const award of completed.awards) {
              const identity = this.identity(award.winner);
              if (!metrics.awardWinners[award.code]) {
                metrics.awardWinners[award.code] = {};
              }
              metrics.awardWinners[award.code][identity] =
                (metrics.awardWinners[award.code][identity] ?? 0) + 1;
              const earlier = journeyOnly.awards.find((value) => value.code === award.code)?.winner;
              if (this.identity(earlier) !== identity) {
                metrics.awardsChangedByFinalStage++;
              }
              if (award.winner) {
                metrics.awardsByFinish[this.finish(data, award.winner.teamId)]++;
              }
            }
          }
        }
      }
    }
    const percentile = (values: number[], fraction: number) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
    };
    return {
      generatedAt: new Date().toISOString(),
      deterministicInputs: {
        configurations: leaders,
        strategies: Object.values(JourneySpendingStrategy),
        seedsPerConfiguration,
      },
      metrics,
      timingMs: {
        simulation: {
          p50: percentile(timings, 0.5),
          p95: percentile(timings, 0.95),
          max: Math.max(0, ...timings),
        },
        persistenceCommit: {
          p50: percentile(commitTimings, 0.5),
          p95: percentile(commitTimings, 0.95),
          max: Math.max(0, ...commitTimings),
        },
        total: {
          p50: percentile(requestTimings, 0.5),
          p95: percentile(requestTimings, 0.95),
          max: Math.max(0, ...requestTimings),
        },
      },
    };
  }

  private pick(actions: AvengersAction[], phase: AvengersFinalStagePhase): AvengersAction | null {
    const combat = actions.filter((value) => !['SWAP', 'CHANGE_STRATEGY'].includes(value.type));
    const preferDoom = phase !== AvengersFinalStagePhase.TOURNAMENT_FINAL;
    const scored = combat.map((action) => ({
      action,
      score:
        (action.type === 'OFFENSIVE_SPECIAL'
          ? 50
          : action.type === 'TEAM_ACTION'
            ? 45
            : action.type === 'LEADER_ABILITY'
              ? 40
              : action.type === 'BASIC_ATTACK'
                ? 30
                : action.type === 'SUPPORT_SPECIAL'
                  ? 20
                  : 10) +
        ('targetId' in action && action.targetId === 'DOOM' && preferDoom ? 100 : 0),
    }));
    scored.sort((a, b) => b.score - a.score || a.action.id.localeCompare(b.action.id));
    return (
      scored[0]?.action ??
      actions.find((value) => value.type === 'SWAP') ??
      actions.find((value) => value.type === 'CHANGE_STRATEGY') ??
      null
    );
  }

  private async measurePersistenceCommit(
    teamId: string,
    metadata: AvengersJourneyMetadata,
  ): Promise<void> {
    const id = `diagnostic-${randomUUID()}`;
    const now = new Date();
    const entity = Object.assign(new JourneyAttemptEntity(), {
      id,
      teamId,
      themeId: 'avengers-doomsday',
      status: 'PRE_FINAL',
      revision: 0,
      metadata: this.metadataMapper.toStorage(metadata),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(JourneyAttemptEntity).save(entity);
      await manager.getRepository(JourneyAttemptEntity).delete({ id });
    });
  }

  private identity(value: { teamId: string; heroId: string } | null | undefined): string {
    return value ? `${value.teamId}:${value.heroId}` : 'NONE';
  }

  private finish(
    metadata: AvengersJourneyMetadata,
    teamId: string,
  ): 'QUARTERFINALIST' | 'SEMIFINALIST' | 'FINALIST' {
    if (metadata.finalistIds.includes(teamId)) {
      return 'FINALIST';
    }
    const semifinal = metadata.stages.find((value) => value.type === 'SEMIFINAL');
    const reached = (semifinal?.encounterIds ?? []).some((id) => {
      const encounter = metadata.encounters.find((value) => value.id === id);
      return encounter?.teamAId === teamId || encounter?.teamBId === teamId;
    });
    return reached ? 'SEMIFINALIST' : 'QUARTERFINALIST';
  }
}
