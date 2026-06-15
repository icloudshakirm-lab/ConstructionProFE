import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TransactionDTO } from '../../../../core/api/erp-api.models';
import { ReportsApiService } from '../../../../core/api/reports-api.service';

interface SalesSummaryRow {
  label: string;
  qty: number;
  amount: number;
}

@Component({
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    TabsModule,
    TableModule,
    ButtonModule,
    DatePickerModule,
  ],
  template: `
    <div class="mx-auto max-w-5xl space-y-4 p-4">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-50">Daily Sales Report</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Summary of Qty and Amount for POS and Total Sales.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Date:
            <p-datepicker
              [(ngModel)]="selectedDate"
              (onSelect)="load()"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
            ></p-datepicker>
          </label>
          <p-button label="Refresh" icon="pi pi-refresh" (onClick)="load()" [loading]="loading()"></p-button>
        </div>
      </header>

      <p-tabs [value]="0">
        <p-tablist>
          <p-tab [value]="0">POS</p-tab>
          <p-tab [value]="1">Total Sales</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel [value]="0">
            <div class="cp-data-grid">
              <p-table 
                [value]="posSummary()" 
                styleClass="cp-data-grid cp-data-grid--compact" 
                responsiveLayout="scroll"
                [sortField]="sortField()"
                [sortOrder]="sortOrder()"
                (onSort)="onSort($event)"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Description</th>
                    <th class="bg-slate-50 dark:bg-slate-800/50 text-right" pSortableColumn="qty">
                      Qty <p-sortIcon field="qty"></p-sortIcon>
                    </th>
                    <th class="bg-slate-50 dark:bg-slate-800/50 text-right" pSortableColumn="amount">
                      Amount <p-sortIcon field="amount"></p-sortIcon>
                    </th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-row>
                  <tr>
                    <td>{{ row.label }}</td>
                    <td class="cp-data-grid__num">
                      {{ row.qty | number: '1.0-2' }}
                    </td>
                    <td class="cp-data-grid__num">
                      {{ row.amount | number: '1.2-2' }}
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="3" class="cp-data-grid__empty">
                      No POS data found for this date.
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>

          <p-tabpanel [value]="1">
            <div class="cp-data-grid">
              <p-table 
                [value]="totalSummary()" 
                styleClass="cp-data-grid cp-data-grid--compact" 
                responsiveLayout="scroll"
                [sortField]="sortField()"
                [sortOrder]="sortOrder()"
                (onSort)="onSort($event)"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Description</th>
                    <th class="bg-slate-50 dark:bg-slate-800/50 text-right" pSortableColumn="qty">
                      Qty <p-sortIcon field="qty"></p-sortIcon>
                    </th>
                    <th class="bg-slate-50 dark:bg-slate-800/50 text-right" pSortableColumn="amount">
                      Amount <p-sortIcon field="amount"></p-sortIcon>
                    </th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-row>
                  <tr>
                    <td>{{ row.label }}</td>
                    <td class="cp-data-grid__num">
                      {{ row.qty | number: '1.0-2' }}
                    </td>
                    <td class="cp-data-grid__num">
                      {{ row.amount | number: '1.2-2' }}
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="3" class="cp-data-grid__empty">
                      No sales data found for this date.
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
})
export class DailySalesReportPageComponent {
  private readonly api = inject(ReportsApiService);

  selectedDate: Date = new Date();
  loading = signal(false);
  sortField = signal<string | null>(null);
  sortOrder = signal<number>(1); // 1 = ASC, -1 = DESC

  posSummary = signal<SalesSummaryRow[]>([]);
  totalSummary = signal<SalesSummaryRow[]>([]);

  constructor() {
    this.load();
  }

  onSort(event: any): void {
    this.sortField.set(event.field);
    this.sortOrder.set(event.order);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${this.selectedDate.getFullYear()}-${pad(this.selectedDate.getMonth() + 1)}-${pad(this.selectedDate.getDate())}`;
    
    const sortBy = this.sortField() || undefined;
    const isDescending = this.sortOrder() === -1;

    // Fetch both POS and Sales. Total Sales = POS + Sales.
    this.api.getDailyPOSVouchers(dateStr, sortBy, isDescending).subscribe({
      next: (posData) => {
        const posAgg = this.aggregate(posData);
        this.posSummary.set(posAgg);

        this.api.getDailySalesVouchers(dateStr, sortBy, isDescending).subscribe({
          next: (salesData) => {
            const salesAgg = this.aggregate(salesData);
            // Combine both for Total Sales
            this.totalSummary.set(this.combine(posAgg, salesAgg));
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private aggregate(transactions: TransactionDTO[]): SalesSummaryRow[] {
    const map = new Map<string, { qty: number; amount: number }>();

    transactions.forEach((t) => {
      t.childTransactions.forEach((ct) => {
        const isTotalLine = ct.description?.toLowerCase().includes('total');
        
        if (!isTotalLine && (ct.ledgerEntryType === 'Credit' || ct.itemId || ct.quantity)) {
          const label = ct.description || ct.itemId || 'Unspecified Item';
          const existing = map.get(label) || { qty: 0, amount: 0 };
          
          existing.qty += ct.quantity || 0;
          existing.amount += ct.inventoryAmount || ct.ledgerAmount || 0;
          
          map.set(label, existing);
        }
      });
    });

    let result = Array.from(map.entries())
      .map(([label, val]) => ({
        label,
        qty: val.qty,
        amount: val.amount,
      }))
      .filter(row => row.amount > 0 || row.qty > 0);

    // Apply sorting to the aggregated results
    const field = this.sortField();
    const order = this.sortOrder();
    
    if (field === 'qty' || field === 'amount') {
      result.sort((a, b) => {
        const valA = a[field as keyof SalesSummaryRow] as number;
        const valB = b[field as keyof SalesSummaryRow] as number;
        return (valA - valB) * order;
      });
    }

    return result;
  }

  private combine(a: SalesSummaryRow[], b: SalesSummaryRow[]): SalesSummaryRow[] {
    const map = new Map<string, { qty: number; amount: number }>();
    [...a, ...b].forEach((row) => {
      const existing = map.get(row.label) || { qty: 0, amount: 0 };
      existing.qty += row.qty;
      existing.amount += row.amount;
      map.set(row.label, existing);
    });
    return Array.from(map.entries()).map(([label, val]) => ({
      label,
      qty: val.qty,
      amount: val.amount,
    }));
  }
}
