const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { execFileSync } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const EXPECTED_OPERATIONS = {
  '/game/health': ['get'],
  '/game/teams/{teamId}/profile': ['get'],
  '/game/teams/{teamId}/configuration': ['get', 'put'],
  '/game/teams': ['get'],
  '/game/teams/{teamId}/history': ['get'],
  '/game/heroes': ['get'],
  '/game/heroes/relationships': ['get'],
  '/game/teams/{teamId}/journeys/current': ['get'],
  '/game/teams/{teamId}/journeys/current/teams': ['get'],
  '/game/teams/{teamId}/journeys/current/stages': ['get'],
  '/game/teams/{teamId}/journeys/current/encounters': ['get'],
  '/game/teams/{teamId}/journeys/current/encounters/{encounterId}': ['get'],
  '/game/teams/{teamId}/journeys/current/events': ['get'],
  '/game/teams/{teamId}/journeys/current/rewards': ['get'],
  '/game/teams/{teamId}/journeys/current/inventory': ['get'],
  '/game/teams/{teamId}/journeys/current/purchases': ['post'],
  '/game/teams/{teamId}/journeys/current/preparation/items': ['post'],
  '/game/teams/{teamId}/journeys/current/preparation': ['put'],
  '/game/teams/{teamId}/journeys/current/final-stage': ['get'],
  '/game/teams/{teamId}/journeys/current/final-stage/teams': ['get'],
  '/game/teams/{teamId}/journeys/current/final-stage/actions': ['get'],
  '/game/teams/{teamId}/journeys/current/final-stage/events': ['get'],
  '/game/teams/{teamId}/journeys/current/final-stage/play': ['post'],
  '/game/teams/{teamId}/journeys/current/statistics': ['get'],
  '/game/teams/{teamId}/journeys/simulate': ['post'],
  '/game/teams/{teamId}/journeys/{attemptId}': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/teams': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/stages': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/encounters': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/encounters/{encounterId}': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/events': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/rewards': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/inventory': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/final-stage': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/final-stage/teams': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/final-stage/events': ['get'],
  '/game/teams/{teamId}/journeys/{attemptId}/statistics': ['get'],
  '/game/reference/game-dictionary': ['get'],
  '/game/reference/strategies': ['get'],
  '/game/reference/power-ups': ['get'],
  '/game/reference/prologue': ['get'],
};

let app;
let document;
let directory;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'avengers-openapi-'));
  process.env.DB_DATABASE = join(directory, 'openapi.sqlite');
  process.env.DB_SEED_THEME = 'sample';
  process.env.APP_BASE_PATH = 'game';
  process.env.APP_LOG_LEVEL = 'error';
  execFileSync('bash', [
    join(__dirname, '../scripts/init-database.sh'),
    process.env.DB_DATABASE,
    'sample',
  ]);
  const { createApplication } = require('../dist/bootstrap');
  app = await createApplication();
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();
  document = await (await fetch(`${baseUrl}/game/api-json`)).json();
});

after(async () => {
  if (app) {
    await app.close();
  }
  if (directory) {
    await rm(directory, { recursive: true, force: true });
  }
});

test('OpenAPI contains exactly the approved current and historical operations', () => {
  const actual = Object.entries(document.paths).flatMap(([path, item]) =>
    Object.keys(item)
      .filter((method) => ['get', 'post', 'put', 'delete', 'patch'].includes(method))
      .map((method) => `${method.toUpperCase()} ${path}`),
  );
  const expected = Object.entries(EXPECTED_OPERATIONS).flatMap(([path, methods]) =>
    methods.map((method) => `${method.toUpperCase()} ${path}`),
  );
  assert.equal(actual.length, 42);
  assert.deepEqual(new Set(actual), new Set(expected));
  assert.deepEqual(
    document.tags.map((tag) => tag.name),
    ['health', 'Teams', 'Heroes', 'Journey', 'Final Stage', 'Statistics', 'Reference'],
  );
  for (const path of Object.keys(document.paths)) {
    assert.notEqual(path, '/game/teams/{teamId}/journeys/history');
    assert.equal(path.includes('{themeId}'), false);
  }
});

test('every operation documents concrete success, validation, and server schemas', () => {
  for (const [path, methods] of Object.entries(EXPECTED_OPERATIONS)) {
    for (const method of methods) {
      const operation = document.paths[path][method];
      const success =
        operation.responses[method === 'post' && path.endsWith('/simulate') ? '201' : '200'];
      assert.ok(success, `${method.toUpperCase()} ${path} has a success response.`);
      assert.ok(
        success.content?.['application/json']?.schema?.$ref,
        `${method.toUpperCase()} ${path} exposes a concrete success schema.`,
      );
      assert.ok(operation.responses['400'], `${method.toUpperCase()} ${path} documents 400.`);
      assert.ok(operation.responses['500'], `${method.toUpperCase()} ${path} documents 500.`);
      for (const parameter of path.matchAll(/\{([^}]+)\}/g)) {
        assert.ok(
          operation.parameters?.some(
            (value) => value.name === parameter[1] && value.in === 'path' && value.required,
          ),
          `${method.toUpperCase()} ${path} documents ${parameter[1]}.`,
        );
      }
    }
  }
});

test('command bodies, localization, and paired historical context are discoverable', () => {
  const commands = [
    ['post', '/game/teams/{teamId}/journeys/simulate'],
    ['put', '/game/teams/{teamId}/configuration'],
    ['post', '/game/teams/{teamId}/journeys/current/purchases'],
    ['post', '/game/teams/{teamId}/journeys/current/preparation/items'],
    ['put', '/game/teams/{teamId}/journeys/current/preparation'],
    ['post', '/game/teams/{teamId}/journeys/current/final-stage/play'],
  ];
  for (const [method, path] of commands) {
    assert.ok(document.paths[path][method].requestBody?.content?.['application/json']?.schema);
  }
  const localizedPaths = [
    '/game/teams/{teamId}/profile',
    '/game/teams',
    '/game/reference/game-dictionary',
    '/game/heroes',
    '/game/reference/strategies',
    '/game/reference/power-ups',
    '/game/reference/prologue',
    '/game/teams/{teamId}/history',
    '/game/teams/{teamId}/journeys/{attemptId}/encounters/{encounterId}',
    '/game/teams/{teamId}/journeys/{attemptId}/events',
    '/game/teams/{teamId}/journeys/{attemptId}/final-stage',
    '/game/teams/{teamId}/journeys/current/final-stage/actions',
    '/game/teams/{teamId}/journeys/{attemptId}/final-stage/events',
    '/game/teams/{teamId}/journeys/current/final-stage/play',
    '/game/teams/{teamId}/journeys/{attemptId}/statistics',
  ];
  for (const path of localizedPaths) {
    const operation = document.paths[path].get ?? document.paths[path].post;
    const lang = operation.parameters.find((parameter) => parameter.name === 'lang');
    assert.deepEqual(lang.schema.enum, ['en', 'es']);
    assert.equal(lang.required, false);
  }
  for (const path of [
    '/game/heroes',
    '/game/heroes/relationships',
    '/game/reference/strategies',
    '/game/reference/power-ups',
  ]) {
    const parameters = document.paths[path].get.parameters;
    assert.ok(parameters.some((parameter) => parameter.name === 'teamId'));
    assert.ok(parameters.some((parameter) => parameter.name === 'attemptId'));
  }
});

test('simplified public reads do not expose pagination, cursor, theme, or generic id mechanics', () => {
  const simplifiedPaths = [
    '/game/teams/{teamId}/history',
    '/game/teams/{teamId}/journeys/{attemptId}/events',
    '/game/teams/{teamId}/journeys/{attemptId}/final-stage/events',
    '/game/heroes',
    '/game/heroes/relationships',
    '/game/teams/{teamId}/journeys/{attemptId}/teams',
  ];
  for (const path of simplifiedPaths) {
    const operation = document.paths[path].get;
    const names = (operation.parameters ?? []).map((parameter) => parameter.name);
    for (const forbidden of [
      'themeId',
      'cursor',
      'limit',
      'afterSequence',
      'nextAfterSequence',
      'nextCursor',
      'ids',
      'heroIds',
    ]) {
      assert.equal(names.includes(forbidden), false, `${path} does not expose ${forbidden}.`);
    }
  }
  for (const [path, item] of Object.entries(document.paths)) {
    for (const operation of Object.values(item)) {
      if (!operation || typeof operation !== 'object' || !operation.parameters) {
        continue;
      }
      const parameterNames = operation.parameters.map((parameter) => parameter.name);
      for (const forbidden of [
        'themeId',
        'cursor',
        'nextCursor',
        'afterSequence',
        'nextAfterSequence',
        'limit',
        'ids',
        'heroIds',
      ]) {
        assert.equal(
          parameterNames.includes(forbidden),
          false,
          `${path} does not expose ${forbidden}.`,
        );
      }
      const teamParameters = operation.parameters.filter(
        (parameter) => parameter.name === 'teamId',
      );
      assert.ok(teamParameters.length <= 1, `${path} has one teamId meaning.`);
    }
  }
});

test('lifecycle, revision, and domain-action errors are documented where they can occur', () => {
  const expectedResponses = [
    ['put', '/game/teams/{teamId}/configuration', ['404', '409', '422']],
    ['post', '/game/teams/{teamId}/journeys/simulate', ['404', '409', '422']],
    ['get', '/game/teams/{teamId}/journeys/{attemptId}', ['404', '409']],
    ['post', '/game/teams/{teamId}/journeys/current/purchases', ['404', '409', '422']],
    ['post', '/game/teams/{teamId}/journeys/current/preparation/items', ['404', '409', '422']],
    ['put', '/game/teams/{teamId}/journeys/current/preparation', ['404', '409', '422']],
    ['get', '/game/teams/{teamId}/journeys/{attemptId}/final-stage', ['404', '409']],
    ['get', '/game/teams/{teamId}/journeys/{attemptId}/final-stage/teams', ['404', '409']],
    ['get', '/game/teams/{teamId}/journeys/current/final-stage/actions', ['404']],
    ['post', '/game/teams/{teamId}/journeys/current/final-stage/play', ['404', '409', '422']],
    ['get', '/game/teams/{teamId}/journeys/{attemptId}/statistics', ['404', '409']],
  ];
  for (const [method, path, statuses] of expectedResponses) {
    const operation = document.paths[path][method];
    for (const status of statuses) {
      assert.ok(
        operation.responses[status],
        `${method.toUpperCase()} ${path} documents ${status}.`,
      );
      assert.ok(
        operation.responses[status].content?.['application/json']?.schema?.$ref,
        `${method.toUpperCase()} ${path} uses the public error envelope for ${status}.`,
      );
    }
  }
});

test('public schemas hide persisted metadata and keep Act I entirely Doom-free', () => {
  const schemaNames = Object.keys(document.components.schemas);
  assert.equal(
    schemaNames.some((name) => name.includes('AvengersJourneyMetadata')),
    false,
  );
  for (const forbidden of ['randomState', 'balanceFingerprint', 'availableOperations']) {
    assert.equal(
      JSON.stringify(document.components.schemas.JourneySummaryModel).includes(forbidden),
      false,
    );
  }
  const publicProjectionSchemas = [
    'TeamProfileModel',
    'TeamConfigurationDataModel',
    'SaveTeamConfigurationResultModel',
    'JourneyCurrentAttemptModel',
    'JourneySummaryModel',
    'SimulateJourneyResultModel',
    'InventoryDataModel',
    'PurchasePowerUpResultModel',
    'UsePreparationItemResultModel',
    'UpdateFinalPreparationResultModel',
    'TournamentFinalStateModel',
    'LegalFinalStageActionsDataModel',
    'FinalStageCommandReceiptModel',
    'CompletedJourneyHistoryItemModel',
  ];
  const internalFields = [
    'revision',
    'previousRevision',
    'attemptRevision',
    'configurationRevision',
    'contextRevision',
    'seed',
    'themeId',
    'rulesVersion',
    'contentVersion',
    'awardsVersion',
  ];
  for (const name of publicProjectionSchemas) {
    const properties = document.components.schemas[name]?.properties;
    assert.ok(properties, `${name} is documented`);
    for (const field of internalFields) {
      assert.equal(field in properties, false, `${name} excludes ${field}`);
    }
  }
  assert.ok(document.components.schemas.SimulateJourneyResultModel.properties.replacedPrevious);
  assert.ok(
    document.components.schemas.CompletedJourneyHistoryItemModel.properties.opponentFinalistName,
  );
  assert.ok(document.components.schemas.GameDictionaryDataModel.properties.awardMetrics);
  for (const name of ['TournamentFinalStateModel', 'TournamentFinalTeamsDataModel']) {
    const serialized = JSON.stringify(document.components.schemas[name]).toLowerCase();
    for (const forbidden of ['doom', 'boss', 'antagonist', 'threat', 'futureboss']) {
      assert.equal(serialized.includes(forbidden), false, `${name} does not contain ${forbidden}.`);
    }
  }
  assert.ok(document.components.schemas.GameDictionaryResponseModel);
  assert.ok(document.components.schemas.PlayFinalStageResponseModel);
});

test('Journey, Encounter, and FinalStage RPG events share the concrete narrative schema', () => {
  const journeyEvent = document.components.schemas.JourneyEventModel;
  const encounterRound = document.components.schemas.EncounterRoundModel;
  const finalStageEvent = document.components.schemas.FinalStageEventModel;
  assert.ok(document.components.schemas.NarrativeModel);
  assert.ok(document.components.schemas.NarrativeLineModel);
  assert.equal('message' in journeyEvent.properties, false);
  assert.deepEqual(journeyEvent.properties.narrative.allOf, [
    { $ref: '#/components/schemas/NarrativeModel' },
  ]);
  assert.equal(
    JSON.stringify(encounterRound.properties.events).includes('JourneyEventModel'),
    true,
  );
  assert.deepEqual(finalStageEvent.properties.narrative.allOf, [
    { $ref: '#/components/schemas/NarrativeModel' },
  ]);
  assert.equal('message' in finalStageEvent.properties, false);
  assert.equal('message' in document.components.schemas.ResponseMessageModel.properties, true);
});

test('attempt-scoped routes are read-only and public command bodies contain no revision or seed inputs', () => {
  for (const [path, operations] of Object.entries(document.paths)) {
    if (path.includes('{attemptId}')) {
      assert.deepEqual(
        Object.keys(operations).filter((key) => ['post', 'put', 'patch', 'delete'].includes(key)),
        [],
        path,
      );
    }
  }
  for (const name of [
    'SaveTeamConfigurationRequest',
    'SimulateJourneyRequest',
    'PurchasePowerUpRequest',
    'UsePowerUpRequest',
    'UpdateFinalPreparationRequest',
    'PlayFinalStageRequest',
  ]) {
    const schema = document.components.schemas[name];
    assert.ok(schema, name);
    for (const forbidden of [
      'seed',
      'expectedRevision',
      'expectedConfigurationRevision',
      'expectedContextRevision',
      'expectedAttemptId',
      'expectedAttemptRevision',
    ]) {
      assert.equal(forbidden in (schema.properties ?? {}), false, `${name} excludes ${forbidden}`);
    }
  }
});

test('named mutation examples are copyable and the static contract is spoiler-safe', () => {
  const routes = [
    ['put', '/game/teams/{teamId}/configuration'],
    ['post', '/game/teams/{teamId}/journeys/simulate'],
    ['post', '/game/teams/{teamId}/journeys/current/purchases'],
    ['post', '/game/teams/{teamId}/journeys/current/preparation/items'],
    ['put', '/game/teams/{teamId}/journeys/current/preparation'],
    ['post', '/game/teams/{teamId}/journeys/current/final-stage/play'],
  ];
  for (const [method, path] of routes) {
    const examples = document.paths[path][method].requestBody.content['application/json'].examples;
    assert.ok(examples && Object.keys(examples).length > 0, path);
    for (const entry of Object.values(examples)) {
      const payload = entry.value;
      assert.ok(payload && typeof payload === 'object');
      for (const forbidden of [
        'seed',
        'expectedRevision',
        'expectedConfigurationRevision',
        'expectedContextRevision',
        'expectedAttemptId',
        'expectedAttemptRevision',
      ]) {
        assert.equal(forbidden in payload, false, `${path} excludes ${forbidden}`);
      }
    }
  }
  const finalExamples =
    document.paths['/game/teams/{teamId}/journeys/current/final-stage/play'].post.requestBody
      .content['application/json'].examples;
  assert.deepEqual(Object.keys(finalExamples), ['START', 'CHOOSE_ACTION', 'ABANDON']);
  assert.equal(
    document.components.schemas.LegalFinalStageActionModel.properties.actionId.example,
    '<opaque actionId from GET actions>',
  );
  assert.equal(
    finalExamples.CHOOSE_ACTION.value.actionId,
    '<exact opaque actionId from GET actions>',
  );
  const serialized = JSON.stringify(document).toLowerCase();
  for (const spoiler of [
    'doctor-doom',
    'silver-surfer',
    'dormammu',
    'doomsday',
    'sue_storm_appeal',
    'final_attack',
    'final_response',
    'allied_with_doom',
  ]) {
    assert.equal(serialized.includes(spoiler), false, `OpenAPI excludes ${spoiler}`);
  }
  const references = [...serialized.matchAll(/#\/components\/schemas\/([a-z0-9_]+)/g)].map(
    (match) => match[1],
  );
  const names = new Set(Object.keys(document.components.schemas).map((name) => name.toLowerCase()));
  assert.ok(references.length > 0);
  for (const reference of references) {
    assert.ok(names.has(reference), `OpenAPI reference ${reference} resolves after neutralization`);
  }
});
