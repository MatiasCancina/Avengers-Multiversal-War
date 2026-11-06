export type CombatStrategy = 'AGGRESSIVE' | 'DEFENSIVE' | 'BALANCED' | 'PRAGMATIC';
export interface TeamConfigurationApi {
  leaderId: string;
  companionIds: string[];
  activeHeroIds: string[];
  strategy: CombatStrategy;
  visualKey?: string;
}
export interface TeamConfigurationReadApi {
  teamId: string;
  configuration: TeamConfigurationApi;
  currentAttempt: { attemptId: string; status: string } | null;
  editability: { members: boolean; formation: boolean; strategy: boolean };
}
export interface StrategyCatalogApi {
  strategies: Array<{ id: CombatStrategy; label?: string; description: string }>;
  compatibility: Record<string, string>;
}
export interface SaveConfigurationApi {
  teamId: string;
  configuration: TeamConfigurationApi;
  journeyReplaced: boolean;
  currentAttemptId: string | null;
}
export interface SaveConfigurationBody {
  companionIds: string[];
  activeHeroIds: string[];
  strategy: CombatStrategy;
}
