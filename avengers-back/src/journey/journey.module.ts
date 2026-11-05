import { Module } from '@nestjs/common';
import { SimulateJourneyController } from './simulate-journey/simulate-journey.controller';
import { SimulateJourneyService } from './simulate-journey/simulate-journey.service';
import { TeamJourneyController } from './team-journey/team-journey.controller';
import { TeamJourneyService } from './team-journey/team-journey.service';
import { GroupStageController } from './group-stage/group-stage.controller';
import { GroupStageService } from './group-stage/group-stage.service';
import { KnockoutStageController } from './knockout-stage/knockout-stage.controller';
import { KnockoutStageService } from './knockout-stage/knockout-stage.service';

@Module({
  controllers: [
    SimulateJourneyController,
    TeamJourneyController,
    GroupStageController,
    KnockoutStageController,
  ],
  providers: [SimulateJourneyService, TeamJourneyService, GroupStageService, KnockoutStageService],
})
export class JourneyModule {}
