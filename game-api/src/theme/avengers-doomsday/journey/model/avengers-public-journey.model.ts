import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { SuccessResponseModel } from '../../../../basic/public-api.model';
import { AvengersStrategy } from '../../model/avengers-strategy.enum';
import { TeamMemberStatus } from '../../../../teams/model/team-member-status.enum';
import { TeamConfigurationModel } from './avengers-public-team.model';
import { NarrativeModel } from '../../model/avengers-public-narrative.model';

export class JourneyCurrentAttemptModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['PRE_FINAL', 'FINAL_ACTIVE', 'COMPLETED'], example: 'PRE_FINAL' })
  status!: string;

  @ApiProperty({ example: 4 })
  stageCount!: number;

  @ApiProperty({ example: 62 })
  encounterCount!: number;
}

export class CurrentJourneyDataModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ type: JourneyCurrentAttemptModel, nullable: true })
  attempt!: JourneyCurrentAttemptModel | null;

  @ApiProperty({ type: () => CurrentJourneySummaryModel, nullable: true })
  summary!: CurrentJourneySummaryModel | null;
}

export class CurrentJourneyResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: CurrentJourneyDataModel })
  data!: CurrentJourneyDataModel;
}

export class JourneyFinalistsModel {
  @ApiProperty({ example: 'spider-man' })
  playerTeamId!: string;

  @ApiProperty({ example: 'black-panther' })
  opponentTeamId!: string;
}

export class SimulateJourneySummaryModel {
  @ApiProperty({ example: 4 })
  stagesCompleted!: number;

  @ApiProperty({ example: 62 })
  encountersSimulated!: number;

  @ApiProperty({ example: 55 })
  playerRewardPointsRemaining!: number;
}

export class SimulateJourneyResultModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ enum: ['PRE_FINAL'], example: 'PRE_FINAL' })
  status!: string;

  @ApiProperty({ enum: ['SAVE', 'BALANCED', 'AGGRESSIVE'], example: 'SAVE' })
  spendingStrategyCode!: string;

  @ApiProperty({ example: true })
  playerQualified!: boolean;

  @ApiProperty({ type: JourneyFinalistsModel })
  finalists!: JourneyFinalistsModel;

  @ApiProperty({ type: SimulateJourneySummaryModel })
  summary!: SimulateJourneySummaryModel;

  @ApiProperty({ example: false })
  replacedPrevious!: boolean;
}

export class SimulateJourneyResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: SimulateJourneyResultModel })
  data!: SimulateJourneyResultModel;
}

export class JourneyProgressModel {
  @ApiProperty({ example: 4 })
  stagesCompleted!: number;

  @ApiProperty({ example: 6 })
  encountersPlayedByPlayer!: number;

  @ApiProperty({ enum: ['READY', 'ACTIVE', 'COMPLETED'], example: 'READY' })
  finalStageStatus!: string;
}

export class JourneySummaryModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ enum: ['PRE_FINAL', 'FINAL_ACTIVE', 'COMPLETED'], example: 'PRE_FINAL' })
  status!: string;

  @ApiProperty({ enum: ['SAVE', 'BALANCED', 'AGGRESSIVE'], example: 'SAVE' })
  spendingStrategyCode!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiProperty({ type: TeamConfigurationModel })
  configuration!: TeamConfigurationModel;

  @ApiProperty({ type: JourneyFinalistsModel })
  finalists!: JourneyFinalistsModel;

  @ApiProperty({ type: JourneyProgressModel })
  progress!: JourneyProgressModel;

  @ApiProperty({ enum: ['VICTORY', 'DEFEAT', 'ABANDON'], nullable: true })
  completionOutcome!: string | null;

  @ApiProperty({ type: String, example: 'NORMAL_VICTORY', nullable: true })
  endingCode!: string | null;

  @ApiProperty({ type: String, nullable: true })
  terminalReasonCode!: string | null;
}

export class CurrentJourneySummaryModel extends JourneySummaryModel {}

export class JourneySummaryResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: JourneySummaryModel })
  data!: JourneySummaryModel;
}

export class TournamentStatGainModel {
  @ApiProperty({ enum: ['POWER', 'RESISTANCE', 'AGILITY', 'ABILITY'], example: 'POWER' })
  statCode!: string;

  @ApiProperty({ example: 1 })
  amount!: number;
}

export class TournamentHeroStateModel {
  @ApiProperty({ example: 'spider-man' })
  heroId!: string;

  @ApiProperty({ example: 173 })
  currentEnergy!: number;

  @ApiProperty({ example: 82 })
  currentAbilityPoints!: number;

  @ApiProperty({ enum: TeamMemberStatus, example: TeamMemberStatus.ACTIVE })
  status!: TeamMemberStatus;

  @ApiProperty({ example: false })
  knockedOut!: boolean;

  @ApiProperty({ type: [TournamentStatGainModel] })
  statGains!: TournamentStatGainModel[];
}

export class TournamentTeamModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 'Team Spider-Man' })
  name!: string;

  @ApiProperty({ example: 'spider-man' })
  leaderId!: string;

  @ApiProperty({ type: [String] })
  heroIds!: string[];

  @ApiProperty({ enum: AvengersStrategy })
  strategyCode!: AvengersStrategy;

  @ApiProperty({ enum: ['PLAYER', 'AFFINITY', 'VARIETY', 'FRICTION'] })
  generationModeCode!: string;

  @ApiProperty({ type: [TournamentHeroStateModel] })
  heroes!: TournamentHeroStateModel[];

  @ApiProperty({ example: 55 })
  rewardPoints!: number;

  @ApiProperty({ example: false })
  eliminated!: boolean;
}

export class TournamentTeamsDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ type: [TournamentTeamModel] })
  teams!: TournamentTeamModel[];

  @ApiProperty({ type: JourneyFinalistsModel })
  finalists!: JourneyFinalistsModel;
}

export class TournamentTeamsResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: TournamentTeamsDataModel })
  data!: TournamentTeamsDataModel;
}

export class GroupStandingModel {
  @ApiProperty({ example: 1 })
  position!: number;

  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 3 })
  played!: number;

  @ApiProperty({ example: 2 })
  wins!: number;

  @ApiProperty({ example: 1 })
  draws!: number;

  @ApiProperty({ example: 0 })
  losses!: number;

  @ApiProperty({ example: 7 })
  points!: number;

  @ApiProperty({ example: 402 })
  damageDealt!: number;

  @ApiProperty({ example: 291 })
  damageReceived!: number;

  @ApiProperty({ example: 111 })
  damageDifference!: number;

  @ApiProperty({ example: 4 })
  tieBreakRank!: number;

  @ApiProperty({ example: true })
  qualified!: boolean;
}

export class JourneyGroupModel {
  @ApiProperty({ example: 'A' })
  groupId!: string;

  @ApiProperty({ type: [String], example: ['encounter-0001', 'encounter-0002'] })
  encounterIds!: string[];

  @ApiProperty({ type: [GroupStandingModel] })
  standings!: GroupStandingModel[];
}

export class KnockoutMatchModel {
  @ApiProperty({ example: 1 })
  slot!: number;

  @ApiProperty({ example: 'qf-01' })
  encounterId!: string;

  @ApiProperty({ example: 'spider-man' })
  teamAId!: string;

  @ApiProperty({ example: 'black-panther' })
  teamBId!: string;

  @ApiProperty({ example: 'spider-man' })
  winnerTeamId!: string;

  @ApiProperty({ enum: ['QUARTERFINAL', 'SEMIFINAL', 'FINAL_STAGE'] })
  nextStageCode!: string;

  @ApiProperty({ example: 1 })
  nextSlot!: number;
}

export class KnockoutRoundModel {
  @ApiProperty({ enum: ['ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL'] })
  stageCode!: string;

  @ApiProperty({ type: [KnockoutMatchModel] })
  matches!: KnockoutMatchModel[];
}

export class JourneyGroupStageModel {
  @ApiProperty({ type: [JourneyGroupModel] })
  groups!: JourneyGroupModel[];
}

export class JourneyKnockoutModel {
  @ApiProperty({ type: [KnockoutRoundModel] })
  rounds!: KnockoutRoundModel[];
}

export class JourneyStagesDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ type: JourneyGroupStageModel })
  groupStage!: JourneyGroupStageModel;

  @ApiProperty({ type: JourneyKnockoutModel })
  knockout!: JourneyKnockoutModel;

  @ApiProperty({ type: JourneyFinalistsModel })
  finalists!: JourneyFinalistsModel;
}

export class JourneyStagesResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: JourneyStagesDataModel })
  data!: JourneyStagesDataModel;
}

export class EncounterResultModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ enum: ['WIN', 'DRAW', 'LOSS'], example: 'WIN' })
  resultCode!: string;
}

export class EncounterDamageModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 184 })
  damageDealt!: number;
}

export class EncounterSummaryModel {
  @ApiProperty({ example: 'qf-01' })
  encounterId!: string;

  @ApiProperty({ example: 'quarterfinal' })
  stageId!: string;

  @ApiProperty({ enum: ['GROUP_STAGE', 'ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL'] })
  stageCode!: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  groupId!: string | null;

  @ApiProperty({ example: 'spider-man' })
  teamAId!: string;

  @ApiProperty({ example: 'black-panther' })
  teamBId!: string;

  @ApiProperty({ type: String, nullable: true, example: 'spider-man' })
  winnerTeamId!: string | null;

  @ApiProperty({
    enum: ['NORMAL', 'TOTAL_KO', 'SPECIAL_SHOWDOWN', 'SHOWDOWN_FORFEIT', 'TECHNICAL_VERDICT'],
  })
  resolutionCode!: string;

  @ApiProperty({ example: false })
  rivalEncounter!: boolean;

  @ApiProperty({ type: [EncounterResultModel] })
  results!: EncounterResultModel[];

  @ApiProperty({ type: [EncounterDamageModel] })
  damageByTeam!: EncounterDamageModel[];
}

export class EncounterSummaryDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ type: [EncounterSummaryModel] })
  encounters!: EncounterSummaryModel[];
}

export class EncounterSummaryResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: EncounterSummaryDataModel })
  data!: EncounterSummaryDataModel;
}

export class PublicEventValuesModel {
  @ApiPropertyOptional({ example: 'spider-man' })
  actorHeroId?: string;

  @ApiPropertyOptional({ example: 'black-panther' })
  targetTeamId?: string;

  @ApiPropertyOptional({ example: 49 })
  amount?: number;

  @ApiPropertyOptional({ example: 'OFFENSIVE_SPECIAL' })
  actionCode?: string;

  @ApiPropertyOptional({ example: 'RESISTANCE' })
  statCode?: string;

  @ApiPropertyOptional({ example: 'WIN' })
  reasonCode?: string;

  @ApiPropertyOptional({ example: 'energy-major' })
  itemId?: string;

  @ApiPropertyOptional({ example: 50 })
  energy?: number;

  @ApiPropertyOptional({ example: 25 })
  abilityPoints?: number;
}

export class JourneyEventModel {
  @ApiProperty({
    example: 182,
    description:
      'Monotonic chronological event order; for events with narrative this identifies the narrative block order.',
  })
  sequence!: number;

  @ApiProperty({ example: 'DAMAGE' })
  eventCode!: string;

  @ApiProperty({ type: String, nullable: true, example: 'QUARTERFINAL' })
  stageCode!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'qf-01' })
  encounterId!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  round!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'spider-man' })
  teamId!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'spider-man' })
  actorHeroId!: string | null;

  @ApiProperty({ type: [String] })
  targetHeroIds!: string[];

  @ApiProperty({ example: 'journey.damage' })
  messageCode!: string;

  @ApiProperty({ type: PublicEventValuesModel })
  values!: PublicEventValuesModel;

  @ApiProperty({ type: NarrativeModel, nullable: true, example: null })
  narrative!: NarrativeModel | null;
}

export class EncounterActiveHeroesModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ type: [String] })
  heroIds!: string[];
}

export class EncounterRoundModel {
  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty({ enum: ['NORMAL', 'EXTRA_ROUND'], example: 'NORMAL' })
  roundType!: string;

  @ApiProperty({ example: 'spider-man' })
  initiativeTeamId!: string;

  @ApiProperty({ type: String, nullable: true, example: 'spider-man' })
  winnerTeamId!: string | null;

  @ApiProperty({ type: [EncounterDamageModel] })
  damageByTeam!: EncounterDamageModel[];

  @ApiProperty({ type: [EncounterActiveHeroesModel] })
  activeHeroIdsByTeam!: EncounterActiveHeroesModel[];

  @ApiProperty({ type: [JourneyEventModel] })
  events!: JourneyEventModel[];
}

export class EncounterRewardEntryModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ enum: ['WIN', 'DRAW', 'LOSS', 'RIVAL_WIN', 'TOTAL_KO_WIN'] })
  reasonCode!: string;

  @ApiProperty({ example: 20 })
  amount!: number;
}

export class EncounterStatGainModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 'hulk' })
  heroId!: string;

  @ApiProperty({ enum: ['POWER', 'RESISTANCE', 'AGILITY', 'ABILITY'] })
  statCode!: string;

  @ApiProperty({ example: 1 })
  amount!: number;
}

export class EncounterHeroResourceConsequenceModel {
  @ApiProperty({ example: 'spider-man' })
  heroId!: string;

  @ApiProperty({ example: 180 })
  energyBefore!: number;

  @ApiProperty({ example: 142 })
  energyAfter!: number;

  @ApiProperty({ example: 60 })
  abilityPointsBefore!: number;

  @ApiProperty({ example: 30 })
  abilityPointsAfter!: number;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'KO'], example: 'ACTIVE' })
  statusBefore!: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'KO'], example: 'ACTIVE' })
  statusAfter!: string;
}

export class EncounterResourceConsequenceModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ type: [EncounterHeroResourceConsequenceModel] })
  heroes!: EncounterHeroResourceConsequenceModel[];
}

export class EncounterDetailModel extends EncounterSummaryModel {
  @ApiProperty({ type: [EncounterRoundModel] })
  rounds!: EncounterRoundModel[];

  @ApiProperty({ type: EncounterRoundModel, nullable: true })
  extraRound!: EncounterRoundModel | null;

  @ApiProperty({ type: [EncounterRewardEntryModel] })
  rewardEntries!: EncounterRewardEntryModel[];

  @ApiProperty({ type: [EncounterStatGainModel] })
  statGains!: EncounterStatGainModel[];

  @ApiProperty({ type: [EncounterResourceConsequenceModel] })
  resourceConsequences!: EncounterResourceConsequenceModel[];
}

export class EncounterDetailResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: EncounterDetailModel })
  data!: EncounterDetailModel;
}

export class JourneyEventsDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ type: [JourneyEventModel] })
  events!: JourneyEventModel[];
}

export class JourneyEventsResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: JourneyEventsDataModel })
  data!: JourneyEventsDataModel;
}

export class RewardLedgerEntryModel {
  @ApiProperty({ example: 'ledger-18' })
  entryId!: string;

  @ApiProperty({ type: String, nullable: true, example: 'qf-01' })
  encounterId!: string | null;

  @ApiProperty({ enum: ['WIN', 'DRAW', 'LOSS', 'RIVAL_WIN', 'TOTAL_KO_WIN', 'PURCHASE'] })
  reasonCode!: string;

  @ApiProperty({ example: 20 })
  amount!: number;

  @ApiProperty({ example: 55 })
  balanceAfter!: number;
}

export class RewardAccountDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 120 })
  earned!: number;

  @ApiProperty({ example: 65 })
  spent!: number;

  @ApiProperty({ example: 55 })
  balance!: number;

  @ApiProperty({ type: [RewardLedgerEntryModel] })
  ledger!: RewardLedgerEntryModel[];
}

export class RewardAccountResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: RewardAccountDataModel })
  data!: RewardAccountDataModel;
}

export class InventoryEntryModel {
  @ApiProperty({ example: 'energy-major' })
  itemId!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ type: [String], example: ['PRE_FINAL'] })
  legalUseContexts!: string[];
}

export class InventoryDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ type: [InventoryEntryModel] })
  items!: InventoryEntryModel[];
}

export class InventoryResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: InventoryDataModel })
  data!: InventoryDataModel;
}

export class PurchasePowerUpResultModel extends OmitType(InventoryDataModel, [
  'attemptId',
] as const) {
  @ApiProperty({ example: 35 })
  rewardPoints!: number;

  @ApiProperty({ example: 'energy-major' })
  purchasedItemId!: string;

  @ApiProperty({ example: 1 })
  purchasedQuantity!: number;
}

export class PurchasePowerUpResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: PurchasePowerUpResultModel })
  data!: PurchasePowerUpResultModel;
}

export class UsePreparationItemResultModel extends OmitType(InventoryDataModel, [
  'attemptId',
] as const) {
  @ApiProperty({ example: 'energy-major' })
  usedItemId!: string;

  @ApiProperty({ type: String, nullable: true, example: 'spider-man' })
  targetHeroId!: string | null;
}

export class UsePreparationItemResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: UsePreparationItemResultModel })
  data!: UsePreparationItemResultModel;
}

export class UpdateFinalPreparationResultModel {
  @ApiProperty({ enum: AvengersStrategy, example: AvengersStrategy.AGGRESSIVE })
  strategyCode!: AvengersStrategy;

  @ApiProperty({ type: [String], example: ['spider-man', 'doctor-strange', 'hulk'] })
  activeHeroIds!: string[];
}

export class UpdateFinalPreparationResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: UpdateFinalPreparationResultModel })
  data!: UpdateFinalPreparationResultModel;
}
