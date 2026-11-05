import { Injectable } from '@nestjs/common';
import { AVENGERS_HEROES, AVENGERS_TEAMS } from './content/sample-catalog';
import { AvengersTeamDefinition } from './model/avengers-team-definition.model';
import { HeroDefinition } from './model/hero-definition.model';
import { AvengersRuleError } from './error/avengers-rule.error';
import { AvengersBattleContent } from './model/avengers-turn-data.model';

@Injectable()
export class AvengersCatalog {
  hero(id: string, content?: AvengersBattleContent): HeroDefinition {
    const hero = content?.heroes[id] ?? AVENGERS_HEROES.find((value) => value.id === id);
    if (!hero) {
      throw new AvengersRuleError('UNKNOWN_HERO', `Unknown hero: ${id}.`);
    }
    return structuredClone(hero);
  }

  team(id: string, content?: AvengersBattleContent): AvengersTeamDefinition {
    const team = content?.teams[id] ?? AVENGERS_TEAMS.find((value) => value.id === id);
    if (!team) {
      throw new AvengersRuleError('UNKNOWN_TEAM', `Unknown Avengers team: ${id}.`);
    }
    return structuredClone(team);
  }

  heroes(): HeroDefinition[] {
    return structuredClone(AVENGERS_HEROES);
  }

  teams(): AvengersTeamDefinition[] {
    return structuredClone(AVENGERS_TEAMS);
  }
}
