import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { SimulateJourneyRequest } from './request/simulate-journey.request';
import { SimulateJourneyModel } from './model/simulate-journey.model';
import { SimulateJourneyService } from './simulate-journey.service';

@ApiTags('Simulate Journey')
@Controller('journey/simulation')
export class SimulateJourneyController extends AbstractController {
  constructor(private readonly simulateJourneyService: SimulateJourneyService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Compose the current synchronous Journey simulation screen.' })
  async getSimulation(): Promise<ResponseObject<SimulateJourneyModel>> {
    return this.createOkResponse(await this.simulateJourneyService.getSimulation());
  }

  @Post()
  @ApiOperation({ summary: 'Forward one explicit synchronous Journey command.' })
  async simulateJourney(
    @Body() request: SimulateJourneyRequest,
  ): Promise<ResponseObject<SimulateJourneyModel>> {
    return this.createOkResponse(await this.simulateJourneyService.simulateJourney(request));
  }
}
