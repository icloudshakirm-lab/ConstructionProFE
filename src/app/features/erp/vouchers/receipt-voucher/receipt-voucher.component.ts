import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { catchError, debounceTime, distinctUntilChanged, merge, of, startWith, Subject, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import { TransactionsApiService } from '../../../../core/api/transactions-api.service';
import type {
  CreateChildTransactionRequest,
  CreateTransactionRequest,
  LookupDTO,
} from '../../../../core/api/erp-api.models';
import { formatDateForInput, formatTimeForInput } from '../../invoices/utils/datetime';
import { VoucherEntriesTableComponent } from '../../../../shared/components/voucher-entries-table/voucher-entries-table.component';
import { VoucherJson, VoucherLineJson } from '../models/voucher.model';

@Component({
  selector: 'app-receipt-voucher',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    DatePicker,
    Select,
    Button,
    VoucherEntriesTableComponent,
  ],
  templateUrl: './receipt-voucher.component.html',
  styleUrl: './receipt-voucher.component.css',
})
export class ReceiptVoucherComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly lookups = inject(LookupsApiService);
  private readonly txApi = inject(TransactionsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly headerLedgerOptions = signal<Array<{ label: string; value: number }>>([]);
  private readonly headerLedgerSearch$ = new Subject<string>();

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly transactionId = signal<number | null>(null);

  loadNextVoucherNumber(type = 'RV'): void {
    if (this.isEditMode()) return;
    this.txApi.getNextVoucherNumber(type).subscribe({
      next: (res: any) => {
        const val = res?.voucherNumber || res?.VoucherNumber || (typeof res === 'string' ? res : '');
        if (val) {
          this.form.patchValue({ voucherNumber: val });
        }
      },
      error: (err: unknown) => console.error('Failed to fetch voucher number', err),
    });
  }

  readonly form = this.fb.group({
    voucherNumber: [{ value: '', disabled: true }],
    date: this.fb.control<Date | null>(new Date()),
    time: [{ value: '', disabled: true }],
    headerLedgerId: this.fb.control<number | null>(null), // Debit ledger for Receipt
    lines: this.fb.array<FormGroup>([]),
  });

  readonly dataJson = signal<string>('');
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

    this.headerLedgerSearch$
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
        const currentId = this.form.get('headerLedgerId')?.value;
        const currentOpt = this.headerLedgerOptions().find(o => o.value === currentId);

        if (currentOpt && !results.some(r => r.value === currentId)) {
          results.push(currentOpt);
        }
        this.headerLedgerOptions.set(results);
      });

    this.headerLedgerSearch$.next('');

    this.refreshJson();
    merge(this.form.valueChanges, this.lines.valueChanges)
      .pipe(startWith(null))
      .subscribe(() => this.refreshJson());
  }

  onHeaderLedgerFilter(e: unknown): void {
    const ev = e as { filter?: string; value?: string };
    this.headerLedgerSearch$.next((ev.filter ?? ev.value ?? '').toString());
  }

  refreshJson(): void {
    const req = this.buildTransactionRequestDraft();
    this.dataJson.set(JSON.stringify(req, null, 2));
    this.totalAmount.set(this.computeTotalAmount());
  }

  copyJson(): void {
    void navigator.clipboard.writeText(this.dataJson());
  }

  loadTransaction(id: number): void {
    this.txApi.getById(id).subscribe({
      next: (tx: any) => {
        this.form.patchValue({
          voucherNumber: tx.voucherNumber,
          date: tx.date ? new Date(tx.date) : new Date(),
          time: tx.date ? formatTimeForInput(new Date(tx.date)) : '',
        });

        const headerChild = tx.childTransactions?.find((c: any) => ['Debit', 'Dr'].includes(c.ledgerEntryType));
        if (headerChild) {
          // Trigger search by name to ensure the dropdown has this entry
          if (headerChild.ledgerName) {
            this.headerLedgerSearch$.next(headerChild.ledgerName);
          }
          this.form.patchValue({ headerLedgerId: headerChild.ledgerId });

          // Fallback: manually add to options in case search is slow or fails
          this.headerLedgerOptions.update(opts => {
            if (!opts.find(o => o.value === headerChild.ledgerId)) {
              return [...opts, { label: headerChild.ledgerName || 'Unknown', value: headerChild.ledgerId }];
            }
            return opts;
          });
        }

        const linesChildren = tx.childTransactions?.filter((c: any) => ['Credit', 'Cr'].includes(c.ledgerEntryType)) || [];
        this.lines.clear();
        linesChildren.forEach((line: any) => {
          const rowGroup = this.fb.group({
            id: [crypto.randomUUID()],
            ledgerId: [line.ledgerId],
            ledgerName: [line.ledgerName || ''],
            description: [line.description || ''],
            amount: [line.ledgerAmount || 0],
          });
          this.lines.push(rowGroup);
        });
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
          this.addRow();
        }
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const err = e as { error?: { detail?: string; title?: string }; message?: string };
        this.saveError.set(err.error?.detail ?? err.error?.title ?? err.message ?? 'Save failed.');
      },
    });
  }

  addRow(): void {
    // This is handled by the table component via Input, but we can clear and add one.
  }

  private buildTransactionRequestDraft(): CreateTransactionRequest {
    const payload = this.buildJson();
    const headerLedgerId = payload.headerLedgerId ?? null;
    const lines = payload.lines ?? [];

    const totalAmount = this.computeTotalAmount();
    const children: CreateChildTransactionRequest[] = [
      {
        description: 'Receipt Total',
        ledgerId: headerLedgerId,
        ledgerEntryType: 'Debit',
        ledgerAmount: totalAmount,
      },
      ...lines.map(l => ({
        description: l.description || 'Receipt line',
        ledgerId: l.ledgerId,
        ledgerEntryType: 'Credit',
        ledgerAmount: l.amount
      }))
    ];

    return {
      voucherNumber: payload.voucherNumber ?? '',
      type: 'Receipt',
      date: this.buildVoucherDateIso(),
      description: payload.voucherNumber ? `Receipt voucher ${payload.voucherNumber}` : 'Receipt voucher',
      childTransactions: children,
    };
  }

  private computeTotalAmount(): number {
    let sum = 0;
    for (const g of this.lines.controls) {
      sum += Number(g.get('amount')?.value) || 0;
    }
    return Math.round(sum * 100) / 100;
  }

  private buildVoucherDateIso(): string | undefined {
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
    const headerLedgerId = payload.headerLedgerId;
    const lines = payload.lines ?? [];

    if (!payload.voucherNumber) throw new Error('Missing voucher number.');
    if (!headerLedgerId) throw new Error('Select Receipt Account (Bank/Cash) before saving.');
    if (lines.length === 0) throw new Error('Add at least one entry before saving.');

    const totalAmount = this.computeTotalAmount();

    const children: CreateChildTransactionRequest[] = [
      {
        description: `Receipt total: ${payload.voucherNumber}`,
        ledgerId: headerLedgerId,
        ledgerEntryType: 'Debit',
        ledgerAmount: totalAmount,
      },
      ...lines.map(l => ({
        description: l.description || 'Receipt entry',
        ledgerId: l.ledgerId,
        ledgerEntryType: 'Credit',
        ledgerAmount: l.amount
      }))
    ];

    return {
      voucherNumber: payload.voucherNumber,
      type: 'Receipt',
      date: this.buildVoucherDateIso(),
      description: `Receipt voucher ${payload.voucherNumber}`,
      childTransactions: children,
    };
  }

  buildJson(): VoucherJson {
    const raw = this.form.getRawValue() as any;
    const lines: VoucherLineJson[] = (this.lines.controls as FormGroup[]).map((g) => {
      const v = g.getRawValue() as VoucherLineJson;
      return {
        id: v.id,
        ledgerId: v.ledgerId,
        ledgerName: v.ledgerName,
        description: v.description,
        amount: Number(v.amount),
      };
    });
    return {
      voucherNumber: raw.voucherNumber,
      date: raw.date instanceof Date ? formatDateForInput(raw.date) : '',
      time: raw.time,
      headerLedgerId: raw.headerLedgerId,
      headerLedgerName: null,
      totalAmount: this.computeTotalAmount(),
      lines,
    };
  }
}
