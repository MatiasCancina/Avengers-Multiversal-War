export interface AppRouteMetadata {
  feature: string;
  category: string;
  title: string;
}

export const APP_ROUTE_METADATA = {
  heroRoster: { feature: 'hero-roster', category: 'teamArea', title: 'heroRoster' },
  historyRivals: { feature: 'history-rivals', category: 'teamArea', title: 'historyRivals' },
  teamConfig: { feature: 'team-config', category: 'teamArea', title: 'teamConfig' },
  simulateJourney: {
    feature: 'simulate-journey',
    category: 'journeyArea',
    title: 'simulateJourney',
  },
  groupStage: { feature: 'group-stage', category: 'journeyArea', title: 'groupStage' },
  knockoutStage: { feature: 'knockout-stage', category: 'journeyArea', title: 'knockoutStage' },
  teamJourney: { feature: 'team-journey', category: 'journeyArea', title: 'teamJourney' },
  finalPreparation: {
    feature: 'final-preparation',
    category: 'finalBattleArea',
    title: 'finalPreparationStore',
  },
  finalBattle: { feature: 'final-battle', category: 'finalBattleArea', title: 'playFinalStage' },
  liveEvents: { feature: 'live-events', category: 'finalBattleArea', title: 'liveEvents' },
  teamStatus: { feature: 'team-status', category: 'finalBattleArea', title: 'battleStatus' },
  awards: { feature: 'awards', category: 'resultsArea', title: 'awards' },
  history: { feature: 'history', category: 'resultsArea', title: 'history' },
  historyDetail: { feature: 'history', category: 'resultsArea', title: 'historyDetail' },
} as const satisfies Record<string, AppRouteMetadata>;
