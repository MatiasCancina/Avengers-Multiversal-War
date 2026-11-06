import { PageState } from 'src/app/core/models/page-state.interface';
import { SaveTeamConfigBody, TeamConfigModel } from './team-config-api.interface';
import { AppCopyKey, AppLanguage } from 'src/app/core/services/i18n.service';

export interface TeamConfigViewModel extends PageState {
  data: TeamConfigModel | null; // lo que vino del backend
  draft: SaveTeamConfigBody | null; // lo que la persona está editando
  saving: boolean;
  searchTerm: string;
  saveMessage: AppCopyKey | null; // 'teamConfig.saved' o 'teamConfig.journeyReplaced'
  lang: AppLanguage;
  replacingHeroId: string | null;
}
