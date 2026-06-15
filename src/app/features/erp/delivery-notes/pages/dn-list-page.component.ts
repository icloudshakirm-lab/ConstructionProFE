import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DeliveryNotesApiService } from '../../../../core/api/delivery-notes-api.service';
import type { DeliveryNoteListItemDto } from '../../../../core/api/erp-api.models';
import { DnFromQuotationDialogComponent } from '../components/dn-from-quotation-dialog.component';
import { DnViewDialogComponent } from '../components/dn-view-dialog.component';
import { DELIVERY_NOTE_STATUS_OPTIONS } from '../delivery-note-status';
import { apiErrorMessage } from '../delivery-note.util';
import {
  datetimeLocalToIso,
  defaultFromDateLocal,
  defaultToDateLocal,
} from '../../final-reports/financial-report-dates.util';
import { DocumentStatusBadgeComponent } from '../../../../shared/components/document-status-badge/document-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-dn-list-page',
  imports: [
    DecimalPipe,
    DatePipe,
    RouterLink,
    Select,
    FormsModule,
    DnViewDialogComponent,
    DnFromQuotationDialogComponent,
    DocumentStatusBadgeComponent,
  ],
  templateUrl: './dn-list-page.component.html',
})
export class DnListPageComponent implements OnInit {
  private readonly api = inject(DeliveryNotesApiService);

  readonly rows = signal<DeliveryNoteListItemDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);

  readonly statusOptions = DELIVERY_NOTE_STATUS_OPTIONS;
  readonly filterStatus = signal<string | null>(null);
  readonly filterQuotationId = signal<string>('');
  readonly filterFromLocal = signal(defaultFromDateLocal());
  readonly filterToLocal = signal(defaultToDateLocal());

  readonly viewVisible = signal(false);
  readonly viewDnId = signal<number | null>(null);
  readonly fromQuotationVisible = signal(false);

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
    const qidRaw = this.filterQuotationId().trim();
    const quotationId = qidRaw && !Number.isNaN(Number(qidRaw)) ? Number(qidRaw) : null;
    this.api
      .list({
        status: this.filterStatus(),
        quotationId,
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

  remove(row: DeliveryNoteListItemDto): void {
    if (!confirm(`Delete delivery note ${row.dnNumber}?`)) {
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
    this.viewDnId.set(id);
    this.viewVisible.set(true);
  }

  onViewVisibleChange(v: boolean): void {
    this.viewVisible.set(v);
    if (!v) {
      this.viewDnId.set(null);
    }
  }

  openFromQuotation(): void {
    this.fromQuotationVisible.set(true);
  }

  onFromQuotationVisibleChange(v: boolean): void {
    this.fromQuotationVisible.set(v);
  }

  onSaved(): void {
    this.load();
  }
}
