import { Module } from '@nestjs/common';
import { FinalBattleController } from './final-battle/final-battle.controller';
import { FinalBattleService } from './final-battle/final-battle.service';
import { FinalPreparationController } from './final-preparation/final-preparation.controller';
import { FinalPreparationService } from './final-preparation/final-preparation.service';
import { LiveEventsController } from './live-events/live-events.controller';
import { LiveEventsService } from './live-events/live-events.service';
import { TeamStatusController } from './team-status/team-status.controller';
import { TeamStatusService } from './team-status/team-status.service';

@Module({
  controllers: [
    FinalPreparationController,
    FinalBattleController,
    LiveEventsController,
    TeamStatusController,
  ],
  providers: [FinalPreparationService, FinalBattleService, LiveEventsService, TeamStatusService],
})
export class FinalBattleModule {}
