import { Component, OnInit } from '@angular/core';
import { AppCopyKey, I18nService } from '../../../core/services/i18n.service';
import { AwardsService } from './service/awards.service';
import { AwardsViewModel } from './service/awards-view-model.interface';
import { AwardModel } from './model/awards-api.interface';

const AWARD_TITLE_KEYS: Partial<Record<string, AppCopyKey>> = {
  MIGHTIEST_HERO: 'r12.award.mightiestHero',
  BEST_SUPPORT: 'r12.award.bestSupport',
  MOST_RESILIENT: 'r12.award.mostResilient',
  JOURNEY_MVP: 'r12.award.journeyMvp',
};

@Component({
  selector: 'app-awards',
  templateUrl: './awards.component.html',
  styleUrls: ['./awards.component.css'],
  standalone: false,
})
export class AwardsComponent implements OnInit {
  constructor(
    private readonly awardsService: AwardsService,
    private readonly i18nService: I18nService,
  ) {}

  get pageState(): AwardsViewModel {
    return this.awardsService.getViewModel();
  }

  ngOnInit(): void {
    this.awardsService.initialize();
  }

  translate(key: AppCopyKey): string {
    return this.i18nService.translate(key, this.pageState.lang);
  }

  awardTitle(award: AwardModel): string {
    const key = AWARD_TITLE_KEYS[award.code];
    return key ? this.translate(key) : award.label;
  }

  trackAward(_index: number, award: AwardModel): string {
    return award.code;
  }

  onRefresh(): void {
    this.awardsService.refresh();
  }
}
