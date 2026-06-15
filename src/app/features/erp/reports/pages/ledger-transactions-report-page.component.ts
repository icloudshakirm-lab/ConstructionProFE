import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal, viewChild, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, Observable } from 'rxjs';
import { ReportsApiService } from '../../../../core/api/reports-api.service';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import type { ChildTransactionDTO, LookupDTO, TransactionDTO, PagedResponse } from '../../../../core/api/erp-api.models';
import { TransactionViewDialogComponent } from '../../transactions/components/transaction-view-dialog.component';

@Component({
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    Button,
    Select,
    TableModule,
    Tag,
    TransactionViewDialogComponent,
    Paginator,
  ],
  template: `
    <div class="erp-list-page erp-list-page--full">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="Reports · Ledgers" severity="info" />
          <h1>Ledger transactions</h1>
          <p class="erp-list-page__subtitle">Search transactions for a specific ledger account.</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Back to reports" icon="pi pi-arrow-left" [text]="true" routerLink="/erp/reports" />
        </div>
      </header>

      <form class="erp-list-page__toolbar" [formGroup]="form" (ngSubmit)="load(1)">
        <div class="erp-list-page__field">
          <label for="ltr-ledger">Ledger account</label>
          <p-select
            #selectInput
            inputId="ltr-ledger"
            formControlName="ledgerId"
            [options]="ledgerOptions()"
            optionLabel="label"
            optionValue="value"
            placeholder="Search ledger…"
            [filter]="true"
            filterBy="label"
            (onFilter)="onLedgerFilter($event)"
            appendTo="body"
            styleClass="w-full"
            (onChange)="load(1)"
          />
        </div>
        <p-button type="submit" label="Run report" icon="pi pi-play" [loading]="loading()" />
        @if (totalCount() > 0) {
          <span class="erp-list-page__count">{{ totalCount() }} transaction(s)</span>
        }
      </form>

      @if (error()) {
        <p class="erp-list-page__alert">{{ error() }}</p>
      }

      <div class="erp-list-page__tabs">
        <p-button
          label="Detailed"
          [outlined]="activeTab() !== 'detailed'"
          [severity]="activeTab() === 'detailed' ? 'primary' : 'secondary'"
          size="small"
          (onClick)="onTabChange('detailed')"
        />
        <p-button
          label="Condensed"
          [outlined]="activeTab() !== 'condensed'"
          [severity]="activeTab() === 'condensed' ? 'primary' : 'secondary'"
          size="small"
          (onClick)="onTabChange('condensed')"
        />
      </div>

      @if (!loading() && (rows().length > 0 || groupedRows().length > 0)) {
        <div class="erp-list-page__summary">
          <div class="erp-list-page__summary-item">
            <span>Opening balance</span>
            <strong>{{ openingBalance() | number: '1.2-2' }}</strong>
            <em>{{ openingBalanceNature() }}</em>
          </div>
          <div class="erp-list-page__summary-item erp-list-page__summary-item--end">
            <span>Closing balance</span>
            <strong>{{ closingBalance() | number: '1.2-2' }}</strong>
            <em>{{ closingBalanceNature() }}</em>
          </div>
        </div>
      }

      @if (activeTab() === 'condensed') {
        @if (loading()) {
          <p class="erp-list-page__loading">Fetching transactions…</p>
        } @else if (groupedRows().length === 0) {
          <p class="erp-list-page__empty-panel">No transactions found for the selected ledger.</p>
        } @else {
          <div class="erp-list-page__condensed-list">
            @for (tx of groupedRows(); track tx.id) {
              <article class="erp-list-page__voucher-card">
                <div class="erp-list-page__voucher-head">
                  <div class="erp-list-page__voucher-head-main">
                    <strong class="erp-list-page__voucher-no">{{ tx.voucherNumber }}</strong>
                    <p class="erp-list-page__subtitle">{{ tx.date | date: 'medium' }} · {{ tx.type }}</p>
                  </div>
                  <div class="erp-list-page__voucher-head-total">
                    <div class="erp-list-page__num erp-list-page__voucher-amount">
                      {{ tx.totalAmount | number: '1.2-2' }}
                    </div>
                    <p-tag [value]="tx.status" [severity]="tx.status === 'Posted' ? 'success' : 'warn'" />
                  </div>
                </div>
                @if (tx.description) {
                  <p class="erp-list-page__voucher-desc">{{ tx.description }}</p>
                }
                <p-table
                  [value]="tx.childTransactions"
                  dataKey="id"
                  styleClass="cp-data-grid cp-data-grid--nested"
                  [scrollable]="false"
                >
                  <ng-template #header>
                    <tr>
                      <th>Ledger account</th>
                      <th class="erp-list-page__num">Debit</th>
                      <th class="erp-list-page__num">Credit</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-ct>
                    <tr>
                      <td>
                        <strong>{{ ct.ledgerName }}</strong>
                        @if (ct.description) {
                          <div class="erp-list-page__subtitle">{{ ct.description }}</div>
                        }
                      </td>
                      <td class="erp-list-page__num">
                        {{ ct.ledgerEntryType === 'Debit' ? (ct.ledgerAmount | number: '1.2-2') : '' }}
                      </td>
                      <td class="erp-list-page__num">
                        {{ ct.ledgerEntryType === 'Credit' ? (ct.ledgerAmount | number: '1.2-2') : '' }}
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="3" class="cp-data-grid__empty">No lines.</td>
                    </tr>
                  </ng-template>
                </p-table>
                <div class="erp-list-page__voucher-foot">
                  <p-button label="Edit" icon="pi pi-pencil" [text]="true" size="small" (onClick)="editTransaction(tx)" />
                  <p-button label="View details" icon="pi pi-eye" [text]="true" size="small" (onClick)="viewTransaction(tx)" />
                </div>
              </article>
            }
          </div>
        }
      } @else {
        @if (loading()) {
          <p class="erp-list-page__loading">Fetching transactions…</p>
        } @else {
          <p-table
            [value]="rows()"
            dataKey="id"
            styleClass="cp-data-grid"
            [scrollable]="rows().length > 0"
            scrollHeight="flex"
          >
            <ng-template #header>
              <tr>
                <th>Description</th>
                <th>Against ledger</th>
                <th>Reference</th>
                <th class="erp-list-page__num">Debit</th>
                <th class="erp-list-page__num">Credit</th>
                <th style="width: 4rem"></th>
              </tr>
            </ng-template>
            <ng-template #body let-r>
              <tr>
                <td>{{ r.description }}</td>
                <td>{{ r.againstLedger || '—' }}</td>
                <td>{{ r.reference || '—' }}</td>
                <td class="erp-list-page__num">
                  {{ r.ledgerEntryType === 'Debit' ? (r.ledgerAmount | number: '1.2-2') : '' }}
                </td>
                <td class="erp-list-page__num">
                  {{ r.ledgerEntryType === 'Credit' ? (r.ledgerAmount | number: '1.2-2') : '' }}
                </td>
                <td>
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true" title="View" (onClick)="viewTransaction(r)" />
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="6" class="cp-data-grid__empty">No transactions found for the selected ledger.</td>
              </tr>
            </ng-template>
          </p-table>
        }
      }

      @if (!loading() && totalCount() > 0) {
        <div style="display: flex; justify-content: center; padding-top: 0.5rem">
          <p-paginator
            [first]="(page() - 1) * perPage()"
            [rows]="perPage()"
            [totalRecords]="totalCount()"
            [rowsPerPageOptions]="[5, 10, 20, 50]"
            (onPageChange)="onPageChange($event)"
          />
        </div>
      }

      <app-transaction-view-dialog
        [visible]="viewDialogVisible()"
        (visibleChange)="viewDialogVisible.set($event)"
        [transactionId]="selectedTransactionId()"
      />
    </div>
  `,
})
export class LedgerTransactionsReportPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ReportsApiService);
  private readonly lookups = inject(LookupsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    ledgerId: this.fb.control<number | null>(null),
  });

  readonly selectInput = viewChild<Select>('selectInput');

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<'condensed' | 'detailed'>('detailed');
  readonly rows = signal<ChildTransactionDTO[]>([]);
  readonly groupedRows = signal<TransactionDTO[]>([]);

  readonly page = signal(1);
  readonly perPage = signal(5);
  readonly totalCount = signal(0);
  readonly openingBalance = signal(0);
  readonly closingBalance = signal(0);
  readonly openingBalanceNature = signal('');
  readonly closingBalanceNature = signal('');

  readonly ledgerOptions = signal<Array<{ label: string; value: number }>>([]);
  private readonly ledgerSearch$ = new Subject<string>();

  readonly viewDialogVisible = signal(false);
  readonly selectedTransactionId = signal<number | null>(null);

  ngOnInit(): void {
    this.ledgerSearch$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) =>
          this.lookups.listLedgers(q).pipe(catchError(() => of([] as LookupDTO[]))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((rows) => {
        this.ledgerOptions.set(rows.map((l) => ({ label: l.name, value: l.id })));
      });

    this.ledgerSearch$.next('');
  }

  onLedgerFilter(e: { filter?: string }): void {
    this.ledgerSearch$.next(e.filter || '');
  }

  onTabChange(tab: 'condensed' | 'detailed'): void {
    this.activeTab.set(tab);
    this.load(1);
  }

  onPageChange(event: PaginatorState): void {
    const newPage = (event.page ?? 0) + 1;
    this.perPage.set(event.rows ?? 10);
    this.load(newPage);
  }

  viewTransaction(row: ChildTransactionDTO | TransactionDTO): void {
    const child = row as ChildTransactionDTO;
    const id = child.parentTransactionId ?? row.id;
    if (!id) return;
    this.selectedTransactionId.set(id);
    this.viewDialogVisible.set(true);
  }

  editTransaction(row: TransactionDTO): void {
    const id = row.id;
    const type = row.type;
    if (!id || !type) return;

    switch (type) {
      case 'POS':
        void this.router.navigate(['/erp/pos', id]);
        break;
      case 'Sales':
        void this.router.navigate(['/erp/invoices/sales', id]);
        break;
      case 'Purchase':
        void this.router.navigate(['/erp/invoices/purchase', id]);
        break;
      case 'Payment':
        void this.router.navigate(['/erp/vouchers/payment', id]);
        break;
      case 'Receipt':
        void this.router.navigate(['/erp/vouchers/receipt', id]);
        break;
      default:
        break;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.selectInput()?.focus(), 50);
  }

  load(pageNumber?: number): void {
    const ledgerId = this.form.get('ledgerId')?.value;
    if (!ledgerId) {
      this.error.set('Please select a ledger account.');
      return;
    }

    if (pageNumber) {
      this.page.set(pageNumber);
    }

    this.loading.set(true);
    this.error.set(null);

    const request$ = (this.activeTab() === 'condensed'
      ? this.api.getLedgerGroupedTransactions(ledgerId, this.page(), this.perPage())
      : this.api.getLedgerTransactions(ledgerId, this.page(), this.perPage())) as Observable<PagedResponse<unknown>>;

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.totalCount.set(res.totalCount || 0);
        this.openingBalance.set(res.openingBalance || 0);
        this.closingBalance.set(res.closingBalance || 0);
        this.openingBalanceNature.set(res.openingBalanceNature || '');
        this.closingBalanceNature.set(res.closingBalanceNature || '');

        if (this.activeTab() === 'condensed') {
          const items = res.items as TransactionDTO[];
          const sorted = items.map((tx) => ({
            ...tx,
            childTransactions: [...(tx.childTransactions || [])].sort((a, b) => {
              if (a.ledgerEntryType === 'Debit' && b.ledgerEntryType !== 'Debit') return -1;
              if (a.ledgerEntryType !== 'Debit' && b.ledgerEntryType === 'Debit') return 1;
              return 0;
            }),
          }));
          this.groupedRows.set(sorted ?? []);
        } else {
          this.rows.set((res.items as ChildTransactionDTO[]) ?? []);
        }
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        const err = e as { message?: string; error?: { detail?: string } };
        this.error.set(err.error?.detail ?? err.message ?? 'Failed to load report.');
      },
    });
  }
}
