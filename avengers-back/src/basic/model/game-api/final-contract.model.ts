import { CombatStrategy } from './team-configuration.model';

export interface FinalHeroApi {
  id: string;
  displayName: string;
  eligibility: { code: string; label?: string; description?: string };
  stats: { power: number; agility: number; resistance: number; ability: number };
  resources: { maximumEnergy: number; maximumAbilityPoints: number };
  roles: {
    primary: { code: string; label?: string; description?: string };
    secondary: { code: string; label?: string; description?: string };
  };
  abilities: {
    basicAttack: FinalAbilityApi;
    offensiveSpecial: FinalAbilityApi;
    supportSpecial: FinalAbilityApi;
    leaderAbility: FinalAbilityApi | null;
  };
  leaderProfileCode: CombatStrategy | null;
  biography: string;
  tournamentMotivation: string;
}

export interface FinalAbilityApi {
  id: string;
  name: string;
  description: string;
  abilityPointCost?: number;
  effectCode?: string;
  targetScope: string;
}

export interface FinalHeroCatalogApi {
  language: string;
  count: number;
  heroes: FinalHeroApi[];
}

export interface FinalRelationshipApi {
  heroAId: string;
  heroBId: string;
  relationshipCode: 'ALLY' | 'NORMAL' | 'RIVAL';
}

export interface FinalRelationshipCatalogApi {
  heroIds: string[];
  relationships: FinalRelationshipApi[];
}

export interface FinalAssignedTeamApi {
  id: string;
  name: string;
  description: string;
  leaderId: string;
}

export interface FinalAssignedTeamCatalogApi {
  language: string;
  teams: FinalAssignedTeamApi[];
}

export interface FinalStrategyApi {
  code: CombatStrategy;
  label: string;
  description: string;
}

export interface FinalStrategyCatalogApi {
  language: string;
  strategies: FinalStrategyApi[];
  compatibility: Record<string, string>;
}

export interface FinalCurrentAttemptApi {
  attemptId: string;
  status: string;
  stageCount: number;
  encounterCount: number;
}

export interface FinalCurrentJourneyApi {
  teamId: string;
  attempt: FinalCurrentAttemptApi | null;
  summary: FinalJourneySummaryApi | null;
}

export interface FinalTeamConfigurationApi {
  leaderId: string;
  companionIds: string[];
  activeHeroIds: string[];
  inactiveHeroIds: string[];
  strategyCode: CombatStrategy;
}

export interface FinalTeamConfigurationDataApi {
  teamId: string;
  configured: boolean;
  configuration: FinalTeamConfigurationApi | null;
  currentAttempt: FinalCurrentAttemptApi | null;
  editability: { members: boolean; formation: boolean; strategy: boolean };
}

export interface FinalSaveConfigurationApi {
  teamId: string;
  configuration: FinalTeamConfigurationApi;
  journeyReplaced: boolean;
  currentAttempt: FinalCurrentAttemptApi | null;
}

export interface FinalSimulateJourneyApi {
  attemptId: string;
  teamId: string;
  status: string;
  spendingStrategyCode: 'SAVE' | 'BALANCED' | 'AGGRESSIVE';
  playerQualified: boolean;
  finalists: { playerTeamId: string; opponentTeamId: string };
  summary: {
    stagesCompleted: number;
    encountersSimulated: number;
    playerRewardPointsRemaining: number;
  };
  replacedPrevious: boolean;
}

export interface FinalJourneySummaryApi {
  attemptId: string;
  teamId: string;
  status: string;
  spendingStrategyCode: 'SAVE' | 'BALANCED' | 'AGGRESSIVE';
  configuration: FinalTeamConfigurationApi;
  finalists: { playerTeamId: string; opponentTeamId: string };
  completionOutcome?: 'VICTORY' | 'DEFEAT' | 'ABANDON' | null;
  endingCode?: string | null;
  terminalReasonCode?: string | null;
  createdAt: string;
  completedAt: string | null;
  progress: { stagesCompleted: number; encountersPlayedByPlayer: number; finalStageStatus: string };
}

export interface FinalHistoryItemApi {
  attemptId: string;
  status: 'COMPLETED';
  createdAt: string;
  completedAt: string;
  spendingStrategyCode: 'SAVE' | 'BALANCED' | 'AGGRESSIVE';
  outcomeCode: string;
  opponentFinalistId: string;
  opponentFinalistName: string;
  endingCode: string;
  terminalReasonCode: string | null;
  endingSummary: string;
}

export interface FinalHistoryApi {
  teamId: string;
  language: string;
  items: FinalHistoryItemApi[];
}

export interface FinalJourneyTeamsApi {
  attemptId: string;
  teams: FinalJourneyTeamApi[];
  finalists: {
    playerTeamId: string;
    opponentTeamId: string;
  };
}

export interface FinalJourneyTeamApi {
  teamId: string;
  name: string;
  leaderId: string;
  heroIds: string[];
  strategyCode: string;
  heroes?: Array<{
    heroId: string;
    currentEnergy: number;
    currentAbilityPoints: number;
    status: string;
    knockedOut: boolean;
  }>;
}

export interface FinalStageTeamsStatusApi {
  variant: string;
  attemptId: string;
  player: FinalStageStatusTeamApi;
  opponent: FinalStageStatusTeamApi;
}

export interface FinalStageStatusTeamApi {
  teamId: string;
  leaderId: string;
  strategyCode: string;
  heroes: Array<{
    heroId: string;
    status: string;
    condition: string;
    maximumEnergy: number;
    currentEnergy: number;
    maximumAbilityPoints: number;
    currentAbilityPoints: number;
    returnAtTurn: number;
  }>;
  vacantActiveHeroIds: string[];
  synergyCode: string;
  teamActionsRemaining: number;
  leaderAbilityUsesRemaining: number;
  strategyChangesRemaining: number;
}

//estado completo de la final segun la API. Se transforma en FinalBattleStatusModel para el front

export interface FinalStageStateApi {
  variant: string;
  attemptId: string;
  status: 'READY' | 'ACTIVE' | 'COMPLETED';
  phase: string;
  phaseLabel: string;
  normalTurn: number;
  turnState: string;
  participants: { playerTeamId: string; opponentTeamId: string };
  completion: {
    outcomeCode: string;
    endingCode?: string;
    terminalReasonCode: string;
    endingEventSequences: number[];
  } | null;
}

//UNA line dentro de narrative dentro de events
export interface FinalStageNarrativeLineApi {
  type: string;
  speakerId: string | null;
  text: string;
  lineSequence: number;
}

//event individual recibido desde la API. Se transforma en LiveEventModel para el front
export interface FinalStageEventApi {
  sequence: number;
  turn: number;
  phase: string;
  eventCode: string;
  messageCode: string;
  values?: Record<string, unknown>; //las claves cambian segun el eventCode
  narrative: { lines: FinalStageNarrativeLineApi[] };
}

//coleccion de events recibidos desde la API para la lista de events
export interface FinalStageEventsApi {
  attemptId: string;
  language: string;
  events: FinalStageEventApi[];
}

//heroe individual recibido de la API de la final
export interface FinalStageHeroApi {
  heroId: string;
  status: string;
  condition: string;
  maximumEnergy: number;
  currentEnergy: number;
  maximumAbilityPoints: number;
  currentAbilityPoints: number;
  returnAtTurn: number;
}

//equipo individual recibido de la API de la final
export interface FinalStageSideApi {
  teamId: string;
  leaderId: string;
  strategyCode: string;
  heroes: FinalStageHeroApi[];
  vacantActiveHeroIds: string[];
  synergyCode: string;
  teamActionsRemaining: number;
  leaderAbilityUsesRemaining: number;
  strategyChangesRemaining: number;
}

// respuesta de la API de ambos equipos de la final
export interface FinalStageTeamsApi {
  variant: string;
  attemptId: string;
  player: FinalStageSideApi;
  opponent: FinalStageSideApi;
  doom?: FinalStageDoomApi;
}

export interface FinalStageDoomApi {
  narrativeCharacterId: string;
  maximumEnergy: number;
  currentEnergy: number;
  threatLevelCode: string;
}

//action individual recibida de la API de actions
export interface FinalStageActionApi {
  actionId: string;
  actionCode: string;
  label: string;
  description: string;
  actorHeroId?: string;
  abilityId?: string;
  itemId?: string;
  roleCombination?: string;
  strategyCode?: string;
  outgoingHeroId?: string;
  incomingHeroId?: string;
  target: {
    targetType: string;
    targetId: string;
    sideCode: string;
  } | null;
  cost: { abilityPoints: number };
}

//coleccion de actions recibidas de la API de actions
export interface FinalStageActionsApi {
  attemptId: string;
  phase: string;
  normalTurn: number;
  language: string;
  actions: FinalStageActionApi[];
}

export interface FinalCurrentEncountersApi {
  attemptId: string;
  encounters: FinalEncounterApi[];
}

export interface FinalEncounterApi {
  encounterId: string;
  stageId: string;
  stageCode: string;
  groupId: string | null;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string | null;
  resolutionCode: string;
  rivalEncounter: boolean;
  results: FinalEncounterResultApi[];
  damageByTeam: FinalEncounterDamageApi[];
}

export interface FinalEncounterResultApi {
  teamId: string;
  resultCode: string;
}

export interface FinalEncounterDamageApi {
  teamId: string;
  damageDealt: number;
}

export interface FinalEncounterDetailApi extends FinalEncounterApi {
  rounds: FinalEncounterRoundApi[];
  extraRound: FinalEncounterRoundApi | null;
}

export interface FinalEncounterRoundApi {
  number: number;
  roundType: 'NORMAL' | 'EXTRA_ROUND';
  initiativeTeamId: string;
  winnerTeamId: string | null;
  damageByTeam: FinalEncounterDamageApi[];
  activeHeroIdsByTeam: FinalEncounterActiveHeroesApi[];
  events: FinalEncounterEventApi[];
}

export interface FinalEncounterActiveHeroesApi {
  teamId: string;
  heroIds: string[];
}

export interface FinalEncounterEventApi {
  sequence: number;
  eventCode: string;
  stageCode: string | null;
  encounterId: string | null;
  round: number | null;
  teamId: string | null;
  actorHeroId: string | null;
  targetHeroIds: string[];
  messageCode: string;
  values: {
    amount?: number;
  };
  narrative: FinalEncounterNarrativeApi | null;
}

export interface FinalEncounterNarrativeApi {
  lines: FinalEncounterNarrativeLineApi[];
}

export interface FinalEncounterNarrativeLineApi {
  lineSequence: number;
  type: string;
  speakerId: string | null;
  text: string;
}

//item del inventario del Team en el Journey actual
export interface FinalInventoryItemApi {
  itemId: string;
  quantity: number;
  legalUseContexts: string[];
}

export interface FinalInventoryApi {
  attemptId: string;
  teamId: string;
  items: FinalInventoryItemApi[];
}

//definicion de un Power-Up del catalogo
export interface FinalPowerUpApi {
  id: string;
  name: string;
  description: string;
  categoryCode: string;
  price: number;
  targetScope: 'HERO' | 'TEAM';
  useContexts: string[];
  effect: { effectCode: string };
}

export interface FinalPowerUpCatalogApi {
  language: string;
  powerUps: FinalPowerUpApi[];
}

//body que se envia a la Game API para START, CHOOSE_ACTION o ABANDON
export interface FinalStagePlayBodyApi {
  type: 'START' | 'CHOOSE_ACTION' | 'ABANDON';
  actionId?: string;
}

//resultado de la Game API despues de una operacion de play
export interface FinalStagePlayResultApi {
  phase: string;
  normalTurn: number;
  status: 'READY' | 'ACTIVE' | 'COMPLETED';
  completionOutcome: string | null;
  terminalReasonCode: string | null;
  nextDecisionRequired: boolean;
}
