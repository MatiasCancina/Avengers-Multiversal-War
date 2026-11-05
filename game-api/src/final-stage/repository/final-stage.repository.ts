import { TurnResult } from '../model/turn-result.model';

export interface FinalStageRecord<T> {
  revision: number;
  state: TurnResult<T>;
}

/** Storage boundary only; never resolves game rules. */
export abstract class FinalStageRepository<T> {
  abstract load(id: string): Promise<FinalStageRecord<T> | null>;

  abstract create(id: string, state: TurnResult<T>): Promise<void>;

  abstract save(id: string, revision: number, state: TurnResult<T>): Promise<void>;
}
