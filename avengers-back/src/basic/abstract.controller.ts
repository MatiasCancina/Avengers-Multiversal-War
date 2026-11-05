import { ResponseBuilder } from './response.builder';
import { ResponseObject } from './response-object.interface';

export abstract class AbstractController {
  protected createOkResponse<T>(data: T): ResponseObject<T> {
    return ResponseBuilder.ok(data);
  }
}
