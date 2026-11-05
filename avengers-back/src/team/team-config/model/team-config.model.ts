import { HeroApi } from '../../../basic/model/game-api/hero-catalog.model';
import { CombatStrategy } from '../../../basic/model/game-api/team-configuration.model';

/** Posición del héroe dentro del equipo. */
export type TeamConfigSlot = 'LEADER' | 'ACTIVE' | 'RESERVE';

/** Héroe que forma parte del equipo (6 en total). */
export interface TeamConfigHeroModel {
  id: string;
  displayName: string;
  roles: HeroApi['roles'];             // { primary: string; secondary: string }
  stats: HeroApi['stats'];             // { power; agility; resistance; ability }
  eligibility: HeroApi['eligibility']; // 'PREFERRED' | 'ELIGIBLE' | 'COMPANION_ONLY'
  slot: TeamConfigSlot;
}

/** Héroe del catálogo, para buscar y elegir reemplazos. */
export interface TeamConfigCatalogHeroModel {
  id: string;
  displayName: string;
  roles: HeroApi['roles'];
  eligibility: HeroApi['eligibility'];
  slot: TeamConfigSlot | null; // null = no está en el equipo
}

/** Estrategia de combate, con la actual marcada. */
export interface TeamConfigStrategyModel {
  code: CombatStrategy;
  label: string;
  description: string;
  selected: boolean;
}

/** Respuesta de GET /my-team/configuration. */
export interface TeamConfigModel {
  teamId: string;
  configured: boolean;
  leader: TeamConfigHeroModel | null;
  activeHeroes: TeamConfigHeroModel[];  // 2 (sin el líder)
  reserveHeroes: TeamConfigHeroModel[]; // 3
  catalog: TeamConfigCatalogHeroModel[];
  strategies: TeamConfigStrategyModel[];
  selectedStrategy: CombatStrategy | null;
  editability: { members: boolean; formation: boolean; strategy: boolean };
  currentAttempt: { attemptId: string; status: string } | null;
}

/** Respuesta de PUT /my-team/configuration. */
export interface TeamConfigSaveModel {
  journeyReplaced: boolean;
  configuration: TeamConfigModel; // el estado recargado, igual que el GET
}