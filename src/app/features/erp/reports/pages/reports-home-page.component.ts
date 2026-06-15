import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-4xl space-y-6">
      <header class="space-y-1">
        <h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-50">Reports</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Choose a report from the menu, or from the list below.
        </p>
      </header>

      <section class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          routerLink="stock/items-closing-balance"
          class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <div class="font-semibold">Stock • Items closing balance</div>
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">GET /reports/stock/items-closing-balance</div>
        </a>
        <a
          routerLink="stock/items-by-group"
          class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <div class="font-semibold">Stock • Items by group</div>
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">GET /reports/stock/items-by-group/(groupId)</div>
        </a>
        <a
          routerLink="stock/batches-by-item"
          class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <div class="font-semibold">Stock • Batches by item</div>
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">GET /reports/stock/batches-by-item/(itemId)</div>
        </a>
        <a
          routerLink="ledgers/closing-balance"
          class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <div class="font-semibold">Ledgers • Closing balance</div>
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">GET /reports/ledgers/closing-balance</div>
        </a>
        <a
          routerLink="ledgers/transactions"
          class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <div class="font-semibold">Ledgers • Transactions</div>
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">GET /reports/ledgers/(ledgerId)/transactions</div>
        </a>
        <a
          routerLink="sales/daily"
          class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <div class="font-semibold">Sales • Daily sales report</div>
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">GET /reports/daily/(pos|sales)</div>
        </a>
      </section>
    </div>
  `,
})
export class ReportsHomePageComponent {}

