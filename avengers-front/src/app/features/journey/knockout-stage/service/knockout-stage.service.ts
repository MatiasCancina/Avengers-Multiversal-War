import { Injectable } from '@angular/core';
import { BaseApiService } from 'src/app/core/services/base-api.service';
import { KnockoutStageViewModel } from '../model/knockout-stage-view-model.interface';
import { AppContextService } from 'src/app/core/services/app-context.service';
import { ApiService } from 'src/app/core/services/api.service';
import { KnockoutStageApi } from '../model/knockout-stage-api.interface';
import { ApiError, toApiError } from '../../../../core/models/api-error.interface';

@Injectable({ providedIn: 'root' })
export class KnockoutStageService extends BaseApiService{

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService,
  ) {
    super(api);
  }

  private readonly pageState: KnockoutStageViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    lang: 'en',
  };
  
  getViewModel(): KnockoutStageViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.loadKnockoutStage();
  }

  private loadKnockoutStage(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;

    this.getData<KnockoutStageApi>('/journey/knockout-stage').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = data.rounds.length ? 'data' : 'empty';
      },
      error: (error: unknown) => {
        const apiError: ApiError = toApiError(error);
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }
}
