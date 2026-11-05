import { TeamMemberStatus } from './team-member-status.enum';

export interface TeamMember<TStats> {
  id: string;
  teamId: string;
  name: string;
  status: TeamMemberStatus;
  stats: TStats;
}
