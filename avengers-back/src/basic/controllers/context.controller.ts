import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../abstract.controller';
import { ResponseObject } from '../response-object.interface';
import { ApplicationContextService } from '../services/application-context.service';
import { ApplicationContextModel } from '../model/application-context.model';

@ApiTags('Application Context')
@Controller('context')
export class ContextController extends AbstractController {
  constructor(private readonly contextService: ApplicationContextService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Read the fixed BFF startup application context.' })
  async context(): Promise<ResponseObject<ApplicationContextModel>> {
    return this.createOkResponse(await this.contextService.context());
  }
}
