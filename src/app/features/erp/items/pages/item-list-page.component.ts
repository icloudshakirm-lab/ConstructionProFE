import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { ItemsApiService } from '../../../../core/api/items-api.service';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import type { ItemDTO } from '../../../../core/api/erp-api.models';
import { ItemFormDialogComponent } from '../components/item-form-dialog.component';
import { ItemViewDialogComponent } from '../components/item-view-dialog.component';

@Component({
  standalone: true,
  selector: 'app-item-list-page',
  imports: [CommonModule, RouterLink, Button, TableModule, Tag, ItemFormDialogComponent, ItemViewDialogComponent],
  templateUrl: './item-list-page.component.html',
  styleUrl: './item-list-page.component.css',
})
export class ItemListPageComponent implements OnInit {
  private readonly api = inject(ItemsApiService);
  private readonly lookups = inject(LookupsApiService);

  readonly rows = signal<ItemDTO[]>([]);
  /** Resolved labels for `itemGroupId` from `GET /lookups/item-groups`. */
  readonly groupLabel = signal<Map<number, string>>(new Map());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly formVisible = signal(false);

  readonly viewVisible = signal(false);
  readonly viewItemId = signal<number | null>(null);

  openNew(): void {
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  openView(id: number): void {
    this.viewItemId.set(id);
    this.viewVisible.set(true);
  }

  onViewVisibleChange(v: boolean): void {
    this.viewVisible.set(v);
    if (!v) {
      this.viewItemId.set(null);
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
    forkJoin({
      items: this.api.list(1, 1000),
      groups: this.lookups.listItemGroups(),
    }).subscribe({
      next: ({ items, groups }) => {
        const m = new Map<number, string>();
        for (const g of groups) {
          m.set(g.id, g.name);
        }
        this.groupLabel.set(m);
        this.rows.set(items.items);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  groupName(id: number): string {
    if (id == null || id === 0) {
      return '—';
    }
    return this.groupLabel().get(id) ?? `#${id}`;
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
