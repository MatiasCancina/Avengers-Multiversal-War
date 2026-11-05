const assert = require('node:assert/strict');
const { test } = require('node:test');
const { toolkit, setup } = require('./avengers-fixtures.cjs');
const { FinalStageService } = require('../dist/final-stage/final-stage.service');
const {
  InMemoryFinalStageRepository,
} = require('../dist/final-stage/repository/in-memory-final-stage.repository');
const {
  AvengersBattleService,
} = require('../dist/theme/avengers-doomsday/avengers-battle.service');

test('FinalStageService loads authoritative state and persists initialization, action events and Abandon', async () => {
  const t = toolkit();
  const repository = new InMemoryFinalStageRepository();
  const service = new FinalStageService(t.engine, repository);
  await repository.create('battle-a', t.state.ready(setup()));
  const initial = await service.play('battle-a', { type: 'START' });
  assert.equal((await repository.load('battle-a')).revision, 1);
  const action = initial.data.availableActions.find((option) => option.type === 'BASIC_ATTACK');
  const played = await service.play('battle-a', { type: 'CHOOSE_ACTION', actionId: action.id });
  assert.equal((await repository.load('battle-a')).state.turn, 1);
  assert.deepEqual((await repository.load('battle-a')).state.data.timeline, played.data.timeline);
  await service.play('battle-a', { type: 'ABANDON' });
  assert.equal((await repository.load('battle-a')).state.data.outcome, 'ABANDON');
  await assert.rejects(
    service.play('battle-a', { type: 'ABANDON' }),
    (error) => error.code === 'FINAL_STAGE_NOT_ACTIVE',
  );
});
test('failed choices do not save and repository snapshots cannot mutate stored state', async () => {
  const t = toolkit();
  const repository = new InMemoryFinalStageRepository();
  const service = new FinalStageService(t.engine, repository);
  await repository.create('a', t.state.ready(setup()));
  await service.play('a', { type: 'START' });
  const before = await repository.load('a');
  await assert.rejects(service.play('a', { type: 'CHOOSE_ACTION', actionId: 'invented' }), {
    code: 'ILLEGAL_ACTION',
  });
  assert.deepEqual(await repository.load('a'), before);
  before.state.data.player.heroes[0].currentEnergy = 0;
  assert.ok((await repository.load('a')).state.data.player.heroes[0].currentEnergy > 0);
});
test('compare-and-save prevents concurrent decisions from silently overwriting one another', async () => {
  const t = toolkit();
  const repository = new InMemoryFinalStageRepository();
  const service = new FinalStageService(t.engine, repository);
  await repository.create('a', t.state.ready(setup()));
  const results = await Promise.allSettled([
    service.play('a', { type: 'START' }),
    service.play('a', { type: 'START' }),
  ]);
  assert.equal(results.filter((value) => value.status === 'fulfilled').length, 1);
  assert.equal(results.filter((value) => value.status === 'rejected').length, 1);
  assert.equal((await repository.load('a')).revision, 1);
});
test('internal battle service localizes reads without changing state, consuming randomness or advancing turns', async () => {
  const t = toolkit();
  const repository = new InMemoryFinalStageRepository();
  const service = new FinalStageService(t.engine, repository);
  const battle = new AvengersBattleService(t.state, repository, service, t.narrative);
  await battle.create('fixture', setup());
  const first = await battle.play('fixture', { type: 'START' });
  assert.equal(first.language, 'en');
  const original = await repository.load('fixture');
  const spanish = await battle.get('fixture', 'es');
  assert.notEqual(first.events[0].narrative[0].text, spanish.events[0].narrative[0].text);
  assert.deepEqual(await repository.load('fixture'), original);
  assert.deepEqual(first.state, spanish.state);
});
