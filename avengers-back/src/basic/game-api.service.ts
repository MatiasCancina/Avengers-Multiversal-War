import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse, isAxiosError } from 'axios';
import { firstValueFrom, Observable, retry, throwError, timer } from 'rxjs';
import { ResponseObject } from './response-object.interface';

const GAME_API_STARTUP_RETRY_WINDOW_MS = 110_000;

@Injectable()
export class GameApiService {
  private readonly logger = new Logger(GameApiService.name);

  private readonly baseUrl: string;

  constructor(http: HttpService, config: ConfigService) {
    this.http = http;
    const origin = config.get<string>('GAME_API_URL', 'http://localhost:5102').replace(/\/+$/, '');
    const path = config.get<string>('GAME_API_BASE_PATH', '/game').replace(/^\/+|\/+$/g, '');
    this.baseUrl = `${origin}/${path}`;
  }

  private readonly http: HttpService;

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    return this.unwrap(
      await this.getWithStartupRetry(
        this.http.get<ResponseObject<T>>(`${this.baseUrl}${this.normalizePath(path)}`, {
          params,
          headers: { Accept: 'application/json' },
        }),
      ),
    );
  }

  async post<T>(
    path: string,
    body: unknown,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    return this.unwrap(
      await firstValueFrom(
        this.http.post<ResponseObject<T>>(`${this.baseUrl}${this.normalizePath(path)}`, body, {
          params,
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        }),
      ),
    );
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.unwrap(
      await firstValueFrom(
        this.http.put<ResponseObject<T>>(`${this.baseUrl}${this.normalizePath(path)}`, body, {
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        }),
      ),
    );
  }

  private normalizePath(path: string): string {
    return `/${path.replace(/^\/+/, '')}`;
  }

  // Render puede devolver errores de gateway transitorios mientras despierta la instancia gratuita de Game API.
  // Reintenta solo fallos GET transitorios y se detiene dentro del tiempo máximo de arranque.
  private getWithStartupRetry<T>(
    request: Observable<AxiosResponse<ResponseObject<T>>>,
  ): Promise<AxiosResponse<ResponseObject<T>>> {
    const startedAt = Date.now();

    return firstValueFrom(
      request.pipe(
        retry({
          count: 50,
          delay: (error: unknown, retryCount: number) => {
            if (!this.isTransientStartupError(error)) {
              return throwError(() => error);
            }

            const remainingWindow = GAME_API_STARTUP_RETRY_WINDOW_MS - (Date.now() - startedAt);
            if (remainingWindow <= 0) {
              return throwError(() => error);
            }

            const delayMs = Math.min(retryCount * 1000, 5000, remainingWindow);
            this.logger.warn(
              `Retrying Game API GET after a transient error (${retryCount}/50).`,
            );
            return timer(delayMs);
          },
        }),
      ),
    );
  }

  private isTransientStartupError(error: unknown): boolean {
    if (!isAxiosError(error)) {
      return false;
    }

    if ([502, 503, 504].includes(error.response?.status ?? 0)) {
      return true;
    }

    return ['ECONNABORTED', 'ECONNREFUSED', 'ECONNRESET', 'EAI_AGAIN', 'ETIMEDOUT'].includes(
      error.code ?? '',
    );
  }

  private unwrap<T>(response: AxiosResponse<ResponseObject<T>>): T {
    const envelope = response.data;
    if (!envelope.success || envelope.data === null) {
      throw new HttpException(
        {
          responseMessage: envelope.responseMessage,
          data: null,
        },
        response.status || HttpStatus.BAD_GATEWAY,
      );
    }
    return envelope.data;
  }
}
