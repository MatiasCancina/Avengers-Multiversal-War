import { Component, OnInit } from '@angular/core';
import { SimulateJourneyService } from './service/simulate-journey.service';
import { SimulationApi, SpendingStrategy } from './model/simulate-journey-api.interface';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-simulate-journey',
  templateUrl: './simulate-journey.component.html',
  styleUrls: ['./simulate-journey.component.css'],
  standalone: false,
})
export class SimulateJourneyComponent implements OnInit {
  constructor(
    private readonly simulateJourneyService: SimulateJourneyService,
    readonly i18nService: I18nService,
  ) {}

  get pageState() {
    return this.simulateJourneyService.getViewModel();
  }

  ngOnInit(): void {
    this.simulateJourneyService.initialize();
  }

  get opponentTeam(): NonNullable<SimulationApi['currentAttempt']>['finalists'][number] | null {
    const data = this.pageState.data;
    return data?.currentAttempt?.finalists.find((team) => team.id !== data.playerTeam.id) ?? null;
  }

  onSpendingStrategySelect(strategy: SpendingStrategy): void {
    this.simulateJourneyService.setStrategy(strategy);
  }

  simulateJourney(): void {
    this.simulateJourneyService.simulate();
  }

  portraitPath(heroId: string): string {
    return this.simulateJourneyService.portraitPath(heroId);
  }

  imageError(event: Event): void {
    this.simulateJourneyService.imageError(event);
  }
}
