import { PageState } from '../../../../core/models/page-state.interface';
import { AwardsModel } from '../model/awards-api.interface';

export interface AwardsViewModel extends PageState {
  data: AwardsModel | null;
  lang: 'es' | 'en';
}
