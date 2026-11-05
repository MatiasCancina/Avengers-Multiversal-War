import { HeroApi, RelationshipApi } from '../../../basic/model/game-api/hero-catalog.model';

export interface HeroRosterItemModel extends HeroApi {
  selected: boolean;
  leader: boolean;
  active: boolean;
}

export interface HeroRosterModel {
  configuredTeamId: string;
  configuredHeroIds: string[];
  heroes: HeroRosterItemModel[];
  totalHeroes: number;
  visibleHeroes: number;
  appliedFilters: { searchTerm: string; role: string };
  configuredRelationships: RelationshipApi[];
  roleCoverage: Record<string, number>;
}
