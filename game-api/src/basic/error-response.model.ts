import { ApiProperty } from '@nestjs/swagger';

export class ResponseMessageModel {
  @ApiProperty({ example: 'TEAM_NOT_FOUND' })
  messageCode!: string;

  @ApiProperty({ example: 'Team was not found.' })
  message!: string;
}

export class ErrorResponseModel {
  @ApiProperty({ type: String, format: 'date-time' })
  serverTime!: string;

  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ type: ResponseMessageModel })
  responseMessage!: ResponseMessageModel;

  @ApiProperty({ type: Object, nullable: true, example: null })
  data!: null;
}
