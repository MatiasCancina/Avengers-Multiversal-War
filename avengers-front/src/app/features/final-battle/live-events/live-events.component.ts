import { Component, OnInit } from '@angular/core';
import { LiveEventsService } from './service/live-events.service';
import { AppCopyKey, AppLanguage, I18nService } from '../../../../app/core/services/i18n.service';
import { LiveEventsViewModel } from './model/live-events-view-model.interface';
import { LiveEventApi, LiveEventLineApi } from './model/live-events-api.interface';

// diccionario de codigos de la API (ej: 'DAMAGE', 'VICTORY', 'COMPLETED')
type LabelMap = Partial<Record<string, AppCopyKey>>;

const EVENT_LABELS: LabelMap = {
  TOURNAMENT_FINAL_STARTED: 'r10.event.tournamentFinalStarted',
  ACTION: 'r10.event.action',
  ATTACK_HIT: 'r10.event.attackHit',
  ATTACK_MISS: 'r10.event.attackMiss',
  EFFECT: 'r10.event.effect',
  EFFECT_EXPIRED: 'r10.event.effectExpired',
  DAMAGE: 'r10.event.damage',
  AP_CHANGE: 'r10.event.apChange',
  STRATEGY_CHANGE: 'r10.event.strategyChange',
  SWAP: 'r10.event.swap',
  PLAYER_REJECTION: 'r10.event.playerRejection',
  OPPONENT_ALLIANCE: 'r10.event.opponentAlliance',
  SURFER_ENOUGH: 'r10.event.surferEnough',
  DOOM_REVEALED: 'r10.event.doomRevealed',
  DOOM_EXPLANATION: 'r10.event.doomExplanation',
  DOOMSDAY_BEGINS: 'r10.event.doomsdayBegins',
  DOOM_INTERVENTION: 'r10.event.doomIntervention',
  INITIALIZED: 'r10.event.initialized',
  HEAL: 'r10.event.heal',
  KO: 'r10.event.ko',
  REVIVE: 'r10.event.revive',
  CLEANSE: 'r10.event.cleanse',
  FORMATION_RESTORED: 'r10.event.formationRestored',
  RIVALRY: 'r10.event.rivalry',
  DOOM_THREAT: 'r10.event.doomThreat',
  POWER_UP: 'r10.event.powerUp',
  FINAL_ATTACK: 'r10.event.finalAttack',
  FINAL_RESPONSE: 'r10.event.finalResponse',
  VICTORY: 'r10.event.victory',
  DEFEAT: 'r10.event.defeat',
  POST_REVEAL_ABANDON: 'r10.event.postRevealAbandon',
  EARLY_DEFEAT_SCENE: 'r10.event.earlyDefeatScene',
  DOOM_ALONE: 'r10.event.doomAlone',
  EARLY_DEFEAT_REVEAL: 'r10.event.earlyDefeatReveal',
  SUE_STORM_APPEAL: 'r10.event.sueStormAppeal',
  PRE_REVEAL_ABANDON: 'r10.event.preRevealAbandon',
  ABANDON: 'r10.event.abandon',
};

const STATUS_LABELS: LabelMap = {
  READY: 'r10.state.ready',
  ACTIVE: 'r10.state.active',
  COMPLETED: 'r10.state.completed',
};

const OUTCOME_LABELS: LabelMap = {
  VICTORY: 'r10.result.victory',
  DEFEAT: 'r10.result.defeat',
  ABANDON: 'r10.result.abandon',
};

@Component({
  selector: 'app-live-events',
  templateUrl: './live-events.component.html',
  styleUrls: ['./live-events.component.css'],
  standalone: false,
})
export class LiveEventsComponent implements OnInit {
  readonly simulateJourneyPath = '/journey/simulate';

  constructor(
    private readonly liveEventsService: LiveEventsService,
    readonly i18nService: I18nService,
  ) {}

  get pageState(): LiveEventsViewModel {
    return this.liveEventsService.getViewModel();
  }

  ngOnInit(): void {
    this.liveEventsService.initialize();
  }

  refresh(): void {
    this.liveEventsService.refresh();
  }

  // Delegan en I18nService.
  // key: clave válida del diccionario. lang: idioma de pageState.lang.
  // params: valores para los {placeholders} del texto (ej. { turn: 3 }). Devuelve el texto traducido.
  translate(
    key: AppCopyKey,
    lang: AppLanguage,
    params: Record<string, string | number> = {},
  ): string {
    return this.i18nService.translate(key, lang, params);
  }

  // Etiquetas legibles para códigos de la API; si no hay etiqueta, se muestra el código tal cual.
  eventLabel(eventCode: string): string {
    return this.label(EVENT_LABELS, eventCode);
  }

  statusLabel(status: string): string {
    return this.label(STATUS_LABELS, status);
  }

  outcomeLabel(outcomeCode: string): string {
    return this.label(OUTCOME_LABELS, outcomeCode);
  }

  // En READY todavía no empezó la Final; en otro estado es que aún no hay eventos registrados.
  emptyMessage(): string {
    const key: AppCopyKey =
      this.pageState.data?.battle.status === 'READY' ? 'r10.notStarted' : 'r10.emptyEvents';
    return this.translate(key, this.pageState.lang);
  }

  hasApChange(event: LiveEventApi): boolean {
    return event.apChange !== undefined && event.apChange !== 0;
  }

  // true si el evento tiene al menos un dato para mostrar; evita dibujar un bloque vacío.
  // la expresion !! convierte el valor en booleano
  hasFacts(event: LiveEventApi): boolean {
    return (
      !!event.actorHeroName ||
      !!event.targetHeroNames?.length ||
      event.damage !== undefined ||
      this.hasApChange(event)
    );
  }

  // ambos tracks sirven para el trackBy del *ngFor en el html
  trackEvent(_index: number, event: LiveEventApi): number {
    return event.sequence;
  }

  trackLine(_index: number, line: LiveEventLineApi): number {
    return line.lineSequence;
  }

  private label(labels: LabelMap, code: string): string {
    const key = labels[code]; //busca el codigo y devuelve la clave de code o undefined si no esta en el map
    return key ? this.translate(key, this.pageState.lang) : code;
  }
}
