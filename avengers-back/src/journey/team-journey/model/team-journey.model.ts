export type TeamJourneyOutcome = 'WIN' | 'DRAW' | 'LOSS' | 'PENDING' | 'ABANDONED';
export type TeamJourneyStopKind = 'ENCOUNTER' | 'FINAL';
export type TeamJourneyFinalStageStatus = 'READY' | 'ACTIVE' | 'COMPLETED';

export interface TeamJourneyStopModel {
  kind: TeamJourneyStopKind;
  encounterId: string | null;
  stageId: string | null;
  stageCode: string;
  groupId: string | null;
  resolutionCode: string | null;
  opponentTeamId: string;
  opponentTeamName: string;
  outcome: TeamJourneyOutcome;
  damageDealt: number | null;
  rivalEncounter: boolean | null;
  finalStageStatus: TeamJourneyFinalStageStatus | null;
}

export interface TeamJourneyProgressModel {
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface TeamJourneyModel {
  attemptId: string;
  playerTeamId: string;
  stops: TeamJourneyStopModel[];
  progress: TeamJourneyProgressModel;
}
