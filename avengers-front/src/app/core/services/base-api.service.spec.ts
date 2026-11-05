import { firstValueFrom, of } from 'rxjs';
import { ApiService } from './api.service';
import { BaseApiService } from './base-api.service';
import { ApiError } from '../models/api-error.interface';

class TestApiService extends BaseApiService {
  constructor(api: ApiService) {
    super(api);
  }

  read() {
    return this.getData<{ value: string }>('/test');
  }
}

describe('BaseApiService', () => {
  it('unwraps a successful ResponseObject data value', async () => {
    const service = new TestApiService({
      get: () =>
        of({
          serverTime: '',
          success: true,
          responseMessage: { messageCode: '0000', message: 'OK' },
          data: { value: 'visible data' },
        }),
    } as unknown as ApiService);

    await expectAsync(firstValueFrom(service.read())).toBeResolvedTo({ value: 'visible data' });
  });

  it('preserves messageCode when a BFF failure has no data', async () => {
    const service = new TestApiService({
      get: () =>
        of({
          serverTime: '',
          success: false,
          responseMessage: { messageCode: 'STATE_CONFLICT', message: 'Reload state.' },
          data: null,
        }),
    } as unknown as ApiService);

    await expectAsync(firstValueFrom(service.read())).toBeRejectedWithError('Reload state.');
    try {
      await firstValueFrom(service.read());
    } catch (error) {
      expect(error).toEqual(jasmine.any(ApiError));
      expect((error as ApiError).messageCode).toBe('STATE_CONFLICT');
    }
  });
});
