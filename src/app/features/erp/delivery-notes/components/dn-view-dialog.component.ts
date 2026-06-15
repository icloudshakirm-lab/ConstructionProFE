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
import { DeliveryNotesApiService } from '../../../../core/api/delivery-notes-api.service';
import type { DeliveryNoteDto } from '../../../../core/api/erp-api.models';
import { apiErrorMessage } from '../delivery-note.util';
import { DocumentStatusBadgeComponent } from '../../../../shared/components/document-status-badge/document-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-dn-view-dialog',
  imports: [DecimalPipe, DatePipe, Dialog, Button, RouterLink, DocumentStatusBadgeComponent],
  templateUrl: './dn-view-dialog.component.html',
})
export class DnViewDialogComponent implements OnChanges {
  private readonly api = inject(DeliveryNotesApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() deliveryNoteId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly row = signal<DeliveryNoteDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      if (changes['visible']) {
        this.reset();
      }
      return;
    }
    const id = this.deliveryNoteId;
    if (id == null || Number.isNaN(id)) {
      return;
    }
    if (changes['deliveryNoteId'] || changes['visible']) {
      this.fetchRow(id);
    }
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
    if (!open) {
      this.reset();
    }
  }

  remove(): void {
    const id = this.row()?.id;
    const num = this.row()?.dnNumber;
    if (id == null || !confirm(`Delete delivery note ${num}?`)) {
      return;
    }
    this.deleting.set(true);
    this.api.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.saved.emit();
        this.onVisibilityChange(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.deleting.set(false);
      },
    });
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
    this.deleting.set(false);
  }
}
