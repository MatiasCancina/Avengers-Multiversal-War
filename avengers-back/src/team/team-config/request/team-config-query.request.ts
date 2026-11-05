import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';
import { CombatStrategy } from 'src/basic/model/game-api/team-configuration.model';

export const COMBAT_STRATEGIES: CombatStrategy[] = ['AGGRESSIVE', 'DEFENSIVE', 'BALANCED', 'PRAGMATIC'];

export class SaveTeamConfigRequest {
  @ApiProperty({
    type: [String],
    minItems: 5,
    maxItems: 5,
    example: ['hulk', 'thor', 'vision', 'loki', 'wasp'],
    description: 'Exactly five companion Hero ids.',
  })
  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  companionIds: string[];

  @ApiProperty({
    type: [String],
    minItems: 3,
    maxItems: 3,
    example: ['black-widow', 'hulk', 'thor'],
    description: 'Exactly three active Hero ids, including the Leader.',
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  activeHeroIds: string[];

  @ApiProperty({ enum: COMBAT_STRATEGIES, example: 'BALANCED' })
  @IsIn(COMBAT_STRATEGIES)
  strategy: CombatStrategy;
}