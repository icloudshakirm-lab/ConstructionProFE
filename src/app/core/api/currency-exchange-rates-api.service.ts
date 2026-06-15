import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateCurrencyExchangeRateRequest,
  CreateCurrencyExchangeRateResponse,
  CurrencyExchangeRateDTO,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class CurrencyExchangeRatesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<CurrencyExchangeRateDTO[]> {
    return this.http.get<CurrencyExchangeRateDTO[]>(`${this.baseUrl}/currencyexchangerates`);
  }

  getById(id: number): Observable<CurrencyExchangeRateDTO> {
    return this.http.get<CurrencyExchangeRateDTO>(`${this.baseUrl}/currencyexchangerates/${id}`);
  }

  create(body: CreateCurrencyExchangeRateRequest): Observable<CreateCurrencyExchangeRateResponse> {
    return this.http.post<CreateCurrencyExchangeRateResponse>(
      `${this.baseUrl}/currencyexchangerates`,
      body,
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/currencyexchangerates/${id}`);
  }
}
