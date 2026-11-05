import { AvengersTurnData } from './model/avengers-turn-data.model';

export abstract class AvengersRandom {
  abstract next(state: AvengersTurnData): number;
}
