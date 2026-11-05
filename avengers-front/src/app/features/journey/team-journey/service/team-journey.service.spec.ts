import { Observable, Subject, of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error.interface';
import { ResponseObject } from '../../../../core/models/response-object.interface';
import { AppContextService } from '../../../../core/services/app-context.service';
import { ApiService } from '../../../../core/services/api.service';
import { TeamJourneyApi, TeamJourneyStopApi } from '../model/team-journey-api.interface';
import {
  TeamJourneyDetailApi,
  TeamJourneyEventApi,
  TeamJourneyRoundApi,
} from '../model/team-encounter-detail-api.interface';
import { TeamJourneyService } from './team-journey.service';

describe('TeamJourneyService', () => {
  const TEAM_ID = 'spider-man';
  const UNAVAILABLE_CODE = 'BFF_TEAM_JOURNEY_UNAVAILABLE';
  const LIST_ENDPOINT = '/journey/team/encounters';

  const stop = (overrides: Partial<TeamJourneyStopApi> = {}): TeamJourneyStopApi => ({
    kind: 'ENCOUNTER',
    encounterId: 'gs-01',
    stageId: 'group-a',
    stageCode: 'GROUP_STAGE',
    groupId: 'A',
    resolutionCode: 'NORMAL',
    opponentTeamId: 'black-panther',
    opponentTeamName: 'Black Panther',
    outcome: 'WIN',
    damageDealt: 184,
    rivalEncounter: true,
    finalStageStatus: null,
    ...overrides,
  });

  const finalStop = (overrides: Partial<TeamJourneyStopApi> = {}): TeamJourneyStopApi => ({
    kind: 'FINAL',
    encounterId: null,
    stageId: null,
    stageCode: 'FINAL_STAGE',
    groupId: null,
    resolutionCode: null,
    opponentTeamId: 'doom',
    opponentTeamName: 'Doom',
    outcome: 'PENDING',
    damageDealt: null,
    rivalEncounter: null,
    finalStageStatus: 'READY',
    ...overrides,
  });

  const event = (overrides: Partial<TeamJourneyEventApi> = {}): TeamJourneyEventApi => ({
    sequence: 12,
    eventCode: 'DAMAGE',
    teamId: TEAM_ID,
    teamName: 'Spider-Man',
    actorHeroId: 'spider-man',
    actorHeroName: 'Spider-Man',
    targetHeroIds: ['black-panther'],
    targetHeroNames: ['Black Panther'],
    messageCode: 'journey.damage',
    amount: 62,
    narrativeLines: [
      {
        lineSequence: 1,
        type: 'NARRATION',
        speakerId: null,
        speakerName: null,
        text: 'Spider-Man hits Black Panther.',
      },
    ],
    ...overrides,
  });

  const round = (overrides: Partial<TeamJourneyRoundApi> = {}): TeamJourneyRoundApi => ({
    number: 1,
    roundType: 'NORMAL',
    initiativeTeamId: TEAM_ID,
    initiativeTeamName: 'Spider-Man',
    winnerTeamId: TEAM_ID,
    winnerTeamName: 'Spider-Man',
    damageByTeam: [
      { teamId: TEAM_ID, teamName: 'Spider-Man', damageDealt: 62 },
      { teamId: 'black-panther', teamName: 'Black Panther', damageDealt: 41 },
    ],
    activeHeroesByTeam: [
      {
        teamId: TEAM_ID,
        teamName: 'Spider-Man',
        heroes: [{ heroId: 'spider-man', heroName: 'Spider-Man' }],
      },
    ],
    events: [event()],
    ...overrides,
  });

  const detail = (overrides: Partial<TeamJourneyDetailApi> = {}): TeamJourneyDetailApi => ({
    encounterId: 'gs-01',
    stageId: 'group-a',
    stageCode: 'GROUP_STAGE',
    groupId: 'A',
    teamAId: TEAM_ID,
    teamBId: 'black-panther',
    winnerTeamId: TEAM_ID,
    resolutionCode: 'NORMAL',
    rivalEncounter: true,
    outcome: 'WIN',
    damageDealt: 184,
    rounds: [round()],
    extraRound: null,
    ...overrides,
  });

  const payload: TeamJourneyApi = {
    attemptId: 'journey-1',
    playerTeamId: TEAM_ID,
    stops: [
      stop(),
      stop({
        encounterId: 'qf-01',
        stageId: 'quarterfinal',
        stageCode: 'QUARTERFINAL',
        groupId: null,
        resolutionCode: 'TOTAL_KO',
        outcome: 'LOSS',
        damageDealt: 75,
      }),
    ],
    progress: { played: 2, wins: 1, draws: 0, losses: 1 },
  };

  const payloadWithFinal: TeamJourneyApi = {
    ...payload,
    stops: [...payload.stops, finalStop()],
  };

  const envelope = <T>(data: T): ResponseObject<T> => ({
    serverTime: '',
    success: true,
    responseMessage: { messageCode: '0000', message: 'OK' },
    data,
  });

  const appContext = {
    getCurrentLang: () => 'en',
    current: { teamId: TEAM_ID },
  } as unknown as AppContextService;

  function createServiceWithGet(handler: (path: string) => Observable<ResponseObject<unknown>>) {
    const getSpy = jasmine.createSpy('get').and.callFake(handler);
    const api = { get: getSpy } as unknown as ApiService;

    return { getSpy, service: new TeamJourneyService(api, appContext) };
  }

  function defaultHandler(
    journey: TeamJourneyApi = payload,
    detailData: TeamJourneyDetailApi = detail(),
  ): (path: string) => Observable<ResponseObject<unknown>> {
    return (path: string) => {
      if (path === LIST_ENDPOINT) {
        return of(envelope(journey)) as Observable<ResponseObject<unknown>>;
      }

      if (path.startsWith(`${LIST_ENDPOINT}/`)) {
        return of(envelope(detailData)) as Observable<ResponseObject<unknown>>;
      }

      return throwError(() => new ApiError('UNEXPECTED_PATH', path));
    };
  }

  function createService(
    journey: TeamJourneyApi = payload,
    detailData: TeamJourneyDetailApi = detail(),
  ) {
    return createServiceWithGet(defaultHandler(journey, detailData));
  }

  it('requests only the team journey endpoint when the component initializes', () => {
    const { getSpy, service } = createService();

    service.initialize();

    const viewModel = service.getViewModel();
    expect(getSpy.calls.count()).toBe(1);
    expect(getSpy.calls.first().args[0]).toBe(LIST_ENDPOINT);
    expect(viewModel.status).toBe('data');
    expect(viewModel.selectedStopId).toBeNull();
    expect(viewModel.selectedStop).toBeNull();
    expect(viewModel.detailStatus).toBe('idle');
  });

  it('maps published stops without inventing round numbers', () => {
    const { service } = createService();

    service.initialize();

    const viewModel = service.getViewModel();
    expect(viewModel.status).toBe('data');
    expect(viewModel.teamId).toBe(TEAM_ID);
    expect(viewModel.stops.length).toBe(2);

    expect(viewModel.stops[0].kind).toBe('encounter');
    expect(viewModel.stops[0].stopId).toBe('gs-01');
    expect(viewModel.stops[0].stageId).toBe('group-a');
    expect(viewModel.stops[0].groupId).toBe('A');
    expect(viewModel.stops[0].stageLabelKey).toBe('historyRivals.stage.groupStage');
    expect(viewModel.stops[0].outcome).toBe('win');
    expect(viewModel.stops[0].outcomeLabelKey).toBe('r7.win');
    expect(viewModel.stops[0].damageDealt).toBe(184);
    expect('roundNumber' in viewModel.stops[0]).toBeFalse();

    expect(viewModel.stops[1].outcome).toBe('loss');
    expect(viewModel.stops[1].resolutionLabelKey).toBe('tournament.resolution.totalKo');
    expect(viewModel.stops[1].damageDealt).toBe(75);
  });

  it('uses the BFF progress summary as provided', () => {
    const { service } = createService();

    service.initialize();

    expect(service.getViewModel().progress).toEqual({
      played: 2,
      wins: 1,
      draws: 0,
      losses: 1,
    });
  });

  it('maps a pending Final without exposing a fake encounter identifier', () => {
    const { service } = createService(payloadWithFinal);

    service.initialize();

    const final = service.getViewModel().stops[2];
    expect(final.kind).toBe('final');
    expect(final.stopId).toBe('final-stage');
    expect(final.encounterId).toBeNull();
    expect(final.stageCode).toBe('FINAL_STAGE');
    expect(final.stageLabelKey).toBe('r7.finalBattle');
    expect(final.outcome).toBe('pending');
    expect(final.finalStageStatus).toBe('READY');
    expect(final.damageDealt).toBeNull();
  });

  it('maps the abandoned outcome to its own label key', () => {
    const abandonedPayload: TeamJourneyApi = {
      ...payloadWithFinal,
      stops: [...payload.stops, finalStop({ outcome: 'ABANDONED', finalStageStatus: 'COMPLETED' })],
    };
    const { service } = createService(abandonedPayload);

    service.initialize();

    expect(service.getViewModel().stops[2].outcome).toBe('abandoned');
    expect(service.getViewModel().stops[2].outcomeLabelKey).toBe('r7.abandoned');
  });

  it('leaves the stage label key empty for unknown stage codes', () => {
    const unknownPayload: TeamJourneyApi = {
      ...payload,
      stops: [stop({ stageCode: 'MYSTERY_STAGE' })],
    };
    const { service } = createService(unknownPayload);

    service.initialize();

    expect(service.getViewModel().stops[0].stageLabelKey).toBeNull();
  });

  it('does not request or select a detail during initialization', () => {
    const { getSpy, service } = createService();

    service.initialize();

    expect(getSpy.calls.count()).toBe(1);
    expect(service.getViewModel().selectedStopId).toBeNull();
    expect(service.getViewModel().detail).toBeNull();
    expect(service.getViewModel().detailStatus).toBe('idle');
  });

  it('moves through loading and data when the user selects an encounter', () => {
    const detailSubject = new Subject<ResponseObject<TeamJourneyDetailApi>>();
    const { getSpy, service } = createServiceWithGet((path) =>
      path === LIST_ENDPOINT
        ? (of(envelope(payload)) as Observable<ResponseObject<unknown>>)
        : (detailSubject.asObservable() as Observable<ResponseObject<unknown>>),
    );

    service.initialize();
    service.selectEncounter('gs-01');

    expect(getSpy.calls.mostRecent().args[0]).toBe(`${LIST_ENDPOINT}/gs-01`);
    expect(service.getViewModel().selectedStopId).toBe('gs-01');
    expect(service.getViewModel().detailStatus).toBe('loading');
    expect(service.getViewModel().detail).toBeNull();

    detailSubject.next(envelope(detail()));

    expect(service.getViewModel().detailStatus).toBe('data');
    expect(service.getViewModel().detail?.rounds.length).toBe(1);
  });

  it('maps rounds, names, events, narrative lines and extra rounds in API order', () => {
    const detailed = detail({
      rounds: [
        round({ number: 1, events: [event({ sequence: 12 })] }),
        round({ number: 2, events: [event({ sequence: 13 })] }),
      ],
      extraRound: round({
        number: 3,
        roundType: 'EXTRA_ROUND',
        winnerTeamId: null,
        winnerTeamName: null,
      }),
    });
    const { service } = createService(payload, detailed);

    service.initialize();
    service.selectEncounter('gs-01');

    const viewModel = service.getViewModel();
    const detailViewModel = viewModel.detail;

    expect(viewModel.detailStatus).toBe('data');
    expect(detailViewModel?.rounds.map((item) => item.number)).toEqual([1, 2]);
    expect(detailViewModel?.extraRound?.roundId).toBe('EXTRA_ROUND-3');
    expect(detailViewModel?.rounds[0].initiativeTeamName).toBe('Spider-Man');
    expect(detailViewModel?.rounds[0].winnerTeamName).toBe('Spider-Man');
    expect(detailViewModel?.rounds[0].damageByTeam[0].damageDealt).toBe(62);
    expect(detailViewModel?.rounds[0].activeHeroesByTeam[0].heroes[0].heroName).toBe('Spider-Man');
    expect(detailViewModel?.rounds[0].events[0].eventLabelKey).toBe('r7.event.damage');
    expect(detailViewModel?.rounds[0].events[0].actorHeroName).toBe('Spider-Man');
    expect(detailViewModel?.rounds[0].events[0].targetHeroNames).toEqual(['Black Panther']);
    expect(detailViewModel?.rounds[0].events[0].narrativeLines[0].text).toBe(
      'Spider-Man hits Black Panther.',
    );
    expect(detailViewModel?.extraRound?.winnerTeamName).toBeNull();
  });

  it('does not turn a drawn round into an invented winner', () => {
    const drawnRound = round({ winnerTeamId: null, winnerTeamName: null });
    const { service } = createService(payload, detail({ rounds: [drawnRound] }));

    service.initialize();
    service.selectEncounter('gs-01');

    expect(service.getViewModel().detail?.rounds[0].winnerTeamName).toBeNull();
  });

  it('uses the unavailable state when a detail has no rounds or extra round', () => {
    const { service } = createService(payload, detail({ rounds: [], extraRound: null }));

    service.initialize();
    service.selectEncounter('gs-01');

    const viewModel = service.getViewModel();
    expect(viewModel.detailStatus).toBe('unavailable');
    expect(viewModel.detail).toEqual({
      encounterId: 'gs-01',
      stageCode: 'GROUP_STAGE',
      stageLabelKey: 'historyRivals.stage.groupStage',
      groupId: 'A',
      rounds: [],
      extraRound: null,
    });
  });

  it('selects the pending Final without calling the encounter detail endpoint', () => {
    const { getSpy, service } = createService(payloadWithFinal);

    service.initialize();
    service.selectFinalStop();

    const viewModel = service.getViewModel();
    expect(getSpy.calls.count()).toBe(1);
    expect(viewModel.selectedStopId).toBe('final-stage');
    expect(viewModel.selectedStop?.kind).toBe('final');
    expect(viewModel.detailStatus).toBe('pending');
    expect(viewModel.detail).toBeNull();
    expect(viewModel.finalBattleUrl).toBe('/final-stage/play');
  });

  it('shows a completed Final as unavailable without calling the detail endpoint', () => {
    const completedPayload: TeamJourneyApi = {
      ...payloadWithFinal,
      stops: [
        ...payload.stops,
        finalStop({
          outcome: 'ABANDONED',
          finalStageStatus: 'COMPLETED',
        }),
      ],
    };
    const { getSpy, service } = createService(completedPayload);

    service.initialize();
    service.selectFinalStop();

    const viewModel = service.getViewModel();
    expect(getSpy.calls.count()).toBe(1);
    expect(viewModel.detailStatus).toBe('unavailable');
    expect(viewModel.selectedStop?.outcome).toBe('abandoned');
    expect(viewModel.selectedStop?.outcomeLabelKey).toBe('r7.abandoned');
  });

  it('toggles the selected encounter back to idle', () => {
    const { service } = createService();

    service.initialize();
    service.selectEncounter('gs-01');
    service.selectEncounter('gs-01');

    const viewModel = service.getViewModel();
    expect(viewModel.selectedStopId).toBeNull();
    expect(viewModel.selectedStop).toBeNull();
    expect(viewModel.detailStatus).toBe('idle');
    expect(viewModel.detail).toBeNull();
  });

  it('ignores selections that are not part of the loaded stops', () => {
    const { service } = createService();

    service.initialize();
    service.selectEncounter('unknown-encounter');

    expect(service.getViewModel().selectedStopId).toBeNull();
  });

  it('retries the journey and reloads a valid selected encounter detail', () => {
    const { getSpy, service } = createService();

    service.initialize();
    service.selectEncounter('qf-01');
    service.retry();

    expect(getSpy.calls.count()).toBe(4);
    expect(getSpy.calls.allArgs().map((args) => args[0])).toEqual([
      LIST_ENDPOINT,
      `${LIST_ENDPOINT}/qf-01`,
      LIST_ENDPOINT,
      `${LIST_ENDPOINT}/qf-01`,
    ]);
    expect(service.getViewModel().selectedStopId).toBe('qf-01');
    expect(service.getViewModel().detailStatus).toBe('data');
  });

  it('clears a selection that no longer exists after retrying', () => {
    let listCall = 0;
    const refreshed: TeamJourneyApi = {
      ...payload,
      stops: [stop({ encounterId: 'sf-01', stageCode: 'SEMIFINAL' })],
    };
    const { service } = createServiceWithGet((path) => {
      if (path === LIST_ENDPOINT) {
        listCall += 1;
        return of(envelope(listCall === 1 ? payload : refreshed)) as Observable<
          ResponseObject<unknown>
        >;
      }

      return of(envelope(detail())) as Observable<ResponseObject<unknown>>;
    });

    service.initialize();
    service.selectEncounter('qf-01');
    service.retry();

    const viewModel = service.getViewModel();
    expect(viewModel.selectedStopId).toBeNull();
    expect(viewModel.selectedStop).toBeNull();
    expect(viewModel.detailStatus).toBe('idle');
  });

  it('reports an empty journey when the BFF returns no stops', () => {
    const emptyPayload: TeamJourneyApi = {
      attemptId: 'journey-1',
      playerTeamId: TEAM_ID,
      stops: [],
      progress: { played: 0, wins: 0, draws: 0, losses: 0 },
    };
    const { service } = createService(emptyPayload);

    service.initialize();

    const viewModel = service.getViewModel();
    expect(viewModel.status).toBe('empty');
    expect(viewModel.emptyReason).toBe('no-encounters');
    expect(viewModel.stops).toEqual([]);
    expect(viewModel.selectedStopId).toBeNull();
    expect(viewModel.selectedStop).toBeNull();
  });

  it('reports the no-Journey empty reason when the BFF is unavailable', () => {
    const { service } = createServiceWithGet(
      () =>
        throwError(
          () =>
            new ApiError(
              UNAVAILABLE_CODE,
              'There is no current Journey. Simulate one to see the Team path.',
            ),
        ) as Observable<ResponseObject<unknown>>,
    );

    service.initialize();

    const viewModel = service.getViewModel();
    expect(viewModel.status).toBe('empty');
    expect(viewModel.emptyReason).toBe('no-journey');
    expect(viewModel.error).toBeNull();
    expect(viewModel.stops).toEqual([]);
    expect(viewModel.selectedStopId).toBeNull();
    expect(viewModel.selectedStop).toBeNull();
    expect(viewModel.detailStatus).toBe('idle');
    expect(viewModel.simulateJourneyUrl).toBe('/journey/simulate');
  });

  it('keeps a query failure as an error state instead of the no-Journey empty state', () => {
    let listCall = 0;
    const { getSpy, service } = createServiceWithGet(() => {
      listCall += 1;
      if (listCall === 1) {
        return throwError(
          () => new ApiError('BFF_JOURNEY_UNAVAILABLE', 'Unable to load the Team path right now.'),
        ) as Observable<ResponseObject<unknown>>;
      }

      return of(envelope(payload)) as Observable<ResponseObject<unknown>>;
    });

    service.initialize();

    let viewModel = service.getViewModel();
    expect(viewModel.status).toBe('error');
    expect(viewModel.emptyReason).toBeNull();
    expect(viewModel.errorCode).toBe('BFF_JOURNEY_UNAVAILABLE');
    expect(viewModel.error).toBe('Unable to load the Team path right now.');

    service.retry();

    expect(getSpy.calls.count()).toBe(2);
    viewModel = service.getViewModel();
    expect(viewModel.status).toBe('data');
    expect(viewModel.error).toBeNull();
    expect(viewModel.errorCode).toBeNull();
  });

  it('maps a missing detail to the unavailable state', () => {
    const { service } = createServiceWithGet((path) =>
      path === LIST_ENDPOINT
        ? (of(envelope(payload)) as Observable<ResponseObject<unknown>>)
        : (throwError(
            () => new ApiError(UNAVAILABLE_CODE, 'Encounter detail is not available.'),
          ) as Observable<ResponseObject<unknown>>),
    );

    service.initialize();
    service.selectEncounter('gs-01');

    const viewModel = service.getViewModel();
    expect(viewModel.status).toBe('data');
    expect(viewModel.detailStatus).toBe('unavailable');
    expect(viewModel.detail).toBeNull();
    expect(viewModel.detailError).toBeNull();
  });

  it('keeps a detail failure local and retries it without reloading the journey', () => {
    let detailCall = 0;
    const { getSpy, service } = createServiceWithGet((path) => {
      if (path === LIST_ENDPOINT) {
        return of(envelope(payload)) as Observable<ResponseObject<unknown>>;
      }

      detailCall += 1;
      if (detailCall === 1) {
        return throwError(
          () => new ApiError('BFF_JOURNEY_UNAVAILABLE', 'Detail failed.'),
        ) as Observable<ResponseObject<unknown>>;
      }

      return of(envelope(detail())) as Observable<ResponseObject<unknown>>;
    });

    service.initialize();
    service.selectEncounter('gs-01');

    let viewModel = service.getViewModel();
    expect(viewModel.status).toBe('data');
    expect(viewModel.detailStatus).toBe('error');
    expect(viewModel.detailError).toBe('Detail failed.');

    service.retryDetail();

    viewModel = service.getViewModel();
    expect(getSpy.calls.count()).toBe(3);
    expect(viewModel.detailStatus).toBe('data');
    expect(viewModel.detail?.rounds.length).toBe(1);
    expect(viewModel.detailError).toBeNull();
  });

  it('ignores a stale detail response after another stop is selected', () => {
    const firstDetail = new Subject<ResponseObject<TeamJourneyDetailApi>>();
    const secondDetail = new Subject<ResponseObject<TeamJourneyDetailApi>>();
    let detailCall = 0;
    const { service } = createServiceWithGet((path) => {
      if (path === LIST_ENDPOINT) {
        return of(envelope(payload)) as Observable<ResponseObject<unknown>>;
      }

      detailCall += 1;
      return (detailCall === 1 ? firstDetail : secondDetail) as Observable<ResponseObject<unknown>>;
    });

    service.initialize();
    service.selectEncounter('gs-01');
    service.selectEncounter('qf-01');

    secondDetail.next(
      envelope(
        detail({
          encounterId: 'qf-01',
          stageId: 'quarterfinal',
          stageCode: 'QUARTERFINAL',
          groupId: null,
        }),
      ),
    );
    firstDetail.next(envelope(detail({ encounterId: 'gs-01' })));

    const viewModel = service.getViewModel();
    expect(viewModel.selectedStopId).toBe('qf-01');
    expect(viewModel.detail?.encounterId).toBe('qf-01');
    expect(viewModel.detailStatus).toBe('data');
  });

  it('does not request detail for a pending encounter stop', () => {
    const pendingPayload: TeamJourneyApi = {
      ...payload,
      stops: [stop({ encounterId: 'pending-1', outcome: 'PENDING', damageDealt: null })],
      progress: { played: 0, wins: 0, draws: 0, losses: 0 },
    };
    const { getSpy, service } = createService(pendingPayload);

    service.initialize();
    service.selectEncounter('pending-1');

    const viewModel = service.getViewModel();
    expect(getSpy.calls.count()).toBe(1);
    expect(viewModel.detailStatus).toBe('pending');
    expect(viewModel.detail).toBeNull();
  });

  it('retries a selected Final without requesting encounter detail', () => {
    const { getSpy, service } = createService(payloadWithFinal);

    service.initialize();
    service.selectFinalStop();
    service.retry();

    const viewModel = service.getViewModel();
    expect(getSpy.calls.count()).toBe(2);
    expect(getSpy.calls.allArgs().map((args) => args[0])).toEqual([LIST_ENDPOINT, LIST_ENDPOINT]);
    expect(viewModel.selectedStopId).toBe('final-stage');
    expect(viewModel.detailStatus).toBe('pending');
  });

  it('keeps an unrelated journey error as an error state and allows retrying', () => {
    let listCall = 0;
    const { getSpy, service } = createServiceWithGet(() => {
      listCall += 1;
      if (listCall === 1) {
        return throwError(
          () => new ApiError('BFF_TEAM_CONTEXT_UNAVAILABLE', 'No Team configured.'),
        ) as Observable<ResponseObject<unknown>>;
      }

      return of(envelope(payload)) as Observable<ResponseObject<unknown>>;
    });

    service.initialize();

    let viewModel = service.getViewModel();
    expect(viewModel.status).toBe('error');
    expect(viewModel.errorCode).toBe('BFF_TEAM_CONTEXT_UNAVAILABLE');
    expect(viewModel.error).toBe('No Team configured.');

    service.retry();

    expect(getSpy.calls.count()).toBe(2);
    viewModel = service.getViewModel();
    expect(viewModel.status).toBe('data');
    expect(viewModel.error).toBeNull();
  });
});
