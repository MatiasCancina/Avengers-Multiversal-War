import { PageState } from '../../../../core/models/page-state.interface';
import { HeroRosterApi, RosterHero } from './hero-roster-api.interface';
import { HeroRosterRoleEnum } from './hero-roster-role.enum';

export interface HeroRosterViewModel extends PageState {
  data: HeroRosterApi | null;
  comparisonHeroes: RosterHero[];
  searchTerm: string;
  roleFilter: HeroRosterRoleEnum;
  lang: 'es' | 'en';
}
