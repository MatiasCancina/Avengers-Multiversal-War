const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  toolkit,
  setup,
  inventory,
  started,
  select,
  choose,
  knockOut,
  ControlledRandom,
  SeededAvengersRandom,
  S,
} = require('./avengers-fixtures.cjs');
const { AvengersNarrative } = require('../dist/theme/avengers-doomsday/avengers-narrative.service');
const hero = (state, id) => state.data.player.heroes.find((value) => value.heroId === id);

test('canonical FinalStage dialogue is atomic, speaker-aware, and ordered within each block', () => {
  const narrative = new AvengersNarrative();
  const playerLeaderId = 'captain-marvel';
  const opponentLeaderId = 'storm';
  const event = (type) => ({
    type,
    narrativeCode: type,
    parameters: { playerLeader: playerLeaderId, opponentLeader: opponentLeaderId },
    variant: 0,
  });
  const expectedSpeakers = {
    TOURNAMENT_FINAL_STARTED: ['silver-surfer'],
    SURFER_ENOUGH: ['silver-surfer'],
    DOOM_REVEALED: [null],
    DOOM_EXPLANATION: ['doctor-doom', 'doctor-doom', 'doctor-doom', 'doctor-doom'],
    PLAYER_REJECTION: [playerLeaderId, playerLeaderId, playerLeaderId],
    OPPONENT_ALLIANCE: [
      opponentLeaderId,
      playerLeaderId,
      opponentLeaderId,
      'doctor-doom',
      playerLeaderId,
    ],
    DOOMSDAY_BEGINS: ['doctor-doom'],
  };
  const canonicalSceneCodes = [
    ...Object.keys(expectedSpeakers),
    'DOOM_ALONE',
    'VICTORY',
    'DEFEAT',
    'PRE_REVEAL_ABANDON',
    'POST_REVEAL_ABANDON',
    'EARLY_DEFEAT_SCENE',
    'SUE_STORM_APPEAL',
  ];
  for (const language of ['en', 'es']) {
    for (const code of canonicalSceneCodes) {
      const lines = narrative.renderLines(event(code), language);
      assert.deepEqual(
        lines.map((line) => line.lineSequence),
        lines.map((_line, index) => index + 1),
        `${language} ${code} lineSequence must remain strictly increasing`,
      );
      assert.ok(lines.every((line) => line.text.length > 0 && !line.text.includes('\n')));
      assert.ok(
        lines.every((line) =>
          line.type === 'DIALOGUE'
            ? typeof line.speakerId === 'string' && !['PLAYER', 'OPPONENT'].includes(line.speakerId)
            : line.speakerId === null,
        ),
      );
    }
  }
  for (const [code, speakers] of Object.entries(expectedSpeakers)) {
    assert.deepEqual(
      narrative.renderLines(event(code), 'es').map((line) => line.speakerId),
      speakers,
      `${code} speaker identity must remain attached to its message`,
    );
  }

  const rejection = narrative.renderLines(event('PLAYER_REJECTION'), 'es');
  assert.deepEqual(
    rejection.map((line) => line.text),
    [
      'Nos trajiste aquí y nos obligaste a luchar entre nosotros.',
      'El torneo terminó.',
      'Ahora conocemos la verdad y lucharemos juntos contra vos.',
    ],
  );
  const alliance = narrative.renderLines(event('OPPONENT_ALLIANCE'), 'es');
  assert.deepEqual(
    alliance.map(({ speakerId, text }) => [speakerId, text]),
    [
      [opponentLeaderId, 'No. Doom tiene razón.'],
      [playerLeaderId, '¿Qué?'],
      [
        opponentLeaderId,
        'Vimos guerras y destrucción sin fin. Si Doom puede construir algo mejor, lo ayudaremos.',
      ],
      ['doctor-doom', 'Al fin, uno de ustedes lo entiende.'],
      [playerLeaderId, 'Entonces también los detendremos a ustedes.'],
    ],
  );
  assert.equal(new Set(alliance.map((line) => line.text)).size, alliance.length);

  const fallback = narrative.renderLines(
    { ...event('OPPONENT_ALLIANCE'), type: 'INITIALIZED' },
    'es',
  );
  assert.deepEqual(fallback, alliance);

  const chronologicalBlocks = narrative.timeline(
    [
      { ...event('PLAYER_REJECTION'), sequence: 31 },
      { ...event('OPPONENT_ALLIANCE'), sequence: 32 },
    ],
    'es',
  );
  assert.deepEqual(
    chronologicalBlocks.map((block) => block.sequence),
    [31, 32],
  );
  assert.deepEqual(
    chronologicalBlocks.map((block) => block.narrative.map((line) => line.lineSequence)),
    [
      [1, 2, 3],
      [1, 2, 3, 4, 5],
    ],
  );
  assert.equal(narrative.narration('Canonical line.').lineSequence, 1);
});

test('START returns ACTIVE turn zero, available actions, and preserves initial resources', async () => {
  const t = toolkit();
  const input = setup();
  input.player.resources = { 'spider-man': { energy: 100, abilityPoints: 12 } };
  const ready = t.state.ready(input);
  const original = structuredClone(ready);
  const state = await t.engine.play({ current: ready, command: { type: 'START' } });
  assert.equal(state.status, 'ACTIVE');
  assert.equal(state.turn, 0);
  assert.equal(state.data.phase, 'TOURNAMENT_FINAL');
  assert.equal(state.data.doom, null);
  assert.equal(hero(state, 'spider-man').currentEnergy, 100);
  assert.equal(hero(state, 'spider-man').currentAbilityPoints, 12);
  assert.ok(state.data.availableActions.some((action) => action.type === 'BASIC_ATTACK'));
  assert.deepEqual(ready, original);
});
test('global catalog permits all companions, rejects duplicates, wrong size and invalid resources', () => {
  const t = toolkit();
  const input = setup();
  input.player.activeHeroIds = ['hulk', 'wolverine'];
  input.player.benchHeroIds = ['scarlet-witch', 'iron-man', 'doctor-strange'];
  assert.equal(t.state.ready(input).data.player.heroes.length, 6);
  input.player.benchHeroIds[0] = 'hulk';
  assert.throws(() => t.state.ready(input), { code: 'INVALID_FORMATION' });
  const invalid = setup();
  invalid.player.resources = { hulk: { energy: NaN, abilityPoints: 0 } };
  assert.throws(() => t.state.ready(invalid), { code: 'INVALID_RESOURCES' });
});
test('FinalStage rejects malformed four-Active initial formations before entering combat', async () => {
  const t = toolkit();
  const ready = t.state.ready(setup());
  hero(ready, 'hulk').status = 'ACTIVE';
  await assert.rejects(t.engine.play({ current: ready, command: { type: 'START' } }), {
    code: 'INVALID_FORMATION',
  });
  assert.equal(ready.status, 'READY');
});
test('basic hit damages Doom, recovers individual AP up to its maximum, and advances once', async () => {
  const t = toolkit();
  let state = await started(t);
  hero(state, 'spider-man').currentAbilityPoints = 75;
  state = await choose(t, state, 'BASIC_ATTACK', { actorId: 'spider-man', targetId: 'DOOM' });
  assert.ok(state.data.doom.currentEnergy < 750);
  assert.equal(state.turn, 1);
  assert.equal(hero(state, 'spider-man').currentAbilityPoints, 80);
  assert.equal(hero(state, 'doctor-strange').currentAbilityPoints, 140);
});
test('basic miss causes no damage and recovers no AP', async () => {
  const t = toolkit({ random: new ControlledRandom(0.999) });
  let state = await started(t);
  hero(state, 'spider-man').currentAbilityPoints = 5;
  state = await choose(t, state, 'BASIC_ATTACK', { actorId: 'spider-man', targetId: 'DOOM' });
  assert.equal(state.data.doom.currentEnergy, 750);
  assert.equal(hero(state, 'spider-man').currentAbilityPoints, 5);
  assert.ok(state.data.events.some((event) => event.type === 'ATTACK_MISS'));
});
test('difficulty rounds only Opponent Hero to Player Hero damage and uses the Journey snapshot', async () => {
  const cases = [
    [{ FINAL_BATTLE_DIFFICULTY: 'EASY' }, 0.1],
    [{ FINAL_BATTLE_DIFFICULTY: 'NORMAL' }, 0.5],
    [{ FINAL_BATTLE_DIFFICULTY: 'HARD' }, 1],
    [
      { FINAL_BATTLE_DIFFICULTY_CUSTOM: 'true', FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT: '0.4' },
      0.4,
    ],
  ];
  for (const [overrides, multiplier] of cases) {
    const t = toolkit({ overrides, random: new ControlledRandom(0, [0, 0.5]) });
    const state = await started(t, { quiet: false });
    const actor = state.data.opponent.heroes.find((value) => value.heroId === 'wolverine');
    const target = hero(state, 'spider-man');
    const actorStats = t.rules.effectiveStats(state.data.opponent, actor, state.data.content);
    const targetStats = t.rules.effectiveStats(state.data.player, target, state.data.content);
    const base = t.rules.damage(actorStats, targetStats, 'BASIC', 1, 0.5);
    const before = target.currentEnergy;
    assert.equal(state.data.difficultyProfile.opponentHeroDamageToPlayerMultiplier, multiplier);
    t.combat.attack(state.data, 0, 'OPPONENT', actor.heroId, target.heroId, actorStats, 'BASIC', 1);
    assert.equal(before - target.currentEnergy, Math.round(base * multiplier));
  }

  const easy = toolkit({
    overrides: { FINAL_BATTLE_DIFFICULTY: 'EASY' },
    random: new ControlledRandom(0, [0, 0.5]),
  });
  const hard = toolkit({ overrides: { FINAL_BATTLE_DIFFICULTY: 'HARD' } });
  const snapshotted = await started(easy, { quiet: false });
  const playerBefore = snapshotted.data.player.heroes.find(
    (value) => value.heroId === 'spider-man',
  ).currentEnergy;
  const opponent = snapshotted.data.opponent.heroes.find((value) => value.heroId === 'wolverine');
  hard.combat.attack(
    snapshotted.data,
    0,
    'OPPONENT',
    opponent.heroId,
    'spider-man',
    hard.rules.effectiveStats(snapshotted.data.opponent, opponent, snapshotted.data.content),
    'BASIC',
    1,
  );
  assert.equal(
    playerBefore - hero(snapshotted, 'spider-man').currentEnergy,
    Math.round(
      hard.rules.damage(
        hard.rules.effectiveStats(snapshotted.data.opponent, opponent, snapshotted.data.content),
        hard.rules.effectiveStats(
          snapshotted.data.player,
          hero(snapshotted, 'spider-man'),
          snapshotted.data.content,
        ),
        'BASIC',
        1,
        0,
      ) * 0.1,
    ),
  );
});
test('difficulty leaves Player attacks, Doom damage, healing, AP and Power-Ups unchanged', async () => {
  const easy = toolkit({
    overrides: { FINAL_BATTLE_DIFFICULTY: 'EASY' },
    random: new ControlledRandom(0, [0, 0.5, 0, 0.5]),
  });
  const input = setup();
  input.inventory = [
    {
      id: 'ap-major',
      name: 'Major AP',
      target: 'HERO',
      quantity: 1,
      effect: { type: 'AP_PERCENT', percent: 25 },
    },
  ];
  const state = await started(easy, { setup: input, quiet: false });
  const actor = hero(state, 'doctor-strange');
  const playerStats = easy.rules.effectiveStats(state.data.player, actor, state.data.content);
  const rival = state.data.opponent.heroes.find((value) => value.heroId === 'wolverine');
  const rivalStats = easy.rules.effectiveStats(state.data.opponent, rival, state.data.content);
  const playerToRivalBase = easy.rules.damage(playerStats, rivalStats, 'BASIC', 1, 0.5);
  const rivalEnergyBefore = rival.currentEnergy;
  easy.combat.attack(state.data, 0, 'PLAYER', actor.heroId, rival.heroId, playerStats, 'BASIC', 1);
  assert.equal(rivalEnergyBefore - rival.currentEnergy, playerToRivalBase);

  const doomEnergyBefore = state.data.doom.currentEnergy;
  const playerToDoomBase = easy.rules.damage(playerStats, easy.rules.doomStats(), 'BASIC', 1, 0.5);
  easy.combat.attack(state.data, 0, 'PLAYER', actor.heroId, 'DOOM', playerStats, 'BASIC', 1);
  assert.equal(doomEnergyBefore - state.data.doom.currentEnergy, playerToDoomBase);

  const playerEnergyBefore = actor.currentEnergy;
  easy.combat.damageHero(state.data, 0, 'DOOM', 'PLAYER', actor, 11, 'DOOM');
  assert.equal(playerEnergyBefore - actor.currentEnergy, 11);
  easy.combat.healTeam(state.data, 0, 'PLAYER', 11, actor.heroId);
  assert.equal(actor.currentEnergy, playerEnergyBefore);

  actor.currentAbilityPoints = 0;
  easy.combat.powerUp(state.data, 0, {
    type: 'POWER_UP',
    id: 'direct-use',
    itemId: 'ap-major',
    targetId: actor.heroId,
    apCost: 0,
  });
  assert.equal(
    actor.currentAbilityPoints,
    Math.max(1, Math.round((actor.maxAbilityPoints * 25) / 100)),
  );
  assert.equal(state.data.inventory[0].quantity, 0);
});
test('offensive special consumes actor AP, uses Ability and hits only Active opponents', async () => {
  const t = toolkit();
  let state = await started(t, { quiet: false });
  const actorAp = hero(state, 'doctor-strange').currentAbilityPoints;
  const activeOpponentIds = t.rules.active(state.data.opponent).map((member) => member.heroId);
  state = await choose(t, state, 'OFFENSIVE_SPECIAL', {
    actorId: 'doctor-strange',
    targetId: 'OPPONENT_TEAM',
  });
  const costs = state.data.events.filter(
    (event) => event.source === 'PLAYER' && event.type === 'AP_CHANGE',
  );
  assert.equal(costs[0].values.apChange, -35);
  assert.equal(hero(state, 'doctor-strange').currentAbilityPoints, actorAp - 35);
  assert.deepEqual(
    state.data.events
      .filter((event) => event.source === 'PLAYER' && event.type === 'DAMAGE')
      .flatMap((event) => event.targetIds),
    activeOpponentIds,
  );
});
test('support heals all living heroes including bench, consumes only actor AP and never revives KO heroes', async () => {
  const t = toolkit();
  let state = await started(t);
  hero(state, 'spider-man').currentEnergy = 100;
  hero(state, 'iron-man').currentEnergy = 100;
  hero(state, 'hulk').currentEnergy = 0;
  hero(state, 'hulk').condition = 'KNOCKED_OUT';
  state = await choose(t, state, 'SUPPORT_SPECIAL', { actorId: 'doctor-strange' });
  assert.ok(hero(state, 'spider-man').currentEnergy > 100);
  assert.ok(hero(state, 'iron-man').currentEnergy > 100);
  assert.equal(hero(state, 'doctor-strange').currentAbilityPoints, 110);
  assert.equal(hero(state, 'hulk').currentEnergy, 0);
});
test('insufficient AP removes both specials and fabricated or stale choices are rejected without mutation', async () => {
  const t = toolkit();
  let state = await started(t);
  const old = select(t, state, 'OFFENSIVE_SPECIAL', { actorId: 'doctor-strange' });
  hero(state, 'doctor-strange').currentAbilityPoints = 0;
  assert.equal(select(t, state, 'OFFENSIVE_SPECIAL', { actorId: 'doctor-strange' }), undefined);
  const original = structuredClone(state);
  await assert.rejects(
    t.engine.play({ current: state, command: { type: 'CHOOSE_ACTION', actionId: old.id } }),
    { code: 'ILLEGAL_ACTION' },
  );
  assert.deepEqual(state, original);
});
test('temporary support boosts and cleanse are structured, bounded and expire', async () => {
  const t = toolkit();
  let state = await started(t);
  state = await choose(t, state, 'SUPPORT_SPECIAL', { actorId: 'sue-storm' });
  assert.ok(state.data.player.effects.some((effect) => effect.stat === 'resistance'));
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.equal(state.data.player.effects.length, 0);
  assert.ok(state.data.events.some((event) => event.type === 'EFFECT_EXPIRED'));
  state = await choose(t, state, 'SWAP', { outgoingId: 'doctor-strange', incomingId: 'iron-man' });
  t.combat.effect(state.data, state.turn + 1, 'DOOM', 'PLAYER', 'power', -0.1, 2, 'DOOM');
  state = await choose(t, state, 'SUPPORT_SPECIAL', { actorId: 'iron-man' });
  assert.ok(
    state.data.events.some((event) => event.type === 'CLEANSE' && event.values.count === 1),
  );
});
test('KO is individual, removes acting options and requires explicit bench replacement', async () => {
  const t = toolkit();
  let state = await started(t);
  t.combat.damageHero(state.data, 0, 'DOOM', 'PLAYER', hero(state, 'doctor-strange'), 1000, 'DOOM');
  assert.equal(hero(state, 'doctor-strange').condition, 'KNOCKED_OUT');
  assert.equal(select(t, state, 'BASIC_ATTACK'), undefined);
  assert.equal(state.data.player.heroes.filter((value) => value.status === 'ACTIVE').length, 2);
  state = await choose(t, state, 'SWAP', { outgoingId: 'doctor-strange', incomingId: 'hulk' });
  assert.equal(state.turn, 0);
  assert.equal(hero(state, 'hulk').status, 'ACTIVE');
  assert.ok(select(t, state, 'BASIC_ATTACK'));
});
test('swap preserves both resources, recalculates synergy and blocks re-entry until a cycle elapses', async () => {
  const t = toolkit();
  let state = await started(t);
  hero(state, 'doctor-strange').currentEnergy = 60;
  hero(state, 'doctor-strange').currentAbilityPoints = 15;
  hero(state, 'hulk').currentEnergy = 150;
  hero(state, 'hulk').currentAbilityPoints = 5;
  const before = state.data.player.synergy.value;
  state = await choose(t, state, 'SWAP', { outgoingId: 'doctor-strange', incomingId: 'hulk' });
  assert.equal(hero(state, 'doctor-strange').currentEnergy, 60);
  assert.equal(hero(state, 'hulk').currentAbilityPoints, 5);
  assert.notEqual(state.data.player.synergy.value, before);
  assert.equal(select(t, state, 'SWAP', { incomingId: 'doctor-strange' }), undefined);
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.ok(select(t, state, 'SWAP', { incomingId: 'doctor-strange' }));
  assert.ok(select(t, state, 'SWAP', { outgoingId: 'spider-man' }));
});
test('living Leader can rotate both ways in FinalStage without changing identity or consuming a turn', async () => {
  const t = toolkit();
  let state = await started(t, { actOne: true, quiet: false });
  const fixedLeaderId = state.data.player.leaderId;
  assert.ok(select(t, state, 'LEADER_ABILITY'));
  state = await choose(t, state, 'SWAP', { outgoingId: fixedLeaderId, incomingId: 'hulk' });
  assert.equal(state.turn, 0);
  assert.equal(state.data.player.leaderId, fixedLeaderId);
  assert.equal(hero(state, fixedLeaderId).status, 'INACTIVE');
  assert.equal(select(t, state, 'LEADER_ABILITY'), undefined);
  assert.ok(select(t, state, 'BASIC_ATTACK'));
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'iron-man' });
  const returnSwap = select(t, state, 'SWAP', { incomingId: fixedLeaderId });
  assert.ok(returnSwap);
  const turnBeforeSwap = state.turn;
  state = await t.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: returnSwap.id },
  });
  assert.equal(state.turn, turnBeforeSwap);
  assert.equal(state.data.player.leaderId, fixedLeaderId);
  assert.equal(hero(state, fixedLeaderId).status, 'ACTIVE');
  assert.ok(select(t, state, 'LEADER_ABILITY'));
});
test('relationships resolve ALLY/NORMAL/RIVAL symmetrically and RIVAL takes precedence', () => {
  const t = toolkit();
  assert.equal(t.rules.relationship('spider-man', 'iron-man'), 'ALLY');
  assert.equal(t.rules.relationship('doctor-strange', 'hulk'), 'NORMAL');
  assert.equal(t.rules.relationship('iron-man', 'hulk'), 'RIVAL');
  const original = t.catalog.hero.bind(t.catalog);
  t.catalog.hero = (id) => {
    const h = original(id);
    if (id === 'iron-man') {
      h.allies.push('hulk');
    }
    return h;
  };
  assert.equal(t.rules.relationship('hulk', 'iron-man'), 'RIVAL');
});
test('synergy levels and role bonus remain moderate and team action requires HIGH or EXCELLENT', async () => {
  const t = toolkit();
  let state = await started(t);
  state.data.player.heroes.forEach((value) => {
    value.status = ['spider-man', 'hulk', 'wolverine'].includes(value.heroId)
      ? 'ACTIVE'
      : 'INACTIVE';
  });
  const replacement = state.data.player.heroes.find((value) => value.heroId === 'doctor-strange');
  replacement.heroId = 'wolverine';
  replacement.status = 'ACTIVE';
  assert.equal(t.rules.synergy(state.data.player).level, 'LOW');
  assert.equal(select(t, state, 'TEAM_ACTION'), undefined);
  const high = setup();
  high.player.activeHeroIds = ['captain-america', 'sue-storm'];
  high.player.benchHeroIds = ['hulk', 'iron-man', 'doctor-strange'];
  state = await started(t, { setup: high });
  assert.equal(state.data.player.synergy.level, 'EXCELLENT');
  assert.ok(select(t, state, 'TEAM_ACTION'));
  assert.equal(state.data.player.synergy.statModifier, 0.08);
});
test('leader compatibility is HIGH for alignment, LOW for aggression/defense opposition, MEDIUM otherwise', () => {
  const t = toolkit();
  assert.equal(t.rules.compatibility(S.AGGRESSIVE, S.AGGRESSIVE), 'HIGH');
  assert.equal(t.rules.compatibility(S.AGGRESSIVE, S.DEFENSIVE), 'LOW');
  assert.equal(t.rules.compatibility(S.PRAGMATIC, S.AGGRESSIVE), 'MEDIUM');
});
test('strategy changes preserve Energy/AP/effects, consume no normal turn, respect cooldown and limit', async () => {
  const t = toolkit({ overrides: { MAX_STRATEGY_CHANGES: 1 } });
  let state = await started(t);
  hero(state, 'spider-man').currentEnergy = 80;
  hero(state, 'spider-man').currentAbilityPoints = 10;
  t.combat.effect(state.data, 0, 'DOOM', 'PLAYER', 'power', -0.1, 3, 'DOOM');
  state = await choose(t, state, 'CHANGE_STRATEGY', { strategy: S.AGGRESSIVE });
  assert.equal(state.turn, 0);
  assert.equal(hero(state, 'spider-man').currentEnergy, 80);
  assert.equal(hero(state, 'spider-man').currentAbilityPoints, 10);
  assert.equal(state.data.player.effects.length, 1);
  assert.equal(select(t, state, 'CHANGE_STRATEGY'), undefined);
  const c = toolkit();
  let cooled = await started(c);
  cooled = await choose(c, cooled, 'CHANGE_STRATEGY', { strategy: S.DEFENSIVE });
  cooled = await choose(c, cooled, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.equal(select(c, cooled, 'CHANGE_STRATEGY'), undefined);
  cooled = await choose(c, cooled, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.ok(select(c, cooled, 'CHANGE_STRATEGY'));
});
test('SWAP and strategy changes stay on the same turn before the next combat action advances it', async () => {
  const t = toolkit();
  let state = await started(t, { quiet: false });

  state = await choose(t, state, 'SWAP', {
    outgoingId: 'doctor-strange',
    incomingId: 'hulk',
  });
  assert.equal(state.turn, 0);
  assert.equal(state.data.timeline.at(-1).turn, 0);

  state = await choose(t, state, 'CHANGE_STRATEGY', { strategy: S.AGGRESSIVE });
  assert.equal(state.turn, 0);
  assert.equal(state.data.timeline.at(-1).turn, 0);
  assert.ok(select(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' }));

  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.equal(state.turn, 1);
});
test('an unfillable ACTIVE formation becomes terminal instead of staying active with no legal action', async () => {
  const t = toolkit();
  let state = await started(t, { actOne: true, quiet: false });
  const active = state.data.player.heroes.filter((value) => value.status === 'ACTIVE');

  for (const heroValue of active.slice(0, 2)) {
    t.combat.damageHero(state.data, state.turn, 'DOOM', 'PLAYER', heroValue, 1000, 'DOOM');
  }
  state.data.player.heroes.forEach((heroValue) => {
    if (heroValue.status === 'INACTIVE' && heroValue.currentEnergy > 0) {
      heroValue.returnAtTurn = 20;
    }
  });
  state.data.player.strategyChangesRemaining = 1;
  t.actions.refresh(state.data, state.turn);
  assert.equal(state.status, 'ACTIVE');
  assert.ok(state.data.availableActions.some((action) => action.type === 'CHANGE_STRATEGY'));
  assert.equal(
    state.data.availableActions.some((action) => action.type === 'SWAP'),
    false,
  );

  state = await choose(t, state, 'CHANGE_STRATEGY', { strategy: S.AGGRESSIVE });

  assert.equal(state.status, 'COMPLETED');
  assert.equal(state.data.outcome, 'DEFEAT');
  assert.equal(state.data.terminalReasonCode, 'PLAYER_NO_LEGAL_PROGRESS');
  assert.equal(state.data.availableActions.length, 0);
  assert.equal(state.turn, 0);
});
test('leader ability consumes one action and its limited uses, but no AP', async () => {
  const t = toolkit({ overrides: { MAX_LEADER_ABILITY_USES: 1 } });
  let state = await started(t);
  state = await choose(t, state, 'LEADER_ABILITY', { targetId: 'DOOM' });
  assert.equal(state.turn, 1);
  assert.equal(state.data.player.leaderAbilityUsesRemaining, 0);
  assert.equal(hero(state, 'spider-man').currentAbilityPoints, 80);
  assert.equal(select(t, state, 'LEADER_ABILITY'), undefined);
});
test('team action is role-based, consumes its use and one cycle', async () => {
  const t = toolkit({ overrides: { MAX_TEAM_ACTIONS: 1 } });
  const input = setup();
  input.player.activeHeroIds = ['captain-america', 'sue-storm'];
  input.player.benchHeroIds = ['hulk', 'iron-man', 'doctor-strange'];
  let state = await started(t, { setup: input });
  state = await choose(t, state, 'TEAM_ACTION', { targetId: 'DOOM' });
  assert.equal(state.turn, 1);
  assert.equal(state.data.player.teamActionsRemaining, 0);
  assert.equal(select(t, state, 'TEAM_ACTION'), undefined);
});
test('Power-Up consumption heals individual Energy and is not reusable', async () => {
  const t = toolkit();
  const input = setup();
  input.inventory = inventory();
  let state = await started(t, { setup: input });
  hero(state, 'spider-man').currentEnergy = 100;
  state = await choose(t, state, 'POWER_UP', { itemId: 'energy', targetId: 'spider-man' });
  assert.equal(state.turn, 1);
  assert.equal(hero(state, 'spider-man').currentEnergy, 144);
  assert.equal(state.data.inventory.find((item) => item.id === 'energy').quantity, 0);
  assert.equal(select(t, state, 'POWER_UP', { itemId: 'energy' }), undefined);
});
test('individual AP Power-Ups target Heroes while -all variants target only current Active Heroes', async () => {
  const t = toolkit();
  const input = setup();
  input.inventory = [
    {
      id: 'ap-major',
      name: 'Major AP',
      target: 'HERO',
      quantity: 1,
      effect: { type: 'AP_PERCENT', percent: 25 },
    },
    {
      id: 'ap-major-all',
      name: 'Major AP All',
      target: 'TEAM',
      quantity: 1,
      effect: { type: 'AP_PERCENT', percent: 25 },
    },
  ];
  let state = await started(t, { setup: input });
  for (const active of t.rules.active(state.data.player)) {
    active.currentAbilityPoints = 0;
  }
  hero(state, 'hulk').currentAbilityPoints = 0;
  const actions = t.actions
    .list(state.data, state.turn, 'PLAYER')
    .filter((action) => action.type === 'POWER_UP');
  const individual = actions.filter((action) => action.itemId === 'ap-major');
  assert.ok(individual.length > 0);
  assert.ok(individual.every((action) => action.targetId !== 'OWN_TEAM'));
  assert.ok(
    actions.some((action) => action.itemId === 'ap-major-all' && action.targetId === 'OWN_TEAM'),
  );
  const activeIds = t.rules.active(state.data.player).map((value) => value.heroId);
  const before = new Map(activeIds.map((id) => [id, hero(state, id).currentAbilityPoints]));
  state = await choose(t, state, 'POWER_UP', { itemId: 'ap-major-all', targetId: 'OWN_TEAM' });
  assert.ok(activeIds.every((id) => hero(state, id).currentAbilityPoints > before.get(id)));
  assert.equal(hero(state, 'hulk').currentAbilityPoints, 0);
  assert.equal(state.data.inventory.find((item) => item.id === 'ap-major-all').quantity, 0);
  const powerEvent = state.data.events.find((event) => event.type === 'POWER_UP');
  assert.deepEqual(new Set(powerEvent.targetIds), new Set(activeIds));
});
test('all three AP recovery tiers expose HERO and explicit OWN_TEAM contracts with per-Hero caps', async () => {
  const cases = [
    ['ap-minor', 'ap-minor-all', 10],
    ['ap-major', 'ap-major-all', 25],
    ['ap-full', 'ap-full-all', 100],
  ];
  for (const [individualId, teamId, percent] of cases) {
    for (const [itemId, target, targetId] of [
      [individualId, 'HERO', 'doctor-strange'],
      [teamId, 'TEAM', 'OWN_TEAM'],
    ]) {
      const t = toolkit();
      const input = setup();
      input.inventory = [
        {
          id: itemId,
          name: itemId,
          target,
          quantity: 1,
          effect: { type: 'AP_PERCENT', percent },
        },
      ];
      let state = await started(t, { setup: input });
      for (const current of state.data.player.heroes) {
        current.currentAbilityPoints = 0;
      }
      const activeIds = t.rules.active(state.data.player).map((current) => current.heroId);
      const individualTarget = hero(state, 'doctor-strange');
      const maximum = individualTarget.maxAbilityPoints;
      state = await choose(t, state, 'POWER_UP', { itemId, targetId });
      assert.equal(state.data.inventory[0].quantity, 0);
      if (target === 'HERO') {
        assert.equal(
          hero(state, 'doctor-strange').currentAbilityPoints,
          Math.min(maximum, Math.max(1, Math.round((maximum * percent) / 100))),
        );
        assert.ok(
          activeIds
            .filter((id) => id !== 'doctor-strange')
            .every((id) => hero(state, id).currentAbilityPoints === 0),
        );
      } else {
        assert.ok(activeIds.every((id) => hero(state, id).currentAbilityPoints > 0));
        assert.equal(hero(state, 'hulk').currentAbilityPoints, 0);
      }
      assert.equal(
        state.data.availableActions.some(
          (action) => action.targetId === 'OWN_TEAM' && action.itemId === individualId,
        ),
        false,
      );
    }
  }
});
test('OWN_TEAM recovery resolves every Active Hero while per-Hero caps keep full AP unchanged', async () => {
  const t = toolkit();
  const input = setup();
  input.inventory = [
    {
      id: 'ap-major-all',
      name: 'Major AP All',
      target: 'TEAM',
      quantity: 1,
      effect: { type: 'AP_PERCENT', percent: 25 },
    },
  ];
  let state = await started(t, { setup: input });
  const activeIds = t.rules.active(state.data.player).map((current) => current.heroId);
  const cappedHeroId = activeIds[0];
  for (const id of activeIds) {
    hero(state, id).currentAbilityPoints = 0;
  }
  hero(state, cappedHeroId).currentAbilityPoints = hero(state, cappedHeroId).maxAbilityPoints;
  const before = new Map(activeIds.map((id) => [id, hero(state, id).currentAbilityPoints]));

  state = await choose(t, state, 'POWER_UP', {
    itemId: 'ap-major-all',
    targetId: 'OWN_TEAM',
  });

  const powerEvent = state.data.events.find((event) => event.type === 'POWER_UP');
  assert.deepEqual(new Set(powerEvent.targetIds), new Set(activeIds));
  assert.equal(hero(state, cappedHeroId).currentAbilityPoints, before.get(cappedHeroId));
  assert.ok(
    activeIds
      .filter((id) => id !== cappedHeroId)
      .every((id) => hero(state, id).currentAbilityPoints > before.get(id)),
  );
  assert.equal(state.data.inventory[0].quantity, 0);
});
test('invalid Power-Up target is rejected before inventory consumption', async () => {
  const t = toolkit();
  const input = setup();
  input.inventory = [
    {
      id: 'ap-major',
      name: 'Major AP',
      target: 'HERO',
      quantity: 1,
      effect: { type: 'AP_PERCENT', percent: 25 },
    },
  ];
  const state = await started(t, { setup: input });
  assert.throws(
    () =>
      t.combat.powerUp(state.data, state.turn, {
        type: 'POWER_UP',
        id: 'forged',
        itemId: 'ap-major',
        targetId: 'OWN_TEAM',
        apCost: 0,
      }),
    { code: 'POWER_UP_UNAVAILABLE' },
  );
  assert.equal(state.data.inventory[0].quantity, 1);
});
test('Revive restores configured partial resources, returns to bench and does not select a formation', async () => {
  const t = toolkit();
  const input = setup();
  input.inventory = inventory();
  let state = await started(t, { setup: input });
  t.combat.damageHero(state.data, 0, 'DOOM', 'PLAYER', hero(state, 'doctor-strange'), 1000, 'DOOM');
  state = await choose(t, state, 'POWER_UP', { itemId: 'revive', targetId: 'doctor-strange' });
  assert.equal(hero(state, 'doctor-strange').currentEnergy, 72);
  assert.equal(hero(state, 'doctor-strange').currentAbilityPoints, 35);
  assert.equal(hero(state, 'doctor-strange').status, 'INACTIVE');
  assert.equal(select(t, state, 'BASIC_ATTACK'), undefined);
});
test('extra team/leader reserves increase real counters and AP reserve funds specials without a special-use counter', async () => {
  const t = toolkit();
  const input = setup();
  input.inventory = inventory();
  let state = await started(t, { setup: input });
  state = await choose(t, state, 'POWER_UP', { itemId: 'team' });
  assert.equal(state.data.player.teamActionsRemaining, 4);
  state = await choose(t, state, 'POWER_UP', { itemId: 'leader' });
  assert.equal(state.data.player.leaderAbilityUsesRemaining, 3);
  hero(state, 'doctor-strange').currentAbilityPoints = 0;
  state = await choose(t, state, 'POWER_UP', { itemId: 'ap', targetId: 'doctor-strange' });
  assert.equal(hero(state, 'doctor-strange').currentAbilityPoints, 20);
});
test('leader rivalry enables structured momentum from significant combat damage, not a separate team catalog', async () => {
  const t = toolkit();
  const input = setup();
  input.player = {
    teamId: 'captain-america-team',
    activeHeroIds: ['spider-man', 'hulk'],
    benchHeroIds: ['doctor-strange', 'sue-storm', 'wolverine'],
    strategy: S.AGGRESSIVE,
  };
  let state = await started(t, { setup: input, quiet: false });
  assert.equal(state.data.rivalry, true);
  state = await choose(t, state, 'OFFENSIVE_SPECIAL', {
    actorId: 'hulk',
    targetId: 'OPPONENT_TEAM',
  });
  assert.ok(
    state.data.events.some((event) => event.type === 'RIVALRY' && event.source === 'PLAYER'),
  );
  assert.ok(
    state.data.events.some((event) => event.type === 'EFFECT' && event.effect.source === 'RIVALRY'),
  );
});
test('opponent response belongs to the same complete human cycle and never becomes a separate visible turn', async () => {
  const t = toolkit();
  let state = await started(t, { quiet: false });
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.ok(
    state.data.events.some((event) => event.type === 'ACTION' && event.source === 'OPPONENT'),
  );
  assert.ok(state.data.events.every((event) => event.turn === 1));
  assert.deepEqual(
    state.data.events.map((event) => event.order),
    state.data.events.map((_, index) => index),
  );
});
test('opponent automatically replaces KO combatants and respects the same swap cooldown', async () => {
  const t = toolkit();
  const state = await started(t, { quiet: false });
  t.combat.damageHero(
    state.data,
    0,
    'PLAYER',
    'OPPONENT',
    state.data.opponent.heroes[1],
    1000,
    'spider-man',
  );
  t.ai.prepare(state.data, 0);
  assert.equal(t.rules.active(state.data.opponent).length, 3);
  assert.ok(
    state.data.events.some((event) => event.type === 'SWAP' && event.source === 'OPPONENT'),
  );
});
test('AI strategy meaningfully changes action weights and pragmatic leaders adapt more willingly', async () => {
  const t = toolkit();
  const state = await started(t, { quiet: false });
  const action = t.actions
    .list(state.data, 0, 'OPPONENT')
    .find((value) => value.type === 'OFFENSIVE_SPECIAL');
  state.data.opponent.strategy = S.AGGRESSIVE;
  const aggressive = t.ai.weight(state.data, action);
  state.data.opponent.strategy = S.DEFENSIVE;
  assert.ok(aggressive > t.ai.weight(state.data, action));
  state.data.opponent.heroes.forEach((value) => {
    value.currentEnergy = Math.min(value.currentEnergy, 30);
  });
  state.data.opponent.strategy = S.BALANCED;
  state.data.opponent.leaderProfile = S.PRAGMATIC;
  t.random.value = 0.5;
  t.ai.prepare(state.data, 0);
  assert.equal(state.data.opponent.strategy, S.DEFENSIVE);
  assert.equal(state.data.opponent.strategyChangesRemaining, 2);
  state.data.opponent.strategy = S.BALANCED;
  t.ai.prepare(state.data, 1);
  assert.equal(state.data.opponent.strategy, S.BALANCED);
  state.data.opponent.strategyChangeAtTurn = 0;
  state.data.opponent.leaderProfile = S.AGGRESSIVE;
  t.ai.prepare(state.data, 1);
  assert.equal(state.data.opponent.strategy, S.BALANCED);
});
test('Doom threat thresholds are exact and damage scales monotonically as Energy falls', () => {
  const t = toolkit();
  assert.deepEqual(
    [750, 562.5, 375, 187.5, 0].map((energy) => t.rules.threat(energy, 750)),
    ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'DEFEATED'],
  );
  const stats = t.rules.doomStats();
  const damages = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) =>
    t.rules.damage(stats, stats, 'SPECIAL', t.config.balance.doomScaling[level], 0.5),
  );
  assert.ok(damages.every((value, i) => i === 0 || value > damages[i - 1]));
});
test('Doom probability is controllable and its events share the resolved normal turn', async () => {
  const t = toolkit({
    random: new ControlledRandom(0),
    overrides: {
      DOOM_LOW_INTERVENTION_PROBABILITY: 0.1,
      DOOM_MEDIUM_INTERVENTION_PROBABILITY: 0.25,
      DOOM_HIGH_INTERVENTION_PROBABILITY: 0.5,
      DOOM_CRITICAL_INTERVENTION_PROBABILITY: 0.75,
    },
  });
  let state = await started(t);
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.ok(state.data.events.some((event) => event.type === 'DOOM_INTERVENTION'));
  assert.ok(state.data.events.every((event) => event.turn === 1));
  const data = structuredClone(state.data);
  data.events = [];
  t.random.value = 0.2;
  data.doom.threatLevel = 'LOW';
  t.doom.intervene(data, 2);
  assert.equal(data.events.length, 0);
  data.doom.threatLevel = 'HIGH';
  t.doom.intervene(data, 2);
  assert.ok(data.events.some((event) => event.type === 'DOOM_INTERVENTION'));
});
test('Doom supports all representative interventions with structured damage, debuff and AP changes', async () => {
  for (const choice of [0.1, 0.4, 0.7, 0.9]) {
    const t = toolkit({
      random: new ControlledRandom(0, [0, choice]),
      overrides: {
        DOOM_LOW_INTERVENTION_PROBABILITY: 1,
        DOOM_MEDIUM_INTERVENTION_PROBABILITY: 1,
        DOOM_HIGH_INTERVENTION_PROBABILITY: 1,
        DOOM_CRITICAL_INTERVENTION_PROBABILITY: 1,
      },
    });
    const state = await started(t);
    hero(state, 'spider-man').currentAbilityPoints = 30;
    t.doom.intervene(state.data, 1);
    assert.ok(state.data.events.some((event) => event.type === 'DOOM_INTERVENTION'));
    assert.ok(
      state.data.events.some((event) => ['DAMAGE', 'EFFECT', 'AP_CHANGE'].includes(event.type)),
    );
  }
});
test('Doom intervention resolves captured Journey Hero definitions under PRAGMATIC strategy', async () => {
  const t = toolkit({
    overrides: {
      DOOM_LOW_INTERVENTION_PROBABILITY: 1,
      DOOM_MEDIUM_INTERVENTION_PROBABILITY: 1,
      DOOM_HIGH_INTERVENTION_PROBABILITY: 1,
      DOOM_CRITICAL_INTERVENTION_PROBABILITY: 1,
    },
  });
  const state = await started(t);
  const activeHero = state.data.player.heroes.find(
    (value) => value.status === 'ACTIVE' && value.currentEnergy > 0,
  );
  activeHero.heroId = 'punisher';
  state.data.player.strategy = S.PRAGMATIC;
  const punisher = t.catalog.hero('doctor-strange');
  punisher.id = 'punisher';
  punisher.name = 'Punisher';
  state.data.content = { heroes: { punisher }, teams: {} };

  assert.doesNotThrow(() => t.doom.intervene(state.data, state.turn + 1));
  assert.ok(state.data.events.some((event) => event.type === 'DOOM_INTERVENTION'));
  assert.ok(state.data.events.some((event) => event.type === 'DAMAGE'));
});
test('opponent defeat leaves Doom battle active and stops normal enemy responses', async () => {
  const t = toolkit();
  let state = await started(t);
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.equal(state.status, 'ACTIVE');
  assert.equal(state.data.outcome, null);
  assert.equal(
    state.data.events.some((event) => event.source === 'OPPONENT' && event.type === 'ACTION'),
    false,
  );
});
test('Doom defeat is immediate Victory even with living opponents and prevents any enemy response', async () => {
  const t = toolkit();
  let state = await started(t, { quiet: false });
  state.data.doom.currentEnergy = 1;
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.equal(state.status, 'COMPLETED');
  assert.equal(state.data.outcome, 'VICTORY');
  assert.equal(state.data.terminalReasonCode, 'DOOM_DEFEATED');
  assert.ok(t.rules.living(state.data.opponent).length);
  assert.equal(
    state.data.events.some((event) => event.source === 'OPPONENT'),
    false,
  );
});
test('no usable player continuation produces Defeat, but purchased Revive keeps a rescue path', async () => {
  const t = toolkit();
  const ready = t.state.ready(setup());
  knockOut(ready.data.player);
  const defeated = await t.engine.play({ current: ready, command: { type: 'START' } });
  assert.equal(defeated.data.outcome, 'DEFEAT');
  ready.data.inventory = inventory();
  const rescuable = await t.engine.play({ current: ready, command: { type: 'START' } });
  assert.equal(rescuable.status, 'ACTIVE');
  assert.ok(select(t, rescuable, 'POWER_UP', { itemId: 'revive' }));
});
test('Abandon completes with its own authoritative outcome and consumes no normal turn', async () => {
  const t = toolkit();
  const state = await started(t);
  const result = await t.engine.play({ current: state, command: { type: 'ABANDON' } });
  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.data.outcome, 'ABANDON');
  assert.equal(result.data.terminalReasonCode, 'PLAYER_ABANDONED');
  assert.equal(result.turn, 0);
  assert.ok(result.data.events.some((event) => event.type === 'POST_REVEAL_ABANDON'));
  assert.equal(result.data.endingCode, 'POST_REVEAL_ABANDON');
});
test('ABANDON renders the approved bilingual terminal reveal sequence', async () => {
  const t = toolkit();
  const state = await started(t, { actOne: true });
  const result = await t.engine.play({ current: state, command: { type: 'ABANDON' } });
  const english = t.narrative
    .timeline(result.data.timeline, 'en')
    .find((event) => event.type === 'PRE_REVEAL_ABANDON');
  const spanish = t.narrative
    .timeline(result.data.timeline, 'es')
    .find((event) => event.type === 'PRE_REVEAL_ABANDON');
  assert.ok(english);
  assert.ok(spanish);
  assert.match(english.narrative.map((line) => line.text).join(' '), /Is that all\?/);
  assert.match(
    english.narrative.map((line) => line.text).join(' '),
    /THE BATTLE CONTINUES WITHOUT YOU/,
  );
  assert.match(spanish.narrative.map((line) => line.text).join(' '), /¿Eso es todo\?/);
  assert.match(
    spanish.narrative.map((line) => line.text).join(' '),
    /THE BATTLE CONTINUES WITHOUT YOU/,
  );
});
test('Doom threat narration remains grammatical for every threat state', () => {
  const t = toolkit();
  for (const threat of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'DEFEATED']) {
    const event = {
      type: 'DOOM_THREAT',
      narrativeCode: 'DOOM_THREAT',
      parameters: { actor: 'Doctor Doom', threat, energy: 100 },
      variant: 0,
    };
    const spanish = t.narrative.render(event, 'es');
    const english = t.narrative.render(event, 'en');
    assert.doesNotMatch(spanish, /\{.*\}|alcanza derrotado/);
    assert.doesNotMatch(english, /\{.*\}/);
  }
});
test('Act I remains interactive for four cycles and reveals Doom only after completed turn four', async () => {
  const t = toolkit();
  let state = await started(t, { quiet: false, actOne: true });
  assert.equal(state.data.phase, 'TOURNAMENT_FINAL');
  assert.equal(state.data.doom, null);
  for (let turn = 1; turn <= 4; turn++) {
    const action = state.data.availableActions.find((value) => value.type === 'BASIC_ATTACK');
    state = await t.engine.play({
      current: state,
      command: { type: 'CHOOSE_ACTION', actionId: action.id },
    });
    assert.equal(state.turn, turn);
    if (turn < 4) {
      assert.equal(state.data.doom, null);
      assert.equal(state.data.revealOccurred, false);
    }
  }
  assert.equal(state.data.phase, 'DOOMSDAY');
  assert.equal(state.data.revealOccurred, true);
  assert.equal(state.data.doom.currentEnergy, t.config.balance.doomMaxEnergy);
  assert.deepEqual(
    state.data.events.slice(-6).map((value) => value.type),
    [
      'SURFER_ENOUGH',
      'DOOM_REVEALED',
      'DOOM_EXPLANATION',
      'PLAYER_REJECTION',
      'OPPONENT_ALLIANCE',
      'DOOMSDAY_BEGINS',
    ],
  );
  const playerRejection = state.data.events.find((value) => value.type === 'PLAYER_REJECTION');
  const opponentAlliance = state.data.events.find((value) => value.type === 'OPPONENT_ALLIANCE');
  assert.equal(playerRejection.parameters.playerLeader, state.data.player.leaderId);
  assert.equal(playerRejection.parameters.opponentLeader, state.data.opponent.leaderId);
  assert.equal(opponentAlliance.parameters.playerLeader, state.data.player.leaderId);
  assert.equal(opponentAlliance.parameters.opponentLeader, state.data.opponent.leaderId);
  const revealLines = t.narrative.timeline([playerRejection, opponentAlliance], 'es');
  assert.ok(
    revealLines[0].narrative.every((line) => line.speakerId === state.data.player.leaderId),
  );
  assert.deepEqual(
    revealLines[1].narrative.map((line) => line.speakerId),
    [
      state.data.opponent.leaderId,
      state.data.player.leaderId,
      state.data.opponent.leaderId,
      'doctor-doom',
      state.data.player.leaderId,
    ],
  );
});

test('defeating the complete Opponent Team before Turn 4 reveals Doom immediately', async () => {
  const t = toolkit();
  let state = await started(t, { actOne: true, quiet: false });
  const survivingOpponent = state.data.opponent.heroes[0];
  state.data.opponent.heroes.forEach((opponentHero) => {
    if (opponentHero !== survivingOpponent) {
      opponentHero.currentEnergy = 0;
      opponentHero.condition = 'KNOCKED_OUT';
      opponentHero.status = 'INACTIVE';
    }
  });
  survivingOpponent.currentEnergy = 1;
  state = await choose(t, state, 'OFFENSIVE_SPECIAL', {
    actorId: 'doctor-strange',
    targetId: 'OPPONENT_TEAM',
  });
  assert.equal(state.turn, 1);
  assert.equal(state.data.revealOccurred, true);
  assert.equal(state.data.phase, 'DOOMSDAY');
  assert.ok(state.data.doom);
  assert.equal(t.rules.living(state.data.opponent).length, 0);
  assert.equal(state.data.opponentHadLivingAtActIIStart, false);
  assert.equal(
    state.data.events.some((event) => event.type === 'OPPONENT_ALLIANCE'),
    false,
  );
});

test('Doom-Alone is emitted once when Act-II allies fall', async () => {
  const t = toolkit();
  let state = await started(t);
  state.data.opponentHadLivingAtActIIStart = true;
  state.data.doomAloneNarrativeEmitted = false;
  knockOut(state.data.opponent);
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.equal(state.data.events.filter((event) => event.type === 'DOOM_ALONE').length, 1);
  state.data.opponentHadLivingAtActIIStart = false;
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.equal(state.data.timeline.filter((event) => event.type === 'DOOM_ALONE').length, 1);
});

test('Invisible Woman receives the one-time Sue Storm appeal after the reveal', async () => {
  const t = toolkit();
  let state = await started(t);
  const catalogHero = t.catalog.hero.bind(t.catalog);
  t.catalog.hero = (id) => catalogHero(id === 'invisible-woman' ? 'sue-storm' : id);
  const invisibleWoman = state.data.player.heroes.find((value) => value.heroId === 'sue-storm');
  invisibleWoman.heroId = 'invisible-woman';
  state.data.sueStormAppealStatus = 'AVAILABLE';
  t.actions.refresh(state.data, state.turn);
  const appeal = select(t, state, 'SUE_STORM_APPEAL');
  assert.ok(appeal);
  assert.equal(appeal.apCost, 0);
  state = await t.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: appeal.id },
  });
  assert.equal(state.status, 'COMPLETED');
  assert.equal(state.data.outcome, 'VICTORY');
  assert.equal(state.data.endingCode, 'SUE_STORM_SECRET');
  assert.equal(state.data.doom.currentEnergy, 750);
  assert.equal(
    state.data.player.heroes.some(
      (hero) => hero.heroId === 'invisible-woman' && hero.currentEnergy === 0,
    ),
    false,
  );
  const english = t.narrative
    .timeline(state.data.timeline, 'en')
    .find((event) => event.type === 'SUE_STORM_APPEAL');
  const spanish = t.narrative
    .timeline(state.data.timeline, 'es')
    .find((event) => event.type === 'SUE_STORM_APPEAL');
  assert.ok(english);
  assert.ok(spanish);
  assert.match(english.narrative.map((line) => line.text).join(' '), /A DIFFERENT CHOICE WAS MADE/);
  assert.match(spanish.narrative.map((line) => line.text).join(' '), /A DIFFERENT CHOICE WAS MADE/);
});
test('Final Attack is triggered by real critical Doom state, not a fixed turn maximum', async () => {
  const t = toolkit();
  let state = await started(t, { quiet: false });
  state.data.doom.currentEnergy = Math.floor(state.data.doom.maxEnergy * 0.25);
  t.doom.updateThreat(state.data, state.turn);
  t.actions.refresh(state.data, state.turn);
  const action = state.data.availableActions.find(
    (value) => value.type === 'BASIC_ATTACK' && value.targetId === 'DOOM',
  );
  state = await t.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  assert.equal(state.data.phase, 'FINAL_ATTACK');
  assert.equal(state.data.finalAttackInitiator, 'DOOM');
  assert.ok(state.data.events.some((event) => event.type === 'FINAL_ATTACK'));
});
test('failed Final Response produces its specific terminal reason regardless of difficulty', async () => {
  const t = toolkit({ random: new ControlledRandom(0.999) });
  const hard = toolkit({ overrides: { FINAL_BATTLE_DIFFICULTY: 'HARD' } });
  let state = await started(t, { quiet: false });
  state.data.phase = 'FINAL_ATTACK';
  state.data.finalAttackInitiator = 'DOOM';
  t.actions.refresh(state.data, state.turn);
  const action = select(t, state, 'BASIC_ATTACK', { actorId: 'spider-man', targetId: 'DOOM' });
  assert.ok(action);
  assert.equal(
    hard.engine.finalResponseChance(state.data, action),
    t.engine.finalResponseChance(state.data, action),
  );
  state = await t.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
  assert.equal(state.data.outcome, 'DEFEAT');
  assert.equal(state.data.endingCode, 'NORMAL_DEFEAT');
  assert.equal(state.data.terminalReasonCode, 'FINAL_RESPONSE_FAILED');
  assert.ok(t.rules.living(state.data.player).length > 0);
  assert.ok(state.data.doom.currentEnergy > 0);
});
test('all narrative codes render in English/Spanish, default English, with deterministic variation and no persisted sentences', async () => {
  const t = toolkit();
  const state = await started(t);
  const event = state.data.events[0];
  const original = structuredClone(event);
  assert.equal(t.narrative.render(event), t.narrative.render(event, 'en'));
  assert.notEqual(t.narrative.render(event, 'en'), t.narrative.render(event, 'es'));
  assert.deepEqual(event, original);
  assert.equal('message' in event, false);
  const {
    NARRATIVE_TEMPLATES,
  } = require('../dist/theme/avengers-doomsday/content/narrative-templates');
  for (const code of Object.keys(NARRATIVE_TEMPLATES.en)) {
    for (const lang of ['en', 'es']) {
      const rendered = t.narrative.render(
        {
          ...event,
          narrativeCode: code,
          parameters: {
            actor: 'Hulk',
            target: 'Doctor Doom',
            action: 'Basic Attack',
            damage: 50,
            energy: 100,
            healing: 20,
            apChange: -30,
            ap: 10,
            effect: 'RIVALRY',
            stat: 'power',
            percent: 6,
            duration: 1,
            count: 1,
            incoming: 'Hulk',
            outgoing: 'Sue Storm',
            strategy: 'AGGRESSIVE',
            intervention: 'Arcane Bolt',
            threat: 'LOW',
            item: 'Reserve',
            score: 60,
          },
        },
        lang,
      );
      assert.ok(rendered.length > 0);
      assert.doesNotMatch(rendered, /\{.*\}/);
    }
  }
});
test('seeded randomness gives identical complete battles, including AI, events and narrative', async () => {
  const a = toolkit({ random: new SeededAvengersRandom() });
  const b = toolkit({ random: new SeededAvengersRandom() });
  let first = await started(a, { quiet: false });
  let second = await started(b, { quiet: false });
  for (let step = 0; step < 3; step++) {
    first = await choose(a, first, 'BASIC_ATTACK', { targetId: 'DOOM' });
    second = await choose(b, second, 'BASIC_ATTACK', { targetId: 'DOOM' });
    assert.deepEqual(first, second);
  }
});
test('configuration rejects invalid values and descending threat behavior', () => {
  const {
    readAvengersBalance,
  } = require('../dist/theme/avengers-doomsday/avengers-config.service');
  assert.throws(
    () => readAvengersBalance({ DOOM_LOW_INTERVENTION_PROBABILITY: 0.9 }),
    /must not decrease/,
  );
  assert.throws(() => readAvengersBalance({ DOOM_HIGH_ENERGY_THRESHOLD: 80 }), /descending/);
});

test('Abandon after preparation preserves ordered events without pretending a gameplay cycle completed', async () => {
  const t = toolkit();
  let state = await started(t);
  state = await choose(t, state, 'CHANGE_STRATEGY', { strategy: S.BALANCED });
  state = await t.engine.play({ current: state, command: { type: 'ABANDON' } });
  assert.equal(state.turn, 0);
  assert.ok(
    state.data.timeline.every(
      (event, index, array) => index === 0 || event.turn >= array[index - 1].turn,
    ),
  );
  assert.ok(state.data.events.some((event) => event.type === 'STRATEGY_CHANGE'));
});
test('Final Attack preparation remains interactive without advancing the normal cycle', async () => {
  const t = toolkit();
  let state = await started(t);
  state.data.doom.currentEnergy = Math.floor(state.data.doom.maxEnergy * 0.25);
  t.doom.updateThreat(state.data, state.turn);
  t.actions.refresh(state.data, state.turn);
  const ordinary = state.data.availableActions.find(
    (value) => value.type === 'BASIC_ATTACK' && value.targetId === 'DOOM',
  );
  state = await t.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: ordinary.id },
  });
  const turn = state.turn;
  state = await choose(t, state, 'CHANGE_STRATEGY', { strategy: S.DEFENSIVE });
  assert.equal(state.turn, turn);
  assert.equal(state.data.phase, 'FINAL_ATTACK');
});
test('full Energy/AP reserves cap resources and temporary boosts expire after configured duration', async () => {
  const t = toolkit();
  const input = setup();
  input.inventory = [
    {
      id: 'full-energy',
      name: 'Energy Reserve',
      target: 'HERO',
      quantity: 1,
      effect: { type: 'ENERGY', percent: 100 },
    },
    {
      id: 'full-ap',
      name: 'Focus Reserve',
      target: 'HERO',
      quantity: 1,
      effect: { type: 'FULL_AP' },
    },
    {
      id: 'boost',
      name: 'Power Surge',
      target: 'TEAM',
      quantity: 1,
      effect: { type: 'BOOST', stat: 'power', percent: 20, duration: 2 },
    },
  ];
  let state = await started(t, { setup: input });
  hero(state, 'spider-man').currentEnergy = 1;
  hero(state, 'spider-man').currentAbilityPoints = 1;
  state = await choose(t, state, 'POWER_UP', { itemId: 'full-energy', targetId: 'spider-man' });
  assert.equal(hero(state, 'spider-man').currentEnergy, 220);
  state = await choose(t, state, 'POWER_UP', { itemId: 'full-ap', targetId: 'spider-man' });
  assert.equal(hero(state, 'spider-man').currentAbilityPoints, 80);
  state = await choose(t, state, 'POWER_UP', { itemId: 'boost' });
  assert.ok(state.data.player.effects.some((effect) => effect.modifier === 0.2));
  state = await choose(t, state, 'BASIC_ATTACK', { targetId: 'DOOM' });
  assert.equal(state.data.player.effects.length, 0);
});
test('a revived Leader waits on the bench and requires explicit reinsertion before acting', async () => {
  const t = toolkit();
  const input = setup();
  input.inventory = inventory();
  let state = await started(t, { setup: input });
  t.combat.damageHero(state.data, 0, 'DOOM', 'PLAYER', hero(state, 'spider-man'), 1000, 'DOOM');
  state = await choose(t, state, 'POWER_UP', { itemId: 'revive', targetId: 'spider-man' });
  assert.equal(hero(state, 'spider-man').status, 'INACTIVE');
  assert.equal(select(t, state, 'BASIC_ATTACK'), undefined);
  state = await choose(t, state, 'SWAP', { incomingId: 'spider-man' });
  assert.equal(hero(state, 'spider-man').status, 'ACTIVE');
  assert.ok(select(t, state, 'BASIC_ATTACK'));
});
test('Team Energy/AP are derived solely from living ACTIVE individual resources', async () => {
  const t = toolkit();
  const state = await started(t);
  const active = t.rules.active(state.data.player);
  assert.equal(
    t.rules.energy(state.data.player),
    active.reduce((sum, value) => sum + value.currentEnergy, 0),
  );
  assert.equal(
    t.rules.abilityPoints(state.data.player),
    active.reduce((sum, value) => sum + value.currentAbilityPoints, 0),
  );
  assert.equal('currentEnergy' in state.data.player, false);
  assert.equal('currentAbilityPoints' in state.data.player, false);
});
test('opponent cannot change strategy after exhausting its changes and choices can be forced deterministically', async () => {
  const t = toolkit();
  const state = await started(t, { quiet: false });
  state.data.opponent.strategyChangesRemaining = 0;
  state.data.opponent.strategy = S.AGGRESSIVE;
  state.data.opponent.heroes.forEach((value) => {
    value.currentEnergy = 20;
  });
  t.ai.prepare(state.data, 0);
  assert.equal(state.data.opponent.strategy, S.AGGRESSIVE);
  const options = t.actions
    .list(state.data, 0, 'OPPONENT')
    .filter((value) => !['SWAP', 'CHANGE_STRATEGY'].includes(value.type));
  t.random.value = 0;
  assert.deepEqual(t.ai.choose(state.data, 0), options[0]);
  t.random.value = 0.999999;
  assert.deepEqual(t.ai.choose(state.data, 0), options.at(-1));
});
test('hit and damage are bounded, stronger Power/Ability helps, and Resistance mitigates both damage families', () => {
  const t = toolkit();
  const weak = { power: 0, agility: 0, resistance: 0, ability: 0 };
  const strong = { power: 100, agility: 100, resistance: 100, ability: 100 };
  assert.ok(t.rules.hitChance(strong, weak) <= 0.95);
  assert.ok(t.rules.hitChance(weak, strong) >= 0.55);
  assert.ok(
    t.rules.damage(strong, weak, 'BASIC', 1, 0.5) > t.rules.damage(weak, weak, 'BASIC', 1, 0.5),
  );
  assert.ok(
    t.rules.damage(strong, weak, 'SPECIAL', 1, 0.5) > t.rules.damage(weak, weak, 'SPECIAL', 1, 0.5),
  );
  assert.ok(
    t.rules.damage(strong, strong, 'SPECIAL', 1, 0.5) <
      t.rules.damage(strong, weak, 'SPECIAL', 1, 0.5),
  );
});

test('KO immediately recalculates synergy before any subsequent automatic combat effect', async () => {
  const t = toolkit();
  const state = await started(t);
  const original = state.data.player.synergy.value;
  t.combat.damageHero(state.data, 0, 'DOOM', 'PLAYER', hero(state, 'doctor-strange'), 1000, 'DOOM');
  assert.notEqual(state.data.player.synergy.value, original);
  assert.deepEqual(state.data.player.synergy, t.rules.synergy(state.data.player));
});
test('unknown inventory effects and out-of-range boost percentages are rejected during READY creation', () => {
  const t = toolkit();
  const input = setup();
  input.inventory = [
    { id: 'bad', name: 'Unknown', target: 'HERO', quantity: 1, effect: { type: 'UNKNOWN' } },
  ];
  assert.throws(() => t.state.ready(input), { code: 'INVALID_INVENTORY' });
  input.inventory[0].effect = { type: 'BOOST', stat: 'power', percent: 500, duration: 2 };
  assert.throws(() => t.state.ready(input), { code: 'INVALID_INVENTORY' });
});
test('area damage tuning is symmetric and does not change the single-target Doom multiplier', async () => {
  const base = toolkit({ overrides: { OFFENSIVE_SPECIAL_TEAM_MULTIPLIER: 1 } });
  const tuned = toolkit({ overrides: { OFFENSIVE_SPECIAL_TEAM_MULTIPLIER: 1.25 } });
  for (const side of ['PLAYER', 'OPPONENT']) {
    const first = await started(base, { quiet: false });
    const second = await started(tuned, { quiet: false });
    const actorId = side === 'PLAYER' ? 'doctor-strange' : 'iron-man';
    const a = base.actions
      .list(first.data, 0, side)
      .find(
        (value) =>
          value.type === 'OFFENSIVE_SPECIAL' &&
          value.actorId === actorId &&
          value.targetId === 'OPPONENT_TEAM',
      );
    const b = tuned.actions
      .list(second.data, 0, side)
      .find(
        (value) =>
          value.type === 'OFFENSIVE_SPECIAL' &&
          value.actorId === actorId &&
          value.targetId === 'OPPONENT_TEAM',
      );
    base.combat.resolve(first.data, 1, side, a);
    tuned.combat.resolve(second.data, 1, side, b);
    const damages = (state) =>
      state.data.events
        .filter((value) => value.type === 'DAMAGE' && value.source === side)
        .reduce((sum, value) => sum + value.values.damage, 0);
    assert.ok(damages(second) > damages(first));
  }
  const first = await started(base);
  const second = await started(tuned);
  const a = await choose(base, first, 'OFFENSIVE_SPECIAL', {
    actorId: 'doctor-strange',
    targetId: 'DOOM',
  });
  const b = await choose(tuned, second, 'OFFENSIVE_SPECIAL', {
    actorId: 'doctor-strange',
    targetId: 'DOOM',
  });
  assert.equal(a.data.doom.currentEnergy, b.data.doom.currentEnergy);
});

test('rivalry momentum affects the opposing response instead of expiring before it can matter', async () => {
  const t = toolkit();
  const input = setup();
  input.player = {
    teamId: 'captain-america-team',
    activeHeroIds: ['spider-man', 'hulk'],
    benchHeroIds: ['doctor-strange', 'sue-storm', 'wolverine'],
    strategy: S.AGGRESSIVE,
  };
  const state = await started(t, { setup: input, quiet: false });
  const attacker = hero(state, 'hulk');
  const before = t.rules.effectiveStats(state.data.player, attacker).resistance;
  const action = select(t, state, 'OFFENSIVE_SPECIAL', {
    actorId: 'hulk',
    targetId: 'OPPONENT_TEAM',
  });
  t.combat.resolve(state.data, 1, 'PLAYER', action);
  assert.ok(t.rules.effectiveStats(state.data.player, attacker).resistance > before);
  assert.ok(
    state.data.opponent.effects.some(
      (effect) => effect.source === 'RIVALRY' && effect.stat === 'power' && effect.modifier < 0,
    ),
  );
  t.combat.expire(state.data, 1);
  assert.equal(
    state.data.player.effects.some((effect) => effect.source === 'RIVALRY'),
    false,
  );
});
