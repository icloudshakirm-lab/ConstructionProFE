import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { DeliveryNotesApiService } from '../../../../core/api/delivery-notes-api.service';
import { QuotationsApiService } from '../../../../core/api/quotations-api.service';
import type { QuotationListItemDto } from '../../../../core/api/erp-api.models';
import { DELIVERY_NOTE_STATUS_OPTIONS } from '../delivery-note-status';
import { apiErrorMessage, parseNextDocNumber } from '../delivery-note.util';

@Component({
  standalone: true,
  selector: 'app-dn-from-quotation-dialog',
  imports: [ReactiveFormsModule, Dialog, DatePicker, Select, Button],
  templateUrl: './dn-from-quotation-dialog.component.html',
})
export class DnFromQuotationDialogComponent implements OnInit {
  private readonly dnApi = inject(DeliveryNotesApiService);
  private readonly quotationsApi = inject(QuotationsApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<void>();

  readonly quotationOptions = signal<{ label: string; value: number }[]>([]);
  readonly statusOptions = DELIVERY_NOTE_STATUS_OPTIONS;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    quotationId: [null as number | null],
    dnNumber: [''],
    deliveryDate: this.fb.control<Date | null>(new Date()),
    status: ['Draft'],
    reference: [''],
    notes: [''],
    deliveryAddress: [''],
  });

  ngOnInit(): void {
    this.quotationsApi.list().subscribe({
      next: (rows: QuotationListItemDto[]) => {
        this.quotationOptions.set(
          rows.map((q) => ({
            label: `${q.quotationNumber} — ${q.customerName}`,
            value: q.id,
          })),
        );
      },
      error: () => this.quotationOptions.set([]),
    });

    this.dnApi.getNextNumber().subscribe({
      next: (raw) => this.form.patchValue({ dnNumber: parseNextDocNumber(raw) }),
      error: () => {},
    });
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
    if (!open) {
      this.error.set(null);
      this.saving.set(false);
    }
  }

  submit(): void {
    const qid = this.form.get('quotationId')?.value;
    if (qid == null) {
      this.error.set('Select a quotation.');
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.dnApi
      .createFromQuotation(qid, {
        dnNumber: v.dnNumber?.trim() || null,
        deliveryDate: v.deliveryDate ? new Date(v.deliveryDate).toISOString() : null,
        reference: v.reference?.trim() || null,
        notes: v.notes?.trim() || null,
        deliveryAddress: v.deliveryAddress?.trim() || null,
        status: v.status,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.created.emit();
          this.onVisibilityChange(false);
          void this.router.navigate(['/erp/inventory-transactions/delivery-notes', res.id, 'edit']);
        },
        error: (e) => {
          this.error.set(apiErrorMessage(e));
          this.saving.set(false);
        },
      });
  }
}
