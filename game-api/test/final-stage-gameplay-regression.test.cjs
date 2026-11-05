const assert = require('node:assert/strict');
const { test } = require('node:test');
const { toolkit, started, select, choose } = require('./avengers-fixtures.cjs');

const member = (team, id) => team.heroes.find((hero) => hero.heroId === id);
const energy = (team) =>
  Object.fromEntries(team.heroes.map((hero) => [hero.heroId, hero.currentEnergy]));
const resources = (team) =>
  Object.fromEntries(
    team.heroes.map((hero) => [hero.heroId, [hero.currentEnergy, hero.currentAbilityPoints]]),
  );
const active = (team) => team.heroes.filter((hero) => hero.status === 'ACTIVE');
const reserve = (team) =>
  team.heroes.filter((hero) => hero.status === 'INACTIVE' && hero.currentEnergy > 0);

async function tournament(tool) {
  const state = await started(tool, { quiet: false, actOne: true });
  assert.equal(state.data.phase, 'TOURNAMENT_FINAL');
  assert.equal(active(state.data.player).length, 3);
  assert.equal(active(state.data.opponent).length, 3);
  return state;
}

async function revealed(tool) {
  let state = await tournament(tool);
  // Reach the reveal through four ordinary, legal human turns. The opponent
  // response is suppressed to keep this targeting test independent of AI RNG.
  tool.ai.choose = () => null;
  for (let cycle = 0; cycle < 4 && !state.data.revealOccurred; cycle++) {
    const target = active(state.data.opponent)[0];
    state = await choose(tool, state, 'BASIC_ATTACK', { targetId: target.heroId });
  }
  assert.equal(state.data.revealOccurred, true);
  assert.equal(state.data.phase, 'DOOMSDAY');
  assert.ok(state.data.timeline.some((event) => event.type === 'DOOM_REVEALED'));
  assert.ok(state.data.doom?.currentEnergy > 0);
  return state;
}

test('single-target legal damage affects only the chosen Active Hero', async () => {
  const tool = toolkit();
  tool.ai.choose = () => null;
  let state = await tournament(tool);
  const target = active(state.data.opponent)[0];
  const others = state.data.opponent.heroes.filter((hero) => hero.heroId !== target.heroId);
  assert.ok(active(state.data.opponent).length > 1);
  assert.ok(reserve(state.data.opponent).length > 0);
  const before = energy(state.data.opponent);
  const action = select(tool, state, 'BASIC_ATTACK', { targetId: target.heroId });
  assert.ok(action);
  state = await tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  const damage = state.data.events.find(
    (event) =>
      event.type === 'DAMAGE' &&
      event.source === 'PLAYER' &&
      event.targetIds?.includes(target.heroId),
  );
  assert.ok(damage?.values.damage > 0);
  assert.equal(
    before[target.heroId] - member(state.data.opponent, target.heroId).currentEnergy,
    damage.values.damage,
  );
  for (const hero of others) {
    assert.equal(hero.currentEnergy, before[hero.heroId], `${hero.heroId} was not the target`);
  }
});

test('legal area damage reaches Active opponents but never Reserve opponents', async () => {
  const tool = toolkit();
  tool.ai.choose = () => null;
  let state = await tournament(tool);
  const targetActiveIds = active(state.data.opponent).map((hero) => hero.heroId);
  const reserveIds = reserve(state.data.opponent).map((hero) => hero.heroId);
  assert.equal(targetActiveIds.length, 3);
  assert.equal(reserveIds.length, 3);
  const before = energy(state.data.opponent);
  const action = select(tool, state, 'OFFENSIVE_SPECIAL', {
    actorId: 'doctor-strange',
    targetId: 'OPPONENT_TEAM',
  });
  assert.ok(action);
  state = await tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  for (const id of targetActiveIds) {
    const damage = state.data.events.find(
      (event) =>
        event.type === 'DAMAGE' && event.source === 'PLAYER' && event.targetIds?.includes(id),
    );
    assert.ok(damage?.values.damage > 0, `${id} should receive area damage`);
    assert.equal(before[id] - member(state.data.opponent, id).currentEnergy, damage.values.damage);
  }
  const after = energy(state.data.opponent);
  assert.deepEqual(
    Object.fromEntries(reserveIds.map((id) => [id, after[id]])),
    Object.fromEntries(reserveIds.map((id) => [id, before[id]])),
    `Reserve Energy changed: ${JSON.stringify({ before, after, reserveIds })}`,
  );
});

test('legal swap changes formation without changing any combat resource', async () => {
  const tool = toolkit();
  let state = await tournament(tool);
  const before = resources(state.data.player);
  const action = select(tool, state, 'SWAP', {
    outgoingId: 'doctor-strange',
    incomingId: 'hulk',
  });
  assert.ok(action);
  state = await tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  assert.equal(member(state.data.player, 'doctor-strange').status, 'INACTIVE');
  assert.equal(member(state.data.player, 'hulk').status, 'ACTIVE');
  assert.equal(active(state.data.player).length, 3);
  assert.equal(reserve(state.data.player).length, 3);
  assert.deepEqual(resources(state.data.player), before);
  assert.equal(state.turn, 0);
});

test('directed damage reaches runtime-revealed Doom and no Hero', async () => {
  const tool = toolkit();
  let state = await revealed(tool);
  const doomBefore = state.data.doom.currentEnergy;
  const playerBefore = energy(state.data.player);
  const opponentBefore = energy(state.data.opponent);
  const action = select(tool, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.ok(action);
  state = await tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  assert.ok(state.data.doom.currentEnergy < doomBefore);
  assert.deepEqual(energy(state.data.player), playerBefore);
  assert.deepEqual(energy(state.data.opponent), opponentBefore);
});

test('directed non-Doom damage leaves runtime-revealed Doom and other Heroes untouched', async () => {
  const tool = toolkit();
  let state = await revealed(tool);
  const target = active(state.data.opponent)[0];
  assert.ok(target, 'another Hero target must still be legal after reveal');
  const doomBefore = state.data.doom.currentEnergy;
  const playerBefore = energy(state.data.player);
  const opponentBefore = energy(state.data.opponent);
  const action = select(tool, state, 'BASIC_ATTACK', { targetId: target.heroId });
  assert.ok(action);
  state = await tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  assert.ok(
    member(state.data.opponent, target.heroId).currentEnergy < opponentBefore[target.heroId],
  );
  assert.equal(state.data.doom.currentEnergy, doomBefore);
  assert.deepEqual(energy(state.data.player), playerBefore);
  for (const hero of state.data.opponent.heroes.filter((hero) => hero.heroId !== target.heroId)) {
    assert.equal(hero.currentEnergy, opponentBefore[hero.heroId]);
  }
});

test('legal lethal hit clamps Energy, marks KO and follows existing opponent replacement', async () => {
  const tool = toolkit();
  tool.ai.choose = () => null;
  let state = await tournament(tool);
  const target = active(state.data.opponent)[0];
  target.currentEnergy = 1;
  const before = energy(state.data.opponent);
  const reserveIds = reserve(state.data.opponent).map((hero) => hero.heroId);
  const action = select(tool, state, 'BASIC_ATTACK', { targetId: target.heroId });
  assert.ok(action);
  state = await tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  assert.equal(member(state.data.opponent, target.heroId).currentEnergy, 0);
  assert.equal(member(state.data.opponent, target.heroId).condition, 'KNOCKED_OUT');
  assert.equal(member(state.data.opponent, target.heroId).status, 'INACTIVE');
  assert.ok(
    state.data.events.some(
      (event) => event.type === 'KO' && event.targetIds?.includes(target.heroId),
    ),
  );
  assert.equal(active(state.data.opponent).length, 3);
  assert.ok(reserveIds.some((id) => member(state.data.opponent, id).status === 'ACTIVE'));
  for (const hero of state.data.opponent.heroes.filter((hero) => hero.heroId !== target.heroId)) {
    assert.equal(hero.currentEnergy, before[hero.heroId]);
  }
});

test('opponent legal area response damages only Active Player Heroes', async () => {
  const tool = toolkit();
  let state = await tournament(tool);
  const activeIds = active(state.data.player).map((hero) => hero.heroId);
  const reserveIds = reserve(state.data.player).map((hero) => hero.heroId);
  const before = energy(state.data.player);
  let chosenOpponentAction = null;
  tool.ai.choose = (data, turn) => {
    chosenOpponentAction = tool.actions
      .list(data, turn, 'OPPONENT')
      .find((action) => action.type === 'OFFENSIVE_SPECIAL' && action.targetId === 'OPPONENT_TEAM');
    return chosenOpponentAction;
  };
  const action = select(tool, state, 'BASIC_ATTACK', {
    targetId: active(state.data.opponent)[0].heroId,
  });
  assert.ok(action);
  state = await tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  assert.ok(chosenOpponentAction, 'the AI response was selected from legal opponent actions');
  for (const id of activeIds) {
    const damage = state.data.events.find(
      (event) =>
        event.type === 'DAMAGE' && event.source === 'OPPONENT' && event.targetIds?.includes(id),
    );
    assert.ok(damage?.values.damage > 0, `${id} should receive opponent area damage`);
    assert.equal(before[id] - member(state.data.player, id).currentEnergy, damage.values.damage);
  }
  const after = energy(state.data.player);
  assert.deepEqual(
    Object.fromEntries(reserveIds.map((id) => [id, after[id]])),
    Object.fromEntries(reserveIds.map((id) => [id, before[id]])),
    `Reserve Energy changed: ${JSON.stringify({ before, after, reserveIds })}`,
  );
});
