import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database.module';
import { FinalStageModule } from './final-stage/final-stage.module';
import { JourneyModule } from './journey/journey.module';
import { StrategiesModule } from './strategies/strategies.module';
import { TeamsModule } from './teams/teams.module';
import { AvengersModule } from './theme/avengers-doomsday/avengers.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    TeamsModule,
    JourneyModule,
    StrategiesModule,
    FinalStageModule,
    AvengersModule,
    HealthModule,
  ],
})
export class AppModule {}
