import { StatName } from './hero-stats.model';

export interface CombatEffect {
  id: string;
  stat: StatName;
  modifier: number;
  expiresAfterTurn: number;
  source: 'SPECIAL' | 'LEADER' | 'POWER_UP' | 'RIVALRY' | 'DOOM';
  heroIds?: string[];
}
