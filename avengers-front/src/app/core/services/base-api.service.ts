import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { responseData, toApiError } from '../models/api-error.interface';

export abstract class BaseApiService {
  protected constructor(protected readonly api: ApiService) {}

  protected getData<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Observable<T> {
    return this.api.get<T>(path, params).pipe(
      map(responseData),
      catchError((error: unknown) => throwError(() => toApiError(error))),
    );
  }

  protected postData<T>(path: string, body: unknown): Observable<T> {
    return this.api.post<T>(path, body).pipe(
      map(responseData),
      catchError((error: unknown) => throwError(() => toApiError(error))),
    );
  }

  protected putData<T>(path: string, body: unknown): Observable<T> {
    return this.api.put<T>(path, body).pipe(
      map(responseData),
      catchError((error: unknown) => throwError(() => toApiError(error))),
    );
  }
}
