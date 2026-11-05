export interface HeroApi {
  id: string;
  displayName: string;
  archetype: string;
  eligibility: 'PREFERRED' | 'ELIGIBLE' | 'COMPANION_ONLY';
  stats: { power: number; agility: number; resistance: number; ability: number };
  maxima: { energy: number; abilityPoints: number };
  roles: { primary: string; secondary: string };
  abilities: { offensive: AbilityApi; support: AbilityApi; leader: AbilityApi | null };
  leaderProfile: string | null;
  biography: string;
  tournamentMotivation: string;
  allies: string[];
  rivals: string[];
}
export interface AbilityApi {
  id: string;
  name: string;
  description?: string;
  apCost?: number;
  effect?: string;
  targetScope?: string;
  multiplier?: number;
  potency?: number;
}
export interface HeroCatalogApi {
  count: number;
  heroes: HeroApi[];
}
export interface RelationshipApi {
  heroAId: string;
  heroBId: string;
  relationship: 'ALLY' | 'NORMAL' | 'RIVAL';
}
export interface RelationshipCatalogApi {
  heroIds: string[];
  relationships: RelationshipApi[];
}
