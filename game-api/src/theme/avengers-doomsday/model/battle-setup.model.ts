import { AvengersStrategy } from './avengers-strategy.enum';
import { PowerUpItem } from './power-up.model';

export interface TeamSetup {
  teamId: string;
  activeHeroIds: [string, string];
  benchHeroIds: [string, string, string];
  strategy: AvengersStrategy;
  resources?: Record<string, { energy: number; abilityPoints: number }>;
}

export interface BattleSetup {
  player: TeamSetup;
  opponent: TeamSetup;
  inventory: PowerUpItem[];
  seed: number;
}
