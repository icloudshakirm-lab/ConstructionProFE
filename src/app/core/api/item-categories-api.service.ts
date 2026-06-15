import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateItemCategoryRequest,
  ItemCategoryDTO,
  UpdateItemCategoryRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class ItemCategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<ItemCategoryDTO[]> {
    return this.http.get<ItemCategoryDTO[]>(`${this.baseUrl}/itemcategories`);
  }

  getById(id: number): Observable<ItemCategoryDTO> {
    return this.http.get<ItemCategoryDTO>(`${this.baseUrl}/itemcategories/${id}`);
  }

  create(request: CreateItemCategoryRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/itemcategories`, request);
  }

  update(id: number, request: UpdateItemCategoryRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/itemcategories/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/itemcategories/${id}`);
  }
}
