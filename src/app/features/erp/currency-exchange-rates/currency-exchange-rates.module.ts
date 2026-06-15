import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { currencyExchangeRatesRoutes } from './currency-exchange-rates.routes';
import { CurrencyExchangeRateListPageComponent } from './pages/currency-exchange-rate-list-page.component';

@NgModule({
  imports: [RouterModule.forChild(currencyExchangeRatesRoutes), CurrencyExchangeRateListPageComponent],
})
export class CurrencyExchangeRatesModule {}
