import { CommonModule, DecimalPipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { forkJoin } from 'rxjs';
import { CurrenciesApiService } from '../../../../core/api/currencies-api.service';
import { CurrencyExchangeRatesApiService } from '../../../../core/api/currency-exchange-rates-api.service';
import type { CurrencyDTO, CurrencyExchangeRateDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-currency-exchange-rate-view-dialog',
  imports: [CommonModule, DecimalPipe, Dialog, Button],
  templateUrl: './currency-exchange-rate-view-dialog.component.html',
  styleUrl: './currency-exchange-rate-view-dialog.component.css',
})
export class CurrencyExchangeRateViewDialogComponent implements OnChanges {
  private readonly api = inject(CurrencyExchangeRatesApiService);
  private readonly currenciesApi = inject(CurrenciesApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() exchangeRateId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly row = signal<CurrencyExchangeRateDTO | null>(null);
  readonly currencyMap = signal<Map<number, string>>(new Map());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      if (changes['visible']) {
        this.reset();
      }
      return;
    }
    const id = this.exchangeRateId;
    if (id == null || Number.isNaN(id)) {
      return;
    }
    if (changes['exchangeRateId'] || changes['visible']) {
      this.fetchRow(id);
    }
  }

  codeFor(currencyId: number): string {
    return this.currencyMap().get(currencyId) ?? String(currencyId);
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
    if (!open) {
      this.reset();
    }
  }

  remove(): void {
    const id = this.row()?.id;
    if (id == null || !confirm('Delete this exchange rate?')) {
      return;
    }
    this.deleting.set(true);
    this.api.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.saved.emit();
        this.onVisibilityChange(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.deleting.set(false);
      },
    });
  }

  private fetchRow(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.row.set(null);
    forkJoin({
      rate: this.api.getById(id),
      currencies: this.currenciesApi.list(),
    }).subscribe({
      next: ({ rate, currencies }) => {
        this.row.set(rate);
        this.currencyMap.set(new Map(currencies.map((c: CurrencyDTO) => [c.id, c.code])));
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  private reset(): void {
    this.row.set(null);
    this.currencyMap.set(new Map());
    this.loading.set(false);
    this.error.set(null);
    this.deleting.set(false);
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
