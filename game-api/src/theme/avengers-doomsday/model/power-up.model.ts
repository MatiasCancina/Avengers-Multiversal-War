import { StatName } from './hero-stats.model';

export type PowerUpEffect =
  | { type: 'ENERGY'; percent: number }
  | { type: 'AP'; amount: number }
  | { type: 'AP_PERCENT'; percent: number }
  | { type: 'FULL_AP' }
  | { type: 'BOOST'; stat: StatName; percent: number; duration: number }
  | { type: 'REVIVE' }
  | { type: 'EXTRA_TEAM_ACTION' }
  | { type: 'EXTRA_LEADER_ABILITY' };

export interface PowerUpItem {
  id: string;
  name: string;
  target: 'HERO' | 'TEAM';
  effect: PowerUpEffect;
  quantity: number;
}
