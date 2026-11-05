import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlayFinalStageRequest {
  @ApiProperty({
    enum: ['START', 'CHOOSE_ACTION', 'ABANDON'],
    description:
      'FinalStage is interactive: CHOOSE_ACTION forwards one action id from the authoritative availableActions list.',
  })
  @IsIn(['START', 'CHOOSE_ACTION', 'ABANDON'])
  type!: 'START' | 'CHOOSE_ACTION' | 'ABANDON';

  @ApiPropertyOptional({
    description:
      'Required only for CHOOSE_ACTION. The Game API validates legality and targets encoded by the option.',
  })
  @IsOptional()
  @IsString()
  actionId?: string;
}
