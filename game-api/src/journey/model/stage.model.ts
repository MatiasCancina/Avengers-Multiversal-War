import { Encounter } from './encounter.model';

export interface Stage {
  id: string;
  name: string;
  encounters: Encounter[];
}
