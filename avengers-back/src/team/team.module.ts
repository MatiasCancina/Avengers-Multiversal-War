import { Module } from '@nestjs/common';
import { HeroRosterController } from './hero-roster/hero-roster.controller';
import { TeamConfigController } from './team-config/team-config.controller';
import { HistoryRivalsController } from './history-rivals/history-rivals.controller';
import { HeroRosterService } from './hero-roster/hero-roster.service';
import { TeamConfigService } from './team-config/team-config.service';
import { HistoryRivalsService } from './history-rivals/history-rivals.service';

@Module({
  controllers: [TeamConfigController, HistoryRivalsController, HeroRosterController],
  providers: [TeamConfigService, HistoryRivalsService, HeroRosterService],
})
export class TeamModule {}
