import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { TeamJourneyModel } from './model/team-journey.model';
import { TeamEncounterDetailModel } from './model/team-encounter-detail.model';
import { TeamJourneyService } from './team-journey.service';

@ApiTags('Team Journey')
@Controller('journey/team')
export class TeamJourneyController extends AbstractController {
  constructor(private readonly teamJourneyService: TeamJourneyService) {
    super();
  }

  @Get('encounters')
  @ApiOperation({
    summary: 'Read the Journey path of the configured Team.',
    description:
      'Returns the player encounters in chronological order plus the pending or completed Final when the Team reached it.',
  })
  @ApiOkResponse({
    description: 'Team Journey path with player encounters and the optional Final stop.',
    schema: {
      example: {
        serverTime: '2026-10-21T12:00:00.000Z',
        success: true,
        responseMessage: { messageCode: '0000', message: 'OK' },
        data: {
          attemptId: 'journey-1',
          playerTeamId: 'spider-man',
          stops: [
            {
              kind: 'ENCOUNTER',
              encounterId: 'gs-01',
              stageId: 'group-a',
              stageCode: 'GROUP_STAGE',
              groupId: 'A',
              resolutionCode: 'NORMAL',
              opponentTeamId: 'black-panther',
              opponentTeamName: 'Black Panther',
              outcome: 'WIN',
              damageDealt: 184,
              rivalEncounter: true,
              finalStageStatus: null,
            },
            {
              kind: 'FINAL',
              encounterId: null,
              stageId: null,
              stageCode: 'FINAL_STAGE',
              groupId: null,
              resolutionCode: null,
              opponentTeamId: 'doom',
              opponentTeamName: 'Doom',
              outcome: 'PENDING',
              damageDealt: null,
              rivalEncounter: null,
              finalStageStatus: 'READY',
            },
          ],
          progress: { played: 1, wins: 1, draws: 0, losses: 0 },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'The configured Team has no current Journey.' })
  @ApiBadGatewayResponse({ description: 'The Game API is unavailable.' })
  async getTeamJourney(): Promise<ResponseObject<TeamJourneyModel>> {
    return this.createOkResponse(await this.teamJourneyService.getTeamJourney());
  }

  @Get('encounters/:encounterId')
  @ApiOperation({
    summary: 'Read one encounter of the configured Team Journey.',
    description:
      'Returns the encounter rounds, active heroes, localized events and narrative lines. Only encounters that involve the configured Team are exposed.',
  })
  @ApiParam({
    name: 'encounterId',
    required: true,
    description: 'Opaque encounter identifier published by the Game API.',
    example: 'qf-01',
  })
  @ApiOkResponse({
    description: 'Factual encounter detail with rounds and localized events.',
    schema: {
      example: {
        serverTime: '2026-10-21T12:00:00.000Z',
        success: true,
        responseMessage: { messageCode: '0000', message: 'OK' },
        data: {
          encounterId: 'qf-01',
          stageId: 'quarterfinal',
          stageCode: 'QUARTERFINAL',
          groupId: null,
          teamAId: 'spider-man',
          teamBId: 'black-panther',
          winnerTeamId: 'spider-man',
          resolutionCode: 'NORMAL',
          rivalEncounter: false,
          outcome: 'WIN',
          damageDealt: 184,
          rounds: [
            {
              number: 1,
              roundType: 'NORMAL',
              initiativeTeamId: 'spider-man',
              initiativeTeamName: 'Spider-Man',
              winnerTeamId: 'spider-man',
              winnerTeamName: 'Spider-Man',
              damageByTeam: [
                { teamId: 'spider-man', teamName: 'Spider-Man', damageDealt: 62 },
                { teamId: 'black-panther', teamName: 'Black Panther', damageDealt: 41 },
              ],
              activeHeroesByTeam: [
                {
                  teamId: 'spider-man',
                  teamName: 'Spider-Man',
                  heroes: [{ heroId: 'spider-man', heroName: 'Spider-Man' }],
                },
              ],
              events: [
                {
                  sequence: 12,
                  eventCode: 'DAMAGE',
                  teamId: 'spider-man',
                  teamName: 'Spider-Man',
                  actorHeroId: 'spider-man',
                  actorHeroName: 'Spider-Man',
                  targetHeroIds: ['black-panther'],
                  targetHeroNames: ['Black Panther'],
                  messageCode: 'journey.damage',
                  amount: 62,
                  narrativeLines: [
                    {
                      lineSequence: 1,
                      type: 'NARRATION',
                      speakerId: null,
                      speakerName: null,
                      text: 'Spider-Man hits Black Panther.',
                    },
                  ],
                },
              ],
            },
          ],
          extraRound: null,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description:
      'The encounter does not exist, is not part of the current Journey or does not involve the configured Team.',
  })
  @ApiBadGatewayResponse({ description: 'The Game API is unavailable.' })
  async getEncounterDetail(
    @Param('encounterId') encounterId: string,
  ): Promise<ResponseObject<TeamEncounterDetailModel>> {
    return this.createOkResponse(await this.teamJourneyService.getEncounterDetail(encounterId));
  }
}
