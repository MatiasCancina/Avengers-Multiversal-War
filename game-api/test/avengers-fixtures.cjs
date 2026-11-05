const { ConfigService } = require('@nestjs/config');
const root = '../dist/theme/avengers-doomsday/';
const load = (file, name) => require(root + file)[name];
const AvengersConfig = load('avengers-config.service', 'AvengersConfig');
const AvengersCatalog = load('avengers-catalog.service', 'AvengersCatalog');
const AvengersRules = load('avengers-rules.service', 'AvengersRules');
const AvengersEvents = load('avengers-events.service', 'AvengersEvents');
const AvengersActions = load('avengers-actions.service', 'AvengersActions');
const AvengersCombat = load('avengers-combat.service', 'AvengersCombat');
const AvengersDoom = load('avengers-doom.service', 'AvengersDoom');
const AvengersOpponentAi = load('avengers-opponent-ai.service', 'AvengersOpponentAi');
const AvengersState = load('avengers-state.service', 'AvengersState');
const AvengersGameEngine = load('avengers-game-engine', 'AvengersGameEngine');
const AvengersNarrative = load('avengers-narrative.service', 'AvengersNarrative');
const { SeededAvengersRandom } = require(root + 'seeded-avengers-random.provider');
const S = require(root + 'model/avengers-strategy.enum').AvengersStrategy;
const inventory = () => [
  {
    id: 'revive',
    name: 'Phoenix Reserve',
    target: 'HERO',
    quantity: 1,
    effect: { type: 'REVIVE' },
  },
  {
    id: 'energy',
    name: 'Energy Reserve',
    target: 'HERO',
    quantity: 1,
    effect: { type: 'ENERGY', percent: 20 },
  },
  {
    id: 'ap',
    name: 'Focus Reserve',
    target: 'HERO',
    quantity: 1,
    effect: { type: 'AP', amount: 20 },
  },
  {
    id: 'boost',
    name: 'Power Surge',
    target: 'TEAM',
    quantity: 1,
    effect: { type: 'BOOST', stat: 'power', percent: 20, duration: 2 },
  },
  {
    id: 'team',
    name: 'Unity Reserve',
    target: 'TEAM',
    quantity: 1,
    effect: { type: 'EXTRA_TEAM_ACTION' },
  },
  {
    id: 'leader',
    name: 'Resolve Reserve',
    target: 'TEAM',
    quantity: 1,
    effect: { type: 'EXTRA_LEADER_ABILITY' },
  },
];
function setup(seed = 123) {
  return {
    player: {
      teamId: 'spider-man-team',
      activeHeroIds: ['doctor-strange', 'sue-storm'],
      benchHeroIds: ['hulk', 'iron-man', 'captain-america'],
      strategy: S.PRAGMATIC,
    },
    opponent: {
      teamId: 'iron-man-team',
      activeHeroIds: ['wolverine', 'scarlet-witch'],
      benchHeroIds: ['hulk', 'doctor-strange', 'sue-storm'],
      strategy: S.PRAGMATIC,
    },
    inventory: [],
    seed,
  };
}
class ControlledRandom extends SeededAvengersRandom {
  constructor(value = 0, queue = []) {
    super();
    this.value = value;
    this.queue = [...queue];
  }
  next(data) {
    super.next(data);
    return this.queue.length ? this.queue.shift() : this.value;
  }
}
function toolkit(options = {}) {
  const overrides = options.overrides ?? {};
  const config = new AvengersConfig(
    new ConfigService({
      DOOM_LOW_INTERVENTION_PROBABILITY: 0,
      DOOM_MEDIUM_INTERVENTION_PROBABILITY: 0,
      DOOM_HIGH_INTERVENTION_PROBABILITY: 0,
      DOOM_CRITICAL_INTERVENTION_PROBABILITY: 0,
      ...overrides,
    }),
  );
  const random = options.random ?? new ControlledRandom();
  const catalog = new AvengersCatalog();
  const rules = new AvengersRules(catalog, config);
  const events = new AvengersEvents(catalog);
  const actions = new AvengersActions(catalog, rules);
  const combat = new AvengersCombat(catalog, config, rules, random, events, actions);
  const doom = new AvengersDoom(config, events, combat, rules, random);
  const ai = new AvengersOpponentAi(actions, combat, rules, random);
  const state = new AvengersState(catalog, config, rules);
  const engine = new AvengersGameEngine(actions, combat, config, rules, events, ai, doom, random);
  return {
    config,
    random,
    catalog,
    rules,
    events,
    actions,
    combat,
    doom,
    ai,
    state,
    engine,
    narrative: new AvengersNarrative(),
  };
}
function knockOut(team) {
  team.vacantActiveHeroIds = team.heroes
    .filter((hero) => hero.status === 'ACTIVE')
    .map((hero) => hero.heroId);
  team.heroes.forEach((hero) => {
    hero.currentEnergy = 0;
    hero.condition = 'KNOCKED_OUT';
    hero.status = 'INACTIVE';
  });
}
async function started(tool, options = {}) {
  const input = options.setup ?? setup();
  const ready = tool.state.ready(input);
  if (options.quiet !== false) {
    knockOut(ready.data.opponent);
  }
  const state = await tool.engine.play({ current: ready, command: { type: 'START' } });
  if (options.actOne === true) {
    return state;
  }
  state.data.phase = 'DOOMSDAY';
  state.data.revealOccurred = true;
  state.data.doom = {
    maxEnergy: tool.config.balance.doomMaxEnergy,
    currentEnergy: tool.config.balance.doomMaxEnergy,
    threatLevel: 'LOW',
  };
  tool.actions.refresh(state.data, state.turn);
  return state;
}
function select(tool, state, type, match = {}) {
  tool.actions.refresh(state.data, state.turn);
  return state.data.availableActions.find(
    (action) =>
      action.type === type && Object.entries(match).every(([key, value]) => action[key] === value),
  );
}
async function choose(tool, state, type, match = {}) {
  const action = select(tool, state, type, match);
  if (!action) {
    throw new Error(`Missing ${type} option: ${JSON.stringify(match)}`);
  }
  return tool.engine.play({
    current: state,
    command: { type: 'CHOOSE_ACTION', actionId: action.id },
  });
}
module.exports = {
  toolkit,
  setup,
  inventory,
  started,
  select,
  choose,
  knockOut,
  ControlledRandom,
  SeededAvengersRandom,
  S,
};
