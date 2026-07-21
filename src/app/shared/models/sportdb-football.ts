export interface SportDbPagedResponse<TResult> {
  readonly query: string;
  readonly pageNumber: number;
  readonly lastPageNumber: number;
  readonly results: readonly TResult[];
  readonly updatedAt: string;
}

export interface SportDbClubReference {
  readonly id: string;
  readonly name: string;
}

export interface SportDbPlayerSearchResult {
  readonly id: string;
  readonly name: string;
  readonly position?: string;
  readonly club?: SportDbClubReference;
  readonly age?: number;
  readonly nationalities?: readonly string[];
  readonly marketValue?: number;
}

export interface SportDbTeamSearchResult {
  readonly id: string;
  readonly url: string;
  readonly name: string;
  readonly country?: string;
  readonly squad?: number;
  readonly marketValue?: number;
}

export interface SportDbPlaceOfBirth {
  readonly city?: string;
  readonly country?: string;
}

export interface SportDbPlayerPosition {
  readonly main?: string;
  readonly other?: readonly string[];
}

export interface SportDbPlayerClubProfile {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly contractOption?: string | null;
  readonly lastClubId?: string | null;
  readonly lastClubName?: string | null;
  readonly mostGamesFor?: string | null;
}

export interface SportDbPlayerAgent {
  readonly name?: string;
}

export interface SportDbRelativeProfile {
  readonly id: string;
  readonly url: string;
  readonly name: string;
  readonly profileType: 'player' | 'staff' | string;
}

export interface SportDbTrainerProfile {
  readonly id?: string | null;
  readonly position?: string | null;
}

export interface SportDbPlayerProfile {
  readonly id: string;
  readonly url: string;
  readonly name: string;
  readonly description?: string;
  readonly fullName?: string | null;
  readonly nameInHomeCountry?: string | null;
  readonly imageUrl?: string;
  readonly placeOfBirth?: SportDbPlaceOfBirth;
  readonly height?: number;
  readonly citizenship?: readonly string[];
  readonly isRetired: boolean;
  readonly position?: SportDbPlayerPosition;
  readonly foot?: string;
  readonly shirtNumber?: string;
  readonly club?: SportDbPlayerClubProfile;
  readonly marketValue?: number;
  readonly agent?: SportDbPlayerAgent;
  readonly outfitter?: string;
  readonly socialMedia?: readonly string[];
  readonly trainerProfile?: SportDbTrainerProfile;
  readonly relatives?: readonly SportDbRelativeProfile[];
  readonly updatedAt: string;
}

export interface SportDbTransferClub {
  readonly id: string;
  readonly name: string;
}

export interface SportDbPlayerTransfer {
  readonly id: string;
  readonly clubFrom: SportDbTransferClub;
  readonly clubTo: SportDbTransferClub;
  readonly date: string;
  readonly upcoming: boolean;
  readonly season: string;
  readonly marketValue?: string;
  readonly fee?: string;
}

export interface SportDbPlayerTransfersResponse {
  readonly id: string;
  readonly transfers: readonly SportDbPlayerTransfer[];
  readonly youthClubs: readonly string[];
  readonly updatedAt: string;
}

export interface SportDbTeamLeague {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly countryId?: string | null;
  readonly countryName?: string | null;
  readonly tier?: string | null;
}

export interface SportDbTeamSquadOverview {
  readonly size?: number;
  readonly averageAge?: number;
  readonly foreigners?: number;
  readonly nationalTeamPlayers?: number;
}

export interface SportDbTeamProfile {
  readonly id: string;
  readonly url: string;
  readonly name: string;
  readonly officialName?: string | null;
  readonly image?: string;
  readonly legalForm?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly addressLine3?: string | null;
  readonly tel?: string | null;
  readonly fax?: string | null;
  readonly website?: string | null;
  readonly foundedOn?: string | null;
  readonly members?: number | null;
  readonly membersDate?: string | null;
  readonly otherSports?: readonly string[];
  readonly colors?: readonly string[];
  readonly stadiumName?: string | null;
  readonly currentTransferRecord?: number | null;
  readonly currentMarketValue?: number | null;
  readonly confederation?: string | null;
  readonly fifaWorldRanking?: number | null;
  readonly squad?: SportDbTeamSquadOverview;
  readonly league?: SportDbTeamLeague;
  readonly historicalCrests?: readonly string[];
  readonly updatedAt: string;
}

export interface SportDbTeamPlayer {
  readonly id: string;
  readonly name: string;
  readonly position?: string;
  readonly dateOfBirth?: string;
  readonly age?: number;
  readonly nationality?: readonly string[];
  readonly currentClub?: string | null;
  readonly height?: number;
  readonly foot?: string;
  readonly joined?: string;
  readonly signedFrom?: string;
  readonly marketValue?: number;
  readonly status?: string;
}

export interface SportDbTeamPlayersResponse {
  readonly id: string;
  readonly players: readonly SportDbTeamPlayer[];
  readonly updatedAt: string;
}

export interface SportDbPlayerCareerTeam {
  readonly id?: string;
  readonly name: string;
  readonly source: 'current-club' | 'transfer-history' | 'youth-club';
  readonly season?: string;
  readonly date?: string;
  readonly details?: string;
}

export interface SportDbPlayerOverview {
  readonly profile: SportDbPlayerProfile;
  readonly transfers: SportDbPlayerTransfersResponse;
  readonly nationality: readonly string[];
  readonly teamsPlayedFor: readonly SportDbPlayerCareerTeam[];
}

export interface SportDbTeamOverview {
  readonly profile: SportDbTeamProfile;
  readonly players: readonly SportDbTeamPlayer[];
}

export type SportDbPlayerStatsResponse = Record<string, unknown>;