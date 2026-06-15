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
      styleClass="erp-dialog"
      [style]="{ width: 'min(calc(100vw - 2rem), 28rem)' }"
    >
      @if (error()) {
        <p class="erp-doc__alert">{{ error() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="$event.preventDefault()" class="erp-dialog__form">
        <div class="erp-doc__field">
          <label for="till-code" class="erp-doc__label">Code</label>
          <input id="till-code" type="text" formControlName="code" class="erp-doc__input" placeholder="e.g. TILL-001" />
        </div>

        <div class="erp-doc__field">
          <label for="till-name" class="erp-doc__label">Name</label>
          <input id="till-name" type="text" formControlName="name" class="erp-doc__input" placeholder="e.g. Main POS Till" />
        </div>

        <div class="erp-doc__field">
          <label for="till-warehouse" class="erp-doc__label">Warehouse / Godown</label>
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

        <div class="erp-doc__field">
          <label for="till-desc" class="erp-doc__label">Description</label>
          <textarea id="till-desc" formControlName="description" rows="3" class="erp-doc__input"></textarea>
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
