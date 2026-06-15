import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CurrencyDetailPageComponent } from './pages/currency-detail-page.component';
import { CurrencyListPageComponent } from './pages/currency-list-page.component';
import { currenciesRoutes } from './currencies.routes';

@NgModule({
  imports: [
    RouterModule.forChild(currenciesRoutes),
    CurrencyListPageComponent,
    CurrencyDetailPageComponent,
  ],
})
export class CurrenciesModule {}
