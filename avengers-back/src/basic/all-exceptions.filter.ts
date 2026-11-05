import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorUtils } from './error/error.utils';
import { ResponseBuilder } from './response.builder';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(error: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      return;
    }

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const details = ErrorUtils.extractExceptionDetails(error);
    const status = error instanceof HttpException ? error.getStatus() : details.statusCode;
    const messageCode =
      details.messageCode ??
      (error instanceof HttpException ? 'REQUEST_ERROR' : ErrorUtils.fallbackMessageCode(status));
    const requestInfo = ErrorUtils.buildRequestInfo(ctx.getRequest());

    this.logger.error(
      `${status} ${requestInfo} - ${details.message}`,
      error instanceof Error ? error.stack : undefined,
    );

    httpAdapter.reply(
      ctx.getResponse(),
      ResponseBuilder.failure<null>(messageCode, details.message),
      status,
    );
  }
}
