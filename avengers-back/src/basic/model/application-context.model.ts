import { CurrentJourneyApi } from './game-api/journey.model';
import { AssignedTeamApi, TeamProfileApi } from './game-api/team-profile.model';

export interface ApplicationContextModel {
  teamId: string;
  language: 'en' | 'es';
  profile: TeamProfileApi;
  assignedTeam: AssignedTeamApi;
  currentJourney: CurrentJourneyApi['attempt'];
}
