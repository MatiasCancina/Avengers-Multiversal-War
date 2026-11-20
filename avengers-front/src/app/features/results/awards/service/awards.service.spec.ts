import { throwError } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { AwardsService } from './awards.service';

describe('AwardsService', () => {
  function createService(messageCode: string) {
    const api = {
      get: jasmine.createSpy('get').and.returnValue(
        throwError(() => ({
          error: {
            responseMessage: {
              messageCode,
              message: 'Upstream response',
            },
          },
        })),
      ),
    } as unknown as ApiService;
    const appContext = { getCurrentLang: () => 'es' } as AppContextService;
    return new AwardsService(api, appContext);
  }

  it('uses the unavailable state when post-game awards are not ready', () => {
    const service = createService('BFF_POST_GAME_NOT_READY');

    service.initialize();

    expect(service.getViewModel().status).toBe('unavailable');
    expect(service.getViewModel().errorCode).toBe('BFF_POST_GAME_NOT_READY');
  });

  it('keeps unexpected API errors in the error state', () => {
    const service = createService('INTERNAL_ERROR');

    service.initialize();

    expect(service.getViewModel().status).toBe('error');
    expect(service.getViewModel().errorCode).toBe('INTERNAL_ERROR');
  });
});
