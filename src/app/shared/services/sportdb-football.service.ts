import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SportDbPagedResponse,
  SportDbPlayerCareerTeam,
  SportDbPlayerOverview,
  SportDbPlayerProfile,
  SportDbPlayerSearchResult,
  SportDbPlayerStatsResponse,
  SportDbPlayerTransfersResponse,
  SportDbTeamOverview,
  SportDbTeamPlayer,
  SportDbTeamPlayersResponse,
  SportDbTeamProfile,
  SportDbTeamSearchResult,
} from '../models/sportdb-football';

@Injectable({
  providedIn: 'root',
})
export class SportDbFootballService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.sportDbBaseUrl}/api/transfermarkt`;

  searchPlayers(
    searchTerm: string,
    pageNumber = 1,
  ): Observable<SportDbPagedResponse<SportDbPlayerSearchResult>> {
    return this.get<SportDbPagedResponse<SportDbPlayerSearchResult>>(
      `/players/search/${encodeURIComponent(searchTerm)}`,
      {
        page: pageNumber,
      },
    );
  }

  getPlayerProfile(playerId: string): Observable<SportDbPlayerProfile> {
    return this.get<SportDbPlayerProfile>(`/players/${playerId}/profile`);
  }

  getPlayerTransfers(playerId: string): Observable<SportDbPlayerTransfersResponse> {
    return this.get<SportDbPlayerTransfersResponse>(`/players/${playerId}/transfers`);
  }

  getPlayerStats(playerId: string): Observable<SportDbPlayerStatsResponse> {
    return this.get<SportDbPlayerStatsResponse>(`/players/${playerId}/stats`);
  }

  getPlayerNationality(playerId: string): Observable<readonly string[]> {
    return this.getPlayerProfile(playerId).pipe(
      map(profile => profile.citizenship ?? []),
    );
  }

  getPlayerOverview(playerId: string): Observable<SportDbPlayerOverview> {
    return forkJoin({
      profile: this.getPlayerProfile(playerId),
      transfers: this.getPlayerTransfers(playerId),
    }).pipe(
      map(({ profile, transfers }) => ({
        profile,
        transfers,
        nationality: profile.citizenship ?? [],
        teamsPlayedFor: this.mapCareerTeams(profile, transfers),
      })),
    );
  }

  getPlayerCareerTeams(playerId: string): Observable<readonly SportDbPlayerCareerTeam[]> {
    return this.getPlayerOverview(playerId).pipe(
      map(overview => overview.teamsPlayedFor),
    );
  }

  searchTeams(
    searchTerm: string,
    pageNumber = 1,
  ): Observable<SportDbPagedResponse<SportDbTeamSearchResult>> {
    return this.get<SportDbPagedResponse<SportDbTeamSearchResult>>(
      `/clubs/search/${encodeURIComponent(searchTerm)}`,
      {
        page: pageNumber,
      },
    );
  }

  getTeamProfile(teamId: string): Observable<SportDbTeamProfile> {
    return this.get<SportDbTeamProfile>(`/clubs/${teamId}/profile`);
  }

  getTeamPlayers(teamId: string): Observable<readonly SportDbTeamPlayer[]> {
    return this.get<SportDbTeamPlayersResponse>(`/clubs/${teamId}/players`).pipe(
      map(response => response.players),
    );
  }

  getTeamOverview(teamId: string): Observable<SportDbTeamOverview> {
    return forkJoin({
      profile: this.getTeamProfile(teamId),
      players: this.getTeamPlayers(teamId),
    });
  }

  private get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Observable<T> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<T>(`${this.baseUrl}${path}`, {
      headers: this.createHeaders(),
      params,
    });
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-API-Key': environment.sportDbApiKey,
    });
  }

  private mapCareerTeams(
    profile: SportDbPlayerProfile,
    transfers: SportDbPlayerTransfersResponse,
  ): readonly SportDbPlayerCareerTeam[] {
    const currentClub = profile.club?.id && profile.club.name
      ? [{
          id: profile.club.id,
          name: profile.club.name,
          source: 'current-club' as const,
        }]
      : [];

    const transferTeams = transfers.transfers.flatMap(transfer => [
      {
        id: transfer.clubTo.id,
        name: transfer.clubTo.name,
        source: 'transfer-history' as const,
        season: transfer.season,
        date: transfer.date,
        details: transfer.fee,
      },
      {
        id: transfer.clubFrom.id,
        name: transfer.clubFrom.name,
        source: 'transfer-history' as const,
        season: transfer.season,
        date: transfer.date,
      },
    ]);

    const youthClubs = transfers.youthClubs.map(club => {
      const match = /^(.*?)(?:\s*\((.*)\))?$/.exec(club);

      return {
        id: undefined,
        name: match?.[1]?.trim() || club,
        source: 'youth-club' as const,
        details: match?.[2] || undefined,
      };
    });

    const seen = new Set<string>();

    return [...currentClub, ...transferTeams, ...youthClubs].filter(team => {
      const identity = `${team.id ?? 'unknown'}:${team.name}`;

      if (seen.has(identity)) {
        return false;
      }

      seen.add(identity);
      return true;
    });
  }
}