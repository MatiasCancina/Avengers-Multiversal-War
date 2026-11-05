import { JourneySpendingStrategy } from '../../../basic/model/game-api/journey.model';
import { TeamConfigurationApi } from '../../../basic/model/game-api/team-configuration.model';

export interface SimulateJourneyModel {
  teamId: string;
  configuration: TeamConfigurationApi;
  currentAttempt: {
    id: string;
    status: string;
    spendingStrategy: JourneySpendingStrategy;
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
  spendingStrategies: JourneySpendingStrategy[];
  receipt?: {
    attemptId: string;
    replacedPrevious: boolean;
  };
}
