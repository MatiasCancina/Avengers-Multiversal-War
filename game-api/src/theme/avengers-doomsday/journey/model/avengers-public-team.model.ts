import { ApiProperty } from '@nestjs/swagger';
import { SuccessResponseModel } from '../../../../basic/public-api.model';
import { AvengersStrategy } from '../../model/avengers-strategy.enum';

export class TeamConfigurationModel {
  @ApiProperty({ example: 'spider-man' })
  leaderId!: string;

  @ApiProperty({
    type: [String],
    example: ['captain-america', 'doctor-strange', 'hulk', 'iron-man', 'wolverine'],
  })
  companionIds!: string[];

  @ApiProperty({ type: [String], example: ['spider-man', 'doctor-strange', 'hulk'] })
  activeHeroIds!: string[];

  @ApiProperty({ type: [String], example: ['captain-america', 'iron-man', 'wolverine'] })
  inactiveHeroIds!: string[];

  @ApiProperty({ enum: AvengersStrategy, example: AvengersStrategy.BALANCED })
  strategyCode!: AvengersStrategy;
}

export class TeamConfigurationEditabilityModel {
  @ApiProperty({ example: true })
  members!: boolean;

  @ApiProperty({ example: true })
  formation!: boolean;

  @ApiProperty({ example: true })
  strategy!: boolean;
}

export class CurrentAttemptReferenceModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['PRE_FINAL', 'FINAL_ACTIVE', 'COMPLETED'], example: 'PRE_FINAL' })
  status!: string;
}

export class TeamConfigurationDataModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ example: true })
  configured!: boolean;

  @ApiProperty({ type: TeamConfigurationModel, nullable: true })
  configuration!: TeamConfigurationModel | null;

  @ApiProperty({ type: CurrentAttemptReferenceModel, nullable: true })
  currentAttempt!: CurrentAttemptReferenceModel | null;

  @ApiProperty({ type: TeamConfigurationEditabilityModel })
  editability!: TeamConfigurationEditabilityModel;
}

export class TeamConfigurationResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: TeamConfigurationDataModel })
  data!: TeamConfigurationDataModel;
}

export class SaveTeamConfigurationResultModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ type: TeamConfigurationModel })
  configuration!: TeamConfigurationModel;

  @ApiProperty({ example: true })
  journeyReplaced!: boolean;

  @ApiProperty({ type: CurrentAttemptReferenceModel, nullable: true })
  currentAttempt!: CurrentAttemptReferenceModel | null;
}

export class SaveTeamConfigurationResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: SaveTeamConfigurationResultModel })
  data!: SaveTeamConfigurationResultModel;
}

export class CompletedJourneyHistoryItemModel {
  @ApiProperty({ example: 'journey-f91b20' })
  attemptId!: string;

  @ApiProperty({ enum: ['COMPLETED'], example: 'COMPLETED' })
  status!: 'COMPLETED';

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: string;

  @ApiProperty({ enum: ['SAVE', 'BALANCED', 'AGGRESSIVE'], example: 'SAVE' })
  spendingStrategyCode!: string;

  @ApiProperty({ enum: ['VICTORY', 'DEFEAT', 'ABANDON'], example: 'VICTORY' })
  outcomeCode!: string;

  @ApiProperty({ example: 'NORMAL_VICTORY' })
  endingCode!: string;

  @ApiProperty({ type: String, nullable: true })
  terminalReasonCode!: string | null;

  @ApiProperty({ example: 'black-panther' })
  opponentFinalistId!: string;

  @ApiProperty({ example: 'Black Panther Team' })
  opponentFinalistName!: string;

  @ApiProperty({ example: 'The Player Team defeated the final threat.' })
  endingSummary!: string;
}

export class CompletedJourneyHistoryDataModel {
  @ApiProperty({ example: 'spider-man' })
  teamId!: string;

  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  language!: string;

  @ApiProperty({ type: [CompletedJourneyHistoryItemModel] })
  items!: CompletedJourneyHistoryItemModel[];
}

export class CompletedJourneyHistoryResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: CompletedJourneyHistoryDataModel })
  data!: CompletedJourneyHistoryDataModel;
}
