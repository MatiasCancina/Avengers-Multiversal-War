import { PageState } from '../../../../core/models/page-state.interface';
import { AppCopyKey } from '../../../../core/services/i18n.service';

export type TeamJourneyOutcome = 'win' | 'draw' | 'loss' | 'pending' | 'abandoned';
export type TeamJourneyStopKind = 'encounter' | 'final';
export type TeamJourneyFinalStageStatus = 'READY' | 'ACTIVE' | 'COMPLETED';
export type TeamJourneyDetailStatus =
  | 'idle'
  | 'loading'
  | 'data'
  | 'pending'
  | 'unavailable'
  | 'error';
export type TeamJourneyEmptyReason = 'no-journey' | 'no-encounters' | null;

export interface TeamJourneyStopViewModel {
  stopId: string;
  kind: TeamJourneyStopKind;
  encounterId: string | null;
  stageId: string | null;
  stageCode: string;
  groupId: string | null;
  stageLabelKey: AppCopyKey | null;
  resolutionLabelKey: AppCopyKey | null;
  opponentTeamId: string;
  opponentTeamName: string;
  outcome: TeamJourneyOutcome;
  outcomeLabelKey: AppCopyKey;
  damageDealt: number | null;
  rivalEncounter: boolean | null;
  finalStageStatus: TeamJourneyFinalStageStatus | null;
}

export interface TeamJourneyProgressViewModel {
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface TeamJourneyDetailViewModel {
  encounterId: string;
  stageCode: string;
  stageLabelKey: AppCopyKey | null;
  groupId: string | null;
  rounds: TeamJourneyRoundViewModel[];
  extraRound: TeamJourneyRoundViewModel | null;
}

export interface TeamJourneyRoundViewModel {
  roundId: string;
  number: number;
  roundTypeLabelKey: AppCopyKey;
  initiativeTeamName: string;
  winnerTeamName: string | null;
  damageByTeam: TeamJourneyDamageViewModel[];
  activeHeroesByTeam: TeamJourneyActiveHeroesViewModel[];
  events: TeamJourneyEventViewModel[];
}

export interface TeamJourneyDamageViewModel {
  teamId: string;
  teamName: string;
  damageDealt: number;
}

export interface TeamJourneyActiveHeroesViewModel {
  teamId: string;
  teamName: string;
  heroes: TeamJourneyHeroViewModel[];
}

export interface TeamJourneyHeroViewModel {
  heroId: string;
  heroName: string;
}

export interface TeamJourneyEventViewModel {
  sequence: number;
  eventCode: string;
  eventLabelKey: AppCopyKey;
  teamName: string | null;
  actorHeroName: string | null;
  targetHeroNames: string[];
  amount: number | null;
  narrativeLines: TeamJourneyNarrativeLineViewModel[];
}

export interface TeamJourneyNarrativeLineViewModel {
  lineSequence: number;
  speakerName: string | null;
  text: string;
}

export interface TeamJourneyViewModel extends PageState {
  teamId: string | null;
  stops: TeamJourneyStopViewModel[];
  progress: TeamJourneyProgressViewModel;
  simulateJourneyUrl: string;
  lang: 'es' | 'en';
  emptyReason: TeamJourneyEmptyReason;
  selectedStopId: string | null;
  selectedStop: TeamJourneyStopViewModel | null;
  detailStatus: TeamJourneyDetailStatus;
  detail: TeamJourneyDetailViewModel | null;
  detailError: string | null;
  finalBattleUrl: string;
}
