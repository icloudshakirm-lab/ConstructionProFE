import { Routes } from '@angular/router';
import { DashboardPageComponent } from './dashboard/dashboard-page.component';
import { invoicesRoutes } from './invoices/invoices.routes';

export const erpRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardPageComponent },
  {
    path: 'chart-of-accounts',
    loadComponent: () =>
      import('./chart-of-accounts/chart-of-accounts-page.component').then(
        (m) => m.ChartOfAccountsPageComponent
      )
  },
  { path: 'invoices', children: invoicesRoutes },
  {
    path: 'vouchers',
    loadChildren: () => import('./vouchers/vouchers.routes').then((m) => m.vouchersRoutes)
  },
  {
    path: 'pos-old',
    loadComponent: () => import('./pos/pos-page.component').then((m) => m.PosPageComponent)
  },
  {
    path: 'pos',
    loadComponent: () =>
      import('./extended-pos/extended-pos-page.component').then((m) => m.ExtendedPosPageComponent)
  },
  {
    path: 'pos/:id',
    loadComponent: () =>
      import('./extended-pos/extended-pos-page.component').then((m) => m.ExtendedPosPageComponent)
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.module').then((m) => m.ReportsModule)
  },
  {
    path: 'ledgers',
    loadChildren: () => import('./ledgers/ledgers.module').then((m) => m.LedgersModule)
  },
  {
    path: 'ledger-groups',
    loadChildren: () => import('./ledger-groups/ledger-groups.module').then((m) => m.LedgerGroupsModule)
  },
  {
    path: 'items',
    loadChildren: () => import('./items/items.module').then((m) => m.ItemsModule)
  },
  {
    path: 'item-groups',
    loadChildren: () => import('./item-groups/item-groups.module').then((m) => m.ItemGroupsModule)
  },
  {
    path: 'item-batches',
    loadChildren: () => import('./item-batches/item-batches.module').then((m) => m.ItemBatchesModule)
  },
  {
    path: 'contributors',
    loadChildren: () => import('./contributors/contributors.module').then((m) => m.ContributorsModule)
  },
  {
    path: 'transactions',
    loadChildren: () => import('./transactions/transactions.module').then((m) => m.TransactionsModule)
  },
  {
    path: 'company-info',
    loadComponent: () =>
      import('./company-info/company-info-page.component').then((m) => m.CompanyInfoPageComponent)
  },
  {
    path: 'configs',
    loadComponent: () => import('./configs/configs-page.component').then((m) => m.ConfigsPageComponent)
  },
  {
    path: 'item-categories',
    loadComponent: () =>
      import('./item-categories/item-categories-page.component').then((m) => m.ItemCategoriesPageComponent),
    data: { title: 'Item Categories' }
  },
  {
    path: 'price-lists',
    loadComponent: () =>
      import('./price-lists/price-lists-page.component').then((m) => m.PriceListsPageComponent),
    data: { title: 'Price Lists' }
  },
  {
    path: 'vendors-price-list',
    loadComponent: () =>
      import('./price-lists/price-lists-page.component').then((m) => m.PriceListsPageComponent),
    data: { title: 'Vendors Price List' }
  },
  {
    path: 'pos-price-list',
    loadComponent: () =>
      import('./price-lists/price-lists-page.component').then((m) => m.PriceListsPageComponent),
    data: { title: 'POS Price List' }
  },
  {
    path: 'godowns',
    loadComponent: () => import('./godowns/godowns-page.component').then((m) => m.GodownsPageComponent),
    data: { title: 'Godown' }
  },
  {
    path: 'cost-centers',
    loadChildren: () => import('./cost-centers/cost-centers.module').then((m) => m.CostCentersModule)
  },
  {
    path: 'cost-categories',
    loadChildren: () =>
      import('./cost-categories/cost-categories.module').then((m) => m.CostCategoriesModule)
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users-page.component').then((m) => m.UsersPageComponent)
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/roles-page.component').then((m) => m.RolesPageComponent)
  },
  {
    path: 'shifts',
    loadComponent: () => import('./shifts/shifts-page.component').then((m) => m.ShiftsPageComponent)
  },
  {
    path: 'branches',
    loadComponent: () => import('./branches/branches-page.component').then((m) => m.BranchesPageComponent)
  },
  {
    path: 'pos-counters',
    loadComponent: () =>
      import('./pos-counters/pos-counters-page.component').then((m) => m.PosCountersPageComponent)
  },
  {
    path: 'hardware',
    loadComponent: () => import('./hardware/hardware-page.component').then((m) => m.HardwarePageComponent)
  },
  {
    path: 'tills',
    loadComponent: () =>
      import('./tills/pages/till-list-page.component').then((m) => m.TillListPageComponent),
    data: { title: 'Tills' }
  },
  {
    path: 'till-assignments',
    loadComponent: () =>
      import('./till-assignments/pages/till-assignment-list-page.component').then(
        (m) => m.TillAssignmentListPageComponent
      ),
    data: { title: 'Till Assignments' }
  },
  {
    path: 'units',
    loadComponent: () => import('./units/units-page.component').then((m) => m.UnitsPageComponent)
  },
  {
    path: 'currencies',
    loadChildren: () => import('./currencies/currencies.module').then((m) => m.CurrenciesModule)
  },
  {
    path: 'currency-exchange-rates',
    loadChildren: () =>
      import('./currency-exchange-rates/currency-exchange-rates.module').then(
        (m) => m.CurrencyExchangeRatesModule
      )
  },
  {
    path: 'final-reports/trial-balance',
    loadComponent: () =>
      import('./final-reports/pages/trial-balance-report-page.component').then(
        (m) => m.TrialBalanceReportPageComponent
      )
  },
  {
    path: 'final-reports/profit-and-loss',
    loadComponent: () =>
      import('./final-reports/pages/profit-and-loss-report-page.component').then(
        (m) => m.ProfitAndLossReportPageComponent
      )
  },
  {
    path: 'final-reports/cost-of-goods-sold',
    loadComponent: () =>
      import('./final-reports/pages/cost-of-goods-sold-report-page.component').then(
        (m) => m.CostOfGoodsSoldReportPageComponent
      )
  },
  {
    path: 'final-reports/balance-sheet',
    loadComponent: () =>
      import('./final-reports/pages/balance-sheet-report-page.component').then(
        (m) => m.BalanceSheetReportPageComponent
      )
  },
  {
    path: 'inventory-transactions',
    loadComponent: () =>
      import('./inventory-transactions/inventory-transactions-hub.component').then(
        (m) => m.InventoryTransactionsHubComponent
      ),
  },
  {
    path: 'inventory-transactions/po',
    loadChildren: () =>
      import('./purchase-orders/purchase-orders.module').then((m) => m.PurchaseOrdersModule)
  },
  {
    path: 'inventory-transactions/quotations',
    loadChildren: () => import('./quotations/quotations.module').then((m) => m.QuotationsModule)
  },
  {
    path: 'inventory-transactions/delivery-notes',
    loadChildren: () =>
      import('./delivery-notes/delivery-notes.module').then((m) => m.DeliveryNotesModule)
  }
];
