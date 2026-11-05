import { PageState } from '../../../../core/models/page-state.interface';

export interface JourneyFinalists {
  playerTeamId: string;
  opponentTeamId: string;
}

export interface JourneyConfiguration {
  strategyCode: string;
  activeHeroIds: string[];
  inactiveHeroIds: string[];
}

export interface JourneySummary {
  attemptId: string;
  teamId: string;
  status: string;
  spendingStrategyCode: string;
  configuration: JourneyConfiguration;
  finalists: JourneyFinalists;
  progress: {
    stagesCompleted: number;
    encountersPlayedByPlayer: number;
    finalStageStatus: string;
  };
}

export interface CurrentJourneyData {
  teamId: string;
  attempt: {
    attemptId: string;
    status: string;
    stageCount: number;
    encounterCount: number;
  } | null;
  summary: JourneySummary | null;
}

export interface HeroState {
  heroId: string;
  currentEnergy: number;
  maximumEnergy: number;
  currentAbilityPoints: number;
  maximumAbilityPoints: number;
  status: string;
  knockedOut: boolean;
}

export interface TournamentTeam {
  teamId: string;
  name: string;
  leaderId: string;
  heroIds: string[];
  strategyCode: string;
  heroes: HeroState[];
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

export interface FinalStageData {
  status?: string;
}

export interface FinalPreparationData {
  hasJourney: boolean;
  teamId: string;
  journey: CurrentJourneyData;
  player: TournamentTeam | null;
  opponent: TournamentTeam | null;
  finalists: JourneyFinalists | null;
  finalStage: FinalStageData | null;
  teams: TournamentTeamsData | null;
  rewards: RewardAccountData | null;
  inventory: InventoryData | null;
  powerUps: PowerUpCatalogData | null;
  strategies: StrategyCatalogData | null;
}

export interface FinalPreparationViewModel extends PageState {
  data: FinalPreparationData | null;
  busy?: boolean;
  notice?: string | null;
}
