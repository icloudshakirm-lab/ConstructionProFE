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
import { ItemsApiService } from '../../../../core/api/items-api.service';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import type { ItemDTO } from '../../../../core/api/erp-api.models';
import { ItemFormDialogComponent } from './item-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-item-view-dialog',
  imports: [CommonModule, Dialog, Button, ItemFormDialogComponent],
  templateUrl: './item-view-dialog.component.html',
  styleUrl: './item-view-dialog.component.css',
})
export class ItemViewDialogComponent implements OnChanges {
  private readonly api = inject(ItemsApiService);
  private readonly lookups = inject(LookupsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() itemId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly row = signal<ItemDTO | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly groupName = signal<string | null>(null);
  readonly formVisible = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      if (changes['visible']) {
        this.reset();
      }
      return;
    }
    const id = this.itemId;
    if (id == null || Number.isNaN(id)) {
      return;
    }
    if (changes['itemId'] || changes['visible']) {
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
    const id = this.itemId;
    if (id != null) {
      this.fetchRow(id);
    }
    this.saved.emit();
  }

  remove(): void {
    const id = this.row()?.id;
    if (id == null || !confirm('Delete this item?')) {
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
    this.groupName.set(null);
    this.api.getById(id).subscribe({
      next: (r) => {
        this.row.set(r);
        this.loading.set(false);
        this.lookups.listItemGroups().subscribe({
          next: (groups) => {
            if (!r.itemGroupId) {
              this.groupName.set(null);
              return;
            }
            const g = groups.find((x) => x.id === r.itemGroupId);
            this.groupName.set(g?.name ?? `#${r.itemGroupId}`);
          },
          error: () =>
            this.groupName.set(r.itemGroupId ? `#${r.itemGroupId}` : null),
        });
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
    this.groupName.set(null);
    this.formVisible.set(false);
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
