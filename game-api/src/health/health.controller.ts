import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../basic/abstract.controller';
import { ApiPublicResponses } from '../basic/public-api.decorators';
import { ResponseObject } from '../basic/response-object.model';
import { HealthDataModel, HealthResponseModel } from './health.model';

@ApiTags('health')
@Controller('health')
export class HealthController extends AbstractController {
  @Get()
  @ApiOperation({ summary: 'Confirm that the Game API process is ready.' })
  @ApiPublicResponses({ type: HealthResponseModel })
  health(): ResponseObject<HealthDataModel> {
    return this.createOkResponse({ status: 'ok', service: 'game-api', version: '0.1.0' });
  }
}
