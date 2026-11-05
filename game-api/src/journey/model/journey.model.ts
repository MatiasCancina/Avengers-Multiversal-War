import { JourneyStatus } from './journey-status.enum';
import { Stage } from './stage.model';

/** Structural model only; attempt ownership and persistence are still pending. */
export interface Journey {
  id: string;
  themeId: string;
  assignedTeamId: string;
  selectedStrategyId: string;
  status: JourneyStatus;
  stages: Stage[];
}
