import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../../basic/abstract.controller';
import { PublicIdPipe } from '../../../basic/public-id.pipe';
import {
  ApiLanguageQuery,
  ApiPublicResponses,
  ApiTeamIdParam,
} from '../../../basic/public-api.decorators';
import { ResponseObject } from '../../../basic/response-object.model';
import { AvengersJourneyService } from './avengers-journey.service';
import { AvengersFinalStageCommandMapper } from './mapper/avengers-final-stage-command.mapper';
import {
  FinalStageEventsResponseModel,
  FinalStageStateResponseModel,
  FinalStageTeamsResponseModel,
  LegalFinalStageActionsResponseModel,
  PlayFinalStageResponseModel,
} from './model/avengers-public-final-stage.model';
import { PlayFinalStageRequest } from './request/play-final-stage.request';

@ApiTags('Final Stage')
@Controller('teams/:teamId/journeys/current/final-stage')
export class AvengersCurrentFinalStageController extends AbstractController {
  constructor(private readonly service: AvengersJourneyService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Read the current FinalStage state.' })
  @ApiTeamIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: FinalStageStateResponseModel, notFound: true })
  async state(@Param('teamId', PublicIdPipe) teamId: string, @Query('lang') lang = 'en') {
    return this.createOkResponse(
      await this.service.finalState(teamId, await this.service.currentAttemptId(teamId), lang),
    );
  }

  @Get('teams')
  @ApiOperation({ summary: 'Read current FinalStage combatants.' })
  @ApiTeamIdParam()
  @ApiPublicResponses({ type: FinalStageTeamsResponseModel, notFound: true })
  async teams(@Param('teamId', PublicIdPipe) teamId: string) {
    return this.createOkResponse(
      await this.service.finalTeams(teamId, await this.service.currentAttemptId(teamId)),
    );
  }

  @Get('actions')
  @ApiOperation({
    summary: 'Read all currently legal actions, optionally filtered by actionCode.',
    description:
      'Each actionId is opaque and valid only for the current authoritative state. A filter selects from the same legal set.',
  })
  @ApiTeamIdParam()
  @ApiLanguageQuery()
  @ApiQuery({
    name: 'actionCode',
    required: false,
    type: String,
    description:
      'Optional action family. Unknown or currently unavailable codes yield an empty list.',
  })
  @ApiPublicResponses({ type: LegalFinalStageActionsResponseModel, notFound: true })
  async actions(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Query('lang') lang = 'en',
    @Query('actionCode') actionCode?: string,
  ) {
    return this.createOkResponse(
      await this.service.finalActions(
        teamId,
        await this.service.currentAttemptId(teamId),
        lang,
        actionCode,
      ),
    );
  }

  @Get('events')
  @ApiOperation({ summary: 'Read current FinalStage events.' })
  @ApiTeamIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: FinalStageEventsResponseModel, notFound: true })
  async events(@Param('teamId', PublicIdPipe) teamId: string, @Query('lang') lang = 'en') {
    return this.createOkResponse(
      await this.service.finalEvents(teamId, await this.service.currentAttemptId(teamId), lang),
    );
  }

  @Post('play')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Start, execute a selected legal action, or abandon the current FinalStage.',
  })
  @ApiTeamIdParam()
  @ApiLanguageQuery()
  @ApiBody({
    type: PlayFinalStageRequest,
    examples: {
      START: { summary: 'Start the Final', value: { type: 'START' } },
      CHOOSE_ACTION: {
        summary: 'Execute one action returned by GET actions',
        value: { type: 'CHOOSE_ACTION', actionId: '<exact opaque actionId from GET actions>' },
      },
      ABANDON: { summary: 'Abandon the Final', value: { type: 'ABANDON' } },
    },
  })
  @ApiPublicResponses({
    type: PlayFinalStageResponseModel,
    notFound: true,
    conflictCode: 'INVALID_LIFECYCLE',
    unprocessableCode: 'INVALID_FINAL_ACTION',
  })
  async play(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Body() request: PlayFinalStageRequest,
    @Query('lang') lang = 'en',
  ): Promise<ResponseObject<unknown>> {
    const command = AvengersFinalStageCommandMapper.toCommand(request);
    return this.createOkResponse(
      await this.service.play(teamId, await this.service.currentAttemptId(teamId), command, lang),
    );
  }
}
