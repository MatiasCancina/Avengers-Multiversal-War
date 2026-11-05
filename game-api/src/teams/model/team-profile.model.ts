import { ApiProperty } from '@nestjs/swagger';

export class TeamProfileModel {
  @ApiProperty({ example: 'spider-man' })
  id!: string;

  @ApiProperty({ example: 'Spider-Man Team' })
  name!: string;

  @ApiProperty({ example: 'The assigned Multiversal Tournament team led by Spider-Man.' })
  description!: string;
}
