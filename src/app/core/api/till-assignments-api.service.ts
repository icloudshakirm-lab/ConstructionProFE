import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateTillAssignmentRequest,
  TillAssignmentDTO,
  UpdateTillAssignmentRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class TillAssignmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<TillAssignmentDTO[]> {
    return this.http.get<TillAssignmentDTO[]>(`${this.baseUrl}/till-assignments`);
  }

  getById(id: number): Observable<TillAssignmentDTO> {
    return this.http.get<TillAssignmentDTO>(`${this.baseUrl}/till-assignments/${id}`);
  }

  create(body: CreateTillAssignmentRequest): Observable<TillAssignmentDTO> {
    return this.http.post<TillAssignmentDTO>(`${this.baseUrl}/till-assignments`, body);
  }

  update(id: number, body: UpdateTillAssignmentRequest): Observable<TillAssignmentDTO> {
    return this.http.put<TillAssignmentDTO>(`${this.baseUrl}/till-assignments/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/till-assignments/${id}`);
  }
}
