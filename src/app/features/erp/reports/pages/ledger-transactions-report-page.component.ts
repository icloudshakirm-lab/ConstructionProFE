import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal, computed, viewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, Observable } from 'rxjs';
import { ReportsApiService } from '../../../../core/api/reports-api.service';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import type { ChildTransactionDTO, LookupDTO, TransactionDTO, PagedResponse } from '../../../../core/api/erp-api.models';
import { TransactionViewDialogComponent } from '../../transactions/components/transaction-view-dialog.component';

@Component({
  standalone: true,
  imports: [DecimalPipe, DatePipe, ReactiveFormsModule, Select, TransactionViewDialogComponent, Paginator],
  template: `
    <div class="mx-auto max-w-5xl space-y-4">
      <header class="space-y-1">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-50">Ledger transactions</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Search transactions for a specific ledger.</p>
      </header>

      <form class="flex flex-wrap items-end gap-3" [formGroup]="form" (ngSubmit)="load(1)">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Ledger Account</label>
          <p-select
            #selectInput
            formControlName="ledgerId"
            [options]="ledgerOptions()"
            optionLabel="label"
            optionValue="value"
            placeholder="Search Ledger..."
            [filter]="true"
            filterBy="label"
            (onFilter)="onLedgerFilter($event)"
            appendTo="body"
            styleClass="w-72"
            (onChange)="load(1)"
            (keydown.enter)="load(1)"
          />
        </div>
        <button
          type="submit"
          class="rounded-lg bg-[var(--p-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--p-primary-contrast-color)] shadow-sm hover:opacity-95 disabled:opacity-60"
          [disabled]="loading()"
        >
          {{ loading() ? 'Loading...' : 'Run Report' }}
        </button>
        @if (error()) {
          <span class="text-sm text-rose-700 dark:text-rose-300">{{ error() }}</span>
        }
      </form>

      <div class="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          (click)="onTabChange('detailed')"
          [class.border-b-2]="activeTab() === 'detailed'"
          [class.border-[var(--p-primary-color)]]="activeTab() === 'detailed'"
          [class.text-[var(--p-primary-color)]]="activeTab() === 'detailed'"
          class="px-4 py-2 text-sm font-medium transition-colors hover:text-[var(--p-primary-color)]"
        >
          Detailed
        </button>
        <button 
          (click)="onTabChange('condensed')"
          [class.border-b-2]="activeTab() === 'condensed'"
          [class.border-[var(--p-primary-color)]]="activeTab() === 'condensed'"
          [class.text-[var(--p-primary-color)]]="activeTab() === 'condensed'"
          class="px-4 py-2 text-sm font-medium transition-colors hover:text-[var(--p-primary-color)]"
        >
          Condensed
        </button>
      </div>
      
      <!-- Balances Summary -->
      @if (!loading() && (rows().length > 0 || groupedRows().length > 0)) {
        <div class="grid grid-cols-2 gap-4 rounded-xl bg-slate-50/50 p-4 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800">
          <div class="space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Opening Balance</span>
            <div class="flex items-baseline gap-2">
              <span class="text-xl font-black text-slate-900 dark:text-slate-100">{{ openingBalance() | number:'1.2-2' }}</span>
              <span class="text-xs font-bold text-slate-500">{{ openingBalanceNature() }}</span>
            </div>
          </div>
          <div class="space-y-1 text-right">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Closing Balance</span>
            <div class="flex items-baseline justify-end gap-2">
              <span class="text-xl font-black text-slate-900 dark:text-slate-100">{{ closingBalance() | number:'1.2-2' }}</span>
              <span class="text-xs font-bold text-slate-500">{{ closingBalanceNature() }}</span>
            </div>
          </div>
        </div>
      }

      @if (activeTab() === 'condensed') {
        <div class="space-y-6">
          @if (loading()) {
            <div class="py-20 text-center text-slate-500">
               <i class="pi pi-spin pi-spinner text-2xl mb-2"></i>
               <p>Fetching transactions...</p>
            </div>
          } @else if (groupedRows().length === 0) {
            <div class="py-20 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl">
               No transactions found for the selected ledger.
            </div>
          } @else {
            @for (tx of groupedRows(); track tx.id) {
              <div class="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
                <!-- Header -->
                <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--p-primary-color)] shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <i class="pi" [class]="tx.type === 'Sales' ? 'pi-shopping-cart' : tx.type === 'Purchase' ? 'pi-box' : 'pi-wallet'"></i>
                    </div>
                    <div>
                      <h3 class="font-bold text-slate-900 dark:text-slate-100">{{ tx.voucherNumber }}</h3>
                      <p class="text-xs text-slate-500">{{ tx.date | date:'medium' }} • {{ tx.type }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-black text-slate-900 dark:text-slate-100">{{ tx.totalAmount | number:'1.2-2' }}</div>
                    <span 
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                      [class]="tx.status === 'Posted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'"
                    >
                      {{ tx.status }}
                    </span>
                  </div>
                </div>
                
                <!-- Description -->
                @if (tx.description) {
                  <div class="px-4 py-2 text-xs italic text-slate-500 border-b border-slate-50 dark:border-slate-800/50">
                    {{ tx.description }}
                  </div>
                }

                <!-- Entries Table -->
                <div class="overflow-hidden">
                  <table class="cp-data-grid__table">
                    <thead>
                      <tr class="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/20 dark:bg-slate-800/20">
                        <th>Ledger Account</th>
                        <th>Debit</th>
                        <th>Credit</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
                      @for (ct of tx.childTransactions; track ct.id) {
                        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td class="px-4 py-3">
                            <div class="font-medium text-slate-700 dark:text-slate-300">{{ ct.ledgerName }}</div>
                            <div class="text-[10px] text-slate-400 truncate max-w-md">{{ ct.description }}</div>
                          </td>
                          <td class="px-4 py-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                            {{ ct.ledgerEntryType === 'Debit' ? (ct.ledgerAmount | number:'1.2-2') : '' }}
                          </td>
                          <td class="px-4 py-3 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                            {{ ct.ledgerEntryType === 'Credit' ? (ct.ledgerAmount | number:'1.2-2') : '' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                
                <!-- Action Footer -->
                <div class="flex justify-end border-t border-slate-50 bg-slate-50/20 p-2 dark:border-slate-800 dark:bg-slate-800/20">
                  <button
                    (click)="editTransaction(tx)"
                    class="flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-bold text-slate-500 hover:bg-white hover:text-[var(--p-primary-color)] hover:shadow-sm dark:hover:bg-slate-800"
                  >
                    <i class="pi pi-pencil"></i> EDIT
                  </button>
                  <button
                    (click)="viewTransaction(tx)"
                    class="flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-bold text-slate-500 hover:bg-white hover:text-[var(--p-primary-color)] hover:shadow-sm dark:hover:bg-slate-800"
                  >
                    <i class="pi pi-eye"></i> VIEW FULL DETAILS
                  </button>
                </div>
              </div>
            }
          }
        </div>
      } @else {
        <div class="overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <table class="cp-data-grid__table">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
                <th>Description</th>
                <th>Against Ledger</th>
                <th>Reference</th>
                <th>Debit</th>
                <th>Credit</th>
                <th></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="cp-data-grid__empty">
                     <i class="pi pi-spin pi-spinner mr-2"></i> Fetching transactions...
                  </td>
                </tr>
              } @else if (rows().length === 0) {
                <tr>
                  <td colspan="6" class="cp-data-grid__empty">
                    No transactions found for the selected ledger.
                  </td>
                </tr>
              } @else {
                @for (r of rows(); track r.id) {
                  <tr class="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{{ r.description }}</td>
                    <td class="px-4 py-3 text-slate-600 dark:text-slate-400">{{ r.againstLedger || '-' }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{{ r.reference || '-' }}</td>
                    <td class="px-4 py-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {{ r.ledgerEntryType === 'Debit' ? (r.ledgerAmount | number: '1.2-2') : '' }}
                    </td>
                    <td class="px-4 py-3 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                      {{ r.ledgerEntryType === 'Credit' ? (r.ledgerAmount | number: '1.2-2') : '' }}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <!-- <button
                        type="button"
                        class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[var(--p-primary-color)] dark:hover:bg-slate-800"
                        (click)="editTransaction(r)"
                        title="Edit Transaction"
                      >
                        <i class="pi pi-pencil"></i>
                      </button> -->
                      <button
                        type="button"
                        class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[var(--p-primary-color)] dark:hover:bg-slate-800"
                        (click)="viewTransaction(r)"
                        title="View Transaction"
                      >
                        <i class="pi pi-eye"></i>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }

      @if (!loading() && totalCount() > 0) {
        <div class="flex justify-center pt-4">
          <p-paginator
            [first]="(page() - 1) * perPage()"
            [rows]="perPage()"
            [totalRecords]="totalCount()"
            [rowsPerPageOptions]="[5, 10, 20, 50]"
            (onPageChange)="onPageChange($event)"
            styleClass="bg-transparent border-none"
          />
        </div>
      }

      <app-transaction-view-dialog
        [visible]="viewDialogVisible()"
        (visibleChange)="viewDialogVisible.set($event)"
        [transactionId]="selectedTransactionId()"
      ></app-transaction-view-dialog>
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
  readonly isBalanceDr = signal(false);

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
          this.lookups.listLedgers(q).pipe(
            catchError(() => of([] as LookupDTO[])),
          ),
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((rows) => {
        this.ledgerOptions.set(rows.map((l) => ({ label: l.name, value: l.id })));
      });

    this.ledgerSearch$.next('');
  }

  onLedgerFilter(e: any): void {
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

  viewTransaction(row: any): void {
    const id = row.parentTransactionId || row.id;
    if (!id) return;
    this.selectedTransactionId.set(id);
    this.viewDialogVisible.set(true);
  }

  editTransaction(row: any): void {
    const id = row.parentTransactionId || row.id;
    const type = row.type;
    if (!id || !type) return;

    switch (type) {
      case 'POS':
        this.router.navigate(['/app/pos', id]);
        break;
      case 'Sales':
        this.router.navigate(['/app/invoices/sales', id]);
        break;
      case 'Purchase':
        this.router.navigate(['/app/invoices/purchase', id]);
        break;
      case 'Payment':
        this.router.navigate(['/app/vouchers/payment', id]);
        break;
      case 'Receipt':
        this.router.navigate(['/app/vouchers/receipt', id]);
        break;
      default:
        console.warn('Unknown transaction type for editing:', type);
        break;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.selectInput()?.focus();
    }, 50);
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
      : this.api.getLedgerTransactions(ledgerId, this.page(), this.perPage())) as Observable<PagedResponse<any>>;

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.totalCount.set(res.totalCount || 0);
          this.openingBalance.set(res.openingBalance || 0);
          this.closingBalance.set(res.closingBalance || 0);
          this.openingBalanceNature.set(res.openingBalanceNature || '');
          this.closingBalanceNature.set(res.closingBalanceNature || '');
          this.isBalanceDr.set(res.isBalanceDr ?? false);

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
