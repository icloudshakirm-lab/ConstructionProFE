import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ItemBatchesApiService } from '../../../../core/api/item-batches-api.service';
import type { BatchDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-item-batch-detail-page',
  imports: [CommonModule, RouterLink, Button],
  templateUrl: './item-batch-detail-page.component.html',
  styleUrl: './item-batch-detail-page.component.css',
})
export class ItemBatchDetailPageComponent implements OnInit {
  private readonly api = inject(ItemBatchesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly row = signal<BatchDTO | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(id)) {
      this.error.set('Invalid id');
      this.loading.set(false);
      return;
    }
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

  remove(): void {
    const id = this.row()?.id;
    if (id == null || !confirm('Delete this batch?')) {
      return;
    }
    this.deleting.set(true);
    this.api.delete(id).subscribe({
      next: () => void this.router.navigateByUrl('/erp/item-batches'),
      error: (e) => {
        this.error.set(this.msg(e));
        this.deleting.set(false);
      },
    });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
