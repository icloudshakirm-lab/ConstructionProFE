import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { InvoiceLineJson, InvoiceLineKind } from '../../../features/erp/invoices/models/sales-invoice.model';
import {
  BATCH_WEEK_SELECT_OPTIONS,
  BatchWeekSelectOption,
  getCurrentBatchWeekValue,
} from '../../data/batch-week-options';
import { LookupsApiService } from '../../../core/api/lookups-api.service';
import { BatchDTO, LookupDTO } from '../../../core/api/erp-api.models';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-invoice-items-table',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, Select],
  templateUrl: './invoice-items-table.component.html',
  styles: [
    `
      :host {
        display: block;
      }
      :host ::ng-deep .invoice-item-p-select.p-select,
      :host ::ng-deep .invoice-item-p-select {
        width: 100%;
        min-height: unset;
      }
      :host ::ng-deep .invoice-item-p-select .p-select-label,
      :host ::ng-deep .invoice-item-p-select .p-placeholder {
        padding-block: 0.25rem;
        padding-inline: 0.5rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
      :host ::ng-deep .invoice-item-p-select .p-select-dropdown {
        width: 1.75rem;
      }
      :host ::ng-deep .invoice-item-p-select .p-select-clear-icon {
        scale: 0.85;
      }
      :host ::ng-deep .invoice-batch-p-select.p-select,
      :host ::ng-deep .invoice-batch-p-select {
        width: 100%;
        min-height: unset;
      }
      :host ::ng-deep .invoice-batch-p-select .p-select-label,
      :host ::ng-deep .invoice-batch-p-select .p-placeholder {
        padding-block: 0.25rem;
        padding-inline: 0.5rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
      :host ::ng-deep .invoice-batch-p-select .p-select-dropdown {
        width: 1.75rem;
      }
    `,
  ],
})
export class InvoiceItemsTableComponent implements OnInit, OnDestroy {
  @Input({ required: true }) lines!: FormArray<FormGroup>;

  private readonly fb = inject(FormBuilder);
  private readonly lookups = inject(LookupsApiService);
  private readonly destroyRef = inject(DestroyRef);

  /** When true, new lines are returns; existing return rows are grouped at the bottom. */
  salesReturnMode = false;

  /** Order of line ids captured before entering Sales return mode (restored when toggled off). */
  private orderSnapshot: string[] = [];

  /** Typed view of line controls for the template. */
  get lineGroups(): FormGroup[] {
    return this.lines.controls as FormGroup[];
  }

  /** Line `id` currently in edit mode (new lines start editable). */
  editingLineId: string | null = null;

  private readonly backup = new Map<string, InvoiceLineJson>();

  readonly itemOptions = signal<Array<{ label: string; value: number; name: string }>>([]);
  private readonly itemNameSearch$ = new Subject<string>();
  private readonly itemNameById = new Map<number, string>();

  private readonly defaultBatchOptions: Array<{ label: string; value: string | number }> = BATCH_WEEK_SELECT_OPTIONS;
  private readonly lineBatchesMap = signal(new Map<string, BatchDTO[]>());

  getLineBatchOptions(line: FormGroup): Array<{ label: string; value: string | number }> {
    const id = line.get('id')?.value as string;
    const batches = this.lineBatchesMap().get(id);
    if (!batches || batches.length === 0) {
      return this.defaultBatchOptions;
    }
    return batches.map((b) => ({
      label: `${b.batchNumber} (Qty: ${b.availableQuantity ?? 0})`,
      value: b.id,
    }));
  }

  ngOnInit(): void {
    this.itemNameSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q: string | null) =>
          this.lookups.listItems(q).pipe(
            catchError(() => of([] as LookupDTO[])),
          ),
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((rows: LookupDTO[]) => {
        const results = (rows ?? []).map((r) => ({ label: r.name, value: r.id, name: r.name }));

        // Preserve all currently assigned items in the table to ensure labels are visible
        this.lines.controls.forEach(group => {
          const id = group.get('itemId')?.value;
          const name = group.get('itemName')?.value;
          if (id && name && !results.some(r => r.value === id)) {
            results.push({ label: name, value: id, name });
          }
        });

        this.itemOptions.set(results);
        results.forEach((o) => this.itemNameById.set(o.value, o.name));
      });

    this.itemNameSearch$.next('');

    if (this.lines.length === 0) {
      this.addRow();
    }
  }

  ngOnDestroy(): void {
    this.backup.clear();
    this.lineBatchesMap().clear();
  }

  trackByLineId(_index: number, line: FormGroup): string {
    return line.get('id')?.value ?? String(_index);
  }

  onItemFilter(e: any): void {
    const ev = e as { filter?: string; value?: string };
    this.itemNameSearch$.next((ev.filter ?? ev.value ?? '').toString());
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

  /** Group `return` lines after all `sale` lines (bottom of grid). */
  private moveReturnLinesToBottom(): void {
    const groups = [...(this.lines.controls as FormGroup[])];
    const sales = groups.filter((g) => g.get('lineKind')?.value === 'sale');
    const returns = groups.filter((g) => g.get('lineKind')?.value === 'return');
    this.lines.clear();
    sales.forEach((g) => this.lines.push(g));
    returns.forEach((g) => this.lines.push(g));
  }

  /** Restore order from snapshot; any lines added after snapshot are kept at the end in stable order. */
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

  addRow(): void {
    const line = this.createLineGroup(true);
    this.lines.push(line);
    if (this.salesReturnMode) {
      this.moveReturnLinesToBottom();
    }
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
    const raw = line.getRawValue() as InvoiceLineJson;
    this.backup.set(id, { ...raw });
    this.editingLineId = id;

    const currentName = line.get('itemName')?.value;
    const itemId = line.get('itemId')?.value;

    // 1. Ensure the current item is in the options list immediately
    if (itemId && currentName) {
      this.itemOptions.update((opts) => {
        if (!opts.find((o) => o.value === itemId)) {
          return [...opts, { label: currentName, value: itemId, name: currentName }];
        }
        return opts;
      });
    }

    // 2. Trigger search for the current item name to ensure fresh lookup
    if (currentName) {
      this.itemNameSearch$.next(currentName);
    }

    // 3. Fetch batches for this item so the batch dropdown is populated
    if (itemId && !this.lineBatchesMap().has(id)) {
      this.lookups
        .listItemBatches(itemId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((rows) => {
          this.lineBatchesMap.update((m) => {
            m.set(id, rows ?? []);
            return new Map(m);
          });
        });
    }
  }

  saveEdit(line: FormGroup): void {
    const id = line.get('id')?.value as string;
    this.recalcAmount(line);
    this.backup.delete(id);
    this.editingLineId = null;
  }

  cancelEdit(line: FormGroup): void {
    const id = line.get('id')?.value as string;
    const prev = this.backup.get(id);
    if (prev) {
      line.patchValue({
        lineKind: prev.lineKind,
        itemName: prev.itemName,
        batch: prev.batch,
        batchId: prev.batchId,
        qty: prev.qty,
        rate: prev.rate,
      });
      this.recalcAmount(line);
    }
    this.backup.delete(id);
    this.editingLineId = null;
  }

  isEditing(line: FormGroup): boolean {
    return this.editingLineId === line.get('id')?.value;
  }

  isReturnLine(line: FormGroup): boolean {
    return line.get('lineKind')?.value === 'return';
  }

  batchLabel(line: FormGroup): string {
    const value = line.get('batchId')?.value;
    if (value == null || value === '') {
      return line.get('batch')?.value || '';
    }
    const options = this.getLineBatchOptions(line);
    return options.find((o) => o.value === value)?.label ?? line.get('batch')?.value ?? String(value);
  }

  recalcAmount(line: FormGroup): void {
    const qty = Number(line.get('qty')?.value) || 0;
    const rate = Number(line.get('rate')?.value) || 0;
    line.get('amount')?.patchValue(Math.round(qty * rate * 100) / 100, { emitEvent: false });
  }

  onItemChanged(line: FormGroup): void {
    const id = Number(line.get('itemId')?.value);
    const lineId = line.get('id')?.value as string;

    if (!Number.isFinite(id)) {
      line.get('itemName')?.patchValue('', { emitEvent: false });
      this.lineBatchesMap.update((m) => {
        m.delete(lineId);
        return new Map(m);
      });
      return;
    }

    const name = this.itemNameById.get(id) ?? '';
    line.get('itemName')?.patchValue(name, { emitEvent: false });

    // Fetch batches for this item
    this.lookups
      .listItemBatches(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.lineBatchesMap.update((m) => {
            m.set(lineId, rows ?? []);
            return new Map(m);
          });
          // Auto-select first batch if available, and sync 'batch' string + rate
          if (rows && rows.length > 0) {
            const first = rows[0];
            line.get('batchId')?.patchValue(first.id, { emitEvent: false });
            line.get('batch')?.patchValue(first.batchNumber, { emitEvent: false });
            if (first.defaultPrice != null && first.defaultPrice > 0) {
              line.get('rate')?.patchValue(first.defaultPrice, { emitEvent: false });
            }
            this.recalcAmount(line);
          } else {
            line.get('batchId')?.patchValue(null, { emitEvent: false });
            line.get('batch')?.patchValue('', { emitEvent: false });
          }
        },
        error: () => {
          this.lineBatchesMap.update((m) => {
            m.delete(lineId);
            return new Map(m);
          });
        },
      });
  }

  onBatchChanged(line: FormGroup): void {
    const batchId = line.get('batchId')?.value;
    const lineId = line.get('id')?.value as string;
    const batches = this.lineBatchesMap().get(lineId) || [];
    const batch = batches.find((b) => b.id === batchId);

    if (batch) {
      line.get('batch')?.patchValue(batch.batchNumber, { emitEvent: false });
      if (batch.defaultPrice != null && batch.defaultPrice > 0) {
        line.get('rate')?.patchValue(batch.defaultPrice, { emitEvent: false });
        this.recalcAmount(line);
      }
    } else {
      const options = this.getLineBatchOptions(line);
      const label = options.find((o) => o.value === batchId)?.label ?? '';
      line.get('batch')?.patchValue(label, { emitEvent: false });
    }
  }

  private createLineGroup(startInEdit: boolean): FormGroup {
    const id = crypto.randomUUID();
    const kind: InvoiceLineKind = this.salesReturnMode ? 'return' : 'sale';
    const line = this.fb.group({
      id: this.fb.nonNullable.control(id),
      lineKind: this.fb.nonNullable.control<InvoiceLineKind>(kind),
      itemId: this.fb.control<number | null>(null),
      itemName: this.fb.nonNullable.control(''),
      batch: this.fb.control<string | null>(getCurrentBatchWeekValue()),
      batchId: this.fb.control<number | null>(null),
      qty: this.fb.nonNullable.control(1),
      rate: this.fb.nonNullable.control(0),
      amount: this.fb.control({ value: 0, disabled: true }),
    });
    this.recalcAmount(line);
    if (startInEdit) {
      this.editingLineId = id;
    }
    return line;
  }
}
