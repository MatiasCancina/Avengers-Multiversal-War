import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { KnockoutStageModel } from './model/knockout-stage.model';
import { KnockoutStageService } from './knockout-stage.service';

@ApiTags('Knockout Stage')
@Controller('journey/knockout-stage')
export class KnockoutStageController extends AbstractController {
  constructor(private readonly knockoutStageService: KnockoutStageService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Read the official knockout bracket of the current Journey.',
  })
  async getKnockoutStage(): Promise<ResponseObject<KnockoutStageModel>> {
    return this.createOkResponse(await this.knockoutStageService.getKnockoutStage());
  }
}
