import {
  JourneyFinalistsApi,
  KnockoutStageCode,
  NextStageCode,
} from '../../../basic/model/game-api/journey-stages.model';

export interface KnockoutTeamModel {
  teamId: string;
  name: string;
  damageDealt: number | null;
}

export interface KnockoutMatchModel {
  slot: number;
  encounterId: string;
  teamA: KnockoutTeamModel;
  teamB: KnockoutTeamModel;
  winnerTeamId: string | null;
  pending: boolean;
  involvesPlayer: boolean;
  nextStageCode: NextStageCode;
  nextSlot: number;
}

export interface KnockoutRoundModel {
  stageCode: KnockoutStageCode;
  matches: KnockoutMatchModel[];
}

export interface KnockoutStageModel {
  attemptId: string;
  playerTeamId: string;
  rounds: KnockoutRoundModel[];
  finalists: JourneyFinalistsApi;
}
