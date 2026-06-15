import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  merge,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import { TransactionsApiService } from '../../../../core/api/transactions-api.service';
import type {
  BatchDTO,
  CreateManufacturingTransactionRequest,
  LookupDTO,
  ManufacturingExpenseRequest,
  ManufacturingLedgerLineRequest,
  ManufacturingStockLineRequest,
} from '../../../../core/api/erp-api.models';
import { formatTimeForInput } from '../../invoices/utils/datetime';

const ENTRY_TYPE_OPTIONS = [
  { label: 'Debit', value: 'Debit' },
  { label: 'Credit', value: 'Credit' },
];

@Component({
  selector: 'app-manufacturing-voucher',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, DatePicker, Select, Button],
  templateUrl: './manufacturing-voucher.component.html',
  styleUrl: './manufacturing-voucher.component.css',
})
export class ManufacturingVoucherComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly lookups = inject(LookupsApiService);
  private readonly txApi = inject(TransactionsApiService);

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly dataJson = signal('');
  readonly entryTypeOptions = ENTRY_TYPE_OPTIONS;

  readonly itemOptions = signal<{ label: string; value: number }[]>([]);
  readonly ledgerOptions = signal<{ label: string; value: number }[]>([]);
  readonly rawBatchOptionsByLine = signal<Map<number, { label: string; value: number }[]>>(new Map());
  readonly outputBatchOptionsByLine = signal<Map<number, { label: string; value: number }[]>>(new Map());

  private readonly itemSearch$ = new Subject<string>();
  private readonly ledgerSearch$ = new Subject<string>();

  readonly form = this.fb.group({
    voucherNumber: [{ value: '', disabled: true }],
    date: this.fb.control<Date | null>(new Date(), Validators.required),
    time: [{ value: '', disabled: true }],
    description: [''],
    rawMaterials: this.fb.array<FormGroup>([]),
    expenses: this.fb.array<FormGroup>([]),
    ledgerLines: this.fb.array<FormGroup>([]),
    outputStock: this.fb.array<FormGroup>([]),
  });

  get rawMaterials(): FormArray<FormGroup> {
    return this.form.get('rawMaterials') as FormArray<FormGroup>;
  }

  get expenses(): FormArray<FormGroup> {
    return this.form.get('expenses') as FormArray<FormGroup>;
  }

  get ledgerLines(): FormArray<FormGroup> {
    return this.form.get('ledgerLines') as FormArray<FormGroup>;
  }

  get outputStock(): FormArray<FormGroup> {
    return this.form.get('outputStock') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const now = new Date();
    this.form.patchValue({ date: now, time: formatTimeForInput(now) });
    this.loadNextVoucherNumber();

    this.itemSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.lookups.listItems(q).pipe(catchError(() => of([] as LookupDTO[])))),
      )
      .subscribe((rows) => {
        this.itemOptions.set(rows.map((i) => ({ label: i.name, value: i.id })));
      });

    this.ledgerSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.lookups.listLedgers(q).pipe(catchError(() => of([] as LookupDTO[])))),
      )
      .subscribe((rows) => {
        this.ledgerOptions.set(rows.map((l) => ({ label: l.name, value: l.id })));
      });

    this.itemSearch$.next('');
    this.ledgerSearch$.next('');

    this.addRawMaterial();
    this.addOutputStock();

    merge(
      this.form.valueChanges,
      this.rawMaterials.valueChanges,
      this.expenses.valueChanges,
      this.ledgerLines.valueChanges,
      this.outputStock.valueChanges,
    )
      .pipe(startWith(null))
      .subscribe(() => this.refreshJson());
  }

  onItemFilter(ev: { filter?: string }): void {
    this.itemSearch$.next(ev.filter ?? '');
  }

  onLedgerFilter(ev: { filter?: string }): void {
    this.ledgerSearch$.next(ev.filter ?? '');
  }

  rawBatchOptionsFor(index: number): { label: string; value: number }[] {
    return this.rawBatchOptionsByLine().get(index) ?? [];
  }

  outputBatchOptionsFor(index: number): { label: string; value: number }[] {
    return this.outputBatchOptionsByLine().get(index) ?? [];
  }

  stockLineAmount(g: FormGroup): number {
    const v = g.getRawValue();
    return Math.round((Number(v.quantity) || 0) * (Number(v.rate) || 0) * 100) / 100;
  }

  rawMaterialsTotal(): number {
    return this.rawMaterials.controls.reduce((s, g) => s + this.stockLineAmount(g), 0);
  }

  outputStockTotal(): number {
    return this.outputStock.controls.reduce((s, g) => s + this.stockLineAmount(g), 0);
  }

  expensesTotal(): number {
    return this.expenses.controls.reduce((s, g) => s + (Number(g.get('amount')?.value) || 0), 0);
  }

  ledgerDebitTotal(): number {
    return this.ledgerLines.controls
      .filter((g) => (g.get('entryType')?.value as string)?.toLowerCase() === 'debit')
      .reduce((s, g) => s + (Number(g.get('amount')?.value) || 0), 0);
  }

  ledgerCreditTotal(): number {
    return this.ledgerLines.controls
      .filter((g) => (g.get('entryType')?.value as string)?.toLowerCase() === 'credit')
      .reduce((s, g) => s + (Number(g.get('amount')?.value) || 0), 0);
  }

  addRawMaterial(): void {
    this.rawMaterials.push(this.createStockLineGroup());
  }

  removeRawMaterial(index: number): void {
    if (this.rawMaterials.length <= 1) return;
    this.rawMaterials.removeAt(index);
    this.reindexBatchMap(this.rawBatchOptionsByLine, index);
  }

  addOutputStock(): void {
    this.outputStock.push(this.createStockLineGroup());
  }

  removeOutputStock(index: number): void {
    if (this.outputStock.length <= 1) return;
    this.outputStock.removeAt(index);
    this.reindexBatchMap(this.outputBatchOptionsByLine, index);
  }

  addExpense(): void {
    this.expenses.push(
      this.fb.group({
        ledgerId: [null as number | null, Validators.required],
        amount: [0, [Validators.required, Validators.min(0.01)]],
        description: [''],
      }),
    );
  }

  removeExpense(index: number): void {
    this.expenses.removeAt(index);
  }

  addLedgerLine(): void {
    this.ledgerLines.push(
      this.fb.group({
        ledgerId: [null as number | null, Validators.required],
        entryType: ['Debit', Validators.required],
        amount: [0, [Validators.required, Validators.min(0.01)]],
        description: [''],
      }),
    );
  }

  removeLedgerLine(index: number): void {
    this.ledgerLines.removeAt(index);
  }

  onRawItemChange(index: number, itemId: number | null): void {
    this.loadBatchesForLine(itemId, index, this.rawBatchOptionsByLine);
  }

  onOutputItemChange(index: number, itemId: number | null): void {
    this.loadBatchesForLine(itemId, index, this.outputBatchOptionsByLine);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError.set('Please complete all required fields.');
      return;
    }

    let body: CreateManufacturingTransactionRequest;
    try {
      body = this.buildRequest();
    } catch (e: unknown) {
      this.saveError.set(e instanceof Error ? e.message : 'Invalid voucher.');
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.txApi.createManufacturing(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.resetForm();
        this.saveError.set('Manufacturing voucher saved successfully.');
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const err = e as { error?: { detail?: string; title?: string }; message?: string };
        this.saveError.set(err.error?.detail ?? err.error?.title ?? err.message ?? 'Save failed.');
      },
    });
  }

  copyJson(): void {
    void navigator.clipboard.writeText(this.dataJson());
  }

  private loadNextVoucherNumber(): void {
    this.txApi.getNextVoucherNumber('MFG').subscribe({
      next: (res) => {
        const val =
          (res as { voucherNumber?: string })?.voucherNumber ??
          (typeof res === 'string' ? res : '');
        if (val) {
          this.form.patchValue({ voucherNumber: val });
        }
      },
      error: () => {},
    });
  }

  private createStockLineGroup(): FormGroup {
    return this.fb.group({
      itemId: [null as number | null, Validators.required],
      itemBatchId: [null as number | null],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(0.0001)]],
      rate: [0, [Validators.required, Validators.min(0)]],
    });
  }

  private loadBatchesForLine(
    itemId: number | null,
    lineIndex: number,
    mapSignal: ReturnType<typeof signal<Map<number, { label: string; value: number }[]>>>,
  ): void {
    if (itemId == null) {
      this.patchBatchMap(mapSignal, lineIndex, []);
      return;
    }
    this.lookups.listItemBatches(itemId).subscribe({
      next: (batches: BatchDTO[]) => {
        this.patchBatchMap(
          mapSignal,
          lineIndex,
          batches.map((b) => ({ label: b.batchNumber || `Batch #${b.id}`, value: b.id })),
        );
      },
      error: () => this.patchBatchMap(mapSignal, lineIndex, []),
    });
  }

  private patchBatchMap(
    mapSignal: ReturnType<typeof signal<Map<number, { label: string; value: number }[]>>>,
    lineIndex: number,
    opts: { label: string; value: number }[],
  ): void {
    const m = new Map(mapSignal());
    m.set(lineIndex, opts);
    mapSignal.set(m);
  }

  private reindexBatchMap(
    mapSignal: ReturnType<typeof signal<Map<number, { label: string; value: number }[]>>>,
    removedIndex: number,
  ): void {
    const m = new Map<number, { label: string; value: number }[]>();
    mapSignal().forEach((opts, i) => {
      if (i < removedIndex) m.set(i, opts);
      else if (i > removedIndex) m.set(i - 1, opts);
    });
    mapSignal.set(m);
  }

  private buildVoucherDateIso(): string {
    const raw = this.form.getRawValue() as { date: Date | null; time: string };
    if (!(raw.date instanceof Date) || Number.isNaN(raw.date.getTime())) {
      return new Date().toISOString();
    }
    const parts = (raw.time || '00:00:00').split(':').map((p) => Number(p));
    const [h, m, s] = [
      Number.isFinite(parts[0]) ? parts[0] : 0,
      Number.isFinite(parts[1]) ? parts[1] : 0,
      Number.isFinite(parts[2]) ? parts[2] : 0,
    ];
    const dt = new Date(raw.date);
    dt.setHours(h, m, s, 0);
    return dt.toISOString();
  }

  private mapStockLines(arr: FormArray<FormGroup>): ManufacturingStockLineRequest[] {
    return arr.controls.map((g) => {
      const v = g.getRawValue();
      const itemId = v.itemId as number;
      if (!itemId) throw new Error('Each stock line requires an item.');
      return {
        itemId,
        itemBatchId: (v.itemBatchId as number | null) ?? null,
        description: (v.description as string)?.trim() || null,
        quantity: Number(v.quantity),
        rate: Number(v.rate),
      };
    });
  }

  private mapExpenses(): ManufacturingExpenseRequest[] {
    return this.expenses.controls.map((g) => {
      const v = g.getRawValue();
      if (!v.ledgerId) throw new Error('Each expense requires a ledger.');
      return {
        ledgerId: v.ledgerId as number,
        amount: Number(v.amount),
        description: (v.description as string)?.trim() || null,
      };
    });
  }

  private mapLedgerLines(): ManufacturingLedgerLineRequest[] {
    return this.ledgerLines.controls.map((g) => {
      const v = g.getRawValue();
      if (!v.ledgerId) throw new Error('Each ledger line requires a ledger.');
      return {
        ledgerId: v.ledgerId as number,
        entryType: v.entryType as string,
        amount: Number(v.amount),
        description: (v.description as string)?.trim() || null,
      };
    });
  }

  private buildRequest(): CreateManufacturingTransactionRequest {
    const raw = this.form.getRawValue();
    const voucherNumber = String(raw.voucherNumber ?? '').trim();
    if (!voucherNumber) throw new Error('Missing voucher number.');

    const rawMaterials = this.mapStockLines(this.rawMaterials);
    const outputStock = this.mapStockLines(this.outputStock);
    if (rawMaterials.length === 0) throw new Error('Add at least one raw material line.');
    if (outputStock.length === 0) throw new Error('Add at least one finished goods (output) line.');

    return {
      voucherNumber,
      date: this.buildVoucherDateIso(),
      description: (raw.description as string)?.trim() || null,
      rawMaterials,
      expenses: this.mapExpenses(),
      ledgerLines: this.mapLedgerLines(),
      outputStock,
    };
  }

  private refreshJson(): void {
    try {
      this.dataJson.set(JSON.stringify(this.buildRequest(), null, 2));
    } catch {
      this.dataJson.set('{}');
    }
  }

  private resetForm(): void {
    this.form.patchValue({ description: '' });
    this.rawMaterials.clear();
    this.expenses.clear();
    this.ledgerLines.clear();
    this.outputStock.clear();
    this.rawBatchOptionsByLine.set(new Map());
    this.outputBatchOptionsByLine.set(new Map());
    this.addRawMaterial();
    this.addOutputStock();
    this.loadNextVoucherNumber();
  }
}
