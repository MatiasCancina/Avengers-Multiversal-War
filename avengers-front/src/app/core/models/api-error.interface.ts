import { ResponseObject } from './response-object.interface';

export class ApiError extends Error {
  constructor(
    readonly messageCode: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface ErrorWithResponse {
  error?: Partial<ResponseObject<unknown>> & {
    responseMessage?: { messageCode?: string; message?: string };
  };
  message?: string;
}

export function responseData<T>(response: ResponseObject<T>): T {
  if (response.data === null) {
    throw new ApiError(response.responseMessage.messageCode, response.responseMessage.message);
  }
  return response.data;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const candidate = (error ?? {}) as ErrorWithResponse;
  const responseMessage = candidate.error?.responseMessage;
  if (responseMessage?.message) {
    return new ApiError(responseMessage.messageCode ?? null, responseMessage.message);
  }

  return new ApiError(null, candidate.message ?? 'Unexpected request failure.');
}
