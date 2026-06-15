import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import { PurchaseOrdersApiService } from '../../../../core/api/purchase-orders-api.service';
import { UnitsApiService } from '../../../../core/api/units-api.service';
import type { BatchDTO, LookupDTO, UnitOfMeasureDTO } from '../../../../core/api/erp-api.models';
import { PO_STATUS_OPTIONS } from '../purchase-order-status';
import { apiErrorMessage, lineAmountPreview, parseNextPoNumber } from '../purchase-order.util';

@Component({
  standalone: true,
  selector: 'app-po-form-page',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, DatePicker, Select, Button],
  templateUrl: './po-form-page.component.html',
  styleUrl: './po-form-page.component.css',
})
export class PoFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PurchaseOrdersApiService);
  private readonly lookups = inject(LookupsApiService);
  private readonly unitsApi = inject(UnitsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly poId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusOptions = PO_STATUS_OPTIONS;

  readonly vendorOptions = signal<{ label: string; value: number }[]>([]);
  readonly itemOptions = signal<{ label: string; value: number }[]>([]);
  readonly unitOptions = signal<{ label: string; value: number }[]>([]);
  readonly batchOptionsByLine = signal<Map<number, { label: string; value: number }[]>>(new Map());

  private readonly vendorSearch$ = new Subject<string>();
  private readonly itemSearch$ = new Subject<string>();

  readonly form = this.fb.group({
    poNumber: [{ value: '', disabled: true }],
    orderDate: this.fb.control<Date | null>(new Date(), Validators.required),
    expectedDeliveryDate: this.fb.control<Date | null>(null),
    vendorLedgerId: this.fb.control<number | null>(null, Validators.required),
    status: this.fb.control('Draft', Validators.required),
    reference: [''],
    notes: [''],
    deliveryAddress: [''],
    lines: this.fb.array<FormGroup>([]),
  });

  get lines(): FormArray<FormGroup> {
    return this.form.get('lines') as FormArray<FormGroup>;
  }

  get lineGroups(): FormGroup[] {
    return this.lines.controls as FormGroup[];
  }

  ngOnInit(): void {
    this.unitsApi.list().subscribe({
      next: (units: UnitOfMeasureDTO[]) => {
        this.unitOptions.set(
          units.filter((u) => u.isActive).map((u) => ({ label: `${u.code} — ${u.name}`, value: u.id })),
        );
      },
      error: () => this.unitOptions.set([]),
    });

    this.vendorSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.lookups.listLedgers(q).pipe(catchError(() => of([] as LookupDTO[])))),
      )
      .subscribe((rows) => {
        this.vendorOptions.set(rows.map((l) => ({ label: l.name, value: l.id })));
      });

    this.itemSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.lookups.listItems(q).pipe(catchError(() => of([] as LookupDTO[])))),
      )
      .subscribe((rows) => {
        this.itemOptions.set(rows.map((i) => ({ label: i.name, value: i.id })));
      });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new' && !Number.isNaN(Number(idParam))) {
      this.isEdit.set(true);
      this.poId.set(Number(idParam));
      this.loadPo(Number(idParam));
    } else {
      this.loadNextNumber();
      this.addLine();
    }

    this.vendorSearch$.next('');
    this.itemSearch$.next('');
  }

  onVendorFilter(ev: { filter?: string }): void {
    this.vendorSearch$.next(ev.filter ?? '');
  }

  onItemFilter(ev: { filter?: string }): void {
    this.itemSearch$.next(ev.filter ?? '');
  }

  onItemChange(lineIndex: number, itemId: number | null): void {
    if (itemId == null) {
      this.patchBatchOptions(lineIndex, []);
      this.lines.at(lineIndex)?.patchValue({ itemBatchId: null });
      return;
    }
    this.lookups.listItemBatches(itemId).subscribe({
      next: (batches: BatchDTO[]) => {
        const opts = batches.map((b) => ({
          label: b.batchNumber || `Batch #${b.id}`,
          value: b.id,
        }));
        this.patchBatchOptions(lineIndex, opts);
      },
      error: () => this.patchBatchOptions(lineIndex, []),
    });
  }

  private patchBatchOptions(lineIndex: number, opts: { label: string; value: number }[]): void {
    const m = new Map(this.batchOptionsByLine());
    m.set(lineIndex, opts);
    this.batchOptionsByLine.set(m);
  }

  batchOptionsFor(lineIndex: number): { label: string; value: number }[] {
    return this.batchOptionsByLine().get(lineIndex) ?? [];
  }

  linePreview(g: FormGroup): number {
    const v = g.getRawValue();
    return lineAmountPreview(Number(v.quantity) || 0, Number(v.unitPrice) || 0, Number(v.taxAmount) || 0);
  }

  formSubTotal(): number {
    return this.lineGroups.reduce((s, g) => s + this.linePreview(g), 0);
  }

  formTaxTotal(): number {
    return this.lineGroups.reduce((s, g) => s + (Number(g.get('taxAmount')?.value) || 0), 0);
  }

  addLine(): void {
    const n = this.lines.length + 1;
    this.lines.push(this.createLineGroup(n));
  }

  removeLine(index: number): void {
    if (this.lines.length <= 1) {
      return;
    }
    this.lines.removeAt(index);
    this.renumberLines();
    const m = new Map<number, { label: string; value: number }[]>();
    this.batchOptionsByLine().forEach((opts, i) => {
      if (i < index) {
        m.set(i, opts);
      } else if (i > index) {
        m.set(i - 1, opts);
      }
    });
    this.batchOptionsByLine.set(m);
  }

  private renumberLines(): void {
    this.lines.controls.forEach((g, i) => g.patchValue({ lineNumber: i + 1 }));
  }

  private createLineGroup(lineNumber: number): FormGroup {
    return this.fb.group({
      lineNumber: [lineNumber],
      itemId: [null as number | null, Validators.required],
      itemBatchId: [null as number | null],
      unitOfMeasureId: [null as number | null],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(0.0001)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      taxAmount: [0, [Validators.min(0)]],
    });
  }

  private loadNextNumber(): void {
    this.api.getNextNumber().subscribe({
      next: (raw) => this.form.patchValue({ poNumber: parseNextPoNumber(raw) }),
      error: () => {},
    });
  }

  private loadPo(id: number): void {
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (po) => {
        this.form.patchValue({
          poNumber: po.poNumber,
          orderDate: new Date(po.orderDate),
          expectedDeliveryDate: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate) : null,
          vendorLedgerId: po.vendorLedgerId,
          status: po.status,
          reference: po.reference ?? '',
          notes: po.notes ?? '',
          deliveryAddress: po.deliveryAddress ?? '',
        });
        this.vendorOptions.set([{ label: `${po.vendorName} (${po.vendorCode})`, value: po.vendorLedgerId }]);
        this.lines.clear();
        po.lines.forEach((line, idx) => {
          this.lines.push(this.createLineGroup(line.lineNumber));
          const g = this.lines.at(idx)!;
          g.patchValue({
            lineNumber: line.lineNumber,
            itemId: line.itemId,
            itemBatchId: line.itemBatchId,
            unitOfMeasureId: line.unitOfMeasureId,
            description: line.description ?? '',
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxAmount: line.taxAmount,
          });
          this.itemOptions.update((opts) => {
            const next = [...opts];
            if (!next.some((o) => o.value === line.itemId)) {
              next.push({ label: line.itemTitle, value: line.itemId });
            }
            return next;
          });
          if (line.itemId) {
            this.onItemChange(idx, line.itemId);
          }
        });
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    void this.router.navigateByUrl('/app/inventory-transactions/po');
  }

  submit(): void {
    if (this.form.invalid || this.lines.length === 0) {
      this.form.markAllAsTouched();
      if (this.lines.length === 0) {
        this.addLine();
      }
      return;
    }
    const v = this.form.getRawValue();
    const lines = this.lines.controls.map((g) => {
      const lv = g.getRawValue();
      return {
        lineNumber: lv.lineNumber as number,
        itemId: lv.itemId as number,
        itemBatchId: lv.itemBatchId as number | null,
        unitOfMeasureId: lv.unitOfMeasureId as number | null,
        description: (lv.description as string)?.trim() || null,
        quantity: Number(lv.quantity),
        unitPrice: Number(lv.unitPrice),
        taxAmount: Number(lv.taxAmount) || 0,
      };
    });

    this.saving.set(true);
    this.error.set(null);

    if (this.isEdit() && this.poId() != null) {
      this.api
        .update(this.poId()!, {
          orderDate: v.orderDate ? new Date(v.orderDate).toISOString() : undefined,
          vendorLedgerId: v.vendorLedgerId!,
          expectedDeliveryDate: v.expectedDeliveryDate
            ? new Date(v.expectedDeliveryDate).toISOString()
            : null,
          reference: v.reference?.trim() || null,
          notes: v.notes?.trim() || null,
          deliveryAddress: v.deliveryAddress?.trim() || null,
          status: v.status,
          lines,
        })
        .subscribe({
          next: () => void this.router.navigateByUrl('/app/inventory-transactions/po'),
          error: (e) => {
            this.error.set(apiErrorMessage(e));
            this.saving.set(false);
          },
        });
    } else {
      const poNumber = String(this.form.getRawValue().poNumber ?? '').trim();
      if (!poNumber) {
        this.error.set('PO number is required. Refresh the page to load the next number.');
        this.saving.set(false);
        return;
      }
      this.api
        .create({
          poNumber,
          orderDate: v.orderDate ? new Date(v.orderDate).toISOString() : undefined,
          vendorLedgerId: v.vendorLedgerId!,
          expectedDeliveryDate: v.expectedDeliveryDate
            ? new Date(v.expectedDeliveryDate).toISOString()
            : null,
          reference: v.reference?.trim() || null,
          notes: v.notes?.trim() || null,
          deliveryAddress: v.deliveryAddress?.trim() || null,
          status: v.status,
          lines,
        })
        .subscribe({
          next: () => void this.router.navigateByUrl('/app/inventory-transactions/po'),
          error: (e) => {
            this.error.set(apiErrorMessage(e));
            this.saving.set(false);
          },
        });
    }
  }
}
