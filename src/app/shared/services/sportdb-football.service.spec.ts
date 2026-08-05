import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SportDbFootballService } from './sportdb-football.service';

describe('SportDbFootballService', () => {
  let service: SportDbFootballService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SportDbFootballService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('searches players with the SportDB API key header', async () => {
    const responsePromise = firstValueFrom(service.searchPlayers('messi', 2));

    const request = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/search/messi?page=2',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('X-API-Key')).toBe(true);

    request.flush({
      query: 'messi',
      pageNumber: 2,
      lastPageNumber: 3,
      results: [
        {
          id: '28003',
          name: 'Lionel Messi',
        },
      ],
      updatedAt: '2026-07-21T18:33:47.062Z',
    });

    await expect(responsePromise).resolves.toEqual({
      query: 'messi',
      pageNumber: 2,
      lastPageNumber: 3,
      results: [
        {
          id: '28003',
          name: 'Lionel Messi',
        },
      ],
      updatedAt: '2026-07-21T18:33:47.062Z',
    });
  });

  it('loads countries for nationality options', async () => {
    const countriesPromise = firstValueFrom(service.getCountries());

    const request = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/countries',
    );

    request.flush([
      {
        id: '189',
        name: 'England',
      },
      {
        id: '174',
        name: 'Turkey',
      },
    ]);

    await expect(countriesPromise).resolves.toEqual([
      {
        id: '189',
        name: 'England',
      },
      {
        id: '174',
        name: 'Turkey',
      },
    ]);
  });

  it('builds a player overview with nationality and career teams', async () => {
    const overviewPromise = firstValueFrom(service.getPlayerOverview('28003'));

    const profileRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/28003/profile',
    );
    const transfersRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/28003/transfers',
    );

    profileRequest.flush({
      id: '28003',
      url: 'https://www.transfermarkt.com/lionel-messi/profil/spieler/28003',
      name: 'Lionel Messi',
      citizenship: ['Argentina', 'Spain'],
      isRetired: false,
      club: {
        id: '69261',
        name: 'Miami',
      },
      updatedAt: '2026-07-21T16:39:52.941Z',
    });

    transfersRequest.flush({
      id: '28003',
      transfers: [
        {
          id: '4418847',
          clubFrom: {
            id: '583',
            name: 'PSG',
          },
          clubTo: {
            id: '69261',
            name: 'Miami',
          },
          date: '2023-07-15',
          upcoming: false,
          season: '23/24',
          fee: 'free transfer',
        },
      ],
      youthClubs: ["Newell's Old Boys (1995-2000)"],
      updatedAt: '2026-07-21T16:39:54.817Z',
    });

    await expect(overviewPromise).resolves.toMatchObject({
      nationality: ['Argentina', 'Spain'],
      teamsPlayedFor: [
        {
          id: '69261',
          name: 'Miami',
          source: 'current-club',
        },
        {
          id: '583',
          name: 'PSG',
          source: 'transfer-history',
        },
        {
          name: "Newell's Old Boys",
          source: 'youth-club',
          details: '1995-2000',
        },
      ],
    });
  });

  it('loads candidate players from both selected team squads without duplicates', async () => {
    const playersPromise = firstValueFrom(service.getCandidatePlayersForTeams('36', '418'));

    const teamAPlayersRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/clubs/36/players',
    );
    const teamBPlayersRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/clubs/418/players',
    );

    teamAPlayersRequest.flush({
      id: '36',
      players: [
        {
          id: '108390',
          name: 'Arda Guler',
        },
        {
          id: '200',
          name: 'Fred',
        },
      ],
      updatedAt: '2026-08-05T16:26:25.000Z',
    });
    teamBPlayersRequest.flush({
      id: '418',
      players: [
        {
          id: '108390',
          name: 'Arda Guler',
        },
        {
          id: '300',
          name: 'Vinicius Junior',
        },
      ],
      updatedAt: '2026-08-05T16:26:25.000Z',
    });

    await expect(playersPromise).resolves.toEqual([
      {
        id: '108390',
        name: 'Arda Guler',
      },
      {
        id: '200',
        name: 'Fred',
      },
      {
        id: '300',
        name: 'Vinicius Junior',
      },
    ]);
  });

  it('returns team match details including formatted seasons', async () => {
    const detailsPromise = firstValueFrom(
      service.getPlayerTeamsMatchDetails('108390', '36', '418'),
    );

    const profileRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/108390/profile',
    );
    const transfersRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/108390/transfers',
    );

    profileRequest.flush({
      id: '108390',
      url: 'https://www.transfermarkt.com/arda-guler/profil/spieler/108390',
      name: 'Arda Guler',
      citizenship: ['Turkey'],
      isRetired: false,
      club: {
        id: '418',
        name: 'Real Madrid',
      },
      updatedAt: '2026-08-05T16:26:35.000Z',
    });

    transfersRequest.flush({
      id: '108390',
      transfers: [
        {
          id: '1',
          clubFrom: {
            id: '36',
            name: 'Fenerbahce',
          },
          clubTo: {
            id: '418',
            name: 'Real Madrid',
          },
          date: '2023-07-06',
          upcoming: false,
          season: '23/24',
          fee: '€20.00m',
        },
      ],
      youthClubs: [],
      updatedAt: '2026-08-05T16:26:45.000Z',
    });

    await expect(detailsPromise).resolves.toEqual({
      matches: true,
      teamASeasons: ['2023/2024'],
      teamBSeasons: ['2023/2024'],
    });
  });

  it('checks whether a selected player has played for both teams', async () => {
    const hasPlayedPromise = firstValueFrom(
      service.hasPlayerPlayedForTeams('108390', '36', '418'),
    );

    const profileRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/108390/profile',
    );
    const transfersRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/108390/transfers',
    );

    profileRequest.flush({
      id: '108390',
      url: 'https://www.transfermarkt.com/arda-guler/profil/spieler/108390',
      name: 'Arda Guler',
      citizenship: ['Turkey'],
      isRetired: false,
      club: {
        id: '418',
        name: 'Real Madrid',
      },
      updatedAt: '2026-08-05T16:26:35.000Z',
    });

    transfersRequest.flush({
      id: '108390',
      transfers: [
        {
          id: '1',
          clubFrom: {
            id: '36',
            name: 'Fenerbahce',
          },
          clubTo: {
            id: '418',
            name: 'Real Madrid',
          },
          date: '2023-07-06',
          upcoming: false,
          season: '23/24',
          fee: '€20.00m',
        },
      ],
      youthClubs: [],
      updatedAt: '2026-08-05T16:26:45.000Z',
    });

    await expect(hasPlayedPromise).resolves.toBe(true);
  });

  it('returns nationality/team match details including formatted seasons', async () => {
    const detailsPromise = firstValueFrom(
      service.getPlayerNationalityTeamMatchDetails('108390', 'Turkey', '418'),
    );

    const profileRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/108390/profile',
    );
    const transfersRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/108390/transfers',
    );

    profileRequest.flush({
      id: '108390',
      url: 'https://www.transfermarkt.com/arda-guler/profil/spieler/108390',
      name: 'Arda Guler',
      citizenship: ['Turkey'],
      isRetired: false,
      club: {
        id: '418',
        name: 'Real Madrid',
      },
      updatedAt: '2026-08-05T16:26:35.000Z',
    });

    transfersRequest.flush({
      id: '108390',
      transfers: [
        {
          id: '1',
          clubFrom: {
            id: '36',
            name: 'Fenerbahce',
          },
          clubTo: {
            id: '418',
            name: 'Real Madrid',
          },
          date: '2023-07-06',
          upcoming: false,
          season: '23/24',
          fee: '€20.00m',
        },
      ],
      youthClubs: [],
      updatedAt: '2026-08-05T16:26:45.000Z',
    });

    await expect(detailsPromise).resolves.toEqual({
      matches: true,
      teamSeasons: ['2023/2024'],
    });
  });

  it('checks whether a selected player has the selected nationality and played for the team', async () => {
    const matchesPromise = firstValueFrom(
      service.hasPlayerNationalityAndPlayedForTeam('108390', 'Turkey', '418'),
    );

    const profileRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/108390/profile',
    );
    const transfersRequest = httpTestingController.expectOne(
      'https://api.sportdb.dev/api/transfermarkt/players/108390/transfers',
    );

    profileRequest.flush({
      id: '108390',
      url: 'https://www.transfermarkt.com/arda-guler/profil/spieler/108390',
      name: 'Arda Guler',
      citizenship: ['Turkey'],
      isRetired: false,
      club: {
        id: '418',
        name: 'Real Madrid',
      },
      updatedAt: '2026-08-05T16:26:35.000Z',
    });

    transfersRequest.flush({
      id: '108390',
      transfers: [
        {
          id: '1',
          clubFrom: {
            id: '36',
            name: 'Fenerbahce',
          },
          clubTo: {
            id: '418',
            name: 'Real Madrid',
          },
          date: '2023-07-06',
          upcoming: false,
          season: '23/24',
          fee: '€20.00m',
        },
      ],
      youthClubs: [],
      updatedAt: '2026-08-05T16:26:45.000Z',
    });

    await expect(matchesPromise).resolves.toBe(true);
  });
});
