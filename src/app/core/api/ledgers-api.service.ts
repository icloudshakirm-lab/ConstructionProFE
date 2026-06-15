import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateLedgerRequest,
  CreateLedgerResponse,
  LedgerDTO,
  UpdateLedgerRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class LedgersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LedgerDTO[]> {
    return this.http.get<LedgerDTO[]>(`${this.baseUrl}/ledgers`);
  }

  getById(id: number): Observable<LedgerDTO> {
    return this.http.get<LedgerDTO>(`${this.baseUrl}/ledgers/${id}`);
  }

  create(body: CreateLedgerRequest): Observable<CreateLedgerResponse> {
    return this.http.post<CreateLedgerResponse>(`${this.baseUrl}/ledgers`, body);
  }

  update(id: number, body: UpdateLedgerRequest): Observable<LedgerDTO> {
    return this.http.put<LedgerDTO>(`${this.baseUrl}/ledgers/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/ledgers/${id}`);
  }
}
