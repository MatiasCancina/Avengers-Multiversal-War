import { ResponseMessage } from './response-message.model';

export interface ResponseObject<T> {
  serverTime: string;
  success: boolean;
  responseMessage: ResponseMessage;
  data: T | null;
}
