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
import { LedgerGroupsApiService } from '../../../../core/api/ledger-groups-api.service';
import type { GroupLedgerDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-ledger-group-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Select, Button],
  templateUrl: './ledger-group-form-dialog.component.html',
  styleUrl: './ledger-group-form-dialog.component.css',
})
export class LedgerGroupFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LedgerGroupsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() groupId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly parentOptions = signal<{ label: string; value: number }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    parentGroupId: [null as number | null],
  });

  get header(): string {
    return this.groupId != null ? 'Edit ledger group' : 'New ledger group';
  }

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (groups: GroupLedgerDTO[]) => {
        this.parentOptions.set(
          groups.map((g) => ({ label: `${g.code} — ${g.name}`, value: g.id })),
        );
      },
      error: () => this.parentOptions.set([]),
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
    if (this.groupId == null) {
      this.form.reset({ code: '', name: '', description: '', parentGroupId: null });
      return;
    }
    this.api.getById(this.groupId).subscribe({
      next: (r) => {
        this.form.patchValue({
          code: r.code,
          name: r.name,
          description: r.description ?? '',
          parentGroupId: r.parentGroupId ?? null,
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

    if (this.groupId == null) {
      this.api
        .create({
          code: v.code,
          name: v.name,
          description: v.description || null,
          parentGroupId: v.parentGroupId,
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
        .update(this.groupId, {
          code: v.code,
          name: v.name,
          description: v.description || null,
          parentGroupId: v.parentGroupId,
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
