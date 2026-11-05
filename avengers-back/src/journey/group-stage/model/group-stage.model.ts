
export interface GroupStageModel {
  journeyAvailable: boolean;
  playerTeamId: string;
  playerGroupId: string | null;
  groups: GroupStageGroupModel[];
}

export interface GroupStageGroupModel {
  groupId: string;
  playerGroup: boolean;
  standings: GroupStageStandingModel[];
  encounters: GroupStageEncounterModel[];
}

export interface GroupStageStandingModel {
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

export interface GroupStageEncounterModel {
  encounterId: string;
  stageId: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  resolutionCode: string;
  results: GroupStageEncounterResultModel[];
  damageByTeam: GroupStageEncounterDamageModel[];
}

export interface GroupStageEncounterResultModel {
  teamId: string;
  resultCode: string;
}

export interface GroupStageEncounterDamageModel {
  teamId: string;
  damageDealt: number;
}
