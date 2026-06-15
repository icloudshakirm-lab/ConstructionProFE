import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LedgerGroupDetailPageComponent } from './pages/ledger-group-detail-page.component';
import { LedgerGroupListPageComponent } from './pages/ledger-group-list-page.component';
import { ledgerGroupsRoutes } from './ledger-groups.routes';

@NgModule({
  imports: [
    RouterModule.forChild(ledgerGroupsRoutes),
    LedgerGroupListPageComponent,
    LedgerGroupDetailPageComponent,
  ],
})
export class LedgerGroupsModule {}
