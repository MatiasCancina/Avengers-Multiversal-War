#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ $# -gt 2 ]]; then
  echo "Usage: bash scripts/init-database.sh [database-file] [theme]" >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "Database initialization requires the sqlite3 command-line tool." >&2
  exit 1
fi

cd "$API_DIR"

# Use the same dotenv parser as Nest without executing environment-file content.
DATABASE_SETTINGS="$(node - "$@" <<'JS'
const { existsSync, readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { parse } = createRequire(require.resolve('@nestjs/config'))('dotenv');
const environment = existsSync('.env') ? parse(readFileSync('.env')) : {};
const database = String(process.argv[2] ?? process.env.DB_DATABASE ?? environment.DB_DATABASE ?? 'database/game-api.sqlite').trim();
const theme = process.argv[3] ?? process.env.DB_SEED_THEME ?? environment.DB_SEED_THEME ?? 'sample';

if (!database || database === ':memory:') {
  throw new Error('Database initialization requires a nonempty file-backed DB_DATABASE; :memory: belongs to a separate connection.');
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(theme)) {
  throw new Error('DB_SEED_THEME must use lowercase kebab-case.');
}
process.stdout.write(`${resolve(database)}\n${theme}`);
JS
)"

DB_FILE="${DATABASE_SETTINGS%$'\n'*}"
SEED_THEME="${DATABASE_SETTINGS##*$'\n'}"
SCHEMA_SQL_FILE="$SCRIPT_DIR/init-schema.sql"
COMMON_SQL_FILE="$SCRIPT_DIR/seed-common-data.sql"
THEME_SQL_FILE="$SCRIPT_DIR/themes/$SEED_THEME/seed-theme-data.sql"

for SQL_FILE in "$SCHEMA_SQL_FILE" "$COMMON_SQL_FILE" "$THEME_SQL_FILE"; do
  if [[ ! -f "$SQL_FILE" ]]; then
    echo "Missing initialization SQL file: $SQL_FILE" >&2
    exit 1
  fi
done

mkdir -p "$(dirname "$DB_FILE")"

# A failed schema or seed statement rolls back the entire preparation operation.
{
  printf '%s\n' 'BEGIN TRANSACTION;'
  cat "$SCHEMA_SQL_FILE" "$COMMON_SQL_FILE" "$THEME_SQL_FILE"
  printf '%s\n' 'COMMIT;'
} | sqlite3 -bail -cmd '.timeout 5000' "$DB_FILE"

echo "Initialized database: $DB_FILE (theme: $SEED_THEME)"
