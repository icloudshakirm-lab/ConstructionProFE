import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CompanyDTO,
  CreateCompanyRequest,
  CreateCompanyResponse,
  UpdateCompanyRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class CompaniesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<CompanyDTO[]> {
    return this.http.get<CompanyDTO[]>(`${this.baseUrl}/companies`);
  }

  getById(id: number): Observable<CompanyDTO> {
    return this.http.get<CompanyDTO>(`${this.baseUrl}/companies/${id}`);
  }

  create(body: CreateCompanyRequest): Observable<CreateCompanyResponse> {
    return this.http.post<CreateCompanyResponse>(`${this.baseUrl}/companies`, body);
  }

  update(id: number, body: UpdateCompanyRequest): Observable<CompanyDTO> {
    return this.http.put<CompanyDTO>(`${this.baseUrl}/companies/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/companies/${id}`);
  }
}
