import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TransactionsApiService } from '../../../../core/api/transactions-api.service';
import type { TransactionDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-transaction-detail-page',
  imports: [CommonModule, RouterLink, Button, TableModule],
  templateUrl: './transaction-detail-page.component.html',
  styleUrl: './transaction-detail-page.component.css',
})
export class TransactionDetailPageComponent implements OnInit {
  private readonly api = inject(TransactionsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly row = signal<TransactionDTO | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(id)) {
      this.error.set('Invalid id');
      this.loading.set(false);
      return;
    }
    this.api.getById(id).subscribe({
      next: (r) => {
        this.row.set(r);
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
