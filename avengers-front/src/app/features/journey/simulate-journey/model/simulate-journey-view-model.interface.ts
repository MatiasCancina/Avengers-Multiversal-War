import { PageState } from '../../../../core/models/page-state.interface';
import { SimulationApi, SpendingStrategy } from './simulate-journey-api.interface';
import { AppLanguage } from '../../../../core/services/i18n.service';

export interface SimulationViewModel extends PageState {
  data: SimulationApi | null;
  strategy: SpendingStrategy;
  submitting: boolean;
  success: string | null;
  lang: AppLanguage;
}
