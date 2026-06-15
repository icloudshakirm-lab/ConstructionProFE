import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CostCenterDTO,
  CreateCostCenterRequest,
  CreateCostCenterResponse,
  UpdateCostCenterRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class CostCentersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<CostCenterDTO[]> {
    return this.http.get<CostCenterDTO[]>(`${this.baseUrl}/costcenters`);
  }

  getById(id: number): Observable<CostCenterDTO> {
    return this.http.get<CostCenterDTO>(`${this.baseUrl}/costcenters/${id}`);
  }

  create(body: CreateCostCenterRequest): Observable<CreateCostCenterResponse> {
    return this.http.post<CreateCostCenterResponse>(`${this.baseUrl}/costcenters`, body);
  }

  update(id: number, body: UpdateCostCenterRequest): Observable<CostCenterDTO> {
    return this.http.put<CostCenterDTO>(`${this.baseUrl}/costcenters/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/costcenters/${id}`);
  }
}
