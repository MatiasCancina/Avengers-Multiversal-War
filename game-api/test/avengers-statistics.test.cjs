const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  AvengersStatisticsService,
} = require('../dist/theme/avengers-doomsday/journey/avengers-statistics.service');
const service = new AvengersStatisticsService();
const row = (teamId, heroId, values = {}) => ({
  teamId,
  heroId,
  eligible: true,
  activeEncounters: 4,
  activeRounds: 12,
  winningActiveRounds: 5,
  damageDealt: 100,
  damageReceived: 100,
  healing: 0,
  kosCaused: 0,
  kosSuffered: 1,
  offensiveSpecialsUsed: 0,
  supportSpecialsUsed: 0,
  statGains: 0,
  journey: {},
  finalStage: {},
  ...values,
});

test('four official global awards use Team plus Hero identity and approved factual metrics', () => {
  const rows = [
    row('team-a', 'shared-hero', { damageDealt: 500, winningActiveRounds: 3 }),
    row('team-b', 'shared-hero', {
      healing: 250,
      kosSuffered: 0,
      activeEncounters: 5,
      winningActiveRounds: 9,
      kosCaused: 2,
      damageDealt: 300,
    }),
    row('team-c', 'hero-c', {
      healing: 100,
      kosSuffered: 0,
      activeEncounters: 4,
      activeRounds: 15,
      damageReceived: 600,
      winningActiveRounds: 9,
      kosCaused: 1,
      damageDealt: 350,
    }),
    row('eliminated', 'hero-x', {
      eligible: false,
      damageDealt: 9999,
      healing: 9999,
      winningActiveRounds: 99,
    }),
  ];
  const awards = service.awards(rows);
  assert.deepEqual(
    awards.map((value) => value.code),
    ['MIGHTIEST_HERO', 'BEST_SUPPORT', 'MOST_RESILIENT', 'JOURNEY_MVP'],
  );
  assert.deepEqual(awards[0].winner, { teamId: 'team-a', heroId: 'shared-hero' });
  assert.deepEqual(awards[1].winner, { teamId: 'team-b', heroId: 'shared-hero' });
  assert.deepEqual(awards[2].winner, { teamId: 'team-c', heroId: 'hero-c' });
  assert.deepEqual(awards[3].winner, { teamId: 'team-b', heroId: 'shared-hero' });
  assert.notDeepEqual(awards[0].winner, awards[3].winner);
});

test('Best Support has no winner when every eligible Hero has zero attributable Healing', () => {
  const awards = service.awards([
    row('a', 'one'),
    row('b', 'two'),
    row('x', 'three', { eligible: false, healing: 100 }),
  ]);
  assert.equal(awards.find((value) => value.code === 'BEST_SUPPORT').winner, null);
});

test('Most Resilient excludes zero-active Heroes and applies KO rate then approved tie-break order', () => {
  const rows = [
    row('a', 'bench', { activeEncounters: 0, activeRounds: 0, kosSuffered: 0 }),
    row('b', 'two-of-ten', {
      activeEncounters: 10,
      kosSuffered: 2,
      activeRounds: 20,
      damageReceived: 500,
    }),
    row('c', 'one-of-five', {
      activeEncounters: 5,
      kosSuffered: 1,
      activeRounds: 30,
      damageReceived: 800,
    }),
    row('d', 'one-of-five-less-active', {
      activeEncounters: 5,
      kosSuffered: 1,
      activeRounds: 25,
      damageReceived: 900,
    }),
  ];
  assert.deepEqual(service.awards(rows).find((value) => value.code === 'MOST_RESILIENT').winner, {
    teamId: 'c',
    heroId: 'one-of-five',
  });
});

test('Journey MVP uses Winning Active Rounds then KOs, Damage and stable identity', () => {
  const rows = [
    row('a', 'hero-a', { winningActiveRounds: 8, kosCaused: 1, damageDealt: 100 }),
    row('b', 'hero-b', { winningActiveRounds: 8, kosCaused: 2, damageDealt: 50 }),
    row('c', 'hero-c', { winningActiveRounds: 7, kosCaused: 99, damageDealt: 999 }),
  ];
  assert.deepEqual(service.awards(rows).find((value) => value.code === 'JOURNEY_MVP').winner, {
    teamId: 'b',
    heroId: 'hero-b',
  });
});
