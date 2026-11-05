export interface ResponseObject<T> {
  serverTime: string;
  success: boolean;
  responseMessage: { messageCode: string; message: string };
  data: T | null;
}
