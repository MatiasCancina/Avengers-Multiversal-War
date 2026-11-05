import { Module } from '@nestjs/common';
import { FinalStageService } from '../../final-stage/final-stage.service';
import {
  AVENGERS_FINAL_STAGE_SERVICE,
  AvengersBattleRepository,
} from './repository/avengers-battle.repository';
import { AvengersBattleService } from './avengers-battle.service';
import { AvengersActions } from './avengers-actions.service';
import { AvengersCatalog } from './avengers-catalog.service';
import { AvengersCombat } from './avengers-combat.service';
import { AvengersConfig } from './avengers-config.service';
import { AvengersDoom } from './avengers-doom.service';
import { AvengersEvents } from './avengers-events.service';
import { AvengersGameEngine } from './avengers-game-engine';
import { AvengersNarrative } from './avengers-narrative.service';
import { AvengersOpponentAi } from './avengers-opponent-ai.service';
import { AvengersRandom } from './abstract-avengers-random.provider';
import { SeededAvengersRandom } from './seeded-avengers-random.provider';
import { AvengersRules } from './avengers-rules.service';
import { AvengersState } from './avengers-state.service';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { AvengersMechanics } from './combat/avengers-mechanics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamProfileEntity } from '../../teams/entity/team-profile.entity';
import { JourneyAttemptEntity } from '../../journey/entity/journey-attempt.entity';
import { AvengersHeroEntity } from './catalog/entity/avengers-hero.entity';
import { AvengersNarrativeCharacterEntity } from './catalog/entity/avengers-narrative-character.entity';
import { AvengersHeroRepository } from './catalog/repository/avengers-hero.repository';
import { AvengersHeroMetadataMapper } from './catalog/mapper/avengers-hero-metadata.mapper';
import { AvengersCatalogQueryService } from './catalog/avengers-catalog-query.service';
import { AvengersCatalogController } from './catalog/avengers-catalog.controller';
import { TeamProfileRepository } from '../../teams/repository/team-profile.repository';
import { AvengersJourneyConfig } from './journey/avengers-journey-config.service';
import { AvengersJourneyRandom } from './journey/avengers-journey-random';
import { AvengersTournamentGenerator } from './journey/avengers-tournament-generator.service';
import { AvengersEncounterSimulator } from './journey/avengers-encounter-simulator.service';
import { AvengersJourneySimulator } from './journey/avengers-journey-simulator.service';
import { AvengersJourneyMetadataMapper } from './journey/mapper/avengers-journey-metadata.mapper';
import { AvengersStatisticsService } from './journey/avengers-statistics.service';
import { AvengersJourneyService } from './journey/avengers-journey.service';
import { AvengersJourneyController } from './journey/avengers-journey.controller';
import { AvengersJourneyDiagnostics } from './journey/avengers-journey-diagnostics.service';
import { AvengersTeamsCatalogController } from './catalog/avengers-teams-catalog.controller';
import { AvengersReferenceController } from './catalog/avengers-reference.controller';
import { AvengersTeamJourneyController } from './journey/avengers-team-journey.controller';
import { AvengersFinalStageController } from './journey/avengers-final-stage.controller';
import { AvengersCurrentFinalStageController } from './journey/avengers-current-final-stage.controller';
import { AvengersStatisticsController } from './journey/avengers-statistics.controller';
import { AvengersPublicLocalization } from './public/avengers-public-localization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeamProfileEntity,
      JourneyAttemptEntity,
      AvengersHeroEntity,
      AvengersNarrativeCharacterEntity,
    ]),
  ],
  controllers: [
    AvengersCatalogController,
    AvengersTeamsCatalogController,
    AvengersReferenceController,
    AvengersTeamJourneyController,
    AvengersJourneyController,
    AvengersCurrentFinalStageController,
    AvengersFinalStageController,
    AvengersStatisticsController,
  ],
  providers: [
    AvengersConfig,
    AvengersCatalog,
    AvengersMechanics,
    AvengersRules,
    AvengersEvents,
    AvengersNarrative,
    AvengersActions,
    AvengersCombat,
    AvengersDoom,
    AvengersOpponentAi,
    AvengersState,
    AvengersGameEngine,
    { provide: AvengersRandom, useClass: SeededAvengersRandom },
    AvengersBattleRepository,
    {
      provide: AVENGERS_FINAL_STAGE_SERVICE,
      useFactory: (engine: AvengersGameEngine, repository: AvengersBattleRepository) =>
        new FinalStageService<AvengersTurnData>(engine, repository),
      inject: [AvengersGameEngine, AvengersBattleRepository],
    },
    AvengersBattleService,
    TeamProfileRepository,
    AvengersHeroRepository,
    AvengersHeroMetadataMapper,
    AvengersCatalogQueryService,
    AvengersJourneyConfig,
    AvengersJourneyRandom,
    AvengersTournamentGenerator,
    AvengersEncounterSimulator,
    AvengersJourneySimulator,
    AvengersJourneyMetadataMapper,
    AvengersStatisticsService,
    AvengersJourneyService,
    AvengersJourneyDiagnostics,
    AvengersPublicLocalization,
  ],
  exports: [
    AvengersGameEngine,
    AvengersBattleService,
    AvengersNarrative,
    AvengersCatalog,
    AvengersMechanics,
    AvengersConfig,
    AvengersCatalogQueryService,
    AvengersJourneyService,
  ],
})
export class AvengersModule {}
