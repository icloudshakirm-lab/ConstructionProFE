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
import { LedgersApiService } from '../../../../core/api/ledgers-api.service';
import type { LedgerDTO } from '../../../../core/api/erp-api.models';
import { LedgerFormDialogComponent } from './ledger-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-ledger-view-dialog',
  imports: [CommonModule, Dialog, Button, LedgerFormDialogComponent],
  templateUrl: './ledger-view-dialog.component.html',
  styleUrl: './ledger-view-dialog.component.css',
})
export class LedgerViewDialogComponent implements OnChanges {
  private readonly api = inject(LedgersApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() ledgerId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly row = signal<LedgerDTO | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly formVisible = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      if (changes['visible']) {
        this.reset();
      }
      return;
    }
    const id = this.ledgerId;
    if (id == null || Number.isNaN(id)) {
      return;
    }
    if (changes['ledgerId'] || changes['visible']) {
      this.fetchRow(id);
    }
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
    if (!open) {
      this.reset();
    }
  }

  openEdit(): void {
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  onFormSaved(): void {
    const id = this.ledgerId;
    if (id != null) {
      this.fetchRow(id);
    }
    this.saved.emit();
  }

  remove(): void {
    const id = this.row()?.id;
    if (id == null || !confirm('Delete this ledger?')) {
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
    this.formVisible.set(false);
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
