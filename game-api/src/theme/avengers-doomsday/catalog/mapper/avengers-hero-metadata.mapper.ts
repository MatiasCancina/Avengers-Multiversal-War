import { Injectable } from '@nestjs/common';
import { AvengersHeroEntity } from '../entity/avengers-hero.entity';
import { AvengersNarrativeCharacterEntity } from '../entity/avengers-narrative-character.entity';
import {
  AvengersHeroArchetype,
  AvengersHeroContent,
  AvengersNarrativeCharacterContent,
  LeaderEligibility,
  LocalizedText,
} from '../model/avengers-hero-content.model';
import { AvengersStrategy } from '../../model/avengers-strategy.enum';
import { HeroRole } from '../../model/hero-role.enum';
import {
  BasicAttackAbility,
  LeaderAbility,
  LocalizedAbilityContent,
  OffensiveAbility,
  SupportAbility,
} from '../../model/hero-ability.model';
import { HeroStats } from '../../model/hero-stats.model';

@Injectable()
export class AvengersHeroMetadataMapper {
  hero(entity: AvengersHeroEntity): AvengersHeroContent {
    const value = this.object(entity.metadata, `Hero '${entity.id}' metadata`);
    const eligibility = this.oneOf(
      entity.eligibility,
      ['PREFERRED', 'ELIGIBLE', 'COMPANION_ONLY'] as const,
      'eligibility',
    );
    const leadershipValue =
      value.leadership === null ? null : this.object(value.leadership, 'leadership');
    return {
      id: entity.id,
      name: entity.displayName,
      displayName: entity.displayName,
      themeId: this.literal(entity.themeId, 'avengers-doomsday', 'themeId'),
      eligibility: eligibility as LeaderEligibility,
      archetype: this.oneOf(
        entity.archetype,
        ['BRUISER', 'SKIRMISHER', 'TACTICIAN', 'MYSTIC', 'GUARDIAN', 'BLASTER'] as const,
        'archetype',
      ) as AvengersHeroArchetype,
      portrait: entity.portrait,
      portraitFallback: this.string(value.portraitFallback, 'portraitFallback'),
      stats: this.stats(value.stats),
      primaryRole: this.oneOf(value.primaryRole, Object.values(HeroRole), 'primaryRole'),
      secondaryRole: this.oneOf(value.secondaryRole, Object.values(HeroRole), 'secondaryRole'),
      maxEnergy: this.positiveInteger(value.maxEnergy, 'maxEnergy'),
      maxAbilityPoints: this.positiveInteger(value.maxAbilityPoints, 'maxAbilityPoints'),
      allies: this.stringArray(value.allies, 'allies'),
      rivals: this.stringArray(value.rivals, 'rivals'),
      basicAttack: this.basic(value.basicAttack, entity.displayName),
      offensiveAbility: this.offensive(value.offensiveAbility),
      supportAbility: this.support(value.supportAbility),
      biography: this.localized(value.biography, 'biography'),
      tournamentMotivation: this.localized(value.tournamentMotivation, 'tournamentMotivation'),
      leadership: leadershipValue
        ? {
            profile: this.oneOf(
              leadershipValue.profile,
              Object.values(AvengersStrategy),
              'leadership.profile',
            ),
            ability: this.leaderAbility(leadershipValue.ability),
            ...(leadershipValue.revealReaction
              ? {
                  revealReaction: this.localized(
                    leadershipValue.revealReaction,
                    'leadership.revealReaction',
                  ),
                }
              : {}),
          }
        : null,
      contentVersion: entity.contentVersion,
    };
  }

  narrative(entity: AvengersNarrativeCharacterEntity): AvengersNarrativeCharacterContent {
    const value = this.object(entity.metadata, `Narrative character '${entity.id}' metadata`);
    return {
      id: this.oneOf(
        entity.id,
        ['silver-surfer', 'doctor-doom', 'dormammu'] as const,
        'narrative id',
      ),
      themeId: this.literal(entity.themeId, 'avengers-doomsday', 'themeId'),
      displayName: entity.displayName,
      role: this.oneOf(
        value.role,
        ['apparent-organizer', 'final-boss', 'apparent-threat'] as const,
        'role',
      ),
      portrait: entity.portrait,
      portraitFallback: this.string(value.portraitFallback, 'portraitFallback'),
      description: this.localized(value.description, 'description'),
      contentVersion: entity.contentVersion,
    };
  }

  private stats(input: unknown): HeroStats {
    const value = this.object(input, 'stats');
    return {
      power: this.stat(value.power, 'power'),
      agility: this.stat(value.agility, 'agility'),
      resistance: this.stat(value.resistance, 'resistance'),
      ability: this.stat(value.ability, 'ability'),
    };
  }

  private basic(input: unknown, displayName: string): BasicAttackAbility {
    if (!input) {
      return {
        localizedName: { en: `${displayName} Strike`, es: `${displayName} Strike` },
        description: {
          en: `${displayName} lashes out with a fast signature strike.`,
          es: `${displayName} descarga un golpe característico y veloz.`,
        },
      };
    }
    const value = this.object(input, 'basicAttack');
    return {
      ...(value.localizedName
        ? { localizedName: this.localizedAbility(value.localizedName, 'basicAttack.localizedName') }
        : {}),
      ...(value.description
        ? { description: this.localizedAbility(value.description, 'basicAttack.description') }
        : {}),
    };
  }

  private offensive(input: unknown): OffensiveAbility {
    const value = this.object(input, 'offensiveAbility');
    return {
      id: this.string(value.id, 'offensiveAbility.id'),
      name: this.string(value.name, 'offensiveAbility.name'),
      ...(value.localizedName
        ? {
            localizedName: this.localizedAbility(
              value.localizedName,
              'offensiveAbility.localizedName',
            ),
          }
        : {}),
      ...(value.description
        ? { description: this.localizedAbility(value.description, 'offensiveAbility.description') }
        : {}),
      apCost: this.positiveInteger(value.apCost, 'offensiveAbility.apCost'),
      multiplier: this.positiveNumber(value.multiplier, 'offensiveAbility.multiplier'),
    };
  }

  private support(input: unknown): SupportAbility {
    const value = this.object(input, 'supportAbility');
    return {
      id: this.string(value.id, 'supportAbility.id'),
      name: this.string(value.name, 'supportAbility.name'),
      ...(value.localizedName
        ? {
            localizedName: this.localizedAbility(
              value.localizedName,
              'supportAbility.localizedName',
            ),
          }
        : {}),
      ...(value.description
        ? { description: this.localizedAbility(value.description, 'supportAbility.description') }
        : {}),
      apCost: this.positiveInteger(value.apCost, 'supportAbility.apCost'),
      effect: this.oneOf(
        value.effect,
        ['HEAL', 'POWER', 'RESISTANCE', 'AGILITY', 'CLEANSE'] as const,
        'supportAbility.effect',
      ),
      potency: this.positiveNumber(value.potency, 'supportAbility.potency'),
    };
  }

  private leaderAbility(input: unknown): LeaderAbility {
    const value = this.object(input, 'leaderAbility');
    return {
      id: this.string(value.id, 'leaderAbility.id'),
      name: this.string(value.name, 'leaderAbility.name'),
      ...(value.localizedName
        ? {
            localizedName: this.localizedAbility(
              value.localizedName,
              'leaderAbility.localizedName',
            ),
          }
        : {}),
      ...(value.description
        ? { description: this.localizedAbility(value.description, 'leaderAbility.description') }
        : {}),
      effect: this.oneOf(
        value.effect,
        ['STRIKE', 'HEAL', 'PROTECT', 'DISRUPT'] as const,
        'leaderAbility.effect',
      ),
      potency: this.positiveNumber(value.potency, 'leaderAbility.potency'),
    };
  }

  private localizedAbility(input: unknown, field: string): LocalizedAbilityContent {
    const value = this.object(input, field);
    return { en: this.string(value.en, `${field}.en`), es: this.string(value.es, `${field}.es`) };
  }

  private localized(input: unknown, field: string): LocalizedText {
    const value = this.object(input, field);
    return { en: this.string(value.en, `${field}.en`), es: this.string(value.es, `${field}.es`) };
  }

  private object(input: unknown, field: string): Record<string, unknown> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error(`${field} must be an object.`);
    }
    return input as Record<string, unknown>;
  }

  private string(input: unknown, field: string): string {
    if (typeof input !== 'string' || !input.trim()) {
      throw new Error(`${field} must be a nonempty string.`);
    }
    return input;
  }

  private stringArray(input: unknown, field: string): string[] {
    if (!Array.isArray(input) || input.some((value) => typeof value !== 'string')) {
      throw new Error(`${field} must be a string array.`);
    }
    return [...input];
  }

  private positiveInteger(input: unknown, field: string): number {
    if (!Number.isInteger(input) || (input as number) <= 0) {
      throw new Error(`${field} must be a positive integer.`);
    }
    return input as number;
  }

  private positiveNumber(input: unknown, field: string): number {
    if (typeof input !== 'number' || !Number.isFinite(input) || input <= 0) {
      throw new Error(`${field} must be positive.`);
    }
    return input;
  }

  private stat(input: unknown, field: string): number {
    if (!Number.isInteger(input) || (input as number) < 0 || (input as number) > 100) {
      throw new Error(`${field} must be an integer from 0 to 100.`);
    }
    return input as number;
  }

  private literal<T extends string>(input: unknown, expected: T, field: string): T {
    if (input !== expected) {
      throw new Error(`${field} must be ${expected}.`);
    }
    return expected;
  }

  private oneOf<T extends string>(input: unknown, choices: readonly T[], field: string): T {
    if (typeof input !== 'string' || !choices.includes(input as T)) {
      throw new Error(`${field} has an unsupported value.`);
    }
    return input as T;
  }
}
