export interface AwardWinnerModel {
  teamId: string;
  heroId: string;
  heroName: string;
  isPlayerTeam: boolean;
}

export interface AwardModel {
  code: string;
  label: string;
  explanation: string;
  reason: string;
  metricCode: string | null;
  value: number | null;
  winner: AwardWinnerModel | null;
}

export interface AwardsModel {
  attemptId: string;
  outcomeCode: string;
  awards: AwardModel[];
}
