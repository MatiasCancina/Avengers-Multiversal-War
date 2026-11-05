const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  resolveFinalBattleDifficulty,
} = require('../dist/theme/avengers-doomsday/model/final-battle-difficulty-profile.model');
const { validateEnvironment } = require('../dist/config/environment');

test('difficulty presets resolve once to the approved opponent damage multipliers', () => {
  assert.deepEqual(
    ['EASY', 'NORMAL', 'HARD'].map(
      (preset) =>
        resolveFinalBattleDifficulty({ FINAL_BATTLE_DIFFICULTY: preset })
          .opponentHeroDamageToPlayerMultiplier,
    ),
    [0.1, 0.5, 1],
  );
  assert.equal(resolveFinalBattleDifficulty({}).preset, 'EASY');
  assert.equal(resolveFinalBattleDifficulty({}).opponentHeroDamageToPlayerMultiplier, 0.1);
  assert.equal(
    resolveFinalBattleDifficulty({
      FINAL_BATTLE_DIFFICULTY: 'HARD',
      FINAL_BATTLE_DIFFICULTY_CUSTOM: 'false',
      FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT: '0.4',
    }).opponentHeroDamageToPlayerMultiplier,
    1,
  );
  assert.equal(
    resolveFinalBattleDifficulty({
      FINAL_BATTLE_DIFFICULTY: 'HARD',
      FINAL_BATTLE_DIFFICULTY_CUSTOM: 'true',
      FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT: '0.40',
    }).opponentHeroDamageToPlayerMultiplier,
    0.4,
  );
  for (const customPercent of ['0.10', '1.00']) {
    assert.equal(
      resolveFinalBattleDifficulty({
        FINAL_BATTLE_DIFFICULTY_CUSTOM: 'true',
        FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT: customPercent,
      }).customPercent,
      Number(customPercent),
    );
  }
});

test('difficulty configuration rejects invalid presets and malformed custom settings', () => {
  assert.throws(
    () => validateEnvironment({ FINAL_BATTLE_DIFFICULTY: 'MEDIUM' }),
    /EASY, NORMAL, or HARD/,
  );
  for (const customPercent of [undefined, 'NaN', 'oops', '0.09', '1.01']) {
    assert.throws(
      () =>
        validateEnvironment({
          FINAL_BATTLE_DIFFICULTY_CUSTOM: 'true',
          ...(customPercent === undefined
            ? {}
            : { FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT: customPercent }),
        }),
      /FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT/,
    );
  }
  assert.throws(
    () => validateEnvironment({ FINAL_BATTLE_DIFFICULTY_CUSTOM: 'sometimes' }),
    /FINAL_BATTLE_DIFFICULTY_CUSTOM must be true or false/,
  );
});
