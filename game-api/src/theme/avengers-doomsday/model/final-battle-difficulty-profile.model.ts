export type FinalBattleDifficultyPreset = 'EASY' | 'NORMAL' | 'HARD';

export interface FinalBattleDifficultyProfile {
  preset: FinalBattleDifficultyPreset | 'LEGACY';
  custom: boolean;
  customPercent: number | null;
  opponentHeroDamageToPlayerMultiplier: number;
  profileVersion: string;
}

export const FINAL_BATTLE_DIFFICULTY_PROFILE_VERSION = 'final-battle-difficulty-v1';

export const LEGACY_FINAL_BATTLE_DIFFICULTY: FinalBattleDifficultyProfile = Object.freeze({
  preset: 'LEGACY',
  custom: false,
  customPercent: null,
  opponentHeroDamageToPlayerMultiplier: 1,
  profileVersion: 'legacy-final-battle-difficulty-v1',
});

const PRESET_MULTIPLIERS: Record<FinalBattleDifficultyPreset, number> = {
  EASY: 0.1,
  NORMAL: 0.5,
  HARD: 1,
};

export function resolveFinalBattleDifficulty(
  values: Record<string, unknown>,
): FinalBattleDifficultyProfile {
  const presetValue = values.FINAL_BATTLE_DIFFICULTY;
  const preset = String(presetValue ?? 'EASY')
    .trim()
    .toUpperCase();
  if (!Object.hasOwn(PRESET_MULTIPLIERS, preset)) {
    throw new Error('FINAL_BATTLE_DIFFICULTY must be EASY, NORMAL, or HARD.');
  }

  const customValue = values.FINAL_BATTLE_DIFFICULTY_CUSTOM;
  const customString = String(customValue ?? 'false')
    .trim()
    .toLowerCase();
  if (!['true', 'false'].includes(customString)) {
    throw new Error('FINAL_BATTLE_DIFFICULTY_CUSTOM must be true or false.');
  }
  const custom = customString === 'true';
  let customPercent: number | null = null;
  if (custom) {
    const percentValue = values.FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT;
    const percentString = String(percentValue ?? '').trim();
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(percentString)) {
      throw new Error(
        'FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT is required and must be a decimal between 0.10 and 1.00 when custom difficulty is enabled.',
      );
    }
    customPercent = Number(percentString);
    if (!Number.isFinite(customPercent) || customPercent < 0.1 || customPercent > 1) {
      throw new Error(
        'FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT must be between 0.10 and 1.00 when custom difficulty is enabled.',
      );
    }
  }

  return Object.freeze({
    preset: preset as FinalBattleDifficultyPreset,
    custom,
    customPercent,
    opponentHeroDamageToPlayerMultiplier: custom
      ? customPercent!
      : PRESET_MULTIPLIERS[preset as FinalBattleDifficultyPreset],
    profileVersion: FINAL_BATTLE_DIFFICULTY_PROFILE_VERSION,
  });
}
