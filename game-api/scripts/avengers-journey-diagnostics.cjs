const { writeFileSync } = require('node:fs');
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const {
  AvengersJourneyDiagnostics,
} = require('../dist/theme/avengers-doomsday/journey/avengers-journey-diagnostics.service');

const seeds = Number(process.argv[2] ?? 100);
const output = process.argv[3];
if (!Number.isInteger(seeds) || seeds < 1) {
  throw new Error('Seeds per configuration must be a positive integer.');
}
(async () => {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const report = await app.get(AvengersJourneyDiagnostics).run(seeds, true);
    const json = JSON.stringify(report, null, 2) + '\n';
    if (output) {
      writeFileSync(output, json);
    }
    process.stdout.write(json);
  } finally {
    await app.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
