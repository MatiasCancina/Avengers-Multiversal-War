import { Component, OnInit } from '@angular/core';

import { AppCopyKey, I18nService } from '../../../core/services/i18n.service';
import { HeroArtworkResolverService } from '../../../core/services/hero-artwork-resolver.service';
import { LiveEventApi, LiveEventLineApi } from '../live-events/model/live-events-api.interface';
import {
  FinalBattleAbilityApi,
  FinalBattleActionOptionApi,
  FinalBattleHeroApi,
  FinalBattleHeroActionsApi,
  FinalBattleInventoryItemApi,
} from './model/final-battle-api.interface';
import {
  FinalBattleSelectionSource,
  FinalBattleViewModel,
} from './model/final-battle-view-model.interface';
import { FinalBattleService } from './service/final-battle.service';

type LabelMap = Partial<Record<string, AppCopyKey>>;

const STATUS_LABELS: LabelMap = {
  READY: 'r10.state.ready',
  ACTIVE: 'r10.state.active',
  COMPLETED: 'r10.state.completed',
};

const OUTCOME_LABELS: LabelMap = {
  VICTORY: 'r10.result.victory',
  DEFEAT: 'r10.result.defeat',
  ABANDON: 'r10.result.abandon',
};

@Component({
  selector: 'app-final-battle',
  templateUrl: './final-battle.component.html',
  styleUrls: ['./final-battle.component.css'],
  standalone: false,
})
export class FinalBattleComponent implements OnInit {
  readonly simulateJourneyPath = '/journey/simulate';

  activeTab: 'abilities' | 'inventory' = 'abilities';

  constructor(
    private readonly finalBattleService: FinalBattleService,
    private readonly i18nService: I18nService,
    private readonly heroArtworkResolverService: HeroArtworkResolverService,
  ) { }

  get pageState(): FinalBattleViewModel {
    return this.finalBattleService.getViewModel();
  }

  get selectedHeroAbilities(): FinalBattleAbilityApi[] {
    return this.finalBattleService.getSelectedHeroAbilities();
  }

  get selectedAbility(): FinalBattleAbilityApi | null {
    return this.finalBattleService.getSelectedAbility();
  }

  get selectedAbilityOptions(): FinalBattleActionOptionApi[] {
    return this.finalBattleService.getSelectedAbilityOptions();
  }

  get canStart(): boolean {
    return this.finalBattleService.canStart();
  }

  get canExecute(): boolean {
    return this.finalBattleService.canExecute();
  }

  get canAbandon(): boolean {
    return this.finalBattleService.canAbandon();
  }

  get inventoryStockCount(): number {
    return this.pageState.data?.inventory.reduce((total, item) => total + item.quantity, 0) ?? 0;
  }

  ngOnInit(): void {
    this.finalBattleService.initialize();
  }

  onRefresh(): void {
    this.finalBattleService.refresh();
  }

  selectTab(tab: 'abilities' | 'inventory'): void {
    this.activeTab = tab;
  }

  onStart(): void {
    this.finalBattleService.start();
  }

  onAbandon(): void {
    this.finalBattleService.abandon();
  }

  onSelectHero(actorHeroId: string): void {
    this.finalBattleService.selectHero(actorHeroId);
  }

  onSelectAbility(groupKey: string, source: FinalBattleSelectionSource): void {
    this.finalBattleService.selectAbility(groupKey, source);
  }

  onSelectAction(actionId: string): void {
    this.finalBattleService.selectAction(actionId);
  }

  onExecute(): void {
    this.finalBattleService.executeSelectedAction();
  }

  translate(key: AppCopyKey, params: Record<string, string | number> = {}): string {
    return this.i18nService.translate(key, this.pageState.lang, params);
  }

  statusLabel(status: string): string {
    return this.label(STATUS_LABELS, status);
  }

  outcomeLabel(outcomeCode: string | null): string {
    if (!outcomeCode) {
      return '';
    }

    return this.label(OUTCOME_LABELS, outcomeCode);
  }

  portraitPath(heroId: string): string {
    return this.heroArtworkResolverService.portraitPath(heroId);
  }

  imageError(event: Event): void {
    this.heroArtworkResolverService.useFallback(event);
  }

  percentOf(current: number, maximum: number): number {
    if (!Number.isFinite(current) || !Number.isFinite(maximum) || maximum <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((current / maximum) * 100)));
  }

  trackHero(_index: number, hero: FinalBattleHeroApi): string {
    return hero.heroId;
  }

  trackHeroActionGroup(_index: number, group: FinalBattleHeroActionsApi): string {
    return group.actorHeroId;
  }

  trackAbility(_index: number, ability: FinalBattleAbilityApi): string {
    return ability.groupKey;
  }

  trackOption(_index: number, option: FinalBattleActionOptionApi): string {
    return option.actionId;
  }

  trackTeamAction(_index: number, ability: FinalBattleAbilityApi): string {
    return ability.groupKey;
  }

  trackInventoryItem(_index: number, item: FinalBattleInventoryItemApi): string {
    return item.itemId;
  }

  // Muestra el nombre del Power-Up en las acciones de equipo; para otras acciones conserva la etiqueta de la API.
  getTeamActionLabel(ability: FinalBattleAbilityApi): string {
    if (ability.actionCode !== 'POWER_UP' || !ability.itemId) {
      return ability.label;
    }

    const item = this.pageState.data?.inventory.find(
      (inventoryItem) => inventoryItem.itemId === ability.itemId
    );

    return item ? `Usar ${item.name}` : ability.label;
  }

  // Prioriza los nombres de intercambio y los nombres traducidos de equipo; si no existen, usa el mejor dato disponible.
  getActionOptionLabel(option: FinalBattleActionOptionApi): string {
    if (option.outgoingHeroName && option.incomingHeroName) {
      return `Sale ${option.outgoingHeroName} → Entra ${option.incomingHeroName}`;
    }

    if (option.target?.targetType === 'TEAM') {
      if (option.target.sideCode === 'OPPONENT') {
        return this.translate('r9.rivalTeam');
      }

      if (option.target.sideCode === 'PLAYER') {
        return this.translate('r9.yourTeam');
      }
    }

    return (
      option.target?.targetName ||
      option.target?.targetId ||
      option.outgoingHeroName ||
      option.incomingHeroName ||
      option.strategyCode ||
      option.description ||
      option.actionId
    );
  }

  trackEvent(_index: number, event: LiveEventApi): string {
    return String(event.sequence);
  }

  trackEventLine(_index: number, line: LiveEventLineApi): string {
    return `${line.lineSequence}|${line.type}`;
  }

  private label(labels: LabelMap, code: string): string {
    const key = labels[code];

    return key ? this.translate(key) : code;
  }
}
