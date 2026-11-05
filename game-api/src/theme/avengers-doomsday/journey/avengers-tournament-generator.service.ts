import { Injectable } from '@nestjs/common';
import { GameError } from '../../../basic/error/game-error';
import { GameErrorCode } from '../../../basic/error/game-error-code.enum';
import { AvengersHeroContent } from '../catalog/model/avengers-hero-content.model';
import { AvengersStrategy } from '../model/avengers-strategy.enum';
import { AvengersJourneyRandom, JourneyRandomState } from './avengers-journey-random';
import {
  AvengersStage,
  AvengersTeamConfiguration,
  AvengersTournamentTeam,
} from './model/avengers-journey-metadata.model';

@Injectable()
export class AvengersTournamentGenerator {
  constructor(private readonly random: AvengersJourneyRandom) {}

  generate(
    teamId: string,
    configuration: AvengersTeamConfiguration,
    catalog: AvengersHeroContent[],
    state: JourneyRandomState,
  ): { teams: AvengersTournamentTeam[]; stages: AvengersStage[] } {
    const byId = new Map(catalog.map((hero) => [hero.id, hero]));
    const playerIds = [configuration.leaderId, ...configuration.companionIds];
    if (
      playerIds.length !== 6 ||
      new Set(playerIds).size !== 6 ||
      playerIds.some((id) => !byId.has(id))
    ) {
      throw new GameError(
        GameErrorCode.INVALID_TEAM_CONFIGURATION,
        'The Player Team must contain six distinct catalog Heroes.',
      );
    }
    const playerSet = new Set(playerIds);
    const preferred = this.random.shuffle(
      state,
      catalog.filter((hero) => hero.eligibility === 'PREFERRED' && !playerSet.has(hero.id)),
    );
    const eligible = this.random.shuffle(
      state,
      catalog.filter((hero) => hero.eligibility === 'ELIGIBLE' && !playerSet.has(hero.id)),
    );
    const leaders = [...preferred, ...eligible].slice(0, 31);
    if (leaders.length !== 31) {
      throw new GameError(
        GameErrorCode.INVALID_TEAM_CONFIGURATION,
        'The catalog cannot provide 31 unique generated Leaders after excluding the Player Team.',
      );
    }
    const playerLeader = byId.get(configuration.leaderId)!;
    if (!playerLeader.leadership) {
      throw new GameError(
        GameErrorCode.INVALID_TEAM_CONFIGURATION,
        'The assigned Leader is not Leader-capable.',
      );
    }
    const player: AvengersTournamentTeam = {
      id: teamId,
      name: `${playerLeader.displayName} Team`,
      leaderId: playerLeader.id,
      heroIds: playerIds,
      leaderProfile: playerLeader.leadership.profile,
      strategy: configuration.strategy,
      generationMode: 'PLAYER',
      heroes: playerIds.map((id, index) =>
        this.heroState(
          byId.get(id)!,
          configuration.activeHeroIds.includes(id) ||
            (index === 0 && configuration.activeHeroIds.includes(configuration.leaderId)),
        ),
      ),
      rewardPoints: 0,
      inventory: [],
      temporaryEffects: [],
      extraTeamActions: 0,
      extraLeaderAbilities: 0,
      eliminated: false,
    };
    const availableCompanions = catalog.filter((hero) => !playerSet.has(hero.id));
    const generated = leaders.map((leader, index): AvengersTournamentTeam => {
      const modeRoll = this.random.next(state);
      const mode = modeRoll < 0.4 ? 'AFFINITY' : modeRoll < 0.8 ? 'VARIETY' : 'FRICTION';
      const candidates = availableCompanions.filter((hero) => hero.id !== leader.id);
      const companionIds: string[] = [];
      while (companionIds.length < 5) {
        const remaining = candidates.filter((hero) => !companionIds.includes(hero.id));
        const selected = this.random.weighted(state, remaining, (hero) =>
          this.companionWeight(leader, hero, mode),
        );
        companionIds.push(selected.id);
      }
      const strategy =
        this.random.next(state) < 0.6
          ? leader.leadership!.profile
          : this.random.shuffle(
              state,
              Object.values(AvengersStrategy).filter(
                (value) => value !== leader.leadership!.profile,
              ),
            )[0];
      const activeCompanions = this.random.shuffle(state, companionIds).slice(0, 2);
      const ids = [leader.id, ...companionIds];
      return {
        id: `generated-${String(index + 1).padStart(2, '0')}`,
        name: `${leader.displayName} Team`,
        leaderId: leader.id,
        heroIds: ids,
        leaderProfile: leader.leadership!.profile,
        strategy,
        generationMode: mode,
        heroes: ids.map((id) =>
          this.heroState(byId.get(id)!, id === leader.id || activeCompanions.includes(id)),
        ),
        rewardPoints: 0,
        inventory: [],
        temporaryEffects: [],
        extraTeamActions: 0,
        extraLeaderAbilities: 0,
        eliminated: false,
      };
    });
    const shuffled = this.random.shuffle(state, [player, ...generated]);
    const stages: AvengersStage[] = [];
    for (let group = 0; group < 8; group += 1) {
      const groupId = String.fromCharCode(65 + group);
      const groupTeams = shuffled.slice(group * 4, group * 4 + 4);
      stages.push({
        id: `group-${groupId.toLowerCase()}`,
        type: 'GROUP_STAGE',
        order: group + 1,
        groupId,
        encounterIds: [],
        standings: groupTeams.map((team, tieRank) => ({
          teamId: team.id,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          damageDealt: 0,
          damageReceived: 0,
          damageDifference: 0,
          tieRank,
          qualified: false,
        })),
      });
    }
    return { teams: [player, ...generated], stages };
  }

  private heroState(hero: AvengersHeroContent, active: boolean) {
    return {
      heroId: hero.id,
      currentEnergy: hero.maxEnergy,
      currentAbilityPoints: hero.maxAbilityPoints,
      active,
      knockedOut: false,
      statGains: {},
    };
  }

  private companionWeight(
    leader: AvengersHeroContent,
    candidate: AvengersHeroContent,
    mode: 'AFFINITY' | 'VARIETY' | 'FRICTION',
  ): number {
    const relationship =
      leader.rivals.includes(candidate.id) || candidate.rivals.includes(leader.id)
        ? 'RIVAL'
        : leader.allies.includes(candidate.id) || candidate.allies.includes(leader.id)
          ? 'ALLY'
          : 'NORMAL';
    const weights = {
      AFFINITY: { ALLY: 3, NORMAL: 1, RIVAL: 0.5 },
      VARIETY: { ALLY: 1, NORMAL: 1, RIVAL: 1 },
      FRICTION: { ALLY: 0.5, NORMAL: 1, RIVAL: 3 },
    } as const;
    return weights[mode][relationship];
  }
}
