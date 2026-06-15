import { Routes } from '@angular/router';
import { TransactionDetailPageComponent } from './pages/transaction-detail-page.component';
import { TransactionListPageComponent } from './pages/transaction-list-page.component';

export const transactionsRoutes: Routes = [
  { path: '', component: TransactionListPageComponent },
  { path: ':id', component: TransactionDetailPageComponent },
];
