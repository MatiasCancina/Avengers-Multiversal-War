/** Neutral sample types; no concrete game statistics or actions are defined. */
export interface SampleStatistic {
  id: string;
  label: string;
  value: number;
}

export interface SampleTurnParticipant {
  referenceId: string;
  name: string;
  statistics: SampleStatistic[];
}

export interface SampleAvailableAction {
  id: string;
  label: string;
}

export interface SampleTurnEvent {
  id: string;
  turn: number;
  message: string;
}

export interface SampleTurnData {
  participants: SampleTurnParticipant[];
  availableActions: SampleAvailableAction[];
  events: SampleTurnEvent[];
}
