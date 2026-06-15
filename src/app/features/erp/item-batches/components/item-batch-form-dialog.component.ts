import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { ItemBatchesApiService } from '../../../../core/api/item-batches-api.service';
import { ItemsApiService } from '../../../../core/api/items-api.service';
import type { ItemDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-item-batch-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Select, Button],
  templateUrl: './item-batch-form-dialog.component.html',
  styleUrl: './item-batch-form-dialog.component.css',
})
export class ItemBatchFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ItemBatchesApiService);
  private readonly itemsApi = inject(ItemsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  readonly itemOptions = signal<{ label: string; value: number }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    itemId: [null as number | null, Validators.required],
    batchNumber: ['', Validators.required],
    manufacturingDate: ['', Validators.required],
    expiryDate: [''],
    notes: [''],
    defaultPrice: [0, [Validators.min(0), Validators.required]],
  });

  ngOnInit(): void {
    this.itemsApi.list(1, 1000).subscribe({
      next: (res) => {
        this.itemOptions.set(
          res.items.map((it) => ({
            label: `${it.name} (${it.title}) · ${it.barcode}`,
            value: it.id,
          })),
        );
      },
      error: () => this.itemOptions.set([]),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.error.set(null);
      this.saving.set(false);
      this.form.reset({
        itemId: null,
        batchNumber: '',
        manufacturingDate: '',
        expiryDate: '',
        notes: '',
        defaultPrice: 0,
      });
    }
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
    if (!open) {
      this.error.set(null);
    }
  }

  cancel(): void {
    this.onVisibilityChange(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const itemId = v.itemId;
    if (itemId == null) {
      return;
    }
    const mfg = v.manufacturingDate ? new Date(v.manufacturingDate).toISOString() : '';
    const exp = v.expiryDate ? new Date(v.expiryDate).toISOString() : null;
    this.saving.set(true);
    this.error.set(null);
    this.api
      .create({
        itemId,
        batchNumber: v.batchNumber,
        manufacturingDate: mfg,
        expiryDate: exp,
        notes: v.notes || null,
        defaultPrice: v.defaultPrice,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
          this.onVisibilityChange(false);
        },
        error: (e) => {
          this.error.set(this.msg(e));
          this.saving.set(false);
        },
      });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
