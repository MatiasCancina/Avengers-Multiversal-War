import { ApiProperty } from '@nestjs/swagger';
import { ResponseMessageModel } from './error-response.model';

export abstract class SuccessResponseModel {
  @ApiProperty({ type: String, format: 'date-time', example: '2026-09-19T15:40:12.000Z' })
  serverTime!: string;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ResponseMessageModel })
  responseMessage!: ResponseMessageModel;
}

export class LocalizedCodeModel {
  @ApiProperty({ example: 'BALANCED' })
  code!: string;

  @ApiProperty({ example: 'Balanced' })
  label!: string;

  @ApiProperty({ example: 'Balances offense, defense, and resource preservation.' })
  description!: string;
}
