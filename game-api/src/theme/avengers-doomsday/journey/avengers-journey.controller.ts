import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
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
  CurrentJourneyDataModel,
  CurrentJourneyResponseModel,
  EncounterDetailModel,
  EncounterDetailResponseModel,
  EncounterSummaryDataModel,
  EncounterSummaryResponseModel,
  InventoryDataModel,
  InventoryResponseModel,
  JourneyEventsDataModel,
  JourneyEventsResponseModel,
  JourneyStagesDataModel,
  JourneyStagesResponseModel,
  JourneySummaryModel,
  JourneySummaryResponseModel,
  PurchasePowerUpResultModel,
  PurchasePowerUpResponseModel,
  RewardAccountDataModel,
  RewardAccountResponseModel,
  SimulateJourneyResultModel,
  SimulateJourneyResponseModel,
  TournamentTeamsDataModel,
  TournamentTeamsResponseModel,
  UpdateFinalPreparationResultModel,
  UpdateFinalPreparationResponseModel,
  UsePreparationItemResultModel,
  UsePreparationItemResponseModel,
} from './model/avengers-public-journey.model';
import { ResponseObject } from '../../../basic/response-object.model';
import { PurchasePowerUpRequest } from './request/purchase-power-up.request';
import { SimulateJourneyRequest } from './request/simulate-journey.request';
import { UpdateFinalPreparationRequest } from './request/update-final-preparation.request';
import { UsePowerUpRequest } from './request/use-power-up.request';

@ApiTags('Journey')
@Controller('teams/:teamId/journeys')
export class AvengersJourneyController extends AbstractController {
  constructor(private readonly service: AvengersJourneyService) {
    super();
  }

  @Get('current')
  @ApiOperation({
    summary: 'Read the nullable current Journey reference.',
    description:
      'Returns lifecycle, revision, and bounded progress counts without persisted metadata.',
  })
  @ApiTeamIdParam()
  @ApiPublicResponses({ type: CurrentJourneyResponseModel, notFound: true })
  async current(
    @Param('teamId', PublicIdPipe) teamId: string,
  ): Promise<ResponseObject<CurrentJourneyDataModel>> {
    return this.createOkResponse(await this.service.current(teamId));
  }

  @Get('current/teams')
  @ApiOperation({ summary: 'Read Teams in the current Journey.' })
  @ApiTeamIdParam()
  @ApiPublicResponses({ type: TournamentTeamsResponseModel, notFound: true })
  async currentTeams(@Param('teamId', PublicIdPipe) teamId: string) {
    return this.createOkResponse(
      await this.service.teams(teamId, await this.service.currentAttemptId(teamId)),
    );
  }

  @Get('current/stages')
  @ApiOperation({ summary: 'Read stages in the current Journey.' })
  @ApiTeamIdParam()
  @ApiPublicResponses({ type: JourneyStagesResponseModel, notFound: true })
  async currentStages(@Param('teamId', PublicIdPipe) teamId: string) {
    return this.createOkResponse(
      await this.service.stages(teamId, await this.service.currentAttemptId(teamId)),
    );
  }

  @Get('current/encounters')
  @ApiOperation({ summary: 'Read encounters in the current Journey.' })
  @ApiTeamIdParam()
  @ApiQuery({ name: 'stageId', required: false })
  @ApiPublicResponses({ type: EncounterSummaryResponseModel, notFound: true })
  async currentEncounters(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.createOkResponse(
      await this.service.encounters(teamId, await this.service.currentAttemptId(teamId), stageId),
    );
  }

  @Get('current/encounters/:encounterId')
  @ApiOperation({ summary: 'Read one encounter in the current Journey.' })
  @ApiTeamIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: EncounterDetailResponseModel, notFound: true })
  async currentEncounter(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('encounterId', PublicIdPipe) encounterId: string,
    @Query('lang') lang = 'en',
  ) {
    return this.createOkResponse(
      await this.service.encounter(
        teamId,
        await this.service.currentAttemptId(teamId),
        encounterId,
        lang,
      ),
    );
  }

  @Get('current/events')
  @ApiOperation({ summary: 'Read events in the current Journey.' })
  @ApiTeamIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: JourneyEventsResponseModel, notFound: true })
  async currentEvents(@Param('teamId', PublicIdPipe) teamId: string, @Query('lang') lang = 'en') {
    return this.createOkResponse(
      await this.service.events(teamId, await this.service.currentAttemptId(teamId), lang),
    );
  }

  @Get('current/rewards')
  @ApiOperation({ summary: 'Read rewards in the current Journey.' })
  @ApiTeamIdParam()
  @ApiPublicResponses({ type: RewardAccountResponseModel, notFound: true })
  async currentRewards(@Param('teamId', PublicIdPipe) teamId: string) {
    return this.createOkResponse(
      await this.service.rewards(teamId, await this.service.currentAttemptId(teamId)),
    );
  }

  @Get('current/inventory')
  @ApiOperation({ summary: 'Read inventory in the current Journey.' })
  @ApiTeamIdParam()
  @ApiPublicResponses({ type: InventoryResponseModel, notFound: true })
  async currentInventory(@Param('teamId', PublicIdPipe) teamId: string) {
    return this.createOkResponse(
      await this.service.inventory(teamId, await this.service.currentAttemptId(teamId)),
    );
  }

  @Post('simulate')
  @ApiOperation({
    summary: 'Synchronously create or replace a complete Journey.',
    description: 'Game API owns concurrency and cannot replace an active FinalStage.',
  })
  @ApiTeamIdParam()
  @ApiBody({
    type: SimulateJourneyRequest,
    examples: {
      SIMULATE: { summary: 'Simulate Journey', value: { spendingStrategy: 'BALANCED' } },
    },
  })
  @ApiPublicResponses({
    type: SimulateJourneyResponseModel,
    created: true,
    notFound: true,
    conflictCodes: ['STATE_CONFLICT', 'JOURNEY_LOCKED'],
    unprocessableCode: 'INVALID_TEAM_CONFIGURATION',
  })
  async simulate(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Body() request: SimulateJourneyRequest,
  ): Promise<ResponseObject<SimulateJourneyResultModel>> {
    const model = await this.service.simulate(teamId, request);
    return this.createOkResponse(model);
  }

  @Get(':attemptId')
  @ApiOperation({
    summary: 'Read a safe Journey summary.',
    description:
      'Never exposes RNG state, internal snapshots, AI reasoning, diagnostics, or hidden narrative state.',
  })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiPublicResponses({
    type: JourneySummaryResponseModel,
    notFound: true,
    conflictCode: 'VERSION_UNSUPPORTED',
  })
  async journey(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
  ): Promise<ResponseObject<JourneySummaryModel>> {
    return this.createOkResponse(await this.service.journey(teamId, attemptId));
  }

  @Get(':attemptId/teams')
  @ApiOperation({ summary: 'Read bounded attempt-local tournament Team state.' })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiPublicResponses({
    type: TournamentTeamsResponseModel,
    notFound: true,
    conflictCode: 'VERSION_UNSUPPORTED',
  })
  async teams(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
  ): Promise<ResponseObject<TournamentTeamsDataModel>> {
    return this.createOkResponse(await this.service.teams(teamId, attemptId));
  }

  @Get(':attemptId/stages')
  @ApiOperation({ summary: 'Read official standings, qualification, bracket, and finalist facts.' })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiPublicResponses({
    type: JourneyStagesResponseModel,
    notFound: true,
    conflictCode: 'VERSION_UNSUPPORTED',
  })
  async stages(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
  ): Promise<ResponseObject<JourneyStagesDataModel>> {
    return this.createOkResponse(await this.service.stages(teamId, attemptId));
  }

  @Get(':attemptId/encounters')
  @ApiOperation({ summary: 'Read bounded Encounter summaries, optionally filtered by stage.' })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiQuery({ name: 'stageId', required: false, example: 'quarterfinal' })
  @ApiPublicResponses({ type: EncounterSummaryResponseModel, notFound: true })
  async encounters(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
    @Query('stageId') stageId?: string,
  ): Promise<ResponseObject<EncounterSummaryDataModel>> {
    return this.createOkResponse(await this.service.encounters(teamId, attemptId, stageId));
  }

  @Get(':attemptId/encounters/:encounterId')
  @ApiOperation({ summary: 'Read one Encounter with rounds, facts, and localized events.' })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiParam({
    name: 'encounterId',
    description: 'Encounter identifier returned by the Journey Encounter summaries.',
    example: 'encounter-group-a-1',
  })
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: EncounterDetailResponseModel, notFound: true })
  async encounter(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
    @Param('encounterId', PublicIdPipe) encounterId: string,
    @Query('lang') lang = 'en',
  ): Promise<ResponseObject<EncounterDetailModel>> {
    return this.createOkResponse(
      await this.service.encounter(teamId, attemptId, encounterId, lang),
    );
  }

  @Get(':attemptId/events')
  @ApiOperation({ summary: 'Read the ordered localized cross-Journey event timeline.' })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiLanguageQuery()
  @ApiPublicResponses({ type: JourneyEventsResponseModel, notFound: true })
  async events(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
    @Query('lang') lang = 'en',
  ): Promise<ResponseObject<JourneyEventsDataModel>> {
    return this.createOkResponse(await this.service.events(teamId, attemptId, lang));
  }

  @Get(':attemptId/rewards')
  @ApiOperation({ summary: 'Read authoritative Reward Point account and ledger facts.' })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiPublicResponses({ type: RewardAccountResponseModel, notFound: true })
  async rewards(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
  ): Promise<ResponseObject<RewardAccountDataModel>> {
    return this.createOkResponse(await this.service.rewards(teamId, attemptId));
  }

  @Get(':attemptId/inventory')
  @ApiOperation({ summary: 'Read authoritative owned item quantities and legal use contexts.' })
  @ApiTeamIdParam()
  @ApiAttemptIdParam()
  @ApiPublicResponses({ type: InventoryResponseModel, notFound: true })
  async inventory(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Param('attemptId', PublicIdPipe) attemptId: string,
  ): Promise<ResponseObject<InventoryDataModel>> {
    return this.createOkResponse(await this.service.inventory(teamId, attemptId));
  }

  @Post('current/purchases')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atomically purchase a positive quantity at captured Store prices.' })
  @ApiTeamIdParam()
  @ApiBody({
    type: PurchasePowerUpRequest,
    examples: {
      PURCHASE: { summary: 'Purchase one Power-Up', value: { itemId: 'ap-major', quantity: 1 } },
    },
  })
  @ApiPublicResponses({
    type: PurchasePowerUpResponseModel,
    notFound: true,
    conflictCodes: ['STATE_CONFLICT', 'STORE_CLOSED', 'INSUFFICIENT_REWARD_POINTS'],
    unprocessableCode: 'POWER_UP_UNAVAILABLE',
  })
  async purchase(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Body() request: PurchasePowerUpRequest,
  ): Promise<ResponseObject<PurchasePowerUpResultModel>> {
    return this.createOkResponse(
      await this.service.purchase(teamId, await this.service.currentAttemptId(teamId), request),
    );
  }

  @Post('current/preparation/items')
  @HttpCode(200)
  @ApiOperation({ summary: 'Use one owned preparation item when its effect is legal and useful.' })
  @ApiTeamIdParam()
  @ApiBody({
    type: UsePowerUpRequest,
    examples: {
      HERO: {
        summary: 'Use an individual item',
        value: { itemId: 'ap-major', targetHeroId: 'kitty-pryde' },
      },
      TEAM: { summary: 'Use an Active Team item', value: { itemId: 'power-boost-all' } },
    },
  })
  @ApiPublicResponses({
    type: UsePreparationItemResponseModel,
    notFound: true,
    conflictCodes: ['STATE_CONFLICT', 'STORE_CLOSED'],
    unprocessableCode: 'POWER_UP_UNAVAILABLE',
  })
  async useItem(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Body() request: UsePowerUpRequest,
  ): Promise<ResponseObject<UsePreparationItemResultModel>> {
    return this.createOkResponse(
      await this.service.usePowerUp(teamId, await this.service.currentAttemptId(teamId), request),
    );
  }

  @Put('current/preparation')
  @ApiOperation({ summary: 'Update PRE_FINAL Strategy and formation without changing members.' })
  @ApiTeamIdParam()
  @ApiBody({
    type: UpdateFinalPreparationRequest,
    examples: {
      PREPARE: {
        summary: 'Prepare the Final',
        value: {
          activeHeroIds: ['spider-man', 'scarlet-witch', 'punisher'],
          strategy: 'DEFENSIVE',
        },
      },
    },
  })
  @ApiPublicResponses({
    type: UpdateFinalPreparationResponseModel,
    notFound: true,
    conflictCodes: ['STATE_CONFLICT', 'INVALID_LIFECYCLE'],
    unprocessableCode: 'INVALID_TEAM_CONFIGURATION',
  })
  async updatePreparation(
    @Param('teamId', PublicIdPipe) teamId: string,
    @Body() request: UpdateFinalPreparationRequest,
  ): Promise<ResponseObject<UpdateFinalPreparationResultModel>> {
    return this.createOkResponse(
      await this.service.updatePreparation(
        teamId,
        await this.service.currentAttemptId(teamId),
        request,
      ),
    );
  }
}
