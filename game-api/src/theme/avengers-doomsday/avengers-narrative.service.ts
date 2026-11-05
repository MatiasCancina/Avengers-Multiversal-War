import { Injectable } from '@nestjs/common';
import { AvengersAction } from './model/avengers-action.model';
import { AvengersEvent } from './model/avengers-event.model';
import { AvengersLanguage } from './model/avengers-language.model';
import { AvengersTurnData } from './model/avengers-turn-data.model';
import { NarrativeLineType } from './model/narrative-line-type.enum';
import { NarrativeLineModel } from './model/avengers-public-narrative.model';
import { NARRATIVE_TEMPLATES, SPANISH_TERMS } from './content/narrative-templates';

export type NarrativeLine = Omit<NarrativeLineModel, 'lineSequence'>;

@Injectable()
export class AvengersNarrative {
  narration(text: string): NarrativeLineModel {
    return { lineSequence: 1, type: NarrativeLineType.NARRATION, speakerId: null, text };
  }

  language(value?: string): AvengersLanguage {
    return value?.trim().toLowerCase() === 'es' ? 'es' : 'en';
  }

  render(event: AvengersEvent, lang?: string): string {
    return this.renderLines(event, lang)
      .map((line) => line.text)
      .join('\n');
  }

  renderLines(event: AvengersEvent, lang?: string): NarrativeLineModel[] {
    const language = this.language(lang);
    const canonical =
      this.canonicalLines(event, language) ??
      this.canonicalLines({ ...event, type: event.narrativeCode }, language);
    let lines: NarrativeLine[];
    if (canonical) {
      lines = canonical;
    } else {
      const abilityLines = this.abilityActionLines(event, language);
      if (abilityLines) {
        lines = abilityLines;
      } else {
        const variants = NARRATIVE_TEMPLATES[language][event.narrativeCode] ?? [''];
        const template = variants[event.variant % variants.length];
        const text = template.replace(/\{([a-zA-Z]+)\}/g, (_match: string, key: string) => {
          const value = String(event.parameters[key] ?? '');
          return language === 'es' ? (SPANISH_TERMS[value] ?? value) : value;
        });
        lines = [{ type: NarrativeLineType.NARRATION, speakerId: null, text }];
      }
    }
    return lines.map((line, index) => ({ ...line, lineSequence: index + 1 }));
  }

  private abilityActionLines(
    event: AvengersEvent,
    language: AvengersLanguage,
  ): NarrativeLine[] | null {
    if (event.type !== 'ACTION') {
      return null;
    }
    const actionType = String(event.parameters.actionType ?? '');
    if (
      !['BASIC_ATTACK', 'OFFENSIVE_SPECIAL', 'SUPPORT_SPECIAL', 'LEADER_ABILITY'].includes(
        actionType,
      )
    ) {
      return null;
    }
    const actor = String(event.parameters.actor ?? 'Hero');
    const action = String(event.parameters.action ?? 'Signature technique');
    const variants =
      language === 'es'
        ? {
            BASIC_ATTACK: [
              `¡${actor} abre el intercambio con ${action}, un golpe rápido que pone a prueba la defensa!`,
              `¡${actor} descarga ${action} y atraviesa la guardia rival!`,
              `¡${actor} convierte ${action} en un impacto preciso que abre una brecha!`,
            ],
            OFFENSIVE_SPECIAL: [
              `¡${actor} desata ${action} y lo proyecta sobre toda la formación rival!`,
              `¡${actor} lleva ${action} al campo de batalla y golpea la línea enemiga con una ofensiva decisiva!`,
              `¡${actor} despliega ${action} y la formación rival recibe todo el impacto!`,
            ],
            SUPPORT_SPECIAL: [
              `¡${actor} activa ${action} para sostener al equipo en el siguiente intercambio!`,
              `¡${actor} convierte ${action} en una ventaja táctica para todo el equipo!`,
              `¡${actor} recurre a ${action}; los héroes recuperan el control del combate!`,
            ],
            LEADER_ABILITY: [
              `¡${actor} invoca ${action} y marca una orden decisiva para el equipo!`,
              `¡${actor} convierte ${action} en la señal que coordina a todos los héroes!`,
              `¡${actor} alza ${action}; el equipo avanza con un propósito común!`,
            ],
          }[actionType]
        : {
            BASIC_ATTACK: [
              `${actor} opens the exchange with ${action}, a fast strike that tests the defense!`,
              `${actor} drives ${action} through the opposing guard!`,
              `${actor} turns ${action} into a precise impact that opens a gap!`,
            ],
            OFFENSIVE_SPECIAL: [
              `${actor} unleashes ${action}, carrying its full force across the opposing formation!`,
              `With ${action}, ${actor} tears into the opposing line with a decisive assault!`,
              `${actor} brings ${action} to bear, and the opposing formation absorbs the impact!`,
            ],
            SUPPORT_SPECIAL: [
              `${actor} activates ${action} to steady the team for the next exchange!`,
              `${actor} turns ${action} into a tactical advantage for the whole team!`,
              `${actor} calls on ${action}; the heroes regain control of the fight!`,
            ],
            LEADER_ABILITY: [
              `${actor} invokes ${action}, giving the team a decisive command!`,
              `${actor} turns ${action} into the signal that coordinates every Hero!`,
              `${actor} raises ${action}; the team advances with a common purpose!`,
            ],
          }[actionType];
    if (!variants) {
      return null;
    }
    return [
      {
        type: NarrativeLineType.NARRATION,
        speakerId: null,
        text: variants[event.variant % variants.length],
      },
    ];
  }

  timeline(
    events: AvengersEvent[],
    lang?: string,
  ): Array<AvengersEvent & { narrative: NarrativeLineModel[] }> {
    return events.map((event) => ({
      ...structuredClone(event),
      narrative: this.renderLines(event, lang),
    }));
  }

  actionLabel(action: AvengersAction, lang?: string, data?: AvengersTurnData): string {
    if (action.type === 'SUE_STORM_APPEAL') {
      return this.language(lang) === 'es' ? 'Hablar con Victor' : 'Talk to Victor';
    }
    if (data && 'actorId' in action) {
      const hero = data.content?.heroes[action.actorId];
      const ability =
        action.type === 'BASIC_ATTACK'
          ? hero?.basicAttack
          : action.type === 'OFFENSIVE_SPECIAL'
            ? hero?.offensiveAbility
            : action.type === 'SUPPORT_SPECIAL'
              ? hero?.supportAbility
              : undefined;
      if (ability?.localizedName) {
        return ability.localizedName[this.language(lang)];
      }
      if (
        ability &&
        'name' in ability &&
        typeof ability.name === 'string' &&
        ['BASIC_ATTACK', 'OFFENSIVE_SPECIAL', 'SUPPORT_SPECIAL', 'LEADER_ABILITY'].includes(
          action.type,
        )
      ) {
        return ability.name;
      }
    }
    const labels: Record<AvengersAction['type'], [string, string]> = {
      BASIC_ATTACK: ['Basic Attack', 'Ataque básico'],
      OFFENSIVE_SPECIAL: ['Offensive Special', 'Especial ofensivo'],
      SUPPORT_SPECIAL: ['Support Special', 'Especial de apoyo'],
      LEADER_ABILITY: ['Leader Ability', 'Habilidad del líder'],
      TEAM_ACTION: ['Team Action', 'Acción de equipo'],
      POWER_UP: ['Use Power-Up', 'Usar refuerzo'],
      SWAP: ['Swap Heroes', 'Cambiar héroes'],
      CHANGE_STRATEGY: ['Change Strategy', 'Cambiar estrategia'],
      SUE_STORM_APPEAL: ['Talk to Victor', 'Hablar con Victor'],
    };
    return labels[action.type][this.language(lang) === 'es' ? 1 : 0];
  }

  private canonicalLines(event: AvengersEvent, language: AvengersLanguage): NarrativeLine[] | null {
    const player = String(event.parameters.playerLeader ?? 'PLAYER');
    const opponent = String(event.parameters.opponentLeader ?? 'OPPONENT');
    const dialogue = (speakerId: string, text: string): NarrativeLine => ({
      type: NarrativeLineType.DIALOGUE,
      speakerId,
      text,
    });
    const narration = (text: string): NarrativeLine => ({
      type: NarrativeLineType.NARRATION,
      speakerId: null,
      text,
    });
    const en: Record<string, NarrativeLine[]> = {
      TOURNAMENT_FINAL_STARTED: [
        dialogue(
          'silver-surfer',
          'Thirty-two teams answered the call. Only two remain. Fight with everything you have. The multiverse may depend on the team that stands victorious.',
        ),
      ],
      SURFER_ENOUGH: [dialogue('silver-surfer', 'Enough.')],
      DOOM_REVEALED: [
        narration(
          'The silver form fractures. Beneath it, green and steel armor emerges. Doctor Doom stands revealed.',
        ),
      ],
      DOOM_EXPLANATION: [
        dialogue('doctor-doom', 'There was never a war against Dormammu.'),
        dialogue('doctor-doom', 'There was only a test.'),
        dialogue(
          'doctor-doom',
          'You gave Doom exactly what he needed: the strongest heroes from every reality.',
        ),
        dialogue(
          'doctor-doom',
          'These fractured worlds do not need to be saved. They must be remade.',
        ),
      ],
      PLAYER_REJECTION: [
        dialogue(player, 'You brought us here and forced us to fight each other.'),
        dialogue(player, 'The tournament is over.'),
        dialogue(player, "Now we know the truth, and we'll fight you together."),
      ],
      OPPONENT_ALLIANCE: [
        dialogue(opponent, 'No. Doom is right.'),
        dialogue(player, 'What?'),
        dialogue(
          opponent,
          "We've seen endless war and destruction. If Doom can build something better, we'll help him.",
        ),
        dialogue('doctor-doom', 'At last, one of you understands.'),
        dialogue(player, "Then we'll stop you too."),
      ],
      DOOMSDAY_BEGINS: [
        dialogue(
          'doctor-doom',
          'You survived my tournament. Now survive Doom. Let the final battle begin.',
        ),
      ],
      DOOM_ALONE: [
        narration("The last of Doom's allies falls. Doom stands completely alone."),
        dialogue(player, "It's over, Victor. There's no one left at your side."),
        dialogue('doctor-doom', 'They chose to follow me. I never said they were indispensable.'),
        dialogue('doctor-doom', 'Doom needs no allies.'),
        dialogue(
          player,
          "Victor... with all that power, you could help us rebuild these worlds. You don't have to rule them to save them.",
        ),
        narration('Doom remains motionless for a moment.'),
        dialogue('doctor-doom', 'Victor died a long time ago.'),
        dialogue(player, "Then you'll fall alone."),
        narration("Green energy burns around Doom's armor."),
        dialogue('doctor-doom', 'Try.'),
      ],
      VICTORY: [
        narration('Doom falls to his knees. Green energy fractures across his armor.'),
        narration(
          'The heroes who chose to fight beside him look at one another. Certainty disappears from their faces.',
        ),
        dialogue(opponent, "Doom... what's happening?"),
        narration(
          'A green glow rises around Doom and spreads to every hero who chose to follow him.',
        ),
        dialogue(opponent, 'No! Wait—'),
        narration(
          'The energy erupts. For an instant, Doom and his allies hang suspended inside a storm of green light. Then they disappear.',
        ),
        narration('Silence. The Player Team stands alone.'),
        dialogue('doctor-doom', 'You believe this is victory?'),
        dialogue(player, "No. It's a choice."),
        dialogue('doctor-doom', 'And what will you choose when these worlds fail again?'),
        dialogue(player, 'To let them choose for themselves.'),
        narration("Doom's presence fades."),
        narration('THE MULTIVERSE REMAINS FREE.'),
        narration('THE JOURNEY IS COMPLETE.'),
      ],
      DEFEAT: [
        narration('The last hero falls. Doom remains standing with those who chose to follow him.'),
        dialogue('doctor-doom', 'You fought for worlds that could not save themselves.'),
        dialogue(player, 'They were never yours to remake.'),
        dialogue('doctor-doom', 'Everything can be remade.'),
        narration('Doom looks upon the gathered realities.'),
        dialogue(
          'doctor-doom',
          'Remember this moment. Not as the end of your multiverse... but as the beginning of mine.',
        ),
        narration("Doom's allies gather behind him. The old realities begin to tremble."),
        narration("DOOM'S WORLD BEGINS."),
        narration('THE JOURNEY ENDS IN DEFEAT.'),
      ],
      PRE_REVEAL_ABANDON: [
        narration('The Player Team lowers its weapons.'),
        dialogue('silver-surfer', 'Is that all? After everything you sacrificed to come this far?'),
        dialogue(player, "There will be no more battle. It's over."),
        narration('Silver Surfer remains still. For the first time, he smiles.'),
        dialogue('silver-surfer', 'Yes. For you.'),
        narration('The silver light fades. Green and steel armor emerges.'),
        dialogue(
          'doctor-doom',
          'You came farther than entire worlds... and chose to walk away when the moment came to decide their fate.',
        ),
        dialogue(player, 'Doom...'),
        dialogue('doctor-doom', 'Go. History has little use for those who abandon it.'),
        narration('Doom raises one hand. A green glow surrounds the Player Team.'),
        dialogue(player, 'What are you doing?'),
        narration(
          "The heroes try to resist, but Doom's energy closes around them. Their bodies begin to fade in green light.",
        ),
        dialogue(player, 'Doom...!'),
        narration(
          'One by one, they disappear, never learning what will happen to those left behind.',
        ),
        narration('The last image they see is Doom standing before the gathered realities.'),
        dialogue('doctor-doom', 'The multiverse will continue. It simply will do so without you.'),
        narration('THE BATTLE CONTINUES WITHOUT YOU.'),
      ],
      POST_REVEAL_ABANDON: [
        narration('The Player Team lowers its weapons.'),
        dialogue('doctor-doom', 'Is that all?'),
        dialogue(player, "We can't continue."),
        narration('Doom studies the team in silence.'),
        dialogue(
          'doctor-doom',
          'You learned the truth. You chose to defy me. And now you choose to abandon the fight.',
        ),
        dialogue(player, "That doesn't mean you're right."),
        dialogue('doctor-doom', 'No. It means it no longer matters whether I am.'),
        dialogue(
          'doctor-doom',
          'You had your chance to decide the fate of these worlds. You wasted it.',
        ),
        narration('Doom slowly raises one hand. A green glow surrounds the Player Team.'),
        dialogue(player, 'What are you doing?'),
        narration(
          "The heroes try to resist, but Doom's energy holds them in place. Their bodies begin to fade amid flashes of green light.",
        ),
        dialogue(player, 'Doom...!'),
        dialogue('doctor-doom', 'Go. History will not remember those who chose to abandon it.'),
        narration('One by one, the heroes disappear.'),
        narration('Silence.'),
        narration('Doom closes his fist. A new wave of green light sweeps across the battlefield.'),
        narration(
          'This time it surrounds the heroes who chose to follow him. Their wounds disappear. Their energy returns. One by one, even those who had fallen rise again.',
        ),
        narration("Doom's allies, fully restored, advance and take their place beside him."),
        dialogue(opponent, 'And now?'),
        narration('Doom looks upon the gathered realities.'),
        dialogue('doctor-doom', 'Now there is no one left who can stop us.'),
        narration('Doom steps forward. His allies follow.'),
        dialogue('doctor-doom', 'Continue.'),
        narration("DOOM'S WORLD BEGINS."),
      ],
      EARLY_DEFEAT_SCENE: [
        narration(
          'The Player Team lies defeated. The Opponent Team believes it has won the Multiversal Tournament.',
        ),
        dialogue('silver-surfer', 'The tournament is over.'),
        dialogue(opponent, "Then we're ready. Take us to Dormammu."),
        dialogue('silver-surfer', 'There is no war against Dormammu.'),
        narration('The silver form disappears. Doctor Doom stands before the winners.'),
        dialogue(opponent, 'Doom...'),
        dialogue(
          'doctor-doom',
          'Congratulations. You have proven yourselves stronger than the others.',
        ),
        dialogue(opponent, 'You lied to all of us.'),
        dialogue('doctor-doom', 'I gave you the only truth that mattered: victory.'),
        dialogue(
          'doctor-doom',
          'The multiverse does not need another generation of heroes preserving its failures.',
        ),
        dialogue('doctor-doom', 'It needs architects.'),
        dialogue('doctor-doom', 'Stand with Doom, and together we will build something greater.'),
        narration('The Opponent Team looks across the battlefield.'),
        dialogue(
          opponent,
          "If the old worlds can only repeat the same destruction... then we'll help you build something better.",
        ),
        dialogue('doctor-doom', 'Then rise.'),
        dialogue('doctor-doom', 'The tournament is over. Our work begins.'),
      ],
      SUE_STORM_APPEAL: [
        narration('Sue Storm steps forward before attacking.'),
        dialogue('invisible-woman', 'Victor.'),
        narration('Doom stops.'),
        dialogue('doctor-doom', 'That name means nothing anymore.'),
        dialogue('invisible-woman', 'Then why did you stop?'),
        narration('For the first time since revealing his identity, Doom does not answer.'),
        dialogue('invisible-woman', 'Look around you.'),
        dialogue(
          'invisible-woman',
          "You built all of this because you're convinced you're the only one who can save us.",
        ),
        dialogue('doctor-doom', 'Because I am.'),
        dialogue('invisible-woman', 'No.'),
        dialogue(
          'invisible-woman',
          "You're the only one who decided no one else deserved the chance to try.",
        ),
        narration('The green energy around Doom begins to weaken.'),
        dialogue('doctor-doom', 'Careful, Susan.'),
        dialogue('invisible-woman', 'You can still use all that power to help them.'),
        dialogue('invisible-woman', "You don't have to rule these worlds to save them."),
        dialogue('doctor-doom', 'And when they destroy themselves again?'),
        dialogue('invisible-woman', "Then we'll be there."),
        dialogue('invisible-woman', "And if we're wrong, it will be our choice."),
        narration('Doom looks at Sue for a long moment.'),
        dialogue('invisible-woman', "You don't have to prove anything to me, Victor."),
        narration('Silence.'),
        narration('Doom slowly lowers his hand.'),
        dialogue('doctor-doom', 'You were always too optimistic, Susan.'),
        dialogue('invisible-woman', 'And you were always too proud.'),
        narration('For an instant, Doom almost seems to smile behind the mask.'),
        dialogue('doctor-doom', 'Perhaps.'),
        narration('Doom turns toward the gathered realities.'),
        dialogue('doctor-doom', 'Let the multiverse make its choice.'),
        narration('The green energy disappears. Doom fades away without attacking.'),
        dialogue('invisible-woman', 'Goodbye, Victor.'),
        narration('A DIFFERENT CHOICE WAS MADE.'),
        narration('THE MULTIVERSE REMAINS FREE.'),
      ],
    };
    const lines =
      language === 'es'
        ? this.translateCanonical(event.type, en[event.type], player, opponent)
        : en[event.type];
    return lines ?? null;
  }

  private translateCanonical(
    type: string,
    lines: NarrativeLine[] | undefined,
    player: string,
    opponent: string,
  ): NarrativeLine[] | null {
    if (!lines) {
      return null;
    }
    const dialogue = (speakerId: string, text: string): NarrativeLine => ({
      type: NarrativeLineType.DIALOGUE,
      speakerId,
      text,
    });
    const narration = (text: string): NarrativeLine => ({
      type: NarrativeLineType.NARRATION,
      speakerId: null,
      text,
    });
    const canonical: Record<string, NarrativeLine[]> = {
      TOURNAMENT_FINAL_STARTED: [
        dialogue(
          'silver-surfer',
          'Treinta y dos equipos respondieron al llamado. Solo quedan dos. Luchen con todo lo que tienen. El multiverso puede depender del equipo que permanezca en pie.',
        ),
      ],
      SURFER_ENOUGH: [dialogue('silver-surfer', 'Basta.')],
      DOOM_REVEALED: [
        narration(
          'La forma plateada se quiebra. Bajo ella emerge una armadura verde y acero. Doctor Doom aparece.',
        ),
      ],
      DOOM_EXPLANATION: [
        dialogue('doctor-doom', 'Nunca hubo una guerra contra Dormammu.'),
        dialogue('doctor-doom', 'Solo hubo una prueba.'),
        dialogue(
          'doctor-doom',
          'Le dieron a Doom exactamente lo que necesitaba: los héroes más poderosos de cada realidad.',
        ),
        dialogue(
          'doctor-doom',
          'Estos mundos fracturados no necesitan ser salvados. Deben ser recreados.',
        ),
      ],
      PLAYER_REJECTION: [
        dialogue(player, 'Nos trajiste aquí y nos obligaste a luchar entre nosotros.'),
        dialogue(player, 'El torneo terminó.'),
        dialogue(player, 'Ahora conocemos la verdad y lucharemos juntos contra vos.'),
      ],
      OPPONENT_ALLIANCE: [
        dialogue(opponent, 'No. Doom tiene razón.'),
        dialogue(player, '¿Qué?'),
        dialogue(
          opponent,
          'Vimos guerras y destrucción sin fin. Si Doom puede construir algo mejor, lo ayudaremos.',
        ),
        dialogue('doctor-doom', 'Al fin, uno de ustedes lo entiende.'),
        dialogue(player, 'Entonces también los detendremos a ustedes.'),
      ],
      DOOMSDAY_BEGINS: [
        dialogue(
          'doctor-doom',
          'Sobrevivieron a mi torneo. Ahora sobrevivan a Doom. Que comience la batalla final.',
        ),
      ],
      DOOM_ALONE: [
        narration('El último aliado de Doom cae. Doom queda completamente solo.'),
        dialogue(player, 'Se terminó, Victor. Ya no queda nadie a tu lado.'),
        dialogue('doctor-doom', 'Ellos eligieron seguirme. Nunca dije que fueran indispensables.'),
        dialogue('doctor-doom', 'Doom no necesita aliados.'),
        dialogue(
          player,
          'Victor... con todo ese poder podrías ayudarnos a reconstruir estos mundos. No tenés que gobernarlos para salvarlos.',
        ),
        narration('Doom permanece inmóvil por un instante.'),
        dialogue('doctor-doom', 'Victor murió hace mucho tiempo.'),
        dialogue(player, 'Entonces vas a caer solo.'),
        narration('La energía verde vuelve a arder alrededor de la armadura de Doom.'),
        dialogue('doctor-doom', 'Inténtenlo.'),
      ],
      VICTORY: [
        narration(
          'Doom cae de rodillas. La energía de su armadura se quiebra en destellos verdes.',
        ),
        narration(
          'Los héroes que eligieron luchar junto a él se miran entre sí. La certeza desaparece de sus rostros.',
        ),
        dialogue(opponent, 'Doom... ¿qué está pasando?'),
        narration(
          'Un resplandor verde surge alrededor de Doom y alcanza a todos los héroes que eligieron seguirlo.',
        ),
        dialogue(opponent, '¡No! Esperá—'),
        narration(
          'La energía estalla. Durante un instante, Doom y sus aliados quedan suspendidos dentro de una tormenta de luz verde. Entonces desaparecen.',
        ),
        narration('Silencio. El Player Team permanece solo.'),
        dialogue('doctor-doom', '¿Creés que esto es una victoria?'),
        dialogue(player, 'No. Es una elección.'),
        dialogue('doctor-doom', '¿Y qué elegirán cuando estos mundos vuelvan a fracasar?'),
        dialogue(player, 'Dejarlos elegir por sí mismos.'),
        narration('La presencia de Doom desaparece.'),
        narration('THE MULTIVERSE REMAINS FREE.'),
        narration('THE JOURNEY IS COMPLETE.'),
      ],
      DEFEAT: [
        narration('El último héroe cae. Doom permanece en pie junto a quienes eligieron seguirlo.'),
        dialogue('doctor-doom', 'Lucharon por mundos que no podían salvarse a sí mismos.'),
        dialogue(player, 'Nunca fueron tuyos para rehacerlos.'),
        dialogue('doctor-doom', 'Todo puede ser rehecho.'),
        narration('Doom contempla las realidades reunidas.'),
        dialogue(
          'doctor-doom',
          'Recuerden este momento. No como el final de su multiverso... sino como el comienzo del mío.',
        ),
        narration(
          'Los aliados de Doom se reúnen detrás de él. Las viejas realidades comienzan a temblar.',
        ),
        narration("DOOM'S WORLD BEGINS."),
        narration('THE JOURNEY ENDS IN DEFEAT.'),
      ],
      PRE_REVEAL_ABANDON: [
        narration('El Player Team baja sus armas.'),
        dialogue(
          'silver-surfer',
          '¿Eso es todo? ¿Después de todo lo que sacrificaron para llegar hasta aquí?',
        ),
        dialogue(player, 'No habrá otra batalla. Se terminó.'),
        narration('Silver Surfer permanece inmóvil. Por primera vez, sonríe.'),
        dialogue('silver-surfer', 'Sí. Para ustedes.'),
        narration('La luz plateada desaparece. Emerge una armadura verde y acero.'),
        dialogue(
          'doctor-doom',
          'Llegaron más lejos que mundos enteros... y eligieron apartarse cuando llegó el momento de decidir su destino.',
        ),
        dialogue(player, 'Doom...'),
        dialogue('doctor-doom', 'Váyanse. La historia tiene poco uso para quienes la abandonan.'),
        narration('Doom levanta una mano. Un resplandor verde envuelve al Player Team.'),
        dialogue(player, '¿Qué estás haciendo?'),
        narration(
          'Los héroes intentan resistirse, pero la energía de Doom los rodea. Sus cuerpos comienzan a desvanecerse entre destellos verdes.',
        ),
        dialogue(player, '¡Doom...!'),
        narration(
          'Uno a uno desaparecen, sin llegar a saber qué ocurrirá con quienes quedan atrás.',
        ),
        narration('La última imagen que alcanzan a ver es Doom frente a las realidades reunidas.'),
        dialogue('doctor-doom', 'El multiverso seguirá adelante. Simplemente lo hará sin ustedes.'),
        narration('THE BATTLE CONTINUES WITHOUT YOU.'),
      ],
      POST_REVEAL_ABANDON: [
        narration('El Player Team baja sus armas.'),
        dialogue('doctor-doom', '¿Eso es todo?'),
        dialogue(player, 'No podemos seguir.'),
        narration('Doom observa al equipo en silencio.'),
        dialogue(
          'doctor-doom',
          'Conocieron la verdad. Eligieron desafiarme. Y ahora eligen abandonar.',
        ),
        dialogue(player, 'Esto no significa que tengas razón.'),
        dialogue('doctor-doom', 'No. Significa que ya no importa si la tengo.'),
        dialogue(
          'doctor-doom',
          'Tuvieron su oportunidad de decidir el destino de estos mundos. La desperdiciaron.',
        ),
        narration('Doom levanta lentamente una mano. Un resplandor verde envuelve al Player Team.'),
        dialogue(player, '¿Qué estás haciendo?'),
        narration(
          'Los héroes intentan resistirse, pero la energía de Doom los inmoviliza. Sus cuerpos comienzan a desvanecerse entre destellos verdes.',
        ),
        dialogue(player, '¡Doom...!'),
        dialogue(
          'doctor-doom',
          'Váyanse. La historia no recordará a quienes eligieron abandonarla.',
        ),
        narration('Uno a uno, los héroes desaparecen.'),
        narration('Silencio.'),
        narration('Doom cierra el puño. Un nuevo resplandor verde recorre el campo.'),
        narration(
          'Esta vez envuelve a los héroes que eligieron seguirlo. Sus heridas desaparecen. Su energía regresa. Uno a uno, incluso aquellos que habían caído vuelven a ponerse en pie.',
        ),
        narration(
          'Los aliados de Doom, completamente recuperados, avanzan y ocupan su lugar a su lado.',
        ),
        dialogue(opponent, '¿Y ahora?'),
        narration('Doom contempla las realidades reunidas.'),
        dialogue('doctor-doom', 'Ahora ya no queda nadie que pueda detenernos.'),
        narration('Doom da un paso al frente. Sus aliados lo siguen.'),
        dialogue('doctor-doom', 'Continuemos.'),
        narration("DOOM'S WORLD BEGINS."),
      ],
      EARLY_DEFEAT_SCENE: [
        narration(
          'El Player Team yace derrotado. El Opponent Team cree que ganó el Multiversal Tournament.',
        ),
        dialogue('silver-surfer', 'El torneo terminó.'),
        dialogue(opponent, 'Entonces estamos listos. Llevanos ante Dormammu.'),
        dialogue('silver-surfer', 'No existe ninguna guerra contra Dormammu.'),
        narration('La forma plateada desaparece. Doctor Doom queda frente a los vencedores.'),
        dialogue(opponent, 'Doom...'),
        dialogue('doctor-doom', 'Felicitaciones. Demostraron ser más fuertes que los demás.'),
        dialogue(opponent, 'Nos mentiste a todos.'),
        dialogue('doctor-doom', 'Les di la única verdad que importaba: la victoria.'),
        dialogue(
          'doctor-doom',
          'El multiverso no necesita otra generación de héroes preservando sus fracasos.',
        ),
        dialogue('doctor-doom', 'Necesita arquitectos.'),
        dialogue('doctor-doom', 'Únanse a Doom y juntos construiremos algo superior.'),
        narration('El Opponent Team contempla el campo de batalla.'),
        dialogue(
          opponent,
          'Si los viejos mundos solo pueden repetir la misma destrucción... entonces te ayudaremos a construir algo mejor.',
        ),
        dialogue('doctor-doom', 'Entonces levántense.'),
        dialogue('doctor-doom', 'El torneo terminó. Nuestro trabajo comienza.'),
      ],
      SUE_STORM_APPEAL: [
        narration('Sue Storm da un paso al frente antes de atacar.'),
        dialogue('invisible-woman', 'Victor.'),
        narration('Doom se detiene.'),
        dialogue('doctor-doom', 'Ese nombre ya no significa nada.'),
        dialogue('invisible-woman', 'Entonces, ¿por qué te detuviste?'),
        narration('Por primera vez desde que reveló su identidad, Doom no responde.'),
        dialogue('invisible-woman', 'Mirá a tu alrededor.'),
        dialogue(
          'invisible-woman',
          'Construiste todo esto porque estás convencido de que sos el único capaz de salvarnos.',
        ),
        dialogue('doctor-doom', 'Porque lo soy.'),
        dialogue('invisible-woman', 'No.'),
        dialogue('invisible-woman', 'Sos el único que decidió que nadie más merecía intentarlo.'),
        narration('La energía verde alrededor de Doom comienza a debilitarse.'),
        dialogue('doctor-doom', 'Tené cuidado, Susan.'),
        dialogue('invisible-woman', 'Todavía podés usar todo ese poder para ayudarlos.'),
        dialogue('invisible-woman', 'No necesitás gobernar estos mundos para salvarlos.'),
        dialogue('doctor-doom', '¿Y cuando vuelvan a destruirse?'),
        dialogue('invisible-woman', 'Entonces estaremos ahí.'),
        dialogue('invisible-woman', 'Y si nos equivocamos, será nuestra elección.'),
        narration('Doom mira a Sue durante un largo instante.'),
        dialogue('invisible-woman', 'No tenés que demostrarme nada, Victor.'),
        narration('Silencio.'),
        narration('Doom baja lentamente la mano.'),
        dialogue('doctor-doom', 'Siempre fuiste demasiado optimista, Susan.'),
        dialogue('invisible-woman', 'Y vos siempre fuiste demasiado orgulloso.'),
        narration('Por un instante, casi parece que Doom sonríe detrás de la máscara.'),
        dialogue('doctor-doom', 'Quizás.'),
        narration('Doom se vuelve hacia las realidades reunidas.'),
        dialogue('doctor-doom', 'Que el multiverso haga su elección.'),
        narration('La energía verde desaparece. Doom se desvanece sin atacar.'),
        dialogue('invisible-woman', 'Adiós, Victor.'),
        narration('A DIFFERENT CHOICE WAS MADE.'),
        narration('THE MULTIVERSE REMAINS FREE.'),
      ],
    };
    return canonical[type] ?? lines.map((line) => ({ ...line, text: line.text }));
  }
}
