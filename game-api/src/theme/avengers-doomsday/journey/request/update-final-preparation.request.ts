import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AvengersStrategy } from '../../model/avengers-strategy.enum';

export class UpdateFinalPreparationRequest {
  @ApiProperty({
    type: [String],
    minItems: 3,
    maxItems: 3,
    description: 'Exactly three ACTIVE Hero ids, including the assigned Leader.',
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  activeHeroIds!: string[];

  @ApiProperty({ enum: AvengersStrategy })
  @IsEnum(AvengersStrategy)
  strategy!: AvengersStrategy;
}
