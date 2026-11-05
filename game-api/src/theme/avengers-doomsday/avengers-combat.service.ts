import { Injectable } from '@nestjs/common';
import { TeamMemberStatus } from '../../teams/model/team-member-status.enum';
import { AvengersRuleError } from './error/avengers-rule.error';
import { AvengersActions } from './avengers-actions.service';
import { AvengersCatalog } from './avengers-catalog.service';
import { AvengersConfig } from './avengers-config.service';
import { AvengersEvents } from './avengers-events.service';
import { AvengersRandom } from './abstract-avengers-random.provider';
import { AvengersRules, clamp } from './avengers-rules.service';
import { AvengersAction } from './model/avengers-action.model';
import { AvengersTeamState } from './model/avengers-team-state.model';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { CombatEffect } from './model/combat-effect.model';
import { HeroCombatState } from './model/hero-combat-state.model';
import { HeroStats, StatName } from './model/hero-stats.model';

type TeamSide = 'PLAYER' | 'OPPONENT';

@Injectable()
export class AvengersCombat {
  constructor(
    private readonly catalog: AvengersCatalog,
    private readonly config: AvengersConfig,
    private readonly rules: AvengersRules,
    private readonly random: AvengersRandom,
    private readonly events: AvengersEvents,
    private readonly actions: AvengersActions,
  ) {}

  tactical(data: AvengersTurnData, turn: number, side: TeamSide, action: AvengersAction): void {
    const own = side === 'PLAYER' ? data.player : data.opponent;
    // Tactical decisions are recorded in the current turn because they do not
    // advance the combat turn.
    const eventTurn = turn;
    if (action.type === 'CHANGE_STRATEGY') {
      own.strategy = action.strategy;
      own.strategyChangesRemaining--;
      own.strategyChangeAtTurn = turn + this.config.balance.strategyCooldown;
      this.events.emit(data, eventTurn, {
        type: 'STRATEGY_CHANGE',
        source: side,
        actorId: side,
        parameters: { strategy: action.strategy },
      });
    } else if (action.type === 'SWAP') {
      const outgoing = own.heroes.find((hero) => hero.heroId === action.outgoingId)!;
      const incoming = own.heroes.find((hero) => hero.heroId === action.incomingId)!;
      outgoing.status = TeamMemberStatus.INACTIVE;
      outgoing.returnAtTurn = turn + this.config.balance.swapCooldown;
      incoming.status = TeamMemberStatus.ACTIVE;
      own.vacantActiveHeroIds = own.vacantActiveHeroIds.filter((id) => id !== outgoing.heroId);
      this.events.emit(data, eventTurn, {
        type: outgoing.heroId === incoming.heroId ? 'FORMATION_RESTORED' : 'SWAP',
        source: side,
        actorId: incoming.heroId,
        targetIds: [outgoing.heroId],
        parameters: {
          incoming: this.events.name(incoming.heroId, data),
          outgoing: this.events.name(outgoing.heroId, data),
        },
      });
    }
    own.synergy = this.rules.synergy(own, data.content);
  }

  resolve(data: AvengersTurnData, turn: number, side: TeamSide, action: AvengersAction): void {
    const own = side === 'PLAYER' ? data.player : data.opponent;
    const enemy = side === 'PLAYER' ? data.opponent : data.player;
    const enemySide = side === 'PLAYER' ? 'OPPONENT' : 'PLAYER';
    const actor =
      'actorId' in action ? own.heroes.find((hero) => hero.heroId === action.actorId)! : null;
    const stats = actor
      ? this.rules.effectiveStats(own, actor, data.content)
      : this.averageStats(data, own);
    const before = data.timeline.length;
    this.events.emit(data, turn, {
      type: 'ACTION',
      source: side,
      actorId: actor?.heroId ?? side,
      values: { apCost: action.apCost },
      parameters: {
        action: this.actionName(data, own, action),
        actionType: action.type,
        ...(action.type === 'TEAM_ACTION' ? { roleCombination: action.roleCombination } : {}),
      },
    });
    switch (action.type) {
      case 'BASIC_ATTACK': {
        const hit = this.attack(
          data,
          turn,
          side,
          actor!.heroId,
          action.targetId,
          stats,
          'BASIC',
          1,
        );
        if (hit) {
          this.ap(data, turn, side, actor!, this.config.balance.basicAttackApRecovery);
        }
        break;
      }
      case 'OFFENSIVE_SPECIAL': {
        this.ap(data, turn, side, actor!, -action.apCost);
        const definition = this.catalog.hero(actor!.heroId, data.content).offensiveAbility;
        const targets =
          action.targetId === 'DOOM'
            ? ['DOOM']
            : this.rules.active(enemy).map((hero) => hero.heroId);
        const areaMultiplier =
          action.targetId === 'DOOM' ? 1 : this.config.balance.specialTeamMultiplier;
        for (const target of targets) {
          this.attack(
            data,
            turn,
            side,
            actor!.heroId,
            target,
            stats,
            'SPECIAL',
            this.config.balance.specialMultiplier * definition.multiplier * areaMultiplier,
          );
        }
        break;
      }
      case 'SUPPORT_SPECIAL': {
        this.ap(data, turn, side, actor!, -action.apCost);
        const ability = this.catalog.hero(actor!.heroId, data.content).supportAbility;
        if (ability.effect === 'HEAL') {
          this.healTeam(
            data,
            turn,
            side,
            this.config.balance.baseAttackDamage * (0.5 + stats.ability / 100) * ability.potency,
            actor!.heroId,
          );
        } else if (ability.effect === 'CLEANSE') {
          const count = own.effects.filter((effect) => effect.modifier < 0).length;
          own.effects = own.effects.filter((effect) => effect.modifier >= 0);
          this.events.emit(data, turn, {
            type: 'CLEANSE',
            source: side,
            actorId: actor!.heroId,
            targetIds: [side],
            values: { count },
          });
        } else {
          const stat: StatName =
            ability.effect === 'POWER'
              ? 'power'
              : ability.effect === 'RESISTANCE'
                ? 'resistance'
                : 'agility';
          this.effect(
            data,
            turn,
            side,
            side,
            stat,
            ability.potency * (0.5 + stats.ability / 200),
            2,
            'SPECIAL',
          );
        }
        break;
      }
      case 'LEADER_ABILITY': {
        own.leaderAbilityUsesRemaining--;
        const ability = this.catalog.team(own.teamId, data.content).leaderAbility;
        if (ability.effect === 'STRIKE') {
          this.attack(
            data,
            turn,
            side,
            actor!.heroId,
            action.targetId,
            stats,
            'SPECIAL',
            ability.potency,
          );
        } else if (ability.effect === 'HEAL') {
          this.healTeam(
            data,
            turn,
            side,
            this.config.balance.baseAttackDamage * (0.5 + stats.ability / 100) * ability.potency,
            actor!.heroId,
          );
        } else if (ability.effect === 'PROTECT') {
          this.effect(data, turn, side, side, 'resistance', ability.potency, 2, 'LEADER');
        } else if (action.targetId === 'DOOM') {
          this.attack(data, turn, side, actor!.heroId, 'DOOM', stats, 'SPECIAL', 1);
        } else {
          this.effect(data, turn, side, enemySide, 'power', -ability.potency, 2, 'LEADER');
        }
        break;
      }
      case 'TEAM_ACTION': {
        own.teamActionsRemaining--;
        const roles = new Set(
          this.rules
            .active(own)
            .map((hero) => this.catalog.hero(hero.heroId, data.content).primaryRole),
        );
        const coverage =
          1 + Math.max(0, roles.size - 1) * this.config.balance.teamRoleCoverageBonus;
        this.attack(
          data,
          turn,
          side,
          side,
          action.targetId,
          stats,
          'SPECIAL',
          this.config.balance.teamActionMultiplier * coverage * (1 + own.synergy.teamActionBonus),
        );
        break;
      }
      case 'POWER_UP':
        this.powerUp(data, turn, action);
        break;
      case 'SWAP':
      case 'CHANGE_STRATEGY':
        throw new Error('Tactical actions cannot consume a combat turn.');
    }
    const significant = data.timeline
      .slice(before)
      .filter(
        (event) =>
          event.type === 'DAMAGE' && event.source === side && event.targetSide === enemySide,
      )
      .reduce((sum, event) => sum + (event.values.damage ?? 0), 0);
    if (data.rivalry && significant >= this.config.balance.baseAttackDamage * 0.8) {
      const duration = side === 'PLAYER' ? 1 : 2;
      // Momentum protects against the other side's next response. Using Power
      // here would expire before the triggering side could act again.
      this.effect(
        data,
        turn,
        side,
        side,
        'resistance',
        this.config.balance.rivalryModifier,
        duration,
        'RIVALRY',
      );
      this.effect(
        data,
        turn,
        side,
        enemySide,
        'power',
        -this.config.balance.rivalryModifier,
        duration,
        'RIVALRY',
      );
      this.events.emit(data, turn, {
        type: 'RIVALRY',
        source: side,
        actorId: side,
        targetIds: [enemySide],
        targetSide: enemySide,
      });
    }
  }

  attack(
    data: AvengersTurnData,
    turn: number,
    side: TeamSide,
    actorId: string,
    targetId: string,
    stats: HeroStats,
    kind: 'BASIC' | 'SPECIAL',
    multiplier: number,
  ): boolean {
    const enemy = side === 'PLAYER' ? data.opponent : data.player;
    const enemySide = side === 'PLAYER' ? 'OPPONENT' : 'PLAYER';
    const target =
      targetId === 'DOOM' ? null : enemy.heroes.find((hero) => hero.heroId === targetId)!;
    const targetStats = target
      ? this.rules.effectiveStats(enemy, target, data.content)
      : this.rules.doomStats();
    const hit = this.random.next(data) < this.rules.hitChance(stats, targetStats);
    this.events.emit(data, turn, {
      type: hit ? 'ATTACK_HIT' : 'ATTACK_MISS',
      source: side,
      actorId,
      targetIds: [targetId],
      targetSide: targetId === 'DOOM' ? 'DOOM' : enemySide,
    });
    if (!hit) {
      return false;
    }
    const calculatedDamage = this.rules.damage(
      stats,
      targetStats,
      kind,
      multiplier,
      this.random.next(data),
    );
    const damage =
      side === 'OPPONENT' && target
        ? Math.round(calculatedDamage * data.difficultyProfile.opponentHeroDamageToPlayerMultiplier)
        : calculatedDamage;
    if (target) {
      this.damageHero(data, turn, side, enemySide, target, damage, actorId);
    } else {
      if (!data.doom) {
        throw new Error('Doctor Doom is not an active combatant before the reveal.');
      }
      const actual = Math.min(data.doom.currentEnergy, damage);
      data.doom.currentEnergy = Math.max(0, data.doom.currentEnergy - damage);
      this.events.emit(data, turn, {
        type: 'DAMAGE',
        source: side,
        actorId,
        targetIds: ['DOOM'],
        targetSide: 'DOOM',
        values: { damage: actual, energy: data.doom.currentEnergy },
      });
    }
    return true;
  }

  damageHero(
    data: AvengersTurnData,
    turn: number,
    source: 'PLAYER' | 'OPPONENT' | 'DOOM',
    targetSide: TeamSide,
    hero: HeroCombatState,
    damage: number,
    actorId: string,
  ): void {
    const effectiveDamage = Math.max(0, damage);
    const actual = Math.min(hero.currentEnergy, effectiveDamage);
    hero.currentEnergy = Math.max(0, hero.currentEnergy - effectiveDamage);
    this.events.emit(data, turn, {
      type: 'DAMAGE',
      source,
      actorId,
      targetIds: [hero.heroId],
      targetSide,
      values: { damage: actual, energy: hero.currentEnergy },
    });
    if (hero.currentEnergy === 0 && hero.condition !== 'KNOCKED_OUT') {
      const team = targetSide === 'PLAYER' ? data.player : data.opponent;
      if (hero.status === TeamMemberStatus.ACTIVE) {
        team.vacantActiveHeroIds.push(hero.heroId);
      }
      hero.condition = 'KNOCKED_OUT';
      hero.status = TeamMemberStatus.INACTIVE;
      team.synergy = this.rules.synergy(team, data.content);
      this.events.emit(data, turn, {
        type: 'KO',
        source,
        actorId,
        targetIds: [hero.heroId],
        targetSide,
      });
    }
  }

  ap(
    data: AvengersTurnData,
    turn: number,
    side: TeamSide,
    hero: HeroCombatState,
    change: number,
  ): void {
    const previous = hero.currentAbilityPoints;
    hero.currentAbilityPoints = clamp(previous + change, 0, hero.maxAbilityPoints);
    this.events.emit(data, turn, {
      type: 'AP_CHANGE',
      source: side,
      actorId: hero.heroId,
      targetIds: [hero.heroId],
      values: { apChange: hero.currentAbilityPoints - previous, ap: hero.currentAbilityPoints },
    });
  }

  healTeam(
    data: AvengersTurnData,
    turn: number,
    side: TeamSide,
    amount: number,
    actorId?: string,
  ): void {
    const own = side === 'PLAYER' ? data.player : data.opponent;
    for (const hero of this.rules.living(own)) {
      const healing = Math.min(hero.maxEnergy - hero.currentEnergy, Math.round(amount));
      hero.currentEnergy += healing;
      this.events.emit(data, turn, {
        type: 'HEAL',
        source: side,
        actorId,
        targetIds: [hero.heroId],
        values: { healing, energy: hero.currentEnergy },
      });
    }
  }

  effect(
    data: AvengersTurnData,
    turn: number,
    source: 'PLAYER' | 'OPPONENT' | 'DOOM',
    targetSide: TeamSide,
    stat: StatName,
    modifier: number,
    duration: number,
    origin: CombatEffect['source'],
  ): void {
    const team = targetSide === 'PLAYER' ? data.player : data.opponent;
    const effect: CombatEffect = {
      id: `${origin}-${targetSide}-${stat}`,
      stat,
      modifier,
      expiresAfterTurn: turn + duration - 1,
      source: origin,
    };
    // Refresh the same effect instead of allowing unbounded repeated stacks.
    team.effects = team.effects.filter((existing) => existing.id !== effect.id);
    team.effects.push(effect);
    this.events.emit(data, turn, {
      type: 'EFFECT',
      source,
      targetIds: [targetSide],
      targetSide,
      effect,
      values: { percent: Math.round(modifier * 100), duration },
      parameters: { stat, effect: origin },
    });
  }

  expire(data: AvengersTurnData, turn: number): void {
    for (const side of ['PLAYER', 'OPPONENT'] as const) {
      const team = side === 'PLAYER' ? data.player : data.opponent;
      for (const effect of team.effects.filter((value) => value.expiresAfterTurn <= turn)) {
        this.events.emit(data, turn, {
          type: 'EFFECT_EXPIRED',
          source: 'SYSTEM',
          targetIds: [side],
          targetSide: side,
          effect,
          parameters: { effect: effect.source, stat: effect.stat },
        });
      }
      team.effects = team.effects.filter((effect) => effect.expiresAfterTurn > turn);
    }
  }

  averageStats(data: AvengersTurnData, team: AvengersTeamState): HeroStats {
    const active = this.rules.active(team);
    const result: HeroStats = { power: 0, agility: 0, resistance: 0, ability: 0 };
    for (const hero of active) {
      const stats = this.rules.effectiveStats(team, hero, data.content);
      for (const key of ['power', 'agility', 'resistance', 'ability'] as const) {
        result[key] += stats[key] / active.length;
      }
    }
    return result;
  }

  actionName(data: AvengersTurnData, team: AvengersTeamState, action: AvengersAction): string {
    switch (action.type) {
      case 'BASIC_ATTACK':
        return (
          this.catalog.hero(action.actorId, data.content).basicAttack?.localizedName?.en ??
          'Basic Strike'
        );
      case 'OFFENSIVE_SPECIAL':
        return this.catalog.hero(action.actorId, data.content).offensiveAbility.name;
      case 'SUPPORT_SPECIAL':
        return this.catalog.hero(action.actorId, data.content).supportAbility.name;
      case 'LEADER_ABILITY':
        return this.catalog.team(team.teamId, data.content).leaderAbility.name;
      case 'TEAM_ACTION':
        return this.actions.teamActionName(team, data);
      case 'POWER_UP':
        return 'Power-Up';
      case 'SWAP':
        return 'Swap';
      case 'CHANGE_STRATEGY':
        return action.strategy;
      case 'SUE_STORM_APPEAL':
        return 'Talk to Victor';
    }
  }

  private powerUp(
    data: AvengersTurnData,
    turn: number,
    action: Extract<AvengersAction, { type: 'POWER_UP' }>,
  ): void {
    const item = data.inventory.find((value) => value.id === action.itemId && value.quantity > 0);
    if (!item) {
      throw new AvengersRuleError(
        'POWER_UP_UNAVAILABLE',
        'Power-Up is not available in inventory.',
      );
    }
    const effect = item.effect;
    const targets = this.validatePowerUpTarget(data, item, action.targetId);
    item.quantity--;
    this.events.emit(data, turn, {
      type: 'POWER_UP',
      source: 'PLAYER',
      actorId: 'PLAYER',
      targetIds: targets.map((hero) => hero.heroId),
      values: {
        quantityRemaining: item.quantity,
        ...(effect.type === 'EXTRA_TEAM_ACTION' ? { teamActionsChange: 1 } : {}),
        ...(effect.type === 'EXTRA_LEADER_ABILITY' ? { leaderUsesChange: 1 } : {}),
      },
      parameters: { item: item.name, effectType: effect.type },
    });
    switch (effect.type) {
      case 'ENERGY': {
        for (const hero of targets) {
          const healing = Math.min(
            hero.maxEnergy - hero.currentEnergy,
            Math.max(1, Math.round((hero.maxEnergy * effect.percent) / 100)),
          );
          hero.currentEnergy += healing;
          this.events.emit(data, turn, {
            type: 'HEAL',
            source: 'PLAYER',
            targetIds: [hero.heroId],
            values: { healing, energy: hero.currentEnergy },
          });
        }
        break;
      }
      case 'AP':
      case 'AP_PERCENT':
      case 'FULL_AP':
        for (const hero of targets) {
          const amount =
            effect.type === 'AP'
              ? effect.amount
              : effect.type === 'AP_PERCENT'
                ? Math.max(1, Math.round((hero.maxAbilityPoints * effect.percent) / 100))
                : hero.maxAbilityPoints;
          this.ap(data, turn, 'PLAYER', hero, amount);
        }
        break;
      case 'BOOST':
        {
          const scopedEffect: CombatEffect = {
            id: `POWER_UP-PLAYER-${effect.stat}-${turn}`,
            stat: effect.stat,
            modifier: effect.percent / 100,
            expiresAfterTurn: turn + effect.duration - 1,
            source: 'POWER_UP',
            heroIds: targets.map((hero) => hero.heroId),
          };
          data.player.effects.push(scopedEffect);
          this.events.emit(data, turn, {
            type: 'EFFECT',
            source: 'PLAYER',
            targetIds: scopedEffect.heroIds,
            targetSide: 'PLAYER',
            effect: scopedEffect,
            values: { percent: effect.percent, duration: effect.duration },
            parameters: { stat: effect.stat, effect: 'POWER_UP' },
          });
        }
        break;
      case 'REVIVE': {
        const hero = targets[0];
        hero!.currentEnergy = Math.max(
          1,
          Math.round((hero!.maxEnergy * this.config.balance.reviveEnergyPercent) / 100),
        );
        hero!.currentAbilityPoints = Math.round(
          (hero!.maxAbilityPoints * this.config.balance.reviveApPercent) / 100,
        );
        hero!.condition = 'AVAILABLE';
        hero!.status = TeamMemberStatus.INACTIVE;
        hero!.returnAtTurn = turn;
        this.events.emit(data, turn, {
          type: 'REVIVE',
          source: 'PLAYER',
          targetIds: [hero!.heroId],
          values: { energy: hero!.currentEnergy, ap: hero!.currentAbilityPoints },
        });
        break;
      }
      case 'EXTRA_TEAM_ACTION':
        data.player.teamActionsRemaining++;
        break;
      case 'EXTRA_LEADER_ABILITY':
        data.player.leaderAbilityUsesRemaining++;
        break;
    }
  }

  private validatePowerUpTarget(
    data: AvengersTurnData,
    item: AvengersTurnData['inventory'][number],
    targetId: string,
  ): HeroCombatState[] {
    const active = this.rules.active(data.player);
    if (item.target === 'TEAM') {
      if (targetId !== 'OWN_TEAM' || !active.length || item.effect.type === 'REVIVE') {
        throw new AvengersRuleError(
          'POWER_UP_UNAVAILABLE',
          'Team Power-Up target is invalid or unavailable.',
        );
      }
      const useful = active.filter((hero) => {
        switch (item.effect.type) {
          case 'ENERGY':
            return hero.currentEnergy < hero.maxEnergy;
          case 'AP':
          case 'AP_PERCENT':
          case 'FULL_AP':
            return hero.currentAbilityPoints < hero.maxAbilityPoints;
          default:
            return true;
        }
      });
      if (!useful.length) {
        throw new AvengersRuleError(
          'POWER_UP_UNAVAILABLE',
          'Team Power-Up would have no useful effect.',
        );
      }
      // OWN_TEAM always resolves to the complete current Active formation.
      // Capped recovery effects are safe because their application is clamped
      // per Hero; `useful` only prevents consuming an item with no effect.
      return active;
    }

    if (targetId === 'OWN_TEAM') {
      throw new AvengersRuleError(
        'POWER_UP_UNAVAILABLE',
        'Individual Power-Up requires one Hero target.',
      );
    }
    const hero = data.player.heroes.find((value) => value.heroId === targetId);
    const valid = hero
      ? item.effect.type === 'REVIVE'
        ? hero.currentEnergy <= 0
        : hero.currentEnergy > 0 &&
          (item.effect.type === 'ENERGY'
            ? hero.currentEnergy < hero.maxEnergy
            : item.effect.type === 'AP' ||
                item.effect.type === 'AP_PERCENT' ||
                item.effect.type === 'FULL_AP'
              ? hero.currentAbilityPoints < hero.maxAbilityPoints
              : false)
      : false;
    if (!hero || !valid) {
      throw new AvengersRuleError(
        'POWER_UP_UNAVAILABLE',
        'Hero Power-Up target is invalid or unavailable.',
      );
    }
    return [hero];
  }
}
