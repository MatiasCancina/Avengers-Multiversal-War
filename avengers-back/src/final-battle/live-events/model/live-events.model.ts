export type FinalBattleStatus = "READY" | "ACTIVE" | "COMPLETED";

export interface FinalBattleStatusModel {
    status: FinalBattleStatus;
    phase: string
    phaseLabel: string
    normalTurn: number
    turnState: string
    playerTeamId: string
    opponentTeamId: string
    //completion aplanado en outcomeCode y terminalReasonCode para que el front no navegue a un objeto anidado 
    outcomeCode: string | null
    terminalReasonCode: string | null
}

export interface LiveEventLineModel {
    type: string
    speakerId: string | null
    speakerName: string | null
    text: string
    lineSequence: number
}

export interface LiveEventModel {
    sequence: number;
    turn: number;
    phase: string;
    eventCode: string;
    lines: LiveEventLineModel[];
    actorHeroId?: string;
    actorHeroName?: string;
    targetHeroIds?: string[];
    targetHeroNames?: string[];
    damage?: number;
    apChange?: number;
}

export interface LiveEventsModel {
    battle: FinalBattleStatusModel
    events: LiveEventModel[]
}