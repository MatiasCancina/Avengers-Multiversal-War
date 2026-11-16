import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ResponseObject } from './response-object.interface';

@Injectable()
export class GameApiService {
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
      await firstValueFrom(
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
