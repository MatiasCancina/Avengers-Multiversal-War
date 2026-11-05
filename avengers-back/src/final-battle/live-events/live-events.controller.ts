import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LiveEventsService } from './live-events.service';
import { LiveEventsModel } from './model/live-events.model';
import { ResponseObject } from '../../basic/response-object.interface';
import { AbstractController } from '../../basic/abstract.controller';

@ApiTags('Live Events')
@Controller('final-stage/events')
export class LiveEventsController extends AbstractController {
  constructor(private readonly liveEventsService: LiveEventsService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Get the live events for the final stage of the current journey.',
  })
  async getLiveEvents(
  ): Promise<ResponseObject<LiveEventsModel>> {
    return this.createOkResponse(await this.liveEventsService.getLiveEvents());
  }
}
