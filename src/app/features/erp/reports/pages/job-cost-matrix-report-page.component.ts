import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import type { JobCostMatrixReportDto, JobCostMatrixRowDto, JobCostMatrixView } from '../../../../core/api/erp-api.models';
import {
  apiErrorMessage,
  datetimeLocalToIso,
  defaultFromDateLocal,
  defaultToDateLocal,
} from '../../final-reports/financial-report-dates.util';
import {
  amountForRow,
  costCenterHeaderGroups,
  isSectionRow,
  isSummaryRow,
  projectColumns,
} from '../job-cost-matrix.builder';
import { JobCostMatrixReportService } from '../job-cost-matrix-report.service';

@Component({
  standalone: true,
  imports: [DecimalPipe, DatePipe, Button, Tag],
  templateUrl: './job-cost-matrix-report-page.component.html',
  styleUrl: './job-cost-matrix-report-page.component.scss',
})
export class JobCostMatrixReportPageComponent {
  private readonly reportService = inject(JobCostMatrixReportService);
  private readonly destroyRef = inject(DestroyRef);

  readonly fromDateLocal = signal(defaultFromDateLocal());
  readonly toDateLocal = signal(defaultToDateLocal());
  readonly viewMode = signal<JobCostMatrixView>('cost-center');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly report = signal<JobCostMatrixReportDto | null>(null);

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

  setView(mode: JobCostMatrixView): void {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.report.set(null);
    this.reportService
      .load(
        datetimeLocalToIso(this.fromDateLocal()),
        datetimeLocalToIso(this.toDateLocal()),
        this.viewMode(),
      )
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

  projectCols(): ReturnType<typeof projectColumns> {
    return projectColumns(this.report()?.columns ?? []);
  }

  headerGroups(): ReturnType<typeof costCenterHeaderGroups> {
    return costCenterHeaderGroups(this.report()?.columns ?? []);
  }

  showCategorySubHeaders(): boolean {
    return this.viewMode() === 'cost-category' && this.projectCols().some((c) => c.costCategoryId != null);
  }

  rowClass(row: JobCostMatrixRowDto): string {
    if (isSectionRow(row.kind)) return 'job-matrix__section-row';
    if (row.kind === 'net-project') return 'job-matrix__net-row';
    if (isSummaryRow(row.kind)) return 'job-matrix__summary-row';
    if (row.kind === 'income-ledger') return 'job-matrix__income-row';
    return 'job-matrix__ledger-row';
  }

  cellClass(row: JobCostMatrixRowDto, columnKey: string): string {
    const amt = amountForRow(row, columnKey);
    if (row.kind === 'income-ledger' || row.kind === 'subtotal-income') {
      return amt > 0 ? 'job-matrix__earn' : '';
    }
    if (
      row.kind === 'expense-ledger' ||
      row.kind === 'material-total' ||
      row.kind === 'labour-total' ||
      row.kind === 'overhead-total' ||
      row.kind === 'subtotal-expense'
    ) {
      return amt > 0 ? 'job-matrix__spend' : '';
    }
    if (row.kind === 'net-project') {
      if (amt > 0) return 'job-matrix__earn';
      if (amt < 0) return 'job-matrix__spend';
    }
    return '';
  }

  cellClasses(row: JobCostMatrixRowDto, columnKey: string): string {
    const classes = ['erp-list-page__num'];
    if (columnKey === 'period-total') classes.push('job-matrix__period-col');
    const extra = this.cellClass(row, columnKey);
    if (extra) classes.push(extra);
    return classes.join(' ');
  }

  amountFor(row: JobCostMatrixRowDto, columnKey: string): number {
    return amountForRow(row, columnKey);
  }

  isSection(row: JobCostMatrixRowDto): boolean {
    return isSectionRow(row.kind);
  }
}
