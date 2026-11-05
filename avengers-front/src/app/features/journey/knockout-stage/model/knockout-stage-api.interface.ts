export type KnockoutStageCode = 'ROUND_OF_16' | 'QUARTERFINAL' | 'SEMIFINAL';
export type NextStageCode = 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL_STAGE';

export interface KnockoutTeam {
  teamId: string;
  name: string;
  damageDealt: number | null;
}

export interface KnockoutMatch {
  slot: number;
  encounterId: string;
  teamA: KnockoutTeam;
  teamB: KnockoutTeam;
  winnerTeamId: string | null;
  pending: boolean;
  involvesPlayer: boolean;
  nextStageCode: NextStageCode;
  nextSlot: number;
}

export interface KnockoutRound {
  stageCode: KnockoutStageCode;
  matches: KnockoutMatch[];
}

export interface KnockoutFinalists {
  playerTeamId: string;
  opponentTeamId: string;
}

export interface KnockoutStageApi {
  attemptId: string;
  playerTeamId: string;
  rounds: KnockoutRound[];
  finalists: KnockoutFinalists;
}
