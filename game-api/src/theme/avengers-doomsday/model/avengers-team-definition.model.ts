import { AvengersStrategy } from './avengers-strategy.enum';
import { LeaderAbility } from './hero-ability.model';

export interface AvengersTeamDefinition {
  id: string;
  name: string;
  leaderId: string;
  leaderProfile: AvengersStrategy;
  leaderAbility: LeaderAbility;
}
