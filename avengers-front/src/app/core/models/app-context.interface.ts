export interface AppContext {
  teamId: string;
  language: 'en' | 'es';
  profile: { id: string; name: string; description: string };
  assignedTeam: { id: string; name: string; leaderId: string; visualKey: string };
  currentJourney: { id: string; status: string } | null;
}
