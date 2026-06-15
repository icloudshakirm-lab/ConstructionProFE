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
      styleClass="erp-dialog"
      [style]="{ width: 'min(calc(100vw - 2rem), 28rem)' }"
    >
      @if (error()) {
        <p class="erp-doc__alert">{{ error() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="$event.preventDefault()" class="erp-dialog__form">
        <div class="erp-doc__field">
          <label for="branch-code" class="erp-doc__label">Code</label>
          <input id="branch-code" type="text" formControlName="code" class="erp-doc__input" placeholder="e.g. BR-001" />
        </div>
        <div class="erp-doc__field">
          <label for="branch-name" class="erp-doc__label">Name</label>
          <input id="branch-name" type="text" formControlName="name" class="erp-doc__input" placeholder="e.g. Main Branch" />
        </div>
        <div class="erp-doc__field">
          <label for="branch-address" class="erp-doc__label">Address</label>
          <input id="branch-address" type="text" formControlName="address" class="erp-doc__input" placeholder="e.g. 123 Main St" />
        </div>
        <div class="erp-doc__field">
          <label for="branch-city" class="erp-doc__label">City</label>
          <input id="branch-city" type="text" formControlName="city" class="erp-doc__input" placeholder="e.g. New York" />
        </div>
        @if (isEdit) {
          <div class="erp-doc__field" style="flex-direction: row; align-items: center; gap: 0.75rem">
            <p-toggleSwitch formControlName="isActive" inputId="isActive" />
            <label for="isActive" class="erp-doc__label" style="margin: 0">Is active</label>
          </div>
        }
        <div class="erp-dialog__actions">
          <p-button type="button" label="Cancel" severity="secondary" [text]="true" (onClick)="cancel()" />
          <p-button
            type="button"
            [label]="isEdit ? 'Update' : 'Create'"
            icon="pi pi-check"
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
