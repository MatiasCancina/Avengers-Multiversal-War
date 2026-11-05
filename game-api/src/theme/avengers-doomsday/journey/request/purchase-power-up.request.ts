import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchasePowerUpRequest {
  @ApiProperty({ example: 'revive' })
  @IsString()
  itemId!: string;

  @ApiProperty({
    minimum: 1,
    description: 'Any positive integer; Store gameplay has no arbitrary quantity cap.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}
