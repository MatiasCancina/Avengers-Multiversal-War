import { Injectable } from '@nestjs/common';
import { GameError } from '../../basic/error/game-error';
import { GameErrorCode } from '../../basic/error/game-error-code.enum';
import { GameEngine } from '../../final-stage/game-engine';
import { EngineTurnInput } from '../../final-stage/model/engine-turn-input.model';
import { TurnResult } from '../../final-stage/model/turn-result.model';
import { SampleTurnData } from './model/sample-turn-data.model';

@Injectable()
export class SampleGameEngine extends GameEngine<SampleTurnData> {
  async resolveTurn(_input: EngineTurnInput<SampleTurnData>): Promise<TurnResult<SampleTurnData>> {
    throw new GameError(
      GameErrorCode.ENGINE_NOT_IMPLEMENTED,
      'The sample theme does not implement final-stage rules.',
    );
  }
}
