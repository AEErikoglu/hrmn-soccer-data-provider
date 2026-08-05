import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoading()) {
      <p class="text-sm text-slate-500">Loading shared players...</p>
    } @else if (players().length > 0) {
      <ul class="list-disc list-inside">
        @for (item of players(); track item) {
          <li>{{ item }}</li>
        }
      </ul>
    } @else {
      <p class="text-sm text-slate-500">{{ emptyMessage() }}</p>
    }
  `,
})
export class ListComponent {
  readonly players = input.required<readonly string[]>();
  readonly isLoading = input(false);
  readonly emptyMessage = input('No players found yet. Choose filters to load results.');
}
