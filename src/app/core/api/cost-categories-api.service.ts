import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CostCategoryDTO,
  CreateCostCategoryRequest,
  CreateCostCategoryResponse,
  UpdateCostCategoryRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class CostCategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<CostCategoryDTO[]> {
    return this.http.get<CostCategoryDTO[]>(`${this.baseUrl}/costcategories`);
  }

  getById(id: number): Observable<CostCategoryDTO> {
    return this.http.get<CostCategoryDTO>(`${this.baseUrl}/costcategories/${id}`);
  }

  create(body: CreateCostCategoryRequest): Observable<CreateCostCategoryResponse> {
    return this.http.post<CreateCostCategoryResponse>(`${this.baseUrl}/costcategories`, body);
  }

  update(id: number, body: UpdateCostCategoryRequest): Observable<CostCategoryDTO> {
    return this.http.put<CostCategoryDTO>(`${this.baseUrl}/costcategories/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/costcategories/${id}`);
  }
}
