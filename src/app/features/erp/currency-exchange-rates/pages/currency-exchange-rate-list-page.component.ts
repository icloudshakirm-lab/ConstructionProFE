import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { CurrenciesApiService } from '../../../../core/api/currencies-api.service';
import { CurrencyExchangeRatesApiService } from '../../../../core/api/currency-exchange-rates-api.service';
import type { CurrencyDTO, CurrencyExchangeRateDTO } from '../../../../core/api/erp-api.models';
import { CurrencyExchangeRateFormDialogComponent } from '../components/currency-exchange-rate-form-dialog.component';
import { CurrencyExchangeRateViewDialogComponent } from '../components/currency-exchange-rate-view-dialog.component';

@Component({
  standalone: true,
  selector: 'app-currency-exchange-rate-list-page',
  imports: [
    CommonModule,
    DecimalPipe,
    Button,
    TableModule,
    Tag,
    CurrencyExchangeRateFormDialogComponent,
    CurrencyExchangeRateViewDialogComponent,
  ],
  templateUrl: './currency-exchange-rate-list-page.component.html',
  styleUrl: './currency-exchange-rate-list-page.component.css',
})
export class CurrencyExchangeRateListPageComponent implements OnInit {
  private readonly ratesApi = inject(CurrencyExchangeRatesApiService);
  private readonly currenciesApi = inject(CurrenciesApiService);
  readonly rows = signal<CurrencyExchangeRateDTO[]>([]);
  readonly currencyMap = signal<Map<number, string>>(new Map());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly formVisible = signal(false);
  readonly viewVisible = signal(false);
  readonly viewExchangeRateId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);

  openNew(): void {
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  openView(id: number): void {
    this.viewExchangeRateId.set(id);
    this.viewVisible.set(true);
  }

  onViewVisibleChange(v: boolean): void {
    this.viewVisible.set(v);
    if (!v) {
      this.viewExchangeRateId.set(null);
    }
  }

  onViewSaved(): void {
    this.load();
  }

  codeFor(id: number): string {
    return this.currencyMap().get(id) ?? String(id);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      rates: this.ratesApi.list(),
      currencies: this.currenciesApi.list(),
    }).subscribe({
      next: ({ rates, currencies }) => {
        this.rows.set(rates);
        this.currencyMap.set(new Map(currencies.map((c: CurrencyDTO) => [c.id, c.code])));
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  remove(id: number): void {
    if (!confirm('Delete this exchange rate?')) {
      return;
    }
    this.deletingId.set(id);
    this.error.set(null);
    this.ratesApi.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.load();
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.deletingId.set(null);
      },
    });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
