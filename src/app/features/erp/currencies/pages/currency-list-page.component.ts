import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrenciesApiService } from '../../../../core/api/currencies-api.service';
import type { CurrencyDTO } from '../../../../core/api/erp-api.models';
import { CurrencyFormDialogComponent } from '../components/currency-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-currency-list-page',
  imports: [CommonModule, RouterLink, CurrencyFormDialogComponent],
  templateUrl: './currency-list-page.component.html',
  styleUrl: './currency-list-page.component.css',
})
export class CurrencyListPageComponent implements OnInit {
  private readonly api = inject(CurrenciesApiService);

  readonly rows = signal<CurrencyDTO[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly formVisible = signal(false);

  openNew(): void {
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
