import { EngineTurnInput } from './model/engine-turn-input.model';
import { TurnResult } from './model/turn-result.model';
import { EnginePlayInput } from './model/engine-play-input.model';
import { GameError } from '../basic/error/game-error';
import { GameErrorCode } from '../basic/error/game-error-code.enum';

/** Theme rules only: implementations must not handle HTTP or persistence. */
export abstract class GameEngine<T> {
  /** Compatibility default for themes that only implement turn resolution. */
  async play(input: EnginePlayInput<T>): Promise<TurnResult<T>> {
    if (input.command.type === 'CHOOSE_ACTION') {
      return this.resolveTurn({ current: input.current, actionId: input.command.actionId });
    }
    throw new GameError(
      GameErrorCode.ENGINE_NOT_IMPLEMENTED,
      'This theme does not implement this play operation.',
    );
  }

  abstract resolveTurn(input: EngineTurnInput<T>): Promise<TurnResult<T>>;
}
