import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { reportsRoutes } from './reports.routes';
import { ReportsHomePageComponent } from './pages/reports-home-page.component';
import { StockItemsClosingBalanceReportPageComponent } from './pages/stock-items-closing-balance-report-page.component';
import { StockItemsByGroupReportPageComponent } from './pages/stock-items-by-group-report-page.component';
import { StockBatchesByItemReportPageComponent } from './pages/stock-batches-by-item-report-page.component';
import { LedgerClosingBalanceReportPageComponent } from './pages/ledger-closing-balance-report-page.component';
import { LedgerTransactionsReportPageComponent } from './pages/ledger-transactions-report-page.component';
import { DailySalesReportPageComponent } from './pages/daily-sales-report-page.component';

@NgModule({
  imports: [
    RouterModule.forChild(reportsRoutes),
    ReportsHomePageComponent,
    StockItemsClosingBalanceReportPageComponent,
    StockItemsByGroupReportPageComponent,
    StockBatchesByItemReportPageComponent,
    LedgerClosingBalanceReportPageComponent,
    LedgerTransactionsReportPageComponent,
    DailySalesReportPageComponent,
  ],
})
export class ReportsModule {}

