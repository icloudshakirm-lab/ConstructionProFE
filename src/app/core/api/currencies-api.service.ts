import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateCurrencyRequest,
  CreateCurrencyResponse,
  CurrencyDTO,
  UpdateCurrencyRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class CurrenciesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<CurrencyDTO[]> {
    return this.http.get<CurrencyDTO[]>(`${this.baseUrl}/currencies`);
  }

  getById(id: number): Observable<CurrencyDTO> {
    return this.http.get<CurrencyDTO>(`${this.baseUrl}/currencies/${id}`);
  }

  create(body: CreateCurrencyRequest): Observable<CreateCurrencyResponse> {
    return this.http.post<CreateCurrencyResponse>(`${this.baseUrl}/currencies`, body);
  }

  update(id: number, body: UpdateCurrencyRequest): Observable<CurrencyDTO> {
    return this.http.put<CurrencyDTO>(`${this.baseUrl}/currencies/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/currencies/${id}`);
  }
}
