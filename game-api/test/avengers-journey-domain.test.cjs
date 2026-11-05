const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { execFileSync } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

let app;
let directory;
let simulator;
let generator;
let encounters;
let catalog;
let heroes;
let narrative;
let configuration;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'avengers-domain-'));
  process.env.DB_DATABASE = join(directory, 'domain.sqlite');
  process.env.DB_SEED_THEME = 'avengers-doomsday';
  process.env.FINAL_BATTLE_DIFFICULTY = 'EASY';
  process.env.FINAL_BATTLE_DIFFICULTY_CUSTOM = 'false';
  execFileSync('bash', [
    join(__dirname, '../scripts/init-database.sh'),
    process.env.DB_DATABASE,
    'avengers-doomsday',
  ]);
  require('reflect-metadata');
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../dist/app.module');
  const {
    AvengersJourneySimulator,
  } = require('../dist/theme/avengers-doomsday/journey/avengers-journey-simulator.service');
  const {
    AvengersTournamentGenerator,
  } = require('../dist/theme/avengers-doomsday/journey/avengers-tournament-generator.service');
  const {
    AvengersEncounterSimulator,
  } = require('../dist/theme/avengers-doomsday/journey/avengers-encounter-simulator.service');
  const {
    AvengersCatalogQueryService,
  } = require('../dist/theme/avengers-doomsday/catalog/avengers-catalog-query.service');
  const { TeamProfileRepository } = require('../dist/teams/repository/team-profile.repository');
  app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  simulator = app.get(AvengersJourneySimulator);
  generator = app.get(AvengersTournamentGenerator);
  encounters = app.get(AvengersEncounterSimulator);
  catalog = app.get(AvengersCatalogQueryService);
  heroes = await catalog.definitions();
  narrative = await catalog.narrativeCharacters();
  configuration = (await app.get(TeamProfileRepository).findEntity('spider-man')).metadata;
});
after(async () => {
  if (app) {
    await app.close();
  }
  if (directory) {
    await rm(directory, { recursive: true, force: true });
  }
});

const simulate = (seed, spendingStrategy = 'SAVE') =>
  simulator.simulate({
    teamId: 'spider-man',
    configuration,
    heroes,
    narrativeCharacters: narrative,
    seed,
    spendingStrategy,
  });

test('P03 excludes all six Player Heroes and uses unique PREFERRED then ELIGIBLE generated Leaders', () => {
  const state = { value: 12345 };
  const generated = generator.generate('spider-man', configuration, heroes, state);
  const playerIds = new Set([configuration.leaderId, ...configuration.companionIds]);
  const opponents = generated.teams.filter((value) => value.id !== 'spider-man');
  assert.equal(opponents.length, 31);
  assert.equal(new Set(opponents.map((value) => value.leaderId)).size, 31);
  assert.ok(
    opponents.every((team) => team.heroIds.length === 6 && new Set(team.heroIds).size === 6),
  );
  assert.ok(opponents.every((team) => team.heroIds.every((id) => !playerIds.has(id))));
  const byId = new Map(heroes.map((value) => [value.id, value]));
  const eligibility = opponents.map((team) => byId.get(team.leaderId).eligibility);
  assert.equal(eligibility.filter((value) => value === 'COMPANION_ONLY').length, 0);
  assert.ok(eligibility.indexOf('ELIGIBLE') >= 0);
  assert.ok(
    eligibility.slice(eligibility.indexOf('ELIGIBLE')).every((value) => value === 'ELIGIBLE'),
  );
});

test('G2 uses seeded FLOOR-selected PLAYER_WIN rounds and every Player knockout result is authoritative WIN', () => {
  const first = simulate(42);
  const second = simulate(42);
  const playerEncounters = first.encounters.filter((value) =>
    [value.teamAId, value.teamBId].includes('spider-man'),
  );
  const repeated = second.encounters.filter((value) =>
    [value.teamAId, value.teamBId].includes('spider-man'),
  );
  assert.deepEqual(
    playerEncounters.map((value) => value.rounds.map((round) => round.mode)),
    repeated.map((value) => value.rounds.map((round) => round.mode)),
  );
  for (const encounter of playerEncounters) {
    const indexes = encounter.rounds
      .filter((round) => round.mode === 'PLAYER_WIN')
      .map((round) => round.round);
    assert.equal(new Set(indexes).size, indexes.length);
    if (encounter.rounds.length === 4) {
      assert.equal(indexes.length, 2);
    } // floor(4 * [0.50, 0.60]) is always 2.
    for (const round of encounter.rounds.filter((value) => value.mode === 'PLAYER_WIN')) {
      assert.ok(round.winnerTeamId === 'spider-man' || encounter.resolution === 'TOTAL_KO');
    }
    if (encounter.stageType !== 'GROUP_STAGE') {
      assert.equal(encounter.resultByTeam['spider-man'], 'WIN');
    }
  }
  const groupStage = first.stages.find(
    (value) =>
      value.type === 'GROUP_STAGE' && value.standings.some((row) => row.teamId === 'spider-man'),
  );
  assert.ok(groupStage.standings.find((row) => row.teamId === 'spider-man').qualified);
});

test('G1 SAVE only auto-spends on Revive while BALANCED and AGGRESSIVE remain deterministic distinct policies', () => {
  const save = simulate(1000, 'SAVE');
  const balanced = simulate(1000, 'BALANCED');
  const aggressive = simulate(1000, 'AGGRESSIVE');
  const autoItems = save.events
    .filter((value) => value.type === 'AUTO_PURCHASE_USE' && value.teamId === 'spider-man')
    .map((value) => value.values.itemId);
  assert.ok(autoItems.every((value) => value === 'revive'));
  const spent = (data) =>
    -data.rewardLedger
      .filter((value) => value.teamId === 'spider-man' && value.amount < 0)
      .reduce((sum, value) => sum + value.amount, 0);
  assert.ok(spent(aggressive) >= spent(balanced));
  assert.ok(spent(balanced) >= spent(save));
  const again = simulate(1000, 'AGGRESSIVE');
  assert.deepEqual(aggressive.rewardLedger, again.rewardLedger);
  assert.deepEqual(aggressive.teams, again.teams);
});

test('G3 AI showdown uses real Specials, one-side forfeit, or one seeded verdict without inventing AP', () => {
  const content = new Map(heroes.map((value) => [value.id, value]));
  const base = generator
    .generate('spider-man', configuration, heroes, { value: 77 })
    .teams.filter((value) => value.id !== 'spider-man')
    .slice(0, 2);
  const input = (a, b, seed) => ({
    id: 'showdown',
    stageId: 'qf',
    stageType: 'QUARTERFINAL',
    groupId: null,
    teamA: a,
    teamB: b,
    catalog: content,
    random: { value: seed },
    playerTeamId: 'spider-man',
    knockout: true,
  });
  let a = structuredClone(base[0]);
  let b = structuredClone(base[1]);
  const both = encounters.aiShowdown(input(a, b, 1));
  assert.ok(['SPECIAL_SHOWDOWN', 'TECHNICAL_VERDICT'].includes(both.resolution));
  a = structuredClone(base[0]);
  b = structuredClone(base[1]);
  b.heroes.forEach((value) => (value.currentAbilityPoints = 0));
  const before = b.heroes.map((value) => value.currentAbilityPoints);
  const forfeit = encounters.aiShowdown(input(a, b, 2));
  assert.equal(forfeit.resolution, 'SHOWDOWN_FORFEIT');
  assert.deepEqual(
    b.heroes.map((value) => value.currentAbilityPoints),
    before,
  );
  a = structuredClone(base[0]);
  b = structuredClone(base[1]);
  a.heroes.forEach((value) => (value.currentAbilityPoints = 0));
  b.heroes.forEach((value) => (value.currentAbilityPoints = 0));
  const verdictA = encounters.aiShowdown(input(a, b, 3));
  a = structuredClone(base[0]);
  b = structuredClone(base[1]);
  a.heroes.forEach((value) => (value.currentAbilityPoints = 0));
  b.heroes.forEach((value) => (value.currentAbilityPoints = 0));
  const verdictB = encounters.aiShowdown(input(a, b, 3));
  assert.equal(verdictA.resolution, 'TECHNICAL_VERDICT');
  assert.equal(verdictA.winnerTeamId, verdictB.winnerTeamId);
});

test('P07 accepts any positive round count without an artificial maximum', () => {
  const {
    AvengersJourneyConfig,
  } = require('../dist/theme/avengers-doomsday/journey/avengers-journey-config.service');
  const config = (values) => ({ get: (key) => values[key] });
  assert.equal(
    new AvengersJourneyConfig(config({ JOURNEY_ENCOUNTER_MAX_ROUNDS: 100 })).balance
      .encounterMaxRounds,
    100,
  );
  assert.throws(
    () => new AvengersJourneyConfig(config({ JOURNEY_ENCOUNTER_MAX_ROUNDS: 0 })),
    /JOURNEY_ENCOUNTER_MAX_ROUNDS/,
  );
});

test('typed metadata mapper rejects malformed state and unsupported versions', () => {
  const {
    AvengersJourneyMetadataMapper,
  } = require('../dist/theme/avengers-doomsday/journey/mapper/avengers-journey-metadata.mapper');
  const mapper = new AvengersJourneyMetadataMapper();
  const valid = simulate(2026);
  assert.deepEqual(mapper.fromStorage(mapper.toStorage(valid)), valid);
  assert.throws(
    () => mapper.fromStorage({ ...valid, finalStage: null }),
    /FinalStage state is invalid/,
  );
  assert.throws(
    () => mapper.fromStorage({ ...valid, teams: [{ id: 'broken' }] }),
    /tournament state is invalid/,
  );
  assert.throws(
    () =>
      mapper.fromStorage({ ...valid, versions: { ...valid.versions, metadataVersion: 'future' } }),
    /Unsupported Avengers Journey metadata version/,
  );
});
test('Journey captures difficulty and legacy metadata keeps the original unscaled damage behavior', () => {
  const {
    AvengersJourneyMetadataMapper,
  } = require('../dist/theme/avengers-doomsday/journey/mapper/avengers-journey-metadata.mapper');
  const mapper = new AvengersJourneyMetadataMapper();
  const journey = simulate(7026);
  assert.equal(journey.finalStage.data.difficultyProfile.preset, 'EASY');
  assert.equal(journey.finalStage.data.difficultyProfile.opponentHeroDamageToPlayerMultiplier, 0.1);

  const legacy = structuredClone(journey);
  legacy.versions.metadataVersion = 'avengers-journey-metadata-v1';
  legacy.content.powerUps = legacy.content.powerUps.filter((item) => !item.id.endsWith('-all'));
  delete legacy.terminalReasonCode;
  delete legacy.finalStage.data.terminalReasonCode;
  delete legacy.finalStage.data.difficultyProfile;
  for (const item of legacy.finalStage.data.inventory) {
    delete item.target;
  }
  const migrated = mapper.fromStorage(legacy);
  assert.equal(migrated.versions.metadataVersion, 'avengers-journey-metadata-v2');
  assert.equal(migrated.finalStage.data.difficultyProfile.preset, 'LEGACY');
  assert.equal(migrated.finalStage.data.difficultyProfile.opponentHeroDamageToPlayerMultiplier, 1);
  assert.ok(
    migrated.finalStage.data.inventory.every((item) => ['HERO', 'TEAM'].includes(item.target)),
  );
  assert.ok(migrated.content.powerUps.some((item) => item.id === 'ap-major-all'));
});
