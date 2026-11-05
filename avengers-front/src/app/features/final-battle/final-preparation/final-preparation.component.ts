import { Component, OnInit } from '@angular/core';
import {
  FinalPreparationData,
  FinalPreparationViewModel,
  HeroState,
  PowerUpDefinition,
  StrategyDefinition,
  TournamentTeam,
} from './model/final-preparation-view-model.interface';
import { FinalPreparationService } from './service/final-preparation.service';

@Component({
  selector: 'app-final-preparation',
  templateUrl: './final-preparation.component.html',
  styleUrls: ['./final-preparation.component.css'],
  standalone: false,
})
export class FinalPreparationComponent implements OnInit {
  selectedActiveIds: string[] | null = null;

  selectedStrategy = '';

  selectedPurchaseId = '';

  purchaseQuantity = 1;

  selectedUseId = '';

  selectedTargetHeroId = '';

  constructor(public readonly finalpreparationService: FinalPreparationService) {}

  get pageState(): FinalPreparationViewModel {
    return this.finalpreparationService.getViewModel();
  }

  get data(): FinalPreparationData | null {
    const data = this.pageState.data;

    if (!this.selectedStrategy && data?.journey.summary?.configuration.strategyCode) {
      this.selectedStrategy = data.journey.summary.configuration.strategyCode;
    }

    return data;
  }

  get player(): TournamentTeam | null {
    if (this.data?.player) {
      return this.data.player;
    }

    const teams = this.data?.teams?.teams ?? [];

    return teams.find((team) => team.teamId === this.data?.teamId) ?? null;
  }

  get playerHeroes(): HeroState[] {
    return this.player?.heroes ?? [];
  }

  get allHeroIds(): string[] {
    return this.player?.heroIds ?? this.data?.journey.summary?.configuration.inactiveHeroIds ?? [];
  }

  get activeIds(): string[] {
    const configured = this.data?.journey.summary?.configuration.activeHeroIds ?? [];
    const current = this.selectedActiveIds ?? configured;

    return current.filter((id) => this.allHeroIds.includes(id));
  }

  get activeHeroIds(): string[] {
    return this.allHeroIds.filter((id) => this.activeIds.includes(id));
  }

  get reserveHeroIds(): string[] {
    return this.allHeroIds.filter((id) => !this.activeIds.includes(id));
  }

  heroState(heroId: string): HeroState | null {
    return this.playerHeroes.find((hero) => hero.heroId === heroId) ?? null;
  }

  heroName(value: string | null | undefined): string {
    if (!value) {
      return 'No publicado';
    }

    return value
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  teamDisplayName(team: TournamentTeam | null, fallback: string): string {
    if (team?.name && team.name !== team.teamId) {
      return team.name;
    }

    return fallback;
  }

  readableStatus(value: string | null | undefined): string {
    if (!value) {
      return 'No publicado';
    }

    return value
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  readableList(values: string[] | null | undefined): string {
    return (values ?? []).map((value) => this.readableStatus(value)).join(', ');
  }

  get strategies(): StrategyDefinition[] {
    return this.data?.strategies?.strategies ?? [];
  }

  get powerUps(): PowerUpDefinition[] {
    return this.data?.powerUps?.powerUps ?? [];
  }

  get inventory() {
    return this.data?.inventory?.items ?? [];
  }

  get balance(): number | null {
    return this.data?.rewards?.balance ?? null;
  }

  ngOnInit(): void {
    this.finalpreparationService.initialize();
  }

  isActive(heroId: string): boolean {
    return this.activeIds.includes(heroId);
  }

  toggleActive(heroId: string): void {
    const current = [...this.activeIds];
    const leaderId = this.player?.leaderId;

    if (heroId === leaderId) {
      return;
    }

    if (current.includes(heroId)) {
      this.selectedActiveIds = current.filter((id) => id !== heroId);
      return;
    }

    if (current.length >= 3) {
      return;
    }

    this.selectedActiveIds = [...current, heroId];
  }

  savePreparation(): void {
    const data = this.data;

    if (
      !data ||
      this.activeIds.length !== 3 ||
      !this.activeIds.includes(this.player?.leaderId ?? '')
    ) {
      return;
    }

    this.finalpreparationService.savePreparation(
      this.activeIds,
      this.selectedStrategy || data.journey.summary?.configuration.strategyCode || 'BALANCED',
    );
  }

  buy(): void {
    if (!this.selectedPurchaseId || this.purchaseQuantity < 1) {
      return;
    }

    this.finalpreparationService.purchase(this.selectedPurchaseId, this.purchaseQuantity);
  }

  useItem(): void {
    if (!this.selectedUseId) {
      return;
    }

    const item = this.selectedPowerUp;

    if (!item || !this.canUse(item)) {
      return;
    }

    if (item.targetScope === 'HERO' && !this.selectedTargetHeroId) {
      return;
    }

    const targetHeroId = item.targetScope === 'HERO' ? this.selectedTargetHeroId : undefined;

    this.finalpreparationService.useItem(this.selectedUseId, targetHeroId);
  }

  get selectedPowerUp(): PowerUpDefinition | undefined {
    return this.powerUps.find((item) => item.id === this.selectedUseId);
  }

  getItemName(itemId: string): string {
    return this.powerUps.find((item) => item.id === itemId)?.name ?? itemId;
  }

  inventoryQuantity(itemId: string): number {
    return this.inventory.find((item) => item.itemId === itemId)?.quantity ?? 0;
  }

  canUse(item: PowerUpDefinition): boolean {
    const owned = this.inventory.find((entry) => entry.itemId === item.id);

    return (
      !!owned &&
      owned.quantity > 0 &&
      owned.legalUseContexts.includes('PRE_FINAL') &&
      item.useContexts.includes('PRE_FINAL')
    );
  }

  effectSummary(item: PowerUpDefinition): string {
    const effect = item.effect;

    switch (effect.effectCode) {
      case 'ENERGY_RECOVERY':
        return `${item.description} (recuperación objetivo: ${
          effect.targetPercentage ?? 'no especificado'
        }%; puede revivir: ${effect.canRevive ? 'sí' : 'no'}).`;

      case 'ABILITY_POINT_RECOVERY':
        return `${item.description} (${
          effect.fullRecovery
            ? 'recuperación completa de AP'
            : `recuperación objetivo: ${effect.targetPercentage ?? 'no especificado'}%`
        }).`;

      case 'REVIVE':
        return `${item.description} (efecto publicado: revivir).`;

      case 'STAT_BOOST':
        return `${item.description} (${effect.statCode ?? 'estadística'}: +${
          effect.percentage ?? 0
        }% durante ${effect.durationRounds ?? 0} rondas).`;

      case 'EXTRA_TEAM_ACTION':
      case 'EXTRA_LEADER_ABILITY':
        return `${item.description} (efecto publicado: ${effect.effectCode}).`;

      default:
        return item.description;
    }
  }

  get finalBattleCta(): string {
    switch (this.data?.finalStage?.status) {
      case 'READY':
        return 'Comenzar Batalla Final';
      case 'ACTIVE':
        return 'Continuar Batalla Final';
      case 'COMPLETED':
        return 'Consultar resultado de la Final';
      default:
        return 'Abrir Batalla Final';
    }
  }
}
