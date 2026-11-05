import { Injectable } from '@nestjs/common';
import { GameError } from '../../../../basic/error/game-error';
import { GameErrorCode } from '../../../../basic/error/game-error-code.enum';
import { AvengersJourneyMetadata } from '../model/avengers-journey-metadata.model';
import { AvengersEndingCode } from '../../model/avengers-ending-code.enum';
import { AvengersTerminalReason } from '../../model/avengers-terminal-reason.enum';
import {
  LEGACY_FINAL_BATTLE_DIFFICULTY,
  FinalBattleDifficultyProfile,
} from '../../model/final-battle-difficulty-profile.model';
import { AVENGERS_POWER_UPS } from '../../store/avengers-power-up.catalog';

@Injectable()
export class AvengersJourneyMetadataMapper {
  fromStorage(metadata: Record<string, unknown>): AvengersJourneyMetadata {
    if (!this.isObject(metadata)) {
      throw new Error('Persisted Avengers Journey metadata is incomplete.');
    }
    const value = metadata as unknown as AvengersJourneyMetadata;
    value.endingCode ??= null;
    value.terminalReasonCode ??= null;
    const metadataVersion = value.versions?.metadataVersion;
    if (
      !this.isObject(value.versions) ||
      !['avengers-journey-metadata-v1', 'avengers-journey-metadata-v2'].includes(
        String(metadataVersion),
      )
    ) {
      throw new GameError(
        GameErrorCode.VERSION_UNSUPPORTED,
        `Unsupported Avengers Journey metadata version: ${String(metadataVersion)}.`,
      );
    }
    const turnData = value.finalStage?.data;
    if (turnData) {
      turnData.opponentHadLivingAtActIIStart ??= false;
      turnData.doomAloneNarrativeEmitted ??= false;
      turnData.sueStormAppealStatus ??= 'LOCKED';
      turnData.endingCode ??= null;
      turnData.terminalReasonCode ??= null;
      turnData.difficultyProfile ??= structuredClone(LEGACY_FINAL_BATTLE_DIFFICULTY);
    }
    if (metadataVersion === 'avengers-journey-metadata-v1') {
      this.migrateLegacyPowerUps(value);
      value.versions.metadataVersion = 'avengers-journey-metadata-v2';
    }
    if (!Number.isInteger(value.seed) || value.seed < 0 || value.seed > 0xffffffff) {
      throw new Error('Persisted Journey seed is invalid.');
    }
    if (
      !Number.isInteger(value.randomState) ||
      value.randomState < 0 ||
      value.randomState > 0xffffffff
    ) {
      throw new Error('Persisted Journey random state is invalid.');
    }
    if (!['SAVE', 'BALANCED', 'AGGRESSIVE'].includes(value.spendingStrategy)) {
      throw new Error('Persisted Journey spending strategy is invalid.');
    }
    if (!this.isConfiguration(value.initialConfiguration)) {
      throw new Error('Persisted Team configuration is invalid.');
    }
    if (!this.isCapturedContent(value.content)) {
      throw new Error('Persisted Journey content is invalid.');
    }
    if (
      !Array.isArray(value.teams) ||
      value.teams.length !== 32 ||
      !value.teams.every((team) => this.isTeam(team)) ||
      !Array.isArray(value.stages) ||
      !Array.isArray(value.encounters) ||
      !Array.isArray(value.finalistIds) ||
      value.finalistIds.length !== 2 ||
      !Array.isArray(value.rewardLedger) ||
      !Array.isArray(value.events)
    ) {
      throw new Error('Persisted tournament state is invalid.');
    }
    if (
      !this.isObject(value.finalStage) ||
      !this.isObject(value.finalStage.data) ||
      typeof value.finalStage.status !== 'string'
    ) {
      throw new Error('Persisted FinalStage state is invalid.');
    }
    if (!this.isDifficultyProfile(turnData?.difficultyProfile)) {
      throw new Error('Persisted Final Battle difficulty snapshot is invalid.');
    }
    if (
      turnData?.terminalReasonCode !== null &&
      !Object.values(AvengersTerminalReason).includes(turnData?.terminalReasonCode)
    ) {
      throw new Error('Persisted FinalStage terminal reason is invalid.');
    }
    if (
      value.completionReason !== null &&
      !['VICTORY', 'DEFEAT', 'ABANDON'].includes(value.completionReason)
    ) {
      throw new Error('Persisted completion reason is invalid.');
    }
    if (
      value.endingCode !== null &&
      !Object.values(AvengersEndingCode).includes(value.endingCode)
    ) {
      throw new Error('Persisted ending code is invalid.');
    }
    if (
      value.terminalReasonCode !== null &&
      !Object.values(AvengersTerminalReason).includes(value.terminalReasonCode)
    ) {
      throw new Error('Persisted Journey terminal reason is invalid.');
    }
    if (value.statistics !== null && !this.isObject(value.statistics)) {
      throw new Error('Persisted statistics are invalid.');
    }
    return structuredClone(value);
  }

  toStorage(metadata: AvengersJourneyMetadata): Record<string, unknown> {
    const validated = this.fromStorage(metadata as unknown as Record<string, unknown>);
    return structuredClone(validated) as unknown as Record<string, unknown>;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private isDifficultyProfile(value: unknown): value is FinalBattleDifficultyProfile {
    if (!this.isObject(value)) {
      return false;
    }
    const presets = ['EASY', 'NORMAL', 'HARD', 'LEGACY'];
    return (
      typeof value.preset === 'string' &&
      presets.includes(value.preset) &&
      typeof value.custom === 'boolean' &&
      (value.customPercent === null ||
        (typeof value.customPercent === 'number' &&
          Number.isFinite(value.customPercent) &&
          value.customPercent >= 0.1 &&
          value.customPercent <= 1)) &&
      typeof value.opponentHeroDamageToPlayerMultiplier === 'number' &&
      Number.isFinite(value.opponentHeroDamageToPlayerMultiplier) &&
      value.opponentHeroDamageToPlayerMultiplier >= 0.1 &&
      value.opponentHeroDamageToPlayerMultiplier <= 1 &&
      typeof value.profileVersion === 'string'
    );
  }

  private migrateLegacyPowerUps(metadata: AvengersJourneyMetadata): void {
    const renamedIds: Record<string, string> = {
      'power-boost': 'power-boost-all',
      'resistance-boost': 'resistance-boost-all',
      'agility-boost': 'agility-boost-all',
      'ability-boost': 'ability-boost-all',
      'extra-team-action': 'extra-team-action-all',
      'extra-leader-ability': 'extra-leader-ability-all',
    };
    for (const team of metadata.teams) {
      for (const item of team.inventory) {
        item.itemId = renamedIds[item.itemId] ?? item.itemId;
      }
      const consolidated = new Map<string, number>();
      for (const item of team.inventory) {
        consolidated.set(item.itemId, (consolidated.get(item.itemId) ?? 0) + item.quantity);
      }
      team.inventory = [...consolidated].map(([itemId, quantity]) => ({ itemId, quantity }));
      const activeIds = team.heroes
        .filter((hero) => hero.active && !hero.knockedOut && hero.currentEnergy > 0)
        .map((hero) => hero.heroId);
      for (const effect of team.temporaryEffects) {
        effect.heroIds ??= [...activeIds];
      }
    }
    const itemsById = new Map(AVENGERS_POWER_UPS.map((item) => [item.id, item]));
    for (const item of metadata.finalStage.data.inventory) {
      item.id = renamedIds[item.id] ?? item.id;
      const definition = itemsById.get(item.id);
      if (definition) {
        item.target = definition.target;
        item.name = definition.name.en;
        item.effect = structuredClone(definition.effect);
      }
    }
    const migratedPowerUps = metadata.content.powerUps.map((item) => {
      const id = renamedIds[item.id] ?? item.id;
      const definition = itemsById.get(id);
      return definition ? structuredClone(definition) : { ...item, id };
    });
    const capturedIds = new Set(migratedPowerUps.map((item) => item.id));
    for (const definition of AVENGERS_POWER_UPS) {
      if (!capturedIds.has(definition.id)) {
        migratedPowerUps.push(structuredClone(definition));
      }
    }
    metadata.content.powerUps = migratedPowerUps;
    const activeFinalHeroIds = metadata.finalStage.data.player.heroes
      .filter((hero) => hero.status === 'ACTIVE' && hero.condition === 'AVAILABLE')
      .map((hero) => hero.heroId);
    for (const effect of metadata.finalStage.data.player.effects) {
      if (effect.source === 'POWER_UP') {
        effect.heroIds ??= [...activeFinalHeroIds];
      }
    }
  }

  private isConfiguration(value: unknown): boolean {
    if (!this.isObject(value)) {
      return false;
    }
    return (
      typeof value.leaderId === 'string' &&
      typeof value.visualKey === 'string' &&
      typeof value.strategy === 'string' &&
      Array.isArray(value.companionIds) &&
      value.companionIds.length === 5 &&
      value.companionIds.every((id) => typeof id === 'string') &&
      Array.isArray(value.activeHeroIds) &&
      value.activeHeroIds.length === 3 &&
      value.activeHeroIds.every((id) => typeof id === 'string')
    );
  }

  private isCapturedContent(value: unknown): boolean {
    return (
      this.isObject(value) &&
      Array.isArray(value.heroes) &&
      value.heroes.length >= 12 &&
      Array.isArray(value.narrativeCharacters) &&
      Array.isArray(value.powerUps)
    );
  }

  private isTeam(value: unknown): boolean {
    if (!this.isObject(value)) {
      return false;
    }
    return (
      typeof value.id === 'string' &&
      typeof value.leaderId === 'string' &&
      Array.isArray(value.heroIds) &&
      value.heroIds.length === 6 &&
      Array.isArray(value.heroes) &&
      value.heroes.length === 6 &&
      Number.isFinite(value.rewardPoints) &&
      Array.isArray(value.inventory)
    );
  }
}
