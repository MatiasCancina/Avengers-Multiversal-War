import { PageState } from '../../../../core/models/page-state.interface';
import { LiveEventApi } from '../../live-events/model/live-events-api.interface';
import { FinalBattleApi } from './final-battle-api.interface';

export type FinalBattleSelectionSource = 'hero' | 'team';

export interface FinalBattleViewModel extends PageState {
  data: FinalBattleApi | null;
  lang: 'es' | 'en';

  submitting: boolean;
  refreshing: boolean;
  operationError: string | null;
  operationErrorCode: string | null;

  selectedSource: FinalBattleSelectionSource | null;
  selectedHeroId: string | null;
  selectedAbilityKey: string | null;
  selectedActionId: string | null;

  events: LiveEventApi[];
  eventsError: string | null;
}
