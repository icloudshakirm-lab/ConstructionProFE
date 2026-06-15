import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TransactionDetailPageComponent } from './pages/transaction-detail-page.component';
import { TransactionListPageComponent } from './pages/transaction-list-page.component';
import { transactionsRoutes } from './transactions.routes';

@NgModule({
  imports: [
    RouterModule.forChild(transactionsRoutes),
    TransactionListPageComponent,
    TransactionDetailPageComponent,
  ],
})
export class TransactionsModule {}
