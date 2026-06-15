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
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import { TransactionsApiService } from '../../../../core/api/transactions-api.service';
import type { CreateChildTransactionRequest, LookupDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-transaction-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Select, Button],
  templateUrl: './transaction-form-dialog.component.html',
  styleUrl: './transaction-form-dialog.component.css',
})
export class TransactionFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TransactionsApiService);
  private readonly lookups = inject(LookupsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  readonly ledgerOptions = signal<{ label: string; value: number }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    voucherNumber: ['', Validators.required],
    type: ['', Validators.required],
    date: [''],
    description: [''],
    childTransactions: this.fb.array<FormGroup>([this.createChildRow()]),
  });

  ngOnInit(): void {
    this.lookups.listLedgers().subscribe({
      next: (rows: LookupDTO[]) => {
        this.ledgerOptions.set(rows.map((l) => ({ label: l.name, value: l.id })));
      },
      error: () => this.ledgerOptions.set([]),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.resetForm();
      this.error.set(null);
      this.saving.set(false);
    }
  }

  private resetForm(): void {
    this.lines.clear();
    this.lines.push(this.createChildRow());
    this.form.patchValue({
      voucherNumber: '',
      type: '',
      date: '',
      description: '',
    });
  }

  get lines(): FormArray<FormGroup> {
    return this.form.controls.childTransactions;
  }

  asGroup(c: AbstractControl): FormGroup {
    return c as FormGroup;
  }

  createChildRow(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      ledgerId: [null as number | null, Validators.required],
      ledgerEntryType: ['Dr', Validators.required],
      ledgerAmount: [null as number | null, Validators.required],
    });
  }

  addLine(): void {
    this.lines.push(this.createChildRow());
  }

  removeLine(index: number): void {
    if (this.lines.length <= 1) {
      return;
    }
    this.lines.removeAt(index);
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
    const v = this.form.getRawValue() as {
      voucherNumber: string;
      type: string;
      date: string;
      description: string;
      childTransactions: {
        description: string;
        ledgerId: number | null;
        ledgerEntryType: string;
        ledgerAmount: number | null;
      }[];
    };
    const children: CreateChildTransactionRequest[] = v.childTransactions.map((row) => ({
      description: row.description,
      ledgerId: row.ledgerId,
      ledgerEntryType: row.ledgerEntryType,
      ledgerAmount: row.ledgerAmount,
    }));

    this.saving.set(true);
    this.error.set(null);
    this.api
      .create({
        voucherNumber: v.voucherNumber,
        type: v.type,
        date: v.date ? new Date(v.date).toISOString() : undefined,
        description: v.description || null,
        childTransactions: children,
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

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
