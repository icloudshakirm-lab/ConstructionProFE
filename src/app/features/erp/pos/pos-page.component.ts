import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, startWith } from 'rxjs';
import { InvoiceLineJson, InvoiceLineKind } from '../invoices/models/sales-invoice.model';
import { ItemsApiService } from '../../../core/api/items-api.service';
import {
  BATCH_WEEK_SELECT_OPTIONS,
  getCurrentBatchWeekValue,
} from '../../../shared/data/batch-week-options';
import {
  PosCatalogService,
  posHitFromItemWithBatches,
  type PosCatalogHit,
} from './pos-catalog.service';
import {
  DEFAULT_POS_COMPANY_PRINT,
  POS_PRINT_STORAGE_KEY,
  type PosPrintPayload,
} from './pos-print.models';

@Component({
  selector: 'app-pos-page',
  imports: [DecimalPipe, ReactiveFormsModule],
  templateUrl: './pos-page.component.html',
  styleUrl: './pos-page.component.css',
})
export class PosPageComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(PosCatalogService);
  private readonly itemsApi = inject(ItemsApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly barcodeInput = viewChild<ElementRef<HTMLInputElement>>('barcodeInput');
  readonly paymentRadioCard = viewChild<ElementRef<HTMLInputElement>>('paymentRadioCard');
  readonly receivedAmountInput = viewChild<ElementRef<HTMLInputElement>>('receivedAmountInput');

  readonly form = this.fb.group({
    scanInput: this.fb.nonNullable.control(''),
    lines: this.fb.array<FormGroup>([]),
    /** `card` | `cash` — drives payment panel and keyboard flow. */
    paymentMethod: this.fb.nonNullable.control<'card' | 'cash'>('cash'),
    /** Cash tendered; ignored for card (paid = net). */
    receivedAmount: this.fb.control<number | null>(null),
  });

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

  ngOnInit(): void {
    this.lines.valueChanges
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.lineGroups.forEach((g) => this.recalcAmount(g));
        this.refreshNetTotal();
      });

    this.lines.valueChanges
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
  private applyScanSale(hit: { itemName: string; defaultRate: number }, batch: string): void {
    const idx = this.findLineIndex('sale', hit.itemName, batch);
    if (idx >= 0) {
      const line = this.lines.at(idx);
      const q = Number(line.get('qty')?.value) || 0;
      line.get('qty')?.patchValue(q + 1);
      return;
    }
    const line = this.createLineGroup('sale', hit.itemName, batch, hit.defaultRate, 1);
    this.lines.push(line);
  }

  /**
   * Return: same merge rule as sale — if a return line already exists for item+batch, +1 qty;
   * otherwise add a single return line (no duplicate rows).
   */
  private applyScanReturn(hit: { itemName: string; defaultRate: number }, batch: string): void {
    const idx = this.findLineIndex('return', hit.itemName, batch);
    if (idx >= 0) {
      const line = this.lines.at(idx);
      const q = Number(line.get('qty')?.value) || 0;
      line.get('qty')?.patchValue(q + 1);
      return;
    }
    const line = this.createLineGroup('return', hit.itemName, batch, hit.defaultRate, 1);
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
  ): FormGroup {
    const id = crypto.randomUUID();
    const line = this.fb.group({
      id: this.fb.nonNullable.control(id),
      lineKind: this.fb.nonNullable.control<InvoiceLineKind>(kind),
      itemName: this.fb.nonNullable.control(itemName),
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
    const payload: PosPrintPayload = {
      voucherNumber: '',
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
    sessionStorage.setItem(POS_PRINT_STORAGE_KEY, JSON.stringify(payload));
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

  private focusScan(): void {
    const el = this.barcodeInput()?.nativeElement;
    el?.focus({ preventScroll: true });
    el?.select?.();
  }

  buildJsonPayload(): {
    lines: InvoiceLineJson[];
    netTotal: number;
    gstRatePercent: number;
    gstAmount: number;
    totalIncGst: number;
  } {
    const lines: InvoiceLineJson[] = this.lineGroups.map((g) => {
      const v = g.getRawValue() as InvoiceLineJson;
      return {
        id: v.id,
        lineKind: v.lineKind ?? 'sale',
        itemName: v.itemName,
        batch: v.batch ?? '',
        qty: Number(v.qty),
        rate: Number(v.rate),
        amount: Number(v.amount),
      };
    });
    return {
      lines,
      netTotal: this.netTotal(),
      gstRatePercent: this.posGstRatePercent,
      gstAmount: this.gstAmount(),
      totalIncGst: this.grandTotalIncGst(),
    };
  }
}
