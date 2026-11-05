import { of, Subject } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { HeroArtworkResolverService } from '../../../../core/services/hero-artwork-resolver.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { SimulationApi } from '../model/simulate-journey-api.interface';
import { SimulateJourneyService } from './simulate-journey.service';

describe('SimulateJourneyService', () => {
  const simulation: SimulationApi = {
    teamId: 'spider-man',
    configuration: {
      leaderId: 'spider-man',
      companionIds: ['scarlet-witch'],
      activeHeroIds: ['spider-man'],
      strategy: 'BALANCED',
    },
    currentAttempt: null,
    playerTeam: { id: 'spider-man', name: 'Team Spider-Man', heroes: [] },
    canSimulate: true,
    reason: null,
    spendingStrategies: ['SAVE', 'BALANCED', 'AGGRESSIVE'],
  };
  const envelope = (data: SimulationApi) => ({
    serverTime: '',
    success: true,
    responseMessage: { messageCode: '0000', message: 'OK' },
    data,
  });

  it('sends only spendingStrategy, blocks a second pending submission and refreshes context', () => {
    const pending = new Subject<ReturnType<typeof envelope>>();
    const api = {
      get: jasmine.createSpy('get').and.returnValue(of(envelope(simulation))),
      post: jasmine.createSpy('post').and.returnValue(pending.asObservable()),
    } as unknown as ApiService;
    const context = {
      getCurrentLang: () => 'es',
      reload: jasmine.createSpy('reload').and.returnValue(of(null)),
    } as unknown as AppContextService;
    const i18n = { t: (key: string) => key } as I18nService;
    const service = new SimulateJourneyService(
      api,
      context,
      i18n,
      new HeroArtworkResolverService(),
    );

    service.initialize();
    service.setStrategy('BALANCED');
    service.simulate();
    service.simulate();

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/journey/simulation', {
      spendingStrategy: 'BALANCED',
    });
    expect(service.getViewModel().submitting).toBeTrue();

    pending.next(
      envelope({
        ...simulation,
        receipt: { attemptId: 'opaque-journey', replacedPrevious: true },
      }),
    );
    pending.complete();

    expect(service.getViewModel().submitting).toBeFalse();
    expect(service.getViewModel().success).toBe('r4.replaced');
    expect(context.reload).toHaveBeenCalledTimes(1);
  });
});
