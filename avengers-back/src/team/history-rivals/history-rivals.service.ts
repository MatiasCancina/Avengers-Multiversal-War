import { BadRequestException, Injectable } from '@nestjs/common';
import { GameApiService } from '../../basic/game-api.service';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApplicationContextService } from '../../basic/services/application-context.service';

type Team = { teamId: string; name: string; heroIds: string[] };
type Encounter = {
  encounterId: string;
  stageId: string;
  stageCode: string;
  groupId: string | null;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  results: { teamId: string; resultCode: string }[];
  damageByTeam: { teamId: string; damageDealt: number }[];
};
type Journey = { attemptId: string; teams: Team[] };
type History = { items: { attemptId: string; completedAt: string; outcomeCode: string }[] };

@Injectable()
export class HistoryRivalsService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService,
    private readonly api: GameApiService,
  ) { }

  async read(attemptId?: string) {
    const teamId = this.context.getCurrentTeamId();
    const lang = this.context.language;
    const [configuration, catalog, relationships, history] = await Promise.all([
      this.game.configuration(teamId),
      this.game.heroes(lang),
      this.game.relationships([]),
      this.api.get<History>(`/teams/${teamId}/history`, { lang }),
    ]);
    const heroes = [
      configuration.configuration.leaderId,
      ...configuration.configuration.companionIds,
    ]
      .map((id) => catalog.heroes.find((hero) => hero.id === id))
      .filter((hero): hero is (typeof catalog.heroes)[number] => Boolean(hero))
      .map((hero) => ({
        id: hero.id,
        name: hero.displayName,
        leader: hero.id === configuration.configuration.leaderId,
      }));
    const allowed = new Set(history.items.map((item) => item.attemptId));
    if (attemptId && !allowed.has(attemptId)) {
      throw new BadRequestException('The selected completed Journey is not available.');
    }
    const base = `/teams/${teamId}/journeys/${attemptId || 'current'}`;
    let teams: Team[] = [];
    let encounters: Encounter[] = [];
    let journeyAvailable = true;
    try {
      const [teamData, encounterData] = await Promise.all([
        this.api.get<Journey>(`${base}/teams`),
        this.api.get<{ encounters: Encounter[] }>(`${base}/encounters`),
      ]);
      teams = teamData.teams;
      encounters = encounterData.encounters;
    } catch (error) {
      if (attemptId) {
        throw error
      };
      const current = await this.game.currentJourney(teamId, lang);
      if (current.attempt) {
        throw error
      };
      journeyAvailable = false;
    }
    const teamMap = new Map(teams.map((team) => [team.teamId, team]));
    const heroName = new Map(catalog.heroes.map((hero) => [hero.id, hero.displayName]));
    const rivals = heroes.map((hero) => ({
      ...hero,
      rivals: [
        ...new Set(
          relationships.relationships
            .filter(
              (r) => r.relationship === 'RIVAL' && (r.heroAId === hero.id || r.heroBId === hero.id),
            )
            .map((r) => (r.heroAId === hero.id ? r.heroBId : r.heroAId)),
        ),
      ].map((id) => ({ id, name: heroName.get(id) || id })),
    }));
    const matches = encounters.flatMap((encounter) => {
      const a = teamMap.get(encounter.teamAId);
      const b = teamMap.get(encounter.teamBId);
      if (!a || !b) {
        return []
      };
      return rivals.flatMap((hero) =>
        hero.rivals
          .filter(
            (rival) =>
              (a.heroIds.includes(hero.id) && b.heroIds.includes(rival.id)) ||
              (b.heroIds.includes(hero.id) && a.heroIds.includes(rival.id)),
          )
          .map((rival) => ({
            heroId: hero.id,
            rivalId: rival.id,
            encounterId: encounter.encounterId,
            stageId: encounter.stageId,
            stageCode: encounter.stageCode,
            groupId: encounter.groupId,
            teamA: { id: a.teamId, name: a.name },
            teamB: { id: b.teamId, name: b.name },
            winnerTeamId: encounter.winnerTeamId,
            results: encounter.results,
            damageByTeam: encounter.damageByTeam,
          })),
      );
    });
    return {
      heroes: rivals,
      history: history.items,
      selectedAttemptId: attemptId || 'current',
      journeyAvailable,
      matches,
    };
  }
}
