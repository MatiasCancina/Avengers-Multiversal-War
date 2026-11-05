import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamConfigService } from './team-config.service';
import { AbstractController } from 'src/basic/abstract.controller';
import { ResponseObject } from 'src/basic/response-object.interface';
import { TeamConfigModel, TeamConfigSaveModel } from './model/team-config.model';
import { SaveTeamConfigRequest } from './request/team-config-query.request';

@ApiTags('Team Configuration')
@Controller('my-team/configuration')
export class TeamConfigController extends AbstractController {
  constructor(private readonly teamconfigService: TeamConfigService) {
    super();
  }
  
  @Get()
  @ApiOperation({
    summary: 'Get your team configuration'
  })
  async getConfiguration(): Promise<ResponseObject<TeamConfigModel>> {
    return this.createOkResponse(await this.teamconfigService.getConfiguration());
  }

  @Put()
  @ApiOperation({
    summary: 'Save your team configuration',
  })
  async saveConfiguration(@Body() configuration: SaveTeamConfigRequest)
    : Promise<ResponseObject<TeamConfigSaveModel>> {
    return this.createOkResponse(await this.teamconfigService.saveConfiguration(configuration));
  }
}
