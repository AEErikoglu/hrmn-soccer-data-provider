import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import {
  FormSelectionOption,
  FormSelectionsChange,
  FormSettingsByTab,
} from '../../../shared/models/form-settings';
import { SportDbFootballService } from '../../../shared/services/sportdb-football.service';
import { FormComponent } from '../components/form';

const HOME_TABS: readonly Omit<FormSettingsByTab, 'form'>[] = [
  {
    id: 'team-vs-team',
    tabName: 'Team vs Team',
  },
  {
    id: 'team-and-country',
    tabName: 'Team and Nationality',
  },
];

type ResultTone = 'neutral' | 'success' | 'failure' | 'error';
type HomeTabId = 'team-vs-team' | 'team-and-country';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatTabsModule, FormComponent],
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }
  `,
  template: `
    @let configuredTabs = tabs();

    <mat-card
      class="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm"
    >
      <h1 class="text-2xl font-semibold text-slate-950 text-center">
        SportDB Football Player Data UI
      </h1>
      <p class="mt-3 text-center text-sm text-slate-600">
        Use the tabs below to check either a player against two teams or a player against one team
        plus a nationality.
      </p>
      <mat-tab-group class="mt-6" (selectedIndexChange)="handleSelectedTabIndexChange($event)">
        @for (tab of configuredTabs; track tab.id) {
          <mat-tab label="{{ tab.tabName }}">
            <app-form
              [selections]="tab.form"
              (selectionsChange)="handleFormSelectionsChange(tab.id, $event)"
            ></app-form>
          </mat-tab>
        }
      </mat-tab-group>
      <section
        class="mt-6 rounded-2xl border px-5 py-4 transition-colors"
        [class]="resultBoxClasses()"
      >
        <h2 class="text-lg font-semibold">Result</h2>
        <p class="mt-2 text-sm">{{ currentResultMessage() }}</p>
      </section>
    </mat-card>
  `,
})
export default class HomeComponent {
  private readonly sportDbFootballService = inject(SportDbFootballService);

  readonly activeTabId = signal<HomeTabId>('team-vs-team');

  readonly teamVsTeamSelection1 = signal<FormSelectionOption | null>(null);
  readonly teamVsTeamSelection2 = signal<FormSelectionOption | null>(null);
  readonly teamVsTeamSelection3 = signal<FormSelectionOption | null>(null);
  readonly teamVsTeamResultMessage = signal(
    'Select two teams and then search for a player to check their career history.',
  );
  readonly teamVsTeamResultTone = signal<ResultTone>('neutral');

  readonly teamCountrySelection1 = signal<FormSelectionOption | null>(null);
  readonly teamCountrySelection2 = signal<FormSelectionOption | null>(null);
  readonly teamCountrySelection3 = signal<FormSelectionOption | null>(null);
  readonly nationalityOptions = signal<readonly FormSelectionOption[]>([]);
  readonly isLoadingNationalityOptions = signal(false);
  readonly teamCountryResultMessage = signal(
    'Select a team, a nationality, and a player to check the condition.',
  );
  readonly teamCountryResultTone = signal<ResultTone>('neutral');

  readonly currentResultMessage = computed(() =>
    this.activeTabId() === 'team-vs-team'
      ? this.teamVsTeamResultMessage()
      : this.teamCountryResultMessage(),
  );
  readonly currentResultTone = computed(() =>
    this.activeTabId() === 'team-vs-team'
      ? this.teamVsTeamResultTone()
      : this.teamCountryResultTone(),
  );

  readonly resultBoxClasses = computed(() => {
    switch (this.currentResultTone()) {
      case 'success':
        return 'mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900 transition-colors';
      case 'failure':
        return 'mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900 transition-colors';
      case 'error':
        return 'mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 transition-colors';
      default:
        return 'mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 transition-colors';
    }
  });

  readonly tabs = computed<readonly FormSettingsByTab[]>(() =>
    HOME_TABS.map((tab) => {
      if (tab.id === 'team-vs-team') {
        return {
          ...tab,
          form: {
            selection1: {
              type: 'team-autocomplete',
              label: 'Team 1',
              options: [],
              placeholder: 'Search for the first team',
            },
            selection2: {
              type: 'team-autocomplete',
              label: 'Team 2',
              options: [],
              placeholder: 'Search for the second team',
            },
            selection3: {
              type: 'player-autocomplete',
              label: 'Player',
              options: [],
              disabled: !this.canChooseTeamVsTeamPlayer(),
              placeholder: this.canChooseTeamVsTeamPlayer()
                ? 'Search for a player'
                : 'Select two teams first',
              resetKey: `${this.teamVsTeamSelection1()?.value ?? ''}:${this.teamVsTeamSelection2()?.value ?? ''}`,
            },
          },
        };
      }

      return {
        ...tab,
        form: {
          selection1: {
            type: 'team-autocomplete',
            label: 'Team',
            options: [],
            placeholder: 'Search for a team',
          },
          selection2: {
            type: 'country-autocomplete',
            label: 'Nationality',
            options: this.nationalityOptions(),
            disabled: this.isLoadingNationalityOptions() || this.nationalityOptions().length === 0,
            placeholder: 'Search for a nationality',
          },
          selection3: {
            type: 'player-autocomplete',
            label: 'Player',
            options: [],
            disabled: !this.canChooseTeamCountryPlayer(),
            placeholder: this.canChooseTeamCountryPlayer()
              ? 'Search for a player'
              : 'Select a team and nationality first',
            resetKey: `${this.teamCountrySelection1()?.value ?? ''}:${this.teamCountrySelection2()?.value ?? ''}`,
          },
        },
      };
    }),
  );

  constructor() {
    this.loadNationalityOptions();

    effect((onCleanup) => {
      const team1 = this.teamVsTeamSelection1();
      const team2 = this.teamVsTeamSelection2();
      const player = this.teamVsTeamSelection3();

      if (!team1 || !team2) {
        this.teamVsTeamResultTone.set('neutral');
        this.teamVsTeamResultMessage.set(
          'Select two teams and then search for a player to check their career history.',
        );
        return;
      }

      if (team1.value === team2.value) {
        this.teamVsTeamResultTone.set('neutral');
        this.teamVsTeamResultMessage.set(
          'Choose two different teams before searching for a player.',
        );
        return;
      }

      if (!player) {
        this.teamVsTeamResultTone.set('neutral');
        this.teamVsTeamResultMessage.set(
          `Search for a player to check whether they played for both ${team1.label} and ${team2.label}.`,
        );
        return;
      }

      this.teamVsTeamResultTone.set('neutral');
      this.teamVsTeamResultMessage.set(
        `Checking whether ${player.label} played for both ${team1.label} and ${team2.label}...`,
      );

      const subscription = this.sportDbFootballService
        .getPlayerTeamsMatchDetails(player.value, team1.value, team2.value)
        .subscribe({
          next: (result) => {
            this.teamVsTeamResultTone.set(result.matches ? 'success' : 'failure');
            this.teamVsTeamResultMessage.set(
              result.matches
                ? `${player.label} played for ${team1.label} in the ${this.formatSeasons(result.teamASeasons)} season and for ${team2.label} in the ${this.formatSeasons(result.teamBSeasons)} season.`
                : `${player.label} did not play for both ${team1.label} and ${team2.label}.`,
            );
          },
          error: (error) => {
            console.error('[Home] Player career check failed', error);
            this.teamVsTeamResultTone.set('error');
            this.teamVsTeamResultMessage.set(
              'The player career check failed. Please try another player.',
            );
          },
        });

      onCleanup(() => {
        subscription.unsubscribe();
      });
    });

    effect((onCleanup) => {
      const team = this.teamCountrySelection1();
      const nationality = this.teamCountrySelection2();
      const player = this.teamCountrySelection3();

      if (!team || !nationality) {
        this.teamCountryResultTone.set('neutral');
        this.teamCountryResultMessage.set(
          'Select a team, a nationality, and a player to check the condition.',
        );
        return;
      }

      if (!player) {
        this.teamCountryResultTone.set('neutral');
        this.teamCountryResultMessage.set(
          `Search for a player to check whether they have ${nationality.label} nationality and played for ${team.label}.`,
        );
        return;
      }

      this.teamCountryResultTone.set('neutral');
      this.teamCountryResultMessage.set(
        `Checking whether ${player.label} has ${nationality.label} nationality and played for ${team.label}...`,
      );

      const subscription = this.sportDbFootballService
        .getPlayerNationalityTeamMatchDetails(player.value, nationality.label, team.value)
        .subscribe({
          next: (result) => {
            this.teamCountryResultTone.set(result.matches ? 'success' : 'failure');
            this.teamCountryResultMessage.set(
              result.matches
                ? `${player.label} has ${nationality.label} nationality and played for ${team.label} in the ${this.formatSeasons(result.teamSeasons)} season.`
                : `${player.label} does not satisfy both conditions for ${team.label} and ${nationality.label} nationality.`,
            );
          },
          error: (error) => {
            console.error('[Home] Player nationality/team check failed', error);
            this.teamCountryResultTone.set('error');
            this.teamCountryResultMessage.set(
              'The player nationality/team check failed. Please try another player.',
            );
          },
        });

      onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }

  handleSelectedTabIndexChange(index: number): void {
    this.activeTabId.set(index === 1 ? 'team-and-country' : 'team-vs-team');
  }

  handleFormSelectionsChange(tabId: string, selections: FormSelectionsChange): void {
    if (tabId === 'team-vs-team') {
      this.teamVsTeamSelection1.set(selections.selection1);
      this.teamVsTeamSelection2.set(selections.selection2);
      this.teamVsTeamSelection3.set(selections.selection3 ?? null);
      return;
    }

    if (tabId === 'team-and-country') {
      this.teamCountrySelection1.set(selections.selection1);
      this.teamCountrySelection2.set(selections.selection2);
      this.teamCountrySelection3.set(selections.selection3 ?? null);
    }
  }

  private loadNationalityOptions(): void {
    this.isLoadingNationalityOptions.set(true);

    this.sportDbFootballService.getCountries().subscribe({
      next: (countries) => {
        this.nationalityOptions.set(
          countries.map((country) => ({
            value: country.id,
            label: country.name,
          })),
        );
      },
      error: (error) => {
        console.error('[Home] Nationality options failed to load', error);
        this.nationalityOptions.set([]);
        this.isLoadingNationalityOptions.set(false);
        this.teamCountryResultTone.set('error');
        this.teamCountryResultMessage.set('Nationality options could not be loaded.');
      },
      complete: () => {
        this.isLoadingNationalityOptions.set(false);
      },
    });
  }

  private canChooseTeamVsTeamPlayer(): boolean {
    const team1 = this.teamVsTeamSelection1();
    const team2 = this.teamVsTeamSelection2();

    return Boolean(team1 && team2 && team1.value !== team2.value);
  }

  private canChooseTeamCountryPlayer(): boolean {
    return Boolean(this.teamCountrySelection1() && this.teamCountrySelection2());
  }

  private formatSeasons(seasons: readonly string[]): string {
    if (seasons.length === 0) {
      return 'season information unavailable';
    }

    if (seasons.length === 1) {
      return seasons[0];
    }

    if (seasons.length === 2) {
      return `${seasons[0]} and ${seasons[1]}`;
    }

    return `${seasons.slice(0, -1).join(', ')}, and ${seasons[seasons.length - 1]}`;
  }
}
