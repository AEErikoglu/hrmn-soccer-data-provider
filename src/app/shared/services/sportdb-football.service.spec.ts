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
});