import { ApiProperty } from '@nestjs/swagger';

export class StartFinalStageRequest {
  @ApiProperty({ enum: ['START'], example: 'START' })
  type!: 'START';
}
