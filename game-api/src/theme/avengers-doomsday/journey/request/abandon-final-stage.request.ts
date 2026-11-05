import { ApiProperty } from '@nestjs/swagger';

export class AbandonFinalStageRequest {
  @ApiProperty({ enum: ['ABANDON'], example: 'ABANDON' })
  type!: 'ABANDON';
}
