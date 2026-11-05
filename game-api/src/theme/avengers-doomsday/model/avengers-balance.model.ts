import { AvengersStrategy } from './avengers-strategy.enum';
import { SynergyLevel } from './synergy-level.enum';
import { BossThreatLevel } from './boss-threat-level.enum';
import { HeroStats } from './hero-stats.model';

export interface AvengersBalance {
  baseAttackDamage: number;
  basicAttackApRecovery: number;
  swapCooldown: number;
  maxTeamActions: number;
  maxLeaderUses: number;
  maxStrategyChanges: number;
  strategyCooldown: number;
  doomMaxEnergy: number;
  reviveEnergyPercent: number;
  reviveApPercent: number;
  doomThresholds: [number, number, number];
  doomScaling: Record<BossThreatLevel, number>;
  doomProbability: Record<BossThreatLevel, number>;
  hitBase: number;
  hitMinimum: number;
  hitMaximum: number;
  resistanceMitigation: number;
  randomVariation: number;
  specialMultiplier: number;
  specialTeamMultiplier: number;
  teamActionMultiplier: number;
  rivalryModifier: number;
  roleCoverageBonus: number;
  finalAttackBaseChance: number;
  synergyModifiers: Record<SynergyLevel, number>;
  strategyModifiers: Record<AvengersStrategy, HeroStats>;
  leaderCompatibility: Record<'HIGH' | 'MEDIUM' | 'LOW', number>;
  excellentTeamActionBonus: number;
  teamRoleCoverageBonus: number;
}
