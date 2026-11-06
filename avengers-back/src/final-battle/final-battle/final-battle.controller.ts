import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinalBattleService } from './final-battle.service';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { FinalBattleModel, FinalBattlePlayResultModel } from './model/final-battle.model';
import { PlayFinalStageRequest } from './request/play-final-stage.request';

@ApiTags('Final Battle')
@Controller('final-stage')
export class FinalBattleController extends AbstractController {
  constructor(private readonly finalBattleService: FinalBattleService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Get the final battle',
  })
  async getFinalBattle(): Promise<ResponseObject<FinalBattleModel>> {
    return this.createOkResponse(await this.finalBattleService.getFinalBattle());
  }

  @Post('play')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Start the Final, execute one legal action by its opaque actionId, or abandon it',
  })
  async playFinalBattle(
    @Body() request: PlayFinalStageRequest,
  ): Promise<ResponseObject<FinalBattlePlayResultModel>> {
    return this.createOkResponse(await this.finalBattleService.playFinalBattle(request));
  }
}
