import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { HistoryRivalsService } from './history-rivals.service';

@ApiTags('History and Rivals')
@Controller('my-team/history-rivals')
export class HistoryRivalsController extends AbstractController {
  constructor(private readonly feature: HistoryRivalsService) {
    super();
  }

  @Get()
  async read(@Query('attemptId') attemptId?: string) {
    return this.createOkResponse(await this.feature.read(attemptId));
  }
}
