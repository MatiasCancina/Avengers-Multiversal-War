import { PageState } from '../../../../core/models/page-state.interface';
import { KnockoutStageApi } from './knockout-stage-api.interface';

export interface KnockoutStageViewModel extends PageState {
  data: KnockoutStageApi | null;
  lang: 'es' | 'en';
}