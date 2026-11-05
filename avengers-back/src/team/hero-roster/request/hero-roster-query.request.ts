import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const HERO_ROSTER_ROLE_CODES = [
  'ALL',
  'AGILE',
  'WARRIOR',
  'MYSTIC',
  'TECH',
  'SUPPORT',
] as const;

export type HeroRosterRole = (typeof HERO_ROSTER_ROLE_CODES)[number];

export class HeroRosterQueryRequest {
  @ApiPropertyOptional({
    example: 'spider-man',
    maxLength: 60,
    description: 'Search Hero display names or canonical ids.',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  searchTerm?: string;

  @ApiPropertyOptional({ enum: HERO_ROSTER_ROLE_CODES, default: 'ALL' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsIn(HERO_ROSTER_ROLE_CODES)
  role?: HeroRosterRole;
}
