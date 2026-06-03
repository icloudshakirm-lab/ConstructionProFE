import { Routes } from '@angular/router';
import { buildFeatureModuleRoutes } from './core/utils/feature-route.factory';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      ...buildFeatureModuleRoutes()
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
