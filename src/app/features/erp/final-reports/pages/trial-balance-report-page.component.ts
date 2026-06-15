import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportsApiService } from '../../../../core/api/reports-api.service';
import type { TrialBalanceReportDto } from '../../../../core/api/erp-api.models';
import {
  apiErrorMessage,
  datetimeLocalToIso,
  defaultFromDateLocal,
  defaultToDateLocal,
} from '../financial-report-dates.util';

@Component({
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './trial-balance-report-page.component.html',
})
export class TrialBalanceReportPageComponent {
  private readonly api = inject(ReportsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly fromDateLocal = signal(defaultFromDateLocal());
  readonly toDateLocal = signal(defaultToDateLocal());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly report = signal<TrialBalanceReportDto | null>(null);

  constructor() {
    this.load();
  }

  onFromDateInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) {
      this.fromDateLocal.set(v);
    }
  }

  onToDateInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) {
      this.toDateLocal.set(v);
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.report.set(null);
    this.api
      .getTrialBalance(datetimeLocalToIso(this.fromDateLocal()), datetimeLocalToIso(this.toDateLocal()))
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
}
