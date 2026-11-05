import { FinalStageStatus } from './final-stage-status.enum';

export interface TurnResult<T> {
  status: FinalStageStatus;
  /** Non-negative integer identifying the current state's turn. */
  turn: number;
  data: T;
}
