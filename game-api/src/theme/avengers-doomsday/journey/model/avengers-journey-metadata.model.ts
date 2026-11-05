import { TurnResult } from '../../../../final-stage/model/turn-result.model';
import { AvengersStrategy } from '../../model/avengers-strategy.enum';
import { AvengersTeamState } from '../../model/avengers-team-state.model';
import { AvengersTurnData } from '../../model/avengers-turn-data.model';
import { HeroStats, StatName } from '../../model/hero-stats.model';
import {
  AvengersHeroContent,
  AvengersNarrativeCharacterContent,
} from '../../catalog/model/avengers-hero-content.model';
import { JourneySpendingStrategy } from './journey-spending-strategy.enum';
import { PowerUpEffect } from '../../model/power-up.model';
import { LeaderAbility } from '../../model/hero-ability.model';
import { AvengersEndingCode } from '../../model/avengers-ending-code.enum';
import { AvengersTerminalReason } from '../../model/avengers-terminal-reason.enum';

export type AvengersJourneyStatus = 'PRE_FINAL' | 'FINAL_ACTIVE' | 'COMPLETED';
export type AvengersStageType = 'GROUP_STAGE' | 'ROUND_OF_16' | 'QUARTERFINAL' | 'SEMIFINAL';
export type AvengersEncounterResult = 'WIN' | 'DRAW' | 'LOSS';
export type JourneyRoundMode = 'NORMAL' | 'PLAYER_WIN';

export interface AvengersTeamConfiguration {
  leaderId: string;
  companionIds: string[];
  activeHeroIds: string[];
  strategy: AvengersStrategy;
  visualKey: string;
}

export interface AvengersJourneyHeroState {
  heroId: string;
  currentEnergy: number;
  currentAbilityPoints: number;
  active: boolean;
  knockedOut: boolean;
  statGains: Partial<Record<StatName, number>>;
}

export interface AvengersTournamentTeam {
  id: string;
  name: string;
  leaderId: string;
  heroIds: string[];
  leaderProfile: AvengersStrategy;
  strategy: AvengersStrategy;
  generationMode: 'PLAYER' | 'AFFINITY' | 'VARIETY' | 'FRICTION';
  heroes: AvengersJourneyHeroState[];
  rewardPoints: number;
  inventory: AvengersInventoryEntry[];
  temporaryEffects: Array<{
    stat: StatName;
    percent: number;
    remainingRounds: number;
    heroIds?: string[];
  }>;
  extraTeamActions: number;
  extraLeaderAbilities: number;
  eliminated: boolean;
}

export interface AvengersRoundFact {
  round: number;
  mode: JourneyRoundMode;
  initiativeTeamId: string;
  playerDamage: number;
  opponentDamage: number;
  winnerTeamId: string | null;
  participantHeroIds: Record<string, string[]>;
  events: AvengersJourneyEvent[];
}

export interface AvengersEncounter {
  id: string;
  stageId: string;
  stageType: AvengersStageType;
  groupId: string | null;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  resultByTeam: Record<string, AvengersEncounterResult>;
  damageByTeam: Record<string, number>;
  rounds: AvengersRoundFact[];
  extraRound: AvengersRoundFact | null;
  resolution: 'NORMAL' | 'TOTAL_KO' | 'SPECIAL_SHOWDOWN' | 'SHOWDOWN_FORFEIT' | 'TECHNICAL_VERDICT';
  rival: boolean;
  rewardByTeam: Record<string, number>;
  statGains: AvengersStatGain[];
  resourceConsequences?: AvengersEncounterResourceConsequence[];
}

export interface AvengersEncounterHeroResourceConsequence {
  heroId: string;
  energyBefore: number;
  energyAfter: number;
  abilityPointsBefore: number;
  abilityPointsAfter: number;
  statusBefore: 'ACTIVE' | 'INACTIVE' | 'KO';
  statusAfter: 'ACTIVE' | 'INACTIVE' | 'KO';
}

export interface AvengersEncounterResourceConsequence {
  teamId: string;
  heroes: AvengersEncounterHeroResourceConsequence[];
}

export interface AvengersStanding {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  damageDealt: number;
  damageReceived: number;
  damageDifference: number;
  tieRank: number;
  qualified: boolean;
}

export interface AvengersStage {
  id: string;
  type: AvengersStageType;
  order: number;
  groupId: string | null;
  encounterIds: string[];
  standings: AvengersStanding[];
}

export interface AvengersStatGain {
  teamId: string;
  heroId: string;
  stat: StatName;
  amount: number;
}

export interface AvengersRewardLedgerEntry {
  id: string;
  teamId: string;
  encounterId: string | null;
  reason: 'WIN' | 'DRAW' | 'LOSS' | 'RIVAL_WIN' | 'TOTAL_KO_WIN' | 'PURCHASE';
  amount: number;
  balanceAfter: number;
}

export interface AvengersInventoryEntry {
  itemId: string;
  quantity: number;
}

export interface AvengersJourneyEvent {
  sequence: number;
  type: string;
  stageId: string | null;
  encounterId: string | null;
  round: number | null;
  teamId: string | null;
  actorHeroId: string | null;
  targetHeroIds: string[];
  values: Record<string, number | string | boolean>;
  messageCode: string;
}

export interface AvengersPowerUpDefinition {
  id: string;
  name: { en: string; es: string };
  price: number;
  target: 'HERO' | 'TEAM';
  effect: PowerUpEffect;
}

export interface AvengersCapturedContent {
  heroes: AvengersHeroContent[];
  narrativeCharacters: AvengersNarrativeCharacterContent[];
  powerUps: AvengersPowerUpDefinition[];
}

export interface AvengersJourneyVersions {
  metadataVersion: 'avengers-journey-metadata-v1' | 'avengers-journey-metadata-v2';
  rulesVersion: 'avengers-journey-rules-v1';
  contentVersion: string;
  awardsVersion: 'avengers-awards-v1';
  balanceFingerprint: string;
}

export interface AvengersJourneyMetadata {
  versions: AvengersJourneyVersions;
  seed: number;
  randomState: number;
  spendingStrategy: JourneySpendingStrategy;
  createdAt: string;
  completedAt: string | null;
  initialConfiguration: AvengersTeamConfiguration;
  content: AvengersCapturedContent;
  teams: AvengersTournamentTeam[];
  stages: AvengersStage[];
  encounters: AvengersEncounter[];
  finalistIds: [string, string];
  rewardLedger: AvengersRewardLedgerEntry[];
  events: AvengersJourneyEvent[];
  finalStage: TurnResult<AvengersTurnData>;
  completionReason: 'VICTORY' | 'DEFEAT' | 'ABANDON' | null;
  endingCode: AvengersEndingCode | null;
  terminalReasonCode: AvengersTerminalReason | null;
  statistics: AvengersCompetitionStatistics | null;
}

export interface AvengersHeroStatisticsFacts {
  activeEncounters: number;
  activeRounds: number;
  winningActiveRounds: number;
  damageDealt: number;
  damageReceived: number;
  healing: number;
  kosCaused: number;
  kosSuffered: number;
  offensiveSpecialsUsed: number;
  supportSpecialsUsed: number;
  statGains: number;
}

export interface AvengersHeroStatistics extends AvengersHeroStatisticsFacts {
  teamId: string;
  heroId: string;
  eligible: boolean;
  journey: AvengersHeroStatisticsFacts;
  finalStage: AvengersHeroStatisticsFacts;
}

export interface AvengersTeamStatistics {
  teamId: string;
  encounters: number;
  wins: number;
  draws: number;
  losses: number;
  damageDealt: number;
  damageReceived: number;
  healing: number;
  kosCaused: number;
  kosSuffered: number;
  specialsUsed: number;
  teamActionsUsed: number;
  leaderAbilitiesUsed: number;
  rewardPointsEarned: number;
  rewardPointsSpent: number;
  powerUpsUsed: number;
  statGains: number;
}

export type AvengersAwardCode =
  | 'MIGHTIEST_HERO'
  | 'BEST_SUPPORT'
  | 'MOST_RESILIENT'
  | 'JOURNEY_MVP';
export interface AvengersAwardDecision {
  code: AvengersAwardCode;
  winner: { teamId: string; heroId: string } | null;
  metric: string;
  value: number | null;
  tieBreak: Record<string, number | string>;
}

export interface AvengersCompetitionStatistics {
  eligibleTeamIds: string[];
  teamStatistics: AvengersTeamStatistics[];
  heroStatistics: AvengersHeroStatistics[];
  awards: AvengersAwardDecision[];
  awardsVersion: 'avengers-awards-v1';
}

export interface AvengersJourneyBalance {
  encounterMaxRounds: number;
  playerMinWinPercentage: number;
  playerMaxWinPercentage: number;
  rewards: { win: number; draw: number; loss: number; rivalWin: number; totalKoWin: number };
  progression: { baseChance: number; amount: number; statMax: number };
  stageRecovery: {
    energyPercent: number;
    apPercent: number;
    reviveAll: boolean;
    clearEffects: boolean;
  };
  finalRecovery: {
    energyPercent: number;
    apPercent: number;
    reviveAll: boolean;
    clearEffects: boolean;
  };
}

export interface AvengersFinalContentSnapshot {
  heroes: Record<string, AvengersHeroContent>;
  teams: Record<
    string,
    {
      name: string;
      leaderAbility: LeaderAbility;
    }
  >;
  balance: Record<string, unknown>;
}

export type AvengersPreparedTeamState = AvengersTeamState;
export type AvengersBaseStats = HeroStats;
