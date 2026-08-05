export interface FormSelectionOption {
  readonly value: string;
  readonly label: string;
}

export type FormSelectionType =
  | 'team-autocomplete'
  | 'player-autocomplete'
  | 'country-autocomplete'
  | 'select'
  | 'text-input';

export interface FormSelectionConfig {
  readonly type: FormSelectionType;
  readonly label: string;
  readonly options: readonly FormSelectionOption[];
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly resetKey?: string;
}

export interface Selections {
  readonly selection1: FormSelectionConfig;
  readonly selection2: FormSelectionConfig;
  readonly selection3?: FormSelectionConfig;
}

export interface FormSettingsByTab {
  readonly id: string;
  readonly tabName: string;
  readonly form: Selections;
}

export interface FormSelectionsChange {
  readonly selection1: FormSelectionOption | null;
  readonly selection2: FormSelectionOption | null;
  readonly selection3?: FormSelectionOption | null;
}
