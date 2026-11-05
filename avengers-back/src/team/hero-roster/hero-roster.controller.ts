import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { ResponseObject } from '../../basic/response-object.interface';
import { HeroRosterQueryRequest } from './request/hero-roster-query.request';
import { HeroRosterModel } from './model/hero-roster.model';
import { HeroRosterService } from './hero-roster.service';

@ApiTags('Hero Roster')
@Controller('my-team/heroes')
export class HeroRosterController extends AbstractController {
  constructor(private readonly heroRosterService: HeroRosterService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Search and filter the canonical Hero roster.',
  })
  async getHeroes(
    @Query() request: HeroRosterQueryRequest,
  ): Promise<ResponseObject<HeroRosterModel>> {
    return this.createOkResponse(await this.heroRosterService.getHeroes(request));
  }
}
