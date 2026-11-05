import { Module } from '@nestjs/common';
import { AwardsController } from './awards/awards.controller';
import { AwardsService } from './awards/awards.service';
import { HistoryController } from './history/history.controller';
import { HistoryService } from './history/history.service';

@Module({
  controllers: [AwardsController, HistoryController],
  providers: [AwardsService, HistoryService],
})
export class ResultsModule {}
