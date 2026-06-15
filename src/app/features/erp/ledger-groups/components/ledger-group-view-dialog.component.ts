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
import { LedgerGroupsApiService } from '../../../../core/api/ledger-groups-api.service';
import type { GroupLedgerDTO } from '../../../../core/api/erp-api.models';
import { LedgerGroupFormDialogComponent } from './ledger-group-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-ledger-group-view-dialog',
  imports: [CommonModule, Dialog, Button, LedgerGroupFormDialogComponent],
  templateUrl: './ledger-group-view-dialog.component.html',
  styleUrl: './ledger-group-view-dialog.component.css',
})
export class LedgerGroupViewDialogComponent implements OnChanges {
  private readonly api = inject(LedgerGroupsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() groupId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly row = signal<GroupLedgerDTO | null>(null);
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
    const id = this.groupId;
    if (id == null || Number.isNaN(id)) {
      return;
    }
    if (changes['groupId'] || changes['visible']) {
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
    const id = this.groupId;
    if (id != null) {
      this.fetchRow(id);
    }
    this.saved.emit();
  }

  remove(): void {
    const id = this.row()?.id;
    if (id == null || !confirm('Delete this ledger group?')) {
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
