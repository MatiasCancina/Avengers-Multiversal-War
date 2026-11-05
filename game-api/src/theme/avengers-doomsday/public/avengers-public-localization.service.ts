import { Injectable } from '@nestjs/common';
import { LocalizedCodeModel } from '../../../basic/public-api.model';
import { AvengersAction } from '../model/avengers-action.model';
import { AvengersLanguage } from '../model/avengers-language.model';
import { AvengersJourneyEvent } from '../journey/model/avengers-journey-metadata.model';

type Text = { en: string; es: string };

const text = (en: string, es: string): Text => ({ en, es });

const DICTIONARY: Record<string, Record<string, Text>> = {
  combatStrategies: {
    AGGRESSIVE: text(
      'Prioritizes offensive pressure while accepting greater defensive risk.',
      'Prioriza la presión ofensiva y acepta un mayor riesgo defensivo.',
    ),
    DEFENSIVE: text(
      'Prioritizes Resistance and Team survival.',
      'Prioriza la Resistencia y la supervivencia del Equipo.',
    ),
    BALANCED: text(
      'Balances offense, defense, and resource preservation.',
      'Equilibra ataque, defensa y conservación de recursos.',
    ),
    PRAGMATIC: text(
      'Adapts priorities to the current resources and threat.',
      'Adapta las prioridades a los recursos y la amenaza actuales.',
    ),
  },
  journeySpendingStrategies: {
    SAVE: text(
      'Avoids optional automatic spending; a KO Hero may still be revived when possible.',
      'Evita gastos automáticos opcionales; un Héroe KO puede ser revivido cuando sea posible.',
    ),
    BALANCED: text(
      'Prioritizes recovery and survival while preserving Reward Points when possible.',
      'Prioriza recuperación y supervivencia, conservando Puntos de Recompensa cuando sea posible.',
    ),
    AGGRESSIVE: text(
      'Spends more actively on offensive readiness after critical survival needs.',
      'Gasta más activamente en preparación ofensiva luego de cubrir necesidades críticas.',
    ),
  },
  heroRoles: {
    WARRIOR: text('Excels at direct physical combat.', 'Se destaca en el combate físico directo.'),
    AGILE: text(
      'Uses speed and evasion to control combat.',
      'Usa velocidad y evasión para controlar el combate.',
    ),
    TECH: text(
      'Uses advanced equipment and technical abilities.',
      'Usa equipamiento avanzado y habilidades tecnológicas.',
    ),
    MYSTIC: text('Uses supernatural powers and effects.', 'Usa poderes y efectos sobrenaturales.'),
    SUPPORT: text(
      'Protects, restores, or strengthens the Team.',
      'Protege, recupera o fortalece al Equipo.',
    ),
  },
  heroEligibility: {
    PREFERRED: text(
      'May lead a Team and is selected first for generated Leader positions.',
      'Puede liderar un Equipo y se selecciona primero para posiciones de Líder generadas.',
    ),
    ELIGIBLE: text(
      'May lead only when the unused Preferred Leader pool is insufficient.',
      'Puede liderar solo cuando no alcanzan los Líderes Preferidos disponibles.',
    ),
    COMPANION_ONLY: text(
      'May occupy companion positions but never a Leader position.',
      'Puede ocupar posiciones de compañero, pero nunca una posición de Líder.',
    ),
  },
  relationships: {
    ALLY: text(
      'The Heroes have a positive combat relationship.',
      'Los Héroes tienen una relación de combate positiva.',
    ),
    NORMAL: text(
      'The Heroes have no special relationship.',
      'Los Héroes no tienen una relación especial.',
    ),
    RIVAL: text(
      'A significant conflict that takes precedence over Ally and Normal relationships.',
      'Un conflicto significativo que prevalece sobre las relaciones Aliado y Normal.',
    ),
  },
  heroStats: {
    POWER: text(
      'Represents physical or direct offensive strength.',
      'Representa fuerza física u ofensiva directa.',
    ),
    RESISTANCE: text(
      'Represents the ability to withstand damage.',
      'Representa la capacidad de resistir daño.',
    ),
    AGILITY: text(
      'Represents speed, initiative, and evasion.',
      'Representa velocidad, iniciativa y evasión.',
    ),
    ABILITY: text(
      'Represents mastery of powers, technology, or techniques.',
      'Representa el dominio de poderes, tecnología o técnicas.',
    ),
    ENERGY: text(
      'The Hero resource lost through damage.',
      'El recurso del Héroe que disminuye al recibir daño.',
    ),
    ABILITY_POINTS: text(
      'The Hero resource spent on Special abilities.',
      'El recurso del Héroe usado en habilidades Especiales.',
    ),
  },
  abilityTypes: {
    BASIC_ATTACK: text(
      'A standard attack that needs no Ability Points.',
      'Un ataque estándar que no requiere Puntos de Habilidad.',
    ),
    OFFENSIVE_SPECIAL: text(
      'An offensive Hero ability that spends Ability Points.',
      'Una habilidad ofensiva que consume Puntos de Habilidad.',
    ),
    SUPPORT_SPECIAL: text(
      'A support Hero ability that spends Ability Points.',
      'Una habilidad de apoyo que consume Puntos de Habilidad.',
    ),
    LEADER_ABILITY: text(
      'A limited ability available to the Team Leader.',
      'Una habilidad limitada disponible para el Líder del Equipo.',
    ),
    TEAM_ACTION: text(
      'A coordinated action enabled by Team composition and Synergy.',
      'Una acción coordinada habilitada por la composición y Sinergia del Equipo.',
    ),
  },
  supportEffects: {
    HEAL: text(
      'Restores Energy without reviving a KO Hero.',
      'Recupera Energía sin revivir a un Héroe KO.',
    ),
    POWER: text('Temporarily increases Power.', 'Aumenta temporalmente el Poder.'),
    RESISTANCE: text('Temporarily increases Resistance.', 'Aumenta temporalmente la Resistencia.'),
    AGILITY: text('Temporarily increases Agility.', 'Aumenta temporalmente la Agilidad.'),
    ABILITY: text('Temporarily increases Ability.', 'Aumenta temporalmente la Habilidad.'),
    CLEANSE: text(
      'Removes eligible temporary negative effects.',
      'Elimina efectos negativos temporales elegibles.',
    ),
  },
  journeyStages: {
    GROUP_STAGE: text(
      'Eight groups determine the sixteen qualifying Teams.',
      'Ocho grupos determinan los dieciséis Equipos clasificados.',
    ),
    ROUND_OF_16: text(
      'Sixteen Teams compete for Quarterfinal places.',
      'Dieciséis Equipos compiten por lugares en Cuartos de Final.',
    ),
    QUARTERFINAL: text(
      'Eight Teams compete for Semifinal places.',
      'Ocho Equipos compiten por lugares en Semifinales.',
    ),
    SEMIFINAL: text(
      'Four Teams compete for the two FinalStage places.',
      'Cuatro Equipos compiten por los dos lugares de la Etapa Final.',
    ),
    FINAL_STAGE: text(
      'The two finalists enter the interactive final battle.',
      'Los dos finalistas ingresan a la batalla final interactiva.',
    ),
  },
  encounterResults: {
    WIN: text('The Team won the Encounter.', 'El Equipo ganó el Encuentro.'),
    DRAW: text('The Encounter ended level.', 'El Encuentro terminó empatado.'),
    LOSS: text('The Team lost the Encounter.', 'El Equipo perdió el Encuentro.'),
  },
  encounterResolutions: {
    NORMAL: text(
      'Resolved by the normal Encounter rules.',
      'Resuelto por las reglas normales del Encuentro.',
    ),
    TOTAL_KO: text(
      'Resolved because one Team knocked out every opposing Hero.',
      'Resuelto porque un Equipo dejó KO a todos los Héroes rivales.',
    ),
    SPECIAL_SHOWDOWN: text(
      'Resolved through the approved Extra Round Special showdown.',
      'Resuelto mediante el enfrentamiento Especial de la Ronda Extra.',
    ),
    SHOWDOWN_FORFEIT: text(
      'Resolved because only one side had a legal Special caster.',
      'Resuelto porque solo un lado tenía un lanzador Especial legal.',
    ),
    TECHNICAL_VERDICT: text(
      'Resolved by the deterministic seeded technical verdict.',
      'Resuelto por el veredicto técnico determinista con semilla.',
    ),
  },
  journeyEventTypes: {
    ACTION: text('A Hero performed a combat action.', 'Un Héroe realizó una acción de combate.'),
    DAMAGE: text(
      'An attributable combat action caused damage.',
      'Una acción de combate atribuible causó daño.',
    ),
    HEAL: text(
      'An attributable action restored Energy.',
      'Una acción atribuible recuperó Energía.',
    ),
    KO: text('A Hero was knocked out.', 'Un Héroe quedó KO.'),
    STAT_GAIN: text(
      'A Hero gained one permanent Journey stat point.',
      'Un Héroe obtuvo un punto permanente de estadística de Journey.',
    ),
    RECOVERY: text(
      'A configured free recovery checkpoint was applied.',
      'Se aplicó un punto de recuperación gratuita configurado.',
    ),
    AUTO_PURCHASE_USE: text(
      'A Team purchased and used an item automatically.',
      'Un Equipo compró y usó un objeto automáticamente.',
    ),
    ACTION_SKIPPED: text(
      'No legal Hero action could be resolved.',
      'No se pudo resolver una acción legal de Héroe.',
    ),
    SPECIAL_SHOWDOWN: text(
      'An Extra Round Special action was resolved.',
      'Se resolvió una acción Especial de Ronda Extra.',
    ),
    SHOWDOWN_FORFEIT: text(
      'One side forfeited the showdown because it had no legal Special caster.',
      'Un lado perdió el enfrentamiento porque no tenía un lanzador Especial legal.',
    ),
    SHOWDOWN_VERDICT: text(
      'The seeded technical verdict resolved the showdown.',
      'El veredicto técnico con semilla resolvió el enfrentamiento.',
    ),
  },
  rewardConcepts: {
    WIN: text(
      'Reward Points earned for a win.',
      'Puntos de Recompensa obtenidos por una victoria.',
    ),
    DRAW: text('Reward Points earned for a draw.', 'Puntos de Recompensa obtenidos por un empate.'),
    LOSS: text(
      'Reward Points earned for a loss.',
      'Puntos de Recompensa obtenidos por una derrota.',
    ),
    RIVAL_WIN: text(
      'Additional Reward Points earned for defeating a Rival.',
      'Puntos adicionales obtenidos por derrotar a un Rival.',
    ),
    TOTAL_KO_WIN: text(
      'Additional Reward Points earned for an actual total KO win.',
      'Puntos adicionales obtenidos por una victoria real por KO total.',
    ),
    PURCHASE: text(
      'Reward Points spent on a Store purchase.',
      'Puntos de Recompensa gastados en una compra de la Tienda.',
    ),
  },
  powerUpCategories: {
    ENERGY: text(
      'Items that restore a Hero Energy target.',
      'Objetos que recuperan un objetivo de Energía del Héroe.',
    ),
    ABILITY_POINTS: text(
      'Items that restore Ability Points.',
      'Objetos que recuperan Puntos de Habilidad.',
    ),
    REVIVE: text('Items that revive a KO Hero.', 'Objetos que reviven a un Héroe KO.'),
    TEMPORARY_BOOST: text(
      'Items that apply a temporary Team stat increase.',
      'Objetos que aplican un aumento temporal de estadística al Equipo.',
    ),
    EXTRA_RESOURCE: text(
      'Items that add a limited Team or Leader resource.',
      'Objetos que agregan un recurso limitado de Equipo o Líder.',
    ),
  },
  powerUpTargets: {
    HERO: text('The item targets one Hero.', 'El objeto tiene como objetivo a un Héroe.'),
    TEAM: text('The item affects the Team.', 'El objeto afecta al Equipo.'),
  },
  finalStagePhases: {
    TOURNAMENT_FINAL: text(
      'The interactive tournament final between both finalist Teams.',
      'La final interactiva del torneo entre ambos Equipos finalistas.',
    ),
    COMPLETED: text(
      'The FinalStage has reached an authoritative outcome.',
      'La Etapa Final alcanzó un resultado definitivo.',
    ),
  },
  finalStageActions: {
    BASIC_ATTACK: text('Attack one legal opposing Hero.', 'Ataca a un Héroe rival legal.'),
    OFFENSIVE_SPECIAL: text(
      'Use an Offensive Special against a legal target.',
      'Usa un Especial Ofensivo contra un objetivo legal.',
    ),
    SUPPORT_SPECIAL: text(
      'Use a Support Special on the own Team.',
      'Usa un Especial de Apoyo sobre el propio Equipo.',
    ),
    LEADER_ABILITY: text('Use the Leader limited ability.', 'Usa la habilidad limitada del Líder.'),
    TEAM_ACTION: text(
      'Use an available coordinated Team Action.',
      'Usa una Acción de Equipo coordinada disponible.',
    ),
    POWER_UP: text('Use an owned legal Power-Up.', 'Usa un Refuerzo legal disponible.'),
    SWAP: text(
      'Exchange an eligible Active and Inactive Hero.',
      'Intercambia un Héroe Activo y uno Inactivo elegibles.',
    ),
    CHANGE_STRATEGY: text(
      'Change combat Strategy when legal.',
      'Cambia la Estrategia de combate cuando sea legal.',
    ),
  },
  finalStageEventTypes: {
    ACTION: text(
      'A selected or automatic combat action was resolved.',
      'Se resolvió una acción de combate seleccionada o automática.',
    ),
    ATTACK_HIT: text('An attack connected with its target.', 'Un ataque impactó en su objetivo.'),
    ATTACK_MISS: text('An attack missed its target.', 'Un ataque falló contra su objetivo.'),
    DAMAGE: text(
      'A combat source caused attributable damage.',
      'Una fuente de combate causó daño atribuible.',
    ),
    HEAL: text('A combat source restored Energy.', 'Una fuente de combate recuperó Energía.'),
    KO: text('A Hero was knocked out.', 'Un Héroe quedó KO.'),
    AP_CHANGE: text(
      'A Hero gained or spent Ability Points.',
      'Un Héroe obtuvo o gastó Puntos de Habilidad.',
    ),
    REVIVE: text('A KO Hero returned to combat.', 'Un Héroe KO regresó al combate.'),
    EFFECT: text(
      'A temporary combat effect was applied.',
      'Se aplicó un efecto temporal de combate.',
    ),
    EFFECT_EXPIRED: text(
      'A temporary combat effect expired.',
      'Terminó un efecto temporal de combate.',
    ),
    CLEANSE: text(
      'Eligible negative effects were removed.',
      'Se eliminaron efectos negativos elegibles.',
    ),
    SWAP: text('The Active formation changed.', 'Cambió la formación Activa.'),
    FORMATION_RESTORED: text(
      'The engine restored a legal Active formation.',
      'El motor restauró una formación Activa legal.',
    ),
    STRATEGY_CHANGE: text(
      'The Team changed combat Strategy.',
      'El Equipo cambió su Estrategia de combate.',
    ),
    RIVALRY: text(
      'A Rival relationship affected combat.',
      'Una relación de Rivalidad afectó el combate.',
    ),
    POWER_UP: text('A legal Power-Up was consumed.', 'Se consumió un Refuerzo legal.'),
    FINAL_ATTACK: text(
      'The approved climax attack began.',
      'Comenzó el ataque culminante aprobado.',
    ),
    FINAL_RESPONSE: text(
      'The approved climax response resolved.',
      'Se resolvió la respuesta culminante aprobada.',
    ),
    TOURNAMENT_FINAL_STARTED: text(
      'The apparent tournament final began.',
      'Comenzó la aparente final del torneo.',
    ),
    VICTORY: text(
      'The Player reached the authoritative Victory outcome.',
      'El Jugador alcanzó el resultado definitivo Victoria.',
    ),
    DEFEAT: text(
      'The Player reached the authoritative Defeat outcome.',
      'El Jugador alcanzó el resultado definitivo Derrota.',
    ),
    ABANDON: text('The Player abandoned the FinalStage.', 'El Jugador abandonó la Etapa Final.'),
  },
  heroStatuses: {
    ACTIVE: text(
      'The Hero currently occupies an Active formation slot.',
      'El Héroe ocupa actualmente una posición Activa.',
    ),
    INACTIVE: text(
      'The Hero is available on the bench.',
      'El Héroe está disponible en la reserva.',
    ),
    KO: text(
      'The Hero cannot act until legally revived.',
      'El Héroe no puede actuar hasta ser revivido legalmente.',
    ),
  },
  journeyStatuses: {
    PRE_FINAL: text(
      'Journey simulation completed; FinalStage preparation is available.',
      'La simulación de Journey terminó; la preparación de la Etapa Final está disponible.',
    ),
    FINAL_ACTIVE: text(
      'The interactive FinalStage is in progress.',
      'La Etapa Final interactiva está en curso.',
    ),
    COMPLETED: text(
      'The competition has an authoritative final outcome.',
      'La competencia tiene un resultado final definitivo.',
    ),
  },
  completionOutcomes: {
    VICTORY: text('The Player won the FinalStage.', 'El Jugador ganó la Etapa Final.'),
    DEFEAT: text('The Player lost the FinalStage.', 'El Jugador perdió la Etapa Final.'),
    ABANDON: text('The Player abandoned the FinalStage.', 'El Jugador abandonó la Etapa Final.'),
  },
  awards: {
    MIGHTIEST_HERO: text(
      'Highest attributable Damage Dealt among eligible Hero instances.',
      'Mayor Daño Causado atribuible entre las instancias de Héroes elegibles.',
    ),
    BEST_SUPPORT: text(
      'Highest attributable Healing among eligible Hero instances.',
      'Mayor Curación atribuible entre las instancias de Héroes elegibles.',
    ),
    MOST_RESILIENT: text(
      'Lowest KO rate among eligible Heroes with Active Encounters.',
      'Menor tasa de KO entre Héroes elegibles con Encuentros Activos.',
    ),
    JOURNEY_MVP: text(
      'Highest number of Winning Active Rounds.',
      'Mayor cantidad de Rondas Activas Ganadas.',
    ),
  },
  awardMetrics: {
    DAMAGE_DEALT: text('Attributable damage dealt.', 'Daño causado atribuible.'),
    HEALING: text('Attributable Energy restored.', 'Energía restaurada de forma atribuible.'),
    KO_RATE: text(
      'KOs suffered divided by Active Encounters; lower is better.',
      'KOs sufridos divididos por Encuentros Activos; un valor menor es mejor.',
    ),
    WINNING_ACTIVE_ROUNDS: text(
      'Winning rounds in which the Hero was Active.',
      'Rondas ganadas en las que el Héroe estuvo Activo.',
    ),
  },
};

const LABELS: Record<string, Text> = {
  AGGRESSIVE: text('Aggressive', 'Agresiva'),
  DEFENSIVE: text('Defensive', 'Defensiva'),
  BALANCED: text('Balanced', 'Equilibrada'),
  PRAGMATIC: text('Pragmatic', 'Pragmática'),
  SAVE: text('Save', 'Ahorro'),
  WARRIOR: text('Warrior', 'Guerrero'),
  AGILE: text('Agile', 'Ágil'),
  TECH: text('Tech', 'Tecnología'),
  MYSTIC: text('Mystic', 'Místico'),
  SUPPORT: text('Support', 'Apoyo'),
  PREFERRED: text('Preferred Leader', 'Líder Preferido'),
  ELIGIBLE: text('Eligible Leader', 'Líder Elegible'),
  COMPANION_ONLY: text('Companion only', 'Solo Compañero'),
  ALLY: text('Ally', 'Aliado'),
  NORMAL: text('Normal', 'Normal'),
  RIVAL: text('Rival', 'Rival'),
  POWER: text('Power', 'Poder'),
  RESISTANCE: text('Resistance', 'Resistencia'),
  AGILITY: text('Agility', 'Agilidad'),
  ABILITY: text('Ability', 'Habilidad'),
  ENERGY: text('Energy', 'Energía'),
  ABILITY_POINTS: text('Ability Points', 'Puntos de Habilidad'),
  BASIC_ATTACK: text('Basic Attack', 'Ataque básico'),
  OFFENSIVE_SPECIAL: text('Offensive Special', 'Especial ofensivo'),
  SUPPORT_SPECIAL: text('Support Special', 'Especial de apoyo'),
  LEADER_ABILITY: text('Leader Ability', 'Habilidad del Líder'),
  TEAM_ACTION: text('Team Action', 'Acción de Equipo'),
  POWER_UP: text('Use Power-Up', 'Usar Refuerzo'),
  SWAP: text('Swap Heroes', 'Cambiar Héroes'),
  CHANGE_STRATEGY: text('Change Strategy', 'Cambiar Estrategia'),
  HEAL: text('Healing', 'Curación'),
  CLEANSE: text('Cleanse', 'Purificación'),
  GROUP_STAGE: text('Group Stage', 'Fase de Grupos'),
  ROUND_OF_16: text('Round of 16', 'Octavos de Final'),
  QUARTERFINAL: text('Quarterfinal', 'Cuartos de Final'),
  SEMIFINAL: text('Semifinal', 'Semifinal'),
  FINAL_STAGE: text('Final Stage', 'Etapa Final'),
  WIN: text('Win', 'Victoria'),
  DRAW: text('Draw', 'Empate'),
  LOSS: text('Loss', 'Derrota'),
  TOTAL_KO: text('Total KO', 'KO total'),
  SPECIAL_SHOWDOWN: text('Special showdown', 'Enfrentamiento Especial'),
  SHOWDOWN_FORFEIT: text('Showdown forfeit', 'Abandono técnico'),
  TECHNICAL_VERDICT: text('Technical verdict', 'Veredicto técnico'),
  STAT_GAIN: text('Stat gained', 'Estadística mejorada'),
  RECOVERY: text('Recovery', 'Recuperación'),
  AUTO_PURCHASE_USE: text('Automatic purchase and use', 'Compra y uso automático'),
  RIVAL_WIN: text('Rival win bonus', 'Bono por victoria ante Rival'),
  TOTAL_KO_WIN: text('Total KO win bonus', 'Bono por victoria con KO total'),
  PURCHASE: text('Purchase', 'Compra'),
  REVIVE: text('Revive', 'Revivir'),
  TEMPORARY_BOOST: text('Temporary boost', 'Mejora temporal'),
  EXTRA_RESOURCE: text('Extra resource', 'Recurso extra'),
  HERO: text('Hero', 'Héroe'),
  TEAM: text('Team', 'Equipo'),
  TOURNAMENT_FINAL: text('Tournament Final', 'Final del Torneo'),
  DOOMSDAY: text('Doomsday', 'Día del Juicio'),
  FINAL_ATTACK: text('Final Attack', 'Ataque Final'),
  ACTIVE: text('Active', 'Activo'),
  INACTIVE: text('Inactive', 'Inactivo'),
  KO: text('KO', 'KO'),
  PRE_FINAL: text('Pre-Final', 'Pre-Final'),
  FINAL_ACTIVE: text('Final active', 'Final activa'),
  COMPLETED: text('Completed', 'Completada'),
  VICTORY: text('Victory', 'Victoria'),
  DEFEAT: text('Defeat', 'Derrota'),
  ABANDON: text('Abandon', 'Abandono'),
  MIGHTIEST_HERO: text('Mightiest Hero', 'Héroe más poderoso'),
  BEST_SUPPORT: text('Best Support', 'Mejor apoyo'),
  MOST_RESILIENT: text('Most Resilient', 'Héroe más resistente'),
  JOURNEY_MVP: text('Journey MVP', 'MVP de Journey'),
  DAMAGE_DEALT: text('Damage Dealt', 'Daño Causado'),
  HEALING: text('Healing', 'Curación'),
  KO_RATE: text(
    'Average KOs Suffered per Active Encounter',
    'Promedio de KOs Sufridos por Encuentro Activo',
  ),
  WINNING_ACTIVE_ROUNDS: text('Winning Active Rounds', 'Rondas Activas Ganadas'),
};

@Injectable()
export class AvengersPublicLocalization {
  language(value?: string): AvengersLanguage {
    return value?.trim().toLowerCase() === 'es' ? 'es' : 'en';
  }

  label(code: string, lang?: string): string {
    const language = this.language(lang);
    return LABELS[code]?.[language] ?? this.title(code);
  }

  dictionary(lang?: string): Record<string, LocalizedCodeModel[]> {
    const language = this.language(lang);
    return Object.fromEntries(
      Object.entries(DICTIONARY).map(([section, entries]) => [
        section,
        Object.entries(entries).map(([code, value]) => ({
          code,
          label: this.label(code, language),
          description: value[language],
        })),
      ]),
    );
  }

  description(section: string, code: string, lang?: string): string {
    const language = this.language(lang);
    return DICTIONARY[section]?.[code]?.[language] ?? this.label(code, language);
  }

  abilityDescription(
    type: 'OFFENSIVE_SPECIAL' | 'SUPPORT_SPECIAL' | 'LEADER_ABILITY',
    lang?: string,
  ): string {
    return this.description('abilityTypes', type, lang);
  }

  actionDescription(
    action: AvengersAction,
    lang?: string,
    displayName: (id: string) => string = (id) => this.title(id),
  ): string {
    const language = this.language(lang);
    const actor = 'actorId' in action ? displayName(action.actorId) : null;
    if (action.type === 'SWAP') {
      return language === 'es'
        ? `Cambia a ${displayName(action.outgoingId)} por ${displayName(action.incomingId)}.`
        : `Replace ${displayName(action.outgoingId)} with ${displayName(action.incomingId)}.`;
    }
    if (action.type === 'CHANGE_STRATEGY') {
      return language === 'es'
        ? `Cambia la Estrategia a ${this.label(action.strategy, language)}.`
        : `Change Strategy to ${this.label(action.strategy, language)}.`;
    }
    return language === 'es'
      ? `${actor ?? 'El Equipo'} puede usar ${this.label(action.type, language)} contra un objetivo legal.`
      : `${actor ?? 'The Team'} can use ${this.label(action.type, language)} against a legal target.`;
  }

  journeyEvent(
    event: AvengersJourneyEvent,
    lang?: string,
    displayName: (id: string) => string = (id) => this.title(id),
  ): string {
    const language = this.language(lang);
    const team = event.teamId
      ? displayName(event.teamId)
      : language === 'es'
        ? 'el Equipo'
        : 'the Team';
    const actor = event.actorHeroId ? displayName(event.actorHeroId) : team;
    const amount = Number(event.values.damage ?? event.values.healing ?? event.values.amount ?? 0);
    switch (event.type) {
      case 'ACTION':
        return language === 'es'
          ? `${actor} realizó ${this.label(String(event.values.actionType ?? 'ACTION'), language)}.`
          : `${actor} performed ${this.label(String(event.values.actionType ?? 'ACTION'), language)}.`;
      case 'DAMAGE':
        return language === 'es'
          ? `${actor} causó ${amount} de daño.`
          : `${actor} dealt ${amount} damage.`;
      case 'HEAL':
        return language === 'es'
          ? `${actor} recuperó ${amount} de Energía.`
          : `${actor} restored ${amount} Energy.`;
      case 'KO':
        return language === 'es' ? `${actor} causó un KO.` : `${actor} caused a KO.`;
      case 'STAT_GAIN':
        return language === 'es'
          ? `${actor} obtuvo ${event.values.amount} punto de ${this.label(String(event.values.stat), language)}.`
          : `${actor} gained ${event.values.amount} ${this.label(String(event.values.stat), language)} point.`;
      case 'RECOVERY':
        return language === 'es'
          ? `Se aplicó una recuperación configurada al Equipo ${team}.`
          : `A configured recovery was applied to Team ${team}.`;
      case 'AUTO_PURCHASE_USE':
        return language === 'es'
          ? `El Equipo ${team} compró y usó ${this.title(String(event.values.itemId))}.`
          : `Team ${team} purchased and used ${this.title(String(event.values.itemId))}.`;
      default:
        return language === 'es'
          ? `Se registró ${this.label(event.type, language)} para el Equipo ${team}.`
          : `${this.label(event.type, language)} was recorded for Team ${team}.`;
    }
  }

  awardReason(
    code: string,
    value: number | null,
    tieBreak: Record<string, number | string>,
    lang?: string,
  ): string {
    const language = this.language(lang);
    if (value === null) {
      return language === 'es'
        ? 'Ningún Héroe elegible produjo un valor ganador.'
        : 'No eligible Hero produced a winning value.';
    }
    const metric =
      code === 'MIGHTIEST_HERO'
        ? language === 'es'
          ? 'Daño Causado'
          : 'Damage Dealt'
        : code === 'BEST_SUPPORT'
          ? language === 'es'
            ? 'Curación'
            : 'Healing'
          : code === 'MOST_RESILIENT'
            ? language === 'es'
              ? 'tasa de KO'
              : 'KO rate'
            : language === 'es'
              ? 'Rondas Activas Ganadas'
              : 'Winning Active Rounds';
    const extra = Object.keys(tieBreak).length > 0 ? '' : '';
    return language === 'es'
      ? `Ganó con ${value} de ${metric}.${extra}`
      : `Won with ${value} ${metric}.${extra}`;
  }

  title(value: string): string {
    return value
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
