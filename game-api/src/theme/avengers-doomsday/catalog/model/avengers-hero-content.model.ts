import { AvengersStrategy } from '../../model/avengers-strategy.enum';
import { LeaderAbility } from '../../model/hero-ability.model';
import { HeroDefinition } from '../../model/hero-definition.model';

export type LeaderEligibility = 'PREFERRED' | 'ELIGIBLE' | 'COMPANION_ONLY';
export type AvengersHeroArchetype =
  | 'BRUISER'
  | 'SKIRMISHER'
  | 'TACTICIAN'
  | 'MYSTIC'
  | 'GUARDIAN'
  | 'BLASTER';

export interface LocalizedText {
  en: string;
  es: string;
}

export interface AvengersLeadershipContent {
  profile: AvengersStrategy;
  ability: LeaderAbility;
  revealReaction?: LocalizedText;
}

export interface AvengersHeroContent extends HeroDefinition {
  themeId: 'avengers-doomsday';
  displayName: string;
  eligibility: LeaderEligibility;
  archetype: AvengersHeroArchetype;
  portrait: string;
  portraitFallback: string;
  biography: LocalizedText;
  tournamentMotivation: LocalizedText;
  leadership: AvengersLeadershipContent | null;
  contentVersion: string;
}

export interface AvengersNarrativeCharacterContent {
  id: 'silver-surfer' | 'doctor-doom' | 'dormammu';
  themeId: 'avengers-doomsday';
  displayName: string;
  role: 'apparent-organizer' | 'final-boss' | 'apparent-threat';
  portrait: string;
  portraitFallback: string;
  description: LocalizedText;
  contentVersion: string;
}
