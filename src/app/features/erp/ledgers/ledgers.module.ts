import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LedgerDetailPageComponent } from './pages/ledger-detail-page.component';
import { LedgerListPageComponent } from './pages/ledger-list-page.component';
import { ledgersRoutes } from './ledgers.routes';

@NgModule({
  imports: [
    RouterModule.forChild(ledgersRoutes),
    LedgerListPageComponent,
    LedgerDetailPageComponent,
  ],
})
export class LedgersModule {}
