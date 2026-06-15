import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ItemGroupsApiService } from '../../../../core/api/item-groups-api.service';
import type { ItemGroupDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-item-group-detail-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './item-group-detail-page.component.html',
  styleUrl: './item-group-detail-page.component.css',
})
export class ItemGroupDetailPageComponent implements OnInit {
  private readonly api = inject(ItemGroupsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly row = signal<ItemGroupDTO | null>(null);
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
    if (id == null || !confirm('Delete this item group?')) {
      return;
    }
    this.deleting.set(true);
    this.api.delete(id).subscribe({
      next: () => void this.router.navigateByUrl('/app/item-groups'),
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
