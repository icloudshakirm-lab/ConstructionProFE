import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ItemBatchesApiService } from '../../../../core/api/item-batches-api.service';
import type { BatchDTO } from '../../../../core/api/erp-api.models';
import { ItemBatchFormDialogComponent } from '../components/item-batch-form-dialog.component';
import { ItemBatchViewDialogComponent } from '../components/item-batch-view-dialog.component';

@Component({
  standalone: true,
  selector: 'app-item-batch-list-page',
  imports: [CommonModule, ItemBatchFormDialogComponent, ItemBatchViewDialogComponent],
  templateUrl: './item-batch-list-page.component.html',
  styleUrl: './item-batch-list-page.component.css',
})
export class ItemBatchListPageComponent implements OnInit {
  private readonly api = inject(ItemBatchesApiService);

  readonly rows = signal<BatchDTO[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly formVisible = signal(false);

  readonly viewVisible = signal(false);
  readonly viewBatchId = signal<number | null>(null);

  openNew(): void {
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  openView(id: number): void {
    this.viewBatchId.set(id);
    this.viewVisible.set(true);
  }

  onViewVisibleChange(v: boolean): void {
    this.viewVisible.set(v);
    if (!v) {
      this.viewBatchId.set(null);
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
