import { EventInput } from './model/avengers-event.model';
import { Injectable } from '@nestjs/common';
import { AvengersCatalog } from './avengers-catalog.service';
import { AvengersEvent } from './model/avengers-event.model';
import { AvengersTurnData } from './model/avengers-turn-data.model';

@Injectable()
export class AvengersEvents {
  constructor(private readonly catalog: AvengersCatalog) {}

  name(id: string, data?: AvengersTurnData): string {
    if (id === 'DOOM') {
      return 'Doctor Doom';
    }
    if (id === 'PLAYER') {
      return 'Player Team';
    }
    if (id === 'OPPONENT') {
      return 'Opponent Team';
    }
    if (id === 'SILVER_SURFER') {
      return 'Silver Surfer';
    }
    return this.catalog.hero(id, data?.content).name;
  }

  emit(data: AvengersTurnData, turn: number, input: EventInput): void {
    const order = data.timeline.filter((event) => event.turn === turn).length;
    const targets = input.targetIds ?? [];
    const event: AvengersEvent = {
      id: `event-${turn}-${order}`,
      type: input.type,
      narrativeCode: input.type,
      turn,
      order,
      phase: data.phase,
      source: input.source,
      actorId: input.actorId ?? null,
      targetIds: targets,
      targetSide: input.targetSide ?? input.source,
      values: input.values ?? {},
      effect: input.effect ? structuredClone(input.effect) : null,
      parameters: {
        actor: input.actorId ? this.name(input.actorId, data) : input.source,
        target: targets.map((target) => this.name(target, data)).join(', '),
        ...input.values,
        ...input.parameters,
      },
      variant: input.variant ?? (turn + order) % 2,
    };
    data.events.push(event);
    data.timeline.push(event);
  }
}
