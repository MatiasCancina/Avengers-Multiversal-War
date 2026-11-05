import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { LocalizedCodeModel, SuccessResponseModel } from '../../../../basic/public-api.model';
import { AvengersStrategy } from '../../model/avengers-strategy.enum';
import { HeroRelationship } from '../../model/hero-relationship.enum';
import { HeroRole } from '../../model/hero-role.enum';

export class HeroEligibilityDisplayModel extends LocalizedCodeModel {}

export class HeroRoleDisplayModel extends LocalizedCodeModel {
  @ApiProperty({ enum: HeroRole, example: HeroRole.AGILE })
  declare code: string;
}

export class HeroRolesModel {
  @ApiProperty({ type: HeroRoleDisplayModel })
  primary!: HeroRoleDisplayModel;

  @ApiProperty({ type: HeroRoleDisplayModel })
  secondary!: HeroRoleDisplayModel;
}

export class HeroStatsModel {
  @ApiProperty({ example: 100 })
  maximum!: number;

  @ApiProperty({ example: 78 })
  power!: number;

  @ApiProperty({ example: 68 })
  resistance!: number;

  @ApiProperty({ example: 94 })
  agility!: number;

  @ApiProperty({ example: 82 })
  ability!: number;
}

export class HeroResourcesModel {
  @ApiProperty({ example: 228 })
  maximumEnergy!: number;

  @ApiProperty({ example: 126 })
  maximumAbilityPoints!: number;
}

export class HeroAbilityDisplayModel {
  @ApiProperty({ example: 'offensive-special' })
  id!: string;

  @ApiProperty({ example: 'Web Barrage' })
  name!: string;

  @ApiProperty({
    example: 'Spider-Man overwhelms the opposing team with a rapid web-based assault.',
  })
  description!: string;

  @ApiPropertyOptional({ example: 30 })
  abilityPointCost?: number;

  @ApiPropertyOptional({ example: 'POWER' })
  effectCode?: string;

  @ApiProperty({ enum: ['OPPONENT', 'OWN_TEAM', 'TEAM'], example: 'OPPONENT' })
  targetScope!: string;
}

export class HeroAbilitiesModel {
  @ApiProperty({ type: HeroAbilityDisplayModel })
  basicAttack!: HeroAbilityDisplayModel;

  @ApiProperty({ type: HeroAbilityDisplayModel })
  offensiveSpecial!: HeroAbilityDisplayModel;

  @ApiProperty({ type: HeroAbilityDisplayModel })
  supportSpecial!: HeroAbilityDisplayModel;

  @ApiProperty({ type: HeroAbilityDisplayModel, nullable: true })
  leaderAbility!: HeroAbilityDisplayModel | null;
}

export class PublicHeroModel {
  @ApiProperty({ example: 'spider-man' })
  id!: string;

  @ApiProperty({ example: 'Spider-Man' })
  displayName!: string;

  @ApiProperty({ type: HeroEligibilityDisplayModel })
  eligibility!: HeroEligibilityDisplayModel;

  @ApiProperty({ type: HeroRolesModel })
  roles!: HeroRolesModel;

  @ApiProperty({ type: HeroStatsModel })
  stats!: HeroStatsModel;

  @ApiProperty({ type: HeroResourcesModel })
  resources!: HeroResourcesModel;

  @ApiProperty({ type: HeroAbilitiesModel })
  abilities!: HeroAbilitiesModel;

  @ApiProperty({ enum: AvengersStrategy, nullable: true, example: AvengersStrategy.BALANCED })
  leaderProfileCode!: AvengersStrategy | null;

  @ApiProperty({
    example: 'Peter Parker is a quick-witted Hero who protects others with agility and resolve.',
  })
  biography!: string;

  @ApiProperty({
    example: 'Spider-Man enters the tournament to protect every neighborhood in every reality.',
  })
  tournamentMotivation!: string;
}

export class HeroCatalogDataModel {
  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ example: 87 })
  count!: number;

  @ApiProperty({ type: [PublicHeroModel] })
  heroes!: PublicHeroModel[];
}

export class HeroCatalogResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: HeroCatalogDataModel })
  data!: HeroCatalogDataModel;
}

export class HeroRelationshipPairModel {
  @ApiProperty({ example: 'spider-man' })
  heroAId!: string;

  @ApiProperty({ example: 'doctor-strange' })
  heroBId!: string;

  @ApiProperty({ enum: HeroRelationship, example: HeroRelationship.ALLY })
  relationshipCode!: HeroRelationship;
}

export class HeroRelationshipsDataModel {
  @ApiProperty({ type: [String], example: ['spider-man', 'doctor-strange'] })
  heroIds!: string[];

  @ApiProperty({ type: [HeroRelationshipPairModel] })
  relationships!: HeroRelationshipPairModel[];
}

export class HeroRelationshipsResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: HeroRelationshipsDataModel })
  data!: HeroRelationshipsDataModel;
}

export class AssignedTeamCatalogItemModel {
  @ApiProperty({ example: 'spider-man' })
  id!: string;

  @ApiProperty({ example: 'Team Spider-Man' })
  name!: string;

  @ApiProperty({ example: 'The assigned Team led by Spider-Man.' })
  description!: string;

  @ApiProperty({ example: 'spider-man' })
  leaderId!: string;
}

export class AssignedTeamCatalogDataModel {
  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ type: [AssignedTeamCatalogItemModel] })
  teams!: AssignedTeamCatalogItemModel[];
}

export class AssignedTeamCatalogResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: AssignedTeamCatalogDataModel })
  data!: AssignedTeamCatalogDataModel;
}

export class StrategyDefinitionModel extends LocalizedCodeModel {
  @ApiProperty({ enum: AvengersStrategy, example: AvengersStrategy.BALANCED })
  declare code: string;
}

export class StrategyCompatibilityModel {
  @ApiProperty({ example: 'HIGH' })
  sameProfile!: string;

  @ApiProperty({ example: 'LOW' })
  aggressiveVsDefensive!: string;

  @ApiProperty({ example: 'MEDIUM' })
  otherwise!: string;
}

export class StrategyCatalogDataModel {
  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ type: [StrategyDefinitionModel] })
  strategies!: StrategyDefinitionModel[];

  @ApiProperty({ type: StrategyCompatibilityModel })
  compatibility!: StrategyCompatibilityModel;
}

export class StrategyCatalogResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: StrategyCatalogDataModel })
  data!: StrategyCatalogDataModel;
}

export class EnergyRecoveryEffectModel {
  @ApiProperty({ enum: ['ENERGY_RECOVERY'], example: 'ENERGY_RECOVERY' })
  effectCode!: 'ENERGY_RECOVERY';

  @ApiProperty({ example: 25 })
  targetPercentage!: number;

  @ApiProperty({ example: false })
  canRevive!: boolean;
}

export class AbilityPointRecoveryEffectModel {
  @ApiProperty({ enum: ['ABILITY_POINT_RECOVERY'], example: 'ABILITY_POINT_RECOVERY' })
  effectCode!: 'ABILITY_POINT_RECOVERY';

  @ApiPropertyOptional({ example: 25 })
  targetPercentage?: number;

  @ApiPropertyOptional({ example: true })
  fullRecovery?: boolean;
}

export class ReviveEffectModel {
  @ApiProperty({ enum: ['REVIVE'], example: 'REVIVE' })
  effectCode!: 'REVIVE';
}

export class StatBoostEffectModel {
  @ApiProperty({ enum: ['STAT_BOOST'], example: 'STAT_BOOST' })
  effectCode!: 'STAT_BOOST';

  @ApiProperty({ enum: ['POWER', 'RESISTANCE', 'AGILITY', 'ABILITY'], example: 'POWER' })
  statCode!: string;

  @ApiProperty({ example: 10 })
  percentage!: number;

  @ApiProperty({ example: 2 })
  durationRounds!: number;
}

export class ExtraResourceEffectModel {
  @ApiProperty({
    enum: ['EXTRA_TEAM_ACTION', 'EXTRA_LEADER_ABILITY'],
    example: 'EXTRA_TEAM_ACTION',
  })
  effectCode!: string;
}

export class PowerUpDefinitionModel {
  @ApiProperty({ example: 'energy-major' })
  id!: string;

  @ApiProperty({ example: 'Major Energy Recovery' })
  name!: string;

  @ApiProperty({ example: "Raises one Hero's Energy to the authoritative recovery target." })
  description!: string;

  @ApiProperty({
    enum: ['ENERGY', 'ABILITY_POINTS', 'REVIVE', 'TEMPORARY_BOOST', 'EXTRA_RESOURCE'],
  })
  categoryCode!: string;

  @ApiProperty({ example: 20 })
  price!: number;

  @ApiProperty({ enum: ['HERO', 'TEAM'], example: 'HERO' })
  targetScope!: string;

  @ApiProperty({ type: [String], example: ['PRE_FINAL'] })
  useContexts!: string[];

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(EnergyRecoveryEffectModel) },
      { $ref: getSchemaPath(AbilityPointRecoveryEffectModel) },
      { $ref: getSchemaPath(ReviveEffectModel) },
      { $ref: getSchemaPath(StatBoostEffectModel) },
      { $ref: getSchemaPath(ExtraResourceEffectModel) },
    ],
    discriminator: { propertyName: 'effectCode' },
  })
  effect!:
    | EnergyRecoveryEffectModel
    | AbilityPointRecoveryEffectModel
    | ReviveEffectModel
    | StatBoostEffectModel
    | ExtraResourceEffectModel;
}

export class PowerUpCatalogDataModel {
  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ type: [PowerUpDefinitionModel] })
  powerUps!: PowerUpDefinitionModel[];
}

export class PowerUpCatalogResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: PowerUpCatalogDataModel })
  data!: PowerUpCatalogDataModel;
}

export class PrologueSceneModel {
  @ApiProperty({ example: 'after-galactus' })
  id!: string;

  @ApiProperty({ example: 'After Galactus' })
  title!: string;

  @ApiProperty({
    example: 'After the Fantastic Four defeated Galactus, Silver Surfer returned to the cosmos.',
  })
  caption!: string;
}

export class PublicNarrativeIdentityModel {
  @ApiProperty({ example: 'silver-surfer' })
  id!: string;

  @ApiProperty({ example: 'Silver Surfer' })
  displayName!: string;
}

export class ThemePrologueDataModel {
  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ example: 'Avengers: Doomsday' })
  title!: string;

  @ApiProperty({ type: [PrologueSceneModel] })
  scenes!: PrologueSceneModel[];

  @ApiProperty({ type: [PublicNarrativeIdentityModel] })
  narrativeCharacters!: PublicNarrativeIdentityModel[];
}

export class ThemePrologueResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: ThemePrologueDataModel })
  data!: ThemePrologueDataModel;
}

export class GameDictionaryDataModel {
  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ type: [LocalizedCodeModel] })
  combatStrategies!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  journeySpendingStrategies!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  heroRoles!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  heroEligibility!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  relationships!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  heroStats!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  abilityTypes!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  supportEffects!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  journeyStages!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  encounterResults!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  encounterResolutions!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  journeyEventTypes!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  rewardConcepts!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  powerUpCategories!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  powerUpTargets!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  finalStagePhases!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  finalStageActions!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  finalStageEventTypes!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  heroStatuses!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  journeyStatuses!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  completionOutcomes!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  awards!: LocalizedCodeModel[];

  @ApiProperty({ type: [LocalizedCodeModel] })
  awardMetrics!: LocalizedCodeModel[];
}

export class GameDictionaryResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: GameDictionaryDataModel })
  data!: GameDictionaryDataModel;
}
