import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JourneyAttemptEntity } from '../entity/journey-attempt.entity';

@Injectable()
export class JourneyAttemptRepository {
  constructor(
    @InjectRepository(JourneyAttemptEntity)
    private readonly attempts: Repository<JourneyAttemptEntity>,
  ) {}

  findById(id: string): Promise<JourneyAttemptEntity | null> {
    return this.attempts.findOneBy({ id });
  }

  findOwned(id: string, teamId: string): Promise<JourneyAttemptEntity | null> {
    return this.attempts.findOneBy({ id, teamId });
  }

  save(entity: JourneyAttemptEntity): Promise<JourneyAttemptEntity> {
    entity.updatedAt = new Date();
    return this.attempts.save(entity);
  }

  remove(entity: JourneyAttemptEntity): Promise<JourneyAttemptEntity> {
    return this.attempts.remove(entity);
  }

  history(teamId: string, skip: number, take: number): Promise<[JourneyAttemptEntity[], number]> {
    return this.attempts.findAndCount({
      where: { teamId, status: 'COMPLETED' },
      order: { completedAt: 'DESC', createdAt: 'DESC' },
      skip,
      take,
    });
  }
}
