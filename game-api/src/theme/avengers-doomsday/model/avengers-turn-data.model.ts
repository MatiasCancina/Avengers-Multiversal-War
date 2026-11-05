import { AvengersOutcome } from './avengers-outcome.enum';
import { AvengersTeamState } from './avengers-team-state.model';
import { PowerUpItem } from './power-up.model';
import { DoomState } from './doom-state.model';
import { AvengersAction } from './avengers-action.model';
import { AvengersEvent } from './avengers-event.model';
import { HeroDefinition } from './hero-definition.model';
import { AvengersTeamDefinition } from './avengers-team-definition.model';
import { AvengersFinalStagePhase } from './avengers-final-stage-phase.enum';
import { AvengersEndingCode } from './avengers-ending-code.enum';
import { AvengersTerminalReason } from './avengers-terminal-reason.enum';
import { FinalBattleDifficultyProfile } from './final-battle-difficulty-profile.model';

export interface AvengersBattleContent {
  heroes: Record<string, HeroDefinition>;
  teams: Record<string, AvengersTeamDefinition>;
}

export interface AvengersFinalCycleFact {
  turn: number;
  phase: AvengersFinalStagePhase.TOURNAMENT_FINAL | AvengersFinalStagePhase.DOOMSDAY;
  playerActiveHeroIds: string[];
  opponentActiveHeroIds: string[];
  playerHeroDamage: number;
  opponentHeroDamage: number;
  winnerSide: 'PLAYER' | 'OPPONENT' | null;
}

export interface AvengersTurnData {
  themeId: 'avengers-doomsday';
  player: AvengersTeamState;
  opponent: AvengersTeamState;
  doom: DoomState | null;
  rivalry: boolean;
  inventory: PowerUpItem[];
  phase: AvengersFinalStagePhase;
  revealOccurred: boolean;
  /** True when the normal Act-II phase began with at least one living opponent ally. */
  opponentHadLivingAtActIIStart: boolean;
  /** Idempotence marker for the Act-II Doom-Alone narrative beat. */
  doomAloneNarrativeEmitted: boolean;
  /** Invisible Woman secret-ending lifecycle. */
  sueStormAppealStatus: 'LOCKED' | 'AVAILABLE' | 'LOST' | 'RESOLVED';
  endingCode: AvengersEndingCode | null;
  terminalReasonCode: AvengersTerminalReason | null;
  difficultyProfile: FinalBattleDifficultyProfile;
  finalAttackInitiator: 'OPPONENT' | 'DOOM' | null;
  outcome: AvengersOutcome | null;
  randomState: number;
  availableActions: AvengersAction[];
  events: AvengersEvent[];
  timeline: AvengersEvent[];
  cycleFacts: AvengersFinalCycleFact[];
  /** Attempt-pinned production definitions. Fixtures omit this and use sample content. */
  content?: AvengersBattleContent;
}
