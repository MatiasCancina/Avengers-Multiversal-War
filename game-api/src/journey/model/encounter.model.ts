import { EncounterParticipant } from './encounter-participant.model';

export interface Encounter {
  id: string;
  name: string;
  participants: EncounterParticipant[];
}
