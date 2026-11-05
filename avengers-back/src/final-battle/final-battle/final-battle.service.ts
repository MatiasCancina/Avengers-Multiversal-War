import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../basic/error/error-code.enum';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { GameFeatureApiService } from '../../basic/game-feature-api.service';
import { ApplicationContextService } from '../../basic/services/application-context.service';
import { FinalInventoryApi, FinalPowerUpApi, FinalPowerUpCatalogApi, FinalStageActionApi, FinalStageDoomApi, FinalStageHeroApi, FinalStagePlayBodyApi, FinalStageSideApi, FinalStageStateApi } from '../../basic/model/game-api/final-contract.model';
import { FinalBattleAbilityModel, FinalBattleActionOptionModel, FinalBattleDoomModel, FinalBattleHeroModel, FinalBattleInventoryItemModel, FinalBattleModel, FinalBattlePlayResultModel, FinalBattleSideModel, FinalBattleStateModel } from './model/final-battle.model';
import { PlayFinalStageRequest } from './request/play-final-stage.request';

const FINAL_BATTLE_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
    message: 'Final Battle is not available right now.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
    message: 'Final Battle is not available right now.',
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
    message: 'The selected action is no longer legal.',
  },
};

const FINAL_BATTLE_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: ErrorCode.FINAL_STAGE_UNAVAILABLE,
  message: 'Unable to load the Final Battle right now.',
};

@Injectable()
export class FinalBattleService {
  constructor(
    private readonly context: ApplicationContextService,
    private readonly game: GameFeatureApiService
  ) { }

  async getFinalBattle(): Promise<FinalBattleModel> {
    const teamId = this.context.getCurrentTeamId()
    const language = this.context.language

    try {
      const state = await this.game.finalStage(teamId, language)
      const hasStarted = state.status !== "READY"
      const isActive = state.status === "ACTIVE"
      const showInventory = state.status !== "COMPLETED"
      // Trae teams cuando status es ACTIVE o COMPLETED
      // Trae actions SOLO cuando status es ACTIVE
      const [teams, actionCatalog, heroCatalog, inventory, powerUpCatalog] = await Promise.all([
        hasStarted ? this.game.finalStageTeams(teamId) : Promise.resolve(null),
        isActive ? this.game.finalStageActions(teamId, language) : Promise.resolve(null),
        this.game.heroes(language),
        showInventory ? this.game.inventory(teamId) : Promise.resolve(null),
        showInventory ? this.game.powerUps(teamId, language) : Promise.resolve(null),
      ])

      const heroNames = new Map<string, string>(
        heroCatalog.heroes.map((hero): [string, string] => [hero.id, hero.displayName])
      )

      const { heroActions, teamActions } = this.groupActions(actionCatalog?.actions ?? [], heroNames)

      return {
        state: this.toState(state),
        teams: teams ? {
          player: this.toSide(teams.player, heroNames),
          opponent: this.toSide(teams.opponent, heroNames)
        } : null,
        doom: teams?.doom ? this.toDoom(teams.doom) : null,
        heroActions,
        teamActions,
        inventory: inventory && powerUpCatalog ? this.toInventory(inventory, powerUpCatalog) : [],
      }
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        FINAL_BATTLE_API_ERROR_STATUS_MAP,
        FINAL_BATTLE_API_ERROR_FALLBACK
      )
    }
  }

  async playFinalBattle(request: PlayFinalStageRequest): Promise<FinalBattlePlayResultModel> {
    const teamId = this.context.teamId;
    const language = this.context.language;

    const body: FinalStagePlayBodyApi = request.type === 'CHOOSE_ACTION' ?
      { type: request.type, actionId: request.actionId } :
      { type: request.type }

      try {
      const result = await this.game.playFinalStage(teamId, body, language)
      return {
        status: result.status,
        phase: result.phase,
        normalTurn: result.normalTurn,
        completionOutcome: result.completionOutcome,
        terminalReasonCode: result.terminalReasonCode,
        nextDecisionRequired: result.nextDecisionRequired
      }
    } catch (error) {
      ErrorUtils.mapGameApiError(
        error,
        FINAL_BATTLE_API_ERROR_STATUS_MAP,
        FINAL_BATTLE_API_ERROR_FALLBACK
      )
    }
  }

  private toState(state: FinalStageStateApi): FinalBattleStateModel {
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

  private toSide(side: FinalStageSideApi, heroNames: Map<string, string>): FinalBattleSideModel {
    return {
      teamId: side.teamId,
      leaderId: side.leaderId,
      strategyCode: side.strategyCode,
      heroes: side.heroes.map(hero => this.toHero(hero, heroNames)),
      vacantActiveHeroIds: side.vacantActiveHeroIds,
      synergyCode: side.synergyCode,
      teamActionsRemaining: side.teamActionsRemaining,
      leaderAbilityUsesRemaining: side.leaderAbilityUsesRemaining,
      strategyChangesRemaining: side.strategyChangesRemaining
    }
  }

  private toDoom(doom: FinalStageDoomApi): FinalBattleDoomModel {
    return {
      narrativeCharacterId: doom.narrativeCharacterId,
      maximumEnergy: doom.maximumEnergy,
      currentEnergy: doom.currentEnergy,
      threatLevelCode: doom.threatLevelCode,
    }
  }

  private toHero(hero: FinalStageHeroApi, heroNames: Map<string, string>): FinalBattleHeroModel {
    return {
      heroId: hero.heroId,
      heroName: this.heroName(hero.heroId, heroNames),
      status: hero.status,
      condition: hero.condition,
      maximumEnergy: hero.maximumEnergy,
      currentEnergy: hero.currentEnergy,
      maximumAbilityPoints: hero.maximumAbilityPoints,
      currentAbilityPoints: hero.currentAbilityPoints,
      returnAtTurn: hero.returnAtTurn
    }
  }

  // Une el inventario (itemId y cantidad) con el catálogo (nombre, alcance y efecto) por itemId.
  // Solo quedan los ítems que la Game API declara usables en la Final.
  private toInventory(inventory: FinalInventoryApi, catalog: FinalPowerUpCatalogApi): FinalBattleInventoryItemModel[] {
    const powerUps = new Map<string, FinalPowerUpApi>(
      catalog.powerUps.map((powerUp): [string, FinalPowerUpApi] => [powerUp.id, powerUp])
    )

    return inventory.items
      .filter(item => item.legalUseContexts.includes('FINAL_STAGE'))
      .map(item => {
        const powerUp = powerUps.get(item.itemId)
        return {
          itemId: item.itemId,
          name: powerUp?.name ?? item.itemId,
          description: powerUp?.description ?? '',
          quantity: item.quantity,
          targetScope: powerUp?.targetScope ?? 'HERO',
          effectCode: powerUp?.effect.effectCode ?? ''
        }
      })
  }

  // Agrupa la lista plana de acciones de la Game API en acciones por Héroe (heroActions)
  // y acciones de equipo (teamActions). No modifica, filtra ni ordena ninguna acción:
  // cada una termina en exactamente una opción, con su actionId intacto.
  private groupActions(actions: FinalStageActionApi[], heroNames: Map<string, string>) {
    // Héroe -> (clave de habilidad -> grupo). Un Map conserva el orden de inserción, así que
    // Héroes, grupos y opciones salen en el mismo orden en que los publica la Game API.
    const abilitiesByHero = new Map<string, Map<string, FinalBattleAbilityModel>>()
    // Acciones sin actor (TEAM_ACTION, CHANGE_STRATEGY y SWAP).
    const teamAbilities = new Map<string, FinalBattleAbilityModel>()

    for (const action of actions) {
      // Contenedor: los grupos del Héroe que actúa o, si no hay actor, los de equipo.
      let groups = teamAbilities

      if (action.actorHeroId) {
        let heroGroups = abilitiesByHero.get(action.actorHeroId)

        if (!heroGroups) {
          heroGroups = new Map()
          abilitiesByHero.set(action.actorHeroId, heroGroups)
        }

        groups = heroGroups
      }

      // Una habilidad es el mismo código, habilidad, combinación de roles y costo. El costo va
      // en la clave para que un grupo nunca mezcle costos distintos. La clave es única solo
      // dentro de su contenedor, no entre Héroes.
      const groupKey = [
        action.actionCode,
        action.abilityId ?? '',
        action.itemId ?? '',
        action.roleCombination ?? '',
        action.cost.abilityPoints,
      ].join('|')

      // El grupo se crea la primera vez que aparece la habilidad y después se reutiliza.
      let group = groups.get(groupKey)
      if (!group) {
        group = {
          groupKey,
          actionCode: action.actionCode,
          label: action.label,
          description: action.description,
          abilityId: action.abilityId,
          itemId: action.itemId,
          roleCombination: action.roleCombination,
          abilityPointCost: action.cost.abilityPoints,
          options: []
        }
        groups.set(groupKey, group)
      }
      group.options.push(this.toOption(action, heroNames))

      // La description del grupo solo se conserva si todas sus opciones la comparten.
      // SWAP y CHANGE_STRATEGY describen distinto cada opción, y ahí la del grupo sería engañosa.
      if (group.description !== undefined && group.description !== action.description) {
        group.description = undefined
      }
    }
    return {
      // Array.from sobre un Map recibe [clave, valor] y los convierte en objetos del contrato.
      heroActions: Array.from(abilitiesByHero, ([actorHeroId, groups]) => ({
        actorHeroId,
        actorHeroName: this.heroName(actorHeroId, heroNames),
        abilities: Array.from(groups.values())
      })),
      teamActions: Array.from(teamAbilities.values())
    }
  }

  // Convierte una acción de la Game API en una opción de un grupo.
  // actionId se copia sin modificar: es opaco y lo necesita el POST de play.
  private toOption(action: FinalStageActionApi, heroNames: Map<string, string>): FinalBattleActionOptionModel {
    return {
      actionId: action.actionId,
      description: action.description,
      // CHANGE_STRATEGY y SWAP publican target null; el resto trae un target.
      target: action.target ?
        {
          targetType: action.target.targetType,
          targetId: action.target.targetId,
          targetName: action.target.targetType === 'HERO' //Si targetType es TEAM, no hay targetName ya que se identifica como 'player' u 'opponent'
            ? this.heroName(action.target.targetId, heroNames)
            : undefined,
          sideCode: action.target.sideCode
        }
        : null,
      strategyCode: action.strategyCode,
      // Solo existen en SWAP: el nombre se resuelve únicamente si el campo viene.
      outgoingHeroId: action.outgoingHeroId,
      outgoingHeroName: action.outgoingHeroId ? this.heroName(action.outgoingHeroId, heroNames) : undefined,
      incomingHeroId: action.incomingHeroId,
      incomingHeroName: action.incomingHeroId ? this.heroName(action.incomingHeroId, heroNames) : undefined,
    }
  }

  // Nombre del catálogo o, si el id no está, el id tal cual (no se inventa un nombre).
  private heroName(heroId: string, heroNames: Map<string, string>): string {
    return heroNames.get(heroId) ?? heroId
  }
}
