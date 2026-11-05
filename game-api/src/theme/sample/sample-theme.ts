import { Theme } from '../model/theme.model';

export const SAMPLE_THEME: Theme = {
  id: 'theme-a',
  name: 'Theme A',
  teams: [
    {
      id: 'team-alpha',
      name: 'Team Alpha',
      description: 'A sample team from Theme A.',
      themeId: 'theme-a',
    },
    {
      id: 'team-beta',
      name: 'Team Beta',
      description: 'Another sample team from Theme A.',
      themeId: 'theme-a',
    },
  ],
};
