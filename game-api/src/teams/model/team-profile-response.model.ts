import { ApiProperty } from '@nestjs/swagger';
import { ResponseObject } from '../../basic/response-object.model';
import { TeamProfileModel } from './team-profile.model';

export class TeamProfileResponseMessageModel {
  @ApiProperty({ example: '0000' })
  messageCode!: string;

  @ApiProperty({ example: 'OK' })
  message!: string;
}

export class TeamProfileResponseModel implements ResponseObject<TeamProfileModel> {
  @ApiProperty({ type: String, format: 'date-time' })
  serverTime!: string;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: TeamProfileResponseMessageModel })
  responseMessage!: TeamProfileResponseMessageModel;

  @ApiProperty({ type: TeamProfileModel })
  data!: TeamProfileModel;
}
