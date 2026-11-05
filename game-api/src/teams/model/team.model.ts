import { TeamMember } from './team-member.model';
import { TeamProfile } from './team-profile.interface';

export interface Team<TStats> extends TeamProfile {
  members: TeamMember<TStats>[];
}
