import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportsApiService } from '../../../../core/api/reports-api.service';
import type { ItemClosingBalanceDto } from '../../../../core/api/erp-api.models';

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="mx-auto max-w-5xl space-y-4">
      <header class="space-y-1">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-50">Items closing balance</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">GET /reports/stock/items-closing-balance?toDate=…</p>
      </header>

      <div class="flex flex-wrap items-center gap-3">
        <label class="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          <span class="font-medium">Up to date</span>
          <input
            type="datetime-local"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            [value]="toDateLocal()"
            (input)="onToDateInput($event)"
          />
        </label>
        <button
          type="button"
          class="rounded-lg bg-[var(--p-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--p-primary-contrast-color)] shadow-sm hover:opacity-95"
          (click)="load()"
        >
          Refresh
        </button>
        @if (error()) {
          <span class="text-sm text-rose-700 dark:text-rose-300">{{ error() }}</span>
        }
      </div>

      <div class="overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table class="cp-data-grid__table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Barcode</th>
              <th>Title</th>
              <th>Current qty</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td colspan="4" class="cp-data-grid__empty">Loading…</td>
              </tr>
            } @else if (rows().length === 0) {
              <tr>
                <td colspan="4" class="cp-data-grid__empty">No rows.</td>
              </tr>
            } @else {
              @for (r of rows(); track r.itemId) {
                <tr>
                  <td>{{ r.itemId }}</td>
                  <td>{{ r.barcode }}</td>
                  <td>{{ r.title }}</td>
                  <td>
                    {{ r.currentAvailableQuantity | number: '1.2-2' }}
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class StockItemsClosingBalanceReportPageComponent {
  private readonly api = inject(ReportsApiService);
  private readonly destroyRef = inject(DestroyRef);

  /** Value for `datetime-local` input (local). */
  readonly toDateLocal = signal(toDatetimeLocalValue(new Date()));

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<ItemClosingBalanceDto[]>([]);

  constructor() {
    this.load();
  }

  onToDateInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) {
      this.toDateLocal.set(v);
    }
  }

  private toDateIso(): string {
    return new Date(this.toDateLocal()).toISOString();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getItemsClosingBalance(this.toDateIso())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.rows.set(r ?? []);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.loading.set(false);
          this.error.set(e instanceof Error ? e.message : 'Failed to load report.');
        },
      });
  }
}

