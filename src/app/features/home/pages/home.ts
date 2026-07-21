import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }
  `,
  template: `
    <mat-card class="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h1 class="text-2xl font-semibold text-slate-950">SportDB football data layer is ready.</h1>
      <p class="mt-3 text-sm leading-6 text-slate-600">
        Use <code>SportDbFootballService</code> from <code>shared/services</code> for Transfermarkt-backed
        player and team requests.
      </p>
      <ul class="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
        <li><code>searchPlayers</code>, <code>getPlayerProfile</code>, <code>getPlayerTransfers</code></li>
        <li><code>getPlayerOverview</code> for nationality plus teams played</li>
        <li><code>searchTeams</code>, <code>getTeamProfile</code>, <code>getTeamPlayers</code></li>
      </ul>
    </mat-card>
  `,
})
export default class HomeComponent {}