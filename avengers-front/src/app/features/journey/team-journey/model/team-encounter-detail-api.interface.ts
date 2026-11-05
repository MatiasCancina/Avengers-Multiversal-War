import { TeamJourneyOutcomeApi } from './team-journey-api.interface';

export interface TeamJourneyDetailApi {
  encounterId: string;
  stageId: string;
  stageCode: string;
  groupId: string | null;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  resolutionCode: string;
  rivalEncounter: boolean;
  outcome: TeamJourneyOutcomeApi;
  damageDealt: number | null;
  rounds: TeamJourneyRoundApi[];
  extraRound: TeamJourneyRoundApi | null;
}

export interface TeamJourneyRoundApi {
  number: number;
  roundType: 'NORMAL' | 'EXTRA_ROUND';
  initiativeTeamId: string;
  initiativeTeamName: string;
  winnerTeamId: string | null;
  winnerTeamName: string | null;
  damageByTeam: TeamJourneyDamageApi[];
  activeHeroesByTeam: TeamJourneyActiveHeroesApi[];
  events: TeamJourneyEventApi[];
}

export interface TeamJourneyDamageApi {
  teamId: string;
  teamName: string;
  damageDealt: number;
}

export interface TeamJourneyActiveHeroesApi {
  teamId: string;
  teamName: string;
  heroes: TeamJourneyHeroApi[];
}

export interface TeamJourneyHeroApi {
  heroId: string;
  heroName: string;
}

export interface TeamJourneyEventApi {
  sequence: number;
  eventCode: string;
  teamId: string | null;
  teamName: string | null;
  actorHeroId: string | null;
  actorHeroName: string | null;
  targetHeroIds: string[];
  targetHeroNames: string[];
  messageCode: string;
  amount: number | null;
  narrativeLines: TeamJourneyNarrativeLineApi[];
}

export interface TeamJourneyNarrativeLineApi {
  lineSequence: number;
  type: string;
  speakerId: string | null;
  speakerName: string | null;
  text: string;
}
