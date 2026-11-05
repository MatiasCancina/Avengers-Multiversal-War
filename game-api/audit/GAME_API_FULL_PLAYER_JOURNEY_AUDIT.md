# Game API — Full Player Journey Audit

## 1. Executive Summary

A new consumer completed a real Avengers Journey through the public HTTP API in English. The run selected **ant-man**, created attempt **eb921fd2-e5e2-4092-b255-383598b96044** with deterministic seed **20260921**, purchased and used `power-boost`, completed FinalStage after 21 Player decisions, and reached **DEFEAT** with **NORMAL_DEFEAT**.

The trace contains 158 ordered HTTP interactions. All 31 approved operations were exercised naturally, all 18 features were completed, and the public API was sufficient without hidden state. The audit found no runtime inconsistency or blocker.

## 2. Audit Scope and Rules

This was a read-only black-box audit. The player used only public HTTP responses to discover identifiers, select configuration, buy/use an item, prepare, choose FinalStage actions, and verify completion. No repositories, SQL, entities, internal services, engines, seeds, or test helpers were used for player decisions. The runner used source only to bootstrap the real HTTP server. No production, test, gameplay, balance, RNG, seed, BFF, Angular, or existing documentation file was modified.

## 3. Runtime / Starting State

- Branch: `tp-11092026`
- Starting commit: `c723ed3 updated image script`
- Language: `en`
- API origin: `http://127.0.0.1:5319/game`
- Team: `ant-man`
- Attempt: `eb921fd2-e5e2-4092-b255-383598b96044`
- Seed: `20260921`

## 4. Feature Index

| # | Feature | Main endpoints | Depends on | Audit status |
|---|---|---|---|---|
| 01 | Health / Bootstrap | GET /game/health | — | PASS |
| 02 | Team Discovery & Profile | GET /game/teams; GET /game/teams/{teamId}/profile | 01 | PASS |
| 03 | Hero Catalog & Relationships | GET /game/heroes; GET /game/heroes/relationships | 02 | PASS |
| 04 | Reference Data & Prologue | GET /game/reference/game-dictionary; /strategies; /power-ups; /prologue | 03 | PASS |
| 05 | Team Configuration | GET/PUT /game/teams/{teamId}/configuration | 04 | PASS |
| 06 | Journey Creation | GET current; POST /journeys/simulate; GET current | 05 | PASS |
| 07 | Tournament Overview | GET journey; /teams; /stages | 06 | PASS |
| 08 | Encounters & Journey Events | GET encounters; GET encounters/{encounterId}; GET events | 07 | PASS |
| 09 | Rewards | GET rewards | 08 | PASS |
| 10 | Store / Purchases | POST purchases; GET rewards; GET inventory | 09 | PASS |
| 11 | Inventory & Item Use | POST preparation/items; GET inventory | 10 | PASS |
| 12 | Final Preparation | PUT preparation; GET journey | 11 | PASS |
| 13 | FinalStage Bootstrap | GET final-stage/teams/actions/events; POST final-stage/play START | 12 | PASS |
| 14 | Interactive Final Battle | GET final-stage; /teams; /actions; /events; POST /play | 13 | PASS |
| 15 | Doom Reveal / Act II | FinalStage state/events/teams after resolution | 14 | PASS |
| 16 | Completion | GET final-stage; teams; events; journey; events | 15 | PASS |
| 17 | Statistics & Awards | GET statistics | 16 | PASS |
| 18 | History / Post-Game State | GET history; current; rewards; inventory | 17 | PASS |

## 5. Endpoint Coverage Index

| Method | Route | Tag | Calls | First step | Exercised | Result |
|---|---|---|---:|---:|---|---|
| `GET` | `/game/health` | health | 1 | 1 | YES | PASS |
| `GET` | `/game/teams` | Teams | 1 | 2 | YES | PASS |
| `GET` | `/game/heroes` | Heroes | 2 | 4 | YES | PASS |
| `GET` | `/game/heroes/relationships` | Heroes | 1 | 5 | YES | PASS |
| `GET` | `/game/reference/game-dictionary` | Reference | 2 | 6 | YES | PASS |
| `GET` | `/game/reference/strategies` | Reference | 2 | 7 | YES | PASS |
| `GET` | `/game/reference/power-ups` | Reference | 2 | 8 | YES | PASS |
| `GET` | `/game/reference/prologue` | Reference | 1 | 9 | YES | PASS |
| `GET` | `/game/teams/{teamId}/profile` | Teams | 1 | 3 | YES | PASS |
| `GET` | `/game/teams/{teamId}/configuration` | Teams | 2 | 10 | YES | PASS |
| `PUT` | `/game/teams/{teamId}/configuration` | Teams | 1 | 11 | YES | PASS |
| `GET` | `/game/teams/{teamId}/history` | Teams | 1 | 148 | YES | PASS |
| `POST` | `/game/teams/{teamId}/journeys/simulate` | Journey | 1 | 14 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/current` | Journey | 3 | 13 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}` | Journey | 4 | 16 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/teams` | Journey | 1 | 17 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/stages` | Journey | 1 | 18 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/encounters` | Journey | 1 | 19 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/encounters/{encounterId}` | Journey | 1 | 20 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/events` | Journey | 3 | 21 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/rewards` | Journey | 3 | 22 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/inventory` | Journey | 4 | 23 | YES | PASS |
| `POST` | `/game/teams/{teamId}/journeys/{attemptId}/purchases` | Journey | 1 | 24 | YES | PASS |
| `POST` | `/game/teams/{teamId}/journeys/{attemptId}/preparation/items` | Journey | 1 | 27 | YES | PASS |
| `PUT` | `/game/teams/{teamId}/journeys/{attemptId}/preparation` | Journey | 1 | 30 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/final-stage` | Final Stage | 23 | 32 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/final-stage/teams` | Final Stage | 23 | 33 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/final-stage/actions` | Final Stage | 22 | 34 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/final-stage/events` | Final Stage | 24 | 35 | YES | PASS |
| `POST` | `/game/teams/{teamId}/journeys/{attemptId}/final-stage/play` | Final Stage | 22 | 36 | YES | PASS |
| `GET` | `/game/teams/{teamId}/journeys/{attemptId}/statistics` | Statistics | 1 | 147 | YES | PASS |

## 6. Golden Player Journey Summary

The player began with discovery, saved configuration, simulated a Journey, inspected tournament and Encounter data, reconciled a purchase, used the item, prepared FinalStage, started through `START`, and repeated observe → decide → act through terminal completion. The run ended in **DEFEAT / NORMAL_DEFEAT**. The normal Doom reveal was observed at step **65** through the persisted event stream; no pre-reveal firewall finding was recorded.

## 7. Feature 01 — Health / Bootstrap

### Goal
Confirm process availability.

### Public API
GET /game/health

### Inputs
None.

### Outputs
status=ok, service=game-api, version=0.1.0.

### Flow
The player checks readiness.

### State carried forward
No dependency.

### User decisions
The player checks readiness.

### Lifecycle constraints
No dependency.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF health gate; Angular readiness state.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **1–1**.

### Status
**PASS**

## 8. Feature 02 — Team Discovery & Profile

### Goal
Discover assigned Team and profile.

### Public API
GET /game/teams; GET /game/teams/{teamId}/profile

### Inputs
teamId=ant-man from step 2.

### Outputs
Public Team identity, Leader, and profile.

### Flow
Selected the first public assigned Team because it was a discoverable valid Team.

### State carried forward
Feeds catalog, configuration, and Journey.

### User decisions
Selected the first public assigned Team because it was a discoverable valid Team.

### Lifecycle constraints
Feeds catalog, configuration, and Journey.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF stores teamId; Angular presents Team/profile.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **2–3**.

### Status
**PASS**

## 9. Feature 03 — Hero Catalog & Relationships

### Goal
Discover Hero identities, abilities, resources, and relationships.

### Public API
GET /game/heroes; GET /game/heroes/relationships

### Inputs
Hero ids from the catalog.

### Outputs
87 Heroes, localized content, relationship graph.

### Flow
Used catalog responses instead of assumptions.

### State carried forward
Supports configuration and action interpretation.

### User decisions
Used catalog responses instead of assumptions.

### Lifecycle constraints
Supports configuration and action interpretation.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF caches by language; Angular renders catalog.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **4–5**.

### Status
**PASS**

## 10. Feature 04 — Reference Data & Prologue

### Goal
Discover vocabulary, Strategies, Power-Ups, and premise.

### Public API
GET /game/reference/game-dictionary; /strategies; /power-ups; /prologue

### Inputs
strategyCode and powerUpId from responses.

### Outputs
Localized reference definitions and prologue.

### Flow
Chose Strategy and later an affordable legal Power-Up.

### State carried forward
Required before configuration/purchase/preparation.

### User decisions
Chose Strategy and later an affordable legal Power-Up.

### Lifecycle constraints
Required before configuration/purchase/preparation.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF composes reference bootstrap; Angular renders choices.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **6–157**.

### Status
**PASS**

## 11. Feature 05 — Team Configuration

### Goal
Read, deliberately save, and reload configuration.

### Public API
GET/PUT /game/teams/{teamId}/configuration

### Inputs
teamId; configurationRevision; contextRevision; companionIds; activeHeroIds.

### Outputs
AGGRESSIVE saved at revision 1/context 1 and reloaded.

### Flow
Kept a valid public roster and selected a catalog Strategy.

### State carried forward
Must precede simulation; reloadable.

### User decisions
Kept a valid public roster and selected a catalog Strategy.

### Lifecycle constraints
Must precede simulation; reloadable.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF sends revisions and refreshes after save.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **10–12**.

### Status
**PASS**

## 12. Feature 06 — Journey Creation

### Goal
Create a deterministic Journey.

### Public API
GET current; POST /journeys/simulate; GET current

### Inputs
teamId; seed; revisions; attemptId from POST.

### Outputs
AttemptId and PRE_FINAL state.

### Flow
Selected BALANCED spending because it is an explicit neutral policy.

### State carried forward
AttemptId scopes Journey resources.

### User decisions
Selected BALANCED spending because it is an explicit neutral policy.

### Lifecycle constraints
AttemptId scopes Journey resources.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF preserves attemptId/revisions.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **13–15**.

### Status
**PASS**

## 13. Feature 07 — Tournament Overview

### Goal
Understand tournament progression, teams, stages, finalists.

### Public API
GET journey; /teams; /stages

### Inputs
attemptId; stageId; finalist ids.

### Outputs
Standings, bracket, and public teams.

### Flow
Read overview before rewards and FinalStage.

### State carried forward
Provides encounter/final prerequisites.

### User decisions
Read overview before rewards and FinalStage.

### Lifecycle constraints
Provides encounter/final prerequisites.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF caches summary; Angular needs bracket views.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **16–18**.

### Status
**PASS**

## 14. Feature 08 — Encounters & Journey Events

### Goal
Inspect Encounter and ordered Journey timeline.

### Public API
GET encounters; GET encounters/{encounterId}; GET events

### Inputs
encounterId and stageId from public responses.

### Outputs
Rounds/facts and localized events.

### Flow
Inspected encounter-01 and a natural stage filter.

### State carried forward
Events explain progression/rewards.

### User decisions
Inspected encounter-01 and a natural stage filter.

### Lifecycle constraints
Events explain progression/rewards.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF maps timeline; Angular renders detail/history.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **19–155**.

### Status
**PASS**

## 15. Feature 09 — Rewards

### Goal
Reconcile public Reward Points.

### Public API
GET rewards

### Inputs
attemptId and ledger.

### Outputs
Balance was 40 before purchase.

### Flow
Checked affordability from public balance/catalog.

### State carried forward
Purchase needs account facts.

### User decisions
Checked affordability from public balance/catalog.

### Lifecycle constraints
Purchase needs account facts.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF exposes balance/ledger.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **22–22**.

### Status
**PASS**

## 16. Feature 10 — Store / Purchases

### Goal
Make a real legal purchase.

### Public API
POST purchases; GET rewards; GET inventory

### Inputs
powerUpId=power-boost; quantity=1; revision 0.

### Outputs
Balance 40→25; inventory quantity 1.

### Flow
Bought affordable Team-scoped Power Boost with PRE_FINAL context.

### State carried forward
Reload proves mutation.

### User decisions
Bought affordable Team-scoped Power Boost with PRE_FINAL context.

### Lifecycle constraints
Reload proves mutation.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF mutation + refresh; Angular confirms receipt.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **24–26**.

### Status
**PASS**

## 17. Feature 11 — Inventory & Item Use

### Goal
Use an owned preparation item.

### Public API
POST preparation/items; GET inventory

### Inputs
powerUpId; revision 1.

### Outputs
Quantity 1→0; revision 2.

### Flow
Used it because public inventory exposed quantity and PRE_FINAL legality.

### State carried forward
Must be before FinalStage.

### User decisions
Used it because public inventory exposed quantity and PRE_FINAL legality.

### Lifecycle constraints
Must be before FinalStage.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF refreshes inventory/effect.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **23–28**.

### Status
**PASS**

## 18. Feature 12 — Final Preparation

### Goal
Set final active formation and Strategy.

### Public API
PUT preparation; GET journey

### Inputs
activeHeroIds; strategyCode; expectedRevision 2.

### Outputs
Revision 3 and active ids persisted.

### Flow
Kept public trio including Leader.

### State carried forward
Precedes READY FinalStage.

### User decisions
Kept public trio including Leader.

### Lifecycle constraints
Precedes READY FinalStage.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF sends latest revision.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **29–31**.

### Status
**PASS**

## 19. Feature 13 — FinalStage Bootstrap

### Goal
Inspect READY and start FinalStage.

### Public API
GET final-stage/teams/actions/events; POST final-stage/play START

### Inputs
attemptId; FinalStage revision 3.

### Outputs
READY→ACTIVE; pre-start teams/actions returned expected 409.

### Flow
Started after observing READY and public START.

### State carried forward
Subsequent calls need revisions.

### User decisions
Started after observing READY and public START.

### Lifecycle constraints
Subsequent calls need revisions.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF switches to observe/decide loop.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **32–36**.

### Status
**PASS**

## 20. Feature 14 — Interactive Final Battle

### Goal
Play final using authoritative actions.

### Public API
GET final-stage; /teams; /actions; /events; POST /play

### Inputs
actionId; revision; actor/target/cost.

### Outputs
21 decisions; terminal DEFEAT.

### Flow
Preferred Specials, one Strategy change, Leader Ability, low-energy SWAP; Basic Attack fallback.

### State carried forward
Refresh before every action.

### User decisions
Preferred Specials, one Strategy change, Leader Ability, low-energy SWAP; Basic Attack fallback.

### Lifecycle constraints
Refresh before every action.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF preserves revision/action list; Angular renders choices.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **37–141**.

### Status
**PASS**

## 21. Feature 15 — Doom Reveal / Act II

### Goal
Observe reveal and Act II.

### Public API
FinalStage state/events/teams after resolution

### Inputs
revealStep=65; event codes.

### Outputs
Normal reveal at public turn 4; Doom actions after transition.

### Flow
Continued from public post-reveal choices.

### State carried forward
No Doom state pre-reveal.

### User decisions
Continued from public post-reveal choices.

### Lifecycle constraints
No Doom state pre-reveal.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF changes phase/narrative rendering.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **142–156**.

### Status
**PASS**

## 22. Feature 16 — Completion

### Goal
Reload terminal FinalStage and Journey completion.

### Public API
GET final-stage; teams; events; journey; events

### Inputs
endingCode=NORMAL_DEFEAT; outcome=DEFEAT.

### Outputs
Completed state/events persisted.

### Flow
Reloaded projections instead of trusting POST only.

### State carried forward
Feeds stats/history/current.

### User decisions
Reloaded projections instead of trusting POST only.

### Lifecycle constraints
Feeds stats/history/current.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF normalizes terminal result.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **145–146**.

### Status
**PASS**

## 23. Feature 17 — Statistics & Awards

### Goal
Read post-game Statistics/Awards.

### Public API
GET statistics

### Inputs
attemptId; outcome/endingCode.

### Outputs
COMPLETED, DEFEAT, NORMAL_DEFEAT; finalStagePlayed=true; 18 turns.

### Flow
Compared public result with FinalStage.

### State carried forward
Should agree with history/current.

### User decisions
Compared public result with FinalStage.

### Lifecycle constraints
Should agree with history/current.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF maps result stats.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **147–147**.

### Status
**PASS**

## 24. Feature 18 — History / Post-Game State

### Goal
Verify History/current/rewards/inventory.

### Public API
GET history; current; rewards; inventory

### Inputs
teamId; attemptId; outcome/endingCode.

### Outputs
History/current completed attempt; balance 25; quantity 0.

### Flow
Checked all reloadable projections.

### State carried forward
No hidden state needed.

### User decisions
Checked all reloadable projections.

### Lifecycle constraints
No hidden state needed.

### Errors observed or relevant
Expected pre-START `FINAL_STAGE_NOT_ACTIVE` responses occurred at steps 33–34 and were understandable lifecycle responses. No unexpected error blocked the journey.

### BFF notes
BFF hydrates post-game route.

### Angular notes
Render public responses and preserve returned identifiers/revisions; do not reconstruct legality or hidden state.

### Audit evidence
Steps **148–158**.

### Status
**PASS**

## 25. Identifier Flow

- `teamId`: from `GET /game/teams` step 2 (`ant-man`); reused for profile, configuration, Journey, FinalStage, statistics, and history.
- `attemptId`: from `POST /journeys/simulate` step 14 (`eb921fd2-e5e2-4092-b255-383598b96044`); reused for Journey resources.
- `stageId`: from public stages step 18; used by Encounter filter step 19.
- `encounterId`: from summaries step 19; used by detail step 20.
- `heroId`: from catalog/configuration/teams; used in formation and team state.
- `strategyCode`: from Strategy reference step 7; used in configuration/preparation.
- `powerUpId`: from reference step 8/inventory; `power-boost` used in steps 24–28.
- `actionId`: from each legal-actions response immediately before POST; 21 submitted ids were observed legal.
- `abilityId`: public legal-action slot metadata.
- `speakerId`: public FinalStage narrative identity, including `silver-surfer`.
- `endingCode`: terminal projections consistently returned `NORMAL_DEFEAT`.
- `revision`: read from responses and sent in mutations; mutations advanced it.

## 26. Public Lifecycle Map

`Team configurable` → `Journey simulated / PRE_FINAL` → `tournament overview and rewards` → `purchase/use/preparation` → `FinalStage READY` → `ACTIVE / TOURNAMENT_FINAL` → `DOOMSDAY after turn 4 reveal` → `COMPLETED / DEFEAT` → `Statistics, History, current Journey`. Observed in steps 10–149.

## 27. Narrative Consumption Map

The prologue/reference text was fetched in step 9. **Historical observation from the 158-step trace:** Journey/Encounter timelines exposed localized flat `message` text (steps 20–21 and 146/155), while FinalStage exposed `messageCode` plus `narrative.lines[]`; opening steps 36/156 used `type=DIALOGUE`, `speakerId=silver-surfer`. Owner review approved a final pre-freeze normalization after that run: all public RPG events now use the shared `narrative.lines[]` contract, with Journey/Encounter text represented as `NARRATION` and `speakerId: null`. The historical JSON remains unchanged evidence of the original observation. Combat lines use `NARRATION` with null speaker, and canonical FinalStage dialogue retains speaker IDs. The API supplies identity/text; no portrait, image, asset path, or frontend presentation ref was needed. Technical HTTP/API response messages remain a separate `responseMessage` contract.

## 28. Store / Inventory Accounting

- Before purchase: Reward Points **40** (step 22); inventory empty (step 23).
- Purchase: `power-boost`, quantity 1, catalog price **15**, step 24.
- After purchase: balance **25**, quantity **1**, steps 25–26.
- Use: `power-boost`, step 27; revision **2**, quantity **0**, step 27/28.
- Final reload: balance **25**, quantity **0**, steps 150–151.
- Public responses were sufficient to reconcile the transaction.

## 29. FinalStage Action Accounting

The Player made **21** decisions. Legal action codes observed: `BASIC_ATTACK, CHANGE_STRATEGY, LEADER_ABILITY, OFFENSIVE_SPECIAL, SUPPORT_SPECIAL, SWAP`. Each POST used the current public revision and an actionId returned by the preceding legal-actions endpoint. The trace included Strategy change, Leader Ability, Offensive Specials, Basic Attacks, Support Special availability, and SWAP; no illegal selected-action finding was recorded. Selected action steps: 41, 46, 51, 56, 61, 66, 71, 76, 81, 86, 91, 96, 101, 106, 111, 116, 121, 126, 131, 136, 141.

## 30. Doom Narrative Firewall

Before reveal, state/actions/events were inspected repeatedly (steps 37–64). No forbidden Doom identity, action, alliance, or hidden-purpose reference was found. Reveal first appeared in step **65**, with `DOOM_REVEALED`, `DOOM_EXPLANATION`, and `DOOMSDAY_BEGINS`; Doom-specific state/actions appeared only after that transition. Result: **PASS**.

## 31. Persistence / Reload Verification

Reloads succeeded after configuration (11–12), Journey simulation (14–15), purchase (24–26), item use (27–28), preparation (29–31), START (32–36), FinalStage decisions/reveal, completion (144–151), and Spanish reads. The public API reconstructed the Journey without hidden transient state.

## 32. Localization Spot Check

Spanish checks at steps 152–157 returned HTTP 200 for Heroes, Strategies, Power-Ups, Journey events, FinalStage events, and Dictionary. The Spanish FinalStage opening preserves `DIALOGUE` and `speakerId=silver-surfer`. The main Journey remained English; no full Spanish replay was performed. Result: **PASS**.

## 33. BFF / Angular Implementation Blueprint

A future BFF should preserve `teamId`, `attemptId`, revisions, stage/encounter ids, powerUp ids, and freshly returned FinalStage `actionId`. It can compose reference/bootstrap calls, forward localized event/narrative models, and centralize refresh/error handling. Angular should render public response fields, iterate `narrative.lines[]`, resolve `speakerId` locally, and never reconstruct legal actions or hidden state. FinalStage should use observe → decide → act and treat terminal outcome/endingCode as authoritative.

## 34. Findings

- **PASS** — 18/18 features, 31/31 operations, 158 HTTP calls; no blocker or runtime inconsistency.
- **OBSERVATION (historical, resolved by owner-approved normalization)** — The 158-step trace recorded flat Journey/Encounter `message` fields while FinalStage used `narrative.lines[]` (evidence: 146/155 vs. 36/156). The final pre-freeze public contract now uses `narrative.lines[]` for all RPG events; the historical trace was intentionally not rewritten.
- **OBSERVATION** — This golden run naturally ended in DEFEAT; Victory, Abandon, and Sue Appeal branches need separate targeted audits and were not forced here.
- **OBSERVATION** — `/game/api-json` matched 30 paths, 31 operations, and seven approved tags.

## 35. Unexercised Operations

None. All 31 approved operations were exercised. `/game/api-json` was an additional Swagger verification request and is not counted among the 31 gameplay operations.

## 36. Final Assessment

- Journey completed: **TRUE**
- Terminal outcome: **DEFEAT**
- Ending code: **NORMAL_DEFEAT**
- HTTP calls: **158**
- Operations: **31/31**
- Features: **18/18**
- Hidden state required: **NO**
- Public API sufficient: **YES**
- Raw/derived finding counts: PASS 18, OBSERVATION 3, FRICTION 0, INCONSISTENCY 0, BLOCKER 0.

### Owner review questions
1. **YES** — discovery returned Teams, Heroes, references, and prologue (1–9).
2. **YES** — required identifiers came from public responses (2, 14, 18–20, 24, 39+).
3. **YES** — configuration saved and reloaded (10–12).
4. **YES** — Journey creation/progression were readable (14–21).
5. **YES** — stages, bracket, Encounters, and events were public (17–21).
6. **YES** — rewards, purchase, inventory, use, preparation reconciled (22–31).
7. **YES** — FinalStage completed via authoritative legal actions (36–141).
8. **YES** — Doom reveal was understandable with no pre-reveal leak (37–65).
9. **YES** — terminal state/events reloaded (144–151).
10. **YES** — outcome/endingCode agreed across summary, statistics, history, current Journey (144–149).
11. **YES** — BFF orchestration needs only public identifiers/revisions.
12. **YES** — the flow is explicit and REST-oriented.
13. **NO** — hidden/internal state was not required.
14. **NO** — no blocker observed.
15. **NO** — no material inconsistency remains after the owner-approved unified RPG event narrative normalization. The historical endpoint-specific observation is retained as evidence, not current contract behavior.

**Final freeze recommendation: `READY_FOR_FREEZE_WITH_OBSERVATIONS`.**

## 37. Raw Artifact / Reproduction Instructions

Working directory: `utn-utnito/course/tp_architecture/game-api`. The runner performs `npm run build`, starts the real `npm run start:prod` with a temporary file-backed SQLite database, `DB_SEED_THEME=avengers-doomsday`, `APP_BASE_PATH=game`, and an isolated port, then records HTTP only. Run `node audit/run-full-player-journey-audit.cjs`. Language is `en`; deterministic audit seed is `20260921`; Team policy selects the first Team returned by `GET /game/teams`; gameplay policy chooses only current legal actions, preferring named Specials, making one public Strategy adjustment, using a low-energy SWAP when observable, and otherwise using Basic Attack. The complete raw trace is local at `game-api/audit/artifacts/full-player-journey-audit.json`, intentionally Git-ignored, with complete request/response bodies in temporal order. This Markdown is the durable review artifact; the runner is the reproduction mechanism.
