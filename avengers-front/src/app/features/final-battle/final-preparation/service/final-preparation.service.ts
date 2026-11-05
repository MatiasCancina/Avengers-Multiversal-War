import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { toApiError } from '../../../../core/models/api-error.interface';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import {
  FinalPreparationData,
  FinalPreparationViewModel,
} from '../model/final-preparation-view-model.interface';

@Injectable({ providedIn: 'root' })
export class FinalPreparationService extends BaseApiService {
  private readonly pageState: FinalPreparationViewModel = {
    status: 'loading',
    error: null,
    data: null,
    busy: false,
    notice: null,
  };

  constructor(api: ApiService) {
    super(api);
  }

  getViewModel(): FinalPreparationViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;

    this.getData<FinalPreparationData>('/final-stage/preparation').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = 'data';
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
      },
    });
  }

  savePreparation(activeHeroIds: string[], strategy: string): void {
    this.runMutation(
      this.putData('/final-stage/preparation', { activeHeroIds, strategy }),
      'Preparación actualizada.',
    );
  }

  purchase(itemId: string, quantity: number): void {
    this.runMutation(
      this.postData('/final-stage/preparation/purchase', { itemId, quantity }),
      'Compra confirmada.',
    );
  }

  useItem(itemId: string, targetHeroId?: string): void {
    const body: { itemId: string; targetHeroId?: string } = { itemId };

    if (targetHeroId) {
      body.targetHeroId = targetHeroId;
    }

    this.runMutation(this.postData('/final-stage/preparation/use-item', body), 'Ítem utilizado.');
  }

  private runMutation(request: Observable<unknown>, successMessage: string): void {
    this.pageState.busy = true;
    this.pageState.notice = null;
    this.pageState.error = null;

    request.subscribe({
      next: () => {
        this.pageState.notice = successMessage;
        this.pageState.busy = false;

        // Volvemos a leer el estado autoritativo de Game API.
        this.initialize();
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        this.pageState.error = apiError.message;
        this.pageState.busy = false;
      },
    });
  }
}
