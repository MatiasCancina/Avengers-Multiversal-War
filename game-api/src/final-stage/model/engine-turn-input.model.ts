import { TurnResult } from './turn-result.model';

export interface EngineTurnInput<T> {
  current: TurnResult<T>;
  /** Identifies a complete available option previously supplied by the engine. */
  actionId: string;
}
