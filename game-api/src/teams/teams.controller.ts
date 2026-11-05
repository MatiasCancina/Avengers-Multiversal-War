import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../basic/abstract.controller';
import { PublicIdPipe } from '../basic/public-id.pipe';
import { ApiLanguageQuery, ApiPublicResponses } from '../basic/public-api.decorators';
import { ResponseObject } from '../basic/response-object.model';
import { TeamProfileResponseModel } from './model/team-profile-response.model';
import { TeamProfileModel } from './model/team-profile.model';
import { TeamsService } from './teams.service';

const TEAM_ID_PATTERN = '^[a-z0-9]+(?:-[a-z0-9]+)*$';
const TEAM_ID_MAX_LENGTH = 64;

@ApiTags('Teams')
@Controller('teams')
export class TeamsController extends AbstractController {
  constructor(private readonly teamsService: TeamsService) {
    super();
  }

  @Get(':teamId/profile')
  @ApiOperation({ summary: 'Read the profile of a team.' })
  @ApiParam({
    name: 'teamId',
    description: 'The team identifier, using lowercase kebab-case.',
    schema: {
      type: 'string',
      pattern: TEAM_ID_PATTERN,
      maxLength: TEAM_ID_MAX_LENGTH,
      example: 'spider-man',
    },
  })
  @ApiLanguageQuery()
  @ApiPublicResponses({
    type: TeamProfileResponseModel,
    notFound: true,
    notFoundCode: 'TEAM_NOT_FOUND',
    notFoundMessage: 'Team was not found.',
  })
  async getProfile(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Query('lang') lang = 'en',
  ): Promise<ResponseObject<TeamProfileModel>> {
    const model = await this.teamsService.getProfile(teamId, lang);
    return this.createOkResponse(model);
  }
}
