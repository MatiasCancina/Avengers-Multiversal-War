INSERT INTO "team_profiles" ("id", "name", "description", "themeId") VALUES
  ('team-alpha', 'Team Alpha', 'A sample team from Theme A.', 'theme-a'),
  ('team-beta', 'Team Beta', 'Another sample team from Theme A.', 'theme-a')
ON CONFLICT("id") DO NOTHING;
