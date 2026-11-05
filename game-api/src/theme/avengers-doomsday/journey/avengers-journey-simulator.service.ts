import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { FinalStageStatus } from '../../../final-stage/model/final-stage-status.enum';
import { TeamMemberStatus } from '../../../teams/model/team-member-status.enum';
import { AvengersConfig } from '../avengers-config.service';
import {
  AvengersHeroContent,
  AvengersNarrativeCharacterContent,
} from '../catalog/model/avengers-hero-content.model';
import { AvengersStrategy } from '../model/avengers-strategy.enum';
import { SynergyLevel } from '../model/synergy-level.enum';
import { AvengersFinalStagePhase } from '../model/avengers-final-stage-phase.enum';
import { AvengersTeamState } from '../model/avengers-team-state.model';
import { AvengersTurnData } from '../model/avengers-turn-data.model';
import { AVENGERS_POWER_UPS } from '../store/avengers-power-up.catalog';
import { AvengersEncounterSimulator } from './avengers-encounter-simulator.service';
import { AvengersJourneyConfig } from './avengers-journey-config.service';
import { AvengersJourneyRandom, JourneyRandomState } from './avengers-journey-random';
import { AvengersTournamentGenerator } from './avengers-tournament-generator.service';
import {
  AvengersEncounter,
  AvengersJourneyEvent,
  AvengersJourneyMetadata,
  AvengersRewardLedgerEntry,
  AvengersStage,
  AvengersTeamConfiguration,
  AvengersTournamentTeam,
} from './model/avengers-journey-metadata.model';
import { JourneySpendingStrategy } from './model/journey-spending-strategy.enum';

@Injectable()
export class AvengersJourneySimulator {
  constructor(
    private readonly generator: AvengersTournamentGenerator,
    private readonly encounters: AvengersEncounterSimulator,
    private readonly random: AvengersJourneyRandom,
    private readonly journeyConfig: AvengersJourneyConfig,
    private readonly finalConfig: AvengersConfig,
  ) {}

  simulate(input: {
    teamId: string;
    configuration: AvengersTeamConfiguration;
    heroes: AvengersHeroContent[];
    narrativeCharacters: AvengersNarrativeCharacterContent[];
    seed: number;
    spendingStrategy: JourneySpendingStrategy;
  }): AvengersJourneyMetadata {
    const random: JourneyRandomState = { value: input.seed || 0x9e3779b9 };
    const generated = this.generator.generate(
      input.teamId,
      input.configuration,
      input.heroes,
      random,
    );
    const teams = generated.teams;
    const byId = new Map(teams.map((team) => [team.id, team]));
    const catalog = new Map(input.heroes.map((hero) => [hero.id, hero]));
    const encounterList: AvengersEncounter[] = [];
    const ledger: AvengersRewardLedgerEntry[] = [];
    const events: AvengersJourneyEvent[] = [];
    let encounterSequence = 1;
    const nextEncounterId = () => `encounter-${String(encounterSequence++).padStart(2, '0')}`;
    const settle = (encounter: AvengersEncounter): void => {
      encounterList.push(encounter);
      for (const teamId of [encounter.teamAId, encounter.teamBId]) {
        const team = byId.get(teamId)!;
        const result = encounter.resultByTeam[teamId];
        const base =
          result === 'WIN'
            ? this.journeyConfig.balance.rewards.win
            : result === 'DRAW'
              ? this.journeyConfig.balance.rewards.draw
              : this.journeyConfig.balance.rewards.loss;
        const rivalBonus =
          result === 'WIN' && encounter.rival ? this.journeyConfig.balance.rewards.rivalWin : 0;
        const opponentId = teamId === encounter.teamAId ? encounter.teamBId : encounter.teamAId;
        const totalKo =
          result === 'WIN' &&
          byId.get(opponentId)!.heroes.every((hero) => hero.knockedOut) &&
          encounter.resolution !== 'TECHNICAL_VERDICT';
        const totalKoBonus = totalKo ? this.journeyConfig.balance.rewards.totalKoWin : 0;
        let balance = team.rewardPoints;
        for (const [reason, amount] of [
          [result, base],
          ['RIVAL_WIN', rivalBonus],
          ['TOTAL_KO_WIN', totalKoBonus],
        ] as const) {
          if (amount > 0) {
            balance += amount;
            ledger.push({
              id: `ledger-${ledger.length + 1}`,
              teamId,
              encounterId: encounter.id,
              reason,
              amount,
              balanceAfter: balance,
            });
          }
        }
        team.rewardPoints = balance;
        encounter.rewardByTeam[teamId] = base + rivalBonus + totalKoBonus;
      }
      for (const round of [
        ...encounter.rounds,
        ...(encounter.extraRound ? [encounter.extraRound] : []),
      ]) {
        for (const event of round.events) {
          event.sequence = events.length + 1;
          event.stageId = encounter.stageId;
          event.encounterId = encounter.id;
          event.round = round.round;
          events.push(event);
        }
      }
      for (const gain of encounter.statGains) {
        events.push({
          sequence: events.length + 1,
          type: 'STAT_GAIN',
          stageId: encounter.stageId,
          encounterId: encounter.id,
          round: null,
          teamId: gain.teamId,
          actorHeroId: gain.heroId,
          targetHeroIds: [gain.heroId],
          values: { stat: gain.stat, amount: gain.amount },
          messageCode: 'journey.stat_gain',
        });
      }
    };

    const groupSchedules = [
      [0, 1, 2, 3],
      [0, 2, 1, 3],
      [0, 3, 1, 2],
    ];
    for (let matchday = 0; matchday < 3; matchday += 1) {
      for (const stage of generated.stages) {
        const ids = stage.standings.map((row) => row.teamId);
        const schedule = groupSchedules[matchday];
        const pairs = [
          [ids[schedule[0]], ids[schedule[1]]],
          [ids[schedule[2]], ids[schedule[3]]],
        ] as Array<[string, string]>;
        // On the last matchday settle the other Group match first. That lets the
        // simulator determine whether an ordinary loss would still leave the
        // Player strictly in the top two, without retries or post-hoc standings.
        if (matchday === 2) {
          pairs.sort((a, b) => Number(a.includes(input.teamId)) - Number(b.includes(input.teamId)));
        }
        for (const [teamAId, teamBId] of pairs) {
          const teamA = byId.get(teamAId)!;
          const teamB = byId.get(teamBId)!;
          const playerEncounter = teamA.id === input.teamId || teamB.id === input.teamId;
          const opponentId =
            teamA.id === input.teamId ? teamB.id : teamB.id === input.teamId ? teamA.id : null;
          const requirePlayerEncounterWin =
            playerEncounter &&
            (matchday < 2 || !this.playerQualifiesWithLoss(stage, input.teamId, opponentId!));
          const id = nextEncounterId();
          const encounter = this.encounters.simulate({
            id,
            stageId: stage.id,
            stageType: 'GROUP_STAGE',
            groupId: stage.groupId,
            teamA,
            teamB,
            catalog,
            random,
            playerTeamId: input.teamId,
            knockout: false,
            requirePlayerEncounterWin,
          });
          stage.encounterIds.push(id);
          settle(encounter);
          this.applyStanding(stage, encounter);
        }
      }
      if (matchday < 2) {
        this.manageActiveTeams(
          teams,
          input.teamId,
          input.spendingStrategy,
          catalog,
          ledger,
          events,
          encounterList.at(-1)?.id ?? null,
        );
      }
    }
    for (const stage of generated.stages) {
      stage.standings.sort(
        (a, b) =>
          b.points - a.points ||
          b.damageDifference - a.damageDifference ||
          b.damageDealt - a.damageDealt ||
          a.tieRank - b.tieRank,
      );
      stage.standings.forEach((row, index) => {
        row.qualified = index < 2;
      });
      const player = stage.standings.find((row) => row.teamId === input.teamId);
      if (player && !player.qualified) {
        throw new Error(
          `The configured Player-winning round plan did not produce an ordinary top-two result in Group ${stage.groupId}.`,
        );
      }
    }
    const groupQualifiers = generated.stages.flatMap((stage) =>
      stage.standings.filter((row) => row.qualified).map((row) => row.teamId),
    );
    this.recover(
      groupQualifiers.map((id) => byId.get(id)!),
      catalog,
      this.journeyConfig.balance.stageRecovery,
      events,
      'GROUP_QUALIFICATION',
    );
    this.manageActiveTeams(
      groupQualifiers.map((id) => byId.get(id)!),
      input.teamId,
      input.spendingStrategy,
      catalog,
      ledger,
      events,
      encounterList.at(-1)?.id ?? null,
    );

    const group = (letter: string) =>
      generated.stages
        .find((stage) => stage.groupId === letter)!
        .standings.filter((row) => row.qualified)
        .map((row) => row.teamId);
    const [A, B, C, D, E, F, G, H] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(group);
    const r16Pairs: Array<[string, string]> = [
      [A[0], B[1]],
      [C[0], D[1]],
      [E[0], F[1]],
      [G[0], H[1]],
      [B[0], A[1]],
      [D[0], C[1]],
      [F[0], E[1]],
      [H[0], G[1]],
    ];
    const r16 = this.knockoutStage(
      'round-of-16',
      'ROUND_OF_16',
      9,
      r16Pairs,
      byId,
      catalog,
      random,
      input.teamId,
      nextEncounterId,
      settle,
    );
    this.manageActiveTeams(
      r16.winners.map((id) => byId.get(id)!),
      input.teamId,
      input.spendingStrategy,
      catalog,
      ledger,
      events,
      encounterList.at(-1)?.id ?? null,
    );
    const qfPairs = this.adjacentPairs(r16.winners);
    const qf = this.knockoutStage(
      'quarterfinal',
      'QUARTERFINAL',
      10,
      qfPairs,
      byId,
      catalog,
      random,
      input.teamId,
      nextEncounterId,
      settle,
    );
    this.recover(
      qf.winners.map((id) => byId.get(id)!),
      catalog,
      this.journeyConfig.balance.stageRecovery,
      events,
      'SEMIFINAL_QUALIFICATION',
    );
    this.manageActiveTeams(
      qf.winners.map((id) => byId.get(id)!),
      input.teamId,
      input.spendingStrategy,
      catalog,
      ledger,
      events,
      encounterList.at(-1)?.id ?? null,
    );
    const sf = this.knockoutStage(
      'semifinal',
      'SEMIFINAL',
      11,
      this.adjacentPairs(qf.winners),
      byId,
      catalog,
      random,
      input.teamId,
      nextEncounterId,
      settle,
    );
    this.recover(
      sf.winners.map((id) => byId.get(id)!),
      catalog,
      this.journeyConfig.balance.finalRecovery,
      events,
      'FINAL_STAGE_RECOVERY',
    );
    const opponentFinalistId = sf.winners.find((id) => id !== input.teamId);
    if (!opponentFinalistId || !sf.winners.includes(input.teamId)) {
      throw new Error(
        'Player must reach FinalStage and one natural Opponent finalist must emerge.',
      );
    }
    this.manage(
      byId.get(opponentFinalistId)!,
      false,
      input.spendingStrategy,
      catalog,
      ledger,
      events,
      encounterList.at(-1)?.id ?? null,
      false,
    );
    for (const team of teams) {
      team.eliminated =
        !groupQualifiers.includes(team.id) ||
        (team.id !== input.teamId &&
          team.id !== opponentFinalistId &&
          !sf.winners.includes(team.id));
    }
    const finalStage = this.prepareFinal(
      byId.get(input.teamId)!,
      byId.get(opponentFinalistId)!,
      catalog,
      input.seed,
      random.value,
    );
    const balanceFingerprint = createHash('sha256')
      .update(
        JSON.stringify({ journey: this.journeyConfig.balance, final: this.finalConfig.balance }),
      )
      .digest('hex');
    return {
      versions: {
        metadataVersion: 'avengers-journey-metadata-v2',
        rulesVersion: 'avengers-journey-rules-v1',
        contentVersion: input.heroes[0]?.contentVersion ?? 'unknown',
        awardsVersion: 'avengers-awards-v1',
        balanceFingerprint,
      },
      seed: input.seed,
      randomState: random.value,
      spendingStrategy: input.spendingStrategy,
      createdAt: new Date().toISOString(),
      completedAt: null,
      initialConfiguration: structuredClone(input.configuration),
      content: {
        heroes: structuredClone(input.heroes),
        narrativeCharacters: structuredClone(input.narrativeCharacters),
        powerUps: structuredClone(AVENGERS_POWER_UPS),
      },
      teams,
      stages: [...generated.stages, r16.stage, qf.stage, sf.stage],
      encounters: encounterList,
      finalistIds: [input.teamId, opponentFinalistId],
      rewardLedger: ledger,
      events,
      finalStage,
      completionReason: null,
      endingCode: null,
      terminalReasonCode: null,
      statistics: null,
    };
  }

  private knockoutStage(
    id: string,
    type: 'ROUND_OF_16' | 'QUARTERFINAL' | 'SEMIFINAL',
    order: number,
    pairs: Array<[string, string]>,
    byId: Map<string, AvengersTournamentTeam>,
    catalog: Map<string, AvengersHeroContent>,
    random: JourneyRandomState,
    playerTeamId: string,
    nextId: () => string,
    settle: (encounter: AvengersEncounter) => void,
  ) {
    const stage: AvengersStage = {
      id,
      type,
      order,
      groupId: null,
      encounterIds: [],
      standings: [],
    };
    const winners: string[] = [];
    for (const [a, b] of pairs) {
      const encounterId = nextId();
      const encounter = this.encounters.simulate({
        id: encounterId,
        stageId: id,
        stageType: type,
        groupId: null,
        teamA: byId.get(a)!,
        teamB: byId.get(b)!,
        catalog,
        random,
        playerTeamId,
        knockout: true,
      });
      stage.encounterIds.push(encounterId);
      settle(encounter);
      winners.push(encounter.winnerTeamId!);
      byId.get(a)!.eliminated = encounter.winnerTeamId !== a;
      byId.get(b)!.eliminated = encounter.winnerTeamId !== b;
    }
    return { stage, winners };
  }

  private adjacentPairs(values: string[]): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < values.length; i += 2) {
      pairs.push([values[i], values[i + 1]]);
    }
    return pairs;
  }

  private applyStanding(stage: AvengersStage, encounter: AvengersEncounter): void {
    for (const teamId of [encounter.teamAId, encounter.teamBId]) {
      const row = stage.standings.find((value) => value.teamId === teamId)!;
      const opponentId = teamId === encounter.teamAId ? encounter.teamBId : encounter.teamAId;
      const result = encounter.resultByTeam[teamId];
      row.played += 1;
      row.wins += result === 'WIN' ? 1 : 0;
      row.draws += result === 'DRAW' ? 1 : 0;
      row.losses += result === 'LOSS' ? 1 : 0;
      row.points += result === 'WIN' ? 3 : result === 'DRAW' ? 1 : 0;
      row.damageDealt += encounter.damageByTeam[teamId];
      row.damageReceived += encounter.damageByTeam[opponentId];
      row.damageDifference = row.damageDealt - row.damageReceived;
    }
  }

  private playerQualifiesWithLoss(
    stage: AvengersStage,
    playerTeamId: string,
    opponentId: string,
  ): boolean {
    const player = stage.standings.find((row) => row.teamId === playerTeamId)!;
    const otherPoints = stage.standings
      .filter((row) => row.teamId !== playerTeamId)
      .map((row) => row.points + (row.teamId === opponentId ? 3 : 0));
    return otherPoints.filter((points) => points >= player.points).length <= 1;
  }

  private recover(
    teams: AvengersTournamentTeam[],
    catalog: Map<string, AvengersHeroContent>,
    policy: { energyPercent: number; apPercent: number; reviveAll: boolean; clearEffects: boolean },
    events: AvengersJourneyEvent[],
    reason: string,
  ): void {
    for (const team of teams) {
      for (const hero of team.heroes) {
        const definition = catalog.get(hero.heroId)!;
        if (hero.knockedOut && policy.reviveAll) {
          hero.knockedOut = false;
          hero.currentEnergy = Math.max(
            1,
            Math.round((definition.maxEnergy * policy.energyPercent) / 100),
          );
        } else if (!hero.knockedOut) {
          hero.currentEnergy = Math.max(
            hero.currentEnergy,
            Math.round((definition.maxEnergy * policy.energyPercent) / 100),
          );
        }
        if (!hero.knockedOut) {
          hero.currentAbilityPoints = Math.max(
            hero.currentAbilityPoints,
            Math.round((definition.maxAbilityPoints * policy.apPercent) / 100),
          );
        }
      }
      if (policy.clearEffects) {
        team.temporaryEffects = [];
      }
      this.repairFormation(team);
      events.push({
        sequence: events.length + 1,
        type: 'RECOVERY',
        stageId: null,
        encounterId: null,
        round: null,
        teamId: team.id,
        actorHeroId: null,
        targetHeroIds: team.heroIds,
        values: { reason, energyPercent: policy.energyPercent, apPercent: policy.apPercent },
        messageCode: 'journey.recovery',
      });
    }
  }

  private manageActiveTeams(
    teams: AvengersTournamentTeam[],
    playerTeamId: string,
    strategy: JourneySpendingStrategy,
    catalog: Map<string, AvengersHeroContent>,
    ledger: AvengersRewardLedgerEntry[],
    events: AvengersJourneyEvent[],
    encounterId: string | null,
  ): void {
    for (const team of teams.filter((value) => !value.eliminated)) {
      this.manage(
        team,
        team.id === playerTeamId,
        strategy,
        catalog,
        ledger,
        events,
        encounterId,
        true,
      );
    }
  }

  private manage(
    team: AvengersTournamentTeam,
    isPlayer: boolean,
    playerStrategy: JourneySpendingStrategy,
    catalog: Map<string, AvengersHeroContent>,
    ledger: AvengersRewardLedgerEntry[],
    events: AvengersJourneyEvent[],
    encounterId: string | null,
    allowOffense: boolean,
  ): void {
    const reserve = isPlayer
      ? playerStrategy === JourneySpendingStrategy.BALANCED
        ? 20
        : playerStrategy === JourneySpendingStrategy.AGGRESSIVE
          ? 5
          : 0
      : 0;
    let operations = 0;
    const spend = (itemId: string, targetId: string | null, apply: () => void): boolean => {
      const item = AVENGERS_POWER_UPS.find((value) => value.id === itemId)!;
      if (
        team.rewardPoints < item.price ||
        (team.rewardPoints - item.price < reserve && itemId !== 'revive')
      ) {
        return false;
      }
      team.rewardPoints -= item.price;
      operations += 1;
      apply();
      ledger.push({
        id: `ledger-${ledger.length + 1}`,
        teamId: team.id,
        encounterId,
        reason: 'PURCHASE',
        amount: -item.price,
        balanceAfter: team.rewardPoints,
      });
      events.push({
        sequence: events.length + 1,
        type: 'AUTO_PURCHASE_USE',
        stageId: null,
        encounterId,
        round: null,
        teamId: team.id,
        actorHeroId: targetId,
        targetHeroIds: targetId ? [targetId] : [],
        values: { itemId, price: item.price },
        messageCode: 'journey.auto_purchase_use',
      });
      return true;
    };
    const ko = team.heroes
      .filter((hero) => hero.knockedOut)
      .sort((a, b) =>
        a.heroId === team.leaderId
          ? -1
          : b.heroId === team.leaderId
            ? 1
            : a.heroId.localeCompare(b.heroId),
      );
    for (const hero of ko) {
      if (operations >= 2) {
        break;
      }
      spend('revive', hero.heroId, () => {
        const definition = catalog.get(hero.heroId)!;
        hero.knockedOut = false;
        hero.currentEnergy = Math.max(
          1,
          Math.round((definition.maxEnergy * this.finalConfig.balance.reviveEnergyPercent) / 100),
        );
        hero.currentAbilityPoints = Math.round(
          (definition.maxAbilityPoints * this.finalConfig.balance.reviveApPercent) / 100,
        );
        hero.active = false;
      });
    }
    if (isPlayer && playerStrategy === JourneySpendingStrategy.SAVE) {
      this.repairFormation(team);
      return;
    }
    const energyThreshold = 0.35;
    const apThreshold =
      isPlayer && playerStrategy === JourneySpendingStrategy.AGGRESSIVE ? 0.5 : 0.35;
    for (const hero of team.heroes
      .filter((value) => !value.knockedOut)
      .sort(
        (a, b) =>
          a.currentEnergy / catalog.get(a.heroId)!.maxEnergy -
            b.currentEnergy / catalog.get(b.heroId)!.maxEnergy || a.heroId.localeCompare(b.heroId),
      )) {
      if (operations >= 2) {
        break;
      }
      const definition = catalog.get(hero.heroId)!;
      if (hero.currentEnergy / definition.maxEnergy < energyThreshold) {
        spend('energy-major', hero.heroId, () => {
          hero.currentEnergy = Math.min(
            definition.maxEnergy,
            hero.currentEnergy + Math.max(1, Math.round(definition.maxEnergy * 0.25)),
          );
        });
      } else if (hero.currentAbilityPoints / definition.maxAbilityPoints < apThreshold) {
        spend('ap-major', hero.heroId, () => {
          hero.currentAbilityPoints = Math.min(
            definition.maxAbilityPoints,
            hero.currentAbilityPoints + Math.max(1, Math.round(definition.maxAbilityPoints * 0.25)),
          );
        });
      }
    }
    const aggressive = isPlayer
      ? playerStrategy === JourneySpendingStrategy.AGGRESSIVE
      : team.leaderProfile === AvengersStrategy.AGGRESSIVE;
    if (allowOffense && aggressive && operations < 2) {
      spend('ability-boost-all', null, () => {
        team.temporaryEffects.push({
          stat: 'ability',
          percent: 10,
          remainingRounds: 2,
          heroIds: team.heroes
            .filter((hero) => hero.active && !hero.knockedOut)
            .map((hero) => hero.heroId),
        });
      });
    }
    this.repairFormation(team);
  }

  private prepareFinal(
    player: AvengersTournamentTeam,
    opponent: AvengersTournamentTeam,
    catalog: Map<string, AvengersHeroContent>,
    seed: number,
    randomState: number,
  ) {
    const content = {
      heroes: Object.fromEntries(
        [...new Set([...player.heroIds, ...opponent.heroIds])].map((id) => {
          const hero = catalog.get(id)!;
          return [
            id,
            {
              id: hero.id,
              name: hero.displayName,
              stats: hero.stats,
              primaryRole: hero.primaryRole,
              secondaryRole: hero.secondaryRole,
              maxEnergy: hero.maxEnergy,
              maxAbilityPoints: hero.maxAbilityPoints,
              allies: hero.allies,
              rivals: hero.rivals,
              basicAttack: hero.basicAttack,
              offensiveAbility: hero.offensiveAbility,
              supportAbility: hero.supportAbility,
              leadership: hero.leadership,
            },
          ];
        }),
      ),
      teams: Object.fromEntries(
        [player, opponent].map((team) => {
          const leader = catalog.get(team.leaderId)!;
          return [
            team.id,
            {
              id: team.id,
              name: team.name,
              leaderId: team.leaderId,
              leaderProfile: team.leaderProfile,
              leaderAbility: leader.leadership!.ability,
            },
          ];
        }),
      ),
    };
    const state = (team: AvengersTournamentTeam): AvengersTeamState => ({
      teamId: team.id,
      leaderId: team.leaderId,
      leaderProfile: team.leaderProfile,
      strategy: team.strategy,
      heroes: team.heroes.map((hero) => {
        const definition = catalog.get(hero.heroId)!;
        const baseStats = { ...definition.stats };
        for (const stat of ['power', 'agility', 'resistance', 'ability'] as const) {
          baseStats[stat] += hero.statGains[stat] ?? 0;
        }
        return {
          heroId: hero.heroId,
          status:
            hero.active && !hero.knockedOut ? TeamMemberStatus.ACTIVE : TeamMemberStatus.INACTIVE,
          condition: hero.knockedOut ? 'KNOCKED_OUT' : 'AVAILABLE',
          maxEnergy: definition.maxEnergy,
          currentEnergy: hero.currentEnergy,
          maxAbilityPoints: definition.maxAbilityPoints,
          currentAbilityPoints: hero.currentAbilityPoints,
          returnAtTurn: 0,
          baseStats,
        };
      }),
      vacantActiveHeroIds: [],
      synergy: { value: 0, level: SynergyLevel.LOW, statModifier: 0, teamActionBonus: 0 },
      effects: [],
      strategyChangesRemaining: this.finalConfig.balance.maxStrategyChanges,
      strategyChangeAtTurn: 0,
      teamActionsRemaining: this.finalConfig.balance.maxTeamActions + team.extraTeamActions,
      leaderAbilityUsesRemaining:
        this.finalConfig.balance.maxLeaderUses + team.extraLeaderAbilities,
    });
    const data: AvengersTurnData = {
      themeId: 'avengers-doomsday',
      player: state(player),
      opponent: state(opponent),
      doom: null,
      rivalry:
        this.relationship(catalog.get(player.leaderId)!, catalog.get(opponent.leaderId)!) ===
        'RIVAL',
      inventory: player.inventory.map((entry) => {
        const definition = AVENGERS_POWER_UPS.find((item) => item.id === entry.itemId)!;
        return {
          id: entry.itemId,
          name: definition.name.en,
          target: definition.target,
          effect: definition.effect as never,
          quantity: entry.quantity,
        };
      }),
      phase: AvengersFinalStagePhase.TOURNAMENT_FINAL,
      revealOccurred: false,
      opponentHadLivingAtActIIStart: false,
      doomAloneNarrativeEmitted: false,
      sueStormAppealStatus: 'LOCKED',
      endingCode: null,
      terminalReasonCode: null,
      difficultyProfile: structuredClone(this.finalConfig.finalBattleDifficulty),
      finalAttackInitiator: null,
      outcome: null,
      randomState: randomState || seed || 0x9e3779b9,
      availableActions: [],
      events: [],
      timeline: [],
      cycleFacts: [],
      content,
    };
    return { status: FinalStageStatus.READY, turn: 0, data };
  }

  private repairFormation(team: AvengersTournamentTeam): void {
    const living = team.heroes.filter((hero) => !hero.knockedOut && hero.currentEnergy > 0);
    for (const hero of team.heroes) {
      if (!living.includes(hero)) {
        hero.active = false;
      }
    }
    const target = Math.min(3, living.length);
    const leader = living.find((hero) => hero.heroId === team.leaderId);
    const activeIds: string[] = [];
    if (leader) {
      activeIds.push(leader.heroId);
    }
    const existingActive = living.filter((hero) => hero.active && !activeIds.includes(hero.heroId));
    const candidates = [
      ...existingActive,
      ...living
        .filter((hero) => !activeIds.includes(hero.heroId) && !existingActive.includes(hero))
        .sort((a, b) => b.currentEnergy - a.currentEnergy || a.heroId.localeCompare(b.heroId)),
    ];
    for (const hero of candidates) {
      if (activeIds.length >= target) {
        break;
      }
      activeIds.push(hero.heroId);
    }
    for (const hero of team.heroes) {
      hero.active = activeIds.includes(hero.heroId);
    }
  }

  private relationship(
    a: AvengersHeroContent,
    b: AvengersHeroContent,
  ): 'ALLY' | 'NORMAL' | 'RIVAL' {
    return a.rivals.includes(b.id) || b.rivals.includes(a.id)
      ? 'RIVAL'
      : a.allies.includes(b.id) || b.allies.includes(a.id)
        ? 'ALLY'
        : 'NORMAL';
  }
}
