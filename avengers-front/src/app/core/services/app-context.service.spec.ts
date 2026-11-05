import { of } from 'rxjs';
import { ApiService } from './api.service';
import { AppContextService } from './app-context.service';
import { STANDARD_THEME, UiVisualsService, VisualTheme } from './ui-visuals.service';

describe('AppContextService', () => {
  const context = (teamId: string) => ({
    teamId,
    language: 'es' as const,
    profile: { id: teamId, name: `Team ${teamId}`, description: '' },
    assignedTeam: { id: teamId, name: `Team ${teamId}`, leaderId: teamId, visualKey: teamId },
    currentJourney: null,
  });

  it('loads the fixed configured context read-only and applies the application theme', () => {
    let requestedPath = '';
    const api = {
      get: (path: string) => {
        requestedPath = path;
        return of({
          serverTime: '',
          success: true,
          responseMessage: { messageCode: '0000', message: 'OK' },
          data: context('spider-man'),
        });
      },
    } as unknown as ApiService;
    let applied: VisualTheme | undefined;
    const visuals = { apply: (theme: VisualTheme) => (applied = theme) } as UiVisualsService;
    const service = new AppContextService(api, visuals);
    service.initialize().subscribe();
    expect(service.current?.teamId).toBe('spider-man');
    expect(requestedPath).toBe('/context');
    expect(applied).toEqual(STANDARD_THEME);
  });
});
