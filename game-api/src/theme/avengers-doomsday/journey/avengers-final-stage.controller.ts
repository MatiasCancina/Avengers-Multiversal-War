import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  CompletedFinalStateModel,
  CompletedFinalTeamsDataModel,
  FinalStageEventsDataModel,
  DoomsdayFinalStateModel,
  DoomsdayFinalTeamsDataModel,
  FinalStageEventsResponseModel,
  FinalStageStateResponseModel,
  FinalStageTeamsResponseModel,
  TournamentFinalStateModel,
  TournamentFinalTeamsDataModel,
} from './model/avengers-public-final-stage.model';
import { ResponseObject } from '../../../basic/response-object.model';

@ApiTags('Final Stage')
@ApiExtraModels(
  TournamentFinalStateModel,
  DoomsdayFinalStateModel,
  CompletedFinalStateModel,
  TournamentFinalTeamsDataModel,
  DoomsdayFinalTeamsDataModel,
  CompletedFinalTeamsDataModel,
)
@Controller('teams/:teamId/journeys/:attemptId/final-stage')
export class AvengersFinalStageController extends AbstractController {
  constructor(private readonly service: AvengersJourneyService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Read narrative-safe FinalStage lifecycle and phase state.',
    description: 'The response contains only facts available in the current lifecycle state.',
  })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({
    type: FinalStageStateResponseModel,
    notFound: true,
    conflictCodes: ['JOURNEY_REQUIRED', 'VERSION_UNSUPPORTED'],
  })
  async state(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
    @Query('lang') lang = 'en',
  ): Promise<
    ResponseObject<TournamentFinalStateModel | DoomsdayFinalStateModel | CompletedFinalStateModel>
  > {
    return this.createOkResponse(await this.service.finalState(teamId, attemptId, lang));
  }

  @Get('teams')
  @ApiOperation({
    summary: 'Read FinalStage combatant state.',
    description: 'The response contains combatants available in the current lifecycle state.',
  })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiPublicResponses({
    type: FinalStageTeamsResponseModel,
    notFound: true,
    conflictCode: 'FINAL_STAGE_NOT_ACTIVE',
  })
  async teams(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
  ): Promise<
    ResponseObject<
      TournamentFinalTeamsDataModel | DoomsdayFinalTeamsDataModel | CompletedFinalTeamsDataModel
    >
  > {
    return this.createOkResponse(await this.service.finalTeams(teamId, attemptId));
  }

  @Get('events')
  @ApiOperation({ summary: 'Read ordered localized combat and canonical narrative events.' })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: FinalStageEventsResponseModel, notFound: true })
  async events(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
    @Query('lang') lang = 'en',
  ): Promise<ResponseObject<FinalStageEventsDataModel>> {
    return this.createOkResponse(await this.service.finalEvents(teamId, attemptId, lang));
  }
}
