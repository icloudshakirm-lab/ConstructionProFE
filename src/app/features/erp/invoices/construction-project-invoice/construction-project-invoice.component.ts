import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { catchError, debounceTime, distinctUntilChanged, merge, of, startWith, Subject, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { InvoiceItemsTableComponent } from '../../../../shared/components/invoice-items-table/invoice-items-table.component';
import { VoucherEntriesTableComponent } from '../../../../shared/components/voucher-entries-table/voucher-entries-table.component';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import { TransactionsApiService } from '../../../../core/api/transactions-api.service';
import type {
  ChildTransactionDTO,
  CreateChildTransactionRequest,
  CreateTransactionRequest,
  LookupDTO,
  TransactionDTO,
} from '../../../../core/api/erp-api.models';
import { DEMO_PROJECTS } from '../../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';
import { formatDateForInput, formatTimeForInput } from '../utils/datetime';
import { InvoiceLineJson } from '../models/sales-invoice.model';
import { ConstructionProjectInvoiceJson } from '../models/construction-project-invoice.model';
import { VoucherLineJson } from '../../vouchers/models/voucher.model';

const TRANSACTION_TYPE = 'ConstructionSales';
const VOUCHER_PREFIX = 'CPI';

@Component({
  selector: 'app-construction-project-invoice',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    DatePicker,
    Select,
    Button,
    Tag,
    InvoiceItemsTableComponent,
    VoucherEntriesTableComponent,
  ],
  templateUrl: './construction-project-invoice.component.html',
  styleUrl: './construction-project-invoice.component.css',
})
export class ConstructionProjectInvoiceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly lookups = inject(LookupsApiService);
  private readonly txApi = inject(TransactionsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly projectOptions = DEMO_PROJECTS.map((p) => ({
    label: `${p.name} — ${p.client}`,
    value: p.id,
    name: p.name,
    client: p.client,
  }));

  readonly drLedgerOptions = signal<Array<{ label: string; value: number }>>([]);
  readonly crMaterialLedgerOptions = signal<Array<{ label: string; value: number }>>([]);
  private readonly drLedgerSearch$ = new Subject<string>();
  private readonly crMaterialLedgerSearch$ = new Subject<string>();

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly transactionId = signal<number | null>(null);

  readonly dataJson = signal<string>('');
  readonly materialTotal = signal(0);
  readonly serviceTotal = signal(0);
  readonly totalAmount = signal(0);

  readonly form = this.fb.group({
    invoiceNumber: [{ value: '', disabled: true }],
    date: this.fb.control<Date | null>(new Date()),
    time: [{ value: '', disabled: true }],
    projectId: this.fb.control<string | null>(null),
    drLedgerId: this.fb.control<number | null>(null),
    crMaterialLedgerId: this.fb.control<number | null>(null),
    materialLines: this.fb.array<FormGroup>([]),
    serviceLines: this.fb.array<FormGroup>([]),
  });

  get materialLines(): FormArray<FormGroup> {
    return this.form.get('materialLines') as FormArray<FormGroup>;
  }

  get serviceLines(): FormArray<FormGroup> {
    return this.form.get('serviceLines') as FormArray<FormGroup>;
  }

  get selectedProjectLabel(): string | null {
    const id = this.form.get('projectId')?.value;
    if (!id) return null;
    return this.projectOptions.find((p) => p.value === id)?.name ?? null;
  }

  get selectedClientLabel(): string | null {
    const id = this.form.get('projectId')?.value;
    if (!id) return null;
    return this.projectOptions.find((p) => p.value === id)?.client ?? null;
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

    this.wireLedgerSearch(this.drLedgerSearch$, this.drLedgerOptions, 'drLedgerId');
    this.wireLedgerSearch(this.crMaterialLedgerSearch$, this.crMaterialLedgerOptions, 'crMaterialLedgerId');

    this.drLedgerSearch$.next('');
    this.crMaterialLedgerSearch$.next('');

    this.refreshJson();
    merge(
      this.form.valueChanges,
      this.materialLines.valueChanges,
      this.serviceLines.valueChanges,
    )
      .pipe(startWith(null))
      .subscribe(() => this.refreshJson());
  }

  onDrLedgersFilter(e: unknown): void {
    const ev = e as { filter?: string; value?: string };
    this.drLedgerSearch$.next((ev.filter ?? ev.value ?? '').toString());
  }

  onCrMaterialLedgersFilter(e: unknown): void {
    const ev = e as { filter?: string; value?: string };
    this.crMaterialLedgerSearch$.next((ev.filter ?? ev.value ?? '').toString());
  }

  onProjectChange(projectId: string | null): void {
    if (!projectId) return;
    const project = this.projectOptions.find((p) => p.value === projectId);
    if (project?.client) {
      this.drLedgerSearch$.next(project.client);
    }
  }

  loadNextVoucherNumber(): void {
    if (this.isEditMode()) return;
    this.txApi.getNextVoucherNumber(VOUCHER_PREFIX).subscribe({
      next: (res: unknown) => {
        const r = res as { voucherNumber?: string; VoucherNumber?: string };
        const val = r?.voucherNumber || r?.VoucherNumber || (typeof res === 'string' ? res : '');
        if (val) {
          this.form.patchValue({ invoiceNumber: val });
        }
      },
      error: (err: unknown) => console.error('Failed to fetch voucher number', err),
    });
  }

  refreshJson(): void {
    const req = this.buildTransactionRequestDraft();
    this.dataJson.set(JSON.stringify(req, null, 2));
    this.materialTotal.set(this.computeMaterialTotal());
    this.serviceTotal.set(this.computeServiceTotal());
    this.totalAmount.set(this.computeInvoiceTotal());
  }

  copyJson(): void {
    void navigator.clipboard.writeText(this.dataJson());
  }

  save(): void {
    let req: CreateTransactionRequest;
    try {
      req = this.buildTransactionRequest();
    } catch (e: unknown) {
      this.saveError.set(e instanceof Error ? e.message : 'Invalid invoice.');
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);

    const obs$ =
      this.isEditMode() && this.transactionId()
        ? this.txApi.update(this.transactionId()!, req)
        : this.txApi.create(req);

    obs$.subscribe({
      next: () => {
        this.saving.set(false);
        if (this.isEditMode()) {
          this.saveError.set('Saved successfully!');
        }
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const err = e as { error?: { detail?: string; title?: string }; message?: string };
        this.saveError.set(err.error?.detail ?? err.error?.title ?? err.message ?? 'Save failed.');
      },
    });
  }

  loadTransaction(id: number): void {
    this.txApi.getById(id).subscribe({
      next: (tx: TransactionDTO) => {
        this.form.patchValue({
          invoiceNumber: tx.voucherNumber,
          date: tx.date ? new Date(tx.date) : new Date(),
          time: tx.date ? formatTimeForInput(new Date(tx.date)) : '',
        });

        const projectId = this.extractProjectId(tx.description);
        if (projectId) {
          this.form.patchValue({ projectId });
        }

        const headerChild = tx.childTransactions?.find((c) =>
          ['Debit', 'Dr'].includes(c.ledgerEntryType ?? ''),
        );
        if (headerChild?.ledgerId) {
          this.patchLedger(
            headerChild.ledgerId,
            headerChild.ledgerName ?? undefined,
            'drLedgerId',
            this.drLedgerOptions,
            this.drLedgerSearch$,
          );
        }

        const creditChildren =
          tx.childTransactions?.filter((c) => ['Credit', 'Cr'].includes(c.ledgerEntryType ?? '')) ?? [];

        const materialChildren = creditChildren.filter((c) => c.itemId != null && c.itemId !== '');
        const serviceChildren = creditChildren.filter((c) => c.itemId == null || c.itemId === '');

        if (materialChildren.length > 0) {
          const crLedgerId = materialChildren[0].ledgerId;
          if (crLedgerId) {
            this.patchLedger(
              crLedgerId,
              materialChildren[0].ledgerName ?? undefined,
              'crMaterialLedgerId',
              this.crMaterialLedgerOptions,
              this.crMaterialLedgerSearch$,
            );
          }

          this.materialLines.clear();
          materialChildren.forEach((line) => {
            const invType = (line as ChildTransactionDTO & { inventoryType?: string }).inventoryType;
            this.materialLines.push(
              this.fb.group({
                id: [crypto.randomUUID()],
                lineKind: [invType === 'In' ? 'return' : 'sale'],
                itemId: [line.itemId ? Number(line.itemId) : null],
                itemName: [line.description || ''],
                batchId: [line.inventoryBatchId],
                batch: [line.reference || ''],
                qty: [line.quantity || 1],
                rate: [line.rate || 0],
                amount: [line.ledgerAmount],
              }),
            );
          });
        }

        this.serviceLines.clear();
        serviceChildren.forEach((line) => {
          this.serviceLines.push(
            this.fb.group({
              id: [crypto.randomUUID()],
              ledgerId: [line.ledgerId ?? null],
              ledgerName: [line.ledgerName ?? null],
              description: [line.description || ''],
              amount: [line.ledgerAmount ?? 0],
            }),
          );
        });
      },
      error: () => this.saveError.set('Failed to load transaction for editing.'),
    });
  }

  private wireLedgerSearch(
    search$: Subject<string>,
    options: ReturnType<typeof signal<Array<{ label: string; value: number }>>>,
    controlName: 'drLedgerId' | 'crMaterialLedgerId',
  ): void {
    search$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.lookups.listLedgers(q).pipe(catchError(() => of([] as LookupDTO[])))),
      )
      .subscribe((rows: LookupDTO[]) => {
        const results = rows.map((l) => ({ label: l.name, value: l.id }));
        const currentId = this.form.get(controlName)?.value;
        const currentOpt = options().find((o) => o.value === currentId);
        if (currentOpt && !results.some((r) => r.value === currentId)) {
          results.push(currentOpt);
        }
        options.set(results);
      });
  }

  private patchLedger(
    ledgerId: number,
    ledgerName: string | undefined,
    controlName: 'drLedgerId' | 'crMaterialLedgerId',
    options: ReturnType<typeof signal<Array<{ label: string; value: number }>>>,
    search$: Subject<string>,
  ): void {
    if (ledgerName) {
      search$.next(ledgerName);
    }
    this.form.patchValue({ [controlName]: ledgerId });
    options.update((opts) => {
      if (!opts.find((o) => o.value === ledgerId)) {
        return [...opts, { label: ledgerName || 'Unknown', value: ledgerId }];
      }
      return opts;
    });
  }

  private extractProjectId(description?: string | null): string | null {
    if (!description) return null;
    const match = description.match(/\[project:([^\]]+)\]/);
    return match?.[1] ?? null;
  }

  private buildProjectTag(): string {
    const projectId = this.form.get('projectId')?.value;
    return projectId ? `[project:${projectId}]` : '';
  }

  private buildDescription(invoiceNumber: string): string {
    const project = this.selectedProjectLabel;
    const tag = this.buildProjectTag();
    if (project) {
      return `Construction project invoice ${invoiceNumber} — ${project} ${tag}`.trim();
    }
    return `Construction project invoice ${invoiceNumber} ${tag}`.trim();
  }

  private computeMaterialTotal(): number {
    let sum = 0;
    for (const g of this.materialLines.controls) {
      const v = g.getRawValue() as InvoiceLineJson;
      const qty = Number(v.qty) || 0;
      const rate = Number(v.rate) || 0;
      const amt = Math.round(qty * rate * 100) / 100;
      sum += v.lineKind === 'return' ? -amt : amt;
    }
    return Math.round(sum * 100) / 100;
  }

  private computeServiceTotal(): number {
    let sum = 0;
    for (const g of this.serviceLines.controls) {
      sum += Number(g.get('amount')?.value) || 0;
    }
    return Math.round(sum * 100) / 100;
  }

  private computeInvoiceTotal(): number {
    return Math.round((this.computeMaterialTotal() + this.computeServiceTotal()) * 100) / 100;
  }

  private buildMaterialChildren(crMaterialLedgerId: number | null): CreateChildTransactionRequest[] {
    return (this.materialLines.controls as FormGroup[]).map((g) => {
      const l = g.getRawValue() as InvoiceLineJson;
      const qty = Number(l.qty) || 0;
      const rate = Number(l.rate) || 0;
      const amount = Math.round(qty * rate * 100) / 100;
      const itemId = l.itemId ?? null;
      return {
        description: l.itemName || 'Material line',
        reference: l.batch || null,
        ledgerId: crMaterialLedgerId,
        ledgerEntryType: 'Credit',
        ledgerAmount: amount,
        inventoryBatchId: l.batchId ? Number(l.batchId) : null,
        inventoryType: l.lineKind === 'return' ? 'In' : 'Out',
        itemId: itemId != null ? String(itemId) : undefined,
        quantity: qty,
        rate: rate,
      };
    });
  }

  private buildServiceChildren(): CreateChildTransactionRequest[] {
    return (this.serviceLines.controls as FormGroup[]).map((g) => {
      const l = g.getRawValue() as VoucherLineJson;
      return {
        description: l.description || 'Service line',
        ledgerId: l.ledgerId,
        ledgerEntryType: 'Credit',
        ledgerAmount: Number(l.amount) || 0,
      };
    });
  }

  private buildTransactionRequestDraft(): CreateTransactionRequest {
    const payload = this.buildJson();
    const drLedgerId = payload.drLedgerId ?? null;
    const crMaterialLedgerId = payload.crMaterialLedgerId ?? null;
    const totalAbs = Math.round(Math.abs(payload.totalAmount) * 100) / 100;

    const children: CreateChildTransactionRequest[] = [
      {
        description: 'Construction project invoice total',
        ledgerId: drLedgerId,
        ledgerEntryType: 'Debit',
        ledgerAmount: totalAbs,
      },
      ...this.buildMaterialChildren(crMaterialLedgerId),
      ...this.buildServiceChildren(),
    ];

    return {
      voucherNumber: payload.invoiceNumber ?? '',
      type: TRANSACTION_TYPE,
      date: this.buildInvoiceDateIso(),
      description: payload.invoiceNumber
        ? this.buildDescription(payload.invoiceNumber)
        : 'Construction project invoice',
      childTransactions: children,
    };
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
    const crMaterialLedgerId = payload.crMaterialLedgerId;
    const materialCount = payload.materialLines.length;
    const serviceCount = payload.serviceLines.length;

    if (!payload.invoiceNumber) {
      throw new Error('Missing invoice number.');
    }
    if (!payload.projectId) {
      throw new Error('Select a construction project before saving.');
    }
    if (!drLedgerId) {
      throw new Error('Select client / party ledger before saving.');
    }
    if (materialCount === 0 && serviceCount === 0) {
      throw new Error('Add at least one material or service line before saving.');
    }
    if (materialCount > 0 && !crMaterialLedgerId) {
      throw new Error('Select a materials sales account when billing inventory items.');
    }

    for (const line of payload.serviceLines) {
      if (!line.ledgerId) {
        throw new Error('Each service line needs a revenue ledger.');
      }
      if (!line.amount || line.amount <= 0) {
        throw new Error('Each service line needs an amount greater than zero.');
      }
    }

    const totalAbs = Math.round(Math.abs(payload.totalAmount) * 100) / 100;
    if (totalAbs <= 0) {
      throw new Error('Invoice total must be greater than zero.');
    }

    const children: CreateChildTransactionRequest[] = [
      {
        description: 'Construction project invoice total',
        ledgerId: drLedgerId,
        ledgerEntryType: 'Debit',
        ledgerAmount: totalAbs,
      },
      ...this.buildMaterialChildren(crMaterialLedgerId),
      ...this.buildServiceChildren(),
    ];

    return {
      voucherNumber: payload.invoiceNumber,
      type: TRANSACTION_TYPE,
      date: this.buildInvoiceDateIso(),
      description: this.buildDescription(payload.invoiceNumber),
      childTransactions: children,
    };
  }

  buildJson(): ConstructionProjectInvoiceJson {
    const raw = this.form.getRawValue() as {
      invoiceNumber: string;
      date: Date | null;
      time: string;
      projectId: string | null;
      drLedgerId: number | null;
      crMaterialLedgerId: number | null;
    };

    const project = this.projectOptions.find((p) => p.value === raw.projectId);

    const materialLines: InvoiceLineJson[] = (this.materialLines.controls as FormGroup[]).map((g) => {
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

    const serviceLines: VoucherLineJson[] = (this.serviceLines.controls as FormGroup[]).map((g) => {
      const v = g.getRawValue() as VoucherLineJson;
      return {
        id: v.id,
        ledgerId: v.ledgerId,
        ledgerName: v.ledgerName,
        description: v.description,
        amount: Number(v.amount),
      };
    });

    const materialTotal = this.computeMaterialTotal();
    const serviceTotal = this.computeServiceTotal();

    return {
      invoiceNumber: raw.invoiceNumber,
      date:
        raw.date instanceof Date && !Number.isNaN(raw.date.getTime())
          ? formatDateForInput(raw.date)
          : '',
      time: raw.time,
      projectId: raw.projectId,
      projectName: project?.name ?? null,
      clientName: project?.client ?? null,
      drLedgerId: raw.drLedgerId,
      crMaterialLedgerId: raw.crMaterialLedgerId,
      drLedgerName: null,
      crMaterialLedgerName: null,
      materialTotal,
      serviceTotal,
      totalAmount: Math.round((materialTotal + serviceTotal) * 100) / 100,
      materialLines,
      serviceLines,
    };
  }
}
