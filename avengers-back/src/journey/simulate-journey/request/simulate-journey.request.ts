import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JourneySpendingStrategy } from '../../../basic/model/game-api/journey.model';

export class SimulateJourneyRequest {
  @ApiProperty({ enum: ['SAVE', 'BALANCED', 'AGGRESSIVE'] })
  @IsIn(['SAVE', 'BALANCED', 'AGGRESSIVE'])
  spendingStrategy!: JourneySpendingStrategy;
}
