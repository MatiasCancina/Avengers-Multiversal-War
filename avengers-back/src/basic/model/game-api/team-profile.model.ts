export interface TeamProfileApi {
  id: string;
  name: string;
  description: string;
}
export interface AssignedTeamApi {
  id: string;
  name: string;
  leaderId: string;
  visualKey?: string;
}
