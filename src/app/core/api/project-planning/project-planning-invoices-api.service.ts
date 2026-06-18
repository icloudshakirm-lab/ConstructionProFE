import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  CreateInvoicesRequest,
  CreateInvoicesResponse,
  ProjectPlanningInvoicesDto,
  UpdateInvoicesRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class ProjectPlanningInvoicesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/project-planning-invoices`;

  list(): Observable<ProjectPlanningInvoicesDto[]> {
    return this.http.get<ProjectPlanningInvoicesDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningInvoicesDto> {
    return this.http.get<ProjectPlanningInvoicesDto>(`${this.base}/${id}`);
  }

  create(body: CreateInvoicesRequest): Observable<CreateInvoicesResponse> {
    return this.http.post<CreateInvoicesResponse>(this.base, body);
  }

  update(id: string, body: UpdateInvoicesRequest): Observable<ProjectPlanningInvoicesDto> {
    return this.http.put<ProjectPlanningInvoicesDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
