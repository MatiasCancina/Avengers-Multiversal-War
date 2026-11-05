import { HeroRole } from './hero-role.enum';
import { HeroStats } from './hero-stats.model';
import { BasicAttackAbility, OffensiveAbility } from './hero-ability.model';
import { SupportAbility } from './hero-ability.model';

export interface HeroDefinition {
  id: string;
  name: string;
  stats: HeroStats;
  primaryRole: HeroRole;
  secondaryRole: HeroRole;
  maxEnergy: number;
  maxAbilityPoints: number;
  allies: string[];
  rivals: string[];
  basicAttack?: BasicAttackAbility;
  offensiveAbility: OffensiveAbility;
  supportAbility: SupportAbility;
}
