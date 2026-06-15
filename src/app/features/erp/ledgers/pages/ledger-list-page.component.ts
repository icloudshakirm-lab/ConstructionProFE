import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { LedgersApiService } from '../../../../core/api/ledgers-api.service';
import type { LedgerDTO } from '../../../../core/api/erp-api.models';
import { LedgerFormDialogComponent } from '../components/ledger-form-dialog.component';
import { LedgerViewDialogComponent } from '../components/ledger-view-dialog.component';

@Component({
  standalone: true,
  selector: 'app-ledger-list-page',
  imports: [CommonModule, LedgerFormDialogComponent, LedgerViewDialogComponent],
  templateUrl: './ledger-list-page.component.html',
  styleUrl: './ledger-list-page.component.css',
})
export class LedgerListPageComponent implements OnInit {
  private readonly api = inject(LedgersApiService);

  readonly rows = signal<LedgerDTO[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly formLedgerId = signal<number | null>(null);

  readonly viewVisible = signal(false);
  readonly viewLedgerId = signal<number | null>(null);

  openNew(): void {
    this.formLedgerId.set(null);
    this.formVisible.set(true);
  }

  openEdit(id: number): void {
    this.formLedgerId.set(id);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
    if (!v) {
      this.formLedgerId.set(null);
    }
  }

  openView(id: number): void {
    this.viewLedgerId.set(id);
    this.viewVisible.set(true);
  }

  onViewVisibleChange(v: boolean): void {
    this.viewVisible.set(v);
    if (!v) {
      this.viewLedgerId.set(null);
    }
  }

  onViewSaved(): void {
    this.load();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
