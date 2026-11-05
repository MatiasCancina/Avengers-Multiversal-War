import { SwaggerThemeNameEnum } from 'swagger-themes';
import { resolveFinalBattleDifficulty } from '../theme/avengers-doomsday/model/final-battle-difficulty-profile.model';

export function validateEnvironment(values: Record<string, unknown>): Record<string, unknown> {
  const port = Number(values.APP_PORT ?? 5102);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('APP_PORT must be an integer between 1 and 65535.');
  }

  const basePath = String(values.APP_BASE_PATH ?? 'game')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(basePath)) {
    throw new Error('APP_BASE_PATH must contain non-empty URL path segments.');
  }

  const logLevel = String(values.APP_LOG_LEVEL ?? 'log');
  if (!['error', 'warn', 'log', 'debug', 'verbose'].includes(logLevel)) {
    throw new Error('APP_LOG_LEVEL must be error, warn, log, debug, or verbose.');
  }

  const swaggerTheme = String(values.SWAGGER_THEME ?? SwaggerThemeNameEnum.CLASSIC);
  if (!Object.values(SwaggerThemeNameEnum).some((name) => name === swaggerTheme)) {
    throw new Error('SWAGGER_THEME must be a supported swagger-themes theme name.');
  }

  const database = String(values.DB_DATABASE ?? 'database/game-api.sqlite').trim();
  if (!database) {
    throw new Error('DB_DATABASE must not be empty.');
  }

  const difficultyProfile = resolveFinalBattleDifficulty(values);
  const customPercent = values.FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT ?? 0.4;

  return {
    ...values,
    APP_PORT: port,
    APP_BASE_PATH: basePath,
    APP_LOG_LEVEL: logLevel,
    SWAGGER_THEME: swaggerTheme,
    DB_DATABASE: database,
    FINAL_BATTLE_DIFFICULTY: difficultyProfile.preset,
    FINAL_BATTLE_DIFFICULTY_CUSTOM: difficultyProfile.custom,
    FINAL_BATTLE_DIFFICULTY_CUSTOM_PERCENT: customPercent,
  };
}
