import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';

import { RouterOutlet } from "../../node_modules/@angular/router/types/_router_module-chunk";
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatToolbarModule,
    RouterOutlet
],
  template: `<router-outlet/>`,
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal(environment.appName);
  protected readonly environment = environment;
  protected readonly featurePills = [
    'Standalone bootstrap',
    'Tailwind utilities',
    'Angular Material',
    '.env-driven config',
  ];
  protected readonly envEntries = Object.entries(environment.variables);
  protected readonly apiEndpoint = computed(() =>
    `${environment.apiUrl.replace(/\/$/, '')}/${environment.apiVersion}`,
  );
}
