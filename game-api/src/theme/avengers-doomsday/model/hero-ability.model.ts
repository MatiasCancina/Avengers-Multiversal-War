export interface LocalizedAbilityContent {
  en: string;
  es: string;
}

export interface BasicAttackAbility {
  localizedName?: LocalizedAbilityContent;
  description?: LocalizedAbilityContent;
}

export interface OffensiveAbility {
  localizedName?: LocalizedAbilityContent;
  description?: LocalizedAbilityContent;
  id: string;
  name: string;
  apCost: number;
  multiplier: number;
}

export interface SupportAbility {
  localizedName?: LocalizedAbilityContent;
  description?: LocalizedAbilityContent;
  id: string;
  name: string;
  apCost: number;
  effect: SupportEffect;
  potency: number;
}

export interface LeaderAbility {
  localizedName?: LocalizedAbilityContent;
  description?: LocalizedAbilityContent;
  id: string;
  name: string;
  effect: 'STRIKE' | 'HEAL' | 'PROTECT' | 'DISRUPT';
  potency: number;
}

export type SupportEffect = 'HEAL' | 'POWER' | 'RESISTANCE' | 'AGILITY' | 'CLEANSE';
