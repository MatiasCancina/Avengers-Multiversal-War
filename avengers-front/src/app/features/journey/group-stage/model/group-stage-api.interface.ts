export interface GroupStageApi {
  journeyAvailable: boolean;
  playerTeamId: string;
  playerGroupId: string | null;
  groups: GroupStageGroupApi[];
}

export interface GroupStageGroupApi {
  groupId: string;
  playerGroup: boolean;
  standings: GroupStageStandingApi[];
  encounters: GroupStageEncounterApi[];
}

export interface GroupStageStandingApi {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  damageDealt: number;
  damageReceived: number;
  damageDifference: number;
  qualified: boolean;
  playerTeam: boolean;
}

export interface GroupStageEncounterApi {
  encounterId: string;
  stageId: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  resolutionCode: string;
  results: GroupStageEncounterResultApi[];
  damageByTeam: GroupStageEncounterDamageApi[];
}

export interface GroupStageEncounterResultApi {
  teamId: string;
  resultCode: string;
}

export interface GroupStageEncounterDamageApi {
  teamId: string;
  damageDealt: number;
}
