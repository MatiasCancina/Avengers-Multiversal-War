export type KnockoutStageCode = 'ROUND_OF_16' | 'QUARTERFINAL' | 'SEMIFINAL';
export type NextStageCode = 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL_STAGE';

export interface JourneyStandingApi {
  position: number;
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  damageDealt: number;
  damageReceived: number;
  damageDifference: number;
  tieBreakRank: number;
  qualified: boolean;
}

export interface JourneyGroupApi {
  groupId: string;
  encounterIds: string[];
  standings: JourneyStandingApi[];
}

export interface JourneyFinalistsApi {
  playerTeamId: string;
  opponentTeamId: string;
}

export interface JourneyKnockoutMatchApi {
  slot: number;
  encounterId: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  nextStageCode: NextStageCode;
  nextSlot: number;
}

export interface JourneyKnockoutRoundApi {
  stageCode: KnockoutStageCode;
  matches: JourneyKnockoutMatchApi[];
}

export interface JourneyStagesApi {
  attemptId: string;
  groupStage: { groups: JourneyGroupApi[] };
  knockout: { rounds: JourneyKnockoutRoundApi[] };
  finalists: JourneyFinalistsApi;
}

export interface JourneyEncounterDamageApi {
  teamId: string;
  damageDealt: number;
}

export interface JourneyEncounterApi {
  encounterId: string;
  damageByTeam: JourneyEncounterDamageApi[];
}

export interface JourneyEncountersApi {
  attemptId: string;
  encounters: JourneyEncounterApi[];
}
