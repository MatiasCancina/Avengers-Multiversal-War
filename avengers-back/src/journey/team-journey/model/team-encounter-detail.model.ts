import { TeamJourneyOutcome } from './team-journey.model';

export interface TeamEncounterDetailModel {
  encounterId: string;
  stageId: string;
  stageCode: string;
  groupId: string | null;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  resolutionCode: string;
  rivalEncounter: boolean;
  outcome: TeamJourneyOutcome;
  damageDealt: number | null;
  rounds: TeamEncounterRoundModel[];
  extraRound: TeamEncounterRoundModel | null;
}

export interface TeamEncounterRoundModel {
  number: number;
  roundType: 'NORMAL' | 'EXTRA_ROUND';
  initiativeTeamId: string;
  initiativeTeamName: string;
  winnerTeamId: string | null;
  winnerTeamName: string | null;
  damageByTeam: TeamEncounterDamageModel[];
  activeHeroesByTeam: TeamEncounterActiveHeroesModel[];
  events: TeamEncounterEventModel[];
}

export interface TeamEncounterDamageModel {
  teamId: string;
  teamName: string;
  damageDealt: number;
}

export interface TeamEncounterActiveHeroesModel {
  teamId: string;
  teamName: string;
  heroes: TeamEncounterHeroModel[];
}

export interface TeamEncounterHeroModel {
  heroId: string;
  heroName: string;
}

export interface TeamEncounterEventModel {
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
  narrativeLines: TeamEncounterNarrativeLineModel[];
}

export interface TeamEncounterNarrativeLineModel {
  lineSequence: number;
  type: string;
  speakerId: string | null;
  speakerName: string | null;
  text: string;
}
