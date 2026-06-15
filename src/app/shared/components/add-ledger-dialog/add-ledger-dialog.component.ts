import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { LEDGER_GROUP_SELECT_OPTIONS, LedgerGroupOption } from '../../data/ledger-groups';
import { LedgerOption } from '../../data/ledgers';

@Component({
  selector: 'app-add-ledger-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, Select],
  templateUrl: './add-ledger-dialog.component.html',
  styleUrl: './add-ledger-dialog.component.css',
})
export class AddLedgerDialogComponent {
  private readonly fb = inject(FormBuilder);

  /** Two-way bind with `[(visible)]` from parent vouchers. */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Dialog title (override per voucher if needed). */
  @Input() header = 'Add new ledger';

  /** Optional group list; defaults to shared mock groups. */
  @Input() groupOptions: LedgerGroupOption[] | null = null;

  /** Unique suffix for `inputId` when multiple instances exist on one page. */
  @Input() inputIdSuffix = '';

  @Output() ledgerCreated = new EventEmitter<LedgerOption>();

  /** Fires after a successful save (after `ledgerCreated`), so the host can reload Dr/Cr lists from API or refresh options. */
  @Output() ledgerSaveSuccess = new EventEmitter<void>();

  readonly form = this.fb.group({
    name: ['', Validators.required],
    groupId: this.fb.control<string | null>(null, Validators.required),
  });

  get groups(): LedgerGroupOption[] {
    return this.groupOptions?.length ? this.groupOptions : LEDGER_GROUP_SELECT_OPTIONS;
  }

  get nameInputId(): string {
    return this.inputIdSuffix ? `add-ledger-name-${this.inputIdSuffix}` : 'add-ledger-name';
  }

  get groupInputId(): string {
    return this.inputIdSuffix ? `add-ledger-group-${this.inputIdSuffix}` : 'add-ledger-group';
  }

  onVisibilityChange(show: boolean): void {
    this.visibleChange.emit(show);
    if (!show) {
      this.resetForm();
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
    const name = this.form.get('name')?.value?.trim() ?? '';
    const groupId = this.form.get('groupId')?.value;
    if (!name || !groupId) {
      return;
    }
    const id = `lg-${crypto.randomUUID().slice(0, 8)}`;
    const ledger: LedgerOption = {
      id,
      code: suggestLedgerCode(name),
      name,
      groupId,
    };
    this.ledgerCreated.emit(ledger);
    this.ledgerSaveSuccess.emit();
    this.onVisibilityChange(false);
  }

  private resetForm(): void {
    this.form.reset({ name: '', groupId: null });
  }
}

function suggestLedgerCode(name: string): string {
  const compact = name
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 6)
    .toUpperCase();
  return compact || 'NEW';
}
