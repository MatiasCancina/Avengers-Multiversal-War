import { GameError } from '../../../../basic/error/game-error';
import { GameErrorCode } from '../../../../basic/error/game-error-code.enum';
import { PlayCommand } from '../../../../final-stage/model/engine-play-input.model';
import { PlayFinalStageRequest } from '../request/play-final-stage.request';

export class AvengersFinalStageCommandMapper {
  static toCommand(request: PlayFinalStageRequest): PlayCommand {
    if (request.type === 'CHOOSE_ACTION') {
      if (!request.actionId) {
        throw new GameError(
          GameErrorCode.INVALID_FINAL_ACTION,
          'Choose one currently legal action.',
        );
      }
      return { type: request.type, actionId: request.actionId };
    }

    return { type: request.type };
  }
}
