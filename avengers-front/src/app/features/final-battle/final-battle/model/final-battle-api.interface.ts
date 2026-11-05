export type FinalBattleStatus = 'READY' | 'ACTIVE' | 'COMPLETED';

export interface FinalBattleStateApi {
  status: FinalBattleStatus;
  phase: string;
  phaseLabel: string;
  normalTurn: number;
  turnState: string;
  playerTeamId: string;
  opponentTeamId: string;
  outcomeCode: string | null;
  terminalReasonCode: string | null;
}

export interface FinalBattleHeroApi {
  heroId: string;
  heroName: string;
  status: string;
  condition: string;
  maximumEnergy: number;
  currentEnergy: number;
  maximumAbilityPoints: number;
  currentAbilityPoints: number;
  returnAtTurn: number;
}

export interface FinalBattleSideApi {
  teamId: string;
  leaderId: string;
  strategyCode: string;
  heroes: FinalBattleHeroApi[];
  vacantActiveHeroIds: string[];
  synergyCode: string;
  teamActionsRemaining: number;
  leaderAbilityUsesRemaining: number;
  strategyChangesRemaining: number;
}

export interface FinalBattleTeamsApi {
  player: FinalBattleSideApi;
  opponent: FinalBattleSideApi;
}

export interface FinalBattleDoomApi {
  narrativeCharacterId: string;
  maximumEnergy: number;
  currentEnergy: number;
  threatLevelCode: string;
}

export interface FinalBattleTargetApi {
  targetType: string;
  targetId: string;
  targetName?: string;
  sideCode: string;
}

export interface FinalBattleActionOptionApi {
  actionId: string;
  description: string;
  target: FinalBattleTargetApi | null;
  strategyCode?: string;
  outgoingHeroId?: string;
  outgoingHeroName?: string;
  incomingHeroId?: string;
  incomingHeroName?: string;
}

export interface FinalBattleAbilityApi {
  groupKey: string;
  actionCode: string;
  label: string;
  description?: string;
  abilityId?: string;
  itemId?: string;
  roleCombination?: string;
  abilityPointCost: number;
  options: FinalBattleActionOptionApi[];
}

export interface FinalBattleHeroActionsApi {
  actorHeroId: string;
  actorHeroName: string;
  abilities: FinalBattleAbilityApi[];
}

export interface FinalBattleInventoryItemApi {
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  targetScope: 'HERO' | 'TEAM';
  effectCode: string;
}

export interface FinalBattleApi {
  state: FinalBattleStateApi;
  teams: FinalBattleTeamsApi | null;
  doom: FinalBattleDoomApi | null;
  heroActions: FinalBattleHeroActionsApi[];
  teamActions: FinalBattleAbilityApi[];
  inventory: FinalBattleInventoryItemApi[];
}

export interface FinalBattlePlayResultApi {
  status: FinalBattleStatus;
  phase: string;
  normalTurn: number;
  completionOutcome: string | null;
  terminalReasonCode: string | null;
  nextDecisionRequired: boolean;
}

export type FinalBattlePlayRequestApi =
  | { type: 'START' }
  | { type: 'CHOOSE_ACTION'; actionId: string }
  | { type: 'ABANDON' };
