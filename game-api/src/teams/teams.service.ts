import { Injectable } from '@nestjs/common';
import { GameError } from '../basic/error/game-error';
import { GameErrorCode } from '../basic/error/game-error-code.enum';
import { TeamProfileRepository } from './repository/team-profile.repository';
import { TeamProfileModel } from './model/team-profile.model';

@Injectable()
export class TeamsService {
  constructor(private readonly teamProfiles: TeamProfileRepository) {}

  async getProfile(teamId: string, lang = 'en'): Promise<TeamProfileModel> {
    const profile = await this.teamProfiles.findById(teamId);

    if (!profile) {
      throw new GameError(GameErrorCode.TEAM_NOT_FOUND, 'Team was not found.');
    }

    const spanish = lang.trim().toLowerCase() === 'es';
    const leaderName = profile.name.replace(/ Team$/, '');
    const result: TeamProfileModel = {
      id: profile.id,
      name: spanish ? `Equipo ${leaderName}` : profile.name,
      description: spanish
        ? `El Equipo asignado del Torneo Multiversal liderado por ${leaderName}.`
        : profile.description,
    };

    return result;
  }
}
