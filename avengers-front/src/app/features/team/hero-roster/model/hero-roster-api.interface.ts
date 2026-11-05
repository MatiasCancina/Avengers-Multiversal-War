import { HeroRosterRoleEnum } from './hero-roster-role.enum';

export interface RosterAbility {
  id: string;
  name: string;
  description?: string;
  apCost?: number;
  effect?: string;
  targetScope?: string;
  multiplier?: number;
  potency?: number;
}
export interface RosterHero {
  id: string;
  displayName: string;
  portrait: string | null;
  portraitFallback: string;
  archetype: string;
  eligibility: string;
  stats: { power: number; agility: number; resistance: number; ability: number };
  maxima: { energy: number; abilityPoints: number };
  roles: { primary: string; secondary: string };
  abilities: { offensive: RosterAbility; support: RosterAbility; leader: RosterAbility | null };
  leaderProfile: string | null;
  biography: string;
  tournamentMotivation: string;
  allies: string[];
  rivals: string[];
  selected: boolean;
  leader: boolean;
  active: boolean;
}

export interface HeroRosterApi {
  configuredTeamId: string;
  configuredHeroIds: string[];
  heroes: RosterHero[];
  totalHeroes: number;
  visibleHeroes: number;
  appliedFilters: { searchTerm: string; role: HeroRosterRoleEnum };
  configuredRelationships: Array<{ heroAId: string; heroBId: string; relationship: string }>;
  roleCoverage: Record<string, number>;
}
