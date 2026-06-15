import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ReportsApiService } from '../../../../core/api/reports-api.service';
import type { LedgerClosingBalanceDto } from '../../../../core/api/erp-api.models';

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  standalone: true,
  imports: [DecimalPipe, RouterLink, Button, TableModule, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="Reports · Ledgers" severity="info" />
          <h1>Ledgers closing balance</h1>
          <p class="erp-list-page__subtitle">Ledger balances as of a selected date.</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Back to reports" icon="pi pi-arrow-left" [text]="true" routerLink="/erp/reports" />
        </div>
      </header>

      <div class="erp-list-page__toolbar">
        <div class="erp-list-page__field">
          <label for="lcb-to">Up to date</label>
          <input
            id="lcb-to"
            type="datetime-local"
            class="erp-doc__input"
            [value]="toDateLocal()"
            (input)="onToDateInput($event)"
          />
        </div>
        <p-button label="Refresh" icon="pi pi-refresh" (onClick)="load()" [loading]="loading()" />
        @if (rows().length > 0) {
          <span class="erp-list-page__count">{{ rows().length }} ledger(s)</span>
        }
      </div>

      @if (error()) {
        <p class="erp-list-page__alert">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="erp-list-page__loading">Loading report…</p>
      } @else {
        <p-table
          [value]="rows()"
          [rows]="15"
          [paginator]="rows().length > 15"
          dataKey="ledgerId"
          styleClass="cp-data-grid"
          [scrollable]="true"
          scrollHeight="flex"
        >
          <ng-template #header>
            <tr>
              <th>Ledger ID</th>
              <th>Code</th>
              <th>Name</th>
              <th class="erp-list-page__num">Closing balance</th>
            </tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td>{{ r.ledgerId }}</td>
              <td><strong>{{ r.code }}</strong></td>
              <td>{{ r.name }}</td>
              <td class="erp-list-page__num">{{ r.closingBalance | number: '1.2-2' }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="4" class="cp-data-grid__empty">No rows for this date.</td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `,
})
export class LedgerClosingBalanceReportPageComponent {
  private readonly api = inject(ReportsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly toDateLocal = signal(toDatetimeLocalValue(new Date()));

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<LedgerClosingBalanceDto[]>([]);

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
      .getLedgersClosingBalance(this.toDateIso())
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
