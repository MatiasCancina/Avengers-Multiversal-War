import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { SuccessResponseModel } from '../../../../basic/public-api.model';
import { AvengersStrategy } from '../../model/avengers-strategy.enum';
import { TeamMemberStatus } from '../../../../teams/model/team-member-status.enum';
import { AvengersEndingCode } from '../../model/avengers-ending-code.enum';
import { AvengersTerminalReason } from '../../model/avengers-terminal-reason.enum';
import { NarrativeModel } from '../../model/avengers-public-narrative.model';

export class FinalStageParticipantRefsModel {
  @ApiProperty({ example: 'spider-man' })
  playerTeamId!: string;

  @ApiProperty({ example: 'black-panther' })
  opponentTeamId!: string;
}

export class FinalStageCompletionModel {
  @ApiProperty({ enum: ['VICTORY', 'DEFEAT', 'ABANDON'] })
  outcomeCode!: string;

  @ApiProperty({ enum: AvengersEndingCode, example: AvengersEndingCode.NORMAL_VICTORY })
  endingCode!: AvengersEndingCode;

  @ApiProperty({ enum: AvengersTerminalReason, nullable: true })
  terminalReasonCode!: AvengersTerminalReason | null;

  @ApiProperty({ type: [Number], example: [90, 91] })
  endingEventSequences!: number[];
}

export class TournamentFinalStateModel {
  @ApiProperty({ example: 'TOURNAMENT_FINAL' })
  variant!: 'TOURNAMENT_FINAL';

  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['READY', 'ACTIVE'], example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ enum: ['TOURNAMENT_FINAL'], example: 'TOURNAMENT_FINAL' })
  phase!: 'TOURNAMENT_FINAL';

  @ApiProperty({ example: 'Tournament Final' })
  phaseLabel!: string;

  @ApiProperty({ example: 3 })
  normalTurn!: number;

  @ApiProperty({
    enum: ['AWAITING_START', 'AWAITING_PLAYER_ACTION'],
    example: 'AWAITING_PLAYER_ACTION',
  })
  turnState!: string;

  @ApiProperty({ type: FinalStageParticipantRefsModel })
  participants!: FinalStageParticipantRefsModel;

  @ApiProperty({ type: FinalStageCompletionModel, nullable: true, example: null })
  completion!: null;
}

export class DoomCombatStateModel {
  @ApiProperty({ example: 'doctor-doom' })
  narrativeCharacterId!: string;

  @ApiProperty({ example: 750 })
  maximumEnergy!: number;

  @ApiProperty({ example: 610 })
  currentEnergy!: number;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'DEFEATED'], example: 'LOW' })
  threatLevelCode!: string;
}

export class DoomsdayFinalStateModel {
  @ApiProperty({ example: 'DOOMSDAY' })
  variant!: 'DOOMSDAY';

  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['ACTIVE'], example: 'ACTIVE' })
  status!: 'ACTIVE';

  @ApiProperty({ enum: ['DOOMSDAY', 'FINAL_ATTACK'], example: 'DOOMSDAY' })
  phase!: string;

  @ApiProperty({ example: 'Doomsday' })
  phaseLabel!: string;

  @ApiProperty({ example: 5 })
  normalTurn!: number;

  @ApiProperty({ enum: ['AWAITING_PLAYER_ACTION'], example: 'AWAITING_PLAYER_ACTION' })
  turnState!: string;

  @ApiProperty({ type: FinalStageParticipantRefsModel })
  participants!: FinalStageParticipantRefsModel;

  @ApiProperty({ type: DoomCombatStateModel })
  doom!: DoomCombatStateModel;

  @ApiProperty({ example: 'ALLIED_WITH_DOOM' })
  opponentAlignmentCode!: string;

  @ApiProperty({ example: 48 })
  revealEventSequence!: number;

  @ApiProperty({ type: FinalStageCompletionModel, nullable: true, example: null })
  completion!: null;
}

export class CompletedFinalStateModel {
  @ApiProperty({ example: 'COMPLETED' })
  variant!: 'COMPLETED';

  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['COMPLETED'], example: 'COMPLETED' })
  status!: 'COMPLETED';

  @ApiProperty({ enum: ['COMPLETED'], example: 'COMPLETED' })
  phase!: 'COMPLETED';

  @ApiProperty({ example: 'Completed' })
  phaseLabel!: string;

  @ApiProperty({ example: 9 })
  normalTurn!: number;

  @ApiProperty({ enum: ['COMPLETED'], example: 'COMPLETED' })
  turnState!: 'COMPLETED';

  @ApiProperty({ type: FinalStageParticipantRefsModel })
  participants!: FinalStageParticipantRefsModel;

  @ApiProperty({ type: FinalStageCompletionModel })
  completion!: FinalStageCompletionModel;
}

export class FinalStageStateResponseModel extends SuccessResponseModel {
  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(TournamentFinalStateModel) },
      { $ref: getSchemaPath(DoomsdayFinalStateModel) },
      { $ref: getSchemaPath(CompletedFinalStateModel) },
    ],
    discriminator: { propertyName: 'variant' },
  })
  data!: TournamentFinalStateModel | DoomsdayFinalStateModel | CompletedFinalStateModel;
}

export class FinalStageHeroStateModel {
  @ApiProperty({ example: 'spider-man' })
  heroId!: string;

  @ApiProperty({ enum: TeamMemberStatus, example: TeamMemberStatus.ACTIVE })
  status!: TeamMemberStatus;

  @ApiProperty({ enum: ['AVAILABLE', 'KNOCKED_OUT'], example: 'AVAILABLE' })
  condition!: string;

  @ApiProperty({ example: 228 })
  maximumEnergy!: number;

  @ApiProperty({ example: 173 })
  currentEnergy!: number;

  @ApiProperty({ example: 126 })
  maximumAbilityPoints!: number;

  @ApiProperty({ example: 82 })
  currentAbilityPoints!: number;

  @ApiProperty({ example: 0 })
  returnAtTurn!: number;
}

export class FinalStageTeamStateModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 'spider-man' })
  leaderId!: string;

  @ApiProperty({ enum: AvengersStrategy, example: AvengersStrategy.BALANCED })
  strategyCode!: AvengersStrategy;

  @ApiProperty({ type: [FinalStageHeroStateModel] })
  heroes!: FinalStageHeroStateModel[];

  @ApiProperty({ type: [String] })
  vacantActiveHeroIds!: string[];

  @ApiProperty({ example: 'HIGH' })
  synergyCode!: string;

  @ApiProperty({ example: 2 })
  teamActionsRemaining!: number;

  @ApiProperty({ example: 1 })
  leaderAbilityUsesRemaining!: number;

  @ApiProperty({ example: 2 })
  strategyChangesRemaining!: number;
}

export class TournamentFinalTeamsDataModel {
  @ApiProperty({ example: 'TOURNAMENT_FINAL' })
  variant!: 'TOURNAMENT_FINAL';

  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ type: FinalStageTeamStateModel })
  player!: FinalStageTeamStateModel;

  @ApiProperty({ type: FinalStageTeamStateModel })
  opponent!: FinalStageTeamStateModel;
}

export class DoomsdayFinalTeamsDataModel {
  @ApiProperty({ example: 'DOOMSDAY' })
  variant!: 'DOOMSDAY';

  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ type: FinalStageTeamStateModel })
  player!: FinalStageTeamStateModel;

  @ApiProperty({ type: FinalStageTeamStateModel })
  opponent!: FinalStageTeamStateModel;

  @ApiProperty({ type: DoomCombatStateModel })
  doom!: DoomCombatStateModel;
}

export class CompletedFinalTeamsDataModel {
  @ApiProperty({ example: 'COMPLETED' })
  variant!: 'COMPLETED';

  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ type: FinalStageTeamStateModel })
  player!: FinalStageTeamStateModel;

  @ApiProperty({ type: FinalStageTeamStateModel })
  opponent!: FinalStageTeamStateModel;

  @ApiProperty({ type: DoomCombatStateModel, required: false })
  doom?: DoomCombatStateModel;
}

export class FinalStageTeamsResponseModel extends SuccessResponseModel {
  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(TournamentFinalTeamsDataModel) },
      { $ref: getSchemaPath(DoomsdayFinalTeamsDataModel) },
      { $ref: getSchemaPath(CompletedFinalTeamsDataModel) },
    ],
    discriminator: { propertyName: 'variant' },
  })
  data!: TournamentFinalTeamsDataModel | DoomsdayFinalTeamsDataModel | CompletedFinalTeamsDataModel;
}

export class LegalActionTargetModel {
  @ApiProperty({ enum: ['HERO', 'TEAM', 'ANTAGONIST'], example: 'HERO' })
  targetType!: string;

  @ApiProperty({ example: 'black-panther' })
  targetId!: string;

  @ApiProperty({ enum: ['PLAYER', 'OPPONENT', 'DOOM'], example: 'OPPONENT' })
  sideCode!: string;
}

export class LegalActionCostModel {
  @ApiProperty({ example: 0 })
  abilityPoints!: number;
}

export class LegalFinalStageActionModel {
  @ApiProperty({ example: '<opaque actionId from GET actions>' })
  actionId!: string;

  @ApiProperty({
    enum: [
      'BASIC_ATTACK',
      'OFFENSIVE_SPECIAL',
      'SUPPORT_SPECIAL',
      'LEADER_ABILITY',
      'TEAM_ACTION',
      'POWER_UP',
      'SWAP',
      'CHANGE_STRATEGY',
      'SUE_STORM_APPEAL',
    ],
  })
  actionCode!: string;

  @ApiProperty({ example: 'Web Strike' })
  label!: string;

  @ApiProperty({ example: 'Spider-Man lashes out with a fast web-assisted strike.' })
  description!: string;

  @ApiPropertyOptional({ example: 'spider-man' })
  actorHeroId?: string;

  @ApiPropertyOptional({ example: 'offensive-special' })
  abilityId?: string;

  @ApiPropertyOptional({ example: 'energy-major' })
  itemId?: string;

  @ApiPropertyOptional({ enum: AvengersStrategy, example: AvengersStrategy.AGGRESSIVE })
  strategyCode?: AvengersStrategy;

  @ApiPropertyOptional({ example: 'WARRIOR+SUPPORT' })
  roleCombination?: string;

  @ApiPropertyOptional({ example: 'hulk' })
  outgoingHeroId?: string;

  @ApiPropertyOptional({ example: 'captain-america' })
  incomingHeroId?: string;

  @ApiProperty({ type: LegalActionTargetModel, nullable: true })
  target!: LegalActionTargetModel | null;

  @ApiProperty({ type: LegalActionCostModel })
  cost!: LegalActionCostModel;
}

export class LegalFinalStageActionsDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ example: 'DOOMSDAY' })
  phase!: string;

  @ApiProperty({ example: 5 })
  normalTurn!: number;

  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ type: [LegalFinalStageActionModel] })
  actions!: LegalFinalStageActionModel[];
}

export class LegalFinalStageActionsResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: LegalFinalStageActionsDataModel })
  data!: LegalFinalStageActionsDataModel;
}

export class FinalStageEventValuesModel {
  @ApiPropertyOptional({ example: 'doctor-doom' })
  actorIdentityId?: string;

  @ApiPropertyOptional({ example: 'spider-man' })
  actorHeroId?: string;

  @ApiPropertyOptional({ enum: ['PLAYER', 'OPPONENT'], example: 'PLAYER' })
  actorSideCode?: string;

  @ApiPropertyOptional({ type: [String], example: ['black-panther', 'hulk'] })
  targetHeroIds?: string[];

  @ApiPropertyOptional({ example: 'black-panther' })
  targetId?: string;

  @ApiPropertyOptional({ example: 'hulk' })
  targetHeroId?: string;

  @ApiPropertyOptional({ example: 49 })
  amount?: number;

  @ApiPropertyOptional({ example: 49 })
  damage?: number;

  @ApiPropertyOptional({ example: 49 })
  healing?: number;

  @ApiPropertyOptional({ example: -25 })
  apChange?: number;

  @ApiPropertyOptional({ example: 80 })
  abilityPoints?: number;

  @ApiPropertyOptional({ example: 120 })
  energy?: number;

  @ApiPropertyOptional({ example: 'Web Storm' })
  actionName?: string;

  @ApiPropertyOptional({ example: 'OFFENSIVE_SPECIAL' })
  actionCode?: string;

  @ApiPropertyOptional({ example: 'AGGRESSIVE' })
  strategyCode?: string;

  @ApiPropertyOptional({ example: 'Energy Reserve' })
  itemName?: string;

  @ApiPropertyOptional({ example: 'ENERGY' })
  effectCode?: string;

  @ApiPropertyOptional({ example: 'power' })
  statCode?: string;

  @ApiPropertyOptional({ example: 'OPPONENT' })
  targetSideCode?: string;

  @ApiPropertyOptional({ example: 'doctor-doom' })
  revealedIdentityId?: string;

  @ApiPropertyOptional({ example: 'silver-surfer' })
  previousIdentityId?: string;

  @ApiPropertyOptional({ example: 'spider-man' })
  speakerTeamId?: string;

  @ApiPropertyOptional({ example: 'spider-man' })
  playerTeamId?: string;

  @ApiPropertyOptional({ example: 'black-panther' })
  opponentTeamId?: string;

  @ApiPropertyOptional({ example: 'ALLIED_WITH_DOOM' })
  alignmentCode?: string;

  @ApiPropertyOptional({ example: 5 })
  nextNormalTurn?: number;
}

export class FinalStageEventModel {
  @ApiProperty({
    example: 48,
    description:
      'Monotonic chronological event order; for narrative events this is the narrative block order.',
  })
  sequence!: number;

  @ApiProperty({ example: 4 })
  turn!: number;

  @ApiProperty({ enum: ['TOURNAMENT_FINAL', 'DOOMSDAY', 'FINAL_ATTACK', 'COMPLETED'] })
  phase!: string;

  @ApiProperty({ example: 'SURFER_ENOUGH' })
  eventCode!: string;

  @ApiProperty({ example: 'finalStage.reveal.enough' })
  messageCode!: string;

  @ApiProperty({ type: FinalStageEventValuesModel })
  values!: FinalStageEventValuesModel;

  @ApiProperty({ type: NarrativeModel, nullable: true, example: null })
  narrative!: NarrativeModel | null;
}

export class FinalStageEventsDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ type: [FinalStageEventModel] })
  events!: FinalStageEventModel[];
}

export class FinalStageEventsResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: FinalStageEventsDataModel })
  data!: FinalStageEventsDataModel;
}

export class FinalStageCommandModel {
  @ApiProperty({ enum: ['START', 'CHOOSE_ACTION', 'ABANDON'], example: 'CHOOSE_ACTION' })
  type!: string;

  @ApiPropertyOptional({ example: '<opaque actionId from GET actions>' })
  actionId?: string;
}

export class FinalStageCommandReceiptModel {
  @ApiProperty({ example: 'DOOMSDAY' })
  phase!: string;

  @ApiProperty({ example: 6 })
  normalTurn!: number;

  @ApiProperty({ enum: ['ACTIVE', 'COMPLETED'], example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ enum: ['VICTORY', 'DEFEAT', 'ABANDON'], nullable: true })
  completionOutcome!: string | null;

  @ApiProperty({
    enum: AvengersEndingCode,
    nullable: true,
    example: AvengersEndingCode.NORMAL_VICTORY,
  })
  endingCode!: AvengersEndingCode | null;

  @ApiProperty({ enum: AvengersTerminalReason, nullable: true })
  terminalReasonCode!: AvengersTerminalReason | null;

  @ApiProperty({ type: [FinalStageEventModel] })
  emittedEvents!: FinalStageEventModel[];

  @ApiProperty({ example: true })
  nextDecisionRequired!: boolean;
}

export class PlayFinalStageResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: FinalStageCommandReceiptModel })
  data!: FinalStageCommandReceiptModel;
}
