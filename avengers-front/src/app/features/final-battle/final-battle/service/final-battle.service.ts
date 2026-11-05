import { Injectable } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { toApiError } from '../../../../core/models/api-error.interface';
import { ApiService } from '../../../../core/services/api.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { LiveEventApi, LiveEventsApi } from '../../live-events/model/live-events-api.interface';
import {
  FinalBattleAbilityApi,
  FinalBattleActionOptionApi,
  FinalBattleApi,
  FinalBattlePlayRequestApi,
  FinalBattlePlayResultApi,
} from '../model/final-battle-api.interface';
import {
  FinalBattleSelectionSource,
  FinalBattleViewModel,
} from '../model/final-battle-view-model.interface';

const JOURNEY_REQUIRED_CODE = 'JOURNEY_REQUIRED';

@Injectable({ providedIn: 'root' })
export class FinalBattleService extends BaseApiService {
  private readonly pageState: FinalBattleViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    lang: 'en',
    submitting: false,
    refreshing: false,
    operationError: null,
    operationErrorCode: null,
    selectedSource: null,
    selectedHeroId: null,
    selectedAbilityKey: null,
    selectedActionId: null,
    events: [],
    eventsError: null,
  };

  constructor(
    api: ApiService,
    private readonly appContextService: AppContextService,
  ) {
    super(api);
  }

  getViewModel(): FinalBattleViewModel {
    return this.pageState;
  }

  initialize(): void {
    if (this.pageState.submitting) {
      return;
    }

    this.pageState.lang = this.appContextService.getCurrentLang();
    this.pageState.data = null;
    this.pageState.events = [];
    this.pageState.eventsError = null;
    this.pageState.operationError = null;
    this.pageState.operationErrorCode = null;
    this.clearSelection();

    this.loadFinalBattleAndEvents(true).subscribe();
  }

  refresh(): void {
    if (this.pageState.submitting || this.pageState.refreshing) {
      return;
    }

    const showLoading = this.pageState.data === null;
    this.pageState.refreshing = true;
    this.loadFinalBattleAndEvents(showLoading)
      .pipe(finalize(() => (this.pageState.refreshing = false)))
      .subscribe({
        error: (error: unknown) => {
          const apiError = toApiError(error);
          this.pageState.status = 'error';
          this.pageState.error = apiError.message;
          this.pageState.errorCode = apiError.messageCode;
        },
      });
  }

  start(): void {
    if (this.pageState.submitting || this.pageState.data?.state.status !== 'READY') {
      return;
    }

    this.play({ type: 'START' }, true);
  }

  executeSelectedAction(): void {
    if (this.pageState.submitting || this.pageState.data?.state.status !== 'ACTIVE') {
      return;
    }

    const actionId = this.pageState.selectedActionId;

    if (!actionId) {
      return;
    }

    const actionExists = this.getSelectedAbilityOptions().some(
      (option) => option.actionId === actionId,
    );

    if (!actionExists) {
      return;
    }

    this.play({ type: 'CHOOSE_ACTION', actionId }, false);
  }

  abandon(): void {
    if (this.pageState.submitting || this.pageState.data?.state.status !== 'ACTIVE') {
      return;
    }

    this.play({ type: 'ABANDON' }, true);
  }

  selectHero(actorHeroId: string): void {
    const heroExists = this.pageState.data?.heroActions.some(
      (heroActions) => heroActions.actorHeroId === actorHeroId,
    );

    if (!heroExists) {
      return;
    }

    const changed =
      this.pageState.selectedHeroId !== actorHeroId || this.pageState.selectedSource !== 'hero';

    this.pageState.selectedHeroId = actorHeroId;
    this.pageState.selectedSource = 'hero';

    if (changed) {
      this.clearAbilitySelection();
    }
  }

  selectAbility(groupKey: string, source: FinalBattleSelectionSource): void {
    const ability = this.findAbility(source, groupKey);

    if (!ability) {
      return;
    }

    this.pageState.selectedSource = source;
    this.pageState.selectedAbilityKey = groupKey;
    this.pageState.selectedActionId =
      ability.options.length === 1 ? ability.options[0].actionId : null;
  }

  selectAction(actionId: string): void {
    const actionExists = this.getSelectedAbilityOptions().some(
      (option) => option.actionId === actionId,
    );

    if (!actionExists) {
      return;
    }

    this.pageState.selectedActionId = actionId;
  }

  getSelectedHeroAbilities(): FinalBattleAbilityApi[] {
    const heroId = this.pageState.selectedHeroId;

    if (!heroId) {
      return [];
    }

    return (
      this.pageState.data?.heroActions.find((heroActions) => heroActions.actorHeroId === heroId)
        ?.abilities ?? []
    );
  }

  getSelectedAbility(): FinalBattleAbilityApi | null {
    const source = this.pageState.selectedSource;
    const groupKey = this.pageState.selectedAbilityKey;

    if (!source || !groupKey) {
      return null;
    }

    return this.findAbility(source, groupKey);
  }

  getSelectedAbilityOptions(): FinalBattleActionOptionApi[] {
    return this.getSelectedAbility()?.options ?? [];
  }

  canStart(): boolean {
    return !this.pageState.submitting && this.pageState.data?.state.status === 'READY';
  }

  canExecute(): boolean {
    const actionId = this.pageState.selectedActionId;

    return (
      !this.pageState.submitting &&
      this.pageState.data?.state.status === 'ACTIVE' &&
      !!actionId &&
      this.getSelectedAbilityOptions().some((option) => option.actionId === actionId)
    );
  }

  canAbandon(): boolean {
    return !this.pageState.submitting && this.pageState.data?.state.status === 'ACTIVE';
  }

  private play(body: FinalBattlePlayRequestApi, reloadContext: boolean): void {
    this.pageState.submitting = true;
    this.pageState.operationError = null;
    this.pageState.operationErrorCode = null;

    let succeeded = false;

    this.postData<FinalBattlePlayResultApi>('/final-stage/play', body)
      .pipe(
        tap(() => {
          succeeded = true;
        }),
        catchError((error: unknown) => {
          const apiError = toApiError(error);
          this.pageState.operationError = apiError.message;
          this.pageState.operationErrorCode = apiError.messageCode;
          return of(null);
        }),
        switchMap(() => {
          this.clearSelection();
          return this.loadFinalBattleAndEvents(false);
        }),
        finalize(() => {
          this.pageState.submitting = false;

          if (succeeded && reloadContext) {
            this.appContextService.reload().subscribe({ error: () => undefined });
          }
        }),
      )
      .subscribe({ error: () => undefined });
  }

  private loadFinalBattleAndEvents(showLoading: boolean): Observable<void> {
    if (showLoading) {
      this.pageState.status = 'loading';
    }

    this.pageState.error = null;
    this.pageState.errorCode = null;
    this.pageState.eventsError = null;

    return forkJoin([this.fetchFinalBattle(), this.fetchEvents()]).pipe(
      tap(([state]) => {
        if (state === null) {
          this.pageState.events = [];
          this.pageState.eventsError = null;
        }
      }),
      map((): void => undefined),
    );
  }

  private fetchFinalBattle(): Observable<FinalBattleApi | null> {
    return this.getData<FinalBattleApi>('/final-stage').pipe(
      tap((data) => {
        this.pageState.data = data;
        this.pageState.status = 'data';
        this.pageState.error = null;
        this.pageState.errorCode = null;
        this.pruneSelection();
      }),
      catchError((error: unknown) => {
        const apiError = toApiError(error);

        this.pageState.data = null;
        this.clearSelection();

        if (apiError.messageCode === JOURNEY_REQUIRED_CODE) {
          this.pageState.status = 'unavailable';
          this.pageState.error = null;
          this.pageState.errorCode = apiError.messageCode;
        } else {
          this.pageState.status = 'error';
          this.pageState.error = apiError.message;
          this.pageState.errorCode = apiError.messageCode;
        }

        return of(null);
      }),
    );
  }

  private fetchEvents(): Observable<LiveEventApi[]> {
    return this.getData<LiveEventsApi>('/final-stage/events').pipe(
      tap((data) => {
        this.pageState.events = data.events;
        this.pageState.eventsError = null;
      }),
      map((data) => data.events),
      catchError((error: unknown) => {
        this.pageState.eventsError = toApiError(error).message;
        return of([]);
      }),
    );
  }

  private findAbility(
    source: FinalBattleSelectionSource,
    groupKey: string,
  ): FinalBattleAbilityApi | null {
    const data = this.pageState.data;

    if (!data) {
      return null;
    }

    if (source === 'team') {
      return data.teamActions.find((ability) => ability.groupKey === groupKey) ?? null;
    }

    const heroId = this.pageState.selectedHeroId;

    if (!heroId) {
      return null;
    }

    return (
      data.heroActions
        .find((heroActions) => heroActions.actorHeroId === heroId)
        ?.abilities.find((ability) => ability.groupKey === groupKey) ?? null
    );
  }

  private pruneSelection(): void {
    const data = this.pageState.data;

    if (!data) {
      this.clearSelection();
      return;
    }

    if (this.pageState.selectedSource === 'hero') {
      const heroId = this.pageState.selectedHeroId;
      const heroExists = data.heroActions.some((heroActions) => heroActions.actorHeroId === heroId);

      if (!heroId || !heroExists) {
        this.clearSelection();
        return;
      }
    }

    if (!this.pageState.selectedAbilityKey) {
      this.pageState.selectedActionId = null;
      return;
    }

    const ability = this.getSelectedAbility();

    if (!ability) {
      this.clearAbilitySelection();
      return;
    }

    const actionExists = ability.options.some(
      (option) => option.actionId === this.pageState.selectedActionId,
    );

    if (!actionExists) {
      this.pageState.selectedActionId = null;
    }
  }

  private clearAbilitySelection(): void {
    this.pageState.selectedAbilityKey = null;
    this.pageState.selectedActionId = null;
  }

  private clearSelection(): void {
    this.pageState.selectedSource = null;
    this.pageState.selectedHeroId = null;
    this.clearAbilitySelection();
  }
}
