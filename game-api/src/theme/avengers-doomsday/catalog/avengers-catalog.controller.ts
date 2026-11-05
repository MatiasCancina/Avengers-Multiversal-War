import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../../basic/abstract.controller';
import {
  ApiHistoricalCatalogQueries,
  ApiLanguageQuery,
  ApiPublicResponses,
} from '../../../basic/public-api.decorators';
import {
  HeroCatalogDataModel,
  HeroCatalogResponseModel,
  HeroRelationshipsDataModel,
  HeroRelationshipsResponseModel,
} from './model/avengers-public-catalog.model';
import { ResponseObject } from '../../../basic/response-object.model';
import { AVENGERS_THEME_ID, AvengersCatalogQueryService } from './avengers-catalog-query.service';

@ApiTags('Heroes')
@Controller()
export class AvengersCatalogController extends AbstractController {
  constructor(private readonly catalog: AvengersCatalogQueryService) {
    super();
  }

  @Get('heroes')
  @ApiOperation({
    summary: 'Read current or attempt-pinned selectable Hero content.',
    description:
      'Archetypes, generation bands, multipliers, AI inputs, and narrative-only identities are not public.',
  })
  @ApiLanguageQuery()
  @ApiHistoricalCatalogQueries()
  @ApiPublicResponses({
    type: HeroCatalogResponseModel,
    notFound: true,
    conflictCodes: ['VERSION_UNSUPPORTED'],
  })
  async heroes(
    @Query('lang') lang = 'en',
    @Query('teamId') teamId?: string,
    @Query('attemptId') attemptId?: string,
  ): Promise<ResponseObject<HeroCatalogDataModel>> {
    return this.createOkResponse(
      await this.catalog.heroes(AVENGERS_THEME_ID, lang, teamId, attemptId),
    );
  }

  @Get('heroes/relationships')
  @ApiOperation({
    summary: 'Read the complete sparse relationship graph among selectable Heroes.',
    description:
      'Only sparse ALLY and RIVAL facts among selectable Heroes are returned. An absent pair is NORMAL.',
  })
  @ApiHistoricalCatalogQueries()
  @ApiPublicResponses({
    type: HeroRelationshipsResponseModel,
    notFound: true,
    conflictCodes: ['VERSION_UNSUPPORTED'],
  })
  async relationships(
    @Query('teamId') teamId?: string,
    @Query('attemptId') attemptId?: string,
  ): Promise<ResponseObject<HeroRelationshipsDataModel>> {
    return this.createOkResponse(
      await this.catalog.relationships(AVENGERS_THEME_ID, teamId, attemptId),
    );
  }
}
