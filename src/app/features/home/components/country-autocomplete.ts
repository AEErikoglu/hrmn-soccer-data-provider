import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import {
  FormSelectionConfig,
  FormSelectionOption,
} from '../../../shared/models/form-settings';

const MIN_SEARCH_LENGTH = 2;

@Component({
  selector: 'app-country-autocomplete',
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
    @let countryOptions = options();

    <mat-form-field class="w-full">
      <mat-label>{{ fieldConfig.label }}</mat-label>
      <input
        type="text"
        matInput
        [formControl]="countryControl"
        [placeholder]="fieldConfig.placeholder ?? ''"
        (focus)="isInputFocused.set(true)"
        (blur)="handleBlur()"
      />

      @if (isLoading()) {
        <mat-spinner matSuffix diameter="18"></mat-spinner>
      }

      <mat-hint>{{ hintText() }}</mat-hint>
    </mat-form-field>

    @if (showResultsPanel()) {
      <div class="results-panel">
        @for (option of countryOptions; track option.value) {
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
        <p class="panel-message">No matching nationalities found.</p>
      </div>
    }
  `,
})
export class CountryAutocompleteComponent {
  private lastResetKey: string | undefined;

  readonly config = input.required<FormSelectionConfig>();
  readonly selectedOptionChange = output<FormSelectionOption | null>();
  readonly countryControl = new FormControl<FormSelectionOption | string | null>(null);
  readonly selectedOption = signal<FormSelectionOption | null>(null);
  readonly isInputFocused = signal(false);
  readonly isLoading = signal(false);

  constructor() {
    effect(() => {
      const fieldConfig = this.config();
      const resetKey = fieldConfig.resetKey;

      if (this.lastResetKey === undefined) {
        this.lastResetKey = resetKey;
      } else if (this.lastResetKey !== resetKey) {
        this.lastResetKey = resetKey;
        this.clearSelection();
      }

      const currentSelection = this.selectedOption();

      if (currentSelection && !fieldConfig.options.some(option => option.value === currentSelection.value)) {
        this.clearSelection();
      }

      if (fieldConfig.disabled) {
        if (this.countryControl.enabled) {
          this.countryControl.disable({ emitEvent: false });
        }

        this.clearSelection();
        this.isInputFocused.set(false);
        this.isLoading.set(false);
        return;
      }

      if (this.countryControl.disabled) {
        this.countryControl.enable({ emitEvent: false });
      }
    });
  }

  private readonly searchTerm$ = this.countryControl.valueChanges.pipe(
    startWith(this.countryControl.value),
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
    && !this.selectedOption()
    && this.hasSearchTerm()
    && this.options().length > 0
  ));
  readonly showNoResultsMessage = computed(() => (
    this.isInputFocused()
    && !this.isLoading()
    && !this.selectedOption()
    && this.hasSearchTerm()
    && this.options().length === 0
  ));
  readonly hintText = computed(() => {
    const fieldConfig = this.config();

    if (fieldConfig.disabled) {
      return fieldConfig.options.length === 0
        ? 'Nationality options are loading.'
        : 'Nationality selection is currently unavailable.';
    }

    if (this.selectedOption()) {
      return 'Nationality selected from available options.';
    }

    return this.hasSearchTerm()
      ? 'Select a nationality from the options below.'
      : `Type at least ${MIN_SEARCH_LENGTH} characters to search nationalities.`;
  });

  readonly options = toSignal(
    this.searchTerm$.pipe(
      switchMap(searchTerm => {
        if (this.config().disabled || searchTerm.length < MIN_SEARCH_LENGTH) {
          this.isLoading.set(false);
          return of([] as readonly FormSelectionOption[]);
        }

        this.isLoading.set(true);
        const normalizedSearchTerm = searchTerm.toLowerCase();
        const filteredOptions = this.config().options.filter(option => option.label.toLowerCase().includes(normalizedSearchTerm));
        this.isLoading.set(false);

        return of(filteredOptions);
      }),
    ),
    { initialValue: [] as readonly FormSelectionOption[] },
  );

  handleBlur(): void {
    setTimeout(() => this.isInputFocused.set(false), 120);
  }

  selectOption(option: FormSelectionOption): void {
    this.selectedOption.set(option);
    this.countryControl.setValue(option.label, { emitEvent: false });
    this.selectedOptionChange.emit(option);
    this.isInputFocused.set(false);
  }

  private clearSelection(): void {
    const currentControlValue = this.countryControl.value;
    const hasTypedValue = typeof currentControlValue === 'string' && currentControlValue.length > 0;
    const hasSelection = this.selectedOption() !== null;

    if (!hasTypedValue && !hasSelection && currentControlValue === null) {
      return;
    }

    this.selectedOption.set(null);
    this.countryControl.setValue(null, { emitEvent: false });
    this.selectedOptionChange.emit(null);
  }
}
