const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');

const themeDirectory = join(__dirname, '../scripts/themes/avengers-doomsday');
const generator = join(themeDirectory, 'build-seed.cjs');
const seedSql = join(themeDirectory, 'seed-theme-data.sql');
const initDatabase = join(__dirname, '../scripts/init-database.sh');

// Approved assigned-Team defaults; keep this expectation independent of the generator.
const approvedTeams = {
  'spider-man': ['iron-man', 'punisher', 'scarlet-witch', 'doctor-strange', 'spider-woman'],
  'doctor-strange': ['scarlet-witch', 'america-chavez', 'wiccan', 'ghost-rider', 'magik'],
  'captain-america': ['falcon', 'winter-soldier', 'black-widow', 'hawkeye', 'thor'],
  thor: ['sif', 'valkyrie', 'heimdall', 'korg', 'beta-ray-bill'],
  'black-widow': ['hawkeye', 'winter-soldier', 'captain-america', 'falcon', 'spider-woman'],
  wolverine: ['x-23', 'jean-grey', 'storm', 'nightcrawler', 'professor-x'],
  'reed-richards': ['invisible-woman', 'human-torch', 'the-thing', 'moon-girl', 'devil-dinosaur'],
  'iron-man': ['war-machine', 'rescue', 'vision', 'spider-man', 'captain-america'],
  'black-panther': ['shuri', 'okoye', 'mbaku', 'storm', 'captain-america'],
  'captain-marvel': ['monica-rambeau', 'adam-warlock', 'spider-woman', 'war-machine', 'nova'],
  hulk: ['she-hulk', 'thor', 'hercules', 'iron-man', 'doctor-strange'],
  'scarlet-witch': ['vision', 'quicksilver', 'wiccan', 'speed', 'doctor-strange'],
  vision: ['scarlet-witch', 'wonder-man', 'iron-man', 'captain-america', 'wasp'],
  hawkeye: ['black-widow', 'kate-bishop', 'captain-america', 'wasp', 'ant-man'],
  wasp: ['ant-man', 'hawkeye', 'vision', 'ms-marvel', 'she-hulk'],
  'ant-man': ['wasp', 'vision', 'iron-man', 'hawkeye', 'hulk'],
  falcon: ['captain-america', 'winter-soldier', 'black-widow', 'war-machine', 'hawkeye'],
  'winter-soldier': ['captain-america', 'falcon', 'black-widow', 'hawkeye', 'war-machine'],
  elektra: ['daredevil', 'punisher', 'echo', 'iron-fist', 'blade'],
  'spider-woman': ['captain-marvel', 'jessica-jones', 'black-widow', 'hawkeye', 'spider-man'],
  daredevil: ['elektra', 'jessica-jones', 'luke-cage', 'iron-fist', 'punisher'],
  deadpool: ['cable', 'wolverine', 'colossus', 'x-23', 'psylocke'],
  punisher: ['daredevil', 'elektra', 'black-widow', 'winter-soldier', 'ghost-rider'],
  'shang-chi': ['iron-fist', 'luke-cage', 'daredevil', 'spider-man', 'captain-america'],
  storm: ['cyclops', 'wolverine', 'professor-x', 'gambit', 'rogue'],
  cyclops: ['jean-grey', 'storm', 'colossus', 'jubilee', 'rogue'],
  'jean-grey': ['cyclops', 'storm', 'wolverine', 'professor-x', 'iceman'],
  'professor-x': ['cyclops', 'jean-grey', 'storm', 'wolverine', 'beast'],
  'star-lord': ['gamora', 'rocket-raccoon', 'groot', 'drax', 'mantis'],
  'rocket-raccoon': ['groot', 'star-lord', 'gamora', 'drax', 'mantis'],
  gamora: ['star-lord', 'nebula', 'rocket-raccoon', 'groot', 'drax'],
  'human-torch': ['reed-richards', 'invisible-woman', 'the-thing', 'spider-man', 'deadpool'],
};

const approvedRivals = [
  ['spider-man', 'punisher'],
  ['doctor-strange', 'ghost-rider'],
  ['thor', 'hercules'],
  ['wolverine', 'cyclops'],
  ['wolverine', 'hulk'],
  ['wolverine', 'deadpool'],
  ['reed-richards', 'namor'],
  ['black-panther', 'mbaku'],
  ['black-panther', 'namor'],
  ['captain-marvel', 'rogue'],
  ['ms-marvel', 'rogue'],
  ['hulk', 'the-thing'],
  ['vision', 'wonder-man'],
  ['hawkeye', 'deadpool'],
  ['elektra', 'daredevil'],
  ['daredevil', 'punisher'],
  ['deadpool', 'punisher'],
  ['gamora', 'nebula'],
  ['human-torch', 'namor'],
  ['invisible-woman', 'namor'],
  ['shuri', 'namor'],
  ['cable', 'bishop'],
  ['blade', 'ghost-rider'],
  ['luke-cage', 'punisher'],
  ['squirrel-girl', 'deadpool'],
  ['war-machine', 'punisher'],
];
const pairKey = (a, b) => [a, b].sort().join('|');

function query(database, sql) {
  return JSON.parse(
    execFileSync('sqlite3', ['-json', '-readonly', database, sql], { encoding: 'utf8' }),
  );
}

test('generated Avengers seed and fresh database contain all 32 approved ordered assigned Teams', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'avengers-seed-'));
  try {
    const generatedSql = join(directory, 'generated.sql');
    const database = join(directory, 'avengers.sqlite');
    execFileSync(process.execPath, [generator, generatedSql]);
    assert.equal(readFileSync(generatedSql, 'utf8'), readFileSync(seedSql, 'utf8'));
    execFileSync('bash', [initDatabase, database, 'avengers-doomsday']);

    const heroes = query(database, 'SELECT id, eligibility, metadata FROM avengers_heroes;');
    const eligibilityById = new Map(heroes.map(({ id, eligibility }) => [id, eligibility]));
    const relationshipsById = new Map(heroes.map(({ id, metadata }) => [id, JSON.parse(metadata)]));
    const preferredIds = heroes
      .filter(({ eligibility }) => eligibility === 'PREFERRED')
      .map(({ id }) => id)
      .sort();
    const approvedIds = Object.keys(approvedTeams).sort();
    assert.equal(heroes.length, 87);
    assert.equal(approvedIds.length, 32);
    assert.deepEqual(preferredIds, approvedIds);

    assert.equal(approvedRivals.length, 26);
    const approvedPairKeys = new Set();
    const expectedRivalsById = new Map(heroes.map(({ id }) => [id, new Set()]));
    for (const [a, b] of approvedRivals) {
      assert.ok(expectedRivalsById.has(a), `unknown Rival ${a}`);
      assert.ok(expectedRivalsById.has(b), `unknown Rival ${b}`);
      assert.notEqual(a, b, `${a} cannot be its own Rival`);
      const key = pairKey(a, b);
      assert.equal(approvedPairKeys.has(key), false, `duplicate Rival pair ${key}`);
      approvedPairKeys.add(key);
      expectedRivalsById.get(a).add(b);
      expectedRivalsById.get(b).add(a);
    }
    assert.equal(approvedPairKeys.size, 26);
    assert.equal(approvedPairKeys.has(pairKey('captain-america', 'iron-man')), false);
    const generatedPairKeys = new Set();
    let directionalRivalEntries = 0;
    for (const { id } of heroes) {
      const { allies, rivals } = relationshipsById.get(id);
      assert.deepEqual(rivals, [...expectedRivalsById.get(id)].sort(), `${id} Rival dataset`);
      for (const rivalId of rivals) {
        assert.ok(relationshipsById.has(rivalId), `${id}: unknown Rival ${rivalId}`);
        assert.notEqual(rivalId, id, `${id}: self Rival`);
        assert.ok(relationshipsById.get(rivalId).rivals.includes(id), `${id}: asymmetric Rival`);
        assert.equal(allies.includes(rivalId), false, `${id}: both ALLY and RIVAL`);
        generatedPairKeys.add(pairKey(id, rivalId));
        directionalRivalEntries += 1;
      }
    }
    assert.deepEqual([...generatedPairKeys].sort(), [...approvedPairKeys].sort());
    assert.equal(directionalRivalEntries, 52);

    const profiles = query(database, 'SELECT id, metadata FROM team_profiles ORDER BY id;');
    assert.equal(profiles.length, 32);
    assert.deepEqual(
      profiles.map(({ id }) => id),
      approvedIds,
    );
    let companionReferences = 0;
    for (const { id, metadata } of profiles) {
      const { leaderId, companionIds, activeHeroIds } = JSON.parse(metadata);
      const expectedCompanions = approvedTeams[id];
      assert.equal(leaderId, id);
      assert.equal(eligibilityById.get(leaderId), 'PREFERRED');
      assert.deepEqual(companionIds, expectedCompanions, `${id} companion order`);
      assert.equal(companionIds.length, 5);
      assert.equal(new Set(companionIds).size, 5);
      assert.equal(companionIds.includes(leaderId), false);
      for (const companionId of companionIds) {
        assert.ok(eligibilityById.has(companionId), `${id}: unknown ${companionId}`);
        assert.ok(
          ['PREFERRED', 'ELIGIBLE', 'COMPANION_ONLY'].includes(eligibilityById.get(companionId)),
          `${id}: ineligible ${companionId}`,
        );
        companionReferences += 1;
      }
      assert.deepEqual(activeHeroIds, [id, ...expectedCompanions.slice(0, 2)]);
      assert.ok(
        [id, ...companionIds].some((heroId) => relationshipsById.get(heroId).rivals.length > 0),
        `${id} default Team has no Hero with a Rival`,
      );
    }
    assert.equal(companionReferences, 160);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('seed generation rejects missing, extra, malformed, duplicate, self, unknown, and ineligible IDs', async () => {
  const source = readFileSync(generator, 'utf8');
  const firstTeam =
    "  'spider-man': ['iron-man', 'punisher', 'scarlet-witch', 'doctor-strange', 'spider-woman'],";
  assert.ok(source.includes(firstTeam));
  const cases = [
    [
      'missing Leader',
      source.replace(`${firstTeam}\n`, ''),
      /Missing assigned Team definition for PREFERRED Leader spider-man/,
    ],
    [
      'extra Leader',
      source.replace(
        firstTeam,
        `${firstTeam}\n  'not-a-leader': ['iron-man', 'punisher', 'scarlet-witch', 'doctor-strange', 'spider-woman'],`,
      ),
      /Assigned Team Leader not-a-leader does not exist as a PREFERRED Hero/,
    ],
    [
      'four companions',
      source.replace(
        firstTeam,
        "  'spider-man': ['iron-man', 'punisher', 'scarlet-witch', 'doctor-strange'],",
      ),
      /Assigned Team spider-man must have exactly five companions/,
    ],
    [
      'duplicate companion',
      source.replace(
        firstTeam,
        "  'spider-man': ['iron-man', 'punisher', 'iron-man', 'doctor-strange', 'spider-woman'],",
      ),
      /Assigned Team spider-man repeats companion iron-man/,
    ],
    [
      'self companion',
      source.replace(
        firstTeam,
        "  'spider-man': ['iron-man', 'punisher', 'spider-man', 'doctor-strange', 'spider-woman'],",
      ),
      /Assigned Team spider-man cannot include its Leader as a companion/,
    ],
    [
      'unknown companion',
      source.replace(
        firstTeam,
        "  'spider-man': ['iron-man', 'punisher', 'not-a-hero', 'doctor-strange', 'spider-woman'],",
      ),
      /Assigned Team spider-man references unknown companion not-a-hero/,
    ],
    [
      'ineligible companion',
      source.replace(
        'const rosterEligibility = new Map(roster.map(([id, , eligibility]) => [id, eligibility]));',
        "const rosterEligibility = new Map(roster.map(([id, , eligibility]) => [id, id === 'america-chavez' ? 'INELIGIBLE' : eligibility]));",
      ),
      /Assigned Team doctor-strange has ineligible companion america-chavez: INELIGIBLE/,
    ],
  ];
  const directory = await mkdtemp(join(tmpdir(), 'avengers-seed-invalid-'));
  try {
    for (const [label, modifiedSource, expectedError] of cases) {
      assert.notEqual(modifiedSource, source, `${label}: fixture must alter source`);
      const script = join(directory, `${label.replaceAll(' ', '-')}.cjs`);
      const output = join(directory, `${label.replaceAll(' ', '-')}.sql`);
      writeFileSync(script, modifiedSource);
      const result = spawnSync(process.execPath, [script, output], { encoding: 'utf8' });
      assert.notEqual(result.status, 0, `${label}: generator must fail`);
      assert.match(result.stderr, expectedError);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('seed generation rejects invalid Rival pairs and uncovered default Teams', async () => {
  const source = readFileSync(generator, 'utf8');
  const firstRival = "  ['spider-man', 'punisher'],";
  const lastRival = "  ['war-machine', 'punisher'],";
  const starLordTeam = "  'star-lord': ['gamora', 'rocket-raccoon', 'groot', 'drax', 'mantis'],";
  for (const text of [firstRival, lastRival, starLordTeam]) {
    assert.ok(source.includes(text));
  }
  const cases = [
    [
      'missing Rival pair',
      source.replace(`${lastRival}\n`, ''),
      /Expected 26 unique RIVAL pairs, found 25/,
    ],
    [
      'duplicate unordered Rival pair',
      source.replace(lastRival, "  ['punisher', 'spider-man'],"),
      /Duplicate unordered RIVAL pair punisher\/spider-man/,
    ],
    [
      'self Rival',
      source.replace(lastRival, "  ['spider-man', 'spider-man'],"),
      /Hero spider-man cannot be its own RIVAL/,
    ],
    [
      'unknown Rival',
      source.replace(lastRival, "  ['not-a-hero', 'punisher'],"),
      /RIVAL pair not-a-hero\/punisher references a Hero outside the public roster/,
    ],
    [
      'uncovered Team',
      source.replace(
        starLordTeam,
        "  'star-lord': ['nova', 'rocket-raccoon', 'groot', 'drax', 'mantis'],",
      ),
      /Assigned Team star-lord has no Hero with a RIVAL/,
    ],
  ];
  const directory = await mkdtemp(join(tmpdir(), 'avengers-rivals-invalid-'));
  try {
    for (const [label, modifiedSource, expectedError] of cases) {
      assert.notEqual(modifiedSource, source, `${label}: fixture must alter source`);
      const filename = label.replaceAll(' ', '-');
      const script = join(directory, `${filename}.cjs`);
      writeFileSync(script, modifiedSource);
      const result = spawnSync(process.execPath, [script, join(directory, `${filename}.sql`)], {
        encoding: 'utf8',
      });
      assert.notEqual(result.status, 0, `${label}: generator must fail`);
      assert.match(result.stderr, expectedError);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
