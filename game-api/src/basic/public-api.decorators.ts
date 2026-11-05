import { HttpStatus, Type, applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseModel } from './error-response.model';

const errorContent = (messageCode: string, message: string) => ({
  'application/json': {
    schema: { $ref: getSchemaPath(ErrorResponseModel) },
    example: {
      serverTime: '2026-09-19T15:40:12.000Z',
      success: false,
      responseMessage: { messageCode, message },
      data: null,
    },
  },
});

const errorExamples = (messageCodes: string[], fallbackMessage: string) => ({
  'application/json': {
    schema: { $ref: getSchemaPath(ErrorResponseModel) },
    examples: Object.fromEntries(
      messageCodes.map((messageCode) => [
        messageCode,
        {
          summary: messageCode,
          value: {
            serverTime: '2026-09-19T15:40:12.000Z',
            success: false,
            responseMessage: { messageCode, message: fallbackMessage },
            data: null,
          },
        },
      ]),
    ),
  },
});

export interface PublicResponseOptions {
  type: Type<unknown>;
  created?: boolean;
  notFound?: boolean;
  notFoundCode?: string;
  notFoundMessage?: string;
  conflictCode?: string;
  conflictCodes?: string[];
  conflictMessage?: string;
  unprocessableCode?: string;
  unprocessableCodes?: string[];
  unprocessableMessage?: string;
}

export function ApiPublicResponses(options: PublicResponseOptions): MethodDecorator {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
    ApiExtraModels(ErrorResponseModel),
    options.created
      ? ApiCreatedResponse({ type: options.type })
      : ApiOkResponse({ type: options.type }),
    ApiBadRequestResponse({
      description: 'The request shape, identifier, or query parameters are invalid.',
      content: errorContent('VALIDATION_ERROR', 'The request is invalid.'),
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'An unexpected server error occurred. No internal details are exposed.',
      content: errorContent('INTERNAL_ERROR', 'An unexpected error occurred.'),
    }),
  ];

  if (options.notFound) {
    decorators.push(
      ApiNotFoundResponse({
        description: 'The requested resource was not found or is not owned by the Team.',
        content: errorContent(
          options.notFoundCode ?? 'RESOURCE_NOT_FOUND',
          options.notFoundMessage ?? 'The requested resource was not found.',
        ),
      }),
    );
  }

  const conflictCodes =
    options.conflictCodes ?? (options.conflictCode ? [options.conflictCode] : []);
  if (conflictCodes.length) {
    decorators.push(
      ApiConflictResponse({
        description: 'The resource revision or lifecycle does not allow this operation.',
        content: errorExamples(
          conflictCodes,
          options.conflictMessage ?? 'The operation conflicts with the current lifecycle.',
        ),
      }),
    );
  }

  const unprocessableCodes =
    options.unprocessableCodes ?? (options.unprocessableCode ? [options.unprocessableCode] : []);
  if (unprocessableCodes.length) {
    decorators.push(
      ApiUnprocessableEntityResponse({
        description: 'The request is well formed but illegal under the current game rules.',
        content: errorExamples(
          unprocessableCodes,
          options.unprocessableMessage ?? 'The requested game action is not legal.',
        ),
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function ApiTeamIdParam(): ParameterDecorator & MethodDecorator {
  return ApiParam({
    name: 'teamId',
    description: 'Assigned Team identifier.',
    schema: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', example: 'spider-man' },
  });
}

export function ApiAttemptIdParam(): ParameterDecorator & MethodDecorator {
  return ApiParam({
    name: 'attemptId',
    description: 'Journey attempt identifier owned by the Team in the path.',
    schema: { type: 'string', example: 'journey-f91b20' },
  });
}

export function ApiLanguageQuery(): ParameterDecorator & MethodDecorator {
  return ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    example: 'en',
    description: 'Selected language. Omitted or unsupported values fall back to English.',
  });
}

export function ApiHistoricalCatalogQueries(): MethodDecorator {
  return applyDecorators(
    ApiQuery({
      name: 'teamId',
      required: false,
      description:
        'Team context for captured content. Supply alone for the current Journey, or pair with attemptId for an explicit historical Journey.',
      example: 'spider-man',
    }),
    ApiQuery({
      name: 'attemptId',
      required: false,
      description: 'Optional explicit historical Journey. Omit for the current Team context.',
      example: 'journey-f91b20',
    }),
  );
}

export function ApiRequestBody(type: Type<unknown>): MethodDecorator {
  return ApiBody({ type });
}
