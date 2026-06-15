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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { BranchesApiService } from '../../../../core/api/branches-api.service';

@Component({
  standalone: true,
  selector: 'app-branch-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, ToggleSwitch],
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
          <label for="branch-code" class="text-sm font-medium text-slate-700 dark:text-slate-300">Code</label>
          <input
            id="branch-code"
            type="text"
            formControlName="code"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. BR-001"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="branch-name" class="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input
            id="branch-name"
            type="text"
            formControlName="name"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. Main Branch"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="branch-address" class="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
          <input
            id="branch-address"
            type="text"
            formControlName="address"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. 123 Main St"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="branch-city" class="text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
          <input
            id="branch-city"
            type="text"
            formControlName="city"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. New York"
          />
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
    :host ::ng-deep .p-dialog-content {
      overflow-y: visible;
    }
  `]
})
export class BranchFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BranchesApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** `null` = create, id = edit */
  @Input() branchId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    address: [''],
    city: [''],
    isActive: [true],
  });

  get isEdit(): boolean {
    return this.branchId != null;
  }

  get header(): string {
    return this.isEdit ? 'Edit Branch' : 'New Branch';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.prepareOpen();
    }
  }

  private prepareOpen(): void {
    this.error.set(null);
    this.saving.set(false);
    if (this.branchId == null) {
      this.form.reset({
        code: '',
        name: '',
        address: '',
        city: '',
        isActive: true,
      });
      return;
    }
    this.api.getById(this.branchId).subscribe({
      next: (r) => {
        this.form.patchValue({
          code: r.code,
          name: r.name,
          address: r.address ?? '',
          city: r.city ?? '',
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

    if (this.branchId == null) {
      this.api
        .create({
          code: v.code,
          name: v.name,
          address: v.address || null,
          city: v.city || null,
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
        .update(this.branchId, {
          id: this.branchId,
          code: v.code,
          name: v.name,
          address: v.address || null,
          city: v.city || null,
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
