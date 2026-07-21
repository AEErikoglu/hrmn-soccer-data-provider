import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => import('./features/home/pages/home'),
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];
