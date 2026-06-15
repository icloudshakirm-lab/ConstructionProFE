import { Routes } from '@angular/router';
import { buildFeatureModuleRoutes } from './core/utils/feature-route.factory';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/erp/auth/login/login-page.component').then((m) => m.LoginPageComponent)
      }
    ]
  },
  {
    path: 'print/pos-receipt',
    loadComponent: () =>
      import('./features/erp/pos/pos-print-page.component').then((m) => m.PosPrintPageComponent)
  },
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
      {
        path: 'erp',
        loadChildren: () => import('./features/erp/erp.routes').then((m) => m.erpRoutes)
      },
      ...buildFeatureModuleRoutes()
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
