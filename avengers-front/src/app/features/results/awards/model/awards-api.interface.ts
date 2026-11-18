export interface AwardWinnerApi {
    teamId: string;
    heroId: string;
    heroName: string;
    isPlayerTeam: boolean;
}

export interface AwardApi {
    code: string;
    label: string;
    explanation: string;
    reason: string;
    metricCode: string | null;
    value: number | null;
    winner: AwardWinnerApi | null;
}

export interface AwardsApi {
    attemptId: string;
    outcomeCode: string;
    awards: AwardApi[];
}