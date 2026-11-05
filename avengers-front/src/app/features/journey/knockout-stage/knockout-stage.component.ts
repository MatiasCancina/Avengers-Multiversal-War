import { Component, OnInit } from '@angular/core';
import { AppCopyKey, AppLanguage, I18nService } from '../../../core/services/i18n.service';
import {
  KnockoutMatch,
  KnockoutRound,
  KnockoutStageCode,
  KnockoutTeam,
} from './model/knockout-stage-api.interface';
import { KnockoutStageViewModel } from './model/knockout-stage-view-model.interface';
import { KnockoutStageService } from './service/knockout-stage.service';

@Component({
  selector: 'app-knockout-stage',
  templateUrl: './knockout-stage.component.html',
  styleUrls: ['./knockout-stage.component.css'],
  standalone: false,
})
export class KnockoutStageComponent implements OnInit {
  private readonly stageKeys: Record<KnockoutStageCode, AppCopyKey> = {
    ROUND_OF_16: 'r6.roundOf16',
    QUARTERFINAL: 'r6.quarterfinal',
    SEMIFINAL: 'r6.semifinal',
  };

  constructor(
    private readonly knockoutStageService: KnockoutStageService,
    private readonly i18nService: I18nService,
  ) {}

  get pageState(): KnockoutStageViewModel {
    return this.knockoutStageService.getViewModel();
  }

  ngOnInit(): void {
    this.knockoutStageService.initialize();
  }

  translate(
    key: AppCopyKey,
    lang: AppLanguage,
    params: Record<string, string | number> = {},
  ): string {
    return this.i18nService.translate(key, lang, params);
  }

  stageLabel(stageCode: KnockoutStageCode): string {
    return this.translate(this.stageKeys[stageCode], this.pageState.lang);
  }

  isWinner(match: KnockoutMatch, team: KnockoutTeam): boolean {
    return match.winnerTeamId === team.teamId;
  }

  isPlayer(teamId: string): boolean {
    return this.pageState.data?.playerTeamId === teamId;
  }

  teamName(teamId: string | null | undefined): string {
    if (!teamId) {
      return this.translate('r6.pending', this.pageState.lang);
    }

    for (const round of this.pageState.data?.rounds ?? []) {
      for (const match of round.matches) {
        if (match.teamA.teamId === teamId) {
          return match.teamA.name;
        }
        if (match.teamB.teamId === teamId) {
          return match.teamB.name;
        }
      }
    }

    return teamId;
  }

  trackRound(_index: number, round: KnockoutRound): string {
    return round.stageCode;
  }

  trackMatch(_index: number, match: KnockoutMatch): string {
    return match.encounterId;
  }
}
