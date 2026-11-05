export type TeamJourneyOutcomeApi = 'WIN' | 'DRAW' | 'LOSS' | 'PENDING' | 'ABANDONED';
export type TeamJourneyStopKindApi = 'ENCOUNTER' | 'FINAL';
export type TeamJourneyFinalStageStatusApi = 'READY' | 'ACTIVE' | 'COMPLETED';

export interface TeamJourneyStopApi {
  kind: TeamJourneyStopKindApi;
  encounterId: string | null;
  stageId: string | null;
  stageCode: string;
  groupId: string | null;
  resolutionCode: string | null;
  opponentTeamId: string;
  opponentTeamName: string;
  outcome: TeamJourneyOutcomeApi;
  damageDealt: number | null;
  rivalEncounter: boolean | null;
  finalStageStatus: TeamJourneyFinalStageStatusApi | null;
}

export interface TeamJourneyProgressApi {
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface TeamJourneyApi {
  attemptId: string;
  playerTeamId: string;
  stops: TeamJourneyStopApi[];
  progress: TeamJourneyProgressApi;
}
