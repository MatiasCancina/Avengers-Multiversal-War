import { AvengersStrategy as S } from '../model/avengers-strategy.enum';
import { BattleSetup } from '../model/battle-setup.model';
import { PowerUpItem } from '../model/power-up.model';

export const SAMPLE_INVENTORY: PowerUpItem[] = [
  {
    id: 'energy-reserve',
    name: 'Energy Reserve',
    target: 'HERO',
    quantity: 1,
    effect: { type: 'ENERGY', percent: 20 },
  },
  {
    id: 'focus-reserve',
    name: 'Focus Reserve',
    target: 'HERO',
    quantity: 1,
    effect: { type: 'AP', amount: 20 },
  },
  {
    id: 'power-surge',
    name: 'Power Surge',
    target: 'TEAM',
    quantity: 1,
    effect: { type: 'BOOST', stat: 'power', percent: 20, duration: 2 },
  },
  {
    id: 'phoenix-reserve',
    name: 'Phoenix Reserve',
    target: 'HERO',
    quantity: 1,
    effect: { type: 'REVIVE' },
  },
  {
    id: 'unity-reserve',
    name: 'Unity Reserve',
    target: 'TEAM',
    quantity: 1,
    effect: { type: 'EXTRA_TEAM_ACTION' },
  },
  {
    id: 'resolve-reserve',
    name: 'Resolve Reserve',
    target: 'TEAM',
    quantity: 1,
    effect: { type: 'EXTRA_LEADER_ABILITY' },
  },
];

/** Already configured FinalStage fixtures; no Journey or purchase simulation. */
export function sampleBattle(seed = 123): BattleSetup {
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
