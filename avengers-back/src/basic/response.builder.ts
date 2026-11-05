import { ResponseObject } from './response-object.interface';

export class ResponseBuilder {
  static ok<T>(data: T): ResponseObject<T> {
    return {
      serverTime: new Date().toISOString(),
      success: true,
      responseMessage: { messageCode: '0000', message: 'OK' },
      data,
    };
  }

  static failure<T>(messageCode: string, message: string): ResponseObject<T> {
    return {
      serverTime: new Date().toISOString(),
      success: false,
      responseMessage: { messageCode, message },
      data: null,
    };
  }
}
