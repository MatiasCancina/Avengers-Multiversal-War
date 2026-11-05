import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ResponseBuilder } from './response-builder';
import { GameError } from './error/game-error';
import { GameErrorCode } from './error/game-error-code.enum';

const GAME_ERROR_STATUS: Record<GameErrorCode, HttpStatus> = {
  [GameErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [GameErrorCode.TEAM_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [GameErrorCode.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [GameErrorCode.INVALID_TEAM_CONFIGURATION]: HttpStatus.UNPROCESSABLE_ENTITY,
  [GameErrorCode.JOURNEY_REQUIRED]: HttpStatus.CONFLICT,
  [GameErrorCode.JOURNEY_LOCKED]: HttpStatus.CONFLICT,
  [GameErrorCode.INVALID_LIFECYCLE]: HttpStatus.CONFLICT,
  [GameErrorCode.STATISTICS_UNAVAILABLE]: HttpStatus.CONFLICT,
  [GameErrorCode.STORE_CLOSED]: HttpStatus.CONFLICT,
  [GameErrorCode.INSUFFICIENT_REWARD_POINTS]: HttpStatus.CONFLICT,
  [GameErrorCode.POWER_UP_UNAVAILABLE]: HttpStatus.UNPROCESSABLE_ENTITY,
  [GameErrorCode.INVALID_FINAL_ACTION]: HttpStatus.UNPROCESSABLE_ENTITY,
  [GameErrorCode.STATE_CONFLICT]: HttpStatus.CONFLICT,
  [GameErrorCode.VERSION_UNSUPPORTED]: HttpStatus.CONFLICT,
  [GameErrorCode.FINAL_STAGE_NOT_ACTIVE]: HttpStatus.CONFLICT,
  [GameErrorCode.ENGINE_NOT_IMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(error: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      return;
    }

    const response = host.switchToHttp().getResponse<unknown>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';

    if (error instanceof GameError) {
      status = GAME_ERROR_STATUS[error.code];
      code = error.code;
      message = error.message;
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      code =
        status === HttpStatus.BAD_REQUEST
          ? 'VALIDATION_ERROR'
          : status === HttpStatus.NOT_FOUND
            ? 'RESOURCE_NOT_FOUND'
            : 'HTTP_ERROR';
      message = this.getHttpMessage(error);
    } else {
      this.logger.error(error instanceof Error ? error.stack : 'Unknown application error');
    }

    this.adapterHost.httpAdapter.reply(response, ResponseBuilder.failure(code, message), status);
  }

  private getHttpMessage(error: HttpException): string {
    const body = error.getResponse();
    if (typeof body === 'string') {
      return body;
    }
    if ('message' in body) {
      const message: unknown = body.message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message.join('; ');
      }
    }
    return error.message;
  }
}
