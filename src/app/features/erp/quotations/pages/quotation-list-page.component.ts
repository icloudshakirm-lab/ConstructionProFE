import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { QuotationsApiService } from '../../../../core/api/quotations-api.service';
import type { QuotationListItemDto } from '../../../../core/api/erp-api.models';
import { QuotationViewDialogComponent } from '../components/quotation-view-dialog.component';
import { QUOTATION_STATUS_OPTIONS } from '../quotation-status';
import { apiErrorMessage } from '../quotation.util';
import {
  datetimeLocalToIso,
  defaultFromDateLocal,
  defaultToDateLocal,
} from '../../final-reports/financial-report-dates.util';
import { DocumentStatusBadgeComponent } from '../../../../shared/components/document-status-badge/document-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-quotation-list-page',
  imports: [
    DecimalPipe,
    DatePipe,
    RouterLink,
    Select,
    FormsModule,
    Button,
    TableModule,
    Tag,
    QuotationViewDialogComponent,
    DocumentStatusBadgeComponent,
  ],
  templateUrl: './quotation-list-page.component.html',
})
export class QuotationListPageComponent implements OnInit {
  private readonly api = inject(QuotationsApiService);

  readonly rows = signal<QuotationListItemDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);

  readonly statusOptions = QUOTATION_STATUS_OPTIONS;
  readonly filterStatus = signal<string | null>(null);
  readonly filterFromLocal = signal(defaultFromDateLocal());
  readonly filterToLocal = signal(defaultToDateLocal());

  readonly viewVisible = signal(false);
  readonly viewQuotationId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  onFromInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) {
      this.filterFromLocal.set(v);
    }
  }

  onToInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (v) {
      this.filterToLocal.set(v);
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({
        status: this.filterStatus(),
        fromDate: datetimeLocalToIso(this.filterFromLocal()),
        toDate: datetimeLocalToIso(this.filterToLocal()),
      })
      .subscribe({
        next: (r) => {
          this.rows.set(r ?? []);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(apiErrorMessage(e));
          this.loading.set(false);
        },
      });
  }

  canDelete(row: QuotationListItemDto): boolean {
    return row.status?.toLowerCase() === 'draft';
  }

  remove(row: QuotationListItemDto): void {
    if (!this.canDelete(row) || !confirm(`Delete draft quotation ${row.quotationNumber}?`)) {
      return;
    }
    this.deletingId.set(row.id);
    this.api.delete(row.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.load();
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.deletingId.set(null);
      },
    });
  }

  openView(id: number): void {
    this.viewQuotationId.set(id);
    this.viewVisible.set(true);
  }

  onViewVisibleChange(v: boolean): void {
    this.viewVisible.set(v);
    if (!v) {
      this.viewQuotationId.set(null);
    }
  }

  onViewSaved(): void {
    this.load();
  }
}
