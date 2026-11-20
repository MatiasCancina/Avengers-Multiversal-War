import { fakeAsync, tick } from '@angular/core/testing';
import { defer, of, throwError } from 'rxjs';
import { ApiError } from '../models/api-error.interface';
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
        })
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

  it('retries once when the BFF reports the configured Team context is unavailable', fakeAsync(() => {
    let attempts = 0;
    const api = {
      get: () =>
        defer(() => {
          attempts += 1;
          if (attempts === 1) {
            return throwError(
              () => new ApiError('BFF_TEAM_CONTEXT_UNAVAILABLE', 'Team context is unavailable.'),
            );
          }
          return of({
            serverTime: '',
            success: true,
            responseMessage: { messageCode: '0000', message: 'OK' },
            data: context('spider-man'),
          });
        })
    } as unknown as ApiService;
    const visuals = { apply: () => undefined } as UiVisualsService;
    const service = new AppContextService(api, visuals);
    let loadedTeamId: string | undefined;

    service.reload().subscribe((value) => (loadedTeamId = value.teamId));

    expect(attempts).toBe(1);
    tick(3000);
    expect(attempts).toBe(2);
    expect(loadedTeamId).toBe('spider-man');
  }));

  it('does not retry unrelated API errors', fakeAsync(() => {
    let attempts = 0;
    const api = {
      get: () => {
        attempts += 1;
        return throwError(() => new ApiError('NOT_FOUND', 'Not found.'));
      },
    } as unknown as ApiService;
    const visuals = { apply: () => undefined } as UiVisualsService;
    const service = new AppContextService(api, visuals);
    let receivedError: unknown;

    service.reload().subscribe({ error: (error) => (receivedError = error) });

    tick(3000);
    expect(attempts).toBe(1);
    expect(receivedError).toEqual(jasmine.any(ApiError));
  }));
});
