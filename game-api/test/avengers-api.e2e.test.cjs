const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { execFileSync } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

let app;
let baseUrl;
let directory;
let attemptId;
let preparedActiveHeroIds;
const request = async (path, init) => {
  const response = await fetch(`${baseUrl}/game${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await response.json();
  return { response, body };
};
async function start() {
  const { createApplication } = require('../dist/bootstrap');
  app = await createApplication();
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
}

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'avengers-api-e2e-'));
  process.env.DB_DATABASE = join(directory, 'avengers.sqlite');
  process.env.DB_SEED_THEME = 'avengers-doomsday';
  process.env.APP_LOG_LEVEL = 'error';
  process.env.APP_BASE_PATH = 'game';
  execFileSync('bash', [
    join(__dirname, '../scripts/init-database.sh'),
    process.env.DB_DATABASE,
    'avengers-doomsday',
  ]);
  await start();
});
after(async () => {
  if (app) {
    await app.close();
  }
  if (directory) {
    await rm(directory, { recursive: true, force: true });
  }
});

test('production seed exposes exactly 87 typed selectable Heroes and three non-selectable narrative identities', async () => {
  const { response, body } = await request('/heroes?lang=es');
  assert.equal(response.status, 200);
  assert.equal(body.data.count, 87);
  assert.equal(
    body.data.heroes.filter((value) => value.eligibility.code === 'PREFERRED').length,
    32,
  );
  assert.equal(body.data.heroes.filter((value) => value.eligibility.code === 'ELIGIBLE').length, 5);
  assert.equal(
    body.data.heroes.filter((value) => value.eligibility.code === 'COMPANION_ONLY').length,
    50,
  );
  assert.ok(
    body.data.heroes.every(
      (value) => value.biography && value.tournamentMotivation && value.abilities.basicAttack.name,
    ),
  );
  assert.ok(
    body.data.heroes.every(
      (hero) =>
        hero.abilities.basicAttack.id === 'basic-attack' &&
        hero.abilities.basicAttack.name !== 'Ataque básico' &&
        hero.abilities.basicAttack.name !== 'Basic Attack' &&
        hero.abilities.basicAttack.name !== 'Basic Strike' &&
        hero.abilities.basicAttack.description.length > 0 &&
        hero.abilities.offensiveSpecial.id === 'offensive-special' &&
        hero.abilities.offensiveSpecial.description.length > 0 &&
        hero.abilities.supportSpecial.id === 'support-special' &&
        hero.abilities.supportSpecial.description.length > 0,
    ),
  );
  assert.ok(
    body.data.heroes
      .filter((hero) => hero.abilities.leaderAbility)
      .every(
        (hero) =>
          hero.abilities.leaderAbility.id === 'leader-ability' &&
          hero.abilities.leaderAbility.description.length > 0,
      ),
  );
  const spiderMan = body.data.heroes.find((hero) => hero.id === 'spider-man');
  assert.equal(spiderMan.abilities.basicAttack.name, 'Web Strike');
  assert.equal(spiderMan.abilities.offensiveSpecial.name, 'Web Barrage');
  assert.equal(spiderMan.abilities.supportSpecial.name, 'Spider-Sense Cover');
  const prologue = (await request('/reference/prologue?lang=en')).body.data;
  assert.equal(prologue.scenes.length, 4);
  assert.equal(
    prologue.narrativeCharacters.find((value) => value.id === 'silver-surfer').displayName,
    'Silver Surfer',
  );

  const assignedTeams = (await request('/teams?lang=es')).body.data;
  assert.ok(assignedTeams.teams.some((team) => team.id === 'spider-man'));
  assert.ok(assignedTeams.teams.every((team) => team.description.length > 0));

  const strategies = (await request('/reference/strategies?lang=es')).body.data;
  assert.equal(strategies.strategies.length, 4);
  assert.ok(strategies.strategies.every((strategy) => strategy.label && strategy.description));

  const powerUps = (await request('/reference/power-ups?lang=es')).body.data;
  assert.equal(powerUps.powerUps.length, 16);
  assert.ok(powerUps.powerUps.every((item) => item.name && item.description && item.price > 0));

  const spanishProfile = (await request('/teams/spider-man/profile?lang=es')).body.data;
  assert.equal(spanishProfile.name, 'Equipo Spider-Man');
  assert.match(spanishProfile.description, /Torneo Multiversal/);
  for (const projection of [
    body.data,
    prologue,
    assignedTeams,
    strategies,
    powerUps,
    spanishProfile,
  ]) {
    assert.equal('themeId' in projection, false);
  }

  const unsupportedLanguage = (await request('/heroes?lang=fr')).body.data;
  assert.equal(unsupportedLanguage.language, 'en');
  assert.equal(
    unsupportedLanguage.heroes.find((hero) => hero.id === 'spider-man').id,
    'spider-man',
  );
  assert.equal('archetype' in unsupportedLanguage.heroes[0], false);

  const dictionary = (await request('/reference/game-dictionary?lang=es')).body.data;
  assert.equal(dictionary.language, 'es');
  assert.equal('themeId' in dictionary, false);
  assert.ok(dictionary.heroEligibility.length >= 3);
  const metricCodes = ['DAMAGE_DEALT', 'HEALING', 'KO_RATE', 'WINNING_ACTIVE_ROUNDS'];
  assert.deepEqual(
    dictionary.awardMetrics.map((metric) => metric.code),
    metricCodes,
  );
  assert.ok(dictionary.awardMetrics.every((metric) => metric.label && metric.description));
  const englishDictionary = (await request('/reference/game-dictionary?lang=en')).body.data;
  assert.deepEqual(
    englishDictionary.awardMetrics.map((metric) => metric.code),
    metricCodes,
  );
  assert.ok(englishDictionary.awardMetrics.every((metric) => metric.label && metric.description));
  assert.equal(JSON.stringify(dictionary).includes('doctor-doom'), false);

  const relationships = (await request('/heroes/relationships')).body.data.relationships;
  assert.ok(relationships.length > 0);
  assert.ok(relationships.every((value) => value.relationshipCode !== 'NORMAL'));
  assert.equal(
    relationships.some((value) =>
      ['silver-surfer', 'doctor-doom', 'dormammu'].includes(value.heroAId),
    ),
    false,
  );
  const pairKey = (a, b) => [a, b].sort().join('|');
  const persistedHeroes = JSON.parse(
    execFileSync('sqlite3', [
      '-json',
      '-readonly',
      process.env.DB_DATABASE,
      'SELECT id, metadata FROM avengers_heroes;',
    ]).toString(),
  );
  const persistedRivalPairs = new Set(
    persistedHeroes.flatMap(({ id, metadata }) =>
      JSON.parse(metadata).rivals.map((rivalId) => pairKey(id, rivalId)),
    ),
  );
  const publicRivalPairs = relationships
    .filter(({ relationshipCode }) => relationshipCode === 'RIVAL')
    .map(({ heroAId, heroBId }) => pairKey(heroAId, heroBId));
  assert.equal(publicRivalPairs.length, 26, 'public RIVAL pairs remain sparse');
  assert.equal(new Set(publicRivalPairs).size, 26, 'each public RIVAL pair appears once');
  assert.deepEqual(publicRivalPairs.sort(), [...persistedRivalPairs].sort());
  assert.equal(publicRivalPairs.includes(pairKey('captain-america', 'iron-man')), false);
});

test('Journey simulates synchronously, persists PRE_FINAL, and Player reaches FinalStage as an ordinary finalist', async () => {
  const absent = await request('/teams/black-panther/journeys/current/teams');
  assert.equal(absent.response.status, 409);
  assert.equal(absent.body.responseMessage.messageCode, 'JOURNEY_REQUIRED');
  const forbiddenSeed = await request('/teams/spider-man/journeys/simulate', {
    method: 'POST',
    body: JSON.stringify({ spendingStrategy: 'SAVE', seed: 12345 }),
  });
  assert.equal(forbiddenSeed.response.status, 400);
  const { response, body } = await request('/teams/spider-man/journeys/simulate', {
    method: 'POST',
    body: JSON.stringify({
      spendingStrategy: 'SAVE',
    }),
  });
  assert.equal(response.status, 201);
  attemptId = body.data.attemptId;
  assert.equal(body.data.replacedPrevious, false);
  const persistedSeed = Number(
    execFileSync('sqlite3', [
      process.env.DB_DATABASE,
      `SELECT json_extract(metadata, '$.seed') FROM journey_attempts WHERE id = '${attemptId}';`,
    ])
      .toString()
      .trim(),
  );
  assert.ok(Number.isInteger(persistedSeed), 'the generated seed remains in internal metadata');
  assert.equal('seed' in body.data, false);
  assert.equal('attemptRevision' in body.data, false);
  const currentResponse = (await request('/teams/spider-man/journeys/current')).body.data;
  const current = currentResponse.attempt;
  assert.equal(current.attemptId, attemptId);
  assert.equal(current.status, 'PRE_FINAL');
  assert.equal(current.stageCount, 4);
  assert.equal(currentResponse.summary.attemptId, attemptId);
  assert.equal('seed' in currentResponse.summary, false);
  assert.equal('themeId' in currentResponse.summary, false);
  const summary = (await request(`/teams/spider-man/journeys/${attemptId}`)).body.data;
  const currentSummary = (await request('/teams/spider-man/journeys/current')).body.data.summary;
  assert.equal(currentSummary.attemptId, summary.attemptId);
  assert.equal(summary.progress.stagesCompleted, 4);
  assert.equal(summary.progress.encountersPlayedByPlayer, 6);
  assert.equal(summary.finalists.playerTeamId, 'spider-man');
  const teams = (await request(`/teams/spider-man/journeys/${attemptId}/teams`)).body.data.teams;
  assert.deepEqual(
    (await request('/teams/spider-man/journeys/current/teams')).body.data.teams,
    teams,
  );
  assert.equal(teams.length, 32);
  const encounters = (await request(`/teams/spider-man/journeys/${attemptId}/encounters`)).body.data
    .encounters;
  assert.deepEqual(
    (await request('/teams/spider-man/journeys/current/encounters')).body.data.encounters,
    encounters,
  );
  assert.equal(encounters.length, 62);
  for (const encounter of encounters.filter(
    (value) =>
      value.stageCode !== 'GROUP_STAGE' && [value.teamAId, value.teamBId].includes('spider-man'),
  )) {
    assert.equal(
      encounter.results.find((result) => result.teamId === 'spider-man').resultCode,
      'WIN',
    );
  }

  const stages = (await request(`/teams/spider-man/journeys/${attemptId}/stages`)).body.data;
  assert.deepEqual((await request('/teams/spider-man/journeys/current/stages')).body.data, stages);
  assert.equal(stages.groupStage.groups.length, 8);
  assert.deepEqual(
    stages.knockout.rounds.map((value) => value.stageCode),
    ['ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL'],
  );

  const detail = (
    await request(
      `/teams/spider-man/journeys/${attemptId}/encounters/${encounters[0].encounterId}?lang=es`,
    )
  ).body.data;
  assert.equal(detail.resourceConsequences.length, 2);
  assert.deepEqual(
    (
      await request(
        `/teams/spider-man/journeys/current/encounters/${encounters[0].encounterId}?lang=es`,
      )
    ).body.data,
    detail,
  );
  assert.ok(detail.resourceConsequences.every((value) => value.heroes.length === 6));
  const encounterEvents = detail.rounds.flatMap((round) => round.events);
  assert.ok(
    encounterEvents.every(
      (event) =>
        event.messageCode &&
        !Object.prototype.hasOwnProperty.call(event, 'message') &&
        event.narrative?.lines?.length > 0 &&
        event.narrative.lines[0].type === 'NARRATION' &&
        event.narrative.lines[0].speakerId === null,
    ),
  );
  assert.ok(detail.rewardEntries.every((entry) => entry.amount > 0));

  const journeyEvents = (await request(`/teams/spider-man/journeys/${attemptId}/events?lang=es`))
    .body.data;
  assert.equal(journeyEvents.language, 'es');
  assert.deepEqual(
    (await request('/teams/spider-man/journeys/current/events?lang=es')).body.data,
    journeyEvents,
  );
  assert.ok(
    journeyEvents.events.every(
      (event) =>
        event.messageCode &&
        !Object.prototype.hasOwnProperty.call(event, 'message') &&
        event.narrative?.lines?.length > 0 &&
        event.narrative.lines[0].type === 'NARRATION' &&
        event.narrative.lines[0].speakerId === null,
    ),
  );
  const journeyEventsEnglish = (
    await request(`/teams/spider-man/journeys/${attemptId}/events?lang=en`)
  ).body.data;
  assert.ok(journeyEventsEnglish.events.every((event) => event.narrative?.lines?.length > 0));
  assert.notEqual(
    journeyEvents.events[0].narrative.lines[0].text,
    journeyEventsEnglish.events[0].narrative.lines[0].text,
  );

  const rewards = (await request(`/teams/spider-man/journeys/${attemptId}/rewards`)).body.data;
  assert.deepEqual(
    (await request('/teams/spider-man/journeys/current/rewards')).body.data,
    rewards,
  );
  assert.equal(rewards.teamId, 'spider-man');
  assert.equal(rewards.earned - rewards.spent, rewards.balance);

  const missingHistoricalPair = await request(`/heroes?attemptId=${attemptId}`);
  assert.equal(missingHistoricalPair.response.status, 400);
  assert.equal(missingHistoricalPair.body.responseMessage.messageCode, 'VALIDATION_ERROR');

  const pinned = (await request(`/heroes?teamId=spider-man&attemptId=${attemptId}`)).body.data;
  assert.equal(pinned.heroes.find((hero) => hero.id === 'spider-man').id, 'spider-man');
  const currentCatalog = (await request('/reference/power-ups?teamId=spider-man')).body.data;
  const historicalCatalog = (
    await request(`/reference/power-ups?teamId=spider-man&attemptId=${attemptId}`)
  ).body.data;
  assert.deepEqual(currentCatalog.powerUps, historicalCatalog.powerUps);
});

test('PRE_FINAL membership SAVE atomically replaces Journey while tactical-only SAVE preserves it', async () => {
  const initial = (await request('/teams/spider-man/configuration')).body.data;
  const companions = [...initial.configuration.companionIds];
  companions[companions.length - 1] = 'thor';
  const replaced = (
    await request('/teams/spider-man/configuration', {
      method: 'PUT',
      body: JSON.stringify({
        companionIds: companions,
        activeHeroIds: initial.configuration.activeHeroIds,
        strategy: initial.configuration.strategyCode,
      }),
    })
  ).body.data;
  assert.equal(replaced.journeyReplaced, true);
  assert.notEqual(replaced.currentAttempt.attemptId, attemptId);
  attemptId = replaced.currentAttempt.attemptId;
  const tactical = (
    await request('/teams/spider-man/configuration', {
      method: 'PUT',
      body: JSON.stringify({
        companionIds: companions,
        activeHeroIds: initial.configuration.activeHeroIds,
        strategy: 'AGGRESSIVE',
      }),
    })
  ).body.data;
  assert.equal(tactical.journeyReplaced, false);
  assert.equal(tactical.currentAttempt.attemptId, attemptId);
  assert.equal(
    'revision' in (await request('/teams/spider-man/journeys/current')).body.data.attempt,
    false,
  );

  const beforeStartTeams = await request(`/teams/spider-man/journeys/current/final-stage/teams`);
  assert.equal(beforeStartTeams.response.status, 409);
  assert.equal(beforeStartTeams.body.responseMessage.messageCode, 'FINAL_STAGE_NOT_ACTIVE');
});

test('Store accepts any positive integer quantity, rejects unaffordable purchases, and preserves no-effect inventory', async () => {
  const historicalPurchase = await request(`/teams/spider-man/journeys/${attemptId}/purchases`, {
    method: 'POST',
    body: JSON.stringify({ itemId: 'ap-major', quantity: 1 }),
  });
  assert.equal(historicalPurchase.response.status, 404);
  const suppliedRevision = await request('/teams/spider-man/journeys/current/purchases', {
    method: 'POST',
    body: JSON.stringify({ itemId: 'ap-major', quantity: 1, expectedRevision: 1 }),
  });
  assert.equal(suppliedRevision.response.status, 400);
  const zero = await request(`/teams/spider-man/journeys/current/purchases`, {
    method: 'POST',
    body: JSON.stringify({ itemId: 'energy-full', quantity: 0 }),
  });
  assert.equal(zero.response.status, 400);
  assert.equal(zero.body.responseMessage.messageCode, 'VALIDATION_ERROR');

  const uncapped = await request(`/teams/spider-man/journeys/current/purchases`, {
    method: 'POST',
    body: JSON.stringify({ itemId: 'energy-full', quantity: 11 }),
  });
  assert.equal(uncapped.response.status, 409);
  assert.equal(uncapped.body.responseMessage.messageCode, 'INSUFFICIENT_REWARD_POINTS');

  const detail = (await request(`/teams/spider-man/journeys/${attemptId}/teams`)).body.data;
  const player = detail.teams.find((value) => value.teamId === 'spider-man');
  const target = player.heroes.find((value) => !value.knockedOut);
  assert.ok(target);

  const purchased = await request(`/teams/spider-man/journeys/current/purchases`, {
    method: 'POST',
    body: JSON.stringify({ itemId: 'revive', quantity: 1 }),
  });
  assert.equal(purchased.response.status, 200);
  assert.equal('revision' in purchased.body.data, false);
  for (const itemId of ['ap-minor', 'ap-minor-all']) {
    const apPurchase = await request(`/teams/spider-man/journeys/current/purchases`, {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity: 1 }),
    });
    assert.equal(apPurchase.response.status, 200);
    assert.equal('revision' in apPurchase.body.data, false);
  }
  const noEffect = await request(`/teams/spider-man/journeys/current/preparation/items`, {
    method: 'POST',
    body: JSON.stringify({
      itemId: 'revive',
      targetHeroId: target.heroId,
    }),
  });
  assert.equal(noEffect.response.status, 422);
  assert.equal(noEffect.body.responseMessage.messageCode, 'POWER_UP_UNAVAILABLE');
  const inventory = (await request(`/teams/spider-man/journeys/current/inventory`)).body.data.items;
  assert.equal(inventory.find((value) => value.itemId === 'revive').quantity, 1);
  assert.ok(inventory.some((value) => value.itemId === 'ap-minor'));
  assert.ok(inventory.some((value) => value.itemId === 'ap-minor-all'));

  const teamsBeforePreparation = (await request(`/teams/spider-man/journeys/${attemptId}/teams`))
    .body.data.teams;
  const team = teamsBeforePreparation.find((value) => value.teamId === 'spider-man');
  const livingIds = team.heroes.filter((hero) => !hero.knockedOut).map((hero) => hero.heroId);
  const reserveIds = team.heroes
    .filter((hero) => hero.status === 'INACTIVE' && !hero.knockedOut)
    .map((hero) => hero.heroId);
  preparedActiveHeroIds = [team.leaderId];
  for (const heroId of [...reserveIds, ...livingIds]) {
    if (preparedActiveHeroIds.length === 3) {
      break;
    }
    if (!preparedActiveHeroIds.includes(heroId)) {
      preparedActiveHeroIds.push(heroId);
    }
  }
  const prepared = await request(`/teams/spider-man/journeys/current/preparation`, {
    method: 'PUT',
    body: JSON.stringify({
      activeHeroIds: preparedActiveHeroIds,
      strategy: team.strategyCode,
    }),
  });
  assert.equal(prepared.response.status, 200);
  assert.equal('revision' in prepared.body.data, false);
});

test('interactive FinalStage exposes legal actions, persists each selected action, and reveals Doom after cycle four', async () => {
  const revisionInput = await request('/teams/spider-man/journeys/current/final-stage/play', {
    method: 'POST',
    body: JSON.stringify({ type: 'START', expectedRevision: 1 }),
  });
  assert.equal(revisionInput.response.status, 400);
  let receipt = (
    await request(`/teams/spider-man/journeys/current/final-stage/play`, {
      method: 'POST',
      body: JSON.stringify({ type: 'START' }),
    })
  ).body.data;
  const initializedFormation = (
    await request(`/teams/spider-man/journeys/current/final-stage/teams`)
  ).body.data.player;
  assert.equal(initializedFormation.heroes.filter((hero) => hero.status === 'ACTIVE').length, 3);
  assert.deepEqual(
    initializedFormation.heroes
      .filter((hero) => hero.status === 'ACTIVE')
      .map((hero) => hero.heroId)
      .sort(),
    [...preparedActiveHeroIds].sort(),
  );
  const openingEvents = (await request(`/teams/spider-man/journeys/current/final-stage/events`))
    .body.data.events;
  assert.deepEqual(
    openingEvents.map((value) => value.sequence),
    [...openingEvents].map((value) => value.sequence).sort((left, right) => left - right),
  );
  const opening = openingEvents.find((value) => value.eventCode === 'TOURNAMENT_FINAL_STARTED');
  assert.equal(opening.narrative.lines[0].type, 'DIALOGUE');
  assert.equal(opening.narrative.lines[0].speakerId, 'silver-surfer');
  assert.deepEqual(
    opening.narrative.lines.map((line) => line.lineSequence),
    [1],
  );
  const openingActions = (await request(`/teams/spider-man/journeys/current/final-stage/actions`))
    .body.data.actions;
  assert.equal(
    (await request(`/teams/spider-man/journeys/${attemptId}/final-stage/actions`)).response.status,
    404,
  );
  assert.equal(
    (
      await request(`/teams/spider-man/journeys/${attemptId}/final-stage/play`, {
        method: 'POST',
        body: JSON.stringify({ type: 'ABANDON' }),
      })
    ).response.status,
    404,
  );
  const filteredBasic = (
    await request('/teams/spider-man/journeys/current/final-stage/actions?actionCode=BASIC_ATTACK')
  ).body.data.actions;
  assert.deepEqual(
    filteredBasic,
    openingActions.filter((action) => action.actionCode === 'BASIC_ATTACK'),
  );
  const filteredEmpty = (
    await request(
      '/teams/spider-man/journeys/current/final-stage/actions?actionCode=NOT_CURRENTLY_LEGAL',
    )
  ).body.data.actions;
  assert.deepEqual(filteredEmpty, []);
  const otherSimulation = await request('/teams/black-panther/journeys/simulate', {
    method: 'POST',
    body: JSON.stringify({ spendingStrategy: 'BALANCED' }),
  });
  assert.equal(otherSimulation.response.status, 201);
  assert.equal(otherSimulation.body.data.replacedPrevious, false);
  const replacementSimulation = await request('/teams/black-panther/journeys/simulate', {
    method: 'POST',
    body: JSON.stringify({ spendingStrategy: 'BALANCED' }),
  });
  assert.equal(replacementSimulation.response.status, 201);
  assert.equal(replacementSimulation.body.data.replacedPrevious, true);
  const otherStart = await request('/teams/black-panther/journeys/current/final-stage/play', {
    method: 'POST',
    body: JSON.stringify({ type: 'START' }),
  });
  assert.equal(otherStart.response.status, 200);
  const otherActions = (await request('/teams/black-panther/journeys/current/final-stage/actions'))
    .body.data.actions;
  const crossJourney = await request('/teams/spider-man/journeys/current/final-stage/play', {
    method: 'POST',
    body: JSON.stringify({ type: 'CHOOSE_ACTION', actionId: otherActions[0].actionId }),
  });
  assert.equal(crossJourney.response.status, 422);
  assert.equal(crossJourney.body.responseMessage.messageCode, 'INVALID_FINAL_ACTION');
  const abilityIds = {
    BASIC_ATTACK: 'basic-attack',
    OFFENSIVE_SPECIAL: 'offensive-special',
    SUPPORT_SPECIAL: 'support-special',
    LEADER_ABILITY: 'leader-ability',
  };
  for (const action of openingActions) {
    if (abilityIds[action.actionCode]) {
      assert.equal(action.abilityId, abilityIds[action.actionCode]);
      assert.notEqual(action.label, 'Basic Attack');
      assert.notEqual(action.label, 'Basic Strike');
    }
  }
  let view = (await request(`/teams/spider-man/journeys/current/final-stage`)).body.data;
  assert.equal(view.phase, 'TOURNAMENT_FINAL');
  assert.equal('antagonist' in view, false);
  assert.equal(receipt.status, 'ACTIVE');
  const actOneTeams = (await request(`/teams/spider-man/journeys/current/final-stage/teams`)).body
    .data;
  assert.equal(actOneTeams.variant, 'TOURNAMENT_FINAL');
  assert.equal('antagonist' in actOneTeams, false);

  const initialTurn = view.normalTurn;
  assert.equal('revision' in receipt, false);
  assert.equal('previousRevision' in receipt, false);
  assert.equal('command' in receipt, false);
  assert.equal('attemptId' in receipt, false);
  const strategyAction = openingActions.find(
    (action) =>
      action.actionCode === 'CHANGE_STRATEGY' &&
      action.strategyCode !== actOneTeams.player.strategyCode,
  );
  assert.ok(strategyAction, 'Expected an authoritative strategy change at the start of the Final.');
  receipt = (
    await request(`/teams/spider-man/journeys/current/final-stage/play`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'CHOOSE_ACTION',
        actionId: strategyAction.actionId,
      }),
    })
  ).body.data;
  let afterTactic = (await request(`/teams/spider-man/journeys/current/final-stage`)).body.data;
  assert.equal(afterTactic.normalTurn, initialTurn);
  assert.equal('revision' in afterTactic, false);
  const updatedTeams = (await request(`/teams/spider-man/journeys/current/final-stage/teams`)).body
    .data;
  assert.equal(updatedTeams.player.strategyCode, strategyAction.strategyCode);

  const staleAction = await request(`/teams/spider-man/journeys/current/final-stage/play`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'CHOOSE_ACTION',
      actionId: openingActions.find((action) => action.actionCode === 'BASIC_ATTACK').actionId,
    }),
  });
  assert.equal(staleAction.response.status, 422);
  assert.equal(staleAction.body.responseMessage.messageCode, 'INVALID_FINAL_ACTION');

  const swapAction = (
    await request(`/teams/spider-man/journeys/current/final-stage/actions`)
  ).body.data.actions.find((action) => action.actionCode === 'SWAP');
  assert.ok(swapAction, 'Expected an authoritative Active/Reserve swap at the start of the Final.');
  receipt = (
    await request(`/teams/spider-man/journeys/current/final-stage/play`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'CHOOSE_ACTION',
        actionId: swapAction.actionId,
      }),
    })
  ).body.data;
  afterTactic = (await request(`/teams/spider-man/journeys/current/final-stage`)).body.data;
  assert.equal(afterTactic.normalTurn, initialTurn);
  assert.equal('revision' in afterTactic, false);
  const swappedTeams = (await request(`/teams/spider-man/journeys/current/final-stage/teams`)).body
    .data;
  const outgoing = swappedTeams.player.heroes.find(
    (hero) => hero.heroId === swapAction.outgoingHeroId,
  );
  const incoming = swappedTeams.player.heroes.find(
    (hero) => hero.heroId === swapAction.incomingHeroId,
  );
  assert.equal(outgoing.status, 'INACTIVE');
  assert.equal(incoming.status, 'ACTIVE');

  for (let turn = 1; turn <= 4 && receipt.status === 'ACTIVE'; turn += 1) {
    const actions = (await request(`/teams/spider-man/journeys/current/final-stage/actions`)).body
      .data.actions;
    const action = actions.find((value) =>
      ['OFFENSIVE_SPECIAL', 'BASIC_ATTACK', 'TEAM_ACTION', 'LEADER_ABILITY'].includes(
        value.actionCode,
      ),
    );
    assert.ok(action, `Expected a legal combat action at cycle ${turn}.`);
    receipt = (
      await request(`/teams/spider-man/journeys/current/final-stage/play`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'CHOOSE_ACTION',
          actionId: action.actionId,
        }),
      })
    ).body.data;
  }
  view = (await request(`/teams/spider-man/journeys/current/final-stage`)).body.data;
  assert.equal(receipt.status, 'ACTIVE');
  assert.equal(view.normalTurn, 4);
  assert.equal(view.phase, 'DOOMSDAY');
  assert.equal(view.doom.narrativeCharacterId, 'doctor-doom');
  const events = (await request(`/teams/spider-man/journeys/current/final-stage/events`)).body.data
    .events;
  assert.ok(events.some((value) => value.eventCode === 'DOOM_REVEALED'));
  const reveal = events.find((value) => value.eventCode === 'DOOM_REVEALED');
  assert.equal(reveal.phase, 'DOOMSDAY');
  assert.equal(reveal.values.previousIdentityId, 'silver-surfer');
  assert.equal(reveal.values.revealedIdentityId, 'doctor-doom');
  const explanation = events.find((value) => value.eventCode === 'DOOM_EXPLANATION');
  assert.deepEqual(
    explanation.narrative.lines.map((line) => line.lineSequence),
    [1, 2, 3, 4],
  );
  const finalInventory = (await request(`/teams/spider-man/journeys/current/inventory`)).body.data
    .items;
  assert.ok(finalInventory.every((item) => item.legalUseContexts.includes('FINAL_STAGE')));
  const powerUpCatalog = (
    await request(`/reference/power-ups?teamId=spider-man&attemptId=${attemptId}`)
  ).body.data;
  assert.equal(powerUpCatalog.powerUps.find((item) => item.id === 'ap-major').targetScope, 'HERO');
  assert.equal(
    powerUpCatalog.powerUps.find((item) => item.id === 'ap-major-all').targetScope,
    'TEAM',
  );
  assert.equal('revision' in receipt, false);
});

test('restart restores typed active state and ABANDON completes with official statistics and History', async () => {
  await app.close();
  await start();
  const restored = (await request(`/teams/spider-man/journeys/current/final-stage`)).body.data;
  assert.equal('revision' in restored, false);
  assert.equal(restored.phase, 'DOOMSDAY');
  assert.equal(restored.doom.narrativeCharacterId, 'doctor-doom');
  const completed = (
    await request(`/teams/spider-man/journeys/current/final-stage/play`, {
      method: 'POST',
      body: JSON.stringify({ type: 'ABANDON' }),
    })
  ).body.data;
  assert.equal(completed.status, 'COMPLETED');
  assert.equal(completed.completionOutcome, 'ABANDON');
  assert.equal(completed.terminalReasonCode, 'PLAYER_ABANDONED');
  const completedState = (await request(`/teams/spider-man/journeys/current/final-stage`)).body
    .data;
  assert.equal(completedState.completion.terminalReasonCode, 'PLAYER_ABANDONED');
  assert.deepEqual(
    (await request(`/teams/spider-man/journeys/${attemptId}/final-stage`)).body.data,
    completedState,
  );
  assert.equal(
    (await request('/teams/spider-man/journeys/current/final-stage/actions')).response.status,
    409,
  );
  const postCompletionPlay = await request('/teams/spider-man/journeys/current/final-stage/play', {
    method: 'POST',
    body: JSON.stringify({ type: 'ABANDON' }),
  });
  assert.equal(postCompletionPlay.response.status, 409);
  const statistics = (await request(`/teams/spider-man/journeys/${attemptId}/statistics`)).body
    .data;
  assert.deepEqual(
    (await request('/teams/spider-man/journeys/current/statistics')).body.data,
    statistics,
  );
  assert.equal(statistics.eligibility.eligibleTeamIds.length, 8);
  assert.deepEqual(
    statistics.awards.map((value) => value.code),
    ['MIGHTIEST_HERO', 'BEST_SUPPORT', 'MOST_RESILIENT', 'JOURNEY_MVP'],
  );
  const history = (await request('/teams/spider-man/history')).body.data;
  assert.ok(
    history.items.some((value) => value.attemptId === attemptId && value.outcomeCode === 'ABANDON'),
  );
  const historyRow = history.items.find((value) => value.attemptId === attemptId);
  const historicalTeams = (await request(`/teams/spider-man/journeys/${attemptId}/teams`)).body
    .data;
  assert.equal(
    historyRow.opponentFinalistName,
    historicalTeams.teams.find((team) => team.teamId === historyRow.opponentFinalistId).name,
  );
  for (const field of ['revision', 'seed', 'rulesVersion', 'contentVersion', 'awardsVersion']) {
    assert.equal(field in historyRow, false);
  }
});
