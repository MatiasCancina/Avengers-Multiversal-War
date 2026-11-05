const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

function prepareDatabase() {
  execFileSync('bash', [
    join(__dirname, '../scripts/init-database.sh'),
    process.env.DB_DATABASE,
    'sample',
  ]);
}

let app;
let baseUrl;
let directory;
let createApplication;

async function startApplication() {
  app = await createApplication();
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
}

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'game-api-'));
  process.env.DB_DATABASE = join(directory, 'test.sqlite');
  prepareDatabase();
  process.env.APP_BASE_PATH = 'game';
  process.env.APP_LOG_LEVEL = 'error';
  process.env.SWAGGER_APP_TITLE = 'Game API';
  process.env.SWAGGER_THEME = 'classic';
  process.env.CORS_ALLOWED_ORIGIN = 'http://localhost:3101';
  ({ createApplication } = require('../dist/bootstrap'));
  await startApplication();
});

after(async () => {
  if (app) {
    await app.close();
  }
  if (directory) {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Team Profile returns the persisted sample through the normalized contract', async () => {
  const response = await fetch(`${baseUrl}/game/teams/team-alpha/profile`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.deepEqual(body.responseMessage, { messageCode: '0000', message: 'OK' });
  assert.ok(Number.isFinite(Date.parse(body.serverTime)));
  assert.deepEqual(body.data, {
    id: 'team-alpha',
    name: 'Team Alpha',
    description: 'A sample team from Theme A.',
  });
});

test('unknown teams return a domain 404 with the common error shape', async () => {
  const response = await fetch(`${baseUrl}/game/teams/missing-team/profile`);
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.responseMessage.messageCode, 'TEAM_NOT_FOUND');
  assert.equal(body.data, null);
});

test('invalid identifiers fail validation before profile lookup', async () => {
  for (const id of ['INVALID', 'a'.repeat(65)]) {
    const response = await fetch(`${baseUrl}/game/teams/${id}/profile`);
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.responseMessage.messageCode, 'VALIDATION_ERROR');
    assert.equal(body.data, null);
  }
});

test('Swagger exposes the profile, concrete schemas, and the World Cup UI options', async () => {
  const response = await fetch(`${baseUrl}/game/api-json`);
  assert.equal(response.status, 200);
  const document = await response.json();
  assert.equal(document.info.title, 'Game API');
  assert.ok(Object.keys(document.paths).includes('/game/teams/{teamId}/profile'));
  assert.ok(Object.keys(document.paths).includes('/game/teams/{teamId}/journeys/simulate'));
  assert.ok(Object.keys(document.paths).includes('/game/heroes'));
  const operation = document.paths['/game/teams/{teamId}/profile'].get;
  assert.match(
    operation.responses['200'].content['application/json'].schema.$ref,
    /TeamProfileResponseModel$/,
  );
  assert.match(
    operation.responses['400'].content['application/json'].schema.$ref,
    /ErrorResponseModel$/,
  );
  assert.equal(
    operation.responses['400'].content['application/json'].example.responseMessage.messageCode,
    'VALIDATION_ERROR',
  );
  assert.match(
    operation.responses['404'].content['application/json'].schema.$ref,
    /ErrorResponseModel$/,
  );
  const schema = document.components.schemas.TeamProfileResponseModel;
  assert.match(schema.properties.data.$ref, /TeamProfileModel$/);
  assert.ok(schema.required.includes('responseMessage'));

  const ui = await fetch(`${baseUrl}/game/api`);
  assert.equal(ui.status, 200);
  assert.match(await ui.text(), /<title>Game API<\/title>/);
  const initializer = await fetch(`${baseUrl}/game/api/swagger-ui-init.js`);
  const script = await initializer.text();
  assert.match(script, /"docExpansion":\s*"none"/);
  assert.match(script, /"tryItOutEnabled":\s*true/);
  assert.match(script, /"persistAuthorization":\s*true/);
});

test('CORS permits the configured frontend origin', async () => {
  const response = await fetch(`${baseUrl}/game/teams/team-alpha/profile`, {
    headers: { Origin: 'http://localhost:3101' },
  });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3101');
});

test('internal final-stage scaffolding does not invent a playable turn', async () => {
  const { FinalStageService } = require('../dist/final-stage/final-stage.service');
  const { FinalStageStatus } = require('../dist/final-stage/model/final-stage-status.enum');
  const service = app.get(FinalStageService);
  const data = { participants: [], availableActions: [], events: [] };
  await assert.rejects(
    service.resolveTurn({
      current: { status: FinalStageStatus.READY, turn: 0, data },
      actionId: 'sample-option',
    }),
    (error) => error.code === 'FINAL_STAGE_NOT_ACTIVE',
  );
  await assert.rejects(
    service.resolveTurn({
      current: { status: FinalStageStatus.ACTIVE, turn: 0, data },
      actionId: 'sample-option',
    }),
    (error) => error.code === 'ENGINE_NOT_IMPLEMENTED',
  );
  const response = await fetch(`${baseUrl}/game/final-stage/turn`, { method: 'POST' });
  assert.equal(response.status, 404);
});

test('SQLite retains data across restarts and repeated external initialization', async () => {
  const { DataSource } = require('typeorm');
  const { TeamProfileEntity } = require('../dist/teams/entity/team-profile.entity');
  const profiles = app.get(DataSource).getRepository(TeamProfileEntity);
  assert.equal(await profiles.count(), 2);
  await profiles.update('team-alpha', { name: 'Persisted Alpha' });
  await app.close();
  await startApplication();
  const response = await fetch(`${baseUrl}/game/teams/team-alpha/profile`);
  assert.equal((await response.json()).data.name, 'Persisted Alpha');
  assert.equal(await app.get(DataSource).getRepository(TeamProfileEntity).count(), 2);
  await app.close();
  prepareDatabase();
  await startApplication();
  const repeated = await fetch(`${baseUrl}/game/teams/team-alpha/profile`);
  assert.equal((await repeated.json()).data.name, 'Persisted Alpha');
  assert.equal(await app.get(DataSource).getRepository(TeamProfileEntity).count(), 2);
});

test('Nest startup does not restore profiles removed from the prepared database', async () => {
  const { DataSource } = require('typeorm');
  const { TeamProfileEntity } = require('../dist/teams/entity/team-profile.entity');
  await app.get(DataSource).getRepository(TeamProfileEntity).delete('team-beta');
  await app.close();
  await startApplication();
  const response = await fetch(`${baseUrl}/game/teams/team-beta/profile`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).responseMessage.messageCode, 'TEAM_NOT_FOUND');
  assert.equal(await app.get(DataSource).getRepository(TeamProfileEntity).count(), 1);
});

test('invalid runtime configuration fails explicitly', () => {
  const { validateEnvironment } = require('../dist/config/environment');
  assert.throws(() => validateEnvironment({ APP_PORT: 'invalid' }), /APP_PORT/);
  assert.throws(() => validateEnvironment({ APP_BASE_PATH: '/' }), /APP_BASE_PATH/);
  assert.throws(() => validateEnvironment({ SWAGGER_THEME: 'unknown' }), /SWAGGER_THEME/);
  assert.equal(validateEnvironment({ APP_BASE_PATH: '/game/' }).APP_BASE_PATH, 'game');
});
