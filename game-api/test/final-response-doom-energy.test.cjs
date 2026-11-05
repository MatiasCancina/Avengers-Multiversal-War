const assert = require('node:assert/strict');
const { test } = require('node:test');
const { toolkit, started, ControlledRandom } = require('./avengers-fixtures.cjs');

async function finalResponseContext(doomEnergy = 750) {
  const tool = toolkit({ random: new ControlledRandom(0) });
  const state = await started(tool, { quiet: false });
  state.data.phase = 'FINAL_ATTACK';
  state.data.finalAttackInitiator = 'DOOM';
  state.data.doom.currentEnergy = doomEnergy;
  state.data.doom.threatLevel = 'CRITICAL';
  tool.actions.refresh(state.data, state.turn);
  const action = state.data.availableActions.find(
    (candidate) =>
      candidate.type === 'BASIC_ATTACK' &&
      candidate.actorId === 'spider-man' &&
      candidate.targetId === 'DOOM',
  );
  assert.ok(action, 'the controlled Final Response action is available');
  return { tool, state, action };
}

test('Doom Energy contributes continuously to Final Response probability', async () => {
  const samples = [
    { label: '100%', energy: 750, expected: 0.34406 },
    { label: 'about 75%', energy: 563, expected: 0.393927 },
    { label: '50%', energy: 375, expected: 0.44406 },
    { label: 'about 25%', energy: 188, expected: 0.493927 },
    { label: '10%', energy: 75, expected: 0.52406 },
    { label: 'near 0%', energy: 1, expected: 0.543793 },
  ];
  const probabilities = [];

  for (const sample of samples) {
    const { tool, state, action } = await finalResponseContext(sample.energy);
    const probability = tool.engine.finalResponseChance(state.data, action);
    probabilities.push(probability);
    assert.ok(
      Math.abs(probability - sample.expected) < 1e-6,
      `${sample.label} Doom Energy should yield ${sample.expected}, received ${probability}`,
    );
  }

  assert.deepEqual(
    probabilities,
    [...probabilities].sort((left, right) => left - right),
  );
  for (let index = 1; index < probabilities.length; index++) {
    assert.ok(probabilities[index] > probabilities[index - 1]);
  }
});

test('Final Response retains its action bonuses and final probability clamps', async () => {
  const { tool, state, action } = await finalResponseContext(375);
  const basic = tool.engine.finalResponseChance(state.data, action);
  const bonuses = {
    BASIC_ATTACK: 0,
    OFFENSIVE_SPECIAL: 0.09,
    SUPPORT_SPECIAL: 0.06,
    LEADER_ABILITY: 0.16,
    TEAM_ACTION: 0.13,
    POWER_UP: 0.1,
    SWAP: 0,
    CHANGE_STRATEGY: 0,
    SUE_STORM_APPEAL: 0,
  };

  for (const [type, bonus] of Object.entries(bonuses)) {
    const actual = tool.engine.finalResponseChance(state.data, { type });
    assert.ok(Math.abs(actual - (basic + bonus)) < 1e-12, `${type} keeps its current action bonus`);
  }

  tool.combat.averageStats = () => ({
    power: -10000,
    ability: -10000,
    agility: -10000,
    resistance: -10000,
  });
  assert.equal(tool.engine.finalResponseChance(state.data, action), 0.1);
  tool.combat.averageStats = () => ({
    power: 10000,
    ability: 10000,
    agility: 10000,
    resistance: 10000,
  });
  assert.equal(tool.engine.finalResponseChance(state.data, action), 0.9);
});

test('Final Response probability calculation is deterministic and consumes no RNG draw', async () => {
  const { tool, state, action } = await finalResponseContext(188);
  let draws = 0;
  const next = tool.random.next.bind(tool.random);
  tool.random.next = (data) => {
    draws++;
    return next(data);
  };

  const first = tool.engine.finalResponseChance(state.data, action);
  const second = tool.engine.finalResponseChance(state.data, action);
  assert.equal(first, second);
  assert.equal(draws, 0);
});

test('resolving a deterministic Final Response still performs only its existing single outcome draw', async () => {
  const { tool, state } = await finalResponseContext(375);
  state.data.availableActions = state.data.availableActions.filter(
    (action) => action.type === 'SUPPORT_SPECIAL' && action.actorId === 'spider-man',
  );
  const action = state.data.availableActions[0];
  assert.ok(action, 'the support action is available for the deterministic draw check');

  let draws = 0;
  const next = tool.random.next.bind(tool.random);
  tool.random.next = (data) => {
    draws++;
    return next(data);
  };
  const result = await tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });

  assert.equal(draws, 1);
  assert.equal(result.status, 'COMPLETED');
});

test('200 deterministic Final Response executions track probability across Doom Energy bands', async () => {
  const levels = [
    { label: '100%', energy: 750 },
    { label: '~75%', energy: 563 },
    { label: '50%', energy: 375 },
    { label: '~25%', energy: 188 },
    { label: '10%', energy: 75 },
    { label: '~0%', energy: 1 },
  ];
  const counts = levels.map((_, index) => Math.ceil((200 - index) / levels.length));
  const results = levels.map((level) => ({
    ...level,
    count: 0,
    wins: 0,
    probabilityTotal: 0,
    clamps: 0,
    actionTypes: new Set(),
  }));

  for (let run = 0; run < 200; run++) {
    const bandIndex = run % levels.length;
    const band = results[bandIndex];
    const ordinal = Math.floor(run / levels.length);
    const controlledDraw = (ordinal + 0.5) / counts[bandIndex];
    const tool = toolkit({ random: new ControlledRandom(controlledDraw) });
    const state = await started(tool, { quiet: false });
    state.data.phase = 'FINAL_ATTACK';
    state.data.finalAttackInitiator = 'DOOM';
    state.data.doom.currentEnergy = band.energy;
    state.data.doom.threatLevel = 'CRITICAL';
    tool.actions.refresh(state.data, state.turn);
    const action = state.data.availableActions.find(
      (candidate) =>
        candidate.type === 'SUPPORT_SPECIAL' &&
        candidate.actorId === 'spider-man' &&
        candidate.targetId === 'OWN_TEAM',
    );
    assert.ok(action, `run ${run + 1} exposes the same legal support response`);
    const probability = tool.engine.finalResponseChance(state.data, action);
    let draws = 0;
    const next = tool.random.next.bind(tool.random);
    tool.random.next = (data) => {
      draws++;
      return next(data);
    };

    const final = await tool.engine.play({
      current: state,
      command: { type: 'CHOOSE_ACTION', actionId: action.id },
    });
    const expectedSuccess = controlledDraw < probability;
    assert.equal(draws, 1, `run ${run + 1} uses exactly one outcome draw`);
    assert.equal(final.status, 'COMPLETED');
    assert.equal(final.data.outcome === 'VICTORY', expectedSuccess);

    band.count++;
    band.wins += Number(expectedSuccess);
    band.probabilityTotal += probability;
    band.clamps += Number(probability === 0.1 || probability === 0.9);
    band.actionTypes.add(action.type);
  }

  const report = results.map((band) => {
    const meanProbability = band.probabilityTotal / band.count;
    const observedRate = band.wins / band.count;
    assert.ok(
      Math.abs(observedRate - meanProbability) <= 1 / band.count,
      `${band.label} controlled outcomes agree with the calculated threshold`,
    );
    return {
      doomEnergy: band.label,
      runs: band.count,
      meanProbability: Number(meanProbability.toFixed(6)),
      successes: band.wins,
      failures: band.count - band.wins,
      observedRate: Number(observedRate.toFixed(6)),
      clampUses: band.clamps,
      actionTypes: [...band.actionTypes],
    };
  });

  console.log('Deterministic 200-run Final Response matrix:', JSON.stringify(report));
});
