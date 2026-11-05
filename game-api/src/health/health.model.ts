import { ApiProperty } from '@nestjs/swagger';
import { SuccessResponseModel } from '../basic/public-api.model';

export class HealthDataModel {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'game-api' })
  service!: string;

  @ApiProperty({ example: '0.1.0' })
  version!: string;
}

export class HealthResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: HealthDataModel })
  data!: HealthDataModel;
}
