import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamProfile } from '../model/team-profile.interface';
import { TeamProfileEntity } from '../entity/team-profile.entity';

@Injectable()
export class TeamProfileRepository {
  constructor(
    @InjectRepository(TeamProfileEntity)
    private readonly profiles: Repository<TeamProfileEntity>,
  ) {}

  async findById(teamId: string): Promise<TeamProfile | null> {
    const profile = await this.profiles.findOneBy({ id: teamId });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      themeId: profile.themeId,
    };
  }

  findEntity(teamId: string): Promise<TeamProfileEntity | null> {
    return this.profiles.findOneBy({ id: teamId });
  }

  findByTheme(themeId: string): Promise<TeamProfileEntity[]> {
    return this.profiles.find({ where: { themeId }, order: { name: 'ASC' } });
  }

  save(entity: TeamProfileEntity): Promise<TeamProfileEntity> {
    entity.updatedAt = new Date();
    return this.profiles.save(entity);
  }
}
