import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamProfileEntity } from './entity/team-profile.entity';
import { TeamProfileRepository } from './repository/team-profile.repository';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamProfileEntity])],
  controllers: [TeamsController],
  providers: [TeamsService, TeamProfileRepository],
})
export class TeamsModule {}
