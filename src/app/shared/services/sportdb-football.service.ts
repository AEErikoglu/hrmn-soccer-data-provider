import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {
  catchError,
  concatMap,
  defer,
  forkJoin,
  from,
  map,
  Observable,
  of,
  reduce,
  retry,
  shareReplay,
  switchMap,
  throwError,
  timer,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SportDbCountry,
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

const DEFAULT_SHARED_PLAYER_CHECK_LIMIT = 10;

interface SharedLookupTeamPlayers {
  readonly teamId: string;
  readonly players: readonly SportDbTeamPlayer[];
  readonly failed: boolean;
}

export interface PlayerTeamsMatchDetails {
  readonly matches: boolean;
  readonly teamASeasons: readonly string[];
  readonly teamBSeasons: readonly string[];
}

export interface PlayerNationalityTeamMatchDetails {
  readonly matches: boolean;
  readonly teamSeasons: readonly string[];
}

@Injectable({
  providedIn: 'root',
})
export class SportDbFootballService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.sportDbBaseUrl}/api/transfermarkt`;
  private readonly requestSpacingMs = 450;
  private readonly playerCareerTeamsCache = new Map<string, Observable<readonly SportDbPlayerCareerTeam[]>>();
  private readonly teamPlayersCache = new Map<string, Observable<readonly SportDbTeamPlayer[]>>();
  private countriesCache?: Observable<readonly SportDbCountry[]>;
  private requestQueueTail = Promise.resolve();

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

  getCountries(): Observable<readonly SportDbCountry[]> {
    if (this.countriesCache) {
      return this.countriesCache;
    }

    const countries$ = this.get<readonly SportDbCountry[]>('/countries').pipe(
      shareReplay(1),
      catchError(error => {
        this.countriesCache = undefined;
        return throwError(() => error);
      }),
    );

    this.countriesCache = countries$;
    return countries$;
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
    return this.getPlayerProfile(playerId).pipe(
      switchMap(profile => this.getPlayerTransfers(playerId).pipe(
        map(transfers => ({
          profile,
          transfers,
          nationality: profile.citizenship ?? [],
          teamsPlayedFor: this.mapCareerTeams(profile, transfers),
        })),
      )),
    );
  }

  getPlayerCareerTeams(playerId: string): Observable<readonly SportDbPlayerCareerTeam[]> {
    const cachedCareerTeams = this.playerCareerTeamsCache.get(playerId);

    if (cachedCareerTeams) {
      return cachedCareerTeams;
    }

    const careerTeams$ = this.getPlayerOverview(playerId).pipe(
      map(overview => overview.teamsPlayedFor),
      shareReplay(1),
      catchError(error => {
        this.playerCareerTeamsCache.delete(playerId);
        return throwError(() => error);
      }),
    );

    this.playerCareerTeamsCache.set(playerId, careerTeams$);
    return careerTeams$;
  }

  getPlayerTeamsMatchDetails(
    playerId: string,
    teamAId: string,
    teamBId: string,
  ): Observable<PlayerTeamsMatchDetails> {
    return this.getPlayerCareerTeams(playerId).pipe(
      map(careerTeams => {
        const teamASeasons = this.getTeamSeasons(careerTeams, teamAId);
        const teamBSeasons = this.getTeamSeasons(careerTeams, teamBId);

        return {
          matches: teamASeasons.length > 0 && teamBSeasons.length > 0,
          teamASeasons,
          teamBSeasons,
        };
      }),
    );
  }

  hasPlayerPlayedForTeams(playerId: string, teamAId: string, teamBId: string): Observable<boolean> {
    return this.getPlayerTeamsMatchDetails(playerId, teamAId, teamBId).pipe(
      map(result => result.matches),
    );
  }

  getPlayerNationalityTeamMatchDetails(
    playerId: string,
    nationality: string,
    teamId: string,
  ): Observable<PlayerNationalityTeamMatchDetails> {
    return this.getPlayerOverview(playerId).pipe(
      map(overview => {
        const hasNationality = overview.nationality.some(item => item.toLowerCase() === nationality.toLowerCase());
        const teamSeasons = this.getTeamSeasons(overview.teamsPlayedFor, teamId);

        return {
          matches: hasNationality && teamSeasons.length > 0,
          teamSeasons,
        };
      }),
    );
  }

  hasPlayerNationalityAndPlayedForTeam(
    playerId: string,
    nationality: string,
    teamId: string,
  ): Observable<boolean> {
    return this.getPlayerNationalityTeamMatchDetails(playerId, nationality, teamId).pipe(
      map(result => result.matches),
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
    const cachedTeamPlayers = this.teamPlayersCache.get(teamId);

    if (cachedTeamPlayers) {
      return cachedTeamPlayers;
    }

    const teamPlayers$ = this.get<SportDbTeamPlayersResponse>(`/clubs/${teamId}/players`).pipe(
      map(response => response.players),
      shareReplay(1),
      catchError(error => {
        this.teamPlayersCache.delete(teamId);
        return throwError(() => error);
      }),
    );

    this.teamPlayersCache.set(teamId, teamPlayers$);
    return teamPlayers$;
  }

  getTeamOverview(teamId: string): Observable<SportDbTeamOverview> {
    return forkJoin({
      profile: this.getTeamProfile(teamId),
      players: this.getTeamPlayers(teamId),
    });
  }

  getCandidatePlayersForTeams(teamAId: string, teamBId: string): Observable<readonly SportDbTeamPlayer[]> {
    return forkJoin({
      teamA: this.getTeamPlayersForSharedLookup(teamAId),
      teamB: this.getTeamPlayersForSharedLookup(teamBId),
    }).pipe(
      map(({ teamA, teamB }) => {
        if (teamA.failed && teamB.failed) {
          throw new Error('Unable to load players for either selected team.');
        }

        return this.mergeUniquePlayers(teamA.players, teamB.players);
      }),
    );
  }

  getSharedPlayersBetweenTeams(
    teamAId: string,
    teamBId: string,
    maxPlayersToCheck = DEFAULT_SHARED_PLAYER_CHECK_LIMIT,
  ): Observable<readonly string[]> {
    return forkJoin({
      teamA: this.getTeamPlayersForSharedLookup(teamAId),
      teamB: this.getTeamPlayersForSharedLookup(teamBId),
    }).pipe(
      switchMap(({ teamA, teamB }) => {
        const candidatePlayers = this.pickCandidatePlayers(
          teamA,
          teamB,
          maxPlayersToCheck,
        );

        if (candidatePlayers.length === 0) {
          if (teamA.failed && teamB.failed) {
            return throwError(() => new Error('Unable to load players for either selected team.'));
          }

          return of([] as readonly string[]);
        }

        return from(candidatePlayers).pipe(
          concatMap(player => this.getPlayerCareerTeams(player.id).pipe(
            map(careerTeams => this.hasPlayedForBothTeams(careerTeams, teamAId, teamBId) ? player.name : null),
            catchError(error => {
              console.warn(`[SportDbFootballService] Skipping player ${player.id} because career history failed to load.`, error);
              return of(null);
            }),
          )),
          reduce((sharedPlayers, playerName) => {
            if (playerName) {
              sharedPlayers.push(playerName);
            }

            return sharedPlayers;
          }, [] as string[]),
          map(sharedPlayers => sharedPlayers.sort((left, right) => left.localeCompare(right))),
        );
      }),
    );
  }

  private get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Observable<T> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return defer(() => this.waitForRequestSlot()).pipe(
      switchMap(() => this.http.get<T>(`${this.baseUrl}${path}`, {
        headers: this.createHeaders(),
        params,
      })),
      retry({
        count: 1,
        delay: error => {
          if (error.status === 429) {
            return timer(1500);
          }

          return throwError(() => error);
        },
      }),
    );
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-API-Key': environment.sportDbApiKey,
    });
  }

  private waitForRequestSlot(): Promise<void> {
    const scheduledStart = this.requestQueueTail.then(
      () => new Promise<void>(resolve => setTimeout(resolve, this.requestSpacingMs)),
      () => new Promise<void>(resolve => setTimeout(resolve, this.requestSpacingMs)),
    );

    this.requestQueueTail = scheduledStart;
    return scheduledStart;
  }

  private getTeamPlayersForSharedLookup(teamId: string): Observable<SharedLookupTeamPlayers> {
    return this.getTeamPlayers(teamId).pipe(
      map(players => ({
        teamId,
        players,
        failed: false,
      })),
      catchError(error => {
        console.warn(`[SportDbFootballService] Failed to load current squad for team ${teamId}.`, error);
        return of({
          teamId,
          players: [] as readonly SportDbTeamPlayer[],
          failed: true,
        });
      }),
    );
  }

  private mergeUniquePlayers(
    teamAPlayers: readonly SportDbTeamPlayer[],
    teamBPlayers: readonly SportDbTeamPlayer[],
  ): readonly SportDbTeamPlayer[] {
    const playersById = new Map<string, SportDbTeamPlayer>();

    for (const player of [...teamAPlayers, ...teamBPlayers]) {
      if (!playersById.has(player.id)) {
        playersById.set(player.id, player);
      }
    }

    return [...playersById.values()].sort((left, right) => left.name.localeCompare(right.name));
  }

  private pickCandidatePlayers(
    teamA: SharedLookupTeamPlayers,
    teamB: SharedLookupTeamPlayers,
    maxPlayersToCheck: number,
  ): readonly SportDbTeamPlayer[] {
    const sourcePlayers = teamA.failed && !teamB.failed
      ? teamB.players
      : !teamA.failed && teamB.failed
        ? teamA.players
        : teamA.players.length <= teamB.players.length
          ? teamA.players
          : teamB.players;

    const seen = new Set<string>();

    return sourcePlayers.filter(player => {
      if (seen.has(player.id)) {
        return false;
      }

      seen.add(player.id);
      return true;
    }).slice(0, maxPlayersToCheck);
  }

  private hasPlayedForBothTeams(
    careerTeams: readonly SportDbPlayerCareerTeam[],
    teamAId: string,
    teamBId: string,
  ): boolean {
    const teamIds = new Set(careerTeams.map(team => team.id).filter((teamId): teamId is string => Boolean(teamId)));

    return teamIds.has(teamAId) && teamIds.has(teamBId);
  }

  private getTeamSeasons(
    careerTeams: readonly SportDbPlayerCareerTeam[],
    teamId: string,
  ): readonly string[] {
    const seasons: string[] = [];
    const seen = new Set<string>();

    for (const team of careerTeams) {
      if (team.id !== teamId) {
        continue;
      }

      if (!team.season) {
        continue;
      }

      const formattedSeason = this.formatSeason(team.season);

      if (seen.has(formattedSeason)) {
        continue;
      }

      seen.add(formattedSeason);
      seasons.push(formattedSeason);
    }

    return seasons;
  }

  private formatSeason(season: string): string {
    const seasonMatch = /^(\d{2})\/(\d{2})$/.exec(season.trim());

    if (!seasonMatch) {
      return season;
    }

    const startYear = 2000 + Number(seasonMatch[1]);
    const endYear = 2000 + Number(seasonMatch[2]);

    return `${startYear}/${endYear}`;
  }

  private mapCareerTeams(
    profile: SportDbPlayerProfile,
    transfers: SportDbPlayerTransfersResponse,
  ): readonly SportDbPlayerCareerTeam[] {
    const currentClub: readonly SportDbPlayerCareerTeam[] = profile.club?.id && profile.club.name
      ? [{
          id: profile.club.id,
          name: profile.club.name,
          source: 'current-club' as const,
        }]
      : [];

    const transferTeams: readonly SportDbPlayerCareerTeam[] = transfers.transfers.flatMap(transfer => [
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

    const youthClubs: readonly SportDbPlayerCareerTeam[] = transfers.youthClubs.map(club => {
      const match = /^(.*?)(?:\s*\((.*)\))?$/.exec(club);

      return {
        id: undefined,
        name: match?.[1]?.trim() || club,
        source: 'youth-club' as const,
        details: match?.[2] || undefined,
      };
    });

    const teamsByIdentity = new Map<string, SportDbPlayerCareerTeam>();

    for (const team of [...currentClub, ...transferTeams, ...youthClubs]) {
      const identity = `${team.id ?? 'unknown'}:${team.name}`;
      const existingTeam = teamsByIdentity.get(identity);

      if (!existingTeam) {
        teamsByIdentity.set(identity, team);
        continue;
      }

      teamsByIdentity.set(identity, {
        ...existingTeam,
        season: existingTeam.season ?? team.season,
        date: existingTeam.date ?? team.date,
        details: existingTeam.details ?? team.details,
        source: existingTeam.source === 'current-club' && team.source !== 'current-club'
          ? team.source
          : existingTeam.source,
      });
    }

    return [...teamsByIdentity.values()];
  }
}


