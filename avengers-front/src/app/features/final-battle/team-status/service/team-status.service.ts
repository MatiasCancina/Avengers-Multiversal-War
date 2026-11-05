
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TeamStatusHero {
  heroId: string;
  status: string;
  condition: string;
  maximumEnergy: number;
  currentEnergy: number;
  maximumAbilityPoints: number;
  currentAbilityPoints: number;
  returnAtTurn: number;
}

export interface TeamStatusTeam {
  teamId: string;
  leaderId: string;
  strategyCode: string;
  heroes: TeamStatusHero[];
  vacantActiveHeroIds: string[];
  synergyCode: string;
  teamActionsRemaining: number;
  leaderAbilityUsesRemaining: number;
  strategyChangesRemaining: number;
}

export interface TeamStatusResponse {
  serverTime: string;
  success: boolean;
  responseMessage: {
    messageCode: string;
    message: string;
  };
  data: {
    teamId: string;
    attemptId: string;
    finalState: {
      variant: string;
      attemptId: string;
      status: string;
      phase: string;
      phaseLabel: string;
      normalTurn: number;
      turnState: string;
      participants: {
        playerTeamId: string;
        opponentTeamId: string;
      };
      completion: {
        outcomeCode: string;
        terminalReasonCode: string;
        endingEventSequences: number[];
      } | null;
    };
    finalists: {
      playerTeamId: string;
      opponentTeamId: string;
    };
    teams: TeamStatusTeam[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class TeamStatusService {
  private readonly apiUrl =
    `${environment.apiBaseUrl}/final-stage`;

  constructor(private readonly http: HttpClient) {}

  getStatus(): Observable<TeamStatusResponse> {
    return this.http.get<TeamStatusResponse>(this.apiUrl);
  }
}
