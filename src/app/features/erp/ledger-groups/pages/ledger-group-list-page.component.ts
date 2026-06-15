import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { LedgerGroupsApiService } from '../../../../core/api/ledger-groups-api.service';
import type { GroupLedgerDTO } from '../../../../core/api/erp-api.models';
import { LedgerGroupFormDialogComponent } from '../components/ledger-group-form-dialog.component';
import { LedgerGroupViewDialogComponent } from '../components/ledger-group-view-dialog.component';

@Component({
  standalone: true,
  selector: 'app-ledger-group-list-page',
  imports: [CommonModule, LedgerGroupFormDialogComponent, LedgerGroupViewDialogComponent],
  templateUrl: './ledger-group-list-page.component.html',
  styleUrl: './ledger-group-list-page.component.css',
})
export class LedgerGroupListPageComponent implements OnInit {
  private readonly api = inject(LedgerGroupsApiService);

  readonly rows = signal<GroupLedgerDTO[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly formGroupId = signal<number | null>(null);

  readonly viewVisible = signal(false);
  readonly viewGroupId = signal<number | null>(null);

  openNew(): void {
    this.formGroupId.set(null);
    this.formVisible.set(true);
  }

  openEdit(id: number): void {
    this.formGroupId.set(id);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
    if (!v) {
      this.formGroupId.set(null);
    }
  }

  openView(id: number): void {
    this.viewGroupId.set(id);
    this.viewVisible.set(true);
  }

  onViewVisibleChange(v: boolean): void {
    this.viewVisible.set(v);
    if (!v) {
      this.viewGroupId.set(null);
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
