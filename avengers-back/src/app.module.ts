import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BasicModule } from './basic/basic.module';
import { TeamModule } from './team/team.module';
import { JourneyModule } from './journey/journey.module';
import { FinalBattleModule } from './final-battle/final-battle.module';
import { ResultsModule } from './results/results.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BasicModule,
    TeamModule,
    JourneyModule,
    FinalBattleModule,
    ResultsModule,
  ],
})
export class AppModule {}
