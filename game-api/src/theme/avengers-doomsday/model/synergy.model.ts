import { SynergyLevel } from './synergy-level.enum';

export interface Synergy {
  value: number;
  level: SynergyLevel;
  statModifier: number;
  teamActionBonus: number;
}
