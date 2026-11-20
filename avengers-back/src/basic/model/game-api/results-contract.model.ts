export interface StatisticsCompetitionApi {
  journeyEncounters: number;
  finalStagePlayed: boolean;
  finalStageNormalTurnsPlayed: number;
}

export interface TeamStatisticsApi {
  teamId: string;
  encounters: number;
  wins: number;
  draws: number;
  losses: number;
  damageDealt: number;
  rewardPointsEarned: number;
  powerUpsUsed: number;
  statGains: number;
}

export interface HeroStatisticsTotalsApi {
  activeEncounters: number;
  activeRounds: number;
  damageDealt: number;
  kosCaused: number;
  kosSuffered: number;
}

export interface HeroStatisticsApi {
  teamId: string;
  heroId: string;
  eligible: boolean;
  totals: HeroStatisticsTotalsApi;
}

export interface AwardWinnerApi {
  teamId: string;
  heroId: string;
}

export interface AwardWinningFactsApi {
  metricCode: string;
  value: number;
}

export interface AwardApi {
  code: string;
  label: string;
  explanation: string;
  winner: AwardWinnerApi | null;
  winningFacts: AwardWinningFactsApi | null;
  reason: string;
}

export interface JourneyStatisticsApi {
  attemptId: string;
  status: string;
  completionOutcome: string;
  terminalReasonCode?: string | null;
  completedAt?: string | null;
  language: string;
  competition: StatisticsCompetitionApi;
  teamStatistics: TeamStatisticsApi[];
  heroStatistics: HeroStatisticsApi[];
  awards: AwardApi[];
}

export interface AwardMetricApi {
  code: string;
  label: string;
  description?: string;
}

export interface GameDictionaryApi {
  language: string;
  awardMetrics: AwardMetricApi[];
}
