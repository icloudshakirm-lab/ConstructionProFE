import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateTillRequest,
  TillDTO,
  UpdateTillRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class TillsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<TillDTO[]> {
    return this.http.get<TillDTO[]>(`${this.baseUrl}/tills`);
  }

  getById(id: number): Observable<TillDTO> {
    return this.http.get<TillDTO>(`${this.baseUrl}/tills/${id}`);
  }

  create(body: CreateTillRequest): Observable<TillDTO> {
    return this.http.post<TillDTO>(`${this.baseUrl}/tills`, body);
  }

  update(id: number, body: UpdateTillRequest): Observable<TillDTO> {
    return this.http.put<TillDTO>(`${this.baseUrl}/tills/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tills/${id}`);
  }
}
