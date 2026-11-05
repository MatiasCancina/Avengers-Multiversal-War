import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsePowerUpRequest {
  @ApiProperty({ example: 'minor-energy-recovery' })
  @IsString()
  itemId!: string;

  @ApiPropertyOptional({ example: 'doctor-strange' })
  @IsOptional()
  @IsString()
  targetHeroId?: string;
}
