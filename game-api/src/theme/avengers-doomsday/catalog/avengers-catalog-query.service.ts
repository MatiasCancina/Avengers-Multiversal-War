import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GameError } from '../../../basic/error/game-error';
import { GameErrorCode } from '../../../basic/error/game-error-code.enum';
import { JourneyAttemptEntity } from '../../../journey/entity/journey-attempt.entity';
import { TeamProfileEntity } from '../../../teams/entity/team-profile.entity';
import { TeamProfileRepository } from '../../../teams/repository/team-profile.repository';
import { AvengersJourneyMetadataMapper } from '../journey/mapper/avengers-journey-metadata.mapper';
import { AvengersCapturedContent } from '../journey/model/avengers-journey-metadata.model';
import { AvengersStrategy } from '../model/avengers-strategy.enum';
import { AvengersPublicLocalization } from '../public/avengers-public-localization.service';
import { AVENGERS_POWER_UPS } from '../store/avengers-power-up.catalog';
import { AvengersHeroMetadataMapper } from './mapper/avengers-hero-metadata.mapper';
import { AvengersHeroContent } from './model/avengers-hero-content.model';
import {
  AssignedTeamCatalogDataModel,
  GameDictionaryDataModel,
  HeroCatalogDataModel,
  HeroRelationshipPairModel,
  HeroRelationshipsDataModel,
  PowerUpCatalogDataModel,
  StrategyCatalogDataModel,
  ThemePrologueDataModel,
} from './model/avengers-public-catalog.model';
import { AvengersHeroRepository } from './repository/avengers-hero.repository';
import { HeroRelationship } from '../model/hero-relationship.enum';

export const AVENGERS_THEME_ID = 'avengers-doomsday';

@Injectable()
export class AvengersCatalogQueryService {
  constructor(
    private readonly repository: AvengersHeroRepository,
    private readonly mapper: AvengersHeroMetadataMapper,
    private readonly teams: TeamProfileRepository,
    private readonly dataSource: DataSource,
    private readonly journeyMapper: AvengersJourneyMetadataMapper,
    private readonly localization: AvengersPublicLocalization,
  ) {}

  async heroes(
    themeId: string,
    lang: string,
    teamId?: string,
    attemptId?: string,
  ): Promise<HeroCatalogDataModel> {
    this.assertTheme(themeId);
    const captured = await this.capturedContent(teamId, attemptId);
    const source = captured
      ? captured.heroes
      : (await this.repository.heroes()).map((entity) => this.mapper.hero(entity));
    const language = this.lang(lang);
    const result: HeroCatalogDataModel = {
      language,
      count: source.length,
      heroes: source.map((hero) => this.projectHero(hero, language)),
    };

    return result;
  }

  async definitions(): Promise<AvengersHeroContent[]> {
    return (await this.repository.heroes()).map((entity) => this.mapper.hero(entity));
  }

  async narrativeCharacters() {
    return (await this.repository.narrativeCharacters()).map((entity) =>
      this.mapper.narrative(entity),
    );
  }

  async strategies(
    themeId: string,
    lang: string,
    teamId?: string,
    attemptId?: string,
  ): Promise<StrategyCatalogDataModel> {
    this.assertTheme(themeId);
    await this.capturedContent(teamId, attemptId);
    const language = this.lang(lang);
    const result: StrategyCatalogDataModel = {
      language,
      strategies: Object.values(AvengersStrategy).map((code) => ({
        code,
        label: this.localization.label(code, language),
        description: this.localization.description('combatStrategies', code, language),
      })),
      compatibility: { sameProfile: 'HIGH', aggressiveVsDefensive: 'LOW', otherwise: 'MEDIUM' },
    };

    return result;
  }

  async relationships(
    themeId: string,
    teamId?: string,
    attemptId?: string,
  ): Promise<HeroRelationshipsDataModel> {
    this.assertTheme(themeId);
    const captured = await this.capturedContent(teamId, attemptId);
    const source = captured
      ? captured.heroes
      : (await this.repository.heroes()).map((entity) => this.mapper.hero(entity));
    const heroes = source;
    const relationships: HeroRelationshipPairModel[] = [];
    for (let i = 0; i < heroes.length; i += 1) {
      for (let j = i + 1; j < heroes.length; j += 1) {
        const a = heroes[i];
        const b = heroes[j];
        const relationship: HeroRelationship =
          a.rivals.includes(b.id) || b.rivals.includes(a.id)
            ? HeroRelationship.RIVAL
            : a.allies.includes(b.id) || b.allies.includes(a.id)
              ? HeroRelationship.ALLY
              : HeroRelationship.NORMAL;
        if (relationship !== HeroRelationship.NORMAL) {
          relationships.push({ heroAId: a.id, heroBId: b.id, relationshipCode: relationship });
        }
      }
    }
    const result: HeroRelationshipsDataModel = {
      heroIds: heroes.map((hero) => hero.id),
      relationships,
    };

    return result;
  }

  async assignedTeams(themeId: string, lang = 'en'): Promise<AssignedTeamCatalogDataModel> {
    this.assertTheme(themeId);
    const language = this.lang(lang);
    const profiles = await this.teams.findByTheme(themeId);
    const result: AssignedTeamCatalogDataModel = {
      language,
      teams: profiles.map((profile) => {
        const metadata =
          profile.metadata && typeof profile.metadata === 'object' ? profile.metadata : {};
        const leaderId = (metadata.leaderId as string | undefined) ?? profile.id;
        const leaderName = profile.name.replace(/ Team$/, '');
        return {
          id: profile.id,
          name: language === 'es' ? `Equipo ${leaderName}` : profile.name,
          description:
            language === 'es'
              ? `El Equipo asignado del Torneo Multiversal liderado por ${leaderName}.`
              : profile.description,
          leaderId,
        };
      }),
    };

    return result;
  }

  async powerUps(
    themeId: string,
    lang: string,
    teamId?: string,
    attemptId?: string,
  ): Promise<PowerUpCatalogDataModel> {
    this.assertTheme(themeId);
    const language = this.lang(lang);
    const captured = await this.capturedContent(teamId, attemptId);
    const definitions = captured?.powerUps ?? AVENGERS_POWER_UPS;
    const result: PowerUpCatalogDataModel = {
      language,
      powerUps: definitions.map((item) => ({
        id: item.id,
        name: item.name[language] || item.name.en,
        description: this.powerUpDescription(item.id, language),
        categoryCode: this.powerUpCategory(item.effect.type),
        price: item.price,
        targetScope: item.target,
        useContexts: ['PRE_FINAL', 'FINAL_STAGE'],
        effect: this.powerUpEffect(item.effect),
      })),
    };

    return result;
  }

  async prologue(themeId: string, lang: string): Promise<ThemePrologueDataModel> {
    this.assertTheme(themeId);
    const language = this.lang(lang);
    const characters = await this.narrativeCharacters();
    const copy =
      language === 'es'
        ? {
            title: 'Avengers: Doomsday',
            scenes: [
              {
                id: 'after-galactus',
                title: 'Después de Galactus',
                caption:
                  'Tras la derrota de Galactus a manos de los Cuatro Fantásticos, Silver Surfer volvió a recorrer el cosmos.',
              },
              {
                id: 'dark-dimension-warning',
                title: 'Una advertencia en el límite',
                caption:
                  'Cerca del límite del Sistema Solar, Dormammu afirmó que Doctor Strange había incumplido el acuerdo que protegía a la Tierra. Ahora amenazaba con quebrar las barreras entre realidades y consumir el multiverso.',
              },
              {
                id: 'the-warning',
                title: 'Ningún equipo basta',
                caption:
                  'Silver Surfer regresó con la advertencia. Ningún equipo de Vengadores podía enfrentar solo una amenaza de semejante escala.',
              },
              {
                id: 'the-multiversal-tournament',
                title: 'El Torneo Multiversal',
                caption:
                  'Treinta y dos líderes reúnen equipos de seis héroes. Grupos y eliminatorias decidirán quién encabezará la batalla para salvar el multiverso.',
              },
            ],
          }
        : {
            title: 'Avengers: Doomsday',
            scenes: [
              {
                id: 'after-galactus',
                title: 'After Galactus',
                caption:
                  'After the Fantastic Four defeated Galactus, Silver Surfer returned to travelling through the cosmos.',
              },
              {
                id: 'dark-dimension-warning',
                title: 'A warning at the edge',
                caption:
                  'Near the edge of the Solar System, Dormammu claimed Doctor Strange had failed to honor the agreement protecting Earth. He now threatened to break the barriers between realities and consume the multiverse.',
              },
              {
                id: 'the-warning',
                title: 'No single team is enough',
                caption:
                  'Silver Surfer returned with the warning. No Avengers Team could face a threat of that scale alone.',
              },
              {
                id: 'the-multiversal-tournament',
                title: 'The Multiversal Tournament',
                caption:
                  'Thirty-two Leaders assemble Teams of six Heroes. Groups and knockouts will decide who leads the battle to save the multiverse.',
              },
            ],
          };
    const result: ThemePrologueDataModel = {
      language,
      ...copy,
      narrativeCharacters: characters.map((character) => ({
        id: character.id,
        displayName: character.displayName,
      })),
    };

    return result;
  }

  gameDictionary(lang: string): GameDictionaryDataModel {
    const language = this.lang(lang);
    const dictionary = this.localization.dictionary(language) as Omit<
      GameDictionaryDataModel,
      'language'
    >;
    const result: GameDictionaryDataModel = {
      language,
      ...dictionary,
    };

    return result;
  }

  private projectHero(hero: AvengersHeroContent, lang: 'en' | 'es') {
    const ability = (
      value: {
        id: string;
        name: string;
        localizedName?: { en: string; es: string };
        description?: { en: string; es: string };
      },
      semanticId: string,
      targetScope: string,
      effectCode?: string,
      cost?: number,
    ) => ({
      id: semanticId,
      name: value.localizedName?.[lang] ?? value.name,
      description:
        value.description?.[lang] ??
        this.localization.abilityDescription('OFFENSIVE_SPECIAL', lang),
      ...(typeof cost === 'number' ? { abilityPointCost: cost } : {}),
      ...(effectCode ? { effectCode } : {}),
      targetScope,
    });
    return {
      id: hero.id,
      displayName: hero.displayName,
      eligibility: {
        code: hero.eligibility,
        label: this.localization.label(hero.eligibility, lang),
        description: this.localization.description('heroEligibility', hero.eligibility, lang),
      },
      stats: { maximum: 100, ...hero.stats },
      resources: {
        maximumEnergy: hero.maxEnergy,
        maximumAbilityPoints: hero.maxAbilityPoints,
      },
      roles: {
        primary: {
          code: hero.primaryRole,
          label: this.localization.label(hero.primaryRole, lang),
          description: this.localization.description('heroRoles', hero.primaryRole, lang),
        },
        secondary: {
          code: hero.secondaryRole,
          label: this.localization.label(hero.secondaryRole, lang),
          description: this.localization.description('heroRoles', hero.secondaryRole, lang),
        },
      },
      abilities: {
        basicAttack: {
          id: 'basic-attack',
          name: hero.basicAttack?.localizedName?.[lang] ?? `${hero.displayName} Strike`,
          description:
            hero.basicAttack?.description?.[lang] ??
            (lang === 'es'
              ? `${hero.displayName} descarga un golpe característico y veloz.`
              : `${hero.displayName} lashes out with a fast signature strike.`),
          targetScope: 'OPPONENT',
        },
        offensiveSpecial: ability(
          hero.offensiveAbility,
          'offensive-special',
          'OPPONENT',
          undefined,
          hero.offensiveAbility.apCost,
        ),
        supportSpecial: ability(
          hero.supportAbility,
          'support-special',
          'OWN_TEAM',
          hero.supportAbility.effect,
          hero.supportAbility.apCost,
        ),
        leaderAbility: hero.leadership
          ? ability(
              hero.leadership.ability,
              'leader-ability',
              'TEAM',
              hero.leadership.ability.effect,
            )
          : null,
      },
      leaderProfileCode: hero.leadership?.profile ?? null,
      biography: hero.biography[lang] || hero.biography.en,
      tournamentMotivation: hero.tournamentMotivation[lang] || hero.tournamentMotivation.en,
    };
  }

  private lang(lang: string): 'en' | 'es' {
    return lang.toLowerCase() === 'es' ? 'es' : 'en';
  }

  private abilityName(
    heroName: string,
    type: 'OFFENSIVE_SPECIAL' | 'SUPPORT_SPECIAL' | 'LEADER_ABILITY',
    englishName: string,
    lang: 'en' | 'es',
  ): string {
    if (lang === 'en') {
      return englishName;
    }
    switch (type) {
      case 'OFFENSIVE_SPECIAL':
        return `Especial ofensivo de ${heroName}`;
      case 'SUPPORT_SPECIAL':
        return `Especial de apoyo de ${heroName}`;
      case 'LEADER_ABILITY':
        return `Liderazgo de ${heroName}`;
    }
  }

  private assertTheme(themeId: string): void {
    if (themeId !== 'avengers-doomsday') {
      throw new GameError(GameErrorCode.RESOURCE_NOT_FOUND, 'Theme was not found.');
    }
  }

  private async capturedContent(
    teamId?: string,
    attemptId?: string,
  ): Promise<AvengersCapturedContent | null> {
    if (!teamId && attemptId) {
      throw new GameError(
        GameErrorCode.VALIDATION_ERROR,
        'An explicit historical attempt requires teamId.',
      );
    }
    if (!teamId) {
      return null;
    }
    if (!attemptId) {
      const profile = await this.dataSource
        .getRepository(TeamProfileEntity)
        .findOneBy({ id: teamId });
      if (!profile) {
        throw new GameError(GameErrorCode.TEAM_NOT_FOUND, 'Team was not found.');
      }
      attemptId = profile.currentAttemptId ?? undefined;
      if (!attemptId) {
        return null;
      }
    }
    const attempt = await this.dataSource
      .getRepository(JourneyAttemptEntity)
      .findOneBy({ id: attemptId, teamId });
    if (!attempt) {
      throw new GameError(GameErrorCode.RESOURCE_NOT_FOUND, 'Journey was not found.');
    }
    return this.journeyMapper.fromStorage(attempt.metadata).content;
  }

  private powerUpCategory(effectType: string): string {
    if (effectType === 'ENERGY') {
      return 'ENERGY';
    }
    if (effectType === 'AP' || effectType === 'AP_PERCENT' || effectType === 'FULL_AP') {
      return 'ABILITY_POINTS';
    }
    if (effectType === 'REVIVE') {
      return 'REVIVE';
    }
    if (effectType === 'BOOST') {
      return 'TEMPORARY_BOOST';
    }
    return 'EXTRA_RESOURCE';
  }

  private powerUpEffect(effect: AvengersCapturedContent['powerUps'][number]['effect']) {
    switch (effect.type) {
      case 'ENERGY':
        return {
          effectCode: 'ENERGY_RECOVERY',
          targetPercentage: effect.percent,
          canRevive: false,
        };
      case 'AP':
        return { effectCode: 'ABILITY_POINT_RECOVERY', amount: effect.amount };
      case 'AP_PERCENT':
        return { effectCode: 'ABILITY_POINT_RECOVERY', targetPercentage: effect.percent };
      case 'FULL_AP':
        return { effectCode: 'ABILITY_POINT_RECOVERY', fullRecovery: true };
      case 'REVIVE':
        return { effectCode: 'REVIVE' };
      case 'BOOST':
        return {
          effectCode: 'STAT_BOOST',
          statCode: effect.stat.toUpperCase(),
          percentage: effect.percent,
          durationRounds: effect.duration,
        };
      case 'EXTRA_TEAM_ACTION':
      case 'EXTRA_LEADER_ABILITY':
        return { effectCode: effect.type };
    }
  }

  private powerUpDescription(itemId: string, lang: 'en' | 'es'): string {
    const descriptions: Record<string, { en: string; es: string }> = {
      revive: {
        en: 'Revives one KO Hero with the authoritative partial Energy and Ability Point targets.',
        es: 'Revive a un Héroe KO con los objetivos parciales autoritativos de Energía y Puntos de Habilidad.',
      },
      'extra-team-action-all': {
        en: 'Adds one limited Team Action for FinalStage.',
        es: 'Agrega una Acción de Equipo limitada para la Etapa Final.',
      },
      'extra-leader-ability-all': {
        en: 'Adds one limited Leader Ability use for FinalStage.',
        es: 'Agrega un uso limitado de Habilidad de Líder para la Etapa Final.',
      },
    };
    if (descriptions[itemId]) {
      return descriptions[itemId][lang];
    }
    if (itemId.startsWith('energy-')) {
      return lang === 'es'
        ? 'Recupera Energía de un Héroe vivo hasta el objetivo autoritativo; no revive.'
        : 'Recovers one living Hero Energy to the authoritative target; it does not revive.';
    }
    if (itemId.startsWith('ap-')) {
      const all = itemId.endsWith('-all');
      return lang === 'es'
        ? all
          ? 'Recupera Puntos de Habilidad de los Héroes activos hasta sus objetivos individuales.'
          : 'Recupera Puntos de Habilidad de un Héroe vivo hasta el objetivo autoritativo.'
        : all
          ? 'Recovers Active Heroes’ Ability Points up to their individual maximums.'
          : 'Recovers one living Hero Ability Points to the authoritative target.';
    }
    return lang === 'es'
      ? 'Aplica una mejora temporal de estadística al Equipo.'
      : 'Applies a temporary stat boost to the Team.';
  }
}
