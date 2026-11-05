import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../../basic/abstract.controller';
import { PublicIdPipe } from '../../../basic/public-id.pipe';
import {
  ApiLanguageQuery,
  ApiPublicResponses,
  ApiTeamIdParam,
} from '../../../basic/public-api.decorators';
import { AvengersJourneyService } from './avengers-journey.service';
import {
  CompletedJourneyHistoryDataModel,
  CompletedJourneyHistoryResponseModel,
  SaveTeamConfigurationResultModel,
  SaveTeamConfigurationResponseModel,
  TeamConfigurationDataModel,
  TeamConfigurationResponseModel,
} from './model/avengers-public-team.model';
import { SaveTeamConfigurationRequest } from './request/save-team-configuration.request';
import { ResponseObject } from '../../../basic/response-object.model';

@ApiTags('Teams')
@Controller('teams/:teamId')
export class AvengersTeamJourneyController extends AbstractController {
  constructor(private readonly service: AvengersJourneyService) {
    super();
  }

  @Get('configuration')
  @ApiOperation({
    summary: 'Read the single saved Team configuration.',
    description:
      'Editability reports current domain legality. It does not predict how a future SAVE will be implemented.',
  })
  @ApiTeamIdParam()
  @ApiPublicResponses({ type: TeamConfigurationResponseModel, notFound: true })
  async configuration(
    @Param('teamId', PublicIdPipe) teamId: string,
  ): Promise<ResponseObject<TeamConfigurationDataModel>> {
    return this.createOkResponse(await this.service.configuration(teamId));
  }

  @Put('configuration')
  @ApiOperation({
    summary: 'Atomically save the Team configuration.',
    description:
      'A PRE_FINAL membership change replaces the unfinished Journey in the same transaction. Tactical-only changes do not re-simulate.',
  })
  @ApiTeamIdParam()
  @ApiBody({
    type: SaveTeamConfigurationRequest,
    examples: {
      SAVE_TEAM: {
        summary: 'Save Team',
        value: {
          companionIds: ['scarlet-witch', 'punisher', 'kitty-pryde', 'ms-marvel', 'yondu'],
          activeHeroIds: ['spider-man', 'scarlet-witch', 'punisher'],
          strategy: 'BALANCED',
        },
      },
    },
  })
  @ApiPublicResponses({
    type: SaveTeamConfigurationResponseModel,
    notFound: true,
    conflictCodes: ['STATE_CONFLICT', 'JOURNEY_LOCKED'],
    unprocessableCode: 'INVALID_TEAM_CONFIGURATION',
  })
  async saveConfiguration(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Body() request: SaveTeamConfigurationRequest,
  ): Promise<ResponseObject<SaveTeamConfigurationResultModel>> {
    return this.createOkResponse(await this.service.saveConfiguration(teamId, request));
  }

  @Get('history')
  @ApiOperation({ summary: 'Read the complete bounded history of completed Journey attempts.' })
  @ApiTeamIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: CompletedJourneyHistoryResponseModel, notFound: true })
  async history(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Query('lang') lang = 'en',
  ): Promise<ResponseObject<CompletedJourneyHistoryDataModel>> {
    return this.createOkResponse(await this.service.history(teamId, lang));
  }
}
