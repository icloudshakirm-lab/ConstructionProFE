import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
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
import { TransactionsApiService } from '../../../../core/api/transactions-api.service';
import type { TransactionDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-transaction-view-dialog',
  imports: [CommonModule, Dialog, Button, DatePipe, DecimalPipe],
  templateUrl: './transaction-view-dialog.component.html',
  styleUrl: './transaction-view-dialog.component.css',
})
export class TransactionViewDialogComponent implements OnChanges {
  private readonly api = inject(TransactionsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() transactionId: number | null = null;

  readonly row = signal<TransactionDTO | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      if (changes['visible']) {
        this.reset();
      }
      return;
    }
    const id = this.transactionId;
    if (id == null || Number.isNaN(id)) {
      return;
    }
    if (changes['transactionId'] || changes['visible']) {
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
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  private reset(): void {
    this.row.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
