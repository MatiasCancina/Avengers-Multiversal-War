import { ApiProperty } from '@nestjs/swagger';
import { NarrativeLineType } from './narrative-line-type.enum';

export class NarrativeLineModel {
  @ApiProperty({
    example: 1,
    description: 'One-based chronological order of this line within its narrative block.',
  })
  lineSequence!: number;

  @ApiProperty({
    enum: NarrativeLineType,
    example: NarrativeLineType.NARRATION,
    description: 'One atomic dialogue intervention or speakerless narration line.',
  })
  type!: NarrativeLineType;

  @ApiProperty({
    type: String,
    example: 'doctor-doom',
    nullable: true,
    description: 'The single dialogue speaker identity, or null for narration.',
  })
  speakerId!: string | null;

  @ApiProperty({ example: 'Doom raises one hand.', description: 'One atomic narrative message.' })
  text!: string;
}

export class NarrativeModel {
  @ApiProperty({ type: [NarrativeLineModel], minItems: 1 })
  lines!: NarrativeLineModel[];
}
