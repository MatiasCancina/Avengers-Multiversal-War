const { execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

require('reflect-metadata');

const BATTLE_COUNT = 100;
const SEED_START = 1000;
const LANGUAGE = process.env.DIAGNOSTIC_LANGUAGE === 'en' ? 'en' : 'es';
const TEAM_IDS = [
  'spider-man',
  'doctor-strange',
  'captain-america',
  'thor',
  'black-widow',
  'wolverine',
  'reed-richards',
  'iron-man',
];
let STRATEGIES;
const MAIN_REVEAL_CODES = [
  'SURFER_ENOUGH',
  'DOOM_REVEALED',
  'DOOM_EXPLANATION',
  'PLAYER_REJECTION',
  'OPPONENT_ALLIANCE',
  'DOOMSDAY_BEGINS',
];
const EARLY_REVEAL_CODES = ['EARLY_DEFEAT_SCENE'];
const REVEAL_EVENT_CODES = new Set([...MAIN_REVEAL_CODES, ...EARLY_REVEAL_CODES]);
const PRE_REVEAL_FORBIDDEN = [
  'doctor-doom',
  'doctor doom',
  'doom',
  'boss',
  'hiddenboss',
  'futureboss',
  'antagonist',
  'threat',
];
function clone(value) {
  return structuredClone(value);
}

function increment(counter, key) {
  counter[key] = (counter[key] ?? 0) + 1;
}

function containsForbiddenPreRevealValue(value) {
  const serialized = JSON.stringify(value).toLowerCase();
  return PRE_REVEAL_FORBIDDEN.some((forbidden) => serialized.includes(forbidden));
}

function containsForbiddenPreRevealEvents(events) {
  const preRevealEvents = [];
  for (const event of events) {
    if (REVEAL_EVENT_CODES.has(event.eventCode)) {
      break;
    }
    preRevealEvents.push(event);
  }
  return containsForbiddenPreRevealValue(preRevealEvents);
}

function compactTeam(team) {
  return {
    teamId: team.teamId,
    leaderId: team.leaderId,
    heroIds: team.heroes.map((hero) => hero.heroId),
    strategyCode: team.strategyCode,
  };
}

function actionScore(action, phase, policy) {
  const scores = {
    OFFENSIVE_SPECIAL: 50,
    TEAM_ACTION: 45,
    LEADER_ABILITY: 40,
    BASIC_ATTACK: 30,
    SUPPORT_SPECIAL: 20,
    POWER_UP: 10,
    SWAP: 1,
    CHANGE_STRATEGY: 0,
  };
  let score = scores[action.actionCode] ?? 0;
  const targetsDoom = action.target?.targetId === 'doctor-doom';
  if (phase !== 'TOURNAMENT_FINAL' && targetsDoom) {
    score += policy === 'DOOM_FIRST' ? 100 : -25;
  }
  if (phase !== 'TOURNAMENT_FINAL' && policy === 'OPPONENT_FIRST' && !targetsDoom) {
    score += 10;
  }
  return score;
}

function chooseAction(actions, phase, policy) {
  const combatActions = actions.filter(
    (action) => !['SWAP', 'CHANGE_STRATEGY'].includes(action.actionCode),
  );
  const candidates = combatActions.length ? combatActions : actions;
  return [...candidates].sort(
    (left, right) =>
      actionScore(right, phase, policy) - actionScore(left, phase, policy) ||
      left.actionId.localeCompare(right.actionId),
  )[0];
}

function fullyDefeated(team) {
  return team.heroes.length > 0 && team.heroes.every((hero) => hero.condition === 'KNOCKED_OUT');
}

function hasCompleteLocalizedNarrative(events) {
  for (const event of events) {
    if (!event.messageCode || !event.narrative || !event.narrative.lines?.length) {
      return false;
    }
    if (event.narrative.lines.some((line) => !line.type || !line.text)) {
      return false;
    }
  }
  return true;
}

function endingEvents(timeline, outcomeCode) {
  return timeline.filter(
    (event) =>
      REVEAL_EVENT_CODES.has(event.eventCode) ||
      event.eventCode === outcomeCode ||
      [
        'EARLY_DEFEAT_SCENE',
        'PRE_REVEAL_ABANDON',
        'POST_REVEAL_ABANDON',
        'SUE_STORM_APPEAL',
      ].includes(event.eventCode),
  );
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) {
    return 0;
  }
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

async function runBattle(service, battleNumber, configuration, seed, strategy) {
  const teamId = configuration.teamId;
  const playerConfiguration = configuration.configuration;
  const currentAttempt = configuration.currentAttempt;
  const simulation = await service.simulate(teamId, {
    seed,
    spendingStrategy: strategy,
    expectedConfigurationRevision: configuration.configurationRevision,
    expectedContextRevision: configuration.contextRevision,
    expectedAttemptId: currentAttempt?.attemptId ?? null,
    expectedAttemptRevision: currentAttempt?.revision ?? null,
  });
  const attemptId = simulation.attemptId;
  const policy = battleNumber % 2 === 0 ? 'DOOM_FIRST' : 'OPPONENT_FIRST';
  const decisions = [];
  let preRevealDoomLeak = false;
  let illegalSelectedAction = false;
  let opponentDefeatTurn = null;

  let state = await service.finalState(teamId, attemptId, LANGUAGE);
  const initialEvents = await service.finalEvents(teamId, attemptId, LANGUAGE);
  if (state.variant === 'TOURNAMENT_FINAL') {
    preRevealDoomLeak ||= containsForbiddenPreRevealValue({ state, events: initialEvents });
  }

  const startReceipt = await service.play(
    teamId,
    attemptId,
    { type: 'START' },
    state.revision,
    LANGUAGE,
  );
  if (state.variant === 'TOURNAMENT_FINAL') {
    preRevealDoomLeak ||= containsForbiddenPreRevealEvents(startReceipt.emittedEvents);
  }
  decisions.push({
    commandType: 'START',
    turn: state.normalTurn,
    phaseBefore: state.phase,
    revisionBefore: state.revision,
    legalActions: [],
    selectedAction: { actionId: 'START', actionCode: 'START', label: 'Iniciar' },
    emittedEvents: clone(startReceipt.emittedEvents),
    phaseAfter: startReceipt.phase,
    revisionAfter: startReceipt.revision,
    commandReceipt: clone(startReceipt),
    stateBefore: clone(state),
  });
  state = await service.finalState(teamId, attemptId, LANGUAGE);
  let teams = await service.finalTeams(teamId, attemptId);
  decisions[0].teamsAfter = clone(teams);
  const opponent = compactTeam(teams.opponent);

  for (let step = 0; step < 500 && state.variant !== 'COMPLETED'; step += 1) {
    const actions = await service.finalActions(teamId, attemptId, LANGUAGE);
    const eventsBefore = await service.finalEvents(teamId, attemptId, LANGUAGE);
    teams = await service.finalTeams(teamId, attemptId);
    const stateBefore = clone(state);
    const teamsBefore = clone(teams);

    if (state.variant === 'TOURNAMENT_FINAL') {
      preRevealDoomLeak ||= containsForbiddenPreRevealValue({
        state,
        actions,
        teams,
        events: eventsBefore,
      });
    }

    const selected = chooseAction(actions.actions, state.phase, policy);
    if (!selected) {
      const abandonReceipt = await service.play(
        teamId,
        attemptId,
        { type: 'ABANDON' },
        state.revision,
        LANGUAGE,
      );
      if (stateBefore.variant === 'TOURNAMENT_FINAL') {
        // A terminal ABANDON is an owner-approved reveal boundary. Its complete
        // narrative is allowed to disclose Doom after the command completes.
      }
      decisions.push({
        commandType: 'ABANDON',
        turn: state.normalTurn,
        phaseBefore: state.phase,
        revisionBefore: state.revision,
        legalActions: clone(actions.actions),
        selectedAction: { actionId: 'ABANDON', actionCode: 'ABANDON', label: 'Abandonar' },
        emittedEvents: clone(abandonReceipt.emittedEvents),
        phaseAfter: abandonReceipt.phase,
        revisionAfter: abandonReceipt.revision,
        commandReceipt: clone(abandonReceipt),
        stateBefore,
        teamsBefore,
        fallbackReason: 'NO_LEGAL_ACTIONS',
      });
      state = await service.finalState(teamId, attemptId, LANGUAGE);
      break;
    }

    if (!actions.actions.some((action) => action.actionId === selected.actionId)) {
      illegalSelectedAction = true;
    }
    const receipt = await service.play(
      teamId,
      attemptId,
      { type: 'CHOOSE_ACTION', actionId: selected.actionId },
      state.revision,
      LANGUAGE,
    );
    if (stateBefore.variant === 'TOURNAMENT_FINAL') {
      preRevealDoomLeak ||= containsForbiddenPreRevealEvents(receipt.emittedEvents);
    }
    state = await service.finalState(teamId, attemptId, LANGUAGE);
    teams = await service.finalTeams(teamId, attemptId);
    if (
      fullyDefeated(teams.opponent) &&
      receipt.normalTurn < 4 &&
      !state.variant.includes('DOOMSDAY')
    ) {
      opponentDefeatTurn ??= receipt.normalTurn;
    }
    decisions.push({
      commandType: 'CHOOSE_ACTION',
      turn: stateBefore.normalTurn,
      phaseBefore: stateBefore.phase,
      revisionBefore: stateBefore.revision,
      legalActions: clone(actions.actions),
      selectedAction: clone(selected),
      emittedEvents: clone(receipt.emittedEvents),
      phaseAfter: receipt.phase,
      revisionAfter: receipt.revision,
      commandReceipt: clone(receipt),
      stateBefore,
      teamsBefore,
      stateAfter: clone(state),
      teamsAfter: clone(teams),
    });
  }

  if (state.variant !== 'COMPLETED') {
    throw new Error(`Battle ${battleNumber} exceeded the diagnostic safety budget.`);
  }

  const eventData = await service.finalEvents(teamId, attemptId, LANGUAGE);
  const timeline = eventData.events;
  const outcomeCode = state.completion.outcomeCode;
  const revealEvent = timeline.find((event) => event.eventCode === 'DOOM_REVEALED');
  const earlyPlayerDefeat = timeline.some((event) =>
    ['EARLY_DEFEAT_REVEAL', 'EARLY_DEFEAT_SCENE'].includes(event.eventCode),
  );
  const terminalAbandonReveal = timeline.some((event) =>
    ['PRE_REVEAL_ABANDON', 'POST_REVEAL_ABANDON'].includes(event.eventCode),
  );
  const terminalEarlyDefeat = earlyPlayerDefeat;
  if (!terminalAbandonReveal && !terminalEarlyDefeat) {
    preRevealDoomLeak ||= containsForbiddenPreRevealEvents(timeline);
  }
  const revealOccurred = Boolean(revealEvent);
  const revealTurn = revealEvent?.turn ?? null;
  const revealReason = terminalAbandonReveal
    ? 'TERMINAL_ABANDON'
    : !revealOccurred
      ? null
      : earlyPlayerDefeat
        ? 'EARLY_PLAYER_DEFEAT'
        : opponentDefeatTurn !== null && revealTurn === opponentDefeatTurn && revealTurn < 4
          ? 'OPPONENT_DEFEATED_EARLY'
          : revealTurn === 4
            ? 'TURN_4_COMPLETED'
            : 'UNCLASSIFIED';
  const invalidRevealTiming =
    (opponentDefeatTurn !== null && revealTurn !== opponentDefeatTurn) ||
    (revealTurn !== null && revealTurn > 4) ||
    (revealTurn !== null &&
      revealTurn < 4 &&
      !earlyPlayerDefeat &&
      revealReason !== 'OPPONENT_DEFEATED_EARLY');
  const requiredDialogue = (earlyPlayerDefeat ? EARLY_REVEAL_CODES : MAIN_REVEAL_CODES).filter(
    (eventCode) =>
      eventCode !== 'OPPONENT_ALLIANCE' ||
      timeline.some((event) => event.eventCode === 'OPPONENT_ALLIANCE'),
  );
  const missingRevealDialogue =
    revealOccurred &&
    requiredDialogue.some((eventCode) => !timeline.some((event) => event.eventCode === eventCode));
  const missingAbandonDialogue =
    terminalAbandonReveal &&
    !timeline.some((event) =>
      event.narrative?.lines?.some((line) =>
        ['THE BATTLE CONTINUES WITHOUT YOU.', "DOOM'S WORLD BEGINS."].includes(line.text),
      ),
    );
  const missingEndingDialogue = !timeline.some(
    (event) =>
      [
        'VICTORY',
        'DEFEAT',
        'ABANDON',
        'EARLY_DEFEAT_SCENE',
        'PRE_REVEAL_ABANDON',
        'POST_REVEAL_ABANDON',
        'SUE_STORM_APPEAL',
      ].includes(event.eventCode) &&
      event.messageCode &&
      event.narrative?.lines?.length,
  );
  const nonSpanishMessages =
    eventData.language !== LANGUAGE ||
    timeline.some((event) => !event.messageCode || !event.narrative?.lines?.length) ||
    !hasCompleteLocalizedNarrative(timeline);
  const malformedNarrativeMessages = timeline.some((event) =>
    event.narrative?.lines?.some((line) => /\{[a-zA-Z]+\}/.test(line.text)),
  );
  const ending = endingEvents(timeline, outcomeCode);

  return {
    battleNumber,
    seed,
    player: {
      ...compactTeam(teams.player),
      configuredHeroIds: [playerConfiguration.leaderId, ...playerConfiguration.companionIds],
      activeHeroIds: [...playerConfiguration.activeHeroIds],
      inactiveHeroIds: [...playerConfiguration.inactiveHeroIds],
      strategyCode: playerConfiguration.strategyCode,
    },
    opponent,
    outcome: outcomeCode,
    reveal: {
      occurred: revealOccurred,
      terminalAbandon: terminalAbandonReveal,
      turn: revealTurn,
      reason: revealReason,
    },
    turnCount: state.normalTurn,
    decisions,
    timeline,
    ending: {
      outcomeCode,
      finalTurn: state.normalTurn,
      finalPhase: state.phase,
      eventSequences: ending.map((event) => event.sequence),
      messages: ending.map((event) => ({
        sequence: event.sequence,
        eventCode: event.eventCode,
        messageCode: event.messageCode,
        lines: event.narrative?.lines ?? [],
      })),
    },
    diagnosticChecks: {
      preRevealDoomLeak,
      invalidRevealTiming,
      missingRevealDialogue,
      missingAbandonDialogue,
      missingEndingDialogue,
      nonSpanishMessages,
      malformedNarrativeMessages,
      illegalSelectedAction,
      opponentDefeatTurn,
      eventLanguage: eventData.language,
    },
  };
}

async function main() {
  const defaultFile =
    LANGUAGE === 'en'
      ? 'avengers-final-stage-english-100-v1.json'
      : 'avengers-final-stage-spanish-100-v1.json';
  const outputPath = resolve(process.argv[2] ?? join(__dirname, `../balance/${defaultFile}`));
  const databaseDirectory = mkdtempSync(join(tmpdir(), 'avengers-final-stage-spanish-'));
  const databasePath = join(databaseDirectory, 'game-api.sqlite');
  process.env.DB_DATABASE = databasePath;
  process.env.DB_SEED_THEME = 'avengers-doomsday';
  process.env.APP_LOG_LEVEL = 'error';

  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../dist/app.module');
  const {
    AvengersJourneyService,
  } = require('../dist/theme/avengers-doomsday/journey/avengers-journey.service');
  const {
    JourneySpendingStrategy,
  } = require('../dist/theme/avengers-doomsday/journey/model/journey-spending-strategy.enum');
  STRATEGIES = [
    JourneySpendingStrategy.SAVE,
    JourneySpendingStrategy.BALANCED,
    JourneySpendingStrategy.AGGRESSIVE,
  ];

  execFileSync('bash', [join(__dirname, 'init-database.sh'), databasePath, 'avengers-doomsday'], {
    stdio: 'ignore',
  });

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const service = app.get(AvengersJourneyService);
    const battles = [];
    for (let index = 0; index < BATTLE_COUNT; index += 1) {
      const teamId = TEAM_IDS[index % TEAM_IDS.length];
      const configuration = await service.configuration(teamId);
      const strategy = STRATEGIES[index % STRATEGIES.length];
      battles.push(
        await runBattle(service, index + 1, configuration, SEED_START + index, strategy),
      );
    }

    const completedHistory = await service.history(TEAM_IDS[0], LANGUAGE);
    const firstHistory = completedHistory.items[0];
    const turns = battles.map((battle) => battle.turnCount);
    const actionCodeFrequency = {};
    const eventCodeFrequency = {};
    for (const battle of battles) {
      for (const decision of battle.decisions) {
        increment(actionCodeFrequency, decision.selectedAction.actionCode);
      }
      for (const event of battle.timeline) {
        increment(eventCodeFrequency, event.eventCode);
      }
    }

    const summary = {
      totalBattles: battles.length,
      victories: battles.filter((battle) => battle.outcome === 'VICTORY').length,
      defeats: battles.filter((battle) => battle.outcome === 'DEFEAT').length,
      abandons: battles.filter((battle) => battle.outcome === 'ABANDON').length,
      earlyPlayerDefeats: battles.filter((battle) =>
        battle.timeline.some((event) => event.eventCode === 'EARLY_DEFEAT_REVEAL'),
      ).length,
      totalReveals: battles.filter((battle) => battle.reveal.occurred).length,
      terminalAbandonReveals: battles.filter((battle) => battle.reveal.terminalAbandon).length,
      earlyReveals: battles.filter((battle) => battle.reveal.reason === 'OPPONENT_DEFEATED_EARLY')
        .length,
      turnFourReveals: battles.filter((battle) => battle.reveal.reason === 'TURN_4_COMPLETED')
        .length,
      minimumTurns: Math.min(...turns),
      averageTurns: Number((turns.reduce((sum, turn) => sum + turn, 0) / turns.length).toFixed(2)),
      medianTurns: median(turns),
      maximumTurns: Math.max(...turns),
      totalPlayerDecisions: battles.reduce((sum, battle) => sum + battle.decisions.length, 0),
      actionCodeFrequency,
      eventCodeFrequency,
      endingFrequency: {
        VICTORY: battles.filter((battle) => battle.outcome === 'VICTORY').length,
        DEFEAT: battles.filter((battle) => battle.outcome === 'DEFEAT').length,
        ABANDON: battles.filter((battle) => battle.outcome === 'ABANDON').length,
      },
      invalidPreRevealDoomLeaks: battles.filter(
        (battle) => battle.diagnosticChecks.preRevealDoomLeak,
      ).length,
      missingCanonicalRevealDialogue: battles.filter(
        (battle) => battle.diagnosticChecks.missingRevealDialogue,
      ).length,
      invalidRevealTimings: battles.filter((battle) => battle.diagnosticChecks.invalidRevealTiming)
        .length,
      missingEndingDialogue: battles.filter(
        (battle) => battle.diagnosticChecks.missingEndingDialogue,
      ).length,
      localizationFallbacks: battles.filter((battle) => battle.diagnosticChecks.nonSpanishMessages)
        .length,
      malformedNarrativeMessages: battles.filter(
        (battle) => battle.diagnosticChecks.malformedNarrativeMessages,
      ).length,
      illegalSelectedActions: battles.filter(
        (battle) => battle.diagnosticChecks.illegalSelectedAction,
      ).length,
      missingAbandonDialogue: battles.filter(
        (battle) => battle.diagnosticChecks.missingAbandonDialogue,
      ).length,
    };
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        language: LANGUAGE,
        battleCount: battles.length,
        seedStart: SEED_START,
        seedEnd: SEED_START + BATTLE_COUNT - 1,
        gameApiVersion: require('../package.json').version,
        rulesVersion: firstHistory?.rulesVersion,
        contentVersion: firstHistory?.contentVersion,
        awardsVersion: firstHistory?.awardsVersion,
        productionLogic: 'AvengersJourneyService public projections and command path',
      },
      summary,
      battles,
    };
    mkdirSync(resolve(outputPath, '..'), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({ outputPath, summary }, null, 2)}\n`);
  } finally {
    await app.close();
    rmSync(databaseDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
