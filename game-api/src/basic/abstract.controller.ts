import { ResponseBuilder } from './response-builder';
import { ResponseObject } from './response-object.model';

export abstract class AbstractController {
  protected createOkResponse<T>(data: T): ResponseObject<T> {
    return ResponseBuilder.success(data);
  }
}
