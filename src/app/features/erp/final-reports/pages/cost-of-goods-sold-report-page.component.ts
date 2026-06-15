import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ReportsApiService } from '../../../../core/api/reports-api.service';
import type { ProfitAndLossLineDto, ProfitAndLossReportDto } from '../../../../core/api/erp-api.models';
import {
  apiErrorMessage,
  datetimeLocalToIso,
  defaultFromDateLocal,
  defaultToDateLocal,
} from '../financial-report-dates.util';

function isTradingExpense(line: ProfitAndLossLineDto): boolean {
  return /^4\.1(\.|$)/.test(line.code.trim());
}

@Component({
  standalone: true,
  imports: [DecimalPipe, DatePipe, Button, TableModule, Tag],
  templateUrl: './cost-of-goods-sold-report-page.component.html',
})
export class CostOfGoodsSoldReportPageComponent {
  private readonly api = inject(ReportsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly fromDateLocal = signal(defaultFromDateLocal());
  readonly toDateLocal = signal(defaultToDateLocal());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly report = signal<ProfitAndLossReportDto | null>(null);

  constructor() {
    this.load();
  }

  onFromDateInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) this.fromDateLocal.set(v);
  }

  onToDateInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) this.toDateLocal.set(v);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.report.set(null);
    this.api
      .getProfitAndLoss(datetimeLocalToIso(this.fromDateLocal()), datetimeLocalToIso(this.toDateLocal()))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.report.set(r);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.report.set(null);
          this.loading.set(false);
          this.error.set(apiErrorMessage(e));
        },
      });
  }

  tradingExpenseLines(): ProfitAndLossLineDto[] {
    return (this.report()?.expenses ?? []).filter(isTradingExpense);
  }

  totalTradingExpenses(): number {
    return this.tradingExpenseLines().reduce((s, l) => s + l.amount, 0);
  }

  openingStock(): number {
    return this.report()?.totalOpeningStockAmount ?? 0;
  }

  closingStock(): number {
    return this.report()?.totalClosingStockAmount ?? 0;
  }

  costOfGoodsSold(): number {
    return this.openingStock() + this.totalTradingExpenses() - this.closingStock();
  }
}
