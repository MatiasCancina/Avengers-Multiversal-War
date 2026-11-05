import { Injectable } from '@nestjs/common';
import { AvengersEvent } from '../model/avengers-event.model';
import {
  AvengersAwardDecision,
  AvengersCompetitionStatistics,
  AvengersEncounter,
  AvengersHeroStatistics,
  AvengersHeroStatisticsFacts,
  AvengersJourneyMetadata,
  AvengersTeamStatistics,
} from './model/avengers-journey-metadata.model';

interface MutableHero extends AvengersHeroStatistics {
  activeEncounterKeys: Set<string>;
  journeyEncounterKeys: Set<string>;
  finalEncounterKeys: Set<string>;
}

const facts = (): AvengersHeroStatisticsFacts => ({
  activeEncounters: 0,
  activeRounds: 0,
  winningActiveRounds: 0,
  damageDealt: 0,
  damageReceived: 0,
  healing: 0,
  kosCaused: 0,
  kosSuffered: 0,
  offensiveSpecialsUsed: 0,
  supportSpecialsUsed: 0,
  statGains: 0,
});

@Injectable()
export class AvengersStatisticsService {
  project(metadata: AvengersJourneyMetadata): AvengersCompetitionStatistics {
    const quarterfinal = metadata.stages.find((stage) => stage.type === 'QUARTERFINAL');
    const eligibleTeamIds = [
      ...new Set(
        (quarterfinal?.encounterIds ?? []).flatMap((id) => {
          const encounter = metadata.encounters.find((value) => value.id === id);
          return encounter ? [encounter.teamAId, encounter.teamBId] : [];
        }),
      ),
    ].sort();
    const eligible = new Set(eligibleTeamIds);
    const heroes = new Map<string, MutableHero>();
    const teams = new Map<string, AvengersTeamStatistics>();
    for (const team of metadata.teams) {
      teams.set(team.id, {
        teamId: team.id,
        encounters: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        damageDealt: 0,
        damageReceived: 0,
        healing: 0,
        kosCaused: 0,
        kosSuffered: 0,
        specialsUsed: 0,
        teamActionsUsed: 0,
        leaderAbilitiesUsed: 0,
        rewardPointsEarned: 0,
        rewardPointsSpent: 0,
        powerUpsUsed: 0,
        statGains: 0,
      });
      for (const heroId of team.heroIds) {
        heroes.set(this.key(team.id, heroId), {
          teamId: team.id,
          heroId,
          eligible: eligible.has(team.id),
          ...facts(),
          journey: facts(),
          finalStage: facts(),
          activeEncounterKeys: new Set(),
          journeyEncounterKeys: new Set(),
          finalEncounterKeys: new Set(),
        });
      }
    }
    for (const encounter of metadata.encounters) {
      this.journeyEncounter(encounter, heroes, teams);
    }
    for (const gain of metadata.encounters.flatMap((encounter) => encounter.statGains)) {
      const hero = heroes.get(this.key(gain.teamId, gain.heroId));
      if (hero) {
        hero.statGains += gain.amount;
        hero.journey.statGains += gain.amount;
      }
      const team = teams.get(gain.teamId);
      if (team) {
        team.statGains += gain.amount;
      }
    }
    for (const entry of metadata.rewardLedger) {
      const team = teams.get(entry.teamId);
      if (!team) {
        continue;
      }
      if (entry.amount >= 0) {
        team.rewardPointsEarned += entry.amount;
      } else {
        team.rewardPointsSpent += -entry.amount;
      }
    }
    this.finalStage(metadata, heroes, teams);
    for (const hero of heroes.values()) {
      hero.activeEncounters = hero.activeEncounterKeys.size;
      hero.journey.activeEncounters = hero.journeyEncounterKeys.size;
      hero.finalStage.activeEncounters = hero.finalEncounterKeys.size;
    }
    const heroStatistics = [...heroes.values()]
      .map(
        ({
          activeEncounterKeys: _keys,
          journeyEncounterKeys: _journeyKeys,
          finalEncounterKeys: _finalKeys,
          ...hero
        }) => hero,
      )
      .sort((a, b) => a.teamId.localeCompare(b.teamId) || a.heroId.localeCompare(b.heroId));
    return {
      eligibleTeamIds,
      teamStatistics: [...teams.values()].sort((a, b) => a.teamId.localeCompare(b.teamId)),
      heroStatistics,
      awards: this.awards(heroStatistics),
      awardsVersion: 'avengers-awards-v1',
    };
  }

  private journeyEncounter(
    encounter: AvengersEncounter,
    heroes: Map<string, MutableHero>,
    teams: Map<string, AvengersTeamStatistics>,
  ): void {
    for (const teamId of [encounter.teamAId, encounter.teamBId]) {
      const team = teams.get(teamId)!;
      const opponent = teamId === encounter.teamAId ? encounter.teamBId : encounter.teamAId;
      const result = encounter.resultByTeam[teamId];
      team.encounters += 1;
      team.wins += result === 'WIN' ? 1 : 0;
      team.draws += result === 'DRAW' ? 1 : 0;
      team.losses += result === 'LOSS' ? 1 : 0;
      team.damageDealt += encounter.damageByTeam[teamId];
      team.damageReceived += encounter.damageByTeam[opponent];
    }
    for (const round of [
      ...encounter.rounds,
      ...(encounter.extraRound ? [encounter.extraRound] : []),
    ]) {
      for (const [teamId, ids] of Object.entries(round.participantHeroIds)) {
        for (const heroId of ids) {
          const hero = heroes.get(this.key(teamId, heroId));
          if (!hero) {
            continue;
          }
          hero.activeEncounterKeys.add(encounter.id);
          hero.journeyEncounterKeys.add(encounter.id);
          hero.activeRounds += 1;
          hero.journey.activeRounds += 1;
          if (round.winnerTeamId === teamId) {
            hero.winningActiveRounds += 1;
            hero.journey.winningActiveRounds += 1;
          }
        }
      }
      for (const event of round.events) {
        this.journeyEvent(event, encounter, heroes, teams);
      }
    }
  }

  private journeyEvent(
    event: AvengersEncounter['rounds'][number]['events'][number],
    encounter: AvengersEncounter,
    heroes: Map<string, MutableHero>,
    teams: Map<string, AvengersTeamStatistics>,
  ): void {
    const sourceTeam = event.teamId;
    if (!sourceTeam) {
      return;
    }
    const targetTeam = sourceTeam === encounter.teamAId ? encounter.teamBId : encounter.teamAId;
    const actor = event.actorHeroId
      ? heroes.get(this.key(sourceTeam, event.actorHeroId))
      : undefined;
    if (event.type === 'ACTION') {
      const type = String(event.values.actionType ?? '');
      if (type === 'OFFENSIVE_SPECIAL' && actor) {
        actor.offensiveSpecialsUsed++;
        actor.journey.offensiveSpecialsUsed++;
        teams.get(sourceTeam)!.specialsUsed++;
      }
      if (type === 'SUPPORT_SPECIAL' && actor) {
        actor.supportSpecialsUsed++;
        actor.journey.supportSpecialsUsed++;
        teams.get(sourceTeam)!.specialsUsed++;
      }
    }
    if (event.type === 'DAMAGE') {
      const value = Number(event.values.damage ?? 0);
      if (actor) {
        actor.damageDealt += value;
        actor.journey.damageDealt += value;
      }
      for (const targetId of event.targetHeroIds) {
        const target = heroes.get(this.key(targetTeam, targetId));
        if (target) {
          target.damageReceived += value;
          target.journey.damageReceived += value;
        }
      }
    }
    if (event.type === 'HEAL') {
      const value = Number(event.values.healing ?? 0);
      if (actor) {
        actor.healing += value;
        actor.journey.healing += value;
      }
      teams.get(sourceTeam)!.healing += value;
    }
    if (event.type === 'KO') {
      if (actor) {
        actor.kosCaused++;
        actor.journey.kosCaused++;
      }
      teams.get(sourceTeam)!.kosCaused++;
      for (const targetId of event.targetHeroIds) {
        const target = heroes.get(this.key(targetTeam, targetId));
        if (target) {
          target.kosSuffered++;
          target.journey.kosSuffered++;
        }
      }
      teams.get(targetTeam)!.kosSuffered++;
    }
  }

  private finalStage(
    metadata: AvengersJourneyMetadata,
    heroes: Map<string, MutableHero>,
    teams: Map<string, AvengersTeamStatistics>,
  ): void {
    const data = metadata.finalStage.data;
    const playerId = data.player.teamId;
    const opponentId = data.opponent.teamId;
    if (!data.cycleFacts?.length && !data.timeline.length) {
      return;
    }
    for (const teamId of [playerId, opponentId]) {
      teams.get(teamId)!.encounters += 1;
    }
    for (const fact of data.cycleFacts ?? []) {
      for (const [teamId, ids, winner] of [
        [playerId, fact.playerActiveHeroIds, fact.winnerSide === 'PLAYER'],
        [opponentId, fact.opponentActiveHeroIds, fact.winnerSide === 'OPPONENT'],
      ] as const) {
        for (const heroId of ids) {
          const hero = heroes.get(this.key(teamId, heroId));
          if (!hero) {
            continue;
          }
          hero.activeEncounterKeys.add(`final-stage:${metadata.seed}`);
          hero.finalEncounterKeys.add(`final-stage:${metadata.seed}`);
          hero.activeRounds++;
          hero.finalStage.activeRounds++;
          if (winner) {
            hero.winningActiveRounds++;
            hero.finalStage.winningActiveRounds++;
          }
        }
      }
    }
    for (const event of data.timeline) {
      this.finalEvent(event, playerId, opponentId, heroes, teams);
    }
  }

  private finalEvent(
    event: AvengersEvent,
    playerId: string,
    opponentId: string,
    heroes: Map<string, MutableHero>,
    teams: Map<string, AvengersTeamStatistics>,
  ): void {
    const sourceTeam =
      event.source === 'PLAYER' ? playerId : event.source === 'OPPONENT' ? opponentId : null;
    const targetTeam =
      event.targetSide === 'PLAYER'
        ? playerId
        : event.targetSide === 'OPPONENT'
          ? opponentId
          : null;
    const actor =
      sourceTeam && event.actorId ? heroes.get(this.key(sourceTeam, event.actorId)) : undefined;
    if (event.type === 'ACTION' && sourceTeam) {
      const type = String(event.parameters.actionType ?? '');
      const team = teams.get(sourceTeam)!;
      if (type === 'OFFENSIVE_SPECIAL' && actor) {
        actor.offensiveSpecialsUsed++;
        actor.finalStage.offensiveSpecialsUsed++;
        team.specialsUsed++;
      }
      if (type === 'SUPPORT_SPECIAL' && actor) {
        actor.supportSpecialsUsed++;
        actor.finalStage.supportSpecialsUsed++;
        team.specialsUsed++;
      }
      if (type === 'TEAM_ACTION') {
        team.teamActionsUsed++;
      }
      if (type === 'LEADER_ABILITY') {
        team.leaderAbilitiesUsed++;
      }
    }
    if (event.type === 'DAMAGE') {
      const value = event.values.damage ?? 0;
      if (actor) {
        actor.damageDealt += value;
        actor.finalStage.damageDealt += value;
      }
      if (sourceTeam) {
        teams.get(sourceTeam)!.damageDealt += value;
      }
      if (targetTeam) {
        teams.get(targetTeam)!.damageReceived += value;
        for (const targetId of event.targetIds) {
          const target = heroes.get(this.key(targetTeam, targetId));
          if (target) {
            target.damageReceived += value;
            target.finalStage.damageReceived += value;
          }
        }
      }
    }
    if (event.type === 'HEAL' && sourceTeam) {
      const value = event.values.healing ?? 0;
      if (actor) {
        actor.healing += value;
        actor.finalStage.healing += value;
      }
      teams.get(sourceTeam)!.healing += value;
    }
    if (event.type === 'KO') {
      if (actor) {
        actor.kosCaused++;
        actor.finalStage.kosCaused++;
      }
      if (sourceTeam) {
        teams.get(sourceTeam)!.kosCaused++;
      }
      if (targetTeam) {
        teams.get(targetTeam)!.kosSuffered++;
        for (const targetId of event.targetIds) {
          const target = heroes.get(this.key(targetTeam, targetId));
          if (target) {
            target.kosSuffered++;
            target.finalStage.kosSuffered++;
          }
        }
      }
    }
    if (event.type === 'POWER_UP' && sourceTeam) {
      teams.get(sourceTeam)!.powerUpsUsed++;
    }
  }

  private awards(rows: AvengersHeroStatistics[]): AvengersAwardDecision[] {
    const eligible = rows.filter((row) => row.eligible);
    const stable = (a: AvengersHeroStatistics, b: AvengersHeroStatistics) =>
      a.teamId.localeCompare(b.teamId) || a.heroId.localeCompare(b.heroId);
    const winner = (
      code: AvengersAwardDecision['code'],
      metric: string,
      sorted: AvengersHeroStatistics[],
      value: (row: AvengersHeroStatistics) => number,
      allowNone = false,
    ): AvengersAwardDecision => {
      const row = sorted[0] ?? null;
      const result = allowNone && row && value(row) === 0 ? null : row;
      return {
        code,
        metric,
        value: result ? value(result) : null,
        winner: result ? { teamId: result.teamId, heroId: result.heroId } : null,
        tieBreak: result ? { teamId: result.teamId, heroId: result.heroId } : {},
      };
    };
    const mightiest = [...eligible].sort((a, b) => b.damageDealt - a.damageDealt || stable(a, b));
    const support = [...eligible].sort((a, b) => b.healing - a.healing || stable(a, b));
    const resilient = eligible
      .filter((row) => row.activeEncounters > 0)
      .sort(
        (a, b) =>
          a.kosSuffered / a.activeEncounters - b.kosSuffered / b.activeEncounters ||
          a.kosSuffered - b.kosSuffered ||
          b.activeRounds - a.activeRounds ||
          b.damageReceived - a.damageReceived ||
          stable(a, b),
      );
    const mvp = [...eligible].sort(
      (a, b) =>
        b.winningActiveRounds - a.winningActiveRounds ||
        b.kosCaused - a.kosCaused ||
        b.damageDealt - a.damageDealt ||
        stable(a, b),
    );
    return [
      winner('MIGHTIEST_HERO', 'Damage Dealt', mightiest, (row) => row.damageDealt),
      winner('BEST_SUPPORT', 'Healing', support, (row) => row.healing, true),
      winner(
        'MOST_RESILIENT',
        'KO Rate',
        resilient,
        (row) => row.kosSuffered / row.activeEncounters,
      ),
      winner('JOURNEY_MVP', 'Winning Active Rounds', mvp, (row) => row.winningActiveRounds),
    ];
  }

  private key(teamId: string, heroId: string): string {
    return `${teamId}:${heroId}`;
  }
}
