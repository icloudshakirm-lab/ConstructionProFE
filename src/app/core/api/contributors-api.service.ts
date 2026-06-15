import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  ContributorListResponse,
  ContributorRecord,
  CreateContributorRequest,
  CreateContributorResponse,
  UpdateContributorRequest,
  UpdateContributorResponse,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class ContributorsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(page: number, perPage: number): Observable<ContributorListResponse> {
    const params = new HttpParams().set('page', String(page)).set('per_page', String(perPage));
    return this.http.get<ContributorListResponse>(`${this.baseUrl}/Contributors`, { params });
  }

  getById(contributorId: number): Observable<ContributorRecord> {
    return this.http.get<ContributorRecord>(`${this.baseUrl}/Contributors/${contributorId}`);
  }

  create(body: CreateContributorRequest): Observable<CreateContributorResponse> {
    return this.http.post<CreateContributorResponse>(`${this.baseUrl}/Contributors`, body);
  }

  update(contributorId: number, body: UpdateContributorRequest): Observable<UpdateContributorResponse> {
    return this.http.put<UpdateContributorResponse>(
      `${this.baseUrl}/Contributors/${contributorId}`,
      body,
    );
  }

  delete(contributorId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Contributors/${contributorId}`);
  }
}
