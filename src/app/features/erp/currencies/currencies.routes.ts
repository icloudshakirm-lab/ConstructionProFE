import { Routes } from '@angular/router';
import { CurrencyDetailPageComponent } from './pages/currency-detail-page.component';
import { CurrencyListPageComponent } from './pages/currency-list-page.component';

export const currenciesRoutes: Routes = [
  { path: '', component: CurrencyListPageComponent },
  { path: ':id', component: CurrencyDetailPageComponent },
];
