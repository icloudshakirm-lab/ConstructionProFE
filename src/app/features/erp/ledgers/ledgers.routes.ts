import { Routes } from '@angular/router';
import { LedgerDetailPageComponent } from './pages/ledger-detail-page.component';
import { LedgerListPageComponent } from './pages/ledger-list-page.component';

export const ledgersRoutes: Routes = [
  { path: '', component: LedgerListPageComponent },
  { path: ':id', component: LedgerDetailPageComponent },
];
