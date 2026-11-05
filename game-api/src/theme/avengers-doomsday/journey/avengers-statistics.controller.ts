import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../../basic/abstract.controller';
import { PublicIdPipe } from '../../../basic/public-id.pipe';
import {
  ApiAttemptIdParam,
  ApiLanguageQuery,
  ApiPublicResponses,
  ApiTeamIdParam,
} from '../../../basic/public-api.decorators';
import { AvengersJourneyService } from './avengers-journey.service';
import {
  CompetitionStatisticsDataModel,
  CompetitionStatisticsResponseModel,
} from './model/avengers-public-statistics.model';
import { ResponseObject } from '../../../basic/response-object.model';

@ApiTags('Statistics')
@Controller('teams/:teamId/journeys')
export class AvengersStatisticsController extends AbstractController {
  constructor(private readonly service: AvengersJourneyService) {
    super();
  }

  @Get('current/statistics')
  @ApiOperation({ summary: 'Read statistics for the current completed Journey.' })
  @ApiTeamIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: CompetitionStatisticsResponseModel, notFound: true })
  async currentStatistics(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Query('lang') lang = 'en',
  ): Promise<ResponseObject<CompetitionStatisticsDataModel>> {
    return this.createOkResponse(
      await this.service.statisticsView(teamId, await this.service.currentAttemptId(teamId), lang),
    );
  }

  @Get(':attemptId/statistics')
  @ApiOperation({
    summary: 'Read completed competition statistics and four official Award decisions.',
    description:
      'Available after VICTORY, DEFEAT, or ABANDON. The Game API owns eligibility and winners.',
  })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({
    type: CompetitionStatisticsResponseModel,
    notFound: true,
    conflictCodes: ['STATISTICS_UNAVAILABLE', 'VERSION_UNSUPPORTED'],
  })
  async statistics(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
    @Query('lang') lang = 'en',
  ): Promise<ResponseObject<CompetitionStatisticsDataModel>> {
    return this.createOkResponse(await this.service.statisticsView(teamId, attemptId, lang));
  }
}
