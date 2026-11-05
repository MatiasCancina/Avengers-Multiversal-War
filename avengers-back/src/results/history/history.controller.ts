import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';

@ApiTags('history')
@Controller('results/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // TODO: Add the feature endpoints during the student implementation.
}
