import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { GameApiService } from './game-api.service';
import { GameFeatureApiService } from './game-feature-api.service';
import { ContextController } from './controllers/context.controller';
import { ApplicationContextService } from './services/application-context.service';

@Global()
@Module({
  imports: [HttpModule.register({ timeout: 15000 })],
  controllers: [ContextController],
  providers: [GameApiService, GameFeatureApiService, ApplicationContextService],
  exports: [GameApiService, GameFeatureApiService, ApplicationContextService],
})
export class BasicModule {}
