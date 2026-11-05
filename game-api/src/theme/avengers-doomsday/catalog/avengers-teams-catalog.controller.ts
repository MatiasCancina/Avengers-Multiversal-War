import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../../basic/abstract.controller';
import { ApiLanguageQuery, ApiPublicResponses } from '../../../basic/public-api.decorators';
import { ResponseObject } from '../../../basic/response-object.model';
import {
  AssignedTeamCatalogDataModel,
  AssignedTeamCatalogResponseModel,
} from './model/avengers-public-catalog.model';
import { AVENGERS_THEME_ID, AvengersCatalogQueryService } from './avengers-catalog-query.service';

@ApiTags('Teams')
@Controller()
export class AvengersTeamsCatalogController extends AbstractController {
  constructor(private readonly catalog: AvengersCatalogQueryService) {
    super();
  }

  @Get('teams')
  @ApiOperation({ summary: 'Read assigned Team and Leader identities.' })
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: AssignedTeamCatalogResponseModel, notFound: true })
  async teams(@Query('lang') lang = 'en'): Promise<ResponseObject<AssignedTeamCatalogDataModel>> {
    return this.createOkResponse(await this.catalog.assignedTeams(AVENGERS_THEME_ID, lang));
  }
}
