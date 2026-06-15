import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateLedgerGroupRequest,
  CreateLedgerGroupResponse,
  GroupLedgerDTO,
  UpdateGroupLedgerResponse,
  UpdateLedgerGroupRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class LedgerGroupsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<GroupLedgerDTO[]> {
    return this.http.get<GroupLedgerDTO[]>(`${this.baseUrl}/ledger-groups`);
  }

  getById(id: number): Observable<GroupLedgerDTO> {
    return this.http.get<GroupLedgerDTO>(`${this.baseUrl}/ledger-groups/${id}`);
  }

  create(body: CreateLedgerGroupRequest): Observable<CreateLedgerGroupResponse> {
    return this.http.post<CreateLedgerGroupResponse>(`${this.baseUrl}/ledger-groups`, body);
  }

  update(id: number, body: UpdateLedgerGroupRequest): Observable<UpdateGroupLedgerResponse> {
    return this.http.put<UpdateGroupLedgerResponse>(`${this.baseUrl}/ledger-groups/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/ledger-groups/${id}`);
  }
}
