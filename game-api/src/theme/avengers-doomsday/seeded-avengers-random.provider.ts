import { Injectable } from '@nestjs/common';
import { AvengersRandom } from './abstract-avengers-random.provider';
import { AvengersTurnData } from './model/avengers-turn-data.model';

/** RNG state travels with combat state, making replay independent of other battles. */
@Injectable()
export class SeededAvengersRandom extends AvengersRandom {
  override next(state: AvengersTurnData): number {
    let value = state.randomState >>> 0;
    if (!value) {
      value = 0x9e3779b9;
    }
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    state.randomState = value >>> 0;
    return state.randomState / 4294967296;
  }
}
