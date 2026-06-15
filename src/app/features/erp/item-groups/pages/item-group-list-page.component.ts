import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ItemGroupsApiService } from '../../../../core/api/item-groups-api.service';
import type { ItemGroupDTO } from '../../../../core/api/erp-api.models';
import { ItemGroupFormDialogComponent } from '../components/item-group-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-item-group-list-page',
  imports: [CommonModule, RouterLink, Button, TableModule, Tag, ItemGroupFormDialogComponent],
  templateUrl: './item-group-list-page.component.html',
  styleUrl: './item-group-list-page.component.css',
})
export class ItemGroupListPageComponent implements OnInit {
  private readonly api = inject(ItemGroupsApiService);

  readonly rows = signal<ItemGroupDTO[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly formVisible = signal(false);

  openNew(): void {
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
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
