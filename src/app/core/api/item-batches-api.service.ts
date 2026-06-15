import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { BatchDTO, CreateBatchRequest, CreateBatchResponse } from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class ItemBatchesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<BatchDTO[]> {
    return this.http.get<BatchDTO[]>(`${this.baseUrl}/item-batches`);
  }

  getById(id: number): Observable<BatchDTO> {
    return this.http.get<BatchDTO>(`${this.baseUrl}/item-batches/${id}`);
  }

  create(body: CreateBatchRequest): Observable<CreateBatchResponse> {
    return this.http.post<CreateBatchResponse>(`${this.baseUrl}/item-batches`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/item-batches/${id}`);
  }
}
