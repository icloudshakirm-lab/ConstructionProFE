import { Routes } from '@angular/router';
import { ReportsHomePageComponent } from './pages/reports-home-page.component';
import { StockItemsClosingBalanceReportPageComponent } from './pages/stock-items-closing-balance-report-page.component';
import { StockItemsByGroupReportPageComponent } from './pages/stock-items-by-group-report-page.component';
import { StockBatchesByItemReportPageComponent } from './pages/stock-batches-by-item-report-page.component';
import { LedgerClosingBalanceReportPageComponent } from './pages/ledger-closing-balance-report-page.component';
import { LedgerTransactionsReportPageComponent } from './pages/ledger-transactions-report-page.component';
import { DailySalesReportPageComponent } from './pages/daily-sales-report-page.component';
import { JobCostMatrixReportPageComponent } from './pages/job-cost-matrix-report-page.component';

export const reportsRoutes: Routes = [
  { path: '', component: ReportsHomePageComponent },
  { path: 'stock/items-closing-balance', component: StockItemsClosingBalanceReportPageComponent },
  { path: 'stock/items-by-group', component: StockItemsByGroupReportPageComponent },
  { path: 'stock/batches-by-item', component: StockBatchesByItemReportPageComponent },
  { path: 'ledgers/closing-balance', component: LedgerClosingBalanceReportPageComponent },
  { path: 'ledgers/transactions', component: LedgerTransactionsReportPageComponent },
  { path: 'sales/daily', component: DailySalesReportPageComponent },
  { path: 'job-cost-matrix', component: JobCostMatrixReportPageComponent },
];

