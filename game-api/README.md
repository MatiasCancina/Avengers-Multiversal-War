# Avengers: Doomsday Game API

Authoritative NestJS Game API for the Programacion III final project. It owns the Avengers production catalog, Team configuration, synchronous Journey simulation, Store, progression and recovery, the interactive two-act FinalStage, durable lifecycle state, History, statistics, official awards, localized structured events, and every gameplay validation.

The BFF may compose these resources for screens. It does not persist state or calculate game rules. Angular never calls this API directly.

## Requirements and startup

- Node.js 20.19 or newer
- npm
- Bash
- the `sqlite3` command-line client

```bash
cd course/tp_architecture/game-api
npm ci
cp .env.example .env
npm start
```

The default application is available at:

- API: `http://127.0.0.1:5102/game`
- Swagger: `http://127.0.0.1:5102/game/api`
- OpenAPI JSON: `http://127.0.0.1:5102/game/api-json`

`npm start`, `start:dev`, `start:debug`, and `start:prod` run external database preparation before Nest starts. Nest repositories and modules never seed production data.

## External database initialization

```text
scripts/init-schema.sql
  -> scripts/seed-common-data.sql
  -> scripts/themes/avengers-doomsday/seed-theme-data.sql
  -> Nest startup
```

All initialization assets live under `scripts/`. The Avengers seed is repository-controlled and generated deterministically by `scripts/themes/avengers-doomsday/build-seed.cjs`; no LLM or external service runs during initialization.

The production seed contains exactly:

- 32 `PREFERRED` Leaders
- 5 `ELIGIBLE` Leaders
- 50 `COMPANION_ONLY` Heroes
- Silver Surfer, Doctor Doom, and Dormammu as non-selectable narrative identities
- 32 assigned Team profiles

Hero identity, eligibility, archetype, localized biography and motivation, portrait references, abilities, relationships, and Leader metadata are curated inputs. Inspectable archetype rules assign gameplay statistics and resource maxima. The generated SQL initializes SQLite, which is the authoritative catalog for new Journey creation. Existing typed TypeScript fixtures remain dedicated to deterministic unit and combat regression tests.

Run preparation explicitly with:

```bash
npm run db:init
npm run db:init -- /tmp/avengers.sqlite avengers-doomsday
```

Seed reruns update versioned catalog content while preserving saved Team configuration metadata and persisted Journey attempts. The script runs in a transaction. It does not introduce migrations or a runtime seed hook; `synchronize: true` remains the approved teaching-project policy.

## Persistence

SQLite uses two authoritative lifecycle records:

- `team_profiles`: assigned identity, one saved Team configuration, configuration/context revisions, and the current attempt pointer.
- `journey_attempts`: stable Team/theme/status/revision/timestamp columns plus typed JSON metadata.

`AvengersJourneyMetadataMapper` validates and maps the entity JSON into `AvengersJourneyMetadata` immediately at the theme boundary. Application and domain code never traverses an untyped metadata dictionary. The metadata captures concrete content and balance inputs, RNG state, tournament facts, rewards, inventory, progression, and the embedded FinalStage so active and completed attempts survive restart.

Mutations use transactions and optimistic revisions. PRE_FINAL membership SAVE commits the new Team configuration, replacement Journey, and new pointer together, or commits nothing. Purchases and FinalStage commands follow the same atomic revision discipline. Completed attempts remain in History; replaced unfinished attempts do not.

## Journey

`POST /game/teams/:teamId/journeys/simulate` resolves the whole Journey synchronously. A seed and one `JourneySpendingStrategy` are required:

- `SAVE`: preserves optional spending but may Revive a KO Hero.
- `BALANCED`: prioritizes survival/recovery while retaining a useful reserve.
- `AGGRESSIVE`: meets critical survival needs and spends more actively on AP and offense.

The tournament contains 32 Teams, eight groups, Round of 16, Quarterfinals, Semifinals, and two FinalStage finalists. All six Player Heroes are excluded from generated Teams. Generated Leaders use unused PREFERRED Heroes first and ELIGIBLE fallback only when required. Companion identities may repeat across different generated Teams; Leader positions are unique.

Player Journey combat uses the approved theme-local `NORMAL | PLAYER_WIN` round input. Guaranteed Player-winning rounds are selected directly and deterministically with:

```text
floor(JOURNEY_ENCOUNTER_MAX_ROUNDS * seeded percentage between 0.50 and 0.60)
```

There is no candidate search or retry loop. Group results naturally place the Player in the top two. Every Player knockout result is an authoritative WIN, including a Player Extra Round if needed. AI-versus-AI Extra Rounds use legal Offensive Specials, forfeit when only one side has a caster, and one seeded technical verdict only when neither can act or effective damage ties.

Rewards, Store prices/effects, AI purchasing, stat progression, and recovery are authoritative Game API behavior. `JOURNEY_ENCOUNTER_MAX_ROUNDS` must be a positive integer and has no arbitrary maximum.

## Interactive two-act FinalStage

Journey is automatic; FinalStage is interactive. The client reads authoritative state and legal actions, the user explicitly selects one action, and the Game API validates/resolves the complete Player plus Opponent/Doom response cycle.

```text
START (no combat turn)
  -> TOURNAMENT_FINAL, Silver Surfer is judge, Doom is hidden/inactive
Player-selected cycles 1-4
  -> Player Team vs Opponent Team
after completed cycle 4, if Player survives
  -> deterministic Doom reveal, no resource/state reset
cycle 5+
  -> Player Team vs Opponent Team + Doctor Doom
```

An Act-I Player defeat is real and completes with the short Doom recruitment ending. ABANDON works in either act. There is no fixed maximum normal-turn count. The retained Final Attack mechanics are entered when real Act-II combat drives Doom into CRITICAL threat, rather than after a fixed number of turns.

`GET .../final-stage/actions` and FinalStage state expose legal action identifiers and legal targets. `POST .../final-stage/play` accepts only `START`, `CHOOSE_ACTION`, or `ABANDON` plus the expected revision. Doom state and BossThreatLevel are absent before reveal. Narrative rendering is EN/ES, consumes no combat RNG, and never mutates state.

## Main HTTP resources

```text
GET  /themes/:themeId/heroes
GET  /themes/:themeId/strategies
GET  /themes/:themeId/relationships
GET  /themes/:themeId/teams
GET  /themes/:themeId/power-ups
GET  /themes/:themeId/prologue

GET  /teams/:teamId/profile
GET  /teams/:teamId/configuration
PUT  /teams/:teamId/configuration

POST /teams/:teamId/journeys/simulate
GET  /teams/:teamId/journeys/current
GET  /teams/:teamId/journeys/history
GET  /teams/:teamId/journeys/:attemptId
GET  /teams/:teamId/journeys/:attemptId/{teams|stages|encounters|events|rewards|inventory}
POST /teams/:teamId/journeys/:attemptId/purchases
POST /teams/:teamId/journeys/:attemptId/preparation/items

GET  /teams/:teamId/journeys/:attemptId/final-stage
GET  /teams/:teamId/journeys/:attemptId/final-stage/{teams|actions|events}
POST /teams/:teamId/journeys/:attemptId/final-stage/play
GET  /teams/:teamId/journeys/:attemptId/statistics
```

All responses use `ResponseObject<T>`. Domain errors use the compact shared error contract. Swagger documents request constraints, including positive uncapped Store quantities and the interactive FinalStage command boundary.

Official awards become readable only after FinalStage completes through VICTORY, DEFEAT, or ABANDON. The Game API chooses the global winners among Heroes from Quarterfinalists or later:

- MIGHTIEST HERO: greatest attributable Damage Dealt
- BEST SUPPORT: greatest attributable Healing, with no winner if all are zero
- MOST RESILIENT: lowest `KOs Suffered / Active Encounters`, then approved factual tie-breaks
- JOURNEY MVP: greatest Winning Active Rounds, then KOs Caused, Damage Dealt, stable Team/Hero identity

Doctor Doom is never a Hero award candidate. Actual facts from Journey and both FinalStage acts count; unplayed or narrative-only transitions do not.

## Verification and diagnostics

```bash
npm run build
npm test
npm run balance:avengers -- 100 > balance/avengers-two-act-v1.json
npm run diagnostics:journey -- 100 balance/avengers-journey-v1.json
```

`npm test` builds and runs unit, deterministic domain, persistence, restart, HTTP/Swagger, Store, lifecycle, two-act FinalStage, statistics, and external-initialization tests.

The Journey full diagnostic uses eight representative Player configurations, all three spending strategies, and 100 paired seeds: 2,400 Journeys. It reports generation, Player round plans, outcomes, resource attrition, economy, progression, handoff, awards, metadata size, and separately measured simulation/persistence/total timing. Large positive round counts are measured separately and are not converted into a domain limit.

`balance/avengers-before-v1.json` preserves the old FinalStage baseline evidence. `balance/avengers-two-act-v1.json` is the new deterministic canonical baseline for Act I, reveal, Act II, outcomes, resource behavior, and battle length. Intentional lifecycle differences are separated from unchanged combat-formula regression coverage.

## Source boundaries

- `basic/`: HTTP envelopes, errors, filters, and controller support.
- `teams/`: assigned Team profile persistence.
- `journey/`: generic Journey models and the generic attempt persistence entity/repository.
- `final-stage/`: generic engine and repository contracts.
- `theme/avengers-doomsday/catalog/`: persisted production content and typed mapping.
- `theme/avengers-doomsday/combat/`: minimal genuinely shared Avengers combat collaborators.
- `theme/avengers-doomsday/journey/`: Avengers Journey generation, Encounter simulation, orchestration, persistence mapping, diagnostics, and HTTP service/controller.
- `theme/avengers-doomsday/store/`: Avengers Store rules.

`AvengersEncounterSimulator` is the independent Team-versus-Team Journey orchestrator. `AvengersGameEngine` remains the interactive Player-versus-Opponent-plus-Doom FinalStage orchestrator. They reuse only real shared Avengers mechanics; Journey does not run through `GameEngine<T>`, and `NORMAL | PLAYER_WIN` never enters generic or FinalStage contracts.

The current Game API architecture is authoritative. World Cup scripts informed only the external data-seeding workflow; World Cup API internals are not used as an architecture model.
