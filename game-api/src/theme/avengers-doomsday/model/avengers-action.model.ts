import { AvengersStrategy } from './avengers-strategy.enum';

export type AvengersAction =
  | { id: string; type: 'BASIC_ATTACK'; actorId: string; targetId: string; apCost: 0 }
  | {
      id: string;
      type: 'OFFENSIVE_SPECIAL';
      actorId: string;
      targetId: 'OPPONENT_TEAM' | 'DOOM';
      apCost: number;
    }
  | { id: string; type: 'SUPPORT_SPECIAL'; actorId: string; targetId: 'OWN_TEAM'; apCost: number }
  | {
      id: string;
      type: 'SUE_STORM_APPEAL';
      actorId: 'invisible-woman';
      targetId: 'DOOM';
      apCost: 0;
    }
  | { id: string; type: 'LEADER_ABILITY'; actorId: string; targetId: string; apCost: 0 }
  | { id: string; type: 'TEAM_ACTION'; targetId: string; roleCombination: string; apCost: 0 }
  | { id: string; type: 'POWER_UP'; itemId: string; targetId: string; apCost: 0 }
  | { id: string; type: 'CHANGE_STRATEGY'; strategy: AvengersStrategy; apCost: 0 }
  | { id: string; type: 'SWAP'; outgoingId: string; incomingId: string; apCost: 0 };
