import { Injectable } from '@nestjs/common';
import { InMemoryFinalStageRepository } from '../../../final-stage/repository/in-memory-final-stage.repository';
import { AvengersTurnData } from '../model/avengers-turn-data.model';

export const AVENGERS_FINAL_STAGE_SERVICE = Symbol('AVENGERS_FINAL_STAGE_SERVICE');

@Injectable()
export class AvengersBattleRepository extends InMemoryFinalStageRepository<AvengersTurnData> {}
