import { AvengersStrategy } from './avengers-strategy.enum';
import { HeroCombatState } from './hero-combat-state.model';
import { CombatEffect } from './combat-effect.model';
import { Synergy } from './synergy.model';

export interface AvengersTeamState {
  teamId: string;
  leaderId: string;
  leaderProfile: AvengersStrategy;
  strategy: AvengersStrategy;
  heroes: HeroCombatState[];
  vacantActiveHeroIds: string[];
  synergy: Synergy;
  effects: CombatEffect[];
  strategyChangesRemaining: number;
  strategyChangeAtTurn: number;
  teamActionsRemaining: number;
  leaderAbilityUsesRemaining: number;
}
