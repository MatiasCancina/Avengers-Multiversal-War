export interface JourneyCurrentAttempt {
  attemptId: string;
  status: 'PRE_FINAL' | 'FINAL_ACTIVE' | 'COMPLETED';
  stageCount: number;
  encounterCount: number;
}

export interface JourneyFinalists {
  playerTeamId: string;
  opponentTeamId: string;
}

export interface JourneyConfiguration {
  strategyCode?: string;
  activeHeroIds?: string[];
  inactiveHeroIds?: string[];
  [key: string]: unknown;
}

export interface JourneyProgress {
  stagesCompleted: number;
  encountersPlayedByPlayer: number;
  finalStageStatus: 'READY' | 'ACTIVE' | 'COMPLETED';
}

export interface JourneySummary {
  attemptId: string;
  teamId: string;
  status: 'PRE_FINAL' | 'FINAL_ACTIVE' | 'COMPLETED';
  spendingStrategyCode: string;
  createdAt: string;
  completedAt: string | null;
  configuration: JourneyConfiguration;
  finalists: JourneyFinalists;
  progress: JourneyProgress;
  completionOutcome: 'VICTORY' | 'DEFEAT' | 'ABANDON' | null;
  endingCode: string | null;
  terminalReasonCode: string | null;
}

export interface CurrentJourneyData {
  teamId: string;
  attempt: JourneyCurrentAttempt | null;
  summary: JourneySummary | null;
}

export interface TournamentHeroState {
  heroId: string;
  maximumEnergy?: number;
  maximumAbilityPoints?: number;
  currentEnergy: number;
  currentAbilityPoints: number;
  status: string;
  knockedOut: boolean;
  statGains: {
    statCode: string;
    amount?: number;
    [key: string]: unknown;
  }[];
}

export interface TournamentTeam {
  teamId: string;
  name: string;
  leaderId: string;
  heroIds: string[];
  strategyCode: string;
  generationModeCode: string;
  heroes: TournamentHeroState[];
  rewardPoints: number;
  eliminated: boolean;
}

export interface TournamentTeamsData {
  attemptId: string;
  teams: TournamentTeam[];
  finalists: JourneyFinalists;
}

export interface RewardAccountData {
  attemptId: string;
  teamId: string;
  earned: number;
  spent: number;
  balance: number;
  ledger: {
    encounterId: string | null;
    reasonCode: string;
    amount: number;
    balanceAfter: number;
  }[];
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
  legalUseContexts: string[];
}

export interface InventoryData {
  attemptId: string;
  teamId: string;
  items: InventoryEntry[];
}

export interface StrategyDefinition {
  code: string;
  label?: string;
  description?: string;
  [key: string]: unknown;
}

export interface StrategyCatalogData {
  language: string;
  strategies: StrategyDefinition[];
  compatibility: {
    sameProfile: string;
    aggressiveVsDefensive: string;
    otherwise: string;
  };
}

export interface PowerUpEffect {
  effectCode:
    | 'ENERGY_RECOVERY'
    | 'ABILITY_POINT_RECOVERY'
    | 'REVIVE'
    | 'STAT_BOOST'
    | 'EXTRA_TEAM_ACTION'
    | 'EXTRA_LEADER_ABILITY';
  targetPercentage?: number;
  canRevive?: boolean;
  fullRecovery?: boolean;
  statCode?: string;
  percentage?: number;
  durationRounds?: number;
}

export interface PowerUpDefinition {
  id: string;
  name: string;
  description: string;
  categoryCode: string;
  price: number;
  targetScope: 'HERO' | 'TEAM';
  useContexts: string[];
  effect: PowerUpEffect;
}

export interface PowerUpCatalogData {
  language: string;
  powerUps: PowerUpDefinition[];
}

export interface UpdateFinalPreparationResult {
  strategyCode: string;
  activeHeroIds: string[];
}

export interface PurchasePowerUpResult {
  teamId: string;
  items: InventoryEntry[];
  rewardPoints: number;
  purchasedItemId: string;
  purchasedQuantity: number;
}

export interface UsePreparationItemResult {
  teamId: string;
  items: InventoryEntry[];
  usedItemId: string;
  targetHeroId: string | null;
}

export interface FinalStageData {
  status?: string;
  [key: string]: unknown;
}
