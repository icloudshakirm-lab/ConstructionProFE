import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { CurrenciesApiService } from '../../../../core/api/currencies-api.service';
import { CurrencyExchangeRatesApiService } from '../../../../core/api/currency-exchange-rates-api.service';
import type { CurrencyDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-currency-exchange-rate-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, Select],
  templateUrl: './currency-exchange-rate-form-dialog.component.html',
  styleUrl: './currency-exchange-rate-form-dialog.component.css',
})
export class CurrencyExchangeRateFormDialogComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CurrencyExchangeRatesApiService);
  private readonly currenciesApi = inject(CurrenciesApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  readonly currencyOptions = signal<{ label: string; value: number }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fromCurrencyId: [null as number | null, Validators.required],
    toCurrencyId: [null as number | null, Validators.required],
    rate: [null as number | null, Validators.required],
    effectiveDate: [''],
  });

  ngOnInit(): void {
    this.currenciesApi.list().subscribe({
      next: (rows: CurrencyDTO[]) => {
        this.currencyOptions.set(rows.map((c) => ({ label: `${c.code} — ${c.name}`, value: c.id })));
      },
      error: () => this.currencyOptions.set([]),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.prepareOpen();
    }
  }

  private prepareOpen(): void {
    this.error.set(null);
    this.saving.set(false);
    this.form.reset({
      fromCurrencyId: null,
      toCurrencyId: null,
      rate: null,
      effectiveDate: '',
    });
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
    if (!open) {
      this.error.set(null);
    }
  }

  cancel(): void {
    this.onVisibilityChange(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.fromCurrencyId === v.toCurrencyId) {
      this.error.set('From and to currency must differ.');
      return;
    }
    const rateNum = Number(v.rate);
    if (Number.isNaN(rateNum)) {
      this.error.set('Rate must be a number.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    const eff = v.effectiveDate?.trim();
    const body = {
      fromCurrencyId: v.fromCurrencyId!,
      toCurrencyId: v.toCurrencyId!,
      rate: rateNum,
      effectiveDate: eff ? new Date(eff).toISOString() : null,
    };

    this.api.create(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
        this.onVisibilityChange(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.saving.set(false);
      },
    });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
