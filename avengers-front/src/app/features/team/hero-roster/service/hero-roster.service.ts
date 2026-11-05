import { Injectable } from '@angular/core';
import { ApiError, toApiError } from '../../../../core/models/api-error.interface';
import { AppContextService } from '../../../../core/services/app-context.service';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { HeroArtworkResolverService } from '../../../../core/services/hero-artwork-resolver.service';
import { HeroRosterApi, RosterHero } from '../model/hero-roster-api.interface';
import { HeroRosterRoleEnum } from '../model/hero-roster-role.enum';
import { HeroRosterViewModel } from '../model/hero-roster-view-model.interface';

@Injectable({ providedIn: 'root' })
export class HeroRosterService extends BaseApiService {
  private readonly pageState: HeroRosterViewModel = {
    status: 'loading',
    error: null,
    errorCode: null,
    data: null,
    comparisonHeroes: [],
    searchTerm: '',
    roleFilter: HeroRosterRoleEnum.ALL,
    lang: 'en',
  };

  constructor(
    api: ApiService,
    private readonly artwork: HeroArtworkResolverService,
    private readonly appContextService: AppContextService,
  ) {
    super(api);
  }

  getViewModel(): HeroRosterViewModel {
    return this.pageState;
  }

  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.loadHeroes(this.pageState.searchTerm, this.pageState.roleFilter);
  }

  setSearchTerm(searchTerm: string): void {
    this.pageState.searchTerm = searchTerm ?? '';
    this.loadHeroes(this.pageState.searchTerm, this.pageState.roleFilter);
  }

  setRoleFilter(roleFilter: HeroRosterRoleEnum): void {
    this.pageState.roleFilter = roleFilter;
    this.loadHeroes(this.pageState.searchTerm, this.pageState.roleFilter);
  }

  select(hero: RosterHero): void {
    const alreadySelected = this.pageState.comparisonHeroes.some(
      (selectedHero) => selectedHero.id === hero.id,
    );

    if (alreadySelected) {
      return;
    }

    if (this.pageState.comparisonHeroes.length < 2) {
      this.pageState.comparisonHeroes.push(hero);
      return;
    }

    this.pageState.comparisonHeroes[1] = hero;
  }

  remove(slot: number): void {
    if (slot !== 1 && slot !== 2) {
      return;
    }

    if (slot > this.pageState.comparisonHeroes.length) {
      return;
    }

    this.pageState.comparisonHeroes.splice(slot - 1, 1);
  }

  portraitPath(heroId: string): string {
    return this.artwork.portraitPath(heroId);
  }

  cardPath(heroId: string): string {
    return this.artwork.cardPath(heroId);
  }

  imageError(event: Event): void {
    this.artwork.useFallback(event);
  }

  private loadHeroes(searchTerm: string, roleFilter: HeroRosterRoleEnum): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;

    this.getData<HeroRosterApi>('/my-team/heroes', {
      searchTerm,
      role: roleFilter,
    }).subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = data.heroes.length ? 'data' : 'empty';
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
