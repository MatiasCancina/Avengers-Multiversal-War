import { TurnResult } from './turn-result.model';

export type PlayCommand =
  | { type: 'START' }
  | { type: 'CHOOSE_ACTION'; actionId: string }
  | { type: 'ABANDON' };

export interface EnginePlayInput<T> {
  current: TurnResult<T>;
  command: PlayCommand;
}
