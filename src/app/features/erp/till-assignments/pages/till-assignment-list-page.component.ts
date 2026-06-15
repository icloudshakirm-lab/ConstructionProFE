import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TillAssignmentsApiService } from '../../../../core/api/till-assignments-api.service';
import type { TillAssignmentDTO } from '../../../../core/api/erp-api.models';
import { TillAssignmentFormDialogComponent } from '../components/till-assignment-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-till-assignment-list-page',
  imports: [CommonModule, TillAssignmentFormDialogComponent],
  templateUrl: './till-assignment-list-page.component.html',
})
export class TillAssignmentListPageComponent implements OnInit {
  private readonly api = inject(TillAssignmentsApiService);

  readonly rows = signal<TillAssignmentDTO[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly formAssignmentId = signal<number | null>(null);

  openNew(): void {
    this.formAssignmentId.set(null);
    this.formVisible.set(true);
  }

  openEdit(id: number): void {
    this.formAssignmentId.set(id);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
    if (!v) {
      this.formAssignmentId.set(null);
    }
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
