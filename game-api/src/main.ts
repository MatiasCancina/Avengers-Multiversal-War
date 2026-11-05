import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApplication } from './bootstrap';
import { AvengersConfig } from './theme/avengers-doomsday/avengers-config.service';

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  app.enableShutdownHooks();
  const config = app.get(ConfigService);
  const difficulty = app.get(AvengersConfig).finalBattleDifficulty;
  new Logger('FinalBattleDifficulty').log(
    `preset=${difficulty.preset} custom=${difficulty.custom} multiplier=${difficulty.opponentHeroDamageToPlayerMultiplier.toFixed(2)} profile=${difficulty.profileVersion}`,
  );
  await app.listen(
    config.get<number>('APP_PORT', 5102),
    config.get<string>('APP_HOST', '127.0.0.1'),
  );
}

void bootstrap();
