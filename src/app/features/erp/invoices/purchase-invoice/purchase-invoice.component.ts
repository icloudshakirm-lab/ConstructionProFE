import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { catchError, debounceTime, distinctUntilChanged, merge, of, startWith, Subject, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { InvoiceItemsTableComponent } from '../../../../shared/components/invoice-items-table/invoice-items-table.component';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import { TransactionsApiService } from '../../../../core/api/transactions-api.service';
import type {
  CreateChildTransactionRequest,
  CreateTransactionRequest,
  LookupDTO,
} from '../../../../core/api/erp-api.models';
import { formatDateForInput, formatTimeForInput } from '../utils/datetime';
import { generatePurchaseInvoiceNumber } from '../utils/invoice-number';
import { InvoiceLineJson, SalesInvoiceJson } from '../models/sales-invoice.model';

@Component({
  selector: 'app-purchase-invoice',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    DatePicker,
    Select,
    InvoiceItemsTableComponent,
  ],
  templateUrl: './purchase-invoice.component.html',
  styleUrl: './purchase-invoice.component.css',
})
export class PurchaseInvoiceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly lookups = inject(LookupsApiService);
  private readonly txApi = inject(TransactionsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly drLedgerOptions = signal<Array<{ label: string; value: number }>>([]);
  readonly crLedgerOptions = signal<Array<{ label: string; value: number }>>([]);
  private readonly drLedgerSearch$ = new Subject<string>();
  private readonly crLedgerSearch$ = new Subject<string>();

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly transactionId = signal<number | null>(null);

  /** PI = Purchase Invoice. Matches backend naming if configured. */
  loadNextVoucherNumber(type = 'PI'): void {
    if (this.isEditMode()) return;
    this.txApi.getNextVoucherNumber(type).subscribe({
      next: (res: any) => {
        const val = res?.voucherNumber || res?.VoucherNumber || (typeof res === 'string' ? res : '');
        if (val) {
          this.form.patchValue({ purchaseNumber: val });
        }
      },
      error: (err: unknown) => console.error('Failed to fetch voucher number', err),
    });
  }

  readonly form = this.fb.group({
    purchaseNumber: [{ value: '', disabled: true }],
    date: this.fb.control<Date | null>(new Date()),
    time: [{ value: '', disabled: true }],
    drLedgerId: this.fb.control<number | null>(null),
    crLedgerId: this.fb.control<number | null>(null),
    lines: this.fb.array<FormGroup>([]),
  });

  readonly dataJson = signal<string>('');

  /** Sum of line amounts (updated with JSON refresh). */
  readonly totalAmount = signal(0);

  get lines(): FormArray<FormGroup> {
    return this.form.get('lines') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    const now = new Date();
    
    if (routeId && !Number.isNaN(Number(routeId))) {
      this.isEditMode.set(true);
      this.transactionId.set(Number(routeId));
      this.loadTransaction(Number(routeId));
    } else {
      this.loadNextVoucherNumber();
      this.form.patchValue({
        date: now,
        time: formatTimeForInput(now),
      });
    }

    // Handle Dr Ledger search
    this.drLedgerSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) =>
          this.lookups.listLedgers(q).pipe(
            catchError(() => of([] as LookupDTO[])),
          ),
        ),
      )
      .subscribe((rows: LookupDTO[]) => {
        const results = rows.map((l) => ({ label: l.name, value: l.id }));
        const currentId = this.form.get('drLedgerId')?.value;
        const currentOpt = this.drLedgerOptions().find(o => o.value === currentId);

        if (currentOpt && !results.some(r => r.value === currentId)) {
          results.push(currentOpt);
        }
        this.drLedgerOptions.set(results);
      });

    // Handle Cr Ledger search
    this.crLedgerSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) =>
          this.lookups.listLedgers(q).pipe(
            catchError(() => of([] as LookupDTO[])),
          ),
        ),
      )
      .subscribe((rows: LookupDTO[]) => {
        const results = rows.map((l) => ({ label: l.name, value: l.id }));
        const currentId = this.form.get('crLedgerId')?.value;
        const currentOpt = this.crLedgerOptions().find(o => o.value === currentId);

        if (currentOpt && !results.some(r => r.value === currentId)) {
          results.push(currentOpt);
        }
        this.crLedgerOptions.set(results);
      });

    this.drLedgerSearch$.next('');
    this.crLedgerSearch$.next('');

    this.refreshJson();
    merge(this.form.valueChanges, this.lines.valueChanges)
      .pipe(startWith(null))
      .subscribe(() => this.refreshJson());
  }

  onDrLedgersFilter(e: unknown): void {
    const ev = e as { filter?: string; value?: string };
    this.drLedgerSearch$.next((ev.filter ?? ev.value ?? '').toString());
  }

  onCrLedgersFilter(e: unknown): void {
    const ev = e as { filter?: string; value?: string };
    this.crLedgerSearch$.next((ev.filter ?? ev.value ?? '').toString());
  }

  refreshJson(): void {
    const req = this.buildTransactionRequestDraft();
    this.dataJson.set(JSON.stringify(req, null, 2));
    this.totalAmount.set(this.computeInvoiceTotalAmount());
  }

  copyJson(): void {
    void navigator.clipboard.writeText(this.dataJson());
  }

  loadTransaction(id: number): void {
    this.txApi.getById(id).subscribe({
      next: (tx: any) => {
        this.form.patchValue({
          purchaseNumber: tx.voucherNumber,
          date: tx.date ? new Date(tx.date) : new Date(),
          time: tx.date ? formatTimeForInput(new Date(tx.date)) : '',
        });

        // Robust ledger patching: Header is Credit (Supplier), Lines are Debit (Purchase)
        const headerChild = tx.childTransactions?.find((c: any) => ['Credit', 'Cr'].includes(c.ledgerEntryType));
        if (headerChild) {
          if (headerChild.ledgerName) {
            this.crLedgerSearch$.next(headerChild.ledgerName);
          }
          this.form.patchValue({ crLedgerId: headerChild.ledgerId });
          this.crLedgerOptions.update(opts => {
            if (!opts.find(o => o.value === headerChild.ledgerId)) {
              return [...opts, { label: headerChild.ledgerName || 'Unknown', value: headerChild.ledgerId }];
            }
            return opts;
          });
        }

        const linesChildren = tx.childTransactions?.filter((c: any) => ['Debit', 'Dr'].includes(c.ledgerEntryType)) || [];
        if (linesChildren.length > 0) {
          const firstLine = linesChildren[0];
          const drLedgerId = firstLine.ledgerId;

          if (firstLine.ledgerName) {
            this.drLedgerSearch$.next(firstLine.ledgerName);
          }
          this.form.patchValue({ drLedgerId });
          this.drLedgerOptions.update(opts => {
            if (!opts.find(o => o.value === drLedgerId)) {
              return [...opts, { label: firstLine.ledgerName || 'Unknown', value: drLedgerId }];
            }
            return opts;
          });

          this.lines.clear();
          linesChildren.forEach((line: any) => {
            const rowGroup = this.fb.group({
              id: [crypto.randomUUID()],
              lineKind: [line.inventoryType === 'Out' ? 'return' : 'sale'],
              itemId: [line.itemId ? Number(line.itemId) : null],
              itemName: [line.description || ''],
              batchId: [line.inventoryBatchId],
              batch: [line.reference || ''],
              qty: [line.quantity || 1],
              rate: [line.rate || 0],
              amount: [line.ledgerAmount],
            });
            this.lines.push(rowGroup);
          });
        }
      },
      error: () => this.saveError.set('Failed to load transaction for editing.')
    });
  }

  save(): void {
    let req: CreateTransactionRequest;
    try {
      req = this.buildTransactionRequest();
    } catch (e: unknown) {
      this.saveError.set(e instanceof Error ? e.message : 'Invalid voucher.');
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    
    const obs$ = this.isEditMode() && this.transactionId()
      ? this.txApi.update(this.transactionId()!, req)
      : this.txApi.create(req);

    obs$.subscribe({
      next: () => {
        this.saving.set(false);
        if (this.isEditMode()) {
          this.saveError.set('Saved successfully!');
        } else {
          this.lines.clear();
          this.loadNextVoucherNumber();
        }
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const err = e as { error?: { detail?: string; title?: string }; message?: string };
        this.saveError.set(err.error?.detail ?? err.error?.title ?? err.message ?? 'Save failed.');
      },
    });
  }

  private buildTransactionRequestDraft(): CreateTransactionRequest {
    const payload = this.buildJson();
    const drLedgerId = payload.drLedgerId ?? null;
    const crLedgerId = payload.crLedgerId ?? null;
    const lines = payload.lines ?? [];

    const totalAmount = this.computeInvoiceTotalAmount();
    const totalAbs = Math.round(Math.abs(totalAmount) * 100) / 100;

    const itemChildren: CreateChildTransactionRequest[] = lines.map((l) => {
      const qty = Number(l.qty) || 0;
      const rate = Number(l.rate) || 0;
      const amount = Math.round(qty * rate * 100) / 100;
      const itemId = l.itemId ?? null;
      return {
        description: l.itemName || 'Purchase line',
        reference: l.batch || null,
        ledgerId: drLedgerId, // In Purchase, we DEBIT the Purchase Account (drLedgerId)
        ledgerEntryType: 'Debit',
        ledgerAmount: amount,
        inventoryBatchId: l.batchId ? Number(l.batchId) : null,
        inventoryType: l.lineKind === 'return' ? 'Out' : 'In',
        itemId: itemId != null ? String(itemId) : undefined,
        quantity: qty,
        rate: rate,
      };
    });

    const children: CreateChildTransactionRequest[] = [
      {
        description: 'Purchase voucher total',
        ledgerId: crLedgerId, // In Purchase, we CREDIT the Supplier (crLedgerId)
        ledgerEntryType: 'Credit',
        ledgerAmount: totalAbs,
      },
      ...itemChildren,
    ];

    return {
      voucherNumber: payload.invoiceNumber ?? '',
      type: 'Purchase',
      date: this.buildInvoiceDateIso(),
      description: payload.invoiceNumber ? `Purchase invoice ${payload.invoiceNumber}` : 'Purchase invoice',
      childTransactions: children,
    };
  }

  private computeInvoiceTotalAmount(): number {
    const lines = this.buildJson().lines ?? [];
    let sum = 0;
    for (const l of lines) {
      const qty = Number(l.qty) || 0;
      const rate = Number(l.rate) || 0;
      const amt = Math.round(qty * rate * 100) / 100;
      sum += l.lineKind === 'return' ? -amt : amt;
    }
    return Math.round(sum * 100) / 100;
  }

  private buildInvoiceDateIso(): string | undefined {
    const raw = this.form.getRawValue() as { date: Date | null; time: string };
    if (!(raw.date instanceof Date) || Number.isNaN(raw.date.getTime())) {
      return undefined;
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

  private buildTransactionRequest(): CreateTransactionRequest {
    const payload = this.buildJson();
    const drLedgerId = payload.drLedgerId;
    const crLedgerId = payload.crLedgerId;

    const lines = payload.lines ?? [];
    const totalAmount = this.computeInvoiceTotalAmount();
    const totalAbs = Math.round(Math.abs(totalAmount) * 100) / 100;

    if (!payload.invoiceNumber) {
      throw new Error('Missing voucher number.');
    }
    if (!drLedgerId || !crLedgerId) {
      throw new Error('Select Purchase Account and Supplier A/C before saving.');
    }
    if (lines.length === 0) {
      throw new Error('Add at least one line item before saving.');
    }

    const itemChildren: CreateChildTransactionRequest[] = lines.map((l) => {
      const qty = Number(l.qty) || 0;
      const rate = Number(l.rate) || 0;
      const amount = Math.round(qty * rate * 100) / 100;
      const itemId = l.itemId ?? null;
      return {
        description: l.itemName || 'Purchase line',
        reference: l.batch || null,
        ledgerId: drLedgerId, // Dr Purchase Account
        ledgerEntryType: 'Debit',
        ledgerAmount: amount,
        inventoryBatchId: l.batchId ? Number(l.batchId) : null,
        inventoryType: l.lineKind === 'return' ? 'Out' : 'In',
        itemId: itemId != null ? String(itemId) : undefined,
        quantity: qty,
        rate: rate,
      };
    });

    const children: CreateChildTransactionRequest[] = [
      {
        description: 'Purchase voucher total',
        ledgerId: crLedgerId, // Cr Supplier
        ledgerEntryType: 'Credit',
        ledgerAmount: totalAbs,
      },
      ...itemChildren,
    ];

    return {
      voucherNumber: payload.invoiceNumber,
      type: 'Purchase',
      date: this.buildInvoiceDateIso(),
      description: `Purchase voucher ${payload.invoiceNumber}`,
      childTransactions: children,
    };
  }

  buildJson(): SalesInvoiceJson {
    const raw = this.form.getRawValue() as {
      purchaseNumber: string;
      date: Date | null;
      time: string;
      drLedgerId: number | null;
      crLedgerId: number | null;
    };
    const lines: InvoiceLineJson[] = (this.lines.controls as FormGroup[]).map((g) => {
      const v = g.getRawValue() as InvoiceLineJson;
      return {
        id: v.id,
        lineKind: v.lineKind ?? 'sale',
        itemId: v.itemId ?? null,
        itemName: v.itemName,
        batch: v.batch ?? '',
        batchId: v.batchId ?? null,
        qty: Number(v.qty),
        rate: Number(v.rate),
        amount: Number(v.amount),
      };
    });
    const totalAmount = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
    return {
      invoiceNumber: raw.purchaseNumber,
      date:
        raw.date instanceof Date && !Number.isNaN(raw.date.getTime())
          ? formatDateForInput(raw.date)
          : '',
      time: raw.time,
      drLedgerId: raw.drLedgerId,
      crLedgerId: raw.crLedgerId,
      drLedgerName: null,
      crLedgerName: null,
      totalAmount: Math.round(totalAmount * 100) / 100,
      lines,
    };
  }
}
