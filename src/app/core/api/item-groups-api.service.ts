import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateItemGroupRequest,
  CreateItemGroupResponse,
  ItemGroupDTO,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class ItemGroupsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<ItemGroupDTO[]> {
    return this.http.get<ItemGroupDTO[]>(`${this.baseUrl}/item-groups`);
  }

  getById(id: number): Observable<ItemGroupDTO> {
    return this.http.get<ItemGroupDTO>(`${this.baseUrl}/item-groups/${id}`);
  }

  create(body: CreateItemGroupRequest): Observable<CreateItemGroupResponse> {
    return this.http.post<CreateItemGroupResponse>(`${this.baseUrl}/item-groups`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/item-groups/${id}`);
  }
}
