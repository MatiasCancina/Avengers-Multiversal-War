import { Component, OnInit } from '@angular/core';
import { AppCopyKey, AppLanguage, I18nService } from '../../../core/services/i18n.service';
import { HeroRosterRoleEnum } from './model/hero-roster-role.enum';
import { HeroRosterViewModel } from './model/hero-roster-view-model.interface';
import { RosterHero } from './model/hero-roster-api.interface';
import { HeroRosterService } from './service/hero-roster.service';

@Component({
  selector: 'app-hero-roster',
  templateUrl: './hero-roster.component.html',
  styleUrls: ['./hero-roster.component.css'],
  standalone: false,
})
export class HeroRosterComponent implements OnInit {
  readonly heroRosterRoleEnum = HeroRosterRoleEnum;

  constructor(
    private readonly heroRosterService: HeroRosterService,
    private readonly i18nService: I18nService,
  ) {}

  get pageState(): HeroRosterViewModel {
    return this.heroRosterService.getViewModel();
  }

  ngOnInit(): void {
    this.heroRosterService.initialize();
  }

  onSearchTermChange(searchTerm: string): void {
    this.heroRosterService.setSearchTerm(searchTerm);
  }

  onRoleFilterChange(roleFilter: HeroRosterRoleEnum): void {
    this.heroRosterService.setRoleFilter(roleFilter);
  }

  onHeroSelect(hero: RosterHero): void {
    this.heroRosterService.select(hero);
  }

  onHeroRemove(slot: number): void {
    this.heroRosterService.remove(slot);
  }

  retry(): void {
    this.heroRosterService.initialize();
  }

  translate(
    key: AppCopyKey,
    lang: AppLanguage,
    params: Record<string, string | number> = {},
  ): string {
    return this.i18nService.translate(key, lang, params);
  }

  portraitPath(hero: RosterHero): string {
    return this.heroRosterService.portraitPath(hero.id);
  }

  cardPath(hero: RosterHero): string {
    return this.heroRosterService.cardPath(hero.id);
  }

  imageError(event: Event): void {
    this.heroRosterService.imageError(event);
  }

  statPercent(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  trackHero(_index: number, hero: RosterHero): string {
    return hero.id;
  }
}
