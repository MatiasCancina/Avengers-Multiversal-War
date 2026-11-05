import { CombatSide } from './combat-side.model';
import { AvengersFinalStagePhase } from './avengers-final-stage-phase.enum';
import { CombatEffect } from './combat-effect.model';

export type AvengersEventType =
  | 'INITIALIZED'
  | 'ACTION'
  | 'ATTACK_HIT'
  | 'ATTACK_MISS'
  | 'DAMAGE'
  | 'HEAL'
  | 'AP_CHANGE'
  | 'KO'
  | 'REVIVE'
  | 'EFFECT'
  | 'EFFECT_EXPIRED'
  | 'CLEANSE'
  | 'SWAP'
  | 'FORMATION_RESTORED'
  | 'STRATEGY_CHANGE'
  | 'RIVALRY'
  | 'DOOM_INTERVENTION'
  | 'DOOM_THREAT'
  | 'POWER_UP'
  | 'FINAL_ATTACK'
  | 'FINAL_RESPONSE'
  | 'VICTORY'
  | 'DEFEAT'
  | 'ABANDON'
  | 'TOURNAMENT_FINAL_STARTED'
  | 'SURFER_ENOUGH'
  | 'DOOM_REVEALED'
  | 'DOOM_EXPLANATION'
  | 'PLAYER_REJECTION'
  | 'OPPONENT_ALLIANCE'
  | 'DOOMSDAY_BEGINS'
  | 'EARLY_DEFEAT_REVEAL'
  | 'DOOM_ALONE'
  | 'PRE_REVEAL_ABANDON'
  | 'POST_REVEAL_ABANDON'
  | 'EARLY_DEFEAT_SCENE'
  | 'SUE_STORM_APPEAL';

export interface AvengersEvent {
  id: string;
  type: AvengersEventType;
  turn: number;
  order: number;
  phase: AvengersFinalStagePhase;
  source: CombatSide;
  actorId: string | null;
  targetIds: string[];
  targetSide: CombatSide;
  values: Record<string, number>;
  effect: CombatEffect | null;
  narrativeCode: AvengersEventType;
  parameters: Record<string, string | number>;
  variant: number;
}

export interface EventInput {
  type: AvengersEventType;
  source: CombatSide;
  actorId?: string;
  targetIds?: string[];
  values?: Record<string, number>;
  targetSide?: CombatSide;
  parameters?: Record<string, string | number>;
  effect?: CombatEffect;
  variant?: number;
}
