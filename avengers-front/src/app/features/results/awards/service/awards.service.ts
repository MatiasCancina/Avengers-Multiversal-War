import { Injectable } from '@angular/core';
import { BaseApiService } from 'src/app/core/services/base-api.service';
import { AwardsViewModel } from './awards-view-model.interface';
import { ApiService } from 'src/app/core/services/api.service';
import { AppContextService } from 'src/app/core/services/app-context.service';
import { AwardsApi } from '../model/awards-api.interface';
import { ApiError, toApiError } from 'src/app/core/models/api-error.interface';

@Injectable({ providedIn: 'root' })
export class AwardsService extends BaseApiService {
  private readonly pageState: AwardsViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    lang: 'en',
  };

    constructor(
      api: ApiService,
      private readonly appContextService: AppContextService,
    ) {
      super(api);
    } 

   getViewModel(): AwardsViewModel {
     return this.pageState;
   }
 
   initialize(): void {
     this.pageState.lang = this.appContextService.getCurrentLang();
     this.loadAwards();
   }

  refresh(): void {
    this.loadAwards();
  }

  private loadAwards(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;

    this.getData<AwardsApi>('/results/awards').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = data.awards.length ? 'data' : 'empty';
      },
      error: (error: unknown) => {
        const apiError: ApiError = toApiError(error);
        this.pageState.data = null;
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }
}
