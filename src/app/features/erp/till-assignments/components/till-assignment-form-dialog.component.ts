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
      [style]="{ width: 'min(calc(100vw - 2rem), 28rem)' }"
    >
      @if (error()) {
        <p class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {{ error() }}
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="$event.preventDefault()" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="asg-till" class="text-sm font-medium text-slate-700 dark:text-slate-300">Till</label>
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

        <div class="flex flex-col gap-1.5">
          <label for="asg-user" class="text-sm font-medium text-slate-700 dark:text-slate-300">User ID</label>
          <input
            id="asg-user"
            type="text"
            formControlName="userId"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            placeholder="Enter User ID"
          />
          <p class="text-[10px] text-slate-500">Currently manual ID entry. User lookup pending.</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="asg-start" class="text-sm font-medium text-slate-700 dark:text-slate-300">Start Time</label>
          <p-datepicker
            id="asg-start"
            formControlName="startAt"
            [showTime]="true"
            [hourFormat]="'24'"
            [appendTo]="'body'"
            styleClass="w-full"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="asg-end" class="text-sm font-medium text-slate-700 dark:text-slate-300">End Time (Optional)</label>
          <p-datepicker
            id="asg-end"
            formControlName="endAt"
            [showTime]="true"
            [hourFormat]="'24'"
            [appendTo]="'body'"
            styleClass="w-full"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="asg-notes" class="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
          <textarea
            id="asg-notes"
            formControlName="notes"
            rows="3"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          ></textarea>
        </div>

        <div class="mt-2 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <p-button type="button" label="Cancel" severity="secondary" [outlined]="true" (onClick)="cancel()" />
          <p-button
            type="button"
            [label]="isEdit ? 'Update' : 'Assign'"
            [loading]="saving()"
            [disabled]="form.invalid || saving()"
            (onClick)="submit()"
          />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
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
