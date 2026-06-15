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
import { ToggleSwitch } from 'primeng/toggleswitch';
import { GodownsApiService } from '../../../../core/api/godowns-api.service';
import { TillsApiService } from '../../../../core/api/tills-api.service';
import type { GodownDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-till-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Select, Button, ToggleSwitch],
  template: `
    <p-dialog
      [header]="header"
      [visible]="visible"
      (visibleChange)="onVisibilityChange($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(calc(100vw - 2rem), 28rem)' }"
    >
      @if (error()) {
        <p class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {{ error() }}
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="$event.preventDefault()" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="till-code" class="text-sm font-medium text-slate-700 dark:text-slate-300">Code</label>
          <input
            id="till-code"
            type="text"
            formControlName="code"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. TILL-001"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="till-name" class="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input
            id="till-name"
            type="text"
            formControlName="name"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. Main POS Till"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="till-warehouse" class="text-sm font-medium text-slate-700 dark:text-slate-300">Warehouse / Godown</label>
          <p-select
            id="till-warehouse"
            [options]="warehouseOptions()"
            formControlName="warehouseId"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a warehouse"
            [appendTo]="'body'"
            styleClass="w-full"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="till-desc" class="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            id="till-desc"
            formControlName="description"
            rows="3"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          ></textarea>
        </div>

        @if (isEdit) {
          <div class="flex items-center gap-3 py-2">
            <p-toggleSwitch formControlName="isActive" id="isActive" />
            <label for="isActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Is Active</label>
          </div>
        }

        <div class="mt-2 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <p-button type="button" label="Cancel" severity="secondary" [outlined]="true" (onClick)="cancel()" />
          <p-button
            type="button"
            [label]="isEdit ? 'Update' : 'Create'"
            [loading]="saving()"
            [disabled]="form.invalid || saving()"
            (onClick)="submit()"
          />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .p-select {
      width: 100%;
    }
    textarea {
      resize: none;
    }
  `]
})
export class TillFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TillsApiService);
  private readonly godownsApi = inject(GodownsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** `null` = create, id = edit */
  @Input() tillId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly warehouseOptions = signal<{ label: string; value: number }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    warehouseId: [null as number | null, Validators.required],
    statusValue: [0],
    isActive: [true],
  });

  get isEdit(): boolean {
    return this.tillId != null;
  }

  get header(): string {
    return this.isEdit ? 'Edit Till' : 'New Till';
  }

  ngOnInit(): void {
    this.godownsApi.list().subscribe({
      next: (godowns: GodownDTO[]) => {
        this.warehouseOptions.set(
          godowns.map((g) => ({ label: g.name, value: g.id })),
        );
      },
      error: () => this.warehouseOptions.set([]),
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
    if (this.tillId == null) {
      this.form.reset({
        code: '',
        name: '',
        description: '',
        warehouseId: null,
        statusValue: 0,
        isActive: true,
      });
      return;
    }
    this.api.getById(this.tillId).subscribe({
      next: (r) => {
        this.form.patchValue({
          code: r.code,
          name: r.name,
          description: r.description ?? '',
          warehouseId: r.warehouseId,
          statusValue: r.statusValue,
          isActive: r.isActive,
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

    if (this.tillId == null) {
      this.api
        .create({
          code: v.code,
          name: v.name,
          description: v.description || null,
          warehouseId: v.warehouseId!,
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
    } else {
      this.api
        .update(this.tillId, {
          id: this.tillId,
          code: v.code,
          name: v.name,
          description: v.description || null,
          warehouseId: v.warehouseId!,
          statusValue: v.statusValue,
          isActive: v.isActive,
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
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
