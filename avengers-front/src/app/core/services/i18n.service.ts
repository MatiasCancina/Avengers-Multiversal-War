import { Injectable } from '@angular/core';
import { AppContextService } from './app-context.service';

export type AppLanguage = 'en' | 'es';

export type AppCopyKey =
  | 'loading'
  | 'retry'
  | 'empty'
  | 'error'
  | 'configuration'
  | 'historyRivals'
  | 'heroRoster'
  | 'simulateJourney'
  | 'search'
  | 'role'
  | 'eligibility'
  | 'compare'
  | 'remove'
  | 'save'
  | 'simulate'
  | 'selectStrategy'
  | 'myTeam'
  | 'journey'
  | 'finalStage'
  | 'overview'
  | 'teamJourney'
  | 'statistics'
  | 'archive'
  | 'preparation'
  | 'play'
  | 'events'
  | 'status'
  | 'noJourney'
  | 'journeyOverview'
  | 'encounterDetails'
  | 'archiveDetail'
  | 'liveEvents'
  | 'battleStatus'
  | 'finalPreparationStore'
  | 'playFinalStage'
  | 'openEncounter'
  | 'openArchiveDetail'
  | 'teamArea'
  | 'journeyArea'
  | 'finalBattleArea'
  | 'resultsArea'
  | 'teamConfig'
  | 'groupStage'
  | 'knockoutStage'
  | 'awards'
  | 'history'
  | 'historyDetail'
  | 'comingSoon'
  | 'featurePending'
  | 'heroRoster.caption'
  | 'heroRoster.title'
  | 'heroRoster.subtitle'
  | 'heroRoster.heroCount'
  | 'heroRoster.resultCount'
  | 'heroRoster.allHeroes'
  | 'heroRoster.searchLabel'
  | 'heroRoster.searchPlaceholder'
  | 'heroRoster.filterByRole'
  | 'heroRoster.role.all'
  | 'heroRoster.role.agile'
  | 'heroRoster.role.warrior'
  | 'heroRoster.role.mystic'
  | 'heroRoster.role.tech'
  | 'heroRoster.role.support'
  | 'heroRoster.selectForComparison'
  | 'heroRoster.noMatch'
  | 'heroRoster.loading'
  | 'heroRoster.noHeroesAvailable'
  | 'heroRoster.analysis'
  | 'heroRoster.heroOne'
  | 'heroRoster.heroTwo'
  | 'heroRoster.removeHero'
  | 'heroRoster.energy'
  | 'heroRoster.abilityPoints'
  | 'heroRoster.power'
  | 'heroRoster.agility'
  | 'heroRoster.resistance'
  | 'heroRoster.ability'
  | 'heroRoster.offensive'
  | 'heroRoster.supportAbility'
  | 'heroRoster.ap'
  | 'heroRoster.selectHero'
  | 'heroRoster.selectAnotherHero'
  | 'historyRivals.caption'
  | 'historyRivals.title'
  | 'historyRivals.subtitle'
  | 'historyRivals.yourTeam'
  | 'historyRivals.rivals'
  | 'historyRivals.rivalsFor'
  | 'historyRivals.battleHistory'
  | 'historyRivals.leader'
  | 'historyRivals.noRivals'
  | 'historyRivals.noRivalsCopy'
  | 'historyRivals.noBattles'
  | 'historyRivals.noBattlesCopy'
  | 'historyRivals.noRivalSelected'
  | 'historyRivals.noRivalSelectedCopy'
  | 'historyRivals.noTeamHeroes'
  | 'historyRivals.loading'
  | 'historyRivals.damage'
  | 'historyRivals.victory'
  | 'historyRivals.defeat'
  | 'historyRivals.draw'
  | 'historyRivals.win'
  | 'historyRivals.loss'
  | 'historyRivals.stage.groupStage'
  | 'historyRivals.stage.roundOf16'
  | 'historyRivals.stage.quarterfinal'
  | 'historyRivals.stage.semifinal'
  | 'teamConfig.caption'
  | 'teamConfig.title'
  | 'teamConfig.subtitle'
  | 'teamConfig.combatStrategy'
  | 'teamConfig.yourTeam'
  | 'teamConfig.heroCatalog'
  | 'teamConfig.activeFormation'
  | 'teamConfig.reserve'
  | 'teamConfig.leader'
  | 'teamConfig.active'
  | 'teamConfig.reserveState'
  | 'teamConfig.removeHero'
  | 'teamConfig.selectHero'
  | 'teamConfig.selectHeroForSlot'
  | 'teamConfig.teamMarker'
  | 'teamConfig.searchLabel'
  | 'teamConfig.searchPlaceholder'
  | 'teamConfig.filterByRole'
  | 'teamConfig.noCatalogMatches'
  | 'teamConfig.pending'
  | 'teamConfig.saved'
  | 'teamConfig.journeyReplaced'
  | 'teamConfig.locked'
  | 'teamConfig.loading'
  | 'teamConfig.noHeroesAvailable'
  | 'teamConfig.save'
  | 'teamConfig.invalid'
  | 'teamConfig.replaceHero'
  | 'teamConfig.replacing'
  | 'teamConfig.cancelReplace'
  | 'r4.caption'
  | 'r4.title'
  | 'r4.subtitle'
  | 'r4.strategyTitle'
  | 'r4.strategyKicker'
  | 'r4.save'
  | 'r4.saveDescription'
  | 'r4.balanced'
  | 'r4.balancedDescription'
  | 'r4.aggressive'
  | 'r4.aggressiveDescription'
  | 'r4.finalBattle'
  | 'r4.finalSubtitle'
  | 'r4.playerTeam'
  | 'r4.opponent'
  | 'r4.toBeDetermined'
  | 'r4.opponentUnknown'
  | 'r4.leader'
  | 'r4.simulating'
  | 'r4.simulate'
  | 'r4.success'
  | 'r4.replaced'
  | 'r5.caption'
  | 'r5.title'
  | 'r5.subtitle'
  | 'r5.noJourney'
  | 'r5.noJourneyCopy'
  | 'r5.simulateLink'
  | 'r5.groups'
  | 'r5.groupLabel'
  | 'r5.yourGroup'
  | 'r5.standings'
  | 'r5.position'
  | 'r5.team'
  | 'r5.played'
  | 'r5.wins'
  | 'r5.draws'
  | 'r5.losses'
  | 'r5.points'
  | 'r5.damageFor'
  | 'r5.damageAgainst'
  | 'r5.damageDiff'
  | 'r5.qualified'
  | 'r5.qualifiedYes'
  | 'r5.qualifiedNo'
  | 'r5.encounters'
  | 'r5.playedState'
  | 'r5.pending'
  | 'r5.result'
  | 'r5.teamDamage'
  | 'r5.noEncounters'
  | 'r5.winner'
  | 'r5.draw'
  | 'r5.playerTeam'
  | 'r6.caption'
  | 'r6.title'
  | 'r6.subtitle'
  | 'r6.noJourney'
  | 'r6.noJourneyCopy'
  | 'r6.simulateLink'
  | 'r6.stages'
  | 'r6.roundOf16'
  | 'r6.quarterfinal'
  | 'r6.semifinal'
  | 'r6.final'
  | 'r6.match'
  | 'r6.played'
  | 'r6.winner'
  | 'r6.pending'
  | 'r6.yourTeam'
  | 'r6.damage'
  | 'r6.finalPending'
  | 'r6.victory'
  | 'r6.defeat'
  | 'r6.abandon'
  | 'r6.draw'
  | 'tournament.resolution.totalKo'
  | 'tournament.resolution.specialShowdown'
  | 'tournament.resolution.showdownForfeit'
  | 'tournament.resolution.technicalVerdict'
  | 'r7.caption'
  | 'r7.title'
  | 'r7.subtitle'
  | 'r7.noJourney'
  | 'r7.noJourneyCopy'
  | 'r7.simulateLink'
  | 'r7.progress'
  | 'r7.encounters'
  | 'r7.selectEncounter'
  | 'r7.pending'
  | 'r7.played'
  | 'r7.opponent'
  | 'r7.result'
  | 'r7.damage'
  | 'r7.details'
  | 'r7.noEncounterDetails'
  | 'r7.noPlayerEncounters'
  | 'r7.win'
  | 'r7.loss'
  | 'r7.draw'
  | 'r7.finalBattle'
  | 'r7.finalOutcome'
  | 'r7.abandoned'
  | 'r7.playerTeam'
  | 'r7.roundLabel'
  | 'r7.roundType.normal'
  | 'r7.roundType.extra'
  | 'r7.initiative'
  | 'r7.roundWinner'
  | 'r7.activeHeroes'
  | 'r7.battleLog'
  | 'r7.detailLoading'
  | 'r7.event.action'
  | 'r7.event.damage'
  | 'r7.event.heal'
  | 'r7.event.ko'
  | 'r7.event.statGain'
  | 'r7.event.recovery'
  | 'r7.event.purchaseUse'
  | 'r7.event.actionSkipped'
  | 'r7.event.specialShowdown'
  | 'r7.event.showdownForfeit'
  | 'r7.event.showdownVerdict'
  | 'r7.event.other'
  | 'r7.eventDamageDetail'
  | 'r7.eventKoDetail'
  | 'r8.caption'
  | 'r8.title'
  | 'r8.subtitle'
  | 'r8.noJourney'
  | 'r8.noJourneyCopy'
  | 'r8.rewardPoints'
  | 'r8.available'
  | 'r8.playerTeam'
  | 'r8.opponent'
  | 'r8.noOpponent'
  | 'r8.powerUpStore'
  | 'r8.inventory'
  | 'r8.emptyInventory'
  | 'r8.purchase'
  | 'r8.purchaseSuccess'
  | 'r8.useItem'
  | 'r8.selectedItem'
  | 'r8.targetHero'
  | 'r8.activeHeroes'
  | 'r8.active'
  | 'r8.reserve'
  | 'r8.strategy'
  | 'r8.savePreparation'
  | 'r8.preparationSaved'
  | 'r8.startFinal'
  | 'r8.startingFinal'
  | 'r8.continueFinal'
  | 'r8.viewFinal'
  | 'r8.notReady'
  | 'r8.matchup'
  | 'r8.teamPreparation'
  | 'r8.inCombat'
  | 'r8.leader'
  | 'r8.statusUnknown'
  | 'r8.energy'
  | 'r8.ap'
  | 'r8.dragHint'
  | 'r8.saving'
  | 'r8.unknownItem'
  | 'r8.chooseTarget'
  | 'r8.finalCompleted'
  | 'r9.caption'
  | 'r9.title'
  | 'r9.subtitle'
  | 'r9.loading'
  | 'r9.unavailableTitle'
  | 'r9.unavailableCopy'
  | 'r9.empty'
  | 'r9.leader'
  | 'r9.knockedOut'
  | 'r9.energy'
  | 'r9.ap'
  | 'r9.returnTurn'
  | 'r9.yourTeam'
  | 'r9.doctorDoom'
  | 'r9.strategy'
  | 'r9.working'
  | 'r9.execute'
  | 'r9.abandon'
  | 'r9.readyToStart'
  | 'r9.finished'
  | 'r9.readyHint'
  | 'r9.targetHint'
  | 'r9.pickHint'
  | 'r9.tab.abilities'
  | 'r9.tab.inventory'
  | 'r9.heroLabel'
  | 'r9.abilityLabel'
  | 'r9.teamActions'
  | 'r9.targetLabel'
  | 'r9.scopeHero'
  | 'r9.scopeTeam'
  | 'r9.inventoryEmpty'
  | 'r9.useItemHint'
  | 'r9.rivalTeam'
  | 'r9.narrative'
  | 'r9.noBattle'
  | 'r9.noBattleCopy'
  | 'r9.goPreparation'
  | 'r9.playerTeam'
  | 'r9.opponent'
  | 'r9.arena'
  | 'r9.phase'
  | 'r9.turn'
  | 'r9.legalActions'
  | 'r9.noActions'
  | 'r9.chooseAction'
  | 'r9.start'
  | 'r9.starting'
  | 'r9.completed'
  | 'r9.result'
  | 'r9.events'
  | 'r9.refresh'
  | 'r9.actor'
  | 'r9.target'
  | 'r9.cost'
  | 'r9.status'
  | 'r9.actionAccepted'
  | 'r9.noTarget'
  | 'r9.screenNav'
  | 'r9.inCombat'
  | 'r9.reserve'
  | 'r9.judge'
  | 'r9.liveNarrative'
  | 'r9.abilities'
  | 'r9.vault'
  | 'r9.selectHeroPrompt'
  | 'r9.selectTarget'
  | 'r9.legalTargets'
  | 'r9.executeAction'
  | 'r9.useItem'
  | 'r9.executing'
  | 'r9.noInventory'
  | 'r9.event.action'
  | 'r9.event.damage'
  | 'r9.event.heal'
  | 'r9.event.ko'
  | 'r9.event.resource'
  | 'r9.event.item'
  | 'r9.event.swap'
  | 'r9.event.special'
  | 'r9.event.skipped'
  | 'r9.event.actionDetail'
  | 'r9.event.damageDetail'
  | 'r9.event.healDetail'
  | 'r9.event.koDetail'
  | 'r9.event.resourceDetail'
  | 'r9.event.itemDetail'
  | 'r9.event.swapDetail'
  | 'r9.event.specialDetail'
  | 'r9.event.skippedDetail'
  | 'r10.caption'
  | 'r10.title'
  | 'r10.subtitle'
  | 'r10.noBattle'
  | 'r10.noBattleCopy'
  | 'r10.events'
  | 'r10.emptyEvents'
  | 'r10.turn'
  | 'r10.phase'
  | 'r10.actor'
  | 'r10.target'
  | 'r10.eventType'
  | 'r10.simulateLink'
  | 'r10.loading'
  | 'r10.refresh'
  | 'r10.refreshing'
  | 'r10.battleStatus'
  | 'r10.currentTurn'
  | 'r10.state'
  | 'r10.state.ready'
  | 'r10.state.active'
  | 'r10.state.completed'
  | 'r10.result'
  | 'r10.result.victory'
  | 'r10.result.defeat'
  | 'r10.result.abandon'
  | 'r10.notStarted'
  | 'r10.damage'
  | 'r10.apChange'
  | 'r10.event.tournamentFinalStarted'
  | 'r10.event.action'
  | 'r10.event.attackHit'
  | 'r10.event.attackMiss'
  | 'r10.event.effect'
  | 'r10.event.effectExpired'
  | 'r10.event.damage'
  | 'r10.event.swap'
  | 'r10.event.apChange'
  | 'r10.event.strategyChange'
  | 'r10.event.preRevealAbandon'
  | 'r10.event.abandon'
  | 'r10.event.surferEnough'
  | 'r10.event.doomRevealed'
  | 'r10.event.doomExplanation'
  | 'r10.event.playerRejection'
  | 'r10.event.opponentAlliance'
  | 'r10.event.doomsdayBegins'
  | 'r10.event.doomIntervention'
  | 'r10.event.initialized'
  | 'r10.event.heal'
  | 'r10.event.ko'
  | 'r10.event.revive'
  | 'r10.event.cleanse'
  | 'r10.event.formationRestored'
  | 'r10.event.rivalry'
  | 'r10.event.doomThreat'
  | 'r10.event.powerUp'
  | 'r10.event.finalAttack'
  | 'r10.event.finalResponse'
  | 'r10.event.victory'
  | 'r10.event.defeat'
  | 'r10.event.postRevealAbandon'
  | 'r10.event.earlyDefeatScene'
  | 'r10.event.doomAlone'
  | 'r10.event.earlyDefeatReveal'
  | 'r10.event.sueStormAppeal'
  | 'r11.caption'
  | 'r11.title'
  | 'r11.subtitle'
  | 'r11.noBattle'
  | 'r11.noBattleCopy'
  | 'r11.playerSide'
  | 'r11.opponentSide'
  | 'r11.active'
  | 'r11.reserve'
  | 'r11.knockedOut'
  | 'r11.available'
  | 'r11.energy'
  | 'r11.abilityPoints'
  | 'r11.teamActions'
  | 'r11.leaderUses'
  | 'r11.strategy'
  | 'r11.phase'
  | 'r11.turn'
  | 'r11.waitingForStart'
  | 'r12.caption'
  | 'r12.title'
  | 'r12.subtitle'
  | 'r12.unavailable'
  | 'r12.unavailableCopy'
  | 'r12.statistics'
  | 'r12.awards'
  | 'r12.noAwards'
  | 'r12.winner'
  | 'r12.metric'
  | 'r12.reason'
  | 'r12.outcome'
  | 'r12.encounters'
  | 'r12.wins'
  | 'r12.losses'
  | 'r12.damageDealt'
  | 'r12.damageReceived'
  | 'r12.completion'
  | 'r12.finalTurns'
  | 'r12.rewardPoints'
  | 'r13.caption'
  | 'r13.title'
  | 'r13.subtitle'
  | 'r13.noHistory'
  | 'r13.noHistoryCopy'
  | 'r13.attempt'
  | 'r13.createdAt'
  | 'r13.completedAt'
  | 'r13.outcome'
  | 'r13.ending'
  | 'r13.opponent'
  | 'r13.rewardPoints'
  | 'r13.viewDetails'
  | 'r13.awards'
  | 'r13.finalBattle'
  | 'r13.noDetails'
  | 'r13.notRecorded'
  | 'r13.strategy'
  | 'r13.backToHistory';

const DICTIONARY: Record<AppLanguage, Record<AppCopyKey, string>> = {
  en: {
    loading: 'Loading…',
    retry: 'Retry',
    empty: 'No records available.',
    error: 'Unable to complete this request.',
    configuration: 'Strategy & Team',
    historyRivals: 'History & Rivals',
    heroRoster: 'Hero Roster',
    simulateJourney: 'Simulate Journey',
    search: 'Search',
    role: 'Role',
    eligibility: 'Eligibility',
    compare: 'Compare',
    remove: 'Remove',
    save: 'Save',
    simulate: 'Simulate Journey',
    selectStrategy: 'Journey Spending Strategy',
    myTeam: 'My Team',
    journey: 'Journey',
    finalStage: 'Final Stage',
    overview: 'Overview',
    teamJourney: 'Team Journey',
    statistics: 'Statistics',
    archive: 'Archive',
    preparation: 'Preparation',
    play: 'Play',
    events: 'Events',
    status: 'Status',
    noJourney: 'No Journey',
    journeyOverview: 'Journey Overview',
    encounterDetails: 'Encounter Details',
    archiveDetail: 'Journey History Detail',
    liveEvents: 'Live Events',
    battleStatus: 'Team Status',
    finalPreparationStore: 'Final Preparation',
    playFinalStage: 'Final Battle',
    openEncounter: 'Open encounter',
    openArchiveDetail: 'Open history detail',
    teamArea: 'Team',
    journeyArea: 'Journey',
    finalBattleArea: 'Final Battle',
    resultsArea: 'Results',
    teamConfig: 'Team Config',
    groupStage: 'Group Stage',
    knockoutStage: 'Knockout Stage',
    awards: 'Awards',
    history: 'History',
    historyDetail: 'Journey History Detail',
    comingSoon: 'Coming Soon',
    featurePending: 'This functionality will be designed in a future prototype iteration.',
    'heroRoster.caption': 'HERO ROSTER',
    'heroRoster.title': 'Hero Roster & Analysis',
    'heroRoster.subtitle': 'Explore Heroes, their abilities, and compare their strengths.',
    'heroRoster.heroCount': '{count} HEROES',
    'heroRoster.resultCount': '{visible} / {total} HEROES',
    'heroRoster.allHeroes': 'ALL HEROES',
    'heroRoster.searchLabel': 'Search Heroes',
    'heroRoster.searchPlaceholder': 'Name or Hero ID',
    'heroRoster.filterByRole': 'Filter by role',
    'heroRoster.role.all': 'All',
    'heroRoster.role.agile': 'Agile',
    'heroRoster.role.warrior': 'Warrior',
    'heroRoster.role.mystic': 'Mystic',
    'heroRoster.role.tech': 'Tech',
    'heroRoster.role.support': 'Support',
    'heroRoster.selectForComparison': 'Select {hero} for comparison',
    'heroRoster.noMatch': 'No Heroes match these filters.',
    'heroRoster.loading': 'Loading Hero roster…',
    'heroRoster.noHeroesAvailable': 'No Heroes are available.',
    'heroRoster.analysis': '⚔ HERO ANALYSIS',
    'heroRoster.heroOne': 'HERO 1',
    'heroRoster.heroTwo': 'HERO 2',
    'heroRoster.removeHero': 'Remove {hero}',
    'heroRoster.energy': 'ENERGY',
    'heroRoster.abilityPoints': 'ABILITY POINTS',
    'heroRoster.power': 'PWR',
    'heroRoster.agility': 'AGL',
    'heroRoster.resistance': 'RES',
    'heroRoster.ability': 'ABL',
    'heroRoster.offensive': 'OFFENSIVE',
    'heroRoster.supportAbility': 'SUPPORT',
    'heroRoster.ap': 'AP',
    'heroRoster.selectHero': 'SELECT A HERO',
    'heroRoster.selectAnotherHero': 'SELECT ANOTHER HERO TO COMPARE',
    'historyRivals.caption': 'HISTORY & RIVALS',
    'historyRivals.title': 'TEAM HISTORY & RIVALS',
    'historyRivals.subtitle': 'Explore canonical rivalries and shared battle history',
    'historyRivals.yourTeam': 'YOUR TEAM',
    'historyRivals.rivals': 'RIVALS',
    'historyRivals.rivalsFor': 'RIVALS OF',
    'historyRivals.battleHistory': 'BATTLE HISTORY',
    'historyRivals.leader': 'LEADER',
    'historyRivals.noRivals': 'NO RIVALS CONFIGURED',
    'historyRivals.noRivalsCopy': 'This Hero has no known rivalries.',
    'historyRivals.noBattles': 'NO BATTLES YET',
    'historyRivals.noBattlesCopy': 'These Heroes have not shared a recorded battle yet.',
    'historyRivals.noRivalSelected': 'NO RIVAL SELECTED',
    'historyRivals.noRivalSelectedCopy': 'This Hero has no configured rival to review.',
    'historyRivals.noTeamHeroes': 'No configured Team Heroes are available.',
    'historyRivals.loading': 'Loading Team history and rivalries…',
    'historyRivals.damage': 'DAMAGE',
    'historyRivals.victory': 'VICTORY',
    'historyRivals.defeat': 'DEFEAT',
    'historyRivals.draw': 'DRAW',
    'historyRivals.win': 'WIN',
    'historyRivals.loss': 'LOSS',
    'historyRivals.stage.groupStage': 'GROUP STAGE',
    'historyRivals.stage.roundOf16': 'ROUND OF 16',
    'historyRivals.stage.quarterfinal': 'QUARTERFINAL',
    'historyRivals.stage.semifinal': 'SEMIFINAL',
    'teamConfig.caption': 'TEAM CONFIGURATION',
    'teamConfig.title': 'TEAM CONFIGURATION',
    'teamConfig.subtitle': 'Configure formation and Combat Strategy.',
    'teamConfig.combatStrategy': 'COMBAT STRATEGY',
    'teamConfig.yourTeam': 'YOUR TEAM',
    'teamConfig.heroCatalog': 'HERO CATALOG',
    'teamConfig.activeFormation': '⚡ ACTIVE FORMATION',
    'teamConfig.reserve': '↻ RESERVE',
    'teamConfig.leader': 'LEADER',
    'teamConfig.active': 'ACTIVE',
    'teamConfig.reserveState': 'RESERVE',
    'teamConfig.removeHero': 'Remove {hero} from Team',
    'teamConfig.selectHero': 'Select {hero} for the Team',
    'teamConfig.selectHeroForSlot': 'Select a Hero for this formation slot',
    'teamConfig.teamMarker': 'TEAM',
    'teamConfig.searchLabel': 'Search Heroes',
    'teamConfig.searchPlaceholder': 'Name or Hero ID',
    'teamConfig.filterByRole': 'Filter Heroes by role',
    'teamConfig.noCatalogMatches': 'No Heroes match these filters.',
    'teamConfig.pending': 'CHANGES PENDING — SELECT A HERO',
    'teamConfig.saved': 'Configuration updated.',
    'teamConfig.journeyReplaced': 'Configuration updated. A replacement Journey was generated.',
    'teamConfig.locked': 'Configuration is locked while the Final Battle is active.',
    'teamConfig.loading': 'Loading Team configuration…',
    'teamConfig.noHeroesAvailable': 'No Team configuration is available.',
    'teamConfig.save': 'SAVE CONFIGURATION',
    'teamConfig.invalid':
      'The configuration is not valid. Check that there are exactly 3 active Heroes.',
    'teamConfig.replaceHero': 'Replace {hero}',
    'teamConfig.replacing': 'Choose a Hero from the catalog to replace the selected companion.',
    'teamConfig.cancelReplace': 'Cancel',
    'r4.caption': 'JOURNEY',
    'r4.title': 'SIMULATE JOURNEY',
    'r4.subtitle': 'Choose how your Team will manage resources throughout the tournament.',
    'r4.strategyTitle': 'JOURNEY SPENDING STRATEGY',
    'r4.strategyKicker': 'Choose a tournament approach',
    'r4.save': 'SAVE',
    'r4.saveDescription': 'Preserve Reward Points for later preparation.',
    'r4.balanced': 'BALANCED',
    'r4.balancedDescription': 'Spend when useful while keeping resources for later stages.',
    'r4.aggressive': 'AGGRESSIVE',
    'r4.aggressiveDescription': 'Spend more freely to strengthen the run.',
    'r4.finalBattle': 'FINAL BATTLE',
    'r4.finalSubtitle': 'Your Team and its Final Battle opponent.',
    'r4.playerTeam': 'PLAYER TEAM',
    'r4.opponent': 'FINAL BATTLE OPPONENT',
    'r4.toBeDetermined': 'TO BE DETERMINED',
    'r4.opponentUnknown': 'The Final Battle opponent has not been determined.',
    'r4.leader': 'LEADER',
    'r4.simulating': 'SIMULATING JOURNEY…',
    'r4.simulate': 'SIMULATE JOURNEY',
    'r4.success': 'Journey simulated. Final Battle opponent determined.',
    'r4.replaced': 'A new Journey was simulated and replaced the previous one.',
    'r5.caption': 'TOURNAMENT',
    'r5.title': 'GROUP STAGE',
    'r5.subtitle': 'Review the official groups, standings and encounters for this Journey.',
    'r5.noJourney': 'NO CURRENT JOURNEY',
    'r5.noJourneyCopy': 'Simulate a Journey to view its Group Stage.',
    'r5.simulateLink': 'SIMULATE JOURNEY',
    'r5.groups': 'Journey groups',
    'r5.groupLabel': 'GROUP {group}',
    'r5.yourGroup': 'YOUR TEAM',
    'r5.standings': 'GROUP {group} STANDINGS',
    'r5.position': 'POS',
    'r5.team': 'TEAM',
    'r5.played': 'PLAYED',
    'r5.wins': 'W',
    'r5.draws': 'D',
    'r5.losses': 'L',
    'r5.points': 'PTS',
    'r5.damageFor': 'DMG FOR',
    'r5.damageAgainst': 'DMG AGAINST',
    'r5.damageDiff': 'DMG DIFF',
    'r5.qualified': 'QUALIFIED',
    'r5.qualifiedYes': 'YES',
    'r5.qualifiedNo': 'NO',
    'r5.encounters': 'GROUP BATTLES · {count}',
    'r5.playedState': 'PLAYED',
    'r5.pending': 'PENDING',
    'r5.result': 'RESULT',
    'r5.teamDamage': '{team} damage: {damage}',
    'r5.noEncounters': 'No encounters are listed for this group.',
    'r5.winner': 'WINNER',
    'r5.draw': 'DRAW',
    'r5.playerTeam': 'PLAYER TEAM',
    'r6.caption': 'TOURNAMENT',
    'r6.title': 'KNOCKOUT STAGE',
    'r6.subtitle': 'Review the elimination rounds and the Final Battle result.',
    'r6.noJourney': 'NO CURRENT JOURNEY',
    'r6.noJourneyCopy': 'Simulate a Journey to view its Knockout Stage.',
    'r6.simulateLink': 'SIMULATE JOURNEY',
    'r6.stages': 'Knockout stages',
    'r6.roundOf16': 'ROUND OF 16',
    'r6.quarterfinal': 'QUARTERFINALS',
    'r6.semifinal': 'SEMIFINALS',
    'r6.final': 'FINAL',
    'r6.match': 'MATCH',
    'r6.played': 'PLAYED',
    'r6.winner': 'WINNER',
    'r6.pending': 'PENDING',
    'r6.yourTeam': 'YOUR TEAM',
    'r6.damage': 'TEAM DAMAGE',
    'r6.finalPending': 'The Final remains pending until Final Battle is completed.',
    'r6.victory': 'VICTORY',
    'r6.defeat': 'DEFEAT',
    'r6.abandon': 'ABANDONED',
    'r6.draw': 'DRAW',
    'tournament.resolution.totalKo': 'TOTAL KNOCKOUT',
    'tournament.resolution.specialShowdown': 'SPECIAL SHOWDOWN',
    'tournament.resolution.showdownForfeit': 'SHOWDOWN FORFEIT',
    'tournament.resolution.technicalVerdict': 'TECHNICAL VERDICT',
    'r7.caption': 'JOURNEY',
    'r7.title': 'TEAM JOURNEY',
    'r7.subtitle': 'Follow your Team’s chronological route through the tournament.',
    'r7.noJourney': 'NO CURRENT JOURNEY',
    'r7.noJourneyCopy': 'Simulate a Journey to follow your Team’s path.',
    'r7.simulateLink': 'SIMULATE JOURNEY',
    'r7.progress': 'JOURNEY PROGRESS',
    'r7.encounters': 'TEAM ENCOUNTERS',
    'r7.selectEncounter': 'Select a completed encounter to inspect its details.',
    'r7.pending': 'PENDING',
    'r7.played': 'PLAYED',
    'r7.opponent': 'Opponent',
    'r7.result': 'Team result',
    'r7.damage': 'Team damage',
    'r7.details': 'ENCOUNTER DETAILS',
    'r7.noEncounterDetails': 'No details are available.',
    'r7.noPlayerEncounters': 'No encounters involving the Player Team are available.',
    'r7.win': 'WIN',
    'r7.loss': 'LOSS',
    'r7.draw': 'DRAW',
    'r7.finalBattle': 'FINAL BATTLE',
    'r7.finalOutcome': 'Final Battle outcome',
    'r7.abandoned': 'ABANDONED',
    'r7.playerTeam': 'PLAYER TEAM',
    'r7.roundLabel': 'ROUND {number}',
    'r7.roundType.normal': 'STANDARD ROUND',
    'r7.roundType.extra': 'EXTRA ROUND',
    'r7.initiative': 'INITIATIVE',
    'r7.roundWinner': 'ROUND WINNER',
    'r7.activeHeroes': 'ACTIVE HEROES',
    'r7.battleLog': 'BATTLE LOG',
    'r7.detailLoading': 'Loading encounter details…',
    'r7.event.action': 'Action',
    'r7.event.damage': 'Damage',
    'r7.event.heal': 'Healing',
    'r7.event.ko': 'Knockout',
    'r7.event.statGain': 'Stat increase',
    'r7.event.recovery': 'Recovery',
    'r7.event.purchaseUse': 'Item used',
    'r7.event.actionSkipped': 'Action skipped',
    'r7.event.specialShowdown': 'Showdown',
    'r7.event.showdownForfeit': 'Showdown forfeit',
    'r7.event.showdownVerdict': 'Showdown verdict',
    'r7.event.other': 'Battle event',
    'r7.eventDamageDetail': '{actor} → {targets} · {amount} damage',
    'r7.eventKoDetail': '{actor} knocked out {targets}',
    'r8.caption': 'FINAL BATTLE',
    'r8.title': 'FINAL PREPARATION',
    'r8.subtitle': 'Review your Team and make supported preparations before the Final Battle.',
    'r8.noJourney': 'NO FINALIST AVAILABLE',
    'r8.noJourneyCopy': 'Simulate a Journey and qualify for the Final Battle before preparing.',
    'r8.rewardPoints': 'REWARD POINTS',
    'r8.available': 'AVAILABLE',
    'r8.playerTeam': 'PLAYER TEAM',
    'r8.opponent': 'FINALIST',
    'r8.noOpponent': 'Finalist information is not available yet.',
    'r8.powerUpStore': 'POWER-UP STORE',
    'r8.inventory': 'INVENTORY',
    'r8.emptyInventory': 'No items are currently held.',
    'r8.purchase': 'PURCHASE',
    'r8.purchaseSuccess': 'Purchase completed.',
    'r8.useItem': 'USE ITEM',
    'r8.selectedItem': 'SELECTED INVENTORY ITEM',
    'r8.targetHero': 'Target Hero',
    'r8.activeHeroes': 'ACTIVE HEROES',
    'r8.active': 'ACTIVE',
    'r8.reserve': 'RESERVE',
    'r8.strategy': 'COMBAT STRATEGY',
    'r8.savePreparation': 'SAVE PREPARATION',
    'r8.preparationSaved': 'Preparation saved.',
    'r8.startFinal': 'START FINAL BATTLE',
    'r8.startingFinal': 'STARTING FINAL BATTLE…',
    'r8.continueFinal': 'CONTINUE FINAL BATTLE',
    'r8.viewFinal': 'VIEW FINAL BATTLE',
    'r8.notReady': 'Preparation is not available for this Journey.',
    'r8.matchup': 'Player Team versus finalist',
    'r8.teamPreparation': 'TEAM PREPARATION',
    'r8.inCombat': 'IN COMBAT',
    'r8.leader': 'LEADER',
    'r8.statusUnknown': 'STATUS UNAVAILABLE',
    'r8.energy': 'ENERGY',
    'r8.ap': 'AP',
    'r8.dragHint': 'Drag a Hero onto another Hero to exchange formations. The Leader stays fixed.',
    'r8.saving': 'SAVING PREPARATION…',
    'r8.unknownItem': 'Power-Up',
    'r8.chooseTarget': 'Choose a Hero',
    'r8.finalCompleted': 'FINAL BATTLE COMPLETED',
    'r9.caption': 'FINAL BATTLE',
    'r9.title': 'FINAL BATTLE',
    'r9.subtitle': 'Choose only actions currently offered by the Game API.',
    'r9.loading': 'Loading final battle...',
    'r9.unavailableTitle': 'FINAL BATTLE NOT AVAILABLE',
    'r9.unavailableCopy': 'Prepare a qualified Journey before starting Final Battle.',
    'r9.empty': 'No final battle data is available.',
    'r9.leader': 'LEADER',
    'r9.knockedOut': 'KNOCKED OUT',
    'r9.energy': 'ENERGY',
    'r9.ap': 'AP',
    'r9.returnTurn': 'Returns on turn {turn}',
    'r9.yourTeam': 'YOUR TEAM',
    'r9.doctorDoom': 'DOCTOR DOOM',
    'r9.strategy': 'STRATEGY',
    'r9.working': 'EXECUTING...',
    'r9.execute': 'EXECUTE TURN',
    'r9.abandon': 'ABANDON BATTLE',
    'r9.readyToStart': 'Your team will appear when the battle is ready.',
    'r9.finished': 'The final battle is complete.',
    'r9.readyHint': 'Choose an action and target, then execute the turn.',
    'r9.targetHint': 'Choose a target to complete your action.',
    'r9.pickHint': 'Choose a Hero and an action to continue.',
    'r9.tab.abilities': 'ABILITIES',
    'r9.tab.inventory': 'INVENTORY',
    'r9.heroLabel': 'HERO',
    'r9.abilityLabel': 'ABILITY',
    'r9.teamActions': 'TEAM ACTIONS',
    'r9.targetLabel': 'TARGET',
    'r9.scopeHero': 'HERO',
    'r9.scopeTeam': 'TEAM',
    'r9.inventoryEmpty': 'Your inventory is empty.',
    'r9.useItemHint': 'Items are displayed here when available.',
    'r9.rivalTeam': 'RIVAL TEAM',
    'r9.narrative': 'BATTLE NARRATIVE',
    'r9.noBattle': 'FINAL BATTLE NOT AVAILABLE',
    'r9.noBattleCopy': 'Prepare a qualified Journey before starting Final Battle.',
    'r9.goPreparation': 'OPEN FINAL PREPARATION',
    'r9.playerTeam': 'PLAYER TEAM',
    'r9.opponent': 'OPPONENT',
    'r9.arena': 'BATTLE ARENA',
    'r9.phase': 'PHASE',
    'r9.turn': 'TURN',
    'r9.legalActions': 'LEGAL ACTIONS',
    'r9.noActions': 'No legal actions are available in this state.',
    'r9.chooseAction': 'Choose one legal action to send.',
    'r9.start': 'START BATTLE',
    'r9.starting': 'STARTING…',
    'r9.completed': 'FINAL BATTLE COMPLETE',
    'r9.result': 'RESULT',
    'r9.events': 'BATTLE LOG',
    'r9.refresh': 'REFRESH STATE',
    'r9.actor': 'ACTOR',
    'r9.target': 'TARGET',
    'r9.cost': 'AP COST',
    'r9.status': 'STATUS',
    'r9.actionAccepted': 'Authoritative battle state refreshed.',
    'r9.noTarget': 'No target',
    'r9.screenNav': 'Final Battle screens',
    'r9.inCombat': 'IN COMBAT',
    'r9.reserve': 'RESERVE',
    'r9.judge': 'JUDGE',
    'r9.liveNarrative': 'LIVE BATTLE NARRATIVE',
    'r9.abilities': 'ABILITIES',
    'r9.vault': 'VAULT',
    'r9.selectHeroPrompt': 'Select a Player Hero to see its legal actions.',
    'r9.selectTarget': 'Select a legal target to complete this operation.',
    'r9.legalTargets': 'LEGAL TARGETS',
    'r9.executeAction': '⚡ EXECUTE ACTION',
    'r9.useItem': '⚡ USE ITEM',
    'r9.executing': 'EXECUTING…',
    'r9.noInventory': 'No items are available in the Vault.',
    'r9.event.action': 'ACTION',
    'r9.event.damage': 'DAMAGE',
    'r9.event.heal': 'HEALING',
    'r9.event.ko': 'KNOCKOUT',
    'r9.event.resource': 'RESOURCE',
    'r9.event.item': 'ITEM USE',
    'r9.event.swap': 'FORMATION',
    'r9.event.special': 'SPECIAL EVENT',
    'r9.event.actionDetail': '{actor} performed an action.',
    'r9.event.damageDetail': '{actor} → {targets} · {amount} damage.',
    'r9.event.healDetail': '{actor} → {targets} · {amount} restored.',
    'r9.event.koDetail': '{actor} knocked out {targets}.',
    'r9.event.resourceDetail': 'A battle resource changed: {amount}.',
    'r9.event.itemDetail': '{actor} used a Power-Up.',
    'r9.event.swapDetail': 'The authoritative formation changed.',
    'r9.event.specialDetail': 'A special battle event was recorded.',
    'r9.event.skippedDetail': '{actor} could not complete the action.',
    'r9.event.skipped': 'ACTION SKIPPED',
    'r10.caption': 'FINAL BATTLE',
    'r10.title': 'LIVE EVENTS',
    'r10.subtitle': 'Chronological events from the current Final Battle.',
    'r10.noBattle': 'NO FINAL BATTLE EVENTS',
    'r10.noBattleCopy': 'Events appear when a Final Battle is available.',
    'r10.events': 'BATTLE EVENTS',
    'r10.emptyEvents': 'No events have been recorded yet.',
    'r10.turn': 'TURN {turn}',
    'r10.phase': 'PHASE',
    'r10.actor': 'ACTOR',
    'r10.target': 'TARGET',
    'r10.eventType': 'EVENT',
    'r10.simulateLink': 'SIMULATE JOURNEY',
    'r10.loading': 'Loading events...',
    'r10.refresh': 'REFRESH',
    'r10.refreshing': 'UPDATING...',
    'r10.battleStatus': 'BATTLE STATUS',
    'r10.currentTurn': 'CURRENT TURN',
    'r10.state': 'STATE',
    'r10.state.ready': 'READY TO START',
    'r10.state.active': 'IN PROGRESS',
    'r10.state.completed': 'COMPLETED',
    'r10.result': 'RESULT',
    'r10.result.victory': 'VICTORY',
    'r10.result.defeat': 'DEFEAT',
    'r10.result.abandon': 'ABANDONED',
    'r10.notStarted': 'The Final Battle has not started yet.',
    'r10.damage': 'DAMAGE',
    'r10.apChange': 'AP CHANGE',
    'r10.event.tournamentFinalStarted': 'FINAL STARTED',
    'r10.event.action': 'ACTION',
    'r10.event.attackHit': 'ATTACK HIT',
    'r10.event.attackMiss': 'ATTACK MISS',
    'r10.event.effect': 'EFFECT',
    'r10.event.effectExpired': 'EFFECT EXPIRED',
    'r10.event.damage': 'DAMAGE',
    'r10.event.swap': 'SWAP',
    'r10.event.apChange': 'AP CHANGE',
    'r10.event.strategyChange': 'STRATEGY CHANGE',
    'r10.event.preRevealAbandon': 'ABANDON',
    'r10.event.abandon': 'ABANDON',
    'r10.event.surferEnough': 'SURFER HAS HAD ENOUGH',
    'r10.event.doomRevealed': 'DOOM REVEALED',
    'r10.event.doomExplanation': 'DOOM EXPLANATION',
    'r10.event.playerRejection': 'PLAYER REJECTION',
    'r10.event.opponentAlliance': 'OPPONENT ALLIANCE',
    'r10.event.doomsdayBegins': 'DOOMSDAY BEGINS',
    'r10.event.doomIntervention': 'DOOM INTERVENTION',
    'r10.event.initialized': 'BATTLE READY',
    'r10.event.heal': 'HEALING',
    'r10.event.ko': 'KNOCKOUT',
    'r10.event.revive': 'REVIVE',
    'r10.event.cleanse': 'CLEANSE',
    'r10.event.formationRestored': 'FORMATION RESTORED',
    'r10.event.rivalry': 'RIVALRY',
    'r10.event.doomThreat': 'DOOM THREAT',
    'r10.event.powerUp': 'POWER-UP',
    'r10.event.finalAttack': 'FINAL ATTACK',
    'r10.event.finalResponse': 'FINAL RESPONSE',
    'r10.event.victory': 'VICTORY',
    'r10.event.defeat': 'DEFEAT',
    'r10.event.postRevealAbandon': 'ABANDONED AFTER REVEAL',
    'r10.event.earlyDefeatScene': 'EARLY DEFEAT',
    'r10.event.doomAlone': 'DOOM STANDS ALONE',
    'r10.event.earlyDefeatReveal': 'EARLY DEFEAT REVEAL',
    'r10.event.sueStormAppeal': 'SUE STORM APPEAL',
    'r11.caption': 'FINAL BATTLE',
    'r11.title': 'TEAM STATUS',
    'r11.subtitle': 'Current tactical state from both sides of the Final Battle.',
    'r11.noBattle': 'NO TEAM STATUS AVAILABLE',
    'r11.noBattleCopy': 'Current Team status appears after Final Battle starts.',
    'r11.playerSide': 'PLAYER TEAM',
    'r11.opponentSide': 'OPPONENT TEAM',
    'r11.active': 'ACTIVE',
    'r11.reserve': 'RESERVE',
    'r11.knockedOut': 'KNOCKED OUT',
    'r11.available': 'AVAILABLE',
    'r11.energy': 'ENERGY',
    'r11.abilityPoints': 'ABILITY POINTS',
    'r11.teamActions': 'TEAM ACTIONS',
    'r11.leaderUses': 'LEADER USES',
    'r11.strategy': 'STRATEGY',
    'r11.phase': 'PHASE',
    'r11.turn': 'TURN',
    'r11.waitingForStart': 'Start the Final Battle to load both Teams’ current status.',
    'r12.caption': 'RESULTS',
    'r12.title': 'AWARDS',
    'r12.subtitle': 'Official statistics and Awards for the completed Journey.',
    'r12.unavailable': 'AWARDS NOT AVAILABLE',
    'r12.unavailableCopy': 'Awards are available after the Final Battle is complete.',
    'r12.statistics': 'JOURNEY STATISTICS',
    'r12.awards': 'OFFICIAL AWARDS',
    'r12.noAwards': 'No Awards are available for this Journey.',
    'r12.winner': 'WINNER',
    'r12.metric': 'METRIC',
    'r12.reason': 'REASON',
    'r12.outcome': 'OUTCOME',
    'r12.encounters': 'ENCOUNTERS',
    'r12.wins': 'WINS',
    'r12.losses': 'LOSSES',
    'r12.damageDealt': 'DAMAGE DEALT',
    'r12.damageReceived': 'DAMAGE RECEIVED',
    'r12.completion': 'COMPLETION',
    'r12.finalTurns': 'FINAL BATTLE TURNS',
    'r12.rewardPoints': 'REWARD POINTS EARNED / SPENT',
    'r13.caption': 'RESULTS',
    'r13.title': 'BATTLE HISTORY',
    'r13.subtitle': 'Completed Journeys for the configured Player Team.',
    'r13.noHistory': 'NO COMPLETED JOURNEYS',
    'r13.noHistoryCopy': 'Completed Journeys will appear here.',
    'r13.attempt': 'JOURNEY',
    'r13.createdAt': 'STARTED',
    'r13.completedAt': 'COMPLETED',
    'r13.outcome': 'OUTCOME',
    'r13.ending': 'ENDING',
    'r13.opponent': 'FINAL OPPONENT',
    'r13.rewardPoints': 'REWARD POINTS',
    'r13.viewDetails': 'VIEW JOURNEY DETAILS',
    'r13.awards': 'AWARDS',
    'r13.finalBattle': 'FINAL BATTLE',
    'r13.noDetails': 'Historical details are not available.',
    'r13.notRecorded': 'Not recorded',
    'r13.strategy': 'SPENDING STRATEGY',
    'r13.backToHistory': 'BACK TO HISTORY',
  },
  es: {
    loading: 'Cargando…',
    retry: 'Reintentar',
    empty: 'No hay registros disponibles.',
    error: 'No se pudo completar esta solicitud.',
    configuration: 'Estrategia y equipo',
    historyRivals: 'Historia y Rivales',
    heroRoster: 'Héroes',
    simulateJourney: 'Simular Batallas',
    search: 'Buscar',
    role: 'Rol',
    eligibility: 'Elegibilidad',
    compare: 'Comparar',
    remove: 'Quitar',
    save: 'Guardar',
    simulate: 'Simular Journey',
    selectStrategy: 'Estrategia de gasto del Journey',
    myTeam: 'Mi equipo',
    journey: 'Journey',
    finalStage: 'Etapa final',
    overview: 'Resumen',
    teamJourney: 'Camino del Equipo',
    statistics: 'Estadísticas',
    archive: 'Archivo',
    preparation: 'Preparación',
    play: 'Jugar',
    events: 'Eventos',
    status: 'Estado',
    noJourney: 'Sin Journey',
    journeyOverview: 'Resumen del Journey',
    encounterDetails: 'Detalles del encuentro',
    archiveDetail: 'Detalle del historial del Journey',
    liveEvents: 'Eventos en Vivo',
    battleStatus: 'Estado del Equipo',
    finalPreparationStore: 'Preparar Batalla Final',
    playFinalStage: 'Batalla Final',
    openEncounter: 'Abrir encuentro',
    openArchiveDetail: 'Abrir detalle del historial',
    teamArea: 'EQUIPO',
    journeyArea: 'CAMINO',
    finalBattleArea: 'BATALLA FINAL',
    resultsArea: 'RESULTADOS',
    teamConfig: 'Configurar Equipo',
    groupStage: 'Fase de Grupos',
    knockoutStage: 'Fase Eliminatoria',
    awards: 'Premios',
    history: 'Historial de Batallas',
    historyDetail: 'Detalle del historial del Journey',
    comingSoon: 'Próximamente',
    featurePending: 'Esta funcionalidad se diseñará en una futura iteración del prototipo.',
    'heroRoster.caption': 'ROSTER DE HÉROES',
    'heroRoster.title': 'Roster y análisis de Héroes',
    'heroRoster.subtitle': 'Explorá a los Héroes, sus habilidades y compará sus fortalezas.',
    'heroRoster.heroCount': '{count} HÉROES',
    'heroRoster.resultCount': '{visible} / {total} HÉROES',
    'heroRoster.allHeroes': 'TODOS LOS HÉROES',
    'heroRoster.searchLabel': 'Buscar Héroes',
    'heroRoster.searchPlaceholder': 'Nombre o ID del Héroe',
    'heroRoster.filterByRole': 'Filtrar por rol',
    'heroRoster.role.all': 'Todos',
    'heroRoster.role.agile': 'Ágil',
    'heroRoster.role.warrior': 'Guerrero',
    'heroRoster.role.mystic': 'Místico',
    'heroRoster.role.tech': 'Tecnología',
    'heroRoster.role.support': 'Apoyo',
    'heroRoster.selectForComparison': 'Seleccionar a {hero} para comparar',
    'heroRoster.noMatch': 'Ningún Héroe coincide con estos filtros.',
    'heroRoster.loading': 'Cargando el roster de Héroes…',
    'heroRoster.noHeroesAvailable': 'No hay Héroes disponibles.',
    'heroRoster.analysis': '⚔ ANÁLISIS DE HÉROES',
    'heroRoster.heroOne': 'HÉROE 1',
    'heroRoster.heroTwo': 'HÉROE 2',
    'heroRoster.removeHero': 'Quitar a {hero}',
    'heroRoster.energy': 'ENERGÍA',
    'heroRoster.abilityPoints': 'PUNTOS DE HABILIDAD',
    'heroRoster.power': 'POD',
    'heroRoster.agility': 'AGI',
    'heroRoster.resistance': 'RES',
    'heroRoster.ability': 'HAB',
    'heroRoster.offensive': 'OFENSIVA',
    'heroRoster.supportAbility': 'APOYO',
    'heroRoster.ap': 'AP',
    'heroRoster.selectHero': 'SELECCIONÁ UN HÉROE',
    'heroRoster.selectAnotherHero': 'SELECCIONÁ OTRO HÉROE PARA COMPARAR',
    'historyRivals.caption': 'HISTORIAL Y RIVALES',
    'historyRivals.title': 'HISTORIAL DEL EQUIPO Y RIVALES',
    'historyRivals.subtitle': 'Explora las rivalidades canónicas y su historial de batallas',
    'historyRivals.yourTeam': 'TU EQUIPO',
    'historyRivals.rivals': 'RIVALES',
    'historyRivals.rivalsFor': 'RIVALES DE',
    'historyRivals.battleHistory': 'HISTORIAL DE BATALLAS',
    'historyRivals.leader': 'LÍDER',
    'historyRivals.noRivals': 'SIN RIVALES CONFIGURADOS',
    'historyRivals.noRivalsCopy': 'Este héroe no tiene rivalidades conocidas.',
    'historyRivals.noBattles': 'AÚN NO HAY BATALLAS',
    'historyRivals.noBattlesCopy': 'Estos héroes aún no compartieron una batalla registrada.',
    'historyRivals.noRivalSelected': 'NO HAY RIVAL SELECCIONADO',
    'historyRivals.noRivalSelectedCopy': 'Este héroe no tiene un rival configurado para consultar.',
    'historyRivals.noTeamHeroes': 'No hay Héroes configurados en el Equipo.',
    'historyRivals.loading': 'Cargando el historial y las rivalidades del Equipo…',
    'historyRivals.damage': 'DAÑO',
    'historyRivals.victory': 'VICTORIA',
    'historyRivals.defeat': 'DERROTA',
    'historyRivals.draw': 'EMPATE',
    'historyRivals.win': 'VICTORIA',
    'historyRivals.loss': 'DERROTA',
    'historyRivals.stage.groupStage': 'FASE DE GRUPOS',
    'historyRivals.stage.roundOf16': 'OCTAVOS DE FINAL',
    'historyRivals.stage.quarterfinal': 'CUARTOS DE FINAL',
    'historyRivals.stage.semifinal': 'SEMIFINAL',
    'teamConfig.caption': 'CONFIGURACIÓN DEL EQUIPO',
    'teamConfig.title': 'CONFIGURACIÓN DEL EQUIPO',
    'teamConfig.subtitle': 'Configura la formación y la estrategia de combate.',
    'teamConfig.combatStrategy': 'ESTRATEGIA DE COMBATE',
    'teamConfig.yourTeam': 'TU EQUIPO',
    'teamConfig.heroCatalog': 'CATÁLOGO DE HÉROES',
    'teamConfig.activeFormation': '⚡ FORMACIÓN ACTIVA',
    'teamConfig.reserve': '↻ RESERVA',
    'teamConfig.leader': 'LÍDER',
    'teamConfig.active': 'ACTIVO',
    'teamConfig.reserveState': 'RESERVA',
    'teamConfig.removeHero': 'Quitar a {hero} del Equipo',
    'teamConfig.selectHero': 'Seleccionar a {hero} para el Equipo',
    'teamConfig.selectHeroForSlot': 'Seleccionar un Héroe para esta posición',
    'teamConfig.teamMarker': 'EQUIPO',
    'teamConfig.searchLabel': 'Buscar Héroes',
    'teamConfig.searchPlaceholder': 'Nombre o ID del Héroe',
    'teamConfig.filterByRole': 'Filtrar Héroes por rol',
    'teamConfig.noCatalogMatches': 'Ningún Héroe coincide con estos filtros.',
    'teamConfig.pending': 'CAMBIOS PENDIENTES — SELECCIONÁ UN HÉROE',
    'teamConfig.saved': 'Configuración actualizada.',
    'teamConfig.journeyReplaced': 'Configuración actualizada. Se generó un Journey de reemplazo.',
    'teamConfig.locked': 'La configuración está bloqueada mientras la Batalla Final esté activa.',
    'teamConfig.loading': 'Cargando la configuración del Equipo…',
    'teamConfig.noHeroesAvailable': 'No hay una configuración de Equipo disponible.',
    'teamConfig.save': 'GUARDAR CONFIGURACIÓN',
    'teamConfig.invalid':
      'La configuración no es válida. Revisá que haya exactamente 3 Héroes activos.',
    'teamConfig.replaceHero': 'Reemplazar a {hero}',
    'teamConfig.replacing':
      'Elegí un Héroe del catálogo para reemplazar al companion seleccionado.',
    'teamConfig.cancelReplace': 'Cancelar',
    'r4.caption': 'CAMINO',
    'r4.title': 'SIMULAR BATALLAS',
    'r4.subtitle': 'Elegí cómo administrará los recursos tu Equipo durante el torneo.',
    'r4.strategyTitle': 'ESTRATEGIA DE GASTO DEL CAMINO',
    'r4.strategyKicker': 'Elegí un enfoque para el torneo',
    'r4.save': 'AHORRAR',
    'r4.saveDescription': 'Reservá Puntos de Recompensa para la preparación final.',
    'r4.balanced': 'EQUILIBRADA',
    'r4.balancedDescription':
      'Gastá cuando resulte útil y conservá recursos para las últimas etapas.',
    'r4.aggressive': 'AGRESIVA',
    'r4.aggressiveDescription': 'Invertí más recursos para fortalecer el recorrido.',
    'r4.finalBattle': 'BATALLA FINAL',
    'r4.finalSubtitle': 'Tu Equipo y su rival para la Batalla Final.',
    'r4.playerTeam': 'EQUIPO DEL JUGADOR',
    'r4.opponent': 'RIVAL DE LA BATALLA FINAL',
    'r4.toBeDetermined': 'POR DETERMINAR',
    'r4.opponentUnknown': 'El rival de la Batalla Final aún no fue determinado.',
    'r4.leader': 'LÍDER',
    'r4.simulating': 'SIMULANDO EL CAMINO…',
    'r4.simulate': 'SIMULAR BATALLAS',
    'r4.success': 'Camino simulado. Rival de la Batalla Final determinado.',
    'r4.replaced': 'Se simuló un nuevo Camino en reemplazo del anterior.',
    'r5.caption': 'TORNEO',
    'r5.title': 'FASE DE GRUPOS',
    'r5.subtitle': 'Consultá los grupos, las posiciones y los encuentros oficiales de este Camino.',
    'r5.noJourney': 'NO HAY UN CAMINO ACTUAL',
    'r5.noJourneyCopy': 'Simulá un Camino para consultar su Fase de Grupos.',
    'r5.simulateLink': 'SIMULAR BATALLAS',
    'r5.groups': 'Grupos del Camino',
    'r5.groupLabel': 'GRUPO {group}',
    'r5.yourGroup': 'TU EQUIPO',
    'r5.standings': 'POSICIONES DEL GRUPO {group}',
    'r5.position': 'POS',
    'r5.team': 'EQUIPO',
    'r5.played': 'PJ',
    'r5.wins': 'G',
    'r5.draws': 'E',
    'r5.losses': 'P',
    'r5.points': 'PTS',
    'r5.damageFor': 'DAÑO A FAVOR',
    'r5.damageAgainst': 'DAÑO EN CONTRA',
    'r5.damageDiff': 'DIF. DE DAÑO',
    'r5.qualified': 'CLASIFICADO',
    'r5.qualifiedYes': 'SÍ',
    'r5.qualifiedNo': 'NO',
    'r5.encounters': 'BATALLAS DEL GRUPO · {count}',
    'r5.playedState': 'JUGADO',
    'r5.pending': 'PENDIENTE',
    'r5.result': 'RESULTADO',
    'r5.teamDamage': 'Daño de {team}: {damage}',
    'r5.noEncounters': 'No hay encuentros registrados para este grupo.',
    'r5.winner': 'GANADOR',
    'r5.draw': 'EMPATE',
    'r5.playerTeam': 'EQUIPO DEL JUGADOR',
    'r6.caption': 'TORNEO',
    'r6.title': 'FASE ELIMINATORIA',
    'r6.subtitle': 'Consultá las rondas eliminatorias y el resultado de la Batalla Final.',
    'r6.noJourney': 'NO HAY UN CAMINO ACTUAL',
    'r6.noJourneyCopy': 'Simulá un Camino para consultar su Fase Eliminatoria.',
    'r6.simulateLink': 'SIMULAR BATALLAS',
    'r6.stages': 'Etapas eliminatorias',
    'r6.roundOf16': 'OCTAVOS DE FINAL',
    'r6.quarterfinal': 'CUARTOS DE FINAL',
    'r6.semifinal': 'SEMIFINALES',
    'r6.final': 'FINAL',
    'r6.match': 'ENCUENTRO',
    'r6.played': 'JUGADO',
    'r6.winner': 'GANADOR',
    'r6.pending': 'PENDIENTE',
    'r6.yourTeam': 'TU EQUIPO',
    'r6.damage': 'DAÑO DEL EQUIPO',
    'r6.finalPending': 'La Final queda pendiente hasta completar la Batalla Final.',
    'r6.victory': 'VICTORIA',
    'r6.defeat': 'DERROTA',
    'r6.abandon': 'ABANDONO',
    'r6.draw': 'EMPATE',
    'tournament.resolution.totalKo': 'ELIMINACIÓN TOTAL',
    'tournament.resolution.specialShowdown': 'DESAFÍO ESPECIAL',
    'tournament.resolution.showdownForfeit': 'DESAFÍO ABANDONADO',
    'tournament.resolution.technicalVerdict': 'FALLO TÉCNICO',
    'r7.caption': 'CAMINO',
    'r7.title': 'CAMINO DEL EQUIPO',
    'r7.subtitle': 'Seguí el recorrido cronológico de tu Equipo por el torneo.',
    'r7.noJourney': 'NO HAY UN CAMINO ACTUAL',
    'r7.noJourneyCopy': 'Simulá un Camino para consultar el recorrido de tu Equipo.',
    'r7.simulateLink': 'SIMULAR BATALLAS',
    'r7.progress': 'PROGRESO DEL CAMINO',
    'r7.encounters': 'ENCUENTROS DEL EQUIPO',
    'r7.selectEncounter': 'Seleccioná un encuentro completado para consultar sus detalles.',
    'r7.pending': 'PENDIENTE',
    'r7.played': 'JUGADO',
    'r7.opponent': 'Rival',
    'r7.result': 'Resultado del equipo',
    'r7.damage': 'Daño del equipo',
    'r7.details': 'DETALLE DEL ENCUENTRO',
    'r7.noEncounterDetails': 'No hay detalles disponibles.',
    'r7.noPlayerEncounters': 'No hay encuentros del Equipo del Jugador.',
    'r7.win': 'VICTORIA',
    'r7.loss': 'DERROTA',
    'r7.draw': 'EMPATE',
    'r7.finalBattle': 'BATALLA FINAL',
    'r7.finalOutcome': 'Resultado de la Batalla Final',
    'r7.abandoned': 'ABANDONO',
    'r7.playerTeam': 'EQUIPO DEL JUGADOR',
    'r7.roundLabel': 'RONDA {number}',
    'r7.roundType.normal': 'RONDA NORMAL',
    'r7.roundType.extra': 'RONDA EXTRA',
    'r7.initiative': 'INICIATIVA',
    'r7.roundWinner': 'GANADOR DE LA RONDA',
    'r7.activeHeroes': 'HÉROES ACTIVOS',
    'r7.battleLog': 'REGISTRO DE BATALLA',
    'r7.detailLoading': 'Cargando detalles del encuentro…',
    'r7.event.action': 'Acción',
    'r7.event.damage': 'Daño',
    'r7.event.heal': 'Curación',
    'r7.event.ko': 'Fuera de combate',
    'r7.event.statGain': 'Aumento de atributo',
    'r7.event.recovery': 'Recuperación',
    'r7.event.purchaseUse': 'Objeto utilizado',
    'r7.event.actionSkipped': 'Acción omitida',
    'r7.event.specialShowdown': 'Desafío',
    'r7.event.showdownForfeit': 'Desafío abandonado',
    'r7.event.showdownVerdict': 'Resolución del desafío',
    'r7.event.other': 'Evento de batalla',
    'r7.eventDamageDetail': '{actor} → {targets} · {amount} de daño',
    'r7.eventKoDetail': '{actor} dejó fuera de combate a {targets}',
    'r8.caption': 'BATALLA FINAL',
    'r8.title': 'PREPARACIÓN FINAL',
    'r8.subtitle':
      'Revisá tu Equipo y realizá las preparaciones permitidas antes de la Batalla Final.',
    'r8.noJourney': 'FINALISTA NO DISPONIBLE',
    'r8.noJourneyCopy': 'Simulá un Camino y clasificá a la Final antes de prepararte.',
    'r8.rewardPoints': 'PUNTOS DE RECOMPENSA',
    'r8.available': 'DISPONIBLES',
    'r8.playerTeam': 'EQUIPO DEL JUGADOR',
    'r8.opponent': 'FINALISTA RIVAL',
    'r8.noOpponent': 'Todavía no hay información disponible del finalista rival.',
    'r8.powerUpStore': 'TIENDA DE MEJORAS',
    'r8.inventory': 'INVENTARIO',
    'r8.emptyInventory': 'No hay objetos en el inventario.',
    'r8.purchase': 'COMPRAR',
    'r8.purchaseSuccess': 'Compra realizada.',
    'r8.useItem': 'USAR OBJETO',
    'r8.selectedItem': 'OBJETO SELECCIONADO',
    'r8.targetHero': 'Héroe objetivo',
    'r8.activeHeroes': 'HÉROES ACTIVOS',
    'r8.active': 'ACTIVO',
    'r8.reserve': 'RESERVA',
    'r8.strategy': 'ESTRATEGIA DE COMBATE',
    'r8.savePreparation': 'GUARDAR PREPARACIÓN',
    'r8.preparationSaved': 'Preparación guardada.',
    'r8.startFinal': 'COMENZAR BATALLA FINAL',
    'r8.startingFinal': 'INICIANDO BATALLA FINAL…',
    'r8.continueFinal': 'CONTINUAR BATALLA FINAL',
    'r8.viewFinal': 'VER BATALLA FINAL',
    'r8.notReady': 'La preparación no está disponible para este Camino.',
    'r8.matchup': 'Equipo del jugador frente al finalista',
    'r8.teamPreparation': 'PREPARACIÓN DEL EQUIPO',
    'r8.inCombat': 'EN COMBATE',
    'r8.leader': 'LÍDER',
    'r8.statusUnknown': 'ESTADO NO DISPONIBLE',
    'r8.energy': 'ENERGÍA',
    'r8.ap': 'PA',
    'r8.dragHint':
      'Arrastrá un Héroe sobre otro para intercambiar las formaciones. El Líder permanece fijo.',
    'r8.saving': 'GUARDANDO PREPARACIÓN…',
    'r8.unknownItem': 'Mejora',
    'r8.chooseTarget': 'Elegí un Héroe',
    'r8.finalCompleted': 'BATALLA FINAL COMPLETADA',
    'r9.caption': 'BATALLA FINAL',
    'r9.title': 'BATALLA FINAL',
    'r9.subtitle': 'Elegí únicamente acciones ofrecidas en el estado actual por Game API.',
    'r9.loading': 'Cargando batalla final...',
    'r9.unavailableTitle': 'BATALLA FINAL NO DISPONIBLE',
    'r9.unavailableCopy': 'Prepará un Camino clasificado antes de iniciar la Batalla Final.',
    'r9.empty': 'No hay datos disponibles de la batalla final.',
    'r9.leader': 'LÍDER',
    'r9.knockedOut': 'FUERA DE COMBATE',
    'r9.energy': 'ENERGÍA',
    'r9.ap': 'PA',
    'r9.returnTurn': 'Regresa en el turno {turn}',
    'r9.yourTeam': 'TU EQUIPO',
    'r9.doctorDoom': 'DOCTOR DOOM',
    'r9.strategy': 'ESTRATEGIA',
    'r9.working': 'EJECUTANDO...',
    'r9.execute': 'EJECUTAR TURNO',
    'r9.abandon': 'ABANDONAR BATALLA',
    'r9.readyToStart': 'Tu equipo aparecerá cuando la batalla esté lista.',
    'r9.finished': 'La batalla final terminó.',
    'r9.readyHint': 'Elegí una acción y un objetivo, luego ejecutá el turno.',
    'r9.targetHint': 'Elegí un objetivo para completar la acción.',
    'r9.pickHint': 'Elegí un Héroe y una acción para continuar.',
    'r9.tab.abilities': 'HABILIDADES',
    'r9.tab.inventory': 'INVENTARIO',
    'r9.heroLabel': 'HÉROE',
    'r9.abilityLabel': 'HABILIDAD',
    'r9.teamActions': 'ACCIONES DE EQUIPO',
    'r9.targetLabel': 'OBJETIVO',
    'r9.scopeHero': 'HÉROE',
    'r9.scopeTeam': 'EQUIPO',
    'r9.inventoryEmpty': 'Tu inventario está vacío.',
    'r9.useItemHint': 'Los objetos aparecerán aquí cuando estén disponibles.',
    'r9.rivalTeam': 'EQUIPO RIVAL',
    'r9.narrative': 'RELATO DE BATALLA',
    'r9.noBattle': 'BATALLA FINAL NO DISPONIBLE',
    'r9.noBattleCopy': 'Prepará un Camino clasificado antes de iniciar la Batalla Final.',
    'r9.goPreparation': 'ABRIR PREPARACIÓN FINAL',
    'r9.playerTeam': 'EQUIPO DEL JUGADOR',
    'r9.opponent': 'RIVAL',
    'r9.arena': 'ARENA DE COMBATE',
    'r9.phase': 'ETAPA',
    'r9.turn': 'TURNO',
    'r9.legalActions': 'ACCIONES DISPONIBLES',
    'r9.noActions': 'No hay acciones legales disponibles en este estado.',
    'r9.chooseAction': 'Elegí una acción legal para enviar.',
    'r9.start': 'INICIAR BATALLA',
    'r9.starting': 'INICIANDO…',
    'r9.completed': 'BATALLA FINAL COMPLETADA',
    'r9.result': 'RESULTADO',
    'r9.events': 'REGISTRO DE BATALLA',
    'r9.refresh': 'ACTUALIZAR ESTADO',
    'r9.actor': 'HÉROE',
    'r9.target': 'OBJETIVO',
    'r9.cost': 'COSTO PA',
    'r9.status': 'ESTADO',
    'r9.actionAccepted': 'Se actualizó el estado autoritativo del combate.',
    'r9.noTarget': 'Sin objetivo',
    'r9.screenNav': 'Pantallas de Batalla Final',
    'r9.inCombat': 'EN COMBATE',
    'r9.reserve': 'RESERVA',
    'r9.judge': 'JUEZ',
    'r9.liveNarrative': 'RELATO EN VIVO',
    'r9.abilities': 'HABILIDADES',
    'r9.vault': 'INVENTARIO',
    'r9.selectHeroPrompt': 'Seleccioná un Héroe del Jugador para ver sus acciones legales.',
    'r9.selectTarget': 'Seleccioná un objetivo legal para completar la operación.',
    'r9.legalTargets': 'OBJETIVOS LEGALES',
    'r9.executeAction': '⚡ EJECUTAR ACCIÓN',
    'r9.useItem': '⚡ USAR OBJETO',
    'r9.executing': 'EJECUTANDO…',
    'r9.noInventory': 'No hay objetos disponibles en el Inventario.',
    'r9.event.action': 'ACCIÓN',
    'r9.event.damage': 'DAÑO',
    'r9.event.heal': 'CURACIÓN',
    'r9.event.ko': 'FUERA DE COMBATE',
    'r9.event.resource': 'RECURSO',
    'r9.event.item': 'USO DE OBJETO',
    'r9.event.swap': 'FORMACIÓN',
    'r9.event.special': 'EVENTO ESPECIAL',
    'r9.event.actionDetail': '{actor} realizó una acción.',
    'r9.event.damageDetail': '{actor} → {targets} · {amount} de daño.',
    'r9.event.healDetail': '{actor} → {targets} · {amount} recuperados.',
    'r9.event.koDetail': '{actor} dejó fuera de combate a {targets}.',
    'r9.event.resourceDetail': 'Cambió un recurso del combate: {amount}.',
    'r9.event.itemDetail': '{actor} usó una mejora.',
    'r9.event.swapDetail': 'La formación cambió según el estado autoritativo.',
    'r9.event.specialDetail': 'Se registró un evento especial del combate.',
    'r9.event.skippedDetail': '{actor} no pudo completar la acción.',
    'r9.event.skipped': 'ACCIÓN OMITIDA',
    'r10.caption': 'BATALLA FINAL',
    'r10.title': 'EVENTOS EN VIVO',
    'r10.subtitle': 'Cronología de eventos de la Batalla Final actual.',
    'r10.noBattle': 'SIN EVENTOS DE BATALLA FINAL',
    'r10.noBattleCopy': 'Los eventos aparecerán cuando haya una Batalla Final disponible.',
    'r10.events': 'EVENTOS DE BATALLA',
    'r10.emptyEvents': 'Todavía no se registraron eventos.',
    'r10.turn': 'TURNO {turn}',
    'r10.phase': 'ETAPA',
    'r10.actor': 'HÉROE',
    'r10.target': 'OBJETIVO',
    'r10.eventType': 'EVENTO',
    'r10.simulateLink': 'SIMULAR BATALLAS',
    'r10.loading': 'Cargando eventos...',
    'r10.refresh': 'ACTUALIZAR',
    'r10.refreshing': 'ACTUALIZANDO...',
    'r10.battleStatus': 'ESTADO DE LA BATALLA',
    'r10.currentTurn': 'TURNO ACTUAL',
    'r10.state': 'ESTADO',
    'r10.state.ready': 'LISTA PARA COMENZAR',
    'r10.state.active': 'EN CURSO',
    'r10.state.completed': 'COMPLETADA',
    'r10.result': 'RESULTADO',
    'r10.result.victory': 'VICTORIA',
    'r10.result.defeat': 'DERROTA',
    'r10.result.abandon': 'ABANDONO',
    'r10.notStarted': 'La Batalla Final todavía no comenzó.',
    'r10.damage': 'DAÑO',
    'r10.apChange': 'CAMBIO DE AP',
    'r10.event.tournamentFinalStarted': 'INICIO DE LA FINAL',
    'r10.event.action': 'ACCIÓN',
    'r10.event.attackHit': 'IMPACTO',
    'r10.event.attackMiss': 'ATAQUE FALLIDO',
    'r10.event.effect': 'EFECTO',
    'r10.event.effectExpired': 'EFECTO EXPIRADO',
    'r10.event.damage': 'DAÑO',
    'r10.event.swap': 'CAMBIO',
    'r10.event.apChange': 'CAMBIO DE AP',
    'r10.event.strategyChange': 'CAMBIO DE ESTRATEGIA',
    'r10.event.preRevealAbandon': 'ABANDONO',
    'r10.event.abandon': 'ABANDONO',
    'r10.event.surferEnough': 'SURFER NO AGUANTA MÁS',
    'r10.event.doomRevealed': 'DOOM REVELADO',
    'r10.event.doomExplanation': 'EXPLICACIÓN DE DOOM',
    'r10.event.playerRejection': 'RECHAZO DEL JUGADOR',
    'r10.event.opponentAlliance': 'ALIANZA RIVAL',
    'r10.event.doomsdayBegins': 'COMIENZA EL DÍA DEL JUICIO',
    'r10.event.doomIntervention': 'INTERVENCIÓN DE DOOM',
    'r10.event.initialized': 'COMBATE PREPARADO',
    'r10.event.heal': 'CURACIÓN',
    'r10.event.ko': 'FUERA DE COMBATE',
    'r10.event.revive': 'REANIMACIÓN',
    'r10.event.cleanse': 'PURIFICACIÓN',
    'r10.event.formationRestored': 'FORMACIÓN RESTABLECIDA',
    'r10.event.rivalry': 'RIVALIDAD',
    'r10.event.doomThreat': 'AMENAZA DE DOOM',
    'r10.event.powerUp': 'MEJORA',
    'r10.event.finalAttack': 'ATAQUE FINAL',
    'r10.event.finalResponse': 'RESPUESTA FINAL',
    'r10.event.victory': 'VICTORIA',
    'r10.event.defeat': 'DERROTA',
    'r10.event.postRevealAbandon': 'ABANDONO TRAS LA REVELACIÓN',
    'r10.event.earlyDefeatScene': 'DERROTA TEMPRANA',
    'r10.event.doomAlone': 'DOOM SE QUEDA SOLO',
    'r10.event.earlyDefeatReveal': 'REVELACIÓN POR DERROTA TEMPRANA',
    'r10.event.sueStormAppeal': 'INTERVENCIÓN DE SUE STORM',
    'r11.caption': 'BATALLA FINAL',
    'r11.title': 'ESTADO DEL EQUIPO',
    'r11.subtitle': 'Estado táctico actual de ambos lados de la Batalla Final.',
    'r11.noBattle': 'ESTADO NO DISPONIBLE',
    'r11.noBattleCopy': 'El estado actual aparecerá cuando comience la Batalla Final.',
    'r11.playerSide': 'EQUIPO DEL JUGADOR',
    'r11.opponentSide': 'EQUIPO RIVAL',
    'r11.active': 'ACTIVO',
    'r11.reserve': 'RESERVA',
    'r11.knockedOut': 'FUERA DE COMBATE',
    'r11.available': 'DISPONIBLE',
    'r11.energy': 'ENERGÍA',
    'r11.abilityPoints': 'PUNTOS DE HABILIDAD',
    'r11.teamActions': 'ACCIONES DEL EQUIPO',
    'r11.leaderUses': 'USOS DEL LÍDER',
    'r11.strategy': 'ESTRATEGIA',
    'r11.phase': 'ETAPA',
    'r11.turn': 'TURNO',
    'r11.waitingForStart': 'Iniciá la Batalla Final para cargar el estado actual de ambos Equipos.',
    'r12.caption': 'RESULTADOS',
    'r12.title': 'PREMIOS',
    'r12.subtitle': 'Estadísticas y premios oficiales del Camino completado.',
    'r12.unavailable': 'PREMIOS NO DISPONIBLES',
    'r12.unavailableCopy': 'Los premios estarán disponibles al completar la Batalla Final.',
    'r12.statistics': 'ESTADÍSTICAS DEL CAMINO',
    'r12.awards': 'PREMIOS OFICIALES',
    'r12.noAwards': 'No hay premios disponibles para este Camino.',
    'r12.winner': 'GANADOR',
    'r12.metric': 'MÉTRICA',
    'r12.reason': 'MOTIVO',
    'r12.outcome': 'RESULTADO',
    'r12.encounters': 'ENCUENTROS',
    'r12.wins': 'VICTORIAS',
    'r12.losses': 'DERROTAS',
    'r12.damageDealt': 'DAÑO INFLIGIDO',
    'r12.damageReceived': 'DAÑO RECIBIDO',
    'r12.completion': 'FINALIZACIÓN',
    'r12.finalTurns': 'TURNOS DE BATALLA FINAL',
    'r12.rewardPoints': 'PUNTOS DE RECOMPENSA GANADOS / GASTADOS',
    'r13.caption': 'RESULTADOS',
    'r13.title': 'HISTORIAL DE BATALLAS',
    'r13.subtitle': 'Caminos completados del Equipo configurado.',
    'r13.noHistory': 'NO HAY CAMINOS COMPLETADOS',
    'r13.noHistoryCopy': 'Los Caminos completados aparecerán aquí.',
    'r13.attempt': 'CAMINO',
    'r13.createdAt': 'INICIO',
    'r13.completedAt': 'COMPLETADO',
    'r13.outcome': 'RESULTADO',
    'r13.ending': 'DESENLACE',
    'r13.opponent': 'RIVAL FINAL',
    'r13.rewardPoints': 'PUNTOS DE RECOMPENSA',
    'r13.viewDetails': 'VER DETALLE DEL CAMINO',
    'r13.awards': 'PREMIOS',
    'r13.finalBattle': 'BATALLA FINAL',
    'r13.noDetails': 'El detalle histórico no está disponible.',
    'r13.notRecorded': 'Sin registro',
    'r13.strategy': 'ESTRATEGIA DE GASTO',
    'r13.backToHistory': 'VOLVER AL HISTORIAL',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  constructor(private readonly context: AppContextService) {}

  get language(): AppLanguage {
    return this.context.current?.language ?? 'en';
  }

  t(key: AppCopyKey, values: Record<string, string | number> = {}): string {
    return this.translate(key, this.language, values);
  }

  translate(
    key: AppCopyKey,
    language: AppLanguage,
    params: Record<string, string | number> = {},
  ): string {
    let copy = DICTIONARY[language][key];
    for (const [name, value] of Object.entries(params)) {
      copy = copy.replace(`{${name}}`, String(value));
    }
    return copy;
  }

  forLanguage(language: AppLanguage, key: AppCopyKey): string {
    return DICTIONARY[language][key];
  }

  text(en: string, es: string): string {
    return this.language === 'en' ? en : es;
  }
}
