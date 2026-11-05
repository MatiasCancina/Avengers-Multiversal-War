import { Component, OnInit } from '@angular/core';
import { AppCopyKey, AppLanguage, I18nService } from '../../../core/services/i18n.service';
import {
  TeamJourneyActiveHeroesViewModel,
  TeamJourneyDamageViewModel,
  TeamJourneyEventViewModel,
  TeamJourneyHeroViewModel,
  TeamJourneyNarrativeLineViewModel,
  TeamJourneyRoundViewModel,
  TeamJourneyStopViewModel,
  TeamJourneyViewModel,
} from './model/team-journey-view-model.interface';
import { TeamJourneyService } from './service/team-journey.service';

@Component({
  selector: 'app-team-journey',
  templateUrl: './team-journey.component.html',
  styleUrls: ['./team-journey.component.css'],
  standalone: false,
})
export class TeamJourneyComponent implements OnInit {
  constructor(
    private readonly teamJourneyService: TeamJourneyService,
    private readonly i18nService: I18nService,
  ) {}

  get pageState(): TeamJourneyViewModel {
    return this.teamJourneyService.getViewModel();
  }

  ngOnInit(): void {
    this.teamJourneyService.initialize();
  }

  translate(
    key: AppCopyKey,
    lang: AppLanguage,
    params: Record<string, string | number> = {},
  ): string {
    return this.i18nService.translate(key, lang, params);
  }

  selectEncounter(encounterId: string): void {
    this.teamJourneyService.selectEncounter(encounterId);
  }

  selectFinalStop(): void {
    this.teamJourneyService.selectFinalStop();
  }

  retry(): void {
    this.teamJourneyService.retry();
  }

  retryDetail(): void {
    this.teamJourneyService.retryDetail();
  }

  trackStop(_index: number, stop: TeamJourneyStopViewModel): string {
    return stop.stopId;
  }

  trackRound(_index: number, round: TeamJourneyRoundViewModel): string {
    return round.roundId;
  }

  trackTeam(
    _index: number,
    team: TeamJourneyDamageViewModel | TeamJourneyActiveHeroesViewModel,
  ): string {
    return team.teamId;
  }

  trackHero(_index: number, hero: TeamJourneyHeroViewModel): string {
    return hero.heroId;
  }

  trackEvent(_index: number, event: TeamJourneyEventViewModel): number {
    return event.sequence;
  }

  trackNarrativeLine(_index: number, line: TeamJourneyNarrativeLineViewModel): number {
    return line.lineSequence;
  }
}
