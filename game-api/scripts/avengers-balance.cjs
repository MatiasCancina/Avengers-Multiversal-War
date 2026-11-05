const { AvengersBalanceSimulation } = require('../dist/theme/avengers-doomsday/balance-simulation');
const count = Number(process.argv[2] ?? 100);
new AvengersBalanceSimulation(process.env)
  .run(count, 1000)
  .then((report) => process.stdout.write(JSON.stringify(report, null, 2) + '\n'))
  .catch((error) => {
    process.stderr.write(error.stack + '\n');
    process.exitCode = 1;
  });
