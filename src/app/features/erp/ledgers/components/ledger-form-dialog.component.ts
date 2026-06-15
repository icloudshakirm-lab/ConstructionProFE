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
import { LedgersApiService } from '../../../../core/api/ledgers-api.service';
import type { GroupLedgerDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-ledger-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Select, Button],
  templateUrl: './ledger-form-dialog.component.html',
  styleUrl: './ledger-form-dialog.component.css',
})
export class LedgerFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LedgersApiService);
  private readonly groupsApi = inject(LedgerGroupsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** `null` = create, id = edit */
  @Input() ledgerId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly groupOptions = signal<{ label: string; value: number }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    groupLedgerId: [null as number | null],
    type: [0],
  });

  get isEdit(): boolean {
    return this.ledgerId != null;
  }

  get header(): string {
    return this.isEdit ? 'Edit ledger' : 'New ledger';
  }

  ngOnInit(): void {
    this.groupsApi.list().subscribe({
      next: (groups: GroupLedgerDTO[]) => {
        this.groupOptions.set(
          groups.map((g) => ({ label: `${g.code} — ${g.name}`, value: g.id })),
        );
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
    if (this.ledgerId == null) {
      this.form.reset({
        code: '',
        name: '',
        description: '',
        groupLedgerId: null,
        type: 0,
      });
      return;
    }
    this.api.getById(this.ledgerId).subscribe({
      next: (r) => {
        this.form.patchValue({
          code: r.code,
          name: r.name,
          description: r.description ?? '',
          groupLedgerId: r.groupLedgerId ?? null,
          type: 0,
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

    if (this.ledgerId == null) {
      this.api
        .create({
          code: v.code,
          name: v.name,
          description: v.description || null,
          groupLedgerId: v.groupLedgerId,
          type: v.type,
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
        .update(this.ledgerId, {
          code: v.code,
          name: v.name,
          description: v.description || null,
          groupLedgerId: v.groupLedgerId,
          type: v.type,
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
