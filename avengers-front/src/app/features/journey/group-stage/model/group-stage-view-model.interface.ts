import { GroupStageApi } from './group-stage-api.interface';

export interface GroupStageViewModel {
  status: 'loading' | 'data' | 'empty' | 'error';
  error: string | null;
  data: GroupStageApi | null;
  selectedGroupId: string | null;
}
