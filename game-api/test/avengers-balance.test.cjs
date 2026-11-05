const assert = require('node:assert/strict');
const { test } = require('node:test');
const { AvengersBalanceSimulation } = require('../dist/theme/avengers-doomsday/balance-simulation');

test('balance cohorts are reproducible, complete, and conserve action/outcome accounting', async () => {
  const first = await new AvengersBalanceSimulation().run(2, 1000);
  const second = await new AvengersBalanceSimulation().run(2, 1000);
  assert.deepEqual(first, second);
  assert.equal(first.rows.length, 18);
  for (const row of first.rows) {
    const m = row.metrics;
    assert.equal(m.victories + m.defeats, row.battles);
    assert.ok(m.turns >= 0);
    assert.equal(m.actOneDefeats + m.revealReached, row.battles);
    assert.ok(m.actOneCycles <= row.battles * 4);
    assert.equal(m.actTwoVictories + m.actTwoDefeats, m.revealReached);
    assert.equal(m.actTwoCycles, m.turns - m.actOneCycles);
    assert.ok(m.maximumObservedTurns >= 4);
    assert.ok(m.finalAttacks <= row.battles);
    assert.equal(
      m.playerActions,
      m.basicAttacks + m.specials + m.teamActions + m.leaderAbilities + m.powerUps,
    );
    assert.ok(Object.values(m).every((value) => Number.isFinite(value) && value >= 0));
  }
});
