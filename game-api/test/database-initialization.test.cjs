const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');
const { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const apiRoot = resolve(__dirname, '..');
let directory;
let fixtureRoot;
let fixtureScript;

function initialize(database, theme = 'sample') {
  execFileSync('bash', [join(apiRoot, 'scripts/init-database.sh'), database, theme]);
}

function query(database, sql) {
  return execFileSync('sqlite3', [database, sql], { encoding: 'utf8' }).trim();
}

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'game-api-initialization-'));
  fixtureRoot = join(directory, 'isolated api');
  await mkdir(join(fixtureRoot, 'scripts/themes/sample'), { recursive: true });
  for (const file of [
    'init-database.sh',
    'init-schema.sql',
    'seed-common-data.sql',
    'themes/sample/seed-theme-data.sql',
  ]) {
    await copyFile(join(apiRoot, 'scripts', file), join(fixtureRoot, 'scripts', file));
  }
  await symlink(join(apiRoot, 'node_modules'), join(fixtureRoot, 'node_modules'), 'dir');
  fixtureScript = join(fixtureRoot, 'scripts/init-database.sh');
});

after(async () => {
  if (directory) {
    await rm(directory, { recursive: true, force: true });
  }
});

test('external preparation creates the exact entity schema before TypeORM connects', async () => {
  require('reflect-metadata');
  const { DataSource } = require('typeorm');
  const { TeamProfileEntity } = require('../dist/teams/entity/team-profile.entity');
  const database = join(directory, 'fresh/nested/test.sqlite');
  initialize(database);
  assert.equal(query(database, 'SELECT COUNT(*) FROM team_profiles;'), '2');

  const source = new DataSource({
    type: 'sqlite',
    database,
    entities: [TeamProfileEntity],
    synchronize: false,
  });
  await source.initialize();
  try {
    const schemaChanges = await source.driver.createSchemaBuilder().log();
    assert.deepEqual(schemaChanges.upQueries, []);
    const profile = await source.getRepository(TeamProfileEntity).findOneBy({ id: 'team-alpha' });
    assert.equal(profile.id, 'team-alpha');
    assert.equal(profile.name, 'Team Alpha');
    assert.equal(profile.description, 'A sample team from Theme A.');
    assert.equal(profile.themeId, 'theme-a');
    assert.equal(profile.configurationRevision, 0);
    assert.equal(profile.contextRevision, 0);
    assert.equal(profile.currentAttemptId, null);
    assert.equal(profile.metadata, null);
    assert.ok(profile.createdAt instanceof Date);
    assert.ok(profile.updatedAt instanceof Date);
  } finally {
    await source.destroy();
  }
});

test('repeated preparation inserts only missing profiles and preserves modified records', () => {
  const database = join(directory, 'repeat.sqlite');
  initialize(database);
  query(
    database,
    "UPDATE team_profiles SET name = 'Edited Alpha' WHERE id = 'team-alpha'; DELETE FROM team_profiles WHERE id = 'team-beta';",
  );
  initialize(database);
  initialize(database);
  assert.equal(query(database, 'SELECT COUNT(*) FROM team_profiles;'), '2');
  assert.equal(
    query(database, "SELECT name FROM team_profiles WHERE id = 'team-alpha';"),
    'Edited Alpha',
  );
  assert.equal(
    query(database, "SELECT name FROM team_profiles WHERE id = 'team-beta';"),
    'Team Beta',
  );
});

test('settings use argument, process environment, dotenv, and default precedence with API-root paths', async () => {
  const environment = { ...process.env };
  delete environment.DB_DATABASE;
  delete environment.DB_SEED_THEME;
  execFileSync('bash', [fixtureScript], { cwd: directory, env: environment });
  assert.equal(
    query(join(fixtureRoot, 'database/game-api.sqlite'), 'SELECT COUNT(*) FROM team_profiles;'),
    '2',
  );

  await writeFile(
    join(fixtureRoot, '.env'),
    'DB_DATABASE="database/quoted # path.sqlite"\nDB_SEED_THEME=sample\n',
  );
  execFileSync('bash', [fixtureScript], { cwd: directory, env: environment });
  assert.equal(
    query(
      join(fixtureRoot, 'database/quoted # path.sqlite'),
      'SELECT COUNT(*) FROM team_profiles;',
    ),
    '2',
  );

  execFileSync('bash', [fixtureScript], {
    cwd: directory,
    env: { ...environment, DB_DATABASE: 'database/environment.sqlite', DB_SEED_THEME: 'sample' },
  });
  assert.equal(
    query(join(fixtureRoot, 'database/environment.sqlite'), 'SELECT COUNT(*) FROM team_profiles;'),
    '2',
  );

  execFileSync('bash', [fixtureScript, 'database/argument.sqlite', 'sample'], {
    cwd: directory,
    env: {
      ...environment,
      DB_DATABASE: join(directory, 'must-not-exist.sqlite'),
      DB_SEED_THEME: 'missing',
    },
  });
  assert.equal(
    query(join(fixtureRoot, 'database/argument.sqlite'), 'SELECT COUNT(*) FROM team_profiles;'),
    '2',
  );
  assert.equal(existsSync(join(directory, 'must-not-exist.sqlite')), false);
});

test('dotenv values remain literal data and are never executed by the shell', async () => {
  const sentinel = join(directory, 'must-not-be-created');
  await writeFile(
    join(fixtureRoot, '.env'),
    `DB_DATABASE='database/$(touch "${sentinel}").sqlite'\nDB_SEED_THEME=sample\n`,
  );
  const environment = { ...process.env };
  delete environment.DB_DATABASE;
  delete environment.DB_SEED_THEME;
  execFileSync('bash', [fixtureScript], { env: environment });
  assert.equal(existsSync(sentinel), false);
  const literalPath = join(fixtureRoot, `database/$(touch "${sentinel}").sqlite`);
  assert.equal(query(literalPath, 'SELECT COUNT(*) FROM team_profiles;'), '2');
});

test('unknown themes, path traversal, and in-memory initialization fail without creating a target database', () => {
  const database = join(directory, 'invalid.sqlite');
  for (const theme of ['missing', '../sample']) {
    const result = spawnSync('bash', [fixtureScript, database, theme], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing initialization SQL file|lowercase kebab-case/);
    assert.equal(existsSync(database), false);
  }
  const memory = spawnSync('bash', [fixtureScript, ':memory:', 'sample'], { encoding: 'utf8' });
  assert.notEqual(memory.status, 0);
  assert.match(memory.stderr, /file-backed/);
});

test('SQL errors roll back preparation and the npm startup hook prevents application execution', async () => {
  await mkdir(join(fixtureRoot, 'scripts/themes/broken'), { recursive: true });
  await writeFile(
    join(fixtureRoot, 'scripts/themes/broken/seed-theme-data.sql'),
    'INSERT INTO missing_table VALUES (1);\n',
  );
  const database = join(directory, 'broken.sqlite');
  const preparation = spawnSync('bash', [fixtureScript, database, 'broken'], { encoding: 'utf8' });
  assert.notEqual(preparation.status, 0);
  assert.match(preparation.stderr, /missing_table/);
  assert.equal(
    query(database, "SELECT COUNT(*) FROM sqlite_master WHERE name = 'team_profiles';"),
    '0',
  );

  const { scripts } = require('../package.json');
  await writeFile(join(fixtureRoot, 'package.json'), JSON.stringify({ private: true, scripts }));
  await mkdir(join(fixtureRoot, 'dist'));
  const sentinel = join(directory, 'application-must-not-start');
  await writeFile(
    join(fixtureRoot, 'dist/main.js'),
    'require("node:fs").writeFileSync(process.env.STARTUP_SENTINEL, "started");\n',
  );
  const startup = spawnSync('npm', ['run', 'start:prod'], {
    cwd: fixtureRoot,
    env: {
      ...process.env,
      DB_DATABASE: database,
      DB_SEED_THEME: 'broken',
      STARTUP_SENTINEL: sentinel,
    },
    encoding: 'utf8',
  });
  assert.notEqual(startup.status, 0);
  assert.match(startup.stderr, /missing_table/);
  assert.equal(existsSync(sentinel), false);
});
