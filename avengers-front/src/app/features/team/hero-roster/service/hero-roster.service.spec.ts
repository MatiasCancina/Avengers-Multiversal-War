import { of, throwError } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { HeroArtworkResolverService } from '../../../../core/services/hero-artwork-resolver.service';
import { HeroRosterApi, RosterHero } from '../model/hero-roster-api.interface';
import { HeroRosterRoleEnum } from '../model/hero-roster-role.enum';
import { HeroRosterService } from './hero-roster.service';

describe('HeroRosterService', () => {
  const hero = (id: string): RosterHero => ({
    id,
    displayName: id,
    portrait: null,
    portraitFallback: 'assets/artwork/default_card.webp',
    archetype: 'TACTICIAN',
    eligibility: 'PREFERRED',
    stats: { power: 70, agility: 50, resistance: 50, ability: 60 },
    maxima: { energy: 100, abilityPoints: 100 },
    roles: { primary: 'TECH', secondary: 'SUPPORT' },
    abilities: {
      offensive: { id: 'offensive', name: 'Offensive' },
      support: { id: 'support', name: 'Support' },
      leader: null,
    },
    leaderProfile: null,
    biography: 'Bio',
    tournamentMotivation: 'Motivation',
    allies: [],
    rivals: [],
    selected: id === 'alpha',
    leader: id === 'alpha',
    active: id === 'alpha',
  });

  const data: HeroRosterApi = {
    configuredTeamId: 'alpha',
    configuredHeroIds: ['alpha'],
    heroes: [hero('alpha'), hero('beta'), hero('gamma')],
    totalHeroes: 3,
    visibleHeroes: 3,
    appliedFilters: { searchTerm: '', role: HeroRosterRoleEnum.ALL },
    configuredRelationships: [],
    roleCoverage: { TECH: 1 },
  };

  const envelope = (payload: HeroRosterApi) => ({
    serverTime: '',
    success: true,
    responseMessage: { messageCode: '0000', message: 'OK' },
    data: payload,
  });

  function createService() {
    const api = {
      get: jasmine.createSpy('get').and.returnValue(of(envelope(data))),
    } as unknown as ApiService;
    const appContext = { getCurrentLang: () => 'en' } as AppContextService;
    return {
      api,
      service: new HeroRosterService(api, new HeroArtworkResolverService(), appContext),
    };
  }

  it('loads the BFF roster with explicit search and role query parameters', () => {
    const { api, service } = createService();
    service.initialize();

    expect(api.get).toHaveBeenCalledWith('/my-team/heroes', { searchTerm: '', role: 'ALL' });
    expect(service.getViewModel().status).toBe('data');
    expect(service.getViewModel().data?.heroes.map((item) => item.id)).toEqual([
      'alpha',
      'beta',
      'gamma',
    ]);
  });

  it('renders the filtered Heroes returned by BFF and sends changed filters', () => {
    const { api, service } = createService();
    service.initialize();

    const filteredData: HeroRosterApi = {
      ...data,
      heroes: [hero('beta')],
      visibleHeroes: 1,
      appliedFilters: { searchTerm: 'beta', role: HeroRosterRoleEnum.SUPPORT },
    };
    (api.get as jasmine.Spy).and.returnValue(of(envelope(filteredData)));

    service.setSearchTerm('beta');
    service.setRoleFilter(HeroRosterRoleEnum.SUPPORT);

    expect(api.get).toHaveBeenCalledWith('/my-team/heroes', {
      searchTerm: 'beta',
      role: 'SUPPORT',
    });
    expect(service.getViewModel().data?.heroes.map((item) => item.id)).toEqual(['beta']);
    expect(service.getViewModel().data?.visibleHeroes).toBe(1);
  });

  it('preserves selected comparison Heroes when a BFF filter hides them', () => {
    const { api, service } = createService();
    service.initialize();
    service.select(hero('alpha'));
    service.select(hero('beta'));

    const filteredData: HeroRosterApi = {
      ...data,
      heroes: [hero('gamma')],
      visibleHeroes: 1,
      appliedFilters: { searchTerm: 'gamma', role: HeroRosterRoleEnum.ALL },
    };
    (api.get as jasmine.Spy).and.returnValue(of(envelope(filteredData)));
    service.setSearchTerm('gamma');

    expect(service.getViewModel().data?.heroes.map((item) => item.id)).toEqual(['gamma']);
    expect(service.getViewModel().comparisonHeroes.map((item) => item.id)).toEqual([
      'alpha',
      'beta',
    ]);
  });

  it('keeps two comparison selections and replaces Hero 2 on the third selection', () => {
    const { service } = createService();
    service.initialize();

    service.select(hero('alpha'));
    service.select(hero('beta'));
    service.select(hero('gamma'));
    expect(service.getViewModel().comparisonHeroes.map((item) => item.id)).toEqual([
      'alpha',
      'gamma',
    ]);
  });

  it('promotes Hero 2 when Hero 1 is removed and clears removed selections', () => {
    const { service } = createService();
    service.initialize();
    service.select(hero('alpha'));
    service.select(hero('beta'));

    service.remove(1);
    expect(service.getViewModel().comparisonHeroes.map((item) => item.id)).toEqual(['beta']);

    service.select(hero('gamma'));
    service.remove(2);
    service.remove(1);
    expect(service.getViewModel().comparisonHeroes).toEqual([]);
  });

  it('shows the empty state when the BFF returns no matching Heroes', () => {
    const { api, service } = createService();
    const emptyData: HeroRosterApi = {
      ...data,
      heroes: [],
      visibleHeroes: 0,
      appliedFilters: { searchTerm: 'unknown', role: HeroRosterRoleEnum.ALL },
    };
    (api.get as jasmine.Spy).and.returnValue(of(envelope(emptyData)));

    service.setSearchTerm('unknown');

    expect(service.getViewModel().status).toBe('empty');
    expect(service.getViewModel().data?.heroes).toEqual([]);
  });

  it('preserves the public error code when loading fails', () => {
    const api = {
      get: jasmine.createSpy('get').and.returnValue(
        throwError(() => ({
          error: {
            responseMessage: { messageCode: 'HERO_ROSTER_UNAVAILABLE', message: 'Unavailable' },
          },
        })),
      ),
    } as unknown as ApiService;
    const appContext = { getCurrentLang: () => 'en' } as AppContextService;
    const service = new HeroRosterService(api, new HeroArtworkResolverService(), appContext);

    service.initialize();

    expect(service.getViewModel().status).toBe('error');
    expect(service.getViewModel().errorCode).toBe('HERO_ROSTER_UNAVAILABLE');
    expect(service.getViewModel().error).toBe('Unavailable');
  });
});
