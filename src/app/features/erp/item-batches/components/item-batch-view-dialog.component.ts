import { CommonModule } from '@angular/common';
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
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { ItemBatchesApiService } from '../../../../core/api/item-batches-api.service';
import type { BatchDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-item-batch-view-dialog',
  imports: [CommonModule, Dialog, Button],
  templateUrl: './item-batch-view-dialog.component.html',
  styleUrl: './item-batch-view-dialog.component.css',
})
export class ItemBatchViewDialogComponent implements OnChanges {
  private readonly api = inject(ItemBatchesApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() batchId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly row = signal<BatchDTO | null>(null);
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
    const id = this.batchId;
    if (id == null || Number.isNaN(id)) {
      return;
    }
    if (changes['batchId'] || changes['visible']) {
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
    if (id == null || !confirm('Delete this batch?')) {
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
        this.error.set(this.msg(e));
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
        this.error.set(this.msg(e));
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

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
