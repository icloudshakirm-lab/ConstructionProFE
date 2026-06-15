import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { PurchaseOrdersApiService } from '../../../../core/api/purchase-orders-api.service';
import type { PurchaseOrderDto } from '../../../../core/api/erp-api.models';
import { apiErrorMessage } from '../purchase-order.util';
import { DocumentStatusBadgeComponent } from '../../../../shared/components/document-status-badge/document-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-po-view-dialog',
  imports: [DecimalPipe, DatePipe, Dialog, RouterLink, Button, DocumentStatusBadgeComponent],
  templateUrl: './po-view-dialog.component.html',
})
export class PoViewDialogComponent implements OnChanges {
  private readonly api = inject(PurchaseOrdersApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() purchaseOrderId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly row = signal<PurchaseOrderDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      if (changes['visible']) {
        this.reset();
      }
      return;
    }
    const id = this.purchaseOrderId;
    if (id == null || Number.isNaN(id)) {
      return;
    }
    if (changes['purchaseOrderId'] || changes['visible']) {
      this.fetchRow(id);
    }
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
    if (!open) {
      this.reset();
    }
  }

  private fetchRow(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.row.set(null);
    this.api.getById(id).subscribe({
      next: (r) => {
        this.row.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }

  private reset(): void {
    this.row.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
