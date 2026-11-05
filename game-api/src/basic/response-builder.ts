import { ResponseObject } from './response-object.model';

export class ResponseBuilder {
  static success<T>(data: T): ResponseObject<T> {
    return {
      serverTime: new Date().toISOString(),
      success: true,
      responseMessage: { messageCode: '0000', message: 'OK' },
      data,
    };
  }

  static failure(messageCode: string, message: string): ResponseObject<never> {
    return {
      serverTime: new Date().toISOString(),
      success: false,
      responseMessage: { messageCode, message },
      data: null,
    };
  }
}
