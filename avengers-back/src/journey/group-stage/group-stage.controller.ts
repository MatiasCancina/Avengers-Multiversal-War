import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { GroupStageModel } from './model/group-stage.model';
import { GroupStageService } from './group-stage.service';

@ApiTags('group-stage')
@Controller('journey/group-stage')
export class GroupStageController extends AbstractController {
  constructor(private readonly groupStageService: GroupStageService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Get the current Journey group stage standings' })
  async getGroupStage(): Promise<ResponseObject<GroupStageModel>> {
    return this.createOkResponse(await this.groupStageService.getGroupStage());
  }
}