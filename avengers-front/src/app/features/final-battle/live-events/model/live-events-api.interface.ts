export type FinalBattleStatus = 'READY' | 'ACTIVE' | 'COMPLETED';

export interface FinalBattleStatusApi {
    status: FinalBattleStatus;
    phase: string;
    phaseLabel: string;
    normalTurn: number;
    turnState: string;
    playerTeamId: string;
    opponentTeamId: string;
    outcomeCode: string | null;
    terminalReasonCode: string | null;
}

export interface LiveEventLineApi {
    type: string;
    speakerId: string | null;
    speakerName: string | null;
    text: string;
    lineSequence: number;
}

export interface LiveEventApi {
    sequence: number;
    turn: number;
    phase: string;
    eventCode: string;
    lines: LiveEventLineApi[];
    actorHeroId?: string;
    actorHeroName?: string;
    targetHeroIds?: string[];
    targetHeroNames?: string[];
    damage?: number;
    apChange?: number;
}

export interface LiveEventsApi {
    battle: FinalBattleStatusApi;
    events: LiveEventApi[];
}