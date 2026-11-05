import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseObject } from '../models/response-object.interface';
import { toApiError } from '../models/api-error.interface';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  get<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Observable<ResponseObject<T>> {
    let query = new HttpParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) {
        query = query.set(key, String(value));
      }
    }
    return this.http
      .get<ResponseObject<T>>(`${environment.bffUrl}${path}`, { params: query })
      .pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
  }

  post<T>(path: string, body: unknown): Observable<ResponseObject<T>> {
    return this.http
      .post<ResponseObject<T>>(`${environment.bffUrl}${path}`, body)
      .pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
  }

  put<T>(path: string, body: unknown): Observable<ResponseObject<T>> {
    return this.http
      .put<ResponseObject<T>>(`${environment.bffUrl}${path}`, body)
      .pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
  }
}
