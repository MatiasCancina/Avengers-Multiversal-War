import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AwardsService } from './awards.service';
import { AbstractController } from 'src/basic/abstract.controller';
import { ResponseObject } from 'src/basic/response-object.interface';
import { AwardsModel } from '../model/results.model';

@ApiTags('Awards')
@Controller('results/awards')
export class AwardsController extends AbstractController {
  constructor(private readonly awardsService: AwardsService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Get the awards for the current journey.',
  })
  async getAwards(): Promise<ResponseObject<AwardsModel>> {
    return this.createOkResponse(await this.awardsService.getAwards());
  }
}
