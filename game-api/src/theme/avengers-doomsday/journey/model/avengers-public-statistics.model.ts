import { ApiProperty } from '@nestjs/swagger';
import { SuccessResponseModel } from '../../../../basic/public-api.model';

export class TeamStatisticsModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 7 })
  encounters!: number;

  @ApiProperty({ example: 6 })
  wins!: number;

  @ApiProperty({ example: 1 })
  draws!: number;

  @ApiProperty({ example: 0 })
  losses!: number;

  @ApiProperty({ example: 1240 })
  damageDealt!: number;

  @ApiProperty({ example: 988 })
  damageReceived!: number;

  @ApiProperty({ example: 236 })
  healing!: number;

  @ApiProperty({ example: 8 })
  kosCaused!: number;

  @ApiProperty({ example: 4 })
  kosSuffered!: number;

  @ApiProperty({ example: 14 })
  specialsUsed!: number;

  @ApiProperty({ example: 3 })
  teamActionsUsed!: number;

  @ApiProperty({ example: 2 })
  leaderAbilitiesUsed!: number;

  @ApiProperty({ example: 140 })
  rewardPointsEarned!: number;

  @ApiProperty({ example: 85 })
  rewardPointsSpent!: number;

  @ApiProperty({ example: 4 })
  powerUpsUsed!: number;

  @ApiProperty({ example: 11 })
  statGains!: number;
}

export class HeroStatisticsFactsModel {
  @ApiProperty({ example: 7 })
  activeEncounters!: number;

  @ApiProperty({ example: 24 })
  activeRounds!: number;

  @ApiProperty({ example: 16 })
  winningActiveRounds!: number;

  @ApiProperty({ example: 492 })
  damageDealt!: number;

  @ApiProperty({ example: 307 })
  damageReceived!: number;

  @ApiProperty({ example: 184 })
  healing!: number;

  @ApiProperty({ example: 3 })
  kosCaused!: number;

  @ApiProperty({ example: 1 })
  kosSuffered!: number;

  @ApiProperty({ example: 5 })
  offensiveSpecialsUsed!: number;

  @ApiProperty({ example: 4 })
  supportSpecialsUsed!: number;

  @ApiProperty({ example: 2 })
  statGains!: number;
}

export class HeroStatisticsModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 'spider-man' })
  heroId!: string;

  @ApiProperty({ example: true })
  eligible!: boolean;

  @ApiProperty({ type: HeroStatisticsFactsModel })
  totals!: HeroStatisticsFactsModel;

  @ApiProperty({ type: HeroStatisticsFactsModel })
  journey!: HeroStatisticsFactsModel;

  @ApiProperty({ type: HeroStatisticsFactsModel })
  finalStage!: HeroStatisticsFactsModel;
}

export class AwardEligibilityModel {
  @ApiProperty({ enum: ['QUARTERFINAL'], example: 'QUARTERFINAL' })
  minimumStageCode!: string;

  @ApiProperty({ type: [String], example: ['spider-man', 'black-panther'] })
  eligibleTeamIds!: string[];
}

export class AwardWinnerModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: 'spider-man' })
  heroId!: string;
}

export class AwardWinningFactsModel {
  @ApiProperty({ example: 'damageDealt' })
  metricCode!: string;

  @ApiProperty({ example: 681 })
  value!: number;

  @ApiProperty({ required: false, example: 0 })
  kosSuffered?: number;

  @ApiProperty({ required: false, example: 7 })
  activeEncounters?: number;

  @ApiProperty({ required: false, example: 0 })
  koRate?: number;

  @ApiProperty({ required: false, example: 22 })
  activeRounds?: number;

  @ApiProperty({ required: false, example: 402 })
  damageReceived?: number;

  @ApiProperty({ required: false, example: 4 })
  kosCaused?: number;

  @ApiProperty({ required: false, example: 558 })
  damageDealt?: number;

  @ApiProperty({ required: false, example: 184 })
  healing?: number;

  @ApiProperty({ required: false, example: 18 })
  winningActiveRounds?: number;
}

export class CompetitionSummaryModel {
  @ApiProperty({ example: 62 })
  journeyEncounters!: number;

  @ApiProperty({ example: true })
  finalStagePlayed!: boolean;

  @ApiProperty({ example: 9 })
  finalStageNormalTurnsPlayed!: number;
}

export class OfficialAwardDecisionModel {
  @ApiProperty({ enum: ['MIGHTIEST_HERO', 'BEST_SUPPORT', 'MOST_RESILIENT', 'JOURNEY_MVP'] })
  code!: string;

  @ApiProperty({ example: 'Mightiest Hero' })
  label!: string;

  @ApiProperty({ example: 'Highest attributable Damage Dealt among eligible Hero instances.' })
  explanation!: string;

  @ApiProperty({ type: AwardWinnerModel, nullable: true })
  winner!: AwardWinnerModel | null;

  @ApiProperty({ type: AwardWinningFactsModel, nullable: true })
  winningFacts!: AwardWinningFactsModel | null;

  @ApiProperty({ example: 'Won with 681 Damage Dealt.' })
  reason!: string;
}

export class CompetitionStatisticsDataModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ enum: ['COMPLETED'], example: 'COMPLETED' })
  status!: 'COMPLETED';

  @ApiProperty({ enum: ['VICTORY', 'DEFEAT', 'ABANDON'], example: 'VICTORY' })
  completionOutcome!: string;

  @ApiProperty({ example: 'NORMAL_VICTORY' })
  endingCode!: string;

  @ApiProperty({ type: String, nullable: true })
  terminalReasonCode!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: string;

  @ApiProperty({ type: AwardEligibilityModel })
  eligibility!: AwardEligibilityModel;

  @ApiProperty({ type: CompetitionSummaryModel })
  competition!: CompetitionSummaryModel;

  @ApiProperty({ type: [TeamStatisticsModel] })
  teamStatistics!: TeamStatisticsModel[];

  @ApiProperty({ type: [HeroStatisticsModel] })
  heroStatistics!: HeroStatisticsModel[];

  @ApiProperty({ type: [OfficialAwardDecisionModel] })
  awards!: OfficialAwardDecisionModel[];
}

export class CompetitionStatisticsResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: CompetitionStatisticsDataModel })
  data!: CompetitionStatisticsDataModel;
}
