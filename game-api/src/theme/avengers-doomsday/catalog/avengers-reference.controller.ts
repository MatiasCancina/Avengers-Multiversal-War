import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../../basic/abstract.controller';
import {
  ApiHistoricalCatalogQueries,
  ApiLanguageQuery,
  ApiPublicResponses,
} from '../../../basic/public-api.decorators';
import {
  AbilityPointRecoveryEffectModel,
  EnergyRecoveryEffectModel,
  ExtraResourceEffectModel,
  GameDictionaryDataModel,
  GameDictionaryResponseModel,
  PowerUpCatalogDataModel,
  PowerUpCatalogResponseModel,
  ReviveEffectModel,
  StatBoostEffectModel,
  StrategyCatalogDataModel,
  StrategyCatalogResponseModel,
  ThemePrologueDataModel,
  ThemePrologueResponseModel,
} from './model/avengers-public-catalog.model';
import { ResponseObject } from '../../../basic/response-object.model';
import { AVENGERS_THEME_ID, AvengersCatalogQueryService } from './avengers-catalog-query.service';

@ApiTags('Reference')
@ApiExtraModels(
  EnergyRecoveryEffectModel,
  AbilityPointRecoveryEffectModel,
  ReviveEffectModel,
  StatBoostEffectModel,
  ExtraResourceEffectModel,
)
@Controller()
export class AvengersReferenceController extends AbstractController {
  constructor(private readonly catalog: AvengersCatalogQueryService) {
    super();
  }

  @Get('reference/game-dictionary')
  @ApiOperation({
    summary: 'Read the centralized localized explanation of public game vocabulary.',
    description:
      'The Dictionary excludes formulas, tuning, RNG, AI thresholds, and hidden narrative facts.',
  })
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: GameDictionaryResponseModel })
  dictionary(@Query('lang') lang = 'en'): ResponseObject<GameDictionaryDataModel> {
    return this.createOkResponse(this.catalog.gameDictionary(lang));
  }

  @Get('reference/strategies')
  @ApiOperation({ summary: 'Read operational Combat Strategy definitions and compatibility.' })
  @ApiLanguageQuery()
  @ApiHistoricalCatalogQueries()
  @ApiPublicResponses({
    type: StrategyCatalogResponseModel,
    notFound: true,
    conflictCodes: ['VERSION_UNSUPPORTED'],
  })
  async strategies(
    @Query('lang') lang = 'en',
    @Query('teamId') teamId?: string,
    @Query('attemptId') attemptId?: string,
  ): Promise<ResponseObject<StrategyCatalogDataModel>> {
    return this.createOkResponse(
      await this.catalog.strategies(AVENGERS_THEME_ID, lang, teamId, attemptId),
    );
  }

  @Get('reference/power-ups')
  @ApiOperation({
    summary: 'Read current or attempt-pinned Store definitions, prices, and effects.',
  })
  @ApiLanguageQuery()
  @ApiHistoricalCatalogQueries()
  @ApiPublicResponses({
    type: PowerUpCatalogResponseModel,
    notFound: true,
    conflictCodes: ['VERSION_UNSUPPORTED'],
  })
  async powerUps(
    @Query('lang') lang = 'en',
    @Query('teamId') teamId?: string,
    @Query('attemptId') attemptId?: string,
  ): Promise<ResponseObject<PowerUpCatalogDataModel>> {
    return this.createOkResponse(
      await this.catalog.powerUps(AVENGERS_THEME_ID, lang, teamId, attemptId),
    );
  }

  @Get('reference/prologue')
  @ApiOperation({
    summary: 'Read the public four-scene Multiversal Tournament premise.',
    description: 'Returns the public premise available before play.',
  })
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: ThemePrologueResponseModel, notFound: true })
  async prologue(@Query('lang') lang = 'en'): Promise<ResponseObject<ThemePrologueDataModel>> {
    return this.createOkResponse(await this.catalog.prologue(AVENGERS_THEME_ID, lang));
  }
}
