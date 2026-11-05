export type JourneySpendingStrategy = 'SAVE' | 'BALANCED' | 'AGGRESSIVE';
export interface JourneySummaryApi {
  id: string;
  teamId: string;
  status: string;
  spendingStrategy?: JourneySpendingStrategy;
  finalistIds?: string[];
  stageCount: number;
  encounterCount: number;
}
export interface CurrentJourneyApi {
  teamId: string;
  attempt: JourneySummaryApi | null;
  summary: import('./final-contract.model').FinalJourneySummaryApi | null;
}
export interface SimulateJourneyApi {
  attemptId: string;
  teamId: string;
  status: string;
  spendingStrategy: JourneySpendingStrategy;
  opponentFinalistId: string;
  replacedPrevious: boolean;
}
export interface JourneyDetailApi {
  id: string;
  data: { teams: TournamentTeamApi[]; encounters: EncounterApi[]; finalistIds: string[] };
}
export interface TournamentTeamApi {
  id: string;
  name: string;
  leaderId: string;
  heroIds: string[];
  rewardPoints?: number;
  eliminated?: boolean;
}
export interface EncounterApi {
  id: string;
  stageType: string;
  teamAId: string;
  teamBId: string;
  resultByTeam: Record<string, 'WIN' | 'DRAW' | 'LOSS'>;
  rival: boolean;
}
export interface JourneyHistoryApi {
  page: number;
  pageSize: number;
  total: number;
  items: JourneyHistoryItemApi[];
}
export interface JourneyHistoryItemApi {
  id: string;
  spendingStrategy: JourneySpendingStrategy;
  outcome: string;
  opponentFinalistId: string;
  opponentFinalistName: string;
  completedAt: string;
}
