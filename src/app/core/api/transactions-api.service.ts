import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateManufacturingTransactionRequest,
  CreateManufacturingTransactionResponse,
  CreateTransactionRequest,
  CreateTransactionResponse,
  UpdateTransactionRequest,
  UpdateTransactionResponse,
  TransactionDTO,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class TransactionsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<TransactionDTO[]> {
    return this.http.get<TransactionDTO[]>(`${this.baseUrl}/transactions`);
  }

  getById(id: number): Observable<TransactionDTO> {
    return this.http.get<TransactionDTO>(`${this.baseUrl}/transactions/${id}`);
  }

  create(body: CreateTransactionRequest): Observable<CreateTransactionResponse> {
    return this.http.post<CreateTransactionResponse>(`${this.baseUrl}/transactions`, body);
  }

  update(id: number, body: UpdateTransactionRequest): Observable<UpdateTransactionResponse> {
    return this.http.put<UpdateTransactionResponse>(`${this.baseUrl}/transactions/${id}`, body);
  }

  createPos(body: CreateTransactionRequest): Observable<CreateTransactionResponse> {
    return this.http.post<CreateTransactionResponse>(`${this.baseUrl}/transactions/pos`, body);
  }

  createManufacturing(
    body: CreateManufacturingTransactionRequest,
  ): Observable<CreateManufacturingTransactionResponse> {
    return this.http.post<CreateManufacturingTransactionResponse>(
      `${this.baseUrl}/transactions/manufacturing`,
      body,
    );
  }

  getNextVoucherNumber(type: string): Observable<{ voucherNumber: string }> {
    return this.http.get<{ voucherNumber: string }>(`${this.baseUrl}/transactions/next-voucher-number/${type}`);
  }
}
