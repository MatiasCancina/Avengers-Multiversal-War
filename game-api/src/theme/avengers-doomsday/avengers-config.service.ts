import { AvengersBalance } from './model/avengers-balance.model';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BossThreatLevel } from './model/boss-threat-level.enum';
import {
  FinalBattleDifficultyProfile,
  resolveFinalBattleDifficulty,
} from './model/final-battle-difficulty-profile.model';

export const DEFAULT_AVENGERS_BALANCE: AvengersBalance = {
  baseAttackDamage: 50,
  basicAttackApRecovery: 10,
  swapCooldown: 1,
  maxTeamActions: 3,
  maxLeaderUses: 2,
  maxStrategyChanges: 3,
  strategyCooldown: 2,
  doomMaxEnergy: 750,
  reviveEnergyPercent: 40,
  reviveApPercent: 25,
  doomThresholds: [75, 50, 25],
  doomScaling: { LOW: 1, MEDIUM: 1.1, HIGH: 1.2, CRITICAL: 1.35, DEFEATED: 0 },
  doomProbability: { LOW: 0.1, MEDIUM: 0.25, HIGH: 0.5, CRITICAL: 0.75, DEFEATED: 0 },
  hitBase: 0.8,
  hitMinimum: 0.55,
  hitMaximum: 0.95,
  resistanceMitigation: 0.45,
  randomVariation: 0.05,
  specialMultiplier: 1.4,
  specialTeamMultiplier: 1.25,
  teamActionMultiplier: 1.9,
  rivalryModifier: 0.06,
  roleCoverageBonus: 3,
  finalAttackBaseChance: 0.5,
  synergyModifiers: { LOW: -0.08, MEDIUM: 0, HIGH: 0.04, EXCELLENT: 0.08 },
  strategyModifiers: {
    AGGRESSIVE: { power: 0.1, ability: 0.05, agility: 0, resistance: -0.08 },
    DEFENSIVE: { power: -0.07, ability: 0, agility: 0, resistance: 0.12 },
    BALANCED: { power: 0.03, ability: 0.03, agility: 0.03, resistance: 0.03 },
    PRAGMATIC: { power: 0, ability: 0, agility: 0.03, resistance: 0 },
  },
  leaderCompatibility: { HIGH: 1.2, MEDIUM: 1, LOW: 0.7 },
  excellentTeamActionBonus: 0.1,
  teamRoleCoverageBonus: 0.04,
};

export function readAvengersBalance(values: Record<string, unknown>): AvengersBalance {
  const result = structuredClone(DEFAULT_AVENGERS_BALANCE);
  const number = (
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
    integer = false,
  ): number => {
    const value = Number(values[key] ?? fallback);
    if (
      !Number.isFinite(value) ||
      value < minimum ||
      value > maximum ||
      (integer && !Number.isInteger(value))
    ) {
      throw new Error(
        `${key} must be ${integer ? 'an integer' : 'a number'} between ${minimum} and ${maximum}.`,
      );
    }
    return value;
  };
  result.baseAttackDamage = number('BASE_ATTACK_DAMAGE', result.baseAttackDamage, 1, 500);
  result.specialTeamMultiplier = number(
    'OFFENSIVE_SPECIAL_TEAM_MULTIPLIER',
    result.specialTeamMultiplier,
    0.5,
    2,
  );
  result.basicAttackApRecovery = number(
    'BASIC_ATTACK_AP_RECOVERY',
    result.basicAttackApRecovery,
    0,
    100,
    true,
  );
  result.swapCooldown = number('MEMBER_SWAP_COOLDOWN_TURNS', result.swapCooldown, 1, 10, true);
  result.maxTeamActions = number('MAX_TEAM_ACTIONS', result.maxTeamActions, 0, 20, true);
  result.maxLeaderUses = number('MAX_LEADER_ABILITY_USES', result.maxLeaderUses, 0, 20, true);
  result.maxStrategyChanges = number(
    'MAX_STRATEGY_CHANGES',
    result.maxStrategyChanges,
    0,
    20,
    true,
  );
  result.strategyCooldown = number(
    'STRATEGY_CHANGE_COOLDOWN_TURNS',
    result.strategyCooldown,
    1,
    10,
    true,
  );
  result.doomMaxEnergy = number('DOOM_MAX_ENERGY', result.doomMaxEnergy, 1, 10000, true);
  result.reviveEnergyPercent = number('REVIVE_ENERGY_PERCENT', result.reviveEnergyPercent, 1, 100);
  result.reviveApPercent = number('REVIVE_AP_PERCENT', result.reviveApPercent, 0, 100);
  const threats = [
    BossThreatLevel.LOW,
    BossThreatLevel.MEDIUM,
    BossThreatLevel.HIGH,
    BossThreatLevel.CRITICAL,
  ];
  for (const threat of threats) {
    result.doomProbability[threat] = number(
      `DOOM_${threat}_INTERVENTION_PROBABILITY`,
      result.doomProbability[threat],
      0,
      1,
    );
    result.doomScaling[threat] = number(
      `DOOM_${threat}_DAMAGE_MULTIPLIER`,
      result.doomScaling[threat],
      1,
      3,
    );
  }
  result.doomThresholds = [
    number('DOOM_MEDIUM_ENERGY_THRESHOLD', 75, 1, 99),
    number('DOOM_HIGH_ENERGY_THRESHOLD', 50, 1, 99),
    number('DOOM_CRITICAL_ENERGY_THRESHOLD', 25, 1, 99),
  ];
  if (
    !(
      result.doomThresholds[0] > result.doomThresholds[1] &&
      result.doomThresholds[1] > result.doomThresholds[2]
    )
  ) {
    throw new Error('Doom Energy thresholds must be strictly descending.');
  }
  for (let i = 1; i < threats.length; i++) {
    if (
      result.doomProbability[threats[i]] < result.doomProbability[threats[i - 1]] ||
      result.doomScaling[threats[i]] < result.doomScaling[threats[i - 1]]
    ) {
      throw new Error('Doom probabilities and scaling must not decrease with threat.');
    }
  }
  return result;
}

@Injectable()
export class AvengersConfig {
  readonly balance: AvengersBalance;

  readonly finalBattleDifficulty: FinalBattleDifficultyProfile;

  constructor(config: ConfigService) {
    const keys = [
      'BASE_ATTACK_DAMAGE',
      'OFFENSIVE_SPECIAL_TEAM_MULTIPLIER',
      'BASIC_ATTACK_AP_RECOVERY',
      'MEMBER_SWAP_COOLDOWN_TURNS',
      'MAX_TEAM_ACTIONS',
      'MAX_LEADER_ABILITY_USES',
      'MAX_STRATEGY_CHANGES',
      'STRATEGY_CHANGE_COOLDOWN_TURNS',
      'DOOM_MAX_ENERGY',
      'REVIVE_ENERGY_PERCENT',
      'REVIVE_AP_PERCENT',
      'DOOM_MEDIUM_ENERGY_THRESHOLD',
      'DOOM_HIGH_ENERGY_THRESHOLD',
      'DOOM_CRITICAL_ENERGY_THRESHOLD',
    ];
    for (const level of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) {
      keys.push(`DOOM_${level}_INTERVENTION_PROBABILITY`, `DOOM_${level}_DAMAGE_MULTIPLIER`);
    }
    this.balance = readAvengersBalance(
      Object.fromEntries(keys.map((key) => [key, config.get<unknown>(key)])),
    );
    this.finalBattleDifficulty = resolveFinalBattleDifficulty({
      FINAL_BATTLE_DIFFICULTY: config.get<unknown>('FINAL_BATTLE_DIFFICULTY'),
      FINAL_BATTLE_DIFFICULTY_CUSTOM: config.get<unknown>('FINAL_BATTLE_DIFFICULTY_CUSTOM'),
      FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT: config.get<unknown>(
        'FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT',
      ),
    });
  }
}
