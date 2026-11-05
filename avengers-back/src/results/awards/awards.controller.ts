import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AwardsService } from './awards.service';

@ApiTags('awards')
@Controller('results/awards')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  // TODO: Add the feature endpoints during the student implementation.
}
