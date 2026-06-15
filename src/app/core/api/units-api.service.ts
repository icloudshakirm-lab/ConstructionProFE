import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateUnitOfMeasureRequest,
  UnitOfMeasureDTO,
  UpdateUnitOfMeasureRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class UnitsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<UnitOfMeasureDTO[]> {
    return this.http.get<UnitOfMeasureDTO[]>(`${this.baseUrl}/units`);
  }

  getById(id: number): Observable<UnitOfMeasureDTO> {
    return this.http.get<UnitOfMeasureDTO>(`${this.baseUrl}/units/${id}`);
  }

  create(body: CreateUnitOfMeasureRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/units`, body);
  }

  update(id: number, body: UpdateUnitOfMeasureRequest): Observable<UnitOfMeasureDTO> {
    return this.http.put<UnitOfMeasureDTO>(`${this.baseUrl}/units/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/units/${id}`);
  }
}
