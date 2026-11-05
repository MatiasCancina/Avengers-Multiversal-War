import { FinalStageRecord, FinalStageRepository } from './final-stage.repository';
import { TurnResult } from '../model/turn-result.model';

/** Internal/test adapter; state does not survive process restart. */
export class InMemoryFinalStageRepository<T> extends FinalStageRepository<T> {
  private readonly records = new Map<string, FinalStageRecord<T>>();

  override async load(id: string): Promise<FinalStageRecord<T> | null> {
    const record = this.records.get(id);
    return record ? structuredClone(record) : null;
  }

  override async create(id: string, state: TurnResult<T>): Promise<void> {
    if (this.records.has(id)) {
      throw new Error('FinalStage already exists.');
    }
    this.records.set(id, { revision: 0, state: structuredClone(state) });
  }

  override async save(id: string, revision: number, state: TurnResult<T>): Promise<void> {
    const current = this.records.get(id);
    if (!current || current.revision !== revision) {
      throw new Error('FinalStage revision conflict.');
    }
    this.records.set(id, { revision: revision + 1, state: structuredClone(state) });
  }
}
