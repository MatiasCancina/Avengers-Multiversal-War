import { Injectable } from '@angular/core';
import { ApiError, toApiError } from '../../../../core/models/api-error.interface';
import { AppContextService } from '../../../../core/services/app-context.service';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { LiveEventsApi } from '../model/live-events-api.interface';
import { LiveEventsViewModel } from '../model/live-events-view-model.interface';

const JOURNEY_REQUIRED_CODE = 'JOURNEY_REQUIRED';

@Injectable({ providedIn: 'root' })
export class LiveEventsService extends BaseApiService {
  private readonly pageState: LiveEventsViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    lang: 'en'
  };

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService,
  ) {
    super(api);
  }

  getViewModel(): LiveEventsViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.loadLiveEvents();
  }

  refresh(): void {
    this.loadLiveEvents()
  }

  private loadLiveEvents(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;

    this.getData<LiveEventsApi>('/final-stage/events').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = data.events.length ? 'data' : 'empty';
      },
      error: (error: unknown) => {
        const apiError: ApiError = toApiError(error);
        this.pageState.data = null;
        this.pageState.status =
          apiError.messageCode === JOURNEY_REQUIRED_CODE ? 'unavailable' : 'error'
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      }
    });
  }
}
