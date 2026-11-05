import { Injectable } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { toApiError } from '../../../../core/models/api-error.interface';
import { AppContextService } from '../../../../core/services/app-context.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { HeroArtworkResolverService } from '../../../../core/services/hero-artwork-resolver.service';
import { SimulationApi, SpendingStrategy } from '../model/simulate-journey-api.interface';
import { SimulationViewModel } from '../model/simulate-journey-view-model.interface';

@Injectable({ providedIn: 'root' })
export class SimulateJourneyService extends BaseApiService {
  private readonly pageState: SimulationViewModel = {
    status: 'loading',
    error: null,
    data: null,
    strategy: 'BALANCED',
    submitting: false,
    success: null,
    lang: 'en',
  };

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService,
    private readonly i18nService: I18nService,
    private readonly heroArtworkResolverService: HeroArtworkResolverService,
  ) {
    super(api);
  }

  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.loadSimulation();
  }

  getViewModel(): SimulationViewModel {
    return this.pageState;
  }

  setStrategy(value: SpendingStrategy): void {
    this.pageState.strategy = value;
  }

  simulate(): void {
    const data = this.pageState.data;
    if (!data || !data.canSimulate || this.pageState.submitting) {
      return;
    }
    this.pageState.submitting = true;
    this.pageState.error = null;
    this.pageState.errorCode = null;
    this.pageState.success = null;
    this.postData<SimulationApi>('/journey/simulation', {
      spendingStrategy: this.pageState.strategy,
    })
      .pipe(
        finalize(() => {
          this.pageState.submitting = false;
        }),
      )
      .subscribe({
        next: (value) => {
          this.pageState.data = value;
          this.pageState.status = 'data';
          this.pageState.success = value.receipt?.replacedPrevious
            ? this.i18nService.t('r4.replaced')
            : this.i18nService.t('r4.success');
          this.appContextService.reload().subscribe({ error: () => undefined });
        },
        error: (error) => {
          const apiError = toApiError(error);
          this.pageState.error = apiError.message;
          this.pageState.errorCode = apiError.messageCode;
        },
      });
  }

  portraitPath(heroId: string): string {
    return this.heroArtworkResolverService.portraitPath(heroId);
  }

  imageError(event: Event): void {
    this.heroArtworkResolverService.useFallback(event);
  }

  private loadSimulation(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.getData<SimulationApi>('/journey/simulation').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = 'data';
        if (data.currentAttempt?.spendingStrategy) {
          this.pageState.strategy = data.currentAttempt.spendingStrategy;
        }
      },
      error: (error) => {
        const apiError = toApiError(error);
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }
}
