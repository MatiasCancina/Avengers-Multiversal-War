import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AvengersHeroEntity } from '../entity/avengers-hero.entity';
import { AvengersNarrativeCharacterEntity } from '../entity/avengers-narrative-character.entity';

@Injectable()
export class AvengersHeroRepository {
  constructor(
    @InjectRepository(AvengersHeroEntity)
    private readonly heroesRepository: Repository<AvengersHeroEntity>,
    @InjectRepository(AvengersNarrativeCharacterEntity)
    private readonly narrativeRepository: Repository<AvengersNarrativeCharacterEntity>,
  ) {}

  heroes(ids?: string[]): Promise<AvengersHeroEntity[]> {
    return this.heroesRepository.find({
      where: ids?.length
        ? { themeId: 'avengers-doomsday', id: In(ids) }
        : { themeId: 'avengers-doomsday' },
      order: { displayName: 'ASC' },
    });
  }

  hero(id: string): Promise<AvengersHeroEntity | null> {
    return this.heroesRepository.findOneBy({ id, themeId: 'avengers-doomsday' });
  }

  narrativeCharacters(): Promise<AvengersNarrativeCharacterEntity[]> {
    return this.narrativeRepository.find({
      where: { themeId: 'avengers-doomsday' },
      order: { id: 'ASC' },
    });
  }
}
