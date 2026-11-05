import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JourneySpendingStrategy } from '../model/journey-spending-strategy.enum';

export class SimulateJourneyRequest {
  @ApiProperty({ enum: JourneySpendingStrategy, example: JourneySpendingStrategy.BALANCED })
  @IsEnum(JourneySpendingStrategy)
  spendingStrategy!: JourneySpendingStrategy;
}
