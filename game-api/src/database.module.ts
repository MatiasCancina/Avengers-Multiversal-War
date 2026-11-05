import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { TeamProfileEntity } from './teams/entity/team-profile.entity';
import { JourneyAttemptEntity } from './journey/entity/journey-attempt.entity';
import { AvengersHeroEntity } from './theme/avengers-doomsday/catalog/entity/avengers-hero.entity';
import { AvengersNarrativeCharacterEntity } from './theme/avengers-doomsday/catalog/entity/avengers-narrative-character.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const database = config.get<string>('DB_DATABASE', 'database/game-api.sqlite');

        if (database !== ':memory:') {
          mkdirSync(dirname(resolve(database)), { recursive: true });
        }

        return {
          type: 'sqlite',
          database,
          entities: [
            TeamProfileEntity,
            JourneyAttemptEntity,
            AvengersHeroEntity,
            AvengersNarrativeCharacterEntity,
          ],
          // Schema synchronization is limited to this development sample.
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
