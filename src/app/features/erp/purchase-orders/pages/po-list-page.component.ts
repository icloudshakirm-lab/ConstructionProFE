import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { PurchaseOrdersApiService } from '../../../../core/api/purchase-orders-api.service';
import type { PurchaseOrderListItemDto } from '../../../../core/api/erp-api.models';
import { PoViewDialogComponent } from '../components/po-view-dialog.component';
import { PO_STATUS_OPTIONS } from '../purchase-order-status';
import { apiErrorMessage } from '../purchase-order.util';
import {
  datetimeLocalToIso,
  defaultFromDateLocal,
  defaultToDateLocal,
} from '../../final-reports/financial-report-dates.util';
import { DocumentStatusBadgeComponent } from '../../../../shared/components/document-status-badge/document-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-po-list-page',
  imports: [DecimalPipe, DatePipe, RouterLink, Select, FormsModule, PoViewDialogComponent, DocumentStatusBadgeComponent],
  templateUrl: './po-list-page.component.html',
})
export class PoListPageComponent implements OnInit {
  private readonly api = inject(PurchaseOrdersApiService);

  readonly rows = signal<PurchaseOrderListItemDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusOptions = PO_STATUS_OPTIONS;
  readonly filterStatus = signal<string | null>(null);
  readonly filterFromLocal = signal(defaultFromDateLocal());
  readonly filterToLocal = signal(defaultToDateLocal());

  readonly viewVisible = signal(false);
  readonly viewPoId = signal<number | null>(null);

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

  openView(id: number): void {
    this.viewPoId.set(id);
    this.viewVisible.set(true);
  }

  onViewVisibleChange(v: boolean): void {
    this.viewVisible.set(v);
    if (!v) {
      this.viewPoId.set(null);
    }
  }

  onViewSaved(): void {
    this.load();
  }
}
