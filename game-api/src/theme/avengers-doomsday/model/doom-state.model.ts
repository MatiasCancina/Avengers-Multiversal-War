import { BossThreatLevel } from './boss-threat-level.enum';

export interface DoomState {
  maxEnergy: number;
  currentEnergy: number;
  threatLevel: BossThreatLevel;
}
