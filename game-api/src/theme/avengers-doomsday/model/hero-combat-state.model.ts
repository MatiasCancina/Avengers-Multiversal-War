import { TeamMemberStatus } from '../../../teams/model/team-member-status.enum';
import { HeroStats } from './hero-stats.model';

export interface HeroCombatState {
  heroId: string;
  status: TeamMemberStatus;
  condition: 'AVAILABLE' | 'KNOCKED_OUT';
  maxEnergy: number;
  currentEnergy: number;
  maxAbilityPoints: number;
  currentAbilityPoints: number;
  returnAtTurn: number;
  /** Attempt-local base stats after permanent Journey progression. */
  baseStats?: HeroStats;
}
