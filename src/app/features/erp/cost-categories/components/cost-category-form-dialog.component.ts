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
import { CostCategoriesApiService } from '../../../../core/api/cost-categories-api.service';
import { CostCentersApiService } from '../../../../core/api/cost-centers-api.service';
import type { CostCenterDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-cost-category-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, Select],
  templateUrl: './cost-category-form-dialog.component.html',
  styleUrl: './cost-category-form-dialog.component.css',
})
export class CostCategoryFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CostCategoriesApiService);
  private readonly costCentersApi = inject(CostCentersApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() costCategoryId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly costCenterOptions = signal<{ label: string; value: number }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    costCenterId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.costCentersApi.list().subscribe({
      next: (rows: CostCenterDTO[]) => {
        this.costCenterOptions.set(rows.map((c) => ({ label: `${c.code} — ${c.name}`, value: c.id })));
      },
      error: () => this.costCenterOptions.set([]),
    });
  }

  get header(): string {
    return this.costCategoryId != null ? 'Edit cost category' : 'New cost category';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.prepareOpen();
    }
  }

  private prepareOpen(): void {
    this.error.set(null);
    this.saving.set(false);
    if (this.costCategoryId == null) {
      this.form.reset({ code: '', name: '', description: '' });
      return;
    }
    this.api.getById(this.costCategoryId).subscribe({
      next: (r) => {
        this.form.patchValue({
          code: r.code,
          name: r.name,
          description: r.description ?? '',
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
    this.saving.set(true);
    this.error.set(null);

    const ccId = v.costCenterId;
    if (ccId == null || ccId < 1) {
      this.error.set('Select a cost center.');
      return;
    }

    const body = {
      code: v.code,
      name: v.name,
      description: v.description || null,
      costCenterId: ccId,
    };

    if (this.costCategoryId == null) {
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
      this.api.update(this.costCategoryId, body).subscribe({
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
      error?: {
        detail?: string;
        title?: string;
        message?: string;
        errors?: Record<string, string[]>;
      };
      message?: string;
    };
    const body = err.error;
    const fieldErrors = body?.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const lines = Object.entries(fieldErrors).flatMap(([key, msgs]) =>
        (msgs ?? []).map((m) => `${key}: ${m}`),
      );
      if (lines.length) {
        return lines.join(' ');
      }
    }
    return body?.detail ?? body?.title ?? body?.message ?? err.message ?? 'Request failed';
  }
}
