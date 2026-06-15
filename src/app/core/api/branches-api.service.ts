import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  BranchDTO,
  CreateBranchRequest,
  UpdateBranchRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class BranchesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<BranchDTO[]> {
    return this.http.get<BranchDTO[]>(`${this.baseUrl}/branches`);
  }

  getById(id: number): Observable<BranchDTO> {
    return this.http.get<BranchDTO>(`${this.baseUrl}/branches/${id}`);
  }

  create(body: CreateBranchRequest): Observable<BranchDTO> {
    return this.http.post<BranchDTO>(`${this.baseUrl}/branches`, body);
  }

  update(id: number, body: UpdateBranchRequest): Observable<BranchDTO> {
    return this.http.put<BranchDTO>(`${this.baseUrl}/branches/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/branches/${id}`);
  }
}
