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
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import type { CreateItemRequest, UpdateItemRequest } from '../../../../core/api/erp-api.models';
import { ItemsApiService } from '../../../../core/api/items-api.service';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';

/** OpenAPI: `itemGroupId` when present must be &gt; 0. */
function optionalPositiveGroupId(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null || v === '') {
      return null;
    }
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) {
      return { positiveGroupId: true };
    }
    return null;
  };
}

@Component({
  standalone: true,
  selector: 'app-item-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, Select],
  templateUrl: './item-form-dialog.component.html',
  styleUrl: './item-form-dialog.component.css',
})
export class ItemFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ItemsApiService);
  private readonly lookups = inject(LookupsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** When set, dialog loads the item and uses `PUT /items/{id}` on save. */
  @Input() itemId: number | null = null;
  /** Disambiguate field ids when multiple dialogs exist on the page. */
  @Input() formIdSuffix = 'default';
  @Output() saved = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly groupOptions = signal<{ label: string; value: number }[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    title: ['', Validators.required],
    barcode: ['', [Validators.required, Validators.maxLength(64)]],
    description: [''],
    itemGroupId: [null as number | null, optionalPositiveGroupId()],
  });

  get header(): string {
    return this.itemId != null ? 'Edit item' : 'New item';
  }

  get submitLabel(): string {
    return this.itemId != null ? 'Save' : 'Create';
  }

  ngOnInit(): void {
    this.lookups.listItemGroups().subscribe({
      next: (rows) => {
        this.groupOptions.set(rows.map((g) => ({ label: g.name, value: g.id })));
      },
      error: () => this.groupOptions.set([]),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.prepareOpen();
    }
  }

  private prepareOpen(): void {
    this.error.set(null);
    this.saving.set(false);
    if (this.itemId == null) {
      this.form.reset({ name: '', title: '', barcode: '', description: '', itemGroupId: null });
      return;
    }
    this.api.getById(this.itemId).subscribe({
      next: (r) => {
        this.form.patchValue({
          name: r.name,
          title: r.title,
          barcode: r.barcode,
          description: r.description ?? '',
          itemGroupId: r.itemGroupId > 0 ? r.itemGroupId : null,
        });
      },
      error: (e) => this.error.set(this.msg(e)),
    });
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
    const body: CreateItemRequest | UpdateItemRequest = {
      name: v.name.trim(),
      title: v.title.trim(),
      barcode: v.barcode.trim(),
      description: v.description?.trim() || null,
      ...(v.itemGroupId != null && v.itemGroupId > 0 ? { itemGroupId: v.itemGroupId } : {}),
    };
    this.saving.set(true);
    this.error.set(null);

    if (this.itemId == null) {
      this.api.create(body).subscribe({
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
    } else {
      this.api.update(this.itemId, body).subscribe({
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
  }

  private msg(e: unknown): string {
    const err = e as {
      error?: { detail?: string; title?: string; message?: string; errors?: Record<string, string[]> };
      message?: string;
    };
    const detail = err.error?.detail ?? err.error?.title ?? err.error?.message ?? err.message;
    if (detail) {
      return detail;
    }
    const first = err.error?.errors && Object.values(err.error.errors)[0]?.[0];
    return first ?? 'Request failed';
  }
}
