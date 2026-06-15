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
import { DeliveryNotesApiService } from '../../../../core/api/delivery-notes-api.service';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import { QuotationsApiService } from '../../../../core/api/quotations-api.service';
import { UnitsApiService } from '../../../../core/api/units-api.service';
import type { BatchDTO, LookupDTO, QuotationListItemDto, UnitOfMeasureDTO } from '../../../../core/api/erp-api.models';
import { DELIVERY_NOTE_STATUS_OPTIONS } from '../delivery-note-status';
import { apiErrorMessage, lineAmountPreview, parseNextDocNumber } from '../delivery-note.util';

@Component({
  standalone: true,
  selector: 'app-dn-form-page',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, DatePicker, Select, Button],
  templateUrl: './dn-form-page.component.html',
  styleUrl: './dn-form-page.component.css',
})
export class DnFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DeliveryNotesApiService);
  private readonly quotationsApi = inject(QuotationsApiService);
  private readonly lookups = inject(LookupsApiService);
  private readonly unitsApi = inject(UnitsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly dnId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusOptions = DELIVERY_NOTE_STATUS_OPTIONS;

  readonly customerOptions = signal<{ label: string; value: number }[]>([]);
  readonly quotationOptions = signal<{ label: string; value: number }[]>([]);
  readonly itemOptions = signal<{ label: string; value: number }[]>([]);
  readonly unitOptions = signal<{ label: string; value: number }[]>([]);
  readonly batchOptionsByLine = signal<Map<number, { label: string; value: number }[]>>(new Map());

  private readonly customerSearch$ = new Subject<string>();
  private readonly itemSearch$ = new Subject<string>();

  readonly form = this.fb.group({
    dnNumber: [{ value: '', disabled: true }],
    deliveryDate: this.fb.control<Date | null>(new Date(), Validators.required),
    customerLedgerId: this.fb.control<number | null>(null, Validators.required),
    quotationId: [null as number | null],
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

    this.quotationsApi.list().subscribe({
      next: (rows: QuotationListItemDto[]) => {
        this.quotationOptions.set(
          rows.map((q) => ({ label: `${q.quotationNumber} — ${q.customerName}`, value: q.id })),
        );
      },
      error: () => this.quotationOptions.set([]),
    });

    this.customerSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.lookups.listLedgers(q).pipe(catchError(() => of([] as LookupDTO[])))),
      )
      .subscribe((rows) => {
        this.customerOptions.set(rows.map((l) => ({ label: l.name, value: l.id })));
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
      this.dnId.set(Number(idParam));
      this.loadDn(Number(idParam));
    } else {
      this.loadNextNumber();
      this.addLine();
    }

    this.customerSearch$.next('');
    this.itemSearch$.next('');
  }

  onCustomerFilter(ev: { filter?: string }): void {
    this.customerSearch$.next(ev.filter ?? '');
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
        this.patchBatchOptions(
          lineIndex,
          batches.map((b) => ({ label: b.batchNumber || `Batch #${b.id}`, value: b.id })),
        );
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
    this.lines.push(this.createLineGroup(this.lines.length + 1));
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
      next: (raw) => this.form.patchValue({ dnNumber: parseNextDocNumber(raw) }),
      error: () => {},
    });
  }

  private loadDn(id: number): void {
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (dn) => {
        this.form.patchValue({
          dnNumber: dn.dnNumber,
          deliveryDate: new Date(dn.deliveryDate),
          customerLedgerId: dn.customerLedgerId,
          quotationId: dn.quotationId ?? null,
          status: dn.status,
          reference: dn.reference ?? '',
          notes: dn.notes ?? '',
          deliveryAddress: dn.deliveryAddress ?? '',
        });
        this.customerOptions.set([
          { label: `${dn.customerName} (${dn.customerCode})`, value: dn.customerLedgerId },
        ]);
        this.lines.clear();
        dn.lines.forEach((line, idx) => {
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
    void this.router.navigateByUrl('/erp/inventory-transactions/delivery-notes');
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

    const bodyBase = {
      deliveryDate: v.deliveryDate ? new Date(v.deliveryDate).toISOString() : undefined,
      customerLedgerId: v.customerLedgerId!,
      quotationId: v.quotationId,
      reference: v.reference?.trim() || null,
      notes: v.notes?.trim() || null,
      deliveryAddress: v.deliveryAddress?.trim() || null,
      status: v.status,
      lines,
    };

    if (this.isEdit() && this.dnId() != null) {
      this.api.update(this.dnId()!, bodyBase).subscribe({
        next: () => void this.router.navigateByUrl('/erp/inventory-transactions/delivery-notes'),
        error: (e) => {
          this.error.set(apiErrorMessage(e));
          this.saving.set(false);
        },
      });
    } else {
      const dnNumber = String(this.form.getRawValue().dnNumber ?? '').trim();
      if (!dnNumber) {
        this.error.set('DN number is required.');
        this.saving.set(false);
        return;
      }
      this.api.create({ dnNumber, ...bodyBase }).subscribe({
        next: () => void this.router.navigateByUrl('/erp/inventory-transactions/delivery-notes'),
        error: (e) => {
          this.error.set(apiErrorMessage(e));
          this.saving.set(false);
        },
      });
    }
  }
}
