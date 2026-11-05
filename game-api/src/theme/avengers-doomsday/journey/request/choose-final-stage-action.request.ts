import { ApiProperty } from '@nestjs/swagger';

export class ChooseFinalStageActionRequest {
  @ApiProperty({ enum: ['CHOOSE_ACTION'], example: 'CHOOSE_ACTION' })
  type!: 'CHOOSE_ACTION';

  @ApiProperty({
    example: '<actionId from the latest GET actions>',
    description: 'Opaque. Return exactly the selected actionId; do not construct or parse it.',
  })
  actionId!: string;
}
