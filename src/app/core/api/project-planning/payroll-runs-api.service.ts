import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  CreatePayrollRunsRequest,
  CreatePayrollRunsResponse,
  ProjectPlanningPayrollRunsDto,
  UpdatePayrollRunsRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class PayrollRunsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/payroll-runs`;

  list(): Observable<ProjectPlanningPayrollRunsDto[]> {
    return this.http.get<ProjectPlanningPayrollRunsDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningPayrollRunsDto> {
    return this.http.get<ProjectPlanningPayrollRunsDto>(`${this.base}/${id}`);
  }

  create(body: CreatePayrollRunsRequest): Observable<CreatePayrollRunsResponse> {
    return this.http.post<CreatePayrollRunsResponse>(this.base, body);
  }

  update(id: string, body: UpdatePayrollRunsRequest): Observable<ProjectPlanningPayrollRunsDto> {
    return this.http.put<ProjectPlanningPayrollRunsDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
