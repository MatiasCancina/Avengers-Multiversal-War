

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import {
  TeamStatusModel,
  TeamStatusService,
} from './team-status.service';

@ApiTags('team-status')
@Controller('final-stage/status')
export class TeamStatusController extends AbstractController {
  constructor(
    private readonly teamStatusService: TeamStatusService,
  ) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Get the public status of the current Final Stage teams.',
  })
  async getStatus(): Promise<ResponseObject<TeamStatusModel>> {
    return this.createOkResponse(
      await this.teamStatusService.getStatus(),
    );
  }
}


