import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AvengersJourneyBalance } from './model/avengers-journey-metadata.model';

@Injectable()
export class AvengersJourneyConfig {
  readonly balance: AvengersJourneyBalance;

  constructor(config: ConfigService) {
    const integer = (key: string, fallback: number, minimum: number): number => {
      const value = Number(config.get<unknown>(key) ?? fallback);
      if (!Number.isInteger(value) || value < minimum) {
        throw new Error(`${key} must be an integer >= ${minimum}.`);
      }
      return value;
    };
    const fraction = (key: string, fallback: number): number => {
      const value = Number(config.get<unknown>(key) ?? fallback);
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(`${key} must be between 0 and 1.`);
      }
      return value;
    };
    const percent = (key: string, fallback: number): number => {
      const value = Number(config.get<unknown>(key) ?? fallback);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error(`${key} must be between 0 and 100.`);
      }
      return value;
    };
    const boolean = (key: string, fallback: boolean): boolean => {
      const raw = config.get<unknown>(key);
      if (raw === undefined) {
        return fallback;
      }
      if (raw === true || raw === 'true') {
        return true;
      }
      if (raw === false || raw === 'false') {
        return false;
      }
      throw new Error(`${key} must be true or false.`);
    };
    const min = fraction('PLAYER_JOURNEY_MIN_WIN_PERCENTAGE', 0.5);
    const max = fraction('PLAYER_JOURNEY_MAX_WIN_PERCENTAGE', 0.6);
    if (min > max) {
      throw new Error(
        'PLAYER_JOURNEY_MIN_WIN_PERCENTAGE must not exceed PLAYER_JOURNEY_MAX_WIN_PERCENTAGE.',
      );
    }
    const stageEnergy = percent('JOURNEY_STAGE_RECOVERY_ENERGY_PERCENT', 100);
    const finalEnergy = percent('FINAL_STAGE_RECOVERY_ENERGY_PERCENT', 100);
    const stageRevive = boolean('JOURNEY_STAGE_RECOVERY_REVIVE_ALL', true);
    const finalRevive = boolean('FINAL_STAGE_RECOVERY_REVIVE_ALL', true);
    if (stageRevive && stageEnergy <= 0) {
      throw new Error('Journey recovery Energy must be positive when revive-all is enabled.');
    }
    if (finalRevive && finalEnergy <= 0) {
      throw new Error('Final recovery Energy must be positive when revive-all is enabled.');
    }
    this.balance = {
      encounterMaxRounds: integer('JOURNEY_ENCOUNTER_MAX_ROUNDS', 4, 1),
      playerMinWinPercentage: min,
      playerMaxWinPercentage: max,
      rewards: {
        win: integer('JOURNEY_REWARD_WIN', 20, 0),
        draw: integer('JOURNEY_REWARD_DRAW', 10, 0),
        loss: integer('JOURNEY_REWARD_LOSS', 5, 0),
        rivalWin: integer('JOURNEY_REWARD_RIVAL_WIN_BONUS', 10, 0),
        totalKoWin: integer('JOURNEY_REWARD_TOTAL_KO_BONUS', 10, 0),
      },
      progression: {
        baseChance: fraction('JOURNEY_STAT_GAIN_BASE_CHANCE', 0.4),
        amount: integer('JOURNEY_STAT_GAIN_AMOUNT', 1, 1),
        statMax: integer('JOURNEY_BASE_STAT_MAX', 100, 1),
      },
      stageRecovery: {
        energyPercent: stageEnergy,
        apPercent: percent('JOURNEY_STAGE_RECOVERY_AP_PERCENT', 100),
        reviveAll: stageRevive,
        clearEffects: boolean('JOURNEY_STAGE_RECOVERY_CLEAR_EFFECTS', true),
      },
      finalRecovery: {
        energyPercent: finalEnergy,
        apPercent: percent('FINAL_STAGE_RECOVERY_AP_PERCENT', 100),
        reviveAll: finalRevive,
        clearEffects: boolean('FINAL_STAGE_RECOVERY_CLEAR_EFFECTS', true),
      },
    };
    if (this.balance.progression.statMax > 100) {
      throw new Error('JOURNEY_BASE_STAT_MAX cannot exceed the established 0-100 scale.');
    }
  }
}
