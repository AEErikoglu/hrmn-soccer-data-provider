import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  FormSelectionConfig,
  FormSelectionOption,
  FormSelectionsChange,
  Selections,
} from '../../../shared/models/form-settings';
import { CountryAutocompleteComponent } from './country-autocomplete';
import { PlayerAutocompleteComponent } from './player-autocomplete';
import { TeamAutocompleteComponent } from './team-autocomplete';

@Component({
  selector: 'app-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CountryAutocompleteComponent,
    PlayerAutocompleteComponent,
    TeamAutocompleteComponent,
  ],
  styles: [
    `
      :host {
        display: grid;
        gap: 1rem;
        padding: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        align-items: start;
      }
    `,
  ],
  template: `
    @let formSelections = selections();

    @switch (formSelections.selection1.type) {
      @case ('team-autocomplete') {
        <app-team-autocomplete
          [config]="formSelections.selection1"
          (selectedOptionChange)="handleSelection1Change($event)"
        />
      }
      @case ('player-autocomplete') {
        <app-player-autocomplete
          [config]="formSelections.selection1"
          (selectedOptionChange)="handleSelection1Change($event)"
        />
      }
      @case ('country-autocomplete') {
        <app-country-autocomplete
          [config]="formSelections.selection1"
          (selectedOptionChange)="handleSelection1Change($event)"
        />
      }
      @case ('text-input') {
        <mat-form-field class="w-full">
          <mat-label>{{ formSelections.selection1.label }}</mat-label>
          <input matInput [placeholder]="formSelections.selection1.placeholder ?? ''" />
        </mat-form-field>
      }
      @default {
        <mat-form-field class="w-full">
          <mat-label>{{ formSelections.selection1.label }}</mat-label>
          <mat-select
            [disabled]="formSelections.selection1.disabled ?? false"
            [value]="selection1()?.value ?? null"
            (selectionChange)="handleSelection1Select($event.value, formSelections.selection1.options)"
          >
            @for (option of formSelections.selection1.options; track option.value) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
    }

    @switch (formSelections.selection2.type) {
      @case ('team-autocomplete') {
        <app-team-autocomplete
          [config]="formSelections.selection2"
          (selectedOptionChange)="handleSelection2Change($event)"
        />
      }
      @case ('player-autocomplete') {
        <app-player-autocomplete
          [config]="formSelections.selection2"
          (selectedOptionChange)="handleSelection2Change($event)"
        />
      }
      @case ('country-autocomplete') {
        <app-country-autocomplete
          [config]="formSelections.selection2"
          (selectedOptionChange)="handleSelection2Change($event)"
        />
      }
      @case ('text-input') {
        <mat-form-field class="w-full">
          <mat-label>{{ formSelections.selection2.label }}</mat-label>
          <input matInput [placeholder]="formSelections.selection2.placeholder ?? ''" />
        </mat-form-field>
      }
      @default {
        <mat-form-field class="w-full">
          <mat-label>{{ formSelections.selection2.label }}</mat-label>
          <mat-select
            [disabled]="formSelections.selection2.disabled ?? false"
            [value]="selection2()?.value ?? null"
            (selectionChange)="handleSelection2Select($event.value, formSelections.selection2.options)"
          >
            @for (option of formSelections.selection2.options; track option.value) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
    }

    @if (formSelections.selection3; as selection3Config) {
      @switch (selection3Config.type) {
        @case ('team-autocomplete') {
          <app-team-autocomplete
            [config]="selection3Config"
            (selectedOptionChange)="handleSelection3Change($event)"
          />
        }
        @case ('player-autocomplete') {
          <app-player-autocomplete
            [config]="selection3Config"
            (selectedOptionChange)="handleSelection3Change($event)"
          />
        }
        @case ('country-autocomplete') {
          <app-country-autocomplete
            [config]="selection3Config"
            (selectedOptionChange)="handleSelection3Change($event)"
          />
        }
        @case ('text-input') {
          <mat-form-field class="w-full">
            <mat-label>{{ selection3Config.label }}</mat-label>
            <input matInput [placeholder]="selection3Config.placeholder ?? ''" />
          </mat-form-field>
        }
        @default {
          <mat-form-field class="w-full">
            <mat-label>{{ selection3Config.label }}</mat-label>
            <mat-select
              [disabled]="selection3Config.disabled ?? false"
              [value]="selection3()?.value ?? null"
              (selectionChange)="handleSelection3Select($event.value, selection3Config.options)"
            >
              @for (option of selection3Config.options; track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      }
    }
  `,
})
export class FormComponent {
  readonly selections = input.required<Selections>();
  readonly selectionsChange = output<FormSelectionsChange>();

  readonly selection1 = signal<FormSelectionOption | null>(null);
  readonly selection2 = signal<FormSelectionOption | null>(null);
  readonly selection3 = signal<FormSelectionOption | null>(null);

  constructor() {
    effect(() => {
      const formSelections = this.selections();
      let hasChanged = false;

      hasChanged = this.syncSelectionWithConfig(this.selection1, formSelections.selection1) || hasChanged;
      hasChanged = this.syncSelectionWithConfig(this.selection2, formSelections.selection2) || hasChanged;
      hasChanged = this.syncSelectionWithConfig(this.selection3, formSelections.selection3) || hasChanged;

      if (hasChanged) {
        this.emitSelectionsChange();
      }
    });
  }

  handleSelection1Change(option: FormSelectionOption | null): void {
    this.selection1.set(option);
    this.emitSelectionsChange();
  }

  handleSelection1Select(
    selectedValue: string | null,
    options: readonly FormSelectionOption[],
  ): void {
    this.handleSelection1Change(this.findSelectedOption(selectedValue, options));
  }

  handleSelection2Change(option: FormSelectionOption | null): void {
    this.selection2.set(option);
    this.emitSelectionsChange();
  }

  handleSelection2Select(
    selectedValue: string | null,
    options: readonly FormSelectionOption[],
  ): void {
    this.handleSelection2Change(this.findSelectedOption(selectedValue, options));
  }

  handleSelection3Change(option: FormSelectionOption | null): void {
    this.selection3.set(option);
    this.emitSelectionsChange();
  }

  handleSelection3Select(
    selectedValue: string | null,
    options: readonly FormSelectionOption[],
  ): void {
    this.handleSelection3Change(this.findSelectedOption(selectedValue, options));
  }

  private emitSelectionsChange(): void {
    this.selectionsChange.emit({
      selection1: this.selection1(),
      selection2: this.selection2(),
      selection3: this.selection3(),
    });
  }

  private findSelectedOption(
    selectedValue: string | null,
    options: readonly FormSelectionOption[],
  ): FormSelectionOption | null {
    return options.find(option => option.value === selectedValue) ?? null;
  }

  private syncSelectionWithConfig(
    selection: WritableSignal<FormSelectionOption | null>,
    config?: FormSelectionConfig,
  ): boolean {
    if (!config) {
      if (selection()) {
        selection.set(null);
        return true;
      }

      return false;
    }

    if (config.type !== 'select') {
      return false;
    }

    const currentSelection = selection();

    if (!currentSelection) {
      return false;
    }

    const optionStillAvailable = config.options.some(option => option.value === currentSelection.value);

    if (config.disabled || !optionStillAvailable) {
      selection.set(null);
      return true;
    }

    return false;
  }
}
