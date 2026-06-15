import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateBulkPriceListRequest,
  CreatePriceListRequest,
  PriceListDTO,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class PriceListsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<PriceListDTO[]> {
    return this.http.get<PriceListDTO[]>(`${this.baseUrl}/pricelists`);
  }

  getById(id: number): Observable<PriceListDTO> {
    return this.http.get<PriceListDTO>(`${this.baseUrl}/pricelists/${id}`);
  }

  create(request: CreatePriceListRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/pricelists`, request);
  }

  createBulk(request: CreateBulkPriceListRequest): Observable<{ totalInserted?: number }> {
    return this.http.post<{ totalInserted?: number }>(`${this.baseUrl}/pricelists/bulk`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pricelists/${id}`);
  }
}
