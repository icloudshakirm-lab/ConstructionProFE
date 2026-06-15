import { Routes } from '@angular/router';
import { LedgerGroupDetailPageComponent } from './pages/ledger-group-detail-page.component';
import { LedgerGroupListPageComponent } from './pages/ledger-group-list-page.component';

export const ledgerGroupsRoutes: Routes = [
  { path: '', component: LedgerGroupListPageComponent },
  { path: ':id', component: LedgerGroupDetailPageComponent },
];
