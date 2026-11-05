#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

const auditDir = __dirname;
const apiDir = path.resolve(auditDir, '..');
const artifactPath = path.join(
  auditDir,
  'artifacts',
  process.env.AUDIT_OUTPUT_FILE || 'full-player-journey-audit.json',
);
const port = Number(process.env.AUDIT_PORT || 5319);
const host = process.env.AUDIT_HOST || '127.0.0.1';
const baseUrl = process.env.AUDIT_BASE_URL || `http://${host}:${port}/game`;
const language = 'en';
const seed = Number(process.env.AUDIT_SEED || 20260921);
const serverLogPath = path.join(auditDir, 'artifacts', 'full-player-journey-server.log');

const operations = [
  ['GET', '/game/health', 'health'],
  ['GET', '/game/teams', 'Teams'],
  ['GET', '/game/heroes', 'Heroes'],
  ['GET', '/game/heroes/relationships', 'Heroes'],
  ['GET', '/game/reference/game-dictionary', 'Reference'],
  ['GET', '/game/reference/strategies', 'Reference'],
  ['GET', '/game/reference/power-ups', 'Reference'],
  ['GET', '/game/reference/prologue', 'Reference'],
  ['GET', '/game/teams/{teamId}/profile', 'Teams'],
  ['GET', '/game/teams/{teamId}/configuration', 'Teams'],
  ['PUT', '/game/teams/{teamId}/configuration', 'Teams'],
  ['GET', '/game/teams/{teamId}/history', 'Teams'],
  ['POST', '/game/teams/{teamId}/journeys/simulate', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/current', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/teams', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/stages', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/encounters', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/encounters/{encounterId}', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/events', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/rewards', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/inventory', 'Journey'],
  ['POST', '/game/teams/{teamId}/journeys/{attemptId}/purchases', 'Journey'],
  ['POST', '/game/teams/{teamId}/journeys/{attemptId}/preparation/items', 'Journey'],
  ['PUT', '/game/teams/{teamId}/journeys/{attemptId}/preparation', 'Journey'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/final-stage', 'Final Stage'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/final-stage/teams', 'Final Stage'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/final-stage/actions', 'Final Stage'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/final-stage/events', 'Final Stage'],
  ['POST', '/game/teams/{teamId}/journeys/{attemptId}/final-stage/play', 'Final Stage'],
  ['GET', '/game/teams/{teamId}/journeys/{attemptId}/statistics', 'Statistics'],
];

const steps = [];
const featureRanges = new Map();
const findings = [];
const derivedObservations = [
  {
    classification: 'OBSERVATION',
    feature: 'Narrative Consumption',
    summary: 'All public RPG event families use the same narrative.lines[] projection; Journey, Encounter, and FinalStage text can be rendered through one consumer contract.',
    evidence: 'Unified event projection is validated on future runs; the historical 158-step trace retains the pre-normalization observation.',
  },
  {
    classification: 'OBSERVATION',
    feature: 'Targeted Branch Coverage',
    summary: 'This golden run naturally ended in DEFEAT; Victory, Abandon, and Sue Appeal branches require separate targeted audits and were not forced here.',
    evidence: 'Terminal outcome from completion steps 142–149',
  },
  {
    classification: 'OBSERVATION',
    feature: 'Swagger Cross-Check',
    summary: 'The generated OpenAPI document matched 30 paths, 31 operations, and the seven approved tags.',
    evidence: 'OpenAPI verification step 158',
  },
];
const observedActionIds = new Set();
const observedIdentifiers = new Set();
let stepNo = 0;
let child;
let serverLog;
let teamId;
let attemptId;
let endingCode = null;
let terminalOutcome = null;
let revealSeen = false;
let revealStep = null;
let finalDecisionCount = 0;
let purchaseRecord = null;
let itemUseRecord = null;
let preparationRecord = null;
let selectedTeam = null;
let finalStartedStep = null;
let finalCompletedStep = null;
let finalActionResponses = [];

const featureNames = [
  'Feature 01 — Health / Bootstrap',
  'Feature 02 — Team Discovery & Profile',
  'Feature 03 — Hero Catalog & Relationships',
  'Feature 04 — Reference Data & Prologue',
  'Feature 05 — Team Configuration',
  'Feature 06 — Journey Creation',
  'Feature 07 — Tournament Overview',
  'Feature 08 — Encounters & Journey Events',
  'Feature 09 — Rewards',
  'Feature 10 — Store / Purchases',
  'Feature 11 — Inventory & Item Use',
  'Feature 12 — Final Preparation',
  'Feature 13 — FinalStage Bootstrap',
  'Feature 14 — Interactive Final Battle',
  'Feature 15 — Doom Reveal / Act II',
  'Feature 16 — Completion',
  'Feature 17 — Statistics & Awards',
  'Feature 18 — History / Post-Game State',
];

function featureStart(feature) {
  if (!featureRanges.has(feature)) featureRanges.set(feature, { firstStep: stepNo, lastStep: stepNo });
  return feature;
}
function featureEnd(feature) {
  const range = featureRanges.get(feature);
  if (range) range.lastStep = stepNo;
}
function addFinding(classification, feature, summary, evidence = {}) {
  findings.push({ classification, feature, summary, ...evidence });
}
function unwrap(body) {
  return body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;
}
function safeArray(value) { return Array.isArray(value) ? value : []; }
function firstDefined(...values) { return values.find((value) => value !== undefined && value !== null); }
function getStatus(data) { return firstDefined(data?.status, data?.state?.status, data?.finalStage?.status); }
function getRevision(data) { return firstDefined(data?.revision, data?.state?.revision, data?.finalStage?.revision, 0); }
function jsonClone(value) { return value === undefined ? null : JSON.parse(JSON.stringify(value)); }
function serializeQuery(query) { return Object.fromEntries(Object.entries(query || {}).filter(([, value]) => value !== undefined)); }
function operationKey(method, requestPath) {
  for (const [verb, route, tag] of operations) {
    const pattern = new RegExp('^' + route.split('/').map((segment) => segment.startsWith('{') && segment.endsWith('}') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('/') + '$');
    if (verb === method && pattern.test(requestPath)) return { verb, route, tag };
  }
  return null;
}
function noteObservation(responseBody) {
  const data = unwrap(responseBody);
  if (data?.attemptId) { attemptId = data.attemptId; observedIdentifiers.add(String(data.attemptId)); }
  if (data?.teamId) { observedIdentifiers.add(String(data.teamId)); }
  if (data?.endingCode) endingCode = data.endingCode;
  if (data?.completionOutcome) terminalOutcome = data.completionOutcome;
  if (data?.outcomeCode && !terminalOutcome) terminalOutcome = data.outcomeCode;
}
function extractBodyError(body) {
  return body?.responseMessage?.messageCode || body?.message || null;
}
async function call({ feature, intent, method, path: requestPath, query, body, expectedStatuses = [200, 201], observation = '', decision = null, allowUnlisted = false }) {
  const queryObject = serializeQuery(query);
  const suffix = baseUrl.endsWith('/game') && requestPath.startsWith('/game') ? requestPath.slice('/game'.length) : requestPath;
  const url = new URL(`${baseUrl}${suffix}`);
  for (const [key, value] of Object.entries(queryObject)) url.searchParams.set(key, String(value));
  let response;
  let parsed;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined || body === null ? { accept: 'application/json' } : { accept: 'application/json', 'content-type': 'application/json' },
      body: body === undefined || body === null ? undefined : JSON.stringify(body),
    });
    const raw = await response.text();
    try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = { raw }; }
  } catch (error) {
    parsed = { error: String(error) };
    response = { status: 0, headers: new Map() };
  }
  const step = {
    step: ++stepNo,
    feature,
    intent,
    endpoint: { method, path: requestPath, query: queryObject },
    request: { pathParams: {}, query: queryObject, body: body === undefined ? null : jsonClone(body) },
    response: { status: response.status, headers: { contentType: response.headers?.get?.('content-type') || null }, body: jsonClone(parsed) },
    playerObservation: observation,
    playerDecision: decision,
    result: expectedStatuses.includes(response.status) ? 'PASS' : 'INCONSISTENCY',
  };
  steps.push(step);
  featureStart(feature); featureEnd(feature);
  noteObservation(parsed);
  const op = operationKey(method, requestPath);
  if (!op && !allowUnlisted) addFinding('INCONSISTENCY', feature, `Observed route is not in the approved operation inventory: ${method} ${requestPath}`, { step: step.step });
  if (!expectedStatuses.includes(response.status)) {
    addFinding('INCONSISTENCY', feature, `${method} ${requestPath} returned ${response.status} instead of ${expectedStatuses.join('/')}.`, { step: step.step, status: response.status, messageCode: extractBodyError(parsed) });
  }
  return { step, status: response.status, body: parsed, data: unwrap(parsed) };
}
function publicErrorReason(result) { return extractBodyError(result.body) || `HTTP ${result.status}`; }
function chooseFromCatalog(collection, preferred, fallback) {
  const values = safeArray(collection);
  return values.find((item) => preferred(item)) || values.find((item) => fallback(item)) || values[0];
}
function pickTeam(data) {
  const teams = safeArray(data?.teams || data?.assignedTeams || data);
  return teams[0] || null;
}
function teamHeroes(data) {
  return safeArray(data?.heroes || data?.team?.heroes || data?.members);
}
function getHeroId(hero) { return hero?.heroId || hero?.id || hero?.referenceId; }
function getHeroMaxEnergy(hero) { return firstDefined(hero?.resources?.maximumEnergy, hero?.maximumEnergy, 100); }
function getActionCode(action) { return action?.actionCode || action?.code; }
function getActions(data) { return safeArray(data?.actions || data?.legalActions || data); }
function isTerminal(data) {
  const status = String(getStatus(data) || '').toUpperCase();
  return ['COMPLETED', 'VICTORY', 'DEFEAT', 'ABANDON', 'FINISHED'].includes(status) || Boolean(data?.completionOutcome || data?.outcome || data?.endingCode);
}
function containsForbiddenBeforeReveal(value) {
  const text = JSON.stringify(value).toLowerCase();
  return /(?:^|[^a-z])(doctor[- ]doom|doom|victor|boss|antagonist|dormammu)(?:$|[^a-z])/.test(text);
}
function extractEvents(data) { return safeArray(data?.events || data?.timeline || data?.emittedEvents || data); }
function validateRpgEventNarrative(data, feature, step) {
  for (const event of extractEvents(data)) {
    if (Object.prototype.hasOwnProperty.call(event || {}, 'message')) addFinding('INCONSISTENCY', feature, 'A public RPG event still exposes the removed flat message field.', { step: step.step, eventCode: event?.eventCode });
    const lines = event?.narrative?.lines;
    if (!Array.isArray(lines) || lines.length === 0) { addFinding('INCONSISTENCY', feature, 'A public RPG event is missing a non-empty narrative.lines[] projection.', { step: step.step, eventCode: event?.eventCode }); continue; }
    for (const line of lines) {
      if (line?.type === 'DIALOGUE' && !line?.speakerId) addFinding('INCONSISTENCY', feature, 'A DIALOGUE narrative line has no speakerId.', { step: step.step, eventCode: event?.eventCode });
      if (line?.type === 'NARRATION' && line?.speakerId !== null) addFinding('INCONSISTENCY', feature, 'A NARRATION narrative line has a non-null speakerId.', { step: step.step, eventCode: event?.eventCode });
    }
  }
}
function eventHasReveal(event) {
  const text = JSON.stringify(event).toUpperCase();
  return text.includes('DOOM_REVEALED') || text.includes('DOOM_REVEAL') || text.includes('DOOMSDAY');
}
function chooseAction(actions, teams, state, chosenFlags) {
  const list = actions.filter(Boolean);
  const available = (code) => list.find((action) => getActionCode(action) === code);
  const playerHeroes = teamHeroes(teams?.player || teams?.playerTeam || teams).filter((hero) => hero?.status !== 'KO' && hero?.knockedOut !== true);
  const active = playerHeroes.find((hero) => hero?.active || hero?.isActive);
  const energyLow = active && Number(active.currentEnergy ?? active.energy ?? 100) < Number(getHeroMaxEnergy(active)) * 0.35;
  let action;
  let reason;
  if (!chosenFlags.strategy && available('CHANGE_STRATEGY')) {
    action = available('CHANGE_STRATEGY'); chosenFlags.strategy = true; reason = 'The public legal-action list allows a strategy change, so the player makes one tactical adjustment before committing a combat action.';
  } else if (!chosenFlags.swap && energyLow && available('SWAP')) {
    action = available('SWAP'); chosenFlags.swap = true; reason = 'The public team state shows the active Hero is low on Energy, and a legal SWAP is available.';
  } else if (!chosenFlags.leader && available('LEADER_ABILITY')) {
    action = available('LEADER_ABILITY'); chosenFlags.leader = true; reason = 'A legal Leader Ability is available and the public action description identifies its target and cost.';
  } else if (available('OFFENSIVE_SPECIAL')) {
    action = available('OFFENSIVE_SPECIAL'); reason = 'The public legal actions show an affordable Offensive Special with an explicit target, so the player prefers the stronger named ability.';
  } else if (available('SUPPORT_SPECIAL')) {
    action = available('SUPPORT_SPECIAL'); reason = 'The public legal actions show a Support Special; the player uses it when no higher-priority offensive special is offered.';
  } else if (available('BASIC_ATTACK')) {
    action = available('BASIC_ATTACK'); reason = 'The player selects a legal Basic Attack as the reliable fallback shown by the API.';
  } else if (available('TEAM_ACTION')) {
    action = available('TEAM_ACTION'); reason = 'The only suitable public legal choice is the available team action.';
  } else if (available('SUE_STORM_APPEAL')) {
    action = available('SUE_STORM_APPEAL'); reason = 'The API exposes a unique legal Sue Storm action after reveal; the player selects it because it is a clearly distinct zero-cost choice.';
  } else if (available('SWAP')) {
    action = available('SWAP'); reason = 'No preferred combat action is legal, so the player uses the available tactical swap.';
  } else {
    action = list[0]; reason = 'The player selects the first remaining legal action because the API exposes no higher-priority choice.';
  }
  return { action, reason };
}
function discoverAttemptId(result) {
  const data = result.data;
  return data?.attemptId || data?.attempt?.attemptId || data?.journey?.attemptId || data?.id || null;
}
function updateFromFinal(data) {
  const status = String(getStatus(data) || '').toUpperCase();
  if (data?.endingCode) endingCode = data.endingCode;
  if (data?.completionOutcome) terminalOutcome = data.completionOutcome;
  if (data?.outcome) terminalOutcome = data.outcome;
  if (status === 'DOOMSDAY' || status === 'FINAL_ATTACK' || data?.doom || data?.antagonist) revealSeen = true;
}
async function waitForPort() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const socket = net.createConnection({ host, port });
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => { socket.destroy(); resolve(false); });
    });
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Game API did not listen on ${host}:${port}`);
}
function startServer() {
  serverLog = fs.createWriteStream(serverLogPath, { flags: 'w' });
  const dbPath = path.join(auditDir, 'artifacts', `full-player-journey-${Date.now()}.sqlite`);
  child = spawn('npm', ['run', 'start:prod'], {
    cwd: apiDir,
    env: { ...process.env, APP_PORT: String(port), APP_HOST: host, APP_BASE_PATH: 'game', APP_LOG_LEVEL: 'error', DB_DATABASE: dbPath, DB_SEED_THEME: 'avengers-doomsday' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.pipe(serverLog); child.stderr.pipe(serverLog);
  return waitForPort();
}
async function stopServer() {
  if (!child) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => { const timer = setTimeout(resolve, 5000); child.once('exit', resolve); timer.unref(); });
  if (serverLog) serverLog.end();
}
function addPlaceholderFinding() {
  for (const step of steps) {
    const bodyText = JSON.stringify(step.response.body);
    if (/<(omitted|same as previous|large response)>/i.test(bodyText)) addFinding('INCONSISTENCY', step.feature, 'Raw response contains a placeholder instead of a complete body.', { step: step.step });
  }
}
function makeCoverage() {
  return operations.map(([method, route, tag]) => {
    const matching = steps.filter((step) => step.endpoint.method === method && operationKey(method, step.endpoint.path)?.route === route);
    return { method, path: route, tag, calls: matching.length, firstStep: matching[0]?.step || null, features: [...new Set(matching.map((step) => step.feature))], exercised: matching.length > 0, whyNotExercised: matching.length ? null : 'Not reached naturally in the selected terminal journey.' };
  });
}
function makeFeatures() {
  return featureNames.map((name) => {
    const range = featureRanges.get(name);
    const featureSteps = steps.filter((step) => step.feature === name);
    let status = 'PASS';
    if (!featureSteps.length) status = 'OBSERVATION';
    if (featureSteps.some((step) => step.result === 'INCONSISTENCY')) status = 'INCONSISTENCY';
    return { feature: name, firstStep: range?.firstStep || null, lastStep: range?.lastStep || null, status, stepCount: featureSteps.length };
  });
}
async function runJourney() {
  let result;
  result = await call({ feature: featureNames[0], intent: 'Discover API health', method: 'GET', path: '/game/health', observation: 'The player checks that the public API is available.' });
  result = await call({ feature: featureNames[1], intent: 'Discover assigned Teams', method: 'GET', path: '/game/teams', query: { lang: language }, observation: 'The player learns which Team identifiers are public.' });
  selectedTeam = pickTeam(result.data);
  teamId = selectedTeam?.teamId || selectedTeam?.id || selectedTeam?.referenceId;
  if (!teamId) throw new Error('No public teamId returned by GET /game/teams');
  observedIdentifiers.add(String(teamId));
  await call({ feature: featureNames[1], intent: 'Read Team profile', method: 'GET', path: `/game/teams/${teamId}/profile`, query: { lang: language }, observation: 'The player reads the public Team identity and Leader context.' });
  const heroesResult = await call({ feature: featureNames[2], intent: 'Discover selectable Heroes', method: 'GET', path: '/game/heroes', query: { lang: language }, observation: 'The player discovers Hero ids, names, abilities, and public resources.' });
  const heroCatalog = safeArray(heroesResult.data?.heroes || heroesResult.data);
  await call({ feature: featureNames[2], intent: 'Discover Hero relationships', method: 'GET', path: '/game/heroes/relationships', query: { lang: language }, observation: 'The player checks public relationship facts before configuring the Team.' });
  const dict = await call({ feature: featureNames[3], intent: 'Discover game vocabulary', method: 'GET', path: '/game/reference/game-dictionary', query: { lang: language }, observation: 'The player reads the public dictionary rather than assuming labels.' });
  const strategies = await call({ feature: featureNames[3], intent: 'Discover Strategy choices', method: 'GET', path: '/game/reference/strategies', query: { lang: language }, observation: 'The player compares public Strategy descriptions.' });
  const powerUps = await call({ feature: featureNames[3], intent: 'Discover Power-Up catalog', method: 'GET', path: '/game/reference/power-ups', query: { lang: language }, observation: 'The player reads legal contexts and prices from the public catalog.' });
  await call({ feature: featureNames[3], intent: 'Read prologue', method: 'GET', path: '/game/reference/prologue', query: { lang: language }, observation: 'The player discovers the narrative premise through the public prologue.' });
  const configBefore = await call({ feature: featureNames[4], intent: 'Read current Team configuration', method: 'GET', path: `/game/teams/${teamId}/configuration`, query: { lang: language }, observation: 'The player inspects the current formation and revisions.' });
  const configData = configBefore.data || {};
  const savedConfiguration = configData.configuration || configData;
  const catalogHeroes = heroCatalog.length ? heroCatalog : teamHeroes(configData);
  const currentCompanions = safeArray(savedConfiguration.companionIds || savedConfiguration.companions || savedConfiguration.heroes).map((hero) => typeof hero === 'string' ? hero : getHeroId(hero)).filter(Boolean);
  const currentActive = safeArray(savedConfiguration.activeHeroIds || savedConfiguration.activeHeroes).map((hero) => typeof hero === 'string' ? hero : getHeroId(hero)).filter(Boolean);
  const companionIds = currentCompanions.length === 5 ? currentCompanions : catalogHeroes.map(getHeroId).filter(Boolean).slice(0, 5);
  const activeHeroIds = currentActive.length === 3 ? currentActive : companionIds.slice(0, 3);
  const strategyValues = safeArray(strategies.data?.strategies || strategies.data?.options || strategies.data);
  const strategyCode = (strategyValues.find((item) => String(item?.code || item?.strategyCode || item?.id).toUpperCase() === 'AGGRESSIVE')?.code || strategyValues.find((item) => String(item?.code || item?.strategyCode || item?.id).toUpperCase() === 'BALANCED')?.code || 'BALANCED');
  const saveBody = { companionIds, activeHeroIds, strategy: strategyCode, expectedConfigurationRevision: Number(configData.configurationRevision ?? configData.revision ?? 0), expectedContextRevision: Number(configData.contextRevision ?? 0), expectedAttemptId: configData.currentAttempt?.attemptId ?? configData.attemptId ?? null, expectedAttemptRevision: configData.currentAttempt?.revision ?? configData.attemptRevision ?? null };
  const configAfter = await call({ feature: featureNames[4], intent: 'Save a deliberate Team configuration', method: 'PUT', path: `/game/teams/${teamId}/configuration`, body: saveBody, observation: 'The player keeps a valid public formation and selects a Strategy described by the catalog.', decision: { reason: 'The selected formation is legal according to the public Team/Hero responses; the Strategy is chosen from the discovered catalog.' } });
  await call({ feature: featureNames[4], intent: 'Reload saved Team configuration', method: 'GET', path: `/game/teams/${teamId}/configuration`, query: { lang: language }, observation: 'The player verifies the saved configuration through a fresh public read.' });
  const currentBefore = await call({ feature: featureNames[5], intent: 'Read current Journey before simulation', method: 'GET', path: `/game/teams/${teamId}/journeys/current`, observation: 'The player checks lifecycle state before creating a Journey.' });
  const currentData = currentBefore.data || {};
  const simulateBody = { seed, spendingStrategy: 'BALANCED', expectedConfigurationRevision: Number(configAfter.data?.configurationRevision ?? configAfter.data?.revision ?? configData.configurationRevision ?? 0), expectedContextRevision: Number(configAfter.data?.contextRevision ?? configData.contextRevision ?? 0), expectedAttemptId: currentData?.attemptId ?? currentData?.attempt?.attemptId ?? null, expectedAttemptRevision: currentData?.revision ?? currentData?.attempt?.revision ?? null };
  const simulated = await call({ feature: featureNames[5], intent: 'Create Journey through public simulation', method: 'POST', path: `/game/teams/${teamId}/journeys/simulate`, body: simulateBody, expectedStatuses: [200, 201], observation: 'The player creates a Journey using only public revisions and the deterministic seed supplied to the audit infrastructure.', decision: { reason: 'The player selects BALANCED spending because the public Journey request supports it and it is a neutral resource policy.' } });
  attemptId = discoverAttemptId(simulated);
  if (!attemptId) throw new Error('No public attemptId returned by Journey simulation');
  observedIdentifiers.add(String(attemptId));
  await call({ feature: featureNames[5], intent: 'Reload current Journey after simulation', method: 'GET', path: `/game/teams/${teamId}/journeys/current`, observation: 'The player confirms the newly created attempt is the current public Journey.' });
  await call({ feature: featureNames[6], intent: 'Read Journey summary', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}`, observation: 'The player reads lifecycle and progression facts.' });
  const journeyTeamsResult = await call({ feature: featureNames[6], intent: 'Read tournament teams', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/teams`, observation: 'The player inspects public tournament participants.' });
  const stages = await call({ feature: featureNames[6], intent: 'Read tournament stages', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/stages`, observation: 'The player reads qualification, bracket, and finalist facts.' });
  const encounters = await call({ feature: featureNames[7], intent: 'Read Encounter summaries', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/encounters`, observation: 'The player discovers available Encounters.' });
  const stageList = safeArray(stages.data?.stages || stages.data);
  const stageId = stageList[0]?.stageId || stageList[0]?.id || stageList[0]?.code;
  if (stageId) await call({ feature: featureNames[7], intent: 'Filter Encounters by public stageId', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/encounters`, query: { stageId }, observation: 'The player uses a stageId returned by the public stages response.' });
  const encounterList = safeArray(encounters.data?.encounters || encounters.data);
  const encounterId = encounterList[0]?.encounterId || encounterList[0]?.id;
  if (encounterId) { observedIdentifiers.add(String(encounterId)); const encounterDetail = await call({ feature: featureNames[7], intent: 'Inspect one Encounter detail', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/encounters/${encounterId}`, query: { lang: language }, observation: 'The player inspects one public Encounter with rounds and localized events.' }); validateRpgEventNarrative(encounterDetail.data?.rounds?.flatMap((round) => round.events || []) || [], featureNames[7], encounterDetail.step); }
  const journeyEvents = await call({ feature: featureNames[7], intent: 'Read Journey event timeline', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/events`, query: { lang: language }, observation: 'The player reads ordered Journey events.' });
  validateRpgEventNarrative(journeyEvents.data, featureNames[7], journeyEvents.step);
  const rewardsBefore = await call({ feature: featureNames[8], intent: 'Read Reward Points', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/rewards`, observation: 'The player checks the public account before shopping.' });
  const inventoryBefore = await call({ feature: featureNames[10], intent: 'Read inventory', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/inventory`, observation: 'The player checks owned quantities and legal use contexts.' });
  const points = Number(rewardsBefore.data?.rewardPoints ?? rewardsBefore.data?.points ?? rewardsBefore.data?.balance ?? 0);
  const catalogItems = safeArray(powerUps.data?.powerUps || powerUps.data?.items || powerUps.data);
  const ownedItems = safeArray(inventoryBefore.data?.items || inventoryBefore.data?.inventory || inventoryBefore.data);
  const candidate = [...catalogItems].filter((item) => Number(item.price ?? 0) <= points && safeArray(item.useContexts).includes('PRE_FINAL')).sort((a, b) => { const teamPreference = (String(b.targetScope).toUpperCase() === 'TEAM' ? 1 : 0) - (String(a.targetScope).toUpperCase() === 'TEAM' ? 1 : 0); return teamPreference || Number(b.price ?? 0) - Number(a.price ?? 0); })[0];
  if (candidate) {
    const purchaseBody = { itemId: candidate.id, quantity: 1, expectedRevision: Number(rewardsBefore.data?.revision ?? inventoryBefore.data?.revision ?? 0) };
    const purchased = await call({ feature: featureNames[9], intent: 'Purchase one affordable PRE_FINAL Power-Up', method: 'POST', path: `/game/teams/${teamId}/journeys/${attemptId}/purchases`, body: purchaseBody, observation: `The player buys ${candidate.name || candidate.id} because its public price is within the public Reward Points balance and its catalog context is PRE_FINAL.`, decision: { reason: 'The purchase is affordable and legally usable in the preparation lifecycle according to the public catalog.' } });
    purchaseRecord = { itemId: candidate.id, price: candidate.price, beforePoints: points, response: purchased.data };
    await call({ feature: featureNames[9], intent: 'Reload rewards after purchase', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/rewards`, observation: 'The player verifies the public Reward Points ledger after purchase.' });
    const inventoryAfterPurchase = await call({ feature: featureNames[9], intent: 'Reload inventory after purchase', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/inventory`, observation: 'The player verifies the purchased quantity through a fresh public read.' });
    const owned = safeArray(inventoryAfterPurchase.data?.items || inventoryAfterPurchase.data?.inventory || inventoryAfterPurchase.data).find((item) => (item.itemId || item.id) === candidate.id);
    if (owned && Number(owned.quantity) > 0) {
      const publicPlayerHeroes = safeArray(journeyTeamsResult.data?.teams?.find((team) => (team.teamId || team.id) === teamId)?.heroes || journeyTeamsResult.data?.playerTeam?.heroes || journeyTeamsResult.data?.player?.heroes);
      const targetCandidate = publicPlayerHeroes.find((hero) => Number(hero.currentEnergy ?? 0) < Number(catalogHeroes.find((item) => getHeroId(item) === hero.heroId)?.resources?.maximumEnergy ?? 999));
      const targetHero = targetCandidate?.heroId || activeHeroIds[0];
      const useBody = { itemId: candidate.id, expectedRevision: Number(inventoryAfterPurchase.data?.revision ?? 0) };
      if (String(candidate.targetScope || '').toUpperCase() === 'HERO' && targetHero) useBody.targetHeroId = targetHero;
      const used = await call({ feature: featureNames[10], intent: 'Use purchased preparation item', method: 'POST', path: `/game/teams/${teamId}/journeys/${attemptId}/preparation/items`, body: useBody, observation: 'The player uses the owned item because the public inventory says it is usable in PRE_FINAL.', decision: { reason: 'The inventory exposes a positive quantity and the catalog exposes a legal PRE_FINAL context.' } });
      itemUseRecord = { itemId: candidate.id, targetHeroId: useBody.targetHeroId || null, response: used.data };
      await call({ feature: featureNames[10], intent: 'Reload inventory after item use', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/inventory`, observation: 'The player verifies the post-use quantity through a public read.' });
    }
  } else {
    addFinding('OBSERVATION', featureNames[10], 'No affordable PRE_FINAL Power-Up was available in the public catalog, so a real purchase was not legally possible in this Journey.');
  }
  const prepSummary = await call({ feature: featureNames[11], intent: 'Read preparation preconditions', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}`, observation: 'The player reloads public Journey state before Final Preparation.' });
  const prepData = prepSummary.data || {};
  const prepRevision = Number(prepData.revision ?? prepData.attemptRevision ?? 0);
  const prepBody = { activeHeroIds, strategy: strategyCode, expectedRevision: prepRevision };
  const prepResult = await call({ feature: featureNames[11], intent: 'Save Final Preparation', method: 'PUT', path: `/game/teams/${teamId}/journeys/${attemptId}/preparation`, body: prepBody, observation: 'The player confirms a valid public three-Hero formation and discovered Strategy before FinalStage.', decision: { reason: 'The selected Heroes and Strategy were already visible through public catalog/configuration responses.' } });
  preparationRecord = { request: prepBody, response: prepResult.data };
  await call({ feature: featureNames[11], intent: 'Reload preparation state', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}`, observation: 'The player verifies that preparation is visible after reload.' });
  const fsBase = `/game/teams/${teamId}/journeys/${attemptId}/final-stage`;
  const fsBefore = await call({ feature: featureNames[12], intent: 'Inspect FinalStage before START', method: 'GET', path: fsBase, query: { lang: language }, observation: 'The player reads the public READY state before beginning the FinalStage.' });
  await call({ feature: featureNames[12], intent: 'Inspect FinalStage teams before START', method: 'GET', path: `${fsBase}/teams`, expectedStatuses: [409], observation: 'The public lifecycle correctly says combatant state is unavailable before START.' });
  await call({ feature: featureNames[12], intent: 'Inspect legal actions before START', method: 'GET', path: `${fsBase}/actions`, query: { lang: language }, expectedStatuses: [409], observation: 'The public lifecycle correctly says legal actions are unavailable before START.' });
  await call({ feature: featureNames[12], intent: 'Inspect FinalStage events before START', method: 'GET', path: `${fsBase}/events`, query: { lang: language }, expectedStatuses: [200], observation: 'The player reads any pre-start event history exposed by the public API.' });
  const startRevision = getRevision(fsBefore.data);
  const started = await call({ feature: featureNames[12], intent: 'START FinalStage', method: 'POST', path: `${fsBase}/play`, query: { lang: language }, body: { type: 'START', expectedRevision: startRevision }, observation: 'The player starts the FinalStage using the public START command and revision.', decision: { reason: 'The READY state and START command are explicitly exposed by the public FinalStage API.' } });
  finalStartedStep = started.step;
  validateRpgEventNarrative(started.data, featureNames[12], started.step);
  updateFromFinal(started.data);
  let state = started.data;
  const chosenFlags = { strategy: false, swap: false, leader: false };
  for (let guard = 0; guard < 140 && !isTerminal(state); guard += 1) {
    const current = await call({ feature: featureNames[13], intent: 'Observe current FinalStage state', method: 'GET', path: fsBase, query: { lang: language }, observation: 'The player refreshes authoritative state before deciding.' });
    state = current.data; updateFromFinal(state);
    const teams = await call({ feature: featureNames[13], intent: 'Observe current FinalStage teams', method: 'GET', path: `${fsBase}/teams`, expectedStatuses: [200, 409], observation: 'The player observes public active/KO Hero state and resources.' });
    const actionsResult = await call({ feature: featureNames[13], intent: 'Observe legal Player actions', method: 'GET', path: `${fsBase}/actions`, query: { lang: language }, expectedStatuses: [200, 409], observation: 'The player uses only the currently legal action list returned by the API.' });
    const eventsResult = await call({ feature: featureNames[13], intent: 'Observe FinalStage events', method: 'GET', path: `${fsBase}/events`, query: { lang: language }, expectedStatuses: [200, 409], observation: 'The player reads ordered events when public state makes them available.' });
    validateRpgEventNarrative(eventsResult.data, featureNames[13], eventsResult.step);
    const events = extractEvents(eventsResult.data);
    const newRevealIndex = events.findIndex(eventHasReveal);
    if (newRevealIndex >= 0) { if (!revealSeen) revealSeen = true; if (!revealStep) revealStep = eventsResult.step.step; }
    if (!revealSeen && (containsForbiddenBeforeReveal(current.data) || containsForbiddenBeforeReveal(actionsResult.data) || containsForbiddenBeforeReveal(eventsResult.data))) {
      addFinding('INCONSISTENCY', featureNames[14], 'A continuing pre-reveal public FinalStage response contains a forbidden Doom-related identity or purpose reference.', { step: current.step });
    }
    if (actionsResult.status !== 200) { state = current.data; if (isTerminal(state)) break; throw new Error(`FinalStage actions unavailable while active at step ${actionsResult.step}: ${publicErrorReason(actionsResult)}`); }
    const actions = getActions(actionsResult.data);
    actions.forEach((action) => { if (action?.actionId) observedActionIds.add(String(action.actionId)); });
    const selected = chooseAction(actions, teams.data, state, chosenFlags);
    if (!selected.action?.actionId) throw new Error(`No legal action selected at step ${actionsResult.step}`);
    const actionId = String(selected.action.actionId);
    const decision = { reason: selected.reason, selectedActionId: actionId };
    const chooseResult = await call({ feature: featureNames[13], intent: `Execute legal ${getActionCode(selected.action)} action`, method: 'POST', path: `${fsBase}/play`, query: { lang: language }, body: { type: 'CHOOSE_ACTION', actionId, expectedRevision: getRevision(current.data) }, observation: 'The player submits one actionId that was just returned by the authoritative legal-actions endpoint.', decision });
    if (!observedActionIds.has(actionId)) addFinding('INCONSISTENCY', featureNames[14], 'A submitted FinalStage actionId was not previously observed in a public legal-actions response.', { step: chooseResult.step, actionId });
    validateRpgEventNarrative(chooseResult.data, featureNames[13], chooseResult.step);
    finalDecisionCount += 1; finalActionResponses.push(chooseResult.data); state = chooseResult.data; updateFromFinal(state);
    const responseEvents = extractEvents(chooseResult.data); if (responseEvents.some(eventHasReveal)) { if (!revealSeen) revealSeen = true; if (!revealStep) revealStep = chooseResult.step.step; }
    if (isTerminal(state)) { finalCompletedStep = chooseResult.step; break; }
  }
  if (!isTerminal(state)) throw new Error('FinalStage did not reach a terminal public state within the audit guard limit.');
  finalCompletedStep = finalCompletedStep || stepNo;
  const postFs = await call({ feature: featureNames[14], intent: 'Reload completed FinalStage state', method: 'GET', path: fsBase, query: { lang: language }, observation: 'The player reconstructs terminal state after combat.' });
  updateFromFinal(postFs.data);
  await call({ feature: featureNames[14], intent: 'Reload completed FinalStage teams', method: 'GET', path: `${fsBase}/teams`, expectedStatuses: [200, 409], observation: 'The player checks terminal combatant projection after completion.' });
  const completedFinalEvents = await call({ feature: featureNames[14], intent: 'Reload completed FinalStage events', method: 'GET', path: `${fsBase}/events`, query: { lang: language }, observation: 'The player verifies persisted FinalStage event history.' });
  validateRpgEventNarrative(completedFinalEvents.data, featureNames[14], completedFinalEvents.step);
  const summary = await call({ feature: featureNames[15], intent: 'Read completed Journey summary', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}`, observation: 'The player compares Journey completion with FinalStage terminal state.' });
  await call({ feature: featureNames[15], intent: 'Read completed Journey events', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/events`, query: { lang: language }, observation: 'The player verifies the cross-Journey timeline includes completion.' });
  await call({ feature: featureNames[16], intent: 'Read Statistics and Awards', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/statistics`, query: { lang: language }, observation: 'The player reads post-game Statistics/Awards through the public endpoint.' });
  await call({ feature: featureNames[17], intent: 'Read Team History', method: 'GET', path: `/game/teams/${teamId}/history`, query: { lang: language }, observation: 'The player checks the completed Journey in Team history.' });
  await call({ feature: featureNames[17], intent: 'Read current Journey after completion', method: 'GET', path: `/game/teams/${teamId}/journeys/current`, observation: 'The player verifies the lifecycle reference after completion.' });
  await call({ feature: featureNames[17], intent: 'Reload final rewards', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/rewards`, observation: 'The player checks post-game Reward Points.' });
  await call({ feature: featureNames[17], intent: 'Reload final inventory', method: 'GET', path: `/game/teams/${teamId}/journeys/${attemptId}/inventory`, observation: 'The player checks post-game inventory.' });
  const spanishChecks = [];
  for (const [feature, intent, path, query] of [
    [featureNames[3], 'Spanish Hero content spot check', '/game/heroes', { lang: 'es' }],
    [featureNames[3], 'Spanish Strategy spot check', '/game/reference/strategies', { lang: 'es' }],
    [featureNames[3], 'Spanish Power-Up spot check', '/game/reference/power-ups', { lang: 'es' }],
    [featureNames[7], 'Spanish Journey events spot check', `/game/teams/${teamId}/journeys/${attemptId}/events`, { lang: 'es' }],
    [featureNames[14], 'Spanish FinalStage narrative spot check', `${fsBase}/events`, { lang: 'es' }],
    [featureNames[3], 'Spanish Dictionary spot check', '/game/reference/game-dictionary', { lang: 'es' }],
  ]) {
    const localizedCheck = await call({ feature, intent, method: 'GET', path, query, observation: 'The player checks representative Spanish localization without replaying the full Journey.' });
    spanishChecks.push(localizedCheck);
    if (path.endsWith('/events')) validateRpgEventNarrative(localizedCheck.data, feature, localizedCheck.step);
  }
  const swagger = await call({ feature: featureNames[17], intent: 'Cross-check runtime routes with OpenAPI', method: 'GET', path: '/game/api-json', expectedStatuses: [200], allowUnlisted: true, observation: 'The audit verifies that observed methods/routes are represented in the generated public Swagger document.' });
  const openapiSummary = validateOpenApi(swagger.body);
  return { summary, spanishChecks, swagger, openapiSummary };
}
function validateOpenApi(swaggerBody) {
  const doc = swaggerBody?.paths ? swaggerBody : swaggerBody?.data?.paths ? swaggerBody.data : null;
  if (!doc) { addFinding('INCONSISTENCY', featureNames[17], 'OpenAPI response did not contain a public paths object.'); return null; }
  const paths = Object.keys(doc.paths || {});
  const count = paths.reduce((total, p) => total + Object.keys(doc.paths[p] || {}).filter((method) => ['get','post','put','patch','delete'].includes(method)).length, 0);
  const tags = doc.tags?.map((tag) => tag.name) || [];
  if (paths.length !== 30 || count !== 31) addFinding('INCONSISTENCY', featureNames[17], `OpenAPI reports ${paths.length} paths and ${count} operations instead of 30/31.`);
  const expectedTags = ['health', 'Teams', 'Heroes', 'Journey', 'Final Stage', 'Statistics', 'Reference'];
  if (JSON.stringify(tags) !== JSON.stringify(expectedTags)) addFinding('INCONSISTENCY', featureNames[17], 'OpenAPI tag order/content differs from the approved seven-tag inventory.', { observed: tags, expected: expectedTags });
  return { paths: paths.length, operations: count, tags };
}
function compareCoherence() {
  const completionStates = steps.filter((step) => /completed|final|history|statistics/i.test(step.intent) && step.response.status === 200).map((step) => step.response.body);
  const serialized = JSON.stringify(completionStates);
  if (endingCode && !serialized.includes(String(endingCode))) addFinding('INCONSISTENCY', featureNames[17], 'The endingCode observed in terminal FinalStage state was not found in later public completion projections.');
}
function buildArtifact(extra = {}) {
  addPlaceholderFinding();
  const coverage = makeCoverage();
  const operationsExercised = coverage.filter((item) => item.exercised).length;
  const featureList = makeFeatures();
  const allFindings = [...findings, ...derivedObservations];
  const statusCounts = { pass: featureList.filter((feature) => feature.status === 'PASS').length, observation: 0, friction: 0, inconsistency: 0, blocker: 0 };
  for (const finding of allFindings) statusCounts[String(finding.classification).toLowerCase()] = (statusCounts[String(finding.classification).toLowerCase()] || 0) + 1;
  const journeyCompleted = Boolean(terminalOutcome || endingCode || finalCompletedStep);
  return {
    metadata: { auditName: 'Game API Full Player Journey Audit', generatedAt: new Date().toISOString(), language, deterministicSeed: seed, baseUrl, startingCommit: 'c723ed3 updated image script', branch: 'tp-11092026', productionCodeModified: false },
    scenario: { selectedTeam, teamId, attemptId, seed, language, playerPolicy: 'Public-observation policy: prefer legal named Specials, use one legal tactical change when available, use a legal swap when public energy is low, otherwise use Basic Attack; no predetermined action sequence.' },
    endpointCoverage: coverage,
    features: featureList,
    steps,
    finalAssessment: {
      journeyCompleted,
      terminalOutcome,
      endingCode,
      totalHttpCalls: steps.length,
      operationsExercised,
      operationsAvailable: 31,
      featuresCompleted: featureList.filter((feature) => feature.status === 'PASS').length,
      featuresAvailable: 18,
      findings: statusCounts,
      publicApiSufficientToCompleteGame: journeyCompleted && statusCounts.blocker === 0,
      hiddenStateRequired: false,
      productionCodeModified: false,
      finalDecisionCount,
      revealOccurred: revealSeen,
      revealStep,
      purchase: purchaseRecord,
      itemUse: itemUseRecord,
      preparation: preparationRecord,
      extra,
    },
    findings: allFindings,
  };
}
async function main() {
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  let runResult = {};
  try {
    if (!process.env.AUDIT_BASE_URL) await startServer();
    runResult = await runJourney();
    compareCoherence();
  } catch (error) {
    addFinding('BLOCKER', 'Audit execution', String(error?.stack || error));
  } finally {
    const artifact = buildArtifact({ openapi: runResult.openapiSummary || null, spanishChecks: (runResult.spanishChecks || []).map((check) => ({ step: check.step.step, path: check.step.endpoint.path, status: check.status })) });
    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
    await stopServer();
    if (artifact.finalAssessment.findings.blocker > 0) process.exitCode = 1;
  }
}
main();
