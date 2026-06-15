import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateGodownRequest,
  GodownDTO,
  UpdateGodownRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class GodownsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<GodownDTO[]> {
    return this.http.get<GodownDTO[]>(`${this.baseUrl}/godowns`);
  }

  getById(id: number): Observable<GodownDTO> {
    return this.http.get<GodownDTO>(`${this.baseUrl}/godowns/${id}`);
  }

  create(request: CreateGodownRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/godowns`, request);
  }

  update(id: number, request: UpdateGodownRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/godowns/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/godowns/${id}`);
  }
}
