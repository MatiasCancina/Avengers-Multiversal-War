import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../basic/error/error-code.enum';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import {
  FinalStageEventApi,
  FinalStageNarrativeLineApi,
  FinalStageStateApi
} from '../../basic/model/game-api/final-contract.model';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { FinalBattleStatusModel, LiveEventLineModel, LiveEventModel, LiveEventsModel } from './model/live-events.model';

const LIVE_EVENTS_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
    message: 'The final stage is not available right now'
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
    message: 'The final stage is not available right now'
  }
}

const LIVE_EVENTS_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
  message: 'Unable to load the live events right now'
}

// sus claves cambian segun el evento (damage en un DAMAGE, apChange en un AP_CHANGE, nada en un ABANDON)
type EventValues = Record<string, unknown> | undefined

@Injectable()
export class LiveEventsService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService
  ) { }

  async getLiveEvents(): Promise<LiveEventsModel> {
    const teamId = this.context.getCurrentTeamId();
    const language = this.context.language;

    try {
      const [state, eventCatalog, heroCatalog] = await Promise.all([
        this.game.finalStage(teamId, language),
        this.game.finalStageEvents(teamId, language),
        this.game.heroes(language),
      ])

      // Map de id de Hero a displayName: get(id) devuelve el nombre o undefined si el id no está.
      const heroNames = new Map<string, string>(heroCatalog.heroes.map((hero): [string, string] => [hero.id, hero.displayName]))

      return {
        battle: this.toBattle(state),
        events: eventCatalog.events.map(event => this.toEvent(event, heroNames))
      }
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        LIVE_EVENTS_API_ERROR_STATUS_MAP,
        LIVE_EVENTS_API_ERROR_FALLBACK
      )
    }
  }

  private toBattle(state: FinalStageStateApi): FinalBattleStatusModel {
    return {
      status: state.status,
      phase: state.phase,
      phaseLabel: state.phaseLabel,
      normalTurn: state.normalTurn,
      turnState: state.turnState,
      playerTeamId: state.participants.playerTeamId,
      opponentTeamId: state.participants.opponentTeamId,
      outcomeCode: state.completion?.outcomeCode ?? null,
      terminalReasonCode: state.completion?.terminalReasonCode ?? null
    }
  }

  private toEvent(event: FinalStageEventApi, heroNames: Map<string, string>): LiveEventModel {
    const actorHeroId = this.readString(event.values, 'actorHeroId')
    const targetHeroIds = this.readStringArray(event.values, 'targetHeroIds')

    return {
      sequence: event.sequence,
      turn: event.turn,
      phase: event.phase,
      eventCode: event.eventCode,
      lines: event.narrative.lines.map(line => this.toLine(line, heroNames)),
      actorHeroId,
      actorHeroName: actorHeroId ? this.heroName(actorHeroId, heroNames) : undefined, // busca el heroId en heroNames para devolver directamente el displayName del heroe, sino devuelve undefined
      targetHeroIds,
      targetHeroNames: targetHeroIds?.map(id => this.heroName(id, heroNames)), // mismo proceso que actorHeroName
      damage: this.readNumber(event.values, 'damage'), // 'damage es el nombre de la clave que busca dentro de values'
      apChange: this.readNumber(event.values, 'apChange')
    }
  }

  private toLine(line: FinalStageNarrativeLineApi, heroNames: Map<string, string>): LiveEventLineModel {
    return {
      type: line.type,
      speakerId: line.speakerId,
      speakerName: line.speakerId ? this.heroName(line.speakerId, heroNames) : null,
      text: line.text,
      lineSequence: line.lineSequence
    }
  }

  //Map<string, string> es un diccionario de clave valor, primer string es clave y segundo string es el valor ("black-widow", "Black Widow")
  private heroName(heroId: string, heroNames: Map<string, string>): string {
    return heroNames.get(heroId) ?? heroId // .get devuelve el valor de esa clave
  }

  // Devuelve values[key] solo si es un string; si falta o es de otro tipo, undefined.
  private readString(values: EventValues, key: string): string | undefined {
    const value = values?.[key]
    return typeof value === 'string' ? value : undefined
  }

  // Number.isFinite descarta NaN e Infinity.
  private readNumber(values: EventValues, key: string): number | undefined {
    const value = values?.[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
  }

  private readStringArray(values: EventValues, key: string): string[] | undefined {
    const value = values?.[key]
    return Array.isArray(value) && value.every(item => typeof item === 'string') ? value : undefined
  }
}
