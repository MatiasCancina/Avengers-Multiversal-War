export type FinalBattleStatus = 'READY' | 'ACTIVE' | 'COMPLETED';

export interface FinalBattleStateModel {
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

export interface FinalBattleHeroModel {
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

export interface FinalBattleSideModel {
  teamId: string;
  leaderId: string;
  strategyCode: string;
  heroes: FinalBattleHeroModel[];
  vacantActiveHeroIds: string[];
  synergyCode: string;
  teamActionsRemaining: number;
  leaderAbilityUsesRemaining: number;
  strategyChangesRemaining: number;
}

export interface FinalBattleTeamsModel {
  player: FinalBattleSideModel;
  opponent: FinalBattleSideModel;
}

export interface FinalBattleDoomModel {
  narrativeCharacterId: string;
  maximumEnergy: number;
  currentEnergy: number;
  threatLevelCode: string;
}

export interface FinalBattleTargetModel {
  targetType: string;
  targetId: string;
  targetName?: string; //solo si targetType es HERO
  sideCode: string;
}

export interface FinalBattleActionOptionModel {
  actionId: string; //exacto como lo publica la API
  description: string;
  target: FinalBattleTargetModel | null;
  strategyCode?: string;
  outgoingHeroId?: string;
  outgoingHeroName?: string;
  incomingHeroId?: string;
  incomingHeroName?: string;
}

export interface FinalBattleAbilityModel {
  groupKey: string; //solo clave de lista en pantalla, nunca se envia a la Game API
  actionCode: string;
  label: string;
  description?: string; //la de la primera opcion, cada opcion trae la suya
  abilityId?: string;
  itemId?: string; //solo en POWER_UP, vincula el grupo con su item del inventario
  roleCombination?: string;
  abilityPointCost: number;
  options: FinalBattleActionOptionModel[];
}

export interface FinalBattleHeroActionsModel {
  actorHeroId: string;
  actorHeroName: string;
  abilities: FinalBattleAbilityModel[];
}

export interface FinalBattleModel {
  state: FinalBattleStateModel;
  teams: FinalBattleTeamsModel | null;
  doom: FinalBattleDoomModel | null;
  heroActions: FinalBattleHeroActionsModel[];
  teamActions: FinalBattleAbilityModel[];
  inventory: FinalBattleInventoryItemModel[];
}

export interface FinalBattleInventoryItemModel {
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  targetScope: 'HERO' | 'TEAM';
  effectCode: string;
}

export interface FinalBattlePlayResultModel {
  status: FinalBattleStatus;
  phase: string;
  normalTurn: number;
  completionOutcome: string | null;
  terminalReasonCode: string | null;
  nextDecisionRequired: boolean;
}
