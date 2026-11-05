import { Module } from '@nestjs/common';
import { SampleGameEngine } from '../theme/sample/sample-game-engine';
import { FinalStageService } from './final-stage.service';
import { GameEngine } from './game-engine';

@Module({
  providers: [
    {
      provide: GameEngine,
      useClass: SampleGameEngine,
    },
    FinalStageService,
  ],
  exports: [FinalStageService],
})
export class FinalStageModule {}
