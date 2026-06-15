import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tag } from 'primeng/tag';

interface ReportCard {
  title: string;
  description: string;
  route: string[];
  icon: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="ERP · Reports" severity="info" />
          <h1>Reports</h1>
          <p class="erp-list-page__subtitle">
            Choose a report below — stock balances, ledger activity, and daily sales from the API.
          </p>
        </div>
      </header>

      <div class="erp-inv-hub">
        @for (card of cards; track card.route.join('/')) {
          <a [routerLink]="card.route" class="erp-inv-hub__card">
            <span class="erp-inv-hub__icon"><i [class]="card.icon" aria-hidden="true"></i></span>
            <h2>{{ card.title }}</h2>
            <p>{{ card.description }}</p>
          </a>
        }
      </div>
    </div>
  `,
})
export class ReportsHomePageComponent {
  readonly cards: ReportCard[] = [
    {
      title: 'Stock · Items closing balance',
      description: 'Closing quantity and value per item as of a date.',
      route: ['/erp', 'reports', 'stock', 'items-closing-balance'],
      icon: 'pi pi-box',
    },
    {
      title: 'Stock · Items by group',
      description: 'Items rolled up by item group — pick a group to drill down.',
      route: ['/erp', 'reports', 'stock', 'items-by-group'],
      icon: 'pi pi-th-large',
    },
    {
      title: 'Stock · Batches by item',
      description: 'Batch-level stock for a selected item.',
      route: ['/erp', 'reports', 'stock', 'batches-by-item'],
      icon: 'pi pi-tags',
    },
    {
      title: 'Ledgers · Closing balance',
      description: 'Ledger closing balances as of a date.',
      route: ['/erp', 'reports', 'ledgers', 'closing-balance'],
      icon: 'pi pi-wallet',
    },
    {
      title: 'Ledgers · Transactions',
      description: 'Transaction lines for a selected ledger.',
      route: ['/erp', 'reports', 'ledgers', 'transactions'],
      icon: 'pi pi-list',
    },
    {
      title: 'Job cost matrix',
      description: 'Project spend vs earnings — material, labour, overhead, and all income/expense ledgers by cost center.',
      route: ['/erp', 'reports', 'job-cost-matrix'],
      icon: 'pi pi-compass',
    },
    {
      title: 'Sales · Daily sales report',
      description: 'Daily POS / sales totals for a chosen date.',
      route: ['/erp', 'reports', 'sales', 'daily'],
      icon: 'pi pi-chart-bar',
    },
  ];
}
