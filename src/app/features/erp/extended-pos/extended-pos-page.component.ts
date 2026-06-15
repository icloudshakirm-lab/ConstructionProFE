import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, startWith } from 'rxjs';
import { ItemsApiService } from '../../../core/api/items-api.service';
import { TransactionsApiService } from '../../../core/api/transactions-api.service';
import { LedgersApiService } from '../../../core/api/ledgers-api.service';
import { ConfigurationsApiService } from '../../../core/api/configurations-api.service';
import {
  ConfigurationDTO,
  LedgerDTO,
  CreateChildTransactionRequest,
  CreateTransactionRequest,
  ItemDTO,
  ItemWithBatchesDto
} from '../../../core/api/erp-api.models';
import { InvoiceLineJson, InvoiceLineKind } from '../invoices/models/sales-invoice.model';
import {
  BATCH_WEEK_SELECT_OPTIONS,
  getCurrentBatchWeekValue,
} from '../../../shared/data/batch-week-options';
import {
  PosCatalogService,
  posHitFromItemWithBatches,
  type PosCatalogHit,
} from '../pos/pos-catalog.service';
import {
  DEFAULT_POS_COMPANY_PRINT,
  POS_PRINT_STORAGE_KEY,
  type PosPrintPayload,
} from '../pos/pos-print.models';

@Component({
  selector: 'app-extended-pos-page',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule],
  templateUrl: './extended-pos-page.component.html',
  styleUrl: './extended-pos-page.component.css',
})
export class ExtendedPosPageComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(PosCatalogService);
  private readonly itemsApi = inject(ItemsApiService);
  private readonly txApi = inject(TransactionsApiService);
  private readonly ledgersApi = inject(LedgersApiService);
  private readonly configsApi = inject(ConfigurationsApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  readonly barcodeInput = viewChild<ElementRef<HTMLInputElement>>('barcodeInput');
  readonly paymentRadioCard = viewChild<ElementRef<HTMLInputElement>>('paymentRadioCard');
  readonly receivedAmountInput = viewChild<ElementRef<HTMLInputElement>>('receivedAmountInput');
  readonly itemSearchInput = viewChild<ElementRef<HTMLInputElement>>('itemSearchInput');

  readonly form = this.fb.group({
    scanInput: this.fb.nonNullable.control(''),
    lines: this.fb.array<FormGroup>([]),
    /** `card` | `cash` — drives payment panel and keyboard flow. */
    paymentMethod: this.fb.nonNullable.control<'card' | 'cash'>('cash'),
    /** Cash tendered; ignored for card (paid = net). */
    receivedAmount: this.fb.control<number | null>(null),
    drLedgerId: this.fb.control<number | null>(null),
    crLedgerId: this.fb.control<number | null>(null),
  });

  // --- Keyboard Flow State (from posDoc.md) ---
  readonly isVisibleAfterPrint = signal(false);
  readonly isVisibleAutoComppop = signal(false);
  readonly isVisibleRecall = signal(false);
  readonly isVisibleSearchModal = signal(false);

  readonly autoComppopSelectedIndex = signal(0);
  readonly recallSelectedIndex = signal(0);
  readonly itemSearchSelectedIndex = signal(0);

  readonly itemSearchQuery = signal('');
  readonly itemSearchResults = signal<ItemDTO[]>([]);
  readonly allAvailableItems = signal<ItemDTO[]>([]);
  readonly allLedgers = signal<LedgerDTO[]>([]);
  readonly isEditMode = signal(false);
  readonly transactionId = signal<number | null>(null);
  readonly voucherNumber = signal('');

  private isPrintedTimenotOut = true;

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    // Flow A: After Print modal open (highest priority)
    if (this.isVisibleAfterPrint()) {
      event.preventDefault();
      this.handleOkAfterPrint();
      return;
    }

    // Flow B: Normal operation
    const preventKeys = ['F1', 'F3', 'F4', 'F5', 'F6', 'F7', 'F9', 'F12'];
    if (preventKeys.includes(event.key)) {
      event.preventDefault();
      this.customKeyEvent(event);
    } else {
      this.paralelEvent(event);
    }
  }

  private handleOkAfterPrint(): void {
    if (!this.isPrintedTimenotOut) return;
    this.isVisibleAfterPrint.set(false);
    this.voidAll();
    this.isPrintedTimenotOut = false;
    setTimeout(() => {
      this.isPrintedTimenotOut = true;
    }, 500);
    this.focusScan();
  }

  private customKeyEvent(event: KeyboardEvent): void {
    switch (event.key) {
      case 'F5':
        this.voidAll();
        break;
      case 'F6':
        this.holdPOS();
        break;
      case 'F7':
        this.onRecallPopup();
        break;
      case 'F3':
        this.onItemSearchPopup();
        break;
      case 'F4':
        this.toggleSalesReturnMode();
        break;
      case 'F9':
        console.log('OpenDrawer action triggered via F9');
        break;
      default:
        console.log(`Key ${event.key} is prevented but not implemented in customKeyEvent`);
        break;
    }
  }

  private paralelEvent(event: KeyboardEvent): void {
    if (this.isVisibleSearchModal()) {
      this.handleItemSearchNav(event);
    } else if (this.isVisibleAutoComppop()) {
      this.handleAutoComppopNav(event);
    } else {
      this.handleDefaultNav(event);
    }
  }

  private handleItemSearchNav(event: KeyboardEvent): void {
    const results = this.itemSearchResults();
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.itemSearchSelectedIndex.update((v) => Math.max(0, v - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.itemSearchSelectedIndex.update((v) =>
          results.length > 0 ? Math.min(results.length - 1, v + 1) : 0,
        );
        break;
      case 'Enter':
        event.preventDefault();
        const selected = results[this.itemSearchSelectedIndex()];
        if (selected) {
          this.selectSearchResult(selected);
        } else {
          this.isVisibleSearchModal.set(false);
          this.focusScan();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.isVisibleSearchModal.set(false);
        this.focusScan();
        break;
    }
  }

  private handleAutoComppopNav(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.autoComppopSelectedIndex.update((v) => Math.max(0, v - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.autoComppopSelectedIndex.update((v) => v + 1); // Max check would happen against list length
        break;
      case 'Enter':
        event.preventDefault();
        console.log('AutoComppop_Enter triggered at index:', this.autoComppopSelectedIndex());
        this.isVisibleAutoComppop.set(false);
        this.focusScan();
        break;
    }
  }

  private handleDefaultNav(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        this.recallSelectedIndex.update((v) => Math.max(0, v - 1));
        break;
      case 'ArrowDown':
        this.recallSelectedIndex.update((v) => v + 1);
        break;
      case 'Enter':
        if (this.isVisibleRecall()) {
          console.log('EnterKey triggered for Recall at index:', this.recallSelectedIndex());
          this.isVisibleRecall.set(false);
          this.focusScan();
        }
        break;
    }
  }

  voidAll(): void {
    this.clearCart();
    this.isVisibleAutoComppop.set(false);
    this.isVisibleRecall.set(false);
    this.isVisibleSearchModal.set(false);
    console.log('POS Voided/Reset');
  }

  holdPOS(): void {
    if (this.lines.length > 0) {
      console.log('POS Held');
      this.voidAll();
    } else {
      let closed = false;
      if (this.isVisibleRecall()) {
        this.isVisibleRecall.set(false);
        closed = true;
      }
      if (this.isVisibleSearchModal()) {
        this.isVisibleSearchModal.set(false);
        closed = true;
      }
      if (closed) {
        this.focusScan();
      }
    }
  }

  onRecallPopup(): void {
    this.isVisibleRecall.update((v) => !v);
    if (this.isVisibleRecall()) {
      this.isVisibleSearchModal.set(false);
      this.isVisibleAutoComppop.set(false);
      console.log('Recall Modal Opened');
    } else {
      this.focusScan();
    }
  }

  onItemSearchPopup(): void {
    this.isVisibleSearchModal.update((v) => !v);
    if (this.isVisibleSearchModal()) {
      this.isVisibleRecall.set(false);
      this.isVisibleAutoComppop.set(false);
      this.itemSearchQuery.set('');
      this.itemSearchResults.set([]);
      this.itemSearchSelectedIndex.set(0);
      // Ensure the modal is in the DOM before focusing
      setTimeout(() => {
        this.itemSearchInput()?.nativeElement?.focus();
      }, 50);

      // Fetch fresh items from the server
      this.itemsApi.list(1, 1000).subscribe({
        next: (res) => {
          this.allAvailableItems.set(res.items);
          this.updateSearchQuery(''); // Show all initial results
        },
      });
    } else {
      this.focusScan();
    }
  }

  updateSearchQuery(term: string): void {
    this.itemSearchQuery.set(term);
    this.itemSearchSelectedIndex.set(0);
    const all = this.allAvailableItems();
    if (!term.trim()) {
      this.itemSearchResults.set(all);
      return;
    }
    const frag = term.toLowerCase();
    const filtered = all.filter(
      (o) =>
        o.name.toLowerCase().includes(frag) ||
        o.barcode?.toLowerCase().includes(frag) ||
        o.title?.toLowerCase().includes(frag),
    );
    this.itemSearchResults.set(filtered);
  }

  selectSearchResult(item: ItemDTO): void {
    this.itemsApi.getWithBatches(item.id).subscribe({
      next: (dto) => {
        this.applyScanAfterResolve(posHitFromItemWithBatches(dto));
        this.isVisibleSearchModal.set(false);
        this.focusScan();
      },
      error: (err: HttpErrorResponse) => {
        this.scanError.set(this.msgHttp(err));
        /**
         * Fallback: If deep resolution fails, try local catalog resolve (offline support).
         * This uses the barcode/SKU from the selected item DTO.
         */
        const local = this.catalog.resolveScan(item.barcode || item.name);
        if (local) {
          this.applyScanAfterResolve(local);
          this.isVisibleSearchModal.set(false);
          this.focusScan();
        }
      },
    });
  }

  /** When true, new scans add/remove return lines; sale lines are grouped above returns. */
  salesReturnMode = false;

  /**
   * GST % on POS subtotal (ex GST). Line rates and amounts exclude GST; GST is shown and charged separately.
   * Replace with settings or API when available.
   */
  readonly posGstRatePercent = 17;

  private orderSnapshot: string[] = [];

  readonly scanError = signal<string | null>(null);
  /** Last resolved scan (name + Sale/Return); shown in fixed-height field so layout does not jump. */
  readonly selectedItemLabel = signal('');

  readonly netTotal = signal(0);
  readonly dataJson = signal('');

  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);

  loadNextVoucherNumber(type = 'POS'): void {
    if (this.isEditMode()) return;
    this.txApi.getNextVoucherNumber(type).subscribe({
      next: (res: any) => {
        // Handle object { voucherNumber: "..." } or { VoucherNumber: "..." } or plain string "..."
        const val = res?.voucherNumber || res?.VoucherNumber || (typeof res === 'string' ? res : '');
        if (val) {
          this.voucherNumber.set(val);
        }
      },
      error: (err: HttpErrorResponse) => console.error('Failed to fetch voucher number', err),
    });
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId && !Number.isNaN(Number(routeId))) {
      this.isEditMode.set(true);
      this.transactionId.set(Number(routeId));
      this.loadTransaction(Number(routeId));
    } else {
      this.loadNextVoucherNumber();
    }
    this.loadLedgersAndConfigs();

    this.lines.valueChanges
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.lineGroups.forEach((g) => this.recalcAmount(g));
        this.refreshNetTotal();
      });

    this.form.valueChanges
      .pipe(startWith(null), debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncDataJson());

    this.syncDataJson();

    this.form
      .get('paymentMethod')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((m) => {
        if (m === 'card') {
          this.form.patchValue({ receivedAmount: this.grandTotalIncGst() }, { emitEvent: false });
        }
      });
  }

  loadTransaction(id: number): void {
    this.txApi.getById(id).subscribe({
      next: (tx: any) => {
        this.voucherNumber.set(tx.voucherNumber);

        // Robust ledger patching: Header is Debit (Customer/Cash), Lines are Credit (Sales)
        const headerChild = tx.childTransactions?.find((c: any) => ['Debit', 'Dr'].includes(c.ledgerEntryType));
        if (headerChild) {
          this.form.patchValue({ drLedgerId: headerChild.ledgerId });
        }

        const linesChildren = tx.childTransactions?.filter((c: any) => ['Credit', 'Cr'].includes(c.ledgerEntryType)) || [];
        if (linesChildren.length > 0) {
          this.form.patchValue({ crLedgerId: linesChildren[0].ledgerId });
        }

        this.lines.clear();
        linesChildren.forEach((line: any) => {
          const kind = line.inventoryType === 'In' ? 'return' : 'sale';
          const qty = line.quantity || 1;
          const rate = line.rate || 0;
          const fg = this.createLineGroup(
            kind,
            line.description || '',
            line.reference || '',
            rate,
            qty,
            line.itemId,
            line.inventoryBatchId
          );
          // Set amount explicitly
          fg.get('amount')?.patchValue(kind === 'return' ? -(qty * rate) : (qty * rate));
          this.lines.push(fg);
        });
      },
      error: () => this.saveError.set('Failed to load POS transaction for editing.')
    });
  }

  private loadLedgersAndConfigs(): void {
    // 1. Load Ledgers
    this.ledgersApi.list().subscribe({
      next: (ls) => this.allLedgers.set(ls),
    });

    // 2. Load Configs with Cache
    const CACHE_KEY = 'netledgers-pos-configs';
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      try {
        const configs = JSON.parse(cached) as ConfigurationDTO[];
        this.applyConfigs(configs);
        return;
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    this.configsApi.getConfigsByGroup('pos').subscribe({
      next: (configs) => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(configs));
        this.applyConfigs(configs);
      },
      error: (err) => console.error('Failed to load POS configs', err),
    });
  }

  private applyConfigs(configs: ConfigurationDTO[]): void {
    const dr = configs.find((c) => c.name === 'DR ledger');
    const cr = configs.find((c) => c.name === 'CR ledger');
    if (dr?.value) {
      this.form.patchValue({ drLedgerId: Number(dr.value) });
    }
    if (cr?.value) {
      this.form.patchValue({ crLedgerId: Number(cr.value) });
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.focusScan());
  }

  copyJson(): void {
    this.syncDataJson();
    void navigator.clipboard.writeText(this.dataJson());
  }

  get lines(): FormArray<FormGroup> {
    return this.form.get('lines') as FormArray<FormGroup>;
  }

  get lineGroups(): FormGroup[] {
    return this.lines.controls as FormGroup[];
  }

  trackByLineId(_index: number, line: FormGroup): string {
    return (line.get('id')?.value as string) ?? String(_index);
  }

  toggleSalesReturnMode(): void {
    if (!this.salesReturnMode) {
      this.orderSnapshot = this.lines.controls.map((c) => c.get('id')?.value as string);
      this.moveReturnLinesToBottom();
      this.salesReturnMode = true;
    } else {
      this.restoreLineOrder(this.orderSnapshot);
      this.salesReturnMode = false;
    }
  }

  private moveReturnLinesToBottom(): void {
    const groups = [...(this.lines.controls as FormGroup[])];
    const sales = groups.filter((g) => g.get('lineKind')?.value === 'sale');
    const returns = groups.filter((g) => g.get('lineKind')?.value === 'return');
    this.lines.clear();
    sales.forEach((g) => this.lines.push(g));
    returns.forEach((g) => this.lines.push(g));
  }

  private restoreLineOrder(snapshotIds: string[]): void {
    const current = [...(this.lines.controls as FormGroup[])];
    const byId = new Map(current.map((g) => [g.get('id')?.value as string, g]));
    const ordered: FormGroup[] = [];
    const used = new Set<string>();
    for (const id of snapshotIds) {
      const g = byId.get(id);
      if (g) {
        ordered.push(g);
        used.add(id);
      }
    }
    for (const g of current) {
      const id = g.get('id')?.value as string;
      if (id && !used.has(id)) {
        ordered.push(g);
      }
    }
    this.lines.clear();
    ordered.forEach((g) => this.lines.push(g));
  }

  onScanSubmit(event: Event): void {
    event.preventDefault();
    const raw = (this.form.get('scanInput')?.value ?? '').trim();
    this.scanError.set(null);
    if (!raw) {
      this.selectedItemLabel.set('');
      this.scanError.set('Enter a barcode or SKU.');
      return;
    }

    this.itemsApi.getByBarcode(raw).subscribe({
      next: (dto) => {
        this.applyScanAfterResolve(posHitFromItemWithBatches(dto));
      },
      error: (err: HttpErrorResponse) => {
        const local = this.catalog.resolveScan(raw);
        if (err.status === 404 && local) {
          this.applyScanAfterResolve(local);
          return;
        }
        this.selectedItemLabel.set('');
        if (err.status === 404) {
          this.scanError.set('No item found for this barcode.');
          return;
        }
        this.scanError.set(this.msgHttp(err));
      },
    });
  }

  private applyScanAfterResolve(hit: PosCatalogHit): void {
    this.scanError.set(null);
    const batch = hit.batchKey ?? getCurrentBatchWeekValue();
    if (this.salesReturnMode) {
      this.applyScanReturn(hit, batch);
    } else {
      this.applyScanSale(hit, batch);
    }
    this.form.patchValue({ scanInput: '' });
    this.selectedItemLabel.set(`${hit.itemName} · ${this.salesReturnMode ? 'Return' : 'Sale'}`);
    queueMicrotask(() => this.focusScan());
  }

  private msgHttp(err: HttpErrorResponse): string {
    const d = err.error as { detail?: string; title?: string; message?: string } | undefined;
    return d?.detail ?? d?.title ?? d?.message ?? err.message ?? 'Request failed';
  }

  /** Sale: merge into existing sale row for same item+batch or add line with qty 1. */
  private applyScanSale(hit: PosCatalogHit, batch: string): void {
    const idx = this.findLineIndex('sale', hit.itemName, batch);
    if (idx >= 0) {
      const line = this.lines.at(idx);
      const q = Number(line.get('qty')?.value) || 0;
      line.get('qty')?.patchValue(q + 1);
      return;
    }
    const line = this.createLineGroup('sale', hit.itemName, batch, hit.defaultRate, 1, hit.sku, hit.batchId);
    this.lines.push(line);
  }

  /**
   * Return: same merge rule as sale — if a return line already exists for item+batch, +1 qty;
   * otherwise add a single return line (no duplicate rows).
   */
  private applyScanReturn(hit: PosCatalogHit, batch: string): void {
    const idx = this.findLineIndex('return', hit.itemName, batch);
    if (idx >= 0) {
      const line = this.lines.at(idx);
      const q = Number(line.get('qty')?.value) || 0;
      line.get('qty')?.patchValue(q + 1);
      return;
    }
    const line = this.createLineGroup('return', hit.itemName, batch, hit.defaultRate, 1, hit.sku, hit.batchId);
    this.lines.push(line);
    this.moveReturnLinesToBottom();
  }

  private findLineIndex(kind: InvoiceLineKind, itemName: string, batch: string): number {
    return this.lineGroups.findIndex(
      (g) =>
        g.get('lineKind')?.value === kind &&
        g.get('itemName')?.value === itemName &&
        g.get('batch')?.value === batch,
    );
  }

  incrementQty(index: number): void {
    const line = this.lines.at(index);
    const q = Number(line.get('qty')?.value) || 0;
    line.get('qty')?.patchValue(q + 1);
  }

  decrementQty(index: number): void {
    const line = this.lines.at(index);
    const q = Number(line.get('qty')?.value) || 0;
    if (q <= 1) {
      this.lines.removeAt(index);
    } else {
      line.get('qty')?.patchValue(q - 1);
    }
  }

  removeRow(index: number): void {
    this.lines.removeAt(index);
  }

  recalcAmount(line: FormGroup): void {
    const qty = Number(line.get('qty')?.value) || 0;
    const rate = Number(line.get('rate')?.value) || 0;
    const kind = line.get('lineKind')?.value as InvoiceLineKind;
    const base = Math.round(qty * rate * 100) / 100;
    line.get('amount')?.patchValue(kind === 'return' ? -base : base, { emitEvent: false });
  }

  /** Remove line when qty is left invalid (avoids removing mid-typing on `input`). */
  onQtyBlur(line: FormGroup): void {
    const q = Number(line.get('qty')?.value);
    if (q <= 0 || Number.isNaN(q)) {
      const id = line.get('id')?.value as string;
      const idx = this.lineGroups.findIndex((g) => g.get('id')?.value === id);
      if (idx >= 0) {
        this.lines.removeAt(idx);
      }
      queueMicrotask(() => this.focusScan());
    }
  }

  private createLineGroup(
    kind: InvoiceLineKind,
    itemName: string,
    batch: string,
    rate: number,
    qty: number,
    itemId?: number | string,
    batchId?: number,
  ): FormGroup {
    const id = crypto.randomUUID();
    const line = this.fb.group({
      id: this.fb.nonNullable.control(id),
      lineKind: this.fb.nonNullable.control<InvoiceLineKind>(kind),
      itemName: this.fb.nonNullable.control(itemName),
      itemId: this.fb.control(itemId ?? null),
      batchId: this.fb.control(batchId ?? null),
      batch: this.fb.nonNullable.control(batch),
      qty: this.fb.nonNullable.control(qty),
      rate: this.fb.nonNullable.control(rate),
      amount: this.fb.control({ value: 0, disabled: true }),
    });
    this.recalcAmount(line);
    return line;
  }

  private refreshNetTotal(): void {
    let sum = 0;
    for (const g of this.lineGroups) {
      const a = Number(g.get('amount')?.value) || 0;
      sum += a;
    }
    this.netTotal.set(Math.round(sum * 100) / 100);
    if (this.form.get('paymentMethod')?.value === 'card') {
      this.form.patchValue({ receivedAmount: this.grandTotalIncGst() }, { emitEvent: false });
    }
  }

  private syncDataJson(): void {
    this.dataJson.set(JSON.stringify(this.buildJsonPayload(), null, 2));
  }

  batchLabel(value: string | null | undefined): string {
    if (value == null || value === '') {
      return '';
    }
    return BATCH_WEEK_SELECT_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }

  isReturnLine(line: FormGroup): boolean {
    return line.get('lineKind')?.value === 'return';
  }

  clearCart(): void {
    this.lines.clear();
    this.scanError.set(null);
    this.selectedItemLabel.set('');
    this.form.patchValue({ paymentMethod: 'cash', receivedAmount: null });
    this.loadNextVoucherNumber();
    queueMicrotask(() => this.focusScan());
  }

  /** GST on current subtotal (ex GST). */
  gstAmount(): number {
    const base = this.netTotal();
    return Math.round(base * (this.posGstRatePercent / 100) * 100) / 100;
  }

  /** Total payable including GST. */
  grandTotalIncGst(): number {
    return Math.round((this.netTotal() + this.gstAmount()) * 100) / 100;
  }

  /** Amount due (total including GST). */
  paidAmount(): number {
    return this.grandTotalIncGst();
  }

  /** Change to give back for cash; 0 for card. */
  balanceToReturn(): number {
    const due = this.grandTotalIncGst();
    const method = this.form.get('paymentMethod')?.value;
    if (method !== 'cash') {
      return 0;
    }
    const raw = this.form.get('receivedAmount')?.value;
    const rec = raw == null ? NaN : Number(raw);
    if (Number.isNaN(rec)) {
      return 0;
    }
    return Math.max(0, Math.round((rec - due) * 100) / 100);
  }

  focusPaymentPanel(): void {
    queueMicrotask(() => this.paymentRadioCard()?.nativeElement?.focus({ preventScroll: true }));
  }

  onPaymentRadioKeydown(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key !== 'Enter') {
      return;
    }
    ke.preventDefault();
    this.focusReceivedOrPrint();
  }

  private focusReceivedOrPrint(): void {
    queueMicrotask(() => this.receivedAmountInput()?.nativeElement?.focus({ preventScroll: true }));
  }

  onBarcodeScanKeydown(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key === 'NumpadAdd') {
      ke.preventDefault();
      this.focusPaymentPanel();
    }
  }

  onReceivedKeydown(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key !== 'Enter') {
      return;
    }
    ke.preventDefault();
    this.printBill();
  }

  printBill(): void {
    if (this.lineGroups.length === 0) {
      this.saveError.set('Cart is empty.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    const payload = this.buildJsonPayload();

    const obs$ = this.isEditMode() && this.transactionId()
      ? this.txApi.update(this.transactionId()!, payload)
      : this.txApi.createPos(payload);

    obs$.subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        const vn = this.isEditMode() ? this.voucherNumber() : res.voucherNumber;
        this.proceedToPrint(payload, vn);
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.saveError.set(this.msgHttp(err));
      },
    });
  }

  private proceedToPrint(txPayload: CreateTransactionRequest, voucherNumber: string): void {
    const printPayload: PosPrintPayload = {
      voucherNumber,
      printedAt: new Date().toISOString(),
      company: { ...DEFAULT_POS_COMPANY_PRINT },
      lines: this.lineGroups.map((g) => {
        const v = g.getRawValue() as InvoiceLineJson;
        return {
          lineKind: (v.lineKind ?? 'sale') as 'sale' | 'return',
          itemName: v.itemName,
          qty: Number(v.qty),
          rate: Number(v.rate),
          amount: Number(v.amount),
        };
      }),
      netTotal: this.netTotal(),
      gstRatePercent: this.posGstRatePercent,
      gstAmount: this.gstAmount(),
      totalIncGst: this.grandTotalIncGst(),
      paymentMethod: this.form.get('paymentMethod')?.value ?? 'cash',
      paidAmount: this.paidAmount(),
      receivedAmount: this.receivedAmountForPrint(),
      balanceToReturn: this.balanceToReturn(),
    };
    sessionStorage.setItem(POS_PRINT_STORAGE_KEY, JSON.stringify(printPayload));
    void this.router.navigate(['/print/pos-receipt']);
  }

  isCardPayment(): boolean {
    return this.form.get('paymentMethod')?.value === 'card';
  }

  receivedAmountForPrint(): number {
    if (this.isCardPayment()) {
      return this.grandTotalIncGst();
    }
    const raw = this.form.get('receivedAmount')?.value;
    if (raw == null) {
      return 0;
    }
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }

  focusScan(): void {
    const el = this.barcodeInput()?.nativeElement;
    el?.focus({ preventScroll: true });
    el?.select?.();
  }

  buildJsonPayload(): CreateTransactionRequest {
    const lines = this.lineGroups.map((g) => g.getRawValue());
    const now = new Date();
    const isoDate = now.toISOString();
    const voucherNumber = this.voucherNumber();

    const childTransactions: CreateChildTransactionRequest[] = [
      {
        description: 'Sales invoice total',
        ledgerId: Number(this.form.get('drLedgerId')?.value || 2),
        ledgerEntryType: 'Debit',
        ledgerAmount: this.netTotal(),
      },
    ];

    for (const v of lines) {
      childTransactions.push({
        description: v.itemName,
        reference: v.batch,
        ledgerId: Number(this.form.get('crLedgerId')?.value || 3),
        ledgerEntryType: 'Credit',
        ledgerAmount: Math.abs(Number(v.amount)),
        inventoryBatchId: v.batchId ? Number(v.batchId) : null,
        inventoryType: v.lineKind === 'return' ? 'In' : 'Out',
        itemId: String(v.itemId ?? ''),
        quantity: Number(v.qty),
        rate: Number(v.rate),
      });
    }

    return {
      voucherNumber,
      type: 'POS',
      date: isoDate,
      description: `Sales invoice ${voucherNumber}`,
      childTransactions,
    };
  }
}
