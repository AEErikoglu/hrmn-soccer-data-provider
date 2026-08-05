import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { SportDbTeamSearchResult } from '../../../shared/models/sportdb-football';
import {
  FormSelectionConfig,
  FormSelectionOption,
} from '../../../shared/models/form-settings';
import { SportDbFootballService } from '../../../shared/services/sportdb-football.service';

const MIN_SEARCH_LENGTH = 2;

@Component({
  selector: 'app-team-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  styles: [
    `
      :host {
        display: block;
      }

      .results-panel {
        margin-top: 0.5rem;
        max-height: 18rem;
        overflow-y: auto;
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 0.9rem;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
      }

      .result-option {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 0;
        background: transparent;
        text-align: left;
        cursor: pointer;
        color: #0f172a;
      }

      .result-option + .result-option {
        border-top: 1px solid rgba(226, 232, 240, 0.9);
      }

      .result-option:hover {
        background: rgba(239, 246, 255, 0.95);
      }

      .result-name {
        display: block;
        font-weight: 600;
      }

      .panel-message {
        padding: 0.875rem 1rem;
        color: #64748b;
        font-size: 0.95rem;
      }
    `,
  ],
  template: `
    @let fieldConfig = config();
    @let teamOptions = options();
    @let currentError = errorMessage();

    <mat-form-field class="w-full">
      <mat-label>{{ fieldConfig.label }}</mat-label>
      <input
        type="text"
        matInput
        [formControl]="teamControl"
        [placeholder]="fieldConfig.placeholder ?? ''"
        (focus)="isInputFocused.set(true)"
        (blur)="handleBlur()"
      />

      @if (isLoading()) {
        <mat-spinner matSuffix diameter="18"></mat-spinner>
      }

      @if (currentError) {
        <mat-error>{{ currentError }}</mat-error>
      } @else {
        <mat-hint>{{ hintText() }}</mat-hint>
      }
    </mat-form-field>

    @if (showResultsPanel()) {
      <div class="results-panel">
        @for (option of teamOptions; track option.value) {
          <button
            type="button"
            class="result-option"
            (mousedown)="$event.preventDefault(); selectOption(option)"
          >
            <span class="result-name">{{ option.label }}</span>
          </button>
        }
      </div>
    } @else if (showNoResultsMessage()) {
      <div class="results-panel">
        <p class="panel-message">No matching teams found.</p>
      </div>
    }
  `,
})
export class TeamAutocompleteComponent {
  private readonly sportDbFootballService = inject(SportDbFootballService);

  readonly config = input.required<FormSelectionConfig>();
  readonly selectedOptionChange = output<FormSelectionOption | null>();
  readonly teamControl = new FormControl<FormSelectionOption | string | null>(null);
  readonly selectedOption = signal<FormSelectionOption | null>(null);
  readonly isInputFocused = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private readonly searchTerm$ = this.teamControl.valueChanges.pipe(
    startWith(this.teamControl.value),
    map(value => {
      if (typeof value === 'string') {
        if (this.selectedOption()) {
          this.selectedOption.set(null);
          this.selectedOptionChange.emit(null);
        }

        return value.trim();
      }

      this.selectedOption.set(value ?? null);
      return value?.label.trim() ?? '';
    }),
    debounceTime(250),
    distinctUntilChanged(),
  );

  readonly searchTerm = toSignal(this.searchTerm$, { initialValue: '' });
  readonly hasSearchTerm = computed(() => this.searchTerm().length >= MIN_SEARCH_LENGTH);
  readonly showResultsPanel = computed(() => (
    this.isInputFocused()
    && !this.isLoading()
    && !this.errorMessage()
    && !this.selectedOption()
    && this.hasSearchTerm()
    && this.options().length > 0
  ));
  readonly showNoResultsMessage = computed(() => (
    this.isInputFocused()
    && !this.isLoading()
    && !this.errorMessage()
    && !this.selectedOption()
    && this.hasSearchTerm()
    && this.options().length === 0
  ));
  readonly hintText = computed(() => {
    if (this.selectedOption()) {
      return 'Team selected from live API results.';
    }

    return this.hasSearchTerm()
      ? 'Select a team from the API results below.'
      : `Type at least ${MIN_SEARCH_LENGTH} characters to search teams.`;
  });

  readonly options = toSignal(
    this.searchTerm$.pipe(
      switchMap(searchTerm => {
        if (searchTerm.length < MIN_SEARCH_LENGTH) {
          this.isLoading.set(false);
          this.errorMessage.set(null);
          return of([] as readonly FormSelectionOption[]);
        }

        this.isLoading.set(true);
        this.errorMessage.set(null);

        return this.sportDbFootballService.searchTeams(searchTerm).pipe(
          tap(response => {
            console.log(
              `[TeamAutocomplete] First results for "${searchTerm}"`,
              response.results.slice(0, 10),
            );
          }),
          map(response => response.results.map(team => this.mapTeamToOption(team))),
          catchError(error => {
            console.error('[TeamAutocomplete] Team search failed', error);
            this.errorMessage.set('Team search is blocked in the browser. Restart `npm start` to use the local proxy.');
            return of([] as readonly FormSelectionOption[]);
          }),
          finalize(() => this.isLoading.set(false)),
        );
      }),
    ),
    { initialValue: [] as readonly FormSelectionOption[] },
  );

  handleBlur(): void {
    setTimeout(() => this.isInputFocused.set(false), 120);
  }

  selectOption(option: FormSelectionOption): void {
    this.selectedOption.set(option);
    this.teamControl.setValue(option.label, { emitEvent: false });
    this.selectedOptionChange.emit(option);
    this.isInputFocused.set(false);
  }

  private mapTeamToOption(team: SportDbTeamSearchResult): FormSelectionOption {
    const countrySuffix = team.country ? ` (${team.country})` : '';

    return {
      value: team.id,
      label: `${team.name}${countrySuffix}`,
    };
  }
}
