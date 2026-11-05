CREATE TABLE IF NOT EXISTS "team_profiles" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "description" text NOT NULL,
  "themeId" varchar(64) NOT NULL,
  "configurationRevision" integer NOT NULL DEFAULT 0,
  "contextRevision" integer NOT NULL DEFAULT 0,
  "currentAttemptId" varchar(64),
  "metadata" text,
  "createdAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "avengers_heroes" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "themeId" varchar(64) NOT NULL,
  "displayName" varchar NOT NULL,
  "eligibility" varchar(32) NOT NULL,
  "archetype" varchar(32) NOT NULL,
  "portrait" text NOT NULL,
  "contentVersion" varchar(64) NOT NULL,
  "metadata" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_avengers_heroes_theme_eligibility"
  ON "avengers_heroes" ("themeId", "eligibility");

CREATE TABLE IF NOT EXISTS "avengers_narrative_characters" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "themeId" varchar(64) NOT NULL,
  "displayName" varchar NOT NULL,
  "portrait" text NOT NULL,
  "contentVersion" varchar(64) NOT NULL,
  "metadata" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "journey_attempts" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "teamId" varchar(64) NOT NULL,
  "themeId" varchar(64) NOT NULL,
  "status" varchar(32) NOT NULL,
  "revision" integer NOT NULL DEFAULT 0,
  "metadata" text NOT NULL,
  "createdAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" datetime
);

CREATE INDEX IF NOT EXISTS "idx_journey_attempts_team_status_completed"
  ON "journey_attempts" ("teamId", "status", "completedAt");
