import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { TransactionsApiService } from '../../../../core/api/transactions-api.service';
import type { TransactionDTO } from '../../../../core/api/erp-api.models';
import { TransactionFormDialogComponent } from '../components/transaction-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-transaction-list-page',
  imports: [CommonModule, RouterLink, Button, TableModule, Tag, TransactionFormDialogComponent],
  templateUrl: './transaction-list-page.component.html',
  styleUrl: './transaction-list-page.component.css',
})
export class TransactionListPageComponent implements OnInit {
  private readonly api = inject(TransactionsApiService);

  readonly rows = signal<TransactionDTO[]>([]);
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

  getEditRoute(row: TransactionDTO): (string | number)[] {
    switch (row.type) {
      case 'Sales': return ['/erp/invoices/sales', row.id];
      case 'ConstructionSales': return ['/erp/invoices/construction', row.id];
      case 'Purchase': return ['/erp/invoices/purchase', row.id];
      case 'Payment': return ['/erp/vouchers/payment', row.id];
      case 'Receipt': return ['/erp/vouchers/receipt', row.id];
      case 'POS': return ['/erp/pos', row.id];
      default: return ['/erp/transactions', row.id];
    }
  }
}
