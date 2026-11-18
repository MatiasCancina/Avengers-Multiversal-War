import { PageState } from '../../../../core/models/page-state.interface';
import { AwardsApi } from '../model/awards-api.interface';

export interface AwardsViewModel extends PageState {
  data: AwardsApi | null;
  lang: 'es' | 'en';
}
