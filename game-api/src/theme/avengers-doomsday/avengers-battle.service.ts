import {
  AvengersBattleRepository,
  AVENGERS_FINAL_STAGE_SERVICE,
} from './repository/avengers-battle.repository';
import { Inject, Injectable } from '@nestjs/common';
import { FinalStageService } from '../../final-stage/final-stage.service';
import { PlayCommand } from '../../final-stage/model/engine-play-input.model';
import { TurnResult } from '../../final-stage/model/turn-result.model';
import { AvengersNarrative } from './avengers-narrative.service';
import { AvengersState } from './avengers-state.service';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { BattleSetup } from './model/battle-setup.model';
import { AvengersRuleError } from './error/avengers-rule.error';

@Injectable()
export class AvengersBattleService {
  constructor(
    private readonly state: AvengersState,
    private readonly repository: AvengersBattleRepository,
    @Inject(AVENGERS_FINAL_STAGE_SERVICE)
    private readonly finalStage: FinalStageService<AvengersTurnData>,
    private readonly narrative: AvengersNarrative,
  ) {}

  /** Internal fixture entry point; no Journey, purchase, or HTTP workflow is implied. */
  async create(id: string, setup: BattleSetup): Promise<void> {
    await this.repository.create(id, this.state.ready(setup));
  }

  async play(id: string, command: PlayCommand, lang = 'en') {
    const state = await this.finalStage.play(id, command);
    return this.view(state, lang);
  }

  async get(id: string, lang = 'en') {
    const record = await this.repository.load(id);
    if (!record) {
      throw new AvengersRuleError('BATTLE_NOT_FOUND', 'The Avengers FinalStage was not found.');
    }
    return this.view(record.state, lang);
  }

  private view(state: TurnResult<AvengersTurnData>, lang: string) {
    return {
      state,
      language: this.narrative.language(lang),
      events: this.narrative.timeline(state.data.events, lang),
      timeline: this.narrative.timeline(state.data.timeline, lang),
      availableActions: state.data.availableActions.map((action) => ({
        ...action,
        label: this.narrative.actionLabel(action, lang, state.data),
      })),
    };
  }
}
