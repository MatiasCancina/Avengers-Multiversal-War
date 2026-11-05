import { TeamProfile } from '../../teams/model/team-profile.interface';

export interface Theme {
  id: string;
  name: string;
  teams: readonly TeamProfile[];
}
