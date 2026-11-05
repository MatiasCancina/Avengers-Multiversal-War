import { Injectable } from '@nestjs/common';
import { TeamProfile } from '../teams/model/team-profile.interface';
import { Theme } from './model/theme.model';
import { SAMPLE_THEME } from './sample/sample-theme';

@Injectable()
export class ThemeProvider {
  getTheme(): Theme {
    return {
      ...SAMPLE_THEME,
      teams: this.getTeamProfiles(),
    };
  }

  getTeamProfiles(): TeamProfile[] {
    return SAMPLE_THEME.teams.map((team) => ({ ...team }));
  }
}
