import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

export interface ExceptionDetails {
  statusCode: number;
  messageCode?: string;
  message: string;
}

export interface ApiErrorMappingRule {
  messageCode: string;
  message: string;
  statusCode?: number;
}

export type ApiErrorStatusMap = Partial<Record<number, ApiErrorMappingRule>>;

interface ResponseMessagePayload {
  messageCode?: unknown;
  message?: unknown;
}

export class ErrorUtils {
  static extractExceptionDetails(exception: unknown): ExceptionDetails {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const responseMessage = this.extractResponseMessage(response);

      return {
        statusCode,
        messageCode: responseMessage?.messageCode,
        message: responseMessage?.message ?? this.extractMessage(response) ?? exception.message,
      };
    }

    if (this.isAxiosError(exception)) {
      const statusCode = exception.response?.status ?? HttpStatus.BAD_GATEWAY;
      const responseMessage = this.extractResponseMessage(exception.response?.data);
      const payloadMessage = this.extractMessage(exception.response?.data);

      return {
        statusCode,
        messageCode: responseMessage?.messageCode,
        message:
          responseMessage?.message ?? payloadMessage ?? exception.message ?? 'External API error.',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception instanceof Error ? exception.message : 'Unexpected error.',
    };
  }

  static mapGameApiError(
    error: unknown,
    statusMap: ApiErrorStatusMap,
    fallbackRule: ApiErrorMappingRule,
  ): never {
    if (error instanceof HttpException) {
      const details = this.extractExceptionDetails(error);
      const response = error.getResponse();

      if (this.hasResponseMessage(response)) {
        if (details.messageCode) {
          throw error;
        }

        throw this.createMappedException(fallbackRule);
      }

      throw error;
    }

    if (this.isAxiosError(error)) {
      const details = this.extractExceptionDetails(error);

      if (details.messageCode) {
        throw new HttpException(
          {
            responseMessage: {
              messageCode: details.messageCode,
              message: details.message,
            },
            data: null,
          },
          details.statusCode,
        );
      }

      throw this.createMappedException(statusMap[details.statusCode] ?? fallbackRule);
    }

    throw error;
  }

  static buildRequestInfo(request: unknown): string {
    if (!request || typeof request !== 'object') {
      return '';
    }

    const typedRequest = request as Record<string, unknown>;
    const method = typeof typedRequest.method === 'string' ? typedRequest.method : 'UNKNOWN';
    const url = typeof typedRequest.url === 'string' ? typedRequest.url : 'UNKNOWN';
    return `${method} ${url}`;
  }

  static fallbackMessageCode(statusCode: number): string {
    if (statusCode === HttpStatus.BAD_REQUEST || statusCode === HttpStatus.UNPROCESSABLE_ENTITY) {
      return 'VALIDATION_ERROR';
    }
    if (statusCode === HttpStatus.NOT_FOUND) {
      return 'RESOURCE_NOT_FOUND';
    }
    if (statusCode === HttpStatus.CONFLICT) {
      return 'STATE_CONFLICT';
    }
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'INTERNAL_ERROR';
    }
    return 'HTTP_ERROR';
  }

  private static createMappedException(rule: ApiErrorMappingRule): HttpException {
    return new HttpException(
      {
        responseMessage: {
          messageCode: rule.messageCode,
          message: rule.message,
        },
        data: null,
      },
      rule.statusCode ?? HttpStatus.BAD_GATEWAY,
    );
  }

  private static extractResponseMessage(
    value: unknown,
  ): { messageCode?: string; message?: string } | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const candidate = record.responseMessage ?? record;
    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }

    const payload = candidate as ResponseMessagePayload;
    const messageCode = typeof payload.messageCode === 'string' ? payload.messageCode : undefined;
    const message = typeof payload.message === 'string' ? payload.message : undefined;
    if (!messageCode && !message) {
      return undefined;
    }
    return { messageCode, message };
  }

  private static extractMessage(value: unknown): string | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const message = (value as Record<string, unknown>).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join('; ');
    }
    return undefined;
  }

  private static hasResponseMessage(value: unknown): boolean {
    return Boolean(
      value &&
        typeof value === 'object' &&
        'responseMessage' in value &&
        (value as Record<string, unknown>).responseMessage,
    );
  }

  private static isAxiosError(error: unknown): error is AxiosError {
    return Boolean(
      error &&
        typeof error === 'object' &&
        (error as { isAxiosError?: unknown }).isAxiosError === true,
    );
  }
}
