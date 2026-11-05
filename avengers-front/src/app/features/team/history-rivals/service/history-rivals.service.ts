import { Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { toApiError } from '../../../../core/models/api-error.interface';

export interface Rival { id: string; name: string }
export interface PlayerHero extends Rival { leader: boolean; rivals: Rival[] }
export interface RivalMatch {
  heroId: string; rivalId: string; encounterId: string; stageId: string; stageCode: string;
  groupId: string | null; teamA: Rival & { id: string }; teamB: Rival & { id: string };
  winnerTeamId: string | null;
  results: { teamId: string; resultCode: string }[];
  damageByTeam: { teamId: string; damageDealt: number }[];
}
export interface HistoryRivalsData {
  heroes: PlayerHero[]; history: { attemptId: string; completedAt: string; outcomeCode: string }[];
  selectedAttemptId: string; journeyAvailable: boolean; matches: RivalMatch[];
}

@Injectable({ providedIn: 'root' })
export class HistoryRivalsService extends BaseApiService {
  readonly state: { status: 'loading' | 'error' | 'empty' | 'data'; error: string | null;
    data: HistoryRivalsData | null; heroId: string; rivalId: string; attemptId: string } = {
    status: 'loading', error: null, data: null, heroId: '', rivalId: '', attemptId: 'current',
  };
  constructor(api: ApiService) { super(api); }
  initialize(): void { this.load(); }
  selectHero(id: string): void {
    this.state.heroId = id;
    this.state.rivalId = this.selectedHero?.rivals[0]?.id || '';
  }
  selectRival(id: string): void { this.state.rivalId = id; }
  selectAttempt(id: string): void { this.state.attemptId = id; this.load(); }
  get selectedHero(): PlayerHero | undefined {
    return this.state.data?.heroes.find(h => h.id === this.state.heroId);
  }
  get matches(): RivalMatch[] {
    return this.state.data?.matches.filter(m => m.heroId === this.state.heroId && m.rivalId === this.state.rivalId) || [];
  }
  private load(): void {
    this.state.status = 'loading'; this.state.error = null;
    const params = this.state.attemptId === 'current' ? undefined : { attemptId: this.state.attemptId };
    this.getData<HistoryRivalsData>('/my-team/history-rivals', params).subscribe({
      next: data => {
        this.state.data = data;
        this.state.status = data.heroes.length ? 'data' : 'empty';
        if (!data.heroes.some(h => h.id === this.state.heroId)) this.state.heroId = data.heroes[0]?.id || '';
        if (!this.selectedHero?.rivals.some(r => r.id === this.state.rivalId)) {
          this.state.rivalId = this.selectedHero?.rivals[0]?.id || '';
        }
      },
      error: error => { this.state.error = toApiError(error).message; this.state.status = 'error'; },
    });
  }
}
