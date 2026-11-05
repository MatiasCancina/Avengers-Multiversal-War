import { Injectable } from '@nestjs/common';
import { AvengersConfig } from '../avengers-config.service';
import { AvengersHeroContent } from '../catalog/model/avengers-hero-content.model';
import { AvengersMechanics } from '../combat/avengers-mechanics.service';
import { AvengersStrategy } from '../model/avengers-strategy.enum';
import { HeroStats } from '../model/hero-stats.model';
import { AvengersJourneyConfig } from './avengers-journey-config.service';
import { AvengersJourneyRandom, JourneyRandomState } from './avengers-journey-random';
import {
  AvengersEncounter,
  AvengersJourneyEvent,
  AvengersRoundFact,
  AvengersStatGain,
  AvengersTournamentTeam,
  JourneyRoundMode,
} from './model/avengers-journey-metadata.model';

export interface EncounterSimulationInput {
  id: string;
  stageId: string;
  stageType: AvengersEncounter['stageType'];
  groupId: string | null;
  teamA: AvengersTournamentTeam;
  teamB: AvengersTournamentTeam;
  catalog: Map<string, AvengersHeroContent>;
  random: JourneyRandomState;
  playerTeamId: string;
  knockout: boolean;
  requirePlayerEncounterWin?: boolean;
}

interface PlannedAction {
  actorId: string;
  type: 'BASIC_ATTACK' | 'OFFENSIVE_SPECIAL' | 'SUPPORT_SPECIAL' | 'SKIP';
  targetIds: string[];
  rawDamages: number[];
  apCost: number;
  apRecovery: number;
  healing: number;
}

@Injectable()
export class AvengersEncounterSimulator {
  constructor(
    private readonly random: AvengersJourneyRandom,
    private readonly mechanics: AvengersMechanics,
    private readonly finalConfig: AvengersConfig,
    private readonly journeyConfig: AvengersJourneyConfig,
  ) {}

  simulate(input: EncounterSimulationInput): AvengersEncounter {
    const resourcesBefore = new Map(
      [input.teamA, input.teamB].flatMap((team) =>
        team.heroes.map(
          (hero) =>
            [
              `${team.id}:${hero.heroId}`,
              {
                energy: hero.currentEnergy,
                abilityPoints: hero.currentAbilityPoints,
                status: this.publicStatus(hero),
              },
            ] as const,
        ),
      ),
    );
    const playerInEncounter =
      input.teamA.id === input.playerTeamId || input.teamB.id === input.playerTeamId;
    const playerPercentage = playerInEncounter
      ? this.journeyConfig.balance.playerMinWinPercentage +
        this.random.next(input.random) *
          (this.journeyConfig.balance.playerMaxWinPercentage -
            this.journeyConfig.balance.playerMinWinPercentage)
      : null;
    const guaranteedCount =
      playerPercentage === null
        ? 0
        : Math.floor(this.journeyConfig.balance.encounterMaxRounds * playerPercentage);
    const guaranteed = playerInEncounter
      ? new Set(
          this.random
            .shuffle(
              input.random,
              Array.from(
                { length: this.journeyConfig.balance.encounterMaxRounds },
                (_, index) => index + 1,
              ),
            )
            .slice(0, guaranteedCount),
        )
      : new Set<number>();
    if (
      input.requirePlayerEncounterWin &&
      guaranteed.size &&
      !guaranteed.has(this.journeyConfig.balance.encounterMaxRounds)
    ) {
      guaranteed.delete(Math.max(...guaranteed));
      guaranteed.add(this.journeyConfig.balance.encounterMaxRounds);
    }
    const lastGuaranteedRound = guaranteed.size ? Math.max(...guaranteed) : -1;
    const rounds: AvengersRoundFact[] = [];
    let totalA = 0;
    let totalB = 0;
    let resolution: AvengersEncounter['resolution'] = 'NORMAL';
    for (let round = 1; round <= this.journeyConfig.balance.encounterMaxRounds; round += 1) {
      if (!this.living(input.teamA).length || !this.living(input.teamB).length) {
        resolution = 'TOTAL_KO';
        break;
      }
      this.repairFormation(input.teamA);
      this.repairFormation(input.teamB);
      const mode: JourneyRoundMode = guaranteed.has(round) ? 'PLAYER_WIN' : 'NORMAL';
      const playerNeeds =
        input.teamA.id === input.playerTeamId
          ? Math.max(0, totalB - totalA + 1)
          : Math.max(0, totalA - totalB + 1);
      const winningMargin =
        round === lastGuaranteedRound
          ? input.requirePlayerEncounterWin
            ? Math.max(1, playerNeeds)
            : playerNeeds
          : 0;
      const fact = this.round(input, round, mode, winningMargin);
      rounds.push(fact);
      totalA += fact.playerDamage;
      totalB += fact.opponentDamage;
      if (!this.living(input.teamA).length || !this.living(input.teamB).length) {
        resolution = 'TOTAL_KO';
        break;
      }
      for (const team of [input.teamA, input.teamB]) {
        for (const effect of team.temporaryEffects) {
          effect.remainingRounds -= 1;
        }
        team.temporaryEffects = team.temporaryEffects.filter(
          (effect) => effect.remainingRounds > 0,
        );
      }
    }
    let winnerTeamId: string | null = !this.living(input.teamA).length
      ? input.teamB.id
      : !this.living(input.teamB).length
        ? input.teamA.id
        : totalA === totalB
          ? null
          : totalA > totalB
            ? input.teamA.id
            : input.teamB.id;
    let extraRound: AvengersRoundFact | null = null;
    if (input.knockout && !winnerTeamId) {
      const playerInKnockout = playerInEncounter;
      if (playerInKnockout) {
        extraRound = this.showdown(input, 'PLAYER_WIN');
        winnerTeamId = input.playerTeamId;
        resolution = 'SPECIAL_SHOWDOWN';
      } else {
        const showdown = this.aiShowdown(input);
        extraRound = showdown.fact;
        winnerTeamId = showdown.winnerTeamId;
        resolution = showdown.resolution;
      }
      totalA += extraRound.playerDamage;
      totalB += extraRound.opponentDamage;
    }
    if (input.knockout && playerInEncounter && winnerTeamId !== input.playerTeamId) {
      extraRound = this.showdown(input, 'PLAYER_WIN');
      winnerTeamId = input.playerTeamId;
      totalA += extraRound.playerDamage;
      totalB += extraRound.opponentDamage;
      resolution = 'SPECIAL_SHOWDOWN';
    }
    const resultByTeam = {
      [input.teamA.id]:
        winnerTeamId === null ? 'DRAW' : winnerTeamId === input.teamA.id ? 'WIN' : 'LOSS',
      [input.teamB.id]:
        winnerTeamId === null ? 'DRAW' : winnerTeamId === input.teamB.id ? 'WIN' : 'LOSS',
    } as AvengersEncounter['resultByTeam'];
    const statGains = this.progress(input, rounds);
    return {
      id: input.id,
      stageId: input.stageId,
      stageType: input.stageType,
      groupId: input.groupId,
      teamAId: input.teamA.id,
      teamBId: input.teamB.id,
      winnerTeamId,
      resultByTeam,
      damageByTeam: { [input.teamA.id]: totalA, [input.teamB.id]: totalB },
      rounds,
      extraRound,
      resolution,
      rival:
        this.relationship(
          input.catalog.get(input.teamA.leaderId)!,
          input.catalog.get(input.teamB.leaderId)!,
        ) === 'RIVAL',
      rewardByTeam: {},
      statGains,
      resourceConsequences: [input.teamA, input.teamB].map((team) => ({
        teamId: team.id,
        heroes: team.heroes.map((hero) => {
          const before = resourcesBefore.get(`${team.id}:${hero.heroId}`)!;
          return {
            heroId: hero.heroId,
            energyBefore: before.energy,
            energyAfter: hero.currentEnergy,
            abilityPointsBefore: before.abilityPoints,
            abilityPointsAfter: hero.currentAbilityPoints,
            statusBefore: before.status,
            statusAfter: this.publicStatus(hero),
          };
        }),
      })),
    };
  }

  private publicStatus(
    hero: AvengersTournamentTeam['heroes'][number],
  ): 'ACTIVE' | 'INACTIVE' | 'KO' {
    if (hero.knockedOut || hero.currentEnergy === 0) {
      return 'KO';
    }
    return hero.active ? 'ACTIVE' : 'INACTIVE';
  }

  private round(
    input: EncounterSimulationInput,
    round: number,
    mode: JourneyRoundMode,
    encounterWinningMargin: number,
  ): AvengersRoundFact {
    const playerSide =
      input.teamA.id === input.playerTeamId
        ? 'A'
        : input.teamB.id === input.playerTeamId
          ? 'B'
          : null;
    const initiativeA =
      mode === 'PLAYER_WIN' && playerSide
        ? playerSide === 'A'
        : this.random.next(input.random) < 0.5;
    const aMode = mode === 'PLAYER_WIN' && playerSide === 'A';
    const bMode = mode === 'PLAYER_WIN' && playerSide === 'B';
    const actionA = this.planAction(input.teamA, input.teamB, input.catalog, input.random, aMode);
    const actionB = this.planAction(input.teamB, input.teamA, input.catalog, input.random, bMode);
    if (aMode) {
      this.constrainWinningAction(actionA, actionB, encounterWinningMargin);
    }
    if (bMode) {
      this.constrainWinningAction(actionB, actionA, encounterWinningMargin);
    }
    const events: AvengersJourneyEvent[] = [];
    const participants: Record<string, string[]> = {
      [input.teamA.id]: this.active(input.teamA).map((hero) => hero.heroId),
      [input.teamB.id]: this.active(input.teamB).map((hero) => hero.heroId),
    };
    const execute = (
      own: AvengersTournamentTeam,
      enemy: AvengersTournamentTeam,
      action: PlannedAction,
    ): number => {
      if (
        action.type === 'SKIP' ||
        !own.heroes.find((hero) => hero.heroId === action.actorId && !hero.knockedOut)
      ) {
        events.push(
          this.event('ACTION_SKIPPED', own.id, action.actorId || null, [], {
            reason: 'NO_LEGAL_ACTOR',
          }),
        );
        return 0;
      }
      const actor = own.heroes.find((hero) => hero.heroId === action.actorId)!;
      if (action.apCost) {
        actor.currentAbilityPoints = Math.max(0, actor.currentAbilityPoints - action.apCost);
      }
      if (action.apRecovery) {
        actor.currentAbilityPoints = Math.min(
          input.catalog.get(actor.heroId)!.maxAbilityPoints,
          actor.currentAbilityPoints + action.apRecovery,
        );
      }
      events.push(
        this.event('ACTION', own.id, actor.heroId, action.targetIds, {
          actionType: action.type,
          apCost: action.apCost,
        }),
      );
      if (action.type === 'SUPPORT_SPECIAL') {
        for (const hero of own.heroes.filter((value) => !value.knockedOut)) {
          const max = input.catalog.get(hero.heroId)!.maxEnergy;
          const actual = Math.min(max - hero.currentEnergy, action.healing);
          hero.currentEnergy += actual;
          if (actual > 0) {
            events.push(
              this.event('HEAL', own.id, actor.heroId, [hero.heroId], {
                healing: actual,
                energy: hero.currentEnergy,
              }),
            );
          }
        }
        return 0;
      }
      let total = 0;
      for (let index = 0; index < action.targetIds.length; index += 1) {
        const target = enemy.heroes.find((hero) => hero.heroId === action.targetIds[index]);
        if (!target || target.knockedOut) {
          continue;
        }
        const raw = Math.max(0, action.rawDamages[index] ?? 0);
        const preservePlayerPath =
          (input.knockout || input.requirePlayerEncounterWin) &&
          enemy.id === input.playerTeamId &&
          this.living(enemy).length === 1;
        const actual = Math.min(
          target.currentEnergy,
          preservePlayerPath ? Math.min(raw, Math.max(0, target.currentEnergy - 1)) : raw,
        );
        target.currentEnergy -= actual;
        total += actual;
        events.push(
          this.event('DAMAGE', own.id, actor.heroId, [target.heroId], {
            damage: actual,
            energy: target.currentEnergy,
          }),
        );
        if (target.currentEnergy === 0) {
          target.knockedOut = true;
          target.active = false;
          events.push(this.event('KO', own.id, actor.heroId, [target.heroId], {}));
        }
      }
      return total;
    };
    let damageA = 0;
    let damageB = 0;
    if (initiativeA) {
      damageA = execute(input.teamA, input.teamB, actionA);
      if (this.living(input.teamB).length) {
        damageB = execute(input.teamB, input.teamA, actionB);
      }
    } else {
      damageB = execute(input.teamB, input.teamA, actionB);
      if (this.living(input.teamA).length) {
        damageA = execute(input.teamA, input.teamB, actionA);
      }
    }
    if (mode === 'PLAYER_WIN') {
      const playerDamage = playerSide === 'A' ? damageA : damageB;
      const opponentDamage = playerSide === 'A' ? damageB : damageA;
      if (
        playerDamage <= opponentDamage &&
        this.living(playerSide === 'A' ? input.teamB : input.teamA).length
      ) {
        const own = playerSide === 'A' ? input.teamA : input.teamB;
        const enemy = playerSide === 'A' ? input.teamB : input.teamA;
        const actor = own.heroes.find(
          (hero) => hero.heroId === (playerSide === 'A' ? actionA.actorId : actionB.actorId),
        )!;
        let needed = opponentDamage - playerDamage + 1;
        for (const target of this.living(enemy).sort(
          (a, b) => b.currentEnergy - a.currentEnergy || a.heroId.localeCompare(b.heroId),
        )) {
          if (needed <= 0) {
            break;
          }
          const actual = Math.min(target.currentEnergy, needed);
          target.currentEnergy -= actual;
          needed -= actual;
          if (playerSide === 'A') {
            damageA += actual;
          } else {
            damageB += actual;
          }
          events.push(
            this.event('DAMAGE', own.id, actor.heroId, [target.heroId], {
              damage: actual,
              energy: target.currentEnergy,
              constrainedPlayerWin: true,
            }),
          );
          if (target.currentEnergy === 0) {
            target.knockedOut = true;
            target.active = false;
            events.push(this.event('KO', own.id, actor.heroId, [target.heroId], {}));
          }
        }
      }
    }
    const decisivePlayerKo =
      mode === 'PLAYER_WIN' &&
      playerSide !== null &&
      !this.living(playerSide === 'A' ? input.teamB : input.teamA).length;
    const roundWinner = decisivePlayerKo
      ? input.playerTeamId
      : damageA === damageB
        ? null
        : damageA > damageB
          ? input.teamA.id
          : input.teamB.id;
    return {
      round,
      mode,
      initiativeTeamId: initiativeA ? input.teamA.id : input.teamB.id,
      playerDamage: damageA,
      opponentDamage: damageB,
      winnerTeamId: roundWinner,
      participantHeroIds: participants,
      events,
    };
  }

  private planAction(
    own: AvengersTournamentTeam,
    enemy: AvengersTournamentTeam,
    catalog: Map<string, AvengersHeroContent>,
    random: JourneyRandomState,
    mustWin: boolean,
  ): PlannedAction {
    this.repairFormation(own);
    const active = this.active(own).sort((a, b) => a.heroId.localeCompare(b.heroId));
    if (!active.length || !this.living(enemy).length) {
      return {
        actorId: '',
        type: 'SKIP',
        targetIds: [],
        rawDamages: [],
        apCost: 0,
        apRecovery: 0,
        healing: 0,
      };
    }
    const injured = active.some(
      (hero) => hero.currentEnergy / catalog.get(hero.heroId)!.maxEnergy < 0.45,
    );
    const supporters = active.filter((hero) => {
      const ability = catalog.get(hero.heroId)!.supportAbility;
      return ability.effect === 'HEAL' && hero.currentAbilityPoints >= ability.apCost;
    });
    if (
      !mustWin &&
      injured &&
      supporters.length &&
      this.random.next(random) < (own.strategy === AvengersStrategy.DEFENSIVE ? 0.55 : 0.25)
    ) {
      const actor = supporters[this.random.integer(random, supporters.length)];
      const definition = catalog.get(actor.heroId)!;
      return {
        actorId: actor.heroId,
        type: 'SUPPORT_SPECIAL',
        targetIds: own.heroIds,
        rawDamages: [],
        apCost: definition.supportAbility.apCost,
        apRecovery: 0,
        healing: Math.max(1, Math.round(25 * definition.supportAbility.potency)),
      };
    }
    const specialActors = active.filter(
      (hero) => hero.currentAbilityPoints >= catalog.get(hero.heroId)!.offensiveAbility.apCost,
    );
    const useSpecial =
      specialActors.length > 0 &&
      (mustWin ||
        this.random.next(random) < (own.strategy === AvengersStrategy.AGGRESSIVE ? 0.65 : 0.4));
    const actorPool = useSpecial ? specialActors : active;
    const actor = actorPool[this.random.integer(random, actorPool.length)];
    const definition = catalog.get(actor.heroId)!;
    const targets = useSpecial ? this.living(enemy) : [this.chooseTarget(enemy, random)];
    const actorStats = this.effectiveStats(own, actor.heroId, catalog);
    const rawDamages = targets.map((target) => {
      const targetStats = this.effectiveStats(enemy, target.heroId, catalog);
      const hit =
        mustWin || this.random.next(random) < this.mechanics.hitChance(actorStats, targetStats);
      if (!hit) {
        return 0;
      }
      return this.mechanics.damage(
        actorStats,
        targetStats,
        useSpecial ? 'SPECIAL' : 'BASIC',
        useSpecial
          ? definition.offensiveAbility.multiplier *
              this.finalConfig.balance.specialMultiplier *
              this.finalConfig.balance.specialTeamMultiplier
          : 1,
        this.random.next(random),
      );
    });
    return {
      actorId: actor.heroId,
      type: useSpecial ? 'OFFENSIVE_SPECIAL' : 'BASIC_ATTACK',
      targetIds: targets.map((target) => target.heroId),
      rawDamages,
      apCost: useSpecial ? definition.offensiveAbility.apCost : 0,
      apRecovery: useSpecial ? 0 : this.finalConfig.balance.basicAttackApRecovery,
      healing: 0,
    };
  }

  private constrainWinningAction(
    player: PlannedAction,
    opponent: PlannedAction,
    encounterWinningMargin: number,
  ): void {
    const opponentPotential = opponent.rawDamages.reduce((sum, damage) => sum + damage, 0);
    const current = player.rawDamages.reduce((sum, damage) => sum + damage, 0);
    const minimum = opponentPotential + Math.max(1, encounterWinningMargin);
    if (player.rawDamages.length && current < minimum) {
      player.rawDamages[0] += minimum - current;
    }
    // The final selected PLAYER_WIN round owns the Encounter-win constraint.
    // Resolve it directly as a coherent decisive area attack; no candidate search
    // or retry loop is involved, and normal resource/AP costs still apply.
    if (encounterWinningMargin > 0 && player.rawDamages.length > 1) {
      player.rawDamages = player.rawDamages.map(() => Number.MAX_SAFE_INTEGER);
    }
  }

  private showdown(input: EncounterSimulationInput, mode: JourneyRoundMode): AvengersRoundFact {
    this.repairFormation(input.teamA);
    this.repairFormation(input.teamB);
    const playerIsA = input.teamA.id === input.playerTeamId;
    const player = playerIsA ? input.teamA : input.teamB;
    const opponent = playerIsA ? input.teamB : input.teamA;
    const events: AvengersJourneyEvent[] = [];
    const caster =
      this.bestCaster(player, input.catalog) ??
      this.active(player).sort(
        (a, b) => b.currentEnergy - a.currentEnergy || a.heroId.localeCompare(b.heroId),
      )[0];
    if (!caster) {
      throw new Error(
        'Player knockout handoff must preserve one living active Hero for the guaranteed Extra Round.',
      );
    }
    const target = this.living(opponent).sort(
      (a, b) => b.currentEnergy - a.currentEnergy || a.heroId.localeCompare(b.heroId),
    )[0];
    const definition = input.catalog.get(caster.heroId)!;
    const legalSpecial = caster.currentAbilityPoints >= definition.offensiveAbility.apCost;
    if (legalSpecial) {
      caster.currentAbilityPoints -= definition.offensiveAbility.apCost;
    } else {
      caster.currentAbilityPoints = Math.min(
        definition.maxAbilityPoints,
        caster.currentAbilityPoints + this.finalConfig.balance.basicAttackApRecovery,
      );
    }
    const damage = Math.min(
      target.currentEnergy,
      Math.max(
        1,
        this.mechanics.damage(
          this.effectiveStats(player, caster.heroId, input.catalog),
          this.effectiveStats(opponent, target.heroId, input.catalog),
          legalSpecial ? 'SPECIAL' : 'BASIC',
          legalSpecial
            ? definition.offensiveAbility.multiplier * this.finalConfig.balance.specialMultiplier
            : 1,
          this.random.next(input.random),
        ),
      ),
    );
    target.currentEnergy -= damage;
    if (target.currentEnergy === 0) {
      target.knockedOut = true;
      target.active = false;
    }
    events.push(
      this.event('SPECIAL_SHOWDOWN', player.id, caster.heroId, [target.heroId], {
        damage,
        mode,
        actionType: legalSpecial ? 'OFFENSIVE_SPECIAL' : 'BASIC_ATTACK',
      }),
    );
    return {
      round: this.journeyConfig.balance.encounterMaxRounds + 1,
      mode,
      initiativeTeamId: player.id,
      playerDamage: playerIsA ? damage : 0,
      opponentDamage: playerIsA ? 0 : damage,
      winnerTeamId: player.id,
      participantHeroIds: {
        [input.teamA.id]: this.active(input.teamA).map((hero) => hero.heroId),
        [input.teamB.id]: this.active(input.teamB).map((hero) => hero.heroId),
      },
      events,
    };
  }

  private aiShowdown(input: EncounterSimulationInput): {
    fact: AvengersRoundFact;
    winnerTeamId: string;
    resolution: AvengersEncounter['resolution'];
  } {
    this.repairFormation(input.teamA);
    this.repairFormation(input.teamB);
    const a = this.bestCaster(input.teamA, input.catalog);
    const b = this.bestCaster(input.teamB, input.catalog);
    const events: AvengersJourneyEvent[] = [];
    if (!a && !b) {
      const winner = this.random.next(input.random) < 0.5 ? input.teamA.id : input.teamB.id;
      events.push(this.event('SHOWDOWN_VERDICT', winner, null, [], { reason: 'NO_LEGAL_SPECIAL' }));
      return {
        fact: this.showdownFact(input, 0, 0, winner, events),
        winnerTeamId: winner,
        resolution: 'TECHNICAL_VERDICT',
      };
    }
    if (!a || !b) {
      const winnerTeam = a ? input.teamA : input.teamB;
      const loserTeam = a ? input.teamB : input.teamA;
      const caster = a ?? b!;
      const damage = this.resolveShowdownSpecial(
        winnerTeam,
        loserTeam,
        caster.heroId,
        input.catalog,
        input.random,
        events,
      );
      events.push(
        this.event('SHOWDOWN_FORFEIT', loserTeam.id, null, [], { reason: 'NO_LEGAL_SPECIAL' }),
      );
      return {
        fact: this.showdownFact(input, a ? damage : 0, b ? damage : 0, winnerTeam.id, events),
        winnerTeamId: winnerTeam.id,
        resolution: 'SHOWDOWN_FORFEIT',
      };
    }
    const aFirst = this.random.next(input.random) < 0.5;
    let damageA = 0;
    let damageB = 0;
    if (aFirst) {
      damageA = this.resolveShowdownSpecial(
        input.teamA,
        input.teamB,
        a.heroId,
        input.catalog,
        input.random,
        events,
      );
      const validB = this.bestCaster(input.teamB, input.catalog);
      if (validB) {
        damageB = this.resolveShowdownSpecial(
          input.teamB,
          input.teamA,
          validB.heroId,
          input.catalog,
          input.random,
          events,
        );
      }
    } else {
      damageB = this.resolveShowdownSpecial(
        input.teamB,
        input.teamA,
        b.heroId,
        input.catalog,
        input.random,
        events,
      );
      const validA = this.bestCaster(input.teamA, input.catalog);
      if (validA) {
        damageA = this.resolveShowdownSpecial(
          input.teamA,
          input.teamB,
          validA.heroId,
          input.catalog,
          input.random,
          events,
        );
      }
    }
    const winner =
      damageA === damageB
        ? this.random.next(input.random) < 0.5
          ? input.teamA.id
          : input.teamB.id
        : damageA > damageB
          ? input.teamA.id
          : input.teamB.id;
    const resolution = damageA === damageB ? 'TECHNICAL_VERDICT' : 'SPECIAL_SHOWDOWN';
    if (damageA === damageB) {
      events.push(
        this.event('SHOWDOWN_VERDICT', winner, null, [], { reason: 'EQUAL_EFFECTIVE_DAMAGE' }),
      );
    }
    return {
      fact: this.showdownFact(input, damageA, damageB, winner, events),
      winnerTeamId: winner,
      resolution,
    };
  }

  private resolveShowdownSpecial(
    own: AvengersTournamentTeam,
    enemy: AvengersTournamentTeam,
    actorId: string,
    catalog: Map<string, AvengersHeroContent>,
    random: JourneyRandomState,
    events: AvengersJourneyEvent[],
  ): number {
    const actor = own.heroes.find((hero) => hero.heroId === actorId)!;
    const definition = catalog.get(actorId)!;
    actor.currentAbilityPoints -= definition.offensiveAbility.apCost;
    let total = 0;
    for (const target of this.living(enemy)) {
      const raw = this.mechanics.damage(
        this.effectiveStats(own, actorId, catalog),
        this.effectiveStats(enemy, target.heroId, catalog),
        'SPECIAL',
        definition.offensiveAbility.multiplier *
          this.finalConfig.balance.specialMultiplier *
          this.finalConfig.balance.specialTeamMultiplier,
        this.random.next(random),
      );
      const damage = Math.min(target.currentEnergy, raw);
      target.currentEnergy -= damage;
      total += damage;
      if (target.currentEnergy === 0) {
        target.knockedOut = true;
        target.active = false;
      }
      events.push(
        this.event('SPECIAL_SHOWDOWN', own.id, actorId, [target.heroId], {
          damage,
          energy: target.currentEnergy,
        }),
      );
    }
    return total;
  }

  private showdownFact(
    input: EncounterSimulationInput,
    damageA: number,
    damageB: number,
    winner: string,
    events: AvengersJourneyEvent[],
  ): AvengersRoundFact {
    return {
      round: this.journeyConfig.balance.encounterMaxRounds + 1,
      mode: 'NORMAL',
      initiativeTeamId: winner,
      playerDamage: damageA,
      opponentDamage: damageB,
      winnerTeamId: winner,
      participantHeroIds: {
        [input.teamA.id]: this.active(input.teamA).map((hero) => hero.heroId),
        [input.teamB.id]: this.active(input.teamB).map((hero) => hero.heroId),
      },
      events,
    };
  }

  private progress(
    input: EncounterSimulationInput,
    rounds: AvengersRoundFact[],
  ): AvengersStatGain[] {
    const gains: AvengersStatGain[] = [];
    if (!rounds.length) {
      return gains;
    }
    for (const team of [input.teamA, input.teamB]) {
      for (const hero of team.heroes) {
        const activeRounds = rounds.filter((round) =>
          round.participantHeroIds[team.id]?.includes(hero.heroId),
        ).length;
        if (
          !activeRounds ||
          this.random.next(input.random) >=
            (this.journeyConfig.balance.progression.baseChance * activeRounds) / rounds.length
        ) {
          continue;
        }
        const definition = input.catalog.get(hero.heroId)!;
        const available = (['power', 'agility', 'resistance', 'ability'] as const).filter(
          (stat) =>
            definition.stats[stat] + (hero.statGains[stat] ?? 0) <
            this.journeyConfig.balance.progression.statMax,
        );
        if (!available.length) {
          continue;
        }
        const stat = available[this.random.integer(input.random, available.length)];
        hero.statGains[stat] =
          (hero.statGains[stat] ?? 0) + this.journeyConfig.balance.progression.amount;
        gains.push({
          teamId: team.id,
          heroId: hero.heroId,
          stat,
          amount: this.journeyConfig.balance.progression.amount,
        });
      }
    }
    return gains;
  }

  private bestCaster(team: AvengersTournamentTeam, catalog: Map<string, AvengersHeroContent>) {
    let candidates = this.active(team).filter(
      (hero) => hero.currentAbilityPoints >= catalog.get(hero.heroId)!.offensiveAbility.apCost,
    );
    if (!candidates.length) {
      const bench = this.living(team).filter(
        (hero) => hero.currentAbilityPoints >= catalog.get(hero.heroId)!.offensiveAbility.apCost,
      );
      if (bench.length) {
        const next = bench.sort(
          (a, b) =>
            this.effectiveStats(team, b.heroId, catalog).ability -
              this.effectiveStats(team, a.heroId, catalog).ability ||
            a.heroId.localeCompare(b.heroId),
        )[0];
        const outgoing = this.active(team)
          .filter((hero) => hero.heroId !== team.leaderId)
          .sort((a, b) => a.currentEnergy - b.currentEnergy)[0];
        if (outgoing) {
          outgoing.active = false;
        }
        next.active = true;
        candidates = [next];
      }
    }
    return (
      candidates.sort(
        (a, b) =>
          this.effectiveStats(team, b.heroId, catalog).ability -
            this.effectiveStats(team, a.heroId, catalog).ability ||
          a.heroId.localeCompare(b.heroId),
      )[0] ?? null
    );
  }

  private chooseTarget(team: AvengersTournamentTeam, random: JourneyRandomState) {
    const living = this.living(team);
    return living[this.random.integer(random, living.length)];
  }

  private effectiveStats(
    team: AvengersTournamentTeam,
    heroId: string,
    catalog: Map<string, AvengersHeroContent>,
  ): HeroStats {
    const hero = team.heroes.find((value) => value.heroId === heroId)!;
    const definition = catalog.get(heroId)!;
    const base = { ...definition.stats };
    for (const stat of ['power', 'agility', 'resistance', 'ability'] as const) {
      base[stat] += hero.statGains[stat] ?? 0;
    }
    const stats = this.mechanics.effectiveStats(
      base,
      team.leaderProfile,
      team.strategy,
      hero.currentEnergy / definition.maxEnergy,
      hero.currentAbilityPoints >= definition.offensiveAbility.apCost,
    );
    for (const effect of team.temporaryEffects) {
      stats[effect.stat] = Math.min(120, stats[effect.stat] * (1 + effect.percent / 100));
    }
    return stats;
  }

  private active(team: AvengersTournamentTeam) {
    return team.heroes.filter((hero) => hero.active && !hero.knockedOut && hero.currentEnergy > 0);
  }

  private living(team: AvengersTournamentTeam) {
    return team.heroes.filter((hero) => !hero.knockedOut && hero.currentEnergy > 0);
  }

  private repairFormation(team: AvengersTournamentTeam): void {
    const living = this.living(team);
    for (const hero of team.heroes) {
      if (hero.knockedOut || hero.currentEnergy <= 0) {
        hero.active = false;
      }
    }
    const target = Math.min(3, living.length);
    const leader = living.find((hero) => hero.heroId === team.leaderId);
    if (leader) {
      leader.active = true;
    }
    const active = () => this.active(team);
    for (const hero of living.sort(
      (a, b) => b.currentEnergy - a.currentEnergy || a.heroId.localeCompare(b.heroId),
    )) {
      if (active().length < target) {
        hero.active = true;
      }
    }
    for (const hero of active()
      .filter((value) => value.heroId !== team.leaderId)
      .sort((a, b) => a.currentEnergy - b.currentEnergy || b.heroId.localeCompare(a.heroId))) {
      if (active().length > target) {
        hero.active = false;
      }
    }
  }

  private relationship(
    a: AvengersHeroContent,
    b: AvengersHeroContent,
  ): 'ALLY' | 'NORMAL' | 'RIVAL' {
    if (a.rivals.includes(b.id) || b.rivals.includes(a.id)) {
      return 'RIVAL';
    }
    if (a.allies.includes(b.id) || b.allies.includes(a.id)) {
      return 'ALLY';
    }
    return 'NORMAL';
  }

  private event(
    type: string,
    teamId: string,
    actorHeroId: string | null,
    targetHeroIds: string[],
    values: Record<string, number | string | boolean>,
  ): AvengersJourneyEvent {
    return {
      sequence: -1,
      type,
      stageId: null,
      encounterId: null,
      round: null,
      teamId,
      actorHeroId,
      targetHeroIds,
      values,
      messageCode: `journey.${type.toLowerCase()}`,
    };
  }
}
