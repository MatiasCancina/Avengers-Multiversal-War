import { IsIn, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type FinalStagePlayType = 'START' | 'CHOOSE_ACTION' | 'ABANDON';

export class PlayFinalStageRequest {
  @ApiProperty({ enum: ['START', 'CHOOSE_ACTION', 'ABANDON'] })
  @IsIn(['START', 'CHOOSE_ACTION', 'ABANDON'])
  type!: FinalStagePlayType;

  @ApiPropertyOptional({ description: 'Required only for CHOOSE_ACTION. Exact opaque actionId from GET /final-stage.' })
  @ValidateIf((request: PlayFinalStageRequest) => request.type === 'CHOOSE_ACTION')
  @IsString()
  @IsNotEmpty()
  actionId?: string;
}