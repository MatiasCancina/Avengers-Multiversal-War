import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { AppContextService } from 'src/app/core/services/app-context.service';
import { BaseApiService } from 'src/app/core/services/base-api.service';
import { HeroArtworkResolverService } from 'src/app/core/services/hero-artwork-resolver.service';
import { CombatStrategy, SaveTeamConfigBody, TeamConfigCatalogHeroModel, TeamConfigModel, TeamConfigSaveModel } from '../model/team-config-api.interface';
import { ApiError, toApiError } from 'src/app/core/models/api-error.interface';
import { TeamConfigViewModel } from '../model/team-config-view-model';
import { AppCopyKey, I18nService } from 'src/app/core/services/i18n.service';

/** Cantidad de lugares de companion que muestra la pantalla. */
const COMPANION_SLOTS = 5;

@Injectable({ providedIn: 'root' })
export class TeamConfigService extends BaseApiService {
  private readonly pageState: TeamConfigViewModel = {
    status: 'loading',
    draft: null,
    error: null,
    errorCode: null,
    data: null,
    searchTerm: "",
    saving: false,
    saveMessage: null,
    lang: 'en',
    replacingHeroId: null,
  };


  constructor(
    api: ApiService,
    private readonly artwork: HeroArtworkResolverService,
    private readonly appContextService: AppContextService,
    private readonly i18nService: I18nService,
  ) {
    super(api);
  }

  getViewModel(): TeamConfigViewModel {
    return this.pageState;
  }

  cardPath(heroId: string): string {
    return this.artwork.cardPath(heroId);
  }

  initialize(): void {
    this.pageState.lang = this.appContextService.getCurrentLang();
    this.load();
  }

  selectStrategy(code: CombatStrategy) {
    if (this.pageState.draft) {
      this.pageState.draft.strategy = code;
    }
  }

  private load(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;
    this.pageState.errorCode = null;
    this.pageState.replacingHeroId = null;

    this.getData<TeamConfigModel>('/my-team/configuration').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.status = 'data';
        this.pageState.draft = this.buildDraft(data);
      },
      error: (error: unknown) => {
        const apiError: ApiError = toApiError(error);
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
        this.pageState.errorCode = apiError.messageCode;
      },
    });
  }

  public save(): void {
    this.pageState.saving = true;
    this.pageState.saveMessage = null;

    this.putData<TeamConfigSaveModel>('/my-team/configuration', this.pageState.draft).subscribe({
      next: (result) => {
        this.pageState.status = 'data';
        this.pageState.data = result.configuration;
        this.pageState.draft = this.buildDraft(result.configuration);
        this.pageState.saveMessage = result.journeyReplaced ? 'teamConfig.journeyReplaced' : 'teamConfig.saved'
        this.pageState.saving = false;
      },
      error: (error: unknown) => {
        const apiError: ApiError = toApiError(error);
        const key = this.saveErrorKey(apiError.messageCode);
        this.pageState.status = 'error';
        this.pageState.error = this.i18nService.translate(key, this.pageState.lang);
        this.pageState.errorCode = null;
        this.pageState.saving = false;
      }
    })
  }

  /** Traduce el código de error del guardado a un texto de la pantalla. */
  private saveErrorKey(code: string | null): AppCopyKey {
    const lockedCodes = ['BFF_TEAM_CONFIGURATION_LOCKED', 'JOURNEY_LOCKED', 'STATE_CONFLICT'];
    return lockedCodes.includes(code ?? '') ? 'teamConfig.locked' : 'teamConfig.invalid';
  }

  public buildDraft(data: TeamConfigModel): SaveTeamConfigBody {
    const active = data.activeHeroes.map((hero) => hero.id);
    const reserve = data.reserveHeroes.map((hero) => hero.id);
    return {
      activeHeroIds: [data.leader.id, ...active],
      companionIds: [...active, ...reserve],
      strategy: data.selectedStrategy,
    };
  }

  public toggleActive(heroID: string) {
    if (this.pageState.draft) {
      const hero = this.pageState.draft.activeHeroIds.find(h => h === heroID)
      if (hero) {
        this.pageState.draft.activeHeroIds.splice(this.pageState.draft.activeHeroIds.indexOf(hero), 1)
      }
      else {
        this.pageState.draft.activeHeroIds.push(heroID)
      }
    }
  }

  /** El equipo que se está editando: companions del draft resueltos contra el catálogo. */
  getDraftCompanions(): TeamConfigCatalogHeroModel[] {
    const catalog = this.pageState.data?.catalog ?? [];
    return (this.pageState.draft?.companionIds ?? [])
      .map((id) => catalog.find((hero) => hero.id === id))
      .filter((hero): hero is TeamConfigCatalogHeroModel => hero !== undefined);
  }

  isInDraft(heroId: string): boolean {
    return this.pageState.data?.leader?.id === heroId
      || (this.pageState.draft?.companionIds.includes(heroId) ?? false);
  }

  removeCompanion(heroId: string): void {
    const draft = this.pageState.draft;
    if (!draft) {
      return;
    }
    if (this.pageState.replacingHeroId === heroId) {
      this.pageState.replacingHeroId = null;
    }
    draft.companionIds = draft.companionIds.filter((id) => id !== heroId);
    draft.activeHeroIds = draft.activeHeroIds.filter((id) => id !== heroId);
    this.pageState.saveMessage = null;
  }

  addCompanion(heroId: string): void {
    const draft = this.pageState.draft;
    if (!draft || this.isInDraft(heroId)) {
      return;
    }
    if (this.pageState.replacingHeroId) {
      this.replaceCompanion(this.pageState.replacingHeroId, heroId);
      return;
    }
    draft.companionIds = [...draft.companionIds, heroId];
    this.pageState.saveMessage = null;
  }

  hasPendingChanges(): boolean {
    const { data, draft } = this.pageState;
    if (!data || !draft) {
      return false;
    }
    const saved = this.buildDraft(data);
    return !this.sameIds(saved.companionIds, draft.companionIds)
      || !this.sameIds(saved.activeHeroIds, draft.activeHeroIds)
      || saved.strategy !== draft.strategy;
  }

  private sameIds(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((id) => b.includes(id));
  }

  canEditAnything(): boolean {
    const e = this.pageState.data?.editability;
    return !!e && (e.members || e.formation || e.strategy);
  }

  setSearchTerm(term: string): void {
    this.pageState.searchTerm = term;
  }

  /** Catálogo filtrado por nombre o ID. */
  getFilteredCatalog(): TeamConfigCatalogHeroModel[] {
    const term = this.pageState.searchTerm.trim().toLowerCase();
    const catalog = this.pageState.data?.catalog ?? [];
    if (!term) {
      return catalog
    }
    return catalog.filter((hero) =>
      hero.displayName.toLowerCase().includes(term) || hero.id.includes(term),
    );
  }

  /** Lugares vacíos que quedan en el equipo, para dibujarlos en la pantalla. */
  getEmptySlots(): number[] {
    const used = this.pageState.draft?.companionIds.length ?? 0;
    return Array.from({ length: Math.max(COMPANION_SLOTS - used, 0) }, (_, index) => index);
  }

  startReplace(heroId: string): void {
    this.pageState.replacingHeroId = heroId;
  }

  cancelReplace(): void {
    this.pageState.replacingHeroId = null;
  }

  /** Cambia un companion por otro en la misma posición y conserva si era Active. */
  private replaceCompanion(oldId: string, newId: string): void {
    const draft = this.pageState.draft;
    if (!draft) {
      return;
    }
    draft.companionIds = draft.companionIds.map((id) => (id === oldId ? newId : id));
    draft.activeHeroIds = draft.activeHeroIds.map((id) => (id === oldId ? newId : id));
    this.pageState.replacingHeroId = null;
    this.pageState.saveMessage = null;
  }
}
