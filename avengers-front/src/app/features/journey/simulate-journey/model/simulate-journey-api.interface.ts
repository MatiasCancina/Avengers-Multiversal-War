export type SpendingStrategy = 'SAVE' | 'BALANCED' | 'AGGRESSIVE';
export interface SimulationApi {
  teamId: string;
  configuration: {
    leaderId: string;
    companionIds: string[];
    activeHeroIds: string[];
    strategy: string;
  };
  currentAttempt: {
    id: string;
    status: string;
    spendingStrategy?: SpendingStrategy;
    stageCount: number;
    encounterCount: number;
    finalists: Array<{
      id: string;
      name: string;
      heroes: Array<{ id: string; name: string; leader: boolean }>;
    }>;
  } | null;
  playerTeam: {
    id: string;
    name: string;
    heroes: Array<{ id: string; name: string; leader: boolean }>;
  };
  canSimulate: boolean;
  reason: string | null;
  spendingStrategies: SpendingStrategy[];
  receipt?: { attemptId: string; replacedPrevious: boolean };
}
