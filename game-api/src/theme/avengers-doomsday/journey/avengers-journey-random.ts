import { Injectable } from '@nestjs/common';

export interface JourneyRandomState {
  value: number;
}

@Injectable()
export class AvengersJourneyRandom {
  next(state: JourneyRandomState): number {
    let x = state.value >>> 0 || 0x9e3779b9;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    state.value = x >>> 0;
    return state.value / 0x100000000;
  }

  integer(state: JourneyRandomState, maxExclusive: number): number {
    return Math.floor(this.next(state) * maxExclusive);
  }

  shuffle<T>(state: JourneyRandomState, values: T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const selected = this.integer(state, index + 1);
      [result[index], result[selected]] = [result[selected], result[index]];
    }
    return result;
  }

  weighted<T>(state: JourneyRandomState, values: T[], weight: (value: T) => number): T {
    const weights = values.map((value) => Math.max(0, weight(value)));
    let roll = this.next(state) * weights.reduce((sum, value) => sum + value, 0);
    for (let index = 0; index < values.length; index += 1) {
      roll -= weights[index];
      if (roll < 0) {
        return values[index];
      }
    }
    return values[values.length - 1];
  }
}
