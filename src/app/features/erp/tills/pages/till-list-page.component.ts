import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { TillsApiService } from '../../../../core/api/tills-api.service';
import type { TillDTO } from '../../../../core/api/erp-api.models';
import { TillFormDialogComponent } from '../components/till-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-till-list-page',
  imports: [CommonModule, Button, TableModule, Tag, TillFormDialogComponent],
  templateUrl: './till-list-page.component.html',
})
export class TillListPageComponent implements OnInit {
  private readonly api = inject(TillsApiService);

  readonly rows = signal<TillDTO[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly formTillId = signal<number | null>(null);

  openNew(): void {
    this.formTillId.set(null);
    this.formVisible.set(true);
  }

  openEdit(id: number): void {
    this.formTillId.set(id);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
    if (!v) {
      this.formTillId.set(null);
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
