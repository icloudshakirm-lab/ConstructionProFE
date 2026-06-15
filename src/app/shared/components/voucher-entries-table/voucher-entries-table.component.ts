import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { LookupsApiService } from '../../../core/api/lookups-api.service';
import { LookupDTO } from '../../../core/api/erp-api.models';
import { VoucherLineJson } from '../../../features/erp/vouchers/models/voucher.model';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-voucher-entries-table',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, Select],
  templateUrl: './voucher-entries-table.component.html',
  styles: [
    `
      :host {
        display: block;
      }
      :host ::ng-deep .ledger-p-select.p-select {
        width: 100%;
        min-height: unset;
      }
      :host ::ng-deep .ledger-p-select .p-select-label,
      :host ::ng-deep .ledger-p-select .p-placeholder {
        padding-block: 0.25rem;
        padding-inline: 0.5rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
    `,
  ],
})
export class VoucherEntriesTableComponent implements OnInit, OnDestroy {
  @Input({ required: true }) lines!: FormArray<FormGroup>;

  private readonly fb = inject(FormBuilder);
  private readonly lookups = inject(LookupsApiService);
  private readonly destroyRef = inject(DestroyRef);

  get lineGroups(): FormGroup[] {
    return this.lines.controls as FormGroup[];
  }

  editingLineId: string | null = null;
  private readonly backup = new Map<string, VoucherLineJson>();

  readonly ledgerOptions = signal<Array<{ label: string; value: number }>>([]);
  private readonly ledgerSearch$ = new Subject<string>();

  ngOnInit(): void {
    this.ledgerSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) =>
          this.lookups.listLedgers(q).pipe(
            catchError(() => of([] as LookupDTO[])),
          ),
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((rows: LookupDTO[]) => {
        const results = rows.map((l) => ({ label: l.name, value: l.id }));

        // Preserve all currently assigned ledgers in the table to ensure labels are visible
        this.lines.controls.forEach(group => {
          const id = group.get('ledgerId')?.value;
          const name = group.get('ledgerName')?.value;
          if (id && name && !results.some(r => r.value === id)) {
            results.push({ label: name, value: id });
          }
        });

        this.ledgerOptions.set(results);
      });

    this.ledgerSearch$.next('');

    if (this.lines.length === 0) {
      this.addRow();
    }
  }

  ngOnDestroy(): void {
    this.backup.clear();
  }

  onLedgerFilter(e: any): void {
    const ev = e as { filter?: string; value?: string };
    this.ledgerSearch$.next((ev.filter ?? ev.value ?? '').toString());
  }

  trackByLineId(_index: number, line: FormGroup): string {
    return line.get('id')?.value ?? String(_index);
  }

  addRow(): void {
    const id = crypto.randomUUID();
    const line = this.fb.group({
      id: this.fb.nonNullable.control(id),
      ledgerId: this.fb.control<number | null>(null),
      ledgerName: this.fb.control<string | null>(null),
      description: this.fb.nonNullable.control(''),
      amount: this.fb.nonNullable.control(0),
    });
    this.lines.push(line);
    this.editingLineId = id;
  }

  removeRow(index: number): void {
    const id = this.lines.at(index)?.get('id')?.value;
    if (id) {
      this.backup.delete(id);
      if (this.editingLineId === id) {
        this.editingLineId = null;
      }
    }
    this.lines.removeAt(index);
  }

  startEdit(line: FormGroup): void {
    const id = line.get('id')?.value as string;
    const raw = line.getRawValue() as VoucherLineJson;
    this.backup.set(id, { ...raw });
    this.editingLineId = id;

    // Trigger search for the current ledger name to ensure it's in the dropdown
    const currentName = line.get('ledgerName')?.value;
    if (currentName) {
      this.ledgerSearch$.next(currentName);
    }
  }

  saveEdit(line: FormGroup): void {
    const id = line.get('id')?.value as string;
    const ledgerId = line.get('ledgerId')?.value;
    if (ledgerId) {
        const option = this.ledgerOptions().find(o => o.value === ledgerId);
        if (option) {
            line.get('ledgerName')?.setValue(option.label);
        }
    }
    this.backup.delete(id);
    this.editingLineId = null;
  }

  cancelEdit(line: FormGroup): void {
    const id = line.get('id')?.value as string;
    const prev = this.backup.get(id);
    if (prev) {
      line.patchValue({
        ledgerId: prev.ledgerId,
        ledgerName: prev.ledgerName,
        description: prev.description,
        amount: prev.amount,
      });
    }
    this.backup.delete(id);
    this.editingLineId = null;
  }

  isEditing(line: FormGroup): boolean {
    return this.editingLineId === line.get('id')?.value;
  }
}
