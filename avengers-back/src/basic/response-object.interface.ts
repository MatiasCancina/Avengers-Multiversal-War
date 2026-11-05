export interface ResponseMessage {
  messageCode: string;
  message: string;
}

export interface ResponseObject<T> {
  serverTime: string;
  success: boolean;
  responseMessage: ResponseMessage;
  data: T | null;
}
