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
import { DatePicker } from 'primeng/datepicker';
import { TillsApiService } from '../../../../core/api/tills-api.service';
import { TillAssignmentsApiService } from '../../../../core/api/till-assignments-api.service';
import type { TillDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-till-assignment-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Select, Button, DatePicker],
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
          <label for="asg-till" class="erp-doc__label">Till</label>
          <p-select
            id="asg-till"
            [options]="tillOptions()"
            formControlName="tillId"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a till"
            [appendTo]="'body'"
            styleClass="w-full"
          />
        </div>

        <div class="erp-doc__field">
          <label for="asg-user" class="erp-doc__label">User ID</label>
          <input id="asg-user" type="text" formControlName="userId" class="erp-doc__input" placeholder="Enter user ID" />
          <p class="erp-doc__hint">Manual ID entry until user lookup is available.</p>
        </div>

        <div class="erp-doc__field">
          <label for="asg-start" class="erp-doc__label">Start time</label>
          <p-datepicker
            id="asg-start"
            formControlName="startAt"
            [showTime]="true"
            [hourFormat]="'24'"
            [appendTo]="'body'"
            styleClass="w-full"
          />
        </div>

        <div class="erp-doc__field">
          <label for="asg-end" class="erp-doc__label">End time (optional)</label>
          <p-datepicker
            id="asg-end"
            formControlName="endAt"
            [showTime]="true"
            [hourFormat]="'24'"
            [appendTo]="'body'"
            styleClass="w-full"
          />
        </div>

        <div class="erp-doc__field">
          <label for="asg-notes" class="erp-doc__label">Notes</label>
          <textarea id="asg-notes" formControlName="notes" rows="3" class="erp-doc__input"></textarea>
        </div>

        <div class="erp-dialog__actions">
          <p-button type="button" label="Cancel" severity="secondary" [text]="true" (onClick)="cancel()" />
          <p-button
            type="button"
            [label]="isEdit ? 'Update' : 'Assign'"
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
    :host ::ng-deep .p-select, :host ::ng-deep .p-datepicker {
      width: 100%;
    }
    textarea {
      resize: none;
    }
  `]
})
export class TillAssignmentFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TillAssignmentsApiService);
  private readonly tillsApi = inject(TillsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** `null` = create, id = edit */
  @Input() assignmentId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly tillOptions = signal<{ label: string; value: number }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    tillId: [null as number | null, Validators.required],
    userId: ['', Validators.required],
    startAt: [new Date(), Validators.required],
    endAt: [null as Date | null],
    notes: [''],
  });

  get isEdit(): boolean {
    return this.assignmentId != null;
  }

  get header(): string {
    return this.isEdit ? 'Edit Assignment' : 'Assign Till';
  }

  ngOnInit(): void {
    this.tillsApi.list().subscribe({
      next: (tills: TillDTO[]) => {
        this.tillOptions.set(
          tills.map((t) => ({ label: `${t.code} — ${t.name}`, value: t.id })),
        );
      },
      error: () => this.tillOptions.set([]),
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
    if (this.assignmentId == null) {
      this.form.reset({
        tillId: null,
        userId: '',
        startAt: new Date(),
        endAt: null,
        notes: '',
      });
      return;
    }
    this.api.getById(this.assignmentId).subscribe({
      next: (r) => {
        this.form.patchValue({
          tillId: r.tillId,
          userId: r.userId,
          startAt: new Date(r.startAt),
          endAt: r.endAt ? new Date(r.endAt) : null,
          notes: r.notes ?? '',
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

    const startAtStr = v.startAt.toISOString();
    const endAtStr = v.endAt?.toISOString() || null;

    if (this.assignmentId == null) {
      this.api
        .create({
          tillId: v.tillId!,
          userId: v.userId,
          startAt: startAtStr,
          notes: v.notes || null,
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
        .update(this.assignmentId, {
          id: this.assignmentId,
          tillId: v.tillId!,
          userId: v.userId,
          startAt: startAtStr,
          endAt: endAtStr,
          notes: v.notes || null,
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
