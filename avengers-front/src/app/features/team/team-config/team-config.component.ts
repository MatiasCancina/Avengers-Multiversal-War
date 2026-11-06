import { Component, OnInit } from '@angular/core';
import { TeamConfigService } from './service/team-config.service';
import { AppCopyKey, AppLanguage, I18nService } from 'src/app/core/services/i18n.service';
import { TeamConfigViewModel } from './model/team-config-view-model';
import {
  TeamConfigCatalogHeroModel,
  TeamConfigStrategyModel,
} from './model/team-config-api.interface';

@Component({
  selector: 'app-team-config',
  templateUrl: './team-config.component.html',
  styleUrls: ['./team-config.component.css'],
  standalone: false,
})
export class TeamConfigComponent implements OnInit {
  constructor(
    private readonly teamConfigService: TeamConfigService,
    private readonly i18nService: I18nService,
  ) {}

  get pageState(): TeamConfigViewModel {
    return this.teamConfigService.getViewModel();
  }

  ngOnInit(): void {
    this.teamConfigService.initialize();
  }

  translate(
    key: AppCopyKey,
    lang: AppLanguage,
    params: Record<string, string | number> = {},
  ): string {
    return this.i18nService.translate(key, lang, params);
  }

  onStartReplace(hero: { id: string }): void {
    this.teamConfigService.startReplace(hero.id);
  }

  onCancelReplace(): void {
    this.teamConfigService.cancelReplace();
  }

  get emptySlots() {
    return this.teamConfigService.getEmptySlots();
  }

  isReplacing(hero: { id: string }): boolean {
    return this.pageState.replacingHeroId === hero.id;
  }

  /** El catálogo permite elegir si hay un lugar libre o un companion marcado para reemplazar. */
  get canPickFromCatalog(): boolean {
    return this.emptySlots.length > 0 || this.pageState.replacingHeroId !== null;
  }

  onAddCompanion(hero: TeamConfigCatalogHeroModel): void {
    this.teamConfigService.addCompanion(hero.id);
  }

  onRemoveCompanion(hero: TeamConfigCatalogHeroModel): void {
    this.teamConfigService.removeCompanion(hero.id);
  }

  get filteredCatalog() {
    return this.teamConfigService.getFilteredCatalog();
  }

  get draftCompanions() {
    return this.teamConfigService.getDraftCompanions();
  }

  get hasPendingChanges() {
    return this.teamConfigService.hasPendingChanges();
  }

  get canEditAnything() {
    return this.teamConfigService.canEditAnything();
  }

  isInDraft(hero: TeamConfigCatalogHeroModel): boolean {
    return this.teamConfigService.isInDraft(hero.id);
  }

  onStrategyChange(code: TeamConfigStrategyModel['code']): void {
    this.teamConfigService.selectStrategy(code);
  }

  onToggleActive(hero: { id: string }): void {
    this.teamConfigService.toggleActive(hero.id);
  }

  onSave(): void {
    this.teamConfigService.save();
  }

  retry(): void {
    this.teamConfigService.initialize();
  }

  isActive(hero: { id: string }): boolean {
    return this.pageState.draft?.activeHeroIds.includes(hero.id) ?? false;
  }

  trackHero(_index: number, hero: { id: string }): string {
    return hero.id;
  }

  onSearchTermChange(searchTerm: string) {
    this.teamConfigService.setSearchTerm(searchTerm);
  }

  cardPath(hero: { id: string }): string {
    return this.teamConfigService.cardPath(hero.id);
  }
}
