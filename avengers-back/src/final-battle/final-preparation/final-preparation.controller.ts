import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { FinalPreparationPageData, FinalPreparationService } from './final-preparation.service';

@ApiTags('final-preparation')
@Controller('final-stage/preparation')
export class FinalPreparationController extends AbstractController {
  constructor(private readonly finalpreparationService: FinalPreparationService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Get authoritative data needed to prepare the Final.' })
  async getPreparation(): Promise<ResponseObject<FinalPreparationPageData>> {
    return this.createOkResponse(await this.finalpreparationService.getPreparation());
  }

  @Get('power-ups')
  @ApiOperation({ summary: 'Get the list of power-ups available for the final battle.' })
  async getPowerUps(): Promise<ResponseObject<unknown>> {
    return this.createOkResponse(await this.finalpreparationService.getPowerUps());
  }

  @Put()
  @ApiOperation({ summary: 'Update the three Active Heroes and Combat Strategy.' })
  async updatePreparation(
    @Body() body: { activeHeroIds: string[]; strategy: string },
  ): Promise<ResponseObject<unknown>> {
    return this.createOkResponse(await this.finalpreparationService.updatePreparation(body));
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase a Power-Up using authoritative Reward Points.' })
  async purchase(
    @Body() body: { itemId: string; quantity: number },
  ): Promise<ResponseObject<unknown>> {
    return this.createOkResponse(await this.finalpreparationService.purchase(body));
  }

  @Post('use-item')
  @ApiOperation({ summary: 'Use an owned preparation item on a legal target.' })
  async useItem(
    @Body() body: { itemId: string; targetHeroId?: string },
  ): Promise<ResponseObject<unknown>> {
    return this.createOkResponse(await this.finalpreparationService.useItem(body));
  }
}
