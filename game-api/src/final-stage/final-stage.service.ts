import { Inject, Injectable, Optional } from '@nestjs/common';
import { GameError } from '../basic/error/game-error';
import { GameErrorCode } from '../basic/error/game-error-code.enum';
import { GameEngine } from './game-engine';
import { EngineTurnInput } from './model/engine-turn-input.model';
import { FinalStageStatus } from './model/final-stage-status.enum';
import { TurnResult } from './model/turn-result.model';
import { PlayCommand } from './model/engine-play-input.model';
import { FinalStageRepository } from './repository/final-stage.repository';

@Injectable()
export class FinalStageService<T> {
  constructor(
    @Inject(GameEngine)
    private readonly gameEngine: GameEngine<T>,
    @Optional()
    @Inject(FinalStageRepository)
    private readonly repository?: FinalStageRepository<T>,
  ) {}

  /** Authoritative orchestration: callers submit an ID and a decision, never state. */
  async play(id: string, command: PlayCommand): Promise<TurnResult<T>> {
    if (!this.repository) {
      throw new Error('A FinalStage repository must be configured.');
    }
    const record = await this.repository.load(id);
    if (!record) {
      throw new Error('FinalStage was not found.');
    }
    const expected = command.type === 'START' ? FinalStageStatus.READY : FinalStageStatus.ACTIVE;
    if (record.state.status !== expected) {
      throw new GameError(
        GameErrorCode.FINAL_STAGE_NOT_ACTIVE,
        'The operation is invalid for this FinalStage lifecycle.',
      );
    }
    const result = await this.gameEngine.play({ current: record.state, command });
    await this.repository.save(id, record.revision, result);
    return result;
  }

  /** Internal delegation scaffold; this method is not exposed over HTTP. */
  async resolveTurn(input: EngineTurnInput<T>): Promise<TurnResult<T>> {
    // Legacy internal adapter only. Public integration must use play(id, command).
    if (input.current.status !== FinalStageStatus.ACTIVE) {
      throw new GameError(
        GameErrorCode.FINAL_STAGE_NOT_ACTIVE,
        'The final stage must be active before resolving a turn.',
      );
    }

    const result = await this.gameEngine.resolveTurn(input);

    return result;
  }
}
