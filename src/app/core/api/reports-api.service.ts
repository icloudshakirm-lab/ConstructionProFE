import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  BalanceSheetReportDto,
  BatchDTO,
  ChildTransactionDTO,
  ItemClosingBalanceDto,
  ItemDTO,
  LedgerClosingBalanceDto,
  PagedResponse,
  ProfitAndLossReportDto,
  TransactionDTO,
  TrialBalanceReportDto,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getBatchesByItem(itemId: number): Observable<BatchDTO[]> {
    return this.http.get<BatchDTO[]>(`${this.baseUrl}/reports/stock/batches-by-item/${itemId}`);
  }

  getItemsByGroup(groupId: number): Observable<ItemDTO[]> {
    return this.http.get<ItemDTO[]>(`${this.baseUrl}/reports/stock/items-by-group/${groupId}`);
  }

  /**
   * `GET /reports/stock/items-closing-balance?toDate=` — `toDate` is required (OpenAPI `date-time`).
   */
  getItemsClosingBalance(toDateIso: string): Observable<ItemClosingBalanceDto[]> {
    const params = new HttpParams().set('toDate', toDateIso);
    return this.http.get<ItemClosingBalanceDto[]>(`${this.baseUrl}/reports/stock/items-closing-balance`, {
      params,
    });
  }

  /**
   * `GET /reports/ledgers/closing-balance?toDate=` — `toDate` is required (OpenAPI `date-time`).
   */
  getLedgersClosingBalance(toDateIso: string): Observable<LedgerClosingBalanceDto[]> {
    const params = new HttpParams().set('toDate', toDateIso);
    return this.http.get<LedgerClosingBalanceDto[]>(`${this.baseUrl}/reports/ledgers/closing-balance`, {
      params,
    });
  }

  /** `GET /reports/financial/trial-balance?fromDate=&toDate=` */
  getTrialBalance(fromDateIso: string, toDateIso: string): Observable<TrialBalanceReportDto> {
    const params = new HttpParams().set('fromDate', fromDateIso).set('toDate', toDateIso);
    return this.http.get<TrialBalanceReportDto>(`${this.baseUrl}/reports/financial/trial-balance`, {
      params,
    });
  }

  /** `GET /reports/financial/profit-and-loss?fromDate=&toDate=` */
  getProfitAndLoss(fromDateIso: string, toDateIso: string): Observable<ProfitAndLossReportDto> {
    const params = new HttpParams().set('fromDate', fromDateIso).set('toDate', toDateIso);
    return this.http.get<ProfitAndLossReportDto>(`${this.baseUrl}/reports/financial/profit-and-loss`, {
      params,
    });
  }

  /** `GET /reports/financial/balance-sheet?fromDate=&toDate=` */
  getBalanceSheet(fromDateIso: string, toDateIso: string): Observable<BalanceSheetReportDto> {
    const params = new HttpParams().set('fromDate', fromDateIso).set('toDate', toDateIso);
    return this.http.get<BalanceSheetReportDto>(`${this.baseUrl}/reports/financial/balance-sheet`, {
      params,
    });
  }

  getLedgerTransactions(
    ledgerId: number,
    page = 1,
    perPage = 10,
  ): Observable<PagedResponse<ChildTransactionDTO>> {
    const params = new HttpParams().set('page', page).set('perPage', perPage);
    return this.http.get<PagedResponse<ChildTransactionDTO>>(
      `${this.baseUrl}/reports/ledgers/${ledgerId}/transactions`,
      { params },
    );
  }

  getLedgerGroupedTransactions(
    ledgerId: number,
    page = 1,
    perPage = 10,
  ): Observable<PagedResponse<TransactionDTO>> {
    const params = new HttpParams().set('page', page).set('perPage', perPage);
    return this.http.get<PagedResponse<TransactionDTO>>(
      `${this.baseUrl}/reports/ledgers/${ledgerId}/GroupedTransactions`,
      { params },
    );
  }

  getDailyPOSVouchers(
    date?: string,
    sortBy?: string,
    isDescending?: boolean,
  ): Observable<TransactionDTO[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (isDescending !== undefined) params = params.set('isDescending', isDescending);
    return this.http.get<TransactionDTO[]>(`${this.baseUrl}/reports/daily/pos`, { params });
  }

  getDailySalesVouchers(
    date?: string,
    sortBy?: string,
    isDescending?: boolean,
  ): Observable<TransactionDTO[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (isDescending !== undefined) params = params.set('isDescending', isDescending);
    return this.http.get<TransactionDTO[]>(`${this.baseUrl}/reports/daily/sales`, { params });
  }
}
